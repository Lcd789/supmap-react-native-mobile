// NextStepBanner.tsx
import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Step } from "@/types";                                    // type Step provenant de vos définitions :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import { useTheme } from "@/utils/ThemeContext";
import { useSettings } from "@/hooks/user/SettingsContext";

interface NextStepBannerProps {
  nextStep: Step | null;
  onToggleSteps: () => void;
  remainingDistance: number;
  remainingDuration: number;
}

export const NextStepBanner: React.FC<NextStepBannerProps> = ({
  nextStep,
  onToggleSteps,
  remainingDistance,
  remainingDuration,
}) => {
  const insets = useSafeAreaInsets();
  const { darkMode } = useTheme();
  const { voiceGuidance, setVoiceGuidance, unitsMetric } = useSettings();

  useEffect(() => {
    setVoiceGuidance(voiceGuidance);
  }, [voiceGuidance]);

  useEffect(() => {
    if (voiceGuidance && nextStep && nextStep.html_instructions) {
      const instruction = nextStep.html_instructions.replace(/<[^>]*>/g, " ");
      Speech.stop();
      Speech.speak(instruction, {
        language: "fr-FR",
        pitch: 1.1,
        rate: 1.1,
      });
    }
  }, [nextStep, voiceGuidance]);

  const toggleVoice = () => {
    setVoiceGuidance(!voiceGuidance);
    Speech.stop();
  };

  const getManeuverIcon = (maneuver: string): string => {
    const icons: { [key: string]: string } = {
      "turn-right": "turn-right",
      "turn-left": "turn-left",
      straight: "straight",
      "roundabout-right": "rotate-right",
      "roundabout-left": "rotate-left",
      "uturn-right": "u-turn-right",
      "uturn-left": "u-turn-left",
    };
    return icons[maneuver] || "arrow-forward";
  };

  if (!nextStep) {
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

    const distanceText =
    remainingDistance < 1000
        ? `${remainingDistance} m`
        : `${(remainingDistance/1000).toFixed(1)} km`;

    const minutes = Math.floor(remainingDuration/60);
    const seconds = remainingDuration % 60;
    const timeText =
    minutes > 0
        ? `${minutes} min${seconds>0?` ${seconds}s`:''}`
        : `${seconds}s`;


  const instruction =
    typeof nextStep.html_instructions === "string"
      ? nextStep.html_instructions.replace(/<[^>]*>/g, " ")
      : "Étape suivante";

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
            name={
              getManeuverIcon(nextStep.maneuver) as keyof typeof MaterialIcons.glyphMap
            }
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
        <TouchableOpacity onPress={toggleVoice} style={styles.voiceButton}>
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
