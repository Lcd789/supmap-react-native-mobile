import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { Region } from 'react-native-maps';
import { reverseGeocode } from '../utils/mapUtils';

export const useLocation = (onLocationFound: (address: string) => void) => {
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: 48.8535,
        longitude: 2.348392,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421
    });

    const getCurrentLocation = useCallback(async (): Promise<void> => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permission refusée",
                    "L'accès à la localisation est nécessaire pour utiliser cette fonctionnalité"
                );
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const newRegion: Region = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.042
            };

            setMapRegion(newRegion);

            const address = await reverseGeocode(
                location.coords.latitude,
                location.coords.longitude,
                process.env.EXPO_PUBLIC_GOOGLE_API_KEY as string
            );
            onLocationFound(address);
        } catch (error) {Alert.alert(
            "Erreur",
            "Impossible d'obtenir votre position actuelle"
        );
    }
}, [onLocationFound]);

return {
    mapRegion,
    setMapRegion,
    getCurrentLocation
};
};