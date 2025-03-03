import React from 'react';
import { View, Text, TouchableOpacity, Animated, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import { Step } from '../../types';

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


    const renderStep = (step: Step, index: number) => (
        <View key={index} style={styles.stepItem}>
            {step.maneuver && (
                <MaterialIcons
                    name={getManeuverIcon(step.maneuver) as keyof typeof MaterialIcons.glyphMap}
                    size={24}
                    color="#2196F3"
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
            </View>
        </View>
    );

    return (
        <TouchableOpacity
            style={styles.routeInfoContainer}
            onPress={onToggleSteps}
        >
            <View style={styles.routeInfoHeader}>
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
            </View>

            <Animated.View
                style={[
                    styles.stepsContainer,
                    {
                        maxHeight: stepsAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 300]
                        })
                    }
                ]}
            >
                <ScrollView>
                    {routeInfo?.steps.map((step, index) => renderStep(step, index))}
                </ScrollView>
            </Animated.View>
        </TouchableOpacity>
    );
};

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
});