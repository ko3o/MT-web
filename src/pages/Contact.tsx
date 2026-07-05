import React from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, Clock, MapPin, Building, ShieldCheck } from 'lucide-react';

export const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F9F8F4] py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-serif italic text-zen-wood mb-4"
          >
            聯絡方式
          </motion.h1>
          <div className="h-1 w-20 bg-zen-green rounded-full"></div>
        </header>

        <div className="space-y-8">
          {/* Customer Service Info */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100"
          >
            <h2 className="text-2xl font-bold text-zen-wood mb-8 flex items-center gap-3">
              <Phone className="text-zen-green" size={24} />
              客服資訊
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="text-stone-400 mt-1" size={20} />
                  <div>
                    <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">客服信箱</p>
                    <p className="text-zen-wood font-medium">service@meandtea.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="text-stone-400 mt-1" size={20} />
                  <div>
                    <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">客服電話</p>
                    <p className="text-zen-wood font-medium">0800-123-456</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="text-stone-400 mt-1" size={20} />
                <div>
                  <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">服務時間</p>
                  <p className="text-zen-wood font-medium">週一至週五 09:00 - 18:00</p>
                  <p className="text-stone-400 text-sm mt-1">（國定假日除外）</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Company Info */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100"
          >
            <h2 className="text-2xl font-bold text-zen-wood mb-8 flex items-center gap-3">
              <Building className="text-zen-green" size={24} />
              公司資訊
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Building className="text-stone-400 mt-1" size={20} />
                <div>
                  <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">公司名稱</p>
                  <p className="text-zen-wood font-medium">覓野茶股份有限公司</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <ShieldCheck className="text-stone-400 mt-1" size={20} />
                <div>
                  <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">統一編號</p>
                  <p className="text-zen-wood font-medium">12345678</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="text-stone-400 mt-1" size={20} />
                <div>
                  <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">公司地址</p>
                  <p className="text-zen-wood font-medium">台北市信義區信義路五段 7 號</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Footer Note */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-stone-100/50 p-8 rounded-3xl text-center"
          >
            <p className="text-stone-500 text-sm italic">
              如有任何問題或建議，歡迎透過以上方式與我們聯繫。我們將盡快回覆您的訊息。
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
