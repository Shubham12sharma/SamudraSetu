import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { beachesAPI, cvAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function CVVerificationScreen({ navigation, route }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedBeach, setSelectedBeach] = useState(route?.params?.beach || null);
  const [beaches, setBeaches] = useState([]);
  const [beachesLoading, setBeachesLoading] = useState(false);
  const [showBeachList, setShowBeachList] = useState(!selectedBeach);
  const [modalSearch, setModalSearch] = useState('');
  const [modalDebounced, setModalDebounced] = useState('');

  useEffect(() => {
    loadBeaches();
  }, []);

  // debounce modal search
  const DEBOUNCE_MS = 800;
  useEffect(() => {
    const t = setTimeout(() => setModalDebounced(modalSearch), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [modalSearch]);

  const loadBeaches = async () => {
    try {
      setBeachesLoading(true);
      const data = await beachesAPI.getAll({}, true);
      const beachesArray = Array.isArray(data) ? data : [];
      setBeaches(beachesArray);
    } catch (error) {
      console.error('Error loading beaches:', error);
      Alert.alert('Error', 'Failed to load beaches');
    } finally {
      setBeachesLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        setResults(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        setResults(null);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadAndVerify = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (!selectedBeach) {
      Alert.alert('Error', 'Please select a beach');
      return;
    }

    setLoading(true);
    try {
      const beachId = selectedBeach._id || selectedBeach.id;
      const userId = 'user_' + Date.now(); // Generate a temporary user ID

      const data = await cvAPI.uploadImage(beachId, image.uri, userId);
      setResults(data);

      Alert.alert(
        'Success',
        data.consensus_reached
          ? 'Image verified! Beach condition updated.'
          : `Image processing complete. ${data.verifications_needed} more verifications needed for consensus.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to process image. Please try again.';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBeach = (beach) => {
    setSelectedBeach(beach);
    setShowBeachList(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CV Verification</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Beach Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Beach</Text>
          {selectedBeach ? (
            <TouchableOpacity
              style={styles.selectedBeach}
              onPress={() => setShowBeachList(true)}
            >
              <View style={styles.beachInfo}>
                <Text style={styles.beachName}>{selectedBeach.name}</Text>
                <Text style={styles.beachState}>{selectedBeach.state}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#0288D1" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowBeachList(true)}
            >
              <Ionicons name="water" size={20} color="#0288D1" />
              <Text style={styles.selectButtonText}>Choose a Beach</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Beach List Modal */}
        {showBeachList && (
          <View style={styles.beachListModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Beach</Text>
              <TouchableOpacity onPress={() => setShowBeachList(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.beachListScroll}>
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
                      style={styles.beachListItem}
                      onPress={() => handleSelectBeach(beach)}
                    >
                      <View style={styles.beachListItemContent}>
                        <Text style={styles.beachListItemName}>{beach.name}</Text>
                        <Text style={styles.beachListItemState}>{beach.state}</Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    </TouchableOpacity>
                  ))
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#666' }}>No beaches available. Check your connection.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Image Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Beach Image</Text>
          <Text style={styles.description}>
            Take a photo or select an image of the beach to analyze crowd levels and cleanliness
          </Text>

          {!image ? (
            <View style={styles.imagePickerContainer}>
              <View style={styles.imagePickerButtons}>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={takePhoto}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={40} color="#4CAF50" />
                  <Text style={styles.imageButtonText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="image" size={40} color="#0288D1" />
                  <Text style={styles.imageButtonText}>Choose Image</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: image.uri }}
                style={styles.imagePreview}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setImage(null);
                  setResults(null);
                }}
              >
                <Ionicons name="close-circle" size={28} color="#F44336" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Processing Results */}
        {results && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Processing Results</Text>

            <View style={styles.resultCard}>
              <View style={styles.resultItem}>
                <View style={styles.resultLabel}>
                  <Ionicons name="people" size={24} color="#0288D1" />
                  <Text style={styles.resultLabelText}>Crowd Level</Text>
                </View>
                <View style={styles.resultValue}>
                  <Text style={styles.resultValueText}>
                    {results.processing_results?.crowd_score?.toFixed(0) || 'N/A'}%
                  </Text>
                  <View
                    style={[
                      styles.crowdLevelBadge,
                      {
                        backgroundColor: getCrowdLevelColor(
                          results.processing_results?.crowd_score || 0
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.crowdLevelText}>
                      {getCrowdLevelLabel(results.processing_results?.crowd_score || 0)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.resultDivider} />

              <View style={styles.resultItem}>
                <View style={styles.resultLabel}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  <Text style={styles.resultLabelText}>Cleanliness Score</Text>
                </View>
                <View style={styles.resultValue}>
                  <Text style={styles.resultValueText}>
                    {results.processing_results?.cleanliness_score?.toFixed(0) || 'N/A'}%
                  </Text>
                </View>
              </View>

              <View style={styles.resultDivider} />

              <View style={styles.resultItem}>
                <View style={styles.resultLabel}>
                  <Ionicons name="shield-checkmark" size={24} color="#FF9800" />
                  <Text style={styles.resultLabelText}>Consensus Status</Text>
                </View>
                <View style={styles.resultValue}>
                  <Text
                    style={[
                      styles.resultValueText,
                      {
                        color: results.consensus_reached ? '#4CAF50' : '#FF9800',
                      },
                    ]}
                  >
                    {results.consensus_reached ? 'Verified ✓' : 'Pending'}
                  </Text>
                  {!results.consensus_reached && (
                    <Text style={styles.verificationNeeded}>
                      {results.verifications_needed} more needed
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Upload Button */}
        {image && !loading && (
          <TouchableOpacity
            style={[styles.uploadButton, !selectedBeach && styles.uploadButtonDisabled]}
            onPress={uploadAndVerify}
            disabled={!selectedBeach}
          >
            <Ionicons name="cloud-upload" size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>Verify & Upload</Text>
          </TouchableOpacity>
        )}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0288D1" />
            <Text style={styles.loadingText}>Processing image...</Text>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#0288D1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoBoldText}>How it works?</Text>
              <Text style={styles.infoText}>
                When multiple users verify similar conditions for a beach, the system updates the crowd level and cleanliness score based on consensus.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

function getCrowdLevelColor(score) {
  if (score < 30) return '#4CAF50';
  if (score < 70) return '#FF9800';
  return '#F44336';
}

function getCrowdLevelLabel(score) {
  if (score < 30) return 'Low';
  if (score < 70) return 'Moderate';
  return 'High';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0288D1',
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginHorizontal: 15,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#01579B',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 15,
    borderWidth: 2,
    borderColor: '#0288D1',
    borderStyle: 'dashed',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#0288D1',
    fontWeight: '600',
    marginLeft: 10,
  },
  selectedBeach: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  beachInfo: {
    flex: 1,
  },
  beachName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#01579B',
  },
  beachState: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  beachListModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#01579B',
  },
  beachListScroll: {
    backgroundColor: '#FFFFFF',
    maxHeight: 300,
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
  beachListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  beachListItemContent: {
    flex: 1,
  },
  beachListItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#01579B',
  },
  beachListItemState: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  imagePickerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  imagePickerButtons: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'center',
    width: '100%',
  },
  imageButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: width / 2 - 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imagePreview: {
    width: '100%',
    height: 300,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    padding: 5,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  resultLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resultValue: {
    alignItems: 'flex-end',
    gap: 5,
  },
  resultValueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#01579B',
  },
  crowdLevelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  crowdLevelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  verificationNeeded: {
    fontSize: 11,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  resultDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0288D1',
    borderRadius: 12,
    paddingVertical: 15,
    marginHorizontal: 15,
    marginTop: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    gap: 10,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: '#0288D1',
    fontWeight: '600',
  },
  infoSection: {
    marginHorizontal: 15,
    marginTop: 25,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 15,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoBoldText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#01579B',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
