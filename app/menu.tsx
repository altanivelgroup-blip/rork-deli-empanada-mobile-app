import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ShoppingCart, Plus, Minus } from 'lucide-react-native';
import { useCart } from '@/providers/CartProvider';
import { useAdmin } from '@/providers/AdminProvider';
import { MenuItem } from '@/types/menu';
import { menuData } from '@/data/menu';

const { width } = Dimensions.get('window');

interface MenuItemComponentProps {
  item: MenuItem;
  quantity: number;
  onAdd: (item: MenuItem) => void;
  onRemove: (itemId: string) => void;
}

function MenuItemComponent({ item, quantity, onAdd, onRemove }: MenuItemComponentProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.menuItem,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemIcon}>
          <Text style={styles.itemEmoji}>{item.emoji}</Text>
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
          <Text style={styles.itemPrice}>
            ${item.price.toLocaleString('es-CO')} COP
          </Text>
        </View>
      </View>
      
      <View style={styles.quantityContainer}>
        {quantity > 0 ? (
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                animatePress();
                onRemove(item.id);
              }}
            >
              <Minus size={16} color="#CC0000" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                animatePress();
                onAdd(item);
              }}
            >
              <Plus size={16} color="#CC0000" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              animatePress();
              onAdd(item);
            }}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

export default function MenuScreen() {
  const { cart, addToCart, removeFromCart, getTotalItems, getTotalPrice } = useCart();
  const { currentUser } = useAdmin();
  const [selectedCategory, setSelectedCategory] = useState<'empanadas' | 'bebidas'>('empanadas');
  const scrollViewRef = useRef<ScrollView>(null);

  const getItemQuantity = (itemId: string) => {
    const item = cart.find(i => i.id === itemId);
    return item?.quantity || 0;
  };

  const handleAddItem = (item: MenuItem) => {
    addToCart(item);
    if (Platform.OS !== 'web') {
      // Add haptic feedback on mobile
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.categoryTabs}>
        <TouchableOpacity
          style={[
            styles.categoryTab,
            selectedCategory === 'empanadas' && styles.categoryTabActive
          ]}
          onPress={() => setSelectedCategory('empanadas')}
        >
          <Text style={[
            styles.categoryTabText,
            selectedCategory === 'empanadas' && styles.categoryTabTextActive
          ]}>
            EMPANADAS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.categoryTab,
            selectedCategory === 'bebidas' && styles.categoryTabActive
          ]}
          onPress={() => setSelectedCategory('bebidas')}
        >
          <Text style={[
            styles.categoryTabText,
            selectedCategory === 'bebidas' && styles.categoryTabTextActive
          ]}>
            BEBIDAS
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {menuData[selectedCategory].map((item) => (
          <MenuItemComponent
            key={item.id}
            item={item}
            quantity={getItemQuantity(item.id)}
            onAdd={handleAddItem}
            onRemove={removeFromCart}
          />
        ))}
      </ScrollView>

      {getTotalItems() > 0 && (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.cartButtonContent}>
            <View style={styles.cartButtonLeft}>
              <ShoppingCart size={24} color="#FFFFFF" />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
              </View>
            </View>
            <Text style={styles.cartButtonText}>Ver Carrito</Text>
            <Text style={styles.cartButtonPrice}>
              ${getTotalPrice().toLocaleString('es-CO')}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4B5',
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 25,
    marginHorizontal: 5,
  },
  categoryTabActive: {
    backgroundColor: '#CC0000',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemContent: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  itemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE4B5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  itemEmoji: {
    fontSize: 24,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
    lineHeight: 16,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CC0000',
  },
  quantityContainer: {
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    borderRadius: 20,
    paddingHorizontal: 5,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginHorizontal: 15,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#CC0000',
    borderRadius: 25,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cartButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  cartButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#CC0000',
  },
  cartButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  cartButtonPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
});