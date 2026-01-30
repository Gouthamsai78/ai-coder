import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface AdminStats {
    totalUsers: number;
    totalProjects: number;
    totalCreditsUsed: number;
    activePromoCodes: number;
    redemptionsToday: number;
}

interface User {
    id: string;
    email: string;
    name: string | null;
    credits: number;
    last_reset_date: string | null;
    created_at: string;
}

interface PromoCode {
    id: string;
    code: string;
    credits_value: number;
    max_uses: number | null;
    current_uses: number;
    valid_until: string | null;
    is_active: boolean;
    created_at: string;
}

interface AdminDashboardProps {
    onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'promo'>('overview');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // New promo code form
    const [newCode, setNewCode] = useState('');
    const [newCredits, setNewCredits] = useState(10);
    const [newMaxUses, setNewMaxUses] = useState<number | ''>('');
    const [newExpiry, setNewExpiry] = useState('');
    const [creating, setCreating] = useState(false);

    // Add credits modal
    const [addCreditsUser, setAddCreditsUser] = useState<User | null>(null);
    const [addCreditsAmount, setAddCreditsAmount] = useState(10);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Load stats
            const [usersRes, projectsRes, creditsRes, promoRes, redemptionsRes] = await Promise.all([
                supabase.from('users').select('id', { count: 'exact' }),
                supabase.from('ai_coder_projects').select('id', { count: 'exact' }),
                supabase.from('user_credits').select('credits'),
                supabase.from('promo_codes').select('*').eq('is_active', true),
                supabase.from('promo_code_redemptions').select('id').gte('redeemed_at', new Date().toISOString().split('T')[0])
            ]);

            const totalCreditsUsed = creditsRes.data?.reduce((sum, u) => sum + (5 - (u.credits || 0)), 0) || 0;

            setStats({
                totalUsers: usersRes.count || 0,
                totalProjects: projectsRes.count || 0,
                totalCreditsUsed: Math.max(0, totalCreditsUsed),
                activePromoCodes: promoRes.data?.length || 0,
                redemptionsToday: redemptionsRes.data?.length || 0
            });

            // Load users with credits
            const { data: usersData } = await supabase
                .from('users')
                .select(`
                    id,
                    email,
                    name,
                    created_at
                `)
                .order('created_at', { ascending: false });

            if (usersData) {
                // Get credits for each user
                const usersWithCredits = await Promise.all(
                    usersData.map(async (user) => {
                        const { data: creditData } = await supabase
                            .from('user_credits')
                            .select('credits, last_reset_date')
                            .eq('user_id', user.id)
                            .single();
                        return {
                            ...user,
                            credits: creditData?.credits ?? 5,
                            last_reset_date: creditData?.last_reset_date || null
                        };
                    })
                );
                setUsers(usersWithCredits);
            }

            // Load promo codes
            const { data: promoData } = await supabase
                .from('promo_codes')
                .select('*')
                .order('created_at', { ascending: false });

            if (promoData) {
                setPromoCodes(promoData);
            }

        } catch (err) {
            console.error('Failed to load admin data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const createPromoCode = async () => {
        if (!newCode.trim()) return;
        setCreating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('promo_codes').insert({
                code: newCode.toUpperCase().trim(),
                credits_value: newCredits,
                max_uses: newMaxUses || null,
                valid_until: newExpiry || null,
                created_by: user?.id
            });

            if (error) throw error;

            setNewCode('');
            setNewCredits(10);
            setNewMaxUses('');
            setNewExpiry('');
            loadDashboardData();
        } catch (err) {
            console.error('Failed to create promo code:', err);
            setError('Failed to create promo code');
        } finally {
            setCreating(false);
        }
    };

    const togglePromoCode = async (id: string, isActive: boolean) => {
        try {
            await supabase.from('promo_codes').update({ is_active: !isActive }).eq('id', id);
            loadDashboardData();
        } catch (err) {
            console.error('Failed to toggle promo code:', err);
        }
    };

    const deletePromoCode = async (id: string) => {
        if (!confirm('Are you sure you want to delete this promo code?')) return;
        try {
            await supabase.from('promo_codes').delete().eq('id', id);
            loadDashboardData();
        } catch (err) {
            console.error('Failed to delete promo code:', err);
        }
    };

    const addCreditsToUser = async () => {
        if (!addCreditsUser) return;
        try {
            // Upsert credits
            await supabase.from('user_credits').upsert({
                user_id: addCreditsUser.id,
                credits: addCreditsUser.credits + addCreditsAmount,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

            setAddCreditsUser(null);
            loadDashboardData();
        } catch (err) {
            console.error('Failed to add credits:', err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-5xl max-h-[90vh] bg-[hsl(var(--card))] rounded-xl shadow-2xl border border-[hsl(var(--border))] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            <span className="text-white text-lg">🛡️</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Admin Dashboard</h2>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Manage users, credits & promo codes</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
                    {['overview', 'users', 'promo'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as 'overview' | 'users' | 'promo')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
                                }`}
                        >
                            {tab === 'overview' && '📊 Overview'}
                            {tab === 'users' && '👥 Users'}
                            {tab === 'promo' && '🎁 Promo Codes'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">{error}</div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && stats && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    <StatCard icon="👥" label="Total Users" value={stats.totalUsers} />
                                    <StatCard icon="💻" label="Projects" value={stats.totalProjects} />
                                    <StatCard icon="⚡" label="Credits Used" value={stats.totalCreditsUsed} />
                                    <StatCard icon="🎟️" label="Active Codes" value={stats.activePromoCodes} />
                                    <StatCard icon="🎉" label="Redeemed Today" value={stats.redemptionsToday} />
                                </div>
                            )}

                            {/* Users Tab */}
                            {activeTab === 'users' && (
                                <div className="space-y-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="text-left text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                                                <tr>
                                                    <th className="pb-2 font-medium">User</th>
                                                    <th className="pb-2 font-medium">Credits</th>
                                                    <th className="pb-2 font-medium">Last Reset</th>
                                                    <th className="pb-2 font-medium">Joined</th>
                                                    <th className="pb-2 font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[hsl(var(--border))]">
                                                {users.map((user) => (
                                                    <tr key={user.id} className="hover:bg-[hsl(var(--muted))]/30">
                                                        <td className="py-3">
                                                            <div>
                                                                <p className="font-medium text-[hsl(var(--foreground))]">{user.name || 'No name'}</p>
                                                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.credits <= 0 ? 'bg-red-100 text-red-700' :
                                                                user.credits <= 2 ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-green-100 text-green-700'
                                                                }`}>
                                                                {user.credits} credits
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-[hsl(var(--muted-foreground))]">
                                                            {user.last_reset_date || 'Never'}
                                                        </td>
                                                        <td className="py-3 text-[hsl(var(--muted-foreground))]">
                                                            {new Date(user.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-3">
                                                            <button
                                                                onClick={() => setAddCreditsUser(user)}
                                                                className="px-2 py-1 text-xs bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded hover:opacity-90 transition-opacity"
                                                            >
                                                                + Add Credits
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Promo Codes Tab */}
                            {activeTab === 'promo' && (
                                <div className="space-y-6">
                                    {/* Create New Code */}
                                    <div className="p-4 bg-[hsl(var(--muted))]/30 rounded-lg border border-[hsl(var(--border))]">
                                        <h3 className="text-sm font-semibold mb-3 text-[hsl(var(--foreground))]">Create New Promo Code</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            <input
                                                type="text"
                                                placeholder="CODE"
                                                value={newCode}
                                                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                                className="input px-3 py-2 text-sm uppercase"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Credits"
                                                value={newCredits}
                                                onChange={(e) => setNewCredits(parseInt(e.target.value) || 10)}
                                                min={1}
                                                className="input px-3 py-2 text-sm"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Max Uses (empty = ∞)"
                                                value={newMaxUses}
                                                onChange={(e) => setNewMaxUses(e.target.value ? parseInt(e.target.value) : '')}
                                                min={1}
                                                className="input px-3 py-2 text-sm"
                                            />
                                            <input
                                                type="date"
                                                placeholder="Expiry Date"
                                                value={newExpiry}
                                                onChange={(e) => setNewExpiry(e.target.value)}
                                                className="input px-3 py-2 text-sm"
                                            />
                                            <button
                                                onClick={createPromoCode}
                                                disabled={!newCode.trim() || creating}
                                                className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                                            >
                                                {creating ? 'Creating...' : '+ Create'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Promo Codes List */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="text-left text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                                                <tr>
                                                    <th className="pb-2 font-medium">Code</th>
                                                    <th className="pb-2 font-medium">Credits</th>
                                                    <th className="pb-2 font-medium">Uses</th>
                                                    <th className="pb-2 font-medium">Expires</th>
                                                    <th className="pb-2 font-medium">Status</th>
                                                    <th className="pb-2 font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[hsl(var(--border))]">
                                                {promoCodes.map((code) => (
                                                    <tr key={code.id} className="hover:bg-[hsl(var(--muted))]/30">
                                                        <td className="py-3">
                                                            <code className="px-2 py-1 bg-[hsl(var(--muted))] rounded text-[hsl(var(--foreground))] font-mono text-xs">
                                                                {code.code}
                                                            </code>
                                                        </td>
                                                        <td className="py-3 text-[hsl(var(--foreground))]">
                                                            +{code.credits_value}
                                                        </td>
                                                        <td className="py-3 text-[hsl(var(--muted-foreground))]">
                                                            {code.current_uses} / {code.max_uses || '∞'}
                                                        </td>
                                                        <td className="py-3 text-[hsl(var(--muted-foreground))]">
                                                            {code.valid_until ? new Date(code.valid_until).toLocaleDateString() : 'Never'}
                                                        </td>
                                                        <td className="py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${code.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {code.is_active ? 'Active' : 'Disabled'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 flex gap-2">
                                                            <button
                                                                onClick={() => togglePromoCode(code.id, code.is_active)}
                                                                className="px-2 py-1 text-xs border border-[hsl(var(--border))] rounded hover:bg-[hsl(var(--muted))] transition-colors"
                                                            >
                                                                {code.is_active ? 'Disable' : 'Enable'}
                                                            </button>
                                                            <button
                                                                onClick={() => deletePromoCode(code.id)}
                                                                className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {promoCodes.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="py-8 text-center text-[hsl(var(--muted-foreground))]">
                                                            No promo codes yet. Create one above!
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Add Credits Modal */}
            {addCreditsUser && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setAddCreditsUser(null)} />
                    <div className="relative bg-[hsl(var(--card))] rounded-lg p-6 shadow-xl border border-[hsl(var(--border))] max-w-sm w-full">
                        <h3 className="text-lg font-semibold mb-4 text-[hsl(var(--foreground))]">Add Credits</h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                            Adding credits to <strong>{addCreditsUser.email}</strong>
                        </p>
                        <input
                            type="number"
                            value={addCreditsAmount}
                            onChange={(e) => setAddCreditsAmount(parseInt(e.target.value) || 0)}
                            min={1}
                            className="input w-full px-3 py-2 mb-4"
                            placeholder="Credits to add"
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setAddCreditsUser(null)}
                                className="px-4 py-2 text-sm border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addCreditsToUser}
                                className="btn-primary px-4 py-2 text-sm"
                            >
                                Add {addCreditsAmount} Credits
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{ icon: string; label: string; value: number }> = ({ icon, label, value }) => (
    <div className="p-4 bg-[hsl(var(--muted))]/30 rounded-lg border border-[hsl(var(--border))]">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{icon}</span>
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</span>
        </div>
        <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{value.toLocaleString()}</p>
    </div>
);

export default AdminDashboard;
