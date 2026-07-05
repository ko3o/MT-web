import React from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ScrollToTop } from '../components/ScrollToTop';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[#F9F8F4] text-stone-800 font-sans flex flex-col">
      <ScrollToTop />
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className={`flex-grow ${isHomePage ? '' : 'pt-24'}`}>
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
