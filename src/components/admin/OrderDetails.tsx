import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Truck, MapPin, Phone, Mail, User, Clock, CreditCard, Package, ChevronLeft, ChevronDown, MessageSquare, Loader2, ShoppingBag } from 'lucide-react';
import { Order } from '../../services/orderService';
import { getAvatarUrl, getImageUrl } from '../../services/productService';
import { formatDate } from '../../utils/dateUtils';

interface OrderDetailsProps {
  order: Order | null;
  onClose: () => void;
  onStatusChange?: (id: string, status: Order['status']) => Promise<void>;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  '新單': { label: '新單', color: 'bg-orange-50 text-orange-600' },
  '已回報匯款': { label: '已回報匯款', color: 'bg-blue-50 text-blue-600' },
  '處理中': { label: '處理中', color: 'bg-indigo-50 text-indigo-600' },
  '已收款': { label: '已收款', color: 'bg-emerald-50 text-emerald-600' },
  '已出貨': { label: '已出貨', color: 'bg-purple-50 text-purple-600' },
  '已取消': { label: '已取消', color: 'bg-stone-100 text-stone-500' },
};

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onClose, onStatusChange }) => {
  const [localStatus, setLocalStatus] = useState<Order['status'] | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (order) {
      setLocalStatus(order.status);
    }
  }, [order]);

  if (!order) return null;

  const handleConfirmStatus = async () => {
    if (onStatusChange && localStatus && localStatus !== order.status) {
      setIsUpdating(true);
      try {
        await onStatusChange(order.id, localStatus);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-full"
        >
          {/* Header */}
          <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center gap-6">
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-stone-100 text-stone-400 hover:text-stone-800 transition-all shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-serif italic text-stone-800">{String(order.order_number || order.id)}</h2>
                  {order.passport_status && (
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                      order.user_id ? 'bg-[#1a2d42] text-white shadow-sm' : 'bg-stone-100 text-stone-400 italic'
                    }`}>
                      {order.user_id && <ShoppingBag size={10} />}
                      {order.passport_status}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select
                        value={localStatus || order.status}
                        onChange={(e) => setLocalStatus(e.target.value as Order['status'])}
                        className={`appearance-none inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border-none focus:ring-2 focus:ring-stone-200 cursor-pointer transition-all ${statusConfig[(localStatus || order.status) as keyof typeof statusConfig]?.color || 'bg-stone-100 text-stone-500'}`}
                      >
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <option key={key} value={key} className="bg-white text-stone-800">
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {localStatus && localStatus !== order.status && (
                      <button
                        onClick={handleConfirmStatus}
                        disabled={isUpdating}
                        className="px-4 py-1.5 bg-zen-wood text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-zen-green transition-all shadow-sm flex items-center gap-1"
                      >
                        {isUpdating ? <Loader2 size={10} className="animate-spin" /> : '確認修改'}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-stone-400 flex items-center gap-2">
                  <Clock size={12} /> 下單日期：{formatDate(order.created_at)}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 bg-white border border-stone-100 text-stone-600 px-6 py-3 rounded-2xl text-xs font-bold tracking-widest hover:bg-stone-50 transition-all shadow-sm">
                <Printer size={16} /> 列印訂單
              </button>
              <button className="flex items-center gap-2 bg-stone-800 text-white px-6 py-3 rounded-2xl text-xs font-bold tracking-widest hover:bg-[#707040] transition-all shadow-lg shadow-stone-800/10">
                <Truck size={16} /> 更新物流
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12">
            {/* Gift Order Warning Banner */}
            {order.is_gift && (
              <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex items-start gap-4 text-rose-800 animate-pulse">
                <span className="text-2xl mt-0.5">🎁</span>
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2">送禮祝福訂單高亮標籤</h4>
                  <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                    本筆訂單為送禮委託！出貨包裝小組請注意：<b>請置入精美贈品/祝福卡片，且絕對不要將含有金額/價格之實體發票或出貨明細單裝入包裹中。</b>
                  </p>
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Box 1: 訂購人資訊 */}
              <div className="p-8 bg-stone-50 rounded-[2rem] border border-stone-100 space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                  <User size={14} /> 訂購人資訊
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center text-stone-400 shadow-sm border border-stone-100">
                      {order.avatar_url ? (
                        <img 
                          src={getAvatarUrl(order.avatar_url) || ''} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">{String(order.customer_name)}</p>
                      <p className="text-xs text-stone-400">訂購人姓名</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-stone-400 shadow-sm">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">{String(order.customer_phone)}</p>
                      <p className="text-xs text-stone-400">訂購人聯絡電話</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-stone-400 shadow-sm">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">{String(order.email)}</p>
                      <p className="text-xs text-stone-400">訂購人電子信箱</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: 收件人與配送資訊 */}
              <div className="p-8 bg-stone-50 rounded-[2rem] border border-stone-100 space-y-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                    <Truck size={14} /> 收件人與配送資訊
                  </h3>
                  {order.is_gift && (
                    <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider border border-rose-100">
                      🎁 送禮訂單
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  {/* Recipient Name */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-stone-400 shadow-sm">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">{String(order.recipient_name || order.customer_name)}</p>
                      <p className="text-xs text-stone-400">收件人姓名</p>
                    </div>
                  </div>

                  {/* Recipient Phone */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-stone-400 shadow-sm">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">{String(order.recipient_phone || order.customer_phone)}</p>
                      <p className="text-xs text-stone-400">收件人電話</p>
                    </div>
                  </div>

                  {/* Shipping Address (House / Store) */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-stone-400 shadow-sm">
                      <MapPin size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {order.shipping_method === '超商取貨 (7-11)' ? (
                        <>
                          <p className="text-sm font-bold text-stone-800 leading-relaxed truncate">{String(order.store_name)}</p>
                          <p className="text-xs text-stone-600 leading-relaxed">{String(order.store_address)}</p>
                          <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">7-11 門市資訊</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-stone-800 leading-relaxed">{String(order.recipient_address || order.shipping_address || '')}</p>
                          <p className="text-xs text-stone-400">收件人詳細地址</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Payment Way */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-stone-400 shadow-sm">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">
                        {order.payment_method === '銀行匯款' 
                          ? (order.bank_last_five ? `銀行匯款 (末五碼: ${order.bank_last_five})` : '銀行匯款 (尚未回報)')
                          : order.payment_method === 'LINE PAY'
                          ? 'LINE PAY 已支付'
                          : order.payment_method}
                      </p>
                      <p className="text-xs text-stone-400">付款方式</p>
                    </div>
                  </div>

                  {/* Shipping Method */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-stone-400 shadow-sm">
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">{String(order.shipping_method)}</p>
                      <p className="text-xs text-stone-400">運送物流</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Note Section */}
            {order.bank_last_five && (
              <div className="p-8 bg-blue-50/30 rounded-[2rem] border border-blue-100 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                  <CreditCard size={14} /> 匯款回報資訊
                </h3>
                <div className="bg-white/50 p-6 rounded-2xl border border-blue-50">
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">帳號末五碼</p>
                  <p className="text-sm font-bold text-blue-600">{order.bank_last_five}</p>
                </div>
              </div>
            )}

            {order.note && (
              <div className="p-8 bg-orange-50/30 rounded-[2rem] border border-orange-100 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400 flex items-center gap-2">
                  <MessageSquare size={14} /> 備註 / 匯款帳號末五碼
                </h3>
                <p className="text-sm text-stone-700 leading-relaxed bg-white/50 p-4 rounded-xl border border-orange-50">
                  {order.note}
                </p>
              </div>
            )}

            {/* Items Table */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2 ml-1">
                <Package size={14} /> 訂單品項
              </h3>
              <div className="bg-white rounded-[2rem] border border-stone-100 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-100">
                      <th className="p-6 text-[10px] uppercase tracking-widest font-bold text-stone-400">商品名稱</th>
                      <th className="p-6 text-[10px] uppercase tracking-widest font-bold text-stone-400 text-center">數量</th>
                      <th className="p-6 text-[10px] uppercase tracking-widest font-bold text-stone-400 text-right">單價</th>
                      <th className="p-6 text-[10px] uppercase tracking-widest font-bold text-stone-400 text-right">小計</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {order.items.map((item) => {
                      const optLabel = typeof item.selected_option === 'object' ? item.selected_option?.label : item.selected_option;
                      
                      return (
                        <tr key={item.id}>
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 border border-stone-100 flex items-center justify-center">
                                <img src={getImageUrl(item.image_url) || ''} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-stone-800">{String(item.name || item.product_name || '未知商品')}</p>
                                {optLabel && !String(item.name || '').includes(`(${optLabel})`) && !String(item.product_name || '').includes(`(${optLabel})`) && (
                                  <p className="text-[10px] text-[#707040] font-medium bg-[#707040]/5 px-2 py-0.5 rounded inline-block mt-1">
                                    選項: {optLabel}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-6 text-center text-sm text-stone-600">x {item.quantity}</td>
                          <td className="p-6 text-right text-sm text-stone-600">NT$ {item.price.toLocaleString()}</td>
                          <td className="p-6 text-right text-sm font-bold text-stone-800">NT$ {(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="p-8 bg-stone-50/50 flex flex-col items-end space-y-3">
                  <div className="flex justify-between w-full max-w-xs text-sm text-stone-500">
                    <span>小計</span>
                    <span>NT$ {(order.total_amount - (order.shipping_price || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-xs text-sm text-stone-500">
                    <span>運費</span>
                    <span>NT$ {(order.shipping_price || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-xs pt-3 border-t border-stone-200">
                    <span className="text-stone-800 font-bold">總計</span>
                    <span className="text-xl font-serif italic text-stone-800">NT$ {order.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
