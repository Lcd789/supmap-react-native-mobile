import React from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TransportMode, Waypoint } from "../../types";
import { TransportModeSelector } from "./TransportModeSelector";

interface SearchBarProps {
    origin: string;
    destination: string;
    waypoints: Waypoint[];
    selectedMode: TransportMode;
    isLoading: boolean;
    onOriginChange: (text: string) => void;
    onDestinationChange: (text: string) => void;
    onWaypointAdd: () => void;
    onWaypointRemove: (index: number) => void;
    onWaypointUpdate: (index: number, text: string) => void;
    onModeSelect: (mode: TransportMode) => void;
    onSearch: () => void;
    onReverse: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    origin,
    destination,
    waypoints,
    selectedMode,
    isLoading,
    onOriginChange,
    onDestinationChange,
    onWaypointAdd,
    onWaypointRemove,
    onWaypointUpdate,
    onModeSelect,
    onSearch,
    onReverse,
}) => {
    const isReverseButtonVisible = waypoints.length === 0;

    return (
        <View style={styles.searchContainer}>
            <TextInput
                style={styles.input}
                placeholder="Point de départ"
                value={origin}
                onChangeText={onOriginChange}
            />

            {/* Liste des étapes avec FlatList */}
            <FlatList
                data={waypoints}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <View style={styles.waypointContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={`Étape ${index + 1}`}
                            value={item.address}
                            onChangeText={(text) =>
                                onWaypointUpdate(index, text)
                            }
                        />
                        <TouchableOpacity
                            style={styles.deleteWaypointIcon}
                            onPress={() => onWaypointRemove(index)}
                        >
                            <MaterialIcons
                                name="close"
                                size={24}
                                color="#ff4444"
                            />
                        </TouchableOpacity>
                    </View>
                )}
                style={styles.waypointList}
                keyboardShouldPersistTaps="handled"
            />
            {/* Conteneur des boutons Reverse & Ajouter une étape */}
            <View
                style={[
                    styles.buttonContainer,
                    isReverseButtonVisible
                        ? { justifyContent: "space-between" }
                        : { justifyContent: "center" },
                ]}
            >
                {isReverseButtonVisible && (
                    <TouchableOpacity
                        style={styles.reverseButton}
                        onPress={onReverse}
                    >
                        <MaterialIcons
                            name="swap-vert"
                            size={24}
                            color="blue"
                        />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[
                        styles.addWaypointButton,
                        waypoints.length >= 5 && { opacity: 0.5 },
                    ]}
                    onPress={onWaypointAdd}
                    disabled={waypoints.length >= 5}
                >
                    <MaterialIcons name="add" size={24} color="#2196F3" />
                    <Text style={styles.addWaypointText}>
                        Ajouter une étape ({waypoints.length}/5)
                    </Text>
                </TouchableOpacity>
            </View>

            <TextInput
                style={styles.input}
                placeholder="Destination"
                value={destination}
                onChangeText={onDestinationChange}
            />

            {/* Sélecteur de mode de transport */}
            <TransportModeSelector
                selectedMode={selectedMode}
                onModeSelect={onModeSelect}
            />

            {/* Bouton de recherche */}
            <TouchableOpacity
                style={styles.searchButton}
                onPress={onSearch}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.searchButtonText}>Rechercher</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    searchContainer: {
        position: "absolute",
        top: 40,
        left: 10,
        right: 10,
        backgroundColor: "white",
        borderRadius: 8,
        padding: 10,
        zIndex: 1,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        //maxHeight: '40%',
        flexDirection: "column",
        //alignItems: 'center'
    },
    inputsContainer: {
        maxHeight: 300,
        width: "100%",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 4,
        padding: 8,
        marginVertical: 5,
        backgroundColor: "white",
        flex: 1,
    },
    waypointContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    deleteWaypointIcon: {
        marginLeft: 8,
    },
    addWaypointButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 8,
    },
    addWaypointText: {
        color: "#2196F3",
        marginLeft: 8,
    },
    searchButton: {
        backgroundColor: "#2196F3",
        padding: 12,
        borderRadius: 4,
        alignItems: "center",
    },
    searchButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    reverseButton: {
        padding: 8,
        borderRadius: 5,
        backgroundColor: "transparent",
    },
    waypointList: {
        flexGrow: 1,
        width: "100%",
    },
    buttonContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 5,
    },
});
