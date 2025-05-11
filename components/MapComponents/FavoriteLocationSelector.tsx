import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useGetFavoriteLocations, FavoriteLocation } from '@/hooks/map/MapHooks';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoriteLocationsSelectorProps {
    onSelectLocation: (address: string) => void;
    isOrigin?: boolean;
}

const CACHE_KEY = 'favorite_locations_cache';

const FavoriteLocationsSelector: React.FC<FavoriteLocationsSelectorProps> = ({
                                                                                 onSelectLocation,
                                                                                 isOrigin = false
                                                                             }) => {
    const { locations, fetchFavoriteLocations, loading: apiLoading } = useGetFavoriteLocations();
    const [cachedLocations, setCachedLocations] = useState<FavoriteLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const isMounted = useRef(true);
    const lastFetchTime = useRef(0);
    const MIN_FETCH_INTERVAL = 30000; 

    useEffect(() => {
        const loadFromCache = async () => {
            try {
                const cachedData = await AsyncStorage.getItem(CACHE_KEY);
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    if (isMounted.current) {
                        setCachedLocations(parsed);
                        setLoading(false);
                    }
                }
            } catch (error) {
                console.error('error :', error);
            }
        };

        loadFromCache();

        const now = Date.now();
        if (now - lastFetchTime.current > MIN_FETCH_INTERVAL) {
            fetchFavoriteLocations();
            lastFetchTime.current = now;
        }

        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        const updateCache = async () => {
            if (locations && (!cachedLocations.length || needsUpdate(locations, cachedLocations))) {
                try {
                    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(locations));
                    setCachedLocations(locations);
                    setLoading(false);
                } catch (error) {
                    console.error('error:', error);
                }
            } else if (locations && locations.length === 0) {
                try {
                    await AsyncStorage.removeItem(CACHE_KEY);
                    setCachedLocations([]);
                    setLoading(false);
                } catch (error) {
                    console.error('error:', error);
                }
            } else if (!apiLoading && cachedLocations.length === 0 && !loading) {
                setLoading(false);
            }
        };

        if (locations) {
            updateCache();
        }
    }, [locations, apiLoading]);

    const needsUpdate = (newData: FavoriteLocation[], oldData: FavoriteLocation[]): boolean => {
        if (newData.length !== oldData.length) return true;

        const newIds = new Set(newData.map(item => item.id));
        const oldIds = new Set(oldData.map(item => item.id));

        for (const id of newIds) {
            if (!oldIds.has(id)) return true;
        }

        for (let i = 0; i < newData.length; i++) {
            const newItem = newData[i];
            const oldItem = oldData.find(item => item.id === newItem.id);

            if (!oldItem) return true;
            if (newItem.name !== oldItem.name) return true;
            if (newItem.formattedAddress !== oldItem.formattedAddress) return true;
            if (newItem.locationType !== oldItem.locationType) return true;
        }

        return false;
    };

    const getLocationTypeIcon = (locationType: string): any => {
        switch (locationType) {
            case "HOME":
                return "home";
            case "WORK":
                return "work";
            case "CUSTOM":
            default:
                return "star";
        }
    };

    const refreshData = () => {
        const now = Date.now();
        if (now - lastFetchTime.current > MIN_FETCH_INTERVAL) {
            fetchFavoriteLocations();
            lastFetchTime.current = now;
        }
    };

    if (loading && !cachedLocations.length) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#2196F3" />
            </View>
        );
    }

    if (!cachedLocations || cachedLocations.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun lieu favori</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {apiLoading && (
                    <ActivityIndicator size="small" color="#2196F3" style={styles.smallLoader} />
                )}
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onMomentumScrollEnd={refreshData}
            >
                {cachedLocations.map((location) => (
                    <TouchableOpacity
                        key={location.id}
                        style={styles.locationCard}
                        onPress={() => onSelectLocation(location.formattedAddress)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.iconContainer}>
                            <MaterialIcons
                                name={getLocationTypeIcon(location.locationType)}
                                size={20}
                                color="#fff"
                            />
                        </View>
                        <Text style={styles.locationName} numberOfLines={1} ellipsizeMode="tail">
                            {location.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        zIndex: 1000,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginBottom: 8,
    },
    headerText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
        fontWeight: '500',
        flex: 1,
    },
    smallLoader: {
        marginLeft: 8,
    },
    scrollContent: {
        paddingHorizontal: 4,
        paddingBottom: 8,
    },
    locationCard: {
        backgroundColor: '#f0f9ff',
        borderRadius: 12,
        padding: 8,
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0f2fe',
        minWidth: 120,
        maxWidth: 200,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2196F3',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        flexShrink: 0,
    },
    locationName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
    loaderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
    },
    emptyText: {
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
    },
});

export default FavoriteLocationsSelector;