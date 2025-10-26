import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
    ScrollView,
} from 'react-native';

export default function UtilitiesScreen() {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = () => {
        if (searchQuery.trim()) {
            console.log('Searching for:', searchQuery);
        }
    };

    const utilities = [
        {
            id: 1,
            title: 'Nearby Facilities',
            description: 'Find hotels, restaurants, and hospitals near beaches.',
            image: 'https://via.placeholder.com/120x120?text=Facilities',
        },
        {
            id: 2,
            title: 'Travel Routes',
            description: 'Get directions and transport options to your beach.',
            image: 'https://via.placeholder.com/120x120?text=Routes',
        },
        {
            id: 3,
            title: 'Emergency Contacts',
            description: 'Access local police, lifeguard, and hospital numbers.',
            image: 'https://via.placeholder.com/120x120?text=Emergency',
        },
    ];

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search facilities, routes, or contacts..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={handleSearch}
                        disabled={!searchQuery.trim()}
                    >
                        <Text style={styles.searchButtonText}>🔍</Text>
                    </TouchableOpacity>
                </View>

                {/* Title */}
                <Text style={styles.title}>Beach Utilities</Text>

                {/* Utility Categories */}
                <View style={styles.categoriesContainer}>
                    {utilities.map((utility) => (
                        <TouchableOpacity key={utility.id} style={styles.categoryCard}>
                            <Image source={{ uri: utility.image }} style={styles.categoryImage} />
                            <View style={styles.categoryInfo}>
                                <Text style={styles.categoryTitle}>{utility.title}</Text>
                                <Text style={styles.categoryDescription}>{utility.description}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Recommended Section */}
                <View style={styles.additionalSection}>
                    <Text style={styles.sectionTitle}>Recommended Stays</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {utilities.map((utility) => (
                            <TouchableOpacity key={`${utility.id}-recommend`} style={styles.recommendCard}>
                                <Image source={{ uri: utility.image }} style={styles.recommendImage} />
                                <Text style={styles.recommendTitle}>{utility.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4F8',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingBottom: 80, // Added padding to account for bottom tab bar
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        margin: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingHorizontal: 15,
        color: '#333',
    },
    searchButton: {
        marginLeft: 10,
        width: 45,
        height: 45,
        borderRadius: 25,
        backgroundColor: '#0288D1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonText: {
        fontSize: 20,
        color: '#FFF',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#01579B',
        marginHorizontal: 15,
        marginVertical: 10,
    },
    categoriesContainer: {
        paddingHorizontal: 15,
    },
    categoryCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
    },
    categoryImage: {
        width: 120,
        height: 120,
        borderRadius: 15,
    },
    categoryInfo: {
        flex: 1,
        paddingLeft: 15,
        justifyContent: 'center',
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#212121',
        marginBottom: 5,
    },
    categoryDescription: {
        fontSize: 14,
        color: '#757575',
    },
    additionalSection: {
        marginTop: 20,
        paddingLeft: 15,
        marginBottom: 20, // Added extra margin at bottom
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0288D1',
        marginBottom: 10,
    },
    recommendCard: {
        width: 160,
        marginRight: 15,
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    recommendImage: {
        width: '100%',
        height: 110,
    },
    recommendTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212121',
        textAlign: 'center',
        paddingVertical: 8,
    },
});