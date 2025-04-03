// RouteMap.tsx
import React from "react";
import MapView, {
  Polyline,
  Region,
  MapViewProps,
  Marker,
} from "react-native-maps";
import { RouteCoordinate } from "@/types";

interface AlternativeRoute {
  id: string;
  polyline: RouteCoordinate[];
}

interface RouteMapProps extends MapViewProps {
  region: Region;
  alternativeRoutes?: AlternativeRoute[];
  selectedRouteId?: string;
  mapRef?: React.Ref<MapView>;
  liveCoords?: { latitude: number; longitude: number } | null;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  region,
  alternativeRoutes = [],
  selectedRouteId,
  mapRef,
  liveCoords,
  ...mapProps
}) => {
  return (
    <MapView ref={mapRef} region={region} style={{ flex: 1 }} {...mapProps}>
      {alternativeRoutes.map((route) => {
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
          title="Ma position"
          pinColor="blue"
        />
      )}
    </MapView>
  );
};
