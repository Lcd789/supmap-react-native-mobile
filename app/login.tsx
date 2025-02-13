import { Link, useRouter } from "expo-router";
import { ScrollView,Text, View, StyleSheet, Pressable} from "react-native";
import { Button, TextInput } from "react-native";

export default function Login() {
    const router = useRouter();

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Nom d'utilisateur</Text>
            <TextInput style={styles.input} placeholder="Nom d'utilisateur" />
            
            <Text style={styles.label}>Mot de passe</Text>
            {/*Need to add a reveal secureText button in the input*/}
            <TextInput style={styles.input} placeholder="Mot de passe" secureTextEntry />
            
            {/*Need to add a forgot password button*/}
            <Link href={"/register"} style={styles.forgotpass}>
                Forgot your password ?
            </Link>

            {/*Divider*/}
            <View style={{height: 1, marginVertical: 8}} />

            <Button title="Se connecter" onPress={() => alert("Connexion réussie !")} />
            
            {/*Separator*/}
            <View style={{height: 1, backgroundColor: 'black', marginVertical: 12}} />

            {/*Google login button*/}
            <Button title="Se connecter avec Google" onPress={() => alert("Connexion réussie !")} />
            <View style={{height: 1, marginVertical: 8}} />
            <Pressable onPress={() => router.replace("/register")}>
                <Text style={styles.linkButton}>Don't have an account ?</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    text: {
        color: "white",
    },
    imageContainer: {
        flex : 1,
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
    }
});