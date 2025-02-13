import { ScrollView, Text, View, StyleSheet} from "react-native";
import * as ImageSelector from "expo-image-picker";
import Button from "../../components/Button";
import ImageViewer from "../../components/ImageViewer";
import { useState } from "react";


const DefaultProfileImage = require("../../assets/images/default-profile.png");

export default function Profile() {
    const [selectedImage, setSelectedImage] = useState<string | undefined>(
        undefined
    );

    const pickImageAsync = async () => {
            let result = await ImageSelector.launchImageLibraryAsync({
                allowsEditing: true,
                quality: 1,
                // [x,y] aspect ratio
                aspect: [1, 1],
            });
    
            if (!result.canceled) {
                console.log(result.assets[0].uri);
                setSelectedImage(result.assets[0].uri);
            } else {
                alert("No image selected");
            }
        };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.imageContainer}>
                <ImageViewer imgSource={selectedImage || DefaultProfileImage}/>
            </View>
            <View style={styles.footerContainer}>
                <Button 
                    onPress={pickImageAsync} 
                    text="Pick Image" 
                />
                <Button text="Use this Image"/>
            </View>
        </ScrollView>
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

    footerContainer: {
        flex: 1 / 3,
        alignItems: "center",
        backgroundColor: "#FF0000",
    },
});