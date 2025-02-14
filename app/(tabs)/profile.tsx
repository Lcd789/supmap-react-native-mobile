import { ScrollView, Text, View, StyleSheet, TextInput, Alert } from "react-native";
import * as ImageSelector from "expo-image-picker";
import { useState } from "react";
import { Pencil, Save, Trash2 } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { Image } from "expo-image";

const DefaultProfileImage = require("../../assets/images/default-profile.png");

export default function Profile() {
    // États pour les données utilisateur
    const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
    const [username, setUsername] = useState("John Doe");
    const [email, setEmail] = useState("john.doe@example.com");
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // État temporaire pour stocker les valeurs pendant l'édition
    const [tempUsername, setTempUsername] = useState(username);
    const [tempEmail, setTempEmail] = useState(email);

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
        setHasChanges(false);
        Alert.alert("Succès", "Profil mis à jour avec succès");
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Confirmer la suppression",
            "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.",
            [
                { text: "Annuler", style: "cancel" },
                { 
                    text: "Supprimer", 
                    style: "destructive",
                    onPress: () => {
                        // Ici, vous implementerez la logique de suppression
                    }
                }
            ]
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.content}>
                {/* Section Photo de profil */}
                <View style={styles.imageSection}>
                    <View style={styles.imageContainer}>
                        <Image 
                            source={selectedImage ? { uri: selectedImage } : DefaultProfileImage}
                            style={styles.profileImage}
                        />
                    </View>
                    <TouchableOpacity 
                        style={styles.editImageButton}
                        onPress={pickImageAsync}
                    >
                        <Text style={styles.editImageText}>Edit profile picture</Text>
                    </TouchableOpacity>
                </View>

                {/* Section Informations */}
                <View style={styles.infoSection}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={isEditingUsername ? tempUsername : username}
                            onChangeText={text => {
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
                            onChangeText={text => {
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
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={handleDeleteAccount}
                    >
                        <Trash2 size={20} color="white" />
                        <Text style={styles.deleteButtonText}>Delete my account</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        backgroundColor: '#E1E1E1',
        marginBottom: 10,
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    editImageButton: {
        padding: 8,
    },
    editImageText: {
        color: '#007AFF',
        fontSize: 16,
    },
    infoSection: {
        width: '100%',
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 5,
        shadowColor: '#000',
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
        width: '100%',
        alignItems: 'center',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        width: '100%',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 10,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF3B30',
        padding: 15,
        borderRadius: 10,
        width: '100%',
        justifyContent: 'center',
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 10,
    },
});