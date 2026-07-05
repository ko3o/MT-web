import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { supabase } from '../db';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Package, Truck, CreditCard, MapPin, Phone, User, Mail, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { createOrder } from '../services/orderService';
import { getImageUrl } from '../services/productService';

const TAIWAN_REGIONS: Record<string, string[]> = {
  '台北市': ['中正區', '大安區', '信義區', '中山區', '松山區', '萬華區', '文山區', '士林區', '北投區', '內湖區', '南港區', '大同區'],
  '新北市': ['板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區', '汐止區', '瑞芳區', '土城區', '蘆洲區', '五股區', '泰山區', '林口區', '深坑區', '石碇區', '坪林區', '三芝區', '石門區', '八里區', '平溪區', '雙溪區', '貢寮區', '金山區', '萬里區', '烏來區'],
  '台中市': ['西屯區', '北屯區', '南屯區', '西區', '北區', '中區', '東區', '南區', '太平區', '大里區', '霧峰區', '烏日區', '丰原區', '後里區', '石岡區', '東勢區', '和平區', '新社區', '潭子區', '大雅區', '神岡區', '大肚區', '沙鹿區', '龍井區', '梧棲區', '清水區', '大甲區', '外埔區', '大安區'],
  '桃園市': ['桃園區', '中壢區', '平鎮區', '八德區', '楊梅區', '蘆竹區', '大溪區', '龍潭區', '大園區', '龜山區', '觀音區', '新屋區', '復興區'],
  '台南市': ['中西區', '東區', '南區', '北區', '安平區', '安南區', '永康區', '歸仁區', '新化區', '左鎮區', '玉井區', '楠西區', '南化區', '仁德區', '關廟區', '龍崎區', '官田區', '麻豆區', '佳里區', '西港區', '七股區', '將軍區', '學甲區', '北門區', '新營區', '後壁區', '白河區', '東山區', '六甲區', '下營區', '柳營區', '鹽水區', '善化區', '大內區', '山上區', '新市區', '安定區'],
  '高雄市': ['新興區', '前金區', '苓雅區', '鹽埕區', '鼓山區', '旗津區', '前鎮區', '三民區', '楠梓區', '小港區', '左營區', '仁武區', '大社區', '岡山區', '路竹區', '阿蓮區', '田寮區', '燕巢區', '橋頭區', '梓官區', '彌陀區', '永安區', '湖內區', '鳳山區', '大寮區', '林園區', '鳥松區', '大樹區', '旗山區', '美濃區', '六龜區', '內門區', '杉林區', '甲仙區', '桃源區', '那瑪夏區', '茂林區', '茄萣區']
};

export const Checkout: React.FC = () => {
  const { items, subtotal, isFreeShipping, clearCart } = useCart();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    email: '',
    city: '台北市',
    district: '中正區',
    address: '',
    shipping_method: '宅配到府 (便利帶)',
    payment_method: '貨到付款',
    store_name: '',
    store_address: '',
    note: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_city: '台北市',
    recipient_district: '中正區',
    recipient_address: '',
    is_same_as_buyer: false,
  });

  const handleBuyerCityChange = (newCity: string) => {
    const districts = TAIWAN_REGIONS[newCity] || [];
    setFormData(prev => ({
      ...prev,
      city: newCity,
      district: districts[0] || ''
    }));
  };

  const handleRecipientCityChange = (newCity: string) => {
    const districts = TAIWAN_REGIONS[newCity] || [];
    setFormData(prev => ({
      ...prev,
      recipient_city: newCity,
      recipient_district: districts[0] || ''
    }));
  };

  // Sync recipient with buyer when "same as buyer" is selected
  useEffect(() => {
    if (formData.is_same_as_buyer) {
      setFormData(prev => ({
        ...prev,
        recipient_name: prev.customer_name,
        recipient_phone: prev.customer_phone,
        recipient_city: prev.city,
        recipient_district: prev.district,
        recipient_address: prev.address,
      }));
    }
  }, [
    formData.is_same_as_buyer,
    formData.customer_name,
    formData.customer_phone,
    formData.city,
    formData.district,
    formData.address,
  ]);

  const handleSameAsBuyerChange = (checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          is_same_as_buyer: true,
          recipient_name: prev.customer_name,
          recipient_phone: prev.customer_phone,
          recipient_city: prev.city,
          recipient_district: prev.district,
          recipient_address: prev.address,
        };
      } else {
        return {
          ...prev,
          is_same_as_buyer: false,
          recipient_name: '',
          recipient_phone: '',
          recipient_address: '',
        };
      }
    });
  };

  useEffect(() => {
    if (items.length === 0) {
      console.log('Cart is empty, but redirect is disabled for debugging.');
      // navigate('/products');
      return;
    }

    // Auto-fill from profile
    if (user) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setFormData(prev => ({
              ...prev,
              customer_name: data.full_name || prev.customer_name,
              customer_phone: data.customer_phone || data.phone || prev.customer_phone,
              city: data.city || prev.city,
              district: data.district || prev.district,
              address: data.address || prev.address,
            }));
          }
        });
    }
  }, [user, items.length, navigate]);

  // Update payment method when shipping method changes
  useEffect(() => {
    if (formData.shipping_method === '宅配到府 (便利帶)') {
      setFormData(prev => ({ ...prev, payment_method: '貨到付款' }));
    } else {
      setFormData(prev => ({ ...prev, payment_method: '取貨付款' }));
    }
  }, [formData.shipping_method]);

  const shippingPrice = isFreeShipping ? 0 : 100;
  const total = subtotal + shippingPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for Recipient
    if (!formData.is_same_as_buyer) {
      if (!formData.recipient_name.trim()) {
        toast.error('親愛的顧客，請填寫收件人姓名。');
        return;
      }
      if (!formData.recipient_phone.trim()) {
        toast.error('親愛的顧客，請填寫收件人電話。');
        return;
      }
      if (formData.shipping_method.includes('宅配') && !formData.recipient_address.trim()) {
        toast.error('親愛的顧客，請填寫收件人詳細地址。');
        return;
      }
    }

    // Validation for 7-11
    if (formData.shipping_method === '超商取貨 (7-11)') {
      if (!formData.store_name.trim() || !formData.store_address.trim()) {
        toast.error('親愛的顧客，請填寫 7-11 門市名稱與地址，以便我們準確配送。');
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Upsert profile information (Only if user is logged in)
      if (user) {
        try {
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: formData.customer_name,
              customer_phone: formData.customer_phone,
              city: formData.city,
              district: formData.district,
              address: formData.address,
              updated_at: new Date().toISOString()
            });
        } catch (e) {
          console.error('Profile upsert exception:', e);
        }
      }

      // Step 1.2: Bulletproof data preparation
      const finalAddress = formData.shipping_method.includes('宅配') 
        ? `${formData.is_same_as_buyer ? formData.city : formData.recipient_city}${formData.is_same_as_buyer ? formData.district : formData.recipient_district}${formData.is_same_as_buyer ? formData.address : formData.recipient_address}` 
        : null;

      const orderData = {
        user_id: user?.id || null,
        customer_name: String(formData.customer_name),
        customer_phone: String(formData.customer_phone),
        email: String(formData.email),
        shipping_address: finalAddress,
        store_name: formData.shipping_method.includes('超商') ? String(formData.store_name) : null,
        store_address: formData.shipping_method.includes('超商') ? String(formData.store_address) : null,
        shipping_price: Number(shippingPrice),
        total_amount: Number(total),
        payment_method: String(formData.payment_method),
        shipping_method: String(formData.shipping_method),
        bank_last_five: null, 
        note: String(formData.note),
        recipient_name: String(formData.is_same_as_buyer ? formData.customer_name : formData.recipient_name),
        recipient_phone: String(formData.is_same_as_buyer ? formData.customer_phone : formData.recipient_phone),
        recipient_address: finalAddress,
        is_gift: Boolean(!formData.is_same_as_buyer),
        items: items.map(item => {
          if (!item?.id) {
            console.error('Found item without ID in cart during checkout:', item);
          }
          return {
            product_id: String(item.id),
            name: String(item.name || '未知商品'),
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 1),
            selectedOption: item.selectedOption,
            image_url: item.image_url || ''
          };
        })
      };

      // SOP: Call createOrder
      console.log('Final Order Data:', orderData);
      const order = await createOrder(orderData);
      
      toast.success('下單成功！訂單編號：' + order.order_number);
      
      // SOP: Success -> clearCart -> navigate
      clearCart(); 
      navigate(`/order-complete/${order.id}`, { 
        replace: true,
        state: { paymentMethod: orderData.payment_method }
      }); 
      
    } catch (err: any) {
      const errorMsg = err.message || JSON.stringify(err);
      console.error('Checkout handleSubmit Error:', err);
      toast.error('建立訂單失敗：' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zen-cream py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16">
          <h1 className="text-4xl font-serif italic text-zen-wood mb-4">結帳確認</h1>
          <div className="flex items-center gap-2 text-stone-400 text-sm">
            <span>購物車</span>
            <ChevronRight size={14} />
            <span className="text-zen-green font-bold">填寫資料</span>
            <ChevronRight size={14} />
            <span>完成訂購</span>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 space-y-8">
            {/* 訂購人資訊 */}
            <section className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 p-10">
              <h2 className="text-xl font-bold text-zen-wood mb-8 flex items-center gap-3">
                <User className="text-zen-green" size={20} />
                訂購人資訊
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">姓名</label>
                  <input 
                    type="text" 
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-sm text-stone-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">電話</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-sm text-stone-800"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">電子信箱</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-sm text-stone-800"
                  />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">縣市</label>
                    <select
                      value={formData.city}
                      onChange={(e) => handleBuyerCityChange(e.target.value)}
                      className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-sm appearance-none cursor-pointer text-stone-800"
                    >
                      <option value="台北市">台北市</option>
                      <option value="新北市">新北市</option>
                      <option value="台中市">台中市</option>
                      <option value="桃園市">桃園市</option>
                      <option value="台南市">台南市</option>
                      <option value="高雄市">高雄市</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">行政區</label>
                    <select
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-sm appearance-none cursor-pointer text-stone-800"
                    >
                      {(TAIWAN_REGIONS[formData.city] || []).map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">詳細地址</label>
                    <input 
                      type="text" 
                      required={formData.shipping_method.includes('宅配')}
                      placeholder="街道、門牌、樓層"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-sm text-stone-800"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 收件人資訊 */}
            <section className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 p-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-xl font-bold text-zen-wood flex items-center gap-3">
                  <Truck className="text-zen-green" size={20} />
                  收件人資訊
                </h2>
                
                {/* Same as Buyer Checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none bg-stone-50 px-4 py-2.5 rounded-xl hover:bg-stone-100/80 transition-all border border-stone-100">
                  <input 
                    type="checkbox" 
                    checked={formData.is_same_as_buyer}
                    onChange={(e) => handleSameAsBuyerChange(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-zen-green focus:ring-zen-green/30 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-stone-600 tracking-wider">同訂購人資訊</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">姓名</label>
                  <input 
                    type="text" 
                    required
                    disabled={formData.is_same_as_buyer}
                    placeholder="收件人姓名"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    className={`w-full px-6 py-4 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-sm ${formData.is_same_as_buyer ? 'bg-stone-100 text-stone-400 cursor-not-allowed select-none' : 'bg-stone-50 text-stone-800'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">電話</label>
                  <input 
                    type="tel" 
                    required
                    disabled={formData.is_same_as_buyer}
                    placeholder="收件人電話"
                    value={formData.recipient_phone}
                    onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
                    className={`w-full px-6 py-4 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-sm ${formData.is_same_as_buyer ? 'bg-stone-100 text-stone-400 cursor-not-allowed select-none' : 'bg-stone-50 text-stone-800'}`}
                  />
                </div>

                {formData.shipping_method === '宅配到府 (便利帶)' && (
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">縣市</label>
                      <select
                        disabled={formData.is_same_as_buyer}
                        value={formData.recipient_city}
                        onChange={(e) => handleRecipientCityChange(e.target.value)}
                        className={`w-full px-6 py-4 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-sm appearance-none cursor-pointer ${formData.is_same_as_buyer ? 'bg-stone-100 text-stone-400 cursor-not-allowed select-none' : 'bg-stone-50 text-stone-800'}`}
                      >
                        <option value="台北市">台北市</option>
                        <option value="新北市">新北市</option>
                        <option value="台中市">台中市</option>
                        <option value="桃園市">桃園市</option>
                        <option value="台南市">台南市</option>
                        <option value="高雄市">高雄市</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">行政區</label>
                      <select
                        disabled={formData.is_same_as_buyer}
                        value={formData.recipient_district}
                        onChange={(e) => setFormData({ ...formData, recipient_district: e.target.value })}
                        className={`w-full px-6 py-4 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-sm appearance-none cursor-pointer ${formData.is_same_as_buyer ? 'bg-stone-100 text-stone-400 cursor-not-allowed select-none' : 'bg-stone-50 text-stone-800'}`}
                      >
                        {(TAIWAN_REGIONS[formData.recipient_city] || []).map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">詳細地址</label>
                      <input 
                        type="text" 
                        required
                        disabled={formData.is_same_as_buyer}
                        placeholder="街道、門牌、樓層"
                        value={formData.recipient_address}
                        onChange={(e) => setFormData({ ...formData, recipient_address: e.target.value })}
                        className={`w-full px-6 py-4 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-sm ${formData.is_same_as_buyer ? 'bg-stone-100 text-stone-400 cursor-not-allowed select-none' : 'bg-stone-50 text-stone-800'}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 p-10">
              <h2 className="text-xl font-bold text-zen-wood mb-8 flex items-center gap-3">
                <Truck className="text-zen-green" size={20} />
                物流與付款
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">物流方式</label>
                  <div className="space-y-3">
                    {['宅配到府 (便利帶)', '超商取貨 (7-11)'].map(method => (
                      <label key={method} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.shipping_method === method ? 'border-zen-green bg-zen-green/5' : 'border-stone-50 hover:border-stone-100'}`}>
                        <span className="text-sm font-medium text-zen-wood">{method}</span>
                        <input 
                          type="radio" 
                          name="shipping" 
                          className="hidden"
                          checked={formData.shipping_method === method}
                          onChange={() => setFormData({ ...formData, shipping_method: method })}
                        />
                        {formData.shipping_method === method && <CheckCircle size={16} className="text-zen-green" />}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">付款方式</label>
                  <div className="space-y-3">
                    {(formData.shipping_method === '宅配到府 (便利帶)' 
                      ? ['貨到付款', '先匯款，取貨不付款'] 
                      : ['取貨付款', '先匯款，取貨不付款']
                    ).map(method => (
                      <label key={method} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.payment_method === method ? 'border-zen-green bg-zen-green/5' : 'border-stone-50 hover:border-stone-100'}`}>
                        <span className="text-sm font-medium text-zen-wood">{method}</span>
                        <input 
                          type="radio" 
                          name="payment" 
                          className="hidden"
                          checked={formData.payment_method === method}
                          onChange={() => setFormData({ ...formData, payment_method: method })}
                        />
                        {formData.payment_method === method && <CheckCircle size={16} className="text-zen-green" />}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {formData.shipping_method === '超商取貨 (7-11)' && (
                <div className="mt-8 pt-8 border-t border-stone-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zen-wood">7-11 門市資訊</h3>
                    <a 
                      href="https://emap.pcsc.com.tw/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-zen-green font-bold underline flex items-center gap-1"
                    >
                      查詢門市 <ChevronRight size={12} />
                    </a>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">門市名稱</label>
                      <input 
                        type="text" 
                        required
                        placeholder="例如：新竹門市"
                        value={formData.store_name}
                        onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                        className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">門市地址</label>
                      <input 
                        type="text" 
                        required
                        placeholder="請填寫完整門市地址"
                        value={formData.store_address}
                        onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                        className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.payment_method.includes('先匯款') && (
                <div className="mt-8 pt-8 border-t border-stone-100 space-y-6">
                  <div className="bg-stone-50 p-6 rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">匯款資訊</p>
                    <p className="text-sm text-zen-wood">銀行代碼：000</p>
                    <p className="text-sm text-zen-wood">匯款帳號：1234-567-890123</p>
                    <p className="text-sm text-zen-wood">戶名：覓野茶室</p>
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 p-10">
              <h2 className="text-xl font-bold text-zen-wood mb-8 flex items-center gap-3">
                <CreditCard className="text-zen-green" size={20} />
                說明與備註
              </h2>
              <textarea 
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="若有其他說明與備註事項請填寫於此。"
                className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-sm min-h-[120px] resize-none"
              />
            </section>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 space-y-8">
              <section className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 p-10">
                <h2 className="text-xl font-bold text-zen-wood mb-8 flex items-center gap-3">
                  <Package className="text-zen-green" size={20} />
                  訂單摘要
                </h2>
                <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2">
                  {items.map((item, index) => {
                    if (!item) return null;
                    const optLabel = typeof item.selectedOption === 'object' ? item.selectedOption?.label : item.selectedOption;
                    const key = `${item.id || 'err'}-${optLabel || index}`;
                    
                    return (
                      <div key={key} className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 flex items-center justify-center">
                          <img 
                            src={getImageUrl(item?.image_url || '')} 
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
                          <h3 className="text-sm font-bold text-zen-wood truncate">{item.name || '未知商品'}</h3>
                          {optLabel && (
                            <p className="text-[10px] text-stone-400 font-medium italic mt-0.5">
                              規格: {optLabel}
                            </p>
                          )}
                          <p className="text-xs text-stone-400 mt-0.5">x {item.quantity || 0}</p>
                        </div>
                        <p className="text-sm font-bold text-zen-wood whitespace-nowrap">
                          NT$ {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
                
                <div className="space-y-4 pt-8 border-t border-stone-100">
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>商品小計</span>
                    <span>NT$ {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>運費</span>
                    <span>{isFreeShipping ? '免運費' : `NT$ ${shippingPrice}`}</span>
                  </div>
                  {!isFreeShipping && (
                    <div className="bg-orange-50 p-3 rounded-xl flex items-center gap-2 text-orange-600 text-[10px] font-bold uppercase tracking-widest">
                      <AlertCircle size={14} />
                      還差 NT$ {(1000 - subtotal).toLocaleString()} 即可享免運！
                    </div>
                  )}
                  <div className="flex justify-between pt-4 border-t border-stone-100">
                    <span className="text-zen-wood font-bold">總計</span>
                    <span className="text-2xl font-serif italic text-zen-wood">NT$ {total.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-zen-wood text-zen-cream py-5 rounded-2xl font-medium uppercase tracking-widest text-sm hover:bg-zen-green transition-all shadow-xl shadow-zen-wood/10 mt-8 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? '處理中...' : '確認下單'}
                </button>
              </section>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
