import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import type { Region } from "react-native-maps";

const toRad = (deg: number) => (deg * Math.PI) / 180;

const calculateBearing = (
  start: Location.LocationObjectCoords,
  end: Location.LocationObjectCoords
): number => {
  const lat1 = toRad(start.latitude);
  const lon1 = toRad(start.longitude);
  const lat2 = toRad(end.latitude);
  const lon2 = toRad(end.longitude);
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

export function useLocation(navigationLaunched: boolean) {
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [liveCoords, setLiveCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [bearing, setBearing] = useState<number>(0);
  const prevCoords = useRef<Location.LocationObjectCoords | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (loc) => {
          if (navigationLaunched && prevCoords.current) {
            const b = calculateBearing(prevCoords.current, loc.coords);
            setBearing(b);
          }
          prevCoords.current = loc.coords;
          setLiveCoords(loc.coords);
          if (!mapRegion) {
            setMapRegion({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
          
        }
      );
    })();
  }, [navigationLaunched]);

  return { mapRegion, setMapRegion, liveCoords, bearing };
}
