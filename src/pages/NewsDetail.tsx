import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, ArrowLeft, Loader2, Tag } from 'lucide-react';
import { getNewsArticleById, NewsArticle } from '../services/newsService';
import { getStorageUrl } from '../services/productService';
import { formatDate } from '../utils/dateUtils';

export const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      try {
        const data = await getNewsArticleById(id);
        setArticle(data);
      } catch (err) {
        console.error('Failed to fetch news article:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F4]">
        <Loader2 className="w-10 h-10 text-[#707040] animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F8F4] px-6 text-center">
        <h2 className="text-3xl font-serif italic text-stone-800 mb-4">找不到這篇文章</h2>
        <p className="text-stone-500 mb-8">文章可能已被移除或更改位置。</p>
        <Link to="/news" className="px-8 py-3 bg-[#707040] text-white rounded-xl font-medium">回到最新消息</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F4]">
      {/* Header / Banner */}
      <section className="relative h-[50vh] overflow-hidden">
        <img 
          src={getStorageUrl(article.cover_url)} 
          alt={article.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-[2px]"></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-4xl w-full px-6 text-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block px-4 py-1.5 bg-white/90 backdrop-blur-md text-[#707040] text-[10px] font-bold rounded-full mb-6 tracking-widest uppercase shadow-sm"
                >
                    {article.category}
                </motion.div>
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-6xl font-serif italic text-white mb-6 leading-tight drop-shadow-xl"
                >
                    {article.title}
                </motion.h1>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-center gap-4 text-white/90 text-xs font-bold tracking-widest uppercase"
                >
                    <Calendar size={16} />
                    <span>發布於 {formatDate(article.publish_date)}</span>
                </motion.div>
            </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto py-24 px-6">
        <Link to="/news" className="inline-flex items-center gap-2 text-stone-400 hover:text-[#707040] transition-colors mb-12 font-bold text-xs tracking-widest uppercase group">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>返回列表</span>
        </Link>
        
        <motion.article 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-8 md:p-16 shadow-sm border border-stone-100"
        >
            <div 
                className="prose prose-stone prose-lg max-w-none 
                prose-headings:font-serif prose-headings:italic prose-headings:text-stone-800
                prose-p:text-stone-600 prose-p:leading-relaxed
                prose-img:rounded-3xl prose-img:shadow-lg
                [&_img]:w-full [&_img]:h-auto
                "
                dangerouslySetInnerHTML={{ __html: article.content }}
            />
        </motion.article>

        {/* Footer info */}
        <div className="mt-16 pt-16 border-t border-stone-200 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
                    <Tag size={20} className="text-[#707040]" />
                </div>
                <div>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">文章分類</p>
                    <p className="text-stone-800 font-serif italic">{article.category}</p>
                </div>
            </div>
            
            <div className="flex gap-4">
                {/* Could add social sharing here */}
            </div>
        </div>
      </div>
    </div>
  );
};
