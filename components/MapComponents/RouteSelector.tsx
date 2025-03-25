import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { RouteCalculationResult, Waypoint, TransportMode } from "@/types";
import { useRoute } from "@/hooks/useRoute"; 

interface RouteSelectorProps {
  origin: string;
  destination: string;
  waypoints?: Waypoint[];
  selectedMode: TransportMode;
  onSelectRoute?: (route: RouteCalculationResult) => void;
}

const RouteSelector: React.FC<RouteSelectorProps> = ({
  origin,
  destination,
  waypoints = [],
  selectedMode,
  onSelectRoute,
}) => {
  const { calculateRoute, isLoading, error } = useRoute();
  const [routes, setRoutes] = useState<RouteCalculationResult[]>([]);
  const [selectedRoute, setSelectedRoute] =
    useState<RouteCalculationResult | null>(null);

  useEffect(() => {
    if (origin && destination) {
      calculateRoute(origin, destination, waypoints, selectedMode).then(
        (results) => {
          if (results) {
            setRoutes(results);
          }
        }
      );
    }
  }, [origin, destination, waypoints, selectedMode]);

  const handleSelectRoute = (route: RouteCalculationResult) => {
    setSelectedRoute(route);
    if (onSelectRoute) {
      onSelectRoute(route);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choisissez votre itinéraire</Text>
      <FlatList
        data={routes}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.routeItem,
              selectedRoute?.duration === item.duration && styles.selectedRoute,
            ]}
            onPress={() => handleSelectRoute(item)}
          >
            <Text style={styles.routeSummary}>
              Itinéraire {index + 1} - {item.distance} - {item.duration}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  routeItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginBottom: 8,
  },
  selectedRoute: {
    borderColor: "#2196F3",
  },
  routeSummary: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});

export default RouteSelector;
