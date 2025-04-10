import React, { useState } from "react";
import { View, Button, StyleSheet, Text } from "react-native";

interface DevSimulatorProps {
  onUpdate: (coords: { latitude: number; longitude: number }) => void;
}

export const DevSimulator: React.FC<DevSimulatorProps> = ({ onUpdate }) => {
  const [simulatedCoords, setSimulatedCoords] = useState({ latitude: 48.8584, longitude: 2.2945 }); // Paris

  // Fonction pour déplacer la position simulée
  const moveUp = () => {
    const newCoords = { latitude: simulatedCoords.latitude + 0.0001, longitude: simulatedCoords.longitude };
    setSimulatedCoords(newCoords);
    onUpdate(newCoords);
  };
  const moveDown = () => {
    const newCoords = { latitude: simulatedCoords.latitude - 0.0001, longitude: simulatedCoords.longitude };
    setSimulatedCoords(newCoords);
    onUpdate(newCoords);
  };
  const moveLeft = () => {
    const newCoords = { latitude: simulatedCoords.latitude, longitude: simulatedCoords.longitude - 0.0001 };
    setSimulatedCoords(newCoords);
    onUpdate(newCoords);
  };
  const moveRight = () => {
    const newCoords = { latitude: simulatedCoords.latitude, longitude: simulatedCoords.longitude + 0.0001 };
    setSimulatedCoords(newCoords);
    onUpdate(newCoords);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.positionText}>
        Position simulée : {simulatedCoords.latitude.toFixed(4)}, {simulatedCoords.longitude.toFixed(4)}
      </Text>

      <View style={styles.buttonContainer}>
        <Button title="↑" onPress={moveUp} />
        <View style={styles.row}>
          <Button title="←" onPress={moveLeft} />
          <Button title="→" onPress={moveRight} />
        </View>
        <Button title="↓" onPress={moveDown} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
  },
  positionText: {
    fontSize: 18,
    marginBottom: 20,
    color: "#fff",
  },
});
