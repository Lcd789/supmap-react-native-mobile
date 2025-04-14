import { useState } from "react";
import { RouteCalculationResult, Step, Waypoint, TransportMode } from "@/types";
import polyline from "@mapbox/polyline";

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

interface RouteOptions {
  avoidTolls?: boolean;
}

const isRouteInFrance = (polylinePoints: { latitude: number; longitude: number }[]) => {
  return polylinePoints.every((point) => {
    return (
      point.latitude >= 41.0 &&
      point.latitude <= 51.5 &&
      point.longitude >= -5.0 &&
      point.longitude <= 9.5
    );
  });
};

export function useRoute() {
  const [routeInfo, setRouteInfo] = useState<RouteCalculationResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const language = "fr";
  const region = "FR";
  const units = "metric";

  const calculateRoute = async (
    origin: string,
    destination: string,
    waypoints: Waypoint[],
    mode: TransportMode,
    options?: RouteOptions
  ): Promise<RouteCalculationResult[] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const validWaypoints = waypoints
        .filter((wp) => wp.address.trim() !== "")
        .map((wp) => encodeURIComponent(wp.address));

      const wpString = validWaypoints.length > 0
        ? `&waypoints=optimize:true|${validWaypoints.join("|")}`
        : "";

      const avoidParams = [];
      if (options?.avoidTolls) avoidParams.push("tolls");
      const avoidQuery = avoidParams.length > 0 ? `&avoid=${avoidParams.join("|")}` : "";

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(destination)}${wpString}&mode=${mode}&language=${language}&region=${region}&units=${units}&alternatives=true${avoidQuery}&key=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(data.error_message || "CALCULATION_ERROR");
      }

      const parsedRoutes: RouteCalculationResult[] = data.routes.map((route: any) => {
        const decodedPolyline = route.legs.flatMap((leg: any) =>
          leg.steps.flatMap((step: any) =>
            polyline.decode(step.polyline.points).map(
              ([lat, lng]: [number, number]) => ({
                latitude: lat,
                longitude: lng,
              })
            )
          )
        );

        if (!isRouteInFrance(decodedPolyline)) {
          throw new Error("FRANCE_ONLY");
        }

        const totalDistance = route.legs.reduce(
          (sum: number, leg: any) => sum + leg.distance.value,
          0
        );
        const totalDuration = route.legs.reduce(
          (sum: number, leg: any) => sum + leg.duration.value,
          0
        );

        const steps: Step[] = route.legs.flatMap((leg: any) =>
          leg.steps.map((step: any) => ({
            html_instructions: step.html_instructions,
            distance: step.distance,
            duration: step.duration,
            maneuver: step.maneuver,
            start_location: step.start_location,
            end_location: step.end_location,
          }))
        );

        return {
          bounds: route.bounds,
          duration: route.legs[0].duration.text,
          distance: route.legs[0].distance.text,
          polyline: decodedPolyline,
          steps,
          durationValue: totalDuration,
          distanceValue: totalDistance,
        };
      });

      setRouteInfo(parsedRoutes);
      return parsedRoutes;
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    routeInfo,
    isLoading,
    error,
    calculateRoute,
  };
}
