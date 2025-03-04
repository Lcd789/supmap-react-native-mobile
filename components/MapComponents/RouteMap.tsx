import React from "react";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { RouteCoordinate, Waypoint } from "../../types";
import { routeMapStyles } from "../../styles/styles";

interface RouteMapProps {
  mapRegion: Region;
  decodedPoints: RouteCoordinate[];
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
      ref={mapRef}
      style={routeMapStyles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={mapRegion}
      region={mapRegion}
      zoomEnabled={true}
      followsUserLocation={true}
      showsUserLocation={true}
      showsMyLocationButton={false}
      mapType="standard"
    >
      {decodedPoints.length > 0 && (
        <Polyline
          coordinates={decodedPoints}
          strokeWidth={4}
          strokeColor="#2196F3"
        />
      )}

      {waypoints.map((waypoint, index) =>
        waypoint.location && (
          <Marker
            key={`waypoint-${index}`}
            coordinate={waypoint.location}
            title={`Étape ${index + 1}`}
          />
        )
      )}

      {decodedPoints.length > 0 && (
        <Marker
          coordinate={decodedPoints[decodedPoints.length - 1]}
          title="Destination"
        >
          <MaterialIcons name="location-on" size={30} color="#2196F3" />
        </Marker>
      )}
    </MapView>
  );
};
