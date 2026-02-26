import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Install if not present

export default function BeachDetailsScreen({ route, navigation }) {
    const { beach } = route.params;

    // Sample coordinates (replace with real data from backend/API)
    const beachLat = 15.2993; // Example for Goa Beach
    const beachLng = 73.9145;
    const currentLocation = 'Current Location'; // Or use Geolocation for user's position

    // Function to open map to beach
    const openMapToBeach = () => {
        const mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation}&destination=${encodeURIComponent(beach.name + ', ' + beach.state)}&travelmode=driving`;
        Linking.openURL(mapUrl).catch((err) => console.error('Error opening map:', err));
    };

    // Function to handle booking for transport
    const handleBookTransport = (type, beachName) => {
        let bookingUrl;
        switch (type.toLowerCase()) {
            case 'taxi/uber':
            case 'taxi/cab':
                bookingUrl = `uber://?action=setPickup&pickup[formatted_address]=${currentLocation}&dropoff[formatted_address]=${encodeURIComponent(beachName)}`;
                Linking.openURL(bookingUrl).catch(() => {
                    Linking.openURL(`https://m.uber.com/search?pickup=${currentLocation}&dropoff=${encodeURIComponent(beachName)}`);
                });
                break;
            case 'local buses':
            case 'buses':
                bookingUrl = `https://www.redbus.in/search?fromCity=${currentLocation}&toCity=${encodeURIComponent(beachName)}&onward=2025-10-28`;
                Linking.openURL(bookingUrl);
                break;
            case 'train':
            case 'railway':
            case 'ferry boats':
                bookingUrl = `https://www.irctc.co.in/nget/train-search?from=${currentLocation}&to=${encodeURIComponent(beachName)}`;
                Linking.openURL(bookingUrl);
                break;
            case 'auto-rickshaw':
            case 'bike rental':
            case 'scooter rental':
            case 'boat rentals':
            case 'houseboat tours':
            case 'motorcycle rental':
                bookingUrl = `https://www.google.com/search?q=book+${type}+to+${encodeURIComponent(beachName)}`;
                Linking.openURL(bookingUrl);
                break;
            default:
                bookingUrl = `https://www.google.com/search?q=book+${type}+to+${encodeURIComponent(beachName)}`;
                Linking.openURL(bookingUrl);
        }
    };

    const renderUtilityCard = (title, items, icon) => (
        <View style={styles.utilitySection}>
            <Text style={styles.utilitySectionTitle}>{icon} {title}</Text>
            {items && items.map((item, index) => {
                const primaryName = item.name || item.station || item.airport || item.type || item.note || 'N/A';
                return (
                    <View key={index} style={styles.utilityItem}>
                        <View style={styles.utilityRow}>
                            <Text style={styles.utilityName}>{primaryName}</Text>
                            {item.distance && <Text style={styles.utilityDetail}>📍 {item.distance}</Text>}
                            {item.rating && <Text style={styles.utilityDetail}>⭐ {item.rating}</Text>}
                            {item.cuisine && <Text style={styles.utilityDetail}>🍽️ {item.cuisine}</Text>}
                            {item.code && <Text style={styles.utilityDetail}>Code: {item.code}</Text>}
                            {item.availability && <Text style={styles.utilityDetail}>✓ {item.availability}</Text>}
                            {item.note && <Text style={styles.utilityDetail}>📝 {item.note}</Text>}
                        </View>
                        {['transport', 'railways', 'airports'].includes(title.toLowerCase()) && (
                            <TouchableOpacity
                                style={styles.bookButton}
                                onPress={() => handleBookTransport(primaryName, beach.name)}
                            >
                                <Text style={styles.bookButtonText}>Book Now</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                );
            })}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.detailsTitle}>{beach.name}</Text>
                    <Text style={styles.detailsState}>📍 {beach.state}</Text>
                    <TouchableOpacity style={styles.mapButton} onPress={openMapToBeach}>
                        <Text style={styles.mapButtonText}>🗺️ View on Map</Text>
                    </TouchableOpacity>
                </View>

                {/* Beach Image & Rating */}
                <View style={styles.heroSection}>
                    <Text style={styles.beachEmoji}>{beach.image}</Text>
                    <View style={styles.ratingSection}>
                        <Text style={styles.largeRating}>{beach.rating}★</Text>
                        <Text style={styles.reviewCount}>{beach.reviews} Reviews</Text>
                    </View>
                </View>

                {/* Description */}
                <View style={styles.descriptionCard}>
                    <Text style={styles.descriptionText}>{beach.description}</Text>
                    <Text style={styles.bestTimeText}>🕐 Best Time: {beach.bestTime}</Text>
                </View>

                {/* Nearby Hotels */}
                <View style={styles.card}>
                    {renderUtilityCard('Nearby Hotels', beach.nearbyUtilities.hotels, '🏨')}
                </View>

                {/* Railway Stations */}
                <View style={styles.card}>
                    {renderUtilityCard('Railway Stations', beach.nearbyUtilities.railways, '🚂')}
                </View>

                {/* Airports */}
                <View style={styles.card}>
                    {renderUtilityCard('Airports', beach.nearbyUtilities.airports, '✈️')}
                </View>

                {/* Transportation */}
                <View style={styles.card}>
                    {renderUtilityCard('Transportation Options', beach.nearbyUtilities.transport, '🚕')}
                </View>

                {/* Hospitals & Medical */}
                <View style={styles.card}>
                    {renderUtilityCard('Hospitals & Medical Centers', beach.nearbyUtilities.hospitals, '🏥')}
                </View>

                {/* Restaurants */}
                <View style={styles.card}>
                    {renderUtilityCard('Restaurants & Cafes', beach.nearbyUtilities.restaurants, '🍽️')}
                </View>

                {/* Facilities */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>🏗️ Facilities</Text>
                    <View style={styles.facilitiesGrid}>
                        {beach.facilities && beach.facilities.map((facility, index) => (
                            <View key={index} style={styles.facilityTag}>
                                <Text style={styles.facilityText}>{facility}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Activities */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>🎯 Activities</Text>
                    <View style={styles.activitiesGrid}>
                        {beach.activities && beach.activities.map((activity, index) => (
                            <View key={index} style={styles.activityTag}>
                                <Text style={styles.activityText}>{activity}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Sustainability & Conditions */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>🌱 Sustainability & Live Conditions</Text>
                    <View style={styles.conditionItem}>
                        <View style={styles.conditionHeader}>
                            <Text style={styles.conditionIcon}>💧</Text>
                            <Text style={styles.conditionLabel}>Water Quality</Text>
                        </View>
                        <View style={styles.statusBadge}>
                            <Text style={[
                                styles.statusText,
                                { color: beach.sustainability.waterQuality === 'Pristine' ? '#4caf50' : beach.sustainability.waterQuality === 'Excellent' ? '#66bb6a' : beach.sustainability.waterQuality === 'Good' ? '#81c784' : '#f57c00' }
                            ]}>
                                {beach.sustainability.waterQuality}
                            </Text>
                        </View>
                    </View>
                    {/* Add other conditions similarly */}
                </View>

                {/* Rating & Review Section */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>📊 Overall Rating</Text>
                    <View style={styles.ratingCard}>
                        <Text style={styles.ratingNumber}>{beach.rating}</Text>
                        <View style={styles.starsContainer}>
                            {[...Array(5)].map((_, i) => (
                                <Text key={i} style={styles.star}>
                                    {i < Math.floor(beach.rating) ? '⭐' : '☆'}
                                </Text>
                            ))}
                        </View>
                        <Text style={styles.totalReviews}>Based on {beach.reviews} user reviews</Text>
                    </View>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1, // Ensure ScrollView takes full height
    },
    contentContainer: {
        paddingBottom: 20, // Extra padding at bottom for scrolling
    },
    header: {
        backgroundColor: '#2c5aa0',
        paddingTop: 10,
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    backButton: {
        marginBottom: 10,
    },
    backButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    detailsTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    detailsState: {
        fontSize: 14,
        color: '#e0e0e0',
    },
    mapButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignSelf: 'center',
        marginTop: 10,
    },
    mapButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    heroSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: 15,
        marginBottom: 10,
        borderRadius: 15,
        padding: 20,
        elevation: 2,
    },
    beachEmoji: {
        fontSize: 80,
    },
    ratingSection: {
        alignItems: 'center',
    },
    largeRating: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ff9800',
        marginBottom: 5,
    },
    reviewCount: {
        fontSize: 12,
        color: '#666',
    },
    descriptionCard: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 10,
        padding: 15,
        borderRadius: 12,
        elevation: 2,
    },
    descriptionText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 21,
        marginBottom: 10,
    },
    bestTimeText: {
        fontSize: 13,
        color: '#2c5aa0',
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 10,
        borderRadius: 12,
        padding: 15,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2c5aa0',
        marginBottom: 12,
    },
    utilitySection: {
        marginBottom: 15,
    },
    utilitySectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2c5aa0',
        marginBottom: 10,
    },
    utilityItem: {
        backgroundColor: '#f9f9f9',
        borderLeftWidth: 4,
        borderLeftColor: '#2c5aa0',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderRadius: 8,
    },
    utilityRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    utilityName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    utilityDetail: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    bookButton: {
        backgroundColor: '#0288D1',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 5,
    },
    bookButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    facilitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    facilityTag: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2c5aa0',
    },
    facilityText: {
        fontSize: 13,
        color: '#2c5aa0',
        fontWeight: '500',
    },
    activitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    activityTag: {
        backgroundColor: '#fff3e0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ff9800',
    },
    activityText: {
        fontSize: 13,
        color: '#ff9800',
        fontWeight: '500',
    },
    conditionItem: {
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    conditionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    conditionIcon: {
        fontSize: 22,
        marginRight: 10,
    },
    conditionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    statusBadge: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    ratingCard: {
        backgroundColor: '#fff9e6',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ffd54f',
    },
    ratingNumber: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ff9800',
        marginBottom: 10,
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    star: {
        fontSize: 24,
        marginHorizontal: 2,
    },
    totalReviews: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
});