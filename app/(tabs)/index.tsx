import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
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
import { useHistory } from "@/hooks/useHistory";
import { SearchBar } from "@/components/MapComponents/SearchBar";
import { RouteMap } from "@/components/MapComponents/RouteMap";
import { RouteInfo } from "@/components/MapComponents/RouteInfo";
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

type RouteWithId = RouteCalculationResult & { id: string };

export default function Home() {
    const { addToHistory } = useHistory();
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

    /**
     * Recalcule un itinéraire complet depuis la position actuelle (liveCoords),
     * en géocodant d’abord la position pour passer une adresse à calculateRoute.
     */

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

            const validWaypoints = waypoints.filter(
                (wp) => wp.address.trim() !== ""
            );

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

            if (
                distanceToEnd < 100 &&
                !announcedSteps.current.has(currentStepIndex)
            ) {
                const instruction = step.html_instructions?.replace(
                    /<[^>]*>/g,
                    " "
                );
                if (instruction) {
                    console.log("📢 Pré-annonce :", instruction);
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

                if (nextIndex >= selectedRoute.steps.length) {
                    setHasArrived(true);
                    setNavigationLaunched(false);
                    console.log("🎉 Arrivé à destination !");
                    return;
                }

                setCurrentStepIndex(nextIndex);

                const nextStep = selectedRoute.steps[nextIndex];
                if (
                    nextStep &&
                    nextStep.html_instructions &&
                    !announcedSteps.current.has(nextIndex)
                ) {
                    const distanceMeters = nextStep.distance?.value ?? 0;
                    const km = (distanceMeters / 1000).toFixed(1);
                    const cleanInstruction = nextStep.html_instructions.replace(
                        /<[^>]*>/g,
                        " "
                    );
                    const message = `Dans ${km} kilomètres, ${cleanInstruction}`;
                    console.log("🔮 Pré-étape suivante :", message);
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
            if (distance < 40) {
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

        const validWaypoints = waypoints.filter(
            (wp) => wp.address.trim() !== ""
        );

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

                const address = await getAddressFromCoords(
                    liveCoords.latitude,
                    liveCoords.longitude
                );
                if (!address) {
                    setRouteError(
                        "Impossible de récupérer votre position actuelle."
                    );
                    return;
                }

                finalOrigin = address;
            }

            if (finalDestination === "📍 Ma position") {
                if (!liveCoords) {
                    setRouteError("Position actuelle non disponible.");
                    return;
                }

                const address = await getAddressFromCoords(
                    liveCoords.latitude,
                    liveCoords.longitude
                );
                if (!address) {
                    setRouteError(
                        "Impossible de récupérer votre position actuelle."
                    );
                    return;
                }

                finalDestination = address;
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

            const routeResult = await calculateRoute(
                finalOrigin,
                finalDestination,
                validWaypoints,
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

                addToHistory({
                    origin: finalOrigin,
                    destination: finalDestination,
                    waypoints: validWaypoints.map((wp) => wp.address),
                    mode: selectedMode,
                });

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

    const toggleSearchBar = () => {
        const newValue = isSearchVisible ? 0 : 1;
        if (newValue === 1) {
            searchBarAnimation.value = withSpring(
                newValue,
                { damping: 18, stiffness: 120 },
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

            {selectedRoute &&
                !isSearchVisible &&
                navigationLaunched &&
                currentStepIndex < selectedRoute.steps.length && (
                <NextStepBanner
                    key={currentStepIndex}
                    nextStep={selectedRoute.steps[currentStepIndex]}
                    onToggleSteps={toggleSteps}
                    remainingDistance={remainingDistance}
                    remainingDuration={remainingDuration}
                />

                )}

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
                            if (liveCoords) {
                                const zoomRegion = {
                                    latitude: liveCoords.latitude,
                                    longitude: liveCoords.longitude,
                                    latitudeDelta: 0.005,
                                    longitudeDelta: 0.005,
                                };
                                mapRef.current?.animateToRegion(
                                    zoomRegion,
                                    800
                                );
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
