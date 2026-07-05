import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, 
  Layout, 
  Save, 
  Check, 
  Trash2, 
  Loader2, 
  UserCircle, 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Leaf, 
  Compass, 
  Heart, 
  Award, 
  Activity, 
  Framer,
  Music,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
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
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { ImageUploader } from '../../components/admin/ImageUploader';
import { getSettings, updateSettings, SiteSettings, BotanicalSpecimen, CoexistenceCardItem, CatDutyItem } from '../../services/settingsService';
import { getAvatarUrl, getStorageUrl } from '../../services/productService';
import { deleteFile, uploadImage } from '../../services/storageService';

const SortableAvatar: React.FC<{
  url: string;
  name: string;
  index: number;
  onRemove: (index: number) => void;
  onNameChange: (index: number, name: string) => void;
  getAvatarUrl: (path: string) => string | null;
}> = ({ url, name, index, onRemove, onNameChange, getAvatarUrl }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-stone-50 rounded-3xl overflow-hidden border border-stone-100 touch-none ${
        isDragging ? 'opacity-50 shadow-2xl ring-4 ring-[#707040]/20' : ''
      }`}
    >
      <div 
        className="aspect-square relative cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <img
          src={getAvatarUrl(url) || ''}
          alt={`Avatar ${index}`}
          className="w-full h-full object-cover pointer-events-none"
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <GripVertical className="text-white drop-shadow-md" size={24} />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-md text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-3">
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(index, e.target.value)}
          placeholder="輸入茶貓名稱"
          className="w-full text-xs text-center bg-transparent border-none focus:ring-0 outline-none text-stone-600 placeholder:text-stone-300"
        />
      </div>
    </div>
  );
};

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('brand');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      toast.error('載入設置失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const loadingToast = toast.loading('正在儲存設置...');
    try {
      await updateSettings(settings);
      toast.success('設置已成功儲存', { id: loadingToast });
    } catch (error: any) {
      console.error('Save settings error:', error);
      toast.error(error.message || '儲存失敗，請檢查資料庫連線', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && settings) {
      const oldIndex = settings.system_avatars.findIndex(a => a.url === active.id);
      const newIndex = settings.system_avatars.findIndex(a => a.url === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newAvatars = arrayMove(settings.system_avatars, oldIndex, newIndex);
        setSettings({ ...settings, system_avatars: newAvatars });
      }
    }
  };

  // Biodiversity / Specimen Handlers
  const addSpecimen = () => {
    if (!settings) return;
    const newSpecimen: BotanicalSpecimen = {
      id: 'specimen-' + Date.now(),
      name: '生態物種名稱',
      scientificName: '請寫下極具懸念的短標語 (20字內)',
      category: 'flora',
      desc: '請描述這份精彩的共生故事，它如何與茶地和諧共處並帶來特殊價值（Story & Value）',
      role: '它的祕密任務與自然生態定位 (Role)',
      image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=400&q=80'
    };
    setSettings({
      ...settings,
      specimens: [...(settings.specimens || []), newSpecimen]
    });
    toast.success('已新增一張空白卡片，請於下方編輯');
  };

  const removeSpecimen = async (index: number) => {
    if (!settings) return;
    const item = settings.specimens[index];
    if (item && item.image && item.image.startsWith('http') === false) {
      try {
        await deleteFile(item.image, 'products');
      } catch (err) {
        console.warn('Could not delete old image', err);
      }
    }
    const newSpecimens = settings.specimens.filter((_, idx) => idx !== index);
    setSettings({ ...settings, specimens: newSpecimens });
    toast.success('已移除該生態卡片');
  };

  const moveSpecimen = (index: number, direction: 'up' | 'down') => {
    if (!settings) return;
    const newSpecimens = [...settings.specimens];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSpecimens.length) return;

    const temp = newSpecimens[index];
    newSpecimens[index] = newSpecimens[targetIdx];
    newSpecimens[targetIdx] = temp;

    setSettings({ ...settings, specimens: newSpecimens });
  };

  // Feline resume list helpers
  const handleAddFelineResume = () => {
    if (!settings) return;
    const items = [...(settings.cat_manager_profile_items || [])];
    items.push('屬性：請在此輸入屬性值與說明');
    setSettings({ ...settings, cat_manager_profile_items: items });
  };

  const handleEditFelineResume = (index: number, newVal: string) => {
    if (!settings) return;
    const items = [...(settings.cat_manager_profile_items || [])];
    items[index] = newVal;
    setSettings({ ...settings, cat_manager_profile_items: items });
  };

  const handleRemoveFelineResume = (index: number) => {
    if (!settings) return;
    const items = (settings.cat_manager_profile_items || []).filter((_, i) => i !== index);
    setSettings({ ...settings, cat_manager_profile_items: items });
  };

  const tabs = [
    { id: 'brand', label: '品牌識別', icon: <ImageIcon size={18} /> },
    { id: 'banner', label: '首頁 Banner & 連結', icon: <ImageIcon size={18} /> },
    { id: 'news', label: '最新消息設置', icon: <Layout size={18} /> },
    { id: 'about-meet', label: '遇見覓野管理', icon: <Layout size={18} /> },
    { id: 'about-coexist', label: '萬物共生與生態池', icon: <Leaf size={18} /> },
    { id: 'about-cat', label: '店長日常管理', icon: <UserCircle size={18} /> },
    { id: 'avatars', label: '頭像管理', icon: <UserCircle size={18} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-[#707040] animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-serif italic text-stone-800 mb-2">頁面設置</h1>
          <p className="text-stone-400 text-sm">設計並微調前台各區塊、並同步建立「關於我們」三格獨立子頁面的前後台資訊。</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-stone-800 text-white px-8 py-3.5 rounded-2xl text-sm font-bold tracking-widest hover:bg-[#707040] transition-all shadow-lg shadow-stone-800/10 disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          儲存變更
        </button>
      </header>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 p-1 bg-stone-100 rounded-3xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold tracking-wider transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-stone-800 shadow-sm' 
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
        {/* 1. Brand Logo */}
        {activeTab === 'brand' && (
          <div className="p-12 space-y-12">
            <section>
              <h3 className="text-lg font-bold text-stone-800 mb-8">品牌 Logo 設置</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <ImageUploader 
                    label="網站 Logo"
                    value={settings.logo_url}
                    onChange={(url) => setSettings({ ...settings, logo_url: url })}
                    aspectRatio="aspect-[290/100]"
                    objectFit="contain"
                    hint="建議 290x100 px (比例 2.9:1，透明背景 PNG)"
                    bucket="products"
                    pathPrefix="brand"
                  />
                </div>
                <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-100 h-fit">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">預覽效果</h4>
                  <div className="p-8 bg-white/80 backdrop-blur-md rounded-2xl border border-stone-100 flex items-center justify-center">
                    <img 
                      src={getAvatarUrl(settings.logo_url) || settings.logo_url} 
                      alt="Logo Preview" 
                      style={{ height: '40px', width: 'auto' }}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-stone-100" />

            <section>
              <h3 className="text-lg font-bold text-stone-800 mb-2">社群登入按鈕 Logo 設置</h3>
              <p className="text-stone-400 text-xs mb-8">管理或上傳登入與註冊頁面中的 Google、LINE 按鈕圖標，或填寫自訂圖片網址。</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Google Logo Config */}
                <div className="p-8 bg-stone-50 rounded-[2rem] border border-stone-100 space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-200/60 pb-4">
                    <h4 className="text-sm font-bold text-stone-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      Google 登入圖標
                    </h4>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Google Login</span>
                  </div>
                  
                  <ImageUploader 
                    label="上傳 Google Logo"
                    value={settings.google_login_logo_url}
                    onChange={(url) => setSettings({ ...settings, google_login_logo_url: url })}
                    aspectRatio="aspect-square"
                    objectFit="contain"
                    hint="建議為 1:1 透明背景 PNG"
                    bucket="products"
                    pathPrefix="social_logos"
                  />

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">或填寫圖片網址 (Image URL)</label>
                    <input 
                      type="text" 
                      value={settings.google_login_logo_url || ''}
                      onChange={(e) => setSettings({ ...settings, google_login_logo_url: e.target.value })}
                      placeholder="https://example.com/google-logo.png"
                      className="w-full px-4 py-3 bg-white border border-stone-200/60 rounded-xl text-stone-800 text-xs focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all"
                    />
                  </div>

                  <p className="text-stone-400 text-[11px] leading-relaxed">
                    * 留空或清除後將自動還原為<strong>官方標準「G」字型四色標誌</strong>。
                  </p>

                  <div className="mt-4 pt-4 border-t border-stone-200/40 flex items-center gap-3">
                    <span className="text-[10px] font-bold text-stone-400">目前預覽：</span>
                    <div className="w-10 h-10 bg-white rounded-xl border border-stone-200/60 flex items-center justify-center overflow-hidden p-1.5">
                      {settings.google_login_logo_url ? (
                        <img 
                          src={getAvatarUrl(settings.google_login_logo_url) || settings.google_login_logo_url} 
                          alt="Google Logo" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.41-4.69H24v8.88h12.63C35.1 32.22 31.06 35 24 35c-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48c13.26 0 24-10.74 24-24 0-.67-.06-1.34-.15-2z" />
                          <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z" />
                          <path fill="#34A853" d="M24 48c6.47 0 11.91-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* LINE Logo Config */}
                <div className="p-8 bg-stone-50 rounded-[2rem] border border-stone-100 space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-200/60 pb-4">
                    <h4 className="text-sm font-bold text-stone-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#06C755]"></span>
                      LINE 登入圖標
                    </h4>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">LINE Login</span>
                  </div>
                  
                  <ImageUploader 
                    label="上傳 LINE Logo"
                    value={settings.line_login_logo_url}
                    onChange={(url) => setSettings({ ...settings, line_login_logo_url: url })}
                    aspectRatio="aspect-square"
                    objectFit="contain"
                    hint="建議為 1:1 透明背景 PNG"
                    bucket="products"
                    pathPrefix="social_logos"
                  />

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">或填寫圖片網址 (Image URL)</label>
                    <input 
                      type="text" 
                      value={settings.line_login_logo_url || ''}
                      onChange={(e) => setSettings({ ...settings, line_login_logo_url: e.target.value })}
                      placeholder="https://example.com/line-logo.png"
                      className="w-full px-4 py-3 bg-white border border-stone-200/60 rounded-xl text-stone-800 text-xs focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all"
                    />
                  </div>

                  <p className="text-stone-400 text-[11px] leading-relaxed">
                    * 留空或清除後將自動還原為<strong>官方標準綠底白字標誌</strong>。
                  </p>

                  <div className="mt-4 pt-4 border-t border-stone-200/40 flex items-center gap-3">
                    <span className="text-[10px] font-bold text-stone-400">目前預覽：</span>
                    <div className="w-10 h-10 bg-[#06C755] rounded-xl border border-stone-200/60 flex items-center justify-center overflow-hidden p-1.5">
                      {settings.line_login_logo_url ? (
                        <img 
                          src={getAvatarUrl(settings.line_login_logo_url) || settings.line_login_logo_url} 
                          alt="LINE Logo" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                          <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.564.391.084.922.258 1.057.592.12.303.079.778.038 1.087l-.166 1.01c-.05.304-.241 1.191 1.038.65 1.279-.541 6.901-4.067 9.414-6.96 1.761-1.954 2.583-3.921 2.583-6.243zm-15.654 3.011c0 .241-.195.436-.436.436H6.132c-.241 0-.436-.195-.436-.436V7.632c0-.241.195-.436.436-.436h.218c.241 0 .436.195.436.436v4.836h1.124c.241 0 .436.195.436.436v.211zm2.342 0c0 .241-.195.436-.436.436h-.218c-.241 0-.436-.195-.436-.436V7.632c0-.241.195-.436.436-.436h.218c.241 0 .436.195.436.436v.713zm3.743 0c0 .241-.195.436-.436.436h-.233c-.159 0-.306-.086-.382-.228l-1.488-2.756v2.548c0 .241-.195.436-.436.436h-.218c-.241 0-.436-.195-.436-.436V7.632c0-.241.195-.436.436-.436h.233c.159 0 .306.086.382.228l1.488 2.755V7.632c0-.241.195-.436.436-.436h.218c.241 0 .436.195.436.436v.211zm3.435-1.996c0 .241-.195.436-.436.436h-1.124v1.124h1.124c.241 0 .436.195.436.436v.211c0 .241-.195.436-.436.436h-1.778c-.241 0-.436-.195-.436-.436V7.632c0-.241.195-.436.436-.436h1.778c.241 0 .436.195.436.436v.211c0 .241-.195.436-.436.436h-1.124v1.124h1.124c.241 0 .436.195.436.436v.211z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 2. Banners & Redirect Links */}
        {activeTab === 'banner' && (
          <div className="p-12 space-y-12">
            <section className="space-y-12">
              <div>
                <h3 className="text-lg font-bold text-stone-800 mb-2">首頁 Banner 設置</h3>
                <p className="text-stone-400 text-xs">調整主頁最上方的展示圖片與副標題文字。</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <ImageUploader 
                    label="Banner 圖片"
                    value={settings.banner_url}
                    onChange={(url) => setSettings({ ...settings, banner_url: url })}
                    aspectRatio="aspect-video"
                    hint="建議 1920x1080"
                    bucket="products"
                    pathPrefix="banners"
                  />
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">主標題</label>
                    <input 
                      type="text" 
                      value={settings.banner_title}
                      onChange={(e) => setSettings({ ...settings, banner_title: e.target.value })}
                      className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">副標題 (打字機文案)</label>
                    <textarea 
                      rows={4}
                      value={settings.banner_subtitle}
                      onChange={(e) => setSettings({ ...settings, banner_subtitle: e.target.value })}
                      className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-sm resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-stone-100" />

            <section className="space-y-12">
              <div>
                <h3 className="text-lg font-bold text-stone-800 mb-2">首頁行動引導按鈕連結 (Call to Action)</h3>
                <p className="text-stone-400 text-xs">設定前台按鈕的跳轉連結。可確認、更改或跳轉到自定義的頁面。</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Button 1: Brand Philosophy */}
                <div className="p-8 bg-[#F9F8F4] border border-stone-100 rounded-3xl space-y-6">
                  <div className="space-y-1 text-slate-700">
                    <h4 className="text-sm font-bold">品牌理念引導按鈕</h4>
                    <p className="text-stone-400 text-[11px]">原本為「探索茶草共生的故事 ➔」</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">按鈕文字</label>
                      <input 
                        type="text"
                        value={settings.philosophy_btn_text || ''}
                        onChange={(e) => setSettings({ ...settings, philosophy_btn_text: e.target.value })}
                        className="w-full px-5 py-3 bg-white border border-stone-200/60 rounded-xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">按鈕跳轉路徑 (Route)</label>
                      <input 
                        type="text"
                        value={settings.philosophy_btn_url || ''}
                        onChange={(e) => setSettings({ ...settings, philosophy_btn_url: e.target.value })}
                        className="w-full px-5 py-3 bg-white border border-stone-200/60 rounded-xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Button 2: Cats Daily */}
                <div className="p-8 bg-[#F9F8F4] border border-stone-100 rounded-3xl space-y-6">
                  <div className="space-y-1 text-slate-700">
                    <h4 className="text-sm font-bold">店長督工巡哨按鈕</h4>
                    <p className="text-stone-400 text-[11px]">原本為「看看店長的茶園日常 ➔」</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">按鈕文字</label>
                      <input 
                        type="text"
                        value={settings.cat_btn_text || ''}
                        onChange={(e) => setSettings({ ...settings, cat_btn_text: e.target.value })}
                        className="w-full px-5 py-3 bg-white border border-stone-200/60 rounded-xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">按鈕跳轉路徑 (Route)</label>
                      <input 
                        type="text"
                        value={settings.cat_btn_url || ''}
                        onChange={(e) => setSettings({ ...settings, cat_btn_url: e.target.value })}
                        className="w-full px-5 py-3 bg-white border border-stone-200/60 rounded-xl focus:ring-2 focus:ring-[#707040]/10 outline-none transition-all text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 3. News Config */}
        {activeTab === 'news' && (
          <div className="p-12 space-y-12">
            <section>
              <h3 className="text-lg font-bold text-stone-800 mb-8">最新消息區域設置</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-4">
                    <input 
                      type="checkbox" 
                      id="sync_news_banner"
                      checked={settings.sync_news_banner}
                      onChange={(e) => setSettings({ ...settings, sync_news_banner: e.target.checked })}
                      className="w-5 h-5 rounded-lg border-stone-200 text-[#707040] focus:ring-[#707040]/20 cursor-pointer"
                    />
                    <label htmlFor="sync_news_banner" className="text-sm font-bold text-stone-600 cursor-pointer">
                      同步使用首頁 Banner (節省空間)
                    </label>
                  </div>

                  {!settings.sync_news_banner ? (
                    <ImageUploader 
                      label="最新消息區域 Banner"
                      value={settings.news_image_url}
                      onChange={(url) => setSettings({ ...settings, news_image_url: url })}
                      aspectRatio="aspect-video"
                      hint="建議 1200x600"
                      bucket="products"
                      pathPrefix="news"
                    />
                  ) : (
                    <div className="aspect-video rounded-[2rem] overflow-hidden border border-stone-100 relative group">
                      <img 
                        src={getStorageUrl(settings.banner_url)} 
                        alt="Synced Banner" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                        <p className="text-white font-bold tracking-widest text-sm">已連動至首頁 Banner</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-8">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">排版方式</h4>
                  <div className="flex gap-6">
                    {[
                      { id: 'grid', label: '網格佈局', icon: <Layout size={24} /> },
                      { id: 'list', label: '列表佈局', icon: <Layout size={24} className="rotate-90" /> },
                    ].map((layout) => (
                      <button
                        key={layout.id}
                        onClick={() => setSettings({ ...settings, news_layout: layout.id as 'grid' | 'list' })}
                        className={`flex-1 p-8 rounded-[2rem] border-2 transition-all text-center space-y-4 ${
                          settings.news_layout === layout.id 
                            ? 'border-[#707040] bg-[#707040]/5 text-[#707040]' 
                            : 'border-stone-100 bg-white text-stone-400 hover:border-stone-200'
                        }`}
                      >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                          {layout.icon}
                        </div>
                        <p className="text-sm font-bold tracking-widest">{layout.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 4. Meet Miye Page Config */}
        {activeTab === 'about-meet' && (
          <div className="p-12 space-y-12">
            <div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">【遇見覓野】編輯器</h3>
              <p className="text-stone-400 text-xs">修改關於我們基本簡介、起源故事、圖片與品牌願景大宣言。</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">小副標題</label>
                    <input 
                      type="text" 
                      value={settings.meet_miye_subtitle || ''}
                      onChange={(e) => setSettings({ ...settings, meet_miye_subtitle: e.target.value })}
                      className="w-full px-5 py-3.5 bg-stone-50 border-none rounded-xl text-stone-800 font-semibold focus:ring-2 focus:ring-[#707040]/20 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">頁面大標題</label>
                    <input 
                      type="text" 
                      value={settings.meet_miye_title || ''}
                      onChange={(e) => setSettings({ ...settings, meet_miye_title: e.target.value })}
                      className="w-full px-5 py-3.5 bg-stone-50 border-none rounded-xl text-stone-800 font-semibold focus:ring-2 focus:ring-[#707040]/20 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">簡短介紹 (引導段落)</label>
                  <textarea 
                    rows={3}
                    value={settings.meet_miye_short_desc || ''}
                    onChange={(e) => setSettings({ ...settings, meet_miye_short_desc: e.target.value })}
                    className="w-full px-5 py-3.5 bg-stone-50 border-none rounded-xl text-stone-600 focus:ring-2 focus:ring-[#707040]/20 text-xs resize-none leading-relaxed"
                  />
                </div>

                <div className="h-[1px] bg-stone-100" />

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-stone-700">起源故事內容</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">故事小標章</label>
                    <input 
                      type="text" 
                      value={settings.meet_miye_origin_tagline || ''}
                      onChange={(e) => setSettings({ ...settings, meet_miye_origin_tagline: e.target.value })}
                      className="w-full px-5 py-3.5 bg-stone-50 border-none rounded-xl text-stone-800 focus:ring-2 focus:ring-[#707040]/20 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">故事主觀點</label>
                    <input 
                      type="text" 
                      value={settings.meet_miye_origin_title || ''}
                      onChange={(e) => setSettings({ ...settings, meet_miye_origin_title: e.target.value })}
                      className="w-full px-5 py-3.5 bg-stone-50 border-none rounded-xl text-stone-800 focus:ring-2 focus:ring-[#707040]/20 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">故事內文段落 01</label>
                    <textarea 
                      rows={4}
                      value={settings.meet_miye_origin_text1 || ''}
                      onChange={(e) => setSettings({ ...settings, meet_miye_origin_text1: e.target.value })}
                      className="w-full px-5 py-3.5 bg-stone-50 border-none rounded-xl text-stone-600 focus:ring-2 focus:ring-[#707040]/20 text-xs resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">故事內文段落 02</label>
                    <textarea 
                      rows={4}
                      value={settings.meet_miye_origin_text2 || ''}
                      onChange={(e) => setSettings({ ...settings, meet_miye_origin_text2: e.target.value })}
                      className="w-full px-5 py-3.5 bg-stone-50 border-none rounded-xl text-stone-600 focus:ring-2 focus:ring-[#707040]/20 text-xs resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <ImageUploader 
                  label="起源簡介右側插圖"
                  value={settings.meet_miye_image_url || ''}
                  onChange={(url) => setSettings({ ...settings, meet_miye_image_url: url })}
                  aspectRatio="aspect-[4/5]"
                  hint="建議上傳寬高比 4:5 的高清圖片"
                  bucket="products"
                  pathPrefix="about"
                />

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1 font-serif">品牌願景（底部金句宣示）</label>
                  <textarea 
                    rows={4}
                    value={settings.meet_miye_vision || ''}
                    onChange={(e) => setSettings({ ...settings, meet_miye_vision: e.target.value })}
                    className="w-full px-5 py-4 bg-[#707040]/5 border-none rounded-xl text-stone-700 focus:ring-2 focus:ring-[#707040]/20 text-xs resize-none font-serif font-medium leading-loose"
                  />
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-stone-100 my-8" />

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-stone-800 mb-1">我們的五大堅持 (Our Commitments)</h4>
                <p className="text-stone-400 text-xs">設定前台「我們的五大堅持」區塊，可自訂五個堅持項目的圖示、標題與說明內文。</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
                {(settings.meet_miye_commitments || []).map((commitment, idx) => (
                  <div key={idx} className="p-5 bg-stone-50/50 rounded-2xl border border-stone-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#707040] bg-[#707040]/10 px-2 py-0.5 rounded-full">
                        堅持 {idx + 1}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-stone-400">選擇圖示</label>
                      <select
                        value={commitment.icon}
                        onChange={(e) => {
                          const newCommitments = [...(settings.meet_miye_commitments || [])];
                          newCommitments[idx] = { ...newCommitments[idx], icon: e.target.value };
                          setSettings({ ...settings, meet_miye_commitments: newCommitments });
                        }}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-800 text-xs font-semibold focus:ring-1 focus:ring-[#707040]"
                      >
                        <option value="Mountain">高山 (Mountain)</option>
                        <option value="Leaf">茶葉 (Leaf)</option>
                        <option value="Award">獎章 (Award)</option>
                        <option value="Shield">盾牌 (Shield)</option>
                        <option value="Users">合作 (Users)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-stone-400">堅持標題</label>
                      <input
                        type="text"
                        value={commitment.title}
                        onChange={(e) => {
                          const newCommitments = [...(settings.meet_miye_commitments || [])];
                          newCommitments[idx] = { ...newCommitments[idx], title: e.target.value };
                          setSettings({ ...settings, meet_miye_commitments: newCommitments });
                        }}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-800 text-xs font-semibold focus:ring-1 focus:ring-[#707040]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-stone-400">堅持說明</label>
                      <textarea
                        rows={4}
                        value={commitment.text}
                        onChange={(e) => {
                          const newCommitments = [...(settings.meet_miye_commitments || [])];
                          newCommitments[idx] = { ...newCommitments[idx], text: e.target.value };
                          setSettings({ ...settings, meet_miye_commitments: newCommitments });
                        }}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-600 text-xs resize-none leading-relaxed focus:ring-1 focus:ring-[#707040]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. Coexistence & Eco-pond Cards Config */}
        {activeTab === 'about-coexist' && (
          <div className="p-12 space-y-12">
            <div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">【萬物共生】編輯器</h3>
              <p className="text-stone-400 text-xs">設定共生首頁導標、自然農法 3 大卡片內容、以及自由「新增、刪除、及卡片排序」的多功能生態大觀園圖鑑。</p>
            </div>

            {/* Base Texts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-stone-50 p-8 rounded-[2rem] border border-stone-100">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-stone-700">核心標題設定</h4>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">英文促銷章</label>
                  <input 
                    type="text" 
                    value={settings.coexistence_subtitle || ''}
                    onChange={(e) => setSettings({ ...settings, coexistence_subtitle: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-stone-200/60 rounded-xl text-stone-800 text-xs focus:ring-2 focus:ring-[#707040]/10 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">主標題</label>
                  <input 
                    type="text" 
                    value={settings.coexistence_title || ''}
                    onChange={(e) => setSettings({ ...settings, coexistence_title: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-stone-200/60 rounded-xl text-stone-800 text-xs focus:ring-2 focus:ring-[#707040]/10 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1 font-serif">理念引導核心內文</label>
                  <textarea 
                    rows={3}
                    value={settings.coexistence_desc || ''}
                    onChange={(e) => setSettings({ ...settings, coexistence_desc: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-stone-200/60 rounded-xl text-stone-500 text-xs focus:ring-2 focus:ring-[#707040]/10 outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-stone-700">區塊 A (茶草共生) 段標</h4>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">區塊 A 副標題</label>
                  <input 
                    type="text" 
                    value={settings.coexistence_section_subtitle || ''}
                    onChange={(e) => setSettings({ ...settings, coexistence_section_subtitle: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-stone-200/60 rounded-xl text-stone-800 text-xs focus:ring-2 focus:ring-[#707040]/10 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">區塊 A 主標題</label>
                  <input 
                    type="text" 
                    value={settings.coexistence_section_title || ''}
                    onChange={(e) => setSettings({ ...settings, coexistence_section_title: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-stone-200/60 rounded-xl text-stone-800 text-xs focus:ring-2 focus:ring-[#707040]/10 outline-none"
                  />
                </div>
              </div>
            </div>

            <hr className="border-stone-100" />

            {/* Background Audio Management Section */}
            <section className="bg-stone-50 rounded-[2rem] border border-stone-100 p-8 space-y-6">
              <div>
                <h4 className="text-base font-bold text-stone-800 mb-1 flex items-center gap-2">
                  <Music className="text-[#707040]" size={18} />
                  背景音訊工作區（茶園環境音）
                </h4>
                <p 
                  className="upload-hint helper-text text-sm text-[#4b5563] font-normal leading-normal mt-1.5 ml-1"
                  style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5', marginTop: '6px', fontWeight: '400' }}
                >
                  設定與上傳此頁面專屬的自然背景音訊特色檔案（支援 .mp3、.wav、.m4a 格式，檔案大小限 15MB 內）。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Audio Upload Widget */}
                <div className="space-y-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">音訊檔案上傳</span>
                  
                  {settings.coexistence_bg_audio ? (
                    // Uploaded audio preview & player and delete button
                    <div className="bg-white p-6 rounded-2xl border border-stone-200/60 flex flex-col gap-4">
                      <div className="flex items-center gap-4 justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#707040]/10 rounded-xl flex items-center justify-center text-[#707040]">
                            <Music size={18} />
                          </div>
                          <div className="text-left">
                            <h5 className="text-xs font-bold text-stone-700 truncate max-w-[200px]">
                              {settings.coexistence_bg_audio.split('/').pop() || '茶園自然背景音訊'}
                            </h5>
                            <p className="text-[10px] text-stone-400 font-mono">已就緒</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const oldAudio = settings.coexistence_bg_audio;
                              if (window.confirm('確定要移除此背景音訊檔案嗎？')) {
                                setSettings({ ...settings, coexistence_bg_audio: '' });
                                await deleteFile(oldAudio, 'products');
                                toast.success('已移除音訊設定，請點擊儲存變更');
                              }
                            }}
                            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all animate-none duration-150"
                            title="刪除音訊"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Client Side Audio Playback Tester */}
                      <div className="bg-[#707040]/5 rounded-xl p-3 flex items-center gap-3 justify-between">
                        <span className="text-[10px] font-medium text-[#707040] font-serif italic">管理員試聽控制器</span>
                        <audio 
                          src={getStorageUrl(settings.coexistence_bg_audio)} 
                          controls 
                          className="h-8 max-w-full scale-90 mx-auto outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    // Drop/click block to upload new audio
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          const ext = file.name.split('.').pop()?.toLowerCase();
                          if (!['mp3', 'wav', 'm4a'].includes(ext || '')) {
                            toast.error('僅支援上傳 .mp3, .wav, .m4a 格式音訊');
                            return;
                          }
                          if (file.size > 15 * 1024 * 1024) {
                            toast.error('檔案大小超出 15MB 限制，請壓縮後再次上傳！');
                            return;
                          }
                          const loadingToast = toast.loading('上傳音訊檔案中...');
                          try {
                            const publicPath = await uploadImage(file, 'products', 'bg_audios');
                            setSettings({ ...settings, coexistence_bg_audio: publicPath });
                            toast.success('音訊上傳成功！別忘了點選右上角「儲存變更」儲存！', { id: loadingToast });
                          } catch (err: any) {
                            console.error(err);
                            toast.error('音訊上傳失敗：' + (err.message || '未知錯誤'), { id: loadingToast });
                          }
                        }
                      }}
                      onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'audio/*';
                        fileInput.onchange = async (event: any) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            const ext = file.name.split('.').pop()?.toLowerCase();
                            if (!['mp3', 'wav', 'm4a'].includes(ext || '')) {
                              toast.error('僅支援上傳 .mp3, .wav, .m4a 格式音訊');
                              return;
                            }
                            if (file.size > 15 * 1024 * 1024) {
                              toast.error('檔案大小超出 15MB 限制，請壓縮後再次上傳！');
                              return;
                            }
                            const loadingToast = toast.loading('上傳音訊檔案中...');
                            try {
                              const publicPath = await uploadImage(file, 'products', 'bg_audios');
                              setSettings({ ...settings, coexistence_bg_audio: publicPath });
                              toast.success('音訊上傳成功！別忘了點選右上角「儲存變更」儲存！', { id: loadingToast });
                            } catch (err: any) {
                              console.error(err);
                              toast.error('音訊上傳失敗：' + (err.message || '未知錯誤'), { id: loadingToast });
                            }
                          }
                        };
                        fileInput.click();
                      }}
                      className="border-2 border-dashed border-stone-200 hover:border-[#707040] hover:bg-[#707040]/5 transition-all bg-white py-8 px-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer text-stone-400 hover:text-[#707040] group select-none h-[142px]"
                    >
                      <Music className="w-8 h-8 opacity-40 group-hover:opacity-100 transition-opacity mb-2" />
                      <p className="text-xs font-bold text-stone-600 group-hover:text-[#707040]">
                        點擊選擇音訊 或 拖放音訊
                      </p>
                      <p 
                        className="upload-hint helper-text text-sm text-[#4b5563] font-normal leading-normal mt-1.5"
                        style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5', marginTop: '6px', fontWeight: '400' }}
                      >
                        支援 MP3, WAV, M4A 格式（最大限制 15MB）
                      </p>
                    </div>
                  )}
                </div>

                {/* Audio Parameters Control Settings */}
                <div className="space-y-4 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">聲音基本控制設定</span>
                  
                  <div className="space-y-4">
                    {/* Autoplay Switch */}
                    <label className="flex items-center gap-3.5 bg-white p-5 rounded-2xl border border-stone-100/60 shadow-sm cursor-pointer hover:border-stone-200 transition-all">
                      <input
                        type="checkbox"
                        checked={settings.coexistence_audio_autoplay !== false}
                        onChange={(e) => setSettings({ ...settings, coexistence_audio_autoplay: e.target.checked })}
                        className="w-5 h-5 rounded border-stone-200 text-[#707040] focus:ring-[#707040]/20 cursor-pointer"
                      />
                      <div className="text-left select-none">
                        <span className="text-xs font-bold text-stone-700 block mb-0.5">自動播放開關 (Autoplay)</span>
                        <span className="text-[10.5px] text-stone-400 tracking-wide block leading-normal">
                          啟用後尋茶人進入『萬物共生』頁面會自動播放，預設為有聲啟動。若受瀏覽器限制，將於尋茶人點擊頁面任意處、或滾動畫面後立即恢復聲音播放。
                        </span>
                      </div>
                    </label>

                    {/* Loop Switch */}
                    <label className="flex items-center gap-3.5 bg-white p-5 rounded-2xl border border-stone-100/60 shadow-sm cursor-pointer hover:border-stone-200 transition-all">
                      <input
                        type="checkbox"
                        checked={settings.coexistence_audio_loop !== false}
                        onChange={(e) => setSettings({ ...settings, coexistence_audio_loop: e.target.checked })}
                        className="w-5 h-5 rounded border-stone-200 text-[#707040] focus:ring-[#707040]/20 cursor-pointer"
                      />
                      <div className="text-left select-none">
                        <span className="text-xs font-bold text-stone-700 block mb-0.5">循環播放開關 (Loop)</span>
                        <span className="text-[10.5px] text-stone-400 tracking-wide block">
                          啟用後音訊在播送完畢時，會循環不中斷播放。
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-stone-100" />

            {/* Block A: 3 Cards Editor */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-stone-800">茶草共生 3 大關鍵支柱編輯</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {(settings.coexistence_cards || []).map((card, idx) => (
                  <div key={idx} className="p-6 bg-stone-50 rounded-2xl border border-stone-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full uppercase">支柱 {idx+1}</span>
                      <span className="text-[10px] text-stone-400 font-mono">ICON CODE: {card.icon}</span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-stone-400">大卡標題</label>
                        <input 
                          type="text" 
                          value={card.title}
                          onChange={(e) => {
                            const cards = [...settings.coexistence_cards];
                            cards[idx].title = e.target.value;
                            setSettings({ ...settings, coexistence_cards: cards });
                          }}
                          className="w-full px-3 py-2 bg-white border border-stone-200/60 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#707040]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-stone-400">印章標籤</label>
                        <input 
                          type="text" 
                          value={card.label}
                          onChange={(e) => {
                            const cards = [...settings.coexistence_cards];
                            cards[idx].label = e.target.value;
                            setSettings({ ...settings, coexistence_cards: cards });
                          }}
                          className="w-full px-3 py-2 bg-white border border-stone-200/60 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#707040]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-stone-400">支柱核心說明</label>
                        <textarea 
                          rows={4}
                          value={card.desc}
                          onChange={(e) => {
                            const cards = [...settings.coexistence_cards];
                            cards[idx].desc = e.target.value;
                            setSettings({ ...settings, coexistence_cards: cards });
                          }}
                          className="w-full px-3 py-2 bg-white border border-stone-200/60 rounded-xl text-stone-500 text-xs resize-none leading-relaxed focus:ring-1 focus:ring-[#707040]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-stone-100" />

            {/* Block B: specimens Botanical list manager */}
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-stone-800">生態大觀園 (生物與花草圖鑑卡片) 管理領域</h4>
                  <p className="text-xs text-stone-400">支援卡片重排序與自訂管理。每張卡片包含【卡片預覽圖】、【卡片短標語 (20字內)】、【自然定位 (Role)】與【共生故事 (Story & Value)】。</p>
                </div>
                <button
                  onClick={addSpecimen}
                  className="flex items-center gap-1.5 bg-[#707040] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[#5c5c32] active:scale-95 transition-all shadow-sm"
                >
                  <Plus size={14} /> 新增生態卡片
                </button>
              </div>

              {(!settings.specimens || settings.specimens.length === 0) ? (
                <div className="text-center py-16 bg-stone-50 border border-dashed border-stone-200 rounded-[2rem] text-stone-400 font-light text-xs">
                  目前生物圖鑑為空。點擊右上方「+ 新增生態卡片」進行自主建立！
                </div>
              ) : (
                <div className="space-y-6">
                  {settings.specimens.map((specimen, idx) => (
                    <div 
                      key={specimen.id || idx} 
                      className="p-8 bg-stone-50 border border-stone-100/60 rounded-[2rem] flex flex-col lg:flex-row gap-8 items-start relative group shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Left: Sorting & Actions */}
                      <div className="flex lg:flex-col gap-2 shrink-0">
                        <button
                          disabled={idx === 0}
                          onClick={() => moveSpecimen(idx, 'up')}
                          className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-[#707040]/10 hover:text-[#707040] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="向上移"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          disabled={idx === settings.specimens.length - 1}
                          onClick={() => moveSpecimen(idx, 'down')}
                          className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-[#707040]/10 hover:text-[#707040] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="向下移"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          onClick={() => removeSpecimen(idx)}
                          className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                          title="刪除"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Middle Left: Image Uploader */}
                      <div className="w-full sm:w-[150px] shrink-0">
                        <ImageUploader 
                          label="卡片預覽圖"
                          value={specimen.image}
                          onChange={(url) => {
                            const specs = [...settings.specimens];
                            specs[idx].image = url;
                            setSettings({ ...settings, specimens: specs });
                          }}
                          aspectRatio="aspect-square"
                          hint="建議 1:1 比例"
                          bucket="products"
                          pathPrefix="specimens"
                        />
                      </div>

                      {/* Middle Right: Fields inputs */}
                      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-stone-500">生態物種名稱 (標題)</label>
                              <input 
                                type="text"
                                value={specimen.name}
                                onChange={(e) => {
                                  const specs = [...settings.specimens];
                                  specs[idx].name = e.target.value;
                                  setSettings({ ...settings, specimens: specs });
                                }}
                                className="w-full px-4 py-2.5 bg-white border border-stone-200/60 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#707040]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-stone-500">卡片短標語 (20字內，需具備懸念)</label>
                              <input 
                                type="text"
                                value={specimen.scientificName}
                                onChange={(e) => {
                                  const specs = [...settings.specimens];
                                  specs[idx].scientificName = e.target.value;
                                  setSettings({ ...settings, specimens: specs });
                                }}
                                className="w-full px-4 py-2.5 bg-white border border-stone-200/60 rounded-xl text-xs font-medium focus:ring-1 focus:ring-[#707040]"
                                placeholder="如：不開花卻默默穩住表土的奇兵..."
                                maxLength={20}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-stone-500">生物分類</label>
                              <select
                                value={specimen.category}
                                onChange={(e) => {
                                  const specs = [...settings.specimens];
                                  specs[idx].category = e.target.value as 'flora' | 'fauna';
                                  setSettings({ ...settings, specimens: specs });
                                }}
                                className="w-full px-4 py-2.5 bg-white border border-stone-200/60 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#707040]"
                              >
                                <option value="flora">茶園護航百草 (Flora)</option>
                                <option value="fauna">茶地守護動物 (Fauna)</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-stone-500">自然定位 (Role)</label>
                              <input 
                                type="text"
                                value={specimen.role}
                                onChange={(e) => {
                                  const specs = [...settings.specimens];
                                  specs[idx].role = e.target.value;
                                  setSettings({ ...settings, specimens: specs });
                                }}
                                className="w-full px-4 py-2.5 bg-white border border-stone-200/60 rounded-xl text-xs focus:ring-1 focus:ring-[#707040]"
                                placeholder="如：池畔蜜源植物，天然香氣屏障"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-500">共生故事 (Story & Value)</label>
                          <textarea 
                            rows={4}
                            value={specimen.desc}
                            onChange={(e) => {
                              const specs = [...settings.specimens];
                              specs[idx].desc = e.target.value;
                              setSettings({ ...settings, specimens: specs });
                            }}
                            className="w-full px-4 py-3 bg-white border border-stone-200/60 rounded-xl text-xs text-stone-600 resize-none leading-relaxed focus:ring-1 focus:ring-[#707040]"
                            placeholder="在此描述該物種的共生故事，它如何默默守護茶地與大自然和諧共存..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Cats Daily &Duties Config */}
        {activeTab === 'about-cat' && (
          <div className="p-12 space-y-12">
            <div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">【店長日常】專屬舞台編輯器</h3>
              <p className="text-stone-400 text-xs">設定貓咪店長「暖暖」的專屬背景大圖、職稱學歷、簡歷要點條目、以及三大代表任務的文字說明。</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <ImageUploader 
                  label="店長貓生活大 Banner (1920 × 1080 像素，支援 RWD)"
                  value={settings.cat_banner_url || ''}
                  onChange={(url) => setSettings({ ...settings, cat_banner_url: url })}
                  aspectRatio="aspect-video"
                  hint="請上傳 1920x1080 高清店長貓寫真"
                  bucket="products"
                  pathPrefix="banners"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">職位勳章徽章</label>
                    <input 
                      type="text" 
                      value={settings.cat_manager_badge || ''}
                      onChange={(e) => setSettings({ ...settings, cat_manager_badge: e.target.value })}
                      className="w-full px-4 py-2.5 bg-stone-50 border-none rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#707040]/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">督工頁面標題</label>
                    <input 
                      type="text" 
                      value={settings.cat_manager_title || ''}
                      onChange={(e) => setSettings({ ...settings, cat_manager_title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-stone-50 border-none rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#707040]/10"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">店長店務宣言 (貓咪氣泡文字內容)</label>
                  <textarea 
                    rows={4}
                    value={settings.cat_manager_desc || ''}
                    onChange={(e) => setSettings({ ...settings, cat_manager_desc: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl text-xs text-stone-700 focus:ring-2 focus:ring-[#707040]/10 resize-none leading-relaxed"
                  />
                </div>

                <div className="h-[1px] bg-stone-100" />

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-stone-700">店長詳細萌寵履歷背景</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-stone-400">大簡介副標</label>
                      <input 
                        type="text" 
                        value={settings.cat_manager_credentials_tag || ''}
                        onChange={(e) => setSettings({ ...settings, cat_manager_credentials_tag: e.target.value })}
                        className="w-full px-4 py-2.5 bg-stone-50 border-none rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-stone-400">店長官位官職</label>
                      <input 
                        type="text" 
                        value={settings.cat_manager_role_title || ''}
                        onChange={(e) => setSettings({ ...settings, cat_manager_role_title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-stone-50 border-none rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-stone-400">貓咪中文本名</label>
                      <input 
                        type="text" 
                        value={settings.cat_manager_feline_title || ''}
                        onChange={(e) => setSettings({ ...settings, cat_manager_feline_title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-stone-50 border-none rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 ml-1">履歷第二段落主說辭</label>
                    <textarea 
                      rows={4}
                      value={settings.cat_manager_body_desc || ''}
                      onChange={(e) => setSettings({ ...settings, cat_manager_body_desc: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl text-xs text-stone-600 focus:ring-2 focus:ring-[#707040]/10 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Duties and Profile points */}
              <div className="space-y-6 bg-stone-50/70 p-8 rounded-[2rem] border border-stone-100">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-stone-800">基本履歷卡條目清單</label>
                    <button
                      onClick={handleAddFelineResume}
                      className="text-[10px] font-bold text-[#707040] hover:underline"
                    >
                      + 新增項目
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {(settings.cat_manager_profile_items || []).map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input 
                          type="text"
                          value={item}
                          onChange={(e) => handleEditFelineResume(index, e.target.value)}
                          className="flex-1 px-4 py-2 bg-white border border-stone-200 rounded-xl text-xs"
                        />
                        <button
                          onClick={() => handleRemoveFelineResume(index)}
                          className="p-2 text-stone-300 hover:text-red-500 rounded-lg transition-colors"
                          title="刪除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-stone-100/80 my-4" />

                <div className="space-y-6">
                  <h4 className="text-xs font-extrabold text-[#707040] tracking-widest uppercase">店長巡守三大主職責說明</h4>
                  
                  {(settings.cat_manager_duties || []).map((duty, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-stone-100/50 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[10px] font-bold text-[#707040]">任務序號 {idx+1}</span>
                        <span className="text-[10px] text-stone-400 font-mono">圖示代碼: {duty.icon}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <input 
                          type="text"
                          value={duty.title}
                          onChange={(e) => {
                            const dts = [...settings.cat_manager_duties];
                            dts[idx].title = e.target.value;
                            setSettings({ ...settings, cat_manager_duties: dts });
                          }}
                          placeholder="任務標題"
                          className="w-full px-3 py-1.5 bg-stone-50 border-none rounded-lg text-xs font-bold"
                        />
                        <textarea 
                          rows={2}
                          value={duty.desc}
                          onChange={(e) => {
                            const dts = [...settings.cat_manager_duties];
                            dts[idx].desc = e.target.value;
                            setSettings({ ...settings, cat_manager_duties: dts });
                          }}
                          placeholder="任務細則說明"
                          className="w-full px-3 py-2 bg-stone-50 border-none rounded-lg text-xs leading-relaxed text-stone-500 h-16 resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. System User Avatars Config */}
        {activeTab === 'avatars' && settings && (
          <div className="p-12 space-y-12">
            <section>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-lg font-bold text-stone-800">系統頭像管理</h3>
                  <p className="text-sm text-stone-400">上傳固定的頭像供消費者選擇。您可以拖曳圖片來調整順序。</p>
                </div>
              </div>

              <div className="mb-8 space-y-4">
                <label className="text-sm font-medium text-stone-600">選擇頭像說明文字</label>
                <textarea
                  value={settings.avatar_selection_description}
                  onChange={(e) => setSettings({ ...settings, avatar_selection_description: e.target.value })}
                  className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-[#707040]/20 outline-none transition-all text-stone-800 min-h-[100px] resize-none"
                  placeholder="例如：選擇一個您喜歡的風格作為頭像"
                />
              </div>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  <SortableContext
                    items={settings.system_avatars.map(a => a.url)}
                    strategy={rectSortingStrategy}
                  >
                    {settings.system_avatars.map((avatar, i) => (
                      <SortableAvatar
                        key={avatar.url}
                        url={avatar.url}
                        name={avatar.name}
                        index={i}
                        getAvatarUrl={getAvatarUrl}
                        onRemove={async (index) => {
                          const avatar = settings.system_avatars[index];
                          if (avatar && avatar.url) {
                            await deleteFile(avatar.url, 'products');
                          }
                          const newAvatars = settings.system_avatars.filter((_, idx) => idx !== index);
                          setSettings({ ...settings, system_avatars: newAvatars });
                        }}
                        onNameChange={(index, name) => {
                          const newAvatars = [...settings.system_avatars];
                          newAvatars[index] = { ...newAvatars[index], name };
                          setSettings({ ...settings, system_avatars: newAvatars });
                        }}
                      />
                    ))}
                  </SortableContext>
                  
                  <div className="aspect-square">
                    <ImageUploader 
                      label=""
                      value=""
                      onChange={(url) => {
                        if (url) {
                          setSettings({
                            ...settings,
                            system_avatars: [...settings.system_avatars, { url, name: '' }]
                          });
                        }
                      }}
                      aspectRatio="aspect-square"
                      hint="建議 500x500"
                      bucket="products"
                      pathPrefix="avatars"
                      useOriginalName={true}
                    />
                  </div>
                </div>
              </DndContext>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
