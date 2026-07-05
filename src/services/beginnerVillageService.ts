export interface Option {
  id: string;
  text: string;
  score: number;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
}

export interface ScoreRange {
  id: string;
  minScore: number;
  maxScore: number;
  title: string;
  image: string;
  socialText: string;
  description?: string;
}

export interface ZodiacMapping {
  zodiacs: string[]; // e.g. ["牡羊座", "獅子座", "射手座"] (Fire)
  title: string;
  image: string;
  socialText: string;
  description?: string;
}

export interface VillageStage {
  id: 'personality' | 'zodiac' | 'energy' | 'lifestyle' | 'sensory';
  name: string;
  questions: Question[];
  ranges?: ScoreRange[];
  zodiacMappings?: ZodiacMapping[];
  introImage?: string;
  introText?: string;
}

export interface UltimateConfig {
  image: string;
  coupon: string;
  socialText: string;
}

export interface BeginnerVillageConfig {
  stages: VillageStage[];
  ultimate: UltimateConfig;
  map_subtitle?: string;
  map_footer_tip?: string;
  map_background?: string;
  map_bg_personality?: string;
  map_bg_zodiac?: string;
  map_bg_energy?: string;
  map_bg_lifestyle?: string;
  map_bg_sensory?: string;
  share_icon_line?: string;
  share_icon_threads?: string;
  share_icon_instagram?: string;
  share_icon_facebook?: string;
  navbar_logo_size?: number;
  navbar_brand_text_size?: number;
  line_banner_url?: string;
  line_official_link?: string;
}

export const DEFAULT_VILLAGE_CONFIG: BeginnerVillageConfig = {
  map_subtitle: '拋棄生硬呆板的線性答卷！這是一場開放式村落地圖探索。不設順序，唯有心靈所及。自由解碼五維尋茶基因獲得終極大獎、精緻圖卡和限額驚喜優惠！',
  map_footer_tip: '通關全部 5 個獨立區域，即可解鎖終極的「五維尋茶總檔案」及專屬尊享折價優惠碼！',
  map_background: '',
  navbar_logo_size: 48,
  navbar_brand_text_size: 20,
  map_bg_personality: '',
  map_bg_zodiac: '',
  map_bg_energy: '',
  map_bg_lifestyle: '',
  map_bg_sensory: '',
  share_icon_line: '',
  share_icon_threads: '',
  share_icon_instagram: '',
  share_icon_facebook: '',
  line_banner_url: '',
  line_official_link: '',
  stages: [
    {
      id: 'personality',
      name: '尋茶人格',
      introImage: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1200&q=85',
      introText: '在此開啟你的尋茶本色旅程。\n在靜謐的大自然中，一呼一吸，聆聽草木的低語。\n回答 2 題心靈感悟，解密最契合你靈魂深處的「台灣原生茶人格」！',
      questions: [
        {
          id: 'p_q1',
          text: '在寧靜的清晨，你通常會如何開啟一天？',
          options: [
            { id: 'p_q1_a', text: '獨自拉開窗簾靜坐，傾聽晨露滑落的聲音', score: 4 },
            { id: 'p_q1_b', text: '穿上跑鞋，與微風一同繞著山野慢跑', score: 3 },
            { id: 'p_q1_c', text: '沖一杯香濃茶，翻開未讀完的書頁', score: 2 },
            { id: 'p_q1_d', text: '輕彈一首樂曲，讓音樂在客廳中肆意流淌', score: 1 }
          ]
        },
        {
          id: 'p_q2',
          text: '若要為自己的心靈找一處角落，你會選擇？',
          options: [
            { id: 'p_q2_a', text: '深藏在竹林深處的古樸茅廬', score: 4 },
            { id: 'p_q2_b', text: '繁星滿天、微風拂面的高山草原', score: 3 },
            { id: 'p_q2_c', text: '開滿野薑花、水質清朗的生態池畔', score: 2 },
            { id: 'p_q2_d', text: '安坐於飄著柴燒茶香的溫馨原木茶屋', score: 1 }
          ]
        }
      ],
      ranges: [
        {
          id: 'p_r1',
          minScore: 0,
          maxScore: 5,
          title: '清雅野薑花型',
          image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=85',
          socialText: '我是優雅的【清雅野薑花型】尋茶人！在覓野茶的「新手村」中，我尋找到了最契合大自然的內在芬芳，快來測測你的尋茶人格！'
        },
        {
          id: 'p_r2',
          minScore: 6,
          maxScore: 100,
          title: '堅韌大安水蓑衣型',
          image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=85',
          socialText: '我是堅固守護的【堅韌大安水蓑衣型】尋茶人！默默紮根、滋養周遭，快來新手村大觀園解鎖你在自然中的秘密任務！'
        }
      ]
    },
    {
      id: 'zodiac',
      name: '星座茶緣',
      introImage: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=85',
      introText: '你的星座\n藏著你和哪隻茶貓的緣分？\n\n12個星座　7款野放茶\n每一個組合都不是巧合\n\n選出你的星座\n找到屬於你的茶緣',
      questions: [], // Zodiac is directly selection based
      zodiacMappings: [
        {
          zodiacs: ['牡羊座', '獅子座', '射手座'],
          title: '烈焰焙火黑茶 (火象星緣)',
          image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=85',
          socialText: '我是熱情四溢的火象星座！在覓野茶中，我的專屬星座茶緣是「烈焰焙火黑茶」，溫熱香氣四溢，快來尋找你的星座茶緣！'
        },
        {
          zodiacs: ['金牛座', '處女座', '摩羯座'],
          title: '厚德土壤烏龍茶 (土象星緣)',
          image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=85',
          socialText: '我是沉穩紮實的土象星座！在覓野茶中，我的專屬星座茶緣是「厚德土壤烏龍茶」，溫潤甘滑，一起來測測看！'
        },
        {
          zodiacs: ['雙子座', '天秤座', '水瓶座'],
          title: '輕靈白葉香茗 (風象星緣)',
          image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=85',
          socialText: '我是自由靈動的風象星座！我的專屬星座茶緣是「輕靈白葉香茗」，香氣飄逸優雅，前往覓野茶解鎖你的專屬香氣！'
        },
        {
          zodiacs: ['巨蟹座', '天蠍座', '雙魚座'],
          title: '柔韻清泉綠茶 (水象星緣)',
          image: 'https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?auto=format&fit=crop&w=800&q=85',
          socialText: '我是溫柔如水的水象星座！我的專屬星座茶緣是「柔韻清泉綠茶」，澄淨高雅，快來覓野解密星空茶情！'
        }
      ]
    },
    {
      id: 'energy',
      name: '今日能量值',
      introImage: 'https://images.unsplash.com/photo-1470252649358-96f1237f487e?auto=format&fit=crop&w=1200&q=85',
      introText: '累了嗎？或是正充滿期待？\n用一盞茶的時間，觀照你在此時此刻的體內能量流動。\n直覺選取眼前的色彩，解碼你今天的生命原力數值，匹配最適合的充能山野原生茶！',
      questions: [
        {
          id: 'e_q1',
          text: '目前眼前的天空，你直覺想塗上哪種色調？',
          options: [
            { id: 'e_q1_a', text: '淡雅輕盈的茶金流光色', score: 4 },
            { id: 'e_q1_b', text: '空靈寧靜的高山翡翠綠', score: 3 },
            { id: 'e_q1_c', text: '溫暖安心的炭焙橘黃光', score: 2 },
            { id: 'e_q1_d', text: '神秘悠遠的夢境極光藍', score: 1 }
          ]
        }
      ],
      ranges: [
        {
          id: 'e_r1',
          minScore: 0,
          maxScore: 2,
          title: '晨霧初醒微光 (能量 40%)',
          image: 'https://images.unsplash.com/photo-1470252649358-96f1237f487e?auto=format&fit=crop&w=800&q=85',
          socialText: '我今天的能量指數 is 【40% 晨霧初醒微光】。在覓野茶的新手村探索中充實自我，邀你一同漫步茶園，測測你的能量磁場！'
        },
        {
          id: 'e_r2',
          minScore: 3,
          maxScore: 100,
          title: '夏日正午朝陽 (能量 95%)',
          image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=85',
          socialText: '我今天的能量指數是【95% 正午朝陽】！滿滿自然原力，與覓野萬物熱切共生！點此參與新手村地圖探索！'
        }
      ]
    },
    {
      id: 'lifestyle',
      name: '生活風格',
      introImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=85',
      introText: '你嚮往無人溪谷的微風，還是溫馨的原木茶屋？\n探索你日常舒壓的理想生活切片，\n解密你在尋茶世界中的日常山居美學密碼！',
      questions: [
        {
          id: 'l_q1',
          text: '週末午後，你最渴望的放鬆方式是？',
          options: [
            { id: 'l_q1_a', text: '帶著露營椅到無人的溪谷，聽流水低吟一整天', score: 4 },
            { id: 'l_q1_b', text: '在原木質感的茶屋，與二三好友溫馨暢談', score: 3 },
            { id: 'l_q1_c', text: '在擺滿蓬勃植物的房間，聽著白噪音舒心入眠', score: 2 },
            { id: 'l_q1_d', text: '漫步漫無目的森林小徑，採整合松果與落葉', score: 1 }
          ]
        }
      ],
      ranges: [
        {
          id: 'l_r1',
          minScore: 0,
          maxScore: 2,
          title: '極簡微風隱士型',
          image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=85',
          socialText: '解鎖我的生活美學密碼！我是【極簡微風隱士型】，愛慕純粹，追求與大自然的絕對對話。快來解密你的山居美學！'
        },
        {
          id: 'l_r2',
          minScore: 3,
          maxScore: 100,
          title: '細微美學典雅型',
          image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=85',
          socialText: '解鎖我的生活美學密碼！我是【細微美學典雅型】，在茶與器、心意交織間品讀幸福。期待你的加入，看看你的專屬生活美學！'
        }
      ]
    },
    {
      id: 'sensory',
      name: '感官密碼',
      introImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=85',
      introText: '當你閉上眼睛，最能喚醒你對大自然記憶的感官是？\n用落葉、泥土、溪吟與風，觸碰這座靈性森林學堂。\n啟動你的天賦感官，解密內心隱藏的美好感官超能力！',
      questions: [
        {
          id: 's_q1',
          text: '當你閉上眼睛，最能喚醒你對大自然記憶的感官是？',
          options: [
            { id: 's_q1_a', text: '雙腳踩在厚實軟糯落葉上的沙沙聲響', score: 4 },
            { id: 's_q1_b', text: '一呼一吸間漫入肺腑的淡淡泥土香氣', score: 3 },
            { id: 's_q1_c', text: '淙淙泉流滑過石礫、小魚穿游水草之溪吟', score: 2 },
            { id: 's_q1_d', text: '輕撫老茶樹富有歲月刻痕的粗糙樹皮觸感', score: 1 }
          ]
        }
      ],
      ranges: [
        {
          id: 's_r1',
          minScore: 0,
          maxScore: 2,
          title: '聽覺與內在心覺探索家',
          image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=85',
          socialText: '大自然感官編碼已破解！我是【聽覺與內在心覺探索家】。靈敏且專注，對山川草木的低語尤為敏銳，快來檢測你的天賦密碼！'
        },
        {
          id: 's_r2',
          minScore: 3,
          maxScore: 100,
          title: '嗅覺與純郁味覺品茶師',
          image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=85',
          socialText: '大自然感官編碼已破解！我是【嗅覺與純郁味覺品茶師】，一飲之下即可品讀露水與高山茶芽的層次。來覓野茶新手村，解索你的感官超天賦！'
        }
      ]
    }
  ],
  ultimate: {
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=1000&q=90',
    coupon: 'MIYE520NEWBIE',
    socialText: '我已完整通過【覓野茶 · 新手村】五大探索考驗！獲得「終極五維尋茶檔案總圖卡」與專屬優惠，邀你開啟去中心化感官之旅，一同尋茶共覺！'
  }
};

export const ensureExactlyFourOptions = (cfg: BeginnerVillageConfig): BeginnerVillageConfig => {
  if (!cfg || !cfg.stages) return cfg;
  const updatedStages = cfg.stages.map(stage => {
    if (stage.id === 'zodiac') return stage;
    const updatedQuestions = (stage.questions || []).map(q => {
      const nextOptions = q.options ? [...q.options] : [];
      if (nextOptions.length > 4) {
        nextOptions.splice(4);
      }
      
      while (nextOptions.length < 4) {
        const idx = nextOptions.length;
        const letter = String.fromCharCode(65 + idx); // A, B, C, D
        const timestamp = Date.now() + Math.floor(Math.random() * 100000);
        nextOptions.push({
          id: `${q.id}_opt_${letter.toLowerCase()}_${timestamp}`,
          text: `選項 ${letter} 描述...`,
          score: 4 - idx
        });
      }
      
      // Auto upgrade scores if they match the legacy format (10/20/30/40) or if they are 0
      const adjustedOptions = nextOptions.map((opt, idx) => {
        if (opt.score === (idx + 1) * 10) {
          return { ...opt, score: 4 - idx };
        }
        return opt;
      });

      return { ...q, options: adjustedOptions };
    });
    return { ...stage, questions: updatedQuestions };
  });
  return { ...cfg, stages: updatedStages };
};

export const getVillageConfig = async (): Promise<BeginnerVillageConfig> => {
  try {
    const response = await fetch('/api/beginner-village');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (!data) return ensureExactlyFourOptions(DEFAULT_VILLAGE_CONFIG);

    // Ensure all standard ids and formats are merged cleanly and pad any < 4 choices to exactly 4
    const merged = { ...DEFAULT_VILLAGE_CONFIG, ...data };
    return ensureExactlyFourOptions(merged);
  } catch (err) {
    console.error('Error fetching beginner village config:', err);
    return ensureExactlyFourOptions(DEFAULT_VILLAGE_CONFIG);
  }
};

export const updateVillageConfig = async (config: BeginnerVillageConfig): Promise<BeginnerVillageConfig> => {
  // Ensure we save clean 4-option questions
  const cleanedConfig = ensureExactlyFourOptions(config);
  
  const response = await fetch('/api/beginner-village', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanedConfig),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const savedData = await response.json();
  return ensureExactlyFourOptions(savedData);
};

export const getVillageStats = async (): Promise<any> => {
  try {
    const response = await fetch('/api/beginner-village/stats');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('Error fetching stats:', err);
    return {};
  }
};

export const clearVillageStats = async (): Promise<any> => {
  try {
    const response = await fetch('/api/beginner-village/stats/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('Error clearing stats:', err);
    throw err;
  }
};

export const recordOptionClick = async (stageId: string, questionId: string, optionId: string): Promise<any> => {
  try {
    const response = await fetch('/api/beginner-village/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageId, questionId, optionId }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('Error logging option click:', err);
    return null;
  }
};
