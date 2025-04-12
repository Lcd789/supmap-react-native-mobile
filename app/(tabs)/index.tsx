import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  withSpring,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocation } from "@/hooks/useLocation";
import { useRoute } from "@/hooks/useRoute";
import { useHistory } from "@/hooks/useHistory";
import { SearchBar } from "@/components/MapComponents/SearchBar";
import { RouteMap } from "@/components/MapComponents/RouteMap";
import { RouteInfo } from "@/components/MapComponents/RouteInfo";
import RouteSelector from "@/components/MapComponents/RouteSelector";
import { NextStepBanner } from "@/components/MapComponents/NextStepBanner";
import { AlertReporter, AlertMarker } from "@/components/MapComponents/AlertReporter"; // ✅ import ajouté
import { homeStyles } from "@/styles/styles";
import { RouteCalculationResult, TransportMode, Waypoint } from "@/types";
import { AlertVerifier } from "@/components/MapComponents/AlertVerifier";

type RouteWithId = RouteCalculationResult & { id: string };

export default function Home() {
  const { addToHistory } = useHistory();
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
  const [alertMarkers, setAlertMarkers] = useState<AlertMarker[]>([]); // ✅ nouvel état

  const mapRef = useRef<any>(null);

  const searchBarAnimation = useSharedValue(1);
  const routeInfoAnimation = useSharedValue(0);
  const stepsAnimation = useSharedValue(0);

  const { mapRegion, setMapRegion, liveCoords } = useLocation();
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

{navigationLaunched && (
  <>
    <AlertReporter
      onAddAlert={(marker) =>
        setAlertMarkers((prev) => [...prev, { ...marker, createdByMe: true }])
      }
    />
    <AlertVerifier
      liveCoords={liveCoords}
      alertMarkers={alertMarkers}
      onDismiss={(id) =>
        setAlertMarkers((prev) => prev.filter((m) => m.id !== id))
      }
    />
  </>
)}

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

        addToHistory({
          origin,
          destination,
          waypoints: validWaypoints.map((wp) => wp.address),
          mode: selectedMode,
        });

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
        if (!navigationLaunched) {
          mapRef.current?.animateToRegion(newRegion, 1000);
        }

        setTimeout(() => {
          toggleSearchBar();
        }, 200);
      }
    } catch (error) {
      console.error("Erreur lors du calcul de l'itinéraire :", error);
    }
  }, [origin, destination, waypoints, selectedMode, avoidTolls, calculateRoute, setMapRegion]);

  const handleReverse = useCallback(() => {
    setOrigin(destination);
    setDestination(origin);
  }, [origin, destination]);

  const handleAddWaypoint = () => {
    setWaypoints((prev) => [
      ...prev,
      { address: "", id: Date.now().toString() },
    ]);
  };

  const handleRemoveWaypoint = (index: number) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateWaypoint = (index: number, address: string) => {
    setWaypoints((prev) =>
      prev.map((wp, i) => (i === index ? { ...wp, address } : wp))
    );
  };

  const toggleSteps = () => {
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
  };

  const toggleSearchBar = () => {
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
  };

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
      {mapRegion ? (
        <RouteMap
          region={mapRegion}
          mapRef={mapRef}
          alternativeRoutes={alternativeRoutes}
          selectedRouteId={selectedRoute ? (selectedRoute as RouteWithId).id : undefined}
          liveCoords={liveCoords}
          navigationLaunched={navigationLaunched}
          nextStepCoord={
            selectedRoute?.steps?.[1]?.end_location
              ? {
                  latitude: selectedRoute.steps[1].end_location.lat,
                  longitude: selectedRoute.steps[1].end_location.lng,
                }
              : null
          }
          alertMarkers={alertMarkers}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}

      {selectedRoute && !isSearchVisible && (
        <NextStepBanner
          nextStep={selectedRoute.steps[0]}
          onToggleSteps={toggleSteps}
        />
      )}

      <Animated.View style={searchBarContainerStyle} pointerEvents="box-none">
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
            liveCoords={liveCoords}
          />
        )}
      </Animated.View>

      <Animated.View style={floatingButtonStyle} pointerEvents="box-none">
        <TouchableOpacity onPress={toggleSearchBar}>
          <MaterialIcons name="map" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {alternativeRoutes.length > 0 && !navigationLaunched && (
        <View style={styles.selectorContainer}>
          <RouteSelector
            origin={origin}
            destination={destination}
            waypoints={waypoints}
            selectedMode={selectedMode}
            routes={alternativeRoutes}
            selectedRouteId={(selectedRoute as RouteWithId)?.id}
            onSelectRoute={(route: RouteCalculationResult) => {
              setSelectedRoute(route);
            }}
            onLaunchNavigation={(route: RouteCalculationResult) => {
              setSelectedRoute(route);
              setNavigationLaunched(true);
              addToHistory({
                origin,
                destination,
                waypoints: waypoints.map((wp) => wp.address),
                mode: selectedMode,
              });
            }}
          />
        </View>
      )}

      {selectedRoute && navigationLaunched && (
        <Animated.View style={routeInfoStyle} pointerEvents="box-none">
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

      {/* ✅ Bouton d'alerte */}
      {navigationLaunched && (
        <AlertReporter
          onAddAlert={(marker) => setAlertMarkers((prev) => [...prev, marker])}
        />
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
