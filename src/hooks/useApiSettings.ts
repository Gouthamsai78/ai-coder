import { useCallback } from 'react';
import { useLocalStorageString } from './useLocalStorage';
import { STORAGE_KEYS } from '../constants/storage';
import { DEFAULT_PROVIDER, getDefaultModel } from '../constants/models';
import type { ApiProvider, ApiSettings } from '../types';

/**
 * Manages API provider, key, model selection, and GitHub token
 * All state is persisted to localStorage automatically
 */
export function useApiSettings() {
    const [provider, setProviderRaw] = useLocalStorageString(
        STORAGE_KEYS.SELECTED_PROVIDER,
        DEFAULT_PROVIDER
    );

    const [apiKey, setApiKey] = useLocalStorageString(
        STORAGE_KEYS.API_KEY,
        ''
    );

    const [model, setModel] = useLocalStorageString(
        STORAGE_KEYS.SELECTED_MODEL,
        getDefaultModel(provider as ApiProvider)
    );

    const [githubToken, setGithubToken] = useLocalStorageString(
        STORAGE_KEYS.GITHUB_TOKEN,
        ''
    );

    const [webSearchRaw, setWebSearchRaw] = useLocalStorageString(
        STORAGE_KEYS.WEB_SEARCH_ENABLED,
        'false'
    );

    const setWebSearchEnabled = useCallback((enabled: boolean) => {
        setWebSearchRaw(enabled ? 'true' : 'false');
    }, [setWebSearchRaw]);

    // When provider changes, reset to default model for that provider
    const setProvider = useCallback((newProvider: ApiProvider) => {
        setProviderRaw(newProvider);
        setModel(getDefaultModel(newProvider));
    }, [setProviderRaw, setModel]);

    const settings: ApiSettings = {
        provider: provider as ApiProvider,
        apiKey,
        model,
        githubToken,
        webSearchEnabled: webSearchRaw === 'true',
    };

    return {
        settings,
        setProvider,
        setApiKey,
        setModel,
        setGithubToken,
        setWebSearchEnabled,
        hasApiKey: apiKey.length > 0,
    };
}
