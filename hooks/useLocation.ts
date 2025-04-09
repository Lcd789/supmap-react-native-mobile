import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { Region } from "react-native-maps";
import { getAddressFromCoords } from "@/utils/geocoding";

export const useLocation = (onLocationTextUpdate?: (address: string) => void) => {
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [liveCoords, setLiveCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  );

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permission localisation refusée");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      setLiveCoords({ latitude, longitude });

      const address = await getAddressFromCoords(latitude, longitude);
      if (onLocationTextUpdate && address) onLocationTextUpdate(address);
    } catch (err) {
      console.error("Erreur lors de la récupération de la position :", err);
    }
  };

  useEffect(() => {
    getCurrentLocation();

    let subscription: Location.LocationSubscription;

    const startLiveTracking = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
          timeInterval: 3000,
        },
        (location) => {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setLiveCoords(coords);
        }
      );
    };

    startLiveTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return {
    mapRegion,
    setMapRegion,
    getCurrentLocation,
    liveCoords,
  };
};
