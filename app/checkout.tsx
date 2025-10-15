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
import { MapPin, Phone, User, Truck, Store, Package, Building2, CreditCard, Banknote } from 'lucide-react-native';
import { useCart } from '@/providers/CartProvider';
import { useAdmin } from '@/providers/AdminProvider';
import WompiCheckout from '@/components/WompiCheckout';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import * as Crypto from 'expo-crypto';  // For SHA-256 hashing

export default function CheckoutScreen() {
  const { getTotalPrice, clearCart, cart } = useCart();
  const { currentUser } = useAdmin();
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [branch, setBranch] = useState<'viejo' | 'nuevo'>('viejo');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta'>('efectivo');
  const [showWompi, setShowWompi] = useState(false);
  const [wompiUrl, setWompiUrl] = useState('');
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

  useEffect(() => {
    console.log('🟣 [State Change] showWompi:', showWompi, 'wompiUrl:', wompiUrl);  // Log state changes
  }, [showWompi, wompiUrl]);

  const handleSubmit = () => {
    console.log('🔵 [handleSubmit] Started');
    console.log('🔵 [handleSubmit] Form Data:', formData);
    console.log('🔵 [handleSubmit] Payment Method:', paymentMethod);

    if (!formData.name || !formData.phone) {
      console.log('❌ [Validation] Failed: Missing name or phone');
      Alert.alert('Error', 'Por favor completa los campos obligatorios');
      return;
    }

    if (deliveryType === 'delivery' && !formData.address) {
      console.log('❌ [Validation] Failed: Missing address for delivery');
      Alert.alert('Error', 'Por favor ingresa tu dirección de entrega');
      return;
    }

    console.log('✅ [Validation] All passed');

    if (paymentMethod === 'tarjeta') {
      console.log('➡️ [handleSubmit] Calling handleCardPayment');
      handleCardPayment();
    } else {
      console.log('➡️ [handleSubmit] Calling handleCashOrder');
      handleCashOrder();
    }
  };

  const handleCardPayment = async () => {
    console.log('🟢 [handleCardPayment] Started');

    const publicKey = process.env.EXPO_PUBLIC_WOMPI_PUBLIC_KEY;
    const redirectUrl = process.env.EXPO_PUBLIC_WOMPI_REDIRECT_URL;
    const integritySecret = process.env.EXPO_PUBLIC_WOMPI_INTEGRITY_SECRET;
    const currency = process.env.EXPO_PUBLIC_CURRENCY ?? 'COP';
    const reference = `DE${Date.now()}`;
    const cents = Math.round(total * 100);

    const missingVars: string[] = [];
    if (!publicKey) missingVars.push('EXPO_PUBLIC_WOMPI_PUBLIC_KEY');
    if (!redirectUrl) missingVars.push('EXPO_PUBLIC_WOMPI_REDIRECT_URL');
    if (!integritySecret) missingVars.push('EXPO_PUBLIC_WOMPI_INTEGRITY_SECRET');
    if (!currency) missingVars.push('EXPO_PUBLIC_CURRENCY');

    if (missingVars.length > 0) {
      console.log('❌ [handleCardPayment] Missing vars:', missingVars);
      Alert.alert(
        'Error de configuración',
        `Faltan variables de entorno Wompi: ${missingVars.join(', ')}`,
      );
      return;
    }

    console.log('✅ [handleCardPayment] All vars present');
    console.log('🟢 [handleCardPayment] Public Key:', publicKey);
    console.log('🟢 [handleCardPayment] Redirect URL:', redirectUrl);
    console.log('🟢 [handleCardPayment] Currency:', currency);
    console.log('🟢 [handleCardPayment] Reference:', reference);
    console.log('🟢 [handleCardPayment] Amount in cents:', cents);

    console.log('🔒 [handleCardPayment] Generating integrity signature');
    const signatureString = `${reference}${cents}${currency}${integritySecret}`;
    const signature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      signatureString,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    console.log('🔒 [handleCardPayment] Signature generated:', signature);

    const params = new URLSearchParams({
      'public-key': String(publicKey),
      'amount-in-cents': String(cents),
      currency,
      reference,
      'redirect-url': String(redirectUrl),
      'signature:integrity': signature,
    });

    if (formData.name && formData.name.trim()) {
      params.append('customer-data:full-name', formData.name.trim());
    }
    
    if (formData.phone && formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      params.append('customer-data:phone-number', `+57${cleanPhone}`);
      params.append('customer-data:phone-number-prefix', '+57');
      params.append('customer-data:legal-id', cleanPhone);
      params.append('customer-data:legal-id-type', 'CC');
    }

    const url = `https://checkout.wompi.co/p/?${params.toString()}`;

    console.log('🌐 [handleCardPayment] Generated URL:', url);

    setWompiUrl(url);
    setShowWompi(true);
    console.log('🟣 [handleCardPayment] Set showWompi to true and wompiUrl to:', url);
  };

  const handleCashOrder = async () => {
    console.log('🟡 [handleCashOrder] Started');
    // ... (rest of handleCashOrder remains the same as before)
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
        console.log('✅ [handleCashOrder] Cash order saved to Firestore');
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

  const handlePaymentSuccess = async (transactionId: string) => {
    console.log('🔵 [handlePaymentSuccess] Called with transactionId:', transactionId);
    // ... (rest of handlePaymentSuccess remains the same)
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
          paymentMethod: 'tarjeta',
          transactionId,
          currency: process.env.EXPO_PUBLIC_CURRENCY || 'COP',
          status: 'paid',
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'pedidos'), orderData);
        console.log('✅ Card order saved to Firestore with transaction:', transactionId);
      }

      setShowWompi(false);
      Alert.alert('¡Pago Exitoso!', '✅ ¡Gracias por tu compra!\n\nTu pedido ha sido confirmado.');
      clearCart();
      router.replace('/confirmation');
    } catch (error) {
      console.error('Error saving card order:', error);
      setShowWompi(false);
      Alert.alert('Pedido Confirmado', 'Tu pedido ha sido recibido.');
      clearCart();
      router.replace('/confirmation');
    }
  };

  const total = getTotalPrice() + (deliveryType === 'delivery' ? 6000 : 0);

  console.log('🔄 [Render] Component rendering, showWompi:', showWompi);  // Log on every render

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* ... (rest of the JSX for sections remains the same as your previous version) */}
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
            <View style={styles.paymentOptions}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'efectivo' && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod('efectivo')}
              >
                <Banknote size={24} color={paymentMethod === 'efectivo' ? '#4CAF50' : '#666666'} />
                <Text style={[
                  styles.paymentOptionText,
                  paymentMethod === 'efectivo' && styles.paymentOptionTextActiveGreen,
                ]}>
                  Efectivo
                </Text>
                <Text style={styles.paymentOptionSubtext}>Al recibir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'tarjeta' && styles.paymentOptionActiveBlue,
                ]}
                onPress={() => setPaymentMethod('tarjeta')}
              >
                <CreditCard size={24} color={paymentMethod === 'tarjeta' ? '#2196F3' : '#666666'} />
                <Text style={[
                  styles.paymentOptionText,
                  paymentMethod === 'tarjeta' && styles.paymentOptionTextActiveBlue,
                ]}>
                  Tarjeta
                </Text>
                <Text style={styles.paymentOptionSubtext}>Wompi</Text>
              </TouchableOpacity>
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
            onPress={() => {
              console.log('🟠 [Button] Submit button pressed');
              handleSubmit();
            }}
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

      {showWompi && (
        <WompiCheckout
          url={wompiUrl}
          onClose={() => setShowWompi(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  deliveryOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  deliveryOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    gap: 8,
  },
  deliveryOptionActive: {
    borderColor: '#CC0000',
    backgroundColor: '#FFF5F5',
  },
  deliveryOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666666',
  },
  deliveryOptionTextActive: {
    color: '#CC0000',
  },
  deliveryFee: {
    fontSize: 12,
    color: '#999999',
  },
  branchOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  branchOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    gap: 8,
  },
  branchOptionActive: {
    borderColor: '#CC0000',
    backgroundColor: '#FFF5F5',
  },
  branchOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666666',
  },
  branchOptionTextActive: {
    color: '#CC0000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  notesInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    gap: 8,
  },
  paymentOptionActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
  },
  paymentOptionActiveBlue: {
    borderColor: '#2196F3',
    backgroundColor: '#F0F7FF',
  },
  paymentOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666666',
  },
  paymentOptionTextActiveGreen: {
    color: '#4CAF50',
  },
  paymentOptionTextActiveBlue: {
    color: '#2196F3',
  },
  paymentOptionSubtext: {
    fontSize: 12,
    color: '#999999',
  },
  totalSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#666666',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#CC0000',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#CC0000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  pedidosButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pedidosButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});