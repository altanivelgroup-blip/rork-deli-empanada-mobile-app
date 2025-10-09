import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View } from "react-native";
import { CartProvider } from "@/providers/CartProvider";
import { AdminProvider } from "@/providers/AdminProvider";
import { FirebaseProvider } from "@/providers/FirebaseProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack 
      screenOptions={{ 
        headerBackTitle: "Atrás",
        headerStyle: {
          backgroundColor: '#CC0000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="menu" 
        options={{ 
          title: "Menú",
          headerBackVisible: true
        }} 
      />
      <Stack.Screen 
        name="cart" 
        options={{ 
          title: "Carrito",
          presentation: "modal"
        }} 
      />
      <Stack.Screen 
        name="checkout" 
        options={{ 
          title: "Finalizar Pedido"
        }} 
      />
      <Stack.Screen 
        name="confirmation" 
        options={{ 
          title: "Confirmación",
          headerBackVisible: false
        }} 
      />
      <Stack.Screen 
        name="admin-entrance" 
        options={{ 
          title: "Admin Entrance",
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="admin-login" 
        options={{ 
          title: "Admin Login",
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="admin-dashboard" 
        options={{ 
          title: "Dashboard",
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="admin" 
        options={{ 
          title: "Admin",
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="admin-demo" 
        options={{ 
          title: "Demo Pedidos",
          headerShown: true
        }} 
      />
      <Stack.Screen 
        name="pedidos" 
        options={{ 
          title: "Pedidos",
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="estadisticas" 
        options={{ 
          title: "Estadísticas",
          headerShown: false
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={styles.container}>
          <FirebaseProvider>
            <AdminProvider>
              <CartProvider>
                <View style={styles.container}>
                  <RootLayoutNav />
                  <Toast />
                </View>
              </CartProvider>
            </AdminProvider>
          </FirebaseProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});