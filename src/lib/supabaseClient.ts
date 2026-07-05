import { createClient } from '@supabase/supabase-js';

const getSupabaseUrl = () => {
  if (typeof window !== 'undefined' && (window as any).ENV?.VITE_SUPABASE_URL) {
    return (window as any).ENV.VITE_SUPABASE_URL;
  }
  return import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
};

const getSupabaseAnonKey = () => {
  if (typeof window !== 'undefined' && (window as any).ENV?.VITE_SUPABASE_ANON_KEY) {
    return (window as any).ENV.VITE_SUPABASE_ANON_KEY;
  }
  return import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY || '';
};

export const supabaseUrl = getSupabaseUrl();
export const supabaseAnonKey = getSupabaseAnonKey();

// If no custom env vars exist, we fallback to the default template credentials to avoid compilation crashing,
// but we prioritize custom env variables 100% and print a clear warning if they are missing.
const activeUrl = supabaseUrl || 'https://ftqyzxrvghfdspgjampd.supabase.co';
const activeAnonKey = supabaseAnonKey || 'sb_publishable_PRsJAks9Nw0fcT7Bvd0Y2Q_abzmKtne';

if (!supabaseUrl) {
  console.warn('【覓野茶】Supabase URL 尚未在 AI Studio 的 Secrets 面板中設定，目前自動使用預設專案。請到右上角 Gear 設定面板配置 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY！');
}

export const supabase = createClient(activeUrl, activeAnonKey, {
  db: {
    schema: 'public'
  }
});

