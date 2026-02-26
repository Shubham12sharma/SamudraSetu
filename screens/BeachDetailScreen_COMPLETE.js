// This is a comprehensive BeachDetailScreen with ALL backend features integrated
// Replace the existing BeachDetailScreen.js with this file

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    beachesAPI,
    cvAPI,
    ecoAPI,
    getUserData,
    mlAPI,
    sentimentAPI,
    weatherAPI,
} from '../services/api';

export default function BeachDetailsScreen({ route, navigation }) {
    const { beach: initialBeach } = route.params;
    const beachId = initialBeach._id || initialBeach.id;

    const [beach, setBeach] = useState(initialBeach);
    const [loading, setLoading] = useState(true);
    const [weather, setWeather] = useState(null);
    const [suitability, setSuitability] = useState(null);
    const [vibe, setVibe] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [user, setUser] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [ecoImpact, setEcoImpact] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        loadAllData();
        loadUserLocation();
    }, [beachId]);

    const loadUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setUserLocation({
                    lat: location.coords.latitude,
                    lon: location.coords.longitude,
                });
            }
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const loadAllData = async () => {
        try {
            setLoading(true);
            const userData = await getUserData();
            setUser(userData);

            // Load beach details
            if (beachId) {
                const beachData = await beachesAPI.getById(beachId);
                setBeach(beachData);

                // Load weather
                if (beachData.latitude && beachData.longitude) {
                    try {
                        const weatherData = await weatherAPI.getWeather(
                            beachData.latitude,
                            beachData.longitude
                        );
                        setWeather(weatherData);
                    } catch (error) {
                        console.error('Weather error:', error);
                    }

                    // Load suitability scores
                    try {
                        const suitabilityData = await mlAPI.getSuitability(beachId);
                        setSuitability(suitabilityData.suitability_scores);
                    } catch (error) {
                        console.error('Suitability error:', error);
                    }

                    // Load sentiment/vibe
                    try {
                        const vibeData = await sentimentAPI.getBeachVibe(beachId);
                        setVibe(vibeData);
                    } catch (error) {
                        console.error('Vibe error:', error);
                    }

                    // Load reviews
                    try {
                        const reviewsData = await beachesAPI.getReviews(beachId);
                        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
                    } catch (error) {
                        console.error('Reviews error:', error);
                    }

                    // Calculate eco impact if user location available
                    if (userLocation) {
                        try {
                            const impactData = await ecoAPI.calculateImpact(
                                userLocation.lat,
                                userLocation.lon,
                                beachId,
                                'car',
                                1,
                                1,
                                1
                            );
                            setEcoImpact(impactData);
                        } catch (error) {
                            console.error('Eco impact error:', error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load beach details');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant camera roll permissions');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setUploadingImage(true);
                const userId = user?._id || user?.id || 'anonymous';
                await cvAPI.uploadImage(beachId, result.assets[0].uri, userId);
                Alert.alert('Success', 'Image uploaded! It will be processed for verification.');
                loadAllData(); // Reload to get updated condition
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewText.trim()) {
            Alert.alert('Error', 'Please enter a review');
            return;
        }

        try {
            const userId = user?._id || user?.id || 'anonymous';
            await sentimentAPI.analyzeReview(reviewText, beachId, userId, reviewRating);
            Alert.alert('Success', 'Review submitted!');
            setShowReviewModal(false);
            setReviewText('');
            setReviewRating(5);
            loadAllData();
        } catch (error) {
            console.error('Review error:', error);
            Alert.alert('Error', 'Failed to submit review');
        }
    };

    const getSuitabilityColor = (score) => {
        if (score >= 80) return '#4CAF50';
        if (score >= 60) return '#FF9800';
        return '#F44336';
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0288D1" />
                    <Text style={styles.loadingText}>Loading beach details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#01579B" />
                    </TouchableOpacity>
                    <View style={styles.headerTitle}>
                        <Text style={styles.title}>{beach.name}</Text>
                        <Text style={styles.subtitle}>
                            <Ionicons name="location" size={14} color="#666" /> {beach.state}
                        </Text>
                    </View>
                </View>

                {/* Hero Section with Suitability Score */}
                <View style={styles.heroSection}>
                    <View style={styles.heroImage}>
                        <Text style={styles.beachEmoji}>🏖️</Text>
                    </View>
                    {suitability && (
                        <View style={styles.suitabilityCard}>
                            <Text style={styles.suitabilityTitle}>Recreational Suitability</Text>
                            <Text style={[styles.suitabilityScore, { color: getSuitabilityColor(suitability.overall) }]}>
                                {suitability.overall.toFixed(0)}%
                            </Text>
                            <View style={styles.suitabilityBreakdown}>
                                <View style={styles.suitabilityItem}>
                                    <Text style={styles.suitabilityLabel}>Swimming</Text>
                                    <Text style={[styles.suitabilityValue, { color: getSuitabilityColor(suitability.swimming) }]}>
                                        {suitability.swimming.toFixed(0)}%
                                    </Text>
                                </View>
                                <View style={styles.suitabilityItem}>
                                    <Text style={styles.suitabilityLabel}>Family</Text>
                                    <Text style={[styles.suitabilityValue, { color: getSuitabilityColor(suitability.family) }]}>
                                        {suitability.family.toFixed(0)}%
                                    </Text>
                                </View>
                                <View style={styles.suitabilityItem}>
                                    <Text style={styles.suitabilityLabel}>Adventure</Text>
                                    <Text style={[styles.suitabilityValue, { color: getSuitabilityColor(suitability.adventure) }]}>
                                        {suitability.adventure.toFixed(0)}%
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Weather & Conditions */}
                {weather && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>🌤️ Current Weather</Text>
                        <View style={styles.weatherGrid}>
                            <View style={styles.weatherItem}>
                                <Ionicons name="thermometer" size={24} color="#FF6B6B" />
                                <Text style={styles.weatherValue}>{weather.temperature}°C</Text>
                                <Text style={styles.weatherLabel}>Temperature</Text>
                            </View>
                            <View style={styles.weatherItem}>
                                <Ionicons name="water" size={24} color="#4ECDC4" />
                                <Text style={styles.weatherValue}>{weather.humidity}%</Text>
                                <Text style={styles.weatherLabel}>Humidity</Text>
                            </View>
                            <View style={styles.weatherItem}>
                                <Ionicons name="rainy" size={24} color="#95E1D3" />
                                <Text style={styles.weatherValue}>{weather.precipitation}mm</Text>
                                <Text style={styles.weatherLabel}>Precipitation</Text>
                            </View>
                            <View style={styles.weatherItem}>
                                <Ionicons name="wind" size={24} color="#AA96DA" />
                                <Text style={styles.weatherValue}>{weather.wind_speed} km/h</Text>
                                <Text style={styles.weatherLabel}>Wind Speed</Text>
                            </View>
                        </View>
                        <Text style={styles.weatherCondition}>{weather.condition}</Text>
                    </View>
                )}

                {/* Beach Condition (CV Verification) */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>📸 Beach Condition</Text>
                        <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={handleUploadImage}
                            disabled={uploadingImage}
                        >
                            {uploadingImage ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="camera" size={16} color="#fff" />
                                    <Text style={styles.uploadButtonText}>Upload</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                    <View style={styles.conditionGrid}>
                        <View style={styles.conditionItem}>
                            <Text style={styles.conditionLabel}>Crowd Level</Text>
                            <Text style={[styles.conditionValue, {
                                color: beach.crowd_level === 'low' ? '#4CAF50' :
                                    beach.crowd_level === 'moderate' ? '#FF9800' : '#F44336'
                            }]}>
                                {beach.crowd_level ? beach.crowd_level.charAt(0).toUpperCase() + beach.crowd_level.slice(1) : 'Unknown'}
                            </Text>
                        </View>
                        <View style={styles.conditionItem}>
                            <Text style={styles.conditionLabel}>Cleanliness</Text>
                            <Text style={[styles.conditionValue, {
                                color: (beach.cleanliness_score || 0) >= 70 ? '#4CAF50' :
                                    (beach.cleanliness_score || 0) >= 50 ? '#FF9800' : '#F44336'
                            }]}>
                                {beach.cleanliness_score ? beach.cleanliness_score.toFixed(0) + '%' : 'N/A'}
                            </Text>
                        </View>
                        {beach.condition_verifications > 0 && (
                            <View style={styles.conditionItem}>
                                <Text style={styles.conditionLabel}>Verifications</Text>
                                <Text style={styles.conditionValue}>{beach.condition_verifications}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Sentiment/Vibe Analysis */}
                {vibe && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>💭 Beach Vibe</Text>
                        {vibe.current_sentiment_score !== undefined && (
                            <View style={styles.vibeScore}>
                                <Text style={styles.vibeScoreLabel}>Sentiment Score</Text>
                                <Text style={[styles.vibeScoreValue, {
                                    color: vibe.current_sentiment_score > 0 ? '#4CAF50' : '#F44336'
                                }]}>
                                    {(vibe.current_sentiment_score * 100).toFixed(0)}%
                                </Text>
                            </View>
                        )}
                        {vibe.current_vibe_tags && vibe.current_vibe_tags.length > 0 && (
                            <View style={styles.vibeTags}>
                                {vibe.current_vibe_tags.map((tag, index) => (
                                    <View key={index} style={styles.vibeTag}>
                                        <Text style={styles.vibeTagText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Eco Impact */}
                {ecoImpact && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>🌱 Environmental Impact</Text>
                        <View style={styles.ecoGrid}>
                            <View style={styles.ecoItem}>
                                <Ionicons name="car" size={24} color="#FF6B6B" />
                                <Text style={styles.ecoValue}>{ecoImpact.impact.carbon_emissions_kg} kg</Text>
                                <Text style={styles.ecoLabel}>CO2 Emissions</Text>
                            </View>
                            <View style={styles.ecoItem}>
                                <Ionicons name="trash" size={24} color="#FFA726" />
                                <Text style={styles.ecoValue}>{ecoImpact.impact.plastic_waste_kg} kg</Text>
                                <Text style={styles.ecoLabel}>Plastic Waste</Text>
                            </View>
                            <View style={styles.ecoItem}>
                                <Ionicons name="leaf" size={24} color="#4CAF50" />
                                <Text style={styles.ecoValue}>{ecoImpact.impact.trees_needed_to_offset}</Text>
                                <Text style={styles.ecoLabel}>Trees to Offset</Text>
                            </View>
                        </View>
                        {ecoImpact.eco_suggestions && ecoImpact.eco_suggestions.length > 0 && (
                            <View style={styles.suggestions}>
                                <Text style={styles.suggestionsTitle}>💡 Eco Suggestions</Text>
                                {ecoImpact.eco_suggestions.slice(0, 2).map((suggestion, index) => (
                                    <View key={index} style={styles.suggestionItem}>
                                        <Text style={styles.suggestionText}>{suggestion.message}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Description */}
                {beach.description && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>📝 Description</Text>
                        <Text style={styles.descriptionText}>{beach.description}</Text>
                    </View>
                )}

                {/* Reviews Section */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>⭐ Reviews ({reviews.length})</Text>
                        <TouchableOpacity
                            style={styles.addReviewButton}
                            onPress={() => setShowReviewModal(true)}
                        >
                            <Ionicons name="add-circle" size={20} color="#0288D1" />
                            <Text style={styles.addReviewText}>Add Review</Text>
                        </TouchableOpacity>
                    </View>
                    {reviews.length > 0 ? (
                        reviews.slice(0, 5).map((review, index) => (
                            <View key={index} style={styles.reviewItem}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewRating}>⭐ {review.rating}/5</Text>
                                    {review.sentiment_score !== undefined && (
                                        <View style={styles.sentimentBadge}>
                                            <Text style={styles.sentimentText}>
                                                {review.sentiment_score > 0 ? '😊' : '😐'} Sentiment
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.reviewText}>{review.review_text}</Text>
                                {review.extracted_tags && review.extracted_tags.length > 0 && (
                                    <View style={styles.reviewTags}>
                                        {review.extracted_tags.slice(0, 3).map((tag, tagIndex) => (
                                            <Text key={tagIndex} style={styles.reviewTag}>#{tag}</Text>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noReviews}>No reviews yet. Be the first to review!</Text>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Utilities', { startBeachId: beachId })}
                    >
                        <Ionicons name="map" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Plan Itinerary</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonSecondary]}
                        onPress={handleUploadImage}
                    >
                        <Ionicons name="camera" size={20} color="#0288D1" />
                        <Text style={[styles.actionButtonText, { color: '#0288D1' }]}>Upload Photo</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Review Modal */}
            <Modal
                visible={showReviewModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowReviewModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Write a Review</Text>
                        <View style={styles.ratingSelector}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setReviewRating(star)}
                                >
                                    <Ionicons
                                        name={star <= reviewRating ? 'star' : 'star-outline'}
                                        size={32}
                                        color="#FFD700"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TextInput
                            style={styles.reviewInput}
                            placeholder="Share your experience..."
                            value={reviewText}
                            onChangeText={setReviewText}
                            multiline
                            numberOfLines={6}
                            placeholderTextColor="#999"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={handleSubmitReview}
                            >
                                <Text style={styles.modalButtonText}>Submit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowReviewModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#01579B',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    heroSection: {
        backgroundColor: '#fff',
        padding: 20,
        marginBottom: 15,
    },
    heroImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#E3F2FD',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    beachEmoji: {
        fontSize: 80,
    },
    suitabilityCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 15,
    },
    suitabilityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    suitabilityScore: {
        fontSize: 48,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    suitabilityBreakdown: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    suitabilityItem: {
        alignItems: 'center',
    },
    suitabilityLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    suitabilityValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 15,
    },
    weatherGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    weatherItem: {
        width: '48%',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 10,
    },
    weatherValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    weatherLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    weatherCondition: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginTop: 10,
        fontWeight: '600',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0288D1',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 5,
    },
    uploadButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    conditionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    conditionItem: {
        alignItems: 'center',
    },
    conditionLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    conditionValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    vibeScore: {
        alignItems: 'center',
        marginBottom: 15,
    },
    vibeScoreLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    vibeScoreValue: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    vibeTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    vibeTag: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    vibeTagText: {
        color: '#0277BD',
        fontSize: 12,
        fontWeight: '500',
    },
    ecoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    ecoItem: {
        alignItems: 'center',
    },
    ecoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    ecoLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    suggestions: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    suggestionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    suggestionItem: {
        backgroundColor: '#F0F8FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    suggestionText: {
        fontSize: 13,
        color: '#333',
        lineHeight: 18,
    },
    descriptionText: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
    },
    addReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    addReviewText: {
        color: '#0288D1',
        fontWeight: '600',
        fontSize: 14,
    },
    reviewItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewRating: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF9800',
    },
    sentimentBadge: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    sentimentText: {
        fontSize: 11,
        color: '#666',
    },
    reviewText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 8,
    },
    reviewTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
    },
    reviewTag: {
        fontSize: 12,
        color: '#0288D1',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    noReviews: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
        padding: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        gap: 10,
        marginBottom: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0288D1',
        padding: 15,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonSecondary: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#0288D1',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        width: '85%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 20,
        textAlign: 'center',
    },
    ratingSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 10,
    },
    reviewInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        textAlignVertical: 'top',
        minHeight: 120,
        marginBottom: 20,
    },
    modalButtons: {
        gap: 10,
    },
    modalButton: {
        backgroundColor: '#0288D1',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalCancelButton: {
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
});
