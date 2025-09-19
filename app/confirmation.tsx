import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { CheckCircle, Home } from 'lucide-react-native';

export default function ConfirmationScreen() {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoHome = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.successIcon,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <CheckCircle size={80} color="#4CAF50" />
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            { opacity: fadeAnim },
          ]}
        >
          <Text style={styles.title}>¡Pedido Confirmado!</Text>
          <Text style={styles.orderNumber}>Orden #DE{Math.floor(Math.random() * 10000)}</Text>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Tiempo estimado de entrega</Text>
            <Text style={styles.infoValue}>30-45 minutos</Text>
          </View>

          <Text style={styles.message}>
            Hemos recibido tu pedido y lo estamos preparando con mucho amor.
          </Text>

          <Text style={styles.subMessage}>
            Recibirás una notificación cuando tu pedido esté listo.
          </Text>
        </Animated.View>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleGoHome}
        >
          <Home size={24} color="#FFFFFF" />
          <Text style={styles.homeButtonText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  successIcon: {
    marginBottom: 30,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 30,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CC0000',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  subMessage: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 40,
  },
  homeButton: {
    flexDirection: 'row',
    backgroundColor: '#CC0000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    gap: 10,
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});