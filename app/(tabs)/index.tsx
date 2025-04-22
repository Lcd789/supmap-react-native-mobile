import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useDerivedValue,
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
import { Magnetometer } from 'expo-sensors';
import * as Speech from "expo-speech";
import { getAddressFromCoords, getCoordsFromAddress } from "@/utils/geocoding";
import { RouteCoordinate } from "@/types";


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
  const [routeError, setRouteError] = useState<string | null>(null);
  const floatingButtonOffset = useSharedValue(100);
  const [userHasMovedMap, setUserHasMovedMap] = useState(false);
  const lastPolylineIndex = useRef<number>(0);
  const mapRef = useRef<any>(null);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const heading = useSharedValue(0);
  const animatedHeading = useDerivedValue(() => `${heading.value}deg`);
  const announcedSteps = useRef<Set<number>>(new Set());
  const [remainingPolyline, setRemainingPolyline] = useState<RouteCoordinate[]>([]);

  const searchBarAnimation = useSharedValue(0);
  const routeInfoAnimation = useSharedValue(0);
  const stepsAnimation = useSharedValue(0);

  const { mapRegion, setMapRegion, liveCoords } = useLocation(navigationLaunched);
  const { routeInfo, isLoading, error, calculateRoute } = useRoute();

  useEffect(() => {
    if (navigationLaunched && selectedRoute) {
      routeInfoAnimation.value = withDelay(
        200,
        withSpring(1, { damping: 15, stiffness: 100 })
      );
    } else {
      routeInfoAnimation.value = withTiming(0, { duration: 200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    }
  }, [selectedRoute, navigationLaunched]);

  useEffect(() => {
    const sub = Magnetometer.addListener(({ x, y }) => {
      let angle = Math.atan2(-x, y) * (180 / Math.PI);
      angle = angle >= 0 ? angle : angle + 360;
  
      const delta = angle - heading.value;
      if (Math.abs(delta) > 180) {
        angle = heading.value + (delta > 0 ? delta - 360 : delta + 360);
      }
  
      heading.value = withTiming(angle, { duration: 100 });
    });
    Magnetometer.setUpdateInterval(100);
    return () => sub.remove();
  }, []);
  

  useEffect(() => {
    if (
      navigationLaunched &&
      liveCoords &&
      selectedRoute &&
      selectedRoute.steps &&
      currentStepIndex < selectedRoute.steps.length
    ) {
      const step = selectedRoute.steps[currentStepIndex];
      const stepEnd = {
        latitude: step.end_location.lat,
        longitude: step.end_location.lng,
      };
  
      const distanceToEnd = getDistance(liveCoords, stepEnd);
  
      // ✅ Pré-annonce plus tôt (ex: 150m)
      const earlyAnnouncementDistance = 150;
      if (
        distanceToEnd < earlyAnnouncementDistance &&
        !announcedSteps.current.has(currentStepIndex)
      ) {
        const instruction = step.html_instructions?.replace(/<[^>]*>/g, " ");
        if (instruction) {
          console.log("📢 Pré-annonce :", instruction);
          Speech.stop();
          Speech.speak(instruction, {
            language: 'fr-FR',
            pitch: 1.0,
            rate: 1.0,
          });
        }
        announcedSteps.current.add(currentStepIndex);
      }
  
      // ✅ Passage à l'étape suivante
      if (distanceToEnd < 40) {
        const nextIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextIndex);
  
        // 📣 Annonce de la prochaine étape (si elle existe)
        const nextStep = selectedRoute.steps[nextIndex];
        if (nextStep && nextStep.html_instructions && nextStep.distance?.value) {
          const distanceMeters = nextStep.distance.value;
          const km = (distanceMeters / 1000).toFixed(1);
          const cleanInstruction = nextStep.html_instructions.replace(/<[^>]*>/g, " ");
          const message = `Dans ${km} kilomètres, ${cleanInstruction}`;
          console.log("🔮 Pré-étape suivante :", message);
          Speech.stop();
          Speech.speak(message, {
            language: 'fr-FR',
            pitch: 1.0,
            rate: 1.0,
          });
        }
      }
    }
  }, [liveCoords, navigationLaunched, selectedRoute, currentStepIndex]);
  
  useEffect(() => {
    floatingButtonOffset.value = withTiming(navigationLaunched ? 160 : 100, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [navigationLaunched]);
  
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

  const isOffRoute = (): boolean => {
    if (!liveCoords || !selectedRoute?.polyline) return false;
    const threshold = 30;
    return !selectedRoute.polyline.some((point) => {
      const distance = getDistance(liveCoords, point);
      return distance < threshold;
    });
  };
  useEffect(() => {
    if (!navigationLaunched || !selectedRoute || !liveCoords) return;
  
    const interval = setInterval(() => {
      const off = isOffRoute();
      console.log("🧭 OffRoute ?", off);
      if (off) {
        console.log("⛔️ Hors de l’itinéraire détecté");
        updateStepFromCurrentPosition();
      }
    }, 3000);
  
    return () => clearInterval(interval);
  }, [navigationLaunched, selectedRoute, liveCoords, currentStepIndex]);
  
  

  const getRemainingPolyline = () => {
    if (!selectedRoute?.polyline || !liveCoords) return [];
  
    const index = selectedRoute.polyline.findIndex((point) => {
      const d = getDistance(liveCoords, {
        latitude: point.latitude,
        longitude: point.longitude,
      });
      return d < 15; 
    });
  
    if (index !== -1) {
      lastPolylineIndex.current = index;
    }
    console.log("📍 Live position:", liveCoords);
    console.log("🔎 Recherche du point le plus proche sur la polyline...");
    

    return selectedRoute.polyline.slice(lastPolylineIndex.current);
  };
  
  useEffect(() => {
    if (navigationLaunched && liveCoords && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: liveCoords,
          heading: deviceHeading,
          pitch: 15,
          zoom: 15,
        },
        { duration: 300 }
      );
    }
  }, [deviceHeading, navigationLaunched, liveCoords]);
  
  useEffect(() => {
    if (!selectedRoute?.polyline || !liveCoords) return;
  
    const index = selectedRoute.polyline.findIndex((point) => {
      const d = getDistance(liveCoords, {
        latitude: point.latitude,
        longitude: point.longitude,
      });
      return d < 15;
    });
  
    if (index !== -1) {
      lastPolylineIndex.current = index;
    }
  
    const newPolyline = selectedRoute.polyline.slice(lastPolylineIndex.current);
    setRemainingPolyline(newPolyline);
  }, [liveCoords, selectedRoute]);
  

  const handleSearch = useCallback(async () => {
    let finalOrigin = origin;
    let finalDestination = destination;
  
    if (!origin.trim() || !destination.trim()) return;
  
    const validWaypoints = waypoints.filter((wp) => wp.address.trim() !== "");
  
    toggleSearchBar();
    setAlternativeRoutes([]);
    setSelectedRoute(null);
    setCurrentStepIndex(0);
  
    try {
      // 📍 Ma position
      if (origin === "📍 Ma position") {
        if (liveCoords) {
          const address = await getAddressFromCoords(liveCoords.latitude, liveCoords.longitude);
          if (address) {
            setOrigin(address);
            finalOrigin = address;
          } else {
            setRouteError("Impossible de récupérer votre position actuelle.");
            return;
          }
        } else {
          setRouteError("Position actuelle non disponible.");
          return;
        }
      }
  
      // 📌 Geocode POI si texte court ou pas de numéro
      const looksLikePOI = (text: string) => {
        return !/\d/.test(text) && text.trim().split(" ").length < 5;
      };
  
      if (looksLikePOI(origin)) {
        const resolved = await getCoordsFromAddress(origin);
        if (resolved) {
          const { lat, lng } = resolved;
          const address = await getAddressFromCoords(lat, lng);
          if (address) {
            setOrigin(address);
            finalOrigin = address;
          }
        }
      }
  
      if (destination === "📍 Ma position") {
        if (liveCoords) {
          const address = await getAddressFromCoords(liveCoords.latitude, liveCoords.longitude);
          if (address) {
            setDestination(address);
            finalDestination = address;
          } else {
            setRouteError("Impossible de récupérer votre position actuelle.");
            return;
          }
        } else {
          setRouteError("Position actuelle non disponible.");
          return;
        }
      }
  
      if (looksLikePOI(destination)) {
        const resolved = await getCoordsFromAddress(destination);
        if (resolved) {
          const { lat, lng } = resolved;
          const address = await getAddressFromCoords(lat, lng);
          if (address) {
            setDestination(address);
            finalDestination = address;
          }
        }
      }
  
      const routeResult = await calculateRoute(
        finalOrigin,
        finalDestination,
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
          origin: finalOrigin,
          destination: finalDestination,
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
  
  

  {userHasMovedMap && navigationLaunched && (
    <TouchableOpacity
      style={{
        position: "absolute",
        bottom: 160,
        right: 20,
        backgroundColor: "#fff",
        borderRadius: 25,
        padding: 10,
        elevation: 6,
      }}
      onPress={() => setUserHasMovedMap(false)}
    >
      <MaterialIcons name="my-location" size={24} color="#2196F3" />
    </TouchableOpacity>
  )}

  const updateStepFromCurrentPosition = () => {
    console.log("📣 Appel de updateStepFromCurrentPosition()");
    if (!liveCoords || !selectedRoute?.steps) return;
    console.log("📍 Étape actuelle:", currentStepIndex);

    let closestStepIndex = currentStepIndex;
    let minDistance = Infinity;
  
    selectedRoute.steps.forEach((step, index) => {

      const start = {
        latitude: step.start_location.lat,
        longitude: step.start_location.lng,
      };
      const end = {
        latitude: step.end_location.lat,
        longitude: step.end_location.lng,
      };
  
      const middle = {
        latitude: (start.latitude + end.latitude) / 2,
        longitude: (start.longitude + end.longitude) / 2,
      };
      const d = getDistance(liveCoords, middle);
      
  
      console.log(`🧩 Étape ${index} : dMid=${d.toFixed(1)}m`);


      if (d < minDistance) {
        minDistance = d;
        closestStepIndex = index;
      }
    });
    console.log("📍 Étape la plus proche détectée:", closestStepIndex);

    if (closestStepIndex !== currentStepIndex) {
      setCurrentStepIndex(closestStepIndex);
      lastPolylineIndex.current = 0;
      console.log(`📍 Étape mise à jour : ${closestStepIndex}`);
    }
  };
  

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
          initialRegion={mapRegion}
          mapRef={mapRef}
          alternativeRoutes={[{ id: "live", polyline: remainingPolyline }]}
          selectedRouteId="live"
          liveCoords={liveCoords}
          animatedHeading={animatedHeading} // ✅ ICI
          onPanDrag={() => setUserHasMovedMap(true)}
          navigationLaunched={navigationLaunched}
          nextStepCoord={selectedRoute?.steps?.[currentStepIndex]?.end_location && {
            latitude: selectedRoute.steps[currentStepIndex].end_location.lat,
            longitude: selectedRoute.steps[currentStepIndex].end_location.lng,
          }}
          alertMarkers={alertMarkers}
        />

    ) : (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    )}

      {selectedRoute &&
        !isSearchVisible &&
        navigationLaunched &&
        currentStepIndex < selectedRoute.steps.length && (
          <NextStepBanner
          key={currentStepIndex}
          nextStep={selectedRoute.steps[currentStepIndex]}
          onToggleSteps={toggleSteps}
        />
      )}


      {selectedRoute &&
        !isSearchVisible &&
        !navigationLaunched &&
        currentStepIndex >= selectedRoute.steps.length && (
          <View
            style={{
              position: "absolute",
              bottom: 140,
              alignSelf: "center",
              backgroundColor: "white",
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 10,
              elevation: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 16, textAlign: "center" }}>
              🎉 Trajet terminé !
            </Text>
          </View>
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
