import { useState, useCallback } from 'react';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage';
import { analytics } from '../utils/analytics';
import type { ActiveTab } from '../types';

/**
 * Manages app navigation state: landing page, tabs, modals
 */
export function useAppNavigation() {
    // Check if returning user (has API key + visited before)
    const hasUsedBefore = () => {
        const apiKey = storage.getString(STORAGE_KEYS.API_KEY);
        const hasVisited = storage.getString(STORAGE_KEYS.HAS_VISITED);
        return !!(apiKey && hasVisited);
    };

    const [showLanding, setShowLanding] = useState(!hasUsedBefore());
    const [activeTab, setActiveTabState] = useState<ActiveTab>('chat');
    const setActiveTab = useCallback((tab: ActiveTab) => {
        analytics.track('tab_changed', { tab });
        setActiveTabState(tab);
    }, []);
    const [showSettings, setShowSettings] = useState(false);
    const [showDeploy, setShowDeploy] = useState(false);

    const completeLanding = useCallback(() => {
        storage.setString(STORAGE_KEYS.HAS_VISITED, 'true');
        setShowLanding(false);
        const hasKey = storage.getString(STORAGE_KEYS.API_KEY);
        if (!hasKey) {
            setShowSettings(true);
        }
        analytics.track('landing_completed');
    }, []);

    const openSettings = useCallback(() => {
        setShowSettings(true);
        analytics.track('settings_opened');
    }, []);
    const closeSettings = useCallback(() => setShowSettings(false), []);
    const openDeploy = useCallback(() => {
        setShowDeploy(true);
        analytics.track('deploy_opened');
    }, []);
    const closeDeploy = useCallback(() => setShowDeploy(false), []);
    const goToLanding = useCallback(() => setShowLanding(true), []);

    return {
        // State
        showLanding,
        activeTab,
        showSettings,
        showDeploy,
        // Actions
        setActiveTab,
        completeLanding,
        openSettings,
        closeSettings,
        openDeploy,
        closeDeploy,
        goToLanding,
    };
}
