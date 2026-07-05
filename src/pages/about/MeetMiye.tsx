import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { getSettings, SiteSettings } from '../../services/settingsService';
import { getStorageUrl } from '../../services/productService';
import { Mountain, Leaf, Award, Shield, Users, Globe } from 'lucide-react';

export const MeetMiye: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  const renderCommitmentIcon = (iconName: string) => {
    switch (iconName) {
      case 'Mountain':
        return <Mountain size={22} />;
      case 'Leaf':
        return <Leaf size={22} />;
      case 'Award':
        return <Award size={22} />;
      case 'Shield':
        return <Shield size={22} />;
      case 'Users':
        return <Users size={22} />;
      default:
        return <Leaf size={22} />;
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#F9F8F4] flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-[#707040] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F4] py-32 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <header className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-block text-[#707040] text-xs font-bold uppercase tracking-[0.2em] mb-4"
          >
            {settings.meet_miye_subtitle}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-5xl font-serif text-stone-800 font-bold mb-8 leading-tight"
          >
            {settings.meet_miye_title}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <p className="text-stone-500 leading-loose text-lg font-light">
              {settings.meet_miye_short_desc}
            </p>
          </motion.div>
        </header>

        {/* Story Section */}
        <section className="mb-32">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 space-y-6">
              <span className="text-xs font-extrabold text-[#707040] tracking-widest uppercase">
                {settings.meet_miye_origin_tagline}
              </span>
              <h2 className="text-3xl font-serif text-stone-800 font-bold leading-tight">
                {settings.meet_miye_origin_title}
              </h2>
              <p className="text-stone-600 leading-relaxed font-light text-base">
                {settings.meet_miye_origin_text1}
              </p>
              <p className="text-stone-500 leading-relaxed font-light text-sm">
                {settings.meet_miye_origin_text2}
              </p>
            </div>
            <div className="flex-1 w-full aspect-[4/5] rounded-[3rem] overflow-hidden shadow-xl border border-stone-100 bg-stone-100">
              <img 
                src={getStorageUrl(settings.meet_miye_image_url)} 
                alt="Taiwan Tea Garden" 
                className="w-full h-full object-cover select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </section>

        {/* Core Values / Our Commitment */}
        <section className="mb-32 bg-white/70 backdrop-blur-sm p-12 md:p-20 rounded-[3.5rem] border border-stone-100 shadow-sm">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-[#707040] tracking-widest uppercase">Our Commitment</span>
            <h2 className="text-3xl font-serif text-stone-800 font-bold mt-2">我們的五大堅持</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {(settings.meet_miye_commitments || []).map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-6 group"
              >
                <div className="shrink-0 w-12 h-12 bg-[#707040]/10 rounded-2xl flex items-center justify-center text-[#707040] group-hover:bg-[#707040] group-hover:text-white transition-all duration-300">
                  {renderCommitmentIcon(item.icon)}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-stone-800">{item.title}</h3>
                  <p className="text-stone-500 font-light text-sm leading-relaxed">{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Vision Section */}
        <section className="text-center py-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-14 h-14 bg-[#707040]/10 rounded-full mb-6"
          >
            <Globe size={26} className="text-[#707040]" />
          </motion.div>
          <span className="block text-xs font-bold text-[#707040] tracking-widest uppercase mb-2">Our Vision</span>
          <h2 className="text-3xl font-serif text-stone-800 font-bold mb-8">品牌願景</h2>
          <p className="text-stone-600 leading-loose text-lg max-w-2xl mx-auto font-light italic">
            "{settings.meet_miye_vision}"
          </p>
        </section>
      </div>
    </div>
  );
};
