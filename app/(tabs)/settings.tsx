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
import { useSettings } from "@/hooks/user/SettingsContext";
import { useAuth } from "@/hooks/user/AuthContext";
import { useHistory } from "@/hooks/useHistory";
import Slider from "@react-native-community/slider";

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

    if (isSettingsLoading) {
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
                <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>Éviter les péages</Text>
                    <Switch value={avoidTolls} onValueChange={setAvoidTolls} />
                </View>

                <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>Éviter les autoroutes</Text>
                    <Switch value={avoidHighways} onValueChange={setAvoidHighways} />
                </View>
            </View>

            <Text style={styles.sectionTitle}>Affichage</Text>

            <View style={styles.card}>
                <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>Afficher le trafic</Text>
                    <Switch value={showTraffic} onValueChange={setShowTraffic} />
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
                        onValueChange={setEnableUserSearch}
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
                            onValueChange={setUserSearchDistance}
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
                <TouchableOpacity style={styles.buttonContainer} onPress={handleClearHistory} disabled={isClearing}>
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
});

export default SettingsScreen;
