import { Pressable, View, Text, StyleSheet } from "react-native";


type ButtonProps = {
    text: string;
    onPress?: () => void;
}


export default function Button ({text, onPress}: {text: string, onPress?: () => void}) {
    return (
        <View style={styles.buttonContainer}>
            <Pressable onPress={onPress}>
                <Text style={styles.buttonLabel}>{text}</Text>
            </Pressable>
                
        </View>
    ) 
}

const styles = StyleSheet.create({
    buttonContainer: {
        width: 320,
        height: 68,
        marginHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
        padding: 3,
    },
    button: {
        borderRadius: 10,
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
    },
    buttonIcon: {
        paddingRight: 10,
    },
    buttonLabel: {
        color: "white",
        fontSize: 16,
    }
});