/**
 * Mobile-Optimized Sidebar Component
 * 
 * Features:
 * - Collapsible drawer on mobile (slide from left)
 * - Fixed sidebar on desktop
 * - Projects list with recent/starred sections
 * - User profile at bottom
 */

import React from 'react';
import {
    Home,
    Clock,
    FolderOpen,
    X,
    Settings,
    LogOut,
    LogIn
} from 'lucide-react';

interface Project {
    id: string;
    name: string;
    updated_at: string;
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    currentProject: string | null;
    onSelectProject: (id: string) => void;
    onNewProject: () => void;
    user: { email?: string; user_metadata?: { name?: string; avatar_url?: string } } | null;
    onSignIn: () => void;
    onSignOut: () => void;
    onOpenSettings: () => void;
    isAdmin?: boolean;
    onOpenAdmin?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    projects,
    currentProject,
    onSelectProject,
    onNewProject,
    user,
    onSignIn,
    onSignOut,
    onOpenSettings,
    isAdmin = false,
    onOpenAdmin
}) => {
    const recentProjects = projects.slice(0, 5);

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-[280px] bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
            >
                {/* Header - Logo/Title */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden">
                            <img src="/logo.jpg" alt="AI Coder" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-gray-900 text-sm">AI Coder</h1>
                            <span className="text-xs text-gray-500">by Goutham Sai</span>
                        </div>
                    </div>

                    {/* Mobile close button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-2">
                    {/* Main Nav */}
                    <div className="px-2 space-y-0.5">
                        <NavItem icon={<Home />} label="Home" onClick={onNewProject} />
                    </div>

                    {/* Projects Section */}
                    <div className="mt-6 px-2">
                        <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Projects
                        </p>
                        <div className="space-y-0.5">
                            <NavItem icon={<Clock />} label="Recent" badge={recentProjects.length} />

                            {/* Recent projects list or empty state */}
                            <div className="ml-4 space-y-0.5">
                                {recentProjects.length > 0 ? (
                                    recentProjects.map(project => (
                                        <button
                                            key={project.id}
                                            onClick={() => onSelectProject(project.id)}
                                            className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                      transition-colors truncate
                      ${currentProject === project.id
                                                    ? 'bg-gray-100 text-gray-900'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                                        >
                                            <span className="truncate">{project.name}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-4 text-sm text-gray-400 text-center">
                                        <p className="mb-1">🌟 No projects yet</p>
                                        <p className="text-xs">Describe what you want to build and your first project will appear here!</p>
                                    </div>
                                )}
                            </div>

                            <NavItem icon={<FolderOpen />} label="All projects" onClick={onNewProject} />
                        </div>
                    </div>
                </nav>

                {/* Footer - User Profile & Settings */}
                <div className="p-4 border-t border-gray-100 space-y-2">
                    {user ? (
                        <>
                            <button
                                onClick={onOpenSettings}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </button>

                            {/* Admin Dashboard Button - Only visible to admins */}
                            {isAdmin && onOpenAdmin && (
                                <button
                                    onClick={onOpenAdmin}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-purple-600 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                                >
                                    <span className="text-base">🛡️</span>
                                    <span>Admin Dashboard</span>
                                </button>
                            )}

                            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                                <div className="flex items-center gap-2 min-w-0">
                                    {user.user_metadata?.avatar_url ? (
                                        <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                                            {(user.user_metadata?.name || user.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {user.user_metadata?.name || 'User'}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onSignOut}
                                    className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={onSignIn}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

// Helper component for nav items
const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    badge?: number;
    active?: boolean;
    onClick?: () => void;
}> = ({ icon, label, badge, active, onClick }) => (
    <button
        onClick={onClick}
        className={`
      w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm
      transition-colors
      ${active
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
    `}
    >
        <div className="flex items-center gap-2">
            <span className="w-5 h-5 [&>svg]:w-full [&>svg]:h-full text-gray-400">
                {icon}
            </span>
            <span>{label}</span>
        </div>
        {badge !== undefined && (
            <span className="text-xs text-gray-400">{badge}</span>
        )}
    </button>
);

export default Sidebar;
