import { Share, Platform } from 'react-native';

interface OrderData {
  id: string;
  customerName: string;
  contact: string;
  address: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  createdAt: any;
  branch?: string;
}

export async function exportDailyReport(orders: OrderData[], branch: string = 'Todas', note: string = '') {
  const today = new Date().toLocaleDateString('es-CO');
  const todayOrders = orders.filter((order) => {
    const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
    return orderDate.toLocaleDateString('es-CO') === today;
  });

  const totalRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const completedOrders = todayOrders.filter((o) => o.status === 'delivered').length;

  const csvHeader = 'ID,Cliente,Teléfono,Dirección,Items,Total,Método Pago,Estado,Sucursal,Fecha\n';
  const csvRows = todayOrders
    .map((order) => {
      const items = order.items.map((i) => `${i.name} x${i.quantity}`).join('; ');
      const date = order.createdAt?.toDate
        ? order.createdAt.toDate().toLocaleString('es-CO')
        : new Date(order.createdAt).toLocaleString('es-CO');
      return `${order.id},${order.customerName},${order.contact},"${order.address}","${items}",${order.totalAmount},${order.paymentMethod},${order.status},${order.branch || 'N/A'},${date}`;
    })
    .join('\n');

  const csvContent = csvHeader + csvRows;

  const summary = `
📊 INFORME DIARIO - DELI EMPANADA
📅 Fecha: ${today}
🏪 Sucursal: ${branch}
${note ? `📝 Nota: ${note}` : ''}

💰 Ingresos Totales: ${totalRevenue.toLocaleString('es-CO')} COP
✅ Pedidos Completados: ${completedOrders}
📦 Total Pedidos: ${todayOrders.length}

---
DETALLE DE PEDIDOS (CSV):

${csvContent}
  `.trim();

  try {
    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `informe_diario_${today.replace(/\//g, '-')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } else {
      const result = await Share.share({
        message: summary,
        title: `Informe Diario - ${today}`,
      });
      return { success: result.action === Share.sharedAction };
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    return { success: false, error };
  }
}

export function formatCurrency(amount: number, currency: string = 'COP'): string {
  return `$${amount.toLocaleString('es-CO')} ${currency}`;
}

export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
