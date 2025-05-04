// FavoriteLocationsSelector.tsx
import React, { useEffect, useState } from 'react';
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

interface FavoriteLocationsSelectorProps {
    onSelectLocation: (address: string) => void;
    isOrigin?: boolean; // Pour déterminer si c'est pour l'origine ou la destination
}

const FavoriteLocationsSelector: React.FC<FavoriteLocationsSelectorProps> = ({
                                                                                 onSelectLocation,
                                                                                 isOrigin = false
                                                                             }) => {
    const { locations, fetchFavoriteLocations, loading } = useGetFavoriteLocations();
    const [isMounted, setIsMounted] = useState(true);

    useEffect(() => {
        fetchFavoriteLocations();
        return () => {
            setIsMounted(false);
        };
    }, []);

    // Fonction pour obtenir l'icône basée sur le type de localisation
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

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#2196F3" />
            </View>
        );
    }

    if (!locations || locations.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun lieu favori</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <MaterialIcons name="star" size={16} color="#888" />
                <Text style={styles.headerText}>Lieux favoris</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {locations.map((location, index) => (
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
                        <Text style={styles.locationName} numberOfLines={1}>
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
        maxWidth: 150,
        minWidth: 100,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2196F3',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
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