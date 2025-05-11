import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useCreateMapAlert } from "@/hooks/map/MapHooks";
import {router} from "expo-router";

export type AlertType =
    | "ACCIDENT"
    | "CONSTRUCTION"
    | "ROAD_CLOSURE"
    | "TRAFFIC_JAM"
    | "HAZARD"
    | "POLICE"
    | "WEATHER";

export interface AlertMarker {
  id: string;
  latitude: number;
  longitude: number;
  type: AlertType;
  createdByMe?: boolean;
}

export const categoryIcons: Record<string, string> = {
  POLICE: "https://img.icons8.com/color/96/policeman-male.png",
  TRAFFIC_JAM: "https://img.icons8.com/color/96/traffic-jam.png",
  CONSTRUCTION: "https://img.icons8.com/color/96/under-construction.png",
  HAZARD: "https://img.icons8.com/color/96/error--v1.png",
  ACCIDENT: "https://img.icons8.com/color/96/car-crash.png",
  ROAD_CLOSURE: "https://img.icons8.com/color/96/road-closure.png",
  WEATHER: "https://img.icons8.com/color/96/storm.png",
};

const categories = [
  { label: "Embouteillage", value: "TRAFFIC_JAM" },
  { label: "Police", value: "POLICE" },
  { label: "Accident", value: "ACCIDENT" },
  { label: "Travaux", value: "CONSTRUCTION" },
  { label: "Route fermée", value: "ROAD_CLOSURE" },
  { label: "Danger", value: "HAZARD" },
  { label: "Météo", value: "WEATHER" },
];

interface AlertReporterProps {
  onAddAlert: (marker: AlertMarker) => void;
  navigationLaunched: boolean;
}

export const AlertReporter: React.FC<AlertReporterProps> = ({
                                                              onAddAlert,
                                                              navigationLaunched,
                                                            }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { createAlert, loading, error, success } = useCreateMapAlert();


  const buttonOffset = useSharedValue(100);

  useEffect(() => {
    buttonOffset.value = withTiming(navigationLaunched ? 160 : 100, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [navigationLaunched]);

  useEffect(() => {
    if (success) {
      Alert.alert("Merci !", "Alerte ajoutée avec succès.");
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      Alert.alert("Erreur", error);
    }
  }, [error]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    right: 20,
    bottom: buttonOffset.value - 60,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f44336",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    elevation: 6,
  }));

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");

      if (token) {
        setModalVisible(true);
      } else {
        Alert.alert(
            "Connexion requise",
            "Vous devez être connecté pour signaler une alerte.",
            [
              {
                text: "Se connecter",
                onPress: () => {
                  router.replace("/login")
                }
              },
              {
                text: "Annuler",
                style: "cancel"
              }
            ]
        );
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue lors de la vérification de votre compte.");
    }
  };

  const handleSelect = async (type: AlertType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(false);

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "La localisation est nécessaire.");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});

    await createAlert({
      alertType: type,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    });

    if (true) {
      const newMarker: AlertMarker = {
        id: Date.now().toString(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        type,
        createdByMe: true,
      };

      onAddAlert(newMarker);
    }
  };

  return (
      <>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
              onPress={checkAuth}
              disabled={loading}
          >
            <MaterialIcons name="warning" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Signaler un événement</Text>
              <FlatList
                  data={categories}
                  keyExtractor={(item) => item.value}
                  numColumns={3}
                  renderItem={({ item }) => (
                      <TouchableOpacity
                          style={styles.categoryItem}
                          onPress={() => handleSelect(item.value as AlertType)}
                          disabled={loading}
                      >
                        <Image
                            source={{ uri: categoryIcons[item.value] }}
                            style={styles.categoryIcon}
                        />
                        <Text style={styles.categoryText}>{item.label}</Text>
                      </TouchableOpacity>
                  )}
                  contentContainerStyle={{ justifyContent: "center" }}
              />
              <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                  disabled={loading}
              >
                <Text style={styles.closeText}>Annuler</Text>
              </TouchableOpacity>

              {loading && (
                  <View style={styles.loadingIndicator}>
                    <Text>Création de l'alerte...</Text>
                  </View>
              )}
            </View>
          </View>
        </Modal>
      </>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  categoryItem: {
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
  },
  categoryIcon: {
    width: 50,
    height: 50,
  },
  categoryText: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 14,
    color: "#333",
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  closeText: {
    fontSize: 16,
    color: "#333",
  },
  loadingIndicator: {
    marginTop: 10,
    padding: 10,
  }
});