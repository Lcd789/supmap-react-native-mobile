import { StyleSheet } from "react-native";
import { Image } from "expo-image";
import { imageViewerStyles } from "../styles/globalStyles";

type Props = {
    imgSource: string
}

export default function ImageViewer({imgSource}: Props) {
    return (
        <Image source={{uri: imgSource}} style={imageViewerStyles.imageContainer}/>
    );
}
