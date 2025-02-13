import { StyleSheet } from "react-native";
import { Image } from "expo-image";

type Props = {
    imgSource: string
}

export default function ImageViewer({imgSource}: Props) {
    return (
        <Image source={{uri: imgSource}} style={styles.imageContainer}/>
    );
}

const styles = StyleSheet.create({
    imageContainer: {
        justifyContent: "center",
        alignItems: "center",
        width: 100,
        height: 100,
        borderRadius: 100 // circle
    }
});