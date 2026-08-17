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

    const [apiKey, setApiKeyRaw] = useLocalStorageString(
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

    // API keys are copied from elsewhere; paste often drags in whitespace
    // (spaces, newlines) that makes Google reject the key with
    // "API key not valid" (API_KEY_INVALID). Normalize at the source so every
    // entry path (Settings modal, inline field) stores a clean key. Also
    // normalize on read so an already-dirty stored key heals without re-pasting.
    const setApiKey = useCallback((value: string) => {
        setApiKeyRaw(value.replace(/\s+/g, ''));
    }, [setApiKeyRaw]);

    const cleanApiKey = apiKey.replace(/\s+/g, '');

    const settings: ApiSettings = {
        provider: provider as ApiProvider,
        apiKey: cleanApiKey,
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
        hasApiKey: cleanApiKey.length > 0,
    };
}
