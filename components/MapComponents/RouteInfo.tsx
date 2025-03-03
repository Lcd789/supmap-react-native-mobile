import React from 'react';
import { View, Text, TouchableOpacity, Animated, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
<<<<<<< Updated upstream
import { Step } from '../../types';
=======
<<<<<<< Updated upstream
import { Step } from "../../types";
import Animated, {
    useAnimatedStyle,
    interpolate,
    SharedValue,
} from "react-native-reanimated";
=======
import { Step } from '../../types';
import { routeInfoStyles } from "../../styles/globalStyles";
>>>>>>> Stashed changes
>>>>>>> Stashed changes

interface RouteInfoProps {
    routeSummary: {
        duration: string;
        distance: string;
    };
    routeInfo: {
        steps: Step[];
    } | null;
    showSteps: boolean;
    stepsAnimation: Animated.Value;
    onToggleSteps: () => void;
}

export const RouteInfo: React.FC<RouteInfoProps> = ({
    routeSummary,
    routeInfo,
    showSteps,
    stepsAnimation,
    onToggleSteps
}) => {

    const getManeuverIcon = (maneuver: string): string => {
        const icons: { [key: string]: string } = {
            "turn-right": "turn-right",
            "turn-left": "turn-left",
            "straight": "straight",
            "roundabout-right": "rotate-right",
            "roundabout-left": "rotate-left",
            "uturn-right": "u-turn-right",
            "uturn-left": "u-turn-left",
        };
        return icons[maneuver] || "arrow-forward";
    };


<<<<<<< Updated upstream
    const renderStep = (step: Step, index: number) => (
        <View key={index} style={styles.stepItem}>
=======
<<<<<<< Updated upstream
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
=======
    const renderStep = (step: Step, index: number) => (
        <View key={index} style={routeInfoStyles.stepItem}>
>>>>>>> Stashed changes
            {step.maneuver && (
                <MaterialIcons
                    name={getManeuverIcon(step.maneuver) as keyof typeof MaterialIcons.glyphMap}
                    size={24}
                    color="#2196F3"
<<<<<<< Updated upstream
                    style={styles.stepIcon}
                />
            )}
            <View style={styles.stepTextContainer}>
                <Text style={styles.stepInstruction}>
                    {step.html_instructions.replace(/<[^>]*>/g, '')}
                </Text>
                <Text style={styles.stepDistance}>
                    {step.distance.text} - {step.duration.text}
                </Text>
=======
                    style={routeInfoStyles.stepIcon}
                />
            )}
            <View style={routeInfoStyles.stepTextContainer}>
                <Text style={routeInfoStyles.stepInstruction}>
                    {step.html_instructions.replace(/<[^>]*>/g, '')}
                </Text>
                <Text style={routeInfoStyles.stepDistance}>
                    {step.distance.text} - {step.duration.text}
                </Text>
>>>>>>> Stashed changes
>>>>>>> Stashed changes
            </View>
        </View>
    );

    return (
<<<<<<< Updated upstream
        <TouchableOpacity
            style={styles.routeInfoContainer}
            onPress={onToggleSteps}
        >
            <View style={styles.routeInfoHeader}>
=======
<<<<<<< Updated upstream
        <View style={styles.routeInfoContainer}>
            <TouchableOpacity
                style={styles.routeInfoHeader}
                onPress={onToggleSteps}
                activeOpacity={0.7}
            >
=======
        <TouchableOpacity
            style={routeInfoStyles.routeInfoContainer}
            onPress={onToggleSteps}
        >
            <View style={routeInfoStyles.routeInfoHeader}>
>>>>>>> Stashed changes
>>>>>>> Stashed changes
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
            </View>

<<<<<<< Updated upstream
            <Animated.View
                style={[
                    styles.stepsContainer,
=======
<<<<<<< Updated upstream
            <Animated.View style={animatedStyle}>
=======
            <Animated.View
                style={[
                    routeInfoStyles.stepsContainer,
>>>>>>> Stashed changes
                    {
                        maxHeight: stepsAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 300]
                        })
                    }
                ]}
            >
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
>>>>>>> Stashed changes
                <ScrollView>
                    {routeInfo?.steps.map((step, index) => renderStep(step, index))}
                </ScrollView>
            </Animated.View>
        </TouchableOpacity>
    );
};
<<<<<<< Updated upstream

const styles = StyleSheet.create({

    routeInfoContainer: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 15,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    routeInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    routeInfoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    routeInfoSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    stepsContainer: {
        overflow: 'hidden',
        marginTop: 10,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
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
        color: '#666',
        marginTop: 4,
    },
<<<<<<< Updated upstream
});
=======
});
=======
>>>>>>> Stashed changes
>>>>>>> Stashed changes
