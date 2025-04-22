import React from "react";
import { Image } from "react-native";
import MapView, {
  Polyline,
  MapViewProps,
  Marker,
} from "react-native-maps";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { RouteCoordinate } from "@/types";
import { AlertMarker } from "@/components/MapComponents/AlertReporter";

const AnimatedMarker = Animated.createAnimatedComponent(Marker);

interface AlternativeRoute {
  id: string;
  polyline: RouteCoordinate[];
}

interface RouteMapProps extends MapViewProps {
  alternativeRoutes?: AlternativeRoute[];
  selectedRouteId?: string;
  mapRef?: React.Ref<MapView>;
  liveCoords?: { latitude: number; longitude: number } | null;
  navigationLaunched?: boolean;
  alertMarkers?: AlertMarker[];
  nextStepCoord?: { latitude: number; longitude: number } | null;
  animatedHeading?: Animated.SharedValue<string>;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  alternativeRoutes = [],
  selectedRouteId,
  mapRef,
  liveCoords,
  navigationLaunched = false,
  alertMarkers = [],
  nextStepCoord,
  animatedHeading,
  ...mapProps
}) => {
  const categoryIcons: Record<string, string> = {
    police: "https://img.icons8.com/color/96/policeman-male.png",
    embouteillage: "https://img.icons8.com/color/96/traffic-jam.png",
    travaux: "https://img.icons8.com/color/96/under-construction.png",
    obstacle: "https://img.icons8.com/color/96/error--v1.png",
    accident: "https://img.icons8.com/color/96/car-crash.png",
  };

  const markerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: animatedHeading?.value ?? "0deg" }],
  }));

  return (
    <MapView
      ref={mapRef}
      minZoomLevel={5}
      maxZoomLevel={18}
      scrollEnabled
      zoomEnabled
      pitchEnabled
      rotateEnabled
      showsCompass
      showsUserLocation={false}
      showsMyLocationButton={false}
      style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
      {...mapProps}
    >
      {alternativeRoutes
        .filter(route => (navigationLaunched ? route.id === selectedRouteId : true))
        .map(route => (
          <Polyline
            key={route.id}
            coordinates={route.polyline}
            strokeColor={route.id === selectedRouteId ? "#2196F3" : "rgba(0,0,0,0.3)"}
            strokeWidth={route.id === selectedRouteId ? 6 : 3}
            zIndex={route.id === selectedRouteId ? 2 : 1}
          />
        ))}

      {liveCoords && animatedHeading && (
        <AnimatedMarker
          coordinate={liveCoords}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
          style={markerStyle}
        >
          <Image
            source={require("@/assets/images/arrow.png")}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
        </AnimatedMarker>
      )}

      {nextStepCoord && (
        <Marker
          coordinate={nextStepCoord}
          title="Étape suivante"
          pinColor="#2196F3"
        />
      )}

      {alertMarkers.map(marker => (
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