import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import { TransportMode } from '../../types';

interface TransportModeSelectorProps {
    selectedMode: TransportMode;
    onModeSelect: (mode: TransportMode) => void;
}

export const TransportModeSelector: React.FC<TransportModeSelectorProps> = ({
    selectedMode,
    onModeSelect
}) => {
    return (
        <View style={styles.transportMode}>
            {[
                { mode: 'driving', icon: 'directions-car' },
                { mode: 'walking', icon: 'directions-walk' },
                { mode: 'bicycling', icon: 'directions-bike' },
                { mode: 'transit', icon: 'directions-transit' }
            ].map(({ mode, icon }) => (
                <TouchableOpacity
                    key={mode}
                    style={[styles.modeButton, selectedMode === mode && styles.selectedMode]}
                    onPress={() => onModeSelect(mode as TransportMode)}
                >
                    <MaterialIcons
                        name={icon as "directions-car" | "directions-walk" | "directions-bike" | "directions-transit"}
                        size={24}
                        color={selectedMode === mode ? 'white' : 'black'}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    transportMode: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 10,
    },
    modeButton: {
        padding: 8,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
    },
    selectedMode: {
        backgroundColor: '#2196F3',
    },
});