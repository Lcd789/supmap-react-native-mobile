import React, { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { AlertMarker } from "./AlertReporter";

interface AlertVerifierProps {
  liveCoords: { latitude: number; longitude: number } | null;
  alertMarkers: AlertMarker[];
  onDismiss: (id: number) => void;
}

const getDistanceFromLatLonInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const AlertVerifier: React.FC<AlertVerifierProps> = ({
  liveCoords,
  alertMarkers,
  onDismiss,
}) => {
  const alreadyAskedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!liveCoords) return;

    const nearby = alertMarkers.find((marker) => {
      if (marker.createdByMe) return false;
      if (alreadyAskedRef.current.has(marker.id)) return false;

      const dist = getDistanceFromLatLonInMeters(
        liveCoords.latitude,
        liveCoords.longitude,
        marker.latitude,
        marker.longitude
      );
      return dist < 100;
    });

    if (nearby) {
      alreadyAskedRef.current.add(nearby.id);

      Alert.alert(
        "Alerte à proximité",
        `L'alerte "${nearby.type}" est-elle toujours présente ?`,
        [
          { text: "Oui", style: "cancel" },
          {
            text: "Non",
            onPress: () => onDismiss(nearby.id),
          },
        ]
      );
    }
  }, [liveCoords, alertMarkers]);

  return null;
};
