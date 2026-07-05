import React from 'react';
import { motion } from 'motion/react';
import { RefreshCcw, ShieldCheck, HelpCircle, FileText, AlertCircle } from 'lucide-react';

export const Refund: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F9F8F4] py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-serif italic text-zen-wood mb-4"
          >
            退換貨政策
          </motion.h1>
          <div className="h-1 w-20 bg-zen-green rounded-full"></div>
        </header>

        <div className="space-y-8">
          {/* 7-Day Guarantee */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100"
          >
            <h2 className="text-2xl font-bold text-zen-wood mb-8 flex items-center gap-3">
              <ShieldCheck className="text-zen-green" size={24} />
              7 天鑑賞期
            </h2>
            <div className="space-y-4 text-stone-600 leading-relaxed">
              <p>
                根據消費者保護法規定，覓野茶提供商品到貨後 7 天的鑑賞期（含例假日）。
              </p>
              <div className="bg-stone-50 p-6 rounded-2xl border-l-4 border-zen-green">
                <p className="font-medium text-zen-wood mb-2 flex items-center gap-2">
                  <AlertCircle size={18} className="text-zen-green" />
                  請注意：
                </p>
                <p className="text-sm">
                  鑑賞期並非試用期。由於茶葉屬於食品，若包裝已拆封、損毀或內容物減少，將無法受理退換貨，敬請見諒。
                </p>
              </div>
            </div>
          </motion.section>

          {/* Return Process */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100"
          >
            <h2 className="text-2xl font-bold text-zen-wood mb-8 flex items-center gap-3">
              <RefreshCcw className="text-zen-green" size={24} />
              退貨流程
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center font-bold text-zen-wood">1</div>
                <p className="font-medium text-zen-wood">聯繫客服</p>
                <p className="text-sm text-stone-500 italic">透過 Email 或電話告知訂單編號與退貨原因。</p>
              </div>
              <div className="space-y-4">
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center font-bold text-zen-wood">2</div>
                <p className="font-medium text-zen-wood">包裝寄回</p>
                <p className="text-sm text-stone-500 italic">將商品連同完整包裝、贈品及發票放入原紙箱。</p>
              </div>
              <div className="space-y-4">
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center font-bold text-zen-wood">3</div>
                <p className="font-medium text-zen-wood">退款處理</p>
                <p className="text-sm text-stone-500 italic">收到商品並確認無誤後，將於 7 個工作天內退款。</p>
              </div>
            </div>
          </motion.section>

          {/* FAQs */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100"
          >
            <h2 className="text-2xl font-bold text-zen-wood mb-8 flex items-center gap-3">
              <HelpCircle className="text-zen-green" size={24} />
              常見問題
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="font-medium text-zen-wood flex items-center gap-2">
                  <FileText size={16} className="text-stone-400" />
                  運費由誰負擔？
                </p>
                <p className="text-sm text-stone-600">若因商品瑕疵或寄錯商品，運費由覓野茶負擔。若為個人因素退貨，需由買家自行負擔退貨運費。</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-zen-wood flex items-center gap-2">
                  <FileText size={16} className="text-stone-400" />
                  可以換貨嗎？
                </p>
                <p className="text-sm text-stone-600">目前僅提供「退貨」服務。若需更換商品，請辦理退貨後重新下單，以縮短您等待的時間。</p>
              </div>
            </div>
          </motion.section>

          {/* Footer Note */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-stone-100/50 p-8 rounded-3xl text-center"
          >
            <p className="text-stone-500 text-sm italic">
              如有任何疑問，請隨時聯繫我們的客服團隊。
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
