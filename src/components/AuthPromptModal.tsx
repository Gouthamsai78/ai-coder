/**
 * Auth Prompt Modal
 * 
 * Shown when user tries to send first message without authentication or API key.
 * Offers two paths:
 * 1. Sign in with Google (5 free credits)
 * 2. Use own API key (unlimited)
 */

import React from 'react';
import { X } from 'lucide-react';
import { authApi } from '../services/supabase';

interface AuthPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUseOwnKey: () => void;
}

const AuthPromptModal: React.FC<AuthPromptModalProps> = ({ isOpen, onClose, onUseOwnKey }) => {
    const [isSigningIn, setIsSigningIn] = React.useState(false);

    if (!isOpen) return null;

    const handleGoogleSignIn = async () => {
        setIsSigningIn(true);
        try {
            await authApi.signInWithGoogle();
        } catch (err) {
            console.error('Sign in failed:', err);
            setIsSigningIn(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>

                {/* Content */}
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl">🚀</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Let's get you started!
                    </h2>
                    <p className="text-sm text-gray-600">
                        Pick the option that works best for you
                    </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    {/* Option 1: Google Sign In - Highlighted as recommended */}
                    <div className="relative">
                        <span className="absolute -top-2 left-4 px-2 py-0.5 bg-violet-600 text-white text-[10px] font-semibold rounded-full z-10">Recommended</span>
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isSigningIn}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            {isSigningIn ? 'Signing in...' : 'Continue with Google'}
                        </button>
                    </div>
                    <div className="text-center">
                        <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                            🎁 Get 5 free generations to start
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-white text-gray-500">or</span>
                        </div>
                    </div>

                    {/* Option 2: Own API Key */}
                    <button
                        onClick={onUseOwnKey}
                        className="w-full px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-all"
                    >
                        I have my own API key
                    </button>
                    <p className="text-xs text-center text-gray-500">
                        Unlimited builds with your own Google AI or OpenRouter key
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPromptModal;
