import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { collection, onSnapshot, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAdmin } from '@/providers/AdminProvider';
import Colors from '@/constants/colors';
import { ArrowLeft, Package, BarChart3 } from 'lucide-react-native';

type OrderStatus = 'pending' | 'paid' | 'preparing' | 'out_for_delivery' | 'delivered';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  userId: string;
  customerName: string;
  contact: string;
  address: string;
  deliveryType: 'delivery' | 'pickup';
  notes?: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  paymentMethod: 'tarjeta' | 'efectivo';
  transactionId: string;
  status: OrderStatus;
  createdAt: any;
  branch?: 'Norte' | 'Sur';
}

export default function PedidosScreen() {
  const { currentUser, hasPermission, isManager } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = currentUser?.email === 'maria@deliempanada.com';
  const isEmployee1 = currentUser?.email === 'employee1@deliempanada.com';
  const isEmployee2 = currentUser?.email === 'employee2@deliempanada.com';
  const isEmployee = isEmployee1 || isEmployee2;
  
  const userBranch = isEmployee1 ? 'Norte' : isEmployee2 ? 'Sur' : null;

  console.log('Current user:', currentUser?.email);
  console.log('Is employee:', isEmployee);
  console.log('User branch:', userBranch);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/admin-login');
      return;
    }

    if (!db) {
      console.warn('Firebase not configured');
      setLoading(false);
      return;
    }

    let q;
    if (isAdmin) {
      q = query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'));
    } else if (userBranch) {
      q = query(
        collection(db, 'pedidos'),
        where('branch', '==', userBranch),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'));
    }
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData: Order[] = [];
        snapshot.forEach((doc) => {
          ordersData.push({
            id: doc.id,
            ...doc.data(),
          } as Order);
        });
        
        setOrders(ordersData);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error fetching orders:', error);
        setLoading(false);
        setRefreshing(false);
        Alert.alert('Error', 'No se pudieron cargar los pedidos');
      }
    );

    return () => unsubscribe();
  }, [currentUser, isAdmin, userBranch]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    if (!db) return;

    try {
      await updateDoc(doc(db, 'pedidos', orderId), {
        status: newStatus,
      });
      console.log(`✅ Order ${orderId} updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido');
    }
  };

  const newOrders = useMemo(() => orders.filter(o => o.status === 'pending' || o.status === 'paid'), [orders]);
  const processingOrders = useMemo(() => orders.filter(o => o.status === 'preparing' || o.status === 'out_for_delivery'), [orders]);
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'delivered'), [orders]);

  const onRefresh = () => {
    setRefreshing(true);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '';
    }
  };

  const formatCurrency = (amount: number) => {
    return `$ ${amount.toLocaleString('es-CO')}`;
  };

  if (!currentUser) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>DELI EMPANADA</Text>
          <Text style={styles.headerSubtitle}>🍴 Panel de Gerencia</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Package size={18} color={Colors.light.primary} />
          <Text style={[styles.tabText, styles.tabTextActive]}>
            Pedidos ({orders.length})
          </Text>
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity 
            style={styles.tab}
            onPress={() => router.push('/estadisticas')}
          >
            <BarChart3 size={18} color={Colors.light.textLight} />
            <Text style={styles.tabText}>Estadísticas</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, { backgroundColor: '#FFF5F5' }]}>
          <Text style={[styles.summaryNumber, { color: Colors.light.primary }]}>{newOrders.length}</Text>
          <Text style={styles.summaryLabel}>Nuevos</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FFF8E1' }]}>
          <Text style={[styles.summaryNumber, { color: '#FF9800' }]}>{processingOrders.length}</Text>
          <Text style={styles.summaryLabel}>En Proceso</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.summaryNumber, { color: Colors.light.success }]}>{completedOrders.length}</Text>
          <Text style={styles.summaryLabel}>Completados</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
          />
        }
      >
        {newOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color={Colors.light.border} />
            <Text style={styles.emptyTitle}>No hay pedidos</Text>
            <Text style={styles.emptySubtext}>Los pedidos aparecerán aquí</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>⚠️</Text>
              <Text style={styles.sectionTitle}>Pedidos Nuevos ({newOrders.length})</Text>
            </View>

            {newOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <Text style={styles.orderCustomer}>{order.customerName}</Text>
                    <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Nuevo</Text>
                  </View>
                </View>

                <View style={styles.orderAmount}>
                  <Text style={styles.orderAmountText}>{formatCurrency(order.totalAmount)}</Text>
                </View>

                <View style={styles.orderItems}>
                  {order.items.map((item, index) => (
                    <Text key={index} style={styles.orderItemText}>
                      {item.quantity}x {item.name}
                    </Text>
                  ))}
                </View>

                <View style={styles.orderDelivery}>
                  <Text style={styles.orderDeliveryIcon}>🏠</Text>
                  <Text style={styles.orderDeliveryText}>Dom-icilio</Text>
                </View>

                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleStatusUpdate(order.id, 'preparing')}
                  >
                    <Text style={styles.acceptButtonIcon}>✓</Text>
                    <Text style={styles.acceptButtonText}>Aceptar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => {
                      Alert.alert(
                        'Rechazar Pedido',
                        '¿Estás seguro de rechazar este pedido?',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { 
                            text: 'Rechazar', 
                            style: 'destructive',
                            onPress: () => handleStatusUpdate(order.id, 'delivered')
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.rejectButtonIcon}>✕</Text>
                    <Text style={styles.rejectButtonText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textLight,
  },
  header: {
    backgroundColor: Colors.light.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.light.textLight,
  },
  headerRight: {
    width: 32,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textLight,
  },
  tabTextActive: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  summaryCards: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.light.background,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
    }),
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  orderCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 13,
    color: Colors.light.textLight,
  },
  statusBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  orderAmount: {
    marginBottom: 12,
  },
  orderAmountText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.success,
  },
  orderItems: {
    marginBottom: 12,
    gap: 4,
  },
  orderItemText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  orderDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  orderDeliveryIcon: {
    fontSize: 14,
  },
  orderDeliveryText: {
    fontSize: 13,
    color: Colors.light.textLight,
    fontWeight: '500',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.success,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  acceptButtonIcon: {
    fontSize: 16,
    color: Colors.light.background,
    fontWeight: '700',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.background,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  rejectButtonIcon: {
    fontSize: 16,
    color: Colors.light.background,
    fontWeight: '700',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
});
