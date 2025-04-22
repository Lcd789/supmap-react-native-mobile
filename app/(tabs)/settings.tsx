import React, { useState } from "react";
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
import { useTheme } from "@/utils/ThemeContext";
import { useSettings } from "@/hooks/user/SettingsContext";
import { useAuth } from "@/hooks/user/AuthContext";
import { useHistory } from "@/hooks/useHistory";
import Slider from "@react-native-community/slider";

const SettingsScreen = () => {
    const insets = useSafeAreaInsets();
    const { darkMode, toggleDarkMode } = useTheme();
    const { isAuthenticated } = useAuth();
    const { clearHistory } = useHistory();
    const [isClearing, setIsClearing] = useState(false);
    const {
        // Paramètres de route
        avoidTolls,
        setAvoidTolls,
        avoidHighways,
        setAvoidHighways,

        // Paramètres d'affichage
        showTraffic,
        setShowTraffic,

        // Paramètres de guidage
        voiceGuidance,
        setVoiceGuidance,
        unitsMetric,
        setUnitsMetric,

        // Paramètres de recherche
        enableEventSearch,
        setEnableEventSearch,
        eventSearchDistance,
        setEventSearchDistance,
        enableUserSearch,
        setEnableUserSearch,
        userSearchDistance,
        setUserSearchDistance,

        // Utilitaires
        isSettingsLoading,
    } = useSettings();

    // Fonction pour formatter la distance (mètres à km si > 1000)
    const formatDistance = (distance: number) => {
        if (distance >= 1000) {
            return `${(distance / 1000).toFixed(1)} km`;
        }
        return `${distance} m`;
    };

    // Fonction pour confirmer la suppression de l'historique
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
                        } catch (error) {
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

    if (isSettingsLoading) {
        return (
            <View
                style={[
                    styles.loadingContainer,
                    { paddingTop: insets.top },
                    darkMode && styles.containerDark,
                ]}
            >
                <ActivityIndicator
                    size="large"
                    color={darkMode ? "#fff" : "#333"}
                />
                <Text
                    style={[
                        styles.loadingText,
                        darkMode && styles.loadingTextDark,
                    ]}
                >
                    Chargement des paramètres...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={[
                styles.container,
                { paddingTop: insets.top },
                darkMode && styles.containerDark,
            ]}
        >
            <Text
                style={[
                    styles.sectionTitle,
                    darkMode && styles.sectionTitleDark,
                ]}
            >
                Paramètres d'itinéraire
            </Text>

            <View style={[styles.card, darkMode && styles.cardDark]}>
                <View style={styles.optionRow}>
                    <Text
                        style={[
                            styles.optionLabel,
                            darkMode && styles.optionLabelDark,
                        ]}
                    >
                        Éviter les péages
                    </Text>
                    <Switch value={avoidTolls} onValueChange={setAvoidTolls} />
                </View>

                <View style={styles.optionRow}>
                    <Text
                        style={[
                            styles.optionLabel,
                            darkMode && styles.optionLabelDark,
                        ]}
                    >
                        Éviter les autoroutes
                    </Text>
                    <Switch
                        value={avoidHighways}
                        onValueChange={setAvoidHighways}
                    />
                </View>
            </View>

            <Text
                style={[
                    styles.sectionTitle,
                    darkMode && styles.sectionTitleDark,
                ]}
            >
                Affichage
            </Text>

            <View style={[styles.card, darkMode && styles.cardDark]}>
                <View style={styles.optionRow}>
                    <Text
                        style={[
                            styles.optionLabel,
                            darkMode && styles.optionLabelDark,
                        ]}
                    >
                        Mode sombre
                    </Text>
                    <Switch value={darkMode} onValueChange={toggleDarkMode} />
                </View>

                <View style={styles.optionRow}>
                    <Text
                        style={[
                            styles.optionLabel,
                            darkMode && styles.optionLabelDark,
                        ]}
                    >
                        Afficher le trafic
                    </Text>
                    <Switch
                        value={showTraffic}
                        onValueChange={setShowTraffic}
                    />
                </View>
            </View>

            <Text
                style={[
                    styles.sectionTitle,
                    darkMode && styles.sectionTitleDark,
                ]}
            >
                Guidage
            </Text>

            <View style={[styles.card, darkMode && styles.cardDark]}>
                <View style={styles.optionRow}>
                    <Text
                        style={[
                            styles.optionLabel,
                            darkMode && styles.optionLabelDark,
                        ]}
                    >
                        Guidage vocal
                    </Text>
                    <Switch
                        value={voiceGuidance}
                        onValueChange={setVoiceGuidance}
                    />
                </View>

                <View style={styles.optionRow}>
                    <Text
                        style={[
                            styles.optionLabel,
                            darkMode && styles.optionLabelDark,
                        ]}
                    >
                        Unités métriques
                    </Text>
                    <Switch
                        value={unitsMetric}
                        onValueChange={setUnitsMetric}
                    />
                </View>
            </View>

            <Text
                style={[
                    styles.sectionTitle,
                    darkMode && styles.sectionTitleDark,
                ]}
            >
                Recherche
            </Text>

            <View style={[styles.card, darkMode && styles.cardDark]}>
                <View style={styles.optionRow}>
                    <Text
                        style={[
                            styles.optionLabel,
                            darkMode && styles.optionLabelDark,
                            !isAuthenticated && styles.disabledText,
                        ]}
                    >
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
                        <View style={styles.sliderRow}>
                            <Text
                                style={[
                                    styles.sliderLabel,
                                    darkMode && styles.sliderLabelDark,
                                ]}
                            >
                                Distance de recherche:{" "}
                                <Text style={styles.distanceValue}>
                                    {formatDistance(eventSearchDistance)}
                                </Text>
                            </Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={100}
                            maximumValue={5000}
                            step={100}
                            value={eventSearchDistance}
                            onValueChange={setEventSearchDistance}
                            minimumTrackTintColor={
                                darkMode ? "#3498db" : "#2980b9"
                            }
                            maximumTrackTintColor={darkMode ? "#555" : "#ccc"}
                            thumbTintColor={darkMode ? "#3498db" : "#2980b9"}
                        />
                    </View>
                )}

                <View
                    style={[
                        styles.optionRow,
                        !isAuthenticated && { opacity: 0.5 },
                    ]}
                >
                    <Text
                        style={[
                            styles.optionLabel,
                            darkMode && styles.optionLabelDark,
                            !isAuthenticated && styles.disabledText,
                        ]}
                    >
                        Rechercher des utilisateurs
                    </Text>
                    <Switch
                        value={enableUserSearch}
                        onValueChange={setEnableUserSearch}
                        disabled={!isAuthenticated}
                    />
                </View>

                {isAuthenticated && enableUserSearch && (
                    <View style={styles.sliderContainer}>
                        <View style={styles.sliderRow}>
                            <Text
                                style={[
                                    styles.sliderLabel,
                                    darkMode && styles.sliderLabelDark,
                                ]}
                            >
                                Distance de recherche:{" "}
                                <Text style={styles.distanceValue}>
                                    {formatDistance(userSearchDistance)}
                                </Text>
                            </Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={100}
                            maximumValue={5000}
                            step={100}
                            value={userSearchDistance}
                            onValueChange={setUserSearchDistance}
                            minimumTrackTintColor={
                                darkMode ? "#3498db" : "#2980b9"
                            }
                            maximumTrackTintColor={darkMode ? "#555" : "#ccc"}
                            thumbTintColor={darkMode ? "#3498db" : "#2980b9"}
                        />
                    </View>
                )}

                {!isAuthenticated && (
                    <Text
                        style={[
                            styles.infoText,
                            darkMode && styles.infoTextDark,
                        ]}
                    >
                        Connectez-vous pour activer les options de recherche.
                    </Text>
                )}
            </View>

            <Text
                style={[
                    styles.sectionTitle,
                    darkMode && styles.sectionTitleDark,
                ]}
            >
                Données
            </Text>

            <View style={[styles.card, darkMode && styles.cardDark]}>
                <TouchableOpacity
                    style={styles.buttonContainer}
                    onPress={handleClearHistory}
                    disabled={isClearing}
                >
                    {isClearing ? (
                        <ActivityIndicator
                            size="small"
                            color={darkMode ? "#ff6b6b" : "#e74c3c"}
                        />
                    ) : (
                        <Text
                            style={[
                                styles.buttonText,
                                darkMode && styles.buttonTextDark,
                            ]}
                        >
                            Effacer l'historique de navigation
                        </Text>
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
    containerDark: {
        backgroundColor: "#1e1e1e",
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
    loadingTextDark: {
        color: "#f5f5f5",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e1e1e",
        marginTop: 20,
        marginBottom: 10,
    },
    sectionTitleDark: {
        color: "#f5f5f5",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 3,
        marginBottom: 16,
    },
    cardDark: {
        backgroundColor: "#333",
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
    optionLabelDark: {
        color: "#f5f5f5",
    },
    disabledText: {
        color: "#888",
    },
    sliderContainer: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    sliderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 5,
        marginBottom: 5,
    },
    sliderLabel: {
        fontSize: 14,
        color: "#555",
    },
    sliderLabelDark: {
        color: "#ccc",
    },
    distanceValue: {
        fontWeight: "bold",
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
    infoTextDark: {
        color: "#aaa",
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
    buttonTextDark: {
        color: "#ff6b6b",
    },
});

export default SettingsScreen;
