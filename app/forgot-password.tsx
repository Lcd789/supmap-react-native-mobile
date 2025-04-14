import { useState } from "react";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  View,
} from "react-native";
import { forgotPassword } from "@/hooks/authentication/AuthenticationHooks";
import { useTheme } from "@/utils/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPassword() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleForgotPassword = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await forgotPassword(email);
      setMessage("Un lien de réinitialisation a été envoyé à votre adresse email.");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = [styles.container, darkMode && styles.containerDark];
  const titleStyle = [styles.title, darkMode && styles.titleDark];
  const instructionStyle = [styles.instruction, darkMode && styles.instructionDark];
  const inputStyle = [styles.input, darkMode && styles.inputDark];
  const linkTextStyle = [styles.link, darkMode && { color: "#66aaff" }];

  return (
    <ScrollView contentContainerStyle={containerStyle}>
      {/* ✅ Flèche retour en haut à gauche */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color={darkMode ? "#f5f5f5" : "#333"} />
      </TouchableOpacity>

      <Text style={titleStyle}>Mot de passe oublié</Text>
      <Text style={instructionStyle}>
        Veuillez entrer votre adresse email pour recevoir un lien de réinitialisation de mot de passe.
      </Text>

      <TextInput
        style={inputStyle}
        placeholder="Email"
        placeholderTextColor={darkMode ? "#aaa" : "#999"}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {error && <Text style={[styles.error, { color: "red" }]}>{error}</Text>}
      {message && <Text style={[styles.message, { color: "green" }]}>{message}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleForgotPassword} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Envoi en cours..." : "Envoyer"}</Text>
      </TouchableOpacity>

      <Pressable onPress={() => router.replace("/login")}>
        <Text style={linkTextStyle}>Retour à la connexion</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  containerDark: {
    backgroundColor: "#1e1e1e",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#333",
  },
  titleDark: {
    color: "#f5f5f5",
  },
  instruction: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  instructionDark: {
    color: "#ccc",
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
  inputDark: {
    backgroundColor: "#333",
    borderColor: "#555",
    color: "#f5f5f5",
  },
  error: {
    marginBottom: 15,
    textAlign: "center",
  },
  message: {
    marginBottom: 15,
    textAlign: "center",
  },
  button: {
    width: "100%",
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
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
