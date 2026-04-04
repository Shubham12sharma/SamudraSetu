import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
// Assuming google_search tool is available via an import or context
// import { useGoogleSearch } from './useGoogleSearch'; // Example import

import {
    beachesAPI,
    cvAPI,
    externalWeatherAPI,
    mlAPI,
    sentimentAPI,
    weatherAPI,
} from '../services/api';

// --- Helper: Haversine distance ---
const getDistance = (lat1, lon1, lat2, lon2) => { /* ... (no change) ... */ const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180; const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2); const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); return R * c; };

// --- Filter Definitions ---
const facilityFilterCategories = { /* ... (no change) ... */ All: { icon: '🌐', tags: [] }, Hotels: { icon: '🏨', tags: ['hotel', 'motel', 'guest_house', 'hostel', 'apartment', 'alpine_hut', 'wilderness_hut'] }, Restaurants: { icon: '🍽️', tags: ['restaurant', 'cafe', 'fast_food', 'food_court', 'pub', 'bar', 'ice_cream'] }, Hospitals: { icon: '🏥', tags: ['hospital', 'clinic', 'doctors', 'dentist'] }, Pharmacies: { icon: '💊', tags: ['pharmacy'] }, Supermarkets: { icon: '🛒', tags: ['supermarket'] }, };
const routeFilterCategories = { /* ... (no change) ... */ All: { icon: '🗺️', tagsQuery: 'nwr["natural"="beach"](around:{RADIUS},{LAT},{LON});nwr["aeroway"="aerodrome"](around:{RADIUS},{LAT},{LON});' }, Beaches: { icon: '🏖️', tagsQuery: 'nwr["natural"="beach"](around:{RADIUS},{LAT},{LON});' }, Airports: { icon: '✈️', tagsQuery: 'nwr["aeroway"="aerodrome"](around:{RADIUS},{LAT},{LON});' }, };
const getAllFacilityApiTagsForQuery = () => { /* ... (no change) ... */ const allTags = new Set(); Object.values(facilityFilterCategories).forEach(category => { if (category.tags.length > 0) { category.tags.forEach(tag => allTags.add(tag)); } }); return Array.from(allTags); };
const getRecommendedApiTagsForQuery = () => { /* ... (no change) ... */ return [...facilityFilterCategories.Hotels.tags, ...facilityFilterCategories.Restaurants.tags]; };

// --- API Fetching Functions ---
// fetchNearbyFacilitiesWithExpansion remains the same
const fetchNearbyFacilitiesWithExpansion = async (latitude, longitude, tagsToQuery = [], tagsToFilter = [], initialRadiusKm = 5, maxRadiusKm = 50, minResults = 10) => { /* ... (no change from previous) ... */ let currentRadiusKm = initialRadiusKm; let fetchedPlaces = []; const amenityRegex = `^(${tagsToQuery.join('|')})$`; if (!tagsToQuery || tagsToQuery.length === 0) { console.warn("fetchNearbyFacilities: No tagsToQuery provided."); return []; } console.log(`Starting FACILITY fetch for query tags: ${tagsToQuery.join(', ') | 'All'}, filter: ${tagsToFilter.join(',') || 'None'}, radius: ${initialRadiusKm}km`); while (currentRadiusKm <= maxRadiusKm) { console.log(`Attempt FACILITY fetch radius: ${currentRadiusKm}km...`); const radiusMeters = currentRadiusKm * 1000; const query = `[out:json][timeout:45];(node["amenity"~"${amenityRegex}"](around:${radiusMeters},${latitude},${longitude});way["amenity"~"${amenityRegex}"](around:${radiusMeters},${latitude},${longitude});relation["amenity"~"${amenityRegex}"](around:${radiusMeters},${latitude},${longitude}););out center;`; const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`; try { const response = await fetch(url); console.log(`FACILITY API Status ${currentRadiusKm}km:`, response.status); if (!response.ok) { let e = await response.text(); console.error(`Err Body (${response.status}):`, e.substring(0, 500)); if (response.status === 429 || response.status === 504) { console.warn('Overpass limit/timeout'); break; } throw new Error(`HTTP ${response.status}`); } const data = await response.json(); console.log(`Received ${data.elements?.length ?? 0} elements at ${currentRadiusKm}km.`); if (!data.elements || data.elements.length === 0) { if (currentRadiusKm >= maxRadiusKm) break; currentRadiusKm = Math.min(currentRadiusKm * 2, maxRadiusKm); await new Promise(r => setTimeout(r, 500)); continue; } fetchedPlaces = data.elements.map((element) => { const tags = element.tags || {}; const loc = element.center || { lat: element.lat, lon: element.lon }; if (typeof loc.lat !== 'number' || typeof loc.lon !== 'number') return null; const typeRaw = tags.amenity || 'unknown'; if (tagsToFilter.length > 0 && !tagsToFilter.includes(typeRaw)) return null; const addr = [tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb'], tags['addr:city'], tags['addr:postcode']].filter(Boolean).join(', ').trim() || 'Address not available'; return { id: String(element.id), name: tags.name || tags.amenity || 'Unnamed Place', typeRaw: typeRaw, typeDisplay: typeRaw.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), address: addr, lat: loc.lat, lon: loc.lon, phone: tags.phone || tags['contact:phone'] || null, distance: getDistance(latitude, longitude, loc.lat, loc.lon) }; }).filter(p => p && p.name !== 'Unnamed Place'); console.log(`Processed ${fetchedPlaces.length} valid places matching filter at ${currentRadiusKm}km.`); if (fetchedPlaces.length >= minResults || currentRadiusKm >= maxRadiusKm) break; else { console.log(`Found ${fetchedPlaces.length}, need ${minResults}. Incr radius.`); currentRadiusKm = Math.min(currentRadiusKm * 2, maxRadiusKm); await new Promise(r => setTimeout(r, 500)); } } catch (error) { console.error(`Err fetch/parse radius ${currentRadiusKm}km:`, error); Alert.alert("API Error", `Fetch failed. (${error.message})`); break; } } fetchedPlaces.sort((a, b) => a.distance - b.distance); console.log(`Returning ${fetchedPlaces.length} final places.`); return fetchedPlaces; };
// fetchNearbyDestinationsWithExpansion remains the same
const fetchNearbyDestinationsWithExpansion = async (latitude, longitude, tagsQueryTemplate, initialRadiusKm = 20, maxRadiusKm = 200, minResults = 5) => { /* ... (no change from previous) ... */
    let currentRadiusKm = initialRadiusKm; let fetchedDestinations = [];
    console.log(`Starting DESTINATION fetch with initial radius: ${initialRadiusKm}km`);
    while (currentRadiusKm <= maxRadiusKm) { console.log(`Attempting DESTINATION fetch with radius: ${currentRadiusKm}km...`); const radiusMeters = currentRadiusKm * 1000; const filledQuery = tagsQueryTemplate.replace(/{LAT}/g, latitude.toString()).replace(/{LON}/g, longitude.toString()).replace(/{RADIUS}/g, radiusMeters.toString()); const query = `[out:json][timeout:60];(${filledQuery});out center;`; const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`; try { const response = await fetch(url); console.log(`DESTINATION API Status ${currentRadiusKm}km:`, response.status); if (!response.ok) { let e = await response.text(); console.error(`DEST API Err Body (${response.status}):`, e.substring(0, 500)); if (response.status === 429 || response.status === 504) { console.warn('Overpass limit/timeout'); break; } throw new Error(`HTTP ${response.status}`); } const data = await response.json(); console.log(`Received ${data.elements?.length ?? 0} DEST elements at ${currentRadiusKm}km.`); if (!data.elements || data.elements.length === 0) { if (currentRadiusKm >= maxRadiusKm) break; currentRadiusKm = Math.min(currentRadiusKm * 2, maxRadiusKm); await new Promise(r => setTimeout(r, 500)); continue; } fetchedDestinations = data.elements.map((element) => { const tags = element.tags || {}; const loc = element.center || { lat: element.lat, lon: element.lon }; if (typeof loc.lat !== 'number' || typeof loc.lon !== 'number') return null; let type = 'Destination'; if (tags.natural === 'beach') type = 'Beach'; else if (tags.aeroway === 'aerodrome') type = 'Airport'; return { id: String(element.id), name: tags.name || `${type} ID ${element.id}`, typeDisplay: type, lat: loc.lat, lon: loc.lon, distance: getDistance(latitude, longitude, loc.lat, loc.lon) }; }).filter(d => d && d.name !== 'Unnamed Place'); console.log(`Processed ${fetchedDestinations.length} valid DESTINATIONS at ${currentRadiusKm}km.`); if (fetchedDestinations.length >= minResults || currentRadiusKm >= maxRadiusKm) break; else { console.log(`Found ${fetchedDestinations.length}, need ${minResults}. Incr radius.`); currentRadiusKm = Math.min(currentRadiusKm * 2, maxRadiusKm); await new Promise(r => setTimeout(r, 500)); } } catch (error) { console.error(`Err fetch/parse DEST radius ${currentRadiusKm}km:`, error); Alert.alert("API Error", `Fetch failed. (${error.message})`); break; } } fetchedDestinations.sort((a, b) => a.distance - b.distance); console.log(`Returning ${fetchedDestinations.length} final DESTINATIONS.`); return fetchedDestinations;
};
// fetchNearbyEmergencyServices remains the same
const fetchNearbyEmergencyServices = async (latitude, longitude, radiusKm = 10, maxRadiusKm = 50, minResults = 3) => { /* ... (no change from previous) ... */
    let currentRadiusKm = radiusKm; let fetchedServices = []; const queryTags = ['police', 'hospital', 'clinic', 'doctors', 'fire_station']; const queryRegex = `^(${queryTags.join('|')})$`;
    console.log(`Starting EMERGENCY SERVICE fetch, initial radius: ${radiusKm}km`);
    while (currentRadiusKm <= maxRadiusKm) { console.log(`Attempt EMERGENCY fetch radius: ${currentRadiusKm}km...`); const radiusMeters = currentRadiusKm * 1000; const query = `[out:json][timeout:45];(node["amenity"~"${queryRegex}"](around:${radiusMeters},${latitude},${longitude});way["amenity"~"${queryRegex}"](around:${radiusMeters},${latitude},${longitude});relation["amenity"~"${queryRegex}"](around:${radiusMeters},${latitude},${longitude}););out center;`; const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`; try { const response = await fetch(url); console.log(`EMERGENCY API Status ${currentRadiusKm}km:`, response.status); if (!response.ok) { let e = await response.text(); console.error(`EMERGENCY Err Body (${response.status}):`, e.substring(0, 500)); if (response.status === 429 || response.status === 504) { console.warn('Overpass limit/timeout'); break; } throw new Error(`HTTP ${response.status}`); } const data = await response.json(); console.log(`Received ${data.elements?.length ?? 0} EMERGENCY elements at ${currentRadiusKm}km.`); if (!data.elements || data.elements.length === 0) { if (currentRadiusKm >= maxRadiusKm) break; currentRadiusKm = Math.min(currentRadiusKm * 2, maxRadiusKm); await new Promise(r => setTimeout(r, 500)); continue; } fetchedServices = data.elements.map((element) => { const tags = element.tags || {}; const loc = element.center || { lat: element.lat, lon: element.lon }; if (typeof loc.lat !== 'number' || typeof loc.lon !== 'number') return null; const typeRaw = tags.amenity || tags.emergency || 'unknown'; return { id: String(element.id), name: tags.name || typeRaw.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Emergency Service', typeDisplay: typeRaw.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), lat: loc.lat, lon: loc.lon, distance: getDistance(latitude, longitude, loc.lat, loc.lon) }; }).filter(s => s); console.log(`Processed ${fetchedServices.length} valid EMERGENCY services at ${currentRadiusKm}km.`); if (fetchedServices.length >= minResults || currentRadiusKm >= maxRadiusKm) break; else { console.log(`Found ${fetchedServices.length}, need ${minResults}. Incr radius.`); currentRadiusKm = Math.min(currentRadiusKm * 2, maxRadiusKm); await new Promise(r => setTimeout(r, 500)); } } catch (error) { console.error(`Err fetch/parse EMERGENCY radius ${currentRadiusKm}km:`, error); Alert.alert("API Error", `Fetch failed. (${error.message})`); break; } }
    fetchedServices.sort((a, b) => a.distance - b.distance); console.log(`Returning ${fetchedServices.length} final EMERGENCY services.`); return fetchedServices;
};

// --- Main Component ---
const UtilitiesScreen = () => {
    // --- State ---
    const [page, setPage] = useState('main');
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState(null);
    const [locationCountry, setLocationCountry] = useState(null); // State for detected country
    const [locationErrorMsg, setLocationErrorMsg] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    // Facilities
    const [facilitiesData, setFacilitiesData] = useState([]);
    const [facilitiesLoading, setFacilitiesLoading] = useState(false);
    const [facSearch, setFacSearch] = useState('');
    const [activeFacilityFilter, setActiveFacilityFilter] = useState('All');
    // Routes
    const [routesData, setRoutesData] = useState([]);
    const [routesLoading, setRoutesLoading] = useState(false);
    const [routeSearch, setRouteSearch] = useState('');
    const [activeRouteFilter, setActiveRouteFilter] = useState('All');
    // Contacts
    const [contactSearch, setContactSearch] = useState('');
    const [dynamicNationalContacts, setDynamicNationalContacts] = useState([]); // State for fetched national numbers
    const [nationalContactsLoading, setNationalContactsLoading] = useState(false);
    const [nationalContactsError, setNationalContactsError] = useState(null);
    const [nearbyServices, setNearbyServices] = useState([]);
    const [nearbyServicesLoading, setNearbyServicesLoading] = useState(false);
    // Recommendations
    const [recommendedPlaces, setRecommendedPlaces] = useState([]);
    const [recommendedLoading, setRecommendedLoading] = useState(false);
    const [recommendedErrorMsg, setRecommendedErrorMsg] = useState(null);
    // Beaches search state (backend data)
    const [beachesData, setBeachesData] = useState([]);
    const [beachesLoading, setBeachesLoading] = useState(false);
    const [beachSearch, setBeachSearch] = useState('');
    const [selectedBeach, setSelectedBeach] = useState(null);
    const [beachWeather, setBeachWeather] = useState(null);
    const [beachVibe, setBeachVibe] = useState(null);
    const [beachCondition, setBeachCondition] = useState(null);
    const [beachSuitability, setBeachSuitability] = useState(null);

    // Google Search Hook/Placeholder - Replace with actual tool call
    // const { search: googleSearch, loading: searchLoading, error: searchError } = useGoogleSearch();
    const googleSearch = async (queries) => {
        // *** Placeholder: Replace this with the actual google_search tool call ***
        console.log("--- SIMULATING GOOGLE SEARCH for:", queries, "---");
        // Simulate finding numbers for common queries
        const results = queries.map(q => {
            const lowerQ = q.toLowerCase();
            let number = null;
            let type = 'Info';
            if (lowerQ.includes('police')) { number = '112 / 911 / 100'; type = 'Police'; } // Generic example
            else if (lowerQ.includes('ambulance')) { number = '112 / 911 / 108'; type = 'Ambulance'; }
            else if (lowerQ.includes('fire')) { number = '112 / 911 / 101'; type = 'Fire'; }

            return {
                query: q,
                // Simulate a search result structure (adapt based on actual tool output)
                results: number ? [{ title: `Emergency Number ${type} for ${lowerQ.split(' ').pop()}`, snippet: `The primary number is often ${number}. Please verify locally.`, link: '#' }] : [],
            };
        });
        await new Promise(res => setTimeout(res, 800)); // Simulate network delay
        // return { responses: results }; // Simulate the structure if needed
        return results; // Simplified simulation return
        // *** End Placeholder ***
    };


    // --- Location & Data Fetching Effect ---
    useEffect(() => {
        const fetchLocationAndData = async (targetPage, targetFilter) => {
            setLocationLoading(true); setLocationErrorMsg(null); setLocation(null); setLocationCountry(null);
            setRecommendedErrorMsg(null); setNationalContactsError(null); setDynamicNationalContacts([]); // Reset dynamic contacts
            if (targetPage === 'facilities') { setFacilitiesData([]); setFacilitiesLoading(true); }
            if (targetPage === 'routes') { setRoutesData([]); setRoutesLoading(true); }
            if (targetPage === 'main') { setRecommendedPlaces([]); setRecommendedLoading(true); }
            if (targetPage === 'contacts') { setNearbyServices([]); setNearbyServicesLoading(true); setNationalContactsLoading(true); } // Load both

            let permStatus; try { let { status } = await Location.requestForegroundPermissionsAsync(); permStatus = status; } catch (permError) { const msg = 'Perm error'; console.error(msg, permError); setLocationErrorMsg(msg); if (targetPage === 'main') setRecommendedErrorMsg(msg); setNationalContactsError(msg); /* Set contact error */ setLocationLoading(false); setFacilitiesLoading(false); setRoutesLoading(false); setRecommendedLoading(false); setNearbyServicesLoading(false); setNationalContactsLoading(false); return; }
            if (permStatus !== 'granted') { const msg = 'Permission denied.'; setLocationErrorMsg(msg); if (targetPage === 'main') setRecommendedErrorMsg(msg); setNationalContactsError(msg); /* Set contact error */ setLocationLoading(false); setFacilitiesLoading(false); setRoutesLoading(false); setRecommendedLoading(false); setNearbyServicesLoading(false); setNationalContactsLoading(false); return; }

            let fetchedCoords = null;
            try {
                console.log("Getting current position..."); let currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, timeout: 15000 });
                fetchedCoords = currentLoc.coords; setLocation(fetchedCoords); setLocationLoading(false); console.log("Loc obtained:", fetchedCoords);

                // --- Reverse Geocode to get Country ---
                let country = null;
                if (fetchedCoords) {
                    try {
                        console.log("Reverse geocoding..."); let addresses = await Location.reverseGeocodeAsync(fetchedCoords);
                        if (addresses && addresses.length > 0) {
                            country = addresses[0].country; // Get country name
                            setLocationCountry(country);
                            console.log("Country:", country);
                        } else { console.log("Reverse geocoding returned empty."); }
                    } catch (geocodeError) { console.error("Reverse geocoding error:", geocodeError); setLocationErrorMsg("Could not determine country."); setNationalContactsError("Could not determine country for helplines."); } // Set contact error
                } else { const msg = 'No coords.'; setLocationErrorMsg(msg); if (targetPage === 'main') setRecommendedErrorMsg(msg); setNationalContactsError(msg); /* Set contact error */ }

                // --- Fetch Page-Specific Data ---
                if (fetchedCoords) {
                    if (targetPage === 'main') { const recTags = getRecommendedApiTagsForQuery(); const recs = await fetchNearbyFacilitiesWithExpansion(fetchedCoords.latitude, fetchedCoords.longitude, recTags, recTags, 5, 20, 5); setRecommendedPlaces(recs.slice(0, 5)); }
                    else if (targetPage === 'facilities') { const qTags = getAllFacilityApiTagsForQuery(); const fTags = facilityFilterCategories[targetFilter]?.tags || []; const places = await fetchNearbyFacilitiesWithExpansion(fetchedCoords.latitude, fetchedCoords.longitude, qTags, fTags); setFacilitiesData(places); }
                    else if (targetPage === 'routes') { const qTemplate = routeFilterCategories[targetFilter]?.tagsQuery; if (qTemplate) { const dests = await fetchNearbyDestinationsWithExpansion(fetchedCoords.latitude, fetchedCoords.longitude, qTemplate); setRoutesData(dests); } else { setRoutesData([]); } }
                    else if (targetPage === 'beaches') {
                        // Load beaches from backend (optionally filtered by beachSearch)
                        try {
                            setBeachesLoading(true);
                            const params = beachSearch ? { search: beachSearch } : {};
                            const resp = await beachesAPI.getAll(params);
                            const list = Array.isArray(resp) ? resp : (resp?.results || resp?.data || []);
                            setBeachesData(list || []);
                        } catch (err) {
                            console.error('Failed to load beaches from backend:', err);
                        } finally {
                            setBeachesLoading(false);
                        }
                    }
                    else if (targetPage === 'contacts') {
                        // Fetch nearby services (police stations, hospitals etc.)
                        const services = await fetchNearbyEmergencyServices(fetchedCoords.latitude, fetchedCoords.longitude);
                        setNearbyServices(services);
                        setNearbyServicesLoading(false); // Nearby done

                        // --- Fetch National Numbers via Search ---
                        if (country) {
                            const searchQueries = [
                                `national police emergency number ${country}`,
                                `national ambulance emergency number ${country}`,
                                `national fire emergency number ${country}`,
                            ];
                            try {
                                console.log("Searching for national numbers...");
                                const searchResults = await googleSearch(searchQueries); // Use the imported/provided search function
                                // Basic parsing - assumes first result snippet might contain the number
                                // **Needs refinement based on actual google_search tool output**
                                const dynamicContacts = searchResults.map((resp, index) => {
                                    let type = index === 0 ? 'Police' : index === 1 ? 'Ambulance' : 'Fire';
                                    const firstResult = resp.results?.[0];
                                    return {
                                        id: `dyn-${index}`,
                                        name: `${type} (${country})`,
                                        role: 'National (Searched)',
                                        // Attempt to extract number-like patterns, VERY basic
                                        phone: firstResult?.snippet?.match(/(\b\d{2,4}\b|\b\d{3}[-\s]?\d{3,}\b)/)?.[0] || 'See search result',
                                        note: firstResult?.snippet || 'No details found.',
                                        link: firstResult?.link, // Include link if available
                                    };
                                });
                                setDynamicNationalContacts(dynamicContacts);
                                setNationalContactsError(null);
                            } catch (searchError) {
                                console.error("Google Search error:", searchError);
                                setNationalContactsError("Could not search for national numbers.");
                                setDynamicNationalContacts([]); // Clear on error
                            } finally {
                                setNationalContactsLoading(false);
                            }
                        } else {
                            // If country couldn't be determined
                            setNationalContactsError("Could not determine country to search numbers.");
                            setNationalContactsLoading(false);
                        }
                    }
                }
            } catch (error) { /* ... error handling ... */ console.error("Err fetchLocationAndData:", error); const msg = error.code === 'E_LOCATION_TIMEOUT' ? 'Loc timeout.' : 'Fetch failed.'; setLocationErrorMsg(msg); if (targetPage === 'main') setRecommendedErrorMsg(msg); setNationalContactsError(msg); setLocationLoading(false);
            } finally { /* ... turn off loading states ... */ if (targetPage === 'facilities') setFacilitiesLoading(false); if (targetPage === 'routes') setRoutesLoading(false); if (targetPage === 'main') setRecommendedLoading(false); if (targetPage === 'contacts') { setNearbyServicesLoading(false); setNationalContactsLoading(false); } }
        };

        if (page === 'facilities' || page === 'routes' || page === 'main' || page === 'contacts') { fetchLocationAndData(page, page === 'facilities' ? activeFacilityFilter : (page === 'routes' ? activeRouteFilter : null)); }
        else { /* ... reset state ... */ setLocation(null); setLocationErrorMsg(null); setLocationLoading(false); setLocationCountry(null); setFacilitiesData([]); setFacilitiesLoading(false); setActiveFacilityFilter('All'); setRoutesData([]); setRoutesLoading(false); setActiveRouteFilter('All'); setRecommendedPlaces([]); setRecommendedLoading(false); setRecommendedErrorMsg(null); setNearbyServices([]); setNearbyServicesLoading(false); setDynamicNationalContacts([]); setNationalContactsLoading(false); setNationalContactsError(null); }
    }, [page, activeFacilityFilter, activeRouteFilter]); // Dependencies

    // --- Header ---
    const Header = ({ title }) => ( /* ... no change ... */ <View style={styles.header}>{page !== 'main' && (<TouchableOpacity style={styles.headerBack} onPress={() => setPage('main')}> <Text style={styles.backText}>←</Text> </TouchableOpacity>)}<Text style={styles.headerTitle}>{title}</Text></View>);
    // --- Static Data ---
    // Keep mainUtilities for navigation, but contacts list is now dynamic + nearby
    const mainUtilities = [ /* ... Use icons ... */ { id: 1, title: 'Nearby Facilities', description: 'Find hotels, hospitals, shops...', page: 'facilities', icon: '🛠️' }, { id: 2, title: 'Find Destinations', description: 'Get directions to beaches & airports.', page: 'routes', icon: '🗺️' }, { id: 4, title: 'Search Beaches', description: 'Search beaches from backend and view live info', page: 'beaches', icon: '🏝️' }, { id: 3, title: 'Emergency Info', description: 'National numbers & nearby services.', page: 'contacts', icon: '📞' },];
    // --- Helper Actions ---
    const openMapAt = async (lat, lon, label = '') => { /* ... no change ... */ const q = `${lat},${lon}`; const u = Platform.select({ ios: `http://maps.apple.com/?ll=${q}&q=${encodeURIComponent(label)}`, android: `geo:${q}?q=${encodeURIComponent(label || q)}`, default: `https://www.google.com/maps/search/?api=1&query=${q}` }); const s = await Linking.canOpenURL(u); if (s) Linking.openURL(u); else Alert.alert('No map app'); };
    const openDirections = async (lat, lon, label = '') => { /* ... no change ... */ const d = `${lat},${lon}`; const s = location ? `${location.latitude},${location.longitude}` : ''; const u = Platform.select({ ios: `http://maps.apple.com/?saddr=${s}&daddr=${d}&dirflg=r`, android: `google.navigation:q=${d}${s ? `&origin=${s}` : ''}`, default: `https://www.google.com/maps/dir/?api=1&destination=${d}${s ? `&origin=${s}` : ''}` }); const sup = await Linking.canOpenURL(u); if (sup) Linking.openURL(u); else Alert.alert('No directions app'); };
    const callNumber = async (phone) => { /* ... no change ... */ const u = `tel:${phone}`; const s = await Linking.canOpenURL(u); if (s) Linking.openURL(u); else Alert.alert('Cannot call'); };
    const shareText = async (text) => { /* ... no change ... */ try { await Share.share({ message: text }); } catch (e) { } };
    const openWebSearch = async (query) => { /* ... (no change) ... */ const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`; const supported = await Linking.canOpenURL(url); if (supported) { Linking.openURL(url); } else { Alert.alert('Cannot open web browser'); } };
    const handleSearch = () => { /* ... no change ... */ if (page === 'main' && searchQuery.trim()) { const l = searchQuery.toLowerCase(); if (l.includes('beach') || l.includes('airport')) { setPage('routes'); setActiveRouteFilter(l.includes('beach') ? 'Beaches' : 'Airports'); setRouteSearch(searchQuery.trim()); } else if (facilityFilterCategories.Hotels.tags.some(t => l.includes(t)) || l.includes('stay') || l.includes('lodge')) { setPage('facilities'); setActiveFacilityFilter('Hotels'); setFacSearch(searchQuery.trim()); } else if (facilityFilterCategories.Restaurants.tags.some(t => l.includes(t)) || l.includes('food') || l.includes('eat')) { setPage('facilities'); setActiveFacilityFilter('Restaurants'); setFacSearch(searchQuery.trim()); } else if (facilityFilterCategories.Hospitals.tags.some(t => l.includes(t)) || l.includes('doctor') || l.includes('medical')) { setPage('facilities'); setActiveFacilityFilter('Hospitals'); setFacSearch(searchQuery.trim()); } else if (facilityFilterCategories.Pharmacies.tags.some(t => l.includes(t)) || l.includes('medicine')) { setPage('facilities'); setActiveFacilityFilter('Pharmacies'); setFacSearch(searchQuery.trim()); } else if (facilityFilterCategories.Supermarkets.tags.some(t => l.includes(t)) || l.includes('grocery') || l.includes('shop')) { setPage('facilities'); setActiveFacilityFilter('Supermarkets'); setFacSearch(searchQuery.trim()); } else if (l.includes('contact') || l.includes('emergency') || l.includes('police') || l.includes('ambulance') || l.includes('fire')) { setPage('contacts'); setContactSearch(searchQuery.trim()); } else { setPage('facilities'); setActiveFacilityFilter('All'); setFacSearch(searchQuery.trim()); } } };

    // --- Render Functions ---
    const renderMain = () => { /* ... (no structural change) ... */
        const recommendedHotelAndFood = recommendedPlaces;
        return (<View style={styles.container}> <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}> <View style={styles.searchContainer}> <TextInput style={styles.searchInputMain} placeholder="Search nearby hotels, food, beaches..." value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSearch} returnKeyType="search" /> <TouchableOpacity style={[styles.searchButton, !searchQuery.trim() && styles.searchButtonDisabled]} onPress={handleSearch} disabled={!searchQuery.trim()}> <Text style={styles.searchButtonText}>🔍</Text> </TouchableOpacity> </View> <Text style={styles.titleMain}>Beach Utilities</Text> <View style={styles.categoriesContainer}> {mainUtilities.map((utility) => (<TouchableOpacity key={utility.id} style={styles.categoryCard} onPress={() => setPage(utility.page)}> <View style={styles.categoryIconContainer}><Text style={styles.categoryIcon}>{utility.icon || '❔'}</Text></View> <View style={styles.categoryInfo}> <Text style={styles.categoryTitle}>{utility.title}</Text> <Text style={styles.categoryDescription}>{utility.description}</Text> </View> </TouchableOpacity>))} </View> <View style={styles.additionalSection}> <Text style={styles.sectionTitle}>Recommended Nearby</Text> {recommendedLoading && <ActivityIndicator size="small" color="#01579B" style={{ marginTop: 10, alignSelf: 'center' }} />} {(recommendedErrorMsg || locationErrorMsg) && !recommendedLoading && <Text style={styles.errorTextSmall}>{recommendedErrorMsg || locationErrorMsg}</Text>} {!recommendedLoading && !recommendedErrorMsg && !locationErrorMsg && recommendedHotelAndFood.length > 0 && (<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendedScroll}> {recommendedHotelAndFood.map((place) => { let icon = '📍'; if (facilityFilterCategories.Hotels.tags.includes(place.typeRaw)) icon = facilityFilterCategories.Hotels.icon; else if (facilityFilterCategories.Restaurants.tags.includes(place.typeRaw)) icon = facilityFilterCategories.Restaurants.icon; return (<TouchableOpacity key={place.id} style={styles.recommendCardLarge} onPress={() => { setPage('facilities'); const catKey = Object.keys(facilityFilterCategories).find(k => facilityFilterCategories[k].tags.includes(place.typeRaw)) || 'All'; setActiveFacilityFilter(catKey); setFacSearch(place.name); }}> <View style={styles.recommendImageLarge}><Text style={styles.recommendImageText}>{icon}</Text></View> <View style={styles.recommendInfoLarge}> <Text style={styles.recommendTitleLarge} numberOfLines={1}>{place.name}</Text> <Text style={styles.recommendDistanceLarge}>📍 {place.distance.toFixed(1)} km</Text> <Text style={styles.recommendTypeLarge}>{place.typeDisplay}</Text> </View> </TouchableOpacity>); })} </ScrollView>)} {!recommendedLoading && !recommendedErrorMsg && !locationErrorMsg && recommendedHotelAndFood.length === 0 && (<Text style={styles.noResultsSmall}>No recommended hotels/eateries found nearby or location unavailable.</Text>)} </View> </ScrollView> </View>);
    };
    const renderFacilities = () => { /* ... (no structural change) ... */
        const textFilteredData = facilitiesData.filter((f) => f && `${f.name || ''} ${f.typeDisplay || ''} ${f.address || ''}`.toLowerCase().includes(facSearch.trim().toLowerCase()));
        const renderItem = ({ item }) => { if (!item) return null; return (<View style={styles.listItem}> <View style={{ flex: 1, marginRight: 8 }}> <Text style={styles.itemTitle}>{item.name || 'Unnamed'}<Text> </Text><Text style={styles.badge}>{item.typeDisplay || 'Facility'}</Text></Text> <Text style={styles.itemSub}>{item.address || 'Address not available'}</Text> {item.distance !== undefined && (<Text style={styles.itemDistance}>📍 Approx. {item.distance.toFixed(1)} km</Text>)} </View> <View style={styles.itemButtons}> <TouchableOpacity style={styles.smallButton} onPress={() => openMapAt(item.lat, item.lon, item.name)}> <Text style={styles.smallButtonText}>🗺️ Map</Text> </TouchableOpacity> <TouchableOpacity style={[styles.smallButton, !item.phone && styles.buttonDisabled]} onPress={() => item.phone && callNumber(item.phone)} disabled={!item.phone} > <Text style={styles.smallButtonText}>📞 Call</Text> </TouchableOpacity> <TouchableOpacity style={styles.smallButtonSecondary} onPress={() => shareText(`${item.name} - ${item.address}${item.phone ? ' - ' + item.phone : ''}`)}> <Text style={styles.smallButtonSecText}>Share</Text> </TouchableOpacity> </View> </View>); };
        return (<View style={styles.subContainer}> <Header title="Nearby Facilities" /> <TextInput placeholder="Filter nearby facilities..." style={styles.searchInputSub} value={facSearch} onChangeText={setFacSearch} clearButtonMode="while-editing" /> <View style={styles.filterContainer}> {Object.entries(facilityFilterCategories).map(([key, { icon }]) => (<TouchableOpacity key={key} style={[styles.filterButton, activeFacilityFilter === key && styles.filterButtonActive]} onPress={() => setActiveFacilityFilter(key)} > <Text style={styles.filterButtonIcon}>{icon}</Text> <Text style={[styles.filterButtonText, activeFacilityFilter === key && styles.filterButtonTextActive]}>{key}</Text> </TouchableOpacity>))} </View> {(locationLoading || facilitiesLoading) && <ActivityIndicator size="large" color="#01579B" style={{ marginVertical: 20 }} />} {locationErrorMsg && !(locationLoading || facilitiesLoading) && <Text style={styles.errorText}>{locationErrorMsg}</Text>} {!(locationLoading || facilitiesLoading) && !locationErrorMsg && (<FlatList data={textFilteredData} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 60 }} ListEmptyComponent={<Text style={styles.noResults}> {facilitiesData.length === 0 && !facSearch ? 'No facilities found for filter.' : 'No facilities match filter/search.'} </Text>} />)} </View>);
    };
    const renderRoutes = () => { /* ... (no structural change) ... */
        const textFilteredData = routesData.filter((dest) => dest && `${dest.name || ''} ${dest.typeDisplay || ''}`.toLowerCase().includes(routeSearch.trim().toLowerCase()));
        const renderItem = ({ item }) => { if (!item) return null; return (<View style={styles.listItem}> <View style={{ flex: 1, marginRight: 8 }}> <Text style={styles.itemTitle}>{`${item.name || 'Unnamed Destination'}`}<Text> </Text><Text style={styles.badge}>{`${item.typeDisplay || 'Place'}`}</Text></Text> {item.distance !== undefined && (<Text style={styles.itemDistance}>📍 Approx. {item.distance.toFixed(1)} km</Text>)} </View> <View style={styles.itemButtons}> <TouchableOpacity style={styles.smallButton} onPress={() => openDirections(item.lat, item.lon, item.name)}> <Text style={styles.smallButtonText}>▶️ Directions</Text> </TouchableOpacity> <TouchableOpacity style={styles.smallButtonSecondary} onPress={() => shareText(`${item.name} - Loc: ${item.lat},${item.lon}`)}> <Text style={styles.smallButtonSecText}>Share</Text> </TouchableOpacity> </View> </View>); };
        return (<View style={styles.subContainer}> <Header title="Find Routes To..." /> <TextInput placeholder="Filter nearby beaches or airports..." style={styles.searchInputSub} value={routeSearch} onChangeText={setRouteSearch} clearButtonMode="while-editing" /> <View style={styles.filterContainer}> {Object.entries(routeFilterCategories).map(([key, { icon }]) => (<TouchableOpacity key={key} style={[styles.filterButton, activeRouteFilter === key && styles.filterButtonActive]} onPress={() => setActiveRouteFilter(key)} > <Text style={styles.filterButtonIcon}>{icon}</Text> <Text style={[styles.filterButtonText, activeRouteFilter === key && styles.filterButtonTextActive]}>{key}</Text> </TouchableOpacity>))} </View> {(locationLoading || routesLoading) && <ActivityIndicator size="large" color="#01579B" style={{ marginVertical: 20 }} />} {locationErrorMsg && !(locationLoading || routesLoading) && <Text style={styles.errorText}>{locationErrorMsg}</Text>} {!(locationLoading || routesLoading) && !locationErrorMsg && (<FlatList data={textFilteredData} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 60 }} ListEmptyComponent={<Text style={styles.noResults}> {routesData.length === 0 && !routeSearch ? `No ${activeRouteFilter !== 'All' ? activeRouteFilter.toLowerCase() : 'destinations'} found.` : 'No destinations match filter/search.'} </Text>} />)} </View>);
    };

    // --- New: Render Beaches (backend search) ---
    const renderBeaches = () => {
        const filtered = beachesData.filter(b => !beachSearch.trim() || `${b.name || ''} ${b.state || ''}`.toLowerCase().includes(beachSearch.trim().toLowerCase()));
        const renderItem = ({ item }) => (
            <View style={styles.listItem}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.itemTitle}>{item.name || 'Unnamed Beach'}<Text> </Text><Text style={styles.badge}>{item.state || ''}</Text></Text>
                    <Text style={styles.itemSub}>{item.description || ''}</Text>
                    {item.latitude && item.longitude && <Text style={styles.itemDistance}>📍 {item.latitude.toFixed(3)}, {item.longitude.toFixed(3)}</Text>}
                </View>
                <View style={styles.itemButtons}>
                    <TouchableOpacity style={styles.smallButton} onPress={async () => {
                        setSelectedBeach(item);
                        // fetch live weather + sentiment + cv + ml
                        try {
                            const lat = item.latitude; const lon = item.longitude;
                            const raw = await weatherAPI.getWeather(lat, lon).catch(() => null);
                            let w = raw?.data || raw || raw;
                            if (!w || w.temperature === undefined) {
                                const ow = await externalWeatherAPI.openWeatherOneCall(lat, lon).catch(() => null);
                                if (ow && ow.current) w = { temperature: ow.current.temp ?? ow.current.temperature, condition: ow.current.weather?.[0]?.description, source: 'openweather' };
                                else {
                                    const wa = await externalWeatherAPI.weatherapiCurrent(lat, lon).catch(() => null);
                                    if (wa && wa.current) w = { temperature: wa.current.temp_c, condition: wa.current.condition?.text, source: 'weatherapi' };
                                }
                            }
                            setBeachWeather(w || null);
                        } catch (e) { console.error('beach weather err', e); }

                        try { const v = await sentimentAPI.getBeachVibe(item._id || item.id || item.pk).catch(() => null); setBeachVibe(v || null); } catch (e) { console.error('beach vibe err', e); }
                        try { const c = await cvAPI.getConditionStatus(item._id || item.id || item.pk).catch(() => null); setBeachCondition(c || null); } catch (e) { console.error('beach cv err', e); }
                        try { const ms = await mlAPI.getSuitability(item._id || item.id || item.pk).catch(() => null); setBeachSuitability(ms || null); } catch (e) { console.error('beach ml err', e); }
                    }}>
                        <Text style={styles.smallButtonText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.smallButtonSecondary} onPress={() => openMapAt(item.latitude, item.longitude, item.name)}>
                        <Text style={styles.smallButtonSecText}>Map</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );

        return (
            <View style={styles.subContainer}>
                <Header title="Search Beaches" />
                <TextInput placeholder="Search beaches by name or state..." style={styles.searchInputSub} value={beachSearch} onChangeText={setBeachSearch} clearButtonMode="while-editing" onSubmitEditing={() => { setPage('beaches'); }} />
                {beachesLoading && <ActivityIndicator size="large" color="#01579B" style={{ marginVertical: 20 }} />}
                {!beachesLoading && !beachesData?.length && <Text style={styles.noResultsSmall}>No beaches found.</Text>}
                {!beachesLoading && beachesData?.length > 0 && (
                    <FlatList data={filtered} keyExtractor={(i) => i._id || i.id || i.name} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 100 }} />
                )}

                {selectedBeach && (
                    <View style={styles.details}>
                        <Text style={styles.detailsTitle}>{selectedBeach.name}</Text>
                        <Text style={styles.detailsLine}>Weather: {beachWeather ? `${beachWeather.temperature ?? '--'}°C, ${beachWeather.condition ?? '--'}` : '—'}</Text>
                        <Text style={styles.detailsLine}>Vibe: {beachVibe?.vibe || beachVibe?.summary || '—'}</Text>
                        <Text style={styles.detailsLine}>CV Condition: {beachCondition?.status || beachCondition?.condition || '—'}</Text>
                        <Text style={styles.detailsLine}>Suitability: {beachSuitability?.suitability_scores ? `${beachSuitability.suitability_scores.overall.toFixed(0)}%` : (beachSuitability?.overall ? `${beachSuitability.overall}%` : '—')}</Text>
                        <TouchableOpacity style={styles.openButton} onPress={() => openMapAt(selectedBeach.latitude, selectedBeach.longitude, selectedBeach.name)}>
                            <Text style={styles.openButtonText}>Open in Maps</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    // --- UPDATED renderContacts ---
    const renderContacts = () => {
        // Filter dynamic national contacts (search results)
        const filteredDynamicNational = dynamicNationalContacts.filter(c =>
            `${c.name || ''} ${c.note || ''} ${c.phone || ''}`.toLowerCase().includes(contactSearch.trim().toLowerCase())
        );
        // Filter nearby services
        const filteredNearby = nearbyServices.filter((s) =>
            `${s.name || ''} ${s.typeDisplay || ''}`.toLowerCase().includes(contactSearch.trim().toLowerCase())
        );

        // Render item for search-based national numbers
        const renderDynamicNationalItem = ({ item }) => {
            if (!item) return null;
            return (
                <View style={[styles.listItem, styles.nationalContactItem]}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.itemTitle}>{item.name || 'Emergency Info'}</Text>
                        <Text style={styles.itemSub}>{item.note || 'No details'}</Text>
                        {item.phone && item.phone !== 'See search result' && (
                            <Text style={styles.itemSmall}>Number: {item.phone}</Text>
                        )}
                    </View>
                    <View style={styles.itemButtons}>
                        {item.phone && item.phone !== 'See search result' && (
                            <TouchableOpacity style={styles.smallButton} onPress={() => callNumber(item.phone)}>
                                <Text style={styles.smallButtonText}>📞 Call</Text>
                            </TouchableOpacity>
                        )}
                        {/* Optional: Add button to open search link if available */}
                        {item.link && item.link !== '#' && (
                            <TouchableOpacity style={styles.smallButtonSecondary} onPress={() => Linking.openURL(item.link)}>
                                <Text style={styles.smallButtonSecText}>🌐 View</Text>
                            </TouchableOpacity>
                        )}
                        {!item.link && item.phone === 'See search result' && (
                            <TouchableOpacity style={styles.smallButtonSecondary} onPress={() => openWebSearch(item.name)}>
                                <Text style={styles.smallButtonSecText}>🌐 Search</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            );
        };

        const renderNearbyItem = ({ item }) => { /* ... (no structural change) ... */ if (!item) return null; return (<View style={styles.listItem}> <View style={{ flex: 1, marginRight: 8 }}> <Text style={styles.itemTitle}>{`${item.name || ''}`}<Text> </Text><Text style={styles.badge}>{`${item.typeDisplay || 'Service'}`}</Text></Text> {item.distance !== undefined && (<Text style={styles.itemDistance}>📍 Approx. {item.distance.toFixed(1)} km</Text>)} </View> <View style={styles.itemButtons}> <TouchableOpacity style={styles.smallButton} onPress={() => openMapAt(item.lat, item.lon, item.name)}> <Text style={styles.smallButtonText}>🗺️ Map</Text> </TouchableOpacity> <TouchableOpacity style={styles.smallButtonSecondary} onPress={() => openWebSearch(`${item.name} ${item.typeDisplay} phone number`)}> <Text style={styles.smallButtonSecText}>🌐 Search</Text> </TouchableOpacity> </View> </View>); };

        return (
            <ScrollView style={styles.subContainerScrollView} contentContainerStyle={styles.subContentScrollView}>
                <Header title="Emergency Info" />
                <TextInput placeholder="Search contacts & services..." style={styles.searchInputSub} value={contactSearch} onChangeText={setContactSearch} clearButtonMode="while-editing" />

                {/* Dynamically Fetched National Helplines Section */}
                <Text style={styles.sectionTitleSmall}>National Helplines ({locationCountry || '...'})</Text>
                {nationalContactsLoading && <ActivityIndicator size="small" color="#01579B" />}
                {nationalContactsError && !nationalContactsLoading && <Text style={styles.errorTextSmall}>{nationalContactsError}</Text>}
                {!nationalContactsLoading && !nationalContactsError && (
                    filteredDynamicNational.length === 0 && contactSearch ? (<Text style={styles.noResultsSmall}>No national results match search.</Text>) :
                        filteredDynamicNational.length === 0 && !contactSearch ? (<Text style={styles.noResultsSmall}>Could not find national numbers via search.</Text>) :
                            (<FlatList data={filteredDynamicNational} keyExtractor={(i) => i.id} renderItem={renderDynamicNationalItem} scrollEnabled={false} />)
                )}


                {/* Nearby Services Section */}
                <Text style={styles.sectionTitleSmall}>Nearby Services (Police, Hospital, Fire)</Text>
                {(locationLoading || nearbyServicesLoading) && <ActivityIndicator size="large" color="#01579B" style={{ marginVertical: 20 }} />}
                {/* Display location error only if not showing national contact error */}
                {locationErrorMsg && !(locationLoading || nearbyServicesLoading || nationalContactsError) && <Text style={styles.errorText}>{locationErrorMsg}</Text>}
                {!locationLoading && !nearbyServicesLoading && !locationErrorMsg && location && (
                    filteredNearby.length === 0 && !contactSearch ? (<Text style={styles.noResultsSmall}>No nearby emergency services found.</Text>) :
                        filteredNearby.length === 0 && contactSearch ? (<Text style={styles.noResultsSmall}>No nearby services match search.</Text>) :
                            (<FlatList data={filteredNearby} keyExtractor={(i) => i.id} renderItem={renderNearbyItem} scrollEnabled={false} />)
                )}
                {!locationLoading && !nearbyServicesLoading && !location && !locationErrorMsg && (<Text style={styles.noResultsSmall}>Location needed for nearby services.</Text>)}

            </ScrollView>
        );
    };

    // --- Page Switching ---
    switch (page) { /* ... no change ... */ case 'facilities': return renderFacilities(); case 'routes': return renderRoutes(); case 'beaches': return renderBeaches(); case 'contacts': return renderContacts(); default: return renderMain(); }
};

// --- Styles ---
const styles = StyleSheet.create({
    // ... (Keep existing styles, add/update contact styles) ...
    sectionTitleSmall: { fontSize: 18, fontWeight: '700', color: '#0288D1', marginBottom: 8, marginTop: 15, paddingHorizontal: 15, },
    nationalContactItem: { backgroundColor: '#E3F2FD', }, // Highlight national numbers slightly
    subContainerScrollView: { flex: 1, backgroundColor: '#F0F4F8', paddingTop: Platform.OS === 'android' ? 10 : 40, },
    subContentScrollView: { paddingBottom: 60, }, // Add padding to bottom of scroll content
    regionInfoText: { fontSize: 13, color: '#424242', marginHorizontal: 15, marginBottom: 5, textAlign: 'center', fontWeight: '500', },
    disclaimerText: { fontSize: 12, color: '#616161', marginHorizontal: 15, marginBottom: 10, textAlign: 'center', fontStyle: 'italic', },
    categoryIconContainer: { width: 60, height: 60, borderRadius: 10, marginRight: 15, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#B0BEC5' },
    categoryIcon: { fontSize: 30, },
    categoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 15, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 4, },
    recommendedScroll: { paddingHorizontal: 0, paddingRight: 15, },
    recommendCardLarge: { width: 180, marginRight: 15, borderRadius: 15, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, overflow: 'hidden', },
    recommendImageLarge: { width: '100%', height: 100, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', },
    recommendImageText: { fontSize: 40, },
    recommendInfoLarge: { padding: 12, },
    recommendTitleLarge: { fontSize: 16, fontWeight: 'bold', color: '#01579B', marginBottom: 5, },
    recommendDistanceLarge: { fontSize: 14, color: '#1976D2', fontWeight: '500', marginBottom: 4, },
    recommendTypeLarge: { fontSize: 13, color: '#616161', },
    errorTextSmall: { textAlign: 'center', color: '#D32F2F', fontSize: 13, paddingHorizontal: 15, marginTop: 10, marginBottom: 10, },
    noResultsSmall: { textAlign: 'center', color: '#757575', fontSize: 13, paddingHorizontal: 15, marginTop: 10, marginBottom: 10, },
    container: { flex: 1, backgroundColor: '#F0F4F8', }, scrollView: { flex: 1, }, scrollViewContent: { paddingBottom: 90, paddingTop: 10, }, searchContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, marginHorizontal: 15, marginBottom: 10, backgroundColor: '#FFFFFF', borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, }, searchInputMain: { flex: 1, fontSize: 16, paddingHorizontal: 15, color: '#333', height: 45, }, searchButton: { marginLeft: 10, width: 45, height: 45, borderRadius: 25, backgroundColor: '#0288D1', justifyContent: 'center', alignItems: 'center', }, searchButtonDisabled: { backgroundColor: '#B0BEC5', }, searchButtonText: { fontSize: 20, color: '#FFF', }, titleMain: { fontSize: 26, fontWeight: 'bold', color: '#01579B', marginHorizontal: 15, marginVertical: 10, marginBottom: 15, }, categoriesContainer: { paddingHorizontal: 15, }, /* categoryCard defined above */ /* categoryImage removed */ categoryInfo: { flex: 1, justifyContent: 'center', }, categoryTitle: { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 5, }, categoryDescription: { fontSize: 14, color: '#757575', lineHeight: 18, }, additionalSection: { marginTop: 20, paddingLeft: 15, marginBottom: 20, }, sectionTitle: { fontSize: 20, fontWeight: '700', color: '#0288D1', marginBottom: 15, }, /* recommendCard removed */ subContainer: { flex: 1, backgroundColor: '#F0F4F8', paddingTop: Platform.OS === 'android' ? 10 : 40, paddingHorizontal: 0, }, header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10, paddingHorizontal: 15, minHeight: 30, }, headerBack: { marginRight: 12, padding: 5, }, backText: { color: '#0288D1', fontSize: 28, fontWeight: 'bold', }, headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#01579B', flex: 1, }, searchInputSub: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, marginHorizontal: 15, marginBottom: 10, borderWidth: 1, borderColor: '#E0E0E0', fontSize: 16, },
    filterContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', paddingHorizontal: 12, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', marginBottom: 5, },
    filterButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#E3F2FD', borderWidth: 1, borderColor: '#B0BEC5', marginRight: 8, marginBottom: 8, },
    filterButtonActive: { backgroundColor: '#0288D1', borderColor: '#01579B', },
    filterButtonIcon: { fontSize: Platform.OS === 'ios' ? 16 : 14, marginRight: 5, },
    filterButtonText: { fontSize: 13, fontWeight: '600', color: '#01579B', },
    filterButtonTextActive: { color: '#FFFFFF', },
    listItem: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginVertical: 6, marginHorizontal: 15, flexDirection: 'row', alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2, }, itemTitle: { fontSize: 17, fontWeight: '700', color: '#01579B', marginBottom: 3, flexShrink: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', }, itemSub: { fontSize: 14, color: '#424242', marginTop: 2, lineHeight: 18, }, itemSmall: { fontSize: 12, color: '#757575', marginTop: 4, }, itemDistance: { fontSize: 13, color: '#1976D2', fontWeight: '500', marginTop: 5, }, itemButtons: { marginLeft: 10, alignItems: 'flex-end', justifyContent: 'flex-start', }, smallButton: { backgroundColor: '#0288D1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 8, minWidth: 75, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', }, smallButtonSecondary: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#0288D1', minWidth: 75, alignItems: 'center', }, buttonDisabled: { backgroundColor: '#CFD8DC', borderColor: '#B0BEC5', opacity: 0.7, }, smallButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', marginLeft: 4, }, smallButtonSecText: { color: '#01579B', fontSize: 13, fontWeight: '600', },
    badge: { backgroundColor: '#E3F2FD', color: '#01579B', fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden', fontWeight: '700', marginLeft: 5, },
    badgeSmall: { backgroundColor: '#E8F0FE', color: '#0D47A1', fontSize: 11, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden', fontWeight: '700', marginLeft: 5, },
    noResults: { textAlign: 'center', color: '#757575', marginTop: 20, fontSize: 15, paddingHorizontal: 20, }, errorText: { textAlign: 'center', color: '#D32F2F', marginTop: 10, fontSize: 14, paddingHorizontal: 20, },
});

export default UtilitiesScreen;