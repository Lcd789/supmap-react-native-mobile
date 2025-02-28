import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Step } from "../../types";
import Animated, {
    useAnimatedStyle,
    interpolate,
    SharedValue,
} from "react-native-reanimated";

interface RouteInfoProps {
    routeSummary: {
        duration: string;
        distance: string;
    };
    routeInfo: {
        steps: Step[];
    } | null;
    showSteps: boolean;
    stepsAnimation: SharedValue<number>;
    onToggleSteps: () => void;
}

export const RouteInfo: React.FC<RouteInfoProps> = ({
    routeSummary,
    routeInfo,
    showSteps,
    stepsAnimation,
    onToggleSteps,
}) => {
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

    // Créer un style animé qui utilise la valeur partagée de stepsAnimation
    const animatedStyle = useAnimatedStyle(() => {
        return {
            maxHeight: interpolate(stepsAnimation.value, [0, 1], [0, 300]),
            overflow: "hidden",
            marginTop: 10,
        };
    });

    const renderStep = (step: Step, index: number) => {
        // Gestion flexible des différentes structures possibles de step
        const instruction =
            typeof step.html_instructions === "string"
                ? step.html_instructions.replace(/<[^>]*>/g, "")
                : step.instruction || "Étape " + (index + 1);

        let distanceText = "";

        if (typeof step.distance === "object" && step.distance?.text) {
            distanceText = step.duration?.text
                ? `${step.distance.text} - ${step.duration.text}`
                : step.distance.text;
        } else if (
            typeof step.distance === "string" ||
            typeof step.distance === "number"
        ) {
            // Conversion explicite en chaîne de caractères
            distanceText = String(step.distance);
        }

        return (
            <View key={index} style={styles.stepItem}>
                {step.maneuver && (
                    <MaterialIcons
                        name={
                            getManeuverIcon(
                                step.maneuver
                            ) as keyof typeof MaterialIcons.glyphMap
                        }
                        size={24}
                        color="#2196F3"
                        style={styles.stepIcon}
                    />
                )}
                <View style={styles.stepTextContainer}>
                    <Text style={styles.stepInstruction}>{instruction}</Text>
                    <Text style={styles.stepDistance}>{distanceText}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.routeInfoContainer}>
            <TouchableOpacity
                style={styles.routeInfoHeader}
                onPress={onToggleSteps}
                activeOpacity={0.7}
            >
                <View>
                    <Text style={styles.routeInfoTitle}>
                        Durée: {routeSummary.duration}
                    </Text>
                    <Text style={styles.routeInfoSubtitle}>
                        Distance: {routeSummary.distance}
                    </Text>
                </View>
                <MaterialIcons
                    name={showSteps ? "expand-less" : "expand-more"}
                    size={24}
                    color="#2196F3"
                />
            </TouchableOpacity>

            <Animated.View style={animatedStyle}>
                <ScrollView>
                    {routeInfo?.steps.map((step, index) =>
                        renderStep(step, index)
                    )}
                </ScrollView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    routeInfoContainer: {
        backgroundColor: "white",
        borderRadius: 8,
        padding: 15,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    routeInfoHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    routeInfoTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    routeInfoSubtitle: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
    },
    stepItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
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
        color: "#666",
        marginTop: 4,
    },
});
