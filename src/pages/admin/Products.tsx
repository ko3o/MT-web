import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProducts, useProductMutations } from '../../hooks/useAdminData';
import { Product, getImageUrl, ProductOption, updateProduct } from '../../services/productService';
import { Edit, Trash2, Search, X, Plus, Download, Upload, GripVertical } from 'lucide-react';
import { ImageUploader } from '../../components/admin/ImageUploader';
import { formatDate } from '../../utils/dateUtils';
import { supabase } from '../../db';
import { deleteFile } from '../../services/storageService';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useQueryClient } from '@tanstack/react-query';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const QuillEditor = ReactQuill as any;

interface SortableRowProps {
  p: Product;
  loading: boolean;
  isDeleting: string | null;
  handleEdit: (p: Product) => void;
  handleDelete: (id: string) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({ p, loading, isDeleting, handleEdit, handleDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={`hover:bg-stone-50/30 transition-colors group ${isDragging ? 'shadow-2xl bg-white' : ''}`}
    >
      <td className="p-8">
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 transition-colors p-2"
          >
            <GripVertical size={18} />
          </button>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 border border-stone-100 flex items-center justify-center flex-shrink-0">
              {p.image_url ? (
                <img 
                  src={getImageUrl(p.image_url)} 
                  alt={String(p.name || '')} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/placeholder-tea.jpg';
                  }}
                />
              ) : (
                <div className="text-stone-300 text-[10px] font-bold uppercase tracking-widest">無圖片</div>
              )}
            </div>
            <div>
              <p className="font-serif italic text-stone-800 text-lg leading-tight">{String(p.name || '未命名商品')}</p>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">ID: {String(p.id || '').slice(0, 8)}</p>
              {p.options && Array.isArray(p.options) && p.options.length > 0 && (
                <p className="text-[11px] text-[#707040] font-medium mt-1">
                  規格: {p.options.map(opt => (typeof opt === 'string' ? opt : (opt?.label || ''))).filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="p-8">
        <span className={`text-sm px-4 py-1.5 rounded-full font-medium ${p.category ? 'text-stone-500 bg-stone-100' : 'text-stone-400 bg-stone-50'}`}>
          {String(p.category || '未分類')}
        </span>
      </td>
      <td className="p-8 text-sm font-bold text-stone-800">NT$ {(p.price || 0).toLocaleString()}</td>
      <td className="p-8">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${(p.stock || 0) > 10 ? 'bg-emerald-400' : 'bg-orange-400'}`}></div>
          <span className="text-sm text-stone-500">{p.stock || 0} 份</span>
        </div>
      </td>
      <td className="p-8 text-right">
        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => handleEdit(p)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-stone-100 text-stone-400 hover:text-[#707040] hover:border-[#707040] transition-all shadow-sm"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => handleDelete(p.id)}
            disabled={isDeleting === p.id}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-stone-100 text-stone-400 hover:text-red-500 hover:border-red-500 transition-all shadow-sm disabled:opacity-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export const AdminProducts: React.FC = () => {
  const { data: productsData = [], isLoading: loading } = useProducts();
  const { createMutation, updateMutation, deleteMutation, upsertProductsMutation } = useProductMutations();
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const quillRef = useRef<ReactQuill>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (productsData.length > 0) {
      setProducts(productsData);
    }
  }, [productsData]);

  const [dbCategories, setDbCategories] = useState<string[]>([]);

  const fetchDbCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category');
      if (error) throw error;
      if (data) {
        const cats = data.map(item => item.category).filter(Boolean);
        const uniqueCats = Array.from(new Set(cats)) as string[];
        setDbCategories(uniqueCats);
      }
    } catch (err) {
      console.error('Failed to fetch categories from Supabase:', err);
    }
  };

  useEffect(() => {
    fetchDbCategories();
  }, [productsData]);

  useEffect(() => {
    if (isModalOpen) {
      fetchDbCategories();
    }
  }, [isModalOpen]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);

    const newProducts = arrayMove(products, oldIndex, newIndex);
    
    // Optimistically update local state
    const originalProducts = [...products];
    setProducts(newProducts);

    // Update sort_order for all affected products
    // Ensure sort_order is explicitly a number and we only send id and sort_order to minimize errors
    const updatedProducts = (newProducts as Product[]).map((p, index) => ({
      id: p.id,
      sort_order: Number(index)
    }));

    try {
      // Try bulk update first
      await upsertProductsMutation.mutateAsync(updatedProducts as any);
      // Removed toast.success here for silent background success as requested
    } catch (err: any) {
      console.error('Failed to update sort order (bulk):', err);
      
      // Fallback: try individual updates if bulk fails
      // We use the direct service to avoid triggering the default "Product Updated" toast for every item
      try {
        await Promise.all(
          updatedProducts.map(up => 
            updateProduct(up.id, { sort_order: up.sort_order })
          )
        );
        // Updated: Silent background success for both bulk and fallback as requested
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } catch (fallbackErr: any) {
        console.error('Failed to update sort order (fallback):', fallbackErr);
        toast.error(`排序更新失敗: ${fallbackErr.message || '未知錯誤'}`);
        setProducts(originalProducts); // Revert on total failure
      }
    }
  };

  const handleExport = () => {
    if (products.length === 0) {
      toast.error('沒有商品資料可導出');
      return;
    }

    const exportData = products.map(p => ({
      '商品ID': p.id,
      '商品名稱': p.name || '',
      '網址代碼(Slug)': p.slug || '',
      '分類': p.category || '',
      '價格': p.price || 0,
      '原價': p.original_price || '',
      '庫存': p.stock || 0,
      '圖片URL': p.image_url || '',
      '描述': p.description || '',
      '建立日期': formatDate(p.created_at)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, `products_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('商品備份下載成功');
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

        const importedProducts = data.map(item => ({
          id: item['商品ID'],
          name: item['商品名稱'],
          slug: item['網址代碼(Slug)'],
          category: item['分類'],
          price: Number(item['價格']),
          original_price: item['原價'] ? Number(item['原價']) : undefined,
          stock: Number(item['庫存']),
          image_url: item['圖片URL'],
          description: item['描述'],
          created_at: item['建立日期'] || new Date().toISOString()
        }));

        if (importedProducts.length === 0) {
          toast.error('檔案中沒有有效的商品資料');
          return;
        }

        if (window.confirm(`確定要從檔案中復原 ${importedProducts.length} 筆商品資料嗎？這將會覆蓋現有相同 ID 的資料。`)) {
          const loadingToast = toast.loading('正在匯入商品資料...');
          try {
            await upsertProductsMutation.mutateAsync(importedProducts);
            toast.success('商品資料匯入成功', { id: loadingToast });
          } catch (err: any) {
            console.error('Import update error:', err);
            toast.error(`匯入失敗: ${err.message || '未知錯誤'}`, { id: loadingToast });
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

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const loadingToast = toast.loading('正在上傳編輯器圖片...');
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `editor/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection();
          if (range) {
            quill.insertEmbed(range.index, 'image', publicUrl);
            quill.setSelection(range.index + 1);
          }
        }
        toast.success('圖片上傳成功', { id: loadingToast });
      } catch (error) {
        console.error('Editor image upload error:', error);
        toast.error('圖片上傳失敗', { id: loadingToast });
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image'
  ];

  const handleEdit = (product: Product) => {
    let rawOptions = product.options as any;
    
    // 增加過濾邏輯：如果從資料庫讀出來的是字串 "[object Object]"，重設為空陣列
    if (typeof rawOptions === 'string' && rawOptions.includes('[object Object]')) {
      rawOptions = [];
    }
    
    const safeOptions = Array.isArray(rawOptions) ? rawOptions : [];
    const normalizedOptions = safeOptions.map(opt => {
      if (!opt) return { label: '未命名規格', price: 0 };
      if (typeof opt === 'string') return { label: opt, price: 0 };
      return { 
        label: opt.label || '未命名規格', 
        price: typeof opt.price === 'number' ? opt.price : 0 
      };
    });

    setEditingProduct({ 
      ...product, 
      category: product.category || '精選紅茶',
      options: normalizedOptions 
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct({
      name: '',
      category: '精選紅茶',
      price: 0,
      stock: 0,
      description: '',
      options: [],
      image_url: '',
      slug: ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('確定要刪除此商品嗎？')) return;
    
    const productToDelete = products.find(p => p.id === id);
    setIsDeleting(id);
    try {
      if (productToDelete?.image_url) {
        await deleteFile(productToDelete.image_url, 'products').catch(err => {
          console.error('Failed to delete product image from storage:', err);
        });
      }
      await deleteMutation.mutateAsync(id);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const loadingToast = toast.loading('正在儲存...');
    try {
      // 確保 options 是純粹的 JSON 陣列，過濾掉 React 狀態物件
      const cleanOptions = JSON.parse(JSON.stringify(editingProduct.options || []));
      
      const saveData: Partial<Product> = {
        name: editingProduct.name || '',
        category: editingProduct.category || '',
        price: Number(editingProduct.price) || 0,
        original_price: editingProduct.original_price ? Number(editingProduct.original_price) : undefined,
        stock: Number(editingProduct.stock) || 0,
        description: editingProduct.description || '',
        options: cleanOptions,
        image_url: editingProduct.image_url || '',
        slug: editingProduct.slug || editingProduct.name?.toLowerCase().trim().replace(/[\s/]+/g, '-') || `product-${Date.now()}`,
        sort_order: editingProduct.sort_order ?? (products.length > 0 ? Math.max(...products.map(p => p.sort_order || 0)) + 1 : 0)
      };

      if ('id' in editingProduct && editingProduct.id) {
        await updateMutation.mutateAsync({ id: editingProduct.id, data: saveData });
        toast.success('商品已成功更新', { id: loadingToast });
      } else {
        await createMutation.mutateAsync(saveData as any);
        toast.success('商品已成功新增', { id: loadingToast });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('儲存失敗，請檢查欄位格式', { id: loadingToast });
    }
  };

  const filteredProducts = products.filter(p => {
    const name = p.name || '';
    const category = p.category || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           category.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif italic text-stone-800 mb-2">商品管理 (V2)</h1>
          <p className="text-stone-400 text-sm">管理您的茶品目錄，包含價格、庫存與描述。</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-100 text-stone-600 rounded-2xl text-xs font-bold tracking-widest hover:bg-stone-50 transition-all shadow-sm"
          >
            <Download size={16} /> 下載備份 (EXL)
          </button>
          <label className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-100 text-stone-600 rounded-2xl text-xs font-bold tracking-widest hover:bg-stone-50 transition-all shadow-sm cursor-pointer">
            <Upload size={16} /> 上傳復原 (EXL)
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-stone-800 text-white px-8 py-3 rounded-2xl text-sm font-bold tracking-widest hover:bg-[#707040] transition-all shadow-lg shadow-stone-800/10"
          >
            <Plus size={18} /> 新增商品
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-stone-50 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" />
            <input 
              type="text" 
              placeholder="搜尋商品名稱或分類..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-8 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50">
                  <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">商品資訊</th>
                  <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">分類</th>
                  <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">價格</th>
                  <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">庫存</th>
                  <th className="p-8 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-32 text-center text-stone-300 italic">載入中...</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-32 text-center text-stone-300 italic">尚無符合條件的商品</td>
                  </tr>
                ) : (
                  <SortableContext 
                    items={filteredProducts.map(p => p.id)} 
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredProducts.map((p) => (
                      <SortableRow 
                        key={p.id} 
                        p={p} 
                        loading={loading}
                        isDeleting={isDeleting}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                      />
                    ))}
                  </SortableContext>
                )}
              </tbody>
            </table>
          </DndContext>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && editingProduct && (
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
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-12 overflow-y-auto">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-2xl font-serif italic text-stone-800">
                    {editingProduct.id ? '編輯商品' : '新增商品'}
                  </h2>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-50 transition-colors"
                  >
                    <X size={20} className="text-stone-400" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                  <ImageUploader 
                    label="商品圖片"
                    value={editingProduct.image_url || ''}
                    onChange={(url) => setEditingProduct({ ...editingProduct, image_url: url })}
                    aspectRatio="aspect-square"
                    bucket="products"
                    pathPrefix="items"
                  />

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">商品名稱</label>
                       <input 
                         type="text" 
                         value={editingProduct.name || ''}
                         onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                         className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-sm"
                         required
                       />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400">商品分類</label>
                        <span className="text-[9px] text-[#707040] font-medium font-sans">可自行輸入或下拉選取</span>
                      </div>
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          value={editingProduct.category || ''}
                          placeholder="請輸入或選取分類 (例如：高山烏龍)"
                          onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                          className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-sm text-stone-800"
                          required
                        />
                        <div className="relative">
                          <select
                            value={dbCategories.includes(editingProduct.category || '') ? (editingProduct.category || '') : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                setEditingProduct({ ...editingProduct, category: e.target.value });
                              }
                            }}
                            className="w-full px-6 py-3 bg-stone-50/80 border border-stone-100 rounded-xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-xs text-stone-600 appearance-none cursor-pointer hover:bg-stone-100/50"
                          >
                            <option value="">-- 快速選取現有分類 (動態載入) --</option>
                            {dbCategories.map(cat => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400" style={{ fontSize: '10px' }}>
                            ▼
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">價格 (NT$)</label>
                      <input 
                        type="text"
                        inputMode="numeric"
                        value={(editingProduct.price ?? 0).toString()}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '');
                          setEditingProduct({ ...editingProduct, price: parseInt(val) || 0 });
                        }}
                        className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">原價 (NT$ - 選填)</label>
                      <input 
                        type="text"
                        inputMode="numeric"
                        value={(editingProduct.original_price ?? '').toString()}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '');
                          setEditingProduct({ ...editingProduct, original_price: val ? parseInt(val) : undefined });
                        }}
                        className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-sm"
                        placeholder="留空則不顯示特價"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">庫存數量</label>
                      <input 
                        type="text"
                        inputMode="numeric"
                        value={(editingProduct.stock ?? 0).toString()}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '');
                          setEditingProduct({ ...editingProduct, stock: parseInt(val) || 0 });
                        }}
                        className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">商品規格</label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentOptions = (editingProduct.options || []) as ProductOption[];
                          setEditingProduct({
                            ...editingProduct,
                            options: [...currentOptions, { label: '', price: editingProduct.price || 0 }]
                          });
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#707040] hover:text-[#5a5a34] transition-colors"
                      >
                        <Plus size={12} /> 新增規格
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {(editingProduct.options || []).length === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const currentOptions = (editingProduct.options || []) as ProductOption[];
                            setEditingProduct({
                              ...editingProduct,
                              options: [...currentOptions, { label: '', price: editingProduct.price || 0 }]
                            });
                          }}
                          className="w-full py-10 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-100 text-stone-400 group hover:border-[#707040]/30 hover:bg-stone-50/50 transition-all flex flex-col items-center justify-center gap-2"
                        >
                          <Plus size={20} className="text-stone-300 group-hover:text-[#707040] transition-colors" />
                          <span className="text-xs font-medium tracking-wide">目前無規格選項，點擊新增一個</span>
                        </button>
                      ) : (
                        (editingProduct.options as ProductOption[]).map((option, index) => (
                          <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-stone-100 shadow-sm">
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder="規格名稱 (例如：100g 裝)"
                                value={option.label || ''}
                                onChange={(e) => {
                                  const newOptions = [...(editingProduct.options as ProductOption[])];
                                  newOptions[index] = { ...newOptions[index], label: e.target.value };
                                  setEditingProduct({ ...editingProduct, options: newOptions });
                                }}
                                className="w-full bg-stone-50 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-[#707040]/10 outline-none"
                              />
                            </div>
                            <div className="w-32">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-400">NT$</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="售價"
                                  value={(option.price ?? 0).toString()}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    let val = e.target.value.replace(/[^0-9]/g, '');
                                    if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '');
                                    const newOptions = [...(editingProduct.options as ProductOption[])];
                                    newOptions[index] = { ...newOptions[index], price: parseInt(val) || 0 };
                                    setEditingProduct({ ...editingProduct, options: newOptions });
                                  }}
                                  className="w-full bg-stone-50 border-none rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-[#707040]/10 outline-none"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = (editingProduct.options as ProductOption[]).filter((_, i) => i !== index);
                                setEditingProduct({ ...editingProduct, options: newOptions });
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">商品描述</label>
                    <div className="bg-stone-50 rounded-2xl overflow-hidden border border-transparent focus-within:ring-2 focus-within:ring-[#707040]/10 transition-all">
                      <QuillEditor
                        ref={quillRef}
                        theme="snow"
                        value={editingProduct.description || ''}
                        onChange={(content: string) => setEditingProduct({ ...editingProduct, description: content })}
                        modules={modules}
                        formats={formats}
                        className="admin-quill-editor"
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-8 py-4 bg-stone-50 text-stone-500 rounded-2xl text-sm font-bold tracking-widest hover:bg-stone-100 transition-all"
                    >
                      取消
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-8 py-4 bg-stone-800 text-white rounded-2xl text-sm font-bold tracking-widest hover:bg-[#707040] transition-all shadow-xl shadow-stone-800/10"
                    >
                      儲存變更
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
