import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
<<<<<<< Updated upstream
import { Swipeable } from "react-native-gesture-handler";
import { TransportMode, Waypoint } from '../../types';
import { TransportModeSelector } from './TransportModeSelector';
=======
<<<<<<< Updated upstream
import { TransportMode, Waypoint } from "../../types";
import { TransportModeSelector } from "./TransportModeSelector";
=======
import { Swipeable } from "react-native-gesture-handler";
import { TransportMode, Waypoint } from '../../types';
import { TransportModeSelector } from './TransportModeSelector';
import { searchBarStyles } from "../../styles/globalStyles";
>>>>>>> Stashed changes
>>>>>>> Stashed changes

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
    return (
<<<<<<< Updated upstream
        <View style={styles.searchContainer}>
            <ScrollView style={styles.inputsContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Point de départ"
                    value={origin}
                    onChangeText={onOriginChange}
                />

<<<<<<< Updated upstream
=======
            {/* Liste des étapes avec FlatList */}
            <FlatList
                data={waypoints}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <View style={styles.waypointContainer}>
=======
        <View style={searchBarStyles.searchContainer}>
            <ScrollView style={searchBarStyles.inputsContainer}>
                <TextInput
                    style={searchBarStyles.input}
                    placeholder="Point de départ"
                    value={origin}
                    onChangeText={onOriginChange}
                />

>>>>>>> Stashed changes
                {waypoints.map((waypoint, index) => (
                    <Swipeable
                        key={index}
                        renderRightActions={() => (
                            <TouchableOpacity
<<<<<<< Updated upstream
                                style={styles.deleteWaypoint}
=======
                                style={searchBarStyles.deleteWaypoint}
>>>>>>> Stashed changes
                                onPress={() => onWaypointRemove(index)}
                            >
                                <MaterialIcons name="delete" size={24} color="white" />
                            </TouchableOpacity>
                        )}
                    >
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
>>>>>>> Stashed changes
                        <TextInput
                            style={searchBarStyles.input}
                            placeholder={`Étape ${index + 1}`}
                            value={waypoint.address}
                            onChangeText={(text) => onWaypointUpdate(index, text)}
                        />
<<<<<<< Updated upstream
                    </Swipeable>
                ))}

                <TouchableOpacity style={styles.reverseButton} onPress={onReverse}>
                    <MaterialIcons name="swap-vert" size={24} color="blue" />
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    placeholder="Destination"
                    value={destination}
                    onChangeText={onDestinationChange}
                />

                <TouchableOpacity
                    style={styles.addWaypointButton}
=======
<<<<<<< Updated upstream
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
=======
                    </Swipeable>
                ))}

                <TouchableOpacity style={searchBarStyles.reverseButton} onPress={onReverse}>
                    <MaterialIcons name="swap-vert" size={24} color="blue" />
                </TouchableOpacity>

                <TextInput
                    style={searchBarStyles.input}
                    placeholder="Destination"
                    value={destination}
                    onChangeText={onDestinationChange}
                />

                <TouchableOpacity
                    style={searchBarStyles.addWaypointButton}
>>>>>>> Stashed changes
>>>>>>> Stashed changes
                    onPress={onWaypointAdd}
                >
                    <MaterialIcons name="add" size={24} color="#2196F3" />
<<<<<<< Updated upstream
                    <Text style={styles.addWaypointText}>Ajouter une étape</Text>
=======
<<<<<<< Updated upstream
                    <Text style={styles.addWaypointText}>
                        Ajouter une étape ({waypoints.length}/5)
                    </Text>
=======
                    <Text style={searchBarStyles.addWaypointText}>Ajouter une étape</Text>
>>>>>>> Stashed changes
>>>>>>> Stashed changes
                </TouchableOpacity>
            </ScrollView>

            <TransportModeSelector
                selectedMode={selectedMode}
                onModeSelect={onModeSelect}
            />

            <TouchableOpacity
                style={searchBarStyles.searchButton}
                onPress={onSearch}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={searchBarStyles.searchButtonText}>Rechercher</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};
<<<<<<< Updated upstream

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    searchContainer: {
        position: 'absolute',
        top: 40,
        left: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        zIndex: 1,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        //maxHeight: '40%',
        flexDirection: 'column',
        //alignItems: 'center'
    },
    inputsContainer: {
        maxHeight: 300,
        width: '100%',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 8,
        marginVertical: 5,
        backgroundColor: 'white',
    },
    addWaypointButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        marginVertical: 5,
    },
    addWaypointText: {
        color: '#2196F3',
        marginLeft: 8,
    },
    deleteWaypoint: {
        backgroundColor: '#ff4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: '100%',
    },
    searchButton: {
        backgroundColor: '#2196F3',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
    },
    searchButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    reverseButton: {
        padding: 8,
        borderRadius: 5,
        backgroundColor: 'transparent',
        
    },
<<<<<<< Updated upstream
});
=======
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
=======
>>>>>>> Stashed changes
>>>>>>> Stashed changes
