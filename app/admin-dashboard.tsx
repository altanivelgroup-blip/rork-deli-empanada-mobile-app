import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '@/providers/AdminProvider';
import Colors from '@/constants/colors';
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
  ArrowLeft,
  LogIn,
  Tag
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
  
  const [selectedTab, setSelectedTab] = useState<'orders' | 'analytics' | 'offers'>('analytics');

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerIconButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>DELI EMPANADA</Text>
          <Text style={styles.headerSubtitle}>🍴 Panel de Gerencia</Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/pedidos')} 
          style={styles.pedidosPillButton}
          activeOpacity={0.8}
        >
          <Text style={styles.pedidosPillText}>Pedidos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'orders' && styles.activeTab]}
          onPress={() => setSelectedTab('orders')}
        >
          <Package size={18} color={selectedTab === 'orders' ? Colors.light.primary : Colors.light.textLight} />
          <Text style={[styles.tabText, selectedTab === 'orders' && styles.activeTabText]}>
            Pedidos ({orders.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'analytics' && styles.activeTab]}
          onPress={() => setSelectedTab('analytics')}
        >
          <BarChart3 size={18} color={selectedTab === 'analytics' ? Colors.light.primary : Colors.light.textLight} />
          <Text style={[styles.tabText, selectedTab === 'analytics' && styles.activeTabText]}>
            Estadísticas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'offers' && styles.activeTab]}
          onPress={() => router.push('/admin-offers')}
        >
          <Tag size={18} color={selectedTab === 'offers' ? Colors.light.primary : Colors.light.textLight} />
          <Text style={[styles.tabText, selectedTab === 'offers' && styles.activeTabText]}>
            Ofertas
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
    backgroundColor: Colors.light.surface
  },
  header: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4
      }
    })
  },
  headerIconButton: {
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const
  },
  pedidosPillButton: {
    backgroundColor: '#27AE60',
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
      }
    })
  },
  pedidosPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FFE0E0',
    marginTop: 2
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.border
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomColor: Colors.light.primary
  },
  tabText: {
    fontSize: 14,
    color: Colors.light.textLight,
    fontWeight: '600' as const
  },
  activeTabText: {
    color: Colors.light.primary,
    fontWeight: '700' as const
  },
  ordersView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.light.surface
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.light.textLight,
    textAlign: 'center' as const,
    marginBottom: 24
  },
  navigateButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(204,0,0,0.2)'
      },
      default: {
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3
      }
    })
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold' as const
  },
  analyticsContainer: {
    flex: 1,
    backgroundColor: Colors.light.surface
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  statCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 18,
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    gap: 6,
    borderLeftWidth: 4,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3
      }
    })
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textLight,
    textAlign: 'center' as const,
    fontWeight: '500' as const
  },
  weeklyGrid: {
    flexDirection: 'row',
    gap: 10
  },
  weeklyCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3
      }
    })
  },
  weeklyValue: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center' as const
  },
  weeklyLabel: {
    fontSize: 11,
    color: Colors.light.textLight,
    textAlign: 'center' as const,
    fontWeight: '500' as const
  },
  topItemCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2
      }
    })
  },
  topItemRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.accent,
    justifyContent: 'center' as const,
    alignItems: 'center' as const
  },
  topItemRankText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.background
  },
  topItemInfo: {
    flex: 1
  },
  topItemName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 2
  },
  topItemStats: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '500' as const
  }
});
