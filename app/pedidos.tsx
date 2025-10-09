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
import { ArrowLeft, Package, Bell, LogOut, BarChart3 } from 'lucide-react-native';

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

const generateTestOrders = (): Order[] => {
  const now = new Date();
  return [
    {
      id: 'test_1',
      userId: 'user_1',
      customerName: 'Cliente 1',
      contact: '+57 300 123 4567',
      address: 'Calle 123 #45-67',
      deliveryType: 'delivery' as const,
      items: [
        { id: 'item_1', name: 'Empanada de Pollo', quantity: 3, price: 3500 },
        { id: 'item_2', name: 'Coca Cola', quantity: 1, price: 2500 }
      ],
      totalAmount: 8399,
      currency: 'COP',
      paymentMethod: 'tarjeta' as const,
      transactionId: 'txn_001',
      status: 'pending' as const,
      createdAt: new Date(now.getTime() - 20 * 60000),
      branch: 'Norte' as const
    },
    {
      id: 'test_2',
      userId: 'user_2',
      customerName: 'Cliente 10',
      contact: '+57 300 234 5678',
      address: 'Carrera 45 #12-34',
      deliveryType: 'pickup' as const,
      items: [
        { id: 'item_3', name: 'Empanada de Pollo', quantity: 3, price: 3500 },
        { id: 'item_4', name: 'Coca Cola', quantity: 1, price: 2500 }
      ],
      totalAmount: 9179,
      currency: 'COP',
      paymentMethod: 'efectivo' as const,
      transactionId: 'txn_002',
      status: 'pending' as const,
      createdAt: new Date(now.getTime() - 40 * 60000),
      branch: 'Norte' as const
    },
    {
      id: 'test_3',
      userId: 'user_3',
      customerName: 'Cliente 13',
      contact: '+57 300 345 6789',
      address: 'Avenida 68 #23-45',
      deliveryType: 'delivery' as const,
      items: [
        { id: 'item_5', name: 'Empanada de Pollo', quantity: 2, price: 3500 },
        { id: 'item_6', name: 'Coca Cola', quantity: 2, price: 2500 }
      ],
      totalAmount: 12000,
      currency: 'COP',
      paymentMethod: 'tarjeta' as const,
      transactionId: 'txn_003',
      status: 'pending' as const,
      createdAt: new Date(now.getTime() - 60 * 60000),
      branch: 'Norte' as const
    },
    {
      id: 'test_4',
      userId: 'user_4',
      customerName: 'Cliente 5',
      contact: '+57 300 456 7890',
      address: 'Calle 80 #10-20',
      deliveryType: 'delivery' as const,
      items: [
        { id: 'item_7', name: 'Empanada de Carne', quantity: 4, price: 3500 }
      ],
      totalAmount: 14000,
      currency: 'COP',
      paymentMethod: 'tarjeta' as const,
      transactionId: 'txn_004',
      status: 'preparing' as const,
      createdAt: new Date(now.getTime() - 80 * 60000),
      branch: 'Norte' as const
    },
    {
      id: 'test_5',
      userId: 'user_5',
      customerName: 'Cliente 7',
      contact: '+57 300 567 8901',
      address: 'Carrera 15 #30-40',
      deliveryType: 'delivery' as const,
      items: [
        { id: 'item_8', name: 'Empanada de Pollo', quantity: 5, price: 3500 },
        { id: 'item_9', name: 'Coca Cola', quantity: 3, price: 2500 }
      ],
      totalAmount: 25000,
      currency: 'COP',
      paymentMethod: 'efectivo' as const,
      transactionId: 'txn_005',
      status: 'preparing' as const,
      createdAt: new Date(now.getTime() - 100 * 60000),
      branch: 'Norte' as const
    },
    {
      id: 'test_6',
      userId: 'user_6',
      customerName: 'Cliente 9',
      contact: '+57 300 678 9012',
      address: 'Calle 100 #50-60',
      deliveryType: 'delivery' as const,
      items: [
        { id: 'item_10', name: 'Empanada de Pollo', quantity: 2, price: 3500 }
      ],
      totalAmount: 7000,
      currency: 'COP',
      paymentMethod: 'tarjeta' as const,
      transactionId: 'txn_006',
      status: 'preparing' as const,
      createdAt: new Date(now.getTime() - 120 * 60000),
      branch: 'Norte' as const
    },
    {
      id: 'test_7',
      userId: 'user_7',
      customerName: 'Cliente 15',
      contact: '+57 300 789 0123',
      address: 'Avenida 19 #70-80',
      deliveryType: 'delivery' as const,
      items: [
        { id: 'item_11', name: 'Empanada de Pollo', quantity: 3, price: 3500 },
        { id: 'item_12', name: 'Coca Cola', quantity: 2, price: 2500 }
      ],
      totalAmount: 15500,
      currency: 'COP',
      paymentMethod: 'tarjeta' as const,
      transactionId: 'txn_007',
      status: 'preparing' as const,
      createdAt: new Date(now.getTime() - 140 * 60000),
      branch: 'Norte' as const
    },
    {
      id: 'test_8',
      userId: 'user_8',
      customerName: 'Cliente 20',
      contact: '+57 300 890 1234',
      address: 'Calle 50 #25-35',
      deliveryType: 'delivery' as const,
      items: [
        { id: 'item_13', name: 'Empanada de Pollo', quantity: 4, price: 3500 }
      ],
      totalAmount: 14000,
      currency: 'COP',
      paymentMethod: 'efectivo' as const,
      transactionId: 'txn_008',
      status: 'delivered' as const,
      createdAt: new Date(now.getTime() - 160 * 60000),
      branch: 'Norte' as const
    },
    {
      id: 'test_9',
      userId: 'user_9',
      customerName: 'Cliente 22',
      contact: '+57 300 901 2345',
      address: 'Carrera 7 #40-50',
      deliveryType: 'delivery' as const,
      items: [
        { id: 'item_14', name: 'Empanada de Carne', quantity: 3, price: 3500 },
        { id: 'item_15', name: 'Coca Cola', quantity: 1, price: 2500 }
      ],
      totalAmount: 13000,
      currency: 'COP',
      paymentMethod: 'tarjeta' as const,
      transactionId: 'txn_009',
      status: 'delivered' as const,
      createdAt: new Date(now.getTime() - 180 * 60000),
      branch: 'Norte' as const
    },
    {
      id: 'test_10',
      userId: 'user_10',
      customerName: 'Cliente 25',
      contact: '+57 300 012 3456',
      address: 'Avenida 30 #15-25',
      deliveryType: 'delivery' as const,
      items: [
        { id: 'item_16', name: 'Empanada de Pollo', quantity: 6, price: 3500 },
        { id: 'item_17', name: 'Coca Cola', quantity: 4, price: 2500 }
      ],
      totalAmount: 31000,
      currency: 'COP',
      paymentMethod: 'tarjeta' as const,
      transactionId: 'txn_010',
      status: 'delivered' as const,
      createdAt: new Date(now.getTime() - 200 * 60000),
      branch: 'Norte' as const
    },
    {
      id: 'test_11',
      userId: 'user_11',
      customerName: 'Cliente 28',
      contact: '+57 300 123 4567',
      address: 'Calle 60 #35-45',
      deliveryType: 'delivery' as const,
      items: [
        { id: 'item_18', name: 'Empanada de Pollo', quantity: 2, price: 3500 }
      ],
      totalAmount: 7000,
      currency: 'COP',
      paymentMethod: 'efectivo' as const,
      transactionId: 'txn_011',
      status: 'delivered' as const,
      createdAt: new Date(now.getTime() - 220 * 60000),
      branch: 'Norte' as const
    }
  ];
};

export default function PedidosScreen() {
  const { currentUser, hasPermission, isManager, logout } = useAdmin();
  const [orders, setOrders] = useState<Order[]>(generateTestOrders());
  const [loading, setLoading] = useState(false);
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
      console.warn('Firebase not configured - using test data');
      setOrders(generateTestOrders());
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
        
        if (ordersData.length === 0) {
          setOrders(generateTestOrders());
        } else {
          setOrders(ordersData);
        }
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error fetching orders:', error);
        setOrders(generateTestOrders());
        setLoading(false);
        setRefreshing(false);
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
    setTimeout(() => {
      setOrders(generateTestOrders());
      setRefreshing(false);
    }, 1000);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/admin-login');
          }
        }
      ]
    );
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
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={20} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {isAdmin && (
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, styles.tabActive]}>
            <Package size={18} color={Colors.light.primary} />
            <Text style={[styles.tabText, styles.tabTextActive]}>
              Pedidos ({orders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => router.push('/estadisticas')}
          >
            <BarChart3 size={18} color={Colors.light.textLight} />
            <Text style={styles.tabText}>
              Estadísticas
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isEmployee && (
        <View style={styles.employeeHeader}>
          <Package size={18} color={Colors.light.primary} />
          <Text style={styles.employeeHeaderText}>
            Pedidos ({orders.length})
          </Text>
        </View>
      )}

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
        {newOrders.length > 0 && (
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
                  <Text style={styles.orderDeliveryIcon}>
                    {order.deliveryType === 'delivery' ? '🏠' : '🛍️'}
                  </Text>
                  <Text style={styles.orderDeliveryText}>
                    {order.deliveryType === 'delivery' ? 'Dom-icilio' : 'Recoger'}
                  </Text>
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

        {processingOrders.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={styles.sectionIcon}>🔄</Text>
              <Text style={styles.sectionTitle}>En Proceso ({processingOrders.length})</Text>
            </View>

            {processingOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <Text style={styles.orderCustomer}>{order.customerName}</Text>
                    <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: '#FFF8E1' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#FF9800' }]}>En Proceso</Text>
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
                  <Text style={styles.orderDeliveryIcon}>
                    {order.deliveryType === 'delivery' ? '🏠' : '🛍️'}
                  </Text>
                  <Text style={styles.orderDeliveryText}>
                    {order.deliveryType === 'delivery' ? 'Dom-icilio' : 'Recoger'}
                  </Text>
                </View>

                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={[styles.acceptButton, { flex: 1 }]}
                    onPress={() => handleStatusUpdate(order.id, 'delivered')}
                  >
                    <Text style={styles.acceptButtonIcon}>✓</Text>
                    <Text style={styles.acceptButtonText}>Completar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {completedOrders.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={styles.sectionIcon}>✅</Text>
              <Text style={styles.sectionTitle}>Completados ({completedOrders.length})</Text>
            </View>

            {completedOrders.map((order) => (
              <View key={order.id} style={[styles.orderCard, { opacity: 0.7 }]}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <Text style={styles.orderCustomer}>{order.customerName}</Text>
                    <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
                    <Text style={[styles.statusBadgeText, { color: Colors.light.success }]}>Completado</Text>
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
              </View>
            ))}
          </>
        )}

        {orders.length === 0 && (
          <View style={styles.emptyContainer}>
            <Package size={64} color={Colors.light.border} />
            <Text style={styles.emptyTitle}>No hay pedidos</Text>
            <Text style={styles.emptySubtext}>Los pedidos aparecerán aquí</Text>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButton: {
    padding: 4,
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
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.primary,
    gap: 8,
  },
  employeeHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
});
