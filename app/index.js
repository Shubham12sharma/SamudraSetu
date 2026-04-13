import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import AppNavigator from '../navigation/AppNavigator';

export default function App() {
	return (
		<SafeAreaProvider>
			<PaperProvider>
				<StatusBar style="dark" />
				<AuthProvider>
					<AppNavigator />
				</AuthProvider>
			</PaperProvider>
		</SafeAreaProvider>
	);
}
