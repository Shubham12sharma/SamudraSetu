import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { beachesAPI } from '../services/api';

export default function BeachListScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [beaches, setBeaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterState, setFilterState] = useState('');

    useEffect(() => {
        loadBeaches();
    }, []);

    const loadBeaches = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterState) params.state = filterState;
            const data = await beachesAPI.getAll(params);
            setBeaches(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error('Error loading beaches:', error);
            Alert.alert('Error', 'Failed to load beaches. Please try again.');
            // Fallback to empty array
            setBeaches([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBeaches();
        setRefreshing(false);
    };

    const filteredBeaches = useMemo(() => {
        if (!searchQuery.trim()) return beaches;
        const query = searchQuery.toLowerCase();
        return beaches.filter(beach =>
            beach.name?.toLowerCase().includes(query) ||
            beach.state?.toLowerCase().includes(query) ||
            beach.description?.toLowerCase().includes(query)
        );
    }, [beaches, searchQuery]);

    const getSuitabilityColor = (score) => {
        if (score >= 80) return '#4CAF50';
        if (score >= 60) return '#FF9800';
        return '#F44336';
    };

    const getSuitabilityLabel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        return 'Fair';
    };

    const renderBeachItem = ({ item }) => {
        const suitabilityScore = item.suitability_score || 0;
        const suitabilityColor = getSuitabilityColor(suitabilityScore);
        const suitabilityLabel = getSuitabilityLabel(suitabilityScore);

        return (
            <TouchableOpacity
                style={styles.beachCard}
                onPress={() => navigation.navigate('BeachDetails', { beach: item })}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardImageContainer}>
                        <Text style={styles.cardImage}>🏖️</Text>
                    </View>
                    <View style={styles.cardContent}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.beachName}>{item.name || 'Unknown Beach'}</Text>
                            <View style={[styles.suitabilityBadge, { backgroundColor: suitabilityColor + '20' }]}>
                                <Text style={[styles.suitabilityText, { color: suitabilityColor }]}>
                                    {suitabilityLabel}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.beachState}>
                            <Ionicons name="location" size={12} color="#666" /> {item.state || 'India'}
                        </Text>
                        {item.description && (
                            <Text style={styles.beachDescription} numberOfLines={2}>
                                {item.description}
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreLabel}>Suitability</Text>
                        <Text style={[styles.scoreValue, { color: suitabilityColor }]}>
                            {suitabilityScore.toFixed(0)}%
                        </Text>
                    </View>
                    <View style={styles.metaRow}>
                        {item.crowd_level && (
                            <View style={styles.metaItem}>
                                <Ionicons 
                                    name="people" 
                                    size={14} 
                                    color={item.crowd_level === 'low' ? '#4CAF50' : item.crowd_level === 'moderate' ? '#FF9800' : '#F44336'} 
                                />
                                <Text style={styles.metaText}>
                                    {item.crowd_level.charAt(0).toUpperCase() + item.crowd_level.slice(1)}
                                </Text>
                            </View>
                        )}
                        {item.cleanliness_score !== undefined && (
                            <View style={styles.metaItem}>
                                <Ionicons name="star" size={14} color="#FFD700" />
                                <Text style={styles.metaText}>
                                    Clean: {item.cleanliness_score.toFixed(0)}%
                                </Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity style={styles.viewButton}>
                        <Text style={styles.viewButtonText}>View Details →</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && beaches.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0288D1" />
                <Text style={styles.loadingText}>Loading beaches...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🏝️ Explore Beaches</Text>
                <Text style={styles.subtitle}>Discover the best beaches across India</Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search beaches, states..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Filter by State:</Text>
                <View style={styles.filterButtons}>
                    <TouchableOpacity
                        style={[styles.filterButton, !filterState && styles.filterButtonActive]}
                        onPress={() => {
                            setFilterState('');
                            loadBeaches();
                        }}
                    >
                        <Text style={[styles.filterButtonText, !filterState && styles.filterButtonTextActive]}>
                            All
                        </Text>
                    </TouchableOpacity>
                    {['Goa', 'Kerala', 'Tamil Nadu', 'Andaman'].map((state) => (
                        <TouchableOpacity
                            key={state}
                            style={[styles.filterButton, filterState === state && styles.filterButtonActive]}
                            onPress={() => {
                                setFilterState(state);
                                loadBeaches();
                            }}
                        >
                            <Text style={[styles.filterButtonText, filterState === state && styles.filterButtonTextActive]}>
                                {state}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <Text style={styles.resultCount}>
                {filteredBeaches.length} {filteredBeaches.length === 1 ? 'beach' : 'beaches'} found
            </Text>

            <FlatList
                data={filteredBeaches}
                renderItem={renderBeachItem}
                keyExtractor={(item) => item._id?.toString() || item.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0288D1" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}>🏖️</Text>
                        <Text style={styles.emptyText}>No beaches found</Text>
                        <Text style={styles.emptySubtext}>
                            {searchQuery ? 'Try a different search term' : 'Pull down to refresh'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        paddingTop: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 16,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        paddingTop: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 15,
        marginBottom: 10,
        paddingHorizontal: 15,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        height: 50,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchBar: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    filterContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginBottom: 10,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    filterButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    filterButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    filterButtonActive: {
        backgroundColor: '#0288D1',
        borderColor: '#0288D1',
    },
    filterButtonText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    filterButtonTextActive: {
        color: '#FFFFFF',
    },
    resultCount: {
        marginHorizontal: 20,
        fontSize: 12,
        color: '#999',
        marginBottom: 10,
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    beachCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    cardImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardImage: {
        fontSize: 30,
    },
    cardContent: {
        flex: 1,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    beachName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#01579B',
        flex: 1,
    },
    suitabilityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    suitabilityText: {
        fontSize: 11,
        fontWeight: '600',
    },
    beachState: {
        fontSize: 13,
        color: '#666',
        marginBottom: 6,
    },
    beachDescription: {
        fontSize: 13,
        color: '#888',
        lineHeight: 18,
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
        marginTop: 8,
    },
    scoreContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    scoreLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    metaRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 12,
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
    viewButton: {
        alignSelf: 'flex-end',
    },
    viewButtonText: {
        color: '#0288D1',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
    },
});
