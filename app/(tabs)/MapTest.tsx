import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, Text, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import MapView from 'react-native-maps';
import { useLocation } from '../../hooks/useLocation';
import { useRoute } from '../../hooks/useRoute';
import { SearchBar } from '../../components/MapComponents/SearchBar';
import { RouteMap } from '../../components/MapComponents/RouteMap';
import { RouteInfo } from '../../components/MapComponents/RouteInfo';
import { TransportMode, Waypoint } from '../../types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function Home() {
    const [origin, setOrigin] = useState<string>("");
    const [destination, setDestination] = useState<string>("");
    const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
    const [selectedMode, setSelectedMode] = useState<TransportMode>("driving");
    const [showSteps, setShowSteps] = useState<boolean>(false);
    
    const mapRef = useRef<MapView | null>(null);
    const stepsAnimation = useRef(new Animated.Value(0)).current;

    const { mapRegion, setMapRegion, getCurrentLocation } = useLocation(
        (address) => setOrigin(address)
    );

    const { routeInfo, isLoading, error, calculateRoute } = useRoute();

    const handleAddWaypoint = useCallback(() => {
        setWaypoints(prev => [...prev, { address: "" }]);
    }, []);

    const handleRemoveWaypoint = useCallback((index: number) => {
        setWaypoints(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleUpdateWaypoint = useCallback((index: number, address: string) => {
        setWaypoints(prev => prev.map((wp, i) => i === index ? { ...wp, address } : wp));
    }, []);

    const handleSearch = useCallback(async () => {
        const routeResult = await calculateRoute(origin, destination, waypoints, selectedMode);
        if (routeResult) {
            const { bounds } = routeResult;
            const newRegion = {
                latitude: (bounds.northeast.lat + bounds.southwest.lat) / 2,
                longitude: (bounds.northeast.lng + bounds.southwest.lng) / 2,
                latitudeDelta: Math.abs(bounds.northeast.lat - bounds.southwest.lat) * 1.5,
                longitudeDelta: Math.abs(bounds.northeast.lng - bounds.southwest.lng) * 1.5,
            };
            setMapRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 1000);
        }
    }, [origin, destination, waypoints, selectedMode, calculateRoute, setMapRegion]);

    const handleReverse = useCallback(() => {
        const temp = origin;
        setOrigin(destination);
        setDestination(temp);
    }, [origin, destination]);


    const toggleSteps = useCallback(() => {
        Animated.timing(stepsAnimation, {
            toValue: showSteps ? 0 : 300,
            duration: 300,
            useNativeDriver: false
        }).start();
        setShowSteps(!showSteps);
    }, [showSteps, stepsAnimation]);
    return (
        <View style={styles.container}>
            <SearchBar
                origin={origin}
                destination={destination}
                waypoints={waypoints}
                selectedMode={selectedMode}
                isLoading={isLoading}
                onOriginChange={setOrigin}
                onDestinationChange={setDestination}
                onWaypointAdd={handleAddWaypoint}
                onWaypointRemove={handleRemoveWaypoint}
                onWaypointUpdate={handleUpdateWaypoint}
                onModeSelect={setSelectedMode}
                onSearch={handleSearch}
                onReverse={handleReverse}
            />
            <RouteMap
                mapRegion={mapRegion}
                decodedPoints={routeInfo?.polyline || []}
                waypoints={waypoints}
                mapRef={mapRef}
            />

            {routeInfo && (
                <RouteInfo
                    routeSummary={{
                        duration: routeInfo.duration,
                        distance: routeInfo.distance
                    }}
                    routeInfo={routeInfo}
                    showSteps={showSteps}
                    stepsAnimation={stepsAnimation}
                    onToggleSteps={toggleSteps}
                />
            )}

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    reverseButton: {
        padding: 8,
        borderRadius: 5,
        backgroundColor: 'transparent', // Or a light background color
    },
    errorContainer: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        backgroundColor: '#ffebee',
        padding: 10,
        borderRadius: 4,
        elevation: 5,
    },
    errorText: {
        color: '#c62828',
        textAlign: 'center',
    },
});