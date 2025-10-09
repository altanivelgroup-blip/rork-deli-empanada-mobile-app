import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAdmin } from '@/providers/AdminProvider';
import Colors from '@/constants/colors';
import { Clock, MapPin, Phone, User, Package, ChevronDown, ArrowLeft } from 'lucide-react-native';

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
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: '#FF9800', emoji: '🟡' },
  paid: { label: 'Pagado', color: '#2196F3', emoji: '💳' },
  preparing: { label: 'Preparando', color: '#FFC107', emoji: '👨‍🍳' },
  out_for_delivery: { label: 'En Camino', color: '#FF5722', emoji: '🚚' },
  delivered: { label: 'Entregado', color: '#4CAF50', emoji: '✅' },
};

const FILTER_OPTIONS: OrderStatus[] = ['pending', 'paid', 'preparing', 'out_for_delivery', 'delivered'];

export default function PedidosScreen() {
  const { currentUser } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | 'all'>('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const isAdmin = currentUser?.email === 'maria@deliempanada.com';
  const isEmployee = currentUser?.email === 'employee1@deliempanada.com' || 
                     currentUser?.email === 'employee2@deliempanada.com';

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

    const q = query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'));
    
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
  }, [currentUser]);

  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: OrderStatus) => {
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
  }, []);

  const toggleOrderExpansion = useCallback((orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'all') return orders;
    return orders.filter((order) => order.status === selectedFilter);
  }, [orders, selectedFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha no disponible';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const renderStatusButtons = useCallback((order: Order) => {
    const currentStatusIndex = FILTER_OPTIONS.indexOf(order.status);
    const nextStatuses = FILTER_OPTIONS.slice(currentStatusIndex + 1);

    if (nextStatuses.length === 0) return null;

    return (
      <View style={styles.statusButtons}>
        {nextStatuses.map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.statusButton, { backgroundColor: STATUS_CONFIG[status].color }]}
            onPress={() => handleStatusUpdate(order.id, status)}
          >
            <Text style={styles.statusButtonText}>
              {STATUS_CONFIG[status].emoji} {STATUS_CONFIG[status].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [handleStatusUpdate]);

  const renderOrderCard = useCallback((order: Order) => {
    const isExpanded = expandedOrders.has(order.id);
    const statusConfig = STATUS_CONFIG[order.status];

    return (
      <View key={order.id} style={styles.orderCard}>
        <TouchableOpacity
          style={styles.orderHeader}
          onPress={() => toggleOrderExpansion(order.id)}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
              <Text style={styles.statusEmoji}>{statusConfig.emoji}</Text>
              <Text style={styles.statusText}>{statusConfig.label}</Text>
            </View>
            <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
          </View>
          <ChevronDown
            size={20}
            color={Colors.light.text}
            style={{
              transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
            }}
          />
        </TouchableOpacity>

        <View style={styles.orderInfo}>
          <View style={styles.infoRow}>
            <User size={16} color={Colors.light.textLight} />
            <Text style={styles.infoText}>{order.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={16} color={Colors.light.textLight} />
            <Text style={styles.infoText}>{order.contact}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={16} color={Colors.light.textLight} />
            <Text style={styles.infoText}>{order.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={16} color={Colors.light.textLight} />
            <Text style={styles.infoText}>{formatDate(order.createdAt)}</Text>
          </View>
        </View>

        {isExpanded && (
          <>
            <View style={styles.itemsSection}>
              <Text style={styles.itemsTitle}>Artículos:</Text>
              {order.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {item.name} × {item.quantity}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ${(item.price * item.quantity).toLocaleString('es-CO')}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>
                ${order.totalAmount.toLocaleString('es-CO')} {order.currency}
              </Text>
            </View>

            <View style={styles.paymentInfo}>
              <Text style={styles.paymentMethod}>
                💳 {order.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}
              </Text>
              <Text style={styles.transactionId}>ID: {order.transactionId}</Text>
            </View>

            {order.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notas:</Text>
                <Text style={styles.notesText}>{order.notes}</Text>
              </View>
            )}

            {(isAdmin || isEmployee) && renderStatusButtons(order)}
          </>
        )}
      </View>
    );
  }, [expandedOrders, isAdmin, isEmployee, toggleOrderExpansion, renderStatusButtons]);

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
          <ArrowLeft size={24} color={Colors.light.background} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Pedidos</Text>
        <View style={styles.headerRight}>
          <Package size={24} color={Colors.light.background} />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedFilter === 'all' && styles.filterButtonTextActive,
            ]}
          >
            Todos ({orders.length})
          </Text>
        </TouchableOpacity>
        {FILTER_OPTIONS.map((status) => {
          const count = orders.filter((o) => o.status === status).length;
          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                selectedFilter === status && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === status && styles.filterButtonTextActive,
                ]}
              >
                {STATUS_CONFIG[status].emoji} {STATUS_CONFIG[status].label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.ordersContainer}
        contentContainerStyle={styles.ordersContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
          />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color={Colors.light.border} />
            <Text style={styles.emptyText}>No hay pedidos</Text>
            <Text style={styles.emptySubtext}>
              {selectedFilter === 'all'
                ? 'Los pedidos aparecerán aquí'
                : `No hay pedidos con estado "${STATUS_CONFIG[selectedFilter as OrderStatus].label}"`}
            </Text>
          </View>
        ) : (
          filteredOrders.map(renderOrderCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
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
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.background,
  },
  headerRight: {
    width: 32,
    alignItems: 'flex-end',
  },
  filterContainer: {
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  filterButtonTextActive: {
    color: Colors.light.background,
  },
  ordersContainer: {
    flex: 1,
  },
  ordersContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusEmoji: {
    fontSize: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.background,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textLight,
  },
  orderInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  itemsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  transactionId: {
    fontSize: 12,
    color: Colors.light.textLight,
  },
  notesSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: Colors.light.text,
    fontStyle: 'italic',
  },
  statusButtons: {
    marginTop: 16,
    gap: 8,
  },
  statusButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
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
  emptyText: {
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
