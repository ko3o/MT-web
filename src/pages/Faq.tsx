import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '../db';
import { FaqItem } from '../services/faqService';
import { getSettings, SiteSettings } from '../services/settingsService';
import { getStorageUrl } from '../services/productService';

const FAQ_CATEGORIES = ['所有問題', '關於覓野：土地與茶', '品茗指南：沖泡百科', '品質承諾：安心守護', '服務指南：購物配送'];

export const Faq: React.FC = () => {
  const [faqItems, setFaqItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('所有問題');

  useEffect(() => {
    let isMounted = true;
    
    // Fetch Settings
    getSettings()
      .then(settingsData => {
        if (isMounted) setSettings(settingsData);
      })
      .catch(err => {
        console.error('getSettings error in component:', err);
      });

    const fetchFAQs = async () => {
      try {
        setLoading(true);
        // 移除所有 .order() 排序，直接 select 所有資料
        const { data, error } = await supabase
          .from('faq_items')
          .select('*');

        if (error) throw error;

        if (isMounted) {
          // 確保型別安全與消毒，並將類別正常化配合過濾器
          const sanitized = (Array.isArray(data) ? data : []).map(faq => {
            if (!faq || typeof faq !== 'object') return null;
            const category = String(faq.category || '');
            const realCategories = FAQ_CATEGORIES.slice(1);
            return {
              ...faq,
              category: realCategories.includes(category) ? category : '服務指南：購物配送',
              question: String(faq.question || ''),
              answer: String(faq.answer || '')
            };
          }).filter(Boolean);

          setFaqItems(sanitized);
        }
      } catch (error) {
        console.error('資料庫讀取失敗:', error);
        if (isMounted) {
          setFaqItems([]); // 發生錯誤時給予空陣列防崩潰
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFAQs();
    return () => { isMounted = false; };
  }, []);

  const filteredFaqs = useMemo(() => {
    if (!Array.isArray(faqItems)) return [];
    return faqItems.filter(faq => 
      faq && (activeCategory === '所有問題' || faq.category === activeCategory)
    );
  }, [faqItems, activeCategory]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F4]">
        <Loader2 className="w-10 h-10 text-[#707040] animate-spin" />
      </div>
    );
  }

  // Use the homepage banner settings for consistency
  const bannerUrl = settings?.sync_news_banner 
    ? getStorageUrl(settings.banner_url)
    : getStorageUrl(settings?.news_image_url || '', 'https://picsum.photos/seed/faq-banner/1920/1080');

  return (
    <div className="min-h-screen bg-[#F9F8F4]">
      {/* Banner Section - Consistent with Home and News */}
      <section className="relative h-[40vh] md:h-[50vh] overflow-hidden flex items-center justify-center">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img 
            src={bannerUrl} 
            alt="FAQ Banner" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Transparent overlay for brightness as requested */}
          <div className="absolute inset-0 bg-stone-900/5 backdrop-blur-[0px]"></div>
        </motion.div>
        
        <div className="relative z-10 text-center px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif italic text-white mb-4 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
          >
            常見問題
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 80 }}
            transition={{ delay: 0.2 }}
            className="h-1 bg-zen-green mx-auto mb-6"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white text-sm tracking-[0.2em] font-medium uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
          >
            Frequently Asked Questions
          </motion.p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto py-24 px-6">
        <header className="text-center mb-16">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-stone-500 max-w-2xl mx-auto leading-relaxed"
          >
            在這裡，我們整理了顧客最常詢問的問題。如果您仍有其他疑問，歡迎隨時與我們的客服團隊聯繫。
          </motion.p>
        </header>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {FAQ_CATEGORIES.map((category, index) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              onClick={() => {
                setActiveCategory(category);
                setActiveIndex(null); // Reset open accordion when changing category
              }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                activeCategory === category
                  ? "bg-[#707040] border-[#707040] text-white shadow-md"
                  : "bg-white border-stone-200 text-stone-500 hover:border-[#707040] hover:text-[#707040]"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>

        <div className="space-y-4">
          {!Array.isArray(filteredFaqs) || filteredFaqs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 italic text-stone-400">
              此分類目前暫無相關問答。
            </div>
          ) : filteredFaqs.map((faq, index) => {
            if (!faq || typeof faq !== 'object') return null;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-stone-100 transition-all hover:shadow-md"
              >
                <button
                  onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                  className="w-full px-8 py-7 flex items-center justify-between text-left hover:bg-stone-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                    <span className="shrink-0 w-max px-4 py-1 bg-stone-100 text-[#707040] text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {String(faq.category || '未分類')}
                    </span>
                    <span className="text-lg md:text-xl font-bold text-stone-800 leading-snug">
                      {faq.question || '無標題'}
                    </span>
                  </div>
                  <div className={`shrink-0 ml-4 transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : ''}`}>
                    <Plus size={24} className={activeIndex === index ? 'text-[#707040]' : 'text-stone-300'} />
                  </div>
                </button>
                
                <AnimatePresence>
                  {activeIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-8 pb-10 text-stone-600 leading-relaxed border-t border-stone-50 pt-8 text-base font-light whitespace-pre-wrap">
                        {faq.answer || '無內容'}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-24 p-16 bg-white rounded-[3rem] text-center border border-stone-100 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-stone-50 rounded-full blur-3xl transition-colors duration-700"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-serif italic mb-6 text-stone-800">
              {String(settings?.faq_contact_title || '還有其他問題嗎？')}
            </h2>
            <p className="text-stone-500 mb-10 max-w-md mx-auto font-light leading-relaxed whitespace-pre-wrap">
              {String(settings?.faq_contact_desc || '我們的客服團隊隨時準備為您提供協助，無論是產品諮詢還是訂單問題。')}
            </p>
            <a 
              href={settings?.faq_contact_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#707040] text-white px-12 py-4 rounded-2xl font-bold tracking-[0.2em] uppercase hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 text-xs"
            >
              立即聯繫客服
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
