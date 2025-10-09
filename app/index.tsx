import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingBag, Truck, Crown, Store, X, User, Lock } from 'lucide-react-native';

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
};

type UserRole = 'admin' | 'employee';
type Branch = 'Norte' | 'Sur' | null;

interface UserContext {
  role: UserRole;
  email: string;
  branch: Branch;
}

export default function HomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [loginMode, setLoginMode] = useState<'owner' | 'employee' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const handleLongPressStart = () => {
    const timer = setTimeout(() => {
      setShowAdminModal(true);
    }, 1500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    try {
      if (loginMode === 'owner') {
        if (email === 'maria@deliempanada.com' && password === 'admin123') {
          await AsyncStorage.setItem('userRole', 'admin');
          await AsyncStorage.setItem('userEmail', email);
          console.log('✅ Owner logged in');
          setShowAdminModal(false);
          setEmail('');
          setPassword('');
          setLoginMode(null);
          setTimeout(() => router.push('/estadisticas'), 200);
        } else {
          Alert.alert('Error', 'Credenciales de propietario inválidas');
        }
      } else if (loginMode === 'employee') {
        if (email === 'employee1@deliempanada.com' && password === 'work123') {
          await AsyncStorage.setItem('userRole', 'employee');
          await AsyncStorage.setItem('userEmail', email);
          await AsyncStorage.setItem('userBranch', 'Norte');
          console.log('✅ Employee Norte logged in');
          setShowAdminModal(false);
          setEmail('');
          setPassword('');
          setLoginMode(null);
          setTimeout(() => router.push('/pedidos?branch=Norte'), 200);
        } else if (email === 'employee2@deliempanada.com' && password === 'work123') {
          await AsyncStorage.setItem('userRole', 'employee');
          await AsyncStorage.setItem('userEmail', email);
          await AsyncStorage.setItem('userBranch', 'Sur');
          console.log('✅ Employee Sur logged in');
          setShowAdminModal(false);
          setEmail('');
          setPassword('');
          setLoginMode(null);
          setTimeout(() => router.push('/pedidos?branch=Sur'), 200);
        } else {
          Alert.alert('Error', 'Credenciales de empleado inválidas');
        }
      }
    } catch (error) {
      console.error('❌ Error during login:', error);
      Alert.alert('Error', 'Error al iniciar sesión');
    }
  };

  const handleModalClose = () => {
    setShowAdminModal(false);
    setLoginMode(null);
    setEmail('');
    setPassword('');
  };

  return (
    <LinearGradient
      colors={['#CC0000', '#FF8C00']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Pressable
          style={styles.logoContainer}
          onPressIn={handleLongPressStart}
          onPressOut={handleLongPressEnd}
        >
          <View style={styles.logoBadge}>
            <Image
              source={{
                uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ymk4xvks1kuz0it56htjb',
              }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Pressable>

        <Text style={styles.title}>DELI</Text>
        <Text style={styles.subtitle}>EMPANADA</Text>

        <Text style={styles.tagline}>Las mejores empanadas</Text>
        <Text style={styles.tagline}>a un click de distancia</Text>

        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => router.push('/menu')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <ShoppingBag size={24} color="#CC0000" />
            <Text style={styles.orderButtonText}>ORDENAR AHORA</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.deliveryBadge}>
          <Truck size={16} color="#FFFFFF" />
          <Text style={styles.deliveryText}>🚚 Entrega a domicilio disponible</Text>
        </View>

        <Text style={styles.hours}>Horario: Lun-Sab 8:30 AM – 6:30 PM</Text>
      </Animated.View>

      <Modal
        transparent
        visible={showAdminModal}
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleModalClose}
            >
              <X size={24} color="#CC0000" />
            </TouchableOpacity>

            {!loginMode ? (
              <>
                <Text style={styles.modalTitle}>Panel de Gerencia</Text>
                <Text style={styles.modalSubtitle}>Selecciona tu rol</Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setLoginMode('owner')}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FFA500']}
                      style={styles.modalButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Crown size={28} color="#CC0000" />
                      <Text style={styles.modalButtonTextAdmin}>OWNER</Text>
                      <Text style={styles.modalButtonSubtext}>Propietario / Gerente</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setLoginMode('employee')}
                  >
                    <LinearGradient
                      colors={['#FF8C00', '#CC0000']}
                      style={styles.modalButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Store size={28} color="#FFFFFF" />
                      <Text style={styles.modalButtonTextEmployee}>EMPLOYEE</Text>
                      <Text style={styles.modalButtonSubtextWhite}>Empleado de Sucursal</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>
                  {loginMode === 'owner' ? '👑 OWNER LOGIN' : '👨‍🍳 EMPLOYEE LOGIN'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {loginMode === 'owner'
                    ? 'Ingresa tus credenciales de propietario'
                    : 'Ingresa tus credenciales de empleado'}
                </Text>

                <View style={styles.loginForm}>
                  <View style={styles.inputContainer}>
                    <User size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Lock size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Contraseña"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                      setLoginMode(null);
                      setEmail('');
                      setPassword('');
                    }}
                  >
                    <Text style={styles.backButtonText}>← Volver</Text>
                  </TouchableOpacity>

                  <View style={styles.credentialsHint}>
                    <Text style={styles.hintTitle}>Credenciales de prueba:</Text>
                    {loginMode === 'owner' ? (
                      <Text style={styles.hintText}>
                        Email: maria@deliempanada.com{"\n"}Contraseña: admin123
                      </Text>
                    ) : (
                      <>
                        <Text style={styles.hintText}>
                          Norte: employee1@deliempanada.com{"\n"}Contraseña: work123
                        </Text>
                        <Text style={styles.hintText}>
                          Sur: employee2@deliempanada.com{"\n"}Contraseña: work123
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 32,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 26,
  },
  orderButton: {
    marginTop: 48,
    marginBottom: 24,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    gap: 12,
  },
  orderButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#CC0000',
    letterSpacing: 1,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    marginBottom: 16,
  },
  deliveryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hours: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    fontWeight: '500',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#CC0000',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  modalButtonTextAdmin: {
    fontSize: 20,
    fontWeight: '800',
    color: '#CC0000',
    letterSpacing: 1,
  },
  modalButtonTextEmployee: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  modalButtonSubtext: {
    fontSize: 13,
    color: '#CC0000',
    opacity: 0.8,
  },
  modalButtonSubtextWhite: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  loginForm: {
    width: '100%',
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#CC0000',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  credentialsHint: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  hintTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    marginBottom: 6,
  },
});