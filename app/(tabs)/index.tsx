import { Text, View, StyleSheet, TouchableOpacity} from "react-native";
import { Link } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import React, { useEffect, useState } from "react";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";

export default function Home() {
    const [mapRegion, setMapRegion] = useState({
      latitude: 48.8535,
      longitude: 2.348392,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421
    })

    const userLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Permission to access location was denied");
          return;
        }
        let location = await Location.getCurrentPositionAsync({
          // enableHighAccuracy: true,
        });
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.042
        });
    }

    useEffect(() => {
      userLocation()
    }, [])

    return (
        
        <View style={styles.container}>
            <Text style={styles.text}>Home</Text>
            <Link href={"/login"} style={styles.linkButton}>
              Login
            </Link>
            <TouchableOpacity style={styles.location} onPress={userLocation}>
              <Text>
                <MaterialIcons name="my-location" size={24} color="black" />
              </Text>
            </TouchableOpacity>
            <MapView 
              style={ styles.map } 
              initialRegion={ mapRegion }
              region={ mapRegion }
              zoomEnabled={ true }
              followsUserLocation={ true }
              showsMyLocationButton={ true }
              mapType="standard"
            >
                <Marker coordinate={{ latitude: 48.8535, longitude: 2.348392 }} />
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#25292e",
    },
    text: {
        color: "white",
    },
    imageContainer: {
        flex : 1,
    },
    linkButton: {
      fontSize: 20,
      textDecorationLine: "underline",
      color: "blue",
    },
    map: {
      width: "100%",
      height: "100%",
    },
    location: {
      position: "absolute",
      zIndex: 50,
      bottom: 0,
      margin: 20,
      backgroundColor: "white",
      height: 50,
      width: 50,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 50,
      elevation: 10,
    }
});