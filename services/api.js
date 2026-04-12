/**
 * API Service for SamudraSetu Backend
 * Handles all API calls with offline support
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// API Base URL - Use your machine's IP for physical device testing
// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, use localhost
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Hardcoded API URL to avoid VirtualBox network detection issues on your current machine
    return 'http://192.168.0.103:8000/api';

    // 1) Allow explicit override via app config (app.json/app.config.js) -> expo.extra.API_URL
    const configured = Constants.expoConfig?.extra?.API_URL || Constants.manifest?.extra?.API_URL;
    if (configured) return configured.endsWith('/api') ? configured : `${configured.replace(/\/$/, '')}/api`;

    // 2) If running in Expo dev client / classic, debuggerHost contains the packager host.
    // Note: We prioritize the real Wi-Fi network (usually 192.168.0.x or 192.168.1.x)
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.expoConfig?.extra?.hostUri;
    if (hostUri) {
      let host = String(hostUri).split(':')[0];
      // Skip "phantom" virtual interfaces (like VirtualBox 192.168.56.x) 
      // if we have a real network available.
      if (host && host.startsWith('192.168.56')) {
         host = '192.168.0.103'; // Use the confirmed real Wi-Fi IP
      }
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:8000/api`;
      }
    }

    // 3) Android emulator special host
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000/api';
    }

    // 4) Fallback to localhost for iOS simulator / web
    return 'http://localhost:8000/api';
  }

  // Production (override via app config recommended)
  return 'https://your-production-api.com/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log('Using API base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Offline queue storage key
const OFFLINE_QUEUE_KEY = '@samudrasetu_offline_queue';
const USER_TOKEN_KEY = '@samudrasetu_user_token';
const USER_DATA_KEY = '@samudrasetu_user_data';

/**
 * Get stored user data
 */
export const getUserData = async () => {
  try {
    const userJson = await AsyncStorage.getItem(USER_DATA_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Store user data
 */
export const setUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
};

/**
 * Clear user data
 */
export const clearUserData = async () => {
  try {
    await AsyncStorage.removeItem(USER_DATA_KEY);
    await AsyncStorage.removeItem(USER_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    return false;
  }
};

/**
 * Get offline queue from storage
 */
export const getOfflineQueue = async () => {
  try {
    const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
};

/**
 * Add operation to offline queue
 */
export const addToOfflineQueue = async (operation) => {
  try {
    const queue = await getOfflineQueue();
    queue.push({
      ...operation,
      timestamp: new Date().toISOString(),
    });
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Error adding to offline queue:', error);
    return false;
  }
};

/**
 * Clear offline queue
 */
export const clearOfflineQueue = async () => {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing offline queue:', error);
    return false;
  }
};

/**
 * Sync offline queue with server
 */
export const syncOfflineQueue = async (userId) => {
  try {
    const queue = await getOfflineQueue();
    if (queue.length === 0) {
      return { synced: 0, conflicts: 0, errors: 0 };
    }

    const response = await api.post('/sync/sync/', {
      user_id: userId,
      operations: queue,
    });

    if (response.data.results) {
      const { synced, conflicts, errors } = response.data.summary;

      // Clear queue if sync successful
      if (errors === 0) {
        await clearOfflineQueue();
      } else {
        // Remove successfully synced items
        const syncedIds = response.data.results.synced.map(op => op.operation_id);
        const newQueue = queue.filter(op => !syncedIds.includes(op.operation_id));
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
      }

      return response.data.summary;
    }

    return { synced: 0, conflicts: 0, errors: queue.length };
  } catch (error) {
    console.error('Error syncing offline queue:', error);
    return { synced: 0, conflicts: 0, errors: queue.length };
  }
};

// Auth API
export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      if (response.data.user) {
        await setUserData(response.data.user);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  register: async (name, email, password, phone = '', location = '', bio = '') => {
    try {
      const response = await api.post('/auth/register/', {
        name,
        email,
        password,
        phone,
        location,
        bio,
      });
      if (response.data.user) {
        await setUserData(response.data.user);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUser: async (userId) => {
    try {
      const response = await api.get(`/auth/user/${userId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (userId, data) => {
    try {
      const response = await api.put(`/auth/user/${userId}/update/`, data);
      if (response.data) {
        await setUserData(response.data);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  uploadAvatar: async (userId, imageUri) => {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });

      const response = await api.post(`/auth/user/${userId}/avatar/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data) {
        await setUserData(response.data);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Weather API
export const weatherAPI = {
  getWeather: async (lat, lon) => {
    try {
      const response = await api.get('/weather/', {
        params: { lat, lon },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Beaches API
export const beachesAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/beaches/', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (beachId) => {
    try {
      const response = await api.get(`/beaches/${beachId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getReviews: async (beachId) => {
    try {
      const response = await api.get(`/beaches/${beachId}/reviews/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getImages: async (beachId) => {
    try {
      const response = await api.get(`/beaches/${beachId}/images/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// ML Suitability API
export const mlAPI = {
  predictSuitability: async (beachId, features) => {
    try {
      const response = await api.post('/ml/predict/', {
        beach_id: beachId,
        features,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSuitability: async (beachId) => {
    try {
      const response = await api.get(`/ml/beach/${beachId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// CV Processing API
export const cvAPI = {
  uploadImage: async (beachId, imageUri, userId) => {
    try {
      const formData = new FormData();
      formData.append('beach_id', beachId);
      formData.append('user_id', userId);
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'beach_image.jpg',
      });

      const response = await api.post('/cv/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getConditionStatus: async (beachId) => {
    try {
      const response = await api.get(`/cv/beach/${beachId}/status/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Itinerary API
export const itineraryAPI = {
  buildItinerary: async (startBeachId, preferences, timeConstraintHours = 8, maxBeaches = 5) => {
    try {
      const response = await api.post('/itinerary/build/', {
        start_beach_id: startBeachId,
        preferences,
        time_constraint_hours: timeConstraintHours,
        max_beaches: maxBeaches,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  optimizeRoute: async (beachIds) => {
    try {
      const response = await api.post('/itinerary/optimize/', {
        beach_ids: beachIds,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getShortestPath: async (startBeachId, endBeachId) => {
    try {
      const response = await api.get('/itinerary/shortest-path/', {
        params: {
          start_beach_id: startBeachId,
          end_beach_id: endBeachId,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Sentiment API
export const sentimentAPI = {
  analyzeReview: async (data) => {
    try {
      const response = await api.post('/sentiment/analyze/', {
        review_text: data.review_text,
        beach_id: data.beach_id,
        user_id: data.user_id || 'anonymous',
        rating: data.rating,
      });
      return response.data;
    } catch (error) {
      // If offline, add to queue
      if (!error.response) {
        await addToOfflineQueue({
          operation_type: 'create_review',
          entity_type: 'review',
          entity_id: data.beach_id,
          data: data,
        });
        throw new Error('Review queued for offline sync');
      }
      throw error;
    }
  },

  getBeachVibe: async (beachId) => {
    try {
      const response = await api.get(`/sentiment/beach/${beachId}/vibe/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Eco Impact API
export const ecoAPI = {
  calculateImpact: async (originLat, originLon, beachId, transportMode = 'car', passengers = 1, durationDays = 1, numberOfPeople = 1) => {
    try {
      const response = await api.post('/eco/calculate/', {
        origin_lat: originLat,
        origin_lon: originLon,
        beach_id: beachId,
        transport_mode: transportMode,
        passengers,
        duration_days: durationDays,
        number_of_people: numberOfPeople,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  compareTransport: async (originLat, originLon, beachId, passengers = 1) => {
    try {
      const response = await api.post('/eco/compare-transport/', {
        origin_lat: originLat,
        origin_lon: originLon,
        beach_id: beachId,
        passengers,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  calculateItineraryImpact: async (originLat, originLon, beachIds, transportMode = 'car', passengers = 1, durationPerBeachDays = 1, numberOfPeople = 1) => {
    try {
      const response = await api.post('/eco/itinerary-impact/', {
        origin_lat: originLat,
        origin_lon: originLon,
        beach_ids: beachIds,
        transport_mode: transportMode,
        passengers,
        duration_per_beach_days: durationPerBeachDays,
        number_of_people: numberOfPeople,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Sync API
export const syncAPI = {
  sync: async (userId) => {
    return await syncOfflineQueue(userId);
  },

  getStatus: async (userId) => {
    try {
      const response = await api.get(`/sync/status/${userId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getConflicts: async (userId) => {
    try {
      const response = await api.get(`/sync/conflicts/${userId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const ecoImpactAPI = {
  // Calculate environmental impact for a single beach visit
  calculateImpact: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calculate-impact/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate impact');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Eco Impact API Error:', error);
      throw error;
    }
  },

  // Compare different transport modes
  compareTransportModes: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/compare-transport/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to compare transport modes');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Compare Transport API Error:', error);
      throw error;
    }
  },

  // Calculate impact for a multi-beach itinerary
  calculateItineraryImpact: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calculate-itinerary-impact/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate itinerary impact');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Itinerary Impact API Error:', error);
      throw error;
    }
  },
};

export default api;

