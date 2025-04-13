import React from "react";
import { View, Text, Switch, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/utils/ThemeContext";

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const { darkMode, toggleDarkMode } = useTheme();

  const [avoidTolls, setAvoidTolls] = React.useState(false);
  const [avoidHighways, setAvoidHighways] = React.useState(false);
  const [showTraffic, setShowTraffic] = React.useState(true);
  const [voiceGuidance, setVoiceGuidance] = React.useState(true);
  const [unitsMetric, setUnitsMetric] = React.useState(true);

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top }, darkMode && styles.containerDark]}>
      <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Paramètres d'itinéraire</Text>

      <View style={[styles.card, darkMode && styles.cardDark]}>
        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, darkMode && styles.optionLabelDark]}>Éviter les péages</Text>
          <Switch value={avoidTolls} onValueChange={setAvoidTolls} />
        </View>

        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, darkMode && styles.optionLabelDark]}>Éviter les autoroutes</Text>
          <Switch value={avoidHighways} onValueChange={setAvoidHighways} />
        </View>
      </View>

      <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Affichage</Text>

      <View style={[styles.card, darkMode && styles.cardDark]}>
        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, darkMode && styles.optionLabelDark]}>Mode sombre</Text>
          <Switch value={darkMode} onValueChange={toggleDarkMode} />
        </View>

        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, darkMode && styles.optionLabelDark]}>Afficher le trafic</Text>
          <Switch value={showTraffic} onValueChange={setShowTraffic} />
        </View>
      </View>

      <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Guidage</Text>

      <View style={[styles.card, darkMode && styles.cardDark]}>
        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, darkMode && styles.optionLabelDark]}>Guidage vocal</Text>
          <Switch value={voiceGuidance} onValueChange={setVoiceGuidance} />
        </View>

        <View style={styles.optionRow}>
          <Text style={[styles.optionLabel, darkMode && styles.optionLabelDark]}>Unités métriques</Text>
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
  containerDark: {
    backgroundColor: "#1e1e1e",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e1e1e",
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitleDark: {
    color: "#f5f5f5",
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
  cardDark: {
    backgroundColor: "#333",
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
  optionLabelDark: {
    color: "#f5f5f5",
  },
});

export default SettingsScreen;
