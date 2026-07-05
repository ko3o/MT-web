import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Calendar, Tag, ExternalLink, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getNewsArticles, createNewsArticle, updateNewsArticle, deleteNewsArticle, NewsArticle } from '../../services/newsService';
import { getSupabaseErrorMessage } from '../../utils/supabase_errors';
import { ImageUploader } from '../../components/admin/ImageUploader';
import { getStorageUrl } from '../../services/productService';
import { formatDate } from '../../utils/dateUtils';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import toast from 'react-hot-toast';

export const AdminNews: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: getNewsArticles,
  });

  const createMutation = useMutation({
    mutationFn: createNewsArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast.success('成功新增文章');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Create News Error:', error);
      toast.error(`新增失敗: ${getSupabaseErrorMessage(error)}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<NewsArticle> }) => updateNewsArticle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast.success('成功更新文章');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Update News Error:', error);
      toast.error(`更新失敗: ${getSupabaseErrorMessage(error)}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNewsArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast.success('文章已刪除');
    },
    onError: (error: any) => {
      console.error('Delete News Error:', error);
      toast.error(`刪除失敗: ${getSupabaseErrorMessage(error)}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      publish_date: formData.get('publish_date') as string,
      content: content,
      cover_url: coverUrl,
    };

    if (editingArticle) {
      updateMutation.mutate({ id: editingArticle.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const openModal = (article?: NewsArticle) => {
    if (article) {
      setEditingArticle(article);
      setContent(article.content);
      setCoverUrl(article.cover_url);
    } else {
      setEditingArticle(null);
      setContent('');
      setCoverUrl('');
    }
    setIsModalOpen(true);
  };

  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif italic text-stone-800 mb-2">最新消息管理</h2>
          <p className="text-stone-500 font-light">發布品牌動態、新品資訊與活動公告</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-[#707040] text-white rounded-xl hover:bg-[#5d5d35] transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 font-medium"
        >
          <Plus size={18} />
          <span>發布新文章</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" 
            placeholder="搜尋標題或分類..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-[#707040]/20 transition-all text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-stone-100 animate-pulse h-48" />
          ))
        ) : filteredArticles.map((article) => (
          <motion.div 
            layout
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white rounded-2xl border border-stone-100 hover:border-stone-200 transition-all hover:shadow-md overflow-hidden flex flex-col"
          >
            <div className="aspect-video relative overflow-hidden bg-stone-100">
              <img 
                src={getStorageUrl(article.cover_url)} 
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[#707040] text-[10px] font-bold rounded-full shadow-sm tracking-wider uppercase">
                  {article.category}
                </span>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-[10px] font-bold text-stone-400 mb-3 tracking-widest uppercase">
                <Calendar size={12} />
                <span>{formatDate(article.publish_date)}</span>
              </div>
              
              <h3 className="text-lg font-bold text-stone-800 mb-4 line-clamp-2 leading-snug group-hover:text-[#707040] transition-colors">
                {article.title}
              </h3>
              
              <div className="mt-auto pt-5 border-t border-stone-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openModal(article)}
                    className="p-2 text-stone-400 hover:text-[#707040] hover:bg-stone-50 rounded-lg transition-all"
                    title="編輯"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => {
                        if (window.confirm('確定要刪除這篇文章嗎？')) {
                            deleteMutation.mutate(article.id);
                        }
                    }}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-stone-50 rounded-lg transition-all"
                    title="刪除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <button className="p-2 text-stone-400 hover:text-stone-800 transition-all">
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0.9, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0.9, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-8 bg-white border-b border-stone-100">
                <div>
                  <h3 className="text-2xl font-serif italic text-stone-800">
                    {editingArticle ? '編輯文章' : '發布新文章'}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-50 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3 ml-1">文章標題</label>
                      <input 
                        name="title"
                        required
                        defaultValue={editingArticle?.title}
                        className="w-full px-5 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-[#707040]/20 transition-all font-medium"
                        placeholder="輸入引人入勝的標題..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3 ml-1">分類標籤</label>
                        <select 
                          name="category"
                          required
                          defaultValue={editingArticle?.category || '新品上市'}
                          className="w-full px-5 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-[#707040]/20 transition-all font-medium appearance-none"
                        >
                          <option>新品上市</option>
                          <option>品牌活動</option>
                          <option>品牌榮譽</option>
                          <option>公告通知</option>
                          <option>茶文化</option>
                          <option>社會責任</option>
                          <option>會員優惠</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3 ml-1">發布日期</label>
                        <input 
                          name="publish_date"
                          type="date"
                          required
                          defaultValue={editingArticle?.publish_date || new Date().toISOString().split('T')[0]}
                          className="w-full px-5 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-[#707040]/20 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <ImageUploader 
                        label="封面圖片"
                        value={coverUrl}
                        onChange={setCoverUrl}
                        aspectRatio="aspect-video"
                        bucket="products"
                        pathPrefix="news"
                        useOriginalName={true}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3 ml-1">文章內容</label>
                    <div className="h-[400px] flex flex-col">
                      <ReactQuill 
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        className="flex-1 bg-stone-50 rounded-xl overflow-hidden border-none [&>.ql-toolbar]:border-none [&>.ql-toolbar]:bg-stone-100/50 [&>.ql-container]:border-none [&>.ql-container]:text-base [&>.ql-editor]:p-6"
                        placeholder="撰寫一段關於這篇文章的故事..."
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-stone-50 flex justify-end gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-3 text-stone-500 font-medium hover:text-stone-800 transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex items-center gap-2 px-10 py-3 bg-[#707040] text-white rounded-xl hover:bg-[#5d5d35] transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      editingArticle ? '更新文章' : '正式發布'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
