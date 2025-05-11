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



export interface RouteToSave {
    startAddress: string;
    endAddress: string;
    startPoint: {
        latitude: number;
        longitude: number;
    };
    endPoint: {
        latitude: number;
        longitude: number;
    };
    kilometersDistance: number;
    estimatedDurationInSeconds: number;
}




export const useSaveRoute = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const saveRoute = async (routeData: RouteToSave) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(`${API_BASE_URL}/private/map/save-route`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(routeData),
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const errorText = await response.text();
                setError(errorText || "Erreur lors de l'enregistrement de l'itinéraire.");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Erreur réseau ou inconnue.");
            }
        } finally {
            setLoading(false);
        }
    };

    return { saveRoute, loading, error, success };
};




export interface SavedRoute {
    id: string;
    startAddress: string;
    endAddress: string;
    startPoint: {
        latitude: number;
        longitude: number;
    };
    endPoint: {
        latitude: number;
        longitude: number;
    };
    kilometersDistance: number;
    estimatedDurationInSeconds: number;
    createdAt: string;
    userId: string;
}





export const useGetRouteHistory = () => {
    const [routes, setRoutes] = useState<SavedRoute[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRouteHistory = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(`${API_BASE_URL}/private/map/history/routes`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data: { routes: SavedRoute[] | null; error: string | null } = await response.json();

            if (response.ok) {
                setRoutes(data.routes || []);
            } else {
                setError(data.error || "Erreur lors de la récupération de l'historique des itinéraires.");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Erreur réseau ou inconnue.");
            }
        } finally {
            setLoading(false);
        }
    };

    return { routes, fetchRouteHistory, loading, error };
};



export interface RouteShareRequest {
    startLatitude: number;
    startLongitude: number;
    endLatitude: number;
    endLongitude: number;
}

export const useShareRoute = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

    const shareRoute = async (data: RouteShareRequest) => {
        setLoading(true);
        setError(null);
        setQrCodeUrl(null);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(`${API_BASE_URL}/private/map/route/share`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const qrUrl = await response.text();
                setQrCodeUrl(qrUrl);
            } else {
                const errorText = await response.text();
                setError(errorText || "Erreur lors du partage de l'itinéraire.");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Erreur réseau ou inconnue.");
            }
        } finally {
            setLoading(false);
        }
    };

    return { shareRoute, qrCodeUrl, loading, error };
};


export interface LocationShareRequest {
    latitude: number;
    longitude: number;
}


export const useShareCurrentLocation = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

    const shareLocation = async (data: LocationShareRequest) => {
        setLoading(true);
        setError(null);
        setQrCodeUrl(null);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(`${API_BASE_URL}/private/map/location/share`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const qrUrl = await response.text();
                setQrCodeUrl(qrUrl);
            } else {
                const errorText = await response.text();
                setError(errorText || "Erreur lors du partage de la localisation.");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Erreur réseau ou inconnue.");
            }
        } finally {
            setLoading(false);
        }
    };

    return { shareLocation, qrCodeUrl, loading, error };
};




export const useLogRouteRecalculation = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const logRecalculation = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(`${API_BASE_URL}/private/map/route-recalculation`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const errorText = await response.text();
                setError(errorText || "Erreur lors de l'enregistrement du recalcul d'itinéraire.");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Erreur réseau ou inconnue.");
            }
        } finally {
            setLoading(false);
        }
    };

    return { logRecalculation, loading, error, success };
};





export type AlertType =
    | "ACCIDENT"
    | "CONSTRUCTION"
    | "ROAD_CLOSURE"
    | "TRAFFIC_JAM"
    | "HAZARD"
    | "POLICE"
    | "WEATHER";

export interface MapAlertRequest {
    alertType: AlertType;
    latitude: number;
    longitude: number;
}



export const useCreateMapAlert = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const createAlert = async (data: MapAlertRequest) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(`${API_BASE_URL}/private/map/alert`, {
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
                console.error("Error response text:", errorText);
                setError(errorText || "Erreur lors de la création de l'alerte.");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error("Caught error:", err.message);
                setError(err.message);
            } else {
                console.error("Unknown error occurred");
                setError("Erreur réseau ou inconnue.");
            }
        } finally {
            console.log("createAlert finished");
            setLoading(false);
        }
    };

    return { createAlert, loading, error, success };
};



export interface RoutePoint {
    latitude: number;
    longitude: number;
}

export interface GetAlertsRequest {
    routePoints: RoutePoint[];
}

export interface MapAlert {
    id: string;
    type: "ACCIDENT" | "CONSTRUCTION" | "ROAD_CLOSURE" | "TRAFFIC_JAM" | "HAZARD" | "POLICE" | "WEATHER";
    location: {
        latitude: number;
        longitude: number;
    };
    roadName: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    reportedByUserId: string;
}



export const useGetAlertsAlongRoute = () => {
    const [alerts, setAlerts] = useState<MapAlert[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const getAlerts = async (route: GetAlertsRequest) => {
        setLoading(true);
        setError(null);
        setAlerts([]);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(`${API_BASE_URL}/map/alerts/route`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(route),
            });

            const data: { alerts: MapAlert[] | null; error: string | null } = await response.json();

            if (response.ok) {
                setAlerts(data.alerts || []);
            } else {
                setError(data.error || "Erreur lors de la récupération des alertes.");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Erreur réseau ou inconnue.");
            }
        } finally {
            setLoading(false);
        }
    };

    return { getAlerts, alerts, loading, error };
};


export const useValidateAlert = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const validateAlert = async (id: string) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(`${API_BASE_URL}/private/map/alert/validate/${id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const errorText = await response.text();
                setError(errorText || "Erreur lors de la validation de l'alerte.");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Erreur réseau ou inconnue.");
            }
        } finally {
            setLoading(false);
        }
    };

    return { validateAlert, loading, error, success };
};





export const useInvalidateAlert = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const invalidateAlert = async (id: string) => {
        setLoading(true);
        setError(null);
        setSuccess(false);


        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(`${API_BASE_URL}/private/map/alert/invalidate/${id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const errorText = await response.text();
                setError(errorText || "Erreur lors de l’invalidation de l’alerte.");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Erreur réseau ou inconnue.");
            }
        } finally {
            setLoading(false);
        }
    };

    return { invalidateAlert, loading, error, success };
};




export interface GeoPosition {
    latitude: number;
    longitude: number;
}



export const useGetAlertsByPosition = () => {
    const [alerts, setAlerts] = useState<MapAlert[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAlertsByPosition = async (position: GeoPosition) => {
        setLoading(true);
        setError(null);
        setAlerts([]);

        try {
            const response = await fetch(`${API_BASE_URL}/map/alerts/position`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(position),
            });

            const data: { alerts: MapAlert[] | null; error: string | null } = await response.json();

            if (response.ok) {
                setAlerts(data.alerts || []);
            } else {
                console.error("Error fetching alerts:", data.error);
                setError(data.error || "Erreur lors de la récupération des alertes.");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error("Caught error:", err.message);
                setError(err.message);
            } else {
                console.error("Unknown error occurred");
                setError("Erreur réseau ou inconnue.");
            }
        } finally {
            console.log("fetchAlertsByPosition finished");
            setLoading(false);
        }
    };

    return { alerts, fetchAlertsByPosition, loading, error };
};




export interface NearbyUser {
    username: string;
    profileImage: string;
    lastKnownLocation: {
        latitude: number;
        longitude: number;
    };
    userRank: string;
    rankImage: string;
}

export interface NearbyUsersResponse {
    users: NearbyUser[] | null;
    error: string | null;
}


export const useGetNearbyUsers = () => {
    const [users, setUsers] = useState<NearbyUser[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNearbyUsers = async (latitude: number, longitude: number) => {
        setLoading(true);
        setError(null);
        setUsers([]);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch(
                `${API_BASE_URL}/private/map/nearby-users?latitude=${latitude}&longitude=${longitude}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data: NearbyUsersResponse = await response.json();

            if (response.ok) {
                setUsers(data.users || []);
            } else {
                setError(data.error || "Erreur lors de la récupération des utilisateurs proches.");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Erreur réseau ou inconnue.");
            }
        } finally {
            setLoading(false);
        }
    };

    return { fetchNearbyUsers, users, loading, error };
};




