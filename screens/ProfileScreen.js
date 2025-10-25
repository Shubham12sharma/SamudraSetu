import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>👤 Profile</Text>
            <Text style={styles.subtitle}>Login and manage your account.</Text>
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
