import * as Location from 'expo-location';
import Fuse from 'fuse.js';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    cvAPI,
    externalWeatherAPI,
    sentimentAPI,
    weatherAPI,
} from '../services/api';

// ────────────────────────────────────────────────
// Static India Beaches (fallback / demo data)
// ────────────────────────────────────────────────
const INDIA_BEACHES = [
    { id: 'juhu-beach', name: 'Juhu Beach', state: 'Maharashtra', city: 'Mumbai', latitude: 19.1136, longitude: 72.8261 },
    { id: 'marine-drive', name: 'Marine Drive', state: 'Maharashtra', city: 'Mumbai', latitude: 18.9432, longitude: 72.8236 },
    { id: 'aksa-beach', name: 'Aksa Beach', state: 'Maharashtra', city: 'Mumbai', latitude: 19.2089, longitude: 72.7939 },
    { id: 'gorai-beach', name: 'Gorai Beach', state: 'Maharashtra', city: 'Mumbai', latitude: 19.2486, longitude: 72.7903 },
    { id: 'baga-beach', name: 'Baga Beach', state: 'Goa', city: 'North Goa', latitude: 15.5431, longitude: 73.7573 },
    { id: 'calangute-beach', name: 'Calangute Beach', state: 'Goa', city: 'North Goa', latitude: 15.5485, longitude: 73.7669 },
    { id: 'palolem-beach', name: 'Palolem Beach', state: 'Goa', city: 'South Goa', latitude: 14.0275, longitude: 73.9725 },
    { id: 'varkala-beach', name: 'Varkala Beach', state: 'Kerala', city: 'Varkala', latitude: 8.7339, longitude: 76.7273 },
    { id: 'kovalam-beach', name: 'Kovalam Beach', state: 'Kerala', city: 'Trivandrum', latitude: 8.3842, longitude: 76.9754 },
    { id: 'marina-beach', name: 'Marina Beach', state: 'Tamil Nadu', city: 'Chennai', latitude: 13.0499, longitude: 80.2823 },
    // ... add more as needed
];

// ────────────────────────────────────────────────
// Haversine Distance
// ────────────────────────────────────────────────
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export default function LiveWeatherScreen({ navigation }) {
    const [query, setQuery] = useState('');
    const [allBeaches] = useState(INDIA_BEACHES);
    const [nearbyBeaches, setNearbyBeaches] = useState([]);
    const [filtered, setFiltered] = useState(INDIA_BEACHES.slice(0, 12));

    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState(null);

    const [selected, setSelected] = useState(null);
    const [weather, setWeather] = useState(null);
    const [vibe, setVibe] = useState(null);
    const [condition, setCondition] = useState(null);

    const slideAnim = useRef(new Animated.Value(0)).current;

    // Safe navigation helper (same behavior as in HomeScreen)
    const navigateToBeaches = (opts) => {
        try {
            const parent = navigation.getParent?.();
            if (parent && typeof parent.navigate === 'function') {
                parent.navigate('Beaches', opts || {});
                return;
            }
        } catch (e) {}

        if (opts?.screen) {
            navigation.navigate(opts.screen, opts.params);
        } else {
            navigateToBeaches();
        }
    };

    // ────────────────────────────────────────────────
    // Fuse.js for fuzzy search
    // ────────────────────────────────────────────────
    const fuseOptions = {
        keys: ['name', 'city', 'state'],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
    };

    // ────────────────────────────────────────────────
    // Get user location + nearby beaches
    // ────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            setLocationLoading(true);
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setLocationError('Location permission denied');
                    return;
                }

                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                    timeout: 12000,
                });

                setUserLocation(loc.coords);

                // Calculate nearby from static list
                const nearby = INDIA_BEACHES
                    .map(b => ({
                        ...b,
                        distance: getDistance(
                            loc.coords.latitude,
                            loc.coords.longitude,
                            b.latitude,
                            b.longitude
                        ),
                    }))
                    .filter(b => b.distance <= 150)
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 10);

                setNearbyBeaches(nearby);
                setFiltered(nearby.length > 0 ? nearby : INDIA_BEACHES.slice(0, 12));
            } catch (err) {
                setLocationError('Could not get location');
            } finally {
                setLocationLoading(false);
            }
        })();
    }, []);

    // ────────────────────────────────────────────────
    // Filter logic (nearby when empty, fuzzy when typing)
    // ────────────────────────────────────────────────
    useEffect(() => {
        if (!query.trim()) {
            setFiltered(nearbyBeaches.length > 0 ? nearbyBeaches : INDIA_BEACHES.slice(0, 12));
            return;
        }

        const fuse = new Fuse(allBeaches, fuseOptions);
        const results = fuse.search(query.trim());
        setFiltered(results.map(r => r.item));
    }, [query, allBeaches, nearbyBeaches]);

    // ────────────────────────────────────────────────
    // Animate details panel in
    // ────────────────────────────────────────────────
    useEffect(() => {
        if (selected) {
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
            }).start();
        }
    }, [selected]);

    // ────────────────────────────────────────────────
    // Fetch live weather + vibe + condition
    // ────────────────────────────────────────────────
    const fetchDetails = async (beach) => {
        setSelected(beach);
        setWeather(null);
        setVibe(null);
        setCondition(null);

        const lat = beach.latitude;
        const lon = beach.longitude;

        if (!lat || !lon) return;

        // Weather
        try {
            let w = await weatherAPI.getWeather(lat, lon).catch(() => null);
            w = w?.data || w;

            if (!w?.temperature) {
                const ow = await externalWeatherAPI.openWeatherOneCall(lat, lon).catch(() => null);
                if (ow?.current) {
                    w = { temperature: ow.current.temp, condition: ow.current.weather?.[0]?.description };
                }
            }
            setWeather(w);
        } catch { }

        // Vibe & Condition (use your real backend IDs if available)
        const id = beach.id;
        if (id) {
            try { setVibe(await sentimentAPI.getBeachVibe(id).catch(() => null)); } catch { }
            try { setCondition(await cvAPI.getConditionStatus(id).catch(() => null)); } catch { }
        }
    };

    // ────────────────────────────────────────────────
    // Render single beach row
    // ────────────────────────────────────────────────
    const renderBeach = ({ item }) => (
        <TouchableOpacity
            style={[styles.beachCard, item.distance && styles.nearbyCard]}
                onPress={() => {
                    // If LiveWeather is outside the Beaches stack, navigate into Beaches and open BeachDetails
                    navigateToBeaches({ screen: 'BeachDetails', params: { beach: item } });
                }}
        >
            <View style={styles.beachInfo}>
                <Text style={styles.beachName}>{item.name}</Text>
                <Text style={styles.beachLocation}>
                    {item.city}, {item.state}
                    {item.distance && ` • ${item.distance.toFixed(1)} km`}
                </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
    );

    const closeDetails = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setSelected(null));
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Live Beach Weather</Text>
                <Text style={styles.subtitle}>
                    {locationLoading ? 'Getting location...' : 'Find beaches & live info'}
                </Text>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search beaches (Juhu, Baga, Kovalam...)"
                    value={query}
                    onChangeText={setQuery}
                    placeholderTextColor="#94A3B8"
                />
            </View>

            {/* Loading / Error */}
            {locationLoading && (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color="#0288D1" />
                </View>
            )}

            {locationError && !locationLoading && (
                <Text style={styles.errorText}>{locationError}</Text>
            )}

            {/* Beach List */}
            {!locationLoading && (
                <FlatList
                    data={filtered}
                    renderItem={renderBeach}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            {query ? `No beach found for "${query}"` : 'No nearby beaches found'}
                        </Text>
                    }
                />
            )}

            {/* Animated Details Panel */}
            {selected && (
                <Animated.View
                    style={[
                        styles.detailsPanel,
                        {
                            transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }],
                        },
                    ]}
                >
                    <View style={styles.detailsHeader}>
                        <Text style={styles.detailsTitle}>{selected.name}</Text>
                        <TouchableOpacity onPress={closeDetails} style={styles.closeBtn}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.detailsLocation}>
                        📍 {selected.city}, {selected.state}
                        {selected.distance && ` • ${selected.distance.toFixed(1)} km away`}
                    </Text>

                    {/* Weather */}
                    <View style={styles.weatherCard}>
                        <Text style={styles.sectionLabel}>Current Weather</Text>
                        <Text style={styles.weatherTemp}>
                            {weather ? `${weather.temperature ?? '--'}°C` : '--'}
                        </Text>
                        <Text style={styles.weatherDesc}>
                            {weather?.condition || 'Loading...'}
                        </Text>
                    </View>

                    {/* Vibe */}
                    <View style={styles.infoCard}>
                        <Text style={styles.sectionLabel}>Beach Vibe</Text>
                        <Text style={styles.infoValue}>
                            {vibe?.vibe || vibe?.summary || '—'}
                        </Text>
                    </View>

                    {/* Condition */}
                    <View style={styles.infoCard}>
                        <Text style={styles.sectionLabel}>Water Condition</Text>
                        <Text style={styles.infoValue}>
                            {condition?.status || condition?.condition || '—'}
                        </Text>
                    </View>

                    {/* Actions */}
                    <TouchableOpacity
                        style={styles.fullDetailsBtn}
                        onPress={() => navigateToBeaches({ screen: 'BeachDetails', params: { beach: selected } })}
                    >
                        <Text style={styles.fullDetailsText}>View Full Details →</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </SafeAreaView>
    );
}

// ────────────────────────────────────────────────
// STYLES ─ matching your previous light/cyan theme
// ────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FBFC',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#0277BD',
    },
    subtitle: {
        fontSize: 14,
        color: '#616161',
        marginTop: 4,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    searchInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        color: '#212121',
    },
    centerLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#D32F2F',
        textAlign: 'center',
        margin: 16,
        fontSize: 15,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100, // space for details panel
    },
    beachCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    nearbyCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    beachInfo: {
        flex: 1,
    },
    beachName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#212121',
    },
    beachLocation: {
        fontSize: 13,
        color: '#757575',
        marginTop: 4,
    },
    arrow: {
        fontSize: 20,
        color: '#0288D1',
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        color: '#9E9E9E',
        fontSize: 16,
        marginTop: 60,
    },

    // ─── Details Panel ───
    detailsPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 20,
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 8,
    },
    detailsTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0277BD',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIcon: {
        fontSize: 20,
        color: '#616161',
        fontWeight: 'bold',
    },
    detailsLocation: {
        fontSize: 14,
        color: '#424242',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    weatherCard: {
        backgroundColor: '#E3F2FD',
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
    },
    sectionLabel: {
        fontSize: 14,
        color: '#616161',
        marginBottom: 6,
        fontWeight: '500',
    },
    weatherTemp: {
        fontSize: 32,
        fontWeight: '700',
        color: '#0277BD',
    },
    weatherDesc: {
        fontSize: 15,
        color: '#424242',
        marginTop: 4,
    },
    infoCard: {
        backgroundColor: '#F5F5F5',
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
    },
    infoValue: {
        fontSize: 16,
        color: '#212121',
        fontWeight: '500',
    },
    fullDetailsBtn: {
        backgroundColor: '#0288D1',
        marginHorizontal: 20,
        marginVertical: 16,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    fullDetailsText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});