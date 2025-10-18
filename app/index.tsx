import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  PanResponder,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingBag, Truck } from 'lucide-react-native';
import PromoBanner from '@/components/PromoBanner';

export default function HomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const logoScaleAnim = useRef(new Animated.Value(1)).current;
  const [isLongPressing, setIsLongPressing] = React.useState(false);

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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        console.log('Touch started on logo');
        setIsLongPressing(true);
        
        // Visual feedback - pulse animation
        Animated.sequence([
          Animated.timing(logoScaleAnim, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(logoScaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Reduced timeout for iPad - 1 second instead of 1.5 seconds
        longPressTimer.current = setTimeout(() => {
          console.log('Long press detected - navigating to admin entrance');
          setIsLongPressing(false);
          router.push('/admin-entrance');
        }, 1000); // Reduced from 1500ms to 1000ms
      },
      onPanResponderRelease: () => {
        console.log('Touch released');
        setIsLongPressing(false);
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        // Reset logo scale
        Animated.timing(logoScaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        console.log('Touch terminated');
        setIsLongPressing(false);
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        // Reset logo scale
        Animated.timing(logoScaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;



  return (
    <LinearGradient
      colors={['#CC0000', '#FF8C00']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <PromoBanner />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.logoBadge, isLongPressing && styles.logoBadgePressing]}>
            <Image
              source={{
                uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ymk4xvks1kuz0it56htjb',
              }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          {isLongPressing && (
            <Text style={styles.longPressIndicator}>Cargando panel admin...</Text>
          )}
        </Animated.View>

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
        
        {/* Admin Access Button (fallback for devices where long press doesn't work) */}
        <TouchableOpacity
          style={styles.adminAccessButton}
          onPress={() => router.push('/admin-entrance')}
          activeOpacity={0.7}
        >
          <Text style={styles.adminAccessText}>🔐</Text>
        </TouchableOpacity>
      </Animated.View>


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
  logoBadgePressing: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  longPressIndicator: {
    marginTop: 12,
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
    textAlign: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 16,
    width: '100%',
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 32,
    width: '100%',
    alignSelf: 'center',
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
  adminAccessButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  adminAccessText: {
    fontSize: 24,
  },

});