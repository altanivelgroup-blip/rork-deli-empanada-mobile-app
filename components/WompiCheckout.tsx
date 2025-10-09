import React, { useState, useCallback } from "react";
import { View, Modal, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from "react-native";
import { WebView } from "react-native-webview";
import { X } from "lucide-react-native";
import Colors from "@/constants/colors";

interface Props {
  visible: boolean;
  amount: number;
  reference: string;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
}

export default function WompiCheckout({ visible, amount, reference, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(true);
  const WOMPI_PUBLIC_KEY = process.env.EXPO_PUBLIC_WOMPI_P || "";
  const WOMPI_REDIRECT_URL = process.env.EXPO_PUBLIC_WOMPI_R || "https://checkout.wompi.co/p/";
  const CURRENCY = process.env.EXPO_PUBLIC_CURRENC || "COP";
  const BUSINESS = process.env.EXPO_PUBLIC_BUSINESS || "Deli Empanada";

  const wompiUrl = `${WOMPI_REDIRECT_URL}?public-key=${WOMPI_PUBLIC_KEY}&currency=${CURRENCY}&amount-in-cents=${amount * 100}&reference=${reference}&redirect-url=${WOMPI_REDIRECT_URL}`;

  const handleNavigation = useCallback(
    (event: any) => {
      const { url } = event;
      if (url.includes("success") || url.includes("approved")) {
        const txMatch = url.match(/transaction_id=([a-zA-Z0-9_-]+)/);
        const transactionId = txMatch ? txMatch[1] : "unknown";
        onSuccess(transactionId);
        onClose();
      }
    },
    [onSuccess, onClose]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Pago Seguro ({BUSINESS})</Text>
        </View>

        <View style={styles.webviewContainer}>
          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          )}
          <WebView
            source={{ uri: wompiUrl }}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={handleNavigation}
            javaScriptEnabled
            domStorageEnabled
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeBtn: {
    position: "absolute" as const,
    left: 16,
    padding: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  webviewContainer: {
    flex: 1,
  },
  loader: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
});
