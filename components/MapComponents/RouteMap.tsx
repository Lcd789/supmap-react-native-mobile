// RouteMap.tsx
import React from "react";
import MapView, { Polyline, Region, MapViewProps } from "react-native-maps";
import { RouteCoordinate } from "@/types";

interface AlternativeRoute {
  id: string;
  polyline: RouteCoordinate[];
}

interface RouteMapProps extends MapViewProps {
  region: Region;
  alternativeRoutes?: AlternativeRoute[];
  selectedRoutePolyline?: RouteCoordinate[];
  mapRef?: React.Ref<MapView>;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  region,
  alternativeRoutes = [],
  selectedRoutePolyline = [],
  mapRef,
  ...mapProps
}) => {
  return (
    <MapView ref={mapRef} region={region} style={{ flex: 1 }} {...mapProps}>
      {alternativeRoutes.map((route) => (
        <Polyline
          key={route.id}
          coordinates={route.polyline}
          strokeColor="rgba(0,0,0,0.3)"
          strokeWidth={4}
        />
      ))}
      {selectedRoutePolyline.length > 0 && (
        <Polyline
          coordinates={selectedRoutePolyline}
          strokeColor="#2196F3"
          strokeWidth={4}
        />
      )}
    </MapView>
  );
};
