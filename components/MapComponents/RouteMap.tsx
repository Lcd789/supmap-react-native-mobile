import React from "react";
import { Image, View } from "react-native";
import MapView, { Polyline, MapViewProps, Marker } from "react-native-maps";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { RouteCoordinate } from "@/types";
import { AlertMarker } from "@/components/MapComponents/AlertReporter";
import { useSettings } from "@/hooks/user/SettingsContext";

const AnimatedMarker = Animated.createAnimatedComponent(Marker);

interface AlternativeRoute {
    id: string;
    polyline: RouteCoordinate[];
}

interface RouteMapProps extends MapViewProps {
    alternativeRoutes?: AlternativeRoute[];
    selectedRouteId?: string;
    mapRef?: React.Ref<MapView>;
    liveCoords?: { latitude: number; longitude: number } | null;
    navigationLaunched?: boolean;
    alertMarkers?: AlertMarker[];
    nextStepCoord?: { latitude: number; longitude: number } | null;
    animatedHeading?: Animated.SharedValue<string>;
    destinationCoord?: { latitude: number; longitude: number } | null;
}

export const RouteMap: React.FC<RouteMapProps> = ({
    alternativeRoutes = [],
    selectedRouteId,
    mapRef,
    liveCoords,
    navigationLaunched = false,
    alertMarkers = [],
    nextStepCoord,
    animatedHeading,
    destinationCoord,
    ...mapProps
}) => {
    const { showTraffic } = useSettings();

    const categoryIcons: Record<string, string> = {
        POLICE: "https://img.icons8.com/color/96/policeman-male.png",
        TRAFFIC_JAM: "https://img.icons8.com/color/96/traffic-jam.png",
        CONSTRUCTION: "https://img.icons8.com/color/96/under-construction.png",
        HAZARD: "https://img.icons8.com/color/96/error--v1.png",
        ACCIDENT: "https://img.icons8.com/color/96/car-crash.png",
        ROAD_CLOSURE: "https://img.icons8.com/color/96/road-closure.png",
        WEATHER: "https://img.icons8.com/color/96/storm.png",
    };

    const markerStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: animatedHeading?.value ?? "0deg" }],
    }));

    return (
        <MapView
            ref={mapRef}
            minZoomLevel={5}
            maxZoomLevel={18}
            scrollEnabled
            zoomEnabled
            pitchEnabled
            rotateEnabled
            showsCompass
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsTraffic={showTraffic}
            style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }}
            {...mapProps}
        >
            {alternativeRoutes
                .filter((route) =>
                    navigationLaunched ? route.id === selectedRouteId : true
                )
                .map((route) => (
                    <Polyline
                        key={route.id}
                        coordinates={route.polyline}
                        strokeColor={
                            route.id === selectedRouteId
                                ? "#2196F3"
                                : "rgba(0,0,0,0.3)"
                        }
                        strokeWidth={route.id === selectedRouteId ? 6 : 3}
                        zIndex={route.id === selectedRouteId ? 2 : 1}
                    />
                ))}

            {liveCoords && navigationLaunched && animatedHeading && (
                <AnimatedMarker
                    coordinate={liveCoords}
                    anchor={{ x: 0.5, y: 0.5 }}
                    flat
                    style={markerStyle}
                >
                    <Image
                        source={require("@/assets/images/arrow.png")}
                        style={{ width: 40, height: 40 }}
                        resizeMode="contain"
                    />
                </AnimatedMarker>
            )}

            {liveCoords && !navigationLaunched && (
                <Marker coordinate={liveCoords}>
                    <View
                        style={{
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: "#2196F3",
                            borderWidth: 2,
                            borderColor: "#fff",
                        }}
                    />
                </Marker>
            )}

            {nextStepCoord && (
                <Marker
                    coordinate={nextStepCoord}
                    title="Étape suivante"
                    pinColor="#2196F3"
                />
            )}

            {destinationCoord && (
                <Marker
                    coordinate={destinationCoord}
                    title="Arrivée"
                    anchor={{ x: 0.5, y: 1 }}
                >
                    <Image
                        source={require("@/assets/images/finish.png")}
                        style={{ width: 40, height: 40 }}
                        resizeMode="contain"
                    />
                </Marker>
            )}

            {alertMarkers.map((marker) => (
                <Marker
                    key={marker.id}
                    coordinate={{
                        latitude: marker.latitude,
                        longitude: marker.longitude,
                    }}
                    title={marker.type}
                >
                    <Image
                        source={{ uri: categoryIcons[marker.type] }}
                        style={{ width: 40, height: 40 }}
                        resizeMode="contain"
                    />
                </Marker>
            ))}
        </MapView>
    );
};
