// Même principe : supprime le useState local et utilise useTheme()

import { useRouter } from "expo-router";
import {
  ScrollView,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useState } from "react";
import { register } from "@/hooks/authentication/AuthenticationHooks";
import { useTheme } from "@/utils/ThemeContext";

export default function Register() {
  const router = useRouter();
  const { darkMode } = useTheme();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await register(username, email, password);

      if (result.message && result.message.includes("verification email")) {
        Alert.alert(
          "Inscription réussie !",
          "Un email de vérification a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception et cliquer sur le lien pour activer votre compte.",
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
        Alert.alert("Inscription réussie !");
        router.replace("/login");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = [styles.container, darkMode && { backgroundColor: "#1e1e1e" }];
  const labelStyle = [styles.label, darkMode && { color: "#f5f5f5" }];
  const inputStyle = [
    styles.input,
    darkMode && {
      backgroundColor: "#333",
      borderColor: "#555",
      color: "#f5f5f5",
    },
  ];
  const errorStyle = [styles.error, { color: "red" }];
  const linkStyle = [styles.link, darkMode && { color: "#66aaff" }];

  return (
    <ScrollView style={containerStyle} contentContainerStyle={styles.innerContainer}>
      <Text style={labelStyle}>Nom d'utilisateur</Text>
      <TextInput
        style={inputStyle}
        placeholder="Nom d'utilisateur"
        placeholderTextColor={darkMode ? "#aaa" : "#999"}
        value={username}
        onChangeText={setUsername}
        autoCorrect={false}
      />

      <Text style={labelStyle}>Email</Text>
      <TextInput
        style={inputStyle}
        placeholder="Email"
        placeholderTextColor={darkMode ? "#aaa" : "#999"}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={labelStyle}>Mot de passe</Text>
      <TextInput
        style={inputStyle}
        placeholder="Mot de passe"
        placeholderTextColor={darkMode ? "#aaa" : "#999"}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={errorStyle}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, darkMode && styles.buttonDark]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Inscription en cours..." : "S'inscrire"}
        </Text>
      </TouchableOpacity>

      <Pressable onPress={() => router.replace("/login")}>
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
  },
  error: {
    marginBottom: 15,
    textAlign: "center",
  },
  button: {
    width: "100%",
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonDark: {
    backgroundColor: "#0055aa",
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
