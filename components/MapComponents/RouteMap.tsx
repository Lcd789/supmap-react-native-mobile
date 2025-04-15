import React from "react";
import { Image } from "react-native";
import MapView, {
  Polyline,
  MapViewProps,
  Marker,
} from "react-native-maps";
import { RouteCoordinate } from "@/types";
import { AlertMarker } from "@/components/MapComponents/AlertReporter";

interface AlternativeRoute {
  id: string;
  polyline: RouteCoordinate[];
}

interface RouteMapProps extends MapViewProps {
  alternativeRoutes?: AlternativeRoute[];
  selectedRouteId?: string;
  mapRef?: React.Ref<MapView>;
  liveCoords?: { latitude: number; longitude: number } | null;
  nextStepCoord?: { latitude: number; longitude: number } | null;
  deviceHeading?: number;
  navigationLaunched?: boolean;
  alertMarkers?: AlertMarker[];
}

const categoryIcons: Record<string, string> = {
  police: "https://img.icons8.com/color/96/policeman-male.png",
  embouteillage: "https://img.icons8.com/color/96/traffic-jam.png",
  travaux: "https://img.icons8.com/color/96/under-construction.png",
  obstacle: "https://img.icons8.com/color/96/error--v1.png",
  accident: "https://img.icons8.com/color/96/car-crash.png",
};

export const RouteMap: React.FC<RouteMapProps> = ({
  alternativeRoutes = [],
  selectedRouteId,
  mapRef,
  liveCoords,
  nextStepCoord,
  deviceHeading,
  navigationLaunched = false,
  alertMarkers = [],
  ...mapProps
}) => {


  return (
    <MapView
      ref={mapRef}
      initialRegion={{
        latitude: 46.603354,
        longitude: 1.888334,
        latitudeDelta: 10,
        longitudeDelta: 10,
      }}
      minZoomLevel={5}
      maxZoomLevel={18}
      onRegionChangeComplete={(region) => {

        const lat = Math.min(Math.max(region.latitude, 41.0), 51.5);
        const lon = Math.min(Math.max(region.longitude, -5.0), 9.5);
        if (mapRef && typeof mapRef !== "function" && mapRef.current) {
          mapRef.current.animateToRegion(
            {
              ...region,
              latitude: lat,
              longitude: lon,
            },
            300 // Durée de l'animation (à ajuster selon le besoin)
          );
        }
      }}
      scrollEnabled
      zoomEnabled
      pitchEnabled
      rotateEnabled
      showsCompass
      showsUserLocation={false}
      showsMyLocationButton={false}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      }}
      {...mapProps}
    >
      {alternativeRoutes
        .filter((route) =>
          navigationLaunched ? route.id === selectedRouteId : true
        )
        .map((route) => {
          const isSelected = route.id === selectedRouteId;
          return (
            <Polyline
              key={route.id}
              coordinates={route.polyline}
              strokeColor={isSelected ? "#2196F3" : "rgba(0,0,0,0.3)"}
              strokeWidth={isSelected ? 6 : 3}
              zIndex={isSelected ? 2 : 1}
            />
          );
        })}

      {liveCoords && (
        <Marker
          coordinate={liveCoords}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
          rotation={deviceHeading || 0} // rotation de la flèche
        >
          <Image
            source={require("@/assets/images/arrow.png")}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
        </Marker>
      )}

      {alertMarkers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title={marker.type}
        >
          <Image
            source={{ uri: categoryIcons[marker.type] }}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
        </Marker>
      ))}
    </MapView>
  );
};
