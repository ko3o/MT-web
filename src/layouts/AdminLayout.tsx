import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  ShoppingBag, 
  ClipboardList, 
  Home,
  Newspaper,
  HelpCircle,
  Compass
} from 'lucide-react';
import { supabase } from '../db';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.removeItem('admin_auth');
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { name: '首頁概覽', path: '/admin', icon: <LayoutDashboard size={20} />, end: true },
    { name: '商品管理', path: '/admin/products', icon: <ShoppingBag size={20} /> },
    { name: '訂單管理', path: '/admin/orders', icon: <ClipboardList size={20} /> },
    { name: '常見問題管理', path: '/admin/faq', icon: <HelpCircle size={20} /> },
    { name: '最新消息管理', path: '/admin/news', icon: <Newspaper size={20} /> },
    { name: '會員管理', path: '/admin/members', icon: <Users size={20} /> },
    { name: '新手村管理', path: '/admin/beginner-village', icon: <Compass size={20} /> },
    { name: '頁面設置', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#F9F8F4]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-100 flex flex-col p-8 fixed left-0 top-0 h-full z-50">
        <div className="mb-12">
          <h1 className="text-2xl font-serif italic text-stone-800">覓野茶</h1>
          <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-[0.2em] font-bold">管理後台</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${
                  isActive 
                    ? 'bg-[#707040] text-white shadow-lg shadow-[#707040]/20' 
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? 'text-white' : 'text-stone-400'}>
                    {item.icon}
                  </span>
                  <span className="font-medium text-sm">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        <div className="pt-8 border-t border-stone-100 space-y-2">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-all"
          >
            <Home size={20} className="text-stone-400" />
            <span className="font-medium text-sm">返回前台</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-stone-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={20} className="text-stone-400" />
            <span className="font-medium text-sm">登出</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-12 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
