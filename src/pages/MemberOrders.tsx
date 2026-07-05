import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { getUserOrders, reportRemittance, Order } from '../services/orderService';
import { getThumbnailUrl } from '../services/productService';
import { formatDate } from '../utils/dateUtils';
import { MainLayout } from '../layouts/MainLayout';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, Calendar, DollarSign, Hash, CreditCard, ExternalLink, ArrowLeft, MapPin, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  '新單': { label: '待付款', color: 'text-orange-500 bg-orange-50', icon: Clock },
  '已回報匯款': { label: '已回報匯款', color: 'text-blue-500 bg-blue-50', icon: AlertCircle },
  '處理中': { label: '處理中', color: 'text-zen-green bg-zen-green/10', icon: Package },
  '已收款': { label: '已付款', color: 'text-green-500 bg-green-50', icon: CheckCircle },
  '已出貨': { label: '已出貨', color: 'text-purple-500 bg-purple-50', icon: Package },
  '已取消': { label: '已取消', color: 'text-stone-400 bg-stone-50', icon: XCircle },
};

export const MemberOrders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportingOrder, setReportingOrder] = useState<Order | null>(null);
  const [lastFive, setLastFive] = useState('');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      if (!user) return;
      const data = await getUserOrders(user.id, user.email);
      setOrders(data);
    } catch (err: any) {
      toast.error('無法載入訂單：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingOrder) return;

    try {
      await reportRemittance(reportingOrder.id, lastFive);
      toast.success('匯款資訊已回報，我們將儘速為您對帳！');
      setReportingOrder(null);
      setLastFive('');
      fetchOrders();
    } catch (err: any) {
      toast.error('回報失敗：' + err.message);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-zen-cream">
          <div className="w-12 h-12 border-4 border-zen-green border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto py-20 px-6">
        <div className="flex items-center justify-between mb-12">
          <div>
            <button 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-400 hover:text-zen-green transition-colors mb-4"
            >
              <ArrowLeft size={14} /> 返回個人資料
            </button>
            <h1 className="text-4xl font-serif italic text-zen-wood">我的訂單</h1>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-stone-100 shadow-xl shadow-stone-200/20">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 mx-auto mb-6">
              <ShoppingBag size={40} />
            </div>
            <p className="text-stone-400 mb-8">您目前還沒有任何訂單喔！</p>
            <button 
              onClick={() => navigate('/products')}
              className="px-12 py-4 bg-zen-wood text-zen-cream rounded-2xl font-medium uppercase tracking-widest text-sm hover:bg-zen-green transition-all"
            >
              前往購物
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig['新單'];
              const StatusIcon = status.icon;
              const canReport = order.payment_method.includes('先匯款') && order.status === '新單';

              return (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/20 overflow-hidden"
                >
                  <div className="p-8 border-b border-stone-50 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400">
                        <Hash size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">訂單編號</p>
                        <p className="text-lg font-bold text-zen-wood">{order.order_number || order.id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${status.color}`}>
                        <StatusIcon size={16} />
                        <span className="text-sm font-bold">{status.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">訂購日期</p>
                        <p className="text-sm font-medium text-stone-600">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="space-y-6 mb-8">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => {
                          const optLabel = typeof item?.selected_option === 'object' ? item?.selected_option?.label : item?.selected_option;
                          const imageUrl = item?.image_url || '';
                          
                          return (
                            <div key={item?.id || Math.random()} className="flex items-center gap-4">
                              <div className="w-16 h-16 flex-shrink-0 bg-stone-50 rounded-xl overflow-hidden border border-stone-100 flex items-center justify-center">
                                <img 
                                  src={getThumbnailUrl(imageUrl, 100, 100)} 
                                  alt={item?.name || item?.product_name || '商品'} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = '/placeholder-tea.jpg';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-zen-wood truncate">{item?.name || item?.product_name || '未知商品'}</p>
                                {optLabel && !item?.name?.includes(`(${optLabel})`) && !item?.product_name?.includes(`(${optLabel})`) && (
                                  <p className="text-[10px] text-[#707040] font-medium bg-[#707040]/5 px-2 py-0.5 rounded inline-block mt-1">
                                    規格: {optLabel}
                                  </p>
                                )}
                                <p className="text-xs text-stone-400 mt-1">NT$ {(item?.price || 0).toLocaleString()} x {item?.quantity || 0}</p>
                              </div>
                              <p className="text-sm font-bold text-zen-wood whitespace-nowrap">NT$ {((item?.price || 0) * (item?.quantity || 0)).toLocaleString()}</p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-4 text-center text-stone-400 text-sm italic">
                          暫無商品清單或正在載入...
                        </div>
                      )}
                    </div>

                    {(() => {
                      const calculatedSubtotal = (order.items || []).reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
                      // Fallback to rules if database values are missing
                      const shipping = order.shipping_fee ?? order.shipping_price ?? (order.total_amount >= 1000 ? 0 : 100);
                      const displayItemsSubtotal = order.total_amount - shipping;

                      return (
                        <div className="space-y-3 pt-6 border-t border-stone-50 mb-8">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-stone-400">商品小計</span>
                            <span className="text-stone-600 font-medium">NT$ {displayItemsSubtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-stone-400">運費</span>
                            <span className="text-stone-600 font-medium">
                              {shipping > 0 ? `NT$ ${shipping.toLocaleString()}` : '免運費'}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex flex-wrap items-end justify-between gap-6 pt-8 border-t border-stone-50">
                      <div className="space-y-2">
                        <p className="text-xs text-stone-400 flex items-center gap-2">
                          <CreditCard size={14} /> 付款方式：{order.payment_method}
                        </p>
                        <p className="text-xs text-stone-400 flex items-center gap-2">
                          <Package size={14} /> 配送方式：{order.shipping_method}
                        </p>
                        {order.shipping_method.includes('超商') ? (
                          <p className="text-xs text-stone-400 flex items-center gap-2">
                            <MapPin size={14} /> 門市：{order.store_name} ({order.store_address})
                          </p>
                        ) : (
                          <p className="text-xs text-stone-400 flex items-center gap-2">
                            <MapPin size={14} /> 配送地址：{order.shipping_address}
                          </p>
                        )}
                        {order.bank_last_five && (
                          <p className="text-xs text-zen-green font-bold flex items-center gap-2">
                            <CheckCircle size={14} /> 已回報末五碼：{order.bank_last_five}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">總金額</p>
                          <p className="text-2xl font-serif italic text-zen-wood">NT$ {order.total_amount.toLocaleString()}</p>
                        </div>
                        {canReport && (
                          <button 
                            onClick={() => {
                              setReportingOrder(order);
                              setLastFive('');
                            }}
                            className="px-8 py-4 bg-zen-wood text-zen-cream rounded-2xl font-medium uppercase tracking-widest text-xs hover:bg-zen-green transition-all shadow-lg shadow-zen-wood/10"
                          >
                            回報匯款
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );

            })}
          </div>
        )}

        {/* Report Modal */}
        <AnimatePresence>
          {reportingOrder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setReportingOrder(null)}
                className="absolute inset-0 bg-zen-wood/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-12 overflow-hidden"
              >
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-zen-green/5 rounded-full blur-3xl" />
                
                <h2 className="text-3xl font-serif italic text-zen-wood mb-2">回報匯款資訊</h2>
                <p className="text-stone-400 text-sm mb-8">訂單編號：{reportingOrder.id}</p>

                <form onSubmit={handleReportSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">
                      <Hash size={14} className="text-zen-green" /> 帳號末五碼
                    </label>
                    <input 
                      type="text" 
                      required
                      maxLength={5}
                      placeholder="請輸入 5 位數字"
                      value={lastFive}
                      onChange={(e) => setLastFive(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-zen-wood placeholder:text-stone-300"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setReportingOrder(null)}
                      className="flex-1 py-5 bg-stone-100 text-stone-500 rounded-2xl font-medium uppercase tracking-widest text-xs hover:bg-stone-200 transition-all"
                    >
                      取消
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-5 bg-zen-wood text-zen-cream rounded-2xl font-medium uppercase tracking-widest text-xs hover:bg-zen-green transition-all shadow-xl shadow-zen-wood/10"
                    >
                      確認回報
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
};
