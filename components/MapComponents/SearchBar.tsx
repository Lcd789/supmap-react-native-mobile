// SearchBar.tsx
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
  avoidTolls: boolean;
  onOriginChange: (text: string) => void;
  onDestinationChange: (text: string) => void;
  onWaypointAdd: () => void;
  onWaypointRemove: (index: number) => void;
  onWaypointUpdate: (index: number, text: string) => void;
  onModeSelect: (mode: TransportMode) => void;
  onSearch: () => void;
  onReverse: () => void;
  onToggleTolls: () => void;
}

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

export const SearchBar: React.FC<SearchBarProps> = ({
  origin,
  destination,
  waypoints,
  selectedMode,
  isLoading,
  avoidTolls,
  onOriginChange,
  onDestinationChange,
  onWaypointAdd,
  onWaypointRemove,
  onWaypointUpdate,
  onModeSelect,
  onSearch,
  onReverse,
  onToggleTolls,
}) => {
  const isReverseButtonVisible = waypoints.length === 0;

  const [originSuggestions, setOriginSuggestions] = React.useState<string[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = React.useState<string[]>([]);
  const [waypointSuggestions, setWaypointSuggestions] = React.useState<string[][]>([]);

  const fetchSuggestions = async (input: string): Promise<string[]> => {
    if (input.length < 3) return [];
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&key=${GOOGLE_PLACES_API_KEY}&language=fr`
      );
      const data = await response.json();
      if (data.status === "OK") {
        return data.predictions.map((p: any) => p.description);
      }
    } catch (error) {
      console.error("Erreur de complétion :", error);
    }
    return [];
  };

  const handleOriginChange = async (text: string) => {
    onOriginChange(text);
    const suggestions = await fetchSuggestions(text);
    setOriginSuggestions(suggestions);
  };

  const handleDestinationChange = async (text: string) => {
    onDestinationChange(text);
    const suggestions = await fetchSuggestions(text);
    setDestinationSuggestions(suggestions);
  };

  const handleWaypointChange = async (index: number, text: string) => {
    onWaypointUpdate(index, text);
    const suggestions = await fetchSuggestions(text);
    setWaypointSuggestions((prev) => {
      const updated = [...prev];
      updated[index] = suggestions;
      return updated;
    });
  };

  const handleOriginSelect = (suggestion: string) => {
    onOriginChange(suggestion);
    setOriginSuggestions([]);
  };

  const handleDestinationSelect = (suggestion: string) => {
    onDestinationChange(suggestion);
    setDestinationSuggestions([]);
  };

  const handleWaypointSelect = (index: number, suggestion: string) => {
    onWaypointUpdate(index, suggestion);
    setWaypointSuggestions((prev) => {
      const updated = [...prev];
      updated[index] = [];
      return updated;
    });
  };

  return (
    <View style={searchBarStyles.searchContainer}>
      <TextInput
        style={searchBarStyles.input}
        placeholder="Point de départ"
        value={origin}
        onChangeText={handleOriginChange}
      />
      {originSuggestions.length > 0 && (
        <FlatList
          data={originSuggestions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleOriginSelect(item)}>
              <Text style={{ padding: 8, backgroundColor: "#eee" }}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <FlatList
        data={waypoints}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={searchBarStyles.waypointContainer}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={searchBarStyles.input}
                placeholder={`Étape ${index + 1}`}
                value={item.address}
                onChangeText={(text) => handleWaypointChange(index, text)}
              />
              {waypointSuggestions[index]?.length > 0 && (
                <FlatList
                  data={waypointSuggestions[index]}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleWaypointSelect(index, item)}>
                      <Text style={{ padding: 8, backgroundColor: "#eee" }}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
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
        onChangeText={handleDestinationChange}
      />
      {destinationSuggestions.length > 0 && (
        <FlatList
          data={destinationSuggestions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleDestinationSelect(item)}>
              <Text style={{ padding: 8, backgroundColor: "#eee" }}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TransportModeSelector
        selectedMode={selectedMode}
        onModeSelect={onModeSelect}
      />

      {/* Bouton éviter les péages */}
      <TouchableOpacity
        onPress={onToggleTolls}
        style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}
      >
        <MaterialIcons
          name={avoidTolls ? "toggle-on" : "toggle-off"}
          size={32}
          color={avoidTolls ? "#2196F3" : "#888"}
        />
        <Text style={{ marginLeft: 10, fontSize: 16 }}>
          Éviter les routes à péages
        </Text>
      </TouchableOpacity>

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
