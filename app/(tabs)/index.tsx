import React, { useCallback, useEffect, useRef, useState } from "react";
import {View, ActivityIndicator, StyleSheet, Text, TouchableOpacity,Modal,FlatList,Image, Alert} from "react-native";
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
import { homeStyles } from "@/styles/styles";
import { RouteCalculationResult, TransportMode, Waypoint } from "@/types";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";

type RouteWithId = RouteCalculationResult & { id: string };

interface MarkerData {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  category: "police" | "embouteillage" | "travaux" | "obstacle" | "accident";
}

const categoryIcons: Record<MarkerData["category"], string> = {
  police: "https://img.icons8.com/color/96/policeman-male.png",
  embouteillage: "https://img.icons8.com/color/96/traffic-jam.png",
  travaux: "https://img.icons8.com/color/96/under-construction.png",
  obstacle: "https://img.icons8.com/color/96/error--v1.png",
  accident: "https://img.icons8.com/color/96/car-crash.png"
};

const categories = [
  { label: "Embouteillage", value: "embouteillage", icon: categoryIcons.embouteillage },
  { label: "Police", value: "police", icon: categoryIcons.police },
  { label: "Accident", value: "accident", icon: categoryIcons.accident },
  { label: "Travaux", value: "travaux", icon: categoryIcons.travaux },
  { label: "Obstacle", value: "obstacle", icon: categoryIcons.obstacle }
];


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


  const [markers, setMarkers] = useState<MarkerData[]>([
    { id: 1, latitude: 48.846191, longitude: 2.346079, title: "Paris", category: "accident" },
  ]);


  const [modalVisible, setModalVisible] = useState(false);


  const handleGetGPS = async (category: MarkerData["category"]) => {
    setModalVisible(false);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'La localisation est nécessaire.');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    const newMarker: MarkerData = {
      id: Date.now(),
      latitude,
      longitude,
      title: category,
      category,
    };
    setMarkers((prev) => [...prev, newMarker]);

    Alert.alert("Coordonnées GPS", `Événement: ${category}\nLatitude : ${latitude}\nLongitude : ${longitude}`);
  };



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

        // ✅ Ajout ici : une fois que la route est valide, on sauvegarde
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
        mapRef.current?.animateToRegion(newRegion, 1000);

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
        <RouteMap
            region={mapRegion}
            mapRef={mapRef}
            alternativeRoutes={alternativeRoutes}
            selectedRouteId={selectedRoute ? (selectedRoute as RouteWithId).id : undefined}
            liveCoords={liveCoords}
        />

        {/* Second MapView with markers merged here */}
        <MapView
            style={styles.map}
            initialRegion={{
              latitude: markers[0].latitude,
              longitude: markers[0].longitude,
              latitudeDelta: 0.2,
              longitudeDelta: 0.2,
            }}
        >
          {markers.map((marker) => (
              <Marker
                  key={marker.id}
                  coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                  title={marker.title}
              >
                <Image
                    source={{ uri: categoryIcons[marker.category] }}
                    style={{ width: 40, height: 40 }}
                />
              </Marker>
          ))}
        </MapView>

        {selectedRoute && (
            <NextStepBanner
                nextStep={selectedRoute.steps[0]}
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
                  liveCoords={liveCoords}
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

        <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={styles.floatingButton}
        >
          <MaterialIcons name="my-location" size={28} color="#fff" />
        </TouchableOpacity>

        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Que voyez-vous ?</Text>
              <FlatList
                  data={categories}
                  numColumns={3}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                      <TouchableOpacity style={styles.categoryItem} onPress={() => handleGetGPS(item.value as MarkerData["category"])}>
                        <Image source={{ uri: item.icon }} style={styles.categoryIcon} />
                        <Text style={styles.categoryText}>{item.label}</Text>
                      </TouchableOpacity>
                  )}
                  contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}
              />
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  floatingButton: {
    position: 'absolute', bottom: 20, right: 20,
    backgroundColor: '#4CAF50', width: 60, height: 60,
    borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 6,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: "center"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15
  },
  categoryItem: {
    width: 100, // largeur fixe
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 5,
  },
  categoryIcon: {
    width: 50,
    height: 50,
  },
  categoryText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 6,
    color: '#333'
  },
  closeButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#ddd",
    borderRadius: 10
  },
  closeText: {
    color: "#333",
    fontSize: 16
  }
});
