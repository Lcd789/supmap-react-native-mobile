// NextStepBanner.tsx
import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Step } from "@/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import { useTheme } from "@/utils/ThemeContext";
import { useSettings } from "@/hooks/user/SettingsContext";

// On récupère le type exact des noms d'icônes supportés
type IconName = keyof typeof MaterialIcons.glyphMap;

interface NextStepBannerProps {
  nextStep: Step | null;
  onToggleSteps: () => void;
  remainingDistance: number;  // en mètres, recalculé dynamiquement
  remainingDuration: number;  // en secondes, recalculé dynamiquement
}

export const NextStepBanner: React.FC<NextStepBannerProps> = ({
  nextStep,
  onToggleSteps,
  remainingDistance,
  remainingDuration,
}) => {
  const insets = useSafeAreaInsets();
  const { darkMode } = useTheme();
  const { voiceGuidance, setVoiceGuidance } = useSettings();

  // On force la valeur de guidance sur le store à chaque render
  useEffect(() => {
    setVoiceGuidance(voiceGuidance);
  }, [voiceGuidance]);

  // Synthèse vocale de l'instruction lorsque nextStep change
  useEffect(() => {
    if (voiceGuidance && nextStep?.html_instructions) {
      const instruction = nextStep.html_instructions.replace(/<[^>]*>/g, " ");
      Speech.stop();
      Speech.speak(instruction, { language: "fr-FR", pitch: 1.1, rate: 1.1 });
    }
  }, [nextStep, voiceGuidance]);

  if (!nextStep) {
    // Affichage final à l'arrivée
    return (
      <View
        style={[
          styles.arrivalContainer,
          {
            backgroundColor: darkMode ? "#333" : "#fff",
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <Text style={{ color: darkMode ? "#fff" : "#000", fontSize: 16 }}>
          🎉 Vous êtes arrivé à destination !
        </Text>
      </View>
    );
  }

  // DISTANCE SANS DÉCIMALES (arrondi au mètre)
  const distanceText =
    remainingDistance < 1000
      ? `${Math.round(remainingDistance)} m`    // ← ici on arrondit
      : `${Math.round(remainingDistance / 1000)} km`;

  // TEMPS
  const minutes = Math.floor(remainingDuration / 60);
  const seconds = remainingDuration % 60;
  const timeText =
    minutes > 0
      ? `${minutes} min${seconds > 0 ? ` ${seconds}s` : ""}`
      : `${seconds}s`;

  // Nettoyage des balises HTML
  const instruction = nextStep.html_instructions.replace(/<[^>]*>/g, " ");

  // Sélection de l'icône de manœuvre typée
  const getManeuverIcon = (maneuver: string): IconName => {
    const icons: Record<string, IconName> = {
      "turn-right": "turn-right",
      "turn-left": "turn-left",
      straight: "straight",
      "roundabout-right": "rotate-right",
      "roundabout-left": "rotate-left",
      "uturn-right": "u-turn-right",
      "uturn-left": "u-turn-left",
    };
    return icons[maneuver] ?? "arrow-forward";
  };

  const backgroundColor = darkMode ? "#333" : "#fff";
  const textColor = darkMode ? "#fff" : "#000";

  return (
    <TouchableOpacity
      style={[styles.bannerContainer, { backgroundColor, paddingTop: insets.top + 8 }]}
      onPress={onToggleSteps}
    >
      <View style={styles.bannerContent}>
        {nextStep.maneuver && (
          <MaterialIcons
            name={getManeuverIcon(nextStep.maneuver)}
            size={72}
            color="#2196F3"
            style={styles.stepIcon}
          />
        )}
        <View style={styles.stepTextContainer}>
          <Text style={[styles.stepInstruction, { color: textColor }]}>
            {instruction}
          </Text>
          <Text style={[styles.stepDistance, { color: textColor }]}>
            {distanceText} • {timeText}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setVoiceGuidance(!voiceGuidance)}
          style={styles.voiceButton}
        >
          <MaterialIcons
            name={voiceGuidance ? "volume-up" : "volume-off"}
            size={28}
            color={voiceGuidance ? "#2196F3" : "#888"}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingHorizontal: 8,
    paddingBottom: 8,
    zIndex: 1000,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepIcon: {
    marginRight: 10,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
  },
  stepDistance: {
    fontSize: 12,
    marginTop: 4,
  },
  voiceButton: {
    padding: 8,
  },
  arrivalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingBottom: 8,
    zIndex: 1000,
    alignItems: "center",
  },
});
