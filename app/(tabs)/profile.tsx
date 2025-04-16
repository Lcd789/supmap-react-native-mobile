import {
    ScrollView,
    Text,
    View,
    StyleSheet,
    TextInput,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import * as ImageSelector from "expo-image-picker";
import { useState, useEffect, useCallback } from "react";
import { LogOutIcon, Pencil, Save, Trash2 } from "lucide-react-native";
import { Image } from "expo-image";
// Importer les fonctions API pour User
import {
    getUserDataApi,
    deleteProfileApi,
    updateUserApi,
    updateProfileImageApi,
} from "../../hooks/user/userHooks";
import { useRouter } from "expo-router";
// Importer le hook du contexte pour logout et isAuthenticated
import { useAuth } from "../../hooks/user/AuthContext";
import { profileStyles } from "../../styles/styles";
import { useTheme } from "../../utils/ThemeContext";
import { ApiError, UserData } from "../../utils/apiUtils";

const DefaultProfileImage = require("../../assets/images/default-profile.png");

export default function Profile() {
    const router = useRouter();
    const { darkMode } = useTheme();
    // Utiliser logout et isAuthenticated du contexte
    const {
        isAuthenticated,
        logout: contextLogout,
        logoutAndRedirect,
    } = useAuth();

    // États pour les données utilisateur et l'UI
    const [userData, setUserData] = useState<UserData | null>(null);
    const [tempUsername, setTempUsername] = useState("");
    const [tempEmail, setTempEmail] = useState("");
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(
        null
    ); // URI de l'image sélectionnée localement
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null); // URL de l'image venant de l'API

    // États pour l'UI
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Chargement initial des données
    const [isSaving, setIsSaving] = useState(false); // Indicateur pour sauvegarde/suppression/logout
    const [error, setError] = useState<string | null>(null);

    // Fonction pour charger les données utilisateur
    const fetchUserData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getUserDataApi();
            setUserData(data);
            setTempUsername(data.username || "");
            setTempEmail(data.email || "");
            // Utiliser l'URL de l'image venant des données utilisateur
            setProfileImageUrl(data.profileImage || null);
            setSelectedImageUri(null); // Réinitialiser l'image sélectionnée localement
        } catch (err) {
            console.error("Failed to fetch user data:", err);
            setError(
                err instanceof ApiError || err instanceof Error
                    ? err.message
                    : "Failed to load profile."
            );
            // Déconnecter si le token est invalide (erreur 401/403)
            if (
                err instanceof ApiError &&
                (err.status === 401 || err.status === 403)
            ) {
                await contextLogout();
                router.replace("/login");
            }
        } finally {
            setIsLoading(false);
        }
    }, [contextLogout, router]);

    // Charger les données lorsque l'écran est monté ou quand l'état d'authentification change
    useEffect(() => {
        if (isAuthenticated) {
            setIsLoading(true);
            setIsSaving(false);
            setError(null);
            setIsEditingUsername(false);
            setIsEditingEmail(false);
            fetchUserData();
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated, fetchUserData]);

    // Sélection d'image
    const pickImageAsync = async () => {
        // Demander la permission
        const permissionResult =
            await ImageSelector.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert(
                "Permission refusée",
                "Vous devez autoriser l'accès à la galerie pour changer l'image."
            );
            return;
        }

        let result = await ImageSelector.launchImageLibraryAsync({
            mediaTypes: ImageSelector.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            aspect: [1, 1],
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            // Stocker l'URI local pour l'affichage immédiat
            setSelectedImageUri(result.assets[0].uri);
            await handleProfileImageUpload(result.assets[0].uri);
            fetchUserData(); // Recharger les données utilisateur après upload
        }
    };

    // Upload de l'image de profil
    const handleProfileImageUpload = async (imageUri: string) => {
        setIsSaving(true);
        setError(null);
        try {
            const filename =
                imageUri.split("/").pop() || `profile-${Date.now()}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            const response = await updateProfileImageApi({
                uri: imageUri,
                name: filename,
                type,
            });

            if (response && response.imageUrl) {
                setProfileImageUrl(response.imageUrl);
                // Mettre à jour userData
                if (userData) {
                    setUserData({
                        ...userData,
                        profileImage: response.imageUrl,
                    });
                }
            }
            setSelectedImageUri(null);
            Alert.alert(
                "Succès",
                response.message || "Image de profil mise à jour."
            );
        } catch (err) {
            console.error("Profile image upload failed:", err);
            setError(
                err instanceof ApiError || err instanceof Error
                    ? err.message
                    : "Failed to upload image."
            );
        } finally {
            setIsSaving(false);
        }
    };

    // Sauvegarde des changements (username/email)
    const handleSaveChanges = async () => {
        // Vérifier s'il y a des changements réels
        if (
            tempUsername === userData?.username &&
            tempEmail === userData?.email
        ) {
            Alert.alert("Aucun changement", "Aucune modification détectée.");
            setIsEditingUsername(false);
            setIsEditingEmail(false);
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            // Préparer les données à envoyer (seulement les champs modifiés)
            const updateData: { username?: string; email?: string } = {};
            if (tempUsername !== userData?.username) {
                updateData.username = tempUsername;
            }
            if (tempEmail !== userData?.email) {
                updateData.email = tempEmail;
            }

            // Appeler l'API de mise à jour
            const updatedData = await updateUserApi(updateData);

            // Mettre à jour l'état local avec les données retournées
            setUserData(updatedData);
            setTempUsername(updatedData.username || "");
            setTempEmail(updatedData.email || "");

            // Fermer les modes édition
            setIsEditingUsername(false);
            setIsEditingEmail(false);

            Alert.alert("Succès", "Profil mis à jour avec succès.");
        } catch (err) {
            console.error("Profile update failed:", err);
            setError(
                err instanceof ApiError || err instanceof Error
                    ? err.message
                    : "Failed to update profile."
            );
        } finally {
            setIsSaving(false);
        }
    };

    // Suppression du compte
    const handleDeleteAccount = async () => {
        Alert.alert(
            "Confirmation",
            "Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    onPress: async () => {
                        setIsSaving(true);
                        setError(null);
                        try {
                            await deleteProfileApi();
                            Alert.alert(
                                "Compte supprimé",
                                "Votre compte a été supprimé."
                            );
                            await contextLogout();
                            router.replace("/login");
                        } catch (err) {
                            console.error("Delete account failed:", err);
                            setError(
                                err instanceof ApiError || err instanceof Error
                                    ? err.message
                                    : "Failed to delete account."
                            );
                            setIsSaving(false);
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };

    // Déconnexion
    const handleLogout = async () => {
        setIsSaving(true);
        try {
            await logoutAndRedirect();
            setIsLoading(false);
            setIsSaving(false);
        } catch (error) {
            console.error("Logout process failed:", error);
            Alert.alert("Erreur", "La déconnexion a échoué.");
            setIsSaving(false);
        }
    };

    // --- Rendu ---

    if (isLoading) {
        return (
            <View
                style={[
                    profileStyles.container,
                    styles.center,
                    darkMode && { backgroundColor: "#1e1e1e" },
                ]}
            >
                <ActivityIndicator
                    size="large"
                    color={darkMode ? "#fff" : "#000"}
                />
            </View>
        );
    }

    if (error && !userData) {
        return (
            <View
                style={[
                    profileStyles.container,
                    styles.center,
                    darkMode && { backgroundColor: "#1e1e1e" },
                ]}
            >
                <Text
                    style={[styles.errorText, darkMode && { color: "#ff6666" }]}
                >
                    {error}
                </Text>
                <TouchableOpacity
                    onPress={fetchUserData}
                    style={profileStyles.retryButton}
                >
                    <Text style={profileStyles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleLogout}
                    style={profileStyles.logOutButton}
                >
                    <LogOutIcon size={20} color="white" />
                    <Text style={profileStyles.logOutButtonText}>Log out</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Déterminer l'URL de l'image à afficher (priorité: image locale sélectionnée, puis URL API, puis défaut)
    const imageSource = selectedImageUri
        ? { uri: selectedImageUri }
        : profileImageUrl
        ? { uri: profileImageUrl }
        : DefaultProfileImage;

    // Vérifier s'il y a des changements dans username ou email
    const hasUsernameChanges = userData && tempUsername !== userData.username;
    const hasEmailChanges = userData && tempEmail !== userData.email;
    const hasTextChanges = hasUsernameChanges || hasEmailChanges;

    return (
        <ScrollView
            contentContainerStyle={[
                profileStyles.container,
                darkMode && { backgroundColor: "#1e1e1e" },
            ]}
            keyboardShouldPersistTaps="handled"
        >
            {/* Afficher une erreur persistante si elle existe */}
            {error && (
                <Text
                    style={[styles.errorText, darkMode && { color: "#ff6666" }]}
                >
                    {error}
                </Text>
            )}

            <View style={profileStyles.content}>
                <View style={profileStyles.imageSection}>
                    <View style={profileStyles.imageContainer}>
                        <Image
                            source={imageSource}
                            style={profileStyles.profileImage}
                        />
                    </View>
                    <TouchableOpacity
                        style={profileStyles.editImageButton}
                        onPress={pickImageAsync}
                        disabled={isSaving}
                    >
                        <Text style={profileStyles.editImageText}>
                            Changer l'image
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={profileStyles.infoSection}>
                    {/* Username */}
                    <View style={profileStyles.inputContainer}>
                        <Text
                            style={[
                                profileStyles.label,
                                darkMode && { color: "#ccc" },
                            ]}
                        >
                            Username
                        </Text>
                        <TextInput
                            style={[
                                profileStyles.input,
                                darkMode && {
                                    backgroundColor: "#333",
                                    color: "#f5f5f5",
                                    borderColor: "#555",
                                },
                                !isEditingUsername && styles.inputReadOnly,
                            ]}
                            value={tempUsername}
                            onChangeText={setTempUsername}
                            editable={isEditingUsername && !isSaving}
                            placeholder="Username"
                            placeholderTextColor={darkMode ? "#aaa" : "#999"}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={profileStyles.editButton}
                            onPress={() => {
                                setIsEditingUsername(!isEditingUsername);
                                // Si on désactive l'édition, on réinitialise le champ
                                if (isEditingUsername) {
                                    setTempUsername(userData?.username || "");
                                }
                            }}
                            disabled={isSaving}
                        >
                            <Pencil
                                size={20}
                                color={
                                    isEditingUsername ? "#ff6347" : "#007AFF"
                                }
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Email */}
                    <View style={profileStyles.inputContainer}>
                        <Text
                            style={[
                                profileStyles.label,
                                darkMode && { color: "#ccc" },
                            ]}
                        >
                            Email
                        </Text>
                        <TextInput
                            style={[
                                profileStyles.input,
                                darkMode && {
                                    backgroundColor: "#333",
                                    color: "#f5f5f5",
                                    borderColor: "#555",
                                },
                                !isEditingEmail && styles.inputReadOnly,
                            ]}
                            value={tempEmail}
                            onChangeText={setTempEmail}
                            editable={isEditingEmail && !isSaving}
                            placeholder="Email"
                            keyboardType="email-address"
                            placeholderTextColor={darkMode ? "#aaa" : "#999"}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={profileStyles.editButton}
                            onPress={() => {
                                setIsEditingEmail(!isEditingEmail);
                                // Si on désactive l'édition, on réinitialise le champ
                                if (isEditingEmail) {
                                    setTempEmail(userData?.email || "");
                                }
                            }}
                            disabled={isSaving}
                        >
                            <Pencil
                                size={20}
                                color={isEditingEmail ? "#ff6347" : "#007AFF"}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Boutons d'action */}
                <View style={profileStyles.actionButtons}>
                    {/* Afficher le bouton Save si au moins un champ est modifié */}
                    {(hasTextChanges ||
                        isEditingUsername ||
                        isEditingEmail) && (
                        <TouchableOpacity
                            style={[
                                profileStyles.saveButton,
                                isSaving && styles.buttonDisabled,
                            ]}
                            onPress={handleSaveChanges}
                            disabled={
                                isSaving ||
                                (!hasTextChanges &&
                                    !isEditingUsername &&
                                    !isEditingEmail)
                            }
                        >
                            {isSaving ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <Save size={20} color="white" />
                                    <Text style={profileStyles.saveButtonText}>
                                        Save Changes
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[
                            profileStyles.deleteButton,
                            isSaving && styles.buttonDisabled,
                        ]}
                        onPress={handleDeleteAccount}
                        disabled={isSaving}
                    >
                        <Trash2 size={20} color="white" />
                        <Text style={profileStyles.deleteButtonText}>
                            Delete my account
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            profileStyles.logOutButton,
                            isSaving && styles.buttonDisabled,
                        ]}
                        onPress={handleLogout}
                        disabled={isSaving}
                    >
                        <LogOutIcon size={20} color="white" />
                        <Text style={profileStyles.logOutButtonText}>
                            Log out
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

// Styles locaux
const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorText: {
        color: "red",
        textAlign: "center",
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    inputReadOnly: {
        backgroundColor: "#eee", // Grisé léger pour indiquer non éditable
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
