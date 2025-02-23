
import { RouteCoordinate } from "../types";
export const reverseGeocode = async (
    latitude: number,
    longitude: number,
    apiKey: string
): Promise<string> => {
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].formatted_address;
        }
        throw new Error("Aucune adresse trouvée");
    } catch (error) {
        throw new Error("Erreur de géocodage inverse");
    }
};

export const decodePolyline = (encoded: string): RouteCoordinate[] => {
    const points: RouteCoordinate[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
        let shift = 0;
        let result = 0;

        do {
            const b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (index < len && encoded.charCodeAt(index - 1) >= 0x20);

        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;

        if (index < len) {
            do {
                const b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (index < len && encoded.charCodeAt(index - 1) >= 0x20);

            const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;
        }

        points.push({
            latitude: lat * 1e-5,
            longitude: lng * 1e-5,
        });
    }

    return points;
};

export const getManeuverIcon = (maneuver: string): string => {
    const icons: { [key: string]: string } = {
        "turn-right": "turn-right",
        "turn-left": "turn-left",
        "straight": "straight",
        "roundabout-right": "rotate-right",
        "roundabout-left": "rotate-left",
        "uturn-right": "u-turn-right",
        "uturn-left": "u-turn-left",
    };
    return icons[maneuver] || "arrow-forward";
};