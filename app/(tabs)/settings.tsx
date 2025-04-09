import React, { useState } from "react";
import { View, Text, Switch, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();

  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [avoidFerries, setAvoidFerries] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showTraffic, setShowTraffic] = useState(true);
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [unitsMetric, setUnitsMetric] = useState(true);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: insets.top }]}
    >
      <Text style={styles.sectionTitle}>Paramètres d'itinéraire</Text>

      <View style={styles.card}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Éviter les péages</Text>
          <Switch value={avoidTolls} onValueChange={setAvoidTolls} />
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Éviter les autoroutes</Text>
          <Switch value={avoidHighways} onValueChange={setAvoidHighways} />
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Éviter les ferries</Text>
          <Switch value={avoidFerries} onValueChange={setAvoidFerries} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Affichage</Text>

      <View style={styles.card}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Mode sombre</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Afficher le trafic</Text>
          <Switch value={showTraffic} onValueChange={setShowTraffic} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Guidage</Text>

      <View style={styles.card}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Guidage vocal</Text>
          <Switch value={voiceGuidance} onValueChange={setVoiceGuidance} />
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Unités métriques</Text>
          <Switch value={unitsMetric} onValueChange={setUnitsMetric} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e1e1e",
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionLabel: {
    fontSize: 16,
    color: "#333",
  },
});

export default SettingsScreen;
