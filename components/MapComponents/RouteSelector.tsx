import React, { useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Dimensions,
    Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Waypoint, TransportMode, RouteCalculationResult } from "@/types";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";

const screenWidth = Dimensions.get("window").width;

type RouteWithId = RouteCalculationResult & { id: string };

interface RouteSelectorProps {
    origin: string;
    destination: string;
    waypoints?: Waypoint[];
    selectedMode: TransportMode;
    avoidTolls?: boolean;
    routes: RouteWithId[];
    selectedRouteId?: string;
    onSelectRoute?: (route: RouteWithId) => void;
    onLaunchNavigation?: (route: RouteWithId) => void;
}

const RouteCard = ({
    item,
    index,
    isSelected,
    isFastest,
    isEco,
    isTollFree,
    onSelect,
    onLaunch,
}: {
    item: RouteWithId;
    index: number;
    isSelected: boolean;
    isFastest: boolean;
    isEco: boolean;
    isTollFree: boolean;
    onSelect: (route: RouteWithId) => void;
    onLaunch: (route: RouteWithId) => void;
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
        onSelect(item);
    };

    const handleLaunch = () => {
        onLaunch(item);
    };

    return (
        <Animated.View style={[styles.cardContainer, animatedStyle]}>
            <TouchableOpacity
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={handlePress}
                onPressIn={() => (scale.value = withSpring(0.95))}
                onPressOut={() => (scale.value = withSpring(1))}
                activeOpacity={0.9}
            >
                {/* Header avec titre et bouton navigation */}
                <View style={styles.cardHeader}>
                    <Text style={styles.title}>🚗 Itinéraire {index + 1}</Text>
                    <TouchableOpacity
                        style={styles.launchButton}
                        onPress={handleLaunch}
                    >
                        <Text style={styles.launchText}>Naviguer</Text>
                        <MaterialIcons
                            name="navigation"
                            size={16}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>

                <Text style={styles.details}>
                    {item.distance} • {item.duration}
                </Text>
                <Text style={styles.summary}>{item.summary || "—"}</Text>

                <View style={styles.badgesRow}>
                    {isFastest && (
                        <Text
                            style={[
                                styles.badge,
                                { backgroundColor: "#ffe0b2" },
                            ]}
                        >
                            ⚡ Rapide
                        </Text>
                    )}
                    {isEco && (
                        <Text
                            style={[
                                styles.badge,
                                { backgroundColor: "#c8e6c9" },
                            ]}
                        >
                            🌱 Écolo
                        </Text>
                    )}
                    {isTollFree && (
                        <Text
                            style={[
                                styles.badge,
                                { backgroundColor: "#b3e5fc" },
                            ]}
                        >
                            🛣️ Sans péage
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const RouteSelector: React.FC<RouteSelectorProps> = ({
    origin,
    destination,
    waypoints = [],
    selectedMode,
    routes,
    selectedRouteId,
    onSelectRoute = () => {},
    onLaunchNavigation = () => {},
}) => {
    const flatListRef = useRef<FlatList>(null);

    const fastestId = React.useMemo(() => {
        const fastest = routes.reduce(
            (min, route) =>
                (route.durationValue ?? Infinity) <
                (min.durationValue ?? Infinity)
                    ? route
                    : min,
            routes[0] || { id: "", durationValue: Infinity }
        );
        return fastest.id;
    }, [routes]);

    const ecoId = React.useMemo(() => {
        const shortest = routes.reduce(
            (min, route) =>
                (route.distanceValue ?? Infinity) <
                (min.distanceValue ?? Infinity)
                    ? route
                    : min,
            routes[0] || { id: "", distanceValue: Infinity }
        );
        return shortest.id;
    }, [routes]);

    const tollFreeIds = React.useMemo(() => {
        return routes
            .filter((route) =>
                route.steps.every(
                    (step) =>
                        !(
                            step.html_instructions
                                ?.toLowerCase()
                                .includes("péage") ?? false
                        )
                )
            )
            .map((r) => r.id);
    }, [routes]);

    const isSingle = routes.length === 1;

    // Indicateur de pagination pour le défilement
    const renderPaginationIndicator = () => {
        if (isSingle) return null;

        return (
            <View style={styles.paginationContainer}>
                {routes.map((_, index) => (
                    <View
                        key={`dot-${index}`}
                        style={[
                            styles.paginationDot,
                            routes[index].id === selectedRouteId &&
                                styles.paginationDotActive,
                        ]}
                    />
                ))}
            </View>
        );
    };

    const scrollToSelectedRoute = () => {
        if (isSingle || !flatListRef.current || !selectedRouteId) return;

        const selectedIndex = routes.findIndex(
            (route) => route.id === selectedRouteId
        );
        if (selectedIndex !== -1) {
            try {
                flatListRef.current.scrollToIndex({
                    index: selectedIndex,
                    animated: true,
                    viewPosition: 0.5,
                });
            } catch (error) {
                console.log("Erreur de défilement:", error);
            }
        }
    };

    // Effet pour faire défiler jusqu'à la route sélectionnée
    useEffect(() => {
        if (selectedRouteId && routes.length > 1) {
            // Léger délai pour s'assurer que la FlatList est rendue
            setTimeout(scrollToSelectedRoute, 100);
        }
    }, [selectedRouteId, routes.length]);

    return (
        <View style={styles.container}>
            {isSingle ? (
                <View style={styles.singleRouteContainer}>
                    <RouteCard
                        item={routes[0]}
                        index={0}
                        isSelected={true}
                        isFastest={true}
                        isEco={true}
                        isTollFree={tollFreeIds.includes(routes[0].id)}
                        onSelect={onSelectRoute}
                        onLaunch={onLaunchNavigation}
                    />
                </View>
            ) : (
                <>
                    <FlatList
                        ref={flatListRef}
                        data={routes}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => (
                            <RouteCard
                                item={item}
                                index={index}
                                isSelected={item.id === selectedRouteId}
                                isFastest={item.id === fastestId}
                                isEco={item.id === ecoId}
                                isTollFree={tollFreeIds.includes(item.id)}
                                onSelect={onSelectRoute}
                                onLaunch={onLaunchNavigation}
                            />
                        )}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.flatListContent}
                        snapToInterval={screenWidth * 0.65 + 12} // Largeur de la carte + marge
                        snapToAlignment="center"
                        decelerationRate="fast"
                        onContentSizeChange={() => {
                            // Léger délai pour s'assurer que la FlatList est prête
                            setTimeout(scrollToSelectedRoute, 50);
                        }}
                        onScrollToIndexFailed={() => {
                            // Fallback si le scroll échoue
                            setTimeout(() => {
                                if (flatListRef.current) {
                                    flatListRef.current.scrollToOffset({
                                        offset: 0,
                                        animated: false,
                                    });
                                    // Réessayer après le reset
                                    setTimeout(scrollToSelectedRoute, 50);
                                }
                            }, 100);
                        }}
                    />
                    {renderPaginationIndicator()}
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 12,
        left: 0,
        right: 0,
        paddingVertical: 4,
    },
    headerContainer: {
        alignItems: "center",
        marginBottom: 8,
    },
    heading: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111",
        backgroundColor: "rgba(255,255,255,0.8)",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        overflow: "hidden",
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    scrollHint: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.8)",
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 16,
    },
    scrollHintText: {
        fontSize: 12,
        color: "#666",
        marginLeft: 4,
    },
    singleRouteContainer: {
        alignItems: "center",
        paddingHorizontal: 16,
    },
    cardContainer: {
        marginRight: 12,
    },
    card: {
        width: screenWidth * 0.65,
        height: 160,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 14,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#ddd",
        justifyContent: "space-evenly",
    },
    cardSelected: {
        borderColor: "#2196F3",
        backgroundColor: "#e3f2fd",
        borderWidth: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    title: {
        fontSize: 17,
        fontWeight: "bold",
        color: "#222",
        flex: 1,
    },
    summary: {
        fontSize: 15,
        color: "#444",
        marginBottom: 2,
    },
    details: {
        fontSize: 15,
        color: "#333",
        marginBottom: 4,
    },
    badgesRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 4,
    },
    badge: {
        fontSize: 13,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
        overflow: "hidden",
        color: "#000",
    },
    launchButton: {
        backgroundColor: "#2196F3",
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
    },
    launchText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 12,
    },
    flatListContent: {
        paddingHorizontal: 12,
        paddingBottom: Platform.OS === "ios" ? 10 : 4,
    },
    paginationContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 8,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#ccc",
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: "#2196F3",
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});

export default RouteSelector;
