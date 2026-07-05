import React from 'react';
import { motion } from 'motion/react';
import { getProducts, getThumbnailUrl, getAvatarUrl, getStorageUrl } from '../services/productService';
import { ArrowRight, Mountain, Leaf, Heart } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSettings } from '../services/settingsService';

export const Home: React.FC = () => {
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    select: (data) => data.slice(0, 8),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const bannerUrl = settings?.banner_url ? getStorageUrl(settings.banner_url) : null;

  const philosophyIcons = [
    <Mountain className="w-8 h-8 text-[#707040]" />,
    <Leaf className="w-8 h-8 text-[#707040]" />,
    <Heart className="w-8 h-8 text-[#707040]" />,
  ];

  return (
    <div className="bg-[#F9F8F4] min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative py-48 flex flex-col items-center text-center px-6 overflow-hidden min-h-[85vh] justify-center"
      >
        {/* Background Image & Overlay */}
        {bannerUrl ? (
          <div className="absolute inset-0 z-0">
            <img 
              src={bannerUrl} 
              alt="Banner" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-[#F9F8F4]"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-[#F9F8F4] z-0"></div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="max-w-4xl relative z-10"
        >
          <h1 className="text-2xl md:text-4xl font-bold text-black mb-6 tracking-[0.2em] leading-relaxed drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]">
            {settings?.banner_title || '覓野茶'}
          </h1>
          <p className="text-base font-serif italic text-stone-500 mb-16 tracking-wide drop-shadow-[0_1px_5px_rgba(255,255,255,0.5)]">
            {settings?.banner_subtitle || 'Me & Tea'}
          </p>

          <NavLink 
            to="/products"
            className="bg-stone-800 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-stone-700 transition-all shadow-lg flex items-center gap-2 mx-auto group w-fit active:scale-95"
          >
            探索茶品
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </NavLink>
        </motion.div>
      </section>

      {/* 店長貓登場區塊 */}
      <section className="py-24 bg-[#F9F8F4] overflow-hidden border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-6">
          {/* Banner 圖片區 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            className="w-full aspect-[16/9] md:aspect-[21/9] rounded-[2.5rem] overflow-hidden shadow-md border border-stone-100 max-h-[500px]"
          >
            <img 
              src={settings?.cat_banner_url ? getStorageUrl(settings.cat_banner_url) : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1920&q=80'} 
              alt="店長貓的巡邏領地" 
              className="w-full h-full object-cover select-none pointer-events-none"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          {/* 文字與按鈕區 */}
          <div className="mt-12 text-center max-w-3xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="px-4"
            >
              <p className="text-stone-700 font-serif leading-loose tracking-wider whitespace-pre-line text-lg md:text-2xl font-medium">
                {settings?.cat_manager_desc || `喵～歡迎來到我的巡邏領地！\n遠道而來的尋茶人，這裡的茶樹都是聽小鳥唱歌長大的喔。\n今天，妳想試試我最愛的哪一款茶呢？`}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex justify-center"
            >
              <NavLink 
                to={settings?.cat_btn_url || "/about/cats-daily"}
                className="inline-flex items-center gap-2 bg-[#707040] text-white px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide hover:bg-[#5b5b33] active:scale-95 hover:shadow-xl hover:shadow-[#707040]/10 transition-all duration-300"
              >
                {settings?.cat_btn_text || "看看店長的茶園日常 ➔"}
              </NavLink>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Product List Section */}
      <section className="py-24 bg-[#F5F2ED]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="text-left">
              <h2 className="text-3xl font-bold text-stone-800 mb-2">精選茶品</h2>
              <p className="text-stone-500 font-serif italic text-sm">Our Signature Collection</p>
            </div>
            <NavLink to="/products" className="text-[#707040] font-medium flex items-center gap-1 hover:underline">
              查看全部 <ArrowRight size={16} />
            </NavLink>
          </div>
          
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse shadow-sm">
                  <div className="bg-stone-100 aspect-square rounded-xl mb-4"></div>
                  <div className="h-6 bg-stone-100 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-stone-100 rounded w-full mb-4"></div>
                  <div className="h-6 bg-stone-100 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-stone-100 group"
                >
                  <NavLink to={`/product/${product.slug}`} className="block">
                    <div className="aspect-square bg-stone-100 relative overflow-hidden">
                      <img 
                        src={getThumbnailUrl(product.image_url, 400, 400)} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-stone-800 mb-2 group-hover:text-[#707040] transition-colors">{product.name}</h3>
                      <p className="text-stone-400 text-sm mb-6 line-clamp-2 leading-relaxed">
                        {(product.description || "來自台灣中央山脈的頂級烏龍茶，海拔1000公尺以上。").replace(/<[^>]*>/g, '')}
                      </p>
                      <div className="flex justify-between items-end">
                        <span className="text-[#707040] font-bold">NT$ {product.price?.toLocaleString()}</span>
                        <span className="text-stone-300 text-[10px] uppercase tracking-widest font-bold">庫存 {product.stock || 0}</span>
                      </div>
                    </div>
                  </NavLink>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Brand Philosophy Section */}
      <section className="py-32 bg-[#F9F8F4] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#707040]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#707040]/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl font-bold text-stone-800 text-center mb-4">品牌理念</h2>
          <p className="text-center text-stone-400 font-serif italic mb-20">The Essence of Me & Tea</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(settings?.philosophy || []).map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.8 }}
                className="bg-white p-10 rounded-3xl text-center border border-stone-100 shadow-sm hover:shadow-2xl hover:border-stone-200 transition-all duration-500 group"
              >
                <div className="relative w-24 h-24 mx-auto mb-10 overflow-hidden rounded-2xl shadow-inner bg-stone-50">
                  {item.image_url ? (
                    <img 
                      src={getStorageUrl(item.image_url)} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#707040]">
                      {philosophyIcons[i % philosophyIcons.length]}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-4 tracking-tight">{item?.title || '未命名'}</h3>
                <p className="text-stone-500 text-sm leading-relaxed font-light">
                  {item?.desc || ''}
                </p>
              </motion.div>
            ))}
          </div>

          {/* 新增品牌理念引導按鈕 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 flex justify-center"
          >
            <NavLink 
              to={settings?.philosophy_btn_url || "/about/coexistence"}
              className="inline-flex items-center gap-2 border-2 border-[#707040] text-[#707040] hover:bg-[#707040] hover:text-white px-8 py-3.5 rounded-full text-sm font-bold tracking-wide active:scale-95 hover:shadow-xl hover:shadow-stone-200 transition-all duration-300"
            >
              {settings?.philosophy_btn_text || "探索茶草共生的故事 ➔"}
            </NavLink>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
