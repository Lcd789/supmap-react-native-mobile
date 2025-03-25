import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import MapView from "react-native-maps";
import { useLocation } from "../../hooks/useLocation";
import { useRoute } from "../../hooks/useRoute";
import { SearchBar } from "../../components/MapComponents/SearchBar";
import { RouteMap } from "../../components/MapComponents/RouteMap";
import { RouteInfo } from "../../components/MapComponents/RouteInfo";
import RouteSelector from "../../components/MapComponents/RouteSelector"; // Import du nouveau composant
import { TransportMode, Waypoint, RouteCalculationResult } from "../../types";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  runOnJS,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { homeStyles } from "../../styles/styles";

export default function Home() {
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [selectedMode, setSelectedMode] = useState<TransportMode>("driving");
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(true);

  // Nouveaux états pour gérer les itinéraires alternatifs et l'itinéraire sélectionné
  const [alternativeRoutes, setAlternativeRoutes] = useState<RouteCalculationResult[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteCalculationResult | null>(null);

  const mapRef = useRef<MapView | null>(null);

  // Animation values
  const searchBarAnimation = useSharedValue(1);
  const routeInfoAnimation = useSharedValue(0);
  const stepsAnimation = useSharedValue(0);

  const { mapRegion, setMapRegion, getCurrentLocation } = useLocation(
    (address) => setOrigin(address)
  );

  const { routeInfo, isLoading, error, calculateRoute } = useRoute();

  // Effect pour animer le panneau RouteInfo lorsque l'itinéraire sélectionné change
  useEffect(() => {
    if (selectedRoute) {
      routeInfoAnimation.value = withDelay(
        200, // délai pour attendre la fin de l'animation de la carte
        withSpring(1, {
          damping: 15,
          stiffness: 100,
        })
      );
    } else {
      routeInfoAnimation.value = withTiming(0, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [selectedRoute]);

  const handleAddWaypoint = useCallback(() => {
    setWaypoints((prev) => [
      ...prev,
      { address: "", id: Date.now().toString() },
    ]);
  }, []);

  const handleRemoveWaypoint = useCallback((index: number) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateWaypoint = useCallback(
    (index: number, address: string) => {
      setWaypoints((prev) =>
        prev.map((wp, i) => (i === index ? { ...wp, address } : wp))
      );
    },
    []
  );

  const handleSearch = useCallback(async () => {
    if (!origin.trim() || !destination.trim()) {
      console.error("Veuillez entrer un point de départ et une destination.");
      return;
    }

    const validWaypoints = waypoints.filter(
      (wp) => wp.address.trim() !== ""
    );

    try {
      const routeResult = await calculateRoute(
        origin,
        destination,
        validWaypoints,
        selectedMode
      );

      if (routeResult && routeResult.length > 0) {
        // Stocke la liste des itinéraires alternatifs et sélectionne par défaut le premier
        setAlternativeRoutes(routeResult);
        setSelectedRoute(routeResult[0]);

        const { bounds } = routeResult[0];
        const newRegion = {
          latitude: (bounds.northeast.lat + bounds.southwest.lat) / 2,
          longitude: (bounds.northeast.lng + bounds.southwest.lng) / 2,
          latitudeDelta:
            Math.abs(bounds.northeast.lat - bounds.southwest.lat) * 1.5,
          longitudeDelta:
            Math.abs(bounds.northeast.lng - bounds.southwest.lng) * 1.5,
        };

        setMapRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);

        // Réduit la SearchBar après la recherche avec un léger délai
        setTimeout(() => {
          toggleSearchBar();
        }, 200);
      }
    } catch (error) {
      console.error("Erreur lors du calcul de l'itinéraire :", error);
    }
  }, [
    origin,
    destination,
    waypoints,
    selectedMode,
    calculateRoute,
    setMapRegion,
  ]);

  const handleReverse = useCallback(() => {
    setOrigin(destination);
    setDestination(origin);
  }, [origin, destination]);

  const toggleSteps = useCallback(() => {
    const newValue = showSteps ? 0 : 1;
    stepsAnimation.value = withTiming(
      newValue,
      {
        duration: 500,
        easing: Easing.inOut(Easing.quad),
      },
      () => {
        runOnJS(setShowSteps)(!showSteps);
      }
    );
  }, [showSteps, stepsAnimation]);

  // Animation de la SearchBar avec spring et timing
  const toggleSearchBar = useCallback(() => {
    const newValue = isSearchVisible ? 0 : 1;

    if (newValue === 1) {
      searchBarAnimation.value = withSpring(
        newValue,
        {
          damping: 18,
          stiffness: 120,
          mass: 1,
        },
        () => {
          runOnJS(setIsSearchVisible)(!isSearchVisible);
        }
      );
    } else {
      searchBarAnimation.value = withTiming(
        newValue,
        { duration: 250, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
        () => {
          runOnJS(setIsSearchVisible)(!isSearchVisible);
        }
      );
    }
  }, [isSearchVisible, searchBarAnimation]);

  // Styles animés pour la SearchBar
  const searchBarContainerStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      elevation: 10,
      opacity: interpolate(searchBarAnimation.value, [0, 1], [0, 1]),
      transform: [
        {
          translateY: interpolate(searchBarAnimation.value, [0, 1], [-100, 0]),
        },
        {
          scale: interpolate(searchBarAnimation.value, [0, 1], [0.8, 1]),
        },
      ],
    };
  });

  // Animation pour le bouton flottant
  const floatingButtonStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      top: 20,
      right: 20,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "#2196F3",
      justifyContent: "center",
      alignItems: "center",
      elevation: 5,
      zIndex: 10,
      opacity: interpolate(searchBarAnimation.value, [0, 0.3, 1], [1, 0.3, 0]),
      transform: [
        {
          scale: interpolate(searchBarAnimation.value, [0, 0.5, 1], [1, 0.8, 0]),
        },
        {
          translateY: interpolate(searchBarAnimation.value, [0, 1], [0, 20]),
        },
      ],
    };
  });

  // Style animé pour le composant RouteInfo
  const routeInfoStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      opacity: routeInfoAnimation.value,
      transform: [
        {
          translateY: interpolate(routeInfoAnimation.value, [0, 1], [100, 0]),
        },
      ],
    };
  });

  return (
    <View style={homeStyles.container}>
      <RouteMap
        mapRegion={mapRegion}
        decodedPoints={selectedRoute?.polyline || []}
        waypoints={waypoints}
        mapRef={mapRef}
      />

      {/* Animated SearchBar */}
      <Animated.View style={searchBarContainerStyle}>
        {isSearchVisible && (
          <SearchBar
            origin={origin}
            destination={destination}
            waypoints={waypoints}
            selectedMode={selectedMode}
            isLoading={isLoading}
            onOriginChange={setOrigin}
            onDestinationChange={setDestination}
            onWaypointAdd={handleAddWaypoint}
            onWaypointRemove={handleRemoveWaypoint}
            onWaypointUpdate={handleUpdateWaypoint}
            onModeSelect={setSelectedMode}
            onSearch={handleSearch}
            onReverse={handleReverse}
          />
        )}
      </Animated.View>

      {/* Bouton flottant pour afficher la SearchBar */}
      <Animated.View style={floatingButtonStyle}>
        <TouchableOpacity
          onPress={toggleSearchBar}
          style={homeStyles.floatingButton}
        >
          <MaterialIcons name="map" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Si plusieurs itinéraires alternatifs sont disponibles, on affiche le RouteSelector */}
      {alternativeRoutes.length > 1 && (
        <View style={styles.selectorContainer}>
          <RouteSelector
            origin={origin}
            destination={destination}
            waypoints={waypoints}
            selectedMode={selectedMode}
            onSelectRoute={(route: RouteCalculationResult) => setSelectedRoute(route)}
          />
        </View>
      )}

      {/* Affichage des détails de l'itinéraire sélectionné */}
      {selectedRoute && (
        <Animated.View style={routeInfoStyle}>
          <RouteInfo
            routeSummary={{
              duration: selectedRoute.duration,
              distance: selectedRoute.distance,
            }}
            routeInfo={selectedRoute}
            showSteps={showSteps}
            stepsAnimation={stepsAnimation}
            onToggleSteps={toggleSteps}
          />
        </Animated.View>
      )}

      {error && (
        <View style={homeStyles.errorContainer}>
          <Text style={homeStyles.errorText}>{error}</Text>
        </View>
      )}

      {isLoading && (
        <View style={homeStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  selectorContainer: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 5,
  },
});
