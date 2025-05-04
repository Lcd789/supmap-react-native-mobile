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
import { useSettings } from "@/hooks/user/SettingsContext";
import { useGetRouteHistory } from "@/hooks/map/MapHooks";

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

    const isReverseButtonVisible = waypoints.length === 0;

    const [originSuggestions, setOriginSuggestions] = useState<
        { description: string; isCurrentLocation?: boolean; isHistory?: boolean }[]
    >([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState<
        { description: string; isHistory?: boolean }[]
    >([]);
    const [waypointSuggestions, setWaypointSuggestions] = useState<{
        [index: number]: { description: string }[];
    }>({});

    const { routes, fetchRouteHistory } = useGetRouteHistory();
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

        return addresses.map(address => ({ description: address, isHistory: true }));
    };

    const fetchSuggestions = async (
        text: string
    ): Promise<{ description: string }[]> => {
        if (text.length < 3) return [];
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                    text
                )}&key=${GOOGLE_PLACES_API_KEY}&language=fr&components=country:fr`
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

        // Si le texte est vide, afficher l'historique
        if (text.length === 0) {
            setShowOriginHistory(true);
            const historySuggestions = getHistorySuggestions('origin');
            setOriginSuggestions([
                { description: "📍 Ma position", isCurrentLocation: true },
                ...historySuggestions
            ]);
        } else if (text.length < 3) {
            setShowOriginHistory(false);
            setOriginSuggestions([
                { description: "📍 Ma position", isCurrentLocation: true },
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
                ...historySuggestions
            ]);
        } else if (text.length < 3) {
            setShowDestinationHistory(false);
            setDestinationSuggestions([]);
        } else {
            // Sinon afficher les suggestions de l'API
            setShowDestinationHistory(false);
            const suggestions = await fetchSuggestions(text);
            setDestinationSuggestions(suggestions);
        }
    };

    const handleWaypointChange = async (text: string, index: number) => {
        onWaypointUpdate(index, text);
        const suggestions = await fetchSuggestions(text);
        setWaypointSuggestions((prev) => ({ ...prev, [index]: suggestions }));
    };

    const handleOriginSelect = async (item: {
        description: string;
        isCurrentLocation?: boolean;
        isHistory?: boolean;
    }) => {
        if (item.isCurrentLocation) {
            onOriginChange("📍 Ma position");
        } else {
            onOriginChange(item.description);
        }
        setOriginSuggestions([]);
    };

    const handleDestinationSelect = (item: { description: string; isHistory?: boolean }) => {
        onDestinationChange(item.description);
        setDestinationSuggestions([]);
        setTimeout(() => {
            requestAnimationFrame(() => {
                onSearch();
            });
        }, 150);
    };

    const handleWaypointSelect = (
        item: { description: string },
        index: number
    ) => {
        onWaypointUpdate(index, item.description);
        setWaypointSuggestions((prev) => ({ ...prev, [index]: [] }));
    };

    const handleToggleTolls = () => {
        setAvoidTolls(!avoidTolls);
    };

    const handleToggleHighways = () => {
        setAvoidHighways(!avoidHighways);
    };

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
                ...historySuggestions
            ]);
        }
    };

    const renderSuggestionItem = (
        item: { description: string; isCurrentLocation?: boolean; isHistory?: boolean; },
        onPress: () => void
    ) => (
        <TouchableOpacity
            onPress={onPress}
            style={searchBarStyles.suggestionItem}
        >
            <Text style={{ color: "#000" }}>
                {item.isCurrentLocation ? (
                    <>
                        <MaterialIcons name="my-location" size={16} />{" "}
                        {item.description}
                    </>
                ) : item.isHistory ? (
                    <>
                        <MaterialIcons name="history" size={16} color="#777" />{" "}
                        {item.description}
                    </>
                ) : (
                    item.description
                )}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={searchBarStyles.searchContainer}>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                <TouchableOpacity
                    onPress={() => {
                        onClose && onClose();
                    }}
                    style={{ padding: 10 }}
                >
                    <MaterialIcons name="close" size={24} color="#000" />
                </TouchableOpacity>
            </View>
            <TextInput
                style={[searchBarStyles.input, { color: "#000" }]}
                placeholder="Point de départ"
                placeholderTextColor="#555"
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
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) =>
                        renderSuggestionItem(item, () =>
                            handleOriginSelect(item)
                        )
                    }
                    style={searchBarStyles.suggestionList}
                />
            )}

            <TextInput
                style={[searchBarStyles.input, { color: "#000" }]}
                placeholder="Destination"
                placeholderTextColor="#555"
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
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) =>
                        renderSuggestionItem(item, () =>
                            handleDestinationSelect(item)
                        )
                    }
                    style={searchBarStyles.suggestionList}
                />
            )}

            {/* Étapes */}
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
                        onChangeText={(text) =>
                            handleWaypointChange(text, index)
                        }
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
                        <MaterialIcons
                            name="swap-vert"
                            size={24}
                            color="blue"
                        />
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
                <>
                    <TouchableOpacity
                        onPress={handleToggleTolls}
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

                    <TouchableOpacity
                        onPress={handleToggleHighways}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 12,
                        }}
                    >
                        <MaterialIcons
                            name={avoidHighways ? "toggle-on" : "toggle-off"}
                            size={32}
                            color={avoidHighways ? "#2196F3" : "#888"}
                        />
                        <Text style={{ marginLeft: 10, fontSize: 16 }}>
                            Éviter les autoroutes
                        </Text>
                    </TouchableOpacity>
                </>
            )}

            <TouchableOpacity
                style={searchBarStyles.searchButton}
                onPress={onSearch}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={searchBarStyles.searchButtonText}>
                        Rechercher
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
};