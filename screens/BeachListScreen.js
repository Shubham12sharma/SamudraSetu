// BeachList.js
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
} from 'react-native';

// Sample data - Indian beaches
const BEACHES_DATA = [
    {
        id: 1,
        name: 'Goa Beach',
        state: 'Goa',
        image: '🏖️',
        description: 'Popular tourist destination with water sports',
        rating: 4.5,
        reviews: 2345,
        distance: '450 km from Bangalore',
        bestTime: 'October to March',
        facilities: ['Restrooms', 'Food Stalls', 'Parking', 'Lifeguards'],
        activities: ['Swimming', 'Surfing', 'Parasailing', 'Beach Volleyball'],
        sustainability: {
            waterQuality: 'Good',
            weatherCondition: 'Sunny, 28°C',
            pollutionLevel: 'Moderate',
            plasticWaste: 'Being Managed',
            coralStatus: 'Protected',
        },
        nearbyUtilities: {
            hotels: [
                { name: 'Taj Holiday Village', distance: '2 km', rating: 4.7 },
                { name: 'Goa Marriott Resort', distance: '3.5 km', rating: 4.6 },
                { name: 'Leela Goa', distance: '4 km', rating: 4.8 },
            ],
            railways: [
                { station: 'Madgaon Railway Station', distance: '45 km' },
                { station: 'Vasco Da Gama Station', distance: '35 km' },
            ],
            airports: [
                { airport: 'Dabolim Airport', distance: '35 km', code: 'GOI' },
            ],
            transport: [
                { type: 'Taxi/Uber', availability: 'Available 24/7' },
                { type: 'Local Buses', availability: 'Frequent' },
                { type: 'Auto-rickshaw', availability: 'Available' },
                { type: 'Bike Rental', availability: 'Available' },
            ],
            hospitals: [
                { name: 'Manipal Hospital', distance: '3 km' },
                { name: 'Apollo Hospitals', distance: '5 km' },
            ],
            restaurants: [
                { name: 'Fiesta Restaurant', cuisine: 'Multi-cuisine', rating: 4.4 },
                { name: 'Beach Shack', cuisine: 'Seafood', rating: 4.3 },
            ],
        },
    },
    {
        id: 2,
        name: 'Mararikulam Beach',
        state: 'Kerala',
        image: '🏝️',
        description: 'Serene backwater beach with houseboat rides',
        rating: 4.7,
        reviews: 1890,
        distance: '60 km from Kochi',
        bestTime: 'May to September',
        facilities: ['Restrooms', 'Cafes', 'Boat Services', 'Hotels'],
        activities: ['Boating', 'Fishing', 'Cycling', 'Photography'],
        sustainability: {
            waterQuality: 'Excellent',
            weatherCondition: 'Humid, 26°C',
            pollutionLevel: 'Low',
            plasticWaste: 'Minimal',
            coralStatus: 'Pristine',
        },
        nearbyUtilities: {
            hotels: [
                { name: 'Marari Beach Resort', distance: '0.5 km', rating: 4.8 },
                { name: 'Coconut Lagoon', distance: '2 km', rating: 4.7 },
                { name: 'Kumarakom Lake Resort', distance: '4 km', rating: 4.6 },
            ],
            railways: [
                { station: 'Ernakulathapan Station', distance: '55 km' },
                { station: 'Alleppey Station', distance: '35 km' },
            ],
            airports: [
                { airport: 'Kochi International Airport', distance: '65 km', code: 'COK' },
            ],
            transport: [
                { type: 'Houseboat Tours', availability: 'Daily' },
                { type: 'Taxi Service', availability: 'Available 24/7' },
                { type: 'Local Buses', availability: 'Frequent' },
                { type: 'Bicycle Rental', availability: 'Available' },
            ],
            hospitals: [
                { name: 'Marari Medical Center', distance: '1 km' },
                { name: 'VPS Lakeshore Hospital', distance: '5 km' },
            ],
            restaurants: [
                { name: 'Marari Kitchen', cuisine: 'Kerala', rating: 4.5 },
                { name: 'Lagoon Restaurant', cuisine: 'Seafood', rating: 4.6 },
            ],
        },
    },
    {
        id: 3,
        name: 'Marina Beach',
        state: 'Tamil Nadu',
        image: '🌊',
        description: 'Longest beach in India with vibrant atmosphere',
        rating: 4.2,
        reviews: 3120,
        distance: '5 km from Chennai City',
        bestTime: 'November to February',
        facilities: ['Restrooms', 'Food Courts', 'Parking', 'Medical Aid'],
        activities: ['Walking', 'Photography', 'Water Sports', 'Shopping'],
        sustainability: {
            waterQuality: 'Fair',
            weatherCondition: 'Warm, 30°C',
            pollutionLevel: 'Moderate to High',
            plasticWaste: 'Regular Cleanup',
            coralStatus: 'Recovering',
        },
        nearbyUtilities: {
            hotels: [
                { name: 'Chennai Marriott Hotel', distance: '1.5 km', rating: 4.5 },
                { name: 'ITC Grand Chola', distance: '2 km', rating: 4.7 },
                { name: 'Park Sheraton', distance: '1 km', rating: 4.4 },
            ],
            railways: [
                { station: 'Central Station', distance: '3 km' },
                { station: 'Beach Station', distance: '0.5 km' },
            ],
            airports: [
                { airport: 'Chennai International Airport', distance: '15 km', code: 'MAA' },
            ],
            transport: [
                { type: 'Metro', availability: 'Nearby' },
                { type: 'Buses', availability: 'Frequent' },
                { type: 'Taxi/Uber', availability: '24/7' },
                { type: 'Auto-rickshaw', availability: 'Available' },
            ],
            hospitals: [
                { name: 'Apollo Hospitals', distance: '2 km' },
                { name: 'Fortis Malar Hospital', distance: '1.5 km' },
            ],
            restaurants: [
                { name: 'Marina Cafe', cuisine: 'Continental', rating: 4.2 },
                { name: 'Sea Shell Restaurant', cuisine: 'Seafood', rating: 4.3 },
            ],
        },
    },
    {
        id: 4,
        name: 'Radhanagar Beach',
        state: 'Andaman',
        image: '⛱️',
        description: 'Pristine white sand beach with crystal clear waters',
        rating: 4.9,
        reviews: 2567,
        distance: '45 km from Port Blair',
        bestTime: 'October to May',
        facilities: ['Restrooms', 'Water Sports', 'Restaurants', 'Resorts'],
        activities: ['Swimming', 'Snorkeling', 'Diving', 'Sunset Watching'],
        sustainability: {
            waterQuality: 'Pristine',
            weatherCondition: 'Tropical, 28°C',
            pollutionLevel: 'Very Low',
            plasticWaste: 'Strict Control',
            coralStatus: 'Protected & Thriving',
        },
        nearbyUtilities: {
            hotels: [
                { name: 'Havelock Island Resort', distance: '1 km', rating: 4.9 },
                { name: 'Wild Orchid', distance: '2 km', rating: 4.8 },
                { name: 'Taj Exotica', distance: '3 km', rating: 4.9 },
            ],
            railways: [
                { station: 'Port Blair Dock', distance: '50 km', note: 'Ferry service' },
            ],
            airports: [
                { airport: 'Port Blair Airport', distance: '40 km', code: 'IXZ' },
            ],
            transport: [
                { type: 'Ferry Boats', availability: 'Regular' },
                { type: 'Taxi Service', availability: 'Available' },
                { type: 'Boat Rentals', availability: 'Available' },
                { type: 'Scooter Rental', availability: 'Available' },
            ],
            hospitals: [
                { name: 'Havelock Primary Health Center', distance: '2 km' },
                { name: 'Port Blair Hospital', distance: '45 km' },
            ],
            restaurants: [
                { name: 'Ananya Restaurant', cuisine: 'Multi-cuisine', rating: 4.7 },
                { name: 'Full Moon Cafe', cuisine: 'Seafood', rating: 4.6 },
            ],
        },
    },
    {
        id: 5,
        name: 'Ashvem Beach',
        state: 'Goa',
        image: '🏖️',
        description: 'Quiet northern beach perfect for relaxation',
        rating: 4.4,
        reviews: 1234,
        distance: '75 km from Panaji',
        bestTime: 'October to March',
        facilities: ['Restrooms', 'Beach Shacks', 'Yoga Studios', 'Parking'],
        activities: ['Yoga', 'Meditation', 'Sunbathing', 'Horseback Riding'],
        sustainability: {
            waterQuality: 'Good',
            weatherCondition: 'Pleasant, 27°C',
            pollutionLevel: 'Low',
            plasticWaste: 'Managed',
            coralStatus: 'Protected',
        },
        nearbyUtilities: {
            hotels: [
                { name: 'Ashvem Beach Resort', distance: '0.2 km', rating: 4.6 },
                { name: 'Yoga Retreat Center', distance: '1 km', rating: 4.5 },
                { name: 'Beach Paradise Hotel', distance: '2 km', rating: 4.3 },
            ],
            railways: [
                { station: 'Pernem Railway Station', distance: '25 km' },
                { station: 'Madgaon Station', distance: '90 km' },
            ],
            airports: [
                { airport: 'Dabolim Airport', distance: '75 km', code: 'GOI' },
            ],
            transport: [
                { type: 'Taxi/Uber', availability: 'Available' },
                { type: 'Local Buses', availability: 'Frequent' },
                { type: 'Motorcycle Rental', availability: 'Available' },
                { type: 'Horse Rides', availability: 'Available' },
            ],
            hospitals: [
                { name: 'Ashvem Health Center', distance: '1.5 km' },
                { name: 'Mapusa Hospital', distance: '20 km' },
            ],
            restaurants: [
                { name: 'Yoga Cafe', cuisine: 'Health Food', rating: 4.4 },
                { name: 'Ashvem Kitchen', cuisine: 'International', rating: 4.3 },
            ],
        },
    },
    {
        id: 6,
        name: 'Varkala Beach',
        state: 'Kerala',
        image: '🏝️',
        description: 'Scenic cliffside beach with ayurvedic treatments',
        rating: 4.6,
        reviews: 2001,
        distance: '50 km from Thiruvananthapuram',
        bestTime: 'October to May',
        facilities: ['Restrooms', 'Ayurveda Centers', 'Cafes', 'Hotels'],
        activities: ['Paragliding', 'Rock Climbing', 'Swimming', 'Wellness'],
        sustainability: {
            waterQuality: 'Excellent',
            weatherCondition: 'Tropical, 26°C',
            pollutionLevel: 'Low',
            plasticWaste: 'Minimal',
            coralStatus: 'Protected',
        },
        nearbyUtilities: {
            hotels: [
                { name: 'Varkala Beach Resort', distance: '0.5 km', rating: 4.7 },
                { name: 'Clafouti Ayurveda Resort', distance: '1 km', rating: 4.6 },
                { name: 'Hilltop Beach Hotel', distance: '2 km', rating: 4.5 },
            ],
            railways: [
                { station: 'Varkala Sivagiri Station', distance: '3 km' },
                { station: 'Thiruvananthapuram Central', distance: '50 km' },
            ],
            airports: [
                { airport: 'Thiruvananthapuram International', distance: '55 km', code: 'TRV' },
            ],
            transport: [
                { type: 'Local Buses', availability: 'Frequent' },
                { type: 'Taxi Service', availability: '24/7' },
                { type: 'Bike Rental', availability: 'Available' },
                { type: 'Paragliding Service', availability: 'Available' },
            ],
            hospitals: [
                { name: 'Varkala Ayurveda Hospital', distance: '1 km' },
                { name: 'Government Medical College', distance: '50 km' },
            ],
            restaurants: [
                { name: 'Cliff Restaurant', cuisine: 'Kerala', rating: 4.5 },
                { name: 'Ayurvedic Kitchen', cuisine: 'Health Food', rating: 4.6 },
            ],
        },
    },
];

export default function BeachListScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBeaches = useMemo(() => {
        return BEACHES_DATA.filter(beach =>
            beach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            beach.state.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const renderBeachItem = ({ item }) => (
        <TouchableOpacity
            style={styles.beachCard}
            onPress={() => navigation.navigate('BeachDetails', { beach: item })}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardImage}>{item.image}</Text>
                <View style={styles.cardContent}>
                    <Text style={styles.beachName}>{item.name}</Text>
                    <Text style={styles.beachState}>{item.state}</Text>
                    <Text style={styles.cardDistance}>{item.distance}</Text>
                </View>
                <View style={styles.ratingBox}>
                    <Text style={styles.rating}>⭐ {item.rating}</Text>
                    <Text style={styles.reviews}>({item.reviews})</Text>
                </View>
            </View>
            <Text style={styles.beachDescription}>{item.description}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🏝️ Beaches List</Text>
                <Text style={styles.subtitle}>Explore beaches by state or activity.</Text>
            </View>

            <TextInput
                style={styles.searchBar}
                placeholder="Search beaches or state..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
            />

            <Text style={styles.resultCount}>
                {filteredBeaches.length} beaches found
            </Text>

            <FlatList
                data={filteredBeaches}
                renderItem={renderBeachItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                scrollEnabled={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: 40,
    },
    header: {
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c5aa0',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    searchBar: {
        marginHorizontal: 15,
        marginBottom: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 14,
    },
    resultCount: {
        marginHorizontal: 15,
        fontSize: 12,
        color: '#999',
        marginBottom: 10,
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    beachCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    cardImage: {
        fontSize: 40,
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    beachName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c5aa0',
    },
    beachState: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    cardDistance: {
        fontSize: 11,
        color: '#999',
        marginTop: 3,
    },
    ratingBox: {
        alignItems: 'flex-end',
    },
    rating: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ff9800',
    },
    reviews: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    beachDescription: {
        fontSize: 13,
        color: '#555',
        lineHeight: 19,
    },
});