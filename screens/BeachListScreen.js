import { View, Text, StyleSheet } from 'react-native';

export default function BeachListScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🏝️ Beaches List</Text>
            <Text style={styles.subtitle}>Explore beaches by state or activity.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: { fontSize: 22, fontWeight: 'bold' },
    subtitle: { fontSize: 15, color: 'gray' },
});
