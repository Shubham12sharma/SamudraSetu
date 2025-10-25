import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🏖️ SamudraSetu</Text>
            <Text style={styles.subtitle}>Discover India’s most beautiful beaches!</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#01579B',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#0277BD',
    },
});
