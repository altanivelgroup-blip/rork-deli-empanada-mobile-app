import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAdmin } from '@/providers/AdminProvider';
import Colors from '@/constants/colors';
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  Package,
  ArrowLeft,
  Download,
  BarChart3,
  TrendingDown,
} from 'lucide-react-native';
import BranchToggle from '@/components/BranchToggle';
import { exportDailyReport, formatCurrency, calculateGrowth } from '@/utils/exportReport';
import Toast from 'react-native-toast-message';

type Branch = 'Todas' | 'Norte' | 'Sur';

interface Order {
  id: string;
  customerName: string;
  contact: string;
  address: string;
  items: { id: string; name: string; quantity: number; price: number }[];
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  createdAt: any;
  branch?: 'Norte' | 'Sur';
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  animated?: boolean;
}

const KPICard = React.memo<KPICardProps>(({ title, value, subtitle, icon, color, trend, animated }) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [animated, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.kpiCard,
        { transform: animated ? [{ scale: scaleAnim }] : [] },
      ]}
    >
      <View style={[styles.kpiIconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={styles.kpiContent}>
        <Text style={styles.kpiTitle}>{title}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
        {subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
        {trend !== undefined && (
          <View style={styles.trendContainer}>
            {trend >= 0 ? (
              <TrendingUp size={14} color={Colors.light.success} />
            ) : (
              <TrendingDown size={14} color={Colors.light.error} />
            )}
            <Text
              style={[
                styles.trendText,
                { color: trend >= 0 ? Colors.light.success : Colors.light.error },
              ]}
            >
              {trend >= 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
});
KPICard.displayName = 'KPICard';

export default function EstadisticasScreen() {
  const { currentUser } = useAdmin();
  const { width } = useWindowDimensions();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<Branch>('Todas');
  const [exporting, setExporting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [dailyNote, setDailyNote] = useState('');

  const isAdmin = currentUser?.email === 'lecabravomaya@gmail.com';
  const isMobile = width <= 800;

  useEffect(() => {
    if (!currentUser) {
      router.replace('/admin-login');
      return;
    }

    if (!isAdmin) {
      router.replace('/pedidos');
      return;
    }

    if (!db) {
      console.warn('Firebase not configured');
      setLoading(false);
      return;
    }

    let q;
    if (selectedBranch === 'Todas') {
      q = query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'));
    } else {
      q = query(
        collection(db, 'pedidos'),
        where('branch', '==', selectedBranch),
        orderBy('createdAt', 'desc')
      );
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
      },
      (error) => {
        console.error('Error fetching orders:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isAdmin, selectedBranch]);

  const todayStats = useMemo(() => {
    const today = new Date();
    const todayOrders = orders.filter((order) => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate.toDateString() === today.toDateString();
    });

    const completedOrders = todayOrders.filter((o) => o.status === 'delivered');
    const pendingOrders = todayOrders.filter((o) =>
      ['pending', 'paid', 'preparing', 'out_for_delivery'].includes(o.status)
    );

    const revenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = completedOrders.length > 0 ? revenue / completedOrders.length : 0;

    const itemCounts: { [key: string]: number } = {};
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });

    const topProducts = Object.entries(itemCounts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    const hourCounts: { [hour: number]: number } = {};
    todayOrders.forEach((order) => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const hour = orderDate.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0];

    const peakHourRange = peakHour
      ? `${peakHour[0]}:00 - ${parseInt(peakHour[0]) + 1}:00`
      : 'N/A';

    return {
      revenue,
      completedOrders: completedOrders.length,
      pendingOrders: pendingOrders.length,
      averageOrderValue,
      topProducts,
      peakHourRange,
      totalOrders: todayOrders.length,
    };
  }, [orders]);

  const weeklyStats = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);

    const weekOrders = orders.filter((order) => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= weekStart && order.status === 'delivered';
    });

    const weekRevenue = weekOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);
    const prevWeekOrders = orders.filter((order) => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= prevWeekStart && orderDate < weekStart && order.status === 'delivered';
    });
    const prevWeekRevenue = prevWeekOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const weeklyGrowth = calculateGrowth(weekRevenue, prevWeekRevenue);

    return {
      revenue: weekRevenue,
      growth: weeklyGrowth,
      ordersCount: weekOrders.length,
    };
  }, [orders]);

  const monthlyStats = useMemo(() => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const monthOrders = orders.filter((order) => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= monthStart && order.status === 'delivered';
    });

    const monthRevenue = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const prevMonthOrders = orders.filter((order) => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= prevMonthStart && orderDate <= prevMonthEnd && order.status === 'delivered';
    });
    const prevMonthRevenue = prevMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const monthlyGrowth = calculateGrowth(monthRevenue, prevMonthRevenue);

    return {
      revenue: monthRevenue,
      growth: monthlyGrowth,
      ordersCount: monthOrders.length,
    };
  }, [orders]);

  const handleExport = useCallback(async (note = '') => {
    setExporting(true);
    try {
      const result = await exportDailyReport(orders, selectedBranch, note);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Informe generado con éxito',
          text2: 'El reporte fue exportado correctamente.',
          position: 'bottom',
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      Toast.show({
        type: 'error',
        text1: 'Error al generar el informe',
        text2: 'Por favor intenta de nuevo.',
        position: 'bottom',
      });
    } finally {
      setExporting(false);
    }
  }, [orders, selectedBranch]);

  const handleConfirmExport = useCallback(() => {
    setConfirmVisible(false);
    handleExport(dailyNote);
    setDailyNote('');
  }, [handleExport, dailyNote]);

  if (!currentUser || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Estadísticas</Text>
          <Text style={styles.headerSubtitle}>Panel Ejecutivo</Text>
        </View>
        <View style={styles.headerRight}>
          <BarChart3 size={24} color={Colors.light.background} />
        </View>
      </View>

      <View style={styles.controlsBar}>
        <BranchToggle
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          disabled={false}
        />
        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          onPress={() => setConfirmVisible(true)}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={Colors.light.primary} />
          ) : (
            <>
              <Download size={18} color={Colors.light.primary} />
              <Text style={styles.exportButtonText}>Generar Informe Diario</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>📊 Resumen de Hoy</Text>
        <View style={[styles.kpiGrid, isMobile && styles.kpiGridMobile]}>
          <KPICard
            title="Ingresos Hoy"
            value={formatCurrency(todayStats.revenue)}
            subtitle={`${todayStats.totalOrders} pedidos`}
            icon={<DollarSign size={24} color={Colors.light.primary} />}
            color={Colors.light.primary}
            animated={true}
          />
          <KPICard
            title="Completados"
            value={todayStats.completedOrders.toString()}
            subtitle="Pedidos entregados"
            icon={<CheckCircle size={24} color={Colors.light.success} />}
            color={Colors.light.success}
            animated={true}
          />
          <KPICard
            title="Pendientes"
            value={todayStats.pendingOrders.toString()}
            subtitle="En proceso"
            icon={<Clock size={24} color={Colors.light.warning} />}
            color={Colors.light.warning}
            animated={true}
          />
          <KPICard
            title="Valor Promedio"
            value={formatCurrency(todayStats.averageOrderValue)}
            subtitle="Por pedido"
            icon={<Package size={24} color={Colors.light.accent} />}
            color={Colors.light.accent}
            animated={true}
          />
        </View>

        <Text style={styles.sectionTitle}>📈 Resumen Semanal</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ingresos (7 días)</Text>
            <Text style={styles.summaryValue}>{formatCurrency(weeklyStats.revenue)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pedidos Completados</Text>
            <Text style={styles.summaryValue}>{weeklyStats.ordersCount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Crecimiento vs Semana Anterior</Text>
            <View style={styles.trendContainer}>
              {weeklyStats.growth >= 0 ? (
                <TrendingUp size={16} color={Colors.light.success} />
              ) : (
                <TrendingDown size={16} color={Colors.light.error} />
              )}
              <Text
                style={[
                  styles.summaryValue,
                  { color: weeklyStats.growth >= 0 ? Colors.light.success : Colors.light.error },
                ]}
              >
                {weeklyStats.growth >= 0 ? '+' : ''}
                {weeklyStats.growth.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>📅 Resumen Mensual</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ingresos del Mes</Text>
            <Text style={styles.summaryValue}>{formatCurrency(monthlyStats.revenue)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pedidos Completados</Text>
            <Text style={styles.summaryValue}>{monthlyStats.ordersCount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Crecimiento vs Mes Anterior</Text>
            <View style={styles.trendContainer}>
              {monthlyStats.growth >= 0 ? (
                <TrendingUp size={16} color={Colors.light.success} />
              ) : (
                <TrendingDown size={16} color={Colors.light.error} />
              )}
              <Text
                style={[
                  styles.summaryValue,
                  { color: monthlyStats.growth >= 0 ? Colors.light.success : Colors.light.error },
                ]}
              >
                {monthlyStats.growth >= 0 ? '+' : ''}
                {monthlyStats.growth.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>🕒 Pico de Ventas</Text>
        <View style={styles.peakCard}>
          <Clock size={32} color={Colors.light.accent} />
          <Text style={styles.peakTime}>{todayStats.peakHourRange}</Text>
          <Text style={styles.peakLabel}>Hora con más pedidos hoy</Text>
        </View>

        <Text style={styles.sectionTitle}>🏆 Top Productos del Día</Text>
        <View style={styles.topProductsCard}>
          {todayStats.topProducts.length > 0 ? (
            todayStats.topProducts.map((product, index) => {
              const maxQuantity = todayStats.topProducts[0].quantity;
              const percentage = (product.quantity / maxQuantity) * 100;
              return (
                <View key={product.name} style={styles.productRow}>
                  <View style={styles.productRank}>
                    <Text style={styles.productRankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${percentage}%`,
                            backgroundColor:
                              index === 0
                                ? Colors.light.accent
                                : index === 1
                                ? Colors.light.secondary
                                : Colors.light.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.productQuantity}>{product.quantity}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No hay datos de productos hoy</Text>
          )}
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={confirmVisible}
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              ¿Deseas generar el informe de hoy?
            </Text>

            <TextInput
              placeholder="Notas del Día (opcional)"
              placeholderTextColor="#888"
              value={dailyNote}
              onChangeText={setDailyNote}
              multiline
              numberOfLines={3}
              style={styles.modalInput}
            />

            <Text style={styles.modalMessage}>
              Se generará el reporte de ventas del día y podrás incluir una nota personalizada.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setConfirmVisible(false)}
                style={styles.modalButtonCancel}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmExport}
                style={styles.modalButtonConfirm}
              >
                <Text style={styles.modalButtonConfirmText}>Generar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.background,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.background,
    opacity: 0.8,
  },
  headerRight: {
    width: 32,
    alignItems: 'flex-end',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CC0000',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiGridMobile: {
    flexDirection: 'column',
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  kpiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiContent: {
    flex: 1,
  },
  kpiTitle: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '600',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  kpiSubtitle: {
    fontSize: 11,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    gap: 12,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.light.textLight,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  peakCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
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
  peakTime: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  peakLabel: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  topProductsCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    gap: 16,
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
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.background,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  productQuantity: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    minWidth: 40,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#CC0000',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#333',
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  modalButtonCancel: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
  modalButtonCancelText: {
    color: '#333',
    fontWeight: '600',
  },
  modalButtonConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#FFD700',
  },
  modalButtonConfirmText: {
    color: '#CC0000',
    fontWeight: '700',
  },
});
