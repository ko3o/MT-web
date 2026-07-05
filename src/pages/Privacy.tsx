import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, UserCheck, FileText, AlertCircle } from 'lucide-react';

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F9F8F4] py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-serif italic text-zen-wood mb-4"
          >
            隱私權政策
          </motion.h1>
          <div className="h-1 w-20 bg-zen-green rounded-full"></div>
        </header>

        <div className="space-y-8">
          {/* Data Collection */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100"
          >
            <h2 className="text-2xl font-bold text-zen-wood mb-8 flex items-center gap-3">
              <Eye className="text-zen-green" size={24} />
              資料收集與使用
            </h2>
            <div className="space-y-6 text-stone-600 leading-relaxed">
              <div className="space-y-2">
                <p className="font-medium text-zen-wood flex items-center gap-2">
                  <UserCheck size={18} className="text-stone-400" />
                  個人資料
                </p>
                <p className="text-sm">
                  當您在覓野茶購物或註冊會員時，我們會收集您的姓名、聯絡電話、Email、配送地址及付款資訊。
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-zen-wood flex items-center gap-2">
                  <FileText size={18} className="text-stone-400" />
                  使用目的
                </p>
                <p className="text-sm">
                  收集資料僅用於處理訂單、配送商品及提供客服支援。
                </p>
              </div>
            </div>
          </motion.section>

          {/* Security */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100"
          >
            <h2 className="text-2xl font-bold text-zen-wood mb-8 flex items-center gap-3">
              <Lock className="text-zen-green" size={24} />
              資訊安全保護
            </h2>
            <div className="space-y-6 text-stone-600 leading-relaxed">
              <div className="flex items-start gap-4">
                <Shield className="text-zen-green mt-1 shrink-0" size={20} />
                <p className="text-sm">
                  我們採用 SSL 加密技術保護您的交易資料，並嚴格限制內部人員存取權限。
                </p>
              </div>
              <div className="flex items-start gap-4">
                <Shield className="text-zen-green mt-1 shrink-0" size={20} />
                <p className="text-sm">
                  除非法律要求或配合司法調查，我們絕不會將您的個人資料提供、交換或出售給第三方。
                </p>
              </div>
            </div>
          </motion.section>

          {/* Cookies */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100"
          >
            <h2 className="text-2xl font-bold text-zen-wood mb-8 flex items-center gap-3">
              <FileText className="text-zen-green" size={24} />
              Cookie 之使用
            </h2>
            <div className="space-y-4 text-stone-600 leading-relaxed">
              <p className="text-sm">
                為了提供更好的購物體驗，我們會使用 Cookie 技術。您可以透過瀏覽器設定拒絕 Cookie，但這可能會導致網站部分功能無法正常運作。
              </p>
            </div>
          </motion.section>

          {/* Updates */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-stone-100/50 p-8 rounded-3xl text-center"
          >
            <p className="text-stone-500 text-sm italic flex items-center justify-center gap-2">
              <AlertCircle size={16} />
              本政策將不定期更新，請隨時查閱以保障您的權益。
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
