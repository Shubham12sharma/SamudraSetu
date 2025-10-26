import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';

export default function AssistantScreen() {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! I'm your Beach Assistant 🏖️. I can help you with:\n\n• Beach suitability information\n• Weather conditions\n• Water quality updates\n• Nearby facilities\n• Safety tips\n• Travel suggestions\n\nWhat would you like to know?",
            sender: 'bot',
            timestamp: new Date(),
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollViewRef = useRef(null);

    // Quick action buttons
    const quickActions = [
        { id: 1, icon: '🌊', text: 'Beach Weather', query: 'What is the weather like at beaches today?' },
        { id: 2, icon: '💧', text: 'Water Quality', query: 'Tell me about water quality at beaches' },
        { id: 3, icon: '🏨', text: 'Nearby Hotels', query: 'Show me hotels near beaches' },
        { id: 4, icon: '⚠️', text: 'Safety Tips', query: 'Give me beach safety tips' },
        { id: 5, icon: '🗺️', text: 'Best Beaches', query: 'What are the best beaches to visit?' },
        { id: 6, icon: '🚗', text: 'How to Reach', query: 'How can I reach the nearest beach?' },
    ];

    // Predefined responses based on keywords
    const getBotResponse = (userMessage) => {
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('weather') || lowerMessage.includes('temperature') || lowerMessage.includes('forecast')) {
            return "🌤️ Current Beach Weather:\n\n• Mumbai (Juhu Beach): 28°C, Sunny, Light breeze\n• Goa (Calangute): 30°C, Partly cloudy, Moderate waves\n• Chennai (Marina): 32°C, Clear sky, Calm waters\n\nWind Speed: 15-20 km/h\nUV Index: Moderate\n\nBest time to visit: Early morning (6-9 AM) or evening (4-7 PM)\n\nWould you like detailed forecast for a specific beach?";
        }

        if (lowerMessage.includes('water quality') || lowerMessage.includes('clean') || lowerMessage.includes('pollution')) {
            return "💧 Water Quality Status:\n\n✅ Excellent:\n• Calangute Beach, Goa\n• Radhanagar Beach, Andaman\n• Kovalam Beach, Kerala\n\n⚠️ Moderate:\n• Juhu Beach, Mumbai\n• Marina Beach, Chennai\n\n❌ Caution:\n• Some beaches near industrial areas\n\nWater quality is tested regularly. Check real-time updates in the app for specific beaches!";
        }

        if (lowerMessage.includes('hotel') || lowerMessage.includes('stay') || lowerMessage.includes('accommodation') || lowerMessage.includes('facilities')) {
            return "🏨 Nearby Facilities:\n\nHotels:\n• Budget: ₹1,500 - ₹3,000/night\n• Mid-range: ₹3,000 - ₹8,000/night\n• Luxury: ₹8,000+/night\n\nAmenities Available:\n✓ Restaurants & Beach shacks\n✓ Restrooms & changing rooms\n✓ Parking facilities\n✓ Medical centers\n✓ Water sports equipment\n\nWould you like recommendations for a specific beach?";
        }

        if (lowerMessage.includes('safety') || lowerMessage.includes('safe') || lowerMessage.includes('danger') || lowerMessage.includes('tips')) {
            return "⚠️ Beach Safety Tips:\n\n1. Swim only in designated areas\n2. Always check weather conditions\n3. Follow lifeguard instructions\n4. Avoid swimming during high tide\n5. Stay hydrated and use sunscreen\n6. Don't swim alone\n7. Keep valuables secure\n8. Be aware of rip currents\n\n🆘 Emergency Contacts:\n• Lifeguard: Available 7 AM - 7 PM\n• Police: 100\n• Ambulance: 108\n\nStay safe and enjoy! 🏖️";
        }

        if (lowerMessage.includes('best beach') || lowerMessage.includes('recommend') || lowerMessage.includes('top beach') || lowerMessage.includes('which beach')) {
            return "🏖️ Top Rated Beaches:\n\n⭐⭐⭐⭐⭐ (5.0)\n1. Radhanagar Beach, Andaman\n   • Crystal clear water\n   • White sand\n   • Perfect for swimming\n\n⭐⭐⭐⭐½ (4.8)\n2. Palolem Beach, Goa\n   • Scenic beauty\n   • Water sports\n   • Great nightlife\n\n⭐⭐⭐⭐½ (4.7)\n3. Varkala Beach, Kerala\n   • Cliff views\n   • Ayurvedic centers\n   • Less crowded\n\nWant details about any specific beach?";
        }

        if (lowerMessage.includes('reach') || lowerMessage.includes('how to go') || lowerMessage.includes('transport') || lowerMessage.includes('travel')) {
            return "🚗 How to Reach Beaches:\n\nTransportation Options:\n\n🚕 Taxi/Cab:\n• Most convenient\n• Book via Ola/Uber\n\n🚌 Public Transport:\n• Local buses available\n• Affordable option\n\n🚂 Train:\n• Nearest railway stations\n• Pre-book tickets\n\n✈️ Flight:\n• Major cities have airports\n• Rent vehicles at airport\n\n📍 Which beach are you planning to visit? I can give specific directions!";
        }

        if (lowerMessage.includes('activity') || lowerMessage.includes('activities') || lowerMessage.includes('things to do') || lowerMessage.includes('sports')) {
            return "🏄 Beach Activities:\n\n🌊 Water Sports:\n• Surfing & Parasailing\n• Jet skiing\n• Scuba diving\n• Banana boat rides\n\n🏐 Beach Sports:\n• Volleyball\n• Frisbee\n• Beach soccer\n\n🎣 Other Activities:\n• Fishing\n• Photography\n• Yoga sessions\n• Beach camping\n• Sunset watching\n\nCheck with specific beaches for availability and pricing!";
        }

        if (lowerMessage.includes('clean') || lowerMessage.includes('community') || lowerMessage.includes('volunteer') || lowerMessage.includes('event')) {
            return "♻️ Beach Cleaning Events:\n\n📅 Upcoming Events:\n• Juhu Beach Cleanup - Nov 2\n• Marina Beach Drive - Nov 5\n• Goa Clean Coast - Nov 8\n\nHow to Join:\n1. Register in the Community section\n2. Check event details\n3. Show up on time\n4. Help make a difference!\n\n👥 Current Members: 5000+\n🌊 Beaches Cleaned: 150+\n\nJoin our community tab to participate!";
        }

        if (lowerMessage.includes('suitable') || lowerMessage.includes('suitability') || lowerMessage.includes('score') || lowerMessage.includes('rating')) {
            return "📊 Beach Suitability Index:\n\nWe calculate suitability based on:\n\n✓ Water Quality (30%)\n✓ Weather Conditions (25%)\n✓ Safety Measures (20%)\n✓ Amenities (15%)\n✓ Crowd Level (10%)\n\n🟢 Excellent (8-10): Perfect for visit\n🟡 Good (6-8): Suitable with minor considerations\n🟠 Fair (4-6): Visit with caution\n🔴 Poor (0-4): Not recommended\n\nCheck the Explore tab for live suitability scores!";
        }

        return "I'm here to help! I can assist you with:\n\n• Beach weather forecasts\n• Water quality information\n• Nearby facilities and hotels\n• Safety tips and guidelines\n• Best beach recommendations\n• Travel directions\n• Beach activities\n• Community events\n\nCould you please be more specific about what you'd like to know? 😊";
    };

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

        setTimeout(() => {
            const botResponse = {
                id: messages.length + 2,
                text: getBotResponse(inputText),
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        }, 1500);
    };

    const handleQuickAction = (query) => {
        setInputText(query);
        setTimeout(() => {
            const userMessage = {
                id: messages.length + 1,
                text: query,
                sender: 'user',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, userMessage]);
            setIsTyping(true);

            setTimeout(() => {
                const botResponse = {
                    id: messages.length + 2,
                    text: getBotResponse(query),
                    sender: 'bot',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, botResponse]);
                setIsTyping(false);
            }, 1500);
        }, 100);
    };

    const handleSearch = () => {
        if (searchQuery.trim() === '') return;
        handleQuickAction(searchQuery);
        setSearchQuery('');
    };

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages, isTyping]);

    const formatTime = (date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
               
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.botAvatar}>
                            <Text style={styles.botAvatarText}>🤖</Text>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerTitle}>SamudraSetu Assistant</Text>
                            <Text style={styles.headerStatus}>● Online</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                {messages.length === 1 && (
                    <View style={styles.quickActionsContainer}>
                        <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
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
                                >
                                    <Text style={styles.quickActionIcon}>{action.icon}</Text>
                                    <Text style={styles.quickActionText}>{action.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Messages */}
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
                                <ActivityIndicator size="small" color="#0288D1" />
                                <Text style={styles.typingText}>Assistant is typing...</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask me anything about beaches..."
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FBFC',
    },

    // Search Bar Styles
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 15,
        color: '#333',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    searchButton: {
        marginLeft: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0288D1',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    searchButtonDisabled: {
        backgroundColor: '#B0BEC5',
    },
    searchButtonText: {
        fontSize: 20,
    },

    // Header Styles
    header: {
        backgroundColor: '#0288D1',
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    botAvatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    botAvatarText: {
        fontSize: 24,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    headerStatus: {
        fontSize: 11,
        color: '#B3E5FC',
    },

    // Quick Actions Styles
    quickActionsContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingLeft: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    quickActionsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#424242',
        marginBottom: 10,
    },
    quickActionsScroll: {
        paddingRight: 15,
    },
    quickActionButton: {
        backgroundColor: '#E3F2FD',
        borderRadius: 18,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0288D1',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    quickActionIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    quickActionText: {
        fontSize: 12,
        color: '#01579B',
        fontWeight: '500',
    },

    // Messages Styles
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 15,
        paddingBottom: 20, // Normal padding since nav bar is hidden
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 12,
        maxWidth: '85%',
    },
    userMessageWrapper: {
        alignSelf: 'flex-end',
    },
    botMessageWrapper: {
        alignSelf: 'flex-start',
    },
    messageBotAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    messageBotAvatarText: {
        fontSize: 18,
    },
    messageBubble: {
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    userMessage: {
        backgroundColor: '#0288D1',
        borderBottomRightRadius: 4,
    },
    botMessage: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        flex: 1,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 4,
    },
    userMessageText: {
        color: '#FFFFFF',
    },
    botMessageText: {
        color: '#212121',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 2,
    },
    userMessageTime: {
        color: '#B3E5FC',
        textAlign: 'right',
    },
    botMessageTime: {
        color: '#9E9E9E',
    },

    // Typing Indicator
    typingIndicatorWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    typingIndicator: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    typingText: {
        fontSize: 14,
        color: '#757575',
        marginLeft: 8,
    },

    // Input Styles
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 10,
        paddingBottom: 15, // Extra padding to clear bottom nav bar
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        alignItems: 'flex-end',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 90,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        color: '#333',
    },
    sendButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#0288D1',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    sendButtonDisabled: {
        backgroundColor: '#B0BEC5',
        elevation: 1,
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: 'bold',
    },
});