import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TransportMode, Waypoint } from "../../types";
import { TransportModeSelector } from "./TransportModeSelector";
import { searchBarStyles } from "../../styles/styles";

interface SearchBarProps {
  origin: string;
  destination: string;
  waypoints: Waypoint[];
  selectedMode: TransportMode;
  isLoading: boolean;
  onOriginChange: (text: string) => void;
  onDestinationChange: (text: string) => void;
  onWaypointAdd: () => void;
  onWaypointRemove: (index: number) => void;
  onWaypointUpdate: (index: number, text: string) => void;
  onModeSelect: (mode: TransportMode) => void;
  onSearch: () => void;
  onReverse: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  origin,
  destination,
  waypoints,
  selectedMode,
  isLoading,
  onOriginChange,
  onDestinationChange,
  onWaypointAdd,
  onWaypointRemove,
  onWaypointUpdate,
  onModeSelect,
  onSearch,
  onReverse,
}) => {
  const isReverseButtonVisible = waypoints.length === 0;

  return (
    <View style={searchBarStyles.searchContainer}>
      <TextInput
        style={searchBarStyles.input}
        placeholder="Point de départ"
        value={origin}
        onChangeText={onOriginChange}
      />

      <FlatList
        data={waypoints}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={searchBarStyles.waypointContainer}>
            <TextInput
              style={searchBarStyles.input}
              placeholder={`Étape ${index + 1}`}
              value={item.address}
              onChangeText={(text) => onWaypointUpdate(index, text)}
            />
            <TouchableOpacity
              style={searchBarStyles.deleteWaypointIcon}
              onPress={() => onWaypointRemove(index)}
            >
              <MaterialIcons name="close" size={24} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}
        style={searchBarStyles.waypointList}
        keyboardShouldPersistTaps="handled"
      />

      <View
        style={[
          searchBarStyles.buttonContainer,
          isReverseButtonVisible
            ? { justifyContent: "space-between" }
            : { justifyContent: "center" },
        ]}
      >
        {isReverseButtonVisible && (
          <TouchableOpacity
            style={searchBarStyles.reverseButton}
            onPress={onReverse}
          >
            <MaterialIcons name="swap-vert" size={24} color="blue" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            searchBarStyles.addWaypointButton,
            waypoints.length >= 5 && { opacity: 0.5 },
          ]}
          onPress={onWaypointAdd}
          disabled={waypoints.length >= 5}
        >
          <MaterialIcons name="add" size={24} color="#2196F3" />
          <Text style={searchBarStyles.addWaypointText}>
            Ajouter une étape ({waypoints.length}/5)
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={searchBarStyles.input}
        placeholder="Destination"
        value={destination}
        onChangeText={onDestinationChange}
      />

      <TransportModeSelector
        selectedMode={selectedMode}
        onModeSelect={onModeSelect}
      />

      <TouchableOpacity
        style={searchBarStyles.searchButton}
        onPress={onSearch}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={searchBarStyles.searchButtonText}>Rechercher</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
