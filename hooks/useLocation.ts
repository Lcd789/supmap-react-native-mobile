import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { Region } from "react-native-maps";

export function useLocation(navigationLaunched: boolean = false) {
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [liveCoords, setLiveCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const previousCoords = useRef<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const region = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setMapRegion(region);
      setLiveCoords({ latitude, longitude });
      previousCoords.current = { latitude, longitude };

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          const newCoords = { latitude, longitude };

          previousCoords.current = newCoords;
          setLiveCoords(newCoords);
        }
      );
    })();

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    mapRegion,
    setMapRegion,
    liveCoords,
  };
};
