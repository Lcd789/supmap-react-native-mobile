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
} from "react-native";
import { useState, useCallback } from "react";
import { login } from "@/hooks/authentication/AuthenticationHooks";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/hooks/user/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/utils/ThemeContext";

export default function Login() {
  const router = useRouter();
  const { setAuthenticated } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const containerStyle = [styles.container, darkMode && { backgroundColor: "#1e1e1e" }];
  const innerContainerStyle = [styles.innerContainer];
  const labelStyle = [styles.label, darkMode && { color: "#f5f5f5" }];
  const inputStyle = [styles.input, darkMode && { backgroundColor: "#333", borderColor: "#555", color: "#f5f5f5" }];
  const inputPasswordStyle = [styles.inputPassword, darkMode && { backgroundColor: "#333", borderColor: "#555", color: "#f5f5f5" }];
  const toggleButtonStyle = [styles.toggleButton, darkMode && { backgroundColor: "#333", borderColor: "#555" }];
  const forgotTextStyle = [styles.forgotText, darkMode && { color: "#66aaff" }];
  const buttonTextStyle = styles.buttonText;
  const linkTextStyle = [styles.link, darkMode && { color: "#66aaff" }];

  return (
    <ScrollView style={containerStyle} contentContainerStyle={innerContainerStyle}>
      <Text style={labelStyle}>Nom d'utilisateur</Text>
      <TextInput
        style={inputStyle}
        placeholder="Nom d'utilisateur"
        placeholderTextColor={darkMode ? "#aaa" : "#999"}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={labelStyle}>Mot de passe</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={inputPasswordStyle}
          placeholder="Mot de passe"
          placeholderTextColor={darkMode ? "#aaa" : "#999"}
          secureTextEntry={secureText}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable onPress={() => setSecureText(!secureText)} style={toggleButtonStyle}>
          <Ionicons name={secureText ? "eye" : "eye-off"} size={24} color={darkMode ? "#f5f5f5" : "#007AFF"} />
        </Pressable>
      </View>

      {error && <Text style={[styles.error, { color: "red" }]}>{error}</Text>}

      <Pressable onPress={() => router.push("/forgot-password")} style={styles.forgotContainer}>
        <Text style={forgotTextStyle}>Mot de passe oublié ?</Text>
      </Pressable>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={buttonTextStyle}>{loading ? "Connexion en cours..." : "Se connecter"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => Alert.alert("Connexion Google")}>
        <Text style={buttonTextStyle}>Se connecter avec Google</Text>
      </TouchableOpacity>

      <Pressable onPress={() => router.replace("/register")}>
        <Text style={linkTextStyle}>Pas encore de compte ?</Text>
      </Pressable>

      <Pressable onPress={toggleDarkMode} style={styles.darkModeToggle}>
        <Text style={darkMode ? { color: "#f5f5f5" } : { color: "#333" }}>
          {darkMode ? "Désactiver le mode sombre" : "Activer le mode sombre"}
        </Text>
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  toggleButton: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginLeft: 8,
  },
  error: {
    marginBottom: 15,
    textAlign: "center",
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
  darkModeToggle: {
    marginTop: 20,
    padding: 10,
  },
});
