import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";

export type AlertType =
  | "police"
  | "embouteillage"
  | "travaux"
  | "obstacle"
  | "accident";

export interface AlertMarker {
  id: number;
  latitude: number;
  longitude: number;
  type: AlertType;
  createdByMe?: boolean; // ✅ ajout ici
}

interface AlertReporterProps {
  onAddAlert: (marker: AlertMarker) => void;
}

const categoryIcons: Record<AlertType, string> = {
  police: "https://img.icons8.com/color/96/policeman-male.png",
  embouteillage: "https://img.icons8.com/color/96/traffic-jam.png",
  travaux: "https://img.icons8.com/color/96/under-construction.png",
  obstacle: "https://img.icons8.com/color/96/error--v1.png",
  accident: "https://img.icons8.com/color/96/car-crash.png",
};

const categories = [
  { label: "Embouteillage", value: "embouteillage" },
  { label: "Police", value: "police" },
  { label: "Accident", value: "accident" },
  { label: "Travaux", value: "travaux" },
  { label: "Obstacle", value: "obstacle" },
];

export const AlertReporter: React.FC<AlertReporterProps> = ({ onAddAlert }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = async (type: AlertType) => {
    setModalVisible(false);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "La localisation est nécessaire.");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const marker: AlertMarker = {
      id: Date.now(),
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      type,
      createdByMe: true, // ✅ nouvelle propriété ajoutée
    };

    onAddAlert(marker);
    Alert.alert("Merci !", `Alerte "${type}" ajoutée.`);
  };

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="warning" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Signaler un événement</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.value}
              numColumns={3}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => handleSelect(item.value as AlertType)}
                >
                  <Image
                    source={{ uri: categoryIcons[item.value as AlertType] }}
                    style={styles.categoryIcon}
                  />
                  <Text style={styles.categoryText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ justifyContent: "center" }}
            />
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    bottom: 180,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f44336",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    elevation: 6,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  categoryItem: {
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
  },
  categoryIcon: {
    width: 50,
    height: 50,
  },
  categoryText: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 14,
    color: "#333",
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#eee", 
    borderRadius: 8,
  },
  closeText: {
    fontSize: 16,
    color: "#333",
  },
});
