import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../context/AuthContext';
import AppNavigator from '../navigation/AppNavigator';

export default function App() {
	return (
		<PaperProvider>
			<AuthProvider>
				<AppNavigator />
			</AuthProvider>
		</PaperProvider>
	);
}
