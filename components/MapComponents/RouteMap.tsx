// RouteMap.tsx
import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { Waypoint } from "@/types";

interface RouteMapProps {
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  decodedPoints: { latitude: number; longitude: number }[];
  waypoints: Waypoint[];
  mapRef: React.RefObject<MapView>;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  mapRegion,
  decodedPoints,
  waypoints,
  mapRef,
}) => {
  return (
    <MapView
      style={styles.map}
      region={mapRegion}
      ref={mapRef}
      showsUserLocation
      followsUserLocation
    >
      {/* Affichage de la vue d'ensemble du trajet */}
      {decodedPoints.length > 0 && (
        <Polyline
          coordinates={decodedPoints}
          strokeColor="#2196F3"
          strokeWidth={3}
        />
      )}

      {/* Optionnel: Affichage des waypoints sous forme de marqueurs */}
      {waypoints.map((wp) =>
      wp.address && wp.location ? (
      <Marker
      key={wp.id} // Ici, wp.id existe bien
      coordinate={wp.location} // Utilisation de la propriété 'location'
      title={wp.address}
    />
  ) : null
)}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
