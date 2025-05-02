// SearchBar.tsx
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
import { TransportMode, Waypoint } from "@/types";
import { TransportModeSelector } from "./TransportModeSelector";
import { useSettings } from "@/hooks/user/SettingsContext";
import { useGetRouteHistory } from "@/hooks/map/MapHooks";

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

interface SearchBarProps {
  origin: string;
  destination: string;
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
  onClose?: () => void;
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
  const { avoidTolls, setAvoidTolls, avoidHighways, setAvoidHighways } = useSettings();
  const { routes, fetchRouteHistory } = useGetRouteHistory();

  const [originSuggestions, setOriginSuggestions] = useState<{ description: string; isCurrentLocation?: boolean }[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<{ description: string; isCurrentLocation?: boolean }[]>([]);
  const [waypointSuggestions, setWaypointSuggestions] = useState<{ [index: number]: { description: string }[] }>({});
  const [isOriginFocused, setIsOriginFocused] = useState(false);
  const [isDestinationFocused, setIsDestinationFocused] = useState(false);
  const [showOriginHistory, setShowOriginHistory] = useState(false);
  const [showDestinationHistory, setShowDestinationHistory] = useState(false);

  // Récupérer l'historique au chargement du composant
  useEffect(() => {
    fetchRouteHistory();
  }, []);

  // Transformer les routes en suggestions d'historique
  const getHistorySuggestions = (type: 'origin' | 'destination') => {
    if (!routes || routes.length === 0) return [];

    // Prendre les 5 dernières routes et extraire les adresses uniques
    const addresses = routes
        .slice(0, 5)
        .map(route => type === 'origin' ? route.startAddress : route.endAddress)
        // Filtrer les adresses uniques et non vides
        .filter((address, index, self) =>
            address &&
            address.trim() !== '' &&
            self.indexOf(address) === index
        );

    return addresses.map(address => ({ description: address }));
  };

  const fetchSuggestions = async (text: string): Promise<{ description: string }[]> => {
    if (text.length < 3) return [];
    try {
      const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_PLACES_API_KEY}&language=fr&components=country:fr`
      );
      const data = await res.json();
      if (data.status === "OK") {
        return data.predictions.map((p: any) => ({ description: p.description }));
      }
    } catch (err) {
      console.error("Erreur autocomplétion :", err);
    }
    return [];
  };

  const handleOriginChange = async (text: string) => {
    onOriginChange(text);

    // Si le texte est vide, afficher l'historique
    if (text.length === 0) {
      setShowOriginHistory(true);
      const historySuggestions = getHistorySuggestions('origin');
      setOriginSuggestions([
        { description: "📍 Ma position", isCurrentLocation: true },
        ...historySuggestions
      ]);
    } else {
      // Sinon afficher les suggestions de l'API
      setShowOriginHistory(false);
      const suggestions = await fetchSuggestions(text);
      setOriginSuggestions([
        { description: "📍 Ma position", isCurrentLocation: true },
        ...suggestions,
      ]);
    }
  };

  const handleDestinationChange = async (text: string) => {
    onDestinationChange(text);

    // Si le texte est vide, afficher l'historique
    if (text.length === 0) {
      setShowDestinationHistory(true);
      const historySuggestions = getHistorySuggestions('destination');
      setDestinationSuggestions([
        { description: "📍 Ma position", isCurrentLocation: true },
        ...historySuggestions
      ]);
    } else {
      // Sinon afficher les suggestions de l'API
      setShowDestinationHistory(false);
      const suggestions = await fetchSuggestions(text);
      setDestinationSuggestions([
        { description: "📍 Ma position", isCurrentLocation: true },
        ...suggestions,
      ]);
    }
  };

  const handleWaypointChange = async (text: string, idx: number) => {
    onWaypointUpdate(idx, text);
    const suggestions = await fetchSuggestions(text);
    setWaypointSuggestions(prev => ({
      ...prev,
      [idx]: suggestions,
    }));
  };

  const renderSuggestionItem = (
      item: { description: string; isCurrentLocation?: boolean },
      onPress: () => void,
      isHistory: boolean = false
  ) => (
      <TouchableOpacity onPress={onPress} style={styles.suggestionItem}>
        <Text style={styles.suggestionText}>
          {item.isCurrentLocation ? (
              <MaterialIcons name="my-location" size={16} />
          ) : isHistory ? (
              <MaterialIcons name="history" size={16} color="#777" />
          ) : null}{" "}
          {item.description}
        </Text>
      </TouchableOpacity>
  );

  // Gérer l'affichage de l'historique lors du focus
  const handleOriginFocus = () => {
    setIsOriginFocused(true);
    if (origin.length === 0) {
      setShowOriginHistory(true);
      const historySuggestions = getHistorySuggestions('origin');
      setOriginSuggestions([
        { description: "📍 Ma position", isCurrentLocation: true },
        ...historySuggestions
      ]);
    }
  };

  const handleDestinationFocus = () => {
    setIsDestinationFocused(true);
    if (destination.length === 0) {
      setShowDestinationHistory(true);
      const historySuggestions = getHistorySuggestions('destination');
      setDestinationSuggestions([
        { description: "📍 Ma position", isCurrentLocation: true },
        ...historySuggestions
      ]);
    }
  };

  return (
      <View style={styles.container}>
        {/* En-tête */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Rechercher un itinéraire</Text>
          {onClose && (
              <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
          )}
        </View>

        {/* Départ & Destination */}
        <View style={styles.fieldContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
                style={styles.input}
                placeholder="Point de départ"
                placeholderTextColor="#888"
                value={origin}
                onFocus={handleOriginFocus}
                onBlur={() => {
                  setTimeout(() => {
                    setIsOriginFocused(false);
                    setShowOriginHistory(false);
                  }, 100);
                }}
                onChangeText={handleOriginChange}
            />
            {isOriginFocused && originSuggestions.length > 0 && (
                <FlatList
                    data={originSuggestions}
                    keyExtractor={(item, index) => `origin-${item.description}-${index}`}
                    renderItem={({ item }) =>
                        renderSuggestionItem(
                            item,
                            () => {
                              onOriginChange(item.description);
                              setOriginSuggestions([]);
                            },
                            showOriginHistory && !item.isCurrentLocation
                        )
                    }
                    style={styles.suggestionList}
                />
            )}
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
                style={styles.input}
                placeholder="Destination"
                placeholderTextColor="#888"
                value={destination}
                onFocus={handleDestinationFocus}
                onBlur={() => {
                  setTimeout(() => {
                    setIsDestinationFocused(false);
                    setShowDestinationHistory(false);
                  }, 100);
                }}
                onChangeText={handleDestinationChange}
            />
            {isDestinationFocused && destinationSuggestions.length > 0 && (
                <FlatList
                    data={destinationSuggestions}
                    keyExtractor={(item, index) => `destination-${item.description}-${index}`}
                    renderItem={({ item }) =>
                        renderSuggestionItem(
                            item,
                            () => {
                              onDestinationChange(item.description);
                              setDestinationSuggestions([]);
                            },
                            showDestinationHistory && !item.isCurrentLocation
                        )
                    }
                    style={styles.suggestionList}
                />
            )}
          </View>
        </View>

        {/* Waypoints dynamiques */}
        {waypoints.map((wp, idx) => (
            <View key={wp.id} style={styles.inputWrapper}>
              <View style={styles.waypointRow}>
                <TextInput
                    style={styles.input}
                    placeholder={`Étape ${idx + 1}`}
                    placeholderTextColor="#888"
                    value={wp.address}
                    onChangeText={text => handleWaypointChange(text, idx)}
                />
                <TouchableOpacity onPress={() => onWaypointRemove(idx)}>
                  <MaterialIcons name="close" size={24} color="red" />
                </TouchableOpacity>
              </View>
              {waypointSuggestions[idx]?.length > 0 && (
                  <FlatList
                      data={waypointSuggestions[idx]}
                      keyExtractor={(item, index) => `waypoint-${idx}-${item.description}-${index}`}
                      renderItem={({ item }) =>
                          renderSuggestionItem(item, () => {
                            onWaypointUpdate(idx, item.description);
                            setWaypointSuggestions(prev => ({ ...prev, [idx]: [] }));
                          })
                      }
                      style={styles.suggestionList}
                  />
              )}
            </View>
        ))}

        {/* Bouton Ajouter une étape */}
        <TouchableOpacity style={styles.addButton} onPress={onWaypointAdd}>
          <MaterialIcons name="add" size={20} color="#2196F3" />
          <Text style={styles.addButtonText}>Ajouter une étape</Text>
        </TouchableOpacity>

        {/* Mode, toggles et recherche */}
        <TransportModeSelector selectedMode={selectedMode} onModeSelect={onModeSelect} />
        <View style={styles.toggleRow}>
          <TouchableOpacity onPress={() => setAvoidTolls(!avoidTolls)} style={styles.toggleItem}>
            <MaterialIcons name={avoidTolls ? "toggle-on" : "toggle-off"} size={32} color={avoidTolls ? "#2196F3" : "#ccc"} />
            <Text style={styles.toggleText}>Éviter les péages</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAvoidHighways(!avoidHighways)} style={styles.toggleItem}>
            <MaterialIcons name={avoidHighways ? "toggle-on" : "toggle-off"} size={32} color={avoidHighways ? "#2196F3" : "#ccc"} />
            <Text style={styles.toggleText}>Éviter les autoroutes</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={onSearch} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchButtonText}>Rechercher</Text>}
        </TouchableOpacity>
      </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", padding: 16, borderRadius: 12, margin: 12, elevation: 4 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#222" },
  fieldContainer: { marginBottom: 12 },
  inputWrapper: { position: "relative", marginBottom: 8 },
  input: { backgroundColor: "#f1f1f1", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ccc", fontSize: 16, color: "#000" },
  suggestionList: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
    zIndex: 10,
  },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  suggestionText: { fontSize: 15, color: "#222" },
  waypointRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addButton: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  addButtonText: { color: "#2196F3", fontSize: 16 },
  toggleRow: { marginVertical: 12 },
  toggleItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  toggleText: { fontSize: 15, color: "#333" },
  searchButton: { backgroundColor: "#2196F3", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  searchButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});