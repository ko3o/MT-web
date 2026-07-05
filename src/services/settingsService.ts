import { supabase } from '../db';

export interface PhilosophyItem {
  title: string;
  desc: string;
  image_url?: string;
}

export interface AvatarItem {
  url: string;
  name: string;
}

export interface CoexistenceCardItem {
  title: string;
  desc: string;
  icon: string;
  label: string;
}

export interface BotanicalSpecimen {
  id: string;
  name: string;
  scientificName: string;
  category: 'flora' | 'fauna';
  desc: string;
  role: string;
  image: string;
}

export interface CatDutyItem {
  title: string;
  desc: string;
  icon: string;
}

export interface CommitmentItem {
  icon: string;
  title: string;
  text: string;
}

export interface SiteSettings {
  logo_url: string;
  banner_url: string;
  banner_title: string;
  banner_subtitle: string;
  sync_news_banner: boolean;
  news_layout: 'grid' | 'list';
  news_image_url: string;
  philosophy: PhilosophyItem[];
  system_avatars: AvatarItem[];
  avatar_selection_description: string;
  faq_contact_title: string;
  faq_contact_desc: string;
  faq_contact_url: string;
  cat_banner_url: string;
  
  // Custom redirects & buttons
  philosophy_btn_text: string;
  philosophy_btn_url: string;
  cat_btn_text: string;
  cat_btn_url: string;

  // Meet Miye Page content
  meet_miye_subtitle: string;
  meet_miye_title: string;
  meet_miye_short_desc: string;
  meet_miye_origin_tagline: string;
  meet_miye_origin_title: string;
  meet_miye_origin_text1: string;
  meet_miye_origin_text2: string;
  meet_miye_image_url: string;
  meet_miye_vision: string;
  meet_miye_commitments: CommitmentItem[];

  // Coexistence Page content
  coexistence_subtitle: string;
  coexistence_title: string;
  coexistence_desc: string;
  coexistence_section_title: string;
  coexistence_section_subtitle: string;
  coexistence_cards: CoexistenceCardItem[];
  specimens: BotanicalSpecimen[];
  coexistence_bg_audio: string;
  coexistence_audio_autoplay: boolean;
  coexistence_audio_loop: boolean;

  // Cats Daily Page content
  cat_manager_badge: string;
  cat_manager_title: string;
  cat_manager_desc: string;
  cat_manager_credentials_tag: string;
  cat_manager_role_title: string;
  cat_manager_feline_title: string;
  cat_manager_body_desc: string;
  cat_manager_profile_heading: string;
  cat_manager_profile_items: string[];
  cat_manager_duties: CatDutyItem[];

  // Social login button branding
  google_login_logo_url: string;
  line_login_logo_url: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  logo_url: '/覓野茶logo.png',
  banner_url: 'https://picsum.photos/seed/tea-banner/1920/1080',
  banner_title: '在山野間，與茶共覺一份寧靜',
  banner_subtitle: '每一杯茶都是自然與手工的完美結合，每一個故事都值得細喜品味',
  sync_news_banner: false,
  news_layout: 'grid',
  news_image_url: 'https://picsum.photos/seed/news-banner/1920/1080',
  philosophy: [
    { title: '高山茶園', desc: '來自海拔千米以上的純淨茶區，雲霧繚繞中孕育的天然茶香' },
    { title: '自然農法', desc: '堅持不使用農藥，與自然共生，保留茶葉最純粹的生命力' },
    { title: '匠心製茶', desc: '傳承百年製茶工藝，每一片茶葉都承載著茶農的堅持與熱情' },
  ],
  system_avatars: [
    { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', name: 'Felix' },
    { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', name: 'Aneka' },
    { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Buddy', name: 'Buddy' },
    { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Caspian', name: 'Caspian' },
    { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daisy', name: 'Daisy' },
    { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eden', name: 'Eden' }
  ],
  avatar_selection_description: '選擇一個您喜歡的風格作為頭像',
  faq_contact_title: '還有其他問題嗎？',
  faq_contact_desc: '我們的客服團隊隨時準備為您提供協助，無論是產品諮詢還是訂單問題。',
  faq_contact_url: '#',
  cat_banner_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1920&q=80',

  // Custom redirects & buttons
  philosophy_btn_text: '探索茶草共生的故事 ➔',
  philosophy_btn_url: '/about/coexistence',
  cat_btn_text: '看看店長的茶園日常 ➔',
  cat_btn_url: '/about/cats-daily',

  // Meet Miye Page defaults
  meet_miye_subtitle: 'Since 2024 · ME & TEA',
  meet_miye_title: '遇見覓野',
  meet_miye_short_desc: '「覓野茶創立於 2024 年，我們的使命是將台灣高山茶的純淨與美好，帶到每一位愛茶人的生活中。」',
  meet_miye_origin_tagline: 'Brand Origin / 品牌起源',
  meet_miye_origin_title: '「關於我們，源於對自然的野趣追尋。」',
  meet_miye_origin_text1: '「覓野」二字，代表著我們對自然野趣的追尋。我們深入台灣各大茶區，從阿里山到鹿谷，從三峽到木柵， 尋找最純粹的茶葉。每一片茶葉都承載著茶農的堅持與大自然的恩賜。',
  meet_miye_origin_text2: '在這裡，每一盞茶都是一次與土地的溫柔對話。我們相信茶樹與週遭生態平衡共處的能力，不加干涉，遵循自然孕育的節奏，將最初始的高山芬芳完美封存，獻給對生活有著極致追求的你。',
  meet_miye_image_url: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80',
  meet_miye_vision: '「我們希望透過每一杯茶，讓更多人認識台灣茶的美好。讓品茶不只是一種習慣，更是一種與自然對話、與自己對話的生活方式。」',
  meet_miye_commitments: [
    { icon: 'Mountain', title: '源頭嚴選', text: '嚴選海拔 1000 公尺以上台灣高山純淨茶園，得天獨厚之氣候滋養。' },
    { icon: 'Leaf', title: '茶草共生', text: '堅持自然農法與共生種植，絕不施用任何化學農藥與除草劑。' },
    { icon: 'Award', title: '傳承淬鍊', text: '傳承大師級百年製茶工藝，手工精緻浪茶、揉捻與古法烘焙。' },
    { icon: 'Shield', title: '安心履歷', text: '每批茶品均自主送檢 SGS 檢驗，確保無殘留，透明公開。' },
    { icon: 'Users', title: '互惠合作', text: '直接對接在地小農，保障茶農收益，達成永續農業生產循環。' }
  ],

  // Coexistence Page defaults
  coexistence_subtitle: 'Philosophy & Biodiversity',
  coexistence_title: '萬物共生',
  coexistence_desc: '我們深信，最好的茶，並非取自於大張旗鼓的征服，而是學會與自然握手言和。在覓野，萬物皆有其序，茶樹與野草、昆蟲、生命和諧共處，譜寫出最純淨的生態樂章。',
  coexistence_section_title: '草生循環 · 自然農法',
  coexistence_section_subtitle: 'Sustainable Agriculture',
  coexistence_cards: [
    { title: '草生循環，相生相伴', desc: '我們絕不施用任何化學除草劑。保留自然雜草能緊緊扣住水分與養分，防止大雨沖刷高山脆弱的表土。當雜草自然枯萎時，更會轉化為土壤最富含腐殖質的天然有機肥料。', icon: 'Leaf', label: 'Natural Cover Crops' },
    { title: '百萬蚯蚓，黃金耕耘', desc: '健康的生態系吸引深層蚯蚓與微小昆蟲繁育。牠們夜以繼日地穿梭，為根部挖出一條條精密、高透氣性的呼吸通道。健康的毛細根能自主朝大地深處探索，汲取飽滿的礦物質養分。', icon: 'Activity', label: 'Active Soil Biology' },
    { title: '五星級工藝承諾', desc: '將聽從小鳥唱歌長大、吸收草露共存孕育出的極品鮮葉，交由獲獎無數的製茶家手中。不惜繁複，手工精密掌控炒春、揉捻與溫火烘焙，保證香氣與喉韻無與倫比地雅致。', icon: 'Award', label: 'Master Craftsmanship' }
  ],
  specimens: [
    {
      id: 'specimen-1',
      name: '野薑花',
      scientificName: 'Hedychium coronarium',
      category: 'flora',
      desc: '生長於生態池畔，初秋綻放如展翅白蝶。淡淡微甜香氣與微風交織，引來無數粉蝶與小蜜蜂，形成天然的授粉鏈。',
      role: '池畔蜜源植物，天然香氣屏障',
      image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'specimen-2',
      name: '水冬瓜',
      scientificName: 'Saurauia tristyla',
      category: 'flora',
      desc: '本土潮濕林緣常見植物。茂密淡粉小花結出多汁漿果，是白頭翁與綠繡眼等茶園小鳥最瘋狂的夏日甜點。',
      role: '鳥類食物來源，構築自然歌聲',
      image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'specimen-3',
      name: '台灣萍蓬草',
      scientificName: 'Nuphar shimadae',
      category: 'flora',
      desc: '台灣特有種黃金睡蓮。燦爛小黃花靜靜漂浮於生態池水面，是極其珍貴的濕地生態環境指標植物。',
      role: '珍稀特有種，淨化水質之母',
      image: 'https://images.unsplash.com/photo-1501973994883-8551f1754312?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'specimen-4',
      name: '大安水蓑衣',
      scientificName: 'Hygrophila pogonocalyx',
      category: 'flora',
      desc: '瀕臨絕種的台灣特有濕地植物。紫藍色花朵開滿葉腋，除了固化池塘邊坡，更是昆蟲極佳的棲息與覓食之處。',
      role: '水土保持與昆蟲友善綠網',
      image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'specimen-5',
      name: '澤瀉',
      scientificName: 'Alisma canaliculatum',
      category: 'flora',
      desc: '挺水性草本植物，優雅白色小花呈輪生狀。發達的鬚根系能深扎入泥土，高效吸收水中富營養化成分。',
      role: '天然水質過濾系統',
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'specimen-6',
      name: '香蒲 (水燭)',
      scientificName: 'Typha orientalis',
      category: 'flora',
      desc: '形似蠟燭的褐色花序獨特逗趣。這片濃密的「小森林」也是蜻蜓羽化、水鳥築巢繁殖最天然隱秘的庇護港灣。',
      role: '水禽與水生昆蟲的安全育嬰室',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'specimen-7',
      name: '布袋蓮',
      scientificName: 'Eichhornia crassipes',
      category: 'flora',
      desc: '淡紫藍色花瓣帶有一抹如孔雀尾羽般的藍黃斑點。具有驚人的濁水吸附能力，使池水常年保持清亮。',
      role: '懸浮雜質高效沉降淨化者',
      image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'specimen-8',
      name: '齒葉睡蓮',
      scientificName: 'Nymphaea lotus',
      category: 'flora',
      desc: '齒狀邊緣葉片與純白或淡粉睡蓮。寬大的浮葉覆蓋水面，有效阻擋陽光直射，降低夏日水溫並防止藻類泛濫。',
      role: '控溫與抑藻的自然遮陽傘',
      image: 'https://images.unsplash.com/photo-1500627869374-13cd993b1115?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'specimen-9',
      name: '台灣石賓',
      scientificName: 'Acrossocheilus paradoxus',
      category: 'fauna',
      desc: '台灣特有溪流魚類，身上有著顯著縱帶。在清澈的生態池水中穿梭掠食孑孓與藻類，游姿極具野韻。',
      role: '病媒蚊幼蟲控制官',
      image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'specimen-10',
      name: '拉都希氏赤蛙',
      scientificName: 'Hylarana latouchii',
      category: 'fauna',
      desc: '俗稱「吃飽囉」青蛙。夜幕降臨時，牠們富有特色的沉悶鳴叫聲此起彼落，是我們生態池夜間最熱鬧的歌唱家。',
      role: '茶園夜間害蟲搜捕主力軍',
      image: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=400&q=80'
    }
  ],
  coexistence_bg_audio: '',
  coexistence_audio_autoplay: true,
  coexistence_audio_loop: true,

  // Cats Daily defaults
  cat_manager_badge: 'General Manager Cat',
  cat_manager_title: '店長日常',
  cat_manager_desc: '「喵～歡迎來到我的巡邏領地！遠道而來的尋茶人，這裡的茶樹都是聽小鳥唱歌長大的喔。今天，妳想試試我最愛的哪一款茶呢？」',
  cat_manager_credentials_tag: 'Feline Credentials',
  cat_manager_role_title: '覓野茶園第一守護官',
  cat_manager_feline_title: '暖暖 (Nuan Nuan)',
  cat_manager_body_desc: '身為擁有全台最廣闊「貓薄荷」與「生態茶地」主管權限的店長，暖暖每天都要親自巡邏一萬多坪的茶園。牠負責傾聽小鳥唱歌、威嚇貪吃的竹雞，同時也是我們茶園有機種植的最佳「蟲子獵手」。',
  cat_manager_profile_heading: '基本履歷小簡表',
  cat_manager_profile_items: [
    '官方職稱：萌趣巡邏長、品質大監督、舒壓第一特使',
    '日常愛好：趴在茶箱上看蝴蝶飛、追逐蜻蜓、偶爾啃一口有機茶葉',
    '品評標準：聞到真正無毒無農藥的乾淨好茶，尾巴會直直豎起表示滿意！'
  ],
  cat_manager_duties: [
    { title: '任務 01：親臨山林巡哨', desc: '早晨露水未乾時，暖暖已邁著輕盈步伐巡視茶草共生的每一行。牠親自核對每一叢茶樹的健康度，不容外界蟲害侵擾。', icon: 'Footprints' },
    { title: '任務 02：大自然歌聲守護者', desc: '茶樹都是聽小鳥唱歌長大的，暖暖負責與生態池邊上的綠繡眼和白頭翁保持深厚友誼，確保茶園隨時洋溢自然的生機樂章。', icon: 'Heart' },
    { title: '任務 03：貓咪尊榮品質大品評', desc: '每一款茶在封裝前，店長都要親自去嗅聞鑑定。只有獲得牠開心地狂蹭、甚至滿足地發出呼嚕聲，才是獲得官方首肯的特級之選！', icon: 'Stars' }
  ],
  google_login_logo_url: '',
  line_login_logo_url: ''
};

let cachedSettings: SiteSettings | null = null;
let settingsFetchPromise: Promise<SiteSettings> | null = null;

export const getSettings = async (forceRefetch?: boolean | any): Promise<SiteSettings> => {
  const shouldForce = forceRefetch === true;
  if (cachedSettings && !shouldForce) {
    return cachedSettings;
  }
  if (settingsFetchPromise && !shouldForce) {
    return settingsFetchPromise;
  }

  settingsFetchPromise = (async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (!data) {
        cachedSettings = DEFAULT_SETTINGS;
        return DEFAULT_SETTINGS;
      }

      // Map legacy categories / indexes to standard types
      if (data.specimens && Array.isArray(data.specimens)) {
        data.specimens = data.specimens.map((spec: any) => {
          if (spec.category === '濕地' || spec.category === '植物') {
            return { ...spec, category: 'flora' };
          }
          return spec;
        });
      }

      cachedSettings = { ...DEFAULT_SETTINGS, ...data };
      return cachedSettings;
    } catch (err) {
      console.error('Error fetching settings:', err);
      cachedSettings = DEFAULT_SETTINGS;
      return DEFAULT_SETTINGS;
    } finally {
      settingsFetchPromise = null;
    }
  })();

  return settingsFetchPromise;
};

export const updateSettings = async (settings: Partial<SiteSettings>): Promise<SiteSettings> => {
  const currentSettings = await getSettings(true);
  const newSettings = { ...currentSettings, ...settings };

  // Map legacy categories / indexes to standard types
  if (newSettings.specimens && Array.isArray(newSettings.specimens)) {
    newSettings.specimens = newSettings.specimens.map((spec: any) => {
      if (spec.category === '濕地' || spec.category === '植物') {
        return { ...spec, category: 'flora' };
      }
      return spec;
    });
  }

  const response = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSettings),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const updated = await response.json();
  cachedSettings = { ...DEFAULT_SETTINGS, ...updated };
  return cachedSettings;
};
