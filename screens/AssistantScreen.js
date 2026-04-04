import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Animated,
} from 'react-native';
import { beachesAPI, cvAPI, externalWeatherAPI, mlAPI, sentimentAPI, weatherAPI } from '../services/api';

// ═══════════════════════════════════════════════════════════
// INDIA BEACHES DATABASE
// ═══════════════════════════════════════════════════════════
const INDIA_BEACHES = [
    { id: 'juhu-beach', name: 'Juhu Beach', state: 'Maharashtra', city: 'Mumbai', latitude: 19.1136, longitude: 72.8261 },
    { id: 'marine-drive', name: 'Marine Drive', state: 'Maharashtra', city: 'Mumbai', latitude: 18.9432, longitude: 72.8236 },
    { id: 'baga-beach', name: 'Baga Beach', state: 'Goa', city: 'North Goa', latitude: 15.5431, longitude: 73.7573 },
    { id: 'calangute-beach', name: 'Calangute Beach', state: 'Goa', city: 'North Goa', latitude: 15.5485, longitude: 73.7669 },
    { id: 'palolem-beach', name: 'Palolem Beach', state: 'Goa', city: 'South Goa', latitude: 14.0275, longitude: 73.9725 },
    { id: 'marina-beach', name: 'Marina Beach', state: 'Tamil Nadu', city: 'Chennai', latitude: 13.0499, longitude: 80.2823 },
    { id: 'kovalam-beach', name: 'Kovalam Beach', state: 'Kerala', city: 'Trivandrum', latitude: 8.3842, longitude: 76.9754 },
];

export default function AssistantScreen() {
    // ────────────────────────────────────────────────
    // STATES
    // ────────────────────────────────────────────────
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "🏖️ Hey there! I'm SamudraSetu Assistant. I can help you with:\n\n🌊 Live beach weather & forecasts\n💧 Water quality reports\n⭐ Beach recommendations\n🏨 Nearby facilities\n⚠️ Safety tips\n🎯 Suitability scores\n🏄 Activities & sports\n\nWhat would you like to know?",
            sender: 'bot',
            timestamp: new Date(),
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollViewRef = useRef(null);
    const [liveDataCache, setLiveDataCache] = useState({});

    // Quick action buttons
    const quickActions = [
        { id: 1, icon: '🌤️', text: 'Live Weather', query: 'Show me live beach weather' },
        { id: 2, icon: '⭐', text: 'Best Beaches', query: 'Which are the best beaches right now?' },
        { id: 3, icon: '💧', text: 'Water Quality', query: 'Show water quality status' },
        { id: 4, icon: '🏨', text: 'Facilities', query: 'What facilities are available at beaches?' },
        { id: 5, icon: '⚠️', text: 'Safety Tips', query: 'Give me beach safety tips' },
        { id: 6, icon: '🎯', text: 'Suitability', query: 'Show beach suitability scores' },
    ];

    // ────────────────────────────────────────────────
    // FETCH LIVE WEATHER DATA
    // ────────────────────────────────────────────────
    const fetchLiveWeather = async () => {
        try {
            const lines = ['🌤️ LIVE BEACH WEATHER\n'];
            const selectedBeaches = INDIA_BEACHES.slice(0, 5);

            for (const beach of selectedBeaches) {
                try {
                    let weatherData = null;

                    try {
                        const res = await weatherAPI.getWeather(beach.latitude, beach.longitude).catch(() => null);
                        weatherData = res?.data || res;
                    } catch (e) {
                        // Fallback to OpenWeather
                        try {
                            const ow = await externalWeatherAPI.openWeatherOneCall(beach.latitude, beach.longitude).catch(() => null);
                            if (ow?.current) {
                                weatherData = {
                                    temperature: ow.current.temp ?? ow.current.temperature,
                                    condition: ow.current.weather?.[0]?.description,
                                    humidity: ow.current.humidity,
                                    wind_speed: ow.current.wind_speed,
                                };
                            }
                        } catch (ee) {
                            // Fallback to WeatherAPI
                            try {
                                const wa = await externalWeatherAPI.weatherapiCurrent(beach.latitude, beach.longitude).catch(() => null);
                                if (wa?.current) {
                                    weatherData = {
                                        temperature: wa.current.temp_c,
                                        condition: wa.current.condition?.text,
                                        humidity: wa.current.humidity,
                                        wind_speed: wa.current.wind_kph,
                                    };
                                }
                            } catch (eee) {
                                // Skip this beach
                            }
                        }
                    }

                    if (weatherData) {
                        const icon = getWeatherEmoji(weatherData.condition);
                        lines.push(`${icon} ${beach.name}, ${beach.city}`);
                        lines.push(`   Temperature: ${weatherData.temperature ?? '--'}°C`);
                        lines.push(`   Condition: ${weatherData.condition ?? 'Unknown'}`);
                        if (weatherData.humidity) lines.push(`   Humidity: ${weatherData.humidity}%`);
                        if (weatherData.wind_speed) lines.push(`   Wind: ${weatherData.wind_speed} km/h`);
                        lines.push('');
                    }
                } catch (err) {
                    console.error(`Weather error for ${beach.name}:`, err);
                }
            }

            if (lines.length === 1) {
                return "❌ Could not fetch live weather data. Please check your internet connection.";
            }

            lines.push('⏰ Updated just now');
            return lines.join('\n');
        } catch (err) {
            console.error('fetchLiveWeather error:', err);
            return "Unable to fetch live weather data. Try again later.";
        }
    };

    // ────────────────────────────────────────────────
    // FETCH LIVE SUITABILITY SCORES
    // ────────────────────────────────────────────────
    const fetchSuitabilityScores = async () => {
        try {
            const lines = ['🎯 BEACH SUITABILITY SCORES\n'];
            const selectedBeaches = INDIA_BEACHES.slice(0, 5);

            for (const beach of selectedBeaches) {
                try {
                    const resp = await mlAPI.getSuitability(beach.id).catch(() => null);
                    if (resp?.suitability_scores) {
                        const overall = resp.suitability_scores.overall || 0;
                        const swimming = resp.suitability_scores.swimming || 0;
                        const family = resp.suitability_scores.family || 0;

                        const scoreBar = getScoreBar(overall);
                        lines.push(`${scoreBar} ${beach.name}, ${beach.city}`);
                        lines.push(`   Overall: ${overall.toFixed(0)}%`);
                        lines.push(`   Swimming: ${swimming.toFixed(0)}% | Family: ${family.toFixed(0)}%`);
                        lines.push('');
                    }
                } catch (err) {
                    console.error(`Suitability error for ${beach.name}:`, err);
                }
            }

            if (lines.length === 1) {
                return "Score calculation available. Please try a specific beach name.";
            }

            lines.push('📊 Based on live conditions');
            return lines.join('\n');
        } catch (err) {
            console.error('fetchSuitabilityScores error:', err);
            return "Unable to fetch suitability scores right now.";
        }
    };

    // ────────────────────────────────────────────────
    // FETCH LIVE WATER QUALITY
    // ────────────────────────────────────────────────
    const fetchWaterQuality = async () => {
        try {
            const lines = ['💧 WATER QUALITY STATUS\n'];
            const selectedBeaches = INDIA_BEACHES.slice(0, 6);

            for (const beach of selectedBeaches) {
                try {
                    const vibeResp = await sentimentAPI.getBeachVibe(beach.id).catch(() => null);
                    const cvResp = await cvAPI.getConditionStatus(beach.id).catch(() => null);

                    const vibe = vibeResp?.vibe || vibeResp?.summary || 'N/A';
                    const condition = cvResp?.status || cvResp?.condition || 'Good';

                    const qualityIcon = getQualityIcon(condition);
                    lines.push(`${qualityIcon} ${beach.name}, ${beach.city}`);
                    lines.push(`   Status: ${condition}`);
                    lines.push(`   Vibe: ${vibe}`);
                    lines.push('');
                } catch (err) {
                    console.error(`Water quality error for ${beach.name}:`, err);
                }
            }

            if (lines.length === 1) {
                return "✅ Water quality data available but couldn't load right now.";
            }

            lines.push('⏰ Real-time updates');
            return lines.join('\n');
        } catch (err) {
            console.error('fetchWaterQuality error:', err);
            return "Unable to fetch water quality data.";
        }
    };

    // ────────────────────────────────────────────────
    // FETCH BEST BEACHES BY SCORE
    // ────────────────────────────────────────────────
    const fetchBestBeaches = async () => {
        try {
            const lines = ['⭐ TOP RATED BEACHES RIGHT NOW\n'];

            // Try to fetch data from backend API
            try {
                const data = await beachesAPI.getAll();
                const beaches = Array.isArray(data) ? data : data?.results || [];

                if (beaches.length > 0) {
                    const sorted = beaches
                        .filter(b => b.suitability_score !== undefined)
                        .sort((a, b) => (b.suitability_score || 0) - (a.suitability_score || 0))
                        .slice(0, 5);

                    if (sorted.length > 0) {
                        sorted.forEach((b, i) => {
                            const star = '⭐'.repeat(Math.ceil((b.suitability_score || 0) / 20));
                            lines.push(`${i + 1}. ${star} ${b.name}`);
                            lines.push(`   State: ${b.state || 'N/A'}`);
                            lines.push(`   Score: ${(b.suitability_score || 0).toFixed(0)}%`);
                            lines.push('');
                        });
                    }
                }
            } catch (err) {
                console.error('Backend fetch error:', err);
            }

            if (lines.length === 1) {
                // Fallback with static top beaches
                lines.push('1. ⭐⭐⭐⭐⭐ Radhanagar Beach, Andaman Islands');
                lines.push('   Crystal clear waters • Perfect for swimming\n');
                lines.push('2. ⭐⭐⭐⭐⭐ Palolem Beach, Goa');
                lines.push('   Scenic beauty • Water sports available\n');
                lines.push('3. ⭐⭐⭐⭐⭐ Kovalam Beach, Kerala');
                lines.push('   Coconut palms • Ayurvedic spas\n');
                lines.push('4. ⭐⭐⭐⭐ Calangute Beach, Goa');
                lines.push('   Popular beach • Great facilities\n');
                lines.push('5. ⭐⭐⭐⭐ Marine Drive, Mumbai');
                lines.push('   Urban beach • Scenic sunset');
            }

            lines.push('\n📍 Based on current conditions');
            return lines.join('\n');
        } catch (err) {
            console.error('fetchBestBeaches error:', err);
            return "Unable to fetch top beaches right now.";
        }
    };

    // ────────────────────────────────────────────────
    // DYNAMIC RESPONSE GENERATOR
    // ────────────────────────────────────────────────
    const generateResponse = async (userMessage) => {
        const lower = userMessage.toLowerCase();

        // Weather queries
        if (lower.includes('weather') || lower.includes('temperature') || lower.includes('forecast') || lower.includes('condition')) {
            return await fetchLiveWeather();
        }

        // Best beaches queries
        if (lower.includes('best beach') || lower.includes('top beach') || lower.includes('recommend') || lower.includes('which beach')) {
            return await fetchBestBeaches();
        }

        // Water quality queries
        if (lower.includes('water quality') || lower.includes('clean') || lower.includes('pollution') || lower.includes('quality')) {
            return await fetchWaterQuality();
        }

        // Suitability queries
        if (lower.includes('suitability') || lower.includes('suitable') || lower.includes('score') || lower.includes('rating')) {
            return await fetchSuitabilityScores();
        }

        // Safety tips
        if (lower.includes('safety') || lower.includes('safe') || lower.includes('danger') || lower.includes('tips')) {
            return `⚠️ BEACH SAFETY TIPS

1. 🏊 SWIMMING SAFETY
   • Only swim in designated areas
   • Don't swim alone
   • Avoid high tide periods
   • Check weather before going

2. ☀️ SUN PROTECTION
   • Apply SPF 50+ sunscreen
   • Reapply every 2 hours
   • Wear UV-protective clothing
   • Stay hydrated (drink water)

3. 🌊 WATER AWARENESS
   • Be aware of rip currents
   • Never turn your back to the sea
   • Watch out for waves
   • Follow lifeguard instructions

4. 💰 VALUABLES PROTECTION
   • Don't carry expensive items
   • Use lockers if available
   • Keep documents secure
   • Avoid walking alone at night

5. 🆘 EMERGENCY CONTACTS
   • Lifeguard: Available 7 AM - 7 PM
   • Police: 100
   • Ambulance: 108
   • Coast Guard: 1554

Stay safe and enjoy the beach! 🏖️`;
        }

        // Facilities queries
        if (lower.includes('facility') || lower.includes('facilities') || lower.includes('hotel') || lower.includes('amenities') || lower.includes('food')) {
            return `🏨 BEACH FACILITIES & AMENITIES

ACCOMMODATION OPTIONS
💰 Budget Hotels: ₹1,500 - ₹3,000/night
💰 Mid-Range: ₹3,000 - ₹8,000/night
💎 Luxury Resorts: ₹8,000+/night

FACILITIES AVAILABLE
✓ Restaurants & Beach Shacks
✓ Restrooms & Changing Rooms
✓ Parking (Free/Paid)
✓ Medical Centers & First Aid
✓ Water Sports Equipment Rental
✓ Beach Umbrellas & Loungers
✓ Lifeguard Services
✓ WiFi Hotspots
✓ ATMs & Shopping

POPULAR ACTIVITIES
🏄 Water Sports: Surfing, Jet Skiing, Parasailing
🏐 Beach Sports: Volleyball, Frisbee, Soccer
🎣 Fishing & Photography
🧘 Yoga Sessions
🎉 Sunset Events & Bonfire

Ask for a specific beach to get detailed facility information! 📍`;
        }

        // Default response
        return `I'm SamudraSetu Assistant! 🏖️

I can help you with:
🌤️ Live Weather - See current conditions at beaches
⭐ Best Beaches - Get top recommendations
💧 Water Quality - Check cleanliness status
🏨 Facilities - Find hotels, food, amenities
⚠️ Safety - Learn beach safety tips
🎯 Suitability - Check beach scores
🏄 Activities - Discover water sports

Try asking me about:
• "Show me live weather"
• "Which beaches are best?"
• "Water quality status"
• "Safety tips"
• "Nearby facilities"

How can I help? 😊`;
    };

    // ────────────────────────────────────────────────
    // HELPER FUNCTIONS
    // ────────────────────────────────────────────────
    const getWeatherEmoji = (condition) => {
        if (!condition) return '🌊';
        const lower = condition.toLowerCase();
        if (lower.includes('sunny') || lower.includes('clear')) return '☀️';
        if (lower.includes('cloud')) return '☁️';
        if (lower.includes('rain')) return '🌧️';
        if (lower.includes('storm')) return '⛈️';
        if (lower.includes('wind')) return '💨';
        if (lower.includes('haze')) return '🌫️';
        return '🌊';
    };

    const getQualityIcon = (condition) => {
        if (!condition) return '💧';
        const lower = condition.toLowerCase();
        if (lower.includes('excellent') || lower.includes('clean')) return '✅';
        if (lower.includes('good')) return '✅';
        if (lower.includes('fair') || lower.includes('moderate')) return '⚠️';
        if (lower.includes('poor') || lower.includes('bad')) return '❌';
        return '💧';
    };

    const getScoreBar = (score) => {
        if (score >= 80) return '🟢';
        if (score >= 60) return '🟡';
        if (score >= 40) return '🟠';
        return '🔴';
    };

    const formatTime = (date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    };

    // ────────────────────────────────────────────────
    // SEND MESSAGE
    // ────────────────────────────────────────────────
    const handleSend = () => {
        if (inputText.trim() === '') return;

        const userMessage = {
            id: messages.length + 1,
            text: inputText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        (async () => {
            const response = await generateResponse(inputText);
            const botResponse = {
                id: messages.length + 2,
                text: response,
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        })();
    };

    // ────────────────────────────────────────────────
    // QUICK ACTION
    // ────────────────────────────────────────────────
    const handleQuickAction = (query) => {
        const userMessage = {
            id: messages.length + 1,
            text: query,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        (async () => {
            const response = await generateResponse(query);
            const botResponse = {
                id: messages.length + 2,
                text: response,
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        })();
    };

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages, isTyping]);

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* ═══════════════════════════════════════════ HEADER ═══════════════════════════════════════════ */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.botAvatar}>
                            <Text style={styles.botAvatarText}>🤖</Text>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerTitle}>SamudraSetu</Text>
                            <Text style={styles.headerStatus}>● Live Data Mode</Text>
                        </View>
                    </View>
                </View>

                {/* ═══════════════════════════════════════════ QUICK ACTIONS ═══════════════════════════════════════════ */}
                {messages.length === 1 && (
                    <View style={styles.quickActionsContainer}>
                        <Text style={styles.quickActionsTitle}>Try these:</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.quickActionsScroll}
                        >
                            {quickActions.map((action) => (
                                <TouchableOpacity
                                    key={action.id}
                                    style={styles.quickActionButton}
                                    onPress={() => handleQuickAction(action.query)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.quickActionIcon}>{action.icon}</Text>
                                    <Text style={styles.quickActionText}>{action.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* ═══════════════════════════════════════════ MESSAGES ═══════════════════════════════════════════ */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((message) => (
                        <View
                            key={message.id}
                            style={[
                                styles.messageWrapper,
                                message.sender === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper,
                            ]}
                        >
                            {message.sender === 'bot' && (
                                <View style={styles.messageBotAvatar}>
                                    <Text style={styles.messageBotAvatarText}>🤖</Text>
                                </View>
                            )}
                            <View
                                style={[
                                    styles.messageBubble,
                                    message.sender === 'user' ? styles.userMessage : styles.botMessage,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.messageText,
                                        message.sender === 'user' ? styles.userMessageText : styles.botMessageText,
                                    ]}
                                >
                                    {message.text}
                                </Text>
                                <Text
                                    style={[
                                        styles.messageTime,
                                        message.sender === 'user' ? styles.userMessageTime : styles.botMessageTime,
                                    ]}
                                >
                                    {formatTime(message.timestamp)}
                                </Text>
                            </View>
                        </View>
                    ))}

                    {isTyping && (
                        <View style={styles.typingIndicatorWrapper}>
                            <View style={styles.messageBotAvatar}>
                                <Text style={styles.messageBotAvatarText}>🤖</Text>
                            </View>
                            <View style={styles.typingIndicator}>
                                <ActivityIndicator size="small" color="#00D4FF" />
                                <Text style={styles.typingText}>Fetching live data...</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* ═══════════════════════════════════════════ INPUT ═══════════════════════════════════════════ */}
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ask about weather, quality, safety..."
                            placeholderTextColor="#999"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            onSubmitEditing={handleSend}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={inputText.trim() === ''}
                        >
                            <Text style={styles.sendButtonText}>➤</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        backgroundColor: '#1E293B',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,212,255,0.1)',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    botAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,212,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: 'rgba(0,212,255,0.3)',
    },
    botAvatarText: {
        fontSize: 22,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#00D4FF',
        marginBottom: 2,
    },
    headerStatus: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    quickActionsContainer: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingVertical: 12,
        paddingLeft: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,212,255,0.1)',
    },
    quickActionsTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#CBD5E1',
        marginBottom: 10,
    },
    quickActionsScroll: {
        paddingRight: 16,
    },
    quickActionButton: {
        backgroundColor: 'rgba(0,212,255,0.12)',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,212,255,0.25)',
    },
    quickActionIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    quickActionText: {
        fontSize: 12,
        color: '#00D4FF',
        fontWeight: '600',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 10,
        maxWidth: '88%',
    },
    userMessageWrapper: {
        alignSelf: 'flex-end',
    },
    botMessageWrapper: {
        alignSelf: 'flex-start',
    },
    messageBotAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,212,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,212,255,0.3)',
    },
    messageBotAvatarText: {
        fontSize: 18,
    },
    messageBubble: {
        borderRadius: 16,
        paddingVertical: 11,
        paddingHorizontal: 14,
    },
    userMessage: {
        backgroundColor: '#00D4FF',
        borderBottomRightRadius: 4,
    },
    botMessage: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,212,255,0.2)',
        flex: 1,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 21,
        marginBottom: 4,
    },
    userMessageText: {
        color: '#0F172A',
        fontWeight: '500',
    },
    botMessageText: {
        color: '#E2E8F0',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 2,
    },
    userMessageTime: {
        color: 'rgba(0,0,0,0.5)',
        textAlign: 'right',
    },
    botMessageTime: {
        color: '#64748B',
    },
    typingIndicatorWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    typingIndicator: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,212,255,0.2)',
    },
    typingText: {
        fontSize: 13,
        color: '#94A3B8',
        marginLeft: 8,
        fontWeight: '500',
    },
    inputContainer: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        paddingBottom: 16,
        backgroundColor: 'rgba(30,41,59,0.8)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,212,255,0.1)',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        maxHeight: 90,
        borderWidth: 1,
        borderColor: 'rgba(0,212,255,0.15)',
        color: '#fff',
    },
    sendButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#00D4FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: 'rgba(0,212,255,0.4)',
    },
    sendButtonText: {
        color: '#0F172A',
        fontSize: 20,
        fontWeight: '700',
    },
});