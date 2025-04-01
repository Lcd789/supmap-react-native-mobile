import { useState } from "react";
import { RouteCalculationResult, Step, Waypoint, TransportMode } from "@/types";
import polyline from "@mapbox/polyline";
import Constants from "expo-constants";

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

interface RouteOptions {
  avoidTolls?: boolean;
}

export function useRoute() {
  const [routeInfo, setRouteInfo] = useState<RouteCalculationResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
      const wpString = waypoints
        .map((wp) => encodeURIComponent(wp.address))
        .join("|");

      const avoidParams = [];
      if (options?.avoidTolls) avoidParams.push("tolls");
      const avoidQuery = avoidParams.length > 0 ? `&avoid=${avoidParams.join("|")}` : "";

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(destination)}${
        wpString ? `&waypoints=${wpString}` : ""
      }&mode=${mode}&alternatives=true${avoidQuery}&key=${API_KEY}`;

      console.log("Calling Google Maps API:", url);

      const response = await fetch(url);
      const data = await response.json();

      console.log("Google Maps API Response:", data);

      if (data.status !== "OK") {
        throw new Error(data.error_message || "Erreur lors du calcul d'itinéraire");
      }

      const parsedRoutes: RouteCalculationResult[] = data.routes.map((route: any) => {
        const decodedPolyline = polyline.decode(route.overview_polyline.points).map(
          ([lat, lng]: [number, number]) => ({
            latitude: lat,
            longitude: lng,
          })
        );

        const steps: Step[] = route.legs[0].steps.map((step: any) => ({
          html_instructions: step.html_instructions,
          distance: step.distance,
          duration: step.duration,
          maneuver: step.maneuver,
          start_location: step.start_location,
          end_location: step.end_location,
        }));

        return {
          bounds: route.bounds,
          duration: route.legs[0].duration.text,
          distance: route.legs[0].distance.text,
          polyline: decodedPolyline,
          steps,
        };
      });

      setRouteInfo(parsedRoutes);
      return parsedRoutes;
    } catch (err: any) {
      console.error("Route error:", err);
      setError(err.message || "Erreur inconnue");
      return null;
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
