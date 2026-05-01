import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { beachesAPI, ecoImpactAPI } from '../services/api';

export default function EcoImpactScreen({ navigation, route }) {
    const [beaches, setBeaches] = useState([]);
    const [beachesLoading, setBeachesLoading] = useState(false);
    const [modalSearch, setModalSearch] = useState('');
    const [modalDebounced, setModalDebounced] = useState('');
    const [selectedBeach, setSelectedBeach] = useState(null);
    const [selectedBeaches, setSelectedBeaches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [impactResult, setImpactResult] = useState(null);
    const [comparisonResult, setComparisonResult] = useState(null);
    const [showBeachSelector, setShowBeachSelector] = useState(false);
    const [showItinerarySelector, setShowItinerarySelector] = useState(false);
    const [activeTab, setActiveTab] = useState('single'); // 'single', 'compare', 'itinerary'

    // Location states
    const [originLat, setOriginLat] = useState('');
    const [originLon, setOriginLon] = useState('');
    const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    // Impact parameters
    const [parameters, setParameters] = useState({
        transport_mode: 'car',
        passengers: 1,
        duration_days: 1,
        number_of_people: 1
    });

    // Itinerary parameters
    const [itineraryParams, setItineraryParams] = useState({
        transport_mode: 'car',
        passengers: 1,
        duration_per_beach_days: 1,
        number_of_people: 1
    });

    useEffect(() => {
        loadBeaches();

        // If beach is passed from navigation
        if (route?.params?.beachId) {
            loadSpecificBeach(route.params.beachId);
        }

        // Request location permission
        requestLocationPermission();
    }, []);

    const DEBOUNCE_MS = 800;
    useEffect(() => {
        const t = setTimeout(() => setModalDebounced(modalSearch), DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [modalSearch]);

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Location permission is needed to calculate travel distance');
            return false;
        }
        return true;
    };

    const getCurrentLocation = async () => {
        setLocationLoading(true);
        try {
            const hasPermission = await requestLocationPermission();
            if (!hasPermission) return;

            const location = await Location.getCurrentPositionAsync({});
            setOriginLat(location.coords.latitude.toString());
            setOriginLon(location.coords.longitude.toString());
            setUsingCurrentLocation(true);
            Alert.alert('Success', 'Current location detected');
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'Failed to get current location');
        } finally {
            setLocationLoading(false);
        }
    };

    const loadBeaches = async () => {
        try {
            setLoading(true);
            setBeachesLoading(true);
            const beachesData = await beachesAPI.getAll({}, true);
            const beachesArray = Array.isArray(beachesData) ? beachesData : [];
            setBeaches(beachesArray);
        } catch (error) {
            console.error('Error loading beaches:', error);
            Alert.alert('Error', 'Failed to load beaches');
        } finally {
            setLoading(false);
            setBeachesLoading(false);
        }
    };

    const loadSpecificBeach = async (beachId) => {
        try {
            const beach = await beachesAPI.getById(beachId);
            setSelectedBeach(beach);
        } catch (error) {
            console.error('Error loading beach:', error);
        }
    };

    const calculateImpact = async () => {
        if (!originLat || !originLon) {
            Alert.alert('Missing Location', 'Please enter your origin coordinates or use current location');
            return;
        }

        if (!selectedBeach) {
            Alert.alert('No Beach Selected', 'Please select a beach');
            return;
        }

        setCalculating(true);
        try {
            const data = {
                origin_lat: parseFloat(originLat),
                origin_lon: parseFloat(originLon),
                beach_id: selectedBeach._id || selectedBeach.id,
                transport_mode: parameters.transport_mode,
                passengers: parameters.passengers,
                duration_days: parameters.duration_days,
                number_of_people: parameters.number_of_people
            };

            const result = await ecoImpactAPI.calculateImpact(data);
            setImpactResult(result);

            Alert.alert(
                'Impact Calculated',
                `Carbon Footprint: ${result.impact.total_carbon_emissions_kg} kg CO₂e`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error calculating impact:', error);
            Alert.alert('Error', 'Failed to calculate environmental impact');
        } finally {
            setCalculating(false);
        }
    };

    const compareTransportModes = async () => {
        if (!originLat || !originLon) {
            Alert.alert('Missing Location', 'Please enter your origin coordinates or use current location');
            return;
        }

        if (!selectedBeach) {
            Alert.alert('No Beach Selected', 'Please select a beach');
            return;
        }

        setCalculating(true);
        try {
            const data = {
                origin_lat: parseFloat(originLat),
                origin_lon: parseFloat(originLon),
                beach_id: selectedBeach._id || selectedBeach.id,
                passengers: parameters.passengers
            };

            const result = await ecoImpactAPI.compareTransportModes(data);
            setComparisonResult(result);
        } catch (error) {
            console.error('Error comparing transport modes:', error);
            Alert.alert('Error', 'Failed to compare transport modes');
        } finally {
            setCalculating(false);
        }
    };

    const calculateItineraryImpact = async () => {
        if (!originLat || !originLon) {
            Alert.alert('Missing Location', 'Please enter your origin coordinates or use current location');
            return;
        }

        if (selectedBeaches.length === 0) {
            Alert.alert('No Beaches Selected', 'Please select at least one beach for your itinerary');
            return;
        }

        setCalculating(true);
        try {
            const data = {
                origin_lat: parseFloat(originLat),
                origin_lon: parseFloat(originLon),
                beach_ids: selectedBeaches.map(b => b._id || b.id),
                transport_mode: itineraryParams.transport_mode,
                passengers: itineraryParams.passengers,
                duration_per_beach_days: itineraryParams.duration_per_beach_days,
                number_of_people: itineraryParams.number_of_people
            };

            const result = await ecoImpactAPI.calculateItineraryImpact(data);
            setImpactResult(result);

            Alert.alert(
                'Itinerary Impact Calculated',
                `Total Carbon Footprint: ${result.itinerary_impact.total_carbon_emissions_kg} kg CO₂e`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error calculating itinerary impact:', error);
            Alert.alert('Error', 'Failed to calculate itinerary environmental impact');
        } finally {
            setCalculating(false);
        }
    };

    const toggleBeachSelection = (beach) => {
        const isSelected = selectedBeaches.some(b => (b._id || b.id) === (beach._id || beach.id));
        if (isSelected) {
            setSelectedBeaches(selectedBeaches.filter(b => (b._id || b.id) !== (beach._id || beach.id)));
        } else {
            setSelectedBeaches([...selectedBeaches, beach]);
        }
    };

    const getEmissionColor = (emissions) => {
        if (emissions < 10) return '#4CAF50';
        if (emissions < 50) return '#FF9800';
        return '#F44336';
    };

    const getTransportIcon = (mode) => {
        switch (mode) {
            case 'walking': return '🚶';
            case 'bicycle': return '🚲';
            case 'public_transport': return '🚌';
            case 'car': return '🚗';
            case 'electric_car': return '🔌🚗';
            case 'train': return '🚆';
            default: return '🚗';
        }
    };

    const BeachSelectorModal = () => (
        <Modal
            visible={showBeachSelector}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowBeachSelector(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Beach</Text>
                        <TouchableOpacity onPress={() => setShowBeachSelector(false)}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.beachList}>
                        <View style={styles.modalSearchWrap}>
                            <Ionicons name="search" size={18} color="#94A3B8" />
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder="Search beaches..."
                                value={modalSearch}
                                onChangeText={setModalSearch}
                                autoCorrect={false}
                            />
                        </View>

                        {beachesLoading ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#0288D1" />
                                <Text style={{ marginTop: 12, color: '#666' }}>Loading beaches...</Text>
                            </View>
                        ) : (beaches && beaches.length > 0) ? (
                            beaches
                                .filter(b => {
                                    const q = (modalDebounced || '').trim().toLowerCase();
                                    if (!q) return true;
                                    return (b.name || '').toLowerCase().includes(q) || (b.state || '').toLowerCase().includes(q);
                                })
                                .map((beach) => (
                                    <TouchableOpacity
                                        key={beach._id || beach.id}
                                        style={styles.beachItem}
                                        onPress={() => {
                                            setSelectedBeach(beach);
                                            setShowBeachSelector(false);
                                            setImpactResult(null);
                                            setComparisonResult(null);
                                        }}
                                    >
                                        <View style={styles.beachItemContent}>
                                            <Text style={styles.beachItemName}>{beach.name}</Text>
                                            <Text style={styles.beachItemLocation}>{beach.state}</Text>
                                        </View>
                                        {selectedBeach?._id === (beach._id || beach.id) && (
                                            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                                        )}
                                    </TouchableOpacity>
                                ))
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: '#666' }}>No beaches available. Check your connection.</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const ItineraryBeachSelectorModal = () => (
        <Modal
            visible={showItinerarySelector}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowItinerarySelector(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Beaches for Itinerary</Text>
                        <TouchableOpacity onPress={() => setShowItinerarySelector(false)}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.beachList}>
                        <View style={styles.modalSearchWrap}>
                            <Ionicons name="search" size={18} color="#94A3B8" />
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder="Search beaches..."
                                value={modalSearch}
                                onChangeText={setModalSearch}
                                autoCorrect={false}
                            />
                        </View>

                        {beachesLoading ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#0288D1" />
                                <Text style={{ marginTop: 12, color: '#666' }}>Loading beaches...</Text>
                            </View>
                        ) : (beaches && beaches.length > 0) ? (
                            beaches
                                .filter(b => {
                                    const q = (modalDebounced || '').trim().toLowerCase();
                                    if (!q) return true;
                                    return (b.name || '').toLowerCase().includes(q) || (b.state || '').toLowerCase().includes(q);
                                })
                                .map((beach) => {
                                    const isSelected = selectedBeaches.some(b => (b._id || b.id) === (beach._id || beach.id));
                                    return (
                                        <TouchableOpacity
                                            key={beach._id || beach.id}
                                            style={[styles.beachItem, isSelected && styles.selectedBeachItem]}
                                            onPress={() => toggleBeachSelection(beach)}
                                        >
                                            <View style={styles.beachItemContent}>
                                                <Text style={styles.beachItemName}>{beach.name}</Text>
                                                <Text style={styles.beachItemLocation}>{beach.state}</Text>
                                            </View>
                                            {isSelected && (
                                                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: '#666' }}>No beaches available. Check your connection.</Text>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <Text style={styles.selectedCount}>
                            Selected: {selectedBeaches.length} beaches
                        </Text>
                        <TouchableOpacity
                            style={styles.doneButton}
                            onPress={() => setShowItinerarySelector(false)}
                        >
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderSingleTab = () => (
        <View>
            {/* Location Input */}
            <View style={styles.locationSection}>
                <Text style={styles.sectionTitle}>📍 Your Location</Text>
                <TouchableOpacity
                    style={styles.currentLocationButton}
                    onPress={getCurrentLocation}
                    disabled={locationLoading}
                >
                    {locationLoading ? (
                        <ActivityIndicator size="small" color="#0288D1" />
                    ) : (
                        <>
                            <Ionicons name="locate" size={20} color="#0288D1" />
                            <Text style={styles.currentLocationText}>Use Current Location</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.coordinatesContainer}>
                    <TextInput
                        style={[styles.coordinateInput, styles.latitudeInput]}
                        placeholder="Latitude"
                        value={originLat}
                        onChangeText={setOriginLat}
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={[styles.coordinateInput, styles.longitudeInput]}
                        placeholder="Longitude"
                        value={originLon}
                        onChangeText={setOriginLon}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Beach Selection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏖️ Destination Beach</Text>
                <TouchableOpacity
                    style={styles.beachSelector}
                    onPress={() => setShowBeachSelector(true)}
                >
                    {selectedBeach ? (
                        <View>
                            <Text style={styles.selectedBeachName}>{selectedBeach.name}</Text>
                            <Text style={styles.selectedBeachLocation}>{selectedBeach.state}</Text>
                        </View>
                    ) : (
                        <Text style={styles.placeholderText}>Tap to select a beach</Text>
                    )}
                    <Ionicons name="chevron-down" size={24} color="#0288D1" />
                </TouchableOpacity>
            </View>

            {/* Impact Parameters */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚙️ Trip Parameters</Text>

                <View style={styles.parameterCard}>
                    <View style={styles.parameterHeader}>
                        <Ionicons name="car" size={20} color="#FF9800" />
                        <Text style={styles.parameterLabel}>Transport Mode</Text>
                    </View>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={parameters.transport_mode}
                            onValueChange={(value) => setParameters({ ...parameters, transport_mode: value })}
                            style={styles.picker}
                        >
                            <Picker.Item label="🚗 Car" value="car" />
                            <Picker.Item label="🔌 Electric Car" value="electric_car" />
                            <Picker.Item label="🚌 Public Transport" value="public_transport" />
                            <Picker.Item label="🚲 Bicycle" value="bicycle" />
                            <Picker.Item label="🚶 Walking" value="walking" />
                            <Picker.Item label="🚆 Train" value="train" />
                        </Picker>
                    </View>
                </View>

                <View style={styles.parameterCard}>
                    <View style={styles.parameterHeader}>
                        <Ionicons name="people" size={20} color="#2196F3" />
                        <Text style={styles.parameterLabel}>Number of People</Text>
                    </View>
                    <TextInput
                        style={styles.parameterInput}
                        value={String(parameters.number_of_people)}
                        onChangeText={(text) => setParameters({ ...parameters, number_of_people: parseInt(text) || 1 })}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.parameterCard}>
                    <View style={styles.parameterHeader}>
                        <Ionicons name="time" size={20} color="#9C27B0" />
                        <Text style={styles.parameterLabel}>Duration (Days)</Text>
                    </View>
                    <TextInput
                        style={styles.parameterInput}
                        value={String(parameters.duration_days)}
                        onChangeText={(text) => setParameters({ ...parameters, duration_days: parseFloat(text) || 1 })}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.parameterCard}>
                    <View style={styles.parameterHeader}>
                        <Ionicons name="car" size={20} color="#4CAF50" />
                        <Text style={styles.parameterLabel}>Passengers in Vehicle</Text>
                    </View>
                    <TextInput
                        style={styles.parameterInput}
                        value={String(parameters.passengers)}
                        onChangeText={(text) => setParameters({ ...parameters, passengers: parseInt(text) || 1 })}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Calculate Button */}
            <TouchableOpacity
                style={[styles.calculateButton, (!originLat || !originLon || !selectedBeach || calculating) && styles.calculateButtonDisabled]}
                onPress={calculateImpact}
                disabled={!originLat || !originLon || !selectedBeach || calculating}
            >
                {calculating ? (
                    <ActivityIndicator size="small" color="#FFF" />
                ) : (
                    <>
                        <Ionicons name="leaf" size={24} color="#FFF" />
                        <Text style={styles.calculateButtonText}>Calculate Environmental Impact</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderCompareTab = () => (
        <View>
            {/* Location Input */}
            <View style={styles.locationSection}>
                <Text style={styles.sectionTitle}>📍 Your Location</Text>
                <TouchableOpacity
                    style={styles.currentLocationButton}
                    onPress={getCurrentLocation}
                    disabled={locationLoading}
                >
                    {locationLoading ? (
                        <ActivityIndicator size="small" color="#0288D1" />
                    ) : (
                        <>
                            <Ionicons name="locate" size={20} color="#0288D1" />
                            <Text style={styles.currentLocationText}>Use Current Location</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.coordinatesContainer}>
                    <TextInput
                        style={[styles.coordinateInput, styles.latitudeInput]}
                        placeholder="Latitude"
                        value={originLat}
                        onChangeText={setOriginLat}
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={[styles.coordinateInput, styles.longitudeInput]}
                        placeholder="Longitude"
                        value={originLon}
                        onChangeText={setOriginLon}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Beach Selection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏖️ Destination Beach</Text>
                <TouchableOpacity
                    style={styles.beachSelector}
                    onPress={() => setShowBeachSelector(true)}
                >
                    {selectedBeach ? (
                        <View>
                            <Text style={styles.selectedBeachName}>{selectedBeach.name}</Text>
                            <Text style={styles.selectedBeachLocation}>{selectedBeach.state}</Text>
                        </View>
                    ) : (
                        <Text style={styles.placeholderText}>Tap to select a beach</Text>
                    )}
                    <Ionicons name="chevron-down" size={24} color="#0288D1" />
                </TouchableOpacity>
            </View>

            {/* Compare Button */}
            <TouchableOpacity
                style={[styles.compareButton, (!originLat || !originLon || !selectedBeach || calculating) && styles.compareButtonDisabled]}
                onPress={compareTransportModes}
                disabled={!originLat || !originLon || !selectedBeach || calculating}
            >
                {calculating ? (
                    <ActivityIndicator size="small" color="#FFF" />
                ) : (
                    <>
                        <Ionicons name="swap-horizontal" size={24} color="#FFF" />
                        <Text style={styles.compareButtonText}>Compare Transport Modes</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* Comparison Results */}
            {comparisonResult && (
                <View style={styles.comparisonResults}>
                    <Text style={styles.resultsTitle}>🚗 Transport Mode Comparison</Text>
                    <Text style={styles.distanceInfo}>
                        Distance: {comparisonResult.distance_km} km
                    </Text>

                    {Array.isArray(comparisonResult.transport_comparisons) &&
                        comparisonResult.transport_comparisons.map((mode, index) => (
                            <View key={index} style={styles.comparisonCard}>
                                <View style={styles.comparisonHeader}>
                                    <Text style={styles.comparisonEmoji}>{getTransportIcon(mode.mode)}</Text>
                                    <Text style={styles.comparisonMode}>
                                        {mode.mode.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                    </Text>
                                    <Text style={[styles.comparisonEmissions, { color: getEmissionColor(mode.emissions_kg) }]}> 
                                        {mode.emissions_kg} kg CO₂e
                                    </Text>
                                </View>
                                <View style={styles.comparisonDetails}>
                                    <Text style={styles.comparisonText}>⏱️ {mode.time_hours} hours</Text>
                                    <Text style={styles.comparisonText}>💸 ₹{mode.cost_estimate}</Text>
                                </View>
                                {index === 0 && (
                                    <View style={styles.recommendedBadge}>
                                        <Text style={styles.recommendedText}>Most Eco-Friendly</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    {(!comparisonResult.transport_comparisons || !Array.isArray(comparisonResult.transport_comparisons)) && (
                        <Text style={{textAlign:'center', color:'#999', marginTop:10}}>No transport comparison data available.</Text>
                    )}
                </View>
            )}
        </View>
    );

    const renderItineraryTab = () => (
        <View>
            {/* Location Input */}
            <View style={styles.locationSection}>
                <Text style={styles.sectionTitle}>📍 Starting Point</Text>
                <TouchableOpacity
                    style={styles.currentLocationButton}
                    onPress={getCurrentLocation}
                    disabled={locationLoading}
                >
                    {locationLoading ? (
                        <ActivityIndicator size="small" color="#0288D1" />
                    ) : (
                        <>
                            <Ionicons name="locate" size={20} color="#0288D1" />
                            <Text style={styles.currentLocationText}>Use Current Location</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.coordinatesContainer}>
                    <TextInput
                        style={[styles.coordinateInput, styles.latitudeInput]}
                        placeholder="Latitude"
                        value={originLat}
                        onChangeText={setOriginLat}
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={[styles.coordinateInput, styles.longitudeInput]}
                        placeholder="Longitude"
                        value={originLon}
                        onChangeText={setOriginLon}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Beach Selection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🗺️ Itinerary Beaches</Text>
                <TouchableOpacity
                    style={styles.beachSelector}
                    onPress={() => setShowItinerarySelector(true)}
                >
                    {selectedBeaches.length > 0 ? (
                        <Text style={styles.selectedBeachName}>
                            {selectedBeaches.length} beach{selectedBeaches.length !== 1 ? 'es' : ''} selected
                        </Text>
                    ) : (
                        <Text style={styles.placeholderText}>Tap to select beaches for your itinerary</Text>
                    )}
                    <Ionicons name="chevron-down" size={24} color="#0288D1" />
                </TouchableOpacity>

                {selectedBeaches.length > 0 && (
                    <View style={styles.selectedBeachesList}>
                        {selectedBeaches.map((beach, index) => (
                            <View key={beach._id || beach.id} style={styles.selectedBeachTag}>
                                <Text style={styles.selectedBeachTagText}>
                                    {index + 1}. {beach.name}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Itinerary Parameters */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚙️ Trip Parameters</Text>

                <View style={styles.parameterCard}>
                    <View style={styles.parameterHeader}>
                        <Ionicons name="car" size={20} color="#FF9800" />
                        <Text style={styles.parameterLabel}>Transport Mode</Text>
                    </View>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={itineraryParams.transport_mode}
                            onValueChange={(value) => setItineraryParams({ ...itineraryParams, transport_mode: value })}
                            style={styles.picker}
                        >
                            <Picker.Item label="🚗 Car" value="car" />
                            <Picker.Item label="🔌 Electric Car" value="electric_car" />
                            <Picker.Item label="🚌 Public Transport" value="public_transport" />
                            <Picker.Item label="🚲 Bicycle" value="bicycle" />
                            <Picker.Item label="🚶 Walking" value="walking" />
                            <Picker.Item label="🚆 Train" value="train" />
                        </Picker>
                    </View>
                </View>

                <View style={styles.parameterCard}>
                    <View style={styles.parameterHeader}>
                        <Ionicons name="people" size={20} color="#2196F3" />
                        <Text style={styles.parameterLabel}>Number of People</Text>
                    </View>
                    <TextInput
                        style={styles.parameterInput}
                        value={String(itineraryParams.number_of_people)}
                        onChangeText={(text) => setItineraryParams({ ...itineraryParams, number_of_people: parseInt(text) || 1 })}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.parameterCard}>
                    <View style={styles.parameterHeader}>
                        <Ionicons name="time" size={20} color="#9C27B0" />
                        <Text style={styles.parameterLabel}>Days per Beach</Text>
                    </View>
                    <TextInput
                        style={styles.parameterInput}
                        value={String(itineraryParams.duration_per_beach_days)}
                        onChangeText={(text) => setItineraryParams({ ...itineraryParams, duration_per_beach_days: parseFloat(text) || 1 })}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.parameterCard}>
                    <View style={styles.parameterHeader}>
                        <Ionicons name="car" size={20} color="#4CAF50" />
                        <Text style={styles.parameterLabel}>Passengers in Vehicle</Text>
                    </View>
                    <TextInput
                        style={styles.parameterInput}
                        value={String(itineraryParams.passengers)}
                        onChangeText={(text) => setItineraryParams({ ...itineraryParams, passengers: parseInt(text) || 1 })}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Calculate Button */}
            <TouchableOpacity
                style={[styles.calculateButton, (!originLat || !originLon || selectedBeaches.length === 0 || calculating) && styles.calculateButtonDisabled]}
                onPress={calculateItineraryImpact}
                disabled={!originLat || !originLon || selectedBeaches.length === 0 || calculating}
            >
                {calculating ? (
                    <ActivityIndicator size="small" color="#FFF" />
                ) : (
                    <>
                        <Ionicons name="map" size={24} color="#FFF" />
                        <Text style={styles.calculateButtonText}>Calculate Itinerary Impact</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderImpactResults = () => {
        if (!impactResult) return null;

        const impact = impactResult.impact || impactResult.itinerary_impact;
        const suggestions = impactResult.eco_suggestions;

        return (
            <View style={styles.resultsSection}>
                <Text style={styles.resultsTitle}>🌍 Environmental Impact Report</Text>

                {/* Carbon Footprint */}
                {impact && (
                    <>
                        <View style={styles.impactCard}>
                            <View style={styles.impactHeader}>
                                <Ionicons name="cloud" size={24} color="#F44336" />
                                <Text style={styles.impactTitle}>Carbon Footprint</Text>
                            </View>
                            <Text style={[styles.impactValue, { color: getEmissionColor(impact.total_carbon_emissions_kg) }]}>
                                {impact.total_carbon_emissions_kg} kg CO₂e
                            </Text>
                            <Text style={styles.impactDescription}>
                                Equivalent to {Math.round(impact.total_carbon_emissions_kg / 0.4)} km driven by car
                            </Text>
                        </View>

                        {/* Waste Generation */}
                        {impact.total_waste_kg && (
                            <View style={styles.impactCard}>
                                <View style={styles.impactHeader}>
                                    <Ionicons name="trash" size={24} color="#FF9800" />
                                    <Text style={styles.impactTitle}>Waste Generation</Text>
                                </View>
                                <Text style={styles.impactValue}>
                                    {impact.total_waste_kg} kg total waste
                                </Text>
                                <Text style={styles.impactDescription}>
                                    Including {impact.total_plastic_waste_kg} kg of plastic waste
                                </Text>
                            </View>
                        )}

                        {/* Travel Distance */}
                        {impact.total_distance_km && (
                            <View style={styles.impactCard}>
                                <View style={styles.impactHeader}>
                                    <Ionicons name="map" size={24} color="#2196F3" />
                                    <Text style={styles.impactTitle}>Travel Distance</Text>
                                </View>
                                <Text style={styles.impactValue}>
                                    {impact.total_distance_km} km
                                </Text>
                                <Text style={styles.impactDescription}>
                                    Total travel distance for your trip
                                </Text>
                            </View>
                        )}

                        {/* Trees Needed */}
                        {impact.trees_needed_to_offset && (
                            <View style={styles.impactCard}>
                                <View style={styles.impactHeader}>
                                    <Ionicons name="leaf" size={24} color="#4CAF50" />
                                    <Text style={styles.impactTitle}>Carbon Offset</Text>
                                </View>
                                <Text style={styles.impactValue}>
                                    {impact.trees_needed_to_offset} trees
                                </Text>
                                <Text style={styles.impactDescription}>
                                    Trees needed to offset your carbon footprint over one year
                                </Text>
                            </View>
                        )}

                        {/* Trip Stats */}
                        {impact.number_of_beaches && (
                            <View style={styles.impactCard}>
                                <View style={styles.impactHeader}>
                                    <Ionicons name="stats-chart" size={24} color="#9C27B0" />
                                    <Text style={styles.impactTitle}>Trip Statistics</Text>
                                </View>
                                <Text style={styles.impactDescription}>
                                    • Beaches visited: {impact.number_of_beaches}
                                </Text>
                                <Text style={styles.impactDescription}>
                                    • Total duration: {impact.total_duration_days} days
                                </Text>
                            </View>
                        )}
                    </>
                )}

                {/* Eco Suggestions */}
                {suggestions && suggestions.length > 0 && (
                    <View style={styles.suggestionsCard}>
                        <View style={styles.suggestionsHeader}>
                            <Ionicons name="bulb" size={24} color="#FFC107" />
                            <Text style={styles.suggestionsTitle}>Eco-Friendly Suggestions</Text>
                        </View>
                        {suggestions.map((suggestion, index) => (
                            <View key={index} style={styles.suggestionItem}>
                                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                <Text style={styles.suggestionText}>{typeof suggestion === 'object' ? (suggestion.message || JSON.stringify(suggestion)) : suggestion}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Eco Tips */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>💚 Eco-Tips for Beach Visits</Text>
                    <View style={styles.tipItem}>
                        <Ionicons name="water" size={18} color="#0288D1" />
                        <Text style={styles.tipText}>Bring reusable water bottles to reduce plastic waste</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="trash" size={18} color="#FF9800" />
                        <Text style={styles.tipText}>Take all trash with you - leave no trace</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="sunny" size={18} color="#FFC107" />
                        <Text style={styles.tipText}>Use reef-safe sunscreen to protect marine life</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="car" size={18} color="#4CAF50" />
                        <Text style={styles.tipText}>Carpool or use public transport to reduce emissions</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="leaf" size={18} color="#4CAF50" />
                        <Text style={styles.tipText}>Support local eco-friendly businesses and conservation efforts</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Eco Impact</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Tab Selector */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'single' && styles.activeTab]}
                        onPress={() => {
                            setActiveTab('single');
                            setImpactResult(null);
                            setComparisonResult(null);
                        }}
                    >
                        <Ionicons name="location" size={20} color={activeTab === 'single' ? '#FFF' : '#666'} />
                        <Text style={[styles.tabText, activeTab === 'single' && styles.activeTabText]}>
                            Single Beach
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'compare' && styles.activeTab]}
                        onPress={() => {
                            setActiveTab('compare');
                            setImpactResult(null);
                            setComparisonResult(null);
                        }}
                    >
                        <Ionicons name="swap-horizontal" size={20} color={activeTab === 'compare' ? '#FFF' : '#666'} />
                        <Text style={[styles.tabText, activeTab === 'compare' && styles.activeTabText]}>
                            Compare Modes
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'itinerary' && styles.activeTab]}
                        onPress={() => {
                            setActiveTab('itinerary');
                            setImpactResult(null);
                            setComparisonResult(null);
                        }}
                    >
                        <Ionicons name="map" size={20} color={activeTab === 'itinerary' ? '#FFF' : '#666'} />
                        <Text style={[styles.tabText, activeTab === 'itinerary' && styles.activeTabText]}>
                            Itinerary
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                    {activeTab === 'single' && renderSingleTab()}
                    {activeTab === 'compare' && renderCompareTab()}
                    {activeTab === 'itinerary' && renderItineraryTab()}
                </View>

                {/* Results */}
                {renderImpactResults()}

                {/* Bottom Padding */}
                <View style={{ height: 40 }} />
            </ScrollView>

            <BeachSelectorModal />
            <ItineraryBeachSelectorModal />
        </KeyboardAvoidingView>
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
        flexGrow: 1,
        paddingBottom: 30,
    },
    header: {
        backgroundColor: '#4CAF50',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    placeholder: {
        width: 34,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    activeTab: {
        backgroundColor: '#4CAF50',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#FFF',
    },
    tabContent: {
        marginHorizontal: 20,
        width: '100%',
    },
    locationSection: {
        marginBottom: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 12,
    },
    currentLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        gap: 8,
    },
    currentLocationText: {
        fontSize: 14,
        color: '#2E7D32',
        fontWeight: '600',
    },
    coordinatesContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    coordinateInput: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
    },
    latitudeInput: {
        flex: 1,
    },
    longitudeInput: {
        flex: 1,
    },
    beachSelector: {
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    selectedBeachName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    selectedBeachLocation: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    placeholderText: {
        fontSize: 14,
        color: '#999',
    },
    selectedBeachesList: {
        marginTop: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    selectedBeachTag: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    selectedBeachTagText: {
        fontSize: 12,
        color: '#2E7D32',
    },
    parameterCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    parameterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    parameterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    parameterInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    calculateButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 20,
    },
    calculateButtonDisabled: {
        backgroundColor: '#CCC',
    },
    calculateButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    compareButton: {
        backgroundColor: '#FF9800',
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 20,
    },
    compareButtonDisabled: {
        backgroundColor: '#CCC',
    },
    compareButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    comparisonResults: {
        marginTop: 10,
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 15,
    },
    distanceInfo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
        textAlign: 'center',
    },
    comparisonCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        elevation: 2,
        position: 'relative',
    },
    comparisonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    comparisonEmoji: {
        fontSize: 24,
    },
    comparisonMode: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    comparisonEmissions: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    comparisonDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    comparisonText: {
        fontSize: 12,
        color: '#666',
    },
    recommendedBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    recommendedText: {
        fontSize: 10,
        color: '#FFF',
        fontWeight: 'bold',
    },
    resultsSection: {
        marginHorizontal: 20,
        marginTop: 20,
    },
    impactCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        elevation: 2,
    },
    impactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    impactTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    impactValue: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    impactDescription: {
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },
    suggestionsCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        elevation: 2,
    },
    suggestionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15,
    },
    suggestionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF9800',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    suggestionText: {
        flex: 1,
        fontSize: 13,
        color: '#333',
        lineHeight: 18,
    },
    tipsCard: {
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 12,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        color: '#2E7D32',
        lineHeight: 18,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    selectedCount: {
        fontSize: 14,
        color: '#666',
    },
    doneButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    doneButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    beachList: {
        maxHeight: 400,
    },
    beachItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    selectedBeachItem: {
        backgroundColor: '#E8F5E9',
    },
    beachItemContent: {
        flex: 1,
    },
    beachItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    beachItemLocation: {
        fontSize: 12,
        color: '#666',
    },
});