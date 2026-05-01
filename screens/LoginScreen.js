import { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const auth = useContext(AuthContext);
  if (!auth) {
    console.warn('AuthContext is undefined. Ensure AuthProvider wraps the app.');
  }
  const login = auth?.login;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      if (response.user) {
        if (login) login(response.user);
        else console.warn('login function not available on AuthContext');
      }
    } catch (error) {
      console.error('Login error:', error);
      // If backend returns 401 Unauthorized, show clear credential message
      const status = error.response?.status;
      if (status === 401) {
        Alert.alert('Login Failed', 'Credentials wrong. Please check your email and password.');
      } else {
        Alert.alert(
          'Login Failed',
          error.response?.data?.error || error.message || 'Invalid email or password. Please check your credentials.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate phone: if provided, must be exactly 10 digits
    if (phone && !/^\d{10}$/.test(phone)) {
      Alert.alert('Error', 'Mobile number must be exactly 10 digits');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
  const response = await authAPI.register(name, email, password, phone, location, bio);
      if (response.user) {
        if (login) login(response.user);
        else console.warn('login function not available on AuthContext');
        Alert.alert('Success', 'Registration successful!');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || error.message || 'Registration failed. Email might already be in use.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>SamudraSetu</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Welcome Back!' : 'Create Your Account'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone (optional)"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Location (optional)"
              placeholderTextColor="#999"
              value={location}
              onChangeText={setLocation}
            />
            <TextInput
              style={[styles.input]}
              placeholder="Bio (optional)"
              placeholderTextColor="#999"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={isLogin ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Login' : 'Register'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setIsLogin(!isLogin);
              setName('');
              setEmail('');
              setPassword('');
              setPhone('');
              setLocation('');
              setBio('');
            }}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? "Don't have an account? Register"
                : 'Already have an account? Login'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Explore beaches across India with real-time data and AI-powered insights
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#01579B',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#0277BD',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: '#0288D1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#0277BD',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#757575',
    fontSize: 12,
    textAlign: 'center',
  },
});
