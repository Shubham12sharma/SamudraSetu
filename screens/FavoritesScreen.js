import { View, Text, StyleSheet } from 'react-native';

export default function FavoritesScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>❤️ Favorites</Text>
            <Text style={styles.subtitle}>Your saved beaches will appear here.</Text>
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
