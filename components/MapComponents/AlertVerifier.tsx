import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useGetAlertsByPosition, useValidateAlert, useInvalidateAlert } from "@/hooks/map/MapHooks";
import { AlertMarker, AlertType } from "./AlertReporter";
import SecureStore from "expo-secure-store";

interface LiveCoordinates {
  latitude: number;
  longitude: number;
}

interface AlertVerifierProps {
  liveCoords: LiveCoordinates | null;
  onDismiss: (id: string) => void;
  onAlertsUpdate: (alerts: AlertMarker[]) => void;
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
                                                              onDismiss,
                                                              onAlertsUpdate
                                                            }) => {
  const alreadyAskedRef = useRef<Set<string>>(new Set());
  const { alerts, fetchAlertsByPosition, loading: alertsLoading, error: alertsError } = useGetAlertsByPosition();
  const { validateAlert, loading: validateLoading, error: validateError } = useValidateAlert();
  const { invalidateAlert, loading: invalidateLoading, error: invalidateError } = useInvalidateAlert();

  const [lastFetchPosition, setLastFetchPosition] = useState<LiveCoordinates | null>(null);
  const [nearbyAlert, setNearbyAlert] = useState<any | null>(null);
  const [showAlertBanner, setShowAlertBanner] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const slideAnimation = useRef(new Animated.Value(100)).current;

  const convertToAlertMarkers = (apiAlerts: any[]): AlertMarker[] => {
    return apiAlerts.map(alert => ({
      id: alert.id,
      latitude: alert.location.latitude,
      longitude: alert.location.longitude,
      type: alert.type as AlertType,
      createdByMe: true
    }));
  };

  const showBanner = () => {
    setShowAlertBanner(true);
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  };

  const hideBanner = () => {
    Animated.timing(slideAnimation, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setShowAlertBanner(false);
      setNearbyAlert(null);
    });
  };

  useEffect(() => {
    if (!liveCoords) return;
    const shouldFetchAlerts = () => {
      if (!lastFetchPosition) return true;

      const distance = getDistanceFromLatLonInMeters(
          liveCoords.latitude,
          liveCoords.longitude,
          lastFetchPosition.latitude,
          lastFetchPosition.longitude
      );

      return distance > 100;
    };

    if (shouldFetchAlerts()) {
      fetchAlertsByPosition({
        latitude: liveCoords.latitude,
        longitude: liveCoords.longitude
      });
      setLastFetchPosition(liveCoords);
    }
  }, [liveCoords]);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      const alertMarkers = convertToAlertMarkers(alerts);
      onAlertsUpdate(alertMarkers);
    } else if (alerts && alerts.length === 0) {
      onAlertsUpdate([]);
    }
  }, [alerts]);

  useEffect(() => {
    if (!liveCoords || alertsLoading || !alerts || alerts.length === 0) return;

    const nearby = alerts.find((alert) => {
      if (alreadyAskedRef.current.has(alert.id)) return false;

      const dist = getDistanceFromLatLonInMeters(
          liveCoords.latitude,
          liveCoords.longitude,
          alert.location.latitude,
          alert.location.longitude
      );
      return dist < 100;
    });

    if (nearby && !showAlertBanner) {
      setNearbyAlert(nearby);
      setTimeLeft(20);
      showBanner();

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }

            if (nearbyAlert) {
              validateAlert(nearbyAlert.id);
            }

            hideBanner();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      alreadyAskedRef.current.add(nearby.id);
    }
  }, [liveCoords, alerts]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (alertsError) {
    }
  }, [alertsError]);

  useEffect(() => {
    if (validateError) {
    }
  }, [validateError]);

  useEffect(() => {
    if (invalidateError) {
    }
  }, [invalidateError]);

  const handleDismiss = async () => {
    if (nearbyAlert) {
      try {
        await invalidateAlert(nearbyAlert.id);

        setTimeout(() => {
          if (liveCoords) {
            fetchAlertsByPosition({
              latitude: liveCoords.latitude,
              longitude: liveCoords.longitude
            });
          }
        }, 1000);
      } catch (error) {
        console.error("Invalidation error :", error);}

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      hideBanner();
    }
  };

  const handleKeep = async () => {
    if (nearbyAlert) {
      try {
        await validateAlert(nearbyAlert.id);

        setTimeout(() => {
          if (liveCoords) {
            fetchAlertsByPosition({
              latitude: liveCoords.latitude,
              longitude: liveCoords.longitude
            });
          }
        }, 1000);
      } catch (error) {
        console.error("Validation error :", error);
      }
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    hideBanner();
  };

  return (
      <>
        {showAlertBanner && nearbyAlert && (
            <Animated.View
                style={[
                  styles.alertBanner,
                  { transform: [{ translateY: slideAnimation }] }
                ]}
            >
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Alerte à proximité</Text>
                <Text style={styles.alertText}>
                  L'alerte "{nearbyAlert.type}" est-elle toujours présente ? ({timeLeft}s)
                </Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                      style={[styles.button, styles.yesButton]}
                      onPress={handleKeep}
                      disabled={validateLoading}
                  >
                    <Text style={[styles.buttonText, styles.yesButtonText]}>Oui</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                      style={[styles.button, styles.noButton]}
                      onPress={handleDismiss}
                      disabled={invalidateLoading}
                  >
                    <Text style={styles.buttonText}>Non</Text>
                  </TouchableOpacity>
                </View>
                {(validateLoading || invalidateLoading) && (
                    <Text style={styles.loadingText}>Traitement en cours...</Text>
                )}
              </View>
            </Animated.View>
        )}
      </>
  );
};

const styles = StyleSheet.create({
  alertBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 0,
    zIndex: 1000,
  },
  alertContent: {
    padding: 15,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  alertText: {
    fontSize: 14,
    marginBottom: 15,
    color: '#444',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
  },
  yesButton: {
    backgroundColor: '#EEEEEE',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  yesButtonText: {
    color: '#333',
  },
  noButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});