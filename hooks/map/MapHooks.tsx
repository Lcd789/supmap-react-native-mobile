import { useState } from "react";
import * as SecureStore from "expo-secure-store";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;


export type TransportMode = "CAR" | "MOTORCYCLE" | "TRUCK" | "BICYCLE" | "WALKING";

export interface NavigationPreferences {
    avoidTolls: boolean;
    avoidHighways: boolean;
    avoidTraffic: boolean;
    showUsers: boolean;
    proximityAlertDistance: number;
    preferredTransportMode: TransportMode;
}

export const useUpdateNavigationPreferences = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const updatePreferences = async (prefs: NavigationPreferences) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(`${API_BASE_URL}/private/map/navigation-preferences`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(prefs),
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const errorText = await response.text();
                setError(errorText || "Erreur lors de la mise à jour des préférences.");
            }
        } catch (err) {
            setError("Erreur réseau ou inconnue.");
        } finally {
            setLoading(false);
        }
    };

    return { updatePreferences, loading, error, success };
};





export type LocationType = "HOME" | "WORK" | "OTHER";

export interface FavoriteLocationUpdate {
    name: string;
    formattedAddress: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    street: string;
    city: string;
    postalCode: string;
    country: string;
    locationType: LocationType;
}

export const useUpdateFavoriteLocation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const updateFavoriteLocation = async (id: string, data: FavoriteLocationUpdate) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(`${API_BASE_URL}/private/map/favorite/location/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const errorText = await response.text();
                setError(errorText || "Erreur lors de la mise à jour de la location.");
            }
        } catch (err) {
            setError("Erreur réseau ou inconnue.");
        } finally {
            setLoading(false);
        }
    };

    return { updateFavoriteLocation, loading, error, success };
};
