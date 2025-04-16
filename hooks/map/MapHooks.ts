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


export const useDeleteFavoriteLocation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const deleteFavoriteLocation = async (id: string) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(`${API_BASE_URL}/private/map/favorite/location/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const errorText = await response.text();
                setError(errorText || "Erreur lors de la suppression de la location.");
            }
        } catch (err) {
            setError("Erreur réseau ou inconnue.");
        } finally {
            setLoading(false);
        }
    };

    return { deleteFavoriteLocation, loading, error, success };
};


export const useCreateFavoriteLocation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const createFavoriteLocation = async (data: FavoriteLocationUpdate) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(`${API_BASE_URL}/private/map/favorite/location`, {
                method: "POST",
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
                setError(errorText || "Erreur lors de la création du favori.");
            }
        } catch (err) {
            setError("Erreur réseau ou inconnue.");
        } finally {
            setLoading(false);
        }
    };

    return { createFavoriteLocation, loading, error, success };
};



export interface FavoriteLocation {
    id: string;
    name: string;
    formattedAddress: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    placeId: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    locationType: "HOME" | "WORK" | "FAVORITE";
    createdAt: string;
    updatedAt: string;
    userId: string;
}

export const useGetFavoriteLocations = () => {
    const [locations, setLocations] = useState<FavoriteLocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFavoriteLocations = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(`${API_BASE_URL}/private/map/favorite/locations`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setLocations(data.locations || []);
            } else {
                setError(data.error || "Erreur lors de la récupération des favoris.");
            }
        } catch (err) {
            setError("Erreur réseau ou inconnue.");
        } finally {
            setLoading(false);
        }
    };

    return { locations, fetchFavoriteLocations, loading, error };
};

