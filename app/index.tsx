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
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingBag, Truck, Crown, Store, X } from 'lucide-react-native';

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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, scaleAnim, pulseAnim]);

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

  const handleRoleSelection = async (context: UserContext) => {
    try {
      await AsyncStorage.setItem('userRole', context.role);
      await AsyncStorage.setItem('userEmail', context.email);
      if (context.branch) {
        await AsyncStorage.setItem('userBranch', context.branch);
      }

      console.log('✅ User context saved:', context);
      setShowAdminModal(false);

      setTimeout(() => {
        if (context.role === 'admin') {
          router.push('/estadisticas');
        } else {
          router.push(`/pedidos?branch=${context.branch}`);
        }
      }, 200);
    } catch (error) {
      console.error('❌ Error saving user context:', error);
    }
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
          <Animated.View
            style={[
              styles.logoBadge,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Image
              source={{
                uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ymk4xvks1kuz0it56htjb',
              }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>
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
        onRequestClose={() => setShowAdminModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAdminModal(false)}
            >
              <X size={24} color="#CC0000" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Panel de Gerencia</Text>
            <Text style={styles.modalSubtitle}>Selecciona tu rol</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  handleRoleSelection({
                    role: 'admin',
                    email: 'maria@deliempanada.com',
                    branch: null,
                  })
                }
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.modalButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Crown size={24} color="#CC0000" />
                  <Text style={styles.modalButtonTextAdmin}>Admin (Maria)</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  handleRoleSelection({
                    role: 'employee',
                    email: 'employee1@deliempanada.com',
                    branch: 'Norte',
                  })
                }
              >
                <LinearGradient
                  colors={['#FF8C00', '#FF6B00']}
                  style={styles.modalButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Store size={24} color="#FFFFFF" />
                  <Text style={styles.modalButtonTextEmployee}>Empleado Norte</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  handleRoleSelection({
                    role: 'employee',
                    email: 'employee2@deliempanada.com',
                    branch: 'Sur',
                  })
                }
              >
                <LinearGradient
                  colors={['#CC0000', '#990000']}
                  style={styles.modalButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Store size={24} color="#FFFFFF" />
                  <Text style={styles.modalButtonTextEmployee}>Empleado Sur</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
  },
  modalButtonTextAdmin: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CC0000',
  },
  modalButtonTextEmployee: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});