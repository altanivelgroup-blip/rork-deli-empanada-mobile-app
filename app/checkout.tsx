import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { MapPin, Phone, User, Truck, Store, Package, Building2 } from 'lucide-react-native';
import { useCart } from '@/providers/CartProvider';
import { useAdmin } from '@/providers/AdminProvider';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export default function CheckoutScreen() {
  const { getTotalPrice, clearCart, cart } = useCart();
  const { currentUser } = useAdmin();
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [branch, setBranch] = useState<'viejo' | 'nuevo'>('viejo');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (currentUser && currentUser.email !== 'maria@deliempanada.com') {
      router.replace('/pedidos');
      return;
    }
  }, [currentUser]);

  const handleSubmit = () => {
    if (!formData.name || !formData.phone) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios');
      return;
    }

    if (deliveryType === 'delivery' && !formData.address) {
      Alert.alert('Error', 'Por favor ingresa tu dirección de entrega');
      return;
    }

    handleCashOrder();
  };



  const handleCashOrder = async () => {
    try {
      if (db) {
        const orderData = {
          userId: 'guest',
          customerName: formData.name,
          contact: formData.phone,
          address: deliveryType === 'delivery' ? formData.address : 'Recoger en tienda',
          deliveryType,
          branch,
          notes: formData.notes || '',
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: total,
          paymentMethod: 'efectivo',
          status: 'pending',
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'pedidos'), orderData);
        console.log('✅ Cash order saved to Firestore');
      }

      Alert.alert('¡Pedido Confirmado!', '✅ ¡Gracias por tu compra!\n\nPaga en efectivo al recibir tu pedido.');
      clearCart();
      router.replace('/confirmation');
    } catch (error) {
      console.error('Error saving cash order:', error);
      Alert.alert('Pedido Confirmado', 'Tu pedido ha sido recibido.');
      clearCart();
      router.replace('/confirmation');
    }
  };

  const total = getTotalPrice() + (deliveryType === 'delivery' ? 6000 : 0);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Entrega</Text>
            <View style={styles.deliveryOptions}>
              <TouchableOpacity
                style={[
                  styles.deliveryOption,
                  deliveryType === 'delivery' && styles.deliveryOptionActive,
                ]}
                onPress={() => setDeliveryType('delivery')}
              >
                <Truck size={24} color={deliveryType === 'delivery' ? '#CC0000' : '#666666'} />
                <Text style={[
                  styles.deliveryOptionText,
                  deliveryType === 'delivery' && styles.deliveryOptionTextActive,
                ]}>
                  Domicilio
                </Text>
                <Text style={styles.deliveryFee}>+$6,000</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deliveryOption,
                  deliveryType === 'pickup' && styles.deliveryOptionActive,
                ]}
                onPress={() => setDeliveryType('pickup')}
              >
                <Store size={24} color={deliveryType === 'pickup' ? '#CC0000' : '#666666'} />
                <Text style={[
                  styles.deliveryOptionText,
                  deliveryType === 'pickup' && styles.deliveryOptionTextActive,
                ]}>
                  Recoger
                </Text>
                <Text style={styles.deliveryFee}>Gratis</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seleccionar Ubicación</Text>
            <View style={styles.branchOptions}>
              <TouchableOpacity
                style={[
                  styles.branchOption,
                  branch === 'viejo' && styles.branchOptionActive,
                ]}
                onPress={() => setBranch('viejo')}
              >
                <Building2 size={24} color={branch === 'viejo' ? '#CC0000' : '#666666'} />
                <Text style={[
                  styles.branchOptionText,
                  branch === 'viejo' && styles.branchOptionTextActive,
                ]}>
                  Viejo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.branchOption,
                  branch === 'nuevo' && styles.branchOptionActive,
                ]}
                onPress={() => setBranch('nuevo')}
              >
                <Building2 size={24} color={branch === 'nuevo' ? '#CC0000' : '#666666'} />
                <Text style={[
                  styles.branchOptionText,
                  branch === 'nuevo' && styles.branchOptionTextActive,
                ]}>
                  Nuevo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información de Contacto</Text>
            
            <View style={styles.inputContainer}>
              <User size={20} color="#666666" />
              <TextInput
                style={styles.input}
                placeholder="Nombre completo *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Phone size={20} color="#666666" />
              <TextInput
                style={styles.input}
                placeholder="Teléfono *"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                placeholderTextColor="#999999"
              />
            </View>

            {deliveryType === 'delivery' && (
              <View style={styles.inputContainer}>
                <MapPin size={20} color="#666666" />
                <TextInput
                  style={styles.input}
                  placeholder="Dirección de entrega *"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholderTextColor="#999999"
                />
              </View>
            )}

            <TextInput
              style={styles.notesInput}
              placeholder="Notas adicionales (opcional)"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999999"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Método de Pago</Text>
            <View style={styles.paymentInfo}>
              <Text style={styles.cashIcon}>💵</Text>
              <Text style={styles.paymentInfoText}>Pago en Efectivo al Recibir</Text>
            </View>
          </View>

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total a Pagar</Text>
            <Text style={styles.totalAmount}>
              ${total.toLocaleString('es-CO')} COP
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Confirmar Pedido</Text>
          </TouchableOpacity>
          
          {currentUser && (
            <TouchableOpacity
              style={styles.pedidosButton}
              onPress={() => router.push('/pedidos')}
              activeOpacity={0.9}
            >
              <Package size={24} color="#FFFFFF" />
              <Text style={styles.pedidosButtonText}>Pedidos</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  deliveryOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  deliveryOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EEEEEE',
  },
  deliveryOptionActive: {
    borderColor: '#CC0000',
    backgroundColor: '#FFF5F5',
  },
  deliveryOptionText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    fontWeight: '600',
  },
  deliveryOptionTextActive: {
    color: '#CC0000',
  },
  deliveryFee: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingLeft: 12,
    fontSize: 16,
    color: '#333333',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  paymentInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  cashIcon: {
    fontSize: 32,
  },
  paymentInfoText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },
  totalSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#CC0000',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  submitButton: {
    backgroundColor: '#CC0000',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pedidosButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pedidosButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  branchOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  branchOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EEEEEE',
  },
  branchOptionActive: {
    borderColor: '#CC0000',
    backgroundColor: '#FFF5F5',
  },
  branchOptionText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    fontWeight: '600',
  },
  branchOptionTextActive: {
    color: '#CC0000',
  },
});