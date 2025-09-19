import React from 'react';
import { useAdmin } from '@/providers/AdminProvider';
import AdminLoginScreen from './admin-login';
import AdminDashboardScreen from './admin-dashboard';

export default function AdminScreen() {
  const { currentUser, isLoading } = useAdmin();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!currentUser) {
    return <AdminLoginScreen />;
  }

  return <AdminDashboardScreen />;
}