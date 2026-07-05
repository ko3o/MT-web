import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { supabase } from '../db';
import { motion, AnimatePresence } from 'motion/react';

import { useCart } from '../CartContext';
import { getImageUrl, getAvatarUrl, getThumbnailUrl } from '../services/productService';
import { getSettings, SiteSettings } from '../services/settingsService';
import { Trash2, Plus, Minus, AlertCircle, ChevronRight, Truck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile } = useAuth();
  const { items, totalItems, subtotal, removeFromCart, updateQuantity, isFreeShipping, amountToFreeShipping } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [villageConfig, setVillageConfig] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSettings();
      setSettings(data);
    };
    fetchSettings();

    const fetchVillageConfig = async () => {
      try {
        const response = await fetch('/api/beginner-village');
        if (response.ok) {
          const data = await response.json();
          setVillageConfig(data);
        }
      } catch (err) {
        console.error('Error loading beginner-village for navbar:', err);
      }
    };
    fetchVillageConfig();
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navItems = [
    { 
      name: '關於我們', 
      path: '/about',
      children: [
        { name: '遇見覓野', path: '/about/meet-miye' },
        { name: '萬物共生', path: '/about/coexistence' },
        { name: '店長日常', path: '/about/cats-daily' },
      ]
    },
    { name: '茶品清單', path: '/products' },
    { name: '新手村測驗', path: '/beginner-village' },
    { name: '常見問題', path: '/faq' },
    { name: '最新消息', path: '/news' },
  ];

  const isHomePage = location.pathname === '/';

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || !isHomePage 
            ? 'bg-white/90 backdrop-blur-md py-4 shadow-sm border-b border-stone-100' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center min-h-[40px] py-1 gap-6 md:gap-10">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-3 group flex-shrink-0 select-none">
              <div 
                style={{ 
                  height: `${villageConfig?.navbar_logo_size !== undefined ? villageConfig.navbar_logo_size : 40}px`,
                  aspectRatio: (!settings?.logo_url || settings.logo_url === '/覓野茶logo.png') ? '1/1' : '290/100',
                  width: 'auto'
                }}
                className="flex items-center justify-center transition-transform group-hover:scale-105 flex-shrink-0"
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
                <div className="flex flex-col justify-center min-w-0">
                  <span 
                    style={{ 
                      fontSize: `${villageConfig?.navbar_brand_text_size !== undefined ? villageConfig.navbar_brand_text_size : 20}px` 
                    }}
                    className={`font-bold tracking-tight leading-none transition-colors truncate ${isScrolled || !isHomePage ? 'text-stone-800' : 'text-stone-800'}`}
                  >
                    覓野茶
                  </span>
                  <span 
                    style={{ 
                      fontSize: `${Math.max(9, Math.round((villageConfig?.navbar_brand_text_size !== undefined ? villageConfig.navbar_brand_text_size : 20) * 0.5))}px` 
                    }}
                    className="font-serif italic text-[#707040] uppercase tracking-widest leading-none mt-1"
                  >
                    Me & Tea
                  </span>
                </div>
              )}
            </NavLink>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-10">
              {navItems.map((item) => {
                if ('children' in item && item.children) {
                  const isAnyChildActive = item.children.some(child => location.pathname === child.path);
                  return (
                    <div key={item.path} className="relative group/nav-dropdown">
                      <button
                        className={`text-sm font-medium tracking-widest transition-all hover:text-[#707040] flex items-center gap-1 py-1 ${
                          isAnyChildActive ? 'text-[#707040]' : 'text-stone-600'
                        }`}
                      >
                        {item.name}
                        <ChevronDown size={14} className="transition-transform group-hover/nav-dropdown:rotate-180 duration-300" />
                      </button>
                      
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover/nav-dropdown:opacity-100 group-hover/nav-dropdown:visible transition-all duration-300 z-50 min-w-[160px]">
                        <div className="bg-white/95 backdrop-blur-md border border-stone-100 rounded-[1.75rem] shadow-xl py-3 px-2 flex flex-col gap-1">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              className={({ isActive }) =>
                                `text-xs font-semibold tracking-widest px-4 py-2.5 rounded-xl transition-all ${
                                  isActive 
                                    ? 'bg-[#707040]/10 text-[#707040]' 
                                    : 'text-stone-600 hover:text-[#707040] hover:bg-stone-50'
                                }`
                              }
                            >
                              {child.name}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `text-sm font-medium tracking-widest transition-all hover:text-[#707040] relative group py-1 ${
                        isActive ? 'text-[#707040]' : 'text-stone-600'
                      }`
                    }
                  >
                    {item.name}
                    <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-[#707040] transition-all duration-300 group-hover:w-full ${location.pathname === item.path ? 'w-full' : ''}`}></span>
                  </NavLink>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button className="p-2 text-stone-600 hover:text-[#707040] transition-all relative group">
                <Search size={20} className="group-hover:scale-110 transition-transform" />
              </button>
              
              <button 
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-stone-600 hover:text-[#707040] transition-all relative group"
              >
                <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 bg-[#707040] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">
                    {totalItems}
                  </span>
                )}
              </button>
              
              <div className="h-4 w-[1px] bg-stone-200 mx-1 hidden sm:block"></div>

              {user ? (
                <div className="flex items-center gap-1">
                  <NavLink 
                    to="/profile" 
                    className="p-1 text-stone-600 hover:text-[#707040] transition-all group"
                    title="會員中心"
                  >
                    {profile?.avatar_url ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-100 group-hover:border-[#707040] transition-colors">
                        <img 
                          src={getAvatarUrl(profile.avatar_url) || ''} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <User size={20} className="group-hover:scale-110 transition-transform" />
                    )}
                  </NavLink>
                  <button 
                    onClick={handleLogout} 
                    className="p-2 text-stone-600 hover:text-red-500 transition-all group"
                    title="登出"
                  >
                    <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              ) : (
                <NavLink 
                  to="/login" 
                  className="flex items-center gap-2 bg-[#707040] text-white px-5 py-2 rounded-xl text-xs font-bold tracking-widest hover:bg-[#5a5a34] transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  <User size={16} />
                  <span>會員登入</span>
                </NavLink>
              )}

              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden p-2 text-stone-600 hover:text-[#707040] transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-stone-100 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col p-8 gap-6">
                {navItems.map((item) => {
                  if ('children' in item && item.children) {
                    return (
                      <div key={item.path} className="flex flex-col gap-3">
                        <span className="text-stone-400 text-xs font-extrabold tracking-[0.2em] uppercase pl-1">{item.name}</span>
                        <div className="flex flex-col gap-3 pl-4 border-l border-[#707040]/20">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              onClick={() => setIsMenuOpen(false)}
                              className={({ isActive }) => 
                                `text-base font-semibold tracking-widest transition-colors ${
                                  isActive ? 'text-[#707040]' : 'text-stone-600 hover:text-[#707040]'
                                }`
                              }
                            >
                              {child.name}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={({ isActive }) => 
                        `text-lg font-medium tracking-widest transition-colors ${
                          isActive ? 'text-[#707040]' : 'text-stone-600 hover:text-[#707040]'
                        }`
                      }
                    >
                      {item.name}
                    </NavLink>
                  );
                })}
                <div className="h-[1px] bg-stone-100 w-full my-2"></div>
                {!user && (
                  <NavLink 
                    to="/login" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 bg-[#707040] text-white py-4 rounded-2xl text-sm font-bold tracking-widest"
                  >
                    <User size={18} />
                    <span>會員登入</span>
                  </NavLink>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-zen-cream z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-white">
                <h2 className="text-2xl font-serif italic text-zen-wood">購物車</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-50 text-stone-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-stone-300">
                      <ShoppingCart size={32} />
                    </div>
                    <p className="text-stone-400 italic">購物車空空的，快去逛逛吧！</p>
                    <button 
                      onClick={() => { setIsCartOpen(false); navigate('/products'); }}
                      className="text-zen-green font-bold text-sm uppercase tracking-widest hover:underline"
                    >
                      前往選購
                    </button>
                  </div>
                ) : (
                    items.map((item, index) => {
                      if (!item) return null;
                      const optLabel = typeof item.selectedOption === 'object' ? item.selectedOption?.label : item.selectedOption;
                      const key = `${item.id || 'err'}-${optLabel || index}`;
                      
                      return (
                        <div key={key} className="flex gap-4 bg-white p-4 rounded-2xl shadow-sm border border-stone-50 group">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                            <img 
                              src={getThumbnailUrl(item.image_url || '', 160, 160)} 
                              alt={item.name || '商品'} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = '/placeholder-tea.jpg';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-zen-wood mb-1 line-clamp-1">{item.name || '未知商品'}</h3>
                            {optLabel && (
                              <p className="text-[10px] text-[#707040] font-medium bg-[#707040]/5 px-2 py-0.5 rounded inline-block mb-1">
                                選項: {optLabel}
                              </p>
                            )}
                            <p className="text-xs text-stone-400 mb-3">NT$ {(item.price || 0).toLocaleString()}</p>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center bg-stone-50 rounded-lg p-1">
                                <button 
                                  onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1, item.selectedOption)}
                                  className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-zen-wood transition-colors"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-8 text-center text-xs font-bold text-zen-wood">{item.quantity || 0}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, (item.quantity || 0) + 1, item.selectedOption)}
                                  className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-zen-wood transition-colors"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id, item.selectedOption)}
                            className="text-stone-300 hover:text-red-500 transition-colors self-start p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })
                )}
              </div>

              {items.length > 0 && (
                <div className="p-8 bg-white border-t border-stone-100 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-stone-500">
                      <span>商品小計</span>
                      <span>NT$ {subtotal.toLocaleString()}</span>
                    </div>
                    
                    {!isFreeShipping ? (
                      <div className="bg-orange-50 p-4 rounded-2xl flex items-center gap-3 text-orange-600">
                        <AlertCircle size={18} />
                        <p className="text-xs font-bold uppercase tracking-widest">
                          還差 NT$ {amountToFreeShipping.toLocaleString()} 即可享免運！
                        </p>
                      </div>
                    ) : (
                      <div className="bg-zen-green/5 p-4 rounded-2xl flex items-center gap-3 text-zen-green">
                        <Truck size={18} />
                        <p className="text-xs font-bold uppercase tracking-widest">
                          恭喜！已達免運門檻
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between pt-4 border-t border-stone-100">
                      <span className="text-zen-wood font-bold">總計</span>
                      <span className="text-2xl font-serif italic text-zen-wood">NT$ {subtotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}
                    className="w-full bg-zen-wood text-zen-cream py-5 rounded-2xl font-medium uppercase tracking-widest text-sm hover:bg-zen-green transition-all shadow-xl shadow-zen-wood/10 flex items-center justify-center gap-3"
                  >
                    前往結帳
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
