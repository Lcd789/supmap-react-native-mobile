import {
    ScrollView,
    Text,
    View,
    StyleSheet,
    TextInput,
    Alert,
} from "react-native";
import * as ImageSelector from "expo-image-picker";
import { useState, useEffect } from "react";
import { LogOutIcon, Pencil, Save, Trash2 } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { getUserData, deleteProfile } from "@/hooks/user/UserHooks";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
<<<<<<< Updated upstream
=======
<<<<<<< Updated upstream
import { useAuth } from "@/hooks/user/AuthContext";

=======
import { profileStyles } from "../../styles/globalStyles";
>>>>>>> Stashed changes
>>>>>>> Stashed changes

const DefaultProfileImage = require("../../assets/images/default-profile.png");

export default function Profile() {
    const router = useRouter();
    // États pour les données utilisateur
    const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [profileImage, setProfileImage] = useState<string | undefined>(undefined);

    // État temporaire pour stocker les valeurs pendant l'édition
    const [tempUsername, setTempUsername] = useState(username);
    const [tempEmail, setTempEmail] = useState(email);

    useEffect(() => {
        async function fetchUserData() {
            const userData = await getUserData();
            console.log(userData);
            if (userData) {
                setUsername(userData.username || "");
                setEmail(userData.email || "");
                setTempUsername(userData.username || "");
                setTempEmail(userData.email || "");
                setProfileImage(userData.profileImage || undefined);
            }
        }

        fetchUserData();
    }, []);

    const pickImageAsync = async () => {
        let result = await ImageSelector.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 1,
            aspect: [1, 1],
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
            setHasChanges(true);
        }
    };

    const handleSave = () => {
        // Ici, vous implementerez la logique pour sauvegarder les changements
        setUsername(tempUsername);
        setEmail(tempEmail);
        setHasChanges(false);
        Alert.alert("Succès", "Profil mis à jour avec succès");
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            "Confirmation",
            "Voulez-vous vraiment supprimer votre profil ?",
            [
                {
                    text: "Annuler",
                    style: "cancel",
                },
                {
                    text: "Supprimer",
                    onPress: async () => {
                        try {
                            await deleteProfile();
                            Alert.alert(
                                "Profil supprimé",
                                "Votre profil a été supprimé avec succès."
                            );
                            // Réinitialisation après suppression
                            setUsername("");
                            setEmail("");
                            setProfileImage(undefined);
                            setSelectedImage(undefined);
                            await SecureStore.deleteItemAsync("authToken");
                            router.replace("/login");
                        } catch (error) {
                            Alert.alert(
                                "Erreur",
                                "La suppression du profil a échoué. Veuillez réessayer."
                            );
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync("authToken");
        router.replace("/(tabs)");
    };

    return (
        <ScrollView contentContainerStyle={profileStyles.container}>
            <View style={profileStyles.content}>
                {/* Section Photo de profil */}
                <View style={profileStyles.imageSection}>
                    <View style={profileStyles.imageContainer}>
                        <Image
                            source={
                                selectedImage
                                    ? { uri: selectedImage }
                                    : profileImage
                                    ? { uri: profileImage }
                                    : DefaultProfileImage
                            }
                            style={profileStyles.profileImage}
                        />
                    </View>
                    <TouchableOpacity
                        style={profileStyles.editImageButton}
                        onPress={pickImageAsync}
                    >
                        <Text style={profileStyles.editImageText}>
                            Edit profile picture
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Section Informations */}
                <View style={profileStyles.infoSection}>
                    <View style={profileStyles.inputContainer}>
                        <TextInput
                            style={profileStyles.input}
                            value={isEditingUsername ? tempUsername : username}
                            onChangeText={(text) => {
                                setTempUsername(text);
                                setHasChanges(true);
                            }}
                            editable={isEditingUsername}
                            placeholder="Username"
                        />
                        <TouchableOpacity
                            style={profileStyles.editButton}
                            onPress={() => {
                                if (isEditingUsername) {
                                    setUsername(tempUsername);
                                }
                                setIsEditingUsername(!isEditingUsername);
                            }}
                        >
                            <Pencil size={20} color="#007AFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={profileStyles.inputContainer}>
                        <TextInput
                            style={profileStyles.input}
                            value={isEditingEmail ? tempEmail : email}
                            onChangeText={(text) => {
                                setTempEmail(text);
                                setHasChanges(true);
                            }}
                            editable={isEditingEmail}
                            placeholder="Email"
                            keyboardType="email-address"
                        />
                        <TouchableOpacity
                            style={profileStyles.editButton}
                            onPress={() => {
                                if (isEditingEmail) {
                                    setEmail(tempEmail);
                                }
                                setIsEditingEmail(!isEditingEmail);
                            }}
                        >
                            <Pencil size={20} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Boutons d'action */}
                <View style={profileStyles.actionButtons}>
                    {hasChanges && (
                        <TouchableOpacity
                            style={profileStyles.saveButton}
                            onPress={handleSave}
                        >
                            <Save size={20} color="white" />
                            <Text style={profileStyles.saveButtonText}>
                                Save Changes
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={profileStyles.deleteButton}
                        onPress={handleDeleteAccount}
                    >
                        <Trash2 size={20} color="white" />
                        <Text style={profileStyles.deleteButtonText}>
                            Delete my account
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={profileStyles.logOutButton}
                        onPress={handleLogout}
                    >
                        <LogOutIcon size={20} color="white" />
                        <Text style={profileStyles.logOutButtonText}>Log out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}