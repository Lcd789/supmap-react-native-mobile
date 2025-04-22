import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Step } from "../../types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import { useTheme } from "@/utils/ThemeContext";
import { useSettings } from "@/hooks/user/SettingsContext";

interface NextStepBannerProps {
    nextStep: Step | null;
    onToggleSteps: () => void;
}

export const NextStepBanner: React.FC<NextStepBannerProps> = ({
    nextStep,
    onToggleSteps,
}) => {
    const insets = useSafeAreaInsets();
    const { darkMode } = useTheme();
    const { voiceGuidance, setVoiceGuidance, unitsMetric } = useSettings();

    useEffect(() => {
        setVoiceGuidance(voiceGuidance);
    }, [voiceGuidance]);

    useEffect(() => {
        if (voiceGuidance && nextStep && nextStep.html_instructions) {
            const instruction = nextStep.html_instructions.replace(
                /<[^>]*>/g,
                " "
            );
            console.log("🔊 Nouvelle instruction vocale :", instruction);
            Speech.stop();
            Speech.speak(instruction, {
                language: "fr-FR",
                pitch: 1.1,
                rate: 1.1,
            });
        }
    }, [nextStep, voiceGuidance]);

    const toggleVoice = () => {
        setVoiceGuidance(!voiceGuidance);
        Speech.stop();
    };

    const getManeuverIcon = (maneuver: string): string => {
        const icons: { [key: string]: string } = {
            "turn-right": "turn-right",
            "turn-left": "turn-left",
            straight: "straight",
            "roundabout-right": "rotate-right",
            "roundabout-left": "rotate-left",
            "uturn-right": "u-turn-right",
            "uturn-left": "u-turn-left",
        };
        return icons[maneuver] || "arrow-forward";
    };

    const convertDistance = (distance: string | number): string => {
        if (typeof distance === "number") {
            if (unitsMetric) {
                // Format métrique
                if (distance < 1) {
                    return `${Math.round(distance * 1000)} m`;
                }
                return `${distance} km`;
            } else {
                // Format impérial
                const miles = distance * 0.621371;
                if (miles < 0.1) {
                    return `${Math.round(miles * 5280)} pieds`;
                }
                return `${miles.toFixed(1)} miles`;
            }
        }
        return distance;
    };

    if (!nextStep) {
        return (
            <View
                style={[
                    styles.arrivalContainer,
                    {
                        backgroundColor: darkMode ? "#333" : "#fff",
                        paddingTop: insets.top + 8,
                    },
                ]}
            >
                <Text
                    style={{ color: darkMode ? "#fff" : "#000", fontSize: 16 }}
                >
                    🎉 Vous êtes arrivé à destination !
                </Text>
            </View>
        );
    }

    const instruction =
        typeof nextStep.html_instructions === "string"
            ? nextStep.html_instructions.replace(/<[^>]*>/g, " ")
            : "Étape suivante";

    const durationSeconds = nextStep.duration?.value ?? 0;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const timeText =
        minutes > 0
            ? `${minutes} min${seconds > 0 ? ` ${seconds}s` : ""}`
            : `${seconds}s`;

    let distanceText = "";
    if (
        typeof nextStep.distance === "object" &&
        nextStep.distance?.value !== undefined
    ) {
        const meters = nextStep.distance.value;
        distanceText =
            meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;
    } else if (
        typeof nextStep.distance === "string" ||
        typeof nextStep.distance === "number"
    ) {
        distanceText = convertDistance(nextStep.distance);
    }

    const backgroundColor = darkMode ? "#333" : "#fff";
    const textColor = darkMode ? "#fff" : "#000";

    return (
        <TouchableOpacity
            style={[
                styles.bannerContainer,
                { backgroundColor, paddingTop: insets.top + 8 },
            ]}
            onPress={onToggleSteps}
        >
            <View style={styles.bannerContent}>
                {nextStep.maneuver && (
                    <MaterialIcons
                        name={
                            getManeuverIcon(
                                nextStep.maneuver
                            ) as keyof typeof MaterialIcons.glyphMap
                        }
                        size={72}
                        color="#2196F3"
                        style={styles.stepIcon}
                    />
                )}
                <View style={styles.stepTextContainer}>
                    <Text
                        style={[styles.stepInstruction, { color: textColor }]}
                    >
                        {" "}
                        {instruction}{" "}
                    </Text>
                    <Text style={[styles.stepDistance, { color: textColor }]}>
                        {" "}
                        {distanceText} • {timeText}{" "}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={toggleVoice}
                    style={styles.voiceButton}
                >
                    <MaterialIcons
                        name={voiceGuidance ? "volume-up" : "volume-off"}
                        size={28}
                        color={voiceGuidance ? "#2196F3" : "#888"}
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        paddingHorizontal: 8,
        paddingBottom: 8,
        zIndex: 1000,
    },
    bannerContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    stepIcon: {
        marginRight: 10,
    },
    stepTextContainer: {
        flex: 1,
    },
    stepInstruction: {
        fontSize: 14,
    },
    stepDistance: {
        fontSize: 12,
        marginTop: 4,
    },
    voiceButton: {
        padding: 8,
    },
    arrivalContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 8,
        paddingBottom: 8,
        zIndex: 1000,
        alignItems: "center",
    },
});
