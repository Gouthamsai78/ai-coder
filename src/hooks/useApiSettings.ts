import { useCallback } from 'react';
import { useLocalStorageString } from './useLocalStorage';
import { STORAGE_KEYS } from '../constants/storage';
import { DEFAULT_PROVIDER, getDefaultModel } from '../constants/models';
import type { ApiProvider, ApiSettings, SeoSettings } from '../types';

const DEFAULT_SEO: SeoSettings = {
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    ogImage: '',
    siteUrl: '',
    author: '',
};

function parseSeoSettings(raw: string): SeoSettings {
    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        return {
            siteTitle: typeof parsed.siteTitle === 'string' ? parsed.siteTitle : '',
            siteDescription: typeof parsed.siteDescription === 'string' ? parsed.siteDescription : '',
            siteKeywords: typeof parsed.siteKeywords === 'string' ? parsed.siteKeywords : '',
            ogImage: typeof parsed.ogImage === 'string' ? parsed.ogImage : '',
            siteUrl: typeof parsed.siteUrl === 'string' ? parsed.siteUrl : '',
            author: typeof parsed.author === 'string' ? parsed.author : '',
        };
    } catch {
        return DEFAULT_SEO;
    }
}

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

    const [seoRaw, setSeoRaw] = useLocalStorageString(
        STORAGE_KEYS.SEO_SETTINGS,
        JSON.stringify(DEFAULT_SEO)
    );

    const setWebSearchEnabled = useCallback((enabled: boolean) => {
        setWebSearchRaw(enabled ? 'true' : 'false');
    }, [setWebSearchRaw]);

    const setSeoSettings = useCallback((seo: SeoSettings) => {
        setSeoRaw(JSON.stringify(seo));
    }, [setSeoRaw]);

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

    const seoSettings: SeoSettings = parseSeoSettings(seoRaw);

    return {
        settings,
        seoSettings,
        setProvider,
        setApiKey,
        setModel,
        setGithubToken,
        setWebSearchEnabled,
        setSeoSettings,
        hasApiKey: apiKey.length > 0,
    };
}
