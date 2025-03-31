import React, { useState } from "react";
import { View, StyleSheet, Image, TouchableOpacity, Modal, Text, FlatList, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from 'expo-location';

interface MarkerData {
    id: number;
    latitude: number;
    longitude: number;
    title: string;
    category: "police" | "embouteillage" | "travaux" | "obstacle" | "accident";
}

const categoryIcons: Record<MarkerData["category"], string> = {
    police: "https://img.icons8.com/color/96/policeman-male.png",
    embouteillage: "https://img.icons8.com/color/96/traffic-jam.png",
    travaux: "https://img.icons8.com/color/96/under-construction.png",
    obstacle: "https://img.icons8.com/color/96/error--v1.png",
    accident: "https://img.icons8.com/color/96/car-crash.png"
};

const categories = [
    { label: "Embouteillage", value: "embouteillage", icon: categoryIcons.embouteillage },
    { label: "Police", value: "police", icon: categoryIcons.police },
    { label: "Accident", value: "accident", icon: categoryIcons.accident },
    { label: "Travaux", value: "travaux", icon: categoryIcons.travaux },
    { label: "Obstacle", value: "obstacle", icon: categoryIcons.obstacle }
];

export default function GoogleMapScreen() {
    const [markers, setMarkers] = useState<MarkerData[]>([
        { id: 1, latitude: 48.846191, longitude: 2.346079, title: "Paris", category: "accident" },
    ]);

    const [modalVisible, setModalVisible] = useState(false);

    const handleGetGPS = async (category: MarkerData["category"]) => {
        setModalVisible(false);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'La localisation est nécessaire.');
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const newMarker: MarkerData = {
            id: Date.now(),
            latitude,
            longitude,
            title: category,
            category,
        };
        setMarkers((prev) => [...prev, newMarker]);

        Alert.alert("Coordonnées GPS", `Événement: ${category}\nLatitude : ${latitude}\nLongitude : ${longitude}`);
        // Ajoute ici la logique supplémentaire pour stocker en base de données
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: markers[0].latitude,
                    longitude: markers[0].longitude,
                    latitudeDelta: 0.2,
                    longitudeDelta: 0.2,
                }}
            >
                {markers.map((marker) => (
                    <Marker
                        key={marker.id}
                        coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                        title={marker.title}
                    >
                        <Image
                            source={{ uri: categoryIcons[marker.category] }}
                            style={{ width: 40, height: 40 }}
                        />
                    </Marker>
                ))}
            </MapView>

            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={styles.floatingButton}
            >
                <MaterialIcons name="my-location" size={28} color="#fff" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Que voyez-vous ?</Text>
                        <FlatList
                            data={categories}
                            numColumns={3}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.categoryItem} onPress={() => handleGetGPS(item.value as MarkerData["category"])}>
                                    <Image source={{ uri: item.icon }} style={styles.categoryIcon} />
                                    <Text style={styles.categoryText}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}
                        />
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                            <Text style={styles.closeText}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: "100%", height: "100%" },
    floatingButton: {
        position: 'absolute', bottom: 20, right: 20,
        backgroundColor: '#4CAF50', width: 60, height: 60,
        borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 6,
    },
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
        alignItems: "center"
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15
    },
    categoryItem: {
        width: 100, // largeur fixe
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
        marginHorizontal: 5,
    },
    categoryIcon: {
        width: 50,
        height: 50,
    },
    categoryText: {
        textAlign: 'center',
        fontSize: 14,
        marginTop: 6,
        color: '#333'
    },
    closeButton: {
        marginTop: 15,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: "#ddd",
        borderRadius: 10
    },
    closeText: {
        color: "#333",
        fontSize: 16
    }
});
