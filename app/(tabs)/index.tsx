import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    Alert,
} from "react-native";
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
import { SearchBar } from "@/components/MapComponents/SearchBar";
import { RouteMap } from "@/components/MapComponents/RouteMap";
import { RouteInfo } from "@/components/MapComponents/RouteInfo";
import TripInfoBar from "@/components/MapComponents/TripInfoBar";

import RouteSelector from "@/components/MapComponents/RouteSelector";
import { NextStepBanner } from "@/components/MapComponents/NextStepBanner";
import {
    AlertReporter,
    AlertMarker,
} from "@/components/MapComponents/AlertReporter";
import { homeStyles } from "@/styles/styles";
import { RouteCalculationResult, TransportMode, Waypoint } from "@/types";
import { AlertVerifier } from "@/components/MapComponents/AlertVerifier";
import { useTheme } from "@/utils/ThemeContext";
import { Magnetometer } from "expo-sensors";
import * as Speech from "expo-speech";
import { getAddressFromCoords, getCoordsFromAddress } from "@/utils/geocoding";
import { RouteCoordinate } from "@/types";
import ArrivalPopup from "@/components/MapComponents/ArrivalPopup";
import { useSettings } from "@/hooks/user/SettingsContext";
import { useSaveRoute } from "@/hooks/map/MapHooks";

type RouteWithId = RouteCalculationResult & { id: string };

export default function Home() {
    const { darkMode } = useTheme();
    const [origin, setOrigin] = useState<string>("");
    const [destination, setDestination] = useState<string>("");
    const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
    const [selectedMode, setSelectedMode] = useState<TransportMode>("driving");
    const [showSteps, setShowSteps] = useState<boolean>(false);
    const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
    const [alternativeRoutes, setAlternativeRoutes] = useState<RouteWithId[]>(
        []
    );
    const [selectedRoute, setSelectedRoute] =
        useState<RouteCalculationResult | null>(null);
    const [navigationLaunched, setNavigationLaunched] =
        useState<boolean>(false);
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
    const [remainingPolyline, setRemainingPolyline] = useState<
        RouteCoordinate[]
    >([]);
    const [hasArrived, setHasArrived] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [showOffRouteModal, setShowOffRouteModal] = useState(false);
    const offRouteSince = useRef<number | null>(null);
    const recalculationLock = useRef(false);
    const [remainingDistance, setRemainingDistance] = useState(0);
    const [remainingDuration, setRemainingDuration] = useState(0);
    const [bannerStepIndex, setBannerStepIndex] = useState(0);
    const bannerStep = selectedRoute?.steps?.[bannerStepIndex] ?? null;

    const searchBarAnimation = useSharedValue(0);
    const routeInfoAnimation = useSharedValue(0);
    const stepsAnimation = useSharedValue(0);

    const { mapRegion, setMapRegion, liveCoords, animatedBearing } =
        useLocation(navigationLaunched);
    const { routeInfo, isLoading, error, calculateRoute } = useRoute();
    const originRef = useRef(origin);
    const destinationRef = useRef(destination);

    const {
        avoidTolls,
        avoidHighways,
        showTraffic,
        voiceGuidance,
        unitsMetric,
    } = useSettings();

    const START_DISTANCE_THRESHOLD = 100;

    const handleSearchFromCurrent = () => {
      originRef.current = "📍 Ma position";
      setOrigin("📍 Ma position");
      handleSearch();
    };


    
    const recalculateRouteFromCurrentPosition = useCallback(async () => {
        if (recalculationLock.current) return;
        if (!liveCoords) {
            console.warn("Recalcul interrompu : liveCoords est null");
            return;
        }
        recalculationLock.current = true;
        setIsRecalculating(true);

        try {
            const address = await getAddressFromCoords(
                liveCoords.latitude,
                liveCoords.longitude
            );
            const originText =
                address ?? `${liveCoords.latitude},${liveCoords.longitude}`;

                const rawWaypoints = await Promise.all(
                    waypoints
                        .filter((wp) => wp.address.trim() !== "")
                        .map(async (wp) => {
                          if (wp.address === "📍 Ma position") {
                            if (!liveCoords) return null;
                            return {
                              ...wp,
                              address: `${liveCoords.latitude},${liveCoords.longitude}`,
                            };
                          }
                          return wp;
                        })
                  );
                  const validWaypoints = rawWaypoints.filter(Boolean) as Waypoint[];
                  

            
console.log("🔄 Recalcul - origin:", originText);
console.log("🧭 Recalcul - destination:", destinationRef.current);

const cleanedWaypoints = validWaypoints.filter(
  (wp) => wp.address !== originText && wp.address !== destinationRef.current
);

console.log("🔄 Recalcul - origin:", originText);
console.log("🧭 Recalcul - destination:", destinationRef.current);
console.log("🧭 Recalcul - waypoints:", cleanedWaypoints.map((w: Waypoint) => w.address));

const newRoutes = await calculateRoute(
                originText,
                destinationRef.current,
                validWaypoints,
                selectedMode,
                { avoidTolls, avoidHighways }
              );

            if (newRoutes?.length) {
                const withIds = newRoutes.map((r, i) => ({
                    ...r,
                    id: `recalc-${i}`,
                }));
                setAlternativeRoutes(withIds);
                setSelectedRoute(withIds[0]);
                setCurrentStepIndex(0);
                announcedSteps.current.clear();

                // recentre la carte
                const b = withIds[0].bounds;
                const region = {
                    latitude: (b.northeast.lat + b.southwest.lat) / 2,
                    longitude: (b.northeast.lng + b.southwest.lng) / 2,
                    latitudeDelta:
                        Math.abs(b.northeast.lat - b.southwest.lat) * 1.5,
                    longitudeDelta:
                        Math.abs(b.northeast.lng - b.southwest.lng) * 1.5,
                };
                setMapRegion(region);
                mapRef.current?.animateToRegion(region, 800);
            }
        } catch (err: any) {
            console.error("Erreur recalcul :", err);
            setRouteError(
                err.message ?? "Erreur lors du recalcul de l’itinéraire"
            );
        } finally {
            setTimeout(() => {
                setIsRecalculating(false);
                recalculationLock.current = false;
            }, 1000);
        }
    }, [liveCoords, waypoints, selectedMode, avoidTolls, calculateRoute]);

    useEffect(() => {
        originRef.current = origin;
    }, [origin]);

    useEffect(() => {
        destinationRef.current = destination;
    }, [destination]);

    useEffect(() => {
        if (navigationLaunched && selectedRoute) {
            routeInfoAnimation.value = withDelay(
                200,
                withSpring(1, { damping: 15, stiffness: 100 })
            );
        } else {
            routeInfoAnimation.value = withTiming(0, {
                duration: 200,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            });
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
          selectedRoute?.steps &&
          currentStepIndex < selectedRoute.steps.length
        ) {
          const steps = selectedRoute.steps;
          const step = steps[currentStepIndex];
          const stepEnd = {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng,
          };
          const distanceToEnd = getDistance(liveCoords, stepEnd);
      
          const BANNER_THRESHOLD = 80;
          const nextBannerIdx =
            distanceToEnd < BANNER_THRESHOLD && currentStepIndex + 1 < steps.length
              ? currentStepIndex + 1
              : currentStepIndex;
          setBannerStepIndex(nextBannerIdx);
      
          if (distanceToEnd < 100 && !announcedSteps.current.has(currentStepIndex)) {
            const instruction = step.html_instructions?.replace(/<[^>]*>/g, " ");
            if (instruction) {
              Speech.stop();
              Speech.speak(instruction, {
                language: "fr-FR",
                pitch: 1.0,
                rate: 1.0,
              });
            }
            announcedSteps.current.add(currentStepIndex);
          }
      
          if (distanceToEnd < 40) {
            const nextIndex = currentStepIndex + 1;
            if (nextIndex >= steps.length) {
              setHasArrived(true);
              setNavigationLaunched(false);
              return;
            }
      
            setCurrentStepIndex(nextIndex);
      
            const nextStep = steps[nextIndex];
            if (
              nextStep.html_instructions &&
              !announcedSteps.current.has(nextIndex)
            ) {
              const km = ((nextStep.distance?.value ?? 0) / 1000).toFixed(1);
              const cleanInstr = nextStep.html_instructions.replace(/<[^>]*>/g, " ");
              const message = `Dans ${km} km, ${cleanInstr}`;
              Speech.stop();
              Speech.speak(message, {
                language: "fr-FR",
                pitch: 1.0,
                rate: 1.0,
              });
              announcedSteps.current.add(nextIndex);
            }
          }
        }
      }, [liveCoords, navigationLaunched, selectedRoute, currentStepIndex]);
      
      

    useEffect(() => {
        floatingButtonOffset.value = withTiming(
            navigationLaunched ? 160 : 100,
            {
                duration: 300,
                easing: Easing.inOut(Easing.ease),
            }
        );
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

        let closePoints = 0;
        selectedRoute.polyline.forEach((point) => {
            const distance = getDistance(liveCoords, point);
            if (distance < 50) {
                closePoints++;
            }
        });

        return closePoints < 2;
    };

    useEffect(() => {
        if (!navigationLaunched || !selectedRoute || !liveCoords) return;

        const interval = setInterval(() => {
            if (!recalculationLock.current && isOffRoute()) {
                console.log(
                    "⛔️ Off-route détecté – déclenchement recalculateRouteFromCurrentPosition"
                );
                recalculateRouteFromCurrentPosition();
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [
        navigationLaunched,
        selectedRoute,
        liveCoords,
        recalculateRouteFromCurrentPosition,
    ]);

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

        const newPolyline = selectedRoute.polyline.slice(
            lastPolylineIndex.current
        );
        setRemainingPolyline(newPolyline);
    }, [liveCoords, selectedRoute]);

    useEffect(() => {
        if (!selectedRoute || !selectedRoute.steps || !liveCoords) return;
    
        let distance = 0;
        let duration = 0;
    
        for (let i = currentStepIndex; i < selectedRoute.steps.length; i++) {
            const step = selectedRoute.steps[i];
            distance += step.distance?.value ?? 0;
            duration += step.duration?.value ?? 0;
        }
    
        setRemainingDistance(Math.round(distance));
        setRemainingDuration(Math.round(duration));
    }, [liveCoords, selectedRoute, currentStepIndex]);


    const handleSearch = useCallback(async () => {
        let finalOrigin = originRef.current;
        let finalDestination = destinationRef.current;

        if (!finalOrigin.trim() || !finalDestination.trim()) return;

        const validWaypoints = await Promise.all(
            waypoints
                .filter((wp) => wp.address.trim() !== "")
                .map(async (wp) => {
                  if (wp.address === "📍 Ma position") {
                    if (!liveCoords) return null;
                    // On transmet directement lat,lng pour éviter toute confusion
                   return {
                      ...wp,
                      address: `${liveCoords.latitude},${liveCoords.longitude}`,
                    };
                  }
                  return wp;
                })
          );
          
          const filteredWaypoints = validWaypoints.filter(Boolean) as Waypoint[];
          
        if (finalOrigin !== "📍 Ma position" && liveCoords) {
            const coords = await getCoordsFromAddress(finalOrigin);
            if (coords) {
            const distanceToStart = getDistance(
                liveCoords,
                { latitude: coords.lat, longitude: coords.lng }
            );
             if (distanceToStart > START_DISTANCE_THRESHOLD) {
                   const distanceLabel =
                     distanceToStart >= 1000
                       ? `${(distanceToStart / 1000).toFixed(2)} km`
                       : `${Math.round(distanceToStart)} m`;
                
                   Alert.alert(
                     "Point de départ trop éloigné",
                     `Le point de départ est à ${distanceLabel} de votre position actuelle. Voulez-vous démarrer depuis votre position ?`,
                     [
                      { text: "Annuler", style: "cancel" },
                      { text: "Démarrer", onPress: handleSearchFromCurrent },
                    ]
                  );
                   return;
                }
            }
        }
  
        toggleSearchBar();
        setAlternativeRoutes([]);
        setSelectedRoute(null);
        setCurrentStepIndex(0);

        try {
            if (finalOrigin === "📍 Ma position") {
                if (!liveCoords) {
                    setRouteError("Position actuelle non disponible.");
                    return;
                }

                finalOrigin = `${liveCoords.latitude},${liveCoords.longitude}`;
            }

            if (finalDestination === "📍 Ma position") {
                if (!liveCoords) {
                    setRouteError("Position actuelle non disponible.");
                    return;
                }

                finalDestination = `${liveCoords.latitude},${liveCoords.longitude}`;
            }

            const needsGeocoding = (text: string) =>
                !/\d/.test(text) && text.trim().split(" ").length < 5;

            if (
                needsGeocoding(finalOrigin) &&
                finalOrigin !== "📍 Ma position"
            ) {
                const coords = await getCoordsFromAddress(finalOrigin);
                if (coords) {
                    const address = await getAddressFromCoords(
                        coords.lat,
                        coords.lng
                    );
                    if (address) {
                        finalOrigin = address;
                    }
                }
            }

            if (
                needsGeocoding(finalDestination) &&
                finalDestination !== "📍 Ma position"
            ) {
                const coords = await getCoordsFromAddress(finalDestination);
                if (coords) {
                    const address = await getAddressFromCoords(
                        coords.lat,
                        coords.lng
                    );
                    if (address) {
                        finalDestination = address;
                    }
                }
            }

            
console.log("🔍 Final origin:", finalOrigin);
console.log("🏁 Final destination:", finalDestination);

console.log("📤 Appel calculateRoute avec :");
console.log(" - Origin:", finalOrigin);
console.log(" - Destination:", finalDestination);

const routeResult = await calculateRoute(
                finalOrigin,
                finalDestination,
                filteredWaypoints,
                selectedMode,
                { avoidTolls }
            );

            if (routeResult && routeResult.length > 0) {
                const routesWithIds: RouteWithId[] = routeResult.map(
                    (r, index) => ({
                        ...r,
                        id: `route-${index}`,
                    })
                );

                setAlternativeRoutes(routesWithIds);
                setSelectedRoute(routesWithIds[0]);



                const { bounds } = routesWithIds[0];
                const newRegion = {
                    latitude: (bounds.northeast.lat + bounds.southwest.lat) / 2,
                    longitude:
                        (bounds.northeast.lng + bounds.southwest.lng) / 2,
                    latitudeDelta:
                        Math.abs(bounds.northeast.lat - bounds.southwest.lat) *
                        1.5,
                    longitudeDelta:
                        Math.abs(bounds.northeast.lng - bounds.southwest.lng) *
                        1.5,
                };

                setMapRegion(newRegion);
                if (!navigationLaunched) {
                    mapRef.current?.animateToRegion(newRegion, 1000);
                }
            }
        } catch (error: any) {
            console.log("❌ Erreur calculateRoute :", error);
            setRouteError(
                error.message || "Erreur lors du calcul de l'itinéraire"
            );
        }
    }, [waypoints, selectedMode, avoidTolls, calculateRoute, liveCoords]);

    {
        userHasMovedMap && navigationLaunched && (
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
        );
    }

    const updateStepFromCurrentPosition = () => {
        console.log("📣 Appel de updateStepFromCurrentPosition()");
        if (!liveCoords || !selectedRoute?.steps) return;
        console.log("📍 Étape actuelle:", currentStepIndex);

        let closestStepIndex = currentStepIndex;
        let minDistance = Infinity;

        // 🔁 On ne teste que les étapes à venir (ou en cours)
        for (
            let index = currentStepIndex;
            index < selectedRoute.steps.length;
            index++
        ) {
            const step = selectedRoute.steps[index];

            const end = {
                latitude: step.end_location.lat,
                longitude: step.end_location.lng,
            };

            const distanceToEnd = getDistance(liveCoords, end);
            console.log(
                `🧩 Étape ${index} : dEnd=${distanceToEnd.toFixed(1)}m`
            );

            if (distanceToEnd < minDistance) {
                minDistance = distanceToEnd;
                closestStepIndex = index;
            }
        }

        console.log("📍 Étape la plus proche détectée:", closestStepIndex);

        // ✅ Mise à jour uniquement si changement
        if (closestStepIndex !== currentStepIndex) {
            setCurrentStepIndex(closestStepIndex);
            announcedSteps.current.add(closestStepIndex); // ❌ ne jamais re-parler
            console.log(`📍 Étape mise à jour : ${closestStepIndex}`);
        } else {
            console.log("♻️ Étape inchangée, pas de recalage");
        }
    };

    const handleReverse = useCallback(() => {
        setOrigin(destination);
        setDestination(origin);
    }, [origin, destination]);

    const handleAddWaypoint = () =>
        setWaypoints((prev) => [
            ...prev,
            { address: "", id: Date.now().toString() },
        ]);
    const handleRemoveWaypoint = (index: number) =>
        setWaypoints((prev) => prev.filter((_, i) => i !== index));
    const handleUpdateWaypoint = (index: number, address: string) => {
        setWaypoints((prev) =>
            prev.map((wp, i) => (i === index ? { ...wp, address } : wp))
        );
    };

    const toggleSteps = () => {
        const newValue = showSteps ? 0 : 1;
        stepsAnimation.value = withTiming(
            newValue,
            { duration: 500, easing: Easing.inOut(Easing.quad) },
            () => runOnJS(setShowSteps)(!showSteps)
        );
    };

    // Modifié : confirmation avant d'ouvrir la recherche si navigation en cours
    const toggleSearchBar = () => {
        const newValue = isSearchVisible ? 0 : 1;
        // Si on ouvre la recherche et qu'une navigation est active, demander confirmation
        if (newValue === 1 && navigationLaunched) {
            Alert.alert(
                "Arrêter la navigation",
                "Êtes-vous sûr de vouloir annuler votre trajet en cours ?",
                [
                    { text: "Non", style: "cancel" },
                    {
                        text: "Oui",
                        onPress: () => {
                            searchBarAnimation.value = withSpring(
                                newValue,
                                { damping: 18, stiffness: 120 },
                                () => {
                                    runOnJS(setIsSearchVisible)(true);
                                    runOnJS(setNavigationLaunched)(false);
                                    runOnJS(setAlternativeRoutes)([]);
                                    runOnJS(setSelectedRoute)(null);
                                    runOnJS(setRemainingPolyline)([]);
                                }
                            );
                        },
                    },
                ]
            );
            return;
        }
        if (newValue === 1) {
            searchBarAnimation.value = withSpring(
                newValue,
                { damping: 18, stiffness: 120 },
                () => {
                    runOnJS(setIsSearchVisible)(true);
                    runOnJS(setNavigationLaunched)(false);
                    runOnJS(setAlternativeRoutes)([]);
                    runOnJS(setSelectedRoute)(null);
                    runOnJS(setRemainingPolyline)([]);
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
            {
                translateY: interpolate(
                    searchBarAnimation.value,
                    [0, 1],
                    [-100, 0]
                ),
            },
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
        opacity: interpolate(
            searchBarAnimation.value,
            [0, 0.3, 1],
            [1, 0.3, 0]
        ),
        transform: [
            {
                scale: interpolate(
                    searchBarAnimation.value,
                    [0, 0.5, 1],
                    [1, 0.8, 0]
                ),
            },
            {
                translateY: interpolate(
                    searchBarAnimation.value,
                    [0, 1],
                    [0, 20]
                ),
            },
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
            {
                translateY: interpolate(
                    routeInfoAnimation.value,
                    [0, 1],
                    [100, 0]
                ),
            },
        ],
        zIndex: 1000,
    }));

    const { saveRoute } = useSaveRoute();

    let bannerDist = 0;
    let bannerDur  = 0;

    if (navigationLaunched && liveCoords && bannerStep) {
    bannerDist = getDistance(
        liveCoords,
        {
        latitude:  bannerStep.end_location.lat,
        longitude: bannerStep.end_location.lng,
        }
    );
    if (bannerStep.distance?.value && bannerStep.duration?.value) {
        bannerDur = Math.round(
        (bannerDist / bannerStep.distance.value)
        * bannerStep.duration.value
        );
    }
    }

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
                    alternativeRoutes={[
                        { id: "live", polyline: remainingPolyline },
                    ]}
                    selectedRouteId="live"
                    liveCoords={liveCoords}
                    animatedHeading={animatedBearing}
                    onPanDrag={() => setUserHasMovedMap(true)}
                    navigationLaunched={navigationLaunched}
                    nextStepCoord={
                        selectedRoute?.steps?.[currentStepIndex]
                            ?.end_location && {
                            latitude:
                                selectedRoute.steps[currentStepIndex]
                                    .end_location.lat,
                            longitude:
                                selectedRoute.steps[currentStepIndex]
                                    .end_location.lng,
                        }
                    }
                    alertMarkers={alertMarkers}
                />
            ) : (
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            )}

            {isRecalculating && (
                <View
                    style={{
                        position: "absolute",
                        top: "45%",
                        left: 0,
                        right: 0,
                        alignItems: "center",
                        zIndex: 999,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "white",
                            paddingVertical: 14,
                            paddingHorizontal: 20,
                            borderRadius: 12,
                            elevation: 6,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <ActivityIndicator
                            size="small"
                            color="#2196F3"
                            style={{ marginRight: 10 }}
                        />
                        <Text style={{ fontSize: 16, fontWeight: "500" }}>
                            Recalcul de l’itinéraire...
                        </Text>
                    </View>
                </View>
            )}

            { bannerStep && navigationLaunched && (
            <NextStepBanner
                key={bannerStepIndex}
                nextStep={bannerStep}
                onToggleSteps={toggleSteps}
                remainingDistance={bannerDist}
                remainingDuration={bannerDur}
            />
            ) }

            {hasArrived && !isSearchVisible && (
                <ArrivalPopup
                    onClose={() => {
                        setHasArrived(false);
                        setSelectedRoute(null);
                        setCurrentStepIndex(0);
                        setAlternativeRoutes([]);
                    }}
                />
            )}

            <Animated.View
                style={searchBarContainerStyle}
                pointerEvents="box-none"
            >
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
                        liveCoords={liveCoords}
                        onClose={() => {
                            searchBarAnimation.value = withTiming(0, { duration: 200 });
                            setTimeout(() => {
                                setIsSearchVisible(false);
                                setOrigin("");
                                setDestination("");
                                setWaypoints([]);
                                setSelectedRoute(null);
                                setAlternativeRoutes([]);
                                setRouteError(null);
                            }, 200);
                        }}
                        
                    />
                )}
            </Animated.View>

            {mapRegion && !isSearchVisible && (
                <Animated.View
                    style={floatingButtonStyle}
                    pointerEvents="box-none"
                >
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

                            // Zoom sur la position actuelle
                            if (liveCoords) {
                                const zoomRegion = {
                                    latitude: liveCoords.latitude,
                                    longitude: liveCoords.longitude,
                                    latitudeDelta: 0.005,
                                    longitudeDelta: 0.005,
                                };
                                mapRef.current?.animateToRegion(zoomRegion, 800);
                            }

                            try {
                                // Vérifier la structure de l'objet route avec des valeurs par défaut sécurisées
                                const routeData = route as any;
                                const legs = routeData.legs || [];

                                // Vérifier si les propriétés nécessaires existent
                                const startLocation = legs[0]?.start_location || {};
                                const endLocation = legs[legs.length - 1]?.end_location || {};

                                const routeToSave = {
                                    startAddress: origin,
                                    endAddress: destination,
                                    startPoint: {
                                        latitude: startLocation.lat || 0,
                                        longitude: startLocation.lng || 0,
                                    },
                                    endPoint: {
                                        latitude: endLocation.lat || 0,
                                        longitude: endLocation.lng || 0,
                                    },
                                    kilometersDistance: routeData.distanceValue ? routeData.distanceValue / 1000 : 0,
                                    estimatedDurationInSeconds: routeData.durationValue || 0
                                };

                                // Sauvegarde dans l'historique
                                saveRoute(routeToSave);
                                console.log("Itinéraire sauvegardé dans l'historique");
                            } catch (error) {
                                console.error("Erreur lors de la sauvegarde de l'itinéraire:", error);
                            }


                        }}
                    />
                </View>
            )}

            {navigationLaunched && (
                <AlertReporter
                    navigationLaunched={navigationLaunched}
                    onAddAlert={(marker) =>
                        setAlertMarkers((prev) => [...prev, marker])
                    }
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
                    <Text
                        style={{
                            fontWeight: "bold",
                            fontSize: 16,
                            marginBottom: 10,
                        }}
                    >
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
                        <Text style={{ color: "#fff", fontWeight: "600" }}>
                            Fermer
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {navigationLaunched && liveCoords && (
                <TouchableOpacity
                    style={{
                        position: "absolute",
                        bottom: 40,
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
            <AlertVerifier
                liveCoords={liveCoords}
                onDismiss={(id) => {}}
                onAlertsUpdate={(newAlerts) => {
                    setAlertMarkers(newAlerts);

                    console.log("Nouvelles alertes reçues:", newAlerts.length);
                }}
            />
            {navigationLaunched && selectedRoute && (
            <TripInfoBar
                remainingDistance={remainingDistance}
                remainingDuration={remainingDuration}
            />
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

