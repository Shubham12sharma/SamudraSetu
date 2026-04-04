import { useContext, useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl
} from 'react-native';

import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function ProfileScreen({ navigation }) {

    const { user, logout, login } = useContext(AuthContext);

    const [loading, setLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [profile, setProfile] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editBio, setEditBio] = useState('');

    useEffect(() => {
        if (user) {
            setProfile(user);
            setEditName(user.name || '');
            setEditPhone(user.phone || '');
            setEditLocation(user.location || '');
            setEditBio(user.bio || '');
        }
    }, [user]);

    const refreshProfile = async () => {
        try {
            setRefreshing(true);

            const updated = await authAPI.getUser(profile._id || profile.id);

            setProfile(updated);
            login(updated);

        } catch (err) {
            console.log(err);
        } finally {
            setRefreshing(false);
        }
    };

    const handleEditProfile = async () => {

        if (!editName.trim()) {
            return Alert.alert('Error', 'Name cannot be empty');
        }

        setLoading(true);

        try {

            const updated = await authAPI.updateUser(
                profile._id || profile.id,
                {
                    name: editName,
                    phone: editPhone,
                    location: editLocation,
                    bio: editBio,
                }
            );

            setProfile(updated);

            if (updated) {
                login(updated);
            }

            Alert.alert('Success', 'Profile updated successfully!');
            setShowEditModal(false);

        } catch (err) {

            console.error(err);
            Alert.alert('Error', 'Unable to update profile.');

        } finally {

            setLoading(false);

        }
    };

    const handleLogout = () => {

        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    onPress: async () => {
                        await logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }]
                        });
                    }
                }
            ]
        );
    };

    if (!user) {

        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.title}>You are not logged in</Text>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.primaryButtonText}>Go to Login</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (

        <SafeAreaView style={styles.container}>

            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refreshProfile}
                    />
                }
            >

                {/* HEADER */}

                <View style={styles.profileHeader}>

                    <TouchableOpacity
                        onPress={() =>
                            Alert.alert(
                                "Feature",
                                "Profile photo upload coming soon!"
                            )
                        }
                    >
                        <Image
                            source={{
                                uri:
                                    profile?.avatar ||
                                    'https://ui-avatars.com/api/?name=User'
                            }}
                            style={styles.avatar}
                        />
                    </TouchableOpacity>

                    <Text style={styles.profileName}>
                        {profile?.name}
                    </Text>

                    <Text style={styles.memberSince}>
                        Member since {new Date().getFullYear()}
                    </Text>

                    <View style={styles.headerButtons}>

                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => setShowEditModal(true)}
                        >
                            <Text style={styles.editButtonText}>
                                Edit Profile
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <Text style={styles.logoutButtonText}>
                                Logout
                            </Text>
                        </TouchableOpacity>

                    </View>

                </View>

                {/* PROFILE INFO */}

                <View style={styles.infoCard}>

                    <Text style={styles.infoTitle}>
                        Profile Information
                    </Text>

                    <Text style={styles.infoItem}>
                        📧 {profile?.email}
                    </Text>

                    {profile?.phone && (
                        <Text style={styles.infoItem}>
                            📱 {profile.phone}
                        </Text>
                    )}

                    {profile?.location && (
                        <Text style={styles.infoItem}>
                            📍 {profile.location}
                        </Text>
                    )}

                    {profile?.bio && (
                        <Text style={styles.bioTextCard}>
                            {profile.bio}
                        </Text>
                    )}

                </View>

            </ScrollView>

            {/* EDIT PROFILE MODAL */}

            <Modal
                visible={showEditModal}
                transparent
                animationType="slide"
            >

                <View style={styles.modalOverlay}>

                    <View style={styles.modalContent}>

                        <Text style={styles.modalTitle}>
                            Edit Profile
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={editName}
                            onChangeText={setEditName}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Phone"
                            value={editPhone}
                            onChangeText={setEditPhone}
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
                        />

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleEditProfile}
                        >

                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.modalButtonText}>
                                    Save Changes
                                </Text>
                            }

                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowEditModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>
                                Cancel
                            </Text>
                        </TouchableOpacity>

                    </View>

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

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },

    title: {
        fontSize: 20,
        marginBottom: 20
    },

    primaryButton: {
        backgroundColor: '#0288D1',
        padding: 15,
        borderRadius: 10
    },

    primaryButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    },

    profileHeader: {
        backgroundColor: '#0288D1',
        paddingTop: 40,
        paddingBottom: 30,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        alignItems: 'center'
    },

    avatar: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 4,
        borderColor: '#fff',
        marginBottom: 10
    },

    profileName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff'
    },

    memberSince: {
        fontSize: 12,
        color: '#B3E5FC'
    },

    headerButtons: {
        flexDirection: 'row',
        marginTop: 15
    },

    editButton: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginRight: 10
    },

    editButtonText: {
        color: '#0288D1',
        fontWeight: 'bold'
    },

    logoutButton: {
        backgroundColor: '#F44336',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20
    },

    logoutButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    },

    infoCard: {
        backgroundColor: '#fff',
        margin: 20,
        padding: 20,
        borderRadius: 15
    },

    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#0288D1'
    },

    infoItem: {
        fontSize: 15,
        marginBottom: 8
    },

    bioTextCard: {
        marginTop: 10,
        fontStyle: 'italic'
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },

    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center'
    },

    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10
    },

    textArea: {
        height: 100
    },

    modalButton: {
        backgroundColor: '#0288D1',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10
    },

    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    },

    cancelButton: {
        marginTop: 10,
        padding: 15,
        alignItems: 'center'
    },

    cancelButtonText: {
        color: '#757575'
    }

});