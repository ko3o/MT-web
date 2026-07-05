import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { getSettings, SiteSettings } from '../services/settingsService';
import { getStorageUrl } from '../services/productService';
import { getNewsArticles, NewsArticle } from '../services/newsService';
import { formatDate } from '../utils/dateUtils';
import { Link } from 'react-router-dom';

export const News: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsData, newsData] = await Promise.all([
          getSettings(),
          getNewsArticles()
        ]);
        setSettings(settingsData);
        setArticles(newsData);
      } catch (err) {
        console.error('Failed to fetch news data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F4]">
        <Loader2 className="w-10 h-10 text-[#707040] animate-spin" />
      </div>
    );
  }

  const bannerUrl = settings?.sync_news_banner 
    ? getStorageUrl(settings.banner_url)
    : getStorageUrl(settings?.news_image_url || '', 'https://picsum.photos/seed/news-banner/1920/1080');

  return (
    <div className="min-h-screen bg-[#F9F8F4]">
      {/* Banner Section */}
      <section className="relative h-[40vh] md:h-[50vh] overflow-hidden flex items-center justify-center">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img 
            src={bannerUrl} 
            alt="News Banner" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Reduced overlay opacity for brightness as requested by user */}
          <div className="absolute inset-0 bg-stone-900/5 backdrop-blur-[0px]"></div>
        </motion.div>
        
        <div className="relative z-10 text-center px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif italic text-white mb-4 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
          >
            最新消息
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
            Latest News & Updates
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto py-24 px-6">
        {articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-400 font-light">目前尚無最新消息。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {articles.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <Link to={`/news/${item.id}`}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] mb-8 bg-stone-100">
                    <img 
                      src={getStorageUrl(item.cover_url)} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute top-6 left-6">
                      <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md text-[#707040] text-[10px] font-bold rounded-full shadow-sm tracking-widest uppercase">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="px-2">
                    <div className="flex items-center gap-3 text-[10px] font-bold text-stone-400 mb-4 tracking-widest uppercase">
                      <Calendar size={14} className="text-[#707040]/60" />
                      <span>{formatDate(item.publish_date)}</span>
                    </div>
                    
                    <h2 className="text-2xl font-serif italic text-stone-800 mb-4 group-hover:text-[#707040] transition-colors leading-tight">
                      {item.title}
                    </h2>
                    
                    <div className="flex items-center gap-2 text-[11px] font-bold text-[#707040] uppercase tracking-widest group/btn">
                      <span>閱讀更多</span>
                      <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
