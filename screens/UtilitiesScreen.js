import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function UtilitiesScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Utilities</Text>
            <Text>1. Nearby Facilities</Text>
            <Text>2. Travel Routes</Text>
            <Text>3. Emergency Contacts</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 20,
    },
});