import { useEffect, useState, useCallback, useMemo } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import createContextHook from '@nkzw/create-context-hook';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  addOrder: (order: any) => Promise<void>;
  orders: any[];
  updateOrder: (orderId: string, updates: any) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
}

export const [FirebaseProvider, useFirebase] = createContextHook<FirebaseContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser && (!authUser.email || authUser.email.trim().length === 0)) {
        console.error('Invalid user data');
        return;
      }
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Listen to orders collection in real-time
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email || !email.trim() || email.length > 100) {
      throw new Error('Invalid email');
    }
    if (!password || !password.trim() || password.length > 100) {
      throw new Error('Invalid password');
    }
    
    const sanitizedEmail = email.trim();
    const sanitizedPassword = password.trim();
    
    try {
      await signInWithEmailAndPassword(auth, sanitizedEmail, sanitizedPassword);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, []);

  const addOrder = useCallback(async (order: any) => {
    if (!order || typeof order !== 'object') {
      throw new Error('Invalid order data');
    }
    
    try {
      const ordersRef = collection(db, 'orders');
      await addDoc(ordersRef, {
        ...order,
        createdAt: new Date(),
        status: 'pending'
      });
    } catch (error) {
      console.error('Add order error:', error);
      throw error;
    }
  }, []);

  const updateOrder = useCallback(async (orderId: string, updates: any) => {
    if (!orderId || !orderId.trim() || orderId.length > 100) {
      throw new Error('Invalid order ID');
    }
    if (!updates || typeof updates !== 'object') {
      throw new Error('Invalid updates data');
    }
    
    const sanitizedOrderId = orderId.trim();
    
    try {
      const orderRef = doc(db, 'orders', sanitizedOrderId);
      await updateDoc(orderRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Update order error:', error);
      throw error;
    }
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    if (!orderId || !orderId.trim() || orderId.length > 100) {
      throw new Error('Invalid order ID');
    }
    
    const sanitizedOrderId = orderId.trim();
    
    try {
      const orderRef = doc(db, 'orders', sanitizedOrderId);
      await deleteDoc(orderRef);
    } catch (error) {
      console.error('Delete order error:', error);
      throw error;
    }
  }, []);

  return useMemo(() => ({
    user,
    loading,
    signIn,
    signOutUser,
    addOrder,
    orders,
    updateOrder,
    deleteOrder
  }), [user, loading, signIn, signOutUser, addOrder, orders, updateOrder, deleteOrder]);
});