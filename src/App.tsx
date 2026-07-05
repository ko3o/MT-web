import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Products } from './pages/Products';
import { Faq } from './pages/Faq';
import { News } from './pages/News';
import { NewsDetail } from './pages/NewsDetail';
import { MeetMiye } from './pages/about/MeetMiye';
import { Coexistence } from './pages/about/Coexistence';
import { CatsDaily } from './pages/about/CatsDaily';
import { BeginnerVillage } from './pages/BeginnerVillage';
import { Contact } from './pages/Contact';
import { Shipping } from './pages/Shipping';
import { Refund } from './pages/Refund';
import { Privacy } from './pages/Privacy';
import { ProductDetail } from './pages/ProductDetail';
import { Register } from './Register';
import { Profile } from './Profile';
import { MemberOrders } from './pages/MemberOrders';
import { AdminLayout } from './layouts/AdminLayout';
import { MainLayout } from './layouts/MainLayout';
import { AdminLogin } from './AdminLogin';
import { Dashboard as AdminDashboard } from './pages/admin/Dashboard';
import { AdminProducts } from './pages/admin/Products';
import { AdminMembers } from './pages/admin/Members';
import { AdminOrders } from './pages/admin/Orders';
import { AdminSettings } from './pages/admin/Settings';
import { AdminNews } from './pages/admin/News';
import { AdminFaq } from './pages/admin/Faq';
import { AdminBeginnerVillage } from './pages/admin/BeginnerVillage';
import { motion } from 'motion/react';
import { getProducts, Product } from './services/productService';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

import { ScrollToTop } from './components/ScrollToTop';

const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-zen-cream">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-zen-green border-t-transparent rounded-full"
    />
  </div>
);

// --- Route Guards ---

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/register" state={{ from: location }} replace />;

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAdminAuth = localStorage.getItem('admin_auth') === 'true';

  if (!isAdminAuth) return <Navigate to="/admin/login" state={{ from: location }} replace />;

  return <AdminLayout>{children}</AdminLayout>;
};

// --- Admin Pages ---
// (Moved to separate files in src/pages/admin/)

// --- Placeholder Pages ---
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="py-32 px-6 text-center">
    <h1 className="text-4xl font-serif italic text-zen-wood mb-8">{title}</h1>
    <p className="text-stone-500">此頁面正在建設中，敬請期待...</p>
  </div>
);

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
});

// --- Main App ---

import { CartProvider } from './CartContext';
import { Checkout } from './pages/Checkout';
import { OrderComplete } from './pages/OrderComplete';
import { Toaster } from 'react-hot-toast';

// Forced Refresh: 2026-05-15 01:27 (v2)
console.log('App component rendering - v2 - 2026-05-15 01:27');
console.log('Current URL:', window.location.href);
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Toaster position="top-center" reverseOrder={false} />
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
            <Route path="/register" element={<MainLayout><Register /></MainLayout>} />
            <Route path="/about" element={<Navigate to="/about/meet-miye" replace />} />
            <Route path="/about/meet-miye" element={<MainLayout><MeetMiye /></MainLayout>} />
            <Route path="/about/coexistence" element={<MainLayout><Coexistence /></MainLayout>} />
            <Route path="/about/cats-daily" element={<MainLayout><CatsDaily /></MainLayout>} />
            <Route path="/beginner-village" element={<MainLayout><BeginnerVillage /></MainLayout>} />
            <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
            <Route path="/product/:slug" element={<MainLayout><ProductDetail /></MainLayout>} />
            <Route path="/faq" element={<MainLayout><Faq /></MainLayout>} />
            <Route path="/news" element={<MainLayout><News /></MainLayout>} />
            <Route path="/news/:id" element={<MainLayout><NewsDetail /></MainLayout>} />
            <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
            <Route path="/shipping" element={<MainLayout><Shipping /></MainLayout>} />
            <Route path="/refund" element={<MainLayout><Refund /></MainLayout>} />
            <Route path="/privacy" element={<MainLayout><Privacy /></MainLayout>} />
            
            {/* Protected Member Routes */}
            <Route path="/profile" element={
              <AuthRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </AuthRoute>
            } />
            <Route path="/orders" element={
              <AuthRoute>
                <MemberOrders />
              </AuthRoute>
            } />
            <Route path="/checkout" element={
              <MainLayout>
                <Checkout />
              </MainLayout>
            } />
            <Route path="/order-complete/:orderId" element={
              <MainLayout>
                <OrderComplete />
              </MainLayout>
            } />

            {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/members" element={<AdminRoute><AdminMembers /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="/admin/news" element={<AdminRoute><AdminNews /></AdminRoute>} />
          <Route path="/admin/faq" element={<AdminRoute><AdminFaq /></AdminRoute>} />
          <Route path="/admin/beginner-village" element={<AdminRoute><AdminBeginnerVillage /></AdminRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  </AuthProvider>
</QueryClientProvider>
  );
}
