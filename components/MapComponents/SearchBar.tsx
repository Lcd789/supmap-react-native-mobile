import React, { useEffect, useState } from "react";
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
import { getAddressFromCoords } from "@/utils/geocoding";
import { useHistory } from "@/hooks/useHistory";
import { Appearance } from "react-native";

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

interface SearchBarProps {
  origin: string;
  destination: string;
  waypoints: Waypoint[];
  selectedMode: TransportMode;
  isLoading: boolean;
  avoidTolls: boolean;
  liveCoords: { latitude: number; longitude: number } | null;
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

export const SearchBar: React.FC<SearchBarProps> = ({
  origin,
  destination,
  waypoints,
  selectedMode,
  isLoading,
  avoidTolls,
  liveCoords,
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

  const [originSuggestions, setOriginSuggestions] = useState<
    { description: string; isCurrentLocation?: boolean }[]
  >([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    { description: string }[]
  >([]);
  const [waypointSuggestions, setWaypointSuggestions] = useState<{
    [index: number]: { description: string }[];
  }>({});

  const { getHistory } = useHistory();
  const [history, setHistory] = useState<any[]>([]);
  const [isOriginFocused, setIsOriginFocused] = useState(false);
  const [isDestinationFocused, setIsDestinationFocused] = useState(false);

  useEffect(() => {
    getHistory().then((h) => {
      const uniqueHistory = h.filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            (t) => t.origin === item.origin && t.destination === item.destination
          )
      );
      setHistory(uniqueHistory);
    });
  }, []);

  const fetchSuggestions = async (
    text: string
  ): Promise<{ description: string }[]> => {
    if (text.length < 3) return [];
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text
        )}&key=${GOOGLE_PLACES_API_KEY}&language=fr`
      );
      const data = await response.json();
      if (data.status === "OK") {
        return data.predictions.map((p: any) => ({
          description: p.description,
        }));
      }
    } catch (err) {
      console.error("Erreur autocomplétion :", err);
    }
    return [];
  };

  const handleOriginChange = async (text: string) => {
    onOriginChange(text);
    if (text.length < 3) {
      setOriginSuggestions([
        { description: "📍 Ma position", isCurrentLocation: true },
      ]);
      return;
    }
    const suggestions = await fetchSuggestions(text);
    setOriginSuggestions([
      { description: "📍 Ma position", isCurrentLocation: true },
      ...suggestions,
    ]);
  };

  const handleDestinationChange = async (text: string) => {
    onDestinationChange(text);
    if (text.length < 3) {
      setDestinationSuggestions([]);
      return;
    }
    const suggestions = await fetchSuggestions(text);
    setDestinationSuggestions(suggestions);
  };

  const handleWaypointChange = async (text: string, index: number) => {
    onWaypointUpdate(index, text);
    const suggestions = await fetchSuggestions(text);
    setWaypointSuggestions((prev) => ({ ...prev, [index]: suggestions }));
  };

  const handleOriginSelect = async (item: {
    description: string;
    isCurrentLocation?: boolean;
  }) => {
    if (item.isCurrentLocation) {
      if (liveCoords) {
        try {
          const address = await getAddressFromCoords(
            liveCoords.latitude,
            liveCoords.longitude
          );
          if (address) onOriginChange(address);
          else alert("Impossible de récupérer l’adresse.");
        } catch (err) {
          console.error("Erreur reverse geocoding :", err);
          alert("Erreur lors de la récupération de l’adresse.");
        }
      } else alert("Localisation non disponible.");
    } else onOriginChange(item.description);
    setOriginSuggestions([]);
    setTimeout(onSearch, 100);
  };

  const handleDestinationSelect = (item: { description: string }) => {
    onDestinationChange(item.description);
    setDestinationSuggestions([]);
    setTimeout(onSearch, 100);
  };

  const handleWaypointSelect = (
    item: { description: string },
    index: number
  ) => {
    onWaypointUpdate(index, item.description);
    setWaypointSuggestions((prev) => ({ ...prev, [index]: [] }));
  };

  const renderSuggestionItem = (
    item: { description: string; isCurrentLocation?: boolean },
    onPress: () => void
  ) => (
    <TouchableOpacity
      onPress={onPress}
      style={searchBarStyles.suggestionItem}
    >
      <Text style={{ color: "#000" }}>
        {item.isCurrentLocation ? (
          <>
            <MaterialIcons name="my-location" size={16} /> {item.description}
          </>
        ) : (
          item.description
        )}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={searchBarStyles.searchContainer}>
      <TextInput
        style={[searchBarStyles.input, { color: "#000" }]}
        placeholder="Point de départ"
        placeholderTextColor="#555"
        value={origin}
        onFocus={() => setIsOriginFocused(true)}
        onBlur={() => setIsOriginFocused(false)}
        onChangeText={handleOriginChange}
      />
      {origin.length < 3 && isOriginFocused && history.length > 0 && (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={searchBarStyles.suggestionItem}
              onPress={() => handleOriginSelect({ description: item.origin })}
            >
              <Text style={{ color: "#000" }}>
                {item.origin} → {item.destination}
              </Text>
            </TouchableOpacity>
          )}
          style={searchBarStyles.suggestionList}
        />
      )}
      {originSuggestions.length > 0 && (
        <FlatList
          data={originSuggestions}
          keyExtractor={(item) => item.description}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) =>
            renderSuggestionItem(item, () => handleOriginSelect(item))
          }
          style={searchBarStyles.suggestionList}
        />
      )}

      <TextInput
        style={[searchBarStyles.input, { color: "#000" }]}
        placeholder="Destination"
        placeholderTextColor="#555"
        value={destination}
        onFocus={() => setIsDestinationFocused(true)}
        onBlur={() => setIsDestinationFocused(false)}
        onChangeText={handleDestinationChange}
      />
      {destination.length < 3 && isDestinationFocused && history.length > 0 && (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id + "_dest"}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={searchBarStyles.suggestionItem}
              onPress={() => handleDestinationSelect({ description: item.destination })}
            >
              <Text style={{ color: "#000" }}>
                {item.origin} → {item.destination}
              </Text>
            </TouchableOpacity>
          )}
          style={searchBarStyles.suggestionList}
        />
      )}
      {destinationSuggestions.length > 0 && (
        <FlatList
          data={destinationSuggestions}
          keyExtractor={(item) => item.description}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) =>
            renderSuggestionItem(item, () => handleDestinationSelect(item))
          }
          style={searchBarStyles.suggestionList}
        />
      )}

      {waypoints.map((wp, index) => (
        <View
          key={wp.id}
          style={[
            searchBarStyles.waypointContainer,
            { position: "relative", zIndex: 20 },
          ]}
        >
          <TextInput
            style={[searchBarStyles.input, { color: "#000" }]}
            placeholder={`Étape ${index + 1}`}
            placeholderTextColor="#555"
            value={wp.address}
            onChangeText={(text) => handleWaypointChange(text, index)}
          />
          {waypointSuggestions[index]?.length > 0 && (
            <View
              style={{
                position: "absolute",
                top: 52,
                left: 0,
                right: 0,
                zIndex: 100,
              }}
            >
              <FlatList
                data={waypointSuggestions[index]}
                keyExtractor={(item) => item.description}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) =>
                  renderSuggestionItem(item, () =>
                    handleWaypointSelect(item, index)
                  )
                }
                style={searchBarStyles.suggestionList}
              />
            </View>
          )}
          <TouchableOpacity
            style={searchBarStyles.deleteWaypointIcon}
            onPress={() => onWaypointRemove(index)}
          >
            <MaterialIcons name="close" size={24} color="#ff4444" />
          </TouchableOpacity>
        </View>
      ))}

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

      <TransportModeSelector
        selectedMode={selectedMode}
        onModeSelect={onModeSelect}
      />

      {selectedMode === "driving" && (
        <TouchableOpacity
          onPress={onToggleTolls}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 12,
          }}
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
      )}

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
