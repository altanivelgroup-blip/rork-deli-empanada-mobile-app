import React, { useState } from 'react';
import { View, Modal, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import crypto from 'crypto-js'; // Add to package.json: npm install crypto-js

const WompiCheckout = ({ visible, onClose, amount, reference, customerName, customerEmail, customerPhone }) => {
  const [showWompi, setShowWompi] = useState(visible);

  // Full set of keys from env (prod or test)
  const publicKey = process.env.EXPO_PUBLIC_WOMPI_P || ''; // pub_prod_ or pub_test_
  const privateKey = process.env.EXPO_PUBLIC_WOMPI_PRIVATE || ''; // prv_prod_ for verification
  const integritySecret = process.env.EXPO_PUBLIC_WOMPI_INTEGRITY_SECRET || ''; // For prod signature
  const eventsKey = process.env.EXPO_PUBLIC_WOMPI_EVENTS || ''; // For webhooks if needed
  const currency = process.env.EXPO_PUBLIC_CURRENC || 'COP';
  const redirectUrl = process.env.EXPO_PUBLIC_WOMPI_REDIRECT_URL || 'https://deliempanada.com/confirmation';
  const businessName = process.env.EXPO_PUBLIC_BUSINESS_NAME || 'Deli Empanada';

  if (!publicKey || !privateKey || !integritySecret) {
    Alert.alert('Error', 'Missing Wompi keys. Check all env vars: public, private, integrity secret.');
    onClose();
    return null;
  }

  // Build customer data with defaults/validation
  let customerData = '';
  const safeName = customerName ? encodeURIComponent(customerName.trim()) : 'Test User';
  customerData += `&customer-data:full-name=${safeName}`;
  const safeEmail = customerEmail ? encodeURIComponent(customerEmail.trim()) : 'test@deliempanada.com';
  customerData += `&customer-data:email=${safeEmail}`;
  const cleanPhone = customerPhone ? customerPhone.replace(/\D/g, '') : '3991111111'; // Default approved test
  customerData += `&customer-data:phone-number-prefix=+57`;
  customerData += `&customer-data:phone-number=${encodeURIComponent(cleanPhone)}`;
  customerData += `&customer-data:legal-id-type=CC`;
  customerData += `&customer-data:legal-id=${encodeURIComponent(cleanPhone)}`;

  // Generate integrity signature for prod (required to prevent tampering)
  let signature = '';
  if (publicKey.startsWith('pub_prod_') && integritySecret) {
    const concat = `${reference}${amount}${currency}${integritySecret}`;
    signature = crypto.SHA256(concat).toString();
    signature = `&integrity-signature=sha256~${signature}`;
  }

  // Build full URL
  const wompiUrl = `https://checkout.wompi.co/p/?public-key=${publicKey}&amount-in-cents=${amount}&currency=${currency}&reference=DE${reference}${customerData}&redirect-url=${encodeURIComponent(redirectUrl)}&business-name=${encodeURIComponent(businessName)}${signature}`;

  console.log('Opening Wompi URL:', wompiUrl); // Log full URL

  const handleNavigationStateChange = (navState) => {
    const url = navState.url;
    console.log('WebView URL:', url);

    const urlParams = new URLSearchParams(url.split('?')[1]);
    const transactionId = urlParams.get('id');
    if (transactionId) {
      console.log('Transaction ID:', transactionId);
      verifyTransaction(transactionId);
      setShowWompi(false);
      onClose();
    } else if (url.includes('approved') || url.includes('success')) {
      Alert.alert('Pago Aprobado', 'Transacción completada.');
      setShowWompi(false);
      onClose();
    }
  };

  const verifyTransaction = async (transactionId) => {
    try {
      const response = await fetch(`https://production.wompi.co/v1/transactions/${transactionId}`, { // Prod endpoint
        headers: { 'Authorization': `Bearer ${privateKey}` }, // Use private key for secure verification
      });
      const data = await response.json();
      console.log('Verification:', data);
      if (data.data.status === 'APPROVED') {
        Alert.alert('Pago Aprobado', 'Procesado exitosamente.');
      } else {
        Alert.alert('Error', `No aprobado: ${data.data.status}`);
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'No se pudo verificar.');
    }
  };

  return (
    <Modal visible={showWompi} animationType="slide" onRequestClose={() => setShowWompi(false)}>
      <View style={styles.modalContainer}>
        <WebView
          source={{ uri: wompiUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onError={(e) => {
            console.error('WebView error:', e.nativeEvent);
            Alert.alert('Error', `Problema: ${e.nativeEvent.description}`);
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