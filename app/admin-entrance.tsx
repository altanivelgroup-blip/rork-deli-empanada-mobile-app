import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { useAdmin } from '@/providers/AdminProvider';

const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

export default function AdminEntranceScreen() {
  const { login } = useAdmin();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    console.log('🔐 Login attempt:', { email, passwordLength: password.length });
    
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('userBranch');
      
      const emailLower = email.trim().toLowerCase();
      console.log('🔍 Checking credentials for:', emailLower);
      
      const result = await login(emailLower, password);
      
      if (result.success && result.user) {
        console.log('✅ Login successful:', result.user.role);
        
        if (result.user.role === 'manager') {
          await AsyncStorage.setItem('userRole', 'admin');
          await AsyncStorage.setItem('userEmail', result.user.email);
          console.log('✅ Manager logged in, navigating to estadisticas');
          router.replace('/estadisticas');
        } else if (result.user.role === 'kitchen') {
          await AsyncStorage.setItem('userRole', 'employee');
          await AsyncStorage.setItem('userEmail', result.user.email);
          
          const branch = result.user.id === 'emp_1' ? 'Norte' : 'Sur';
          await AsyncStorage.setItem('userBranch', branch);
          console.log(`✅ Employee logged in (${branch}), navigating to pedidos`);
          router.replace(`/pedidos?branch=${branch}`);
        }
      } else {
        console.log('❌ Login failed:', result.error);
        Alert.alert('Error', result.error || 'Credenciales inválidas');
      }
    } catch (error) {
      console.error('❌ Error during login:', error);
      Alert.alert('Error', 'Error al iniciar sesión: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillManagerCredentials = () => {
    setEmail('maria@deliempanada.com');
    setPassword('admin123');
  };

  const fillEmployeeCredentials = () => {
    setEmail('employee1@deliempanada.com');
    setPassword('work123');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ymk4xvks1kuz0it56htjb' }}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>DELI EMPANADA</Text>
            <Text style={styles.subtitle}>Panel de Administración</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email o Usuario"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                testID="email-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                testID="password-input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              testID="login-button"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Demo Credentials */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Credenciales de Prueba:</Text>
            
            <TouchableOpacity
              style={styles.demoButton}
              onPress={fillManagerCredentials}
            >
              <Text style={styles.demoButtonText}>👑 GERENTE/PROPIETARIO</Text>
              <Text style={styles.demoButtonSubtext}>Acceso completo + estadísticas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={fillEmployeeCredentials}
            >
              <Text style={styles.demoButtonText}>👨‍🍳 EMPLEADO</Text>
              <Text style={styles.demoButtonSubtext}>Solo gestión de pedidos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  keyboardView: {
    flex: 1
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%'
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  logo: {
    width: 60,
    height: 60
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#CC0000',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  form: {
    marginBottom: 30
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333'
  },
  eyeIcon: {
    padding: 4
  },
  loginButton: {
    backgroundColor: '#CC0000',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },
  loginButtonDisabled: {
    opacity: 0.7
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  demoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center'
  },
  demoButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  demoButtonSubtext: {
    fontSize: 12,
    color: '#666'
  }
});
