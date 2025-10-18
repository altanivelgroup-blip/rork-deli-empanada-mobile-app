import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAdmin } from '@/providers/AdminProvider';
import Colors from '@/constants/colors';
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  Package,
  BarChart3,
  LogOut,
  Target,
  Calendar,
} from 'lucide-react-native';

export default function EstadisticasScreen() {
  const { currentUser, orders, isLoading, isManager, logout } = useAdmin();

  useEffect(() => {
    if (!currentUser) {
      router.replace('/admin-login');
      return;
    }
    if (currentUser.email !== 'maria@deliempanada.com') {
      router.replace('/pedidos');
      return;
    }
  }, [currentUser]);

  const todayStats = useMemo(() => {
    const today = new Date();
    const todayOrders = orders.filter((order) => {
      const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
      return orderDate.toDateString() === today.toDateString();
    });

    const completedOrders = todayOrders.filter((o) => o.status === 'delivered');
    const pendingOrders = todayOrders.filter((o) =>
      ['pending', 'paid', 'preparing', 'out_for_delivery', 'new', 'accepted', 'ready'].includes(o.status)
    );

    const revenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = completedOrders.length > 0 ? revenue / completedOrders.length : 0;

    const itemCounts: { [key: string]: { quantity: number; revenue: number } } = {};
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { quantity: 0, revenue: 0 };
        }
        itemCounts[item.name].quantity += item.quantity;
        itemCounts[item.name].revenue += item.quantity * item.price;
      });
    });

    const topProducts = Object.entries(itemCounts)
      .map(([name, data]) => ({ name, quantity: data.quantity, revenue: data.revenue }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

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
      const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
      return orderDate >= weekStart && order.status === 'delivered';
    });

    const weekRevenue = weekOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);
    const prevWeekOrders = orders.filter((order) => {
      const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
      return orderDate >= prevWeekStart && orderDate < weekStart && order.status === 'delivered';
    });
    const prevWeekRevenue = prevWeekOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const weeklyGrowth = prevWeekRevenue > 0 ? ((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100 : 0;

    const dayCounts: { [day: string]: number } = {};
    weekOrders.forEach((order) => {
      const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
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
      const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
      return orderDate >= monthStart && order.status === 'delivered';
    });

    const monthRevenue = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const prevMonthOrders = orders.filter((order) => {
      const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
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

  if (!currentUser || currentUser.email !== 'maria@deliempanada.com') {
    return null;
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pendingOrdersCount = orders.filter(o => ['pending', 'paid', 'preparing', 'out_for_delivery', 'new', 'accepted', 'ready'].includes(o.status)).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>DELI EMPANADA</Text>
          <Text style={styles.headerSubtitle}>🍴 Panel de Gerencia</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
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
            Pedidos ({pendingOrdersCount})
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
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: Colors.light.success }]}>
            <DollarSign size={20} color={Colors.light.success} />
            <Text style={styles.statValue}>{formatCurrency(todayStats.revenue)}</Text>
            <Text style={styles.statLabel}>Ingresos Hoy</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#2196F3' }]}>
            <CheckCircle size={20} color="#2196F3" />
            <Text style={styles.statValue}>{todayStats.completedOrders}</Text>
            <Text style={styles.statLabel}>Pedidos Completados</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.light.warning }]}>
            <Clock size={20} color={Colors.light.warning} />
            <Text style={styles.statValue}>{todayStats.pendingOrders}</Text>
            <Text style={styles.statLabel}>Pedidos Pendientes</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#9C27B0' }]}>
            <TrendingUp size={20} color="#9C27B0" />
            <Text style={styles.statValue}>{formatCurrency(todayStats.averageOrderValue)}</Text>
            <Text style={styles.statLabel}>Valor Promedio</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>📈 Resumen Semanal</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <BarChart3 size={20} color={Colors.light.success} />
            <Text style={styles.summaryValue}>{formatCurrency(weeklyStats.revenue)}</Text>
            <Text style={styles.summaryLabel}>Ingresos Semana</Text>
          </View>
          <View style={styles.summaryCard}>
            <TrendingUp size={20} color={Colors.light.success} />
            <Text style={[styles.summaryValue, { color: Colors.light.success }]}>
              {weeklyStats.growth >= 0 ? '+' : ''}{weeklyStats.growth.toFixed(1)}%
            </Text>
            <Text style={styles.summaryLabel}>Crecimiento</Text>
          </View>
          <View style={styles.summaryCard}>
            <Calendar size={20} color={Colors.light.warning} />
            <Text style={styles.summaryValue}>{weeklyStats.bestDayName}</Text>
            <Text style={styles.summaryLabel}>Mejor Día</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>📅 Resumen Mensual</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <DollarSign size={20} color={Colors.light.success} />
            <Text style={styles.summaryValue}>{formatCurrency(monthlyStats.revenue)}</Text>
            <Text style={styles.summaryLabel}>Ingresos del Mes</Text>
          </View>
          <View style={styles.summaryCard}>
            <TrendingUp size={20} color={Colors.light.success} />
            <Text style={[styles.summaryValue, { color: Colors.light.success }]}>
              {monthlyStats.growth >= 0 ? '+' : ''}{monthlyStats.growth.toFixed(1)}%
            </Text>
            <Text style={styles.summaryLabel}>Crecimiento Mensual</Text>
          </View>
          <View style={styles.summaryCard}>
            <Target size={20} color="#2196F3" />
            <Text style={styles.summaryValue}>{monthlyStats.goalPercentage}%</Text>
            <Text style={styles.summaryLabel}>Meta del Mes</Text>
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
                    {product.quantity} vendidos • {formatCurrency(product.revenue)}
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
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
    fontWeight: '600' as const,
    color: Colors.light.textLight,
  },
  tabTextActive: {
    color: Colors.light.primary,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
      },
    }),
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textLight,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
      },
    }),
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.light.textLight,
    fontWeight: '500' as const,
    textAlign: 'center',
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
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
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
    fontWeight: '700' as const,
    color: Colors.light.background,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  productStats: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '500' as const,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textLight,
    textAlign: 'center',
    fontStyle: 'italic' as const,
  },
});
