import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Image,
    Alert,
    SafeAreaView
} from 'react-native';

export default function ProfileScreen() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Login/Signup form states
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupPhone, setSignupPhone] = useState('');

    // User profile data
    const [userProfile, setUserProfile] = useState({
        name: 'Shubham Sharma',
        email: 'shubhamsharma68653@gmail.com',
        phone: '+91 98765 43210',
        location: 'Mumbai, Maharashtra',
        memberSince: 'January 2024',
        bio: 'Passionate about keeping our beaches clean and protecting marine life.',
        avatar: 'https://ui-avatars.com/api/?name=Shubham+Sharma&size=200&background=0288D1&color=fff'
    });

    // Edit form states
    const [editName, setEditName] = useState(userProfile.name);
    const [editPhone, setEditPhone] = useState(userProfile.phone);
    const [editLocation, setEditLocation] = useState(userProfile.location);
    const [editBio, setEditBio] = useState(userProfile.bio);

    // User activity data
    const [userStats] = useState({
        eventsJoined: 12,
        beachesVisited: 8,
        reviewsPosted: 15,
        photoShared: 24
    });

    const [savedBeaches, setSavedBeaches] = useState([
        { id: 1, name: 'Juhu Beach', location: 'Mumbai', rating: 4.5 },
        { id: 2, name: 'Marina Beach', location: 'Chennai', rating: 4.2 },
        { id: 3, name: 'Calangute Beach', location: 'Goa', rating: 4.8 }
    ]);

    const [recentActivity] = useState([
        { id: 1, type: 'event', text: 'Joined Juhu Beach Cleanup', date: '2 days ago' },
        { id: 2, type: 'review', text: 'Reviewed Marina Beach', date: '5 days ago' },
        { id: 3, type: 'photo', text: 'Shared photo at Calangute Beach', date: '1 week ago' }
    ]);

    const handleLogin = () => {
        if (!loginEmail.trim() || !loginPassword.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setLoginEmail('');
        setLoginPassword('');
        Alert.alert('Success', 'Login successful!');
    };

    const handleSignup = () => {
        if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        setUserProfile({
            ...userProfile,
            name: signupName,
            email: signupEmail,
            phone: signupPhone,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(signupName)}&size=200&background=0288D1&color=fff`
        });
        setIsLoggedIn(true);
        setShowSignupModal(false);
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupPhone('');
        Alert.alert('Success', 'Account created successfully!');
    };

    const handleEditProfile = () => {
        if (!editName.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }
        setUserProfile({
            ...userProfile,
            name: editName,
            phone: editPhone,
            location: editLocation,
            bio: editBio,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(editName)}&size=200&background=0288D1&color=fff`
        });
        setShowEditModal(false);
        Alert.alert('Success', 'Profile updated successfully!');
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    onPress: () => {
                        setIsLoggedIn(false);
                        Alert.alert('Success', 'Logged out successfully!');
                    }
                }
            ]
        );
    };

    const removeSavedBeach = (id) => {
        Alert.alert(
            'Remove Beach',
            'Remove this beach from saved list?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    onPress: () => setSavedBeaches(savedBeaches.filter(beach => beach.id !== id))
                }
            ]
        );
    };

    // Not logged in view
    if (!isLoggedIn) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.welcomeContainer}>
                    <ScrollView contentContainerStyle={styles.welcomeContent}>
                        <Text style={styles.welcomeEmoji}>👤</Text>
                        <Text style={styles.welcomeTitle}>Welcome to SamudraSetu</Text>
                        <Text style={styles.welcomeSubtitle}>
                            Login or create an account to manage your beach activities and join our community.
                        </Text>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => setShowLoginModal(true)}
                        >
                            <Text style={styles.primaryButtonText}>Login</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => setShowSignupModal(true)}
                        >
                            <Text style={styles.secondaryButtonText}>Create Account</Text>
                        </TouchableOpacity>

                        <View style={styles.benefitsContainer}>
                            <Text style={styles.benefitsTitle}>Benefits of having an account:</Text>
                            <View style={styles.benefitItem}>
                                <Text style={styles.checkmark}>✓</Text>
                                <Text style={styles.benefitText}>Save favorite beaches</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Text style={styles.checkmark}>✓</Text>
                                <Text style={styles.benefitText}>Join cleaning events</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Text style={styles.checkmark}>✓</Text>
                                <Text style={styles.benefitText}>Post reviews and photos</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Text style={styles.checkmark}>✓</Text>
                                <Text style={styles.benefitText}>Track your contributions</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* Login Modal */}
                <Modal
                    visible={showLoginModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowLoginModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Login to Your Account</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                value={loginEmail}
                                onChangeText={setLoginEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                value={loginPassword}
                                onChangeText={setLoginPassword}
                                secureTextEntry
                            />
                            <TouchableOpacity style={styles.modalButton} onPress={handleLogin}>
                                <Text style={styles.modalButtonText}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowLoginModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowLoginModal(false);
                                    setShowSignupModal(true);
                                }}
                                style={styles.switchButton}
                            >
                                <Text style={styles.switchButtonText}>
                                    Don't have an account? <Text style={styles.linkText}>Sign up</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Signup Modal */}
                <Modal
                    visible={showSignupModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowSignupModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <ScrollView contentContainerStyle={styles.modalScrollContent}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Create Your Account</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name *"
                                    value={signupName}
                                    onChangeText={setSignupName}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address *"
                                    value={signupEmail}
                                    onChangeText={setSignupEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password *"
                                    value={signupPassword}
                                    onChangeText={setSignupPassword}
                                    secureTextEntry
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Phone Number (Optional)"
                                    value={signupPhone}
                                    onChangeText={setSignupPhone}
                                    keyboardType="phone-pad"
                                />
                                <TouchableOpacity style={styles.modalButton} onPress={handleSignup}>
                                    <Text style={styles.modalButtonText}>Create Account</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setShowSignupModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowSignupModal(false);
                                        setShowLoginModal(true);
                                    }}
                                    style={styles.switchButton}
                                >
                                    <Text style={styles.switchButtonText}>
                                        Already have an account? <Text style={styles.linkText}>Login</Text>
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </Modal>
            </SafeAreaView>
        );
    }

    // Logged in view
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <Image
                        source={{ uri: userProfile.avatar }}
                        style={styles.avatar}
                    />
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{userProfile.name}</Text>
                        <Text style={styles.profileDetail}>📧 {userProfile.email}</Text>
                        <Text style={styles.profileDetail}>📱 {userProfile.phone}</Text>
                        <Text style={styles.profileDetail}>📍 {userProfile.location}</Text>
                        <Text style={styles.memberSince}>Member since {userProfile.memberSince}</Text>
                    </View>

                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => {
                                setEditName(userProfile.name);
                                setEditPhone(userProfile.phone);
                                setEditLocation(userProfile.location);
                                setEditBio(userProfile.bio);
                                setShowEditModal(true);
                            }}
                        >
                            <Text style={styles.editButtonText}>Edit Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>

                    {userProfile.bio && (
                        <View style={styles.bioContainer}>
                            <Text style={styles.bioText}>{userProfile.bio}</Text>
                        </View>
                    )}
                </View>

                {/* Stats Grid */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={[styles.statNumber, { color: '#0288D1' }]}>{userStats.eventsJoined}</Text>
                        <Text style={styles.statLabel}>Events Joined</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{userStats.beachesVisited}</Text>
                        <Text style={styles.statLabel}>Beaches Visited</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statNumber, { color: '#9C27B0' }]}>{userStats.reviewsPosted}</Text>
                        <Text style={styles.statLabel}>Reviews Posted</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statNumber, { color: '#FF9800' }]}>{userStats.photoShared}</Text>
                        <Text style={styles.statLabel}>Photos Shared</Text>
                    </View>
                </View>

                {/* Saved Beaches */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>❤️ Saved Beaches</Text>
                    {savedBeaches.length > 0 ? (
                        savedBeaches.map((beach) => (
                            <View key={beach.id} style={styles.beachCard}>
                                <View style={styles.beachInfo}>
                                    <Text style={styles.beachName}>{beach.name}</Text>
                                    <Text style={styles.beachLocation}>📍 {beach.location}</Text>
                                    <Text style={styles.beachRating}>⭐ {beach.rating}</Text>
                                </View>
                                <TouchableOpacity onPress={() => removeSavedBeach(beach.id)}>
                                    <Text style={styles.removeButton}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No saved beaches yet</Text>
                    )}
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 Recent Activity</Text>
                    {recentActivity.map((activity) => (
                        <View key={activity.id} style={styles.activityCard}>
                            <Text style={styles.activityIcon}>
                                {activity.type === 'event' && '🌊'}
                                {activity.type === 'review' && '⭐'}
                                {activity.type === 'photo' && '📸'}
                            </Text>
                            <View style={styles.activityInfo}>
                                <Text style={styles.activityText}>{activity.text}</Text>
                                <Text style={styles.activityDate}>{activity.date}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Achievements */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏆 Achievements</Text>
                    <View style={styles.achievementsGrid}>
                        <View style={[styles.achievementCard, { backgroundColor: '#FFF9C4' }]}>
                            <Text style={styles.achievementIcon}>🥇</Text>
                            <Text style={styles.achievementTitle}>Beach Explorer</Text>
                            <Text style={styles.achievementDesc}>Visited 5+ beaches</Text>
                        </View>
                        <View style={[styles.achievementCard, { backgroundColor: '#C8E6C9' }]}>
                            <Text style={styles.achievementIcon}>🌱</Text>
                            <Text style={styles.achievementTitle}>Eco Warrior</Text>
                            <Text style={styles.achievementDesc}>Joined 10+ events</Text>
                        </View>
                        <View style={[styles.achievementCard, { backgroundColor: '#BBDEFB' }]}>
                            <Text style={styles.achievementIcon}>✍️</Text>
                            <Text style={styles.achievementTitle}>Active Reviewer</Text>
                            <Text style={styles.achievementDesc}>Posted 10+ reviews</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={showEditModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <ScrollView contentContainerStyle={styles.modalScrollContent}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                value={editName}
                                onChangeText={setEditName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                value={editPhone}
                                onChangeText={setEditPhone}
                                keyboardType="phone-pad"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Location"
                                value={editLocation}
                                onChangeText={setEditLocation}
                            />
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Bio"
                                value={editBio}
                                onChangeText={setEditBio}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                            <TouchableOpacity style={styles.modalButton} onPress={handleEditProfile}>
                                <Text style={styles.modalButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowEditModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
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

    // Welcome Screen Styles
    welcomeContainer: {
        flex: 1,
        backgroundColor: '#E3F2FD',
    },
    welcomeContent: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
    },
    welcomeEmoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 15,
        textAlign: 'center',
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: '#424242',
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
        lineHeight: 24,
    },
    primaryButton: {
        backgroundColor: '#0288D1',
        paddingVertical: 15,
        paddingHorizontal: 60,
        borderRadius: 10,
        marginBottom: 15,
        width: '100%',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 15,
        paddingHorizontal: 60,
        borderRadius: 10,
        marginBottom: 30,
        width: '100%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#0288D1',
    },
    secondaryButtonText: {
        color: '#0288D1',
        fontSize: 18,
        fontWeight: 'bold',
    },
    benefitsContainer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 15,
        width: '100%',
        marginTop: 20,
    },
    benefitsTitle: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 15,
        textAlign: 'center',
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkmark: {
        color: '#4CAF50',
        fontSize: 18,
        marginRight: 10,
        fontWeight: 'bold',
    },
    benefitText: {
        fontSize: 15,
        color: '#424242',
    },

    // Profile Header Styles
    profileHeader: {
        backgroundColor: '#0288D1',
        padding: 20,
        paddingTop: 30,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        marginBottom: 15,
        alignSelf: 'center',
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    profileDetail: {
        fontSize: 14,
        color: '#E3F2FD',
        marginBottom: 5,
    },
    memberSince: {
        fontSize: 12,
        color: '#B3E5FC',
        marginTop: 5,
    },
    headerButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 15,
    },
    editButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginRight: 10,
    },
    editButtonText: {
        color: '#0288D1',
        fontWeight: 'bold',
        fontSize: 14,
    },
    logoutButton: {
        backgroundColor: '#F44336',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    bioContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 15,
        borderRadius: 10,
    },
    bioText: {
        color: '#FFFFFF',
        fontSize: 14,
        lineHeight: 20,
    },

    // Stats Styles
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 15,
        justifyContent: 'space-between',
    },
    statBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        width: '48%',
        marginBottom: 15,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#757575',
        textAlign: 'center',
    },

    // Section Styles
    section: {
        padding: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 15,
    },

    // Beach Card Styles
    beachCard: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    beachInfo: {
        flex: 1,
    },
    beachName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 5,
    },
    beachLocation: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 3,
    },
    beachRating: {
        fontSize: 14,
        color: '#FFA000',
    },
    removeButton: {
        color: '#F44336',
        fontSize: 24,
        fontWeight: 'bold',
        paddingHorizontal: 10,
    },
    emptyText: {
        textAlign: 'center',
        color: '#9E9E9E',
        fontSize: 14,
        paddingVertical: 20,
    },

    // Activity Card Styles
    activityCard: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    activityIcon: {
        fontSize: 32,
        marginRight: 15,
    },
    activityInfo: {
        flex: 1,
    },
    activityText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#424242',
        marginBottom: 5,
    },
    activityDate: {
        fontSize: 12,
        color: '#9E9E9E',
    },

    // Achievements Styles
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    achievementCard: {
        width: '48%',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
    },
    achievementIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    achievementTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#424242',
        marginBottom: 5,
        textAlign: 'center',
    },
    achievementDesc: {
        fontSize: 11,
        color: '#757575',
        textAlign: 'center',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalButton: {
        backgroundColor: '#0288D1',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cancelButtonText: {
        color: '#757575',
        fontSize: 16,
        fontWeight: '600',
    },
    switchButton: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    switchButtonText: {
        fontSize: 14,
        color: '#757575',
        textAlign: 'center',
    },
    linkText: {
        color: '#0288D1',
        fontWeight: 'bold',
    },
});