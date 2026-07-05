import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, User, Loader2 } from 'lucide-react';
import { supabase } from './db';
import toast from 'react-hot-toast';

// Whitelist of authorized administrator emails
const ADMIN_WHITELIST = [
  'koneko6848@gmail.com',         // Second operator's Email
  'admin@meandtea.com',
  'miye.tea@gmail.com'
];

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isSubmitting = useRef(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmitting.current) return;

    isSubmitting.current = true;
    setLoading(true);
    setError(null);

    try {
      const cleanUsername = username.trim();
      
      // 1. Bulletproof Local Bypass Credentials for Offline/Incognito/Sub-environments
      const isLocalM01 = cleanUsername === 'M001' && password === 'M002';
      const isLocalM02 = (cleanUsername === 'koneko6848@gmail.com' || cleanUsername === 'M002_ADMIN') && password === 'TeaAdmin2026';

      if (isLocalM01 || isLocalM02) {
        localStorage.setItem('admin_auth', 'true');
        toast.success(isLocalM02 ? '第二位協同管理員登入成功（本地高安全備份通道）！' : '核心管理員登入成功！');
        navigate('/admin');
        return;
      }

      // 2. Dual Auth Path - Supabase Auth checking
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanUsername,
        password: password,
      });

      if (authError) {
        throw new Error(authError.message === 'Invalid login credentials' ? '帳號或密碼錯誤' : authError.message);
      }

      if (authData?.user) {
        const userEmail = authData.user.email || '';
        
        // Fetch user profiles to check role/admin privileges
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        const isWhitelisted = ADMIN_WHITELIST.includes(userEmail.toLowerCase());
        const isRoleAdmin = profile && (profile.role === 'admin' || (profile as any).is_admin === true);

        if (isWhitelisted || isRoleAdmin) {
          localStorage.setItem('admin_auth', 'true');
          toast.success(`管理員 ${userEmail} 登入成功！`);
          navigate('/admin');
        } else {
          await supabase.auth.signOut();
          throw new Error('此帳號尚未取得管理員後台存取權限。');
        }
      } else {
        throw new Error('未知的登入錯誤，請重新再試');
      }
    } catch (err: any) {
      setError(err?.message || '帳號或密碼錯誤');
      toast.error(err?.message || '帳號或密碼錯誤');
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-zen-wood flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-zen-cream rounded-[3rem] p-12 shadow-2xl"
      >
        <div className="text-center mb-12">
          <h1 className="text-3xl font-serif italic text-zen-wood mb-4">管理員登入</h1>
          <p className="text-stone-500 text-xs font-medium uppercase tracking-widest">覓野茶 Me & Tea 後台系統</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-2">
            <label className="flex items-center gap-3 text-xs font-medium text-stone-400 uppercase tracking-widest ml-1">
              <User size={14} className="text-zen-green" /> 帳號或電子郵件
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-4 bg-white border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-zen-wood placeholder:text-stone-300 text-sm"
              placeholder="M001 或 管理員 Email"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 text-xs font-medium text-stone-400 uppercase tracking-widest ml-1">
              <Lock size={14} className="text-zen-green" /> 密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-white border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 outline-none transition-all text-zen-wood placeholder:text-stone-300 text-sm"
              placeholder="請輸入登入密碼"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-medium text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zen-wood text-zen-cream py-5 rounded-2xl font-medium uppercase tracking-widest text-sm hover:bg-zen-green transition-all shadow-xl shadow-zen-wood/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                正在進行安全驗證...
              </>
            ) : (
              '登入系統'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
