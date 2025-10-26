import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Animated, Easing } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import BeachListScreen from '../screens/BeachListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UtilitiesScreen from '../screens/UtilitiesScreen';
import AssistantScreen from '../screens/AssistantScreen';

const Tab = createBottomTabNavigator();

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
                useNativeDriver: false,
            }).start(() => loopPulse());
        };
        loopPulse();
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
            screenOptions={{
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
                },
            }}
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
                component={BeachListScreen}
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
                                    onPress={() => {
                                        // Later: open assistant modal
                                    }}
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
