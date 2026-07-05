import React, { useState, useRef, useEffect } from 'react';
import { supabase } from './db';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { MainLayout } from './layouts/MainLayout';
import toast from 'react-hot-toast';
import { getAuthErrorMessage } from './utils/auth_errors';
import { Eye, EyeOff } from 'lucide-react';
import { getSettings } from './services/settingsService';
import { getAvatarUrl } from './services/productService';

export const Register: React.FC = () => {
  const location = useLocation();
  const initialEmail = location.state?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const [googleLogo, setGoogleLogo] = useState<string | null>(null);
  const [lineLogo, setLineLogo] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings) {
        if (settings.google_login_logo_url) {
          setGoogleLogo(getAvatarUrl(settings.google_login_logo_url) || settings.google_login_logo_url);
        }
        if (settings.line_login_logo_url) {
          setLineLogo(getAvatarUrl(settings.line_login_logo_url) || settings.line_login_logo_url);
        }
      }
    }).catch((err) => console.error('Error loading social logo settings:', err));
  }, []);
  
  // 使用 useRef 作為物理鎖，防止極速重複點擊導致的重複請求
  const isSubmitting = useRef(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 雙重檢查：loading 狀態與 useRef 鎖
    if (loading || isSubmitting.current) return;
    
    isSubmitting.current = true;
    setLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      // 執行註冊 (僅發出一次 API 請求)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpError) throw signUpError;

      // 如果註冊成功且直接取得 session (表示不需驗證信，已自動登入)
      if (data.session) {
        toast.success('註冊並登入成功！歡迎來到覓野。');
        navigate('/');
      } else {
        // 需要驗證信的情況
        setIsSuccess(true);
        toast.success('註冊成功！請檢查您的信箱以啟用帳號。');
      }
    } catch (err: any) {
      const friendlyMessage = getAuthErrorMessage(err);
      setError(friendlyMessage);
      toast.error(friendlyMessage);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) throw oauthError;

      if (data?.url) {
        const popup = window.open(
          data.url,
          'google_oauth_popup',
          'width=600,height=700'
        );

        if (!popup) {
          toast.error('彈出視窗被瀏覽器封鎖，請允許快顯視窗後重試。');
        }
      } else {
        throw new Error('無法取得 Google 授權網址');
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      toast.error('Google 登入啟動失敗：' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleLineLogin = () => {
    if (loading) return;
    try {
      const clientId = '2010600801';
      const redirectUri = `${window.location.origin}/api/auth/line/callback`;
      const state = Math.random().toString(36).substring(2, 15);
      
      const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid%20email`;
      
      const popup = window.open(
        lineAuthUrl,
        'line_oauth_popup',
        'width=600,height=700'
      );

      if (!popup) {
        toast.error('彈出視窗被瀏覽器封鎖，請允許快顯視窗後重試。');
      }
    } catch (err: any) {
      console.error('LINE login trigger error:', err);
      toast.error('LINE 登入啟動失敗');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-zen-cream px-6 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-zen-wood/5 p-12 border border-zen-wood/5"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif italic text-zen-wood mb-4 tracking-tight">
            {isSuccess ? '註冊成功' : '加入覓野'}
          </h1>
          <p className="text-stone-500 text-sm font-medium uppercase tracking-widest">
            {isSuccess ? '歡迎來到覓野茶事' : '開啟您的茶事旅程'}
          </p>
        </div>
        
        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <div className="bg-zen-green/5 p-8 rounded-3xl border border-zen-green/10">
              <p className="text-zen-wood leading-relaxed">
                註冊成功！<br />
                請至信箱收取確認註冊信，並<span className="font-bold text-zen-green">點擊信中連結</span>以啟用帳號。<br />
                啟用後即可自動登入。
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-zen-wood text-zen-cream py-5 rounded-2xl font-medium uppercase tracking-widest text-sm hover:bg-zen-green transition-all shadow-lg shadow-zen-wood/10"
            >
              前往登入
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-8">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-widest ml-1">電子郵件</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 transition-all text-zen-wood placeholder:text-stone-300"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-widest ml-1">設定密碼</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位字元"
                  className="w-full px-6 py-4 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-zen-green/20 transition-all text-zen-wood placeholder:text-stone-300 pr-14"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-zen-wood transition-colors"
                  title={showPassword ? "隱藏密碼" : "顯示密碼"}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>
            
            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-xs font-medium bg-red-50 p-4 rounded-xl border border-red-100"
              >
                {error}
              </motion.p>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zen-wood text-zen-cream py-5 rounded-2xl font-medium uppercase tracking-widest text-sm hover:bg-zen-green transition-all shadow-lg shadow-zen-wood/10 disabled:opacity-50"
            >
              {loading ? '處理中...' : '立即註冊'}
            </button>
          </form>
        )}
        
        {!isSuccess && (
          <>
            <div className="relative flex py-8 items-center">
              <div className="flex-grow border-t border-stone-100"></div>
              <span className="flex-shrink mx-4 text-xs text-stone-400 font-medium uppercase tracking-widest text-center">或使用社群帳號快速登入</span>
              <div className="flex-grow border-t border-stone-100"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex items-center justify-center gap-3 bg-white border border-stone-200 text-stone-700 py-4 px-6 rounded-2xl font-medium text-sm hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm disabled:opacity-50"
              >
                {googleLogo ? (
                  <img src={googleLogo} alt="Google" className="w-[18px] h-[18px] object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.41-4.69H24v8.88h12.63C35.1 32.22 31.06 35 24 35c-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48c13.26 0 24-10.74 24-24 0-.67-.06-1.34-.15-2z" />
                    <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z" />
                    <path fill="#34A853" d="M24 48c6.47 0 11.91-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                )}
                <span>Google 登入</span>
              </button>
              
              <button
                type="button"
                onClick={handleLineLogin}
                disabled={loading}
                className="flex items-center justify-center gap-3 bg-[#06C755] text-white py-4 px-6 rounded-2xl font-medium text-sm hover:bg-[#05b34c] transition-all shadow-sm disabled:opacity-50"
              >
                {lineLogo ? (
                  <img src={lineLogo} alt="LINE" className="w-[18px] h-[18px] object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="white">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.564.391.084.922.258 1.057.592.12.303.079.778.038 1.087l-.166 1.01c-.05.304-.241 1.191 1.038.65 1.279-.541 6.901-4.067 9.414-6.96 1.761-1.954 2.583-3.921 2.583-6.243zm-15.654 3.011c0 .241-.195.436-.436.436H6.132c-.241 0-.436-.195-.436-.436V7.632c0-.241.195-.436.436-.436h.218c.241 0 .436.195.436.436v4.836h1.124c.241 0 .436.195.436.436v.211zm2.342 0c0 .241-.195.436-.436.436h-.218c-.241 0-.436-.195-.436-.436V7.632c0-.241.195-.436.436-.436h.218c.241 0 .436.195.436.436v5.713zm3.743 0c0 .241-.195.436-.436.436h-.233c-.159 0-.306-.086-.382-.228l-1.488-2.756v2.548c0 .241-.195.436-.436.436h-.218c-.241 0-.436-.195-.436-.436V7.632c0-.241.195-.436.436-.436h.233c.159 0 .306.086.382.228l1.488 2.755V7.632c0-.241.195-.436.436-.436h.218c.241 0 .436.195.436.436v.211zm3.435-1.996c0 .241-.195.436-.436.436h-1.124v1.124h1.124c.241 0 .436.195.436.436v.211c0 .241-.195.436-.436.436h-1.778c-.241 0-.436-.195-.436-.436V7.632c0-.241.195-.436.436-.436h1.778c.241 0 .436.195.436.436v.211c0 .241-.195.436-.436.436h-1.124v1.124h1.124c.241 0 .436.195.436.436v.211z" />
                  </svg>
                )}
                <span>LINE 登入</span>
              </button>
            </div>
          </>
        )}
        
        <div className="mt-12 pt-8 border-t border-stone-100 text-center">
          <p className="text-stone-400 text-sm">
            已有帳號？{' '}
            <NavLink 
              to="/login" 
              state={{ email }}
              className="text-zen-green font-medium hover:underline ml-1"
            >
              登入
            </NavLink>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
