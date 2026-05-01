    import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { beachesAPI } from '../services/api';

    export default function BeachListScreen({ navigation }) {
        const [searchQuery, setSearchQuery] = useState('');
        const [debouncedQuery, setDebouncedQuery] = useState('');
        const [beaches, setBeaches] = useState([]);
        const [loading, setLoading] = useState(true);
        const [refreshing, setRefreshing] = useState(false);
        const [filterState, setFilterState] = useState('');
        const [page, setPage] = useState(1);
        const [nextPageUrl, setNextPageUrl] = useState(null);
        const [loadingMore, setLoadingMore] = useState(false);

        useEffect(() => {
            // load first page (reset) when component mounts or filters/search change
            loadBeaches({ reset: true });
        }, [debouncedQuery, filterState]);

        // Debounce search input (increase from 500ms to 1000ms)
        useEffect(() => {
            const t = setTimeout(() => setDebouncedQuery(searchQuery), 1000);
            return () => clearTimeout(t);
        }, [searchQuery]);

        const loadBeaches = async ({ reset = false, loadMore = false } = {}) => {
            try {
                if (reset) {
                    setLoading(true);
                    setPage(1);
                    setNextPageUrl(null);
                }
                if (loadMore) setLoadingMore(true);

                const params = {};
                if (filterState) params.state = filterState;
                if (debouncedQuery) params.search = debouncedQuery;

                // Determine page to request
                const requestPage = loadMore ? page + 1 : 1;
                params.page = requestPage;

                const data = await beachesAPI.getAll(params, false);

                // Data expected to be paginated object: { results: [], next: url }
                const results = Array.isArray(data) ? data : data.results || [];
                const next = data.next || null;

                if (reset) {
                    setBeaches(results);
                    setPage(1);
                } else if (loadMore) {
                    setBeaches(prev => [...prev, ...results]);
                    setPage(requestPage);
                } else {
                    setBeaches(results);
                    setPage(1);
                }

                setNextPageUrl(next);
            } catch (error) {
                console.error('Error loading beaches:', error);
                // If network error, show alert. For expected server/client errors, just fallback to empty list.
                if (!error.response) {
                    Alert.alert('Error', 'Network error loading beaches. Please check your connection.');
                }
                if (reset) setBeaches([]);
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        };

        const onRefresh = async () => {
            setRefreshing(true);
            await loadBeaches({ reset: true });
            setRefreshing(false);
        };

        // Since we query server-side with `search`, filteredBeaches is just beaches
        const filteredBeaches = beaches;

        const getSuitabilityColor = (score) => {
            if (score >= 80) return '#10B981';
            if (score >= 60) return '#F59E0B';
            return '#EF4444';
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
                    activeOpacity={0.8}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.cardImageContainer}>
                            <Text style={styles.cardImage}>🏖️</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                            <View style={styles.cardTitleRow}>
                                <Text style={styles.beachName} numberOfLines={1}>
                                    {item.name || 'Unknown Beach'}
                                </Text>

                                <View
                                    style={[
                                        styles.suitabilityBadge,
                                        { backgroundColor: suitabilityColor + '20' }
                                    ]}
                                >
                                    <Text style={[styles.suitabilityText, { color: suitabilityColor }]}>
                                        {suitabilityLabel}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.locationRow}>
                                <Ionicons name="location-sharp" size={12} color="#64748B" />
                                <Text style={styles.beachState}>
                                    {item.state || 'India'}
                                </Text>
                            </View>

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
                                {(suitabilityScore ?? 0).toFixed(0)}%
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        };

        const headerRef = useRef(null);
        const renderHeader = (
            <View ref={headerRef}>
                <View style={styles.header}>
                    <Text style={styles.title}>🏝️ Explore Beaches</Text>
                    <Text style={styles.subtitle}>
                        Discover the best beaches across India
                    </Text>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color="#94A3B8" />
                    <TextInput
                        style={styles.searchBar}
                        placeholder="Search beaches..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCorrect={false}
                        blurOnSubmit={false}
                    />
                </View>
            </View>
        );

        if (loading && beaches.length === 0) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0891B2" />
                    <Text style={styles.loadingText}>Loading beaches...</Text>
                </View>
            );
        }

        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <FlatList
                    data={filteredBeaches}
                    renderItem={renderBeachItem}
                    keyExtractor={(item, index) =>
                        item._id?.toString() ||
                        item.id?.toString() ||
                        index.toString()
                    }
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingBottom: 30,
                        flexGrow: 1,   // 🔥 IMPORTANT FIX FOR ANDROID SCROLL
                    }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#0891B2']}
                        />
                    }
                    onEndReachedThreshold={0.5}
                    onEndReached={() => {
                        if (!loadingMore && nextPageUrl) {
                            loadBeaches({ loadMore: true });
                        }
                    }}
                    ListFooterComponent={() => (
                        loadingMore ? (
                            <View style={{ paddingVertical: 16 }}>
                                <ActivityIndicator size="small" color="#0891B2" />
                            </View>
                        ) : null
                    )}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="always"
                />
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
        },
        loadingText: {
            marginTop: 10,
            color: '#0891B2',
            fontWeight: '600',
        },
        header: {
            paddingVertical: 15,
        },
        title: {
            fontSize: 26,
            fontWeight: '800',
            color: '#0C4A6E',
        },
        subtitle: {
            fontSize: 13,
            color: '#64748B',
        },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#fff',
            paddingHorizontal: 12,
            height: 45,
            borderRadius: 12,
            marginVertical: 10,
            borderWidth: 1,
            borderColor: '#E2E8F0',
        
        },
        searchBar: {
            flex: 1,
            marginLeft: 8,
        },
        beachCard: {
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 14,
            marginBottom: 10,
            elevation: 2,
        },
        cardHeader: {
            flexDirection: 'row',
        },
        cardImageContainer: {
            width: 50,
            height: 50,
            borderRadius: 12,
            backgroundColor: '#E0F2FE',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
        },
        cardImage: {
            fontSize: 24,
        },
        cardTitleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        beachName: {
            fontSize: 16,
            fontWeight: '700',
            color: '#0C4A6E',
            flex: 1,
        },
        suitabilityBadge: {
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 10,
            marginLeft: 8,
        },
        suitabilityText: {
            fontSize: 11,
            fontWeight: '700',
        },
        locationRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4,
        },
        beachState: {
            fontSize: 12,
            marginLeft: 4,
            color: '#64748B',
        },
        beachDescription: {
            fontSize: 12,
            color: '#78909C',
            marginTop: 4,
        },
        cardFooter: {
            marginTop: 10,
        },
        scoreContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        scoreLabel: {
            fontSize: 12,
            color: '#64748B',
        },
        scoreValue: {
            fontSize: 18,
            fontWeight: '800',
        },
    });