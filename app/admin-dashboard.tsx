import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '@/providers/AdminProvider';
import {
  Clock,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Package,
  LogOut,
  BarChart3,
  Calendar,
  Target,
  ArrowLeft
} from 'lucide-react-native';
import { router, Stack } from 'expo-router';

export default function AdminDashboardScreen() {
  const {
    orders,
    currentUser,
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    logout
  } = useAdmin();
  
  const [selectedTab, setSelectedTab] = useState<'orders' | 'analytics'>('analytics');

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
            router.replace('/admin');
          }
        }
      ]
    );
  };

  const formatCurrency = (amount: number): string => {
    return `$ ${amount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const renderAnalytics = () => {
    return (
      <ScrollView style={styles.analyticsContainer}>
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={20} color="#333" />
            <Text style={styles.sectionTitle}>Estadísticas de Hoy</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderLeftColor: '#4CAF50' }]}>
              <DollarSign size={28} color="#4CAF50" />
              <Text style={styles.statValue}>{formatCurrency(dailyStats.revenue)}</Text>
              <Text style={styles.statLabel}>Ingresos Hoy</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#2196F3' }]}>
              <CheckCircle size={28} color="#2196F3" />
              <Text style={styles.statValue}>{dailyStats.ordersCompleted}</Text>
              <Text style={styles.statLabel}>Pedidos Completados</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#FF9800' }]}>
              <Clock size={28} color="#FF9800" />
              <Text style={styles.statValue}>{dailyStats.ordersPending}</Text>
              <Text style={styles.statLabel}>Pedidos Pendientes</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#9C27B0' }]}>
              <TrendingUp size={28} color="#9C27B0" />
              <Text style={styles.statValue}>{formatCurrency(dailyStats.averageOrderValue)}</Text>
              <Text style={styles.statLabel}>Valor Promedio</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={20} color="#333" />
            <Text style={styles.sectionTitle}>Resumen Semanal</Text>
          </View>
          <View style={styles.weeklyGrid}>
            <View style={styles.weeklyCard}>
              <BarChart3 size={28} color="#4CAF50" />
              <Text style={styles.weeklyValue}>{formatCurrency(weeklyStats.totalRevenue)}</Text>
              <Text style={styles.weeklyLabel}>Ingresos Semana</Text>
            </View>
            <View style={styles.weeklyCard}>
              <TrendingUp size={28} color="#4CAF50" />
              <Text style={[styles.weeklyValue, { color: '#4CAF50' }]}>+{weeklyStats.weeklyGrowth.toFixed(1)}%</Text>
              <Text style={styles.weeklyLabel}>Crecimiento</Text>
            </View>
            <View style={styles.weeklyCard}>
              <Calendar size={28} color="#FFD700" />
              <Text style={styles.weeklyValue}>{new Date(weeklyStats.bestPerformingDay).toLocaleDateString('es-ES', { weekday: 'long' })}</Text>
              <Text style={styles.weeklyLabel}>Mejor Día</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#333" />
            <Text style={styles.sectionTitle}>Resumen Mensual</Text>
          </View>
          <View style={styles.weeklyGrid}>
            <View style={styles.weeklyCard}>
              <DollarSign size={28} color="#4CAF50" />
              <Text style={styles.weeklyValue}>{formatCurrency(monthlyStats.totalRevenue)}</Text>
              <Text style={styles.weeklyLabel}>Ingresos del Mes</Text>
            </View>
            <View style={styles.weeklyCard}>
              <TrendingUp size={28} color="#4CAF50" />
              <Text style={[styles.weeklyValue, { color: '#4CAF50' }]}>+{monthlyStats.monthOverMonthGrowth.toFixed(1)}%</Text>
              <Text style={styles.weeklyLabel}>Crecimiento Mensual</Text>
            </View>
            <View style={styles.weeklyCard}>
              <Target size={28} color="#2196F3" />
              <Text style={styles.weeklyValue}>{monthlyStats.goalProgress.percentage.toFixed(1)}%</Text>
              <Text style={styles.weeklyLabel}>Meta del Mes</Text>
            </View>
          </View>
        </View>

        {dailyStats.topSellingItems.length > 0 && (
          <View style={styles.statsSection}>
            <View style={styles.sectionHeader}>
              <Package size={20} color="#333" />
              <Text style={styles.sectionTitle}>Productos Más Vendidos Hoy</Text>
            </View>
            {dailyStats.topSellingItems.map((item, index) => (
              <View key={`${item.name}-${index}`} style={styles.topItemCard}>
                <View style={styles.topItemRank}>
                  <Text style={styles.topItemRankText}>#{index + 1}</Text>
                </View>
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
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: '#CC0000'
          },
          headerTintColor: '#FFFFFF',
          headerTitleAlign: 'center',
          headerTitle: () => (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>DELI EMPANADA</Text>
              <Text style={{ color: '#FFE0E0', fontSize: 12 }}>
                🍴 Panel de Gerencia
              </Text>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: 8 }}>
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ padding: 8, marginRight: 8 }} testID="sign-out-button">
              <LogOut size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )
        }}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'orders' && styles.activeTab]}
          onPress={() => setSelectedTab('orders')}
        >
          <Package size={20} color={selectedTab === 'orders' ? '#CC0000' : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'orders' && styles.activeTabText]}>
            Pedidos ({orders.length})
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

      {selectedTab === 'orders' ? (
        <View style={styles.ordersView}>
          <Text style={styles.placeholderText}>Vista de Pedidos - Navega a /pedidos para ver los pedidos</Text>
          <TouchableOpacity 
            style={styles.navigateButton}
            onPress={() => router.push('/pedidos')}
          >
            <Text style={styles.navigateButtonText}>Ir a Pedidos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        renderAnalytics()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
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
    borderBottomWidth: 3,
    borderBottomColor: '#CC0000'
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666'
  },
  activeTabText: {
    color: '#CC0000',
    fontWeight: 'bold' as const
  },
  ordersView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 24
  },
  navigateButton: {
    backgroundColor: '#CC0000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold' as const
  },
  analyticsContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  statsSection: {
    padding: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#333'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#333'
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center' as const
  },
  weeklyGrid: {
    flexDirection: 'row',
    gap: 12
  },
  weeklyCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  weeklyValue: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#333',
    textAlign: 'center' as const
  },
  weeklyLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center' as const
  },
  topItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  topItemRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    justifyContent: 'center' as const,
    alignItems: 'center' as const
  },
  topItemRankText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#FFFFFF'
  },
  topItemInfo: {
    flex: 1
  },
  topItemName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#333'
  },
  topItemStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  }
});
