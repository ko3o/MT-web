import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, User, Mail, Phone, Calendar, MapPin, ShoppingBag, X, ChevronRight, Trash2, Camera, Check, Download, Upload, FileText } from 'lucide-react';
import { useMembers, useMemberMutations, useOrders } from '../../hooks/useAdminData';
import { getImageUrl, getAvatarUrl } from '../../services/productService';
import { getSettings } from '../../services/settingsService';
import { formatDate } from '../../utils/dateUtils';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export const AdminMembers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [isAvatarSelectOpen, setIsAvatarSelectOpen] = useState(false);
  const [systemAvatars, setSystemAvatars] = useState<string[]>([]);

  const { data: members = [], isLoading } = useMembers();
  const { data: allOrders = [] } = useOrders();
  const { deleteMemberMutation, updateMemberMutation, upsertMembersMutation } = useMemberMutations();

  useEffect(() => {
    fetchSystemAvatars();
  }, []);

  const fetchSystemAvatars = async () => {
    const settings = await getSettings();
    setSystemAvatars(settings.system_avatars || []);
  };

  const handleExport = () => {
    if (members.length === 0) {
      toast.error('沒有會員資料可導出');
      return;
    }

    const exportData = members.map(m => ({
      '會員ID': m.id,
      '姓名': m.full_name || '',
      'Email': m.email || '',
      '電話': m.customer_phone || '',
      '城市': m.city || '',
      '行政區': m.district || '',
      '詳細地址': m.address || '',
      '頭像URL': m.avatar_url || '',
      '最後更新': formatDate(m.updated_at)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    XLSX.writeFile(wb, `members_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('備份下載成功');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const importedMembers = data.map(item => ({
          id: item['會員ID'],
          full_name: item['姓名'],
          email: item['Email'],
          customer_phone: item['電話'],
          city: item['城市'],
          district: item['行政區'],
          address: item['詳細地址'],
          avatar_url: item['頭像URL'],
          updated_at: item['最後更新'] ? new Date(item['最後更新']).toISOString() : new Date().toISOString()
        }));

        if (importedMembers.length === 0) {
          toast.error('檔案中沒有有效的會員資料');
          return;
        }

        if (window.confirm(`確定要從檔案中復原 ${importedMembers.length} 筆會員資料嗎？這將會覆蓋現有相同 ID 的資料。`)) {
          const loadingToast = toast.loading('正在匯入會員資料...');
          try {
            await upsertMembersMutation.mutateAsync(importedMembers);
            toast.success('會員資料復原成功', { id: loadingToast });
          } catch (err: any) {
            console.error('Import update error:', err);
            toast.error(`復原失敗: ${err.message || '未知錯誤'}`, { id: loadingToast });
          }
        }
      } catch (err) {
        console.error('Import parsing error:', err);
        toast.error('檔案讀取或解析失敗，請確保格式正確');
      }
      // Reset input
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleViewDetail = (member: any) => {
    const memberOrders = allOrders.filter(o => o.user_id === member.id || o.email === member.email);
    setSelectedMember({ ...member, orders: memberOrders });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMemberToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (memberToDelete) {
      await deleteMemberMutation.mutateAsync(memberToDelete);
      setIsDeleteConfirmOpen(false);
      setMemberToDelete(null);
    }
  };

  const handleAvatarSelect = async (url: string) => {
    if (!selectedMember) return;
    
    await updateMemberMutation.mutateAsync({
      id: selectedMember.id,
      data: { avatar_url: url }
    });
    
    setSelectedMember({ ...selectedMember, avatar_url: url });
    setIsAvatarSelectOpen(false);
  };

  const filteredMembers = members.filter(m => 
    (m.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.customer_phone || '').includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#707040] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif italic text-stone-800 mb-2">會員管理</h1>
          <p className="text-stone-400 text-sm">查看並管理您的會員資料與購買歷史。</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-100 text-stone-600 rounded-2xl text-xs font-bold tracking-widest hover:bg-stone-50 transition-all shadow-sm"
          >
            <Download size={16} /> 下載備份 (EXL)
          </button>
          <label className="flex items-center gap-2 px-6 py-3 bg-stone-800 text-white rounded-2xl text-xs font-bold tracking-widest hover:bg-[#707040] transition-all shadow-lg shadow-stone-800/10 cursor-pointer">
            <Upload size={16} /> 上傳復原 (EXL)
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-stone-50">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" />
            <input 
              type="text" 
              placeholder="搜尋姓名、Email 或電話..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-8 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">會員姓名</th>
                <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">聯絡資訊</th>
                <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">最後更新</th>
                <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-stone-50/30 transition-colors group">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 overflow-hidden">
                        {m.avatar_url ? (
                          <img 
                            src={getAvatarUrl(m.avatar_url) || ''} 
                            alt={m.full_name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-stone-800">{m.full_name || '未填寫姓名'}</p>
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">ID: {m.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-stone-500">
                        <Mail size={14} className="text-stone-300" />
                        {m.email || '未提供'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-stone-500">
                        <Phone size={14} className="text-stone-300" />
                        {m.customer_phone || '未提供'}
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Calendar size={14} className="text-stone-300" />
                      {formatDate(m.updated_at)}
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button 
                        onClick={() => handleViewDetail(m)}
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#707040] hover:text-stone-800 transition-colors"
                      >
                        查看詳情 <ChevronRight size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteClick(e, m.id)}
                        className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                        title="刪除會員"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-12">
                <div className="flex justify-between items-start mb-12">
                  <div className="flex gap-6">
                    <div 
                      className="w-20 h-20 rounded-[2rem] bg-stone-50 flex items-center justify-center text-[#707040] overflow-hidden relative group cursor-pointer"
                      onClick={() => setIsAvatarSelectOpen(true)}
                    >
                      {selectedMember.avatar_url ? (
                        <img 
                          src={getAvatarUrl(selectedMember.avatar_url) || ''} 
                          alt={selectedMember.full_name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User size={32} />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                        <Camera size={16} className="text-white mb-1" />
                        <span className="text-[8px] text-white font-bold leading-tight">更換頭像</span>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-serif italic text-stone-800 mb-2">{selectedMember.full_name || '未填寫姓名'}</h2>
                      <div className="flex gap-4">
                        <span className="text-[10px] px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-bold uppercase tracking-widest">一般會員</span>
                        <span className="text-[10px] text-stone-400 font-medium">更新於 {formatDate(selectedMember.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-50 transition-colors"
                  >
                    <X size={20} className="text-stone-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-10">
                    <section>
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-6 flex items-center gap-2">
                        <MapPin size={14} /> 配送資訊
                      </h3>
                      <div className="bg-stone-50 p-6 rounded-2xl">
                        <p className="text-sm text-stone-800 leading-relaxed">
                          {selectedMember.city}{selectedMember.district}{selectedMember.address || '未填寫地址'}
                        </p>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-6 flex items-center gap-2">
                        <Mail size={14} /> 聯絡方式
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-stone-50">
                          <span className="text-sm text-stone-400">Email</span>
                          <span className="text-sm font-bold text-stone-800">{selectedMember.email}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-stone-50">
                          <span className="text-sm text-stone-400">電話</span>
                          <span className="text-sm font-bold text-stone-800">{selectedMember.customer_phone}</span>
                        </div>
                      </div>
                    </section>
                  </div>

                  <section>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-6 flex items-center gap-2">
                      <ShoppingBag size={14} /> 歷史訂單
                    </h3>
                    <div className="space-y-4">
                      {selectedMember.orders.length === 0 ? (
                        <div className="py-12 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                          <p className="text-sm text-stone-400 italic">尚無訂單記錄</p>
                        </div>
                      ) : (
                        selectedMember.orders.map((order) => (
                          <div key={order.id} className="p-6 bg-white border border-stone-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="text-sm font-bold text-stone-800">{order.order_number}</p>
                                <p className="text-[10px] text-stone-400">{formatDate(order.created_at)}</p>
                              </div>
                              <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest ${
                                order.status === '已完成' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-[#707040]">NT$ {order.total_amount.toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-serif italic text-stone-800 mb-4">確認刪除會員？</h3>
              <p className="text-stone-400 text-sm mb-8 leading-relaxed">
                此動作將永久刪除該會員的個人資料，且無法復原。
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="flex-1 py-4 bg-stone-50 text-stone-400 rounded-2xl font-bold text-sm hover:bg-stone-100 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  確認刪除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Avatar Selection Modal */}
      <AnimatePresence>
        {isAvatarSelectOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAvatarSelectOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-serif italic text-stone-800">為會員選擇頭像</h2>
                    <p className="text-stone-400 text-xs mt-1">從系統預設頭像中選擇</p>
                  </div>
                  <button 
                    onClick={() => setIsAvatarSelectOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-50 text-stone-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
                  {systemAvatars.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => handleAvatarSelect(url)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group ${
                        selectedMember.avatar_url === url 
                          ? 'border-[#707040] ring-4 ring-[#707040]/10' 
                          : 'border-stone-100 hover:border-stone-200'
                      }`}
                    >
                      <img 
                        src={getAvatarUrl(url) || ''} 
                        alt={`Avatar ${i}`} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {selectedMember.avatar_url === url && (
                        <div className="absolute inset-0 bg-[#707040]/20 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#707040] shadow-lg">
                            <Check size={16} />
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
