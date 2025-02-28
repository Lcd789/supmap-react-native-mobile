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
                    Authorization: `Bearer ${authToken}`, // Assurez-vous d'avoir un token valide
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
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.content}>
                {/* Section Photo de profil */}
                <View style={styles.imageSection}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={
                                selectedImage
                                    ? { uri: selectedImage }
                                    : profileImage
                                    ? { uri: profileImage }
                                    : DefaultProfileImage
                            }
                            style={styles.profileImage}
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.editImageButton}
                        onPress={pickImageAsync}
                    >
                        <Text style={styles.editImageText}>
                            Edit profile picture
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Section Informations */}
                <View style={styles.infoSection}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={isEditingUsername ? tempUsername : username}
                            onChangeText={(text) => {
                                setTempUsername(text);
                                setHasChanges(true);
                            }}
                            editable={isEditingUsername}
                            placeholder="Username"
                        />
                        <TouchableOpacity
                            style={styles.editButton}
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

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
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
                            style={styles.editButton}
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
                <View style={styles.actionButtons}>
                    {hasChanges && (
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                        >
                            <Save size={20} color="white" />
                            <Text style={styles.saveButtonText}>
                                Save Changes
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDeleteAccount}
                    >
                        <Trash2 size={20} color="white" />
                        <Text style={styles.deleteButtonText}>
                            Delete my account
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.logOutButton}
                        onPress={handleLogout}
                    >
                        <LogOutIcon size={20} color="white" />
                        <Text style={styles.logOutButtonText}>Log out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#F5F5F5",
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    imageSection: {
        alignItems: "center",
        marginBottom: 30,
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: "hidden",
        backgroundColor: "#E1E1E1",
        marginBottom: 10,
    },
    profileImage: {
        width: "100%",
        height: "100%",
    },
    editImageButton: {
        padding: 8,
    },
    editImageText: {
        color: "#007AFF",
        fontSize: 16,
    },
    infoSection: {
        width: "100%",
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
        backgroundColor: "white",
        borderRadius: 10,
        padding: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    input: {
        flex: 1,
        padding: 12,
        fontSize: 16,
    },
    editButton: {
        padding: 10,
    },
    actionButtons: {
        width: "100%",
        alignItems: "center",
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#00CF00",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        width: "100%",
        justifyContent: "center",
    },
    saveButtonText: {
        color: "white",
        fontSize: 16,
        marginLeft: 10,
    },
    deleteButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FF3B30",
        padding: 15,
        borderRadius: 10,
        width: "100%",
        justifyContent: "center",
    },
    deleteButtonText: {
        color: "white",
        fontSize: 16,
        marginLeft: 10,
    },
    logOutButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#007AFF",
        padding: 15,
        marginTop: 15,
        borderRadius: 10,
        width: "100%",
        justifyContent: "center",
    },
    logOutButtonText: {
        color: "white",
        fontSize: 16,
        marginLeft: 10,
    },
});
