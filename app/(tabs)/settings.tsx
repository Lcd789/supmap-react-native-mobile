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

const NAV_PREFS_STORAGE_KEY = "navigation_preferences";
const CACHE_VALIDITY_DURATION = 24 * 60 * 60 * 1000;

const MIN_ALERT_DISTANCE = 100;
const MAX_ALERT_DISTANCE = 10000;
const ALERT_DISTANCE_STEP = 100;

const SettingsScreen = () => {
    const insets = useSafeAreaInsets();
    const { isAuthenticated } = useAuth();
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
        isSettingsLoading,
    } = useSettings();

    const [navPreferences, setNavPreferences] = useState<NavigationPreferences>({
        avoidTolls: avoidTolls,
        avoidHighways: avoidHighways,
        avoidTraffic: !showTraffic,
        showUsers: false,
        proximityAlertDistance: 1000,
        preferredTransportMode: "CAR"
    });

    const [loadingNavPrefs, setLoadingNavPrefs] = useState(true);

    const {
        updatePreferences,
        loading: updatingPrefs,
        error: updateError,
        success: updateSuccess
    } = useUpdateNavigationPreferences();

    const loadNavigationPreferences = async () => {
        if (!isAuthenticated) {
            setLoadingNavPrefs(false);
            return;
        }

        setLoadingNavPrefs(true);
        try {
            const cachedData = await AsyncStorage.getItem(NAV_PREFS_STORAGE_KEY);

            if (cachedData) {
                const { preferences, timestamp } = JSON.parse(cachedData);
                const now = Date.now();

                if (now - timestamp < CACHE_VALIDITY_DURATION) {
                    setNavPreferences(preferences);
                    updateLocalSettings(preferences);
                    setLoadingNavPrefs(false);

                    fetchPreferencesFromAPI(false);
                    return;
                }
            }

            await fetchPreferencesFromAPI(true);

        } catch (error) {
            setLoadingNavPrefs(false);
        }
    };

    const fetchPreferencesFromAPI = async (updateLoadingState: boolean) => {
        try {
            const userData = await getUserDataApi();

            if (userData && userData.navigationPreferences) {
                setNavPreferences(userData.navigationPreferences);
                updateLocalSettings(userData.navigationPreferences);

                await AsyncStorage.setItem(NAV_PREFS_STORAGE_KEY, JSON.stringify({
                    preferences: userData.navigationPreferences,
                    timestamp: Date.now()
                }));
            }
        } catch (error) {
        } finally {
            if (updateLoadingState) {
                setLoadingNavPrefs(false);
            }
        }
    };

    const updateLocalSettings = (prefs: NavigationPreferences) => {
        setAvoidTolls(prefs.avoidTolls);
        setAvoidHighways(prefs.avoidHighways);
        setShowTraffic(!prefs.avoidTraffic);
    };

    useEffect(() => {
        loadNavigationPreferences();
    }, [isAuthenticated]);

    useEffect(() => {
        if (!loadingNavPrefs) {
            setNavPreferences(prev => ({
                ...prev,
                avoidTolls: avoidTolls,
                avoidHighways: avoidHighways,
                avoidTraffic: !showTraffic,
            }));
        }
    }, [avoidTolls, avoidHighways, showTraffic, loadingNavPrefs]);

    useEffect(() => {
        if (updateSuccess) {
            Alert.alert("Succès", "Vos préférences de navigation ont été enregistrées.");

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

    const handleProximityAlertDistanceChange = (value: number) => {
        const roundedValue = Math.round(value / ALERT_DISTANCE_STEP) * ALERT_DISTANCE_STEP;
        setNavPreferences({
            ...navPreferences,
            proximityAlertDistance: roundedValue
        });
    };

    const transportModes: { type: TransportMode; label: string; icon: any }[] = [
        { type: "CAR", label: "Voiture", icon: "directions-car" },
        { type: "MOTORCYCLE", label: "Moto", icon: "two-wheeler" },
        { type: "TRUCK", label: "Camion", icon: "local-shipping" },
        { type: "BICYCLE", label: "Vélo", icon: "directions-bike" },
        { type: "WALKING", label: "À pied", icon: "directions-walk" }
    ];

    if (isSettingsLoading || loadingNavPrefs) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#333" />
                <Text style={styles.loadingText}>Chargement des paramètres...</Text>
            </View>
        );
    }

    const LoginRequiredMessage = () => (
        <View style={styles.loginRequiredContainer}>
            <MaterialIcons name="lock" size={48} color="#888" />
            <Text style={styles.loginRequiredText}>
                Connexion requise
            </Text>
            <Text style={styles.loginRequiredSubtext}>
                Veuillez vous connecter pour accéder à cette fonctionnalité.
            </Text>
        </View>
    );

    return (
        <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.sectionTitle}>Paramètres d'itinéraire</Text>

            {isAuthenticated ? (
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

                    <View style={styles.sliderContainer}>
                        <Text style={styles.sliderLabel}>
                            Distance d'alerte de proximité: {formatDistance(navPreferences.proximityAlertDistance)}
                        </Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={MIN_ALERT_DISTANCE}
                            maximumValue={MAX_ALERT_DISTANCE}
                            step={ALERT_DISTANCE_STEP}
                            value={navPreferences.proximityAlertDistance}
                            onValueChange={handleProximityAlertDistanceChange}
                            minimumTrackTintColor="#2196F3"
                            maximumTrackTintColor="#cccccc"
                            thumbTintColor="#2196F3"
                        />
                        <View style={styles.sliderLabelsContainer}>
                            <Text style={styles.sliderMinMaxLabel}>{formatDistance(MIN_ALERT_DISTANCE)}</Text>
                            <Text style={styles.sliderMinMaxLabel}>{formatDistance(MAX_ALERT_DISTANCE)}</Text>
                        </View>
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

                    {updateError && <Text style={styles.errorText}>{updateError}</Text>}
                </View>
            ) : (
                <View style={styles.card}>
                    <LoginRequiredMessage />
                </View>
            )}

            <Text style={styles.sectionTitle}>Lieux favoris</Text>
            {isAuthenticated ? (
                <FavoriteLocationsManager />
            ) : (
                <View style={styles.card}>
                    <LoginRequiredMessage />
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
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    sliderLabel: {
        fontSize: 16,
        color: "#333",
        marginBottom: 8,
    },
    slider: {
        width: "100%",
        height: 40,
    },
    sliderLabelsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 8,
        marginTop: -5,
    },
    sliderMinMaxLabel: {
        fontSize: 12,
        color: "#888",
    },
    infoText: {
        fontSize: 14,
        color: "#888",
        fontStyle: "italic",
        padding: 10,
        textAlign: "center",
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
    loginRequiredContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    loginRequiredText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#555",
        marginTop: 12,
    },
    loginRequiredSubtext: {
        fontSize: 14,
        color: "#888",
        textAlign: "center",
        marginTop: 8,
    },
});

export default SettingsScreen;