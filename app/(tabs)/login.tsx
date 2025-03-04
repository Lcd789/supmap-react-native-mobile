import { useRouter, useFocusEffect } from "expo-router";
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
import { useCallback } from "react";
import { loginStyles } from "../../styles/styles";

export default function Login() {
    const router = useRouter();
    const { setAuthenticated } = useAuth(); 

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [secureText, setSecureText] = useState(true); // Pour afficher/masquer le mot de passe

    useFocusEffect(
        useCallback(() => {
            setUsername("");
            setPassword("");
            setError(null);
        }, [])
    );

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const authToken = await login(username, password);
            await SecureStore.setItemAsync("authToken", authToken);
            
        
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
        <ScrollView style={ loginStyles.container}>
            <Text style={ loginStyles.label}>Nom d'utilisateur</Text>
            <TextInput
                style={ loginStyles.input}
                placeholder="Nom d'utilisateur"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none" // Évite la mise en majuscule automatique
                autoCorrect={false} // Désactive la correction automatique
            />

            <Text style={ loginStyles.label}>Mot de passe</Text>
            <View style={ loginStyles.passwordContainer}>
                <TextInput
                    style={ loginStyles.inputPassword}
                    placeholder="Mot de passe"
                    secureTextEntry={secureText}
                    value={password}
                    onChangeText={setPassword}
                />
                <Pressable
                    onPress={() => setSecureText(!secureText)}
                    style={ loginStyles.toggleButton}
                >
                    <Text>{secureText ? "👁️" : "🙈"}</Text>
                </Pressable>
            </View>

            {error && <Text style={ loginStyles.error}>{error}</Text>}

            <Pressable onPress={() => router.push("/")}>
                <Text style={ loginStyles.forgotpass}>Mot de passe oublié ?</Text>
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
                <Text style={ loginStyles.linkButton}>Pas encore de compte ?</Text>
            </Pressable>
        </ScrollView>
    );
}
