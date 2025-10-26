import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AssistantScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🤖 Beach Assistant</Text>
            <Text style={styles.description}>
                I'm here to help! Ask me about beach suitability, weather, or nearby facilities.
            </Text>
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
    description: {
        fontSize: 14,
        color: '#424242',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});