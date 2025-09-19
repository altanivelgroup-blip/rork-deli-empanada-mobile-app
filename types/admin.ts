export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'rejected';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  orderType: 'delivery' | 'pickup';
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  estimatedTime?: number;
  notes?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'kitchen' | 'manager' | 'delivery';
  isActive: boolean;
  permissions?: {
    viewOrders: boolean;
    manageOrders: boolean;
    viewAnalytics: boolean;
    viewRevenue: boolean;
    manageEmployees: boolean;
  };
}

export interface DailyStats {
  date: string;
  revenue: number;
  ordersCompleted: number;
  ordersPending: number;
  topSellingItems: { name: string; quantity: number; revenue: number }[];
  peakHours: { hour: number; orderCount: number }[];
  averageOrderValue: number;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  dailyRevenue: { date: string; revenue: number }[];
  totalRevenue: number;
  bestPerformingDay: string;
  weeklyGrowth: number;
  popularItems: { name: string; quantity: number }[];
}

export interface MonthlyStats {
  month: string;
  year: number;
  totalRevenue: number;
  monthOverMonthGrowth: number;
  bestSellingProducts: { name: string; quantity: number; revenue: number }[];
  seasonalTrends: { week: number; revenue: number }[];
  goalProgress: { target: number; achieved: number; percentage: number };
}

export interface NotificationSettings {
  soundEnabled: boolean;
  newOrderSound: string;
  volume: number;
}

export interface AdminSettings {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: { open: string; close: string }[];
  deliveryRadius: number;
  minimumOrderAmount: number;
  estimatedPrepTime: number;
}