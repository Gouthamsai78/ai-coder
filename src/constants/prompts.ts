/**
 * Chat prompt suggestions for empty state
 * To add new suggestions: just add entries here
 */
export const PROMPT_SUGGESTIONS = [
    { emoji: '🎯', text: 'Build a landing page for a SaaS product' },
    { emoji: '📊', text: 'Create a dashboard with charts and stats' },
    { emoji: '🛒', text: 'Make an e-commerce product page' },
    { emoji: '✅', text: 'Build a todo app with local storage' },
    { emoji: '💬', text: 'Create a chat application UI' },
    { emoji: '🎨', text: 'Design a portfolio website' },
] as const;

export type PromptSuggestion = typeof PROMPT_SUGGESTIONS[number];
