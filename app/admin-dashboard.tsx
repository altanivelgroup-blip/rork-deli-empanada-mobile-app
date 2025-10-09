import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAdmin } from '@/providers/AdminProvider';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Package,
  LogOut,
  Bell,
  BarChart3,
  Calendar,
  Target,
  Award,
  Phone,
  MapPin,
  User,
  ChefHat,
  Truck,
  ArrowLeft
} from 'lucide-react-native';
import { Order, OrderStatus } from '@/types/admin';
import { router } from 'expo-router';

const getScreenDimensions = () => {
  const { width } = Dimensions.get('window');
  return { isTablet: width >= 768 };
};

export default function AdminDashboardScreen() {
  const {
    orders,
    currentUser,
    hasPermission,
    isManager,
    updateOrderStatus,
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    logout,
    newOrders,
    activeOrders,
    completedOrders
  } = useAdmin();
  

  const [selectedTab, setSelectedTab] = useState<'orders' | 'analytics'>('orders');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // No need to redirect - AdminScreen handles this

  // Auto-refresh orders every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing orders...');
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Play notification sound for new orders
  useEffect(() => {
    if (newOrders.length > 0 && soundEnabled) {
      console.log('🔔 New order notification sound!');
      // In a real app, you would play a sound here
    }
  }, [newOrders.length, soundEnabled]);

  const dailyStats = useMemo(() => getDailyStats(), [getDailyStats]);
  const weeklyStats = useMemo(() => getWeeklyStats(), [getWeeklyStats]);
  const monthlyStats = useMemo(() => getMonthlyStats(), [getMonthlyStats]);

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Stay in admin route, let AdminScreen handle the routing
          }
        }
      ]
    );
  };

  const handleOrderStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status, currentUser?.id);
      console.log(`Order ${orderId} updated to ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido');
    }
  };



  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'new': return '#FF6B6B';
      case 'accepted': return '#4ECDC4';
      case 'preparing': return '#FFE66D';
      case 'ready': return '#95E1D3';
      case 'delivered': return '#A8E6CF';
      case 'rejected': return '#FF8E8E';
      default: return '#DDD';
    }
  };

  const getStatusText = (status: OrderStatus): string => {
    switch (status) {
      case 'new': return 'Nuevo';
      case 'accepted': return 'Aceptado';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Listo';
      case 'delivered': return 'Entregado';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  const renderOrderCard = (order: Order) => (
    <TouchableOpacity
      key={order.id}
      style={styles.orderCard}
      onPress={() => setSelectedOrder(order)}
      testID={`order-${order.id}`}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderCustomer}>{order.customerName}</Text>
          <Text style={styles.orderTime}>
            {new Date(order.createdAt).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
        <Text style={styles.orderType}>
          {order.orderType === 'delivery' ? '🚚 Domicilio' : '🏪 Recoger'}
        </Text>
      </View>
      
      <View style={styles.orderItems}>
        {order.items.slice(0, 2).map((item) => (
          <Text key={item.id} style={styles.orderItem}>
            {item.quantity}x {item.name}
          </Text>
        ))}
        {order.items.length > 2 && (
          <Text style={styles.orderItem}>+{order.items.length - 2} más...</Text>
        )}
      </View>
      
      {order.status === 'new' && (
        <View style={styles.orderActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleOrderStatusUpdate(order.id, 'accepted')}
          >
            <CheckCircle size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Aceptar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleOrderStatusUpdate(order.id, 'rejected')}
          >
            <AlertCircle size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {order.status === 'accepted' && (
        <TouchableOpacity
          style={[styles.actionButton, styles.preparingButton]}
          onPress={() => handleOrderStatusUpdate(order.id, 'preparing')}
        >
          <ChefHat size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Marcar Preparando</Text>
        </TouchableOpacity>
      )}
      
      {order.status === 'preparing' && (
        <TouchableOpacity
          style={[styles.actionButton, styles.readyButton]}
          onPress={() => handleOrderStatusUpdate(order.id, 'ready')}
        >
          <Bell size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Marcar Listo</Text>
        </TouchableOpacity>
      )}
      
      {order.status === 'ready' && (
        <TouchableOpacity
          style={[styles.actionButton, styles.deliveredButton]}
          onPress={() => handleOrderStatusUpdate(order.id, 'delivered')}
        >
          <Truck size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Marcar Entregado</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderOrderModal = () => {
    if (!selectedOrder) return null;
    
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles del Pedido</Text>
            <TouchableOpacity
              onPress={() => setSelectedOrder(null)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.customerInfo}>
              <View style={styles.infoRow}>
                <User size={20} color="#666" />
                <Text style={styles.infoText}>{selectedOrder.customerName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Phone size={20} color="#666" />
                <Text style={styles.infoText}>{selectedOrder.customerPhone}</Text>
              </View>
              {selectedOrder.deliveryAddress && (
                <View style={styles.infoRow}>
                  <MapPin size={20} color="#666" />
                  <Text style={styles.infoText}>{selectedOrder.deliveryAddress}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.orderItemsList}>
              <Text style={styles.sectionTitle}>Productos:</Text>
              {selectedOrder.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalAmount}>{formatCurrency(selectedOrder.totalAmount)}</Text>
              </View>
            </View>
            
            {selectedOrder.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.sectionTitle}>Notas:</Text>
                <Text style={styles.notesText}>{selectedOrder.notes}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderStatsCard = (title: string, value: string, icon: React.ReactNode, color: string) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsIcon}>
        {icon}
      </View>
      <View style={styles.statsContent}>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderAnalytics = () => {
    if (!hasPermission('viewAnalytics')) {
      return (
        <View style={styles.restrictedAccess}>
          <AlertCircle size={48} color="#FF6B6B" />
          <Text style={styles.restrictedTitle}>Acceso Restringido</Text>
          <Text style={styles.restrictedText}>
            No tienes permisos para ver las estadísticas.
            Solo los gerentes pueden acceder a esta información.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.analyticsContainer}

      >
        {/* Daily Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Estadísticas de Hoy</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard(
              'Ingresos Hoy',
              formatCurrency(dailyStats.revenue),
              <DollarSign size={24} color="#4CAF50" />,
              '#4CAF50'
            )}
            {renderStatsCard(
              'Pedidos Completados',
              dailyStats.ordersCompleted.toString(),
              <CheckCircle size={24} color="#2196F3" />,
              '#2196F3'
            )}
            {renderStatsCard(
              'Pedidos Pendientes',
              dailyStats.ordersPending.toString(),
              <Clock size={24} color="#FF9800" />,
              '#FF9800'
            )}
            {renderStatsCard(
              'Valor Promedio',
              formatCurrency(dailyStats.averageOrderValue),
              <TrendingUp size={24} color="#9C27B0" />,
              '#9C27B0'
            )}
          </View>
        </View>

        {/* Weekly Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📈 Resumen Semanal</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard(
              'Ingresos Semana',
              formatCurrency(weeklyStats.totalRevenue),
              <BarChart3 size={24} color="#4CAF50" />,
              '#4CAF50'
            )}
            {renderStatsCard(
              'Crecimiento',
              `+${weeklyStats.weeklyGrowth.toFixed(1)}%`,
              <TrendingUp size={24} color="#4CAF50" />,
              '#4CAF50'
            )}
            {renderStatsCard(
              'Mejor Día',
              new Date(weeklyStats.bestPerformingDay).toLocaleDateString('es-ES', { weekday: 'long' }),
              <Award size={24} color="#FFD700" />,
              '#FFD700'
            )}
          </View>
        </View>

        {/* Monthly Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>🗓️ Resumen Mensual</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard(
              'Ingresos del Mes',
              formatCurrency(monthlyStats.totalRevenue),
              <Calendar size={24} color="#4CAF50" />,
              '#4CAF50'
            )}
            {renderStatsCard(
              'Crecimiento Mensual',
              `+${monthlyStats.monthOverMonthGrowth.toFixed(1)}%`,
              <TrendingUp size={24} color="#4CAF50" />,
              '#4CAF50'
            )}
            {renderStatsCard(
              'Meta del Mes',
              `${monthlyStats.goalProgress.percentage.toFixed(1)}%`,
              <Target size={24} color="#2196F3" />,
              '#2196F3'
            )}
          </View>
        </View>

        {/* Top Selling Items */}
        {dailyStats.topSellingItems.length > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>🏆 Productos Más Vendidos Hoy</Text>
            {dailyStats.topSellingItems.map((item, index) => (
              <View key={`${item.name}-${index}`} style={styles.topItemCard}>
                <Text style={styles.topItemRank}>#{index + 1}</Text>
                <View style={styles.topItemInfo}>
                  <Text style={styles.topItemName}>{item.name}</Text>
                  <Text style={styles.topItemStats}>
                    {item.quantity} vendidos • {formatCurrency(item.revenue)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  if (!currentUser) {
    return null; // Will redirect to login
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/')}
          testID="back-to-menu"
        >
          <ArrowLeft size={24} color="#CC0000" />
        </TouchableOpacity>
        
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>DELI EMPANADA</Text>
          <Text style={styles.headerSubtitle}>
            {isManager ? '👑 Panel de Gerencia' : '👨‍🍳 Panel de Empleado'}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setSoundEnabled(!soundEnabled)}
          >
            <Bell size={20} color={soundEnabled ? '#4CAF50' : '#999'} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color="#CC0000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation - Only show for managers */}
      {isManager && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'orders' && styles.activeTab]}
            onPress={() => setSelectedTab('orders')}
          >
            <Package size={20} color={selectedTab === 'orders' ? '#CC0000' : '#666'} />
            <Text style={[styles.tabText, selectedTab === 'orders' && styles.activeTabText]}>
              Pedidos ({newOrders.length + activeOrders.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'analytics' && styles.activeTab]}
            onPress={() => setSelectedTab('analytics')}
          >
            <BarChart3 size={20} color={selectedTab === 'analytics' ? '#CC0000' : '#666'} />
            <Text style={[styles.tabText, selectedTab === 'analytics' && styles.activeTabText]}>
              Estadísticas
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {selectedTab === 'orders' ? (
        <ScrollView
          style={styles.ordersContainer}
  
        >
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatNumber}>{newOrders.length}</Text>
              <Text style={styles.quickStatLabel}>Nuevos</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatNumber}>{activeOrders.length}</Text>
              <Text style={styles.quickStatLabel}>En Proceso</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatNumber}>{completedOrders.length}</Text>
              <Text style={styles.quickStatLabel}>Completados</Text>
            </View>
          </View>

          {/* New Orders */}
          {newOrders.length > 0 && (
            <View style={styles.orderSection}>
              <Text style={styles.sectionTitle}>🔔 Pedidos Nuevos ({newOrders.length})</Text>
              {newOrders.map(renderOrderCard)}
            </View>
          )}

          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <View style={styles.orderSection}>
              <Text style={styles.sectionTitle}>⏳ En Proceso ({activeOrders.length})</Text>
              {activeOrders.map(renderOrderCard)}
            </View>
          )}

          {/* Recent Completed Orders */}
          {completedOrders.slice(0, 5).length > 0 && (
            <View style={styles.orderSection}>
              <Text style={styles.sectionTitle}>✅ Completados Recientes</Text>
              {completedOrders.slice(0, 5).map(renderOrderCard)}
            </View>
          )}

          {orders.length === 0 && (
            <View style={styles.emptyState}>
              <Package size={48} color="#DDD" />
              <Text style={styles.emptyStateText}>No hay pedidos disponibles</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        renderAnalytics()
      )}

      {/* Order Detail Modal */}
      {selectedOrder && renderOrderModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA'
  },
  headerLeft: {
    flex: 1
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CC0000'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#CC0000'
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666'
  },
  activeTabText: {
    color: '#CC0000',
    fontWeight: 'bold'
  },
  ordersContainer: {
    flex: 1,
    padding: 16
  },
  quickStats: {
    flexDirection: 'row',
    marginBottom: 20
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CC0000'
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  orderSection: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  orderInfo: {
    flex: 1
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  orderTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  orderType: {
    fontSize: 14,
    color: '#666'
  },
  orderItems: {
    marginBottom: 12
  },
  orderItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4
  },
  acceptButton: {
    backgroundColor: '#4CAF50'
  },
  rejectButton: {
    backgroundColor: '#F44336'
  },
  preparingButton: {
    backgroundColor: '#FF9800'
  },
  readyButton: {
    backgroundColor: '#2196F3'
  },
  deliveredButton: {
    backgroundColor: '#4CAF50'
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 12
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: getScreenDimensions().isTablet ? '60%' : '90%',
    maxHeight: '80%',
    maxWidth: 500
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    padding: 4
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666'
  },
  modalBody: {
    padding: 20
  },
  customerInfo: {
    marginBottom: 20
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333'
  },
  orderItemsList: {
    marginBottom: 20
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#333'
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 12
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0'
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  notesSection: {
    marginBottom: 20
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic'
  },
  analyticsContainer: {
    flex: 1,
    padding: 16
  },
  statsSection: {
    marginBottom: 24
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    flex: getScreenDimensions().isTablet ? 0 : 1,
    minWidth: getScreenDimensions().isTablet ? 200 : 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statsIcon: {
    marginRight: 12
  },
  statsContent: {
    flex: 1
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  statsTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  topItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  topItemRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginRight: 16,
    minWidth: 30
  },
  topItemInfo: {
    flex: 1
  },
  topItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  topItemStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  restrictedAccess: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  restrictedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 16,
    marginBottom: 8
  },
  restrictedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20
  }
});