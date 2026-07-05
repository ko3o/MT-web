import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './db';
import { Session, User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  customer_phone?: string;
  gender?: string;
  address?: string;
  city?: string;
  district?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  user: null, 
  profile: null, 
  loading: true,
  refreshProfile: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (data && !error) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // 強制檢查網址是否帶有 Supabase 的驗證參數 (如 #access_token)
    // 這在 AI Studio 預覽環境中特別重要，因為 hash 可能會被延遲處理
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token') || hash.includes('type=signup') || hash.includes('type=recovery'))) {
        // 偵測到驗證參數，嘗試取得 Session
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setSession(session);
            setUser(session.user);
            fetchProfile(session.user.id);
            setLoading(false);
            
            // 顯示親切的提示
            toast.success('歡迎回來！驗證已完成，快來看看今天的精選好茶吧！', {
              duration: 5000,
              icon: '🍵',
            });
            
            // 清除網址上的參數，保持網址乾淨並避免重複觸發
            window.history.replaceState(null, '', window.location.pathname);
          }
        });
      }
    };

    // 取得初始 Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
      // 初始檢查 Hash
      checkHash();
    });

    // 監聽 Auth 狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);

      // 如果是從驗證信跳轉回來 (SIGNED_IN) 且網址帶有 hash
      if (event === 'SIGNED_IN' && window.location.hash) {
        toast.success('歡迎回來！驗證已完成，快來看看今天的精選好茶吧！', {
          duration: 5000,
          icon: '🍵',
        });
        
        // 清除網址上的 Access Token 等資訊
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    // 監聽來自登入彈出視窗的跨視窗訊息 (Message Event Listener)
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      // 驗證來源是否為 AI Studio 預覽網址或本地開發伺服器
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const hash = event.data.hash;
        if (hash) {
          const params = new URLSearchParams(hash.replace('#', '?'));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            setLoading(true);
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              if (error) throw error;
              if (data.session) {
                setSession(data.session);
                setUser(data.session.user);
                await fetchProfile(data.session.user.id);
                toast.success('Google 快速登入成功！歡迎回來，覓野茶事。🍵');
              }
            } catch (err: any) {
              console.error('Google Auth Session Error:', err);
              toast.error('Google 登入失敗：' + (err.message || '無法解析登入資訊'));
            } finally {
              setLoading(false);
            }
          }
        }
      } else if (event.data?.type === 'LINE_AUTH_SUCCESS') {
        const { email, name, picture, lineId } = event.data;
        const linePassword = `LINE_${lineId}_MIYE_SECURE_PASS_2026`;
        setLoading(true);
        try {
          // 1. 嘗試直接以 LINE ID 做為密碼登入
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: linePassword,
          });

          if (signInError) {
            // 2. 登入失敗通常代表帳號不存在，因此為其自動註冊
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password: linePassword,
              options: {
                data: {
                  full_name: name,
                  avatar_url: picture,
                },
              },
            });

            if (signUpError) throw signUpError;

            if (signUpData.session) {
              setSession(signUpData.session);
              setUser(signUpData.session.user);
              await fetchProfile(signUpData.session.user.id);
              toast.success('LINE 註冊與登入成功！歡迎加入覓野茶事。🍵');
            } else {
              // 再次嘗試登入（以防信箱驗證設定的預設限制）
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email,
                password: linePassword,
              });
              if (retryError) {
                throw new Error('此專案需要電子郵件確認，請檢查您的信箱或手動登入。');
              }
              if (retryData.session) {
                setSession(retryData.session);
                setUser(retryData.session.user);
                await fetchProfile(retryData.session.user.id);
                toast.success('LINE 登入成功！🍵');
              }
            }
          } else if (signInData.session) {
            setSession(signInData.session);
            setUser(signInData.session.user);
            await fetchProfile(signInData.session.user.id);
            toast.success('LINE 快速登入成功！歡迎回來，覓野茶事。🍵');
          }
        } catch (err: any) {
          console.error('LINE Auth login error:', err);
          toast.error('LINE 登入失敗：' + (err.message || err));
        } finally {
          setLoading(false);
        }
      } else if (event.data?.type === 'OAUTH_AUTH_FAILURE') {
        toast.error('快速登入失敗：' + (event.data.error || '授權未完成'));
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
