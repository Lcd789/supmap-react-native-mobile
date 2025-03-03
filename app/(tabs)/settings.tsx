<<<<<<< Updated upstream
import { Text, View, StyleSheet } from "react-native";
=======
<<<<<<< Updated upstream
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
=======
import { Text, View, StyleSheet } from "react-native";
import { settingsStyles } from "@/styles/globalStyles";
>>>>>>> Stashed changes
>>>>>>> Stashed changes

export default function Settings() {
    return (
<<<<<<< Updated upstream
        <View style={styles.container}>
            <Text style={styles.text}>Settings</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#25292e",
    },
    text: {
        color: "white",
    },
    imageContainer: {
        flex: 1,
    },
});
=======
        <View style={settingsStyles.container}>
            <Text style={settingsStyles.text}>Settings</Text>
        </View>
    );
}
>>>>>>> Stashed changes
