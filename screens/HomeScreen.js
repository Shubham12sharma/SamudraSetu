import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <Image
                source={{ uri: 'https://via.placeholder.com/150' }} // Replace with actual beach cleaning image URL
                style={styles.headerImage}
            />
            <Text style={styles.title}>🏖️ SamudraSetu</Text>
            <Text style={styles.subtitle}>Join the Beach Cleaning Community!</Text>
            <TouchableOpacity style={styles.joinButton} onPress={() => {/* Handle join action */ }}>
                <Text style={styles.buttonText}>Join Now</Text>
            </TouchableOpacity>
            <Text style={styles.description}>
                Help keep India's beaches clean and sustainable. Connect with others, share efforts, and make a difference!
            </Text>
            <TouchableOpacity style={styles.learnMore} onPress={() => {/* Handle learn more action */ }}>
                <Text style={styles.learnMoreText}>Learn More About Cleaning Events</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 20,
    },
    headerImage: {
        width: 150,
        height: 150,
        marginBottom: 20,
        borderRadius: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#0277BD',
        marginBottom: 20,
        textAlign: 'center',
    },
    joinButton: {
        backgroundColor: '#0288D1',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        marginBottom: 20,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    description: {
        fontSize: 14,
        color: '#424242',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    learnMore: {
        paddingVertical: 8,
        paddingHorizontal: 15,
    },
    learnMoreText: {
        color: '#0277BD',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});