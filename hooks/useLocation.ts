import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { Region } from "react-native-maps";

export const useLocation = () => {
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [liveCoords, setLiveCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

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

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 100,
          distanceInterval: 1,
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          const date = new Date(loc.timestamp);
          const hours = date.getHours().toString().padStart(2, "0");
          const minutes = date.getMinutes().toString().padStart(2, "0");
          const seconds = date.getSeconds().toString().padStart(2, "0");
          
          console.log("📍 Position :", latitude, longitude, "🕒 heure :", `${hours}:${minutes}:${seconds}`);
                    setLiveCoords({ latitude, longitude });
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
