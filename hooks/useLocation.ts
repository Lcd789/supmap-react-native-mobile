import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { RouteCalculationResult } from "@/types";

export const useLocation = (
  navigationLaunched: boolean,
  selectedRoute?: RouteCalculationResult
) => {
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [liveCoords, setLiveCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);

  // Écoute de l'inclinaison du téléphone (magnetometer)
  useEffect(() => {
    const subscription = Magnetometer.addListener((data) => {
      let { x, y } = data;
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      angle = angle - 90; // Ajustement pour correspondre à l'orientation de la flèche
      if (angle < 0) angle += 360;
      setDeviceHeading(angle);
    });

    Magnetometer.setUpdateInterval(500);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== "granted") return;

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1,
        },
        (location) => {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setLiveCoords(coords);
          setMapRegion({
            ...coords,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        }
      );
    });
  }, [navigationLaunched, selectedRoute]);

  return {
    mapRegion,
    setMapRegion,
    liveCoords,
    deviceHeading,
  };
};
