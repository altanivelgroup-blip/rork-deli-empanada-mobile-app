import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Platform } from 'react-native';
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
    const { url: currentUrl } = navState ?? {};
    console.log('[Wompi] Navigation URL:', currentUrl);
    if (!currentUrl) return;

    try {
      const parsed = new URL(currentUrl);
      
      const idParam = parsed.searchParams.get('id');
      if (idParam) {
        console.log('[Wompi] ✅ Transaction ID detected:', idParam);
        onSuccess(idParam);
        return;
      }

      const urlLower = currentUrl.toLowerCase();
      if (urlLower.includes('approved') || urlLower.includes('success')) {
        const match = currentUrl.match(/[?&]id=([^&#]+)/i);
        if (match && match[1]) {
          console.log('[Wompi] ✅ Transaction ID from approved URL:', match[1]);
          onSuccess(match[1]);
        }
      }
    } catch (e) {
      console.log('[Wompi] URL parse error:', e);
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
      testID="wompiModal"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pago con Tarjeta</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} testID="wompiClose">
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
          originWhitelist={["*"]}
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
