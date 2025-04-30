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
import {
    getUserDataApi,
    deleteProfileApi,
    updateUserApi,
    updateProfileImageApi,
} from "../../hooks/user/userHooks";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/user/AuthContext";
import { profileStyles } from "../../styles/styles";
import { ApiError, UserData } from "../../utils/apiUtils";

const DefaultProfileImage = require("../../assets/images/default-profile.png");

export default function Profile() {
    const router = useRouter();
    const { isAuthenticated, logout: contextLogout, logoutAndRedirect } = useAuth();

    const [userData, setUserData] = useState<UserData | null>(null);
    const [tempUsername, setTempUsername] = useState("");
    const [tempEmail, setTempEmail] = useState("");
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUserData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getUserDataApi();
            setUserData(data);
            setTempUsername(data.username || "");
            setTempEmail(data.email || "");
            setProfileImageUrl(data.profileImage || null);
            setSelectedImageUri(null);
        } catch (err) {
            setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load profile.");
            if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
                await contextLogout();
                router.replace("/login");
            }
        } finally {
            setIsLoading(false);
        }
    }, [contextLogout, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserData();
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated, fetchUserData]);

    const pickImageAsync = async () => {
        const permissionResult = await ImageSelector.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Permission refusée", "Vous devez autoriser l'accès à la galerie.");
            return;
        }

        let result = await ImageSelector.launchImageLibraryAsync({
            mediaTypes: ImageSelector.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            aspect: [1, 1],
        });

        if (!result.canceled && result.assets?.length) {
            setSelectedImageUri(result.assets[0].uri);
            await handleProfileImageUpload(result.assets[0].uri);
            fetchUserData();
        }
    };

    const handleProfileImageUpload = async (imageUri: string) => {
        setIsSaving(true);
        setError(null);
        try {
            const filename = imageUri.split("/").pop() || `profile-${Date.now()}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            const response = await updateProfileImageApi({ uri: imageUri, name: filename, type });

            if (response?.imageUrl) {
                setProfileImageUrl(response.imageUrl);
                if (userData) {
                    setUserData({ ...userData, profileImage: response.imageUrl });
                }
            }

            setSelectedImageUri(null);
            Alert.alert("Succès", response.message || "Image mise à jour.");
        } catch (err) {
            setError(err instanceof ApiError || err instanceof Error ? err.message : "Erreur de téléversement.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveChanges = async () => {
        if (tempUsername === userData?.username && tempEmail === userData?.email) {
            Alert.alert("Aucun changement", "Aucune modification détectée.");
            setIsEditingUsername(false);
            setIsEditingEmail(false);
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            const updateData: { username?: string; email?: string } = {};
            if (tempUsername !== userData?.username) updateData.username = tempUsername;
            if (tempEmail !== userData?.email) updateData.email = tempEmail;

            const updatedData = await updateUserApi(updateData);
            setUserData(updatedData);
            setTempUsername(updatedData.username || "");
            setTempEmail(updatedData.email || "");
            setIsEditingUsername(false);
            setIsEditingEmail(false);
            Alert.alert("Succès", "Profil mis à jour avec succès.");
        } catch (err) {
            setError(err instanceof ApiError || err instanceof Error ? err.message : "Erreur de mise à jour.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            "Confirmation",
            "Supprimer définitivement votre compte ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    onPress: async () => {
                        setIsSaving(true);
                        try {
                            await deleteProfileApi();
                            Alert.alert("Compte supprimé");
                            await contextLogout();
                            router.replace("/login");
                        } catch (err) {
                            setError(err instanceof ApiError || err instanceof Error ? err.message : "Erreur.");
                            setIsSaving(false);
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };

    const handleLogout = async () => {
        setIsSaving(true);
        try {
            await logoutAndRedirect();
        } catch {
            Alert.alert("Erreur", "La déconnexion a échoué.");
        } finally {
            setIsSaving(false);
        }
    };

    const imageSource = selectedImageUri
        ? { uri: selectedImageUri }
        : profileImageUrl
        ? { uri: profileImageUrl }
        : DefaultProfileImage;

    const hasUsernameChanges = userData && tempUsername !== userData.username;
    const hasEmailChanges = userData && tempEmail !== userData.email;
    const hasTextChanges = hasUsernameChanges || hasEmailChanges;

    if (isLoading) {
        return (
            <View style={[profileStyles.container, styles.center]}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={profileStyles.container}
            keyboardShouldPersistTaps="handled"
        >
            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={profileStyles.content}>
                <View style={profileStyles.imageSection}>
                    <View style={profileStyles.imageContainer}>
                        <Image source={imageSource} style={profileStyles.profileImage} />
                    </View>
                    <TouchableOpacity
                        style={profileStyles.editImageButton}
                        onPress={pickImageAsync}
                        disabled={isSaving}
                    >
                        <Text style={profileStyles.editImageText}>Changer l'image</Text>
                    </TouchableOpacity>
                </View>

                <View style={profileStyles.infoSection}>
                    <View style={profileStyles.inputContainer}>
                        <Text style={profileStyles.label}>Username</Text>
                        <TextInput
                            style={[
                                profileStyles.input,
                                !isEditingUsername && styles.inputReadOnly,
                            ]}
                            value={tempUsername}
                            onChangeText={setTempUsername}
                            editable={isEditingUsername && !isSaving}
                            placeholder="Username"
                            placeholderTextColor="#999"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={profileStyles.editButton}
                            onPress={() => {
                                setIsEditingUsername(!isEditingUsername);
                                if (isEditingUsername) {
                                    setTempUsername(userData?.username || "");
                                }
                            }}
                            disabled={isSaving}
                        >
                            <Pencil size={20} color={isEditingUsername ? "#ff6347" : "#007AFF"} />
                        </TouchableOpacity>
                    </View>

                    <View style={profileStyles.inputContainer}>
                        <Text style={profileStyles.label}>Email</Text>
                        <TextInput
                            style={[
                                profileStyles.input,
                                !isEditingEmail && styles.inputReadOnly,
                            ]}
                            value={tempEmail}
                            onChangeText={setTempEmail}
                            editable={isEditingEmail && !isSaving}
                            placeholder="Email"
                            keyboardType="email-address"
                            placeholderTextColor="#999"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={profileStyles.editButton}
                            onPress={() => {
                                setIsEditingEmail(!isEditingEmail);
                                if (isEditingEmail) {
                                    setTempEmail(userData?.email || "");
                                }
                            }}
                            disabled={isSaving}
                        >
                            <Pencil size={20} color={isEditingEmail ? "#ff6347" : "#007AFF"} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={profileStyles.actionButtons}>
                    {(hasTextChanges || isEditingUsername || isEditingEmail) && (
                        <TouchableOpacity
                            style={[
                                profileStyles.saveButton,
                                isSaving && styles.buttonDisabled,
                            ]}
                            onPress={handleSaveChanges}
                            disabled={
                                isSaving || (!hasTextChanges && !isEditingUsername && !isEditingEmail)
                            }
                        >
                            {isSaving ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <Save size={20} color="white" />
                                    <Text style={profileStyles.saveButtonText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[profileStyles.deleteButton, isSaving && styles.buttonDisabled]}
                        onPress={handleDeleteAccount}
                        disabled={isSaving}
                    >
                        <Trash2 size={20} color="white" />
                        <Text style={profileStyles.deleteButtonText}>Delete my account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[profileStyles.logOutButton, isSaving && styles.buttonDisabled]}
                        onPress={handleLogout}
                        disabled={isSaving}
                    >
                        <LogOutIcon size={20} color="white" />
                        <Text style={profileStyles.logOutButtonText}>Log out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

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
        backgroundColor: "#eee",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
