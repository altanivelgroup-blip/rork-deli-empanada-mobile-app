import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
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
  BarChart3,
  Bell,
  LogOut,
  Target,
} from 'lucide-react-native';

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

export default function EstadisticasScreen() {
  const { currentUser } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.email === 'lecabravomaya@gmail.com' || currentUser?.email === 'maria@deliempanada.com' || (currentUser as any)?.role === 'admin';

  useEffect(() => {
    if (!currentUser) {
      console.log('❌ No current user, redirecting to login');
      router.replace('/admin-login');
      return;
    }

    if (!isAdmin) {
      console.log('❌ User is not admin, redirecting to pedidos');
      router.replace('/pedidos');
      return;
    }

    if (!db) {
      console.warn('⚠️ Firebase not configured');
      setLoading(false);
      return;
    }

    console.log('✅ Fetching orders');

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
        console.log(`📊 Loaded ${ordersData.length} orders`);
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Error fetching orders:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isAdmin]);

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

    const dayCounts: { [day: string]: number } = {};
    todayOrders.forEach((order) => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const dayName = orderDate.toLocaleDateString('es-ES', { weekday: 'long' });
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });

    const bestDay = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      revenue,
      completedOrders: completedOrders.length,
      pendingOrders: pendingOrders.length,
      averageOrderValue,
      topProducts,
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

    const weeklyGrowth = prevWeekRevenue > 0 ? ((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100 : 0;

    const dayCounts: { [day: string]: number } = {};
    weekOrders.forEach((order) => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const dayName = orderDate.toLocaleDateString('es-ES', { weekday: 'long' });
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });

    const bestDay = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)[0];

    const bestDayName = bestDay ? bestDay[0] : 'N/A';

    return {
      revenue: weekRevenue,
      growth: weeklyGrowth,
      ordersCount: weekOrders.length,
      bestDayName,
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

    const monthlyGrowth = prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

    return {
      revenue: monthRevenue,
      growth: monthlyGrowth,
      ordersCount: monthOrders.length,
      goalPercentage: 0.8,
    };
  }, [orders]);

  const formatCurrency = (amount: number) => {
    return `$ ${amount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

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
          <Text style={styles.headerTitle}>DELI EMPANADA</Text>
          <Text style={styles.headerSubtitle}>🍴 Panel de Gerencia</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => {}} style={styles.iconButton}>
            <Bell size={20} color={Colors.light.background} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.iconButton}>
            <LogOut size={20} color={Colors.light.background} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => router.push('/pedidos')}
        >
          <Package size={18} color={Colors.light.textLight} />
          <Text style={styles.tabText}>
            Pedidos ({orders.filter(o => ['pending', 'paid', 'preparing', 'out_for_delivery'].includes(o.status)).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, styles.tabActive]}
          onPress={() => {}}
        >
          <BarChart3 size={18} color={Colors.light.primary} />
          <Text style={[styles.tabText, styles.tabTextActive]}>
            Estadísticas
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>📊 Estadísticas de Hoy</Text>
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCardLarge, { borderLeftColor: Colors.light.success }]}>
            <View style={styles.kpiIconContainer}>
              <DollarSign size={24} color={Colors.light.success} />
            </View>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiValue}>{formatCurrency(todayStats.revenue)}</Text>
              <Text style={styles.kpiTitle}>Ingresos Hoy</Text>
            </View>
          </View>
          <View style={[styles.kpiCardLarge, { borderLeftColor: '#2196F3' }]}>
            <View style={styles.kpiIconContainer}>
              <CheckCircle size={24} color="#2196F3" />
            </View>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiValue}>{todayStats.completedOrders}</Text>
              <Text style={styles.kpiTitle}>Pedidos Completados</Text>
            </View>
          </View>
          <View style={[styles.kpiCardLarge, { borderLeftColor: Colors.light.warning }]}>
            <View style={styles.kpiIconContainer}>
              <Clock size={24} color={Colors.light.warning} />
            </View>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiValue}>{todayStats.pendingOrders}</Text>
              <Text style={styles.kpiTitle}>Pedidos Pendientes</Text>
            </View>
          </View>
          <View style={[styles.kpiCardLarge, { borderLeftColor: '#9C27B0' }]}>
            <View style={styles.kpiIconContainer}>
              <TrendingUp size={24} color="#9C27B0" />
            </View>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiValue}>{formatCurrency(todayStats.averageOrderValue)}</Text>
              <Text style={styles.kpiTitle}>Valor Promedio</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>📈 Resumen Semanal</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <BarChart3 size={24} color={Colors.light.success} />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryValue}>{formatCurrency(weeklyStats.revenue)}</Text>
              <Text style={styles.summaryLabel}>Ingresos Semana</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <TrendingUp size={24} color={Colors.light.success} />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={[styles.summaryValue, { color: Colors.light.success }]}>
                {weeklyStats.growth >= 0 ? '+' : ''}{weeklyStats.growth.toFixed(1)}%
              </Text>
              <Text style={styles.summaryLabel}>Crecimiento</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Package size={24} color={Colors.light.warning} />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryValue}>{weeklyStats.bestDayName}</Text>
              <Text style={styles.summaryLabel}>Mejor Día</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>📅 Resumen Mensual</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <DollarSign size={24} color={Colors.light.success} />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryValue}>{formatCurrency(monthlyStats.revenue)}</Text>
              <Text style={styles.summaryLabel}>Ingresos del Mes</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <TrendingUp size={24} color={Colors.light.success} />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={[styles.summaryValue, { color: Colors.light.success }]}>
                {monthlyStats.growth >= 0 ? '+' : ''}{monthlyStats.growth.toFixed(1)}%
              </Text>
              <Text style={styles.summaryLabel}>Crecimiento Mensual</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Target size={24} color="#2196F3" />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryValue}>{monthlyStats.goalPercentage}%</Text>
              <Text style={styles.summaryLabel}>Meta del Mes</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>🏆 Productos Más Vendidos Hoy</Text>
        <View style={styles.topProductsCard}>
          {todayStats.topProducts.length > 0 ? (
            todayStats.topProducts.map((product, index) => (
              <View key={product.name} style={styles.productRow}>
                <View style={styles.productRank}>
                  <Text style={styles.productRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productStats}>
                    {product.quantity} vendidos • {formatCurrency((product.quantity * 3500))}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No hay datos de productos hoy</Text>
          )}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
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
  kpiCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      },
    }),
  },
  kpiCardLarge: {
    flex: 1,
    minWidth: 200,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderLeftWidth: 4,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiContent: {
    flex: 1,
  },
  kpiTitle: {
    fontSize: 11,
    color: Colors.light.textLight,
    fontWeight: '500',
    marginTop: 2,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  kpiSubtitle: {
    fontSize: 11,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTextContainer: {
    flex: 1,
    marginLeft: 12,
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
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '500',
    marginTop: 2,
  },
  summaryValue: {
    fontSize: 18,
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
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  productStats: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '500',
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
});
