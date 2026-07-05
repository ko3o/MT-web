import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, HelpCircle, Loader2, X, Settings, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getFaqs, createFaq, updateFaq, deleteFaq, FaqItem } from '../../services/faqService';
import { getSettings, updateSettings, SiteSettings } from '../../services/settingsService';
import { getSupabaseErrorMessage } from '../../utils/supabase_errors';
import toast from 'react-hot-toast';

export const AdminFaq: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);

  const { data: faqs, isLoading: isFaqsLoading } = useQuery({
    queryKey: ['admin-faqs'],
    queryFn: getFaqs,
  });

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: getSettings,
  });

  const settingsMutation = useMutation({
    mutationFn: (newSettings: Partial<SiteSettings>) => updateSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('設置已儲存');
    },
    onError: (error: any) => {
      toast.error(`儲存失敗: ${getSupabaseErrorMessage(error)}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: createFaq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success('成功新增問題');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Create FAQ Error:', error);
      toast.error(`新增失敗: ${getSupabaseErrorMessage(error)}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<FaqItem> }) => updateFaq(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success('成功更新問題');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Update FAQ Error:', error);
      toast.error(`更新失敗: ${getSupabaseErrorMessage(error)}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFaq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success('問題已刪除');
    },
    onError: (error: any) => {
      console.error('Delete FAQ Error:', error);
      toast.error(`刪除失敗: ${getSupabaseErrorMessage(error)}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      question: formData.get('question') as string,
      answer: formData.get('answer') as string,
      category: formData.get('category') as string,
    };

    if (editingFaq) {
      updateMutation.mutate({ id: editingFaq.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      faq_contact_title: formData.get('faq_contact_title') as string,
      faq_contact_desc: formData.get('faq_contact_desc') as string,
      faq_contact_url: formData.get('faq_contact_url') as string,
    };
    settingsMutation.mutate(data);
  };

  const openModal = (faq?: FaqItem) => {
    if (faq) {
      setEditingFaq(faq);
    } else {
      setEditingFaq(null);
    }
    setIsModalOpen(true);
  };

  const filteredFaqs = useMemo(() => {
    const items = faqs || [];
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.map(faq => ({
      ...faq,
      question: String(faq.question || ''),
      answer: String(faq.answer || ''),
      category: String(faq.category || '未分類')
    })).filter(faq => 
      faq.question.toLowerCase().includes(term) ||
      faq.answer.toLowerCase().includes(term) ||
      faq.category.toLowerCase().includes(term)
    );
  }, [faqs, searchTerm]);

  const isLoading = isFaqsLoading || isSettingsLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif italic text-stone-800 mb-2">常見問題管理</h2>
          <p className="text-stone-500 font-light">管理前台顯示的問答內容與聯繫區塊設置</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-[#707040] text-white rounded-xl hover:bg-[#5d5d35] transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 font-medium"
        >
          <Plus size={18} />
          <span>新增常見問題</span>
        </button>
      </div>

      {/* FAQ Contact Settings */}
      <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-stone-50 rounded-2xl text-[#707040]">
            <Settings size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-800">聯繫客服區塊設置</h3>
            <p className="text-sm text-stone-400 font-light italic">設定常見問題頁面底部的引導區塊內容</p>
          </div>
        </div>

        <form onSubmit={handleSettingsSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3 ml-1">區塊標題</label>
              <input 
                name="faq_contact_title"
                defaultValue={settings?.faq_contact_title}
                placeholder="例如：還有其他問題嗎？"
                className="w-full px-5 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-[#707040]/20 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3 ml-1">按鈕連結 (URL)</label>
              <input 
                name="faq_contact_url"
                defaultValue={settings?.faq_contact_url}
                placeholder="例如：https://line.me/..."
                className="w-full px-5 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-[#707040]/20 transition-all font-medium"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3 ml-1">描述文字</label>
            <textarea 
              name="faq_contact_desc"
              defaultValue={settings?.faq_contact_desc}
              rows={2}
              placeholder="請輸入區塊的描述文字..."
              className="w-full px-5 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-[#707040]/20 transition-all font-medium resize-none"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button 
              type="submit"
              disabled={settingsMutation.isPending}
              className="flex items-center gap-2 px-8 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-all hover:shadow-lg disabled:opacity-50 font-medium"
            >
              {settingsMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  <span>儲存設置</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Search and Table */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text" 
              placeholder="搜尋問題、答案或分類..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-[#707040]/20 transition-all text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50 text-[10px] uppercase tracking-widest font-bold text-stone-400">
                  <th className="px-8 py-5">分類</th>
                  <th className="px-8 py-5 w-1/3">問題</th>
                  <th className="px-8 py-5 w-1/3">答案</th>
                  <th className="px-8 py-5 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-10 bg-stone-50/30"></td>
                    </tr>
                  ))
                ) : (filteredFaqs || []).map((faq) => {
                  if (!faq || typeof faq !== 'object') return null;
                  return (
                    <tr key={faq.id ? String(faq.id) : 'unknown'} className="group hover:bg-stone-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-stone-100 text-[#707040] text-[10px] font-bold rounded-full uppercase tracking-wider">
                          {faq.category}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-stone-800 font-bold text-sm line-clamp-2">
                          {faq.question}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-stone-500 text-xs line-clamp-2 font-light">
                          {faq.answer}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openModal(faq)}
                            className="p-2 text-stone-400 hover:text-[#707040] hover:bg-white hover:shadow-sm rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('確定要刪除這個問題嗎？')) {
                                deleteMutation.mutate(faq.id);
                              }
                            }}
                            className="p-2 text-stone-400 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!isLoading && filteredFaqs.length === 0 && (
              <div className="py-20 text-center">
                <HelpCircle className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                <p className="text-stone-400 font-light">找不到符合的常見問題</p>
              </div>
            )}
          </div>
        </div>
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
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-8 border-b border-stone-100">
                <h3 className="text-2xl font-serif italic text-stone-800">
                  {editingFaq ? '編輯常見問題' : '新增常見問題'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-50 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3 ml-1">分類</label>
                    <select 
                      name="category"
                      required
                      defaultValue={editingFaq?.category || '關於覓野：土地與茶'}
                      className="w-full px-5 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-[#707040]/20 transition-all font-medium appearance-none cursor-pointer"
                    >
                      <option>關於覓野：土地與茶</option>
                      <option>品茗指南：沖泡百科</option>
                      <option>品質承諾：安心守護</option>
                      <option>服務指南：購物配送</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3 ml-1">問題 (Question)</label>
                  <input 
                    name="question"
                    required
                    defaultValue={editingFaq?.question}
                    className="w-full px-5 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-[#707040]/20 transition-all font-medium"
                    placeholder="例如：茶葉該如何存放？"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3 ml-1">答案 (Answer)</label>
                  <textarea 
                    name="answer"
                    required
                    rows={6}
                    defaultValue={editingFaq?.answer}
                    className="w-full px-5 py-3 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-[#707040]/20 transition-all font-medium resize-none"
                    placeholder="請輸入詳細的解答內容..."
                  />
                </div>

                <div className="pt-4 flex justify-end gap-4">
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
                      editingFaq ? '更新保存' : '確認新增'
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
