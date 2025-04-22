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

// Définition des types pour les paramètres de l'application
interface SettingsContextType {
    // Paramètres de route
    avoidTolls: boolean;
    setAvoidTolls: (value: boolean) => void;
    avoidHighways: boolean;
    setAvoidHighways: (value: boolean) => void;

    // Paramètres d'affichage
    showTraffic: boolean;
    setShowTraffic: (value: boolean) => void;

    // Paramètres de guidage
    voiceGuidance: boolean;
    setVoiceGuidance: (value: boolean) => void;
    unitsMetric: boolean;
    setUnitsMetric: (value: boolean) => void;

    // Paramètres de recherche
    enableEventSearch: boolean;
    setEnableEventSearch: (value: boolean) => void;
    eventSearchDistance: number;
    setEventSearchDistance: (value: number) => void;

    enableUserSearch: boolean;
    setEnableUserSearch: (value: boolean) => void;
    userSearchDistance: number;
    setUserSearchDistance: (value: number) => void;

    // Fonctions utilitaires
    clearNavigationHistory: () => Promise<void>;
    isSettingsLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
    undefined
);

// Clé utilisée pour stocker les paramètres dans AsyncStorage
const SETTINGS_STORAGE_KEY = "gps_app_settings";
const HISTORY_STORAGE_KEY = "gps_app_history";

// Valeurs par défaut pour un utilisateur non connecté
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

// Valeurs par défaut pour un utilisateur connecté
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

    // États pour chaque paramètre
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

    // Charger les paramètres depuis AsyncStorage
    useEffect(() => {
        const loadSettings = async () => {
            setIsSettingsLoading(true);
            try {
                const storedSettings = await AsyncStorage.getItem(
                    SETTINGS_STORAGE_KEY
                );

                if (storedSettings) {
                    const parsedSettings = JSON.parse(storedSettings);

                    // Appliquer les paramètres stockés
                    setAvoidTolls(parsedSettings.avoidTolls);
                    setAvoidHighways(parsedSettings.avoidHighways);
                    setShowTraffic(parsedSettings.showTraffic);
                    setVoiceGuidance(parsedSettings.voiceGuidance);
                    setUnitsMetric(parsedSettings.unitsMetric);

                    // Pour les paramètres dépendant de l'authentification, vérifier le statut
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
                        // Si l'utilisateur n'est pas connecté, certaines fonctions sont désactivées
                        setEnableEventSearch(false);
                        setEventSearchDistance(0);
                        setEnableUserSearch(false);
                        setUserSearchDistance(0);
                    }
                } else {
                    // Si aucun paramètre n'est stocké, utiliser les valeurs par défaut selon le statut d'authentification
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
                        // Valeurs par défaut pour un utilisateur non connecté
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
                console.error(
                    "Erreur lors du chargement des paramètres:",
                    error
                );
                // En cas d'erreur, utiliser les valeurs par défaut
                resetToDefaults(isAuthenticated);
            } finally {
                setIsSettingsLoading(false);
            }
        };

        loadSettings();
    }, [isAuthenticated]);

    // Réinitialiser tous les paramètres aux valeurs par défaut en fonction du statut d'authentification
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

    // Enregistrer les paramètres dans AsyncStorage quand ils changent
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
                console.error(
                    "Erreur lors de l'enregistrement des paramètres:",
                    error
                );
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

    // Fonction pour effacer l'historique de navigation
    const clearNavigationHistory = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
            return Promise.resolve();
        } catch (error) {
            console.error(
                "Erreur lors de la suppression de l'historique de navigation:",
                error
            );
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
