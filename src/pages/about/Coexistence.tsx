import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getSettings, SiteSettings, BotanicalSpecimen } from '../../services/settingsService';
import { getStorageUrl } from '../../services/productService';
import { Leaf, Award, Compass, Heart, Activity, Eye, X, Volume2, VolumeX } from 'lucide-react';

export const Coexistence: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [selectedSpecimen, setSelectedSpecimen] = useState<BotanicalSpecimen | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isManualMutedRef = useRef(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!settings || !settings.coexistence_bg_audio) return;

    const audioUrl = getStorageUrl(settings.coexistence_bg_audio);
    const audio = new Audio(audioUrl);
    audio.loop = settings.coexistence_audio_loop !== false;
    audio.muted = isMuted;
    audioRef.current = audio;

    // Autoplay logic
    if (settings.coexistence_audio_autoplay !== false) {
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          console.log("Autoplay with sound was blocked initially (expected browser behavior):", err);
        });
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Smart interactive unblocking triggers
    const handleUserActivity = () => {
      if (audioRef.current && settings.coexistence_audio_autoplay !== false && !isManualMutedRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.muted = false;
          setIsMuted(false);
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch(e => console.log("Play recovering triggered on user action failed:", e));
        }
      }
    };

    window.addEventListener('click', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('scroll', handleUserActivity, { passive: true });
    window.addEventListener('wheel', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });

    return () => {
      audio.pause();
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('wheel', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      audioRef.current = null;
    };
  }, [settings]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    const newMuted = !isMuted;
    audioRef.current.muted = newMuted;
    setIsMuted(newMuted);
    isManualMutedRef.current = newMuted;

    if (!newMuted) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Playback failed upon explicit unmute:", err);
      });
    }
  };


  if (!settings) {
    return (
      <div className="min-h-screen bg-[#F9F8F4] flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-[#707040] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Map icon name to Lucide Icon
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Leaf':
        return <Leaf size={24} />;
      case 'Activity':
        return <Activity size={24} />;
      case 'Award':
        return <Award size={24} />;
      default:
        return <Leaf size={24} />;
    }
  };

  const specimens = settings.specimens || [];
  const coexistenceCards = settings.coexistence_cards || [];

  return (
    <div className="min-h-screen bg-[#F9F8F4] py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Title */}
        <header className="text-center mb-24 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[#707040] text-xs font-bold uppercase tracking-[0.25em] mb-4"
          >
            {settings.coexistence_subtitle}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-serif text-stone-800 font-bold mb-8"
          >
            {settings.coexistence_title}
          </motion.h1>
          <p className="text-stone-500 leading-loose text-lg font-light">
            {settings.coexistence_desc}
          </p>
        </header>

        {/* Section A: 茶草共生 */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <span className="text-[#707040] text-xs font-bold uppercase tracking-widest block mb-2">
              {settings.coexistence_section_subtitle}
            </span>
            <h2 className="text-3xl font-serif text-stone-800 font-bold">
              {settings.coexistence_section_title}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {coexistenceCards.map((card, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-12 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300"
              >
                <div className="space-y-6">
                  <div className="w-14 h-14 bg-[#707040]/10 rounded-2xl flex items-center justify-center text-[#707040]">
                    {renderIcon(card.icon)}
                  </div>
                  <h3 className="text-xl font-bold text-stone-800">{card.title}</h3>
                  <p className="text-stone-500 leading-relaxed font-light text-sm">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-stone-50 text-[11px] font-bold text-[#707040] tracking-widest uppercase">
                  {card.label}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section B: 生態大觀園（生態池） */}
        <section className="mb-24">
          <div className="text-center mb-16 max-w-2xl mx-auto space-y-4">
            <span className="text-[#707040] text-xs font-bold uppercase tracking-widest block">The Eco-Oasis</span>
            <h2 className="text-3xl font-serif text-stone-800 font-bold">生態大觀園 (生態池)</h2>
            <p className="text-stone-500 font-light text-sm leading-relaxed">
              我們在茶地之核心挖掘一座自循環生態池。以無污染高山泉流不間斷活水供養，這片濕地逐漸復育出數十種水陸花草與野趣生物。點擊卡片探索大自然的豐足：
            </p>
          </div>

          {specimens.length === 0 ? (
            <div className="text-center py-20 text-stone-400 font-light border-2 border-dashed border-stone-200 rounded-[2rem]">
              還沒有新增任何花草或動物圖鑑卡片。可以前往後台「店長貓與品牌專區」新增卡片！
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {specimens.map((specimen, idx) => (
                <motion.div
                  key={specimen.id || idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.04 }}
                  whileHover={{ y: -6 }}
                  onClick={() => setSelectedSpecimen(specimen)}
                  className="bg-white rounded-[2rem] overflow-hidden border border-stone-100 shadow-sm cursor-pointer group hover:shadow-md transition-all duration-300 flex flex-col h-full"
                >
                  <div className="aspect-square w-full overflow-hidden bg-stone-100 relative">
                    <img 
                      src={getStorageUrl(specimen.image)}
                      alt={specimen.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 select-none pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-stone-900/20 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-stone-600 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 shadow">
                        <Eye size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="py-4.5 px-6 text-center bg-white">
                    <h3 className="text-sm font-medium tracking-wide text-stone-700 group-hover:text-[#707040] transition-colors font-sans">
                      {specimen.name}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Specimen Detail Modal */}
        <AnimatePresence>
          {selectedSpecimen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedSpecimen(null)}
                className="fixed inset-0 bg-stone-950/40 backdrop-blur-md z-[100]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed inset-x-6 bottom-6 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 max-w-xl w-full bg-[#FBFBFA] rounded-[3rem] overflow-hidden shadow-2xl z-[110] border border-stone-200"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-stone-100">
                  <img 
                    src={getStorageUrl(selectedSpecimen.image)}
                    alt={selectedSpecimen.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <button
                    onClick={() => setSelectedSpecimen(null)}
                    className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur-md text-stone-700 rounded-full flex items-center justify-center hover:bg-white active:scale-95 shadow transition-all duration-300"
                  >
                    <X size={18} />
                  </button>
                  <div className="absolute bottom-6 left-8 text-white text-left">
                    <span className="text-[10px] font-bold tracking-widest bg-[#707040] text-white px-2.5 py-0.5 rounded-full uppercase mb-2 inline-block">
                      {(selectedSpecimen.category === 'flora' || selectedSpecimen.category as string === '濕地' || selectedSpecimen.category as string === '茶園護航百草') ? '茶園護航百草' : '茶地守護動物'}
                    </span>
                    <h2 className="text-2xl font-bold font-serif">{selectedSpecimen.name}</h2>
                    <p className="text-xs text-stone-200 font-light line-clamp-1">{selectedSpecimen.scientificName}</p>
                  </div>
                </div>
                <div className="p-8 md:p-10 space-y-6 text-left">
                  {/* Custom Highlighted Nature Mission Block */}
                  <div className="space-y-2 bg-[#707040]/5 p-5 rounded-2xl border border-[#707040]/10">
                    <div className="flex items-center gap-1.5 text-[#707040]">
                      <Leaf size={14} className="animate-pulse shrink-0" />
                      <h4 className="text-[9px] font-bold uppercase tracking-widest font-sans">它的秘密任務 / Nature Mission</h4>
                    </div>
                    <p className="text-stone-800 font-serif font-bold text-base md:text-lg pl-4.5 border-l-2 border-[#707040]/70 leading-relaxed">
                      {selectedSpecimen.role}
                    </p>
                  </div>

                  <div className="h-[1px] bg-stone-200/60" />

                  {/* Integrated Coexistence Story & Value Info */}
                  <div className="space-y-2">
                    <h4 className="text-[9px] font-bold text-stone-400 uppercase tracking-widest font-sans">共生故事 / Story & Value</h4>
                    <p className="text-stone-600 font-light text-sm leading-loose tracking-wide whitespace-pre-line pl-1">
                      {selectedSpecimen.desc}
                    </p>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => setSelectedSpecimen(null)}
                      className="bg-[#707040] text-white text-xs font-bold tracking-widest px-6 py-3 rounded-full hover:bg-[#5c5c32] transition-all active:scale-95 shadow-sm"
                    >
                      關閉探索
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Elegant Floating Background Music Wave Visualizer */}
        {settings.coexistence_bg_audio && (
          <div className="fixed bottom-8 right-8 z-[90]">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMute}
              className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-stone-200/60 shadow-lg px-4.5 py-3 rounded-full text-[#707040] hover:text-[#5c5c32] hover:bg-white active:scale-95 transition-all outline-none duration-300 pointer-events-auto"
              title={isMuted ? "恢復音樂播放" : "靜音背景音樂"}
            >
              {/* Audio Wave Visualizer bar indicator */}
              <div className="flex items-end gap-[3px] h-3 w-4">
                <span className={`w-[2.5px] rounded-full bg-[#707040] transition-colors origin-bottom ${
                  !isMuted && isPlaying ? 'animate-audio-bar-1 h-3' : 'h-1.5'
                }`} />
                <span className={`w-[2.5px] rounded-full bg-[#707040] transition-colors origin-bottom ${
                  !isMuted && isPlaying ? 'animate-audio-bar-2 h-2.5' : 'h-2'
                }`} />
                <span className={`w-[2.5px] rounded-full bg-[#707040] transition-colors origin-bottom ${
                  !isMuted && isPlaying ? 'animate-audio-bar-3 h-3.5' : 'h-3'
                }`} />
                <span className={`w-[2.5px] rounded-full bg-[#707040] transition-colors origin-bottom ${
                  !isMuted && isPlaying ? 'animate-audio-bar-4 h-2' : 'h-1'
                }`} />
              </div>

              {/* Infinite scrolling marquee text */}
              <div className="w-[120px] sm:w-[155px] overflow-hidden whitespace-nowrap select-none font-sans text-[11px] font-semibold text-[#707040] relative">
                <div className={`animate-marquee-loop whitespace-nowrap flex transition-opacity duration-300 ${isMuted ? 'opacity-40' : 'opacity-100'}`}>
                  <span className="pr-12 shrink-0">聆聽此時此刻，來自拉拉山茶園現場的蟲鳴鳥叫</span>
                  <span className="pr-12 shrink-0" aria-hidden="true">聆聽此時此刻，來自拉拉山茶園現場的蟲鳴鳥叫</span>
                </div>
              </div>

              {isMuted ? (
                <VolumeX size={14} className="text-stone-400" />
              ) : (
                <Volume2 size={14} className="text-[#707040]" />
              )}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};
