export interface RouteCoordinate {
    latitude: number;
    longitude: number;
}

export type TransportMode = "driving" | "walking" | "bicycling" | "transit";

export interface Step {
    html_instructions: string;
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    maneuver?: string;
    start_location: { lat: number; lng: number };
    end_location: { lat: number; lng: number };
    instruction?: string;
}

export interface GoogleMapsResponse {
    routes: Array<{
        overview_polyline: {
            points: string;
        };
        bounds: {
            northeast: {
                lat: number;
                lng: number;
            };
            southwest: {
                lat: number;
                lng: number;
            };
        };
        legs: Array<{
            duration: {
                text: string;
                value: number;
            };
            distance: {
                text: string;
                value: number;
            };
            steps: Step[];
            start_address: string;
            end_address: string;
        }>;
    }>;
    status: string;
    error_message?: string;
}

export interface Waypoint {
    id: string;
    address: string;
    location?: {
        latitude: number;
        longitude: number;
    };
}

export interface SavedTrip {
    id: string;
    origin: string;
    destination: string;
    waypoints?: Waypoint[];
    mode: TransportMode;
    timestamp: number;
    distance?: string;
    duration?: string;
}

export interface RouteInfo {
    duration: string;
    distance: string;
    steps: Step[];
    polyline?: RouteCoordinate[];
}

export interface RouteBounds {
    northeast: {
        lat: number;
        lng: number;
    };
    southwest: {
        lat: number;
        lng: number;
    };
}

export interface RouteCalculationResult {
    bounds: any;
    duration: string;
    distance: string;
    polyline: { latitude: number; longitude: number }[];
    steps: Step[];
    durationValue?: number;
    distanceValue?: number;
    summary?: string;
}

export type RouteWithId = RouteCalculationResult & { id: string };
