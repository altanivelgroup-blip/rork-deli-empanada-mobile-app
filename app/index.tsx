import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#CC0000', '#FF8C00']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.logoBadge}>
              <Image 
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ymk4xvks1kuz0it56htjb' }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoText}>DELI</Text>
            <Text style={styles.logoSubtext}>EMPANADA</Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={styles.tagline}>
              Las mejores empanadas{'\n'}a un click de distancia
            </Text>

            <TouchableOpacity
              style={styles.button}
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
                <Text style={styles.buttonText}>ORDENAR AHORA</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.deliveryInfo}>
              🚚 Entrega a domicilio disponible
            </Text>

            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push('/admin')}
              activeOpacity={0.7}
            >
              <Text style={styles.adminButtonText}>SIGN IN</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Text style={styles.footer}>
          Horario: Lun-Dom 11:00 AM - 10:00 PM
        </Text>
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
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: 180,
    height: 180,
    backgroundColor: 'transparent',
    tintColor: undefined,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  button: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    gap: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CC0000',
    letterSpacing: 1,
  },
  deliveryInfo: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  footer: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingBottom: 20,
    opacity: 0.8,
  },
  adminButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  adminButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
});