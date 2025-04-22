import React, { useRef } from "react";
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

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => onSelect(item)}
        onLongPress={() => onLaunch(item)}
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => (scale.value = withSpring(1))}
        activeOpacity={0.9}
      >
        <Text style={styles.title}>🚗 Itinéraire {index + 1}</Text>
        <Text style={styles.details}>{item.distance} • {item.duration}</Text>
        <Text style={styles.summary}>{item.summary || "—"}</Text>

        <View style={styles.badgesRow}>
          {isFastest && (
            <Text style={[styles.badge, { backgroundColor: "#ffe0b2" }]}>⚡ Rapide</Text>
          )}
          {isEco && (
            <Text style={[styles.badge, { backgroundColor: "#c8e6c9" }]}>🌱 Écolo</Text>
          )}
          {isTollFree && (
            <Text style={[styles.badge, { backgroundColor: "#b3e5fc" }]}>🛣️ Sans péage</Text>
          )}
        </View>

        <View style={styles.launchIcon}>
          <MaterialIcons name="chevron-right" size={24} color="#2196F3" />
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
    const fastest = routes.reduce((min, route) =>
      (route.durationValue ?? Infinity) < (min.durationValue ?? Infinity) ? route : min
    );
    return fastest.id;
  }, [routes]);

  const ecoId = React.useMemo(() => {
    const shortest = routes.reduce((min, route) =>
      (route.distanceValue ?? Infinity) < (min.distanceValue ?? Infinity) ? route : min
    );
    return shortest.id;
  }, [routes]);

  const tollFreeIds = React.useMemo(() => {
    return routes
      .filter((route) =>
        route.steps.every(
          (step) =>
            !(step.html_instructions?.toLowerCase().includes("péage") ?? false)
        )
      )
      .map((r) => r.id);
  }, [routes]);

  const isSingle = routes.length === 1;

  return (
    <View style={styles.container}>
      {isSingle ? (
        <Text style={styles.heading}>Itinéraire proposé</Text>
      ) : null}

      {isSingle ? (
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
      ) : (
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
          showsHorizontalScrollIndicator={true}
          scrollIndicatorInsets={{ bottom: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: Platform.OS === "ios" ? 10 : 4,
          }}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToOffset({ offset: 1, animated: false });
          }}
        />
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
  heading: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#111",
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
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 2,
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
  launchIcon: {
    position: "absolute",
    right: 10,
    top: 10,
  },
});

export default RouteSelector;
