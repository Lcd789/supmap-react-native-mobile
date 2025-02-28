export interface RouteCoordinate {
    latitude: number;
    longitude: number;
}

export type TransportMode = "driving" | "walking" | "bicycling" | "transit";

export interface Step {
    instruction?: string;
    distance?: { text: string } | string | number;
    duration?: { text: string };
    html_instructions?: string;
    maneuver?: string;
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
    address: string;
    location?: {
        latitude: number;
        longitude: number;
    };
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
    polyline: RouteCoordinate[];
    bounds: RouteBounds;
}
