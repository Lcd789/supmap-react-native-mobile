import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { LogOutIcon, MoonIcon, BatteryChargingIcon, GlobeIcon, BellIcon } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/user/AuthContext";

const primaryColor = "#1E88E5";
const backgroundColor = "#F5F5F5";
const cardBackground = "#FFFFFF";
const textColor = "#212121";
const borderColor = "#BDBDBD";
const borderRadius = 10;
const padding = 16;
const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};

export default function Settings() {
  const router = useRouter();
  const { isAuthenticated, setAuthenticated } = useAuth();

  const [isGpsEnabled, setIsGpsEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState("fr");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const savedSettings = await SecureStore.getItemAsync("gpsSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setIsGpsEnabled(settings.isGpsEnabled);
        setIsDarkMode(settings.isDarkMode);
        setNotificationsEnabled(settings.notificationsEnabled);
        setLanguage(settings.language);
      }
    }
    loadSettings();
  }, []);

  const saveSettings = async () => {
    const settings = {
      isGpsEnabled,
      isDarkMode,
      notificationsEnabled,
      language,
    };
    await SecureStore.setItemAsync("gpsSettings", JSON.stringify(settings));
    Alert.alert("Succès", "Les paramètres ont été sauvegardés.");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Paramètres</Text>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Activer la localisation GPS</Text>
        <Switch onValueChange={() => setIsGpsEnabled(!isGpsEnabled)} value={isGpsEnabled} />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Mode sombre</Text>
        <Switch onValueChange={() => setIsDarkMode(!isDarkMode)} value={isDarkMode} />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Notifications</Text>
        <Switch onValueChange={() => setNotificationsEnabled(!notificationsEnabled)} value={notificationsEnabled} />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Langue</Text>
        <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>{language === "fr" ? "Français" : "Anglais"}</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent={true} visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir une langue</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => { setLanguage("fr"); setModalVisible(false); }}>
              <Text style={styles.modalButtonText}>Français</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => { setLanguage("en"); setModalVisible(false); }}>
              <Text style={styles.modalButtonText}>Anglais</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
        <Text style={styles.saveButtonText}>Sauvegarder</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.smallLogoutButton} onPress={async () => {
        await SecureStore.deleteItemAsync("authToken");
        setAuthenticated(false);
        router.replace("/login");
      }}>
        <LogOutIcon size={18} color="white" />
        <Text style={styles.logoutButtonText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor, padding },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: textColor },
  settingItem: { marginBottom: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: cardBackground, padding: 15, borderRadius, ...shadow },
  settingLabel: { fontSize: 16, fontWeight: "500", color: textColor },
  button: { backgroundColor: primaryColor, padding: 10, borderRadius, alignItems: "center" },
  buttonText: { color: "white", fontSize: 14 },
  saveButton: { backgroundColor: "#388E3C", padding: 15, borderRadius, alignItems: "center", ...shadow },
  saveButtonText: { color: "white", fontSize: 16 },
  smallLogoutButton: { backgroundColor: "#B71C1C", padding: 10, borderRadius, flexDirection: "row", alignItems: "center", justifyContent: "center", ...shadow, alignSelf: "center", width: 150 },
  logoutButtonText: { color: "white", fontSize: 14, marginLeft: 8 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: cardBackground, padding: 20, borderRadius, width: "80%", alignItems: "center", ...shadow },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalButton: { padding: 10, width: "100%", alignItems: "center" },
  modalButtonText: { fontSize: 16, color: textColor },
  modalClose: { marginTop: 10 },
  modalCloseText: { fontSize: 16, color: primaryColor },
});
