import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Step } from "../../types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from 'expo-speech';
import { useTheme } from "@/utils/ThemeContext";

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
    const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);

    useEffect(() => {
        if (isVoiceEnabled && nextStep && nextStep.html_instructions) {
            const instruction = nextStep.html_instructions.replace(/<[^>]*>/g, " ");
            Speech.stop();
            Speech.speak(instruction, {
                language: 'fr-FR',
                pitch: 1.1,
                rate: 1.1,
            });
        }
    }, [nextStep, isVoiceEnabled]);
    
    const toggleVoice = () => {
        setIsVoiceEnabled(prev => !prev);
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
            if (distance < 1) {
                return `${Math.round(distance * 1000)} m`;
            }
            return `${distance} km`;
        }
        return distance;
    };

    if (!nextStep) return null;

    const instruction =
        typeof nextStep.html_instructions === "string"
            ? nextStep.html_instructions.replace(/<[^>]*>/g, " ")
            : "Étape suivante";

    let distanceText = "";

    if (typeof nextStep.distance === "object" && nextStep.distance?.text) {
        distanceText = nextStep.duration?.text
            ? `${nextStep.distance.text} - ${nextStep.duration.text}`
            : nextStep.distance.text;
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
                { backgroundColor, paddingTop: insets.top + 8 }
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
                    <Text style={[styles.stepInstruction, { color: textColor }]}>
                        {instruction}
                    </Text>
                    <Text style={[styles.stepDistance, { color: textColor }]}>
                        {distanceText}
                    </Text>
                </View>
                <TouchableOpacity onPress={toggleVoice} style={styles.voiceButton}>
                    <MaterialIcons
                        name={isVoiceEnabled ? "volume-up" : "volume-off"}
                        size={28}
                        color={isVoiceEnabled ? "#2196F3" : "#888"}
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
});
