import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

import AssistantScreen from '../screens/AssistantScreen';
import BeachDetailsScreen from '../screens/BeachDetailScreen';
import BeachListScreen from '../screens/BeachListScreen';
import CommunityScreen from '../screens/CommunityScreen';
import CVVerificationScreen from '../screens/CVVerificationScreen';
import EcoImpactScreen from '../screens/EcoImpactScreen';
import HomeScreen from '../screens/HomeScreen';
import LiveWeatherScreen from '../screens/LiveWeatherScreen';
import LoginScreen from '../screens/LoginScreen';
import MLPredictionScreen from '../screens/MLPredictionScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SentimentAnalysisScreen from '../screens/SentimentAnalysisScreen';
import UtilitiesScreen from '../screens/UtilitiesScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ✅ FIXED: Optimized Beach Stack with proper options
function BeachStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animationEnabled: true,
                cardStyle: { backgroundColor: 'transparent' },
            }}
        >
            <Stack.Screen
                name="BeachList"
                component={BeachListScreen}
                options={{
                    cardStyle: { backgroundColor: '#F0F9FC' },
                }}
            />
            <Stack.Screen
                name="BeachDetails"
                component={BeachDetailsScreen}
                options={{
                    cardStyle: { backgroundColor: '#F0F9FC' },
                    animationEnabled: true,
                    gestureEnabled: true,
                    gestureResponseDistance: 135,
                }}
            />
        </Stack.Navigator>
    );
}

function MainTabs() {
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loopPulse = () => {
            pulseAnim.setValue(0);
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start(() => loopPulse());
        };
        loopPulse();
        return () => pulseAnim.stopAnimation();
    }, [pulseAnim]);

    const ringStyle = {
        opacity: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 0],
        }),
        transform: [
            {
                scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.8],
                }),
            },
        ],
    };

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: '#0277BD',
                tabBarInactiveTintColor: '#A0AEC0',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                },
                tabBarStyle: {
                    height: 75,
                    paddingBottom: Platform.OS === 'android' ? 16 : 8,
                    paddingTop: 8,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    position: 'absolute',
                    backgroundColor: '#fff',
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    display: route.name === 'Assistant' ? 'none' : 'flex',
                    borderTopWidth: 1,
                    borderTopColor: '#F1F5F9',
                },
                // ✅ CRITICAL: Prevent tab bar from interfering with screen scrolling
                swipeEnabled: true,
                lazy: true,
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />

            <Tab.Screen
                name="Beaches"
                component={BeachStack}
                options={{
                    tabBarLabel: 'Beaches',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="water" size={size} color={color} />
                    ),
                }}
            />

            <Tab.Screen
                name="Assistant"
                component={AssistantScreen}
                options={{
                    tabBarLabel: '',
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.assistantButtonContainer}>
                            <View style={styles.outerWrapper}>
                                <Animated.View style={[styles.ring, ringStyle]} />
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    style={styles.assistantButton}
                                >
                                    <Ionicons name="sparkles" size={22} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.assistantLabel}>Assistant</Text>
                        </View>
                    ),
                }}
            />

            <Tab.Screen
                name="Community"
                component={CommunityScreen}
                options={{
                    tabBarLabel: 'Community',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubbles" size={size} color={color} />
                    ),
                }}
            />

            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { user, loading: authLoading } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Wait briefly so initial provider load completes
        setLoading(authLoading);
    }, [authLoading]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0288D1" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animationEnabled: true,
                gestureEnabled: true,
                cardOverlayEnabled: false,
            }}
        >
            {!user ? (
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{
                        animationEnabled: false,
                    }}
                />
            ) : (
                <>
                    <Stack.Screen
                        name="MainTabs"
                        component={MainTabs}
                        options={{
                            animationEnabled: false,
                        }}
                    />
                    <Stack.Screen
                        name="CVVerification"
                        component={CVVerificationScreen}
                        options={{
                            animationEnabled: true,
                            gestureEnabled: true,
                            cardStyle: { backgroundColor: 'transparent' },
                        }}
                    />
                    <Stack.Screen
                        name="MLPrediction"
                        component={MLPredictionScreen}
                        options={{
                            animationEnabled: true,
                            gestureEnabled: true,
                            cardStyle: { backgroundColor: 'transparent' },
                        }}
                    />
                    <Stack.Screen
                        name="SentimentAnalysis"
                        component={SentimentAnalysisScreen}
                        options={{
                            animationEnabled: true,
                            gestureEnabled: true,
                            cardStyle: { backgroundColor: 'transparent' },
                        }}
                    />
                    <Stack.Screen
                        name="LiveWeather"
                        component={LiveWeatherScreen}
                        options={{
                            animationEnabled: true,
                            gestureEnabled: true,
                            cardStyle: { backgroundColor: 'transparent' },
                        }}
                    />
                    <Stack.Screen
                        name="EcoImpact"
                        component={EcoImpactScreen}
                        options={{
                            animationEnabled: true,
                            gestureEnabled: true,
                            cardStyle: { backgroundColor: 'transparent' },
                        }}
                    />
                    <Stack.Screen
                        name="Utilities"
                        component={UtilitiesScreen}
                        options={{
                            animationEnabled: true,
                            gestureEnabled: true,
                            cardStyle: { backgroundColor: 'transparent' },
                        }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    assistantButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        top: -15,
    },
    outerWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    ring: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#4FC3F7',
        borderWidth: 1,
        borderColor: '#00BFFF',
    },
    assistantButton: {
        width: 55,
        height: 55,
        borderRadius: 35,
        backgroundColor: '#0277BD',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#00BFFF',
        shadowOpacity: 0.6,
        shadowRadius: 8,
    },
    assistantLabel: {
        fontSize: 12,
        color: '#0277BD',
        marginTop: 4,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
    },
    loadingText: {
        marginTop: 10,
        color: '#0277BD',
        fontSize: 16,
        fontWeight: '600',
    },
});