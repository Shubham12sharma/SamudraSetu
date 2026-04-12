// ✅ CORRECTED: Proper ScrollView scrolling with SafeAreaView edges
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
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
    const [predictingSuitability, setPredictingSuitability] = useState(false);

    useEffect(() => {
        loadAllData();
        loadUserLocation();
    }, [beachId]);

    useEffect(() => {
        const fetchEco = async () => {
            if (!userLocation || !beachId) return;
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
            } catch (err) {
                console.error('Eco impact (deferred) error:', err);
            }
        };
        fetchEco();
    }, [userLocation, beachId]);

    const parseTags = (raw) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            try {
                if (trimmed.startsWith('[')) {
                    const normalized = trimmed.replace(/'/g, '"');
                    const parsed = JSON.parse(normalized);
                    return Array.isArray(parsed) ? parsed : [];
                }

                if (trimmed.indexOf(',') !== -1) {
                    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
                }
            } catch (e) {
                console.warn('parseTags: could not parse tags', raw, e);
                return [];
            }
        }
        return [];
    };

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

            if (beachId) {
                const rawBeach = await beachesAPI.getById(beachId);
                const beachData = rawBeach?.result || rawBeach || {};
                setBeach(beachData);

                if (beachData.latitude && beachData.longitude) {
                    try {
                        const rawWeather = await weatherAPI.getWeather(
                            beachData.latitude,
                            beachData.longitude
                        );
                        const weatherData = rawWeather?.data || rawWeather || rawWeather;
                        setWeather(weatherData);
                    } catch (error) {
                        console.error('Weather error:', error);
                    }

                    try {
                        const suitabilityData = await mlAPI.getSuitability(beachId);
                        const scores = suitabilityData?.suitability_scores || suitabilityData?.suitability || suitabilityData;
                        setSuitability(scores);
                    } catch (error) {
                        console.error('Suitability error:', error);
                    }

                    try {
                        const vibeData = await sentimentAPI.getBeachVibe(beachId);
                        const normalizedVibe = vibeData?.data || vibeData || {};
                        setVibe(normalizedVibe);
                    } catch (error) {
                        console.error('Vibe error:', error);
                    }

                    try {
                        const reviewsData = await beachesAPI.getReviews(beachId);
                        const normalizedReviews = reviewsData?.results || reviewsData || [];
                        setReviews(Array.isArray(normalizedReviews) ? normalizedReviews : []);
                    } catch (error) {
                        console.error('Reviews error:', error);
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
                loadAllData();
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

    const handlePredictSuitability = async () => {
        if (!beach || !beachId) return;

        try {
            setPredictingSuitability(true);

            const features = {};
            if (weather) {
                if (typeof weather.temperature === 'number') {
                    features.temperature = weather.temperature;
                    features.water_temp = weather.temperature - 2;
                }
                if (typeof weather.humidity === 'number') {
                    features.humidity = weather.humidity;
                }
                if (typeof weather.precipitation === 'number') {
                    features.precipitation = weather.precipitation;
                }
                if (typeof weather.wind_speed === 'number') {
                    features.wind_speed = weather.wind_speed;
                }
                if (typeof weather.air_quality_index === 'number') {
                    features.air_quality_index = weather.air_quality_index;
                }
                if (typeof weather.tide_height === 'number') {
                    features.tide_height = weather.tide_height;
                }
            }

            const result = await mlAPI.predictSuitability(beachId, features);
            if (result && result.suitability_scores) {
                setSuitability(result.suitability_scores);
                Alert.alert(
                    'Suitability Updated',
                    `Overall suitability is now ${(result.suitability_scores?.overall || 0).toFixed(0)}%.`
                );
            }
        } catch (error) {
            console.error('Predict suitability error:', error);
            Alert.alert(
                'Prediction Failed',
                'Could not update suitability right now. Please try again later.'
            );
        } finally {
            setPredictingSuitability(false);
        }
    };

    const getSuitabilityColor = (score) => {
        if (score >= 80) return '#10B981';
        if (score >= 60) return '#F59E0B';
        return '#EF4444';
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0891B2" />
                    <Text style={styles.loadingText}>Loading beach details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header - Outside ScrollView */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#0891B2" />
                </TouchableOpacity>
                <View style={styles.headerTitle}>
                    <Text style={styles.title}>{beach.name}</Text>
                    <Text style={styles.subtitle}>{beach.state}</Text>
                </View>
            </View>

            {/* ✅ MAIN SCROLLABLE CONTENT - Y-axis only */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                scrollEnabled={true}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
            >
                {/* Hero Section with Suitability Score */}
                <View style={styles.heroSection}>
                    <View style={styles.heroImage}>
                        <Text style={styles.beachEmoji}>🏖️</Text>
                    </View>

                    {suitability && (
                        <View style={styles.suitabilityCard}>
                            <View style={styles.suitabilityHeaderRow}>
                                <Text style={styles.suitabilityTitle}>Recreational Suitability</Text>
                                {predictingSuitability ? (
                                    <ActivityIndicator size="small" color="#0891B2" />
                                ) : (
                                    <TouchableOpacity
                                        onPress={handlePredictSuitability}
                                        style={styles.refreshSuitabilityButton}
                                    >
                                        <Ionicons name="refresh" size={14} color="#0891B2" />
                                        <Text style={styles.refreshSuitabilityText}>Update</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Text
                                style={[
                                    styles.suitabilityScore,
                                    { color: getSuitabilityColor(suitability.overall) },
                                ]}
                            >
                                {(suitability.overall || 0).toFixed(0)}%
                            </Text>

                            <View style={styles.suitabilityBreakdown}>
                                <View style={styles.suitabilityItem}>
                                    <Text style={styles.suitabilityLabel}>Swimming</Text>
                                    <Text
                                        style={[
                                            styles.suitabilityValue,
                                            { color: getSuitabilityColor(suitability.swimming) },
                                        ]}
                                    >
                                        {(suitability.swimming || 0).toFixed(0)}%
                                    </Text>
                                </View>
                                <View style={styles.suitabilityItem}>
                                    <Text style={styles.suitabilityLabel}>Family</Text>
                                    <Text
                                        style={[
                                            styles.suitabilityValue,
                                            { color: getSuitabilityColor(suitability.family) },
                                        ]}
                                    >
                                        {(suitability.family || 0).toFixed(0)}%
                                    </Text>
                                </View>
                                <View style={styles.suitabilityItem}>
                                    <Text style={styles.suitabilityLabel}>Adventure</Text>
                                    <Text
                                        style={[
                                            styles.suitabilityValue,
                                            { color: getSuitabilityColor(suitability.adventure) },
                                        ]}
                                    >
                                        {(suitability.adventure || 0).toFixed(0)}%
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
                                <Ionicons name="thermometer" size={24} color="#0891B2" />
                                <Text style={styles.weatherValue}>{weather.temperature}°C</Text>
                                <Text style={styles.weatherLabel}>Temperature</Text>
                            </View>
                            <View style={styles.weatherItem}>
                                <Ionicons name="water" size={24} color="#0891B2" />
                                <Text style={styles.weatherValue}>{weather.humidity}%</Text>
                                <Text style={styles.weatherLabel}>Humidity</Text>
                            </View>
                            <View style={styles.weatherItem}>
                                <Ionicons name="rainy" size={24} color="#0891B2" />
                                <Text style={styles.weatherValue}>{weather.precipitation}mm</Text>
                                <Text style={styles.weatherLabel}>Precipitation</Text>
                            </View>
                            <View style={styles.weatherItem}>
                                <Ionicons name="wind" size={24} color="#0891B2" />
                                <Text style={styles.weatherValue}>{weather.wind_speed}</Text>
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
                        {uploadingImage ? (
                            <ActivityIndicator size="small" color="#0891B2" />
                        ) : (
                            <TouchableOpacity onPress={handleUploadImage} style={styles.uploadButton}>
                                <Ionicons name="cloud-upload" size={16} color="#fff" />
                                <Text style={styles.uploadButtonText}>Upload</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.conditionGrid}>
                        <View style={styles.conditionItem}>
                            <Text style={styles.conditionLabel}>Crowd Level</Text>
                            <Text style={styles.conditionValue}>
                                {beach.crowd_level
                                    ? beach.crowd_level.charAt(0).toUpperCase() + beach.crowd_level.slice(1)
                                    : 'Unknown'}
                            </Text>
                        </View>

                        <View style={styles.conditionItem}>
                            <Text style={styles.conditionLabel}>Cleanliness</Text>
                            <Text
                                style={[
                                    styles.conditionValue,
                                    {
                                        color:
                                            (beach.cleanliness_score || 0) >= 70
                                                ? '#10B981'
                                                : (beach.cleanliness_score || 0) >= 50
                                                    ? '#F59E0B'
                                                    : '#EF4444',
                                    },
                                ]}
                            >
                                {beach.cleanliness_score ? (beach.cleanliness_score || 0).toFixed(0) + '%' : 'N/A'}
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
                        <Text style={styles.cardTitle}>Beach Vibe</Text>

                        {vibe.current_sentiment_score !== undefined && (
                            <View style={styles.vibeScore}>
                                <Text style={styles.vibeScoreLabel}>Sentiment Score</Text>
                                <Text
                                    style={[
                                        styles.vibeScoreValue,
                                        {
                                            color: vibe.current_sentiment_score > 0 ? '#10B981' : '#EF4444',
                                        },
                                    ]}
                                >
                                    {((vibe.current_sentiment_score || 0) * 100).toFixed(0)}%
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
                                <Ionicons name="leaf" size={24} color="#10B981" />
                                <Text style={styles.ecoValue}>{ecoImpact.impact.carbon_emissions_kg}</Text>
                                <Text style={styles.ecoLabel}>kg CO2</Text>
                            </View>
                            <View style={styles.ecoItem}>
                                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                                <Text style={styles.ecoValue}>{ecoImpact.impact.plastic_waste_kg}</Text>
                                <Text style={styles.ecoLabel}>kg Plastic</Text>
                            </View>
                            <View style={styles.ecoItem}>
                                <Ionicons name="flower" size={24} color="#10B981" />
                                <Text style={styles.ecoValue}>{ecoImpact.impact.trees_needed_to_offset}</Text>
                                <Text style={styles.ecoLabel}>Trees Needed</Text>
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
                            onPress={() => setShowReviewModal(true)}
                            style={styles.addReviewButton}
                        >
                            <Ionicons name="add-circle" size={20} color="#0891B2" />
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

                                {parseTags(review.extracted_tags).length > 0 && (
                                    <View style={styles.reviewTags}>
                                        {parseTags(review.extracted_tags).slice(0, 3).map((tag, tagIndex) => (
                                            <Text key={tagIndex} style={styles.reviewTag}>
                                                #{tag}
                                            </Text>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noReviews}>No reviews yet. Be the first to review!</Text>
                    )}
                </View>

                {/* Bottom spacing to account for fixed action bar */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Buttons - Fixed at bottom */}
            <View style={styles.actionButtonsContainer}>
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
                    <Ionicons name="camera" size={20} color="#0891B2" />
                    <Text style={[styles.actionButtonText, { color: '#0891B2' }]}>Upload Photo</Text>
                </TouchableOpacity>
            </View>

            {/* Review Modal */}
            <Modal
                visible={showReviewModal}
                transparent={true}
                animationType="fade"
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
                                    style={{
                                        transform: [{ scale: reviewRating >= star ? 1.2 : 1 }],
                                    }}
                                >
                                    <Text style={{ fontSize: 32 }}>
                                        {reviewRating >= star ? '⭐' : '☆'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={styles.reviewInput}
                            placeholder="Share your beach experience..."
                            placeholderTextColor="#999"
                            value={reviewText}
                            onChangeText={setReviewText}
                            multiline
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={handleSubmitReview}
                            >
                                <Text style={styles.modalButtonText}>Submit Review</Text>
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
        backgroundColor: '#F0F9FC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F9FC',
    },
    loadingText: {
        marginTop: 12,
        color: '#0891B2',
        fontSize: 16,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 0,
        paddingVertical: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0F2FE',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
    },
    backButton: {
        marginRight: 12,
        padding: 8,
    },
    headerTitle: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0C4A6E',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    heroSection: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 12,
    },
    heroImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#E0F2FE',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#BAE6FD',
    },
    beachEmoji: {
        fontSize: 80,
    },
    suitabilityCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#0891B2',
    },
    suitabilityHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    suitabilityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0C4A6E',
    },
    suitabilityScore: {
        fontSize: 56,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 16,
    },
    suitabilityBreakdown: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 12,
    },
    suitabilityItem: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 12,
    },
    suitabilityLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 6,
        fontWeight: '500',
    },
    suitabilityValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    refreshSuitabilityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#0891B2',
        gap: 6,
        backgroundColor: '#E0F2FE',
    },
    refreshSuitabilityText: {
        color: '#0891B2',
        fontSize: 12,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0C4A6E',
        marginBottom: 12,
    },
    weatherGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
    },
    weatherItem: {
        width: '48%',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F0F9FC',
        borderRadius: 12,
        marginBottom: 8,
    },
    weatherValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0C4A6E',
        marginTop: 8,
    },
    weatherLabel: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
        fontWeight: '500',
    },
    weatherCondition: {
        fontSize: 16,
        color: '#0C4A6E',
        textAlign: 'center',
        marginTop: 12,
        fontWeight: '600',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0891B2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    uploadButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    conditionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 12,
    },
    conditionItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#F0F9FC',
        borderRadius: 12,
    },
    conditionLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 6,
        fontWeight: '500',
    },
    conditionValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0C4A6E',
    },
    vibeScore: {
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 12,
        backgroundColor: '#F0F9FC',
        borderRadius: 12,
    },
    vibeScoreLabel: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 6,
        fontWeight: '500',
    },
    vibeScoreValue: {
        fontSize: 32,
        fontWeight: '800',
    },
    vibeTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    vibeTag: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    vibeTagText: {
        color: '#0369A1',
        fontSize: 12,
        fontWeight: '600',
    },
    ecoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        gap: 8,
    },
    ecoItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#F0F9FC',
        borderRadius: 12,
    },
    ecoValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0C4A6E',
        marginTop: 8,
    },
    ecoLabel: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
        fontWeight: '500',
    },
    suggestions: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    suggestionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0C4A6E',
        marginBottom: 10,
    },
    suggestionItem: {
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#10B981',
    },
    suggestionText: {
        fontSize: 13,
        color: '#1F2937',
        lineHeight: 18,
    },
    descriptionText: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 22,
    },
    addReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    addReviewText: {
        color: '#0891B2',
        fontWeight: '600',
        fontSize: 13,
    },
    reviewItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewRating: {
        fontSize: 15,
        fontWeight: '600',
        color: '#F59E0B',
    },
    sentimentBadge: {
        backgroundColor: '#F0F4F8',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sentimentText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    reviewText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 20,
        marginBottom: 8,
    },
    reviewTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    reviewTag: {
        fontSize: 12,
        color: '#0369A1',
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        fontWeight: '500',
    },
    noReviews: {
        textAlign: 'center',
        color: '#94A3B8',
        fontStyle: 'italic',
        paddingVertical: 20,
        fontSize: 14,
    },
    actionButtonsContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 50,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0891B2',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    actionButtonSecondary: {
        backgroundColor: '#E0F2FE',
        borderWidth: 1.5,
        borderColor: '#0891B2',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '88%',
        maxWidth: 420,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0C4A6E',
        marginBottom: 16,
        textAlign: 'center',
    },
    ratingSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
        gap: 8,
    },
    reviewInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 16,
        backgroundColor: '#F8FAFC',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    modalButton: {
        flex: 1,
        backgroundColor: '#0891B2',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    modalCancelButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    modalCancelText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 14,
    },
});