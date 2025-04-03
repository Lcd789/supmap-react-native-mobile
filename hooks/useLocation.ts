import { useEffect, useState } from "react";
import Geolocation, {
  GeoPosition,
  GeoError,
} from "react-native-geolocation-service";
import { PermissionsAndroid, Platform } from "react-native";
import { Region } from "react-native-maps";
import { getAddressFromCoords } from "@/utils/geocoding";

export const useLocation = (onLocationTextUpdate?: (address: string) => void) => {
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [liveCoords, setLiveCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    Geolocation.getCurrentPosition(
      async (position: GeoPosition) => {
        const { latitude, longitude } = position.coords;

        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });

        const address = await getAddressFromCoords(latitude, longitude);
        if (onLocationTextUpdate && address) onLocationTextUpdate(address);
      },
      (error: GeoError) => {
        console.error("Erreur localisation :", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    getCurrentLocation();

    const watchId = Geolocation.watchPosition(
      (position: GeoPosition) => {
        const { latitude, longitude } = position.coords;
        setLiveCoords({ latitude, longitude });
      },
      (error: GeoError) => console.error("Erreur de suivi GPS :", error),
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 2000,
      }
    );

    return () => Geolocation.clearWatch(watchId);
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === "ios") return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  return {
    mapRegion,
    setMapRegion,
    getCurrentLocation,
    liveCoords,
  };
};
