import { useState } from "react";
import { RouteCalculationResult, Step, Waypoint, TransportMode } from "@/types";
import polyline from "@mapbox/polyline";

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY!;

interface RouteOptions {
  avoidTolls?: boolean;
  avoidHighways?: boolean;
}

const isRouteInFrance = (
  polylinePoints: { latitude: number; longitude: number }[]
) =>
  polylinePoints.every(
    (pt) =>
      pt.latitude >= 41.0 &&
      pt.latitude <= 51.5 &&
      pt.longitude >= -5.0 &&
      pt.longitude <= 9.5
  );


async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(address)}` +
    `&key=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.status !== "OK" || !data.results.length) {
    throw new Error(`Geocode failed for ${address}: ${data.status}`);
  }
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}

export function useRoute() {
  const [routeInfo, setRouteInfo] = useState<RouteCalculationResult[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
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
      const originCoords = await geocodeAddress(origin);
      const destCoords = await geocodeAddress(destination);

      const validWaypoints = waypoints.filter(wp => wp.address.trim() !== "");
      const waypointCoords = await Promise.all(
        validWaypoints.map(wp => geocodeAddress(wp.address))
      );
      const wpParamStrings = waypointCoords.map(({ lat, lng }) =>
        `${lat},${lng}`
      );
      const wpString =
        wpParamStrings.length > 0 ? `&waypoints=${wpParamStrings.join("|")}` : "";

      const avoids: string[] = [];
      if (options?.avoidTolls) avoids.push("tolls");
      if (options?.avoidHighways) avoids.push("highways");
      const avoidQuery = avoids.length > 0 ? `&avoid=${avoids.join("|")}` : "";

      const url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${originCoords.lat},${originCoords.lng}` +
        `&destination=${destCoords.lat},${destCoords.lng}` +
        `${wpString}` +
        `&mode=${mode}` +
        `&language=${language}` +
        `&region=${region}` +
        `&units=${units}` +
        `&alternatives=true` +
        `${avoidQuery}` +
        `&key=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(data.error_message || `CALCULATION_ERROR (${data.status})`);
      }

      const parsedRoutes: RouteCalculationResult[] = data.routes.map(
        (route: any) => {
          const decodedPolyline = route.legs.flatMap((leg: any) =>
            leg.steps.flatMap((step: any) =>
              polyline
                .decode(step.polyline.points)
                .map(([lat, lng]: [number, number]) => ({
                  latitude: lat,
                  longitude: lng,
                }))
            )
          );

          if (!isRouteInFrance(decodedPolyline)) {
            throw new Error("FRANCE_ONLY");
          }

          let totalDistance = 0;
          let totalDuration = 0;

          const steps: Step[] = route.legs.flatMap((leg: any) =>
            leg.steps.map((step: any) => {
              totalDistance += step.distance.value;
              totalDuration += step.duration.value;
              return {
                html_instructions: step.html_instructions,
                distance: step.distance,
                duration: step.duration,
                maneuver: step.maneuver,
                start_location: step.start_location,
                end_location: step.end_location,
              };
            })
          );

          return {
            bounds: route.bounds,
            distance: route.legs[0].distance.text,
            duration: route.legs[0].duration.text,
            polyline: decodedPolyline,
            steps,
            distanceValue: totalDistance,
            durationValue: totalDuration,
          };
        }
      );

      setRouteInfo(parsedRoutes);
      return parsedRoutes;
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { routeInfo, isLoading, error, calculateRoute };
}