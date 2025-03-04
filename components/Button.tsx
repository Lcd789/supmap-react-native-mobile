import { Pressable, View, Text } from "react-native";
import { buttonStyles } from "../styles/styles";

type ButtonProps = {
  text: string;
  onPress?: () => void;
};

export default function Button({ text, onPress }: ButtonProps) {
  return (
    <View style={buttonStyles.buttonContainer}>
      <Pressable onPress={onPress}>
        <Text style={buttonStyles.buttonLabel}>{text}</Text>
      </Pressable>
    </View>
  );
}
