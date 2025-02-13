import { Link, useRouter } from "expo-router";
import { ScrollView, Text, View, StyleSheet, Pressable} from "react-native";
import { Button, TextInput } from "react-native";


export default function Register() {
    const router = useRouter();

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>Nom d'utilisateur</Text>
            <TextInput style={styles.input} placeholder="Nom d'utilisateur" />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" />

            <Text style={styles.label}>Mot de passe</Text>
            <TextInput style={styles.input} placeholder="Mot de passe" secureTextEntry />

            <View style={{height: 1, marginVertical: 8}} />

            <Button title="S'inscrire" onPress={() => alert("Inscription réussie !")} />
            
            <View style={{height: 1, marginVertical: 8}} />

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
    input:{
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    linkButton: {
        fontSize: 20,
        textDecorationLine: "underline",
        color: "blue",
    },
});