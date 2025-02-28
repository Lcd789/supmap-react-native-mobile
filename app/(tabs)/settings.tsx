import React, { useState } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    interpolate,
    runOnJS,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";

export default function Settings() {
    const [isExpanded, setIsExpanded] = useState(true);

    // Animation values
    const animationProgress = useSharedValue(1);

    // Position and size animations
    const buttonAnimatedStyle = useAnimatedStyle(() => {
        return {
            width: interpolate(animationProgress.value, [0, 1], [50, 180]),
            height: interpolate(animationProgress.value, [0, 1], [50, 50]),
            borderRadius: interpolate(animationProgress.value, [0, 1], [25, 8]),
            transform: [
                {
                    translateX: interpolate(
                        animationProgress.value,
                        [0, 1],
                        [140, 0]
                    ),
                },
                {
                    translateY: interpolate(
                        animationProgress.value,
                        [0, 1],
                        [-180, 0]
                    ),
                },
            ],
        };
    });

    // Text opacity animation
    const textAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: animationProgress.value,
            transform: [
                {
                    translateX: interpolate(
                        animationProgress.value,
                        [0, 1],
                        [-40, 0]
                    ),
                },
            ],
        };
    });

    // Icon animation
    const iconAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                animationProgress.value,
                [0, 0.8, 1],
                [1, 0, 0]
            ),
            transform: [
                {
                    scale: interpolate(
                        animationProgress.value,
                        [0, 0.5],
                        [1, 0.5]
                    ),
                },
            ],
        };
    });

    // Animation function
    const toggleAnimation = () => {
        const newValue = isExpanded ? 0 : 1;

        animationProgress.value = withTiming(
            newValue,
            {
                duration: 600,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            },
            () => {
                runOnJS(setIsExpanded)(!isExpanded);
            }
        );
    };

    return (
        <View style={styles.container}>
            {isExpanded && <Text style={styles.title}>Mon Application</Text>}

            <Pressable onPress={toggleAnimation}>
                <Animated.View style={[styles.button, buttonAnimatedStyle]}>
                    <Animated.Text
                        style={[styles.buttonText, textAnimatedStyle]}
                    >
                        Chercher
                    </Animated.Text>
                    <Animated.View
                        style={[styles.iconContainer, iconAnimatedStyle]}
                    >
                        <MaterialIcons name="map" size={24} color="white" />
                    </Animated.View>
                </Animated.View>
            </Pressable>

            {isExpanded && (
                <View style={styles.content}>
                    <Text style={styles.text}>
                        Contenu principal de l'application
                    </Text>
                    <Text style={styles.text}>
                        Appuyez sur "Chercher" pour réduire
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#25292e",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
        marginBottom: 30,
    },
    text: {
        color: "white",
        marginVertical: 5,
        textAlign: "center",
    },
    content: {
        marginTop: 30,
        alignItems: "center",
    },
    button: {
        backgroundColor: "#007AFF",
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 20,
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    iconContainer: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
    },
});
