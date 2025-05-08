// SearchBar.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  AppState,
  AppStateStatus,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TransportMode, Waypoint } from "@/types";
import { TransportModeSelector } from "./TransportModeSelector";
import { useSettings } from "@/hooks/user/SettingsContext";
import { useGetRouteHistory, useGetFavoriteLocations } from "@/hooks/map/MapHooks";
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
  const { fetchFavoriteLocations } = useGetFavoriteLocations();

  const appState = useRef(AppState.currentState);
  const lastFavoritesCheck = useRef(Date.now());

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

  // Chargement initial des données
  useEffect(() => {
    fetchRouteHistory();
    fetchFavoriteLocations();
  }, []);

  // Gestion des rechargements en arrière-plan lorsque l'application revient au premier plan
  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Fonction pour gérer les changements d'état de l'application
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // Si l'application était en arrière-plan et revient au premier plan
    if (appState.current.match(/inactive|background/) && nextAppState === "active") {
      const now = Date.now();
      // Si plus de 30 secondes se sont écoulées depuis la dernière vérification
      if (now - lastFavoritesCheck.current > 30000) {
        // Recharger les favoris en arrière-plan
        fetchFavoriteLocations();
        lastFavoritesCheck.current = now;
      }
    }

    appState.current = nextAppState;
  };

  const getHistorySuggestions = (type: "origin" | "destination") => {
    if (!routes || routes.length === 0) return [];
    const addresses = routes
        .slice(0, 5)
        .map((route) =>
            type === "origin" ? route.startAddress : route.endAddress
        )
        .filter((address, idx, arr) => address && arr.indexOf(address) === idx);
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

  // --- Handlers pour origin ---
  const handleOriginChange = async (text: string) => {
    onOriginChange(text);

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

  // --- Handlers pour waypoints ---
  const handleWaypointChange = async (text: string, idx: number) => {
    onWaypointUpdate(idx, text);
    const sug = await fetchSuggestions(text);
    setWaypointSuggestions((p) => ({ ...p, [idx]: sug }));
  };
  const handleWaypointSelect = (item: { description: string }, idx: number) => {
    onWaypointUpdate(idx, item.description);
    setWaypointSuggestions((p) => ({ ...p, [idx]: [] }));
  };

  // --- Handlers pour destination ---
  const handleDestinationChange = async (text: string) => {
    onDestinationChange(text);

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
  };

  const handleOriginFocus = () => {
    setIsOriginFocused(true);

    // Si le champ est vide, afficher l'historique
    if (origin.length === 0) {
      handleOriginChange("");
    }
  };

  const handleDestinationFocus = () => {
    setIsDestinationFocused(true);

    // Si le champ est vide, afficher l'historique
    if (destination.length === 0) {
      handleDestinationChange("");
    }
  };

  const handleOriginBlur = () => {
    // Utiliser setTimeout pour permettre le clic sur les suggestions
    setTimeout(() => {
      setIsOriginFocused(false);
    }, 150);
  };

  const handleDestinationBlur = () => {
    // Utiliser setTimeout pour permettre le clic sur les suggestions
    setTimeout(() => {
      setIsDestinationFocused(false);
    }, 150);
  };

  // Handler pour cliquer sur un favori (va remplir la destination)
  const handleFavoriteSelect = (address: string) => {
    onDestinationChange(address);
  };

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

  const toggleTolls = () => setAvoidTolls(!avoidTolls);
  const toggleHighways = () => setAvoidHighways(!avoidHighways);

  return (
      <View style={styles.container}>
        {/* En-tête */}
        <View style={styles.topRow}>
          <Text style={styles.title}>Recherche d'itinéraire</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Point de départ */}
        <View style={styles.inputWrapper}>
          <MaterialIcons name="place" size={20} style={styles.icon} />
          <TextInput
              style={styles.input}
              placeholder="Point de départ"
              placeholderTextColor="#888"
              value={origin}
              onFocus={handleOriginFocus}
              onBlur={handleOriginBlur}
              onChangeText={handleOriginChange}
          />
        </View>
        {isOriginFocused && originSuggestions.length > 0 && (
            <FlatList
                data={originSuggestions}
                keyExtractor={(item, i) => `${item.description}-${i}`}
                renderItem={({ item }) => renderItem(item, () => handleOriginSelect(item))}
                style={styles.suggestionList}
                keyboardShouldPersistTaps="handled"
            />
        )}

        {/* Étapes (waypoints) */}
        {waypoints.map((wp, idx) => (
            <View key={wp.id} style={{ marginBottom: 12, zIndex: 10 }}>
              <View style={styles.waypointRow}>
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
              </View>
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

        {/* Destination */}
        <View style={styles.inputWrapper}>
          <MaterialIcons name="flag" size={20} style={styles.icon} />
          <TextInput
              style={styles.input}
              placeholder="Destination"
              placeholderTextColor="#888"
              value={destination}
              onFocus={handleDestinationFocus}
              onBlur={handleDestinationBlur}
              onChangeText={handleDestinationChange}
          />
        </View>
        {isDestinationFocused && destinationSuggestions.length > 0 && (
            <FlatList
                data={destinationSuggestions}
                keyExtractor={(item, i) => `${item.description}-${i}`}
                renderItem={({ item }) =>
                    renderItem(item, () => handleDestinationSelect(item))
                }
                style={styles.suggestionList}
                keyboardShouldPersistTaps="handled"
            />
        )}

        {/* Section Favoris (sans titre, sans bordure) */}
        <View style={styles.favoritesContainer}>
          <FavoriteLocationsSelector
              onSelectLocation={handleFavoriteSelect}
              isOrigin={false}
          />
        </View>

        {/* Inverser / Ajouter une étape */}
        <View style={styles.buttonRow}>
          {waypoints.length === 0 && (
              <TouchableOpacity onPress={onReverse} style={styles.reverseBtn}>
                <MaterialIcons name="swap-vert" size={24} />
              </TouchableOpacity>
          )}
          <TouchableOpacity
              onPress={onWaypointAdd}
              style={styles.addWaypointBtn}
              disabled={waypoints.length >= 3}
          >
            <MaterialIcons name="add" size={24} />
            <Text style={styles.addText}>
              Ajouter une étape ({waypoints.length}/3)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mode de transport et options */}
        <TransportModeSelector
            selectedMode={selectedMode}
            onModeSelect={onModeSelect}
        />
        {selectedMode === "driving" && (
            <View style={styles.toggleContainer}>
              <TouchableOpacity onPress={toggleTolls} style={styles.toggleRow}>
                <MaterialIcons
                    name={avoidTolls ? "toggle-on" : "toggle-off"}
                    size={32}
                />
                <Text style={styles.toggleLabel}>Éviter péages</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleHighways} style={styles.toggleRow}>
                <MaterialIcons
                    name={avoidHighways ? "toggle-on" : "toggle-off"}
                    size={32}
                />
                <Text style={styles.toggleLabel}>Éviter autoroutes</Text>
              </TouchableOpacity>
            </View>
        )}

        {/* Bouton Rechercher */}
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
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  topRow: { flexDirection: "row", justifyContent: "flex-end" },
  closeBtn: { padding: 4 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 24,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  icon: { marginRight: 8, color: "#888" },
  iconSmall: { marginRight: 6, color: "#888" },
  input: { flex: 1, height: 42, color: "#000" },
  suggestionList: {
    backgroundColor: "#fff",
    borderRadius: 8,
    maxHeight: 140,
    marginHorizontal: 4,
    marginTop: -4,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    zIndex: 100,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    fontSize: 14,
    color: "#000",
    flexDirection: "row",
    alignItems: "center",
  },
  historyIcon: { color: "#555" },
  waypointRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  favoritesContainer: {
    marginBottom: 12,
  },
  reverseBtn: { padding: 8 },
  addWaypointBtn: { flexDirection: "row", alignItems: "center" },
  addText: { marginLeft: 6, fontSize: 14, color: "#2196F3" },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 12,
  },
  toggleRow: { flexDirection: "row", alignItems: "center" },
  toggleLabel: { marginLeft: 6, fontSize: 14, color: "#444" },
  searchBtn: {
    backgroundColor: "#2196F3",
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  searchTxt: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    paddingLeft: 8,
    alignSelf: "center",
  },
});