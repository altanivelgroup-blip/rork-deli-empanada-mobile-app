import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';

interface WompiCheckoutProps {
  url: string;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
}

export default function WompiCheckout({ url, onClose, onSuccess }: WompiCheckoutProps) {
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState: any) => {
    const { url: currentUrl } = navState;
    console.log('WebView URL:', currentUrl);

    if (currentUrl.includes('id=')) {
      const match = currentUrl.match(/id=([^&]+)/);
      if (match && match[1]) {
        const transactionId = match[1];
        console.log('✅ Transaction ID detected:', transactionId);
        onSuccess(transactionId);
      }
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pago con Tarjeta</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#333333" />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#CC0000" />
            <Text style={styles.loadingText}>Cargando pasarela de pago...</Text>
          </View>
        )}

        <WebView
          source={{ uri: url }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 5,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
});
