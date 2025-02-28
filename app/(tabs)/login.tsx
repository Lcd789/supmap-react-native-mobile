import { useRouter } from "expo-router";
import {
    ScrollView,
    Text,
    View,
    StyleSheet,
    Pressable,
    Alert,
    Button,
    TextInput,
} from "react-native";
import { useState } from "react";
import { login } from "@/hooks/authentication/AuthenticationHooks";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/hooks/user/AuthContext";

export default function Login() {
    const router = useRouter();
    const { setAuthenticated } = useAuth(); 

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [secureText, setSecureText] = useState(true); // Pour afficher/masquer le mot de passe

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const authToken = await login(username, password);
            await SecureStore.setItemAsync("authToken", authToken);
            
            // ✅ Met à jour l'état d'authentification
            setAuthenticated(true);

            Alert.alert("Connexion réussie !");
            router.replace("/(tabs)/profile");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Nom d'utilisateur</Text>
            <TextInput
                style={styles.input}
                placeholder="Nom d'utilisateur"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none" // Évite la mise en majuscule automatique
                autoCorrect={false} // Désactive la correction automatique
            />

            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.inputPassword}
                    placeholder="Mot de passe"
                    secureTextEntry={secureText}
                    value={password}
                    onChangeText={setPassword}
                />
                <Pressable
                    onPress={() => setSecureText(!secureText)}
                    style={styles.toggleButton}
                >
                    <Text>{secureText ? "👁️" : "🙈"}</Text>
                </Pressable>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable onPress={() => router.push("/")}>
                <Text style={styles.forgotpass}>Mot de passe oublié ?</Text>
            </Pressable>

            <View style={{ height: 1, marginVertical: 8 }} />

            <Button
                title={loading ? "Connexion..." : "Se connecter"}
                onPress={handleLogin}
                disabled={loading}
            />

            <View
                style={{
                    height: 1,
                    backgroundColor: "black",
                    marginVertical: 12,
                }}
            />

            <Button
                title="Se connecter avec Google"
                onPress={() => alert("Connexion Google")}
            />

            <View style={{ height: 1, marginVertical: 8 }} />

            <Pressable onPress={() => router.replace("/register")}>
                <Text style={styles.linkButton}>Pas encore de compte ?</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    text: {
        color: "white",
    },
    imageContainer: {
        flex: 1,
    },
    linkButton: {
        fontSize: 20,
        textDecorationLine: "underline",
        color: "blue",
    },
    forgotpass: {
        fontSize: 14,
        textDecorationLine: "underline",
        color: "blue",
        textAlign: "right",
    },
    inputPassword: {
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        flex: 1,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 5,
        paddingRight: 10,
        marginBottom: 10,
    },
    toggleButton: {
        padding: 10,
    },
    error: {
        color: "red",
        fontSize: 14,
        marginBottom: 10,
    },
    container: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
});
