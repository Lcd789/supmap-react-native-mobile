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
import { AlertReporter, AlertMarker } from "@/components/MapComponents/AlertReporter";
import { homeStyles } from "@/styles/styles";
import { RouteCalculationResult, TransportMode, Waypoint } from "@/types";
import { AlertVerifier } from "@/components/MapComponents/AlertVerifier";
import { useTheme } from "@/utils/ThemeContext";


type RouteWithId = RouteCalculationResult & { id: string };

export default function Home() {
  const { addToHistory } = useHistory();
  const { darkMode } = useTheme();
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [selectedMode, setSelectedMode] = useState<TransportMode>("driving");
  const [avoidTolls, setAvoidTolls] = useState<boolean>(false);
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [alternativeRoutes, setAlternativeRoutes] = useState<RouteWithId[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteCalculationResult | null>(null);
  const [navigationLaunched, setNavigationLaunched] = useState<boolean>(false);
  const [alertMarkers, setAlertMarkers] = useState<AlertMarker[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [mustJoinStart, setMustJoinStart] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isNearStart, setIsNearStart] = useState<boolean>(true);
  const floatingButtonOffset = useSharedValue(100);
  const [userHasMovedMap, setUserHasMovedMap] = useState(false);

  const mapRef = useRef<any>(null);

  const searchBarAnimation = useSharedValue(0);
  const routeInfoAnimation = useSharedValue(0);
  const stepsAnimation = useSharedValue(0);

  const { mapRegion, setMapRegion, liveCoords } = useLocation(navigationLaunched);
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

  useEffect(() => {
    if (!navigationLaunched) {
      setMustJoinStart(false);
    }
  }, [navigationLaunched]);

  useEffect(() => {
    floatingButtonOffset.value = withTiming(navigationLaunched ? 160 : 100, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [navigationLaunched]);

  useEffect(() => {
    if (
      navigationLaunched &&
      liveCoords &&
      mapRef.current &&
      !userHasMovedMap
    ) {
      const region = {
        latitude: liveCoords.latitude,
        longitude: liveCoords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current.animateToRegion(region, 800);
    }
  }, [liveCoords, navigationLaunched, userHasMovedMap]);
  

  useEffect(() => {
    if (
      navigationLaunched &&
      liveCoords &&
      selectedRoute &&
      selectedRoute.steps &&
      currentStepIndex < selectedRoute.steps.length
    ) {
      const step = selectedRoute.steps[currentStepIndex];

      const stepStart = {
        latitude: step.start_location.lat,
        longitude: step.start_location.lng,
      };

      const stepEnd = {
        latitude: step.end_location.lat,
        longitude: step.end_location.lng,
      };

      const distanceToStart = getDistance(liveCoords, stepStart);
      const distanceToEnd = getDistance(liveCoords, stepEnd);

      if (currentStepIndex === 0 && distanceToStart > 50) {
        console.log("📍 Trop loin du départ prévu, on saute le 1er step");
        setCurrentStepIndex(1);
        setMustJoinStart(true);
        return;
      }

      if (distanceToEnd < 2) {
        setCurrentStepIndex((prev) => prev + 1);
        setMustJoinStart(false);
      }
    }
  }, [liveCoords, navigationLaunched, selectedRoute, currentStepIndex]);

  const getDistance = (
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);
    const lat1 = toRad(coord1.latitude);
    const lat2 = toRad(coord2.latitude);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getRemainingPolyline = () => {
    if (!selectedRoute?.polyline || !liveCoords) return [];
  
    const index = selectedRoute.polyline.findIndex((point) => {
      const d = getDistance(liveCoords, {
        latitude: point.latitude,
        longitude: point.longitude,
      });
      return d < 10;
    });
  
    if (index === -1) return selectedRoute.polyline;
  
    return selectedRoute.polyline.slice(index);
  };

  const handleSearch = useCallback(async () => {
    if (!origin.trim() || !destination.trim()) return;
  
    const validWaypoints = waypoints.filter((wp) => wp.address.trim() !== "");
  
    toggleSearchBar();
    setAlternativeRoutes([]);
    setSelectedRoute(null);
    setCurrentStepIndex(0);
  
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
          latitudeDelta: Math.abs(bounds.northeast.lat - bounds.southwest.lat) * 1.5,
          longitudeDelta: Math.abs(bounds.northeast.lng - bounds.southwest.lng) * 1.5,
        };
  
        setMapRegion(newRegion);
        if (!navigationLaunched) {
          mapRef.current?.animateToRegion(newRegion, 1000);
        }
      }
    } catch (error: any) {
      setRouteError(error.message || "Erreur lors du calcul de l'itinéraire");
    }
  }, [origin, destination, waypoints, selectedMode, avoidTolls, calculateRoute]);
  
  

  const handleReverse = useCallback(() => {
    setOrigin(destination);
    setDestination(origin);
  }, [origin, destination]);

  const handleAddWaypoint = () => setWaypoints((prev) => [...prev, { address: "", id: Date.now().toString() }]);
  const handleRemoveWaypoint = (index: number) => setWaypoints((prev) => prev.filter((_, i) => i !== index));
  const handleUpdateWaypoint = (index: number, address: string) => {
    setWaypoints((prev) => prev.map((wp, i) => (i === index ? { ...wp, address } : wp)));
  };

  const toggleSteps = () => {
    const newValue = showSteps ? 0 : 1;
    stepsAnimation.value = withTiming(
      newValue,
      { duration: 500, easing: Easing.inOut(Easing.quad) },
      () => runOnJS(setShowSteps)(!showSteps)
    );
  };

  const toggleSearchBar = () => {
    const newValue = isSearchVisible ? 0 : 1;
    if (newValue === 1) {
      searchBarAnimation.value = withSpring(newValue, { damping: 18, stiffness: 120 }, () => {
        runOnJS(setIsSearchVisible)(true);
        runOnJS(setNavigationLaunched)(false);
        runOnJS(setAlternativeRoutes)([]);
      });
    } else {
      searchBarAnimation.value = withTiming(newValue, { duration: 250, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }, () => {
        runOnJS(setIsSearchVisible)(false);
      });
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
    top: floatingButtonOffset.value,
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
    transform: [{ translateY: interpolate(routeInfoAnimation.value, [0, 1], [100, 0]) }],
    zIndex: 1000,
  }));

  return (
    <SafeAreaView
      style={[
        homeStyles.container,
        { backgroundColor: darkMode ? "#121212" : "#fff" },
      ]}
    >
      {mapRegion ? (

    <RouteMap
      region={mapRegion}
      mapRef={mapRef}
      alternativeRoutes={[
        {
          id: "live",
          polyline: getRemainingPolyline(),
        },
      ]}
      selectedRouteId="live"
      liveCoords={liveCoords}
       onPanDrag={() => setUserHasMovedMap(true)}
      navigationLaunched={navigationLaunched}
      nextStepCoord={
        selectedRoute?.steps?.[currentStepIndex]?.end_location
          ? {
              latitude: selectedRoute.steps[currentStepIndex].end_location.lat,
              longitude: selectedRoute.steps[currentStepIndex].end_location.lng,
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

      {mustJoinStart && (
        <View
          style={{
            position: "absolute",
            top: 500,
            left: 20,
            right: 20,
            backgroundColor: darkMode ? "#333" : "#fff8e1",
            padding: 12,
            borderRadius: 10,
            elevation: 4,
            zIndex: 1000,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: darkMode ? 1 : 0,
            borderColor: darkMode ? "#555" : "transparent",
          }}
        >
          <MaterialIcons
            name="directions-walk"
            size={20}
            color={darkMode ? "#ffb74d" : "#f57c00"}
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              color: darkMode ? "#ffcc80" : "#f57c00",
              fontWeight: "600",
            }}
          >
            Rejoignez le point de départ pour commencer la navigation
          </Text>
        </View>
      )}


      {selectedRoute && !isSearchVisible && navigationLaunched && (
        <NextStepBanner
          nextStep={selectedRoute.steps[currentStepIndex]}
          onToggleSteps={toggleSteps}
        />
      )}


      {selectedRoute && !isSearchVisible && navigationLaunched && (
        <NextStepBanner
          nextStep={selectedRoute.steps[currentStepIndex]}
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

      {mapRegion && (
        <Animated.View style={floatingButtonStyle} pointerEvents="box-none">
          <TouchableOpacity onPress={toggleSearchBar}>
            <MaterialIcons name="map" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}



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
              setCurrentStepIndex(0);
              if (liveCoords) {
                const zoomRegion = {
                  latitude: liveCoords.latitude,
                  longitude: liveCoords.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                };
                mapRef.current?.animateToRegion(zoomRegion, 800);
              }
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

      {navigationLaunched && (
        <AlertReporter
          navigationLaunched={navigationLaunched}
          onAddAlert={(marker) => setAlertMarkers((prev) => [...prev, marker])}
        />
      )}

      {isLoading && (
        <View style={homeStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}

    {routeError && (
      <View
        style={{
          position: "absolute",
          top: "40%",
          left: 20,
          right: 20,
          backgroundColor: "#fff",
          padding: 16,
          borderRadius: 12,
          elevation: 10,
          zIndex: 1000,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10 }}>
          Erreur d’itinéraire
        </Text>
        <Text style={{ textAlign: "center", color: "#333" }}>
          {routeError === "FRANCE_ONLY"
            ? "Trajet interdit : vous devez rester à l’intérieur de la France métropolitaine."
            : "Une erreur est survenue lors du calcul du trajet. Veuillez réessayer."}
        </Text>
            <TouchableOpacity
          onPress={() => setRouteError(null)}
          style={{
            marginTop: 16,
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: "#007AFF",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Fermer</Text>
        </TouchableOpacity>
      </View>
    )}

  {navigationLaunched && liveCoords && (
    <TouchableOpacity
      style={{
        position: "absolute",
        bottom: 100,
        right: 20,
        backgroundColor: "#fff",
        borderRadius: 25,
        padding: 10,
        elevation: 6,
      }}
      onPress={() => {
        const region = {
          latitude: liveCoords.latitude,
          longitude: liveCoords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        mapRef.current?.animateToRegion(region, 800);
      }}
    >
      <MaterialIcons name="gps-fixed" size={24} color="#2196F3" />
    </TouchableOpacity>
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