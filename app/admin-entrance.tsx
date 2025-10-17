import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Crown, Store } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
};

type UserRole = 'admin' | 'employee';
type Branch = 'Norte' | 'Sur' | null;

interface UserContext {
  role: UserRole;
  email: string;
  branch: Branch;
}

export default function AdminEntranceScreen() {
  const { login } = useAdmin();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [isLoading, setIsLoading] = useState(true);

  const startAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
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

  const checkExistingUser = useCallback(async () => {
    try {
      const [role, email, branch] = await Promise.all([
        AsyncStorage.getItem('userRole'),
        AsyncStorage.getItem('userEmail'),
        AsyncStorage.getItem('userBranch'),
      ]);

      if (role && email) {
        console.log('✅ Existing user found:', { role, email, branch });
        if (role === 'admin') {
          router.replace('/estadisticas');
        } else {
          router.replace(`/pedidos?branch=${branch || 'Norte'}`);
        }
        return;
      }
    } catch (error) {
      console.error('❌ Error checking existing user:', error);
    } finally {
      setIsLoading(false);
      startAnimations();
    }
  }, [startAnimations]);

  useEffect(() => {
    checkExistingUser();
  }, [checkExistingUser]);

  const handleRoleSelection = async (context: UserContext) => {
    const buttonScale = new Animated.Value(1);
    
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const password = context.role === 'admin' ? 'admin123' : 'work123';
      const result = await login(context.email, password);
      
      if (result.success && result.user) {
        await AsyncStorage.setItem('userRole', context.role);
        await AsyncStorage.setItem('userEmail', context.email);
        if (context.branch) {
          await AsyncStorage.setItem('userBranch', context.branch);
        }

        console.log('✅ User context saved:', context);

        setTimeout(() => {
          if (context.role === 'admin') {
            router.replace('/estadisticas');
          } else {
            router.replace(`/pedidos?branch=${context.branch}`);
          }
        }, 200);
      } else {
        console.error('❌ Login failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error saving user context:', error);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#CC0000', '#FF8C00']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#CC0000', '#FF8C00']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <Image
                source={{
                  uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ymk4xvks1kuz0it56htjb',
                }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoText}>DELI EMPANADA</Text>
          </View>

          <Text style={styles.heading}>Panel de Gerencia</Text>
          <Text style={styles.subheading}>Selecciona tu rol para continuar</Text>

          <View style={styles.buttonsContainer}>
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
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Crown size={28} color="#CC0000" />
                <Text style={styles.buttonTextAdmin}>Ingresar como Admin</Text>
                <Text style={styles.buttonSubtext}>(Maria)</Text>
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
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Store size={28} color="#FFFFFF" />
                <Text style={styles.buttonTextEmployee}>Empleado Norte</Text>
                <Text style={styles.buttonSubtextWhite}>Sucursal Norte</Text>
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
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Store size={28} color="#FFFFFF" />
                <Text style={styles.buttonTextEmployee}>Empleado Sur</Text>
                <Text style={styles.buttonSubtextWhite}>Sucursal Sur</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Deli Empanada © 2025 • Hecho con ❤️ en Colombia
          </Text>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  button: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 4,
  },
  buttonTextAdmin: {
    fontSize: 18,
    fontWeight: '700',
    color: '#CC0000',
    marginTop: 8,
  },
  buttonTextEmployee: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#CC0000',
    opacity: 0.8,
  },
  buttonSubtextWhite: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  footer: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.8,
  },
});
