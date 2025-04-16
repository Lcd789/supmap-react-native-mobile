// register.tsx
import { useRouter, useFocusEffect } from "expo-router";
import {
    ScrollView,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    TouchableOpacity,
    TextInput,
    View,
    ActivityIndicator
} from "react-native";
import { useState, useCallback } from "react";
import { registerApi } from "../../hooks/authentication/authHooks";
import { useTheme } from "@/utils/ThemeContext";
import { ApiError } from "../../utils/apiUtils";
import { Ionicons } from "@expo/vector-icons";

export default function Register() {
    const router = useRouter();
    const { darkMode } = useTheme();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [secureText, setSecureText] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            // Réinitialiser les champs quand l'écran revient au focus
            setUsername("");
            setEmail("");
            setPassword("");
            setError(null);
            setLoading(false);
        }, [])
    );

    const handleRegister = async () => {
        // Valider les entrées avant l'appel API
        if (!username || !email || !password) {
            setError("Le nom d'utilisateur, l'adresse e-mail et le mot de passe sont requis.");
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            // Appeler la fonction registerApi du fichier authApi.ts
            const result = await registerApi({
                username,
                email,
                password
            });

            // Vérifier si l'inscription est réussie
            if (result) {
                Alert.alert(
                    "Inscription réussie !",
                    result.message || "Un email de vérification a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception et cliquer sur le lien pour activer votre compte.",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                router.replace("/login");
                            },
                        },
                    ]
                );
            } else {
                // Si result.success est false mais on est ici, c'est un cas inattendu
                throw new Error(result || "Une erreur est survenue lors de l'inscription.");
            }
        } catch (err) {
            console.error("Registration failed:", err);
            
            // Afficher le message d'erreur de ApiError ou un message générique
            if (err instanceof ApiError) {
                setError(err.responseBody || "Une erreur d'inscription est survenue.");
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Une erreur inattendue est survenue lors de l'inscription.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Styles avec prise en compte du mode sombre
    const containerStyle = [styles.container, darkMode && { backgroundColor: "#1e1e1e" }];
    const labelStyle = [styles.label, darkMode && { color: "#f5f5f5" }];
    const inputStyle = [
        styles.input,
        darkMode && { backgroundColor: "#333", borderColor: "#555", color: "#f5f5f5" },
    ];
    const inputPasswordStyle = [
        styles.inputPassword,
        darkMode && { backgroundColor: "#333", borderColor: "#555", color: "#f5f5f5" },
    ];
    const toggleButtonStyle = [
        styles.toggleButton,
        darkMode && { backgroundColor: "#333", borderColor: "#555" },
    ];
    const errorStyle = [styles.error, darkMode && { color: "#ff6666" }];
    const linkStyle = [styles.link, darkMode && { color: "#66aaff" }];
    const buttonStyle = [styles.button, darkMode && styles.buttonDark];

    return (
        <ScrollView 
            style={containerStyle} 
            contentContainerStyle={styles.innerContainer}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={labelStyle}>Nom d'utilisateur</Text>
            <TextInput
                style={inputStyle}
                placeholder="Nom d'utilisateur"
                placeholderTextColor={darkMode ? "#aaa" : "#999"}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
            />

            <Text style={labelStyle}>Email</Text>
            <TextInput
                style={inputStyle}
                placeholder="Email"
                placeholderTextColor={darkMode ? "#aaa" : "#999"}
                keyboardType="email-address"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
            />

            <Text style={labelStyle}>Mot de passe</Text>
            <View style={styles.passwordContainer}>
                <TextInput
                    style={inputPasswordStyle}
                    placeholder="Mot de passe"
                    placeholderTextColor={darkMode ? "#aaa" : "#999"}
                    secureTextEntry={secureText}
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                />
                <Pressable
                    onPress={() => setSecureText(!secureText)}
                    style={toggleButtonStyle}
                    disabled={loading}
                >
                    <Ionicons
                        name={secureText ? "eye" : "eye-off"}
                        size={24}
                        color={darkMode ? "#f5f5f5" : "#007AFF"}
                    />
                </Pressable>
            </View>

            {error && <Text style={errorStyle}>{error}</Text>}

            <TouchableOpacity
                style={buttonStyle}
                onPress={handleRegister}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>S'inscrire</Text>
                )}
            </TouchableOpacity>

            <Pressable onPress={() => router.replace("/login")} disabled={loading}>
                <Text style={linkStyle}>Vous avez déjà un compte ?</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    innerContainer: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    label: {
        alignSelf: "flex-start",
        marginBottom: 5,
        fontSize: 16,
        fontWeight: "500",
        color: "#333",
    },
    input: {
        width: "100%",
        backgroundColor: "#fff",
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
        marginBottom: 15,
        fontSize: 16,
        color: "#333",
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        marginBottom: 15,
    },
    inputPassword: {
        flex: 1,
        backgroundColor: "#fff",
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        borderWidth: 1,
        borderRightWidth: 0,
        borderColor: "#ddd",
        fontSize: 16,
        color: "#333",
    },
    toggleButton: {
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderWidth: 1,
        borderLeftWidth: 0,
        borderColor: "#ddd",
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        backgroundColor: "#fff",
        justifyContent: 'center',
        height: 48,
    },
    error: {
        marginBottom: 15,
        textAlign: "center",
        color: "red",
        width: '100%',
    },
    button: {
        width: "100%",
        backgroundColor: "#007AFF",
        paddingVertical: 15,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
        minHeight: 50,
    },
    buttonDark: {
        backgroundColor: "#0A84FF",
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
    link: {
        fontSize: 16,
        color: "#007AFF",
        textAlign: "center",
        marginTop: 10,
    },
});