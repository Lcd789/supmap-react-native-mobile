import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
import { useLocation } from "../../hooks/useLocation";
import { useRoute } from "../../hooks/useRoute";
import { SearchBar } from "../../components/MapComponents/SearchBar";
import { RouteMap } from "../../components/MapComponents/RouteMap";
import { RouteInfo } from "../../components/MapComponents/RouteInfo";
import RouteSelector from "../../components/MapComponents/RouteSelector";
import { NextStepBanner } from "@/components/MapComponents/NextStepBanner";
import {
  TransportMode,
  Waypoint,
  RouteCalculationResult,
} from "../../types";
import { homeStyles } from "../../styles/styles";
import { SafeAreaView } from "react-native-safe-area-context";

type RouteWithId = RouteCalculationResult & { id: string };

export default function Home() {
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [selectedMode, setSelectedMode] = useState<TransportMode>("driving");
  const [avoidTolls, setAvoidTolls] = useState<boolean>(false);
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(true);

  const [alternativeRoutes, setAlternativeRoutes] = useState<RouteWithId[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteCalculationResult | null>(null);
  const [navigationLaunched, setNavigationLaunched] = useState<boolean>(false);

  const mapRef = useRef<any>(null);

  const searchBarAnimation = useSharedValue(1);
  const routeInfoAnimation = useSharedValue(0);
  const stepsAnimation = useSharedValue(0);

  const { mapRegion, setMapRegion, getCurrentLocation } = useLocation(
    (address) => setOrigin(address)
  );
  const { routeInfo, isLoading, error, calculateRoute } = useRoute();

  useEffect(() => {
    if (navigationLaunched && selectedRoute) {
      routeInfoAnimation.value = withDelay(
        200,
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
  }, [selectedRoute, navigationLaunched]);

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

    const validWaypoints = waypoints.filter((wp) => wp.address.trim() !== "");

    setAlternativeRoutes([]);
    setSelectedRoute(null);

    try {
      const routeResult = await calculateRoute(
        origin,
        destination,
        validWaypoints,
        selectedMode,
        { avoidTolls }
      );

      if (routeResult && routeResult.length > 0) {
        const routesWithIds: RouteWithId[] = routeResult.map((r, index) => ({
          ...r,
          id: `route-${index}`,
        }));

        setAlternativeRoutes(routesWithIds);
        setSelectedRoute(routesWithIds[0]);

        const { bounds } = routesWithIds[0];
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

        setTimeout(() => {
          toggleSearchBar();
        }, 200);
      }
    } catch (error) {
      console.error("Erreur lors du calcul de l'itinéraire :", error);
    }
  }, [origin, destination, waypoints, selectedMode, avoidTolls, calculateRoute, setMapRegion]);

  useEffect(() => {
    if (origin && destination) {
      handleSearch();
    }
  }, [avoidTolls]);

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

  const toggleSearchBar = useCallback(() => {
    const newValue = isSearchVisible ? 0 : 1;

    if (newValue === 1) {
      searchBarAnimation.value = withSpring(
        newValue,
        { damping: 18, stiffness: 120, mass: 1 },
        () => {
          runOnJS(setIsSearchVisible)(true);
          runOnJS(setNavigationLaunched)(false);
          runOnJS(setAlternativeRoutes)([]);
        }
      );
    } else {
      searchBarAnimation.value = withTiming(
        newValue,
        { duration: 250, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
        () => {
          runOnJS(setIsSearchVisible)(false);
        }
      );
    }
  }, [isSearchVisible, searchBarAnimation]);

  const searchBarContainerStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
    opacity: interpolate(searchBarAnimation.value, [0, 1], [0, 1]),
    transform: [
      { translateY: interpolate(searchBarAnimation.value, [0, 1], [-100, 0]) },
      { scale: interpolate(searchBarAnimation.value, [0, 1], [0.8, 1]) },
    ],
  }));

  const floatingButtonStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    zIndex: 10,
    opacity: interpolate(
      searchBarAnimation.value,
      [0, 0.3, 1],
      [1, 0.3, 0]
    ),
    transform: [
      { scale: interpolate(searchBarAnimation.value, [0, 0.5, 1], [1, 0.8, 0]) },
      { translateY: interpolate(searchBarAnimation.value, [0, 1], [0, 20]) },
    ],
  }));

  const routeInfoStyle = useAnimatedStyle(() => ({
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    opacity: routeInfoAnimation.value,
    transform: [
      { translateY: interpolate(routeInfoAnimation.value, [0, 1], [100, 0]) },
    ],
    zIndex: 1000,
  }));

  return (
    <SafeAreaView style={homeStyles.container}>
      <RouteMap
        region={mapRegion}
        mapRef={mapRef}
        alternativeRoutes={alternativeRoutes}
        selectedRouteId={selectedRoute ? (selectedRoute as RouteWithId).id : undefined}
      />
      
      {selectedRoute && (
        <NextStepBanner
          nextStep={selectedRoute.steps[2]} // mettre à 1 pour voir une direction
          onToggleSteps={toggleSteps}
        />
      )}

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
            avoidTolls={avoidTolls}
            onToggleTolls={() => setAvoidTolls((prev) => !prev)}
          />
        )}
      </Animated.View>

      <Animated.View style={floatingButtonStyle}>
        <TouchableOpacity onPress={toggleSearchBar}>
          <MaterialIcons name="map" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {alternativeRoutes.length > 1 && !navigationLaunched && (
        <View style={styles.selectorContainer}>
          <RouteSelector
            origin={origin}
            destination={destination}
            waypoints={waypoints}
            selectedMode={selectedMode}
            routes={alternativeRoutes}
            onSelectRoute={(route: RouteCalculationResult) => {
              setSelectedRoute(route);
            }}
            onLaunchNavigation={(route: RouteCalculationResult) => {
              setSelectedRoute(route);
              setNavigationLaunched(true);
            }}
          />
        </View>
      )}

      {selectedRoute && navigationLaunched && (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  selectorContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 5,
  },
});
