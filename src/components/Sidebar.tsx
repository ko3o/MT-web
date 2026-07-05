import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, LayoutDashboard, Settings, LogOut, ShoppingBag } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { name: '儀表板', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: '會員管理', path: '/admin/members', icon: <Users size={20} /> },
    { name: '商品管理', path: '/admin/products', icon: <ShoppingBag size={20} /> },
    { name: '系統設定', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 h-screen bg-stone-900 text-stone-300 flex flex-col p-6 fixed left-0 top-0">
      <div className="mb-12">
        <h1 className="text-2xl font-serif italic text-white">覓野茶 Me & Tea</h1>
        <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest">Admin Panel</p>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'hover:bg-stone-800 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      <button
        onClick={() => {
          import('../db').then(({ supabase }) => supabase.auth.signOut());
        }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-900/20 hover:text-red-400 transition-all mt-auto"
      >
        <LogOut size={20} />
        <span className="font-medium">登出</span>
      </button>
    </div>
  );
};
