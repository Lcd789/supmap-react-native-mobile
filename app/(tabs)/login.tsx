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
import { ApiError } from "../../utils/apiUtils";

export default function Login() {
    const router = useRouter();
    const { login: contextLogin } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [secureText, setSecureText] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            setEmail("");
            setPassword("");
            setError(null);
            setLoading(false);
        }, [])
    );

    const handleLogin = async () => {
        if (!email || !password) {
            setError("L'adresse e-mail et le mot de passe sont requis.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const authToken = await loginApi(email, password);
            await contextLogin(authToken);
            router.replace("/(tabs)/profile");
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.responseBody || "Une erreur de connexion est survenue.");
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Une erreur inattendue est survenue lors de la connexion.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.innerContainer}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.label}>Adresse email</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
            />

            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.inputPassword}
                    placeholder="Mot de passe"
                    placeholderTextColor="#999"
                    secureTextEntry={secureText}
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                />
                <Pressable
                    onPress={() => setSecureText(!secureText)}
                    style={styles.toggleButton}
                    disabled={loading}
                >
                    <Ionicons name={secureText ? "eye" : "eye-off"} size={24} color="#007AFF" />
                </Pressable>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
                onPress={() => router.push("/forgot-password")}
                style={styles.forgotContainer}
                disabled={loading}
            >
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </Pressable>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
                onPress={() => Alert.alert("Connexion Google, pas encore implémentée")}
                disabled={loading}
            >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                        source={require("@/assets/images/google.png")}
                        style={{ width: 20, height: 20, marginRight: 8 }}
                        resizeMode="contain"
                    />
                    <Text style={styles.buttonText}>Se connecter avec Google</Text>
                </View>
            </TouchableOpacity>

            <Pressable onPress={() => router.replace("/register")} disabled={loading}>
                <Text style={styles.link}>Pas encore de compte ?</Text>
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
        justifyContent: "center",
        height: 48,
    },
    error: {
        marginBottom: 15,
        textAlign: "center",
        color: "red",
        width: "100%",
    },
    forgotContainer: {
        width: "100%",
        alignItems: "center",
        marginBottom: 15,
    },
    forgotText: {
        fontSize: 16,
        color: "#007AFF",
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
