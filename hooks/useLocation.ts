import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { Region } from "react-native-maps";

export const useLocation = () => {
  const [liveCoords, setLiveCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission localisation refusée.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const coords = { latitude, longitude };
      setLiveCoords(coords);

      setMapRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  return {
    liveCoords,
    mapRegion,
    setMapRegion,
  };
};
