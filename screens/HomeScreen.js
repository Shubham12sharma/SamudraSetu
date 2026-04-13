import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { beachesAPI, getUserData } from '../services/api';

    export default function HomeScreen({ navigation }) {
        const [beaches, setBeaches] = useState([]); // Top 3 featured
        const [allBeaches, setAllBeaches] = useState([]); // All beaches for stats
        const [loading, setLoading] = useState(true);
        const [refreshing, setRefreshing] = useState(false);
        const [user, setUser] = useState(null);
        const [userCount, setUserCount] = useState('...');

        useEffect(() => {
            loadData();
        }, []);

        const loadData = async () => {
            try {
                setLoading(true);
                const userData = await getUserData();
                setUser(userData);

                // Load all beaches for stats
                const beachesData = await beachesAPI.getAll();
                const beachesArray = Array.isArray(beachesData) ? beachesData : beachesData.results || [];
                setAllBeaches(beachesArray);

                // Sort by suitability score and take top 3 for featured
                const featuredBeaches = [...beachesArray]
                    .sort((a, b) => (b.suitability_score || 0) - (a.suitability_score || 0))
                    .slice(0, 3);
                setBeaches(featuredBeaches);

                // User count from backend if available
                if (beachesData.user_count) {
                    setUserCount(`${beachesData.user_count}+`);
                } else {
                    setUserCount(beachesArray.length > 0 ? `${Math.max(beachesArray.length * 3, 100)}+` : '5K+');
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        const onRefresh = async () => {
            setRefreshing(true);
            await loadData();
            setRefreshing(false);
        };

        const getSuitabilityColor = (score) => {
            if (score >= 80) return '#4CAF50';
            if (score >= 60) return '#FF9800';
            return '#F44336';
        };

        const getFirstBeach = () => {
            if (!beaches || beaches.length === 0) return null;
            return beaches[0];
        };

        // Correct nested navigation for Beaches tab stack
        const goToBeachList = () => {
            navigation.navigate('Beaches');
        };

        // Navigate to BeachDetails inside Beaches stack
        const goToBeachDetails = (beach) => {
            navigation.navigate('Beaches', { screen: 'BeachDetails', params: { beach } });
        };

        // Not used anymore, but kept for reference
        // const openBeachDetailsForFeature = () => {
        //     const first = getFirstBeach();
        //     if (first) {
        //         goToBeachDetails(first);
        //     } else {
        //         goToBeachList();
        //     }
        // };

        const openSmartItinerary = () => {
            const first = getFirstBeach();
            if (first) {
                const id = first._id || first.id;
                navigation.navigate('Utilities', { startBeachId: id });
            } else {
                navigation.navigate('Utilities');
            }
        };

        return (
            <View style={styles.container}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0288D1" />
                    }
                >
                    {/* Header Section */}
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Text style={styles.title}>SamudraSetu</Text>
                            <Text style={styles.subtitle}>Beach Recreational Suitability</Text>
                            <Text style={styles.description}>
                                Discover the best beaches across India with real-time suitability scores, weather data, and AI-powered insights.
                            </Text>
                        </View>
                    </View>

                    {/* Quick Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Ionicons name="water" size={28} color="#0288D1" />
                            <Text style={styles.statNumber}>
                                {allBeaches.length > 0 ? String(allBeaches.length) : '...'}
                            </Text>
                            <Text style={styles.statLabel}>Beaches</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Ionicons name="analytics" size={28} color="#4CAF50" />
                            <Text style={styles.statNumber}>ML</Text>
                            <Text style={styles.statLabel}>AI Powered</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Ionicons name="people" size={28} color="#FF9800" />
                            <Text style={styles.statNumber}>{userCount}</Text>
                            <Text style={styles.statLabel}>Users</Text>
                        </View>
                    </View>

                    {/* Featured Beaches */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Top Recommended Beaches</Text>
                            <TouchableOpacity onPress={goToBeachList}>
                                <Text style={styles.seeAllText}>See All →</Text>
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#0288D1" />
                            </View>
                        ) : beaches.length > 0 ? (
                            beaches.map((beach) => (
                                <TouchableOpacity
                                    key={beach._id || beach.id}
                                    style={styles.featuredCard}
                                    onPress={() => goToBeachDetails(beach)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.featuredCardHeader}>
                                        <View style={styles.featuredCardImage}>
                                            <Text style={styles.featuredEmoji}>🏖️</Text>
                                        </View>
                                        <View style={styles.featuredCardContent}>
                                            <Text style={styles.featuredName}>{beach.name}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name="location" size={12} color="#666" />
                                                <Text style={styles.featuredLocation}> {beach.state}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.suitabilityBadge, { backgroundColor: getSuitabilityColor(beach.suitability_score || 0) + '20' }]}>\
                                            <Text style={[styles.suitabilityBadgeText, { color: getSuitabilityColor(beach.suitability_score || 0) }]}>\
                                                {(beach.suitability_score || 0).toFixed(0)}%
                                            </Text>
                                        </View>
                                    </View>
                                    {beach.description && (
                                        <Text style={styles.featuredDescription} numberOfLines={2}>
                                            {beach.description}
                                        </Text>
                                    )}
                                    <View style={styles.featuredFooter}>
                                        <View style={styles.featuredMeta}>
                                            {beach.crowd_level && (
                                                <View style={styles.metaItem}>
                                                    <Ionicons
                                                        name="people"
                                                        size={14}
                                                        color={beach.crowd_level === 'low' ? '#4CAF50' : '#FF9800'}
                                                    />
                                                    <Text style={styles.metaText}>
                                                        {beach.crowd_level.charAt(0).toUpperCase() + beach.crowd_level.slice(1)}
                                                    </Text>
                                                </View>
                                            )}
                                            {beach.cleanliness_score !== undefined && (
                                                <View style={styles.metaItem}>
                                                    <Ionicons name="star" size={14} color="#FFD700" />
                                                    <Text style={styles.metaText}>
                                                        Clean: {beach.cleanliness_score != null ? beach.cleanliness_score.toFixed(0) : "N/A"}%
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#0288D1" />
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No beaches available</Text>
                            </View>
                        )}
                    </View>

                    {/* Features Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}> Key Features</Text>
                        <View style={styles.featuresGrid}>
                            <TouchableOpacity
                                style={styles.featureCard}
                                onPress={() => navigation.navigate('MLPrediction')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.featureIcon}>
                                    <Ionicons name="analytics" size={32} color="#0288D1" />
                                </View>
                                <Text style={styles.featureTitle}>ML Prediction</Text>
                                <Text style={styles.featureText}>
                                    AI-powered suitability scores for swimming, family, and adventure activities
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.featureCard}
                                onPress={() => navigation.navigate('CVVerification')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.featureIcon}>
                                    <Ionicons name="camera" size={32} color="#4CAF50" />
                                </View>
                                <Text style={styles.featureTitle}>CV Verification</Text>
                                <Text style={styles.featureText}>
                                    Upload beach condition images for crowd level and cleanliness analysis
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.featureCard}
                                onPress={openSmartItinerary}
                                activeOpacity={0.8}
                            >
                                <View style={styles.featureIcon}>
                                    <Ionicons name="map" size={32} color="#FF9800" />
                                </View>
                                <Text style={styles.featureTitle}>Smart Itinerary</Text>
                                <Text style={styles.featureText}>
                                    Graph-based route optimization for the perfect beach trip
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.featureCard}
                                onPress={() => navigation.navigate('SentimentAnalysis')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.featureIcon}>
                                    <Ionicons name="chatbubbles" size={32} color="#9C27B0" />
                                </View>
                                <Text style={styles.featureTitle}>Sentiment Analysis</Text>
                                <Text style={styles.featureText}>
                                    Real-time beach vibe detection from user reviews
                                </Text>
                            </TouchableOpacity>

                            
                            <TouchableOpacity
                                style={styles.featureCard}
                                onPress={() => navigation.navigate('EcoImpact')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.featureIcon}>
                                    <Ionicons name="leaf" size={32} color="#4CAF50" />
                                </View>
                                <Text style={styles.featureTitle}>Eco Impact</Text>
                                <Text style={styles.featureText}>
                                    Calculate environmental impact and get sustainability suggestions
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.featureCard}
                                onPress={() => navigation.navigate('LiveWeather')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.featureIcon}>
                                    <Ionicons name="cloud" size={32} color="#00BCD4" />
                                </View>
                                <Text style={styles.featureTitle}>Live Weather</Text>
                                <Text style={styles.featureText}>
                                    Real-time weather data for informed beach visit planning
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
                        <View style={styles.quickActions}>
                            <TouchableOpacity
                                style={styles.quickActionButton}
                                onPress={goToBeachList}
                            >
                                <Ionicons name="water" size={24} color="#0288D1" />
                                <Text style={styles.quickActionText}>Explore Beaches</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickActionButton}
                                onPress={() => navigation.navigate('Utilities')}
                            >
                                <Ionicons name="map" size={24} color="#4CAF50" />
                                <Text style={styles.quickActionText}>Plan Itinerary</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickActionButton}
                                onPress={() => navigation.navigate('Profile')}
                            >
                                <Ionicons name="person" size={24} color="#FF9800" />
                                <Text style={styles.quickActionText}>My Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bottom Padding */}
                    <View style={{ height: 30 }} />
                </ScrollView>
            </View>
        );
    }

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#F5F7FA',
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            paddingBottom: 100,
            flexGrow: 1,
        },
        header: {
            backgroundColor: '#0288D1',
            paddingTop: 20,
            paddingBottom: 30,
            paddingHorizontal: 20,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
        },
        headerContent: {
            alignItems: 'center',
        },
        title: {
            fontSize: 36,
            fontWeight: 'bold',
            color: '#FFFFFF',
            marginBottom: 8,
        },
        subtitle: {
            fontSize: 16,
            color: '#E3F2FD',
            marginBottom: 15,
            textAlign: 'center',
        },
        description: {
            fontSize: 14,
            color: '#B3E5FC',
            textAlign: 'center',
            lineHeight: 20,
            paddingHorizontal: 10,
        },
        statsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            backgroundColor: '#FFFFFF',
            marginHorizontal: 20,
            marginTop: -20,
            padding: 20,
            borderRadius: 20,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            marginBottom: 25,
        },
        statBox: {
            alignItems: 'center',
        },
        statNumber: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#01579B',
            marginTop: 8,
        },
        statLabel: {
            fontSize: 12,
            color: '#757575',
            marginTop: 4,
        },
        section: {
            paddingHorizontal: 20,
            marginBottom: 25,
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
        },
        sectionTitle: {
            fontSize: 22,
            fontWeight: 'bold',
            color: '#01579B',
        },
        seeAllText: {
            fontSize: 14,
            color: '#0288D1',
            fontWeight: '600',
        },
        loadingContainer: {
            padding: 40,
            alignItems: 'center',
        },
        featuredCard: {
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: 15,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        featuredCardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
        },
        featuredCardImage: {
            width: 60,
            height: 60,
            borderRadius: 12,
            backgroundColor: '#E3F2FD',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        featuredEmoji: {
            fontSize: 30,
        },
        featuredCardContent: {
            flex: 1,
        },
        featuredName: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#01579B',
            marginBottom: 4,
        },
        featuredLocation: {
            fontSize: 13,
            color: '#666',
        },
        suitabilityBadge: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
        },
        suitabilityBadgeText: {
            fontSize: 14,
            fontWeight: 'bold',
        },
        featuredDescription: {
            fontSize: 13,
            color: '#888',
            lineHeight: 18,
            marginBottom: 12,
        },
        featuredFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
        },
        featuredMeta: {
            flexDirection: 'row',
            gap: 15,
        },
        metaItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
        },
        metaText: {
            fontSize: 12,
            color: '#666',
        },
        emptyContainer: {
            padding: 40,
            alignItems: 'center',
        },
        emptyText: {
            fontSize: 16,
            color: '#999',
        },
        featuresGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 15,
        },
        featureCard: {
            width: '48%',
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            marginBottom: 10,
        },
        featureIcon: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#F5F5F5',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
        },
        featureTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#01579B',
            marginBottom: 8,
            textAlign: 'center',
        },
        featureText: {
            fontSize: 11,
            color: '#666',
            textAlign: 'center',
            lineHeight: 16,
        },
        quickActions: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
        },
        quickActionButton: {
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
        },
        quickActionText: {
            fontSize: 12,
            color: '#333',
            marginTop: 8,
            fontWeight: '600',
            textAlign: 'center',
        },
    });
