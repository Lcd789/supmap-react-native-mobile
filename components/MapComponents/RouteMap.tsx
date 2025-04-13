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
  navigationLaunched?: boolean;
  alertMarkers?: AlertMarker[];
}

const getBearing = (
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number }
): number => {
  const lat1 = (start.latitude * Math.PI) / 180;
  const lon1 = (start.longitude * Math.PI) / 180;
  const lat2 = (end.latitude * Math.PI) / 180;
  const lon2 = (end.longitude * Math.PI) / 180;
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

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
  navigationLaunched = false,
  alertMarkers = [],
  ...mapProps
}) => {
  const heading =
    navigationLaunched && liveCoords && nextStepCoord
      ? getBearing(liveCoords, nextStepCoord)
      : 0;

  return (
    <MapView
      ref={mapRef}
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
      {!navigationLaunched &&
        alternativeRoutes.map((route) => {
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

      {liveCoords && navigationLaunched && (
        <Marker
          coordinate={liveCoords}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
          rotation={heading}
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
          coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
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
