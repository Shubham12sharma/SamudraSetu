import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    KeyboardAvoidingView,
    Platform,
    RefreshControl
} from 'react-native';
import { beachesAPI, sentimentAPI } from '../services/api';
import { Rating } from 'react-native-ratings';

export default function SentimentAnalysisScreen({ navigation, route }) {
    const [beaches, setBeaches] = useState([]);
    const [selectedBeach, setSelectedBeach] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const [rating, setRating] = useState(3);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [beachVibe, setBeachVibe] = useState(null);
    const [showBeachSelector, setShowBeachSelector] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('analyze'); // 'analyze' or 'view'

    useEffect(() => {
        loadBeaches();

        // If beach is passed from navigation
        if (route?.params?.beachId) {
            loadSpecificBeach(route.params.beachId);
        }
    }, []);

    const loadBeaches = async () => {
        try {
            setLoading(true);
            const beachesData = await beachesAPI.getAll();
            const beachesArray = Array.isArray(beachesData) ? beachesData : beachesData.results || [];
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
            if (activeTab === 'view') {
                await loadBeachVibe(beach._id || beach.id);
            }
        } catch (error) {
            console.error('Error loading beach:', error);
        }
    };

    const loadBeachVibe = async (beachId) => {
        try {
            setLoading(true);
            const result = await sentimentAPI.getBeachVibe(beachId);
            setBeachVibe(result);
        } catch (error) {
            console.error('Error loading beach vibe:', error);
            Alert.alert('Error', 'Failed to load beach sentiment data');
        } finally {
            setLoading(false);
        }
    };

    const analyzeReview = async () => {
        if (!reviewText.trim()) {
            Alert.alert('Empty Review', 'Please enter a review to analyze');
            return;
        }

        setAnalyzing(true);
        try {
            const data = {
                review_text: reviewText,
                beach_id: selectedBeach?._id || selectedBeach?.id,
                rating: rating,
                user_id: 'current_user' // Replace with actual user ID from auth
            };

            const result = await sentimentAPI.analyzeReview(data);
            setAnalysisResult(result.analysis);

            // If beach was updated, refresh beach vibe
            if (result.beach_updated && selectedBeach) {
                await loadBeachVibe(selectedBeach._id || selectedBeach.id);
            }

            Alert.alert(
                'Analysis Complete',
                `Sentiment Score: ${result.analysis.sentiment_score}%\nVibe: ${result.analysis.sentiment_label}`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error analyzing review:', error);
            Alert.alert('Error', 'Failed to analyze review. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const refreshBeachVibe = async () => {
        if (!selectedBeach) return;

        setRefreshing(true);
        await loadBeachVibe(selectedBeach._id || selectedBeach.id);
        setRefreshing(false);
    };

    const getSentimentColor = (score) => {
        if (score >= 70) return '#4CAF50';
        if (score >= 40) return '#FF9800';
        return '#F44336';
    };

    const getSentimentEmoji = (score) => {
        if (score >= 70) return '😊';
        if (score >= 40) return '😐';
        return '😞';
    };

    const getSentimentLabel = (score) => {
        if (score >= 70) return 'Positive';
        if (score >= 40) return 'Neutral';
        return 'Negative';
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
                        {beaches.map((beach) => (
                            <TouchableOpacity
                                key={beach._id || beach.id}
                                style={styles.beachItem}
                                onPress={() => {
                                    setSelectedBeach(beach);
                                    setShowBeachSelector(false);
                                    setAnalysisResult(null);
                                    if (activeTab === 'view') {
                                        loadBeachVibe(beach._id || beach.id);
                                    }
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
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const renderAnalyzeTab = () => (
        <View>
            {/* Review Input */}
            <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Write your review</Text>
                <TextInput
                    style={styles.reviewInput}
                    multiline
                    numberOfLines={5}
                    placeholder="Share your beach experience... How was the crowd, cleanliness, water quality, etc."
                    placeholderTextColor="#999"
                    value={reviewText}
                    onChangeText={setReviewText}
                    textAlignVertical="top"
                />
            </View>

            {/* Rating */}
            <View style={styles.ratingSection}>
                <Text style={styles.inputLabel}>Rating (1-5 stars)</Text>
                <Rating
                    type="star"
                    ratingCount={5}
                    imageSize={40}
                    startingValue={rating}
                    onFinishRating={setRating}
                    style={styles.ratingStars}
                />
            </View>

            {/* Analyze Button */}
            <TouchableOpacity
                style={[styles.analyzeButton, (!reviewText.trim() || analyzing) && styles.analyzeButtonDisabled]}
                onPress={analyzeReview}
                disabled={!reviewText.trim() || analyzing}
            >
                {analyzing ? (
                    <ActivityIndicator size="small" color="#FFF" />
                ) : (
                    <>
                        <Ionicons name="analytics" size={24} color="#FFF" />
                        <Text style={styles.analyzeButtonText}>Analyze Sentiment</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* Analysis Results */}
            {analysisResult && (
                <View style={styles.resultsSection}>
                    <Text style={styles.resultsTitle}>📊 Sentiment Analysis Results</Text>

                    {/* Sentiment Score */}
                    <View style={styles.sentimentCard}>
                        <Text style={styles.sentimentLabel}>Sentiment Score</Text>
                        <View style={styles.sentimentScoreCircle}>
                            <Text style={[styles.sentimentScoreValue, { color: getSentimentColor(analysisResult.sentiment_score) }]}>
                                {(analysisResult.sentiment_score ?? 0).toFixed(0)}%
                            </Text>
                            <Text style={styles.sentimentScoreEmoji}>
                                {getSentimentEmoji(analysisResult.sentiment_score)}
                            </Text>
                        </View>
                        <Text style={[styles.sentimentLabel, { marginTop: 10, fontWeight: 'bold' }]}>
                            {getSentimentLabel(analysisResult.sentiment_score)} Sentiment
                        </Text>
                    </View>

                    {/* Vibe Tags */}
                    {analysisResult.vibe_tags && analysisResult.vibe_tags.length > 0 && (
                        <View style={styles.tagsCard}>
                            <Text style={styles.tagsTitle}>🎯 Detected Vibes</Text>
                            <View style={styles.tagsContainer}>
                                {analysisResult.vibe_tags.map((tag, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Key Phrases */}
                    {analysisResult.key_phrases && analysisResult.key_phrases.length > 0 && (
                        <View style={styles.phrasesCard}>
                            <Text style={styles.phrasesTitle}>💬 Key Phrases</Text>
                            {analysisResult.key_phrases.map((phrase, index) => (
                                <View key={index} style={styles.phraseItem}>
                                    <Ionicons name="quote" size={16} color="#0288D1" />
                                    <Text style={styles.phraseText}>"{phrase}"</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Confidence */}
                    {analysisResult.confidence && (
                        <View style={styles.confidenceCard}>
                            <Text style={styles.confidenceTitle}>Analysis Confidence</Text>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${analysisResult.confidence}%`, backgroundColor: '#4CAF50' }
                                    ]}
                                />
                            </View>
                            <Text style={styles.confidenceText}>{analysisResult.confidence}% accurate</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    const renderViewTab = () => (
        <View>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0288D1" />
                    <Text style={styles.loadingText}>Loading beach sentiment data...</Text>
                </View>
            ) : beachVibe ? (
                <View>
                    {/* Beach Header */}
                    <View style={styles.beachHeaderCard}>
                        <Text style={styles.beachName}>{beachVibe.beach_name}</Text>
                        <Text style={styles.beachLocation}>{selectedBeach?.state}</Text>
                    </View>

                    {/* Overall Sentiment */}
                    <View style={styles.sentimentOverviewCard}>
                        <Text style={styles.overviewTitle}>Current Beach Vibe</Text>
                        <View style={styles.sentimentOverview}>
                            <View style={styles.sentimentCircle}>
                                <Text style={[styles.sentimentOverviewScore, { color: getSentimentColor(beachVibe.current_sentiment_score || 0) }]}>
                                    {(beachVibe.current_sentiment_score ?? 0).toFixed(0)}%
                                </Text>
                                <Text style={styles.sentimentOverviewEmoji}>
                                    {getSentimentEmoji(beachVibe.current_sentiment_score || 0)}
                                </Text>
                            </View>
                            <View style={styles.sentimentInfo}>
                                <Text style={styles.sentimentStatus}>
                                    {getSentimentLabel(beachVibe.current_sentiment_score || 0)} Atmosphere
                                </Text>
                                <Text style={styles.sentimentDescription}>
                                    Based on {beachVibe.detailed_analysis?.total_reviews || 0} reviews
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Vibe Tags */}
                    {beachVibe.current_vibe_tags && beachVibe.current_vibe_tags.length > 0 && (
                        <View style={styles.vibeTagsCard}>
                            <Text style={styles.vibeTagsTitle}>🏷️ Common Vibes</Text>
                            <View style={styles.vibeTagsContainer}>
                                {beachVibe.current_vibe_tags.map((tag, index) => (
                                    <View key={index} style={styles.vibeTag}>
                                        <Text style={styles.vibeTagText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Detailed Analysis */}
                    {beachVibe.detailed_analysis && (
                        <View style={styles.detailedCard}>
                            <Text style={styles.detailedTitle}>📈 Detailed Analysis</Text>

                            {/* Sentiment Distribution */}
                            <View style={styles.distributionSection}>
                                <Text style={styles.subTitle}>Sentiment Distribution</Text>
                                <View style={styles.distributionItem}>
                                    <Text style={styles.distributionLabel}>Positive</Text>
                                    <View style={styles.distributionBar}>
                                        <View style={[styles.distributionFill, { width: `${beachVibe.detailed_analysis.sentiment_distribution?.positive || 0}%`, backgroundColor: '#4CAF50' }]} />
                                    </View>
                                    <Text style={styles.distributionPercent}>
                                        {(beachVibe.detailed_analysis.sentiment_distribution?.positive ?? 0).toFixed(0)}%
                                    </Text>
                                </View>
                                <View style={styles.distributionItem}>
                                    <Text style={styles.distributionLabel}>Neutral</Text>
                                    <View style={styles.distributionBar}>
                                        <View style={[styles.distributionFill, { width: `${beachVibe.detailed_analysis.sentiment_distribution?.neutral || 0}%`, backgroundColor: '#FF9800' }]} />
                                    </View>
                                    <Text style={styles.distributionPercent}>
                                        {(beachVibe.detailed_analysis.sentiment_distribution?.neutral ?? 0).toFixed(0)}%
                                    </Text>
                                </View>
                                <View style={styles.distributionItem}>
                                    <Text style={styles.distributionLabel}>Negative</Text>
                                    <View style={styles.distributionBar}>
                                        <View style={[styles.distributionFill, { width: `${beachVibe.detailed_analysis.sentiment_distribution?.negative || 0}%`, backgroundColor: '#F44336' }]} />
                                    </View>
                                    <Text style={styles.distributionPercent}>
                                        {(beachVibe.detailed_analysis.sentiment_distribution?.negative ?? 0).toFixed(0)}%
                                    </Text>
                                </View>
                            </View>

                            {/* Top Tags */}
                            {beachVibe.detailed_analysis.top_tags && beachVibe.detailed_analysis.top_tags.length > 0 && (
                                <View style={styles.topTagsSection}>
                                    <Text style={styles.subTitle}>Most Mentioned Topics</Text>
                                    {beachVibe.detailed_analysis.top_tags.map((tag, index) => (
                                        <View key={index} style={styles.topTagItem}>
                                            <Text style={styles.topTagName}>{tag.name}</Text>
                                            <View style={styles.topTagBar}>
                                                <View style={[styles.topTagFill, { width: `${tag.percentage}%` }]} />
                                            </View>
                                            <Text style={styles.topTagPercent}>{(tag.percentage ?? 0).toFixed(0)}%</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Recommendations */}
                            {beachVibe.detailed_analysis.recommendations && beachVibe.detailed_analysis.recommendations.length > 0 && (
                                <View style={styles.recommendationsSection}>
                                    <Text style={styles.subTitle}>💡 AI Recommendations</Text>
                                    {beachVibe.detailed_analysis.recommendations.map((rec, index) => (
                                        <View key={index} style={styles.recommendationItem}>
                                            <Ionicons name="bulb" size={20} color="#FFC107" />
                                            <Text style={styles.recommendationText}>{rec}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Disclaimer */}
                    <View style={styles.disclaimerCard}>
                        <Ionicons name="information-circle" size={20} color="#FF9800" />
                        <Text style={styles.disclaimerText}>
                            Sentiment analysis is based on user reviews and may not reflect current conditions.
                            Always verify with live data before visiting.
                        </Text>
                    </View>
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles" size={60} color="#CCC" />
                    <Text style={styles.emptyStateTitle}>No Sentiment Data</Text>
                    <Text style={styles.emptyStateText}>
                        Select a beach to view sentiment analysis based on user reviews
                    </Text>
                </View>
            )}
        </View>
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
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refreshBeachVibe}
                        tintColor="#0288D1"
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Sentiment Analysis</Text>
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

                {/* Tab Selector */}
                {selectedBeach && (
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'analyze' && styles.activeTab]}
                            onPress={() => {
                                setActiveTab('analyze');
                                setAnalysisResult(null);
                            }}
                        >
                            <Ionicons name="create" size={20} color={activeTab === 'analyze' ? '#FFF' : '#666'} />
                            <Text style={[styles.tabText, activeTab === 'analyze' && styles.activeTabText]}>
                                Analyze Review
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'view' && styles.activeTab]}
                            onPress={() => {
                                setActiveTab('view');
                                if (selectedBeach) {
                                    loadBeachVibe(selectedBeach._id || selectedBeach.id);
                                }
                            }}
                        >
                            <Ionicons name="analytics" size={20} color={activeTab === 'view' ? '#FFF' : '#666'} />
                            <Text style={[styles.tabText, activeTab === 'view' && styles.activeTabText]}>
                                Beach Vibe
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Tab Content */}
                {selectedBeach && (
                    <View style={styles.tabContent}>
                        {activeTab === 'analyze' ? renderAnalyzeTab() : renderViewTab()}
                    </View>
                )}

                {/* No Beach Selected */}
                {!selectedBeach && (
                    <View style={styles.noBeachContainer}>
                        <Ionicons name="water" size={60} color="#CCC" />
                        <Text style={styles.noBeachText}>Select a beach to get started</Text>
                        <Text style={styles.noBeachSubtext}>
                            Choose a beach to analyze reviews or view sentiment data
                        </Text>
                    </View>
                )}

                {/* Bottom Padding */}
                <View style={{ height: 40 }} />
            </ScrollView>

            <BeachSelectorModal />
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 15,
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
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
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
        backgroundColor: '#0288D1',
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
    },
    inputSection: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    reviewInput: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        fontSize: 14,
        color: '#333',
        minHeight: 120,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        textAlignVertical: 'top',
    },
    ratingSection: {
        marginBottom: 20,
    },
    ratingStars: {
        alignItems: 'flex-start',
        paddingVertical: 10,
    },
    analyzeButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 20,
    },
    analyzeButtonDisabled: {
        backgroundColor: '#CCC',
    },
    analyzeButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultsSection: {
        marginTop: 10,
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 15,
    },
    sentimentCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 2,
    },
    sentimentLabel: {
        fontSize: 14,
        color: '#666',
    },
    sentimentScoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 15,
        position: 'relative',
    },
    sentimentScoreValue: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    sentimentScoreEmoji: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        fontSize: 24,
    },
    tagsCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    tagsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 10,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    tagText: {
        fontSize: 12,
        color: '#0288D1',
    },
    phrasesCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    phrasesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 10,
    },
    phraseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    phraseText: {
        flex: 1,
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
    },
    confidenceCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    confidenceTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    confidenceText: {
        fontSize: 12,
        color: '#666',
    },
    beachHeaderCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        alignItems: 'center',
    },
    beachName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 4,
    },
    beachLocation: {
        fontSize: 14,
        color: '#666',
    },
    sentimentOverviewCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
    },
    overviewTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 15,
        textAlign: 'center',
    },
    sentimentOverview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    sentimentCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    sentimentOverviewScore: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    sentimentOverviewEmoji: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        fontSize: 20,
    },
    sentimentInfo: {
        flex: 1,
    },
    sentimentStatus: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    sentimentDescription: {
        fontSize: 12,
        color: '#666',
    },
    vibeTagsCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
    },
    vibeTagsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 12,
    },
    vibeTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    vibeTag: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 25,
    },
    vibeTagText: {
        fontSize: 14,
        color: '#0288D1',
        fontWeight: '600',
    },
    detailedCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
    },
    detailedTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 15,
    },
    subTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    distributionSection: {
        marginBottom: 20,
    },
    distributionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    distributionLabel: {
        width: 60,
        fontSize: 12,
        color: '#666',
    },
    distributionBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    distributionFill: {
        height: '100%',
        borderRadius: 4,
    },
    distributionPercent: {
        width: 40,
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
    },
    topTagsSection: {
        marginBottom: 20,
    },
    topTagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    topTagName: {
        width: 80,
        fontSize: 13,
        color: '#333',
    },
    topTagBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#F0F0F0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    topTagFill: {
        height: '100%',
        backgroundColor: '#FF9800',
        borderRadius: 3,
    },
    topTagPercent: {
        width: 40,
        fontSize: 11,
        color: '#666',
        textAlign: 'right',
    },
    recommendationsSection: {
        marginTop: 10,
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
        flexDirection: 'row',
        gap: 10,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 11,
        color: '#F57C00',
        lineHeight: 16,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 15,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    noBeachContainer: {
        alignItems: 'center',
        padding: 60,
    },
    noBeachText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginTop: 15,
        marginBottom: 8,
    },
    noBeachSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
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