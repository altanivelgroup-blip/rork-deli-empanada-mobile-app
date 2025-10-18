import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '@/providers/AdminProvider';
import { Order } from '@/types/admin';
import { Plus, Play, Pause, RotateCcw } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const mockCustomers = [
  { name: 'Ana García', phone: '+57 300 1234567', address: 'Calle 123 #45-67' },
  { name: 'Carlos López', phone: '+57 301 2345678', address: 'Carrera 89 #12-34' },
  { name: 'María Rodríguez', phone: '+57 302 3456789', address: 'Avenida 56 #78-90' },
  { name: 'Juan Pérez', phone: '+57 303 4567890', address: 'Calle 234 #56-78' },
  { name: 'Laura Martínez', phone: '+57 304 5678901', address: 'Carrera 123 #89-01' },
];

const mockItems = [
  { name: 'Empanada de Pollo', price: 3500, category: 'empanadas' },
  { name: 'Empanada de Carne', price: 3500, category: 'empanadas' },
  { name: 'Empanada de Queso', price: 3000, category: 'empanadas' },
  { name: 'Empanada Mixta', price: 4000, category: 'empanadas' },
  { name: 'Coca Cola', price: 2500, category: 'bebidas' },
  { name: 'Agua', price: 2000, category: 'bebidas' },
  { name: 'Jugo Natural', price: 3000, category: 'bebidas' },
];

export default function AdminDemoScreen() {
  const { addNewOrder, orders, newOrders } = useAdmin();
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  const generateRandomOrder = () => {
    const customer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)];
    const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
    const orderItems = [];
    let totalAmount = 0;

    for (let i = 0; i < numItems; i++) {
      const item = mockItems[Math.floor(Math.random() * mockItems.length)];
      const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
      const orderItem = {
        id: `item_${Date.now()}_${i}`,
        name: item.name,
        price: item.price,
        quantity,
        category: item.category
      };
      orderItems.push(orderItem);
      totalAmount += item.price * quantity;
    }

    const isDelivery = Math.random() > 0.3; // 70% delivery, 30% pickup

    const newOrder: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: `${customer.name.toLowerCase().replace(' ', '.')}@email.com`,
      deliveryAddress: isDelivery ? customer.address : undefined,
      orderType: isDelivery ? 'delivery' : 'pickup',
      items: orderItems,
      totalAmount,
      notes: Math.random() > 0.7 ? 'Sin cebolla' : undefined
    };

    addNewOrder(newOrder);
  };

  const startAutoGeneration = () => {
    if (isAutoGenerating) return;
    
    setIsAutoGenerating(true);
    const id = setInterval(() => {
      generateRandomOrder();
    }, 15000); // Generate order every 15 seconds
    
    setIntervalId(id as unknown as number);
  };

  const stopAutoGeneration = () => {
    if (intervalId) {
      clearInterval(intervalId as unknown as NodeJS.Timeout);
      setIntervalId(null);
    }
    setIsAutoGenerating(false);
  };

  const resetOrders = () => {
    Alert.alert(
      'Reiniciar Pedidos',
      '¿Estás seguro de que quieres eliminar todos los pedidos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Reiniciar', 
          style: 'destructive', 
          onPress: async () => {
            try {
              // Clear AsyncStorage
              await AsyncStorage.removeItem('admin_orders');
              await AsyncStorage.removeItem('admin_current_user');
              await AsyncStorage.removeItem('userRole');
              await AsyncStorage.removeItem('userEmail');
              await AsyncStorage.removeItem('userBranch');
              
              // Navigate to home screen and reload
              router.replace('/');
              
              // For web, reload the page
              if (typeof window !== 'undefined') {
                setTimeout(() => {
                  window.location.reload();
                }, 100);
              }
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'No se pudo reiniciar los datos');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId as unknown as NodeJS.Timeout);
      }
    };
  }, [intervalId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Demo de Pedidos</Text>
        <Text style={styles.subtitle}>Genera pedidos automáticamente para probar el dashboard</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total Pedidos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{newOrders.length}</Text>
          <Text style={styles.statLabel}>Pedidos Nuevos</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={generateRandomOrder}
          testID="generate-order-button"
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Generar Pedido</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isAutoGenerating ? styles.dangerButton : styles.successButton]}
          onPress={isAutoGenerating ? stopAutoGeneration : startAutoGeneration}
          testID="auto-generate-button"
        >
          {isAutoGenerating ? (
            <Pause size={20} color="#FFFFFF" />
          ) : (
            <Play size={20} color="#FFFFFF" />
          )}
          <Text style={styles.buttonText}>
            {isAutoGenerating ? 'Detener Auto' : 'Iniciar Auto'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={resetOrders}
          testID="reset-orders-button"
        >
          <RotateCcw size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Reiniciar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Información:</Text>
        <Text style={styles.infoText}>• Los pedidos automáticos se generan cada 15 segundos</Text>
        <Text style={styles.infoText}>• Incluye clientes, productos y direcciones aleatorias</Text>
        <Text style={styles.infoText}>• 70% delivery, 30% pickup</Text>
        <Text style={styles.infoText}>• Cantidades y productos variados</Text>
        {isAutoGenerating && (
          <Text style={[styles.infoText, styles.activeText]}>
            🔄 Generación automática activa
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CC0000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#CC0000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  controls: {
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#CC0000',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  warningButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  info: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  activeText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});