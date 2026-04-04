import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { cvVerificationAPI } from '../services/api';

export default function CVVerificationScreen({ navigation }) {
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);

    // Request camera and gallery permissions
    const requestPermissions = async () => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
            Alert.alert(
                'Permissions Required',
                'Camera and gallery permissions are needed to upload images for verification.'
            );
            return false;
        }
        return true;
    };

    // Pick image from gallery
    const pickImageFromGallery = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled) {
                setSelectedImage(result.assets[0]);
                setAnalysisResult(null);
                setError(null);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    // Take photo with camera
    const takePhoto = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled) {
                setSelectedImage(result.assets[0]);
                setAnalysisResult(null);
                setError(null);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo. Please try again.');
        }
    };

    // Analyze image using CV API
    const analyzeImage = async () => {
        if (!selectedImage) {
            Alert.alert('No Image', 'Please select an image first.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Prepare image data for API
            const formData = new FormData();
            formData.append('image', {
                uri: selectedImage.uri,
                type: 'image/jpeg',
                name: 'beach_condition.jpg',
            });

            // Call CV verification API
            const response = await cvVerificationAPI.analyzeBeachCondition(formData);

            setAnalysisResult(response);
            Alert.alert('Success', 'Image analyzed successfully!');
        } catch (error) {
            console.error('Error analyzing image:', error);
            setError(error.message || 'Failed to analyze image. Please try again.');
            Alert.alert('Error', 'Failed to analyze beach condition. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Reset and start over
    const resetAnalysis = () => {
        setSelectedImage(null);
        setAnalysisResult(null);
        setError(null);
    };

    // Get color based on analysis score
    const getScoreColor = (score) => {
        if (score >= 80) return '#4CAF50';
        if (score >= 60) return '#FF9800';
        return '#F44336';
    };

    // Get emoji based on crowd level
    const getCrowdEmoji = (level) => {
        switch (level?.toLowerCase()) {
            case 'low': return '🟢';
            case 'medium': return '🟡';
            case 'high': return '🔴';
            default: return '📊';
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>CV Verification</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
                <Ionicons name="information-circle" size={24} color="#0288D1" />
                <Text style={styles.infoText}>
                    Upload a beach condition image for AI-powered analysis of crowd level, cleanliness, and overall beach suitability.
                </Text>
            </View>

            {/* Image Selection Section */}
            {!selectedImage ? (
                <View style={styles.selectionSection}>
                    <Text style={styles.sectionTitle}>Select Image</Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.galleryButton]}
                            onPress={pickImageFromGallery}
                        >
                            <Ionicons name="images" size={28} color="#FFF" />
                            <Text style={styles.buttonText}>Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.cameraButton]}
                            onPress={takePhoto}
                        >
                            <Ionicons name="camera" size={28} color="#FFF" />
                            <Text style={styles.buttonText}>Camera</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.imageSection}>
                    <Text style={styles.sectionTitle}>Selected Image</Text>
                    <Image
                        source={{ uri: selectedImage.uri }}
                        style={styles.selectedImage}
                        resizeMode="cover"
                    />

                    {!analysisResult && !loading && (
                        <View style={styles.analysisButtons}>
                            <TouchableOpacity
                                style={styles.analyzeButton}
                                onPress={analyzeImage}
                            >
                                <Ionicons name="analytics" size={24} color="#FFF" />
                                <Text style={styles.buttonText}>Analyze Image</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={resetAnalysis}
                            >
                                <Ionicons name="refresh" size={24} color="#666" />
                                <Text style={styles.resetButtonText}>Choose Another</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* Loading Indicator */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0288D1" />
                    <Text style={styles.loadingText}>Analyzing beach conditions...</Text>
                </View>
            )}

            {/* Analysis Results */}
            {analysisResult && !loading && (
                <View style={styles.resultsSection}>
                    <Text style={styles.sectionTitle}>Analysis Results</Text>

                    {/* Suitability Score */}
                    {analysisResult.suitability_score && (
                        <View style={styles.scoreCard}>
                            <Text style={styles.scoreTitle}>Beach Suitability Score</Text>
                            <View style={styles.scoreCircle}>
                                <Text style={[styles.scoreValue, { color: getScoreColor(analysisResult.suitability_score) }]}>
                                    {analysisResult.suitability_score}%
                                </Text>
                            </View>
                            <Text style={styles.scoreDescription}>
                                {analysisResult.suitability_score >= 80 ? 'Excellent conditions for beach activities!' :
                                    analysisResult.suitability_score >= 60 ? 'Good conditions with some factors to consider.' :
                                        'Poor conditions. Not recommended for beach activities.'}
                            </Text>
                        </View>
                    )}

                    {/* Crowd Level */}
                    {analysisResult.crowd_level && (
                        <View style={styles.resultCard}>
                            <View style={styles.resultHeader}>
                                <Ionicons name="people" size={24} color="#FF9800" />
                                <Text style={styles.resultTitle}>Crowd Level</Text>
                            </View>
                            <Text style={styles.resultValue}>
                                {getCrowdEmoji(analysisResult.crowd_level)} {analysisResult.crowd_level?.toUpperCase()}
                            </Text>
                            <Text style={styles.resultDescription}>
                                {analysisResult.crowd_level === 'low' ? 'Relaxed atmosphere, perfect for peaceful beach time.' :
                                    analysisResult.crowd_level === 'medium' ? 'Moderate crowd, good balance of activity and space.' :
                                        'Very crowded, may affect your beach experience.'}
                            </Text>
                        </View>
                    )}

                    {/* Cleanliness Score */}
                    {analysisResult.cleanliness_score && (
                        <View style={styles.resultCard}>
                            <View style={styles.resultHeader}>
                                <Ionicons name="leaf" size={24} color="#4CAF50" />
                                <Text style={styles.resultTitle}>Cleanliness Score</Text>
                            </View>
                            <Text style={styles.resultValue}>
                                {analysisResult.cleanliness_score}%
                            </Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${analysisResult.cleanliness_score}%`, backgroundColor: getScoreColor(analysisResult.cleanliness_score) }]} />
                            </View>
                            <Text style={styles.resultDescription}>
                                {analysisResult.cleanliness_score >= 80 ? 'Very clean beach, well maintained.' :
                                    analysisResult.cleanliness_score >= 60 ? 'Moderately clean, some litter present.' :
                                        'Poor cleanliness, significant litter detected.'}
                            </Text>
                        </View>
                    )}

                    {/* Water Quality */}
                    {analysisResult.water_quality && (
                        <View style={styles.resultCard}>
                            <View style={styles.resultHeader}>
                                <Ionicons name="water" size={24} color="#0288D1" />
                                <Text style={styles.resultTitle}>Water Quality</Text>
                            </View>
                            <Text style={styles.resultValue}>
                                {analysisResult.water_quality}%
                            </Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${analysisResult.water_quality}%`, backgroundColor: getScoreColor(analysisResult.water_quality) }]} />
                            </View>
                            <Text style={styles.resultDescription}>
                                {analysisResult.water_quality >= 80 ? 'Excellent water quality, safe for swimming.' :
                                    analysisResult.water_quality >= 60 ? 'Acceptable water quality, use caution.' :
                                        'Poor water quality, not recommended for swimming.'}
                            </Text>
                        </View>
                    )}

                    {/* Recommendations */}
                    {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                        <View style={styles.recommendationsCard}>
                            <View style={styles.resultHeader}>
                                <Ionicons name="bulb" size={24} color="#FFC107" />
                                <Text style={styles.resultTitle}>Recommendations</Text>
                            </View>
                            {analysisResult.recommendations.map((rec, index) => (
                                <View key={index} style={styles.recommendationItem}>
                                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                    <Text style={styles.recommendationText}>{rec}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Additional Notes */}
                    {analysisResult.notes && (
                        <View style={styles.notesCard}>
                            <Text style={styles.notesText}>{analysisResult.notes}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.newAnalysisButton}
                        onPress={resetAnalysis}
                    >
                        <Ionicons name="add-circle" size={24} color="#FFF" />
                        <Text style={styles.buttonText}>Start New Analysis</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Error Display */}
            {error && !loading && (
                <View style={styles.errorCard}>
                    <Ionicons name="alert-circle" size={32} color="#F44336" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={resetAnalysis}
                    >
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    contentContainer: {
        paddingBottom: 30,
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
    infoSection: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
        margin: 20,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        gap: 10,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#01579B',
        lineHeight: 20,
    },
    selectionSection: {
        margin: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 15,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        gap: 10,
    },
    galleryButton: {
        backgroundColor: '#4CAF50',
    },
    cameraButton: {
        backgroundColor: '#FF9800',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    imageSection: {
        margin: 20,
    },
    selectedImage: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        marginBottom: 15,
    },
    analysisButtons: {
        gap: 10,
    },
    analyzeButton: {
        flexDirection: 'row',
        backgroundColor: '#0288D1',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    resetButton: {
        flexDirection: 'row',
        backgroundColor: '#F0F0F0',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    resetButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 30,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
    resultsSection: {
        margin: 20,
    },
    scoreCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    scoreTitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 15,
    },
    scoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    scoreValue: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    scoreDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    resultCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#01579B',
    },
    resultValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
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
    resultDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    recommendationsCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    recommendationText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    notesCard: {
        backgroundColor: '#FFF9C4',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    notesText: {
        fontSize: 13,
        color: '#F57C00',
        lineHeight: 18,
    },
    newAnalysisButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 10,
    },
    errorCard: {
        backgroundColor: '#FFEBEE',
        margin: 20,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 14,
        color: '#C62828',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: '#F44336',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
});