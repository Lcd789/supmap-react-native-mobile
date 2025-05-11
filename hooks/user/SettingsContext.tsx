import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

interface SettingsContextType {
    avoidTolls: boolean;
    setAvoidTolls: (value: boolean) => void;
    avoidHighways: boolean;
    setAvoidHighways: (value: boolean) => void;

    showTraffic: boolean;
    setShowTraffic: (value: boolean) => void;

    voiceGuidance: boolean;
    setVoiceGuidance: (value: boolean) => void;
    unitsMetric: boolean;
    setUnitsMetric: (value: boolean) => void;

    enableEventSearch: boolean;
    setEnableEventSearch: (value: boolean) => void;
    eventSearchDistance: number;
    setEventSearchDistance: (value: number) => void;

    enableUserSearch: boolean;
    setEnableUserSearch: (value: boolean) => void;
    userSearchDistance: number;
    setUserSearchDistance: (value: number) => void;

    clearNavigationHistory: () => Promise<void>;
    isSettingsLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
    undefined
);

const SETTINGS_STORAGE_KEY = "gps_app_settings";
const HISTORY_STORAGE_KEY = "gps_app_history";

const DEFAULT_SETTINGS_LOGGED_OUT = {
    avoidTolls: false,
    avoidHighways: false,
    showTraffic: true,
    voiceGuidance: true,
    unitsMetric: true,
    enableEventSearch: false,
    eventSearchDistance: 0,
    enableUserSearch: false,
    userSearchDistance: 0,
};

const DEFAULT_SETTINGS_LOGGED_IN = {
    ...DEFAULT_SETTINGS_LOGGED_OUT,
    enableEventSearch: true,
    eventSearchDistance: 500,
    enableUserSearch: true,
    userSearchDistance: 500,
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { isAuthenticated } = useAuth();
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);

    const [avoidTolls, setAvoidTolls] = useState(
        DEFAULT_SETTINGS_LOGGED_OUT.avoidTolls
    );
    const [avoidHighways, setAvoidHighways] = useState(
        DEFAULT_SETTINGS_LOGGED_OUT.avoidHighways
    );
    const [showTraffic, setShowTraffic] = useState(
        DEFAULT_SETTINGS_LOGGED_OUT.showTraffic
    );
    const [voiceGuidance, setVoiceGuidance] = useState(
        DEFAULT_SETTINGS_LOGGED_OUT.voiceGuidance
    );
    const [unitsMetric, setUnitsMetric] = useState(
        DEFAULT_SETTINGS_LOGGED_OUT.unitsMetric
    );
    const [enableEventSearch, setEnableEventSearch] = useState(
        DEFAULT_SETTINGS_LOGGED_OUT.enableEventSearch
    );
    const [eventSearchDistance, setEventSearchDistance] = useState(
        DEFAULT_SETTINGS_LOGGED_OUT.eventSearchDistance
    );
    const [enableUserSearch, setEnableUserSearch] = useState(
        DEFAULT_SETTINGS_LOGGED_OUT.enableUserSearch
    );
    const [userSearchDistance, setUserSearchDistance] = useState(
        DEFAULT_SETTINGS_LOGGED_OUT.userSearchDistance
    );

    useEffect(() => {
        const loadSettings = async () => {
            setIsSettingsLoading(true);
            try {
                const storedSettings = await AsyncStorage.getItem(
                    SETTINGS_STORAGE_KEY
                );

                if (storedSettings) {
                    const parsedSettings = JSON.parse(storedSettings);

                    setAvoidTolls(parsedSettings.avoidTolls);
                    setAvoidHighways(parsedSettings.avoidHighways);
                    setShowTraffic(parsedSettings.showTraffic);
                    setVoiceGuidance(parsedSettings.voiceGuidance);
                    setUnitsMetric(parsedSettings.unitsMetric);

                    if (isAuthenticated) {
                        setEnableEventSearch(
                            parsedSettings.enableEventSearch ??
                                DEFAULT_SETTINGS_LOGGED_IN.enableEventSearch
                        );
                        setEventSearchDistance(
                            parsedSettings.eventSearchDistance ??
                                DEFAULT_SETTINGS_LOGGED_IN.eventSearchDistance
                        );
                        setEnableUserSearch(
                            parsedSettings.enableUserSearch ??
                                DEFAULT_SETTINGS_LOGGED_IN.enableUserSearch
                        );
                        setUserSearchDistance(
                            parsedSettings.userSearchDistance ??
                                DEFAULT_SETTINGS_LOGGED_IN.userSearchDistance
                        );
                    } else {
                        setEnableEventSearch(false);
                        setEventSearchDistance(0);
                        setEnableUserSearch(false);
                        setUserSearchDistance(0);
                    }
                } else {
                    if (isAuthenticated) {
                        setAvoidTolls(DEFAULT_SETTINGS_LOGGED_IN.avoidTolls);
                        setAvoidHighways(
                            DEFAULT_SETTINGS_LOGGED_IN.avoidHighways
                        );
                        setShowTraffic(DEFAULT_SETTINGS_LOGGED_IN.showTraffic);
                        setVoiceGuidance(
                            DEFAULT_SETTINGS_LOGGED_IN.voiceGuidance
                        );
                        setUnitsMetric(DEFAULT_SETTINGS_LOGGED_IN.unitsMetric);
                        setEnableEventSearch(
                            DEFAULT_SETTINGS_LOGGED_IN.enableEventSearch
                        );
                        setEventSearchDistance(
                            DEFAULT_SETTINGS_LOGGED_IN.eventSearchDistance
                        );
                        setEnableUserSearch(
                            DEFAULT_SETTINGS_LOGGED_IN.enableUserSearch
                        );
                        setUserSearchDistance(
                            DEFAULT_SETTINGS_LOGGED_IN.userSearchDistance
                        );
                    } else {
                        setAvoidTolls(DEFAULT_SETTINGS_LOGGED_OUT.avoidTolls);
                        setAvoidHighways(
                            DEFAULT_SETTINGS_LOGGED_OUT.avoidHighways
                        );
                        setShowTraffic(DEFAULT_SETTINGS_LOGGED_OUT.showTraffic);
                        setVoiceGuidance(
                            DEFAULT_SETTINGS_LOGGED_OUT.voiceGuidance
                        );
                        setUnitsMetric(DEFAULT_SETTINGS_LOGGED_OUT.unitsMetric);
                        setEnableEventSearch(
                            DEFAULT_SETTINGS_LOGGED_OUT.enableEventSearch
                        );
                        setEventSearchDistance(
                            DEFAULT_SETTINGS_LOGGED_OUT.eventSearchDistance
                        );
                        setEnableUserSearch(
                            DEFAULT_SETTINGS_LOGGED_OUT.enableUserSearch
                        );
                        setUserSearchDistance(
                            DEFAULT_SETTINGS_LOGGED_OUT.userSearchDistance
                        );
                    }
                }
            } catch (error) {
                resetToDefaults(isAuthenticated);
            } finally {
                setIsSettingsLoading(false);
            }
        };

        loadSettings();
    }, [isAuthenticated]);

    const resetToDefaults = (authenticated: boolean) => {
        const defaults = authenticated
            ? DEFAULT_SETTINGS_LOGGED_IN
            : DEFAULT_SETTINGS_LOGGED_OUT;

        setAvoidTolls(defaults.avoidTolls);
        setAvoidHighways(defaults.avoidHighways);
        setShowTraffic(defaults.showTraffic);
        setVoiceGuidance(defaults.voiceGuidance);
        setUnitsMetric(defaults.unitsMetric);
        setEnableEventSearch(defaults.enableEventSearch);
        setEventSearchDistance(defaults.eventSearchDistance);
        setEnableUserSearch(defaults.enableUserSearch);
        setUserSearchDistance(defaults.userSearchDistance);
    };

    useEffect(() => {
        const saveSettings = async () => {
            if (isSettingsLoading) return;

            try {
                const settings = {
                    avoidTolls,
                    avoidHighways,
                    showTraffic,
                    voiceGuidance,
                    unitsMetric,
                    enableEventSearch,
                    eventSearchDistance,
                    enableUserSearch,
                    userSearchDistance,
                };

                await AsyncStorage.setItem(
                    SETTINGS_STORAGE_KEY,
                    JSON.stringify(settings)
                );
            } catch (error) {
                console.error("Error saving settings:", error);
            }
        };

        saveSettings();
    }, [
        avoidTolls,
        avoidHighways,
        showTraffic,
        voiceGuidance,
        unitsMetric,
        enableEventSearch,
        eventSearchDistance,
        enableUserSearch,
        userSearchDistance,
        isSettingsLoading,
    ]);

    const clearNavigationHistory = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
            return Promise.resolve();
        } catch (error) {
            console.error("Error clearing navigation history:", error);
            return Promise.reject(error);
        }
    }, []);

    const contextValue: SettingsContextType = {
        avoidTolls,
        setAvoidTolls,
        avoidHighways,
        setAvoidHighways,
        showTraffic,
        setShowTraffic,
        voiceGuidance,
        setVoiceGuidance,
        unitsMetric,
        setUnitsMetric,
        enableEventSearch,
        setEnableEventSearch,
        eventSearchDistance,
        setEventSearchDistance,
        enableUserSearch,
        setEnableUserSearch,
        userSearchDistance,
        setUserSearchDistance,
        clearNavigationHistory,
        isSettingsLoading,
    };

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error(
            "useSettings doit être utilisé à l'intérieur d'un SettingsProvider"
        );
    }
    return context;
};
