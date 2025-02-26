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
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>Nom d'utilisateur</Text>
            <TextInput
                style={styles.input}
                placeholder="Nom d'utilisateur"
                value={username}
                onChangeText={setUsername}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />

            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={{ height: 1, marginVertical: 8 }} />

            <Button
                title={loading ? "Inscription..." : "S'inscrire"}
                onPress={handleRegister}
                disabled={loading}
            />

            <View style={{ height: 1, marginVertical: 8 }} />

            <Pressable onPress={() => router.replace("/login")}>
                <Text style={styles.linkButton}>Already have an account ?</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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
    error: {
        color: "red",
        marginBottom: 10,
    },
    linkButton: {
        fontSize: 20,
        textDecorationLine: "underline",
        color: "blue",
    },
});
