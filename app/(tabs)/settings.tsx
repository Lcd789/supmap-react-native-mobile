import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Switch,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "@/hooks/user/SettingsContext";
import { useAuth } from "@/hooks/user/AuthContext";
import { useHistory } from "@/hooks/useHistory";
import {
    useUpdateNavigationPreferences,
    NavigationPreferences,
    TransportMode
} from "@/hooks/map/MapHooks";
import { getUserDataApi } from "../../hooks/user/userHooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import FavoriteLocationsManager from "@/components/MapComponents/FavoriteLocation";
import { MaterialIcons } from "@expo/vector-icons";

// Clé pour le stockage local des préférences de navigation
const NAV_PREFS_STORAGE_KEY = "navigation_preferences";
// Durée de validité du cache (24 heures en millisecondes)
const CACHE_VALIDITY_DURATION = 24 * 60 * 60 * 1000;

const SettingsScreen = () => {
    const insets = useSafeAreaInsets();
    const { isAuthenticated } = useAuth();
    const { clearHistory } = useHistory();
    const [isClearing, setIsClearing] = useState(false);
    const {
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
        isSettingsLoading,
    } = useSettings();

    // État pour les préférences de navigation
    const [navPreferences, setNavPreferences] = useState<NavigationPreferences>({
        avoidTolls: avoidTolls,
        avoidHighways: avoidHighways,
        avoidTraffic: !showTraffic,
        showUsers: enableUserSearch,
        proximityAlertDistance: userSearchDistance,
        preferredTransportMode: "CAR" // Valeur par défaut
    });

    // État pour le chargement des préférences de navigation
    const [loadingNavPrefs, setLoadingNavPrefs] = useState(true);

    // Hook pour mettre à jour les préférences de navigation
    const {
        updatePreferences,
        loading: updatingPrefs,
        error: updateError,
        success: updateSuccess
    } = useUpdateNavigationPreferences();

    // Fonction pour charger les préférences de navigation
    const loadNavigationPreferences = async () => {
        if (!isAuthenticated) {
            setLoadingNavPrefs(false);
            return;
        }

        setLoadingNavPrefs(true);
        try {
            // D'abord, essayer de charger depuis le stockage local
            const cachedData = await AsyncStorage.getItem(NAV_PREFS_STORAGE_KEY);

            if (cachedData) {
                const { preferences, timestamp } = JSON.parse(cachedData);
                const now = Date.now();

                // Vérifier si le cache est encore valide
                if (now - timestamp < CACHE_VALIDITY_DURATION) {
                    // Utiliser les données en cache
                    setNavPreferences(preferences);
                    updateLocalSettings(preferences);
                    setLoadingNavPrefs(false);

                    // Optionnel: Rafraîchir en arrière-plan
                    fetchPreferencesFromAPI(false);
                    return;
                }
            }

            // Si pas de cache valide, charger depuis l'API
            await fetchPreferencesFromAPI(true);

        } catch (error) {
            console.error("Erreur lors du chargement des préférences:", error);
            setLoadingNavPrefs(false);
        }
    };

    // Fonction pour récupérer les préférences depuis l'API
    const fetchPreferencesFromAPI = async (updateLoadingState: boolean) => {
        try {
            const userData = await getUserDataApi();

            if (userData && userData.navigationPreferences) {
                // Mettre à jour l'état avec les préférences récupérées
                setNavPreferences(userData.navigationPreferences);
                updateLocalSettings(userData.navigationPreferences);

                // Mettre en cache les préférences
                await AsyncStorage.setItem(NAV_PREFS_STORAGE_KEY, JSON.stringify({
                    preferences: userData.navigationPreferences,
                    timestamp: Date.now()
                }));
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des préférences:", error);
        } finally {
            if (updateLoadingState) {
                setLoadingNavPrefs(false);
            }
        }
    };

    // Fonction pour mettre à jour les paramètres locaux
    const updateLocalSettings = (prefs: NavigationPreferences) => {
        setAvoidTolls(prefs.avoidTolls);
        setAvoidHighways(prefs.avoidHighways);
        setShowTraffic(!prefs.avoidTraffic);
        setEnableUserSearch(prefs.showUsers);
        setUserSearchDistance(prefs.proximityAlertDistance);
    };

    // Charger les préférences au montage du composant
    useEffect(() => {
        loadNavigationPreferences();
    }, [isAuthenticated]);

    // Synchroniser les préférences locales avec l'état global
    useEffect(() => {
        if (!loadingNavPrefs) {
            setNavPreferences(prev => ({
                ...prev,
                avoidTolls: avoidTolls,
                avoidHighways: avoidHighways,
                avoidTraffic: !showTraffic,
                showUsers: enableUserSearch,
                proximityAlertDistance: userSearchDistance
            }));
        }
    }, [avoidTolls, avoidHighways, showTraffic, enableUserSearch, userSearchDistance, loadingNavPrefs]);

    // Effet pour afficher le succès
    useEffect(() => {
        if (updateSuccess) {
            Alert.alert("Succès", "Vos préférences de navigation ont été enregistrées.");

            // Mettre à jour le cache avec les nouvelles préférences
            AsyncStorage.setItem(NAV_PREFS_STORAGE_KEY, JSON.stringify({
                preferences: navPreferences,
                timestamp: Date.now()
            }));
        }
    }, [updateSuccess, navPreferences]);

    const handleSaveNavPreferences = async () => {
        if (isAuthenticated) {
            try {
                await updatePreferences(navPreferences);
            } catch (error) {
                Alert.alert("Erreur", "Une erreur s'est produite lors de l'enregistrement des préférences.");
            }
        } else {
            Alert.alert("Connexion requise", "Veuillez vous connecter pour enregistrer vos préférences.");
        }
    };

    const formatDistance = (distance: number) => {
        if (distance >= 1000) {
            return `${(distance / 1000).toFixed(1)} km`;
        }
        return `${distance} m`;
    };

    const handleClearHistory = () => {
        Alert.alert(
            "Effacer l'historique",
            "Êtes-vous sûr de vouloir effacer tout l'historique de navigation ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Confirmer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsClearing(true);
                            await clearHistory();
                            Alert.alert(
                                "Succès",
                                "L'historique de navigation a été effacé avec succès."
                            );
                        } catch {
                            Alert.alert(
                                "Erreur",
                                "Une erreur s'est produite lors de la suppression de l'historique."
                            );
                        } finally {
                            setIsClearing(false);
                        }
                    },
                },
            ]
        );
    };

    // Modes de transport disponibles
    const transportModes: { type: TransportMode; label: string; icon: any }[] = [
        { type: "CAR", label: "Voiture", icon: "directions-car" },
        { type: "MOTORCYCLE", label: "Moto", icon: "two-wheeler" },
        { type: "TRUCK", label: "Camion", icon: "local-shipping" },
        { type: "BICYCLE", label: "Vélo", icon: "directions-bike" },
        { type: "WALKING", label: "À pied", icon: "directions-walk" }
    ];

    // Afficher le chargement si les paramètres ou les préférences sont en cours de chargement
    if (isSettingsLoading || loadingNavPrefs) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#333" />
                <Text style={styles.loadingText}>Chargement des paramètres...</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.sectionTitle}>Paramètres d'itinéraire</Text>

            <View style={styles.card}>
                <Text style={styles.subsectionTitle}>Mode de transport préféré</Text>
                <View style={styles.transportModesContainer}>
                    {transportModes.map((mode) => (
                        <TouchableOpacity
                            key={mode.type}
                            style={[
                                styles.transportModeButton,
                                navPreferences.preferredTransportMode === mode.type && styles.transportModeButtonActive
                            ]}
                            onPress={() => setNavPreferences({
                                ...navPreferences,
                                preferredTransportMode: mode.type
                            })}
                        >
                            <MaterialIcons
                                name={mode.icon}
                                size={28}
                                color={navPreferences.preferredTransportMode === mode.type ? "#fff" : "#333"}
                            />
                            <Text
                                style={[
                                    styles.transportModeText,
                                    navPreferences.preferredTransportMode === mode.type && styles.transportModeTextActive
                                ]}
                            >
                                {mode.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>Éviter les péages</Text>
                    <Switch
                        value={navPreferences.avoidTolls}
                        onValueChange={(value) => {
                            setAvoidTolls(value);
                            setNavPreferences({...navPreferences, avoidTolls: value});
                        }}
                    />
                </View>

                <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>Éviter les autoroutes</Text>
                    <Switch
                        value={navPreferences.avoidHighways}
                        onValueChange={(value) => {
                            setAvoidHighways(value);
                            setNavPreferences({...navPreferences, avoidHighways: value});
                        }}
                    />
                </View>

                <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>Éviter le trafic</Text>
                    <Switch
                        value={navPreferences.avoidTraffic}
                        onValueChange={(value) => {
                            setShowTraffic(!value);
                            setNavPreferences({...navPreferences, avoidTraffic: value});
                        }}
                    />
                </View>

                <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>Afficher les utilisateurs</Text>
                    <Switch
                        value={navPreferences.showUsers}
                        onValueChange={(value) => {
                            setEnableUserSearch(value);
                            setNavPreferences({...navPreferences, showUsers: value});
                        }}
                    />
                </View>

                <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>
                        Distance d'alerte de proximité : {formatDistance(navPreferences.proximityAlertDistance)}
                    </Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={100}
                        maximumValue={10000}
                        step={100}
                        value={navPreferences.proximityAlertDistance}
                        onValueChange={(value) => {
                            setNavPreferences({...navPreferences, proximityAlertDistance: value});
                            setUserSearchDistance(value);
                        }}
                    />
                </View>

                {isAuthenticated && (
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSaveNavPreferences}
                        disabled={updatingPrefs}
                    >
                        {updatingPrefs ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.saveButtonText}>Enregistrer les préférences</Text>
                        )}
                    </TouchableOpacity>
                )}

                {updateError && <Text style={styles.errorText}>{updateError}</Text>}

                {!isAuthenticated && (
                    <Text style={styles.infoText}>
                        Connectez-vous pour sauvegarder vos préférences de navigation.
                    </Text>
                )}
            </View>

            {/* Lieux favoris */}
            <Text style={styles.sectionTitle}>Lieux favoris</Text>
            {isAuthenticated ? (
                <FavoriteLocationsManager />
            ) : (
                <View style={styles.card}>
                    <Text style={styles.infoText}>
                        Connectez-vous pour gérer vos lieux favoris.
                    </Text>
                </View>
            )}

            <Text style={styles.sectionTitle}>Affichage</Text>

            <View style={styles.card}>
                <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>Afficher le trafic</Text>
                    <Switch
                        value={showTraffic}
                        onValueChange={(value) => {
                            setShowTraffic(value);
                            setNavPreferences({...navPreferences, avoidTraffic: !value});
                        }}
                    />
                </View>
            </View>

            <Text style={styles.sectionTitle}>Guidage</Text>

            <View style={styles.card}>
                <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>Guidage vocal</Text>
                    <Switch value={voiceGuidance} onValueChange={setVoiceGuidance} />
                </View>

                <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>Unités métriques</Text>
                    <Switch value={unitsMetric} onValueChange={setUnitsMetric} />
                </View>
            </View>

            <Text style={styles.sectionTitle}>Recherche</Text>

            <View style={styles.card}>
                <View style={styles.optionRow}>
                    <Text style={[styles.optionLabel, !isAuthenticated && styles.disabledText]}>
                        Rechercher des événements
                    </Text>
                    <Switch
                        value={enableEventSearch}
                        onValueChange={setEnableEventSearch}
                        disabled={!isAuthenticated}
                    />
                </View>

                {isAuthenticated && enableEventSearch && (
                    <View style={styles.sliderContainer}>
                        <Text style={styles.sliderLabel}>
                            Distance de recherche : {formatDistance(eventSearchDistance)}
                        </Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={100}
                            maximumValue={5000}
                            step={100}
                            value={eventSearchDistance}
                            onValueChange={setEventSearchDistance}
                        />
                    </View>
                )}

                <View style={styles.optionRow}>
                    <Text style={[styles.optionLabel, !isAuthenticated && styles.disabledText]}>
                        Rechercher des utilisateurs
                    </Text>
                    <Switch
                        value={enableUserSearch}
                        onValueChange={(value) => {
                            setEnableUserSearch(value);
                            setNavPreferences({...navPreferences, showUsers: value});
                        }}
                        disabled={!isAuthenticated}
                    />
                </View>

                {isAuthenticated && enableUserSearch && (
                    <View style={styles.sliderContainer}>
                        <Text style={styles.sliderLabel}>
                            Distance de recherche : {formatDistance(userSearchDistance)}
                        </Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={100}
                            maximumValue={5000}
                            step={100}
                            value={userSearchDistance}
                            onValueChange={(value) => {
                                setUserSearchDistance(value);
                                setNavPreferences({...navPreferences, proximityAlertDistance: value});
                            }}
                        />
                    </View>
                )}

                {!isAuthenticated && (
                    <Text style={styles.infoText}>
                        Connectez-vous pour activer les options de recherche.
                    </Text>
                )}
            </View>

            <Text style={styles.sectionTitle}>Données</Text>

            <View style={styles.card}>
                <TouchableOpacity
                    style={styles.buttonContainer}
                    onPress={handleClearHistory}
                    disabled={isClearing}
                >
                    {isClearing ? (
                        <ActivityIndicator size="small" color="#e74c3c" />
                    ) : (
                        <Text style={styles.buttonText}>Effacer l'historique de navigation</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#f9f9f9",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f9f9f9",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#333",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e1e1e",
        marginTop: 20,
        marginBottom: 10,
    },
    subsectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 12,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        elevation: 3,
        marginBottom: 16,
    },
    optionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    optionLabel: {
        fontSize: 16,
        color: "#333",
    },
    disabledText: {
        color: "#888",
    },
    sliderContainer: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    sliderLabel: {
        fontSize: 14,
        color: "#555",
        marginBottom: 5,
    },
    slider: {
        width: "100%",
        height: 40,
    },
    infoText: {
        fontSize: 14,
        color: "#888",
        fontStyle: "italic",
        padding: 10,
        textAlign: "center",
    },
    buttonContainer: {
        paddingVertical: 14,
        alignItems: "center",
    },
    buttonText: {
        fontSize: 16,
        color: "#e74c3c",
        fontWeight: "600",
    },
    errorText: {
        color: "#e74c3c",
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
    },
    transportModesContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    transportModeButton: {
        width: "18%",
        aspectRatio: 0.9,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#f5f5f5",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
        marginBottom: 8,
    },
    transportModeButtonActive: {
        backgroundColor: "#2196F3",
        borderColor: "#1976D2",
    },
    transportModeText: {
        fontSize: 12,
        color: "#333",
        textAlign: "center",
        marginTop: 4,
    },
    transportModeTextActive: {
        color: "#fff",
    },
    saveButton: {
        backgroundColor: "#2196F3",
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
        marginTop: 16,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default SettingsScreen;