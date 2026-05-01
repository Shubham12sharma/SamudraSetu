import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
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
import { beachesAPI, mlAPI } from '../services/api';

export default function MLPredictionScreen({ navigation, route }) {
    const [beaches, setBeaches] = useState([]);
    const [modalSearch, setModalSearch] = useState('');
    const [modalDebounced, setModalDebounced] = useState('');
    const [selectedBeach, setSelectedBeach] = useState(null);
    const [loading, setLoading] = useState(false);
    const [predicting, setPredicting] = useState(false);
    const [predictionResult, setPredictionResult] = useState(null);
    const [showBeachSelector, setShowBeachSelector] = useState(false);

    // Prediction parameters
    const [parameters, setParameters] = useState({
        temperature: 28,
        humidity: 65,
        wind_speed: 12,
        wave_height: 1.2,
        tide_level: 'moderate',
        month: new Date().getMonth() + 1,
        day_type: 'weekday',
        time_of_day: 'afternoon',
        weather_condition: 'clear'
    });

    useEffect(() => {
        loadBeaches();

        // If beach is passed from navigation (e.g., from Utilities screen)
        if (route?.params?.beachId) {
            loadSpecificBeach(route.params.beachId);
        }
    }, []);

    const DEBOUNCE_MS = 800;
    useEffect(() => {
        const t = setTimeout(() => setModalDebounced(modalSearch), DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [modalSearch]);

    

    const loadBeaches = async () => {
        try {
            setLoading(true);
            const beachesData = await beachesAPI.getAll({}, true);
            const beachesArray = Array.isArray(beachesData) ? beachesData : [];
            setBeaches(beachesArray);
        } catch (error) {
            console.error('Error loading beaches:', error);
            Alert.alert('Error', 'Failed to load beaches');
        } finally {
            setLoading(false);
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

    const updateParameter = (key, value) => {
        setParameters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const getCurrentConditions = () => {
        const now = new Date();
        const currentHour = now.getHours();
        let timeOfDay = 'afternoon';
        if (currentHour < 12) timeOfDay = 'morning';
        else if (currentHour < 17) timeOfDay = 'afternoon';
        else timeOfDay = 'evening';

        const dayOfWeek = now.getDay();
        const dayType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';

        setParameters(prev => ({
            ...prev,
            month: now.getMonth() + 1,
            day_type: dayType,
            time_of_day: timeOfDay
        }));
    };

    const predictSuitability = async () => {
        if (!selectedBeach) {
            Alert.alert('No Beach Selected', 'Please select a beach first');
            return;
        }
        if (!selectedBeach._id) {
            Alert.alert('Invalid Beach', 'Selected beach does not have a valid ID.');
            return;
        }

        setPredicting(true);
        try {
            const beachId = selectedBeach._id;
            // Map tide_level to tide_height for backend
            let tide_height = 1.5;
            if (parameters.tide_level === 'low') tide_height = 0.5;
            else if (parameters.tide_level === 'moderate') tide_height = 1.5;
            else if (parameters.tide_level === 'high') tide_height = 2.5;

            // Prepare features for backend (only required fields)
            const features = {
                temperature: parameters.temperature,
                humidity: parameters.humidity,
                wind_speed: parameters.wind_speed,
                tide_height,
                // Optionally, you can add precipitation, water_temp, air_quality_index if you want to allow user input for them
                month: parameters.month,
            };

            const result = await mlAPI.predictSuitability(beachId, features);
            setPredictionResult(result.suitability_scores);

            Alert.alert(
                'Prediction Complete',
                `Suitability score: ${result.suitability_scores.overall}%`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error predicting suitability:', error);
            Alert.alert('Error', 'Failed to predict suitability. Please try again.');
        } finally {
            setPredicting(false);
        }
    };

    const getCurrentSuitability = async () => {
        if (!selectedBeach) {
            Alert.alert('No Beach Selected', 'Please select a beach first');
            return;
        }
        if (!selectedBeach._id) {
            Alert.alert('Invalid Beach', 'Selected beach does not have a valid ID.');
            return;
        }

        setPredicting(true);
        try {
            const result = await mlAPI.getSuitability(selectedBeach._id);
            setPredictionResult(result.suitability_scores);
        } catch (error) {
            console.error('Error getting suitability:', error);
            Alert.alert('Error', 'Failed to get current suitability scores');
        } finally {
            setPredicting(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return '#4CAF50';
        if (score >= 60) return '#FF9800';
        return '#F44336';
    };

    const getScoreEmoji = (score) => {
        if (score >= 80) return '🌟';
        if (score >= 60) return '👍';
        return '⚠️';
    };

    const getActivityIcon = (activity) => {
        switch (activity) {
            case 'swimming': return '🏊';
            case 'family': return '👨‍👩‍👧‍👦';
            case 'adventure': return '⛰️';
            default: return '📊';
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

                        {loading ? (
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
                                            setPredictionResult(null);
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
                    <Text style={styles.headerTitle}>ML Prediction</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Beach Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📍 Select Beach</Text>
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

                {/* Current Beach Info */}
                {selectedBeach && (
                    <View style={styles.beachInfoCard}>
                        <View style={styles.beachInfoHeader}>
                            <Text style={styles.beachInfoTitle}>Current Beach Status</Text>
                            <TouchableOpacity onPress={getCurrentSuitability}>
                                <Ionicons name="refresh" size={20} color="#0288D1" />
                            </TouchableOpacity>
                        </View>
                        {selectedBeach.suitability_score && (
                            <View style={styles.currentScore}>
                                <Text style={styles.currentScoreLabel}>Current Suitability:</Text>
                                <Text style={[styles.currentScoreValue, { color: getScoreColor(selectedBeach.suitability_score) }]}>
                                    {selectedBeach.suitability_score}%
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Prediction Parameters */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🔧 Prediction Parameters</Text>
                        <TouchableOpacity onPress={getCurrentConditions}>
                            <Text style={styles.useCurrentText}>Use Current</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Temperature */}
                    <View style={styles.parameterCard}>
                        <View style={styles.parameterHeader}>
                            <Ionicons name="thermometer" size={24} color="#FF5722" />
                            <Text style={styles.parameterLabel}>Temperature (°C)</Text>
                        </View>
                        <TextInput
                            style={styles.parameterInput}
                            value={String(parameters.temperature)}
                            onChangeText={(text) => updateParameter('temperature', parseFloat(text) || 0)}
                            keyboardType="numeric"
                            placeholder="Temperature"
                        />
                        <View style={styles.sliderContainer}>
                            <Text style={styles.sliderMin}>0°C</Text>
                            <View style={styles.sliderTrack}>
                                <View style={[styles.sliderFill, { width: `${(parameters.temperature / 45) * 100}%` }]} />
                            </View>
                            <Text style={styles.sliderMax}>45°C</Text>
                        </View>
                    </View>

                    {/* Humidity */}
                    <View style={styles.parameterCard}>
                        <View style={styles.parameterHeader}>
                            <Ionicons name="water" size={24} color="#2196F3" />
                            <Text style={styles.parameterLabel}>Humidity (%)</Text>
                        </View>
                        <TextInput
                            style={styles.parameterInput}
                            value={String(parameters.humidity)}
                            onChangeText={(text) => updateParameter('humidity', parseFloat(text) || 0)}
                            keyboardType="numeric"
                            placeholder="Humidity"
                        />
                        <View style={styles.sliderContainer}>
                            <Text style={styles.sliderMin}>0%</Text>
                            <View style={styles.sliderTrack}>
                                <View style={[styles.sliderFill, { width: `${parameters.humidity}%` }]} />
                            </View>
                            <Text style={styles.sliderMax}>100%</Text>
                        </View>
                    </View>

                    {/* Wind Speed */}
                    <View style={styles.parameterCard}>
                        <View style={styles.parameterHeader}>
                            <Ionicons name="cloudy" size={24} color="#9E9E9E" />
                            <Text style={styles.parameterLabel}>Wind Speed (km/h)</Text>
                        </View>
                        <TextInput
                            style={styles.parameterInput}
                            value={String(parameters.wind_speed)}
                            onChangeText={(text) => updateParameter('wind_speed', parseFloat(text) || 0)}
                            keyboardType="numeric"
                            placeholder="Wind Speed"
                        />
                    </View>

                    {/* Wave Height */}
                    <View style={styles.parameterCard}>
                        <View style={styles.parameterHeader}>
                            <Ionicons name="water-outline" size={24} color="#03A9F4" />
                            <Text style={styles.parameterLabel}>Wave Height (m)</Text>
                        </View>
                        <TextInput
                            style={styles.parameterInput}
                            value={String(parameters.wave_height)}
                            onChangeText={(text) => updateParameter('wave_height', parseFloat(text) || 0)}
                            keyboardType="numeric"
                            placeholder="Wave Height"
                        />
                    </View>

                    {/* Tide Level */}
                    <View style={styles.parameterCard}>
                        <View style={styles.parameterHeader}>
                            <Ionicons name="water" size={24} color="#00BCD4" />
                            <Text style={styles.parameterLabel}>Tide Level</Text>
                        </View>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={parameters.tide_level}
                                onValueChange={(value) => updateParameter('tide_level', value)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Low Tide" value="low" />
                                <Picker.Item label="Moderate Tide" value="moderate" />
                                <Picker.Item label="High Tide" value="high" />
                            </Picker>
                        </View>
                    </View>

                    {/* Day Type */}
                    <View style={styles.parameterCard}>
                        <View style={styles.parameterHeader}>
                            <Ionicons name="calendar" size={24} color="#FF9800" />
                            <Text style={styles.parameterLabel}>Day Type</Text>
                        </View>
                        <View style={styles.buttonGroup}>
                            <TouchableOpacity
                                style={[styles.optionButton, parameters.day_type === 'weekday' && styles.optionButtonActive]}
                                onPress={() => updateParameter('day_type', 'weekday')}
                            >
                                <Text style={[styles.optionText, parameters.day_type === 'weekday' && styles.optionTextActive]}>
                                    Weekday
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.optionButton, parameters.day_type === 'weekend' && styles.optionButtonActive]}
                                onPress={() => updateParameter('day_type', 'weekend')}
                            >
                                <Text style={[styles.optionText, parameters.day_type === 'weekend' && styles.optionTextActive]}>
                                    Weekend
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Time of Day */}
                    <View style={styles.parameterCard}>
                        <View style={styles.parameterHeader}>
                            <Ionicons name="time" size={24} color="#9C27B0" />
                            <Text style={styles.parameterLabel}>Time of Day</Text>
                        </View>
                        <View style={styles.buttonGroup}>
                            {['morning', 'afternoon', 'evening'].map((time) => (
                                <TouchableOpacity
                                    key={time}
                                    style={[styles.optionButton, parameters.time_of_day === time && styles.optionButtonActive]}
                                    onPress={() => updateParameter('time_of_day', time)}
                                >
                                    <Text style={[styles.optionText, parameters.time_of_day === time && styles.optionTextActive]}>
                                        {time.charAt(0).toUpperCase() + time.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Weather Condition */}
                    <View style={styles.parameterCard}>
                        <View style={styles.parameterHeader}>
                            <Ionicons name="partly-sunny" size={24} color="#FFC107" />
                            <Text style={styles.parameterLabel}>Weather Condition</Text>
                        </View>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={parameters.weather_condition}
                                onValueChange={(value) => updateParameter('weather_condition', value)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Clear Sky" value="clear" />
                                <Picker.Item label="Partly Cloudy" value="partly_cloudy" />
                                <Picker.Item label="Cloudy" value="cloudy" />
                                <Picker.Item label="Light Rain" value="light_rain" />
                                <Picker.Item label="Heavy Rain" value="heavy_rain" />
                            </Picker>
                        </View>
                    </View>
                </View>

                {/* Predict Button */}
                <TouchableOpacity
                    style={[styles.predictButton, (!selectedBeach || predicting) && styles.predictButtonDisabled]}
                    onPress={predictSuitability}
                    disabled={!selectedBeach || predicting}
                >
                    {predicting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="analytics" size={24} color="#FFF" />
                            <Text style={styles.predictButtonText}>Predict Suitability</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Prediction Results */}
                {predictionResult && (
                    <View style={styles.resultsSection}>
                        <Text style={styles.resultsTitle}>📊 Prediction Results</Text>

                        {/* Overall Score */}
                        <View style={styles.overallScoreCard}>
                            <Text style={styles.overallScoreLabel}>Overall Suitability Score</Text>
                            <View style={styles.overallScoreCircle}>
                                <Text style={[styles.overallScoreValue, { color: getScoreColor(predictionResult.overall) }]}>
                                    {predictionResult.overall}%
                                </Text>
                                <Text style={styles.overallScoreEmoji}>{getScoreEmoji(predictionResult.overall)}</Text>
                            </View>
                            <Text style={styles.overallScoreDescription}>
                                {predictionResult.overall >= 80 ? 'Excellent conditions for beach activities!' :
                                    predictionResult.overall >= 60 ? 'Good conditions with some factors to consider.' :
                                        'Poor conditions. Consider alternative activities.'}
                            </Text>
                        </View>

                        {/* Activity Scores */}
                        <Text style={styles.subSectionTitle}>Activity-Specific Scores</Text>

                        {['swimming', 'family', 'adventure'].map((activity) => (
                            <View key={activity} style={styles.activityCard}>
                                <View style={styles.activityHeader}>
                                    <Text style={styles.activityEmoji}>{getActivityIcon(activity)}</Text>
                                    <Text style={styles.activityName}>
                                        {activity.charAt(0).toUpperCase() + activity.slice(1)}
                                    </Text>
                                    <Text style={[styles.activityScore, { color: getScoreColor(predictionResult[activity]) }]}>
                                        {predictionResult[activity]}%
                                    </Text>
                                </View>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            { width: `${predictionResult[activity]}%`, backgroundColor: getScoreColor(predictionResult[activity]) }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.activityDescription}>
                                    {getActivityDescription(activity, predictionResult[activity])}
                                </Text>
                            </View>
                        ))}

                        {/* Recommendations */}
                        <View style={styles.recommendationsCard}>
                            <View style={styles.recommendationsHeader}>
                                <Ionicons name="bulb" size={24} color="#FFC107" />
                                <Text style={styles.recommendationsTitle}>AI Recommendations</Text>
                            </View>
                            {getRecommendations(predictionResult, parameters).map((rec, index) => (
                                <View key={index} style={styles.recommendationItem}>
                                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                    <Text style={styles.recommendationText}>{rec}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Disclaimer */}
                        <View style={styles.disclaimerCard}>
                            <Ionicons name="information-circle" size={20} color="#FF9800" />
                            <Text style={styles.disclaimerText}>
                                Predictions are based on machine learning models using historical data and current conditions.
                                Actual beach conditions may vary. Always check live weather and local advisories before visiting.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Add extra bottom padding */}
                <View style={{ height: 40 }} />
            </ScrollView>

            <BeachSelectorModal />
        </KeyboardAvoidingView>
    );
}

// Helper functions
const getActivityDescription = (activity, score) => {
    const descriptions = {
        swimming: score >= 80 ? 'Excellent water conditions. Perfect for swimming.' :
            score >= 60 ? 'Good swimming conditions. Moderate waves.' :
                'Poor swimming conditions. High waves or strong currents.',
        family: score >= 80 ? 'Perfect family beach. Safe and amenities available.' :
            score >= 60 ? 'Family-friendly with some considerations.' :
                'Not ideal for families. Limited facilities or safety concerns.',
        adventure: score >= 80 ? 'Great for water sports and adventure activities.' :
            score >= 60 ? 'Moderate adventure opportunities.' :
                'Limited adventure activities. Conditions not suitable.'
    };
    return descriptions[activity] || 'No description available';
};

const getRecommendations = (scores, parameters) => {
    const recommendations = [];

    if (scores.overall < 60) {
        recommendations.push('Consider visiting on a different day with better weather conditions');
    }

    if (parameters.temperature < 20) {
        recommendations.push('Temperature is low. Bring warm clothing if visiting');
    } else if (parameters.temperature > 35) {
        recommendations.push('High temperature expected. Stay hydrated and use sunscreen');
    }

    if (parameters.wind_speed > 30) {
        recommendations.push('High winds expected. Water sports may be restricted');
    }

    if (parameters.wave_height > 1.5) {
        recommendations.push('Large waves detected. Swimming caution advised');
    }

    if (scores.swimming < 50) {
        recommendations.push('Not recommended for swimming today');
    }

    if (scores.family > 70) {
        recommendations.push('Great day for family beach outing');
    }

    if (parameters.time_of_day === 'morning') {
        recommendations.push('Morning hours offer pleasant temperatures and fewer crowds');
    } else if (parameters.time_of_day === 'afternoon' && parameters.temperature > 30) {
        recommendations.push('Afternoon heat may be intense. Consider early morning or evening visit');
    }

    if (recommendations.length === 0) {
        recommendations.push('Perfect conditions for beach activities!');
        recommendations.push('Don\'t forget sunscreen and water');
    }

    return recommendations.slice(0, 5);
};

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
    modalSearchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 8,
        margin: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    modalSearchInput: {
        flex: 1,
        marginLeft: 8,
    },
    header: {
        backgroundColor: '#0288D1',
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
    section: {
        margin: 20,
        marginBottom: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#01579B',
    },
    useCurrentText: {
        fontSize: 14,
        color: '#0288D1',
        fontWeight: '600',
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
    beachInfoCard: {
        backgroundColor: '#E3F2FD',
        marginHorizontal: 20,
        marginBottom: 15,
        padding: 15,
        borderRadius: 12,
    },
    beachInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    beachInfoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#01579B',
    },
    currentScore: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    currentScoreLabel: {
        fontSize: 14,
        color: '#666',
    },
    currentScoreValue: {
        fontSize: 18,
        fontWeight: 'bold',
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
        marginBottom: 10,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sliderTrack: {
        flex: 1,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    sliderFill: {
        height: '100%',
        backgroundColor: '#0288D1',
    },
    sliderMin: {
        fontSize: 10,
        color: '#666',
    },
    sliderMax: {
        fontSize: 10,
        color: '#666',
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
    buttonGroup: {
        flexDirection: 'row',
        gap: 10,
    },
    optionButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    optionButtonActive: {
        backgroundColor: '#0288D1',
    },
    optionText: {
        fontSize: 14,
        color: '#666',
    },
    optionTextActive: {
        color: '#FFF',
        fontWeight: '600',
    },
    predictButton: {
        backgroundColor: '#4CAF50',
        marginHorizontal: 20,
        marginVertical: 20,
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    predictButtonDisabled: {
        backgroundColor: '#CCC',
    },
    predictButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultsSection: {
        margin: 20,
    },
    resultsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 15,
    },
    overallScoreCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    overallScoreLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    overallScoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        position: 'relative',
    },
    overallScoreValue: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    overallScoreEmoji: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        fontSize: 24,
    },
    overallScoreDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    subSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 12,
    },
    activityCard: {
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
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    activityEmoji: {
        fontSize: 20,
    },
    activityName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    activityScore: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    activityDescription: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
    },
    recommendationsCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        marginTop: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    recommendationsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    recommendationsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF9800',
    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    recommendationText: {
        flex: 1,
        fontSize: 13,
        color: '#333',
        lineHeight: 18,
    },
    disclaimerCard: {
        backgroundColor: '#FFF9C4',
        borderRadius: 12,
        padding: 15,
        marginTop: 15,
        flexDirection: 'row',
        gap: 10,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 11,
        color: '#F57C00',
        lineHeight: 16,
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
        color: '#01579B',
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