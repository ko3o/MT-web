import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Users, TrendingUp, Package, Loader2 } from 'lucide-react';
import { useOrders, useProducts } from '../../hooks/useAdminData';
import { getImageUrl } from '../../services/productService';
import { formatDate } from '../../utils/dateUtils';

export const Dashboard: React.FC = () => {
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: products = [], isLoading: productsLoading } = useProducts();

  const loading = ordersLoading || productsLoading;

  const totalSales = orders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => ['新單', '已回報匯款', '處理中'].includes(o.status)).length;

  const stats = [
    { label: '總銷售額', value: `NT$ ${totalSales.toLocaleString()}`, icon: <TrendingUp size={24} />, color: 'bg-emerald-50 text-emerald-600' },
    { label: '總訂單數', value: orders.length.toString(), icon: <ShoppingCart size={24} />, color: 'bg-blue-50 text-blue-600' },
    { label: '商品總數', value: products.length.toString(), icon: <Package size={24} />, color: 'bg-purple-50 text-purple-600' },
    { label: '待處理訂單', value: pendingOrders.toString(), icon: <Clock size={24} />, color: 'bg-orange-50 text-orange-600' },
  ];

  const recentOrders = orders.slice(0, 5);
  const topProducts = [...products].sort((a, b) => (b.stock || 0) - (a.stock || 0)).slice(0, 5);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-stone-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-bold tracking-widest uppercase">數據載入中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-3xl font-serif italic text-stone-800 mb-2">首頁概覽</h1>
        <p className="text-stone-400 text-sm">歡迎回來，這是目前的營運數據摘要。</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
              {stat.icon}
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 mb-2">{stat.label}</p>
            <p className="text-2xl font-serif text-stone-800">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-sm">
          <h3 className="text-lg font-bold text-stone-800 mb-8">近期訂單</h3>
          <div className="space-y-6">
            {recentOrders.length === 0 ? (
              <p className="text-center py-10 text-stone-300 italic">尚無訂單</p>
            ) : (
              recentOrders.map((order, i) => (
                <div key={order.id} className="flex items-center justify-between py-4 border-b border-stone-50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 font-bold text-[10px]">
                      #{order.order_number?.slice(-4) || order.id.slice(-4)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">{String(order.customer_name)}</p>
                      <p className="text-[10px] text-stone-400">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-stone-800">NT$ {(order.total_amount || 0).toLocaleString()}</p>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest ${
                      order.status === '已出貨' ? 'bg-emerald-50 text-emerald-600' : 
                      order.status === '已回報匯款' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-sm">
          <h3 className="text-lg font-bold text-stone-800 mb-8">庫存狀況</h3>
          <div className="space-y-6">
            {topProducts.length === 0 ? (
              <p className="text-center py-10 text-stone-300 italic">尚無商品</p>
            ) : (
              topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center justify-between py-4 border-b border-stone-50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-50">
                      <img src={getImageUrl(product.image_url)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <p className="text-sm font-bold text-stone-800">{product.name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${product.stock < 10 ? 'text-red-500' : 'text-stone-800'}`}>
                      {product.stock} 份
                    </p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest">{product.category}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Clock = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
