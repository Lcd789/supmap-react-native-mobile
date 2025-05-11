import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface ArrivalPopupProps {
  onClose?: () => void;
}

const ArrivalPopup: React.FC<ArrivalPopupProps> = ({ onClose }) => {
  return (
    <View style={styles.container}>
      <MaterialIcons name="flag" size={36} color="#4CAF50" />
      <Text style={styles.text}>🎉 Vous êtes bien arrivé !</Text>
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.button}>
          <Text style={styles.buttonText}>Fermer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 400,
    alignSelf: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    alignItems: "center",
    zIndex: 999,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});

export default ArrivalPopup;
