import { Link, useRouter } from "expo-router";
import {
    ScrollView,
    Text,
    View,
    StyleSheet,
    Pressable,
    Alert,
} from "react-native";
import { Button, TextInput } from "react-native";
import { useState } from "react";
import { register } from "@/hooks/authentication/AuthenticationHooks";
import { registerStyles } from "../../styles/globalStyles";

export default function Register() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRegister = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await register(username, email, password);
            Alert.alert("Inscription réussie !");
            router.replace("/login");
        } catch (err) {
            if (err instanceof Error) {
                // @ts-ignore
                setError(err.message);
            } else {
                // @ts-ignore
                setError("Une erreur est survenue.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={registerStyles.container}>
            <Text style={registerStyles.label}>Nom d'utilisateur</Text>
            <TextInput
                style={registerStyles.input}
                placeholder="Nom d'utilisateur"
                value={username}
                onChangeText={setUsername}
            />

            <Text style={registerStyles.label}>Email</Text>
            <TextInput
                style={registerStyles.input}
                placeholder="Email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />

            <Text style={registerStyles.label}>Mot de passe</Text>
            <TextInput
                style={registerStyles.input}
                placeholder="Mot de passe"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            {error && <Text style={registerStyles.error}>{error}</Text>}

            <View style={{ height: 1, marginVertical: 8 }} />

            <Button
                title={loading ? "Inscription..." : "S'inscrire"}
                onPress={handleRegister}
                disabled={loading}
            />

            <View style={{ height: 1, marginVertical: 8 }} />

            <Pressable onPress={() => router.replace("/login")}>
                <Text style={registerStyles.linkButton}>Already have an account ?</Text>
            </Pressable>
        </ScrollView>
    );
}
