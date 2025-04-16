// login.tsx
import { useRouter, useFocusEffect } from "expo-router";
import {
    ScrollView,
    Text,
    View,
    StyleSheet,
    Pressable,
    Alert,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
} from "react-native";
import { useState, useCallback } from "react";
import { loginApi } from "../../hooks/authentication/authHooks";

import { useAuth } from "@/hooks/user/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/utils/ThemeContext";
import { ApiError } from "../../utils/apiUtils";

export default function Login() {
    const router = useRouter();
    // Utiliser la fonction login du CONTEXTE pour mettre à jour l'état global et SecureStore
    const { login: contextLogin } = useAuth();
    const { darkMode } = useTheme();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [secureText, setSecureText] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            // Réinitialiser les champs quand l'écran revient au focus
            setEmail("");
            setPassword("");
            setError(null);
            setLoading(false); // Assurer que loading est false
        }, [])
    );

    const handleLogin = async () => {
        // Valider les entrées avant l'appel API
        if (!email || !password) {
            setError("L'adresse e-mail et le mot de passe sont requis.");
            return; // Arrêter ici si invalide
        }
        setLoading(true);
        setError(null);
        try {
            // 1. Appeler la fonction API (loginApi) qui retourne le token ou lance une erreur
            const authToken = await loginApi(email, password);

            // 2. Si succès, appeler la fonction login du contexte AuthContext
            //    Elle s'occupe de stocker le token et de mettre à jour l'état global
            await contextLogin(authToken);

            // 3. Naviguer vers l'écran principal après succès
            // Alert.alert("Connexion réussie !"); // Peut-être pas nécessaire si la redirection est immédiate
            router.replace("/(tabs)/profile"); // ou '/' ou l'écran souhaité
        } catch (err) {
            console.log("Login failed:", err);
            console.log("Error details:", err instanceof ApiError ? err.responseBody : err);
            // Afficher le message d'erreur de ApiError ou un message générique
            if (err instanceof ApiError) {
                // Utiliser err.message qui contient le message formaté par l'API ou le helper
                console.log("API Error:", err.responseBody || "Une erreur de connexion est survenue.");
                setError(
                    err.responseBody || "Une erreur de connexion est survenue."
                );
            } else if (err instanceof Error) {
                console.log("Error:", err.message);
                setError(err.message);
            } else {
                setError(
                    "Une erreur inattendue est survenue lors de la connexion."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // Styles (gardés tels quels, mais ajoutez les vôtres si nécessaire)
    const containerStyle = [
        styles.container,
        darkMode && { backgroundColor: "#1e1e1e" },
    ];
    const labelStyle = [styles.label, darkMode && { color: "#f5f5f5" }];
    const inputStyle = [
        styles.input,
        darkMode && {
            backgroundColor: "#333",
            borderColor: "#555",
            color: "#f5f5f5",
        },
    ];
    const inputPasswordStyle = [
        styles.inputPassword,
        darkMode && {
            backgroundColor: "#333",
            borderColor: "#555",
            color: "#f5f5f5",
        },
    ];
    const toggleButtonStyle = [
        styles.toggleButton,
        darkMode && { backgroundColor: "#333", borderColor: "#555" },
    ];
    const forgotTextStyle = [
        styles.forgotText,
        darkMode && { color: "#66aaff" },
    ];
    const linkTextStyle = [styles.link, darkMode && { color: "#66aaff" }];
    const buttonStyle = [styles.button, darkMode && styles.buttonDark];
    const errorStyle = [styles.error, darkMode && { color: "#ff6666" }]; // Style pour l'erreur en mode sombre

    return (
        <ScrollView
            style={containerStyle}
            contentContainerStyle={styles.innerContainer}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={labelStyle}>Adresse email</Text>
            <TextInput
                style={inputStyle}
                placeholder="Email"
                placeholderTextColor={darkMode ? "#aaa" : "#999"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading} // Désactiver pendant le chargement
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
                    editable={!loading} // Désactiver pendant le chargement
                />
                <Pressable
                    onPress={() => setSecureText(!secureText)}
                    style={toggleButtonStyle}
                    disabled={loading} // Désactiver pendant le chargement
                >
                    <Ionicons
                        name={secureText ? "eye" : "eye-off"}
                        size={24}
                        color={darkMode ? "#f5f5f5" : "#007AFF"}
                    />
                </Pressable>
            </View>

            {error && <Text style={errorStyle}>{error}</Text>}

            <Pressable
                onPress={() => router.push("/forgot-password")}
                style={styles.forgotContainer}
                disabled={loading}
            >
                <Text style={forgotTextStyle}>Mot de passe oublié ?</Text>
            </Pressable>

            <TouchableOpacity
                style={buttonStyle}
                onPress={handleLogin}
                disabled={loading} // Désactiver le bouton pendant le chargement
            >
                {loading ? (
                    <ActivityIndicator color="#fff" /> // Afficher un spinner
                ) : (
                    <Text style={styles.buttonText}>Se connecter</Text>
                )}
            </TouchableOpacity>

            {/* Bouton Google (gardé tel quel) */}
            <TouchableOpacity
                style={buttonStyle}
                onPress={() =>
                    Alert.alert("Connexion Google, pas encore implémentée")
                }
                disabled={loading}
            >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                        source={require("@/assets/images/google.png")} // Assurez-vous que le chemin est correct
                        style={{ width: 20, height: 20, marginRight: 8 }}
                        resizeMode="contain"
                    />
                    <Text style={styles.buttonText}>
                        Se connecter avec Google
                    </Text>
                </View>
            </TouchableOpacity>

            <Pressable
                onPress={() => router.replace("/register")}
                disabled={loading}
            >
                <Text style={linkTextStyle}>Pas encore de compte ?</Text>
            </Pressable>
        </ScrollView>
    );
}

// Styles (gardés tels quels)
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
        color: "#333", // Couleur par défaut pour light mode
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
        color: "#333", // Couleur texte par défaut
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
        borderRightWidth: 0, // Pour coller le bouton
        borderColor: "#ddd",
        fontSize: 16,
        color: "#333",
    },
    toggleButton: {
        paddingHorizontal: 15,
        paddingVertical: 12, // Assurer la même hauteur que l'input
        borderWidth: 1,
        borderLeftWidth: 0, // Pour coller à l'input
        borderColor: "#ddd",
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        backgroundColor: "#fff",
        justifyContent: "center", // Centrer l'icône verticalement
        height: 48, // Hauteur fixe pour correspondre à l'input (ajuster si nécessaire)
    },
    error: {
        marginBottom: 15,
        textAlign: "center",
        color: "red", // Couleur par défaut pour light mode
        width: "100%", // Prendre toute la largeur
    },
    forgotContainer: {
        width: "100%",
        alignItems: "center",
        marginBottom: 15,
    },
    forgotText: {
        fontSize: 16,
        color: "#007AFF", // Couleur par défaut
    },
    button: {
        width: "100%",
        backgroundColor: "#007AFF",
        paddingVertical: 15,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
        minHeight: 50, // Hauteur minimale pour le spinner
    },
    buttonDark: {
        backgroundColor: "#0A84FF", // Couleur légèrement différente pour le mode sombre
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
    link: {
        fontSize: 16,
        color: "#007AFF", // Couleur par défaut
        textAlign: "center",
        marginTop: 10,
    },
});
