import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Modal, TextInput, Alert } from 'react-native';

export default function HomeScreen() {
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [eventName, setEventName] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [communities, setCommunities] = useState([
        { id: 1, name: 'Juhu Beach Guardians', location: 'Juhu Beach, Mumbai', members: 234, nextEvent: '2025-11-02' },
        { id: 2, name: 'Marina Eco Warriors', location: 'Marina Beach, Chennai', members: 189, nextEvent: '2025-11-05' },
        { id: 3, name: 'Goa Clean Coast', location: 'Baga Beach, Goa', members: 456, nextEvent: '2025-11-01' },
    ]);

    const handleJoinCommunity = () => {
        if (!userName.trim() || !userEmail.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        Alert.alert('Success', `Welcome ${userName}! You've joined the beach cleaning community.`);
        setShowJoinModal(false);
        setUserName('');
        setUserEmail('');
    };

    const handleCreateEvent = () => {
        if (!eventName.trim() || !eventLocation.trim() || !eventDate.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        const newCommunity = {
            id: communities.length + 1,
            name: eventName,
            location: eventLocation,
            members: 1,
            nextEvent: eventDate
        };
        setCommunities([...communities, newCommunity]);
        Alert.alert('Success', 'Your beach cleaning event has been created!');
        setShowCreateModal(false);
        setEventName('');
        setEventLocation('');
        setEventDate('');
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400' }}
                        style={styles.headerImage}
                    />
                    <Text style={styles.title}>🏖️ SamudraSetu</Text>
                    <Text style={styles.subtitle}>Join the Beach Cleaning Community!</Text>
                    <Text style={styles.description}>
                        Help keep India's beaches clean and sustainable. Connect with others, share efforts, and make a difference!
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => setShowJoinModal(true)}
                    >
                        <Text style={styles.buttonText}>Join Community</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => setShowCreateModal(true)}
                    >
                        <Text style={styles.secondaryButtonText}>Create Event</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>150+</Text>
                        <Text style={styles.statLabel}>Beaches</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>5000+</Text>
                        <Text style={styles.statLabel}>Members</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>200+</Text>
                        <Text style={styles.statLabel}>Events</Text>
                    </View>
                </View>

                {/* Active Communities */}
                <View style={styles.communitiesSection}>
                    <Text style={styles.sectionTitle}>Active Communities</Text>
                    {communities.map((community) => (
                        <View key={community.id} style={styles.communityCard}>
                            <View style={styles.communityInfo}>
                                <Text style={styles.communityName}>{community.name}</Text>
                                <Text style={styles.communityLocation}>📍 {community.location}</Text>
                                <View style={styles.communityMeta}>
                                    <Text style={styles.metaText}>👥 {community.members} members</Text>
                                    <Text style={styles.metaText}>📅 Next: {community.nextEvent}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.joinSmallButton}
                                onPress={() => setShowJoinModal(true)}
                            >
                                <Text style={styles.joinSmallButtonText}>Join</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Features Section */}
                <View style={styles.featuresSection}>
                    <Text style={styles.sectionTitle}>What We Offer</Text>
                    <View style={styles.featureCard}>
                        <Text style={styles.featureIcon}>🗺️</Text>
                        <Text style={styles.featureTitle}>Beach Discovery</Text>
                        <Text style={styles.featureText}>Explore beaches with suitability scores</Text>
                    </View>
                    <View style={styles.featureCard}>
                        <Text style={styles.featureIcon}>🌊</Text>
                        <Text style={styles.featureTitle}>Real-time Data</Text>
                        <Text style={styles.featureText}>Weather, water quality & safety info</Text>
                    </View>
                    <View style={styles.featureCard}>
                        <Text style={styles.featureIcon}>♻️</Text>
                        <Text style={styles.featureTitle}>Community Action</Text>
                        <Text style={styles.featureText}>Join cleaning events & make impact</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Join Community Modal */}
            <Modal
                visible={showJoinModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowJoinModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Join Beach Cleaning Community</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Your Name"
                            value={userName}
                            onChangeText={setUserName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            value={userEmail}
                            onChangeText={setUserEmail}
                            keyboardType="email-address"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={handleJoinCommunity}
                            >
                                <Text style={styles.buttonText}>Join Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowJoinModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Create Event Modal */}
            <Modal
                visible={showCreateModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create Beach Cleaning Event</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Event Name"
                            value={eventName}
                            onChangeText={setEventName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Beach Location"
                            value={eventLocation}
                            onChangeText={setEventLocation}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Date (YYYY-MM-DD)"
                            value={eventDate}
                            onChangeText={setEventDate}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={handleCreateEvent}
                            >
                                <Text style={styles.buttonText}>Create Event</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowCreateModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    header: {
        backgroundColor: '#E3F2FD',
        padding: 20,
        alignItems: 'center',
    },
    headerImage: {
        width: '100%',
        height: 200,
        borderRadius: 15,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 20,
        color: '#0277BD',
        marginBottom: 15,
        textAlign: 'center',
        fontWeight: '600',
    },
    description: {
        fontSize: 15,
        color: '#424242',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        gap: 10,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#0288D1',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#0288D1',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButtonText: {
        color: '#0288D1',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    statBox: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0288D1',
    },
    statLabel: {
        fontSize: 12,
        color: '#757575',
        marginTop: 5,
    },
    communitiesSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 15,
    },
    communityCard: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    communityInfo: {
        flex: 1,
    },
    communityName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 5,
    },
    communityLocation: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 8,
    },
    communityMeta: {
        flexDirection: 'row',
        gap: 15,
    },
    metaText: {
        fontSize: 12,
        color: '#9E9E9E',
    },
    joinSmallButton: {
        backgroundColor: '#0288D1',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    joinSmallButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    featuresSection: {
        padding: 20,
    },
    featureCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    featureIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 5,
    },
    featureText: {
        fontSize: 14,
        color: '#757575',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 25,
        width: '85%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    modalButtons: {
        gap: 10,
        marginTop: 10,
    },
    modalButton: {
        backgroundColor: '#0288D1',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cancelButtonText: {
        color: '#757575',
        fontSize: 16,
        fontWeight: '600',
    },
});