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
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [secureText, setSecureText] = useState(true); // Pour afficher/masquer le mot de passe

    useFocusEffect(
        useCallback(() => {
            setEmail("");
            setPassword("");
            setError(null);
        }, [])
    );

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const authToken = await login(email, password);
            await SecureStore.setItemAsync("authToken", authToken);

            setAuthenticated(true);

            Alert.alert("Connexion réussie !");
            router.replace("/(tabs)/profile");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Une erreur est survenue."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={loginStyles.container}>
            <Text style={loginStyles.label}>Nom d'utilisateur</Text>
            <TextInput
                style={loginStyles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoCapitalize="none"
                autoCorrect={false}
            />

            <Text style={loginStyles.label}>Mot de passe</Text>
            <View style={loginStyles.passwordContainer}>
                <TextInput
                    style={loginStyles.inputPassword}
                    placeholder="Mot de passe"
                    secureTextEntry={secureText}
                    value={password}
                    onChangeText={setPassword}
                />
                <Pressable
                    onPress={() => setSecureText(!secureText)}
                    style={loginStyles.toggleButton}
                >
                    <Text>{secureText ? "👁️" : "🙈"}</Text>
                </Pressable>
            </View>

            {error && <Text style={loginStyles.error}>{error}</Text>}

            <Pressable onPress={() => router.push("/")}>
                <Text style={loginStyles.forgotpass}>
                    Mot de passe oublié ?
                </Text>
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
                onPress={() => alert("Connexion Google, pas encore implémentée")}
                disabled={loading}
            />

            <View
                style={{
                    height: 1,
                    marginVertical: 8,
                }}
            />

            <Pressable onPress={() => router.replace("/register")}>
                <Text style={loginStyles.linkButton}>
                    Pas encore de compte ?
                </Text>
            </Pressable>
        </ScrollView>
    );
}
