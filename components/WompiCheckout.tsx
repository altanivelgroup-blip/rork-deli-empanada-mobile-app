import React, { useEffect } from 'react';
import { View, Modal, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';

interface WompiCheckoutProps {
  url: string;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
}

const WompiCheckout: React.FC<WompiCheckoutProps> = ({ url, onClose, onSuccess }) => {
  useEffect(() => {
    console.log('[WompiCheckout] Component mounted with URL:', url);
  }, [url]);

  const handleNavigationStateChange = (navState: any) => {
    const currentUrl = navState.url;
    console.log('[WompiCheckout] Navigation to:', currentUrl);
    console.log('[WompiCheckout] Navigation state:', JSON.stringify(navState, null, 2));

    // Check if navigating to the redirect URL (confirmation page)
    if (currentUrl.includes('confirmation') || currentUrl.includes('redirect') || currentUrl.includes('deliempanada.com')) {
      try {
        const urlObj = new URL(currentUrl);
        const transactionId = urlObj.searchParams.get('id');
        
        if (transactionId) {
          console.log('[WompiCheckout] Transaction ID found:', transactionId);
          onSuccess(transactionId);
        } else {
          console.log('[WompiCheckout] No transaction ID in URL, but reached confirmation page');
          console.log('[WompiCheckout] Full URL:', currentUrl);
          onClose();
        }
      } catch (error) {
        console.error('[WompiCheckout] Error parsing URL:', error);
        onClose();
      }
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[WompiCheckout] WebView error:', nativeEvent);
    console.error('[WompiCheckout] Error details:', JSON.stringify(nativeEvent, null, 2));
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[WompiCheckout] HTTP error:', nativeEvent);
    console.error('[WompiCheckout] HTTP error details:', JSON.stringify(nativeEvent, null, 2));
  };

  const handleLoadStart = (syntheticEvent: any) => {
    console.log('[WompiCheckout] Load started:', syntheticEvent.nativeEvent.url);
  };

  const handleLoadEnd = (syntheticEvent: any) => {
    console.log('[WompiCheckout] Load ended:', syntheticEvent.nativeEvent.url);
  };

  return (
    <Modal visible={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pago Seguro - Wompi</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#333333" />
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onError={handleError}
          onHttpError={handleHttpError}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#CC0000" />
              <Text style={styles.loadingText}>Cargando pasarela de pago...</Text>
            </View>
          )}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 8,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});

export default WompiCheckout;