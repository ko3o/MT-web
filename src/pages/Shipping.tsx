import React from 'react';
import { motion } from 'motion/react';
import { Truck, Package, CreditCard, Clock, ShieldCheck } from 'lucide-react';

export const Shipping: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F9F8F4] py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-serif italic text-zen-wood mb-4"
          >
            配送說明
          </motion.h1>
          <div className="h-1 w-20 bg-zen-green rounded-full"></div>
        </header>

        <div className="space-y-8">
          {/* Shipping Methods */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100"
          >
            <h2 className="text-2xl font-bold text-zen-wood mb-8 flex items-center gap-3">
              <Truck className="text-zen-green" size={24} />
              物流方式與運費
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Package className="text-stone-400 mt-1" size={20} />
                  <div>
                    <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">宅配到府 (便利帶)</p>
                    <p className="text-zen-wood font-medium">運費 NT$ 100</p>
                    <p className="text-stone-400 text-sm mt-1">（滿 NT$ 1,000 免運）</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Building className="text-stone-400 mt-1" size={20} />
                  <div>
                    <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">超商取貨</p>
                    <p className="text-zen-wood font-medium">運費 NT$ 100</p>
                    <p className="text-stone-400 text-sm mt-1">（滿 NT$ 1,000 免運）</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="text-stone-400 mt-1" size={20} />
                <div>
                  <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">配送時間</p>
                  <p className="text-zen-wood font-medium">出貨後 2-3 個工作天</p>
                  <p className="text-stone-400 text-sm mt-1">（偏遠地區可能增加 1-2 天）</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Payment Methods */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100"
          >
            <h2 className="text-2xl font-bold text-zen-wood mb-8 flex items-center gap-3">
              <CreditCard className="text-zen-green" size={24} />
              付款方式
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-5 h-5 flex items-center justify-center text-stone-400 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">銀行匯款</p>
                    <div className="text-zen-wood font-medium space-y-1">
                      <p>銀行代碼：000 (範例銀行)</p>
                      <p>匯款帳號：1234-567-890123</p>
                      <p>戶名：覓野茶室</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Truck className="text-stone-400 mt-1" size={20} />
                  <div>
                    <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">便利帶</p>
                    <p className="text-zen-wood font-medium">支援「貨到付款」或「匯款後取件」</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Building className="text-stone-400 mt-1" size={20} />
                <div>
                  <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">超商取貨付款</p>
                  <p className="text-zen-wood font-medium">取貨時再付費，安全便利</p>
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
              所有訂單將在確認付款後 24 小時內處理。如遇國定假日，出貨時間將順延。
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const Building: React.FC<{ className?: string; size?: number }> = ({ className, size }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);
