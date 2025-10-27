import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Animated, Easing } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import BeachListScreen from '../screens/BeachListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UtilitiesScreen from '../screens/UtilitiesScreen';
import AssistantScreen from '../screens/AssistantScreen';
import BeachDetailsScreen from '../screens/BeachDetailScreen';

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

export default function AppNavigator() {
    const pulseAnim = useRef(new Animated.Value(0)).current;

    // Continuous pulsing ring animation
    useEffect(() => {
        const loopPulse = () => {
            pulseAnim.setValue(0);
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true, // Use native driver for better performance
            }).start(() => loopPulse());
        };
        loopPulse();

        // Cleanup animation on unmount
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
                    // Hide tab bar only for Assistant screen
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
                component={BeachStack} // Use StackNavigator for beaches
                options={{
                    tabBarIcon: ({ color, size }) => <Ionicons name="water" size={size} color={color} />,
                }}
            />

            {/* 🔹 Floating Assistant Button with Pulse Ring 🔹 */}
            <Tab.Screen
                name="Assistant"
                component={AssistantScreen}
                options={{
                    tabBarLabel: '',
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.assistantButtonContainer}>
                            <View style={styles.outerWrapper}>
                                {/* Animated ring */}
                                <Animated.View style={[styles.ring, ringStyle]} />
                                {/* Center glowing button */}
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    style={styles.assistantButton}
                                    onPress={() => { /* Add navigation logic if needed */ }}
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
        borderColor: '#00BFFF', // Slight outline for better visibility
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
});