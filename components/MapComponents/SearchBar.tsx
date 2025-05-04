import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TransportMode, Waypoint } from "../../types";
import { TransportModeSelector } from "./TransportModeSelector";
import { useSettings } from "@/hooks/user/SettingsContext";
import { useGetRouteHistory } from "@/hooks/map/MapHooks";
import FavoriteLocationsSelector from "./FavoriteLocationSelector";

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

interface SearchBarProps {
  origin: string;
  destination: string;
  onClose?: () => void;
  waypoints: Waypoint[];
  selectedMode: TransportMode;
  isLoading: boolean;
  liveCoords: { latitude: number; longitude: number } | null;
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
  liveCoords,
  onOriginChange,
  onDestinationChange,
  onWaypointAdd,
  onWaypointRemove,
  onWaypointUpdate,
  onModeSelect,
  onSearch,
  onReverse,
  onClose,
}) => {
  const { avoidTolls, setAvoidTolls, avoidHighways, setAvoidHighways } =
    useSettings();
  const { routes, fetchRouteHistory } = useGetRouteHistory();

  const [originSuggestions, setOriginSuggestions] = useState<
    { description: string; isCurrentLocation?: boolean; isHistory?: boolean }[]
  >([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    { description: string; isHistory?: boolean }[]
  >([]);
  const [waypointSuggestions, setWaypointSuggestions] = useState<{
    [index: number]: { description: string }[];
  }>({});

  const [isOriginFocused, setIsOriginFocused] = useState(false);
  const [isDestinationFocused, setIsDestinationFocused] = useState(false);
  const [showOriginHistory, setShowOriginHistory] = useState(false);
  const [showDestinationHistory, setShowDestinationHistory] = useState(false);
  const [showFavoritesOrigin, setShowFavoritesOrigin] = useState(false);
  const [showFavoritesDestination, setShowFavoritesDestination] = useState(false);

  // Load history on mount
  useEffect(() => {
    fetchRouteHistory();
  }, []);

  const getHistorySuggestions = (type: "origin" | "destination") => {
    if (!routes || routes.length === 0) return [];
    const addresses = routes
      .slice(0, 5)
      .map((route) =>
        type === "origin" ? route.startAddress : route.endAddress
      )
      .filter(
        (address, idx, arr) => address && arr.indexOf(address) === idx
      );
    return addresses.map((desc) => ({ description: desc, isHistory: true }));
  };

  const fetchSuggestions = async (
    text: string
  ): Promise<{ description: string }[]> => {
    if (text.length < 3) return [];
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text
        )}&key=${GOOGLE_PLACES_API_KEY}&language=fr&components=country:fr`
      );
      const data = await res.json();
      if (data.status === "OK") {
        return data.predictions.map((p: any) => ({
          description: p.description,
        }));
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  // Handlers for origin
  const handleOriginChange = async (text: string) => {
    onOriginChange(text);
    setShowFavoritesOrigin(text.length === 0);
    if (text.length === 0) {
      setShowOriginHistory(true);
      const hist = getHistorySuggestions("origin");
      setOriginSuggestions([
        { description: "📍 Ma position", isCurrentLocation: true },
        ...hist,
      ]);
    } else if (text.length < 3) {
      setShowOriginHistory(false);
      setOriginSuggestions([{ description: "📍 Ma position", isCurrentLocation: true }]);
    } else {
      setShowOriginHistory(false);
      const sug = await fetchSuggestions(text);
      setOriginSuggestions([
        { description: "📍 Ma position", isCurrentLocation: true },
        ...sug,
      ]);
    }
  };

  const handleOriginSelect = (item: {
    description: string;
    isCurrentLocation?: boolean;
  }) => {
    onOriginChange(item.isCurrentLocation ? "📍 Ma position" : item.description);
    setOriginSuggestions([]);
  };

  // Handlers for destination
  const handleDestinationChange = async (text: string) => {
    onDestinationChange(text);
    setShowFavoritesDestination(text.length === 0);
    if (text.length === 0) {
      setShowDestinationHistory(true);
      const hist = getHistorySuggestions("destination");
      setDestinationSuggestions([...hist]);
    } else if (text.length < 3) {
      setShowDestinationHistory(false);
      setDestinationSuggestions([]);
    } else {
      setShowDestinationHistory(false);
      const sug = await fetchSuggestions(text);
      setDestinationSuggestions(sug);
    }
  };

  const handleDestinationSelect = (item: { description: string }) => {
    onDestinationChange(item.description);
    setDestinationSuggestions([]);
    setTimeout(() => requestAnimationFrame(onSearch), 150);
  };

  // Handlers for waypoints
  const handleWaypointChange = async (text: string, idx: number) => {
    onWaypointUpdate(idx, text);
    const sug = await fetchSuggestions(text);
    setWaypointSuggestions((p) => ({ ...p, [idx]: sug }));
  };

  const handleWaypointSelect = (item: { description: string }, idx: number) => {
    onWaypointUpdate(idx, item.description);
    setWaypointSuggestions((p) => ({ ...p, [idx]: [] }));
  };

  // Toggles
  const toggleTolls = () => setAvoidTolls(!avoidTolls);
  const toggleHighways = () => setAvoidHighways(!avoidHighways);

  const renderItem = (
    item: { description: string; isCurrentLocation?: boolean; isHistory?: boolean },
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.suggestionItem} onPress={onPress}>
      <Text style={styles.suggestionText}>
        {item.isCurrentLocation && (
          <MaterialIcons name="my-location" size={16} style={styles.iconSmall} />
        )}
        {item.isHistory && (
          <MaterialIcons name="history" size={16} style={[styles.iconSmall, styles.historyIcon]} />
        )}
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Origin Input */}
      <View style={styles.inputWrapper}>
        <MaterialIcons name="place" size={20} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Point de départ"
          placeholderTextColor="#888"
          value={origin}
          onFocus={() => {
            setIsOriginFocused(true);
            handleOriginChange("");
          }}
          onBlur={() =>
            setTimeout(() => setIsOriginFocused(false), 100)
          }
          onChangeText={handleOriginChange}
        />
      </View>
      {showFavoritesOrigin && (
        <FavoriteLocationsSelector
          onSelectLocation={(addr) => {
            onOriginChange(addr);
            setShowFavoritesOrigin(false);
          }}
          isOrigin
        />
      )}
      {isOriginFocused && originSuggestions.length > 0 && (
        <FlatList
          data={originSuggestions}
          keyExtractor={(item, i) => `${item.description}-${i}`}
          renderItem={({ item }) => renderItem(item, () => handleOriginSelect(item))}
          style={styles.suggestionList}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Destination Input */}
      <View style={styles.inputWrapper}>
        <MaterialIcons name="flag" size={20} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Destination"
          placeholderTextColor="#888"
          value={destination}
          onFocus={() => {
            setIsDestinationFocused(true);
            handleDestinationChange("");
          }}
          onBlur={() =>
            setTimeout(() => setIsDestinationFocused(false), 100)
          }
          onChangeText={handleDestinationChange}
        />
      </View>
      {showFavoritesDestination && (
        <FavoriteLocationsSelector
          onSelectLocation={(addr) => {
            onDestinationChange(addr);
            setShowFavoritesDestination(false);
            setTimeout(() => requestAnimationFrame(onSearch), 150);
          }}
          isOrigin={false}
        />
      )}
      {isDestinationFocused && destinationSuggestions.length > 0 && (
        <FlatList
          data={destinationSuggestions}
          keyExtractor={(item, i) => `${item.description}-${i}`}
          renderItem={({ item }) => renderItem(item, () => handleDestinationSelect(item))}
          style={styles.suggestionList}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Waypoints */}
      {waypoints.map((wp, idx) => (
        <View key={wp.id} style={styles.waypointRow}>
          <MaterialIcons name="navigation" size={20} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder={`Étape ${idx + 1}`}
            placeholderTextColor="#888"
            value={wp.address}
            onChangeText={(t) => handleWaypointChange(t, idx)}
          />
          <TouchableOpacity onPress={() => onWaypointRemove(idx)}>
            <MaterialIcons name="close" size={20} color="#d00" />
          </TouchableOpacity>
          {waypointSuggestions[idx]?.length > 0 && (
            <FlatList
              data={waypointSuggestions[idx]}
              keyExtractor={(it) => it.description}
              renderItem={({ item }) =>
                renderItem(item, () => handleWaypointSelect(item, idx))
              }
              style={styles.suggestionList}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      ))}

      {/* Reverse & Add Waypoint */}
      <View style={styles.buttonRow}>
        {waypoints.length === 0 && (
          <TouchableOpacity onPress={onReverse} style={styles.reverseBtn}>
            <MaterialIcons name="swap-vert" size={24} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onWaypointAdd}
          style={styles.addWaypointBtn}
          disabled={waypoints.length >= 5}
        >
          <MaterialIcons name="add" size={24} />
          <Text style={styles.addText}>Ajouter une étape ({waypoints.length}/5)</Text>
        </TouchableOpacity>
      </View>

      {/* Mode & Options */}
      <TransportModeSelector
        selectedMode={selectedMode}
        onModeSelect={onModeSelect}
      />
      {selectedMode === "driving" && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity onPress={toggleTolls} style={styles.toggleRow}>
            <MaterialIcons name={avoidTolls ? "toggle-on" : "toggle-off"} size={32} />
            <Text style={styles.toggleLabel}>Éviter péages</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleHighways} style={styles.toggleRow}>
            <MaterialIcons name={avoidHighways ? "toggle-on" : "toggle-off"} size={32} />
            <Text style={styles.toggleLabel}>Éviter autoroutes</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Button */}
      <TouchableOpacity
        style={[styles.searchBtn, isLoading && { opacity: 0.6 }]}
        onPress={onSearch}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.searchTxt}>Rechercher</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", borderRadius: 12, padding: 16, margin: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 5 },
  topRow: { flexDirection: "row", justifyContent: "flex-end" },
  closeBtn: { padding: 4 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#f2f2f2", borderRadius: 24, paddingHorizontal: 12, marginVertical: 8 },
  icon: { marginRight: 8, color: "#888" },
  iconSmall: { marginRight: 6, color: "#888" },
  input: { flex: 1, height: 42, color: "#000" },
  suggestionList: { backgroundColor: "#fff", borderRadius: 8, maxHeight: 140, marginHorizontal: 4, marginTop: -4, paddingVertical: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 4, zIndex: 999 },
  suggestionItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  suggestionText: { fontSize: 14, color: "#000", flexDirection: "row", alignItems: "center" },
  historyIcon: { color: "#555" },
  waypointRow: { flexDirection: "row", alignItems: "center", marginVertical: 4, zIndex: 10 },
  buttonRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 12 },
  reverseBtn: { padding: 8 },
  addWaypointBtn: { flexDirection: "row", alignItems: "center" },
  addText: { marginLeft: 6, fontSize: 14, color: "#2196F3" },
  toggleContainer: { flexDirection: "row", justifyContent: "space-around", marginVertical: 12 },
  toggleRow: { flexDirection: "row", alignItems: "center" },
  toggleLabel: { marginLeft: 6, fontSize: 14, color: "#444" },
  searchBtn: { backgroundColor: "#2196F3", borderRadius: 24, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  searchTxt: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
