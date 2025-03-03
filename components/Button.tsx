import { Pressable, View, Text, StyleSheet } from "react-native";
import { buttonStyles } from "../styles/globalStyles";


type ButtonProps = {
    text: string;
    onPress?: () => void;
}


export default function Button ({text, onPress}: {text: string, onPress?: () => void}) {
    return (
        <View style={buttonStyles.buttonContainer}>
            <Pressable onPress={onPress}>
                <Text style={buttonStyles.buttonLabel}>{text}</Text>
            </Pressable>
                
        </View>
    ) 
}
