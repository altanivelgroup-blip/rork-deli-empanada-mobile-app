import React, { useState } from 'react';
import { View, Modal, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

const WompiCheckout = ({ visible, onClose, amount, reference, customerName, customerEmail, customerPhone }) => {
  const [showWompi, setShowWompi] = useState(visible);

  // Defaults to prevent 'undefined'
  const businessName = process.env.EXPO_PUBLIC_BUSINESS_NAME || 'Deli Empanada'; // Add this to env if needed
  const currency = process.env.EXPO_PUBLIC_CURRENC || 'COP';
  const redirectUrl = process.env.EXPO_PUBLIC_WOMPI_REDIRECT_URL || 'https://deliempanada.com/confirmation';
  const publicKey = process.env.EXPO_PUBLIC_WOMPI_P || ''; // Your pub_test_ key

  if (!publicKey) {
    Alert.alert('Error', 'Missing Wompi public key. Check env vars.');
    onClose();
    return null;
  }

  // Build customer data only if values exist (prevents empty/undefined params)
  let customerData = '';
  if (customerName) customerData += `&customer-data:full-name=${encodeURIComponent(customerName)}`;
  if (customerEmail) customerData += `&customer-data:email=${encodeURIComponent(customerEmail)}`;
  if (customerPhone) {
    const cleanPhone = customerPhone.replace(/\D/g, '');
    customerData += `&customer-data:phone-number-prefix=+57`;
    customerData += `&customer-data:phone-number=${encodeURIComponent(cleanPhone)}`;
    customerData += `&customer-data:legal-id-type=CC`; // As per docs/Rork
    customerData += `&customer-data:legal-id=${encodeURIComponent(cleanPhone)}`; // Use phone as doc number for test
  } else {
    // Default test phone if missing (approved Nequi from docs)
    const defaultPhone = '3991111111';
    customerData += `&customer-data:phone-number-prefix=+57`;
    customerData += `&customer-data:phone-number=${encodeURIComponent(defaultPhone)}`;
    customerData += `&customer-data:legal-id-type=CC`;
    customerData += `&customer-data:legal-id=${encodeURIComponent(defaultPhone)}`;
  }

  // Build full URL with defaults
  const wompiUrl = `https://checkout.wompi.co/p/?public-key=${publicKey}&amount-in-cents=${amount}&currency=${currency}&reference=DE${reference}${customerData}&redirect-url=${encodeURIComponent(redirectUrl)}&business-name=${encodeURIComponent(businessName)}`;

  console.log('Opening Wompi URL:', wompiUrl); // Log for debugging

  const handleNavigationStateChange = (navState) => {
    const url = navState.url;
    console.log('WebView URL:', url); // Log every URL change

    // Detect transaction ID from redirect
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const transactionId = urlParams.get('id');
    if (transactionId) {
      console.log('Transaction ID detected:', transactionId);
      verifyTransaction(transactionId);
      setShowWompi(false);
      onClose();
    } else if (url.includes('approved') || url.includes('success')) {
      console.log('Fallback success detected');
      Alert.alert('Pago Aprobado', 'Transacción completada.');
      setShowWompi(false);
      onClose();
    }
  };

  const verifyTransaction = async (transactionId) => {
    try {
      const response = await fetch(`https://sandbox.wompi.co/v1/transactions/${transactionId}`, {
        headers: { 'Authorization': `Bearer ${publicKey}` },
      });
      const data = await response.json();
      console.log('Verification response:', data);
      if (data.data.status === 'APPROVED') {
        Alert.alert('Pago Aprobado', 'Tu pago fue procesado exitosamente.');
      } else {
        Alert.alert('Error', `Pago no aprobado: ${data.data.status}`);
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'No se pudo verificar el pago.');
    }
  };

  return (
    <Modal visible={showWompi} animationType="slide" onRequestClose={() => setShowWompi(false)}>
      <View style={styles.modalContainer}>
        <WebView
          source={{ uri: wompiUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            Alert.alert('Error', `Problema con el pago: ${nativeEvent.description}`);
            setShowWompi(false);
          }}
        />
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  webview: { flex: 1 },
  loader: { position: 'absolute', top: '50%', left: '50%' },
});

export default WompiCheckout;