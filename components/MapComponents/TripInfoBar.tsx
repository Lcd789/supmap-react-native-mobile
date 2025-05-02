import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

interface TripInfoBarProps {
  remainingDistance: number;
  remainingDuration: number;
}

const TripInfoBar: React.FC<TripInfoBarProps> = ({
  remainingDistance,
  remainingDuration,
}) => {
  const distanceKm = (remainingDistance / 1000).toFixed(1);
  const durationMin = Math.ceil(remainingDuration / 60);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Distance restante :{distanceKm} km</Text>
      <Text style={styles.text}>Temp restant {durationMin} min</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 20 : 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 10,
    zIndex: 10,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default TripInfoBar;
