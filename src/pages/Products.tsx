import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProducts, getImageUrl, getThumbnailUrl } from '../services/productService';
import { useQuery } from '@tanstack/react-query';

import { useCart } from '../CartContext';
import toast from 'react-hot-toast';

export const Products: React.FC = () => {
  const { addToCart } = useCart();
  const { data: products = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    retry: 0, // getProducts already has internal retries
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F4]">
        <div className="text-stone-400 font-serif italic animate-pulse">茶品清單載入中...</div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F8F4] px-6 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-xl border border-stone-100 max-w-md w-full">
          <h2 className="text-2xl font-serif italic text-stone-800 mb-4">系統連線異常</h2>
          <p className="text-stone-500 mb-8 leading-relaxed">無法取得茶品清單，請檢查網路連線或稍後再試。</p>
          <button 
            onClick={() => refetch()}
            className="bg-zen-wood text-white px-8 py-3 rounded-xl font-bold hover:bg-zen-green transition-all"
          >
            重新整理
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F4] py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif italic text-zen-wood mb-6"
          >
            精選茶品
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-stone-500 max-w-2xl mx-auto leading-relaxed"
          >
            嚴選台灣高山茶葉，從採摘到烘焙，每一道工序都承載著匠人的心意。
            在這裡，您可以找到最純粹的自然滋味。
          </motion.p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Link to={`/product/${product.slug}`} className="block h-full">
                  <img 
                    src={getThumbnailUrl(product.image_url, 400, 500)} 
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/placeholder-tea.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-colors duration-500"></div>
                  {product.original_price && product.original_price > product.price && (
                    <div className="absolute top-4 left-4 bg-[#707040] text-white px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg z-10">
                      特價
                    </div>
                  )}
                </Link>
                
                {/* Overlay Actions */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <button 
                    onClick={() => {
                      addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image_url: product.image_url,
                        quantity: 1
                      });
                    }}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-zen-wood hover:bg-zen-green hover:text-white transition-colors shadow-lg"
                  >
                    <ShoppingCart size={20} />
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); /* Add to heart logic */ }}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-zen-wood hover:bg-red-500 hover:text-white transition-colors shadow-lg"
                  >
                    <Heart size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 text-center">
                <Link to={`/product/${product.slug}`} className="block">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zen-green mb-1 block">
                    {product.category || '精選茶品'}
                  </span>
                  <h3 className="text-base font-bold text-zen-wood mb-2 group-hover:text-zen-green transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-stone-400 line-through text-[10px]">NT$ {product.original_price.toLocaleString()}</span>
                    )}
                    <span className="text-zen-wood font-bold text-sm">NT$ {product.price.toLocaleString()}</span>
                  </div>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-stone-500 italic">目前尚無符合條件的商品，敬請期待...</p>
          </div>
        )}
      </div>
    </div>
  );
};
