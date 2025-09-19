export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'empanadas' | 'bebidas';
  emoji: string;
}