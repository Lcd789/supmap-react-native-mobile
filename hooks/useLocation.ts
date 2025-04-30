import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { LocationObjectCoords } from "expo-location";
import { Region } from "react-native-maps";
import { RouteCoordinate } from "@/types";
import { useSharedValue, withTiming } from "react-native-reanimated";

export function useLocation(navigationLaunched: boolean) {
  const [liveCoords, setLiveCoords] = useState<RouteCoordinate | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const lastPositionRef = useRef<RouteCoordinate | null>(null);
  const lastAcceptedPosition = useRef<RouteCoordinate | null>(null);

  const animatedBearing = useSharedValue("0deg");

  const getBearing = (from: RouteCoordinate, to: RouteCoordinate): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const lat1 = toRad(from.latitude);
    const lon1 = toRad(from.longitude);
    const lat2 = toRad(to.latitude);
    const lon2 = toRad(to.longitude);

    const dLon = lon2 - lon1;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const bearing = toDeg(Math.atan2(y, x));
    return (bearing + 360) % 360;
  };

  const getDistance = (
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);
    const lat1 = toRad(coord1.latitude);
    const lat2 = toRad(coord2.latitude);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    let subscription: Location.LocationSubscription;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permission de localisation refusée");
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 500,
          distanceInterval: 1,
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          const currentPos = { latitude, longitude };

          // Filtrage anti-jitter (si on a déjà une position)
          if (
            lastAcceptedPosition.current &&
            getDistance(lastAcceptedPosition.current, currentPos) < 5
          ) {
            return; // Ne rien faire si la position est trop proche
          }

          lastAcceptedPosition.current = currentPos;

          if (lastPositionRef.current) {
            const bearing = getBearing(lastPositionRef.current, currentPos);
            animatedBearing.value = withTiming(`${bearing}deg`, { duration: 300 });
          }

          lastPositionRef.current = currentPos;
          setLiveCoords(currentPos);

          if (!navigationLaunched) {
            setMapRegion({
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }
      );
    };

    startTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [navigationLaunched]);

  return {
    liveCoords,
    mapRegion,
    setMapRegion,
    animatedBearing,
  };
}
