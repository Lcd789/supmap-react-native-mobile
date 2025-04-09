import React from "react";
import { View, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TransportMode } from "../../types";
import { transportModeStyles } from "../../styles/styles";

interface TransportModeSelectorProps {
  selectedMode: TransportMode;
  onModeSelect: (mode: TransportMode) => void;
}

export const TransportModeSelector: React.FC<TransportModeSelectorProps> = ({
  selectedMode,
  onModeSelect,
}) => {
  return (
    <View style={transportModeStyles.transportMode}>
      {[
        { mode: "driving", icon: "directions-car" },
        { mode: "walking", icon: "directions-walk" },
        { mode: "bicycling", icon: "directions-bike" },
        { mode: "transit", icon: "directions-transit" },
      ].map(({ mode, icon }) => (
        <TouchableOpacity
          key={mode}
          style={[
            transportModeStyles.modeButton,
            selectedMode === mode && transportModeStyles.selectedMode,
          ]}
          onPress={() => onModeSelect(mode as TransportMode)}
        >
          <MaterialIcons
            name={
              icon as
                | "directions-car"
                | "directions-walk"
                | "directions-bike"
                | "directions-transit"
            }
            size={24}
            color={selectedMode === mode ? "white" : "black"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};
