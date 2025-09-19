import React from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Order, Employee, DailyStats, WeeklyStats, MonthlyStats, OrderStatus, NotificationSettings } from '@/types/admin';

// Mock AsyncStorage for web compatibility
const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

const STORAGE_KEYS = {
  ORDERS: 'admin_orders',
  EMPLOYEES: 'admin_employees',
  CURRENT_USER: 'admin_current_user',
  SETTINGS: 'admin_settings'
};

// Mock data generators
const generateMockOrders = (): Order[] => {
  const mockOrders: Order[] = [];
  const now = new Date();
  
  for (let i = 0; i < 15; i++) {
    const createdAt = new Date(now.getTime() - (i * 30 * 60 * 1000)); // 30 min intervals
    const statuses: OrderStatus[] = ['new', 'accepted', 'preparing', 'ready', 'delivered'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    mockOrders.push({
      id: `order_${Date.now()}_${i}`,
      customerName: `Cliente ${i + 1}`,
      customerPhone: `+57 300 ${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
      customerEmail: `cliente${i + 1}@email.com`,
      deliveryAddress: i % 2 === 0 ? `Calle ${i + 10} #${i + 5}-${i + 20}` : undefined,
      orderType: i % 2 === 0 ? 'delivery' : 'pickup',
      items: [
        {
          id: `item_${i}_1`,
          name: 'Empanada de Pollo',
          price: 3500,
          quantity: Math.floor(Math.random() * 3) + 1,
          category: 'empanadas'
        },
        {
          id: `item_${i}_2`,
          name: 'Coca Cola',
          price: 2500,
          quantity: 1,
          category: 'bebidas'
        }
      ],
      totalAmount: 6000 + (Math.floor(Math.random() * 5000)),
      status,
      createdAt,
      updatedAt: createdAt,
      assignedTo: status !== 'new' ? 'emp_1' : undefined,
      estimatedTime: status === 'preparing' ? 15 : undefined,
      notes: i % 3 === 0 ? 'Sin cebolla' : undefined
    });
  }
  
  return mockOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

const generateMockEmployees = (): Employee[] => [
  {
    id: 'emp_1',
    name: 'Carlos Rodríguez',
    email: 'carlos@deliempanada.com',
    role: 'kitchen',
    isActive: true,
    permissions: {
      viewOrders: true,
      manageOrders: true,
      viewAnalytics: false,
      viewRevenue: false,
      manageEmployees: false
    }
  },
  {
    id: 'mgr_1',
    name: 'María González',
    email: 'maria@deliempanada.com',
    role: 'manager',
    isActive: true,
    permissions: {
      viewOrders: true,
      manageOrders: true,
      viewAnalytics: true,
      viewRevenue: true,
      manageEmployees: true
    }
  },
  {
    id: 'emp_3',
    name: 'Juan Pérez',
    email: 'juan@deliempanada.com',
    role: 'delivery',
    isActive: true,
    permissions: {
      viewOrders: true,
      manageOrders: true,
      viewAnalytics: false,
      viewRevenue: false,
      manageEmployees: false
    }
  }
];

export const [AdminProvider, useAdmin] = createContextHook(() => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    newOrderSound: 'default',
    volume: 0.8
  });

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Clear any existing user session to force fresh login
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        
        const [storedOrders, storedEmployees] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
          AsyncStorage.getItem(STORAGE_KEYS.EMPLOYEES)
        ]);

        // Initialize with mock data if no stored data
        const ordersData = storedOrders ? JSON.parse(storedOrders).map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt)
        })) : generateMockOrders();
        
        const employeesData = storedEmployees ? JSON.parse(storedEmployees) : generateMockEmployees();
        const userData = null; // No default user - must login

        setOrders(ordersData);
        setEmployees(employeesData);
        setCurrentUser(userData);

        // Save mock data if it was generated
        if (!storedOrders) {
          AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(ordersData));
        }
        if (!storedEmployees) {
          AsyncStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employeesData));
        }
        // Don't auto-save null user - only save after successful login
      } catch (error) {
        console.error('Error loading admin data:', error);
        // Fallback to mock data
        setOrders(generateMockOrders());
        setEmployees(generateMockEmployees());
        setCurrentUser(null); // No default user - must login
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save orders to storage whenever they change
  useEffect(() => {
    if (!isLoading && orders.length > 0) {
      AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }
  }, [orders, isLoading]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus, assignedTo?: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status, 
              updatedAt: new Date(),
              assignedTo: assignedTo || order.assignedTo,
              estimatedTime: status === 'preparing' ? 15 : undefined
            }
          : order
      )
    );
  }, []);

  const addNewOrder = useCallback((orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `order_${Date.now()}`,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setOrders(prevOrders => [newOrder, ...prevOrders]);
    
    // Play notification sound if enabled
    if (notificationSettings.soundEnabled) {
      // In a real app, you would play a sound here
      console.log('🔔 New order notification!');
    }
  }, [notificationSettings.soundEnabled]);

  const assignOrder = useCallback((orderId: string, employeeId: string) => {
    updateOrderStatus(orderId, 'accepted', employeeId);
  }, [updateOrderStatus]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; user?: Employee; error?: string }> => {
    // Mock login with role-based authentication
    const credentials = {
      'maria@deliempanada.com': { password: 'admin123', role: 'manager' },
      'employee1': { password: 'work123', role: 'kitchen' }
    };

    const credential = credentials[email as keyof typeof credentials];
    if (credential && credential.password === password) {
      const employee: Employee = {
        id: credential.role === 'manager' ? 'mgr_1' : 'emp_1',
        name: credential.role === 'manager' ? 'María González' : 'Empleado 1',
        email: email,
        role: credential.role as 'kitchen' | 'manager',
        isActive: true,
        permissions: {
          viewOrders: true,
          manageOrders: true,
          viewAnalytics: credential.role === 'manager',
          viewRevenue: credential.role === 'manager',
          manageEmployees: credential.role === 'manager'
        }
      };
      
      setCurrentUser(employee);
      AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(employee));
      return { success: true, user: employee };
    }
    
    return { success: false, error: 'Credenciales inválidas' };
  }, []);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }, []);

  // Analytics functions
  const getDailyStats = useCallback((): DailyStats => {
    const today = new Date();
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.toDateString() === today.toDateString();
    });

    const completedOrders = todayOrders.filter(order => order.status === 'delivered');
    const pendingOrders = todayOrders.filter(order => ['new', 'accepted', 'preparing', 'ready'].includes(order.status));
    
    const revenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = completedOrders.length > 0 ? revenue / completedOrders.length : 0;

    // Calculate top selling items
    const itemCounts: { [key: string]: { quantity: number; revenue: number } } = {};
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { quantity: 0, revenue: 0 };
        }
        itemCounts[item.name].quantity += item.quantity;
        itemCounts[item.name].revenue += item.price * item.quantity;
      });
    });

    const topSellingItems = Object.entries(itemCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Calculate peak hours
    const hourCounts: { [hour: number]: number } = {};
    todayOrders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), orderCount: count }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 3);

    return {
      date: today.toISOString().split('T')[0],
      revenue,
      ordersCompleted: completedOrders.length,
      ordersPending: pendingOrders.length,
      topSellingItems,
      peakHours,
      averageOrderValue
    };
  }, [orders]);

  const getWeeklyStats = useCallback((): WeeklyStats => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= weekStart && orderDate <= weekEnd && order.status === 'delivered';
    });

    const dailyRevenue: { date: string; revenue: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayOrders = weekOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === date.toDateString();
      });
      const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      dailyRevenue.push({ date: date.toISOString().split('T')[0], revenue });
    }

    const totalRevenue = dailyRevenue.reduce((sum, day) => sum + day.revenue, 0);
    const bestPerformingDay = dailyRevenue.reduce((best, day) => 
      day.revenue > best.revenue ? day : best
    ).date;

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      dailyRevenue,
      totalRevenue,
      bestPerformingDay,
      weeklyGrowth: 12.5, // Mock growth percentage
      popularItems: []
    };
  }, [orders]);

  const getMonthlyStats = useCallback((): MonthlyStats => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= monthStart && orderDate <= monthEnd && order.status === 'delivered';
    });

    const totalRevenue = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      month: today.toLocaleString('es-ES', { month: 'long' }),
      year: today.getFullYear(),
      totalRevenue,
      monthOverMonthGrowth: 8.3, // Mock growth
      bestSellingProducts: [],
      seasonalTrends: [],
      goalProgress: {
        target: 5000000, // 5M COP target
        achieved: totalRevenue,
        percentage: (totalRevenue / 5000000) * 100
      }
    };
  }, [orders]);

  const contextValue = useMemo(() => ({
    // State
    orders,
    employees,
    currentUser,
    isLoading,
    notificationSettings,
    
    // Actions
    updateOrderStatus,
    addNewOrder,
    assignOrder,
    login,
    logout,
    
    // Analytics
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    
    // Computed values
    newOrders: orders.filter(order => order.status === 'new'),
    activeOrders: orders.filter(order => ['accepted', 'preparing', 'ready'].includes(order.status)),
    completedOrders: orders.filter(order => order.status === 'delivered'),
    
    // Permission helpers
    hasPermission: (permission: keyof NonNullable<Employee['permissions']>) => {
      return currentUser?.permissions?.[permission] || false;
    },
    isManager: currentUser?.role === 'manager',
    isEmployee: currentUser?.role === 'kitchen' || currentUser?.role === 'delivery',
    
    // Settings
    setNotificationSettings
  }), [
    orders,
    employees,
    currentUser,
    isLoading,
    notificationSettings,
    updateOrderStatus,
    addNewOrder,
    assignOrder,
    login,
    logout,
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    setNotificationSettings
  ]);

  return contextValue;
});