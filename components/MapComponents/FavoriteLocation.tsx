import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ActivityIndicator,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
    ScrollView
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
    useCreateFavoriteLocation,
    useGetFavoriteLocations,
    useDeleteFavoriteLocation,
    FavoriteLocation,
    FavoriteLocationUpdate,
    LocationType
} from "@/hooks/map/MapHooks";

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

interface PlaceSuggestion {
    description: string;
    placeId: string;
}

const FavoriteLocationsManager = () => {
    const { locations, fetchFavoriteLocations, loading: isLoadingFavorites } = useGetFavoriteLocations();
    const { createFavoriteLocation, loading: isCreating, error: createError, success: createSuccess } = useCreateFavoriteLocation();
    const { deleteFavoriteLocation, loading: isDeleting } = useDeleteFavoriteLocation();

    const [modalVisible, setModalVisible] = useState(false);
    const [newFavorite, setNewFavorite] = useState<FavoriteLocationUpdate>({
        name: "",
        formattedAddress: "",
        coordinates: {
            latitude: 0,
            longitude: 0
        },
        street: "",
        city: "",
        postalCode: "",
        country: "France",
        locationType: "CUSTOM"
    });
    const [nameError, setNameError] = useState("");
    const [addressError, setAddressError] = useState("");
    const [addressSuggestions, setAddressSuggestions] = useState<PlaceSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [addressQuery, setAddressQuery] = useState("");

    useEffect(() => {
        fetchFavoriteLocations();
    }, []);

    useEffect(() => {
        if (createSuccess) {
            setModalVisible(false);
            resetForm();
            fetchFavoriteLocations();
        }
    }, [createSuccess]);

    const resetForm = () => {
        setNewFavorite({
            name: "",
            formattedAddress: "",
            coordinates: {
                latitude: 0,
                longitude: 0
            },
            street: "",
            city: "",
            postalCode: "",
            country: "France",
            locationType: "CUSTOM"
        });
        setNameError("");
        setAddressError("");
        setAddressSuggestions([]);
        setShowSuggestions(false);
        setAddressQuery("");
    };

    const validateForm = () => {
        let isValid = true;

        if (!newFavorite.name.trim()) {
            setNameError("Le nom est obligatoire");
            isValid = false;
        } else {
            setNameError("");
        }

        if (!newFavorite.formattedAddress.trim()) {
            setAddressError("L'adresse est obligatoire");
            isValid = false;
        } else {
            setAddressError("");
        }

        if (newFavorite.coordinates.latitude === 0 && newFavorite.coordinates.longitude === 0) {
            setAddressError("Veuillez sélectionner une adresse valide dans les suggestions");
            isValid = false;
        }

        return isValid;
    };

    const handleCreateFavorite = async () => {
        if (validateForm()) {
            await createFavoriteLocation(newFavorite);
        }
    };

    const handleDeleteFavorite = (id: string, name: string) => {
        Alert.alert(
            "Supprimer le favori",
            `Êtes-vous sûr de vouloir supprimer "${name}" ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        await deleteFavoriteLocation(id);
                        fetchFavoriteLocations();
                    }
                }
            ]
        );
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

    const locationTypes = [
        { type: "HOME" as LocationType, label: "Domicile", iconName: "home" as any },
        { type: "WORK" as LocationType, label: "Travail", iconName: "work" as any },
        { type: "CUSTOM" as LocationType, label: "Personnalisé", iconName: "star" as any }
    ];

    const searchPlaces = async (query: string) => {
        if (query.length < 3) {
            setAddressSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                    query
                )}&key=${GOOGLE_PLACES_API_KEY}&language=fr&components=country:fr`
            );

            const data = await response.json();

            if (data.status === "OK") {
                const suggestions = data.predictions.map((prediction: any) => ({
                    description: prediction.description,
                    placeId: prediction.place_id
                }));

                setAddressSuggestions(suggestions);
                setShowSuggestions(true);
            } else {
                setAddressSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (error) {
            setAddressSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const getPlaceDetails = async (placeId: string) => {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry,address_component&key=${GOOGLE_PLACES_API_KEY}&language=fr`
            );

            const data = await response.json();

            if (data.status === "OK") {
                const result = data.result;
                const addressComponents = result.address_components;

                let street = "";
                let city = "";
                let postalCode = "";
                let country = "France";

                for (const component of addressComponents) {
                    const types = component.types;

                    if (types.includes("route")) {
                        street = component.long_name;
                    } else if (types.includes("street_number")) {
                        street = `${component.long_name} ${street}`;
                    } else if (types.includes("locality")) {
                        city = component.long_name;
                    } else if (types.includes("postal_code")) {
                        postalCode = component.long_name;
                    } else if (types.includes("country")) {
                        country = component.long_name;
                    }
                }

                setNewFavorite({
                    ...newFavorite,
                    formattedAddress: result.formatted_address,
                    coordinates: {
                        latitude: result.geometry.location.lat,
                        longitude: result.geometry.location.lng
                    },
                    street,
                    city,
                    postalCode,
                    country
                });

                setAddressQuery(result.formatted_address);
                setShowSuggestions(false);
            }
        } catch (error) {
            console.error("error :", error);
        }
    };

    const handleAddressInputChange = (text: string) => {
        setAddressQuery(text);
        searchPlaces(text);
    };

    const handleSelectAddress = (suggestion: PlaceSuggestion) => {
        getPlaceDetails(suggestion.placeId);
    };

    const renderLocationTypeSelector = () => (
        <View style={styles.locationTypeSelector}>
            <Text style={styles.formLabel}>Type de lieu</Text>
            <View style={styles.locationTypeList}>
                {locationTypes.map((option) => (
                    <TouchableOpacity
                        key={option.type}
                        style={[
                            styles.locationTypeButton,
                            newFavorite.locationType === option.type && styles.selectedLocationTypeButton
                        ]}
                        onPress={() => setNewFavorite({ ...newFavorite, locationType: option.type })}
                    >
                        <MaterialIcons
                            name={option.iconName}
                            size={24}
                            color={newFavorite.locationType === option.type ? "#fff" : "#333"}
                        />
                        <Text style={{
                            color: newFavorite.locationType === option.type ? "#fff" : "#333",
                            fontWeight: "500",
                            fontSize: 11,
                            marginTop: 4
                        }}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderFavoriteItem = (item: FavoriteLocation, index: number) => {
        const iconName = getLocationTypeIcon(item.locationType);

        return (
            <View key={item.id} style={[styles.favoriteItem, index === locations.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.favoriteIcon}>
                    <MaterialIcons
                        name={iconName}
                        size={28}
                        color="#2196F3"
                    />
                </View>
                <View style={styles.favoriteInfo}>
                    <Text style={styles.favoriteName}>{item.name}</Text>
                    <Text style={styles.favoriteAddress} numberOfLines={1}>
                        {item.formattedAddress}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteFavorite(item.id, item.name)}
                    disabled={isDeleting}
                >
                    <MaterialIcons name="delete" size={24} color="#e74c3c" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Lieux favoris</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalVisible(true)}
                >
                    <MaterialIcons name="add" size={24} color="#2196F3" />
                    <Text style={styles.addButtonText}>Ajouter</Text>
                </TouchableOpacity>
            </View>

            {isLoadingFavorites ? (
                <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
            ) : locations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="star-border" size={48} color="#aaa" />
                    <Text style={styles.emptyText}>
                        Vous n'avez pas encore de lieux favoris
                    </Text>
                    <Text style={styles.emptySubtext}>
                        Ajoutez des lieux pour y accéder rapidement
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                >
                    {locations.map((item, index) => renderFavoriteItem(item, index))}
                </ScrollView>
            )}

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Ajouter un lieu favori</Text>
                                <TouchableOpacity onPress={() => {
                                    setModalVisible(false);
                                    resetForm();
                                }}>
                                    <MaterialIcons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView contentContainerStyle={styles.modalScrollContent}>
                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Nom</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ex: Maison, Bureau..."
                                        value={newFavorite.name}
                                        onChangeText={(text) => setNewFavorite({ ...newFavorite, name: text })}
                                    />
                                    {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Adresse</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Rechercher une adresse..."
                                        value={addressQuery}
                                        onChangeText={handleAddressInputChange}
                                    />
                                    {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}

                                    {showSuggestions && addressSuggestions.length > 0 && (
                                        <View style={styles.suggestionsContainer}>
                                            {addressSuggestions.map((suggestion, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={styles.suggestionItem}
                                                    onPress={() => handleSelectAddress(suggestion)}
                                                >
                                                    <MaterialIcons name="place" size={16} color="#666" />
                                                    <Text style={styles.suggestionText} numberOfLines={1}>
                                                        {suggestion.description}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {renderLocationTypeSelector()}

                                {createError && <Text style={styles.errorText}>{createError}</Text>}

                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={handleCreateFavorite}
                                    disabled={isCreating}
                                >
                                    {isCreating ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Enregistrer</Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        elevation: 3,
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e1e1e",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    addButtonText: {
        color: "#2196F3",
        fontWeight: "600",
        fontSize: 16,
    },
    loader: {
        marginVertical: 24,
    },
    emptyContainer: {
        alignItems: "center",
        padding: 24,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#555",
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#888",
        marginTop: 8,
        textAlign: "center",
    },
    list: {
        maxHeight: 320,
    },
    listContent: {
        paddingVertical: 4,
    },
    favoriteItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    favoriteIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#e3f2fd",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    favoriteInfo: {
        flex: 1,
    },
    favoriteName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    favoriteAddress: {
        fontSize: 14,
        color: "#666",
        marginTop: 2,
    },
    deleteButton: {
        padding: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        width: "90%",
        borderRadius: 16,
        maxHeight: "80%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalScrollContent: {
        padding: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#333",
    },
    formGroup: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#444",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#ddd",
        color: "#333",
    },
    errorText: {
        color: "#e74c3c",
        fontSize: 14,
        marginTop: 4,
    },
    locationTypeSelector: {
        marginBottom: 16,
    },
    locationTypeList: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
    },
    locationTypeButton: {
        width: 90,
        height: 80,
        borderRadius: 12,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 10,
    },
    selectedLocationTypeButton: {
        backgroundColor: "#2196F3",
        borderColor: "#1976D2",
    },
    submitButton: {
        backgroundColor: "#2196F3",
        borderRadius: 8,
        padding: 16,
        alignItems: "center",
        marginTop: 16,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    suggestionsContainer: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        marginTop: 4,
        maxHeight: 160,
    },
    suggestionItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    suggestionText: {
        fontSize: 14,
        color: "#333",
        marginLeft: 8,
        flex: 1,
    },
});

export default FavoriteLocationsManager;