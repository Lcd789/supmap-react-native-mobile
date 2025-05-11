// TripInfoBar.tsx
import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface TripInfoBarProps {
  remainingDistance: number;  // en mètres
  remainingDuration: number;  // en secondes
}

const TripInfoBar: React.FC<TripInfoBarProps> = ({
  remainingDistance,
  remainingDuration,
}) => {
  // Conversion sans décimales
  const minutes = Math.ceil(remainingDuration / 60);
  const kilometers = Math.round(remainingDistance / 1000);

  return (
    <View style={styles.container}>
      {/* Pastille Temps */}
      <View style={styles.pill}>
        <MaterialIcons name="schedule" size={20} color="#000" style={styles.icon} />
        <Text style={styles.value}>{minutes}</Text>
        <Text style={styles.unit}>min</Text>
      </View>

      {/* Pastille Distance */}
      <View style={styles.pill}>
        <MaterialIcons name="place" size={20} color="#000" style={styles.icon} />
        <Text style={styles.value}>{kilometers}</Text>
        <Text style={styles.unit}>km</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 20 : 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    zIndex: 1000,
    pointerEvents: "box-none",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginHorizontal: 6,
    // Ombre légère à la Waze
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  icon: {
    marginRight: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  unit: {
    fontSize: 12,
    color: "#000",
    marginLeft: 2,
  },
});

export default TripInfoBar;
