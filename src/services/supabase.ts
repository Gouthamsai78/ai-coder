/**
 * Supabase Client Configuration
 * 
 * Initializes Supabase client for:
 * - Authentication (Google OAuth)
 * - Projects storage
 * - Training data collection
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// Type Definitions
// ============================================

export interface Project {
    id: string;
    user_id: string;
    name: string;
    code: string;
    chat_history: Message[];
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface TrainingData {
    id: string;
    project_id: string | null;
    user_id: string | null;
    prompt: string;
    context_code: string | null;
    generated_code: string;
    rating: number | null;
    is_accepted: boolean;
    model_used: string | null;
    provider: string | null;
    created_at: string;
}

export interface UserCredits {
    user_id: string;
    credits: number;
    updated_at: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// ============================================
// Projects API
// ============================================

export const projectsApi = {
    async list(): Promise<Project[]> {
        const { data, error } = await supabase
            .from('ai_coder_projects')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async get(id: string): Promise<Project | null> {
        const { data, error } = await supabase
            .from('ai_coder_projects')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
        const { data, error } = await supabase
            .from('ai_coder_projects')
            .insert(project)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Project>): Promise<Project> {
        const { data, error } = await supabase
            .from('ai_coder_projects')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('ai_coder_projects')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================
// Training Data API
// ============================================

export const trainingDataApi = {
    /**
     * Save a prompt-code pair for training
     * Called after each successful AI generation
     */
    async save(data: {
        prompt: string;
        context_code: string | null;
        generated_code: string;
        model_used: string;
        provider: string;
        project_id?: string;
        is_accepted?: boolean;
    }): Promise<TrainingData> {
        const { data: user } = await supabase.auth.getUser();

        const { data: result, error } = await supabase
            .from('ai_training_data')
            .insert({
                ...data,
                user_id: user?.user?.id || null,
                is_accepted: data.is_accepted ?? true
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Rate a training sample (for quality filtering)
     */
    async rate(id: string, rating: number): Promise<void> {
        const { error } = await supabase
            .from('ai_training_data')
            .update({ rating })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Mark as rejected (user clicked "Reject" on diff)
     */
    async markRejected(id: string): Promise<void> {
        const { error } = await supabase
            .from('ai_training_data')
            .update({ is_accepted: false })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Export training data for model fine-tuning
     * Returns prompt-code pairs in JSONL format
     */
    async exportForTraining(): Promise<string> {
        const { data, error } = await supabase
            .from('ai_training_data')
            .select('prompt, context_code, generated_code, rating')
            .eq('is_accepted', true)
            .gte('rating', 3)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Convert to JSONL format for training
        return (data || [])
            .map(row => JSON.stringify({
                messages: [
                    { role: 'user', content: row.context_code ? `${row.prompt}\n\nCurrent Code:\n${row.context_code}` : row.prompt },
                    { role: 'assistant', content: row.generated_code }
                ]
            }))
            .join('\n');
    }
};

// ============================================
// Credits API
// ============================================

export const creditsApi = {
    /**
     * Get current user's credit balance
     * Automatically checks and resets credits if a new day has started
     */
    async getCredits(): Promise<number> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        try {
            // Call the daily reset check function (returns credits, was_reset, last_reset)
            const { data, error } = await supabase
                .rpc('check_and_reset_daily_credits', { p_user_id: user.id });

            if (error) {
                console.error('Failed to check/reset daily credits:', error);
                // Fallback to direct query if RPC fails
                const { data: fallbackData } = await supabase
                    .from('user_credits')
                    .select('credits')
                    .eq('user_id', user.id)
                    .single();
                return fallbackData?.credits || 0;
            }

            // data is an array with one row: [{ credits, was_reset, last_reset }]
            const result = data?.[0];

            if (result?.was_reset) {
                console.log('✅ Daily credits reset! You now have 5 credits.');
            }

            return result?.credits || 0;
        } catch (err) {
            console.error('Error in getCredits:', err);
            return 0;
        }
    },

    /**
     * Initialize credits for a new user (called on first sign-in)
     */
    async initializeCredits(): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        // Check if credits already exist
        const { data: existing } = await supabase
            .from('user_credits')
            .select('user_id')
            .eq('user_id', user.id)
            .single();

        if (existing) return; // Already initialized

        // Create initial credits
        const { error } = await supabase
            .from('user_credits')
            .insert({
                user_id: user.id,
                credits: 5
            });

        if (error) throw error;
    },

    /**
     * Deduct credits after AI generation
     */
    async deductCredits(amount: number = 1): Promise<number> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        // 1. Get current credits
        const { data: currentCreditsData, error: getError } = await supabase
            .from('user_credits')
            .select('credits')
            .eq('user_id', user.id)
            .single();

        if (getError) throw getError;
        const currentCredits = currentCreditsData?.credits || 0;

        // 2. Calculate new credits, ensuring they don't go below 0
        const newCredits = Math.max(0, currentCredits - amount);

        // 3. Update credits
        const { data, error: updateError } = await supabase
            .from('user_credits')
            .update({
                credits: newCredits,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .select('credits')
            .single();

        if (updateError) throw updateError;
        return data?.credits || 0;
    }
};

// ============================================
// Auth Helpers
// ============================================

export const authApi = {
    async signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getUser() {
        const result = await supabase.auth.getUser();
        return result.data;
    },

    onAuthStateChange(callback: (user: unknown) => void) {
        return supabase.auth.onAuthStateChange((_, session) => {
            callback(session?.user || null);
        });
    }
};

// ============================================
// Admin API
// ============================================

export const adminApi = {
    /**
     * Check if the current user is an admin
     */
    async isAdmin(): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data, error } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (error) return false;
        return !!data;
    },

    /**
     * Get admin role
     */
    async getAdminRole(): Promise<string | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (error) return null;
        return data?.role || null;
    }
};
