import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

import AssistantScreen from '../screens/AssistantScreen';
import BeachDetailsScreen from '../screens/BeachDetailScreen';
import BeachListScreen from '../screens/BeachListScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UtilitiesScreen from '../screens/UtilitiesScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function BeachStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="BeachList" component={BeachListScreen} />
            <Stack.Screen name="BeachDetails" component={BeachDetailsScreen} />
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
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    height: 65,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    position: 'absolute',
                    backgroundColor: '#fff',
                    elevation: 5,
                    display: route.name === 'Assistant' ? 'none' : 'flex',
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
                }}
            />

            <Tab.Screen
                name="Beaches"
                component={BeachStack}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="water" size={size} color={color} />,
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
                name="Utilities"
                component={UtilitiesScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="build" size={size} color={color} />,
                }}
            />

            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
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
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
                <Stack.Screen name="Login" component={LoginScreen} />
            ) : (
                <Stack.Screen name="MainTabs" component={MainTabs} />
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
    },
});
