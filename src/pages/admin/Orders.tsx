import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Eye, ShoppingBag, Clock, CheckCircle, Truck, AlertCircle, Loader2, Trash2, Download, Upload, User } from 'lucide-react';
import { OrderDetails } from '../../components/admin/OrderDetails';
import { useOrders, useOrderMutations } from '../../hooks/useAdminData';
import { Order } from '../../services/orderService';
import { getAvatarUrl } from '../../services/productService';
import { formatDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const PassportStatusTag: React.FC<{ order: Order; onUpdate: (id: string, val: string) => Promise<void> }> = ({ order, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(order.passport_status || '');
  const [loading, setLoading] = useState(false);

  const handleBlur = async () => {
    if (value !== order.passport_status) {
      setLoading(true);
      try {
        await onUpdate(order.id, value);
      } catch (err) {
        setValue(order.passport_status || '');
      }
      setLoading(false);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
        className="text-[10px] px-2 py-1 bg-white border border-stone-200 text-stone-800 rounded-md outline-none w-full min-w-[200px] shadow-sm"
      />
    );
  }

  const isMember = !!order.user_id;

  return (
    <div 
      onClick={() => isMember && setIsEditing(true)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
        isMember 
          ? 'bg-[#1a2d42] text-white hover:bg-[#2a3d52] cursor-pointer shadow-sm active:scale-95' 
          : 'bg-stone-50 text-stone-400 border border-stone-100 cursor-not-allowed italic'
      }`}
    >
      {loading ? <Loader2 size={10} className="animate-spin" /> : isMember ? <ShoppingBag size={10} /> : null}
      <span className="whitespace-nowrap">
        {order.passport_status || (isMember ? '點擊設定進度' : '非會員 (不適用)')}
      </span>
    </div>
  );
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  '新單': { label: '新單', color: 'bg-orange-50 text-orange-600', icon: <Clock size={14} /> },
  '已回報匯款': { label: '已回報匯款', color: 'bg-blue-50 text-blue-600', icon: <AlertCircle size={14} /> },
  '處理中': { label: '處理中', color: 'bg-indigo-50 text-indigo-600', icon: <AlertCircle size={14} /> },
  '已收款': { label: '已收款', color: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle size={14} /> },
  '已出貨': { label: '已出貨', color: 'bg-purple-50 text-purple-600', icon: <Truck size={14} /> },
  '已取消': { label: '已取消', color: 'bg-stone-100 text-stone-500', icon: <AlertCircle size={14} /> },
};

export const AdminOrders: React.FC = () => {
  const { data: orders = [], isLoading: loading } = useOrders();
  const { updateStatusMutation, deleteOrderMutation, upsertOrdersMutation, updatePassportStatusMutation } = useOrderMutations();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pendingStatus, setPendingStatus] = useState<Record<string, Order['status']>>({});

  const handleExport = () => {
    if (orders.length === 0) {
      toast.error('沒有訂單資料可導出');
      return;
    }

    const exportData = orders.map(o => ({
      '訂單ID': o.id,
      '訂單編號': o.order_number,
      '顧客姓名': o.customer_name,
      'Email': o.email,
      '電話': o.customer_phone,
      '配送地址': o.shipping_address || '',
      '門市名稱': o.store_name || '',
      '門市地址': o.store_address || '',
      '收件人姓名': o.recipient_name || o.customer_name || '同訂購人',
      '收件人電話': o.recipient_phone || o.customer_phone || '',
      '實際寄送地址': o.shipping_method === '超商取貨 (7-11)' ? (o.store_address || '') : (o.recipient_address || o.shipping_address || ''),
      '送禮委託 (是/否)': o.is_gift ? '是' : '否',
      '總金額': o.total_amount,
      '運費': o.shipping_price,
      '狀態': o.status,
      '付款方式': o.payment_method,
      '運送方式': o.shipping_method,
      '備註': o.note || '',
      '匯款末五碼': o.bank_last_five || '',
      '茶貓護照進度': o.passport_status || '',
      '下單日期': formatDate(o.created_at),
      '商品明細': JSON.stringify(o.items)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `orders_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('訂單備份下載成功');
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

        const importedOrders = data.map(item => ({
          id: item['訂單ID'],
          order_number: item['訂單編號'],
          customer_name: item['顧客姓名'],
          email: item['Email'],
          customer_phone: item['電話'],
          shipping_address: item['配送地址'],
          store_name: item['門市名稱'],
          store_address: item['門市地址'],
          recipient_name: item['收件人姓名'] || item['顧客姓名'],
          recipient_phone: item['收件人電話'] || item['電話'],
          recipient_address: item['實際寄送地址'] || item['配送地址'],
          is_gift: item['送禮委託 (是/否)'] === '是',
          total_amount: Number(item['總金額']),
          shipping_price: Number(item['運費']),
          status: item['狀態'],
          payment_method: item['付款方式'],
          shipping_method: item['運送方式'],
          note: item['備註'],
          bank_last_five: item['匯款末五碼'],
          passport_status: item['茶貓護照進度'],
          created_at: item['下單日期'],
          items: item['商品明細'] ? JSON.parse(item['商品明細']) : []
        }));

        if (importedOrders.length === 0) {
          toast.error('檔案中沒有有效的訂單資料');
          return;
        }

        if (window.confirm(`確定要從檔案中復原 ${importedOrders.length} 筆訂單資料嗎？這將會覆蓋現有相同 ID 的資料。`)) {
          const loadingToast = toast.loading('正在匯入訂單資料...');
          try {
            await upsertOrdersMutation.mutateAsync(importedOrders);
            toast.success('訂單資料復原成功', { id: loadingToast });
          } catch (err: any) {
            console.error('Import update error:', err);
            toast.error(`復原失敗: ${err.message || '未知錯誤'}`, { id: loadingToast });
          }
        }
      } catch (err) {
        console.error('Import parsing error:', err);
        toast.error('檔案讀取或解析失敗，請確保格式正確');
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleStatusChange = async (id: string, newStatus: Order['status']) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      // Clear pending status after success
      setPendingStatus(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('確定要刪除這筆訂單嗎？此操作無法復原。')) return;
    try {
      await deleteOrderMutation.mutateAsync(id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.order_number || order.id).toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: '總訂單數', value: orders.length.toString(), icon: <ShoppingBag size={20} /> },
    { label: '待處理', value: orders.filter(o => o.status === '新單' || o.status === '處理中').length.toString(), icon: <Clock size={20} /> },
    { label: '已出貨', value: orders.filter(o => o.status === '已出貨').length.toString(), icon: <CheckCircle size={20} /> },
    { label: '總銷售額', value: `NT$ ${orders.reduce((acc, o) => acc + (o.total_amount || 0), 0).toLocaleString()}`, icon: <ShoppingBag size={20} /> },
  ];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif italic text-stone-800 mb-2">訂單管理</h1>
          <p className="text-stone-400 text-sm">查看並管理所有顧客的購買記錄與出貨狀態。</p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400">
                {stat.icon}
              </div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">{stat.label}</p>
            </div>
            <p className="text-xl font-serif text-stone-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-stone-50 flex flex-col md:flex-row gap-6 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" />
            <input 
              type="text" 
              placeholder="搜尋訂單編號或顧客姓名..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-8 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-stone-50 px-4 rounded-2xl">
              <Filter size={16} className="text-stone-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none py-4 text-sm text-stone-500 focus:ring-0 outline-none"
              >
                <option value="all">所有狀態</option>
                <option value="新單">新單</option>
                <option value="已回報匯款">已回報匯款</option>
                <option value="處理中">處理中</option>
                <option value="已收款">已收款</option>
                <option value="已出貨">已出貨</option>
                <option value="已取消">已取消</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">訂單編號</th>
                <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">頭像</th>
                <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">顧客姓名</th>
                <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">茶貓護照進度</th>
                <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">下單日期</th>
                <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">總計</th>
                <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">付款詳情</th>
                <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">狀態</th>
                <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-32 text-center text-stone-300 italic">載入中...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-32 text-center text-stone-300 italic">尚無訂單資料</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/30 transition-colors group">
                    <td className="p-8">
                      <span className="text-sm font-bold text-stone-800">{String(order.order_number || order.id)}</span>
                    </td>
                    <td className="p-8">
                      <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden border border-stone-200">
                        {order.avatar_url ? (
                          <img 
                            src={getAvatarUrl(order.avatar_url) || ''} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <User size={16} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-8">
                      <span className="text-sm text-stone-600">{String(order.customer_name)}</span>
                    </td>
                    <td className="p-8 whitespace-nowrap">
                      <PassportStatusTag 
                        order={order} 
                        onUpdate={(id, status) => updatePassportStatusMutation.mutateAsync({ id, status })}
                      />
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col gap-1">
                        <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">下單日期 (台北 UTC+8)</span>
                        <div className="bg-stone-50 px-3 py-2 rounded-lg border border-stone-100 flex flex-col">
                          <span className="text-sm text-stone-600 font-mono font-bold">
                            {formatDate(order.created_at).split(' ')[0]}
                          </span>
                          <span className="text-sm text-emerald-600 font-mono">
                            {formatDate(order.created_at).split(' ')[1]}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-stone-800">NT$ {(order.total_amount || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-stone-400">{Array.isArray(order.items) ? order.items.length : 0} 件商品</p>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="space-y-1">
                        {order.payment_method === '銀行匯款' ? (
                          order.bank_last_five ? (
                            <p className="text-sm font-bold text-blue-600">末五碼：{order.bank_last_five}</p>
                          ) : (
                            <span className="text-xs text-stone-300 italic">尚未回報</span>
                          )
                        ) : order.payment_method === '超商取貨付款' ? (
                          <p className="text-sm font-bold text-stone-800">超商取貨付款</p>
                        ) : order.payment_method === 'LINE PAY' ? (
                          <p className="text-sm font-bold text-emerald-600">LINE PAY 已支付</p>
                        ) : (
                          <p className="text-sm text-stone-500">{order.payment_method || '未知方式'}</p>
                        )}
                        {order.note && <p className="text-[10px] text-stone-400 line-clamp-1">{order.note}</p>}
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-2">
                        <select
                          value={pendingStatus[order.id] || order.status}
                          onChange={(e) => setPendingStatus(prev => ({ ...prev, [order.id]: e.target.value as Order['status'] }))}
                          className={`appearance-none inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border-none focus:ring-2 focus:ring-stone-200 cursor-pointer transition-all ${statusConfig[(pendingStatus[order.id] || order.status) as keyof typeof statusConfig]?.color || 'bg-stone-100 text-stone-500'}`}
                        >
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <option key={key} value={key} className="bg-white text-stone-800">
                              {config.label}
                            </option>
                          ))}
                        </select>
                        {pendingStatus[order.id] && pendingStatus[order.id] !== order.status && (
                          <button
                            onClick={() => handleStatusChange(order.id, pendingStatus[order.id])}
                            disabled={updateStatusMutation.isPending}
                            className="px-3 py-1 bg-zen-wood text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-zen-green transition-all shadow-sm flex items-center gap-1"
                          >
                            {updateStatusMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : '確認修改'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-stone-100 text-stone-400 hover:text-[#707040] hover:border-[#707040] transition-all shadow-sm"
                          title="查看詳情"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteOrder(order.id)}
                          disabled={deleteOrderMutation.isPending}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-stone-100 text-red-300 hover:text-red-500 hover:border-red-500 transition-all shadow-sm disabled:opacity-50"
                          title="刪除訂單"
                        >
                          {deleteOrderMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      <OrderDetails 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};
