import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useGetAlertsByPosition, useValidateAlert, useInvalidateAlert } from "@/hooks/map/MapHooks";
import { AlertMarker, AlertType } from "./AlertReporter";
import * as SecureStore from "expo-secure-store";

// Type pour la position de l'utilisateur
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

  // Convertir les alertes de l'API en format AlertMarker pour l'affichage sur la carte
  const convertToAlertMarkers = (apiAlerts: any[]): AlertMarker[] => {
    return apiAlerts.map(alert => ({
      id: alert.id,
      latitude: alert.location.latitude,
      longitude: alert.location.longitude,
      type: alert.type as AlertType,
      createdByMe: true
    }));
  };

  // Animation d'affichage de la bannière
  const showBanner = () => {
    setShowAlertBanner(true);
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  };

  // Animation de fermeture de la bannière
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

  // Récupérer les alertes quand la position change significativement
  useEffect(() => {
    if (!liveCoords) return;

    // Déterminer si on doit rafraîchir les alertes
    const shouldFetchAlerts = () => {
      if (!lastFetchPosition) return true;

      const distance = getDistanceFromLatLonInMeters(
          liveCoords.latitude,
          liveCoords.longitude,
          lastFetchPosition.latitude,
          lastFetchPosition.longitude
      );

      // Rafraîchir si on s'est déplacé de plus de 100 mètres
      return distance > 100;
    };

    if (shouldFetchAlerts()) {
      console.log("Récupération des alertes à la position:", liveCoords);
      fetchAlertsByPosition({
        latitude: liveCoords.latitude,
        longitude: liveCoords.longitude
      });
      setLastFetchPosition(liveCoords);
    }
  }, [liveCoords]);

  // Mettre à jour les alertes sur la carte quand on en récupère de nouvelles
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      console.log("Nouvelles alertes reçues:", alerts.length);
      const alertMarkers = convertToAlertMarkers(alerts);
      // Remplacer complètement les alertes sur la carte
      onAlertsUpdate(alertMarkers);
    } else if (alerts && alerts.length === 0) {
      // Si aucune alerte n'est reçue, vider la carte
      onAlertsUpdate([]);
    }
  }, [alerts]);

  // Ajoutez cette fonction pour décoder le token JWT
  const decodeJWT = (token: string) => {
    try {
      // Séparation des parties du token
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error("Format de token invalide");
        return null;
      }

      // Décodage de la partie payload (la deuxième partie)
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
          atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Erreur lors du décodage du token:", error);
      return null;
    }
  };

// Vérifier les alertes à proximité pour les notifications
  useEffect(() => {
    if (!liveCoords || alertsLoading || !alerts || alerts.length === 0) return;

    const checkAlertAndAuth = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const token = await SecureStore.getItemAsync("authToken");

        // Si l'utilisateur n'est pas connecté, ne pas afficher la bannière de vérification
        if (!token) {
          console.log("Utilisateur non connecté, pas d'affichage de bannière de vérification");
          return;
        }

        // Décoder le token pour obtenir l'ID utilisateur
        let userId = null;
        const decodedToken = decodeJWT(token);
        if (decodedToken) {
          // Extraire l'ID utilisateur du token décodé
          userId = decodedToken.sub || decodedToken.id || decodedToken.userId;
          console.log("ID utilisateur connecté:", userId);
        } else {
          console.log("Impossible de décoder le token");
          return;
        }

        // Si l'ID utilisateur n'a pas pu être extrait, ne pas continuer
        if (!userId) {
          console.log("ID utilisateur non trouvé dans le token");
          return;
        }

        // L'utilisateur est connecté et son ID a été trouvé
        // Rechercher une alerte à proximité qui n'a pas été créée par lui
        const nearby = alerts.find((alert) => {
          if (alreadyAskedRef.current.has(alert.id)) return false;

          // Vérifier si l'alerte n'a PAS été créée par l'utilisateur actuel
          if (alert.reportedByUserId === userId) {
            console.log("Alerte créée par l'utilisateur actuel, ignorée:", alert.id);
            return false;
          }

          const dist = getDistanceFromLatLonInMeters(
              liveCoords.latitude,
              liveCoords.longitude,
              alert.location.latitude,
              alert.location.longitude
          );
          // Afficher une alerte si on est à moins de 100 mètres
          return dist < 100;
        });

        if (nearby && !showAlertBanner) {
          console.log("Alerte à proximité trouvée:", nearby.id);
          setNearbyAlert(nearby);
          setTimeLeft(20);
          showBanner();

          // Démarrer le compte à rebours
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }

          timerRef.current = setInterval(() => {
            setTimeLeft((prevTime) => {
              if (prevTime <= 1) {
                // Le temps est écoulé, on considère que l'alerte est toujours présente
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                }

                // Valider l'alerte automatiquement (elle est toujours présente)
                if (nearby) {
                  validateAlert(nearby.id);
                }

                hideBanner();
                return 0;
              }
              return prevTime - 1;
            });
          }, 1000);

          // Marquer cette alerte comme traitée
          alreadyAskedRef.current.add(nearby.id);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
      }
    };

    // Appeler la fonction asynchrone
    checkAlertAndAuth();
  }, [liveCoords, alerts]);

  // Nettoyer le timer quand le composant est démonté
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Gérer les erreurs de récupération des alertes
  useEffect(() => {
    if (alertsError) {
      console.error("Erreur lors de la récupération des alertes:", alertsError);
    }
  }, [alertsError]);

  // Gérer les erreurs de validation
  useEffect(() => {
    if (validateError) {
      console.error("Erreur lors de la validation de l'alerte:", validateError);
    }
  }, [validateError]);

  // Gérer les erreurs d'invalidation
  useEffect(() => {
    if (invalidateError) {
      console.error("Erreur lors de l'invalidation de l'alerte:", invalidateError);
    }
  }, [invalidateError]);

  // Gestionnaire pour le bouton "Non" (Invalider l'alerte)
  const handleDismiss = async () => {
    if (nearbyAlert) {
      try {
        // Invalider l'alerte
        await invalidateAlert(nearbyAlert.id);

        // Attendre que la requête soit bien traitée par le serveur
        setTimeout(() => {
          if (liveCoords) {
            console.log("Rafraîchissement des alertes après invalidation");
            fetchAlertsByPosition({
              latitude: liveCoords.latitude,
              longitude: liveCoords.longitude
            });
          }
        }, 1000); // Attendre 1 seconde
      } catch (error) {
        console.error("Erreur lors de l'invalidation:", error);
      }

      // Fermer la bannière
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      hideBanner();
    }
  };

  // Gestionnaire pour le bouton "Oui" (Valider l'alerte)
  const handleKeep = async () => {
    if (nearbyAlert) {
      try {
        // Valider l'alerte et attendre que ce soit terminé
        console.log("Validation de l'alerte:", nearbyAlert.id);
        await validateAlert(nearbyAlert.id);

        // Attendre un peu pour s'assurer que le serveur a bien pris en compte la modification
        setTimeout(() => {
          if (liveCoords) {
            console.log("Rafraîchissement des alertes après validation");
            fetchAlertsByPosition({
              latitude: liveCoords.latitude,
              longitude: liveCoords.longitude
            });
          }
        }, 1000);
      } catch (error) {
        console.error("Erreur lors de la validation:", error);
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