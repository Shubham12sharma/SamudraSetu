    import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
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
                Alert.alert('Error', 'Failed to load beaches.');
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

            // Support multi-word search: all words must match somewhere in the object
            const words = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
            return beaches.filter(beach => {
                const values = Object.values(beach)
                    .filter(v => typeof v === 'string')
                    .map(v => v.toLowerCase());
                // Every word must be found in at least one value
                return words.every(word => values.some(val => val.includes(word)));
            });
        }, [beaches, searchQuery]);

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
                                {suitabilityScore.toFixed(0)}%
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        };

        const renderHeader = () => (
            <View>
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
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
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