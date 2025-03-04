import { Image } from "expo-image";
import { imageViewerStyles } from "../styles/styles";

type Props = {
  imgSource: string;
};

export default function ImageViewer({ imgSource }: Props) {
  return (
    <Image source={{ uri: imgSource }} style={imageViewerStyles.imageContainer} />
  );
}
