/**
 * Centralized localStorage keys
 * Single source of truth - change once, updates everywhere
 */
export const STORAGE_KEYS = {
    API_KEY: 'ai_api_key',
    SELECTED_PROVIDER: 'selected_provider',
    SELECTED_MODEL: 'selected_model',
    CHAT_MESSAGES: 'chat_messages',
    SAVED_CODE: 'saved_code',
    GITHUB_TOKEN: 'github_token',
    HAS_VISITED: 'has_visited_app',
    WEB_SEARCH_ENABLED: 'web_search_enabled',
    SEO_SETTINGS: 'seo_settings',
    DEPLOYED_SLUG: 'deployed_slug',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
