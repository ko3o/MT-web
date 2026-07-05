import React from 'react';
import { NavLink } from 'react-router-dom';
import { Mail, Phone, Clock, Facebook, Instagram } from 'lucide-react';
import { getSettings, SiteSettings } from '../services/settingsService';
import { getAvatarUrl } from '../services/productService';

export const Footer: React.FC = () => {
  const [settings, setSettings] = React.useState<SiteSettings | null>(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-[#1C1C1C] text-stone-400 py-20 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          {/* Brand Column */}
          <div className="space-y-8 col-span-1 md:col-span-1">
            <div className="flex items-center gap-4">
              <div 
                style={{ 
                  height: '40px',
                  aspectRatio: (!settings?.logo_url || settings.logo_url === '/覓野茶logo.png') ? '1/1' : '290/100',
                  width: 'auto'
                }}
                className="flex items-center justify-center flex-shrink-0"
              >
                <img 
                  src={settings?.logo_url ? (getAvatarUrl(settings.logo_url) || settings.logo_url) : "/覓野茶logo.png"} 
                  alt="覓野茶 Logo" 
                  style={{
                    height: '100%',
                    width: 'auto'
                  }}
                  className="object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
              {(!settings?.logo_url || settings.logo_url === '/覓野茶logo.png') && (
                <div className="flex flex-col justify-center">
                  <span className="text-xl font-bold text-white tracking-tight leading-tight">覓野茶</span>
                  <span className="text-xs font-serif italic text-[#707040] uppercase tracking-widest leading-tight">Me & Tea</span>
                </div>
              )}
            </div>
            <p className="text-sm leading-relaxed max-w-xs text-stone-500">
              來自台灣山林的純淨茶香，每一口都是與自然的對話。我們堅持自然農法，傳承匠心工藝。
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-white font-bold mb-8 text-sm uppercase tracking-widest">快速連結</h3>
            <ul className="space-y-4">
              {[
                { name: '關於我們', path: '/about' },
                { name: '茶品清單', path: '/products' },
                { name: '常見問題', path: '/faq' },
                { name: '最新消息', path: '/news' }
              ].map((link) => (
                <li key={link.name}>
                  <NavLink to={link.path} className="hover:text-[#707040] text-sm transition-colors">
                    {link.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy Links */}
          <div className="col-span-1">
            <h3 className="text-white font-bold mb-8 text-sm uppercase tracking-widest">購物說明</h3>
            <ul className="space-y-4">
              {[
                { name: '配送說明', path: '/shipping' },
                { name: '退換貨政策', path: '/refund' },
                { name: '隱私權政策', path: '/privacy' },
                { name: '聯絡方式', path: '/contact' }
              ].map((link) => (
                <li key={link.name}>
                  <NavLink to={link.path} className="hover:text-[#707040] text-sm transition-colors">
                    {link.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-span-1">
            <h3 className="text-white font-bold mb-8 text-sm uppercase tracking-widest">聯絡我們</h3>
            <ul className="space-y-6 text-sm">
              <li className="flex items-start gap-3">
                <Mail size={18} className="text-[#707040] shrink-0" />
                <span>service@meandtea.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={18} className="text-[#707040] shrink-0" />
                <span>0800-123-456</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={18} className="text-[#707040] shrink-0" />
                <div>
                  <p>服務時間：週一至週五</p>
                  <p className="mt-1 text-stone-500">09:00 - 18:00</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-stone-600 text-xs">
            © 2026 覓野茶 Me & Tea. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-stone-600">
            <NavLink to="/privacy" className="hover:text-stone-400 transition-colors">服務條款</NavLink>
            <NavLink to="/privacy" className="hover:text-stone-400 transition-colors">隱私權政策</NavLink>
          </div>
        </div>
      </div>
    </footer>
  );
};
