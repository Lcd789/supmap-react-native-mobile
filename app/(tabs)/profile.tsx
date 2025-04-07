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
import { useAuth } from "@/hooks/user/AuthContext";
import { profileStyles } from "../../styles/styles";

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
    const {isAuthenticated,setAuthenticated} = useAuth();    
    const authToken =SecureStore.getItemAsync("authToken"); 

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
    }, [isAuthenticated]);

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

    const handleSave = async () => {
        try {
            const updatedData = {
                username: tempUsername,
                email: tempEmail,
            };
            const authToken = await SecureStore.getItemAsync("authToken");
    
            const response = await fetch("https://supmap-api.up.railway.app/user/update", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ username: tempUsername,  email: tempEmail }),
            });
    
            if (!response.ok) {
                throw new Error("Erreur lors de la mise à jour");
            }
    
            const data = await response.json();
    
            setUsername(data.username);
            setEmail(data.email);
            setHasChanges(false);
            Alert.alert("Succès", "Profil mis à jour avec succès");
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert("Erreur", error.message || "Une erreur est survenue");
            } else {
                Alert.alert("Erreur", "Une erreur est survenue");
            }
        }
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
                            
                            setUsername("");
                            setEmail("");
                            setProfileImage(undefined);
                            setSelectedImage(undefined);
                            const token = await SecureStore.deleteItemAsync("authToken");
                            console.log("Token après suppression :", token);
                            setAuthenticated(false);
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
        setUsername("");
        setEmail("");
        setProfileImage(undefined);
        setSelectedImage(undefined);
        setAuthenticated(false);
        router.replace("/(tabs)");
    };

    return (
        <ScrollView contentContainerStyle={ profileStyles.container}>
            <View style={ profileStyles.content}>
                {/* Section Photo de profil */}
                <View style={ profileStyles.imageSection}>
                    <View style={ profileStyles.imageContainer}>
                        <Image
                            source={
                                selectedImage
                                    ? { uri: selectedImage }
                                    : profileImage
                                    ? { uri: profileImage }
                                    : DefaultProfileImage
                            }
                            style={ profileStyles.profileImage}
                        />
                    </View>
                    <TouchableOpacity
                        style={ profileStyles.editImageButton}
                        onPress={pickImageAsync}
                    >
                        <Text style={ profileStyles.editImageText}>
                            Edit profile picture
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Section Informations */}
                <View style={ profileStyles.infoSection}>
                    <View style={ profileStyles.inputContainer}>
                        <TextInput
                            style={ profileStyles.input}
                            value={isEditingUsername ? tempUsername : username}
                            onChangeText={(text) => {
                                setTempUsername(text);
                                setHasChanges(true);
                            }}
                            editable={isEditingUsername}
                            placeholder="Username"
                        />
                        <TouchableOpacity
                            style={ profileStyles.editButton}
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

                    <View style={ profileStyles.inputContainer}>
                        <TextInput
                            style={ profileStyles.input}
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
                            style={ profileStyles.editButton}
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
                <View style={ profileStyles.actionButtons}>
                    {hasChanges && (
                        <TouchableOpacity
                            style={ profileStyles.saveButton}
                            onPress={handleSave}
                        >
                            <Save size={20} color="white" />
                            <Text style={ profileStyles.saveButtonText}>
                                Save Changes
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={ profileStyles.deleteButton}
                        onPress={handleDeleteAccount}
                    >
                        <Trash2 size={20} color="white" />
                        <Text style={ profileStyles.deleteButtonText}>
                            Delete my account
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={ profileStyles.logOutButton}
                        onPress={handleLogout}
                    >
                        <LogOutIcon size={20} color="white" />
                        <Text style={ profileStyles.logOutButtonText}>Log out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}
