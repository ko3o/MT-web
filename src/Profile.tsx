import React, { useState, useEffect } from 'react';
import { supabase } from './db';
import { useAuth } from './AuthContext';
import { Save, User, Phone, MapPin, Mail, Calendar, ArrowLeft, Package, Camera, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSettings, AvatarItem } from './services/settingsService';
import { getAvatarUrl } from './services/productService';

const TAIWAN_CITIES: Record<string, string[]> = {
  '台北市': ['中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'],
  '新北市': ['板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區', '汐止區', '瑞芳區', '土城區', '蘆洲區', '五股區', '泰山區', '林口區', '深坑區', '石碇區', '坪林區', '三芝區', '石門區', '八里區', '平溪區', '雙溪區', '貢寮區', '金山區', '萬里區', '烏來區'],
  '桃園市': ['桃園區', '中壢區', '大溪區', '楊梅區', '蘆竹區', '大園區', '龜山區', '八德區', '龍潭區', '平鎮區', '新屋區', '觀音區', '復興區'],
  '台中市': ['中區', '東區', '南區', '西區', '北區', '北屯區', '西屯區', '南屯區', '太平區', '大里區', '霧峰區', '烏日區', '豐原區', '後里區', '石岡區', '東勢區', '和平區', '新社區', '潭子區', '大雅區', '神岡區', '大肚區', '沙鹿區', '龍井區', '梧棲區', '清水區', '大甲區', '外埔區', '大安區'],
  '台南市': ['中西區', '東區', '南區', '北區', '安平區', '安南區', '永康區', '歸仁區', '新化區', '左鎮區', '玉井區', '楠西區', '南化區', '仁德區', '關廟區', '龍崎區', '官田區', '麻豆區', '佳里區', '西港區', '七股區', '將軍區', '學甲區', '北門區', '新營區', '後壁區', '白河區', '東山區', '六甲區', '下營區', '柳營區', '鹽水區', '善化區', '大內區', '山上區', '新市區', '安定區'],
  '高雄市': ['新興區', '前金區', '苓雅區', '鹽埕區', '鼓山區', '旗津區', '前鎮區', '三民區', '楠梓區', '小港區', '左營區', '仁武區', '大社區', '岡山區', '路竹區', '阿蓮區', '田寮區', '燕巢區', '橋頭區', '梓官區', '彌陀區', '永安區', '湖內區', '鳳山區', '大寮區', '林園區', '鳥松區', '大樹區', '旗山區', '美濃區', '六龜區', '內門區', '杉林區', '甲仙區', '桃源區', '那瑪夏區', '茂林區', '茄萣區'],
  '基隆市': ['仁愛區', '信義區', '中正區', '中山區', '安樂區', '暖暖區', '七堵區'],
  '新竹市': ['東區', '北區', '香山區'],
  '新竹縣': ['竹北市', '竹東鎮', '新埔鎮', '關西鎮', '湖口鄉', '新豐鄉', '芎林鄉', '橫山鄉', '北埔鄉', '寶山鄉', '峨眉鄉', '尖石鄉', '五峰鄉'],
  '苗栗縣': ['苗栗市', '頭份市', '竹南鎮', '後龍鎮', '通霄鎮', '苑裡鎮', '卓蘭鎮', '造橋鄉', '西湖鄉', '頭屋鄉', '公館鄉', '銅鑼鄉', '三義鄉', '大湖鄉', '獅潭鄉', '三灣鄉', '南庄鄉', '泰安鄉'],
  '彰化縣': ['彰化市', '員林市', '和美鎮', '鹿港鎮', '溪湖鎮', '二林鎮', '田中鎮', '北斗鎮', '花壇鄉', '芬園鄉', '大村鄉', '永靖鄉', '伸港鄉', '線西鄉', '福興鄉', '秀水鄉', '埔心鄉', '埔鹽鄉', '大城鄉', '芳苑鄉', '竹塘鄉', '溪州鄉', '埤頭鄉', '二水鄉', '社頭鄉', '田尾鄉'],
  '南投縣': ['南投市', '埔里鎮', '草屯鎮', '竹山鎮', '集集鎮', '名間鄉', '鹿谷鄉', '中寮鄉', '魚池鄉', '國姓鄉', '水里鄉', '信義鄉', '仁愛鄉'],
  '雲林縣': ['斗六市', '斗南鎮', '虎尾鎮', '西螺鎮', '土庫鎮', '北港鎮', '古坑鄉', '大埤鄉', '莿桐鄉', '林內鄉', '二崙鄉', '崙背鄉', '麥寮鄉', '東勢鄉', '褒忠鄉', '台西鄉', '元長鄉', '四湖鄉', '口湖鄉', '水林鄉'],
  '嘉義市': ['東區', '西區'],
  '嘉義縣': ['太保市', '朴子市', '布袋鎮', '大林鎮', '民雄鄉', '溪口鄉', '新港鄉', '六腳鄉', '東石鄉', '義竹鄉', '鹿草鄉', '水上鄉', '中埔鄉', '竹崎鄉', '梅山鄉', '番路鄉', '大埔鄉', '阿里山鄉'],
  '屏東縣': ['屏東市', '潮州鎮', '東港鎮', '恆春鎮', '萬丹鄉', '長治鄉', '麟洛鄉', '九如鄉', '里港鄉', '高樹鄉', '鹽埔鄉', '內埔鄉', '竹田鄉', '竹田鄉', '萬巒鄉', '內埔鄉', '新園鄉', '崁頂鄉', '林邊鄉', '南州鄉', '佳冬鄉', '琉球鄉', '車城鄉', '滿州鄉', '枋寮鄉', '枋山鄉', '三地門鄉', '霧臺鄉', '瑪家鄉', '泰武鄉', '來義鄉', '春日鄉', '獅子鄉', '牡丹鄉'],
  '宜蘭縣': ['宜蘭市', '羅東鎮', '蘇澳鎮', '頭城鎮', '礁溪鄉', '壯圍鄉', '員山鄉', '冬山鄉', '五結鄉', '三星鄉', '大同鄉', '南澳鄉'],
  '花蓮縣': ['花蓮市', '鳳林鎮', '玉里鎮', '新城鄉', '吉安鄉', '壽豐鄉', '光復鄉', '豐濱鄉', '瑞穗鄉', '富里鄉', '秀林鄉', '萬榮鄉', '卓溪鄉'],
  '台東縣': ['台東市', '成功鎮', '關山鎮', '卑南鄉', '鹿野鄉', '池上鄉', '東河鄉', '長濱鄉', '太麻里鄉', '大武鄉', '綠島鄉', '海端鄉', '延平鄉', '金峰鄉', '達仁鄉', '蘭嶼鄉'],
  '澎湖縣': ['馬公市', '湖西鄉', '白沙鄉', '西嶼鄉', '望安鄉', '七美鄉'],
  '金門縣': ['金城鎮', '金湖鎮', '金沙鎮', '金寧鄉', '烈嶼鄉', '烏坵鄉'],
  '連江縣': ['南竿鄉', '北竿鄉', '莒光鄉', '東引鄉'],
};

export const Profile: React.FC = () => {
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [systemAvatars, setSystemAvatars] = useState<AvatarItem[]>([]);
  const [avatarDescription, setAvatarDescription] = useState('選擇一個您喜歡的風格作為頭像');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>('');

  const [profile, setProfile] = useState({
    full_name: '',
    customer_phone: '',
    gender: 'other',
    address: '',
    city: '台北市',
    district: '中正區',
    avatar_url: '',
  });

  useEffect(() => {
    if (authProfile) {
      setProfile({
        full_name: authProfile.full_name || '',
        customer_phone: authProfile.customer_phone || '',
        gender: authProfile.gender || 'other',
        address: authProfile.address || '',
        city: authProfile.city || '台北市',
        district: authProfile.district || '中正區',
        avatar_url: authProfile.avatar_url || '',
      });
      setSelectedAvatarUrl(authProfile.avatar_url || '');
    }
    fetchSystemAvatars();
  }, [authProfile]);

  const fetchSystemAvatars = async () => {
    const settings = await getSettings();
    setSystemAvatars(settings.system_avatars || []);
    if (settings.avatar_selection_description) {
      setAvatarDescription(settings.avatar_selection_description);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSave triggered', { userId: user?.id, profile });
    if (!user) {
      console.error('No user found in handleSave');
      toast.error('請先登入');
      return;
    }
    setLoading(true);
    const saveToast = toast.loading('正在儲存變更...');

    try {
      console.log('Attempting to upsert profile:', { id: user.id, ...profile });
      
      // 使用與 handleAvatarConfirm 類似的邏輯，先 update 再 upsert
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error('Profile update error, trying upsert:', updateError);
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            ...profile,
            updated_at: new Date().toISOString(),
          });
        if (upsertError) throw upsertError;
      } else if (!data || data.length === 0) {
        console.log('No rows updated in handleSave, performing upsert');
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            ...profile,
            updated_at: new Date().toISOString(),
          });
        if (upsertError) throw upsertError;
      }

      console.log('Profile update successful');
      toast.success('個人資料已更新！', { id: saveToast });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await refreshProfile();
    } catch (err: any) {
      console.error('Profile update failed:', err);
      toast.error(`更新失敗: ${err.message || '請檢查資料庫權限'}`, { id: saveToast });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarConfirm = async () => {
    if (!user || !selectedAvatarUrl) {
      console.log('Missing user or selectedAvatarUrl', { user: !!user, selectedAvatarUrl });
      toast.error('請先選擇一個頭像');
      return;
    }
    
    setLoading(true);
    const loadingToast = toast.loading('正在更新頭像...');
    try {
      console.log('Attempting to update avatar:', { userId: user.id, url: selectedAvatarUrl });
      
      // 先嘗試更新，如果失敗（可能是因為記錄不存在）再嘗試 upsert
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: selectedAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error('Update error, trying upsert:', updateError);
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ 
            id: user.id,
            full_name: profile.full_name || '',
            customer_phone: profile.customer_phone || '',
            gender: profile.gender || 'other',
            address: profile.address || '',
            city: profile.city || '台北市',
            district: profile.district || '中正區',
            avatar_url: selectedAvatarUrl,
            updated_at: new Date().toISOString()
          });
        
        if (upsertError) throw upsertError;
      } else if (!data || data.length === 0) {
        // 如果 update 成功但沒有影響任何行，說明記錄不存在，執行 upsert
        console.log('No rows updated, performing upsert');
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ 
            id: user.id,
            full_name: profile.full_name || '',
            customer_phone: profile.customer_phone || '',
            gender: profile.gender || 'other',
            address: profile.address || '',
            city: profile.city || '台北市',
            district: profile.district || '中正區',
            avatar_url: selectedAvatarUrl,
            updated_at: new Date().toISOString()
          });
        if (upsertError) throw upsertError;
      }
      
      console.log('Avatar updated successfully in database');
      
      // 更新本地狀態
      setProfile(prev => ({ ...prev, avatar_url: selectedAvatarUrl }));
      
      // 關閉 Modal 並重新整理 Profile
      setIsAvatarModalOpen(false);
      toast.success('頭像已更新', { id: loadingToast });
      
      // 給資料庫一點時間同步，然後重新抓取
      setTimeout(async () => {
        await refreshProfile();
      }, 500);
      
    } catch (error: any) {
      console.error('Avatar update failed:', error);
      toast.error(`更新失敗: ${error.message || '請檢查資料庫權限'}`, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const districts = profile.city ? TAIWAN_CITIES[profile.city] || [] : [];

  return (
    <div className="max-w-5xl mx-auto py-20 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] shadow-2xl shadow-zen-wood/5 border border-zen-wood/5 overflow-hidden"
      >
        <div className="bg-zen-wood p-12 text-zen-cream relative overflow-hidden">
          <div className="relative z-10">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity mb-8"
            >
              <ArrowLeft size={14} /> 返回
            </button>
            <div className="flex items-center gap-8">
              <div 
                className="w-24 h-24 bg-zen-cream/10 backdrop-blur-md text-zen-cream rounded-3xl flex items-center justify-center border border-white/10 relative group cursor-pointer overflow-hidden"
                onClick={() => setIsAvatarModalOpen(true)}
              >
                {profile.avatar_url ? (
                  <img 
                    src={getAvatarUrl(profile.avatar_url) || ''} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User size={40} />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                  <Camera size={20} className="text-white mb-1" />
                  <span className="text-[8px] text-white font-bold leading-tight">點擊選擇<br/>個人化頭像</span>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-serif italic mb-2">個人資料設定</h1>
                <p className="text-stone-400 text-sm font-medium uppercase tracking-widest">管理您的帳號資訊與聯絡方式</p>
              </div>
            </div>
            <div className="absolute right-12 bottom-12">
              <button 
                onClick={() => navigate('/orders')}
                className="flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md text-zen-cream rounded-2xl font-medium uppercase tracking-widest text-xs hover:bg-white/20 transition-all border border-white/10"
              >
                <Package size={16} /> 我的訂單
              </button>
            </div>
          </div>
          {/* Decorative element */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-zen-green/10 rounded-full blur-3xl" />
        </div>

        <div className="p-12">
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-xs font-medium text-stone-400 uppercase tracking-widest ml-1">
                <User size={14} className="text-zen-green" /> 全名
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-zen-wood placeholder:text-stone-300"
                placeholder="請輸入您的真實姓名"
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 text-xs font-medium text-stone-400 uppercase tracking-widest ml-1">
                <Phone size={14} className="text-zen-green" /> 電話號碼
              </label>
              <input
                type="tel"
                value={profile.customer_phone}
                onChange={(e) => setProfile({ ...profile, customer_phone: e.target.value })}
                className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-zen-wood placeholder:text-stone-300"
                placeholder="0912-345-678"
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 text-xs font-medium text-stone-400 uppercase tracking-widest ml-1">
                <Calendar size={14} className="text-zen-green" /> 性別
              </label>
              <div className="relative">
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-zen-wood appearance-none cursor-pointer"
                >
                  <option value="male">男</option>
                  <option value="female">女</option>
                  <option value="other">其他 / 不便透露</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                  <motion.div animate={{ rotate: 90 }}>
                    <ArrowLeft size={14} />
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 text-xs font-medium text-stone-400 uppercase tracking-widest ml-1">
                <Mail size={14} className="text-zen-green" /> 電子郵件
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-6 py-4 bg-stone-100 border-none rounded-2xl text-stone-400 cursor-not-allowed italic"
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-stone-100">
              <div className="space-y-4">
                <label className="flex items-center gap-3 text-xs font-medium text-stone-400 uppercase tracking-widest ml-1">
                  <MapPin size={14} className="text-zen-green" /> 縣市
                </label>
                <div className="relative">
                  <select
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value, district: '' })}
                    className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-zen-wood appearance-none cursor-pointer"
                  >
                    <option value="">請選擇縣市</option>
                    {Object.keys(TAIWAN_CITIES).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                    <motion.div animate={{ rotate: 90 }}>
                      <ArrowLeft size={14} />
                    </motion.div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 text-xs font-medium text-stone-400 uppercase tracking-widest ml-1">
                  <MapPin size={14} className="text-zen-green" /> 行政區
                </label>
                <div className="relative">
                  <select
                    value={profile.district}
                    onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                    disabled={!profile.city}
                    className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-zen-wood appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">請選擇行政區</option>
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                    <motion.div animate={{ rotate: 90 }}>
                      <ArrowLeft size={14} />
                    </motion.div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 text-xs font-medium text-stone-400 uppercase tracking-widest ml-1">
                  <MapPin size={14} className="text-zen-green" /> 詳細地址
                </label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-zen-wood placeholder:text-stone-300"
                  placeholder="街道、門牌、樓層"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end mt-12">
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center gap-3 px-16 py-5 rounded-2xl font-medium uppercase tracking-widest text-sm transition-all shadow-xl disabled:opacity-50 ${
                  saved 
                    ? 'bg-zen-green text-white shadow-zen-green/20' 
                    : 'bg-zen-wood text-zen-cream hover:bg-zen-green shadow-zen-wood/10'
                }`}
              >
                {saved ? <Check size={18} /> : <Save size={18} />}
                {loading ? '儲存中...' : saved ? '更新成功！' : '儲存變更'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Avatar Selection Modal */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && setIsAvatarModalOpen(false)}
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
                    <h2 className="text-2xl font-serif italic text-stone-800">選擇個人頭像</h2>
                    <p className="text-stone-400 text-xs mt-1 whitespace-pre-wrap">{avatarDescription}</p>
                  </div>
                  <button 
                    onClick={() => setIsAvatarModalOpen(false)}
                    disabled={loading}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-50 text-stone-400 transition-colors disabled:opacity-50"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 max-h-[50vh] overflow-y-auto p-2 scrollbar-hide">
                  {systemAvatars.map((avatar, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedAvatarUrl(avatar.url)}
                        disabled={loading}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group ${
                          selectedAvatarUrl === avatar.url 
                            ? 'border-[#707040] ring-4 ring-[#707040]/10' 
                            : 'border-stone-100 hover:border-stone-200'
                        }`}
                      >
                        <img 
                          src={getAvatarUrl(avatar.url) || ''} 
                          alt={avatar.name || `Avatar ${i}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {selectedAvatarUrl === avatar.url && (
                          <div className="absolute inset-0 bg-[#707040]/20 flex items-center justify-center">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#707040] shadow-lg">
                              <Check size={16} />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      </button>
                      {avatar.name && (
                        <span className="text-[10px] text-center text-stone-500 font-medium truncate px-1">
                          {avatar.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex justify-center">
                  <button
                    onClick={handleAvatarConfirm}
                    disabled={loading || !selectedAvatarUrl}
                    className="flex items-center gap-3 px-12 py-4 bg-zen-wood text-zen-cream rounded-2xl font-medium uppercase tracking-widest text-xs hover:bg-zen-green transition-all shadow-xl shadow-zen-wood/10 disabled:opacity-50"
                  >
                    <Check size={16} />
                    確認使用此頭像
                  </button>
                </div>

                {loading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-[#707040] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">更新中...</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
