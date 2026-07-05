import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ShoppingCart, Share2, ShieldCheck, ChevronRight } from 'lucide-react';
import { getProductBySlug, Product, getImageUrl, ProductOption } from '../services/productService';

import { useCart } from '../CartContext';
import toast from 'react-hot-toast';

export const ProductDetail: React.FC = () => {
  const { addToCart } = useCart();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');

  const currentOptionData = useMemo(() => {
    if (!product || !selectedOption || selectedOption === product.name) return null;
    if (!product.options) return null;
    return (product.options as (string | ProductOption)[]).find(opt => {
      if (typeof opt === 'string') return opt === selectedOption;
      return opt.label === selectedOption;
    });
  }, [product, selectedOption]);

  const displayPrice = useMemo(() => {
    if (!product) return 0;
    
    // 如果選取的是商品原名（基礎價）或是尚未選擇，顯示底價
    if (!selectedOption || selectedOption === product.name) {
      return product.price;
    }
    
    // 如果有選取具體規格，直接使用該規格的價格 (獨立售價)
    if (currentOptionData && typeof currentOptionData === 'object') {
      return (currentOptionData as ProductOption).price;
    }
    
    return product.price;
  }, [product, currentOptionData, selectedOption]);

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.options && product.options.length > 0 && !selectedOption) {
      toast.error('請先選擇一個「規格」');
      return;
    }

    if (product.stock < quantity) {
      toast.error(`抱歉，${product.name} 的庫存不足（現貨剩餘 ${product.stock} 件）。`);
      return;
    }

    // Prepare the final selected option object for the cart
    const finalSelectedOption = currentOptionData || selectedOption;

    addToCart({
      id: product.id,
      name: product.name,
      price: displayPrice, // Use the updated price
      image_url: product.image_url,
      quantity: quantity,
      selectedOption: finalSelectedOption,
      slug: product.slug,
      stock: product.stock
    });
  };

  // 使用 useRef 來追蹤組件是否掛載，防止卸載後更新狀態
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    const scrollToTop = () => {
      if (!isMounted.current) return;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };

    if (!slug) {
      setLoading(false);
      return;
    }

    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      setImageLoaded(false);
      scrollToTop();

      try {
        const data = await getProductBySlug(slug);
        
        if (!isMounted.current) return;

        if (!data) {
          setError('很抱歉，找不到該商品。');
        } else {
          setProduct(data);
          const url = getImageUrl(data.image_url);
          setSelectedImage(url);
          
          // 預載圖片以消除閃爍
          const img = new Image();
          img.src = url;
          img.onload = () => {
            if (isMounted.current) setImageLoaded(true);
          };
          img.onerror = () => {
            if (isMounted.current) setImageLoaded(true);
          };
        }
      } catch (err: any) {
        if (!isMounted.current) return;
        setError('系統連線異常，請稍後再試。');
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setTimeout(scrollToTop, 100);
        }
      }
    };

    loadProduct();

    return () => {
      isMounted.current = false;
    };
  }, [slug]); // 確保依賴項僅包含 slug

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const shareOnLine = () => {
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const shareOnThreads = () => {
    window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(product?.name || '')}%20${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // 骨架屏 (Skeleton Screen)
  const Skeleton = () => (
    <div className="min-h-screen bg-[#F9F8F4] pt-4 pb-12 px-6 animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="h-4 w-48 bg-stone-200 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-square bg-stone-200 rounded-3xl"></div>
          <div className="space-y-6">
            <div className="h-4 w-24 bg-stone-200 rounded"></div>
            <div className="h-10 w-64 bg-stone-200 rounded"></div>
            <div className="h-8 w-32 bg-stone-200 rounded"></div>
            <div className="space-y-4 pt-8">
              <div className="h-12 w-full bg-stone-200 rounded"></div>
              <div className="h-12 w-full bg-stone-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 防錯處理：Loading 狀態
  if (loading || (product && !imageLoaded)) {
    return <Skeleton />;
  }

  // 防錯處理：錯誤或無資料狀態
  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F8F4] px-6 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-xl border border-stone-100 max-w-md w-full">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-serif italic text-stone-800 mb-4">商品載入失敗</h2>
          <p className="text-stone-500 mb-8 leading-relaxed">
            {error || '請檢查您的網路連線或稍後再試。'}
          </p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#707040] text-white py-3 rounded-xl font-bold hover:bg-[#5a5a34] transition-all"
            >
              重新整理
            </button>
            <button 
              onClick={() => navigate('/products')}
              className="text-stone-400 font-bold hover:text-stone-600 transition-colors"
            >
              返回商品列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 生成展示用的縮圖列表
  const galleryImages = product ? [
    getImageUrl(product.image_url),
    `https://picsum.photos/seed/${product.id}-1/800/800`,
    `https://picsum.photos/seed/${product.id}-2/800/800`,
    `https://picsum.photos/seed/${product.id}-3/800/800`,
  ].filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-[#F9F8F4] pt-4 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-stone-400 text-xs mb-6">
          <Link to="/" className="hover:text-[#707040] transition-colors">首頁</Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-[#707040] transition-colors">{product?.category || '精選茶品'}</Link>
          <ChevronRight size={12} />
          <span className="text-stone-800 font-medium truncate">{product?.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Container */}
          <div className="space-y-4 md:max-w-[500px] w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              {/* 鎖定高度與比例，確保縮圖不被擠出 */}
              <div className="aspect-square max-h-[500px] w-full overflow-hidden rounded-3xl bg-white flex items-center justify-center shadow-sm border border-stone-100">
                {selectedImage ? (
                  <img 
                    src={selectedImage} 
                    alt={product?.name} 
                    loading="lazy"
                    className="max-w-full max-h-[500px] object-contain transition-all duration-700"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/placeholder-tea.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300 italic">
                    無商品圖片
                  </div>
                )}
              </div>
              {product?.original_price && product.original_price > product.price && (
                <div className="absolute top-4 left-4 bg-[#707040] text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                  特價
                </div>
              )}
            </motion.div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-3">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    selectedImage === img ? 'border-[#707040] shadow-sm scale-95' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={img} 
                    alt="thumb" 
                    loading="lazy"
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/placeholder-tea.jpg';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col pt-2"
          >
            <div className="mb-6">
              <span className="text-xs font-bold text-[#707040] uppercase tracking-widest mb-2 block">商品介紹</span>
              <h1 className="text-3xl md:text-4xl font-serif italic text-stone-800 mb-2 leading-tight">
                {product?.name}
              </h1>
              <div className="w-10 h-0.5 bg-stone-800 mb-6"></div>
              
              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-2xl font-bold text-stone-800">NT$ {displayPrice.toLocaleString()}</span>
                {product?.original_price && product.original_price > product.price && !selectedOption && (
                  <span className="text-stone-400 line-through text-base">NT$ {product.original_price.toLocaleString()}</span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-6">
                <div className={`w-2 h-2 rounded-full ${product?.stock && product.stock > 0 ? 'bg-zen-green' : 'bg-red-500'}`}></div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                  {product?.stock && product.stock > 0 ? `現貨供應中 (剩餘 ${product.stock} 件)` : '暫時無現貨'}
                </span>
              </div>
            </div>

            {/* Options Section */}
            {product?.options && product.options.length > 0 && (
              <div className="space-y-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="text-xs font-bold text-stone-800 min-w-[80px]">【 規格 】</label>
                  <div className="relative flex-1">
                    <select 
                      value={selectedOption}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2.5 text-stone-600 focus:outline-none focus:ring-2 focus:ring-[#707040]/20 appearance-none cursor-pointer text-xs shadow-sm"
                    >
                      <option value="" disabled>請選取一個規格</option>
                      <option value={product.name}>{product.name}</option>
                      {product.options.map((option, index) => {
                        const label = typeof option === 'string' ? option : option.label;
                        return (
                          <option key={index} value={label}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                      <ArrowLeft size={14} className="-rotate-90" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-6 mb-8">
              <div className="flex flex-row items-center gap-4">
                <div className="flex items-center bg-white rounded-lg border border-stone-200 p-1 shadow-sm">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-800 transition-colors text-lg"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-stone-800 text-sm">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-800 transition-colors text-lg"
                  >
                    +
                  </button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#707040] text-white py-3 rounded-lg font-bold tracking-widest uppercase hover:bg-[#5a5a34] transition-all shadow-md active:scale-95 flex items-center justify-center gap-3 text-sm"
                >
                  <ShoppingCart size={18} />
                  加入購物車
                </button>
              </div>
            </div>

            {/* Meta Info & Share */}
            <div className="pt-6 border-t border-stone-100 space-y-4">
              <div className="text-[10px] text-stone-400">
                <span className="font-bold text-stone-600">分類:</span> {product?.category || '精選茶品'}
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={shareOnFacebook}
                  className="w-8 h-8 rounded-full bg-[#707040] flex items-center justify-center text-white hover:bg-[#5a5a34] transition-all shadow-sm"
                  title="分享到 Facebook"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </button>
                <button 
                  onClick={shareOnLine}
                  className="w-8 h-8 rounded-full bg-[#707040] flex items-center justify-center text-white hover:bg-[#5a5a34] transition-all shadow-sm"
                  title="分享到 LINE"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.304c0-5.231-5.383-9.486-12-9.486s-12 4.255-12 9.486c0 4.69 4.27 8.613 10.046 9.348.392.085.923.258 1.058.592.121.301.079.771.038 1.074l-.164 1.027c-.05.301-.241 1.178 1.039.643 1.281-.535 6.907-4.068 9.42-6.967 1.738-1.908 2.563-3.843 2.563-5.717z"/></svg>
                </button>
                <button 
                  onClick={shareOnThreads}
                  className="w-8 h-8 rounded-full bg-[#707040] flex items-center justify-center text-white hover:bg-[#5a5a34] transition-all shadow-sm"
                  title="分享到 Threads"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 13.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-4.5-6.5c-1.1 0-2 .9-2 2s.9-2 2 2 2-.9 2-2-.9-2-2-2zm0 8.5c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5 4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z"/></svg>
                </button>
                <button 
                  onClick={copyToClipboard}
                  className="w-8 h-8 rounded-full bg-[#707040] flex items-center justify-center text-white hover:bg-[#5a5a34] transition-all shadow-sm relative"
                  title="複製連結"
                >
                  <Share2 size={14} />
                  {copySuccess && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                      已複製連結
                    </div>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Product Description */}
        <div className="mt-12 pt-12 border-t border-stone-100">
          <h3 className="text-lg font-serif italic text-stone-800 mb-6">商品介紹</h3>
          <div 
            className="text-stone-600 leading-relaxed text-sm prose prose-stone max-w-none"
            dangerouslySetInnerHTML={{ __html: product?.description || '' }}
          />
        </div>

        {/* Back Button */}
        <div className="mt-12">
          <button 
            onClick={() => navigate('/products')}
            className="flex items-center gap-3 text-stone-400 hover:text-[#707040] transition-colors font-medium text-sm"
          >
            <ArrowLeft size={18} />
            返回商品列表
          </button>
        </div>
      </div>
    </div>
  );
};
