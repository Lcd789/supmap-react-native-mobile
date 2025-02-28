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
import { TransportMode, Waypoint } from "../../types";
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

export default function Home() {
    const [origin, setOrigin] = useState<string>("");
    const [destination, setDestination] = useState<string>("");
    const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
    const [selectedMode, setSelectedMode] = useState<TransportMode>("driving");
    const [showSteps, setShowSteps] = useState<boolean>(false);
    const [isSearchVisible, setIsSearchVisible] = useState<boolean>(true);

    const mapRef = useRef<MapView | null>(null);

    // Animation values
    const searchBarAnimation = useSharedValue(1);
    const routeInfoAnimation = useSharedValue(0);
    const stepsAnimation = useSharedValue(0);

    const { mapRegion, setMapRegion, getCurrentLocation } = useLocation(
        (address) => setOrigin(address)
    );

    const { routeInfo, isLoading, error, calculateRoute } = useRoute();

    // Effect to animate RouteInfo panel when routeInfo changes
    useEffect(() => {
        if (routeInfo) {
            routeInfoAnimation.value = withDelay(
                300, // Delay to wait for map animation to finish
                withSpring(1, {
                    damping: 15,
                    stiffness: 100,
                })
            );
        } else {
            routeInfoAnimation.value = withTiming(0, {
                duration: 300,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            });
        }
    }, [routeInfo]);

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
            console.error(
                "Veuillez entrer un point de départ et une destination."
            );
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

            if (routeResult) {
                const { bounds } = routeResult;
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
                mapRef.current?.animateToRegion(newRegion, 1000);

                // Collapse the search bar after successful search with a slight delay
                // to create a sequential animation
                setTimeout(() => {
                    toggleSearchBar();
                }, 300);
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

    // Toggle SearchBar animation with improved timing and spring physics
    const toggleSearchBar = useCallback(() => {
        const newValue = isSearchVisible ? 0 : 1;

        if (newValue === 1) {
            // When showing SearchBar, use a spring animation for a more dynamic feel
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
            // When hiding SearchBar, use timing for a smoother exit
            searchBarAnimation.value = withTiming(
                newValue,
                { duration: 250, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
                () => {
                    runOnJS(setIsSearchVisible)(!isSearchVisible);
                }
            );
        }
    }, [isSearchVisible, searchBarAnimation]);

    // Animated styles for SearchBar container with improved transforms
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
                    translateY: interpolate(
                        searchBarAnimation.value,
                        [0, 1],
                        [-100, 0]
                    ),
                },
                {
                    scale: interpolate(
                        searchBarAnimation.value,
                        [0, 1],
                        [0.8, 1]
                    ),
                },
            ],
        };
    });

    // Improved floating button animation
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
        };
    });

    // New animated style for RouteInfo component
    const routeInfoStyle = useAnimatedStyle(() => {
        return {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
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
        };
    });

    return (
        <View style={styles.container}>
            <RouteMap
                mapRegion={mapRegion}
                decodedPoints={routeInfo?.polyline || []}
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

            {/* Floating button that appears when SearchBar is collapsed */}
            <Animated.View style={floatingButtonStyle}>
                <TouchableOpacity
                    onPress={toggleSearchBar}
                    style={styles.floatingButton}
                >
                    <MaterialIcons name="map" size={24} color="#fff" />
                </TouchableOpacity>
            </Animated.View>

            {routeInfo && (
                <Animated.View style={routeInfoStyle}>
                    <RouteInfo
                        routeSummary={{
                            duration: routeInfo.duration,
                            distance: routeInfo.distance,
                        }}
                        routeInfo={routeInfo}
                        showSteps={showSteps}
                        stepsAnimation={stepsAnimation}
                        onToggleSteps={toggleSteps}
                    />
                </Animated.View>
            )}

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    errorContainer: {
        position: "absolute",
        top: 100,
        left: 20,
        right: 20,
        backgroundColor: "#ffebee",
        padding: 10,
        borderRadius: 4,
        elevation: 5,
    },
    errorText: {
        color: "#c62828",
        textAlign: "center",
    },
    loadingContainer: {
        position: "absolute",
        top: "50%",
        left: "50%",
        marginLeft: -25,
        marginTop: -25,
    },
    floatingButton: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 25,
    },
    routeInfoContainer: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        padding: 15,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    routeSummary: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    routeInfoTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#212121",
    },
    stepsToggleButton: {
        padding: 5,
    },
    stepItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    stepInstruction: {
        flex: 1,
        fontSize: 14,
        color: "#424242",
    },
    stepDistance: {
        fontSize: 14,
        color: "#757575",
        marginLeft: 10,
    },
});
