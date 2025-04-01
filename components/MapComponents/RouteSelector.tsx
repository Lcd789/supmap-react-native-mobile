import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { RouteCalculationResult, Waypoint, TransportMode } from "@/types";
import { MaterialIcons } from "@expo/vector-icons";

interface RouteSelectorProps {
  origin: string;
  destination: string;
  waypoints?: Waypoint[];
  selectedMode: TransportMode;
  routes: RouteCalculationResult[];
  onSelectRoute?: (route: RouteCalculationResult) => void;
  onLaunchNavigation?: (route: RouteCalculationResult) => void;
}

const RouteSelector: React.FC<RouteSelectorProps> = ({
  origin,
  destination,
  waypoints = [],
  selectedMode,
  routes,
  onSelectRoute,
  onLaunchNavigation,
}) => {
  const [selectedRoute, setSelectedRoute] =
    React.useState<RouteCalculationResult | null>(null);

  const handleSelectRoute = (route: RouteCalculationResult) => {
    setSelectedRoute(route);
    if (onSelectRoute) {
      onSelectRoute(route);
    }
  };

  const handleLaunchNavigation = (route: RouteCalculationResult) => {
    setSelectedRoute(route);
    if (onLaunchNavigation) {
      onLaunchNavigation(route);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choisissez votre itinéraire</Text>
      <FlatList
        data={routes}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.itemContainer}>
            <TouchableOpacity
              style={[
                styles.routeItem,
                selectedRoute?.duration === item.duration && styles.selectedRoute,
              ]}
              onPress={() => handleSelectRoute(item)}
            >
              <View style={styles.routeRow}>
                <Text style={styles.routeSummary}>
                  Itinéraire {index + 1} - {item.distance} - {item.duration}
                </Text>

                <TouchableOpacity onPress={() => handleLaunchNavigation(item)}>
                  <MaterialIcons name="chevron-right" size={24} color="#2196F3" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  itemContainer: {
    marginBottom: 12,
  },
  routeItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  selectedRoute: {
    borderColor: "#2196F3",
    backgroundColor: "#e0f7fa",
  },
  routeSummary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  routeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default RouteSelector;
