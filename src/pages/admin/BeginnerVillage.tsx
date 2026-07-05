import React, { useState, useEffect, useRef } from 'react';
import { 
  getVillageConfig, 
  updateVillageConfig, 
  getVillageStats, 
  clearVillageStats,
  DEFAULT_VILLAGE_CONFIG,
  BeginnerVillageConfig,
  VillageStage,
  ScoreRange,
  ZodiacMapping,
  Question
} from '../../services/beginnerVillageService';
import { 
  Save, 
  Award, 
  HelpCircle, 
  Plus, 
  Trash2, 
  BarChart2, 
  Compass, 
  FileText, 
  Settings, 
  Grid, 
  Calendar,
  AlertCircle,
  Share2,
  Image as LucideImage,
  Upload,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase, supabaseUrl } from '../../db';
import { ImageUploader } from '../../components/admin/ImageUploader';
import { uploadImage } from '../../services/storageService';

export const AdminBeginnerVillage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<BeginnerVillageConfig | null>(null);
  const [stats, setStats] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'stats' | 'map' | 'stages' | 'ultimate'>('stats');
  const [selectedStageId, setSelectedStageId] = useState<string>('personality');

  // Background map image upload states
  const [bgDragging, setBgDragging] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleClearStats = async () => {
    if (resetConfirmText !== 'CONFIRM_RESET') {
      return;
    }
    setIsResetting(true);
    try {
      await clearVillageStats();
      // Reload stats to get fresh cleared values
      const freshStats = await getVillageStats();
      setStats(freshStats || {});
      toast.success('測試數據與大盤點點擊紀錄已安全重置歸零！');
      setShowResetDialog(false);
      setResetConfirmText('');
    } catch (err: any) {
      toast.error('執行清空失敗：' + (err?.message || '未知錯誤'));
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [configData, statsData] = await Promise.all([
          getVillageConfig(),
          getVillageStats()
        ]);
        setConfig(configData);
        setStats(statsData || {});
      } catch (err) {
        toast.error('讀取後台資料失敗');
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const handleUpdateConfig = async (newConfig: BeginnerVillageConfig) => {
    try {
      toast.loading('正在儲存設定...');
      const saved = await updateVillageConfig(newConfig);
      setConfig(saved);
      toast.dismiss();
      toast.success('新手村配置儲存成功！');
    } catch (err) {
      toast.dismiss();
      toast.error('儲存配置時出錯，請確認網路連線');
    }
  };

  const handleStagePropChange = (stageId: string, updatedStage: Partial<VillageStage>) => {
    if (!config) return;
    const nextStages = config.stages.map(s => {
      if (s.id === stageId) {
        return { ...s, ...updatedStage } as VillageStage;
      }
      return s;
    });
    setConfig({ ...config, stages: nextStages });
  };

  const handleAddQuestion = (stageId: string) => {
    if (!config) return;
    const stage = config.stages.find(s => s.id === stageId);
    if (!stage) return;
    
    const timestamp = Date.now() + Math.floor(Math.random() * 1000);
    const newQuestionId = `q_${timestamp}`;
    const newQuestion: Question = {
      id: newQuestionId,
      text: '新問題題目描述...',
      options: [
        { id: `opt_a_${timestamp}`, text: '選項 A 描述...', score: 4 },
        { id: `opt_b_${timestamp}`, text: '選項 B 描述...', score: 3 },
        { id: `opt_c_${timestamp}`, text: '選項 C 描述...', score: 2 },
        { id: `opt_d_${timestamp}`, text: '選項 D 描述...', score: 1 }
      ]
    };
    
    const nextQuestions = [...(stage.questions || []), newQuestion];
    handleStagePropChange(stageId, { questions: nextQuestions });
    toast.success('已新增一題，別忘了點選上方「儲存所有變更」！');
  };

  const handleDeleteQuestion = (stageId: string, questionId: string) => {
    if (!config) return;
    const stage = config.stages.find(s => s.id === stageId);
    if (!stage) return;
    
    if (stage.questions.length <= 1) {
      toast.error('關卡至少需要保留一題作答。');
      return;
    }
    
    const nextQuestions = stage.questions.filter(q => q.id !== questionId);
    handleStagePropChange(stageId, { questions: nextQuestions });
    toast.success('題目已移除，點選上方「儲存所有變更」生效！');
  };

  const handleBgFile = async (file: File) => {
    if (!config) return;
    if (!file.type.startsWith('image/')) {
      toast.error('請上傳圖片檔案');
      return;
    }

    setBgUploading(true);
    const loadingToast = toast.loading('正在上傳大背景圖片...');

    try {
      const publicUrl = await uploadImage(file, 'novice-village', '', false, 'map_background');
      setConfig({
        ...config,
        map_background: publicUrl
      });
      toast.success('大背景圖片上傳成功！請記得點選上方「儲存目前所有變更」按鈕。', { id: loadingToast });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || '圖片上傳失敗，請檢查網路設定與儲存桶大小限制', { id: loadingToast });
    } finally {
      setBgUploading(false);
    }
  };

  const selectedStage = config?.stages.find(s => s.id === selectedStageId);

  // Helper, get total votes for a option to calculate percentage
  const getOptionStatsCount = (stageId: string, questionId: string, optionId: string): number => {
    if (!stats || !stats[stageId] || !stats[stageId][questionId]) return 0;
    return stats[stageId][questionId][optionId] || 0;
  };

  const getQuestionTotalVotes = (stageId: string, questionId: string): number => {
    if (!stats || !stats[stageId] || !stats[stageId][questionId]) return 0;
    const qStats = stats[stageId][questionId];
    return Object.values(qStats).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0) as number;
  };

  if (loading || !config) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-8 h-8 border-4 border-[#707040] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-stone-500 text-sm">正在載入新手村管理面板...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-100">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-wide text-stone-800">
            新手村探險管理
          </h1>
          <p className="text-sm text-[#4b5563] font-normal mt-1 leading-normal">
            設定開放式地圖探索、管理答題分數區間、上傳專屬結果圖卡，並即時分析使用者的測驗取向。
          </p>
        </div>
        <button
          onClick={() => handleUpdateConfig(config)}
          className="bg-[#707040] hover:bg-[#5a5a31] text-white px-6 py-3 rounded-xl text-xs font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg transition"
        >
          <Save size={16} /> 儲存目前所有變更
        </button>
      </div>

      {/* Primary administrative tabs */}
      <div className="flex flex-wrap border-b border-stone-200 gap-1 md:gap-2">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-3 text-xs font-bold tracking-wider transition border-b-2 uppercase ${
            activeTab === 'stats' 
              ? 'border-[#707040] text-[#707040]' 
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <span className="flex items-center gap-1.5"><BarChart2 size={14} /> 即時數據統計</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-3 text-xs font-bold tracking-wider transition border-b-2 uppercase ${
            activeTab === 'map' 
              ? 'border-[#707040] text-[#707040]' 
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <span className="flex items-center gap-1.5"><Grid size={14} /> 整體地圖設定</span>
        </button>
        <button
          onClick={() => setActiveTab('stages')}
          className={`px-4 py-3 text-xs font-bold tracking-wider transition border-b-2 uppercase ${
            activeTab === 'stages' 
              ? 'border-[#707040] text-[#707040]' 
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <span className="flex items-center gap-1.5"><Compass size={14} /> 關卡與結果圖卡管理</span>
        </button>
        <button
          onClick={() => setActiveTab('ultimate')}
          className={`px-4 py-3 text-xs font-bold tracking-wider transition border-b-2 uppercase ${
            activeTab === 'ultimate' 
              ? 'border-[#707040] text-[#707040]' 
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <span className="flex items-center gap-1.5"><Award size={14} /> 通關全部 5 關獎勵頁</span>
        </button>
      </div>

      {/* TAB MAIN VIEWPORTS */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                <BarChart2 size={16} className="text-[#707040]" /> 
                所有使用者單題點擊大盤點 (包含匿名與會員中途行為)
              </h3>
              <button
                type="button"
                onClick={() => setShowResetDialog(true)}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider flex items-center gap-1.5 transition shrink-0 shadow-xs"
              >
                <Trash2 size={14} /> 
                清空測試數據
              </button>
            </div>
            
            <div className="space-y-8 divide-y divide-stone-100">
              {config.stages.map((stage) => {
                const totalStageInteractions = stage.questions.reduce((sum, q) => sum + getQuestionTotalVotes(stage.id, q.id), 0) + 
                  (stage.id === 'zodiac' ? getQuestionTotalVotes('zodiac', 'zodiac_select') : 0);

                return (
                  <div key={stage.id} className="pt-6 first:pt-0 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-700 bg-stone-100 px-3 py-1 rounded-full">{stage.name}</span>
                      <span className="text-[11px] text-stone-400 font-medium">累積與本區互動：{totalStageInteractions} 人次</span>
                    </div>

                    {stage.id === 'zodiac' ? (
                      <div className="space-y-3">
                        <p className="text-xs text-stone-400">星座本命星緣選擇統計：</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 text-left">
                          {['牡羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座', '天秤座', '天蠍座', '射手座', '摩羯座', '水瓶座', '雙魚座'].map(zodiac => {
                            const clicks = getOptionStatsCount('zodiac', 'zodiac_select', zodiac);
                            const total = getQuestionTotalVotes('zodiac', 'zodiac_select') || 1;
                            const percentage = Math.round((clicks / total) * 100);

                            return (
                              <div key={zodiac} className="bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-stone-700">{zodiac}</span>
                                  <span className="text-stone-500 font-mono">{clicks} 次 ({percentage}%)</span>
                                </div>
                                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-[#E39B24] h-full" style={{ width: `${percentage}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {stage.questions.map((q, qIndex) => {
                          const questionTotalRaw = getQuestionTotalVotes(stage.id, q.id);
                          const questionTotal = questionTotalRaw || 1;

                          return (
                            <div key={q.id} className="space-y-3 text-left">
                              <h4 className="text-xs font-semibold text-stone-800 leading-relaxed">
                                Q{qIndex + 1}: {q.text} (累積統計: {questionTotalRaw} 票)
                              </h4>
                              <div className="space-y-2">
                                {q.options.map((opt) => {
                                  const votes = getOptionStatsCount(stage.id, q.id, opt.id);
                                  const percent = Math.round((votes / questionTotal) * 100);

                                  return (
                                    <div key={opt.id} className="space-y-1">
                                      <div className="flex justify-between text-[11px] text-stone-600">
                                        <span className="line-clamp-1">{opt.text} (權重: {opt.score}分)</span>
                                        <span className="font-mono font-semibold shrink-0">{votes}票 ({percent}%)</span>
                                      </div>
                                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                                        <div 
                                          className="bg-[#707040] h-full transition-all duration-500" 
                                          style={{ width: `${percent}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stages' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
          {/* Left panel: stage picker */}
          <div className="space-y-2 bg-white border border-stone-100 rounded-2xl p-4 shadow-sm h-fit">
            <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-widest pl-2">選擇關卡配置</span>
            {config.stages.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStageId(s.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all text-xs font-semibold tracking-wide flex items-center justify-between ${
                  selectedStageId === s.id
                    ? 'bg-[#707040] text-white'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
                }`}
              >
                <span>{s.name}</span>
                {s.id === 'personality' && <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-extrabold">CORE</span>}
              </button>
            ))}
          </div>

          {/* Right panel: editor body */}
          <div className="md:col-span-3 space-y-6">
            {selectedStage && (
              <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-stone-800 tracking-wide">
                    編輯「{selectedStage.name}」關卡明細
                  </h3>
                  <p className="text-sm text-[#4b5563] font-normal mt-1 leading-normal">
                    在此編輯該關卡的顯示名稱、特定題庫、對應結果區間與圖卡設定。
                  </p>
                </div>

                {/* 關卡前導設定 */}
                <div className="p-5 bg-amber-50/20 border border-amber-500/10 rounded-2xl space-y-4 text-left">
                  <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E39B24]"></span>
                    關卡前導說明與故事引言包裝
                  </h4>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    在進入關卡真正解答前，先展示之引言故事、玩法包裝及形象過場大圖，能引導玩家更有儀式感地開啟旅程。
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-stone-500 block mb-1">
                        關卡前導過場圖 (Intro Image)
                      </label>
                      <ImageUploader
                        value={selectedStage.introImage || ''}
                        onChange={(url) => {
                          handleStagePropChange(selectedStageId, { introImage: url });
                        }}
                        label=""
                        hint="建議上傳 600 × 450 像素 (4:3 比例) 圖片"
                        aspectRatio="aspect-[4/3] max-w-[280px]"
                        bucket="novice-village"
                        pathPrefix={selectedStageId}
                        customFileName="intro_image"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-stone-500 block">
                        關卡前導引言文字 (Intro Text)
                      </label>
                      <textarea
                        value={selectedStage.introText || ''}
                        onChange={(e) => {
                          handleStagePropChange(selectedStageId, { introText: e.target.value });
                        }}
                        placeholder="請輸入進入該關卡前之背景引言故事。可以用換行多段排版。"
                        className="w-full h-[180px] bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold leading-relaxed focus:ring-1 focus:ring-[#707040]"
                        rows={6}
                      />
                    </div>
                  </div>
                </div>

                {/* 1. Questions Block (Skip of zodiac) */}
                {selectedStage.id !== 'zodiac' && selectedStage.questions ? (
                  <div className="space-y-4 pt-4 border-t border-stone-100">
                    <h4 className="text-xs font-bold text-stone-800">題庫與作答權重管理</h4>
                    
                    {selectedStage.questions.map((q, qIdx) => (
                      <div key={q.id} className="bg-stone-50 p-4 border border-stone-200/50 rounded-2xl space-y-4 text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold text-[#707040]">第 {qIdx + 1} 題</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(selectedStage.id, q.id)}
                            className="text-stone-400 hover:text-red-500 font-bold p-1 rounded transition-colors"
                            title="刪除此題目"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-stone-500">問題題目文字</label>
                          <textarea
                            value={q.text}
                            onChange={(e) => {
                              const nextQs = (selectedStage.questions || []).map(item => {
                                if (item.id === q.id) return { ...item, text: e.target.value };
                                  return item;
                              });
                              handleStagePropChange(selectedStageId, { questions: nextQs });
                            }}
                            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-[#707040]"
                            rows={2}
                          />
                        </div>

                        {/* Options list inside question */}
                        <div className="space-y-2.5">
                          <label className="text-[10px] uppercase font-bold text-stone-400 tracking-widest pl-0.5">選項與分數權利分配</label>
                          
                          {q.options.map((opt, optIdx) => (
                            <div key={opt.id} className="flex gap-2 items-center">
                              <span className="text-[11px] font-mono text-stone-400 font-extrabold w-6">{String.fromCharCode(65 + optIdx)}</span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const nextOptions = q.options.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o);
                                  const nextQs = (selectedStage.questions || []).map(item => item.id === q.id ? { ...item, options: nextOptions } : item);
                                  handleStagePropChange(selectedStageId, { questions: nextQs });
                                }}
                                className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium"
                                placeholder="選項文字"
                              />
                              <input
                                type="number"
                                value={opt.score}
                                onChange={(e) => {
                                  const nextOptions = q.options.map(o => o.id === opt.id ? { ...o, score: parseInt(e.target.value) || 0 } : o);
                                  const nextQs = (selectedStage.questions || []).map(item => item.id === q.id ? { ...item, options: nextOptions } : item);
                                  handleStagePropChange(selectedStageId, { questions: nextQs });
                                }}
                                className="w-20 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-center text-[#707040]"
                                placeholder="得分"
                              />
                              <span className="text-[10px] text-stone-400 shrink-0 font-medium font-sans">分</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddQuestion(selectedStage.id)}
                      className="w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-stone-200 hover:border-[#707040] hover:bg-[#707040]/5 text-stone-500 hover:text-[#707040] py-3.5 px-4 rounded-2xl text-xs font-semibold tracking-wider transition-all"
                    >
                      <Plus size={14} /> 新增關卡題目
                    </button>
                  </div>
                ) : null}

                {/* 2. Zodiac mappings Editor */}
                {selectedStage.id === 'zodiac' && selectedStage.zodiacMappings && (
                  <div className="space-y-4 pt-4 border-t border-stone-100">
                    <h4 className="text-xs font-bold text-stone-800">星座象性結果與預製圖卡管理</h4>
                    <p className="text-sm text-[#4b5563] font-normal mt-1 leading-normal">12 個星座對應結果卡片配置與詳細說明文字編輯：</p>

                    <div className="space-y-4">
                      {selectedStage.zodiacMappings.map((mapping, idx) => (
                        <div key={idx} className="bg-stone-50 p-4 border border-stone-200/50 rounded-2xl space-y-4 text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200/40">
                            <div className="flex items-center gap-2 flex-grow">
                              <span className="text-[11px] font-bold text-[#E39B24] shrink-0">對應結果卡稱呼:</span>
                              <input
                                type="text"
                                value={mapping.title}
                                onChange={(e) => {
                                  const nextMappings = selectedStage.zodiacMappings!.map((m, mIdx) => 
                                    mIdx === idx ? { ...m, title: e.target.value } : m
                                  );
                                  handleStagePropChange(selectedStageId, { zodiacMappings: nextMappings });
                                }}
                                className="bg-white border border-stone-200 rounded px-2 py-1 text-xs font-bold font-sans text-stone-800 flex-grow"
                                placeholder="例如: 1. 牡羊座 × 春回紅茶貓"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const nextMappings = selectedStage.zodiacMappings!.filter((_, mIdx) => mIdx !== idx);
                                handleStagePropChange(selectedStageId, { zodiacMappings: nextMappings });
                                toast.success('已刪除此星座對應配置，儲存所有變更後生效！');
                              }}
                              className="text-stone-400 hover:text-red-500 font-bold p-1 rounded hover:bg-stone-105 transition shrink-0"
                              title="刪除此星座配置"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-stone-500 mb-1 block">結果成果圖卡上傳</label>
                              <ImageUploader
                                value={mapping.image}
                                onChange={(url) => {
                                  const nextMappings = selectedStage.zodiacMappings!.map((m, mIdx) => 
                                    mIdx === idx ? { ...m, image: url } : m
                                  );
                                  handleStagePropChange(selectedStageId, { zodiacMappings: nextMappings });
                                }}
                                label=""
                                hint="建議上傳 1080 × 1920 像素 (9:16 比例) 高清直式圖"
                                aspectRatio="aspect-[9/16] max-w-[240px]"
                                bucket="novice-village"
                                pathPrefix="zodiac"
                                customFileName={`zodiac_${idx}_result`}
                              />
                            </div>
                            <div className="space-y-4 flex flex-col justify-between">
                              <div className="space-y-1.5 flex-grow">
                                <label className="text-[11px] font-bold text-stone-500 block">結果詳細文案</label>
                                <textarea
                                  value={mapping.description || ''}
                                  onChange={(e) => {
                                    const nextMappings = selectedStage.zodiacMappings!.map((m, mIdx) => 
                                      mIdx === idx ? { ...m, description: e.target.value } : m
                                    );
                                    handleStagePropChange(selectedStageId, { zodiacMappings: nextMappings });
                                  }}
                                  placeholder="請直接貼上對應該卡片的詳細文字內容（如：【你的星座茶緣】短評、拉拉山野放條件與標籤）"
                                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold leading-relaxed"
                                  rows={6}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-stone-500 block">專屬社群邀請文案</label>
                                <textarea
                                  value={mapping.socialText}
                                  onChange={(e) => {
                                    const nextMappings = selectedStage.zodiacMappings!.map((m, mIdx) => 
                                      mIdx === idx ? { ...m, socialText: e.target.value } : m
                                    );
                                    handleStagePropChange(selectedStageId, { zodiacMappings: nextMappings });
                                  }}
                                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newMapping: ZodiacMapping = {
                          zodiacs: [],
                          title: `全新星座茶緣配置 ${selectedStage.zodiacMappings!.length + 1}`,
                          image: '',
                          socialText: '我在物我的「星座茶緣」探索中，我尋找到了專屬星座茶緣，快來加入！',
                          description: ''
                        };
                        const nextMappings = [...(selectedStage.zodiacMappings || []), newMapping];
                        handleStagePropChange(selectedStageId, { zodiacMappings: nextMappings });
                        toast.success('已新增一筆星座茶緣配置！請輸入標題、文案並上傳圖卡。');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-stone-200 hover:border-[#E39B24] hover:bg-[#E39B24]/5 text-stone-500 hover:text-[#E39B24] py-3.5 px-4 rounded-2xl text-xs font-semibold tracking-wider transition-all"
                    >
                      <Plus size={14} /> 新增星座對應結果配置
                    </button>
                  </div>
                )}

                {/* 3. Score Ranges Editor (Except Zodiac) */}
                {selectedStage.id !== 'zodiac' && selectedStage.ranges && (
                  <div className="space-y-4 pt-4 border-t border-stone-100">
                    <h4 className="text-xs font-bold text-stone-800">答題積分區間與結果圖卡</h4>
                    <p className="text-sm text-[#4b5563] font-normal mt-1 leading-normal">設定答題累積之分數門檻，並對應專屬結果卡：</p>

                    <div className="space-y-4">
                      {selectedStage.ranges.map((range, idx) => (
                        <div key={range.id} className="bg-stone-50 p-4 border border-stone-200/50 rounded-2xl space-y-4 text-left">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-stone-200/40">
                            <div className="flex items-center gap-2 flex-grow">
                              <span className="text-[11px] font-bold text-[#707040] shrink-0">結果標題:</span>
                              <input
                                type="text"
                                value={range.title}
                                onChange={(e) => {
                                  const nextRanges = selectedStage.ranges!.map(r => r.id === range.id ? { ...r, title: e.target.value } : r);
                                  handleStagePropChange(selectedStageId, { ranges: nextRanges });
                                }}
                                className="bg-white border border-stone-200 rounded px-2 py-1 text-xs font-bold font-sans text-stone-800 flex-grow"
                                placeholder="請填寫結果名稱..."
                              />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1 text-xs text-stone-600">
                                <span className="text-[10px] font-medium text-stone-500">門檻：</span>
                                <input
                                  type="number"
                                  value={range.minScore}
                                  onChange={(e) => {
                                    const nextRanges = selectedStage.ranges!.map(r => r.id === range.id ? { ...r, minScore: parseInt(e.target.value) || 0 } : r);
                                    handleStagePropChange(selectedStageId, { ranges: nextRanges });
                                  }}
                                  className="w-12 bg-white border border-stone-200 rounded px-1 py-0.5 text-center font-bold text-xs"
                                />
                                <span className="text-stone-400">~</span>
                                <input
                                  type="number"
                                  value={range.maxScore}
                                  onChange={(e) => {
                                    const nextRanges = selectedStage.ranges!.map(r => r.id === range.id ? { ...r, maxScore: parseInt(e.target.value) || 0 } : r);
                                    handleStagePropChange(selectedStageId, { ranges: nextRanges });
                                  }}
                                  className="w-12 bg-white border border-stone-200 rounded px-1 py-0.5 text-center font-bold text-xs"
                                />
                                <span className="text-[10px] text-stone-500">分</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextRanges = selectedStage.ranges!.filter(r => r.id !== range.id);
                                  handleStagePropChange(selectedStageId, { ranges: nextRanges });
                                  toast.success('已刪除該區間設定，儲存變更後生效！');
                                }}
                                className="text-stone-400 hover:text-red-500 font-bold p-1 rounded hover:bg-stone-100 transition"
                                title="刪除此區間"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-stone-500 mb-1 block">結果成果圖卡上傳</label>
                              <ImageUploader
                                value={range.image}
                                onChange={(url) => {
                                  const nextRanges = selectedStage.ranges!.map(r => r.id === range.id ? { ...r, image: url } : r);
                                  handleStagePropChange(selectedStageId, { ranges: nextRanges });
                                }}
                                label=""
                                hint="建議上傳 1080 × 1920 像素 (9:16 比例) 高清直式圖"
                                aspectRatio="aspect-[9/16] max-w-[240px]"
                                bucket="novice-village"
                                pathPrefix={selectedStage.id}
                                customFileName={`range_${idx}_result`}
                              />
                            </div>
                            <div className="space-y-4 flex flex-col justify-between">
                              <div className="space-y-1.5 flex-grow">
                                <label className="text-[11px] font-bold text-stone-500 block">結果詳細文案</label>
                                <textarea
                                  value={range.description || ''}
                                  onChange={(e) => {
                                    const nextRanges = selectedStage.ranges!.map(r => r.id === range.id ? { ...r, description: e.target.value } : r);
                                    handleStagePropChange(selectedStageId, { ranges: nextRanges });
                                  }}
                                  placeholder="請直接貼上對應該圖卡的詳細文字內容"
                                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold leading-relaxed"
                                  rows={6}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-stone-500 block">專屬社群邀請文案</label>
                                <textarea
                                  value={range.socialText}
                                  onChange={(e) => {
                                    const nextRanges = selectedStage.ranges!.map(r => r.id === range.id ? { ...r, socialText: e.target.value } : r);
                                    handleStagePropChange(selectedStageId, { ranges: nextRanges });
                                  }}
                                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const timestamp = Date.now() + Math.floor(Math.random() * 1000);
                        const newRangeId = `range_${timestamp}`;
                        const newRange: ScoreRange = {
                          id: newRangeId,
                          minScore: 0,
                          maxScore: 100,
                          title: `新結果區間 ${selectedStage.ranges!.length + 1}`,
                          image: '',
                          socialText: '我是新解鎖茶尋旅伴！快來在覓野茶新手村解鎖你的專屬本色吧！',
                          description: ''
                        };
                        const nextRanges = [...(selectedStage.ranges || []), newRange];
                        handleStagePropChange(selectedStageId, { ranges: nextRanges });
                        toast.success('已新增一筆積分區間項目！請輸入門檻數值、結果標題並上傳結果圖卡。');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-stone-200 hover:border-[#707040] hover:bg-[#707040]/5 text-stone-500 hover:text-[#707040] py-3.5 px-4 rounded-2xl text-xs font-semibold tracking-wider transition-all"
                    >
                      <Plus size={14} /> 新增積分結果區間卡片
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'map' && (
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Section 1: Overall Map Config */}
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm space-y-6 text-left">
            <div>
              <h3 className="text-sm font-bold text-stone-800 tracking-wide flex items-center gap-1.5">
                <Compass size={16} className="text-[#707040]" />
                整體地圖探索頁文字設定
              </h3>
              <p className="text-sm text-[#4b5563] font-normal mt-1 leading-normal">
                設定新手村地圖入口上方與下方所顯示的導覽前導文字及尾頁說明。
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">上方前導說明文字 (地圖上方文字區)</label>
                <textarea
                  value={config.map_subtitle || ''}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      map_subtitle: e.target.value
                    });
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs font-semibold leading-relaxed animate-none"
                  rows={3}
                  placeholder="請輸入前置地圖引言介紹..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">下方通關解鎖提示/尾頁宣告 (地圖下方提示卡文字)</label>
                <textarea
                  value={config.map_footer_tip || ''}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      map_footer_tip: e.target.value
                    });
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs font-semibold leading-relaxed animate-none"
                  rows={2}
                  placeholder="請輸入底部通關解鎖提示..."
                />
              </div>
            </div>
          </div>

          {/* New Section: Navbar Brand & Logo Controls */}
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm space-y-6 text-left">
            <div>
              <h3 className="text-sm font-bold text-stone-800 tracking-wide flex items-center gap-1.5">
                <Settings size={16} className="text-[#707040]" />
                導覽列品牌與 Logo 視覺控制
              </h3>
              <p className="text-sm text-[#4b5563] font-normal mt-1 leading-normal">
                調整前端導覽列中「覓野茶圓形標誌」與緊鄰之「品牌文字」的外觀尺寸，系統將自動調整版面比例。
              </p>
            </div>

            <div className="space-y-6">
              {/* Logo Size Control */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-stone-700 block">
                    Logo 圖片尺寸 (圓形標誌)
                  </label>
                  <span className="text-xs font-extrabold font-mono text-[#707040] bg-[#707040]/10 px-2 py-0.5 rounded-full">
                    {config.navbar_logo_size !== undefined ? config.navbar_logo_size : 48}px
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-stone-400 font-medium">32px</span>
                  <input
                    type="range"
                    min="32"
                    max="128"
                    step="1"
                    value={config.navbar_logo_size !== undefined ? config.navbar_logo_size : 48}
                    onChange={(e) => {
                      setConfig({
                        ...config,
                        navbar_logo_size: parseInt(e.target.value, 10)
                      });
                    }}
                    className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#707040]"
                  />
                  <span className="text-[10px] text-stone-400 font-medium">128px</span>
                </div>
              </div>

              {/* Brand Text Size Control */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-stone-700 block">
                    品牌文字尺寸 (覓野茶 ME & TEA)
                  </label>
                  <span className="text-xs font-extrabold font-mono text-[#707040] bg-[#707040]/10 px-2 py-0.5 rounded-full">
                    {config.navbar_brand_text_size !== undefined ? config.navbar_brand_text_size : 20}px
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-stone-400 font-medium">14px</span>
                  <input
                    type="range"
                    min="14"
                    max="36"
                    step="1"
                    value={config.navbar_brand_text_size !== undefined ? config.navbar_brand_text_size : 20}
                    onChange={(e) => {
                      setConfig({
                        ...config,
                        navbar_brand_text_size: parseInt(e.target.value, 10)
                      });
                    }}
                    className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#707040]"
                  />
                  <span className="text-[10px] text-stone-400 font-medium">36px</span>
                </div>
              </div>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                💡 說明：點選上方「儲存目前所有變更」按鈕後，首頁與各前端頁面的 Navbar 將自動載入並同步更新您的尺寸設定。
              </p>
            </div>
          </div>

          {/* New Section: Map Canvas Background Image Management */}
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm space-y-6 text-left">
            <div>
              {/* 將大標題級別從 text-sm 放大至 text-base (16px) 或 text-lg，並強制內聯樣式鎖死字體 */}
              <h3 
                className="font-bold text-stone-800 tracking-wide flex items-center gap-2"
                style={{ fontSize: '16px', color: '#1c1917', fontWeight: '700', letterSpacing: '0.02em' }}
              >
                <LucideImage size={18} className="text-[#707040]" />
                地圖大背景圖片管理
              </h3>
              
              {/* 前導說明字體對齊 14px 標準，調整行高與間距 */}
              <p 
                className="font-normal mt-2"
                style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6', fontWeight: '400' }}
              >
                請在此上傳新手村網網頁大背景圖（手繪風或遊戲感大背景），上傳成功後，前台網頁讀取到該設定將啟用 bg-fixed 與 bg-cover 優化，打造美輪美奐的探索體驗。
              </p>
            </div>

            {/* Symmetrical Responsive Side-by-Side Upload & Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch w-full">
              {/* Left Column: Upload Dragzone */}
              <div className="flex flex-col items-center">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBgDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBgDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBgDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleBgFile(file);
                  }}
                  onClick={() => {
                    if (!bgUploading) bgFileInputRef.current?.click();
                  }}
                  className={`
                    aspect-[9/16] w-full max-w-[280px] rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col justify-center items-center p-6 text-center select-none group flex-grow
                    ${bgDragging ? 'border-[#707040] bg-[#707040]/5' : 'border-stone-200 hover:border-stone-300 bg-stone-50'}
                    ${bgUploading ? 'cursor-not-allowed opacity-70' : ''}
                  `}
                >
                  <input
                    type="file"
                    ref={bgFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBgFile(file);
                    }}
                    accept="image/*"
                    className="hidden"
                    disabled={bgUploading}
                  />

                  {bgUploading ? (
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 text-[#707040] animate-spin" />
                      <p className="text-xs font-bold text-stone-500">正在上傳中...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 bg-white rounded-2xl text-stone-400 shadow-sm transition-transform group-hover:scale-110">
                        <Upload size={20} className="text-[#707040]" />
                      </div>
                      <p className="text-sm font-bold text-stone-700">點擊或拖曳檔案上傳</p>
                      {/* 強制將內部格式提示字放大至 14px，顏色改為清晰深灰，並套用 helper-text 類名 */}
                      <p 
                        className="helper-text font-normal" 
                        style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5', marginTop: '4px', fontWeight: '400' }}
                      >
                        支援 JPG, PNG, WEBP 格式 (建議 9:16 直式規格)
                      </p>
                    </div>
                  )}
                </div>
                <p 
                  className="upload-hint helper-text text-sm text-[#4b5563] font-normal leading-normal mt-1.5 text-center px-2"
                  style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5', marginTop: '12px', fontWeight: '400' }}
                >
                  建議上傳 1080 × 1920 像素（9:16 比例）滿版高清直式背景圖，以利手機端完美全螢幕呈現，檔案大小限 5MB 內。
                </p>
              </div>

              {/* Right Column: Image Preview */}
              <div className="flex flex-col items-center">
                <div className="aspect-[9/16] w-full max-w-[280px] bg-stone-50 border border-stone-200 rounded-[2rem] relative overflow-hidden flex flex-col justify-center items-center shadow-sm">
                  {config.map_background ? (
                    <div className="w-full h-full relative group">
                      <img
                        src={config.map_background.startsWith('http') ? config.map_background : `${(supabaseUrl || 'https://ftqyzxrvghfdspgjampd.supabase.co').replace(/\/$/, '')}/storage/v1/object/public/novice-village/${config.map_background}`}
                        alt="新手村大背景預覽"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center duration-200">
                        <span className="text-white text-xs font-semibold tracking-wider">目前背景圖片</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfig({
                            ...config,
                            map_background: ''
                          });
                          toast.success('已清除背景設定，別忘記點上方「儲存所有變更」！');
                        }}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/90 text-stone-500 hover:text-red-500 rounded-full flex items-center justify-center shadow-sm transition-colors cursor-pointer z-10"
                        title="移除背景圖片"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-stone-400 p-6 text-center">
                      <LucideImage size={32} className="text-stone-300 stroke-[1.5]" />
                      <p className="text-xs font-bold text-stone-500">尚未上傳大背景圖片</p>
                      <p className="text-[10px] text-stone-400">上傳後，此處將顯示大圖預覽</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Stages Button backgrounds management */}
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm space-y-6 text-left">
            <div>
              <h3 className="text-sm font-bold text-stone-800 tracking-wide flex items-center gap-1.5">
                <Grid size={16} className="text-[#707040]" />
                地圖入口背景圖片管理
              </h3>
              <p className="text-sm text-[#4b5563] font-normal mt-1 leading-normal">
                請在此上傳「五個地圖區域按鈕背景圖」（對應首頁地圖區塊），系統會直接將圖片上傳至專屬 novice-village 儲存桶的最外層根目錄。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* 1. Personality */}
              <div className="bg-stone-50/55 p-4 border border-stone-200/50 rounded-2xl space-y-3 flex flex-col items-center">
                <h4 className="text-xs font-extrabold text-stone-750 flex items-center gap-1.5 self-start w-full">
                  <span className="w-1.5 h-1.5 bg-[#707040] rounded-full" />
                  尋茶人格入口背景圖
                </h4>
                <div className="w-full flex justify-center">
                  <ImageUploader
                    value={config.map_bg_personality || ''}
                    onChange={(url) => {
                      setConfig({
                        ...config,
                        map_bg_personality: url
                      });
                    }}
                    label=""
                    hint="建議上傳 1080 × 1920 像素 (9:16 比例) 直式背景圖"
                    aspectRatio="aspect-[9/16] max-w-[280px]"
                    bucket="novice-village"
                    pathPrefix=""
                    customFileName="map_bg_personality"
                  />
                </div>
              </div>

              {/* 2. Zodiac */}
              <div className="bg-stone-50/55 p-4 border border-stone-200/50 rounded-2xl space-y-3 flex flex-col items-center">
                <h4 className="text-xs font-extrabold text-stone-750 flex items-center gap-1.5 self-start w-full">
                  <span className="w-1.5 h-1.5 bg-[#707040] rounded-full" />
                  星座茶緣入口背景圖
                </h4>
                <div className="w-full flex justify-center">
                  <ImageUploader
                    value={config.map_bg_zodiac || ''}
                    onChange={(url) => {
                      setConfig({
                        ...config,
                        map_bg_zodiac: url
                      });
                    }}
                    label=""
                    hint="建議上傳 1080 × 1920 像素 (9:16 比例) 直式背景圖"
                    aspectRatio="aspect-[9/16] max-w-[280px]"
                    bucket="novice-village"
                    pathPrefix=""
                    customFileName="map_bg_zodiac"
                  />
                </div>
              </div>

              {/* 3. Energy */}
              <div className="bg-stone-50/55 p-4 border border-stone-200/50 rounded-2xl space-y-3 flex flex-col items-center">
                <h4 className="text-xs font-extrabold text-stone-750 flex items-center gap-1.5 self-start w-full">
                  <span className="w-1.5 h-1.5 bg-[#707040] rounded-full" />
                  今日能量值入口背景圖
                </h4>
                <div className="w-full flex justify-center">
                  <ImageUploader
                    value={config.map_bg_energy || ''}
                    onChange={(url) => {
                      setConfig({
                        ...config,
                        map_bg_energy: url
                      });
                    }}
                    label=""
                    hint="建議上傳 1080 × 1920 像素 (9:16 比例) 直式背景圖"
                    aspectRatio="aspect-[9/16] max-w-[280px]"
                    bucket="novice-village"
                    pathPrefix=""
                    customFileName="map_bg_energy"
                  />
                </div>
              </div>

              {/* 4. Lifestyle */}
              <div className="bg-stone-50/55 p-4 border border-stone-200/50 rounded-2xl space-y-3 flex flex-col items-center">
                <h4 className="text-xs font-extrabold text-stone-750 flex items-center gap-1.5 self-start w-full">
                  <span className="w-1.5 h-1.5 bg-[#707040] rounded-full" />
                  生活風格入口背景圖
                </h4>
                <div className="w-full flex justify-center">
                  <ImageUploader
                    value={config.map_bg_lifestyle || ''}
                    onChange={(url) => {
                      setConfig({
                        ...config,
                        map_bg_lifestyle: url
                      });
                    }}
                    label=""
                    hint="建議上傳 1080 × 1920 像素 (9:16 比例) 直式背景圖"
                    aspectRatio="aspect-[9/16] max-w-[280px]"
                    bucket="novice-village"
                    pathPrefix=""
                    customFileName="map_bg_lifestyle"
                  />
                </div>
              </div>

              {/* 5. Sensory */}
              <div className="bg-stone-50/55 p-4 border border-stone-200/50 rounded-2xl space-y-3 flex flex-col items-center sm:col-span-2 md:col-span-1">
                <h4 className="text-xs font-extrabold text-stone-750 flex items-center gap-1.5 self-start w-full">
                  <span className="w-1.5 h-1.5 bg-[#707040] rounded-full" />
                  感官密碼入口背景圖
                </h4>
                <div className="w-full flex justify-center">
                  <ImageUploader
                    value={config.map_bg_sensory || ''}
                    onChange={(url) => {
                      setConfig({
                        ...config,
                        map_bg_sensory: url
                      });
                    }}
                    label=""
                    hint="建議上傳 1080 × 1920 像素 (9:16 比例) 直式背景圖"
                    aspectRatio="aspect-[9/16] max-w-[280px]"
                    bucket="novice-village"
                    pathPrefix=""
                    customFileName="map_bg_sensory"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Global Social Share Icons Management */}
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm space-y-6 text-left">
            <div>
              <h3 className="text-sm font-bold text-stone-800 tracking-wide flex items-center gap-1.5">
                <Share2 size={16} className="text-[#707040]" />
                全域社群分享 Icon 管理區
              </h3>
              <p className="text-sm text-[#4b5563] font-normal mt-1 leading-normal">
                上傳標準 1:1 的官方去背 PNG 圖標。前台分享區將調用此處上傳的圖卡，解決預設系統 Icon 變形、黑圈、毛邊等問題。如果不設定，系統會自動使用預設極簡繪製圖標。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* LINE Icon */}
              <div className="bg-stone-50/55 p-4 border border-stone-200/50 rounded-2xl space-y-3">
                <h4 className="text-xs font-extrabold text-[#06C755] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#06C755] rounded-full" />
                  LINE 去背原比例 1:1 圖標
                </h4>
                <ImageUploader
                  value={config.share_icon_line || ''}
                  onChange={(url) => {
                    setConfig({
                      ...config,
                      share_icon_line: url
                    });
                  }}
                  label=""
                  hint="建議 120x120px 去背 PNG"
                  aspectRatio="aspect-square max-w-[124px]"
                  bucket="novice-village"
                  pathPrefix="icons"
                  customFileName="share_icon_line"
                />
              </div>

              {/* Threads Icon */}
              <div className="bg-stone-50/55 p-4 border border-stone-200/50 rounded-2xl space-y-3">
                <h4 className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-black rounded-full" />
                  Threads 去背原比例 1:1 圖標
                </h4>
                <ImageUploader
                  value={config.share_icon_threads || ''}
                  onChange={(url) => {
                    setConfig({
                      ...config,
                      share_icon_threads: url
                    });
                  }}
                  label=""
                  hint="建議 120x120px 去背 PNG"
                  aspectRatio="aspect-square max-w-[124px]"
                  bucket="novice-village"
                  pathPrefix="icons"
                  customFileName="share_icon_threads"
                />
              </div>

              {/* Instagram Icon */}
              <div className="bg-stone-50/55 p-4 border border-stone-200/50 rounded-2xl space-y-3">
                <h4 className="text-xs font-extrabold text-[#E4405F] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#E4405F] rounded-full" />
                  Instagram 去背原比例 1:1 圖標
                </h4>
                <ImageUploader
                  value={config.share_icon_instagram || ''}
                  onChange={(url) => {
                    setConfig({
                      ...config,
                      share_icon_instagram: url
                    });
                  }}
                  label=""
                  hint="建議 120x120px 去背 PNG"
                  aspectRatio="aspect-square max-w-[124px]"
                  bucket="novice-village"
                  pathPrefix="icons"
                  customFileName="share_icon_instagram"
                />
              </div>

              {/* Facebook Icon */}
              <div className="bg-stone-50/55 p-4 border border-stone-200/50 rounded-2xl space-y-3">
                <h4 className="text-xs font-extrabold text-[#1877F2] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#1877F2] rounded-full" />
                  Facebook 去背原比例 1:1 圖標
                </h4>
                <ImageUploader
                  value={config.share_icon_facebook || ''}
                  onChange={(url) => {
                    setConfig({
                      ...config,
                      share_icon_facebook: url
                    });
                  }}
                  label=""
                  hint="建議 120x120px 去背 PNG"
                  aspectRatio="aspect-square max-w-[124px]"
                  bucket="novice-village"
                  pathPrefix="icons"
                  customFileName="share_icon_facebook"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ultimate' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm space-y-6 text-left">
            <div>
              <h3 className="text-sm font-bold text-stone-800 tracking-wide flex items-center gap-1.5">
                <Award size={16} className="text-amber-500" />
                特別畫面（通關全部 5 關獎勵頁）
              </h3>
              <p className="text-sm text-[#4b5563] font-normal mt-1 leading-normal">
                當使用者成功闖完 5 個獨立小測驗後，顯示之終極成果、通關折扣卷，與全球限量的邀請宣傳配置。
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block mb-1">完整五維尋茶檔案總圖卡上傳 (設計師預製圖片)</label>
                <ImageUploader
                  value={config.ultimate.image}
                  onChange={(url) => {
                    setConfig({
                      ...config,
                      ultimate: { ...config.ultimate, image: url }
                    });
                  }}
                  label=""
                  hint="建議上傳 1080 × 1920 像素 (9:16 比例) 高清直式圖，將自動上傳至 novice-village/grand-finale/ 資料夾"
                  aspectRatio="aspect-[9/16] max-w-[240px]"
                  bucket="novice-village"
                  pathPrefix="grand-finale"
                  customFileName="ultimate_result"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#707040] block">通關折扣優惠券代碼 (專屬優惠碼)</label>
                <input
                  type="text"
                  value={config.ultimate.coupon}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      ultimate: { ...config.ultimate, coupon: e.target.value }
                    });
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-extrabold uppercase font-mono text-amber-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#707040] block">終極特別頁社群邀請詞 (全網社群分享標題宣傳)</label>
                <textarea
                  value={config.ultimate.socialText}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      ultimate: { ...config.ultimate, socialText: e.target.value }
                    });
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs font-medium"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Section: LINE Official Account Integration */}
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm space-y-6 text-left">
            <div>
              <h3 className="text-sm font-bold text-stone-800 tracking-wide flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#06C755] rounded-full inline-block shrink-0" />
                LINE 官方帳號引流設定
              </h3>
              <p className="text-sm text-[#4b5563] font-normal mt-1 leading-normal">
                設定測驗結果頁底部的 LINE 官方帳號引流橫幅，增加品牌吸粉效果與二次行銷渠道。
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block mb-1">LINE 官方帳號引流圖片上傳區</label>
                <ImageUploader
                  value={config.line_banner_url || ''}
                  onChange={(url) => {
                    setConfig({
                      ...config,
                      line_banner_url: url
                    });
                  }}
                  label=""
                  hint="建議上傳寬扁型橫幅圖片（如 1200x400 像素），點擊此圖片將導向您的 LINE 官方帳號。"
                  aspectRatio="aspect-[3/1] max-w-md"
                  bucket="novice-village"
                  pathPrefix="line"
                  customFileName="line_invite"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#707040] block">LINE 官方帳號連結輸入框</label>
                <input
                  type="text"
                  value={config.line_official_link || ''}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      line_official_link: e.target.value
                    });
                  }}
                  placeholder="請輸入您的 LINE 官方帳號好友連結（例如：https://lin.ee/xxxxxx）"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium text-stone-700"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  請輸入您的 LINE 官方帳號好友連結（例如：https://lin.ee/xxxxxx）。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResetDialog && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-6 text-left">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-full shrink-0">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-base font-extrabold text-stone-850">
                  安全防呆二次確認
                </h3>
                <p className="text-sm text-[#4b5563] font-normal mt-1 leading-normal">
                  此操作將永久刪除所有使用者的測試作答與投票數據，且無法復原。請在下方輸入 <span className="font-mono font-extrabold text-red-600 bg-red-50 px-1 py-0.5 rounded text-sm">CONFIRM_RESET</span> 以確認執行。
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                請輸入安全確認碼
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="CONFIRM_RESET"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-extrabold font-mono uppercase tracking-widest text-red-600 focus:ring-1 focus:ring-red-300 focus:outline-none"
                disabled={isResetting}
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetDialog(false);
                  setResetConfirmText('');
                }}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500 bg-stone-100 hover:bg-stone-200 transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleClearStats}
                disabled={resetConfirmText !== 'CONFIRM_RESET' || isResetting}
                className={`
                  px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition
                  ${resetConfirmText === 'CONFIRM_RESET' && !isResetting
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                    : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  }
                `}
              >
                {isResetting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    正在執行...
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    確認清空
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
