import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CheckCircle, Home, ShoppingBag, Copy, Check, Package, MapPin, CreditCard } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import toast from 'react-hot-toast';
import { getOrderById, Order } from '../services/orderService';
import { getThumbnailUrl } from '../services/productService';

export const OrderComplete: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const isBankTransfer = location.state?.paymentMethod?.includes('先匯款') || order?.payment_method.includes('先匯款');

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          const data = await getOrderById(orderId);
          setOrder(data);
        } catch (err) {
          console.error('Failed to fetch order details:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [orderId]);

  const copyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      setCopied(true);
      toast.success('訂單編號已複製');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-[80vh] bg-zen-cream py-20 px-6 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl w-full bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 text-center border border-stone-100"
      >
          <div className="w-20 h-20 bg-zen-green/10 rounded-full flex items-center justify-center text-zen-green mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-serif italic text-zen-wood mb-4">感謝您的訂購！</h1>
          <p className="text-stone-500 mb-8 text-base">
            我們已收到您的訂單，正在為您準備精心挑選的茶品。
          </p>

          <div className="bg-stone-50 rounded-3xl p-6 md:p-8 mb-10 space-y-8">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">訂單編號</span>
              <div className="flex items-center gap-3">
                <code className="text-lg font-bold text-zen-wood bg-white px-4 py-2 rounded-xl border border-stone-100 shadow-sm">
                  {order?.order_number || orderId}
                </code>
                <button 
                  onClick={copyOrderId}
                  className="p-2 text-stone-400 hover:text-zen-green transition-colors"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {order && (
              <div className="pt-8 border-t border-stone-200 text-left">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6 px-1">訂單摘要</p>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {(order?.items || []).map((item) => {
                    const optLabel = typeof item?.selected_option === 'object' ? item.selected_option?.label : item?.selected_option;
                    const imageUrl = item?.image_url || '';

                    return (
                      <div key={item?.id || Math.random()} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-stone-100 shadow-sm">
                        <div className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0 bg-stone-50 rounded-xl overflow-hidden flex items-center justify-center">
                          <img 
                            src={getThumbnailUrl(imageUrl, 100, 100)} 
                            alt={item?.name || '商品'} 
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
                            <p className="text-[10px] text-stone-400 italic">規格: {optLabel}</p>
                          )}
                          <p className="text-xs text-stone-400">NT$ {(item?.price || 0).toLocaleString()} x {item?.quantity || 0}</p>
                        </div>
                        <p className="text-sm font-bold text-zen-wood whitespace-nowrap">NT$ {((item?.price || 0) * (item?.quantity || 0)).toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 pt-6 border-t border-stone-100 flex justify-between items-end">
                   <div className="space-y-1">
                      <p className="text-[10px] text-stone-400 flex items-center gap-2"><CreditCard size={12} /> {order.payment_method}</p>
                      <p className="text-[10px] text-stone-400 flex items-center gap-2"><Package size={12} /> {order.shipping_method}</p>
                   </div>
                    <div className="text-right space-y-2">
                       <div className="flex justify-end items-center gap-4 text-xs text-stone-400">
                          <span>商品小計</span>
                          <span>NT$ {(order.total_amount - (order.shipping_price || 0)).toLocaleString()}</span>
                       </div>
                       <div className="flex justify-end items-center gap-4 text-xs text-stone-400">
                          <span>運費</span>
                          <span>{order.shipping_price > 0 ? `NT$ ${order.shipping_price.toLocaleString()}` : '免運費'}</span>
                       </div>
                       <div className="pt-2">
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">總計金額</p>
                          <p className="text-2xl font-serif italic text-zen-wood">NT$ {order.total_amount.toLocaleString()}</p>
                       </div>
                    </div>
                </div>
              </div>
            )}

            {isBankTransfer && (
              <div className="pt-8 border-t border-stone-200 text-left">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 px-1">匯款資訊</p>
                <div className="bg-white p-6 rounded-2xl border border-stone-100 space-y-2 shadow-sm">
                  <p className="text-sm text-zen-wood flex justify-between"><span>銀行代碼：</span><span className="font-bold">000</span></p>
                  <p className="text-sm text-zen-wood flex justify-between"><span>匯款帳號：</span><span className="font-bold">1234-567-890123</span></p>
                  <p className="text-sm text-zen-wood flex justify-between"><span>戶名：</span><span className="font-bold">覓野茶室</span></p>
                  <p className="text-xs text-orange-600 mt-4 font-medium italic">
                    * 請於 3 日內完成匯款，並於匯款後至會員中心回報末五碼。
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/products')}
              className="flex items-center justify-center gap-3 bg-stone-100 text-stone-600 py-4 md:py-5 rounded-2xl font-medium uppercase tracking-widest text-xs hover:bg-stone-200 transition-all"
            >
              <ShoppingBag size={18} />
              繼續購物
            </button>
            <button 
              onClick={() => navigate('/orders')}
              className="flex items-center justify-center gap-3 bg-zen-wood text-zen-cream py-4 md:py-5 rounded-2xl font-medium uppercase tracking-widest text-xs hover:bg-zen-green transition-all shadow-xl shadow-zen-wood/10"
            >
              <Package size={18} />
              查看訂單
            </button>
          </div>
        </motion.div>
      </div>
    );
  };
