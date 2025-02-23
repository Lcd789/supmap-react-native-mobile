import { RouteInfo, Waypoint, TransportMode, RouteCalculationResult, GoogleMapsResponse } from "@/types";
import { decodePolyline } from "@/utils/mapUtils";
import { useState, useCallback } from "react";
import { Alert } from "react-native";

export const useRoute = () => {
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const calculateRoute = useCallback(async (
        origin: string,
        destination: string,
        waypoints: Waypoint[],
        selectedMode: TransportMode
    ): Promise<RouteCalculationResult | undefined> => {
        if (!origin || !destination) {
            const msg = "Veuillez saisir un point de départ et une destination";
            setError(msg);
            Alert.alert("Erreur", msg);
            return undefined;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Construire l'URL
            let waypointsString = "";
            if (waypoints.length > 0) {
                waypointsString = `&waypoints=${waypoints
                    .filter(wp => wp.address) // Filtrer les waypoints vides
                    .map(wp => `via:${encodeURIComponent(wp.address)}`)
                    .join("|")}`;
            }

            const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypointsString}&mode=${selectedMode}&key=${process.env.EXPO_PUBLIC_GOOGLE_API_KEY}`;
            
            console.log('Calling Google Maps API:', apiUrl);

            const response = await fetch(apiUrl);
            const data: GoogleMapsResponse = await response.json();

            console.log('Google Maps API Response:', data);

            if (data.status !== "OK") {
                const errorMessage = data.error_message || `Erreur: ${data.status}`;
                setError(errorMessage);
                Alert.alert("Erreur", errorMessage);
                return undefined;
            }

            if (!data.routes || data.routes.length === 0) {
                const msg = "Aucun itinéraire trouvé";
                setError(msg);
                Alert.alert("Erreur", msg);
                return undefined;
            }

            const route = data.routes[0];
            const legs = route.legs[0];

            if (!legs || !route.overview_polyline || !route.bounds) {
                const msg = "Données d'itinéraire incomplètes";
                setError(msg);
                Alert.alert("Erreur", msg);
                return undefined;
            }

            setRouteInfo({
                duration: legs.duration.text,
                distance: legs.distance.text,
                steps: legs.steps
            });

            // Important: retourner le résultat !
            return {
                polyline: decodePolyline(route.overview_polyline.points),
                bounds: route.bounds
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
            console.error('Error in calculateRoute:', error);
            setError(errorMessage);
            Alert.alert("Erreur", "Impossible de calculer l'itinéraire");
            return undefined;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        routeInfo,
        isLoading,
        error,
        calculateRoute
    };
};