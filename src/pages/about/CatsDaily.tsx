import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { getSettings, SiteSettings } from '../../services/settingsService';
import { getStorageUrl } from '../../services/productService';
import { Heart, ShieldCheck, Footprints, Stars } from 'lucide-react';

export const CatsDaily: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#F9F8F4] flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-[#707040] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const catBanner = settings.cat_banner_url || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1920&q=80';
  const duties = settings.cat_manager_duties || [];
  const profileItems = settings.cat_manager_profile_items || [];

  const renderDutyIcon = (iconName: string) => {
    switch (iconName) {
      case 'Footprints':
        return <Footprints size={20} />;
      case 'Heart':
        return <Heart size={20} />;
      case 'Stars':
        return <Stars size={20} />;
      default:
        return <Footprints size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4] py-32 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Unit */}
        <header className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 text-[#707040] text-xs font-bold uppercase tracking-[0.25em] mb-4 bg-[#707040]/5 px-3 py-1 rounded-full"
          >
            <Footprints size={12} />
            <span>{settings.cat_manager_badge}</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif text-stone-800 font-bold mb-8"
          >
            {settings.cat_manager_title}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <p className="text-stone-500 leading-loose text-lg font-light">
              {settings.cat_manager_desc}
            </p>
          </motion.div>
        </header>

        {/* Big Banner Photo */}
        <section className="mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            className="w-full aspect-video rounded-[3rem] overflow-hidden shadow-xl border border-stone-100 relative group"
          >
            <img 
              src={getStorageUrl(catBanner)} 
              alt="店長貓督工日常" 
              className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-700 group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none" />
            <div className="absolute bottom-6 left-8 text-white">
              <span className="text-[10px] font-bold tracking-widest uppercase bg-[#707040] text-white px-2.5 py-0.5 rounded-full mb-1 inline-block">
                現場直播
              </span>
              <p className="text-lg font-serif">午後 14:15 于 覓野生態茶塘前崗哨巡哨</p>
            </div>
          </motion.div>
        </section>

        {/* Profile Details & Roles */}
        <section className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <span className="text-xs font-extrabold text-[#707040] tracking-widest uppercase">
              {settings.cat_manager_credentials_tag}
            </span>
            <h2 className="text-3xl font-serif text-stone-800 font-bold leading-snug">
              {settings.cat_manager_role_title}：<br/>店長「{settings.cat_manager_feline_title}」
            </h2>
            <p className="text-stone-600 leading-relaxed font-light text-base">
              {settings.cat_manager_body_desc}
            </p>
            
            <div className="p-8 bg-white/70 border border-stone-100 rounded-3xl space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-stone-800">{settings.cat_manager_profile_heading}</h3>
              <ul className="space-y-2.5 text-stone-500 font-light text-sm">
                {profileItems.map((item, idx) => {
                  const parts = item.split('：');
                  if (parts.length > 1) {
                    return (
                      <li key={idx}>
                        <strong className="text-stone-700">{parts[0]}：</strong>
                        {parts.slice(1).join('：')}
                      </li>
                    );
                  }
                  return <li key={idx}>{item}</li>;
                })}
              </ul>
            </div>
          </div>

          <div className="space-y-8">
            {duties.map((duty, idx) => (
              <div key={idx} className="bg-white p-8 md:p-10 rounded-3xl border border-stone-100 shadow-sm flex gap-6">
                <div className="shrink-0 w-12 h-12 bg-[#707040]/10 rounded-2xl flex items-center justify-center text-[#707040]">
                  {renderDutyIcon(duty.icon)}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-stone-800">{duty.title}</h3>
                  <p className="text-xs font-light text-stone-500 leading-relaxed">
                    {duty.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Instagram Promotion Warm Dialogue Card */}
        <section className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full bg-[#F5F2EB]/80 p-8 md:p-12 rounded-[2.5rem] border border-[#707040]/10 flex flex-col md:flex-row items-center gap-8 lg:gap-12 shadow-sm relative overflow-hidden"
          >
            {/* Soft decorative background glow */}
            <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-[#E4405F]/5 blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -top-16 w-64 h-64 rounded-full bg-[#707040]/5 blur-3xl pointer-events-none" />

            {/* Left side: Dual circle of Xiaohua and Xiaohu showing as salon-style portraits */}
            <div className="flex flex-row items-center justify-center gap-5 sm:gap-6 shrink-0 relative z-10 md:py-2">
              {/* Xiaohua's salon portrait */}
              <div className="relative group/avatar">
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full bg-[#E5DFD3] border-4 border-white shadow-lg flex items-center justify-center overflow-hidden transition-all duration-300 group-hover/avatar:shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&h=400&q=80" 
                    alt="貓店長小花" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110 pointer-events-none select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#707040] text-[#F9F8F4] px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm border border-white tracking-wider whitespace-nowrap select-none">
                  總監督 小花
                </div>
              </div>

              {/* Xiaohu's salon portrait */}
              <div className="relative group/avatar">
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full bg-[#E5DFD3] border-4 border-white shadow-lg flex items-center justify-center overflow-hidden transition-all duration-300 group-hover/avatar:shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=400&h=400&q=80" 
                    alt="副店長小虎" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110 pointer-events-none select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#8C8675] text-[#F9F8F4] px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm border border-white tracking-wider whitespace-nowrap select-none">
                  副店長 小虎
                </div>
              </div>
            </div>

            {/* Right side: Rich Description text and Action Button */}
            <div className="flex-1 text-center md:text-left space-y-4 relative z-10 w-full">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-[10px] font-bold text-[#707040] tracking-widest uppercase bg-[#707040]/5 px-3 py-1 rounded-full select-none">
                  <span>Instagram Feed</span>
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-stone-800 font-bold tracking-wide">
                  在網站沒看夠？小花與小虎的日常都在這裡！
                </h3>
                <p className="text-stone-500 font-light text-sm md:text-base leading-relaxed max-w-2xl">
                  這裡只有拍到一半睡著的總監督、還有想偷吃茶葉的副店長。點擊下方追蹤我們的 Instagram，跟貓店長一起在拉拉山過日子！
                </p>
                <div className="text-[#707040]/90 font-medium text-xs md:text-sm pt-1 italic">
                  - 小花與小虎兩位店長貓都在 IG 活躍中，快來看看誰的崩壞日常最可愛！
                </div>
              </div>

              <div className="pt-2">
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href="https://www.instagram.com/miye.tea/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 bg-[#707040] hover:bg-[#5a5a31] text-white px-8 py-3.5 rounded-2xl text-xs md:text-sm font-extrabold tracking-widest transition-all shadow-md w-full md:w-auto"
                >
                  📸 前往覓野茶官方 IG 尋找貓店長
                </motion.a>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Whimsical Call Out */}
        <section className="text-center bg-[#F1EFEB] p-12 md:p-16 rounded-[3.5rem] border border-stone-200">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Feline Message</span>
          <h2 className="text-2xl font-serif text-stone-800 font-bold mb-6">「別走開，我正在暖床等你的茶湯泡好唷！」</h2>
          <p className="text-stone-500 max-w-lg mx-auto leading-relaxed font-light text-sm">
            店長暖暖提醒您：人生忙碌，別忘了像貓咪一樣，給自己一盞清茶的時間，舒展慵懶的身體，沉浸在大自然的芬芳當中。
          </p>
        </section>
      </div>
    </div>
  );
};
