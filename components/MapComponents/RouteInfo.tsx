import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Step } from "../../types";
import Animated, {
    useAnimatedStyle,
    interpolate,
    SharedValue,
} from "react-native-reanimated";
import { routeInfoStyles } from "../../styles/styles";

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

    const animatedStyle = useAnimatedStyle(() => {
        return {
            maxHeight: interpolate(stepsAnimation.value, [0, 1], [0, 300]),
            overflow: "hidden",
            marginTop: 10,
            pointerEvents: showSteps ? 'auto' : 'none',
        };
    });

    const renderStep = (step: Step, index: number) => {
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
            distanceText = String(step.distance);
        }

        return (
            <View key={index} style={routeInfoStyles.stepItem}>
                {step.maneuver && (
                    <MaterialIcons
                        name={
                            getManeuverIcon(
                                step.maneuver
                            ) as keyof typeof MaterialIcons.glyphMap
                        }
                        size={24}
                        color="#2196F3"
                        style={routeInfoStyles.stepIcon}
                    />
                )}
                <View style={routeInfoStyles.stepTextContainer}>
                    <Text style={routeInfoStyles.stepInstruction}>
                        {instruction}
                    </Text>
                    <Text style={routeInfoStyles.stepDistance}>
                        {distanceText}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={routeInfoStyles.routeInfoContainer}>
            <TouchableOpacity
                style={routeInfoStyles.routeInfoHeader}
                onPress={onToggleSteps}
                activeOpacity={0.7}
            >
                <View>
                    <Text style={routeInfoStyles.routeInfoTitle}>
                        Durée: {routeSummary.duration}
                    </Text>
                    <Text style={routeInfoStyles.routeInfoSubtitle}>
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
                <ScrollView
                    style={{ height: 300 }}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    pointerEvents="auto"
                >
                    {routeInfo?.steps.map((step, index) =>
                        renderStep(step, index)
                    )}
                </ScrollView>
            </Animated.View>
        </View>
    );
};
