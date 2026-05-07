import type { CountMode, MallItem, Mood, Part, PetStage, ScreenKey, Theme, TransactionCategory } from "@/types";

export const parts: Part[] = [
  { id: "screen", name: "屏幕", ratio: 0.38, narrative: "屏幕最贵，未来摸鱼和跑路计划都得靠它发光。" },
  { id: "memory", name: "内存", ratio: 0.2, narrative: "脑子快炸时，先把设备的脑容量补上。" },
  { id: "trackpad", name: "触控板", ratio: 0.14, narrative: "适合当第一块点亮的碎片，给人一点踏实感。" },
  { id: "shell", name: "外壳", ratio: 0.28, narrative: "外壳是体面，你表面稳住，里面再慢慢攒。" }
];

export const petStages: PetStage[] = [
  {
    id: "mist",
    level: 1,
    name: "怨息雾团",
    title: "工位烟雾初生体",
    threshold: 0,
    avatar: "雾",
    sigil: "怨",
    visual: "半透明软雾团，肚子里有一小点琥珀色怨火，像刚从消息提示里飘出来。",
    temperament: "胆小但护主，先替你把糟心话含住。",
    features: ["单眼", "软雾", "小怨火"],
    palette: {
      body: "#8bd8d0",
      belly: "#f7c875",
      accent: "#f09a62",
      glow: "#80fff0",
      eye: "#fff6d8",
      shadow: "#17352f"
    },
    line: "我是刚从工位烟雾里捏出来的怨息雾团。把那口气给我，我先替你含住。"
  },
  {
    id: "cable",
    level: 2,
    name: "电缆窥怨灵",
    title: "临时需求侦测体",
    threshold: 80,
    avatar: "眼",
    sigil: "察",
    visual: "尾巴变成弯曲充电线，眼睛更亮，能在消息弹窗出现前先皱起来。",
    temperament: "警觉、爱吐槽，专门盯临时需求和甩锅现场。",
    features: ["电缆尾", "窥视眼", "插头耳"],
    palette: {
      body: "#7ec9dc",
      belly: "#ffd38a",
      accent: "#f06f61",
      glow: "#7be5ff",
      eye: "#fff8cf",
      shadow: "#163349"
    },
    line: "尾巴接上了充电线。谁半夜改需求，我先替你亮眼。"
  },
  {
    id: "horn",
    level: 3,
    name: "便签角灵",
    title: "留痕护符成长期",
    threshold: 180,
    avatar: "角",
    sigil: "记",
    visual: "头顶长出两枚小金属角，身边贴着便利贴护符，背后有一圈细小工位灰。",
    temperament: "开始记仇，但会提醒你先留证据。",
    features: ["金属角", "便利贴护符", "怨火肚"],
    palette: {
      body: "#8c7de0",
      belly: "#ffcf80",
      accent: "#ff795f",
      glow: "#9ef0e4",
      eye: "#fff3a6",
      shadow: "#27204a"
    },
    line: "角长出来了。先别自责，把锅的来龙去脉写清楚，我帮你守着。"
  },
  {
    id: "claw",
    level: 4,
    name: "键甲护怨使",
    title: "桌面近卫形态",
    threshold: 320,
    avatar: "爪",
    sigil: "守",
    visual: "胸口嵌着键盘键帽护甲，小爪子能拨开无效打扰，尾端闪着青色电弧。",
    temperament: "护主心增强，见到离谱排期会立刻炸起边缘。",
    features: ["键帽甲", "小爪", "青电尾"],
    palette: {
      body: "#615cc7",
      belly: "#ffa96e",
      accent: "#61d9cb",
      glow: "#7dfff1",
      eye: "#fff8de",
      shadow: "#211b47"
    },
    line: "我已经长出键帽甲。那些无效打扰先过我这关。"
  },
  {
    id: "crown",
    level: 5,
    name: "工位怨王",
    title: "软团王冠觉醒",
    threshold: 520,
    avatar: "王",
    sigil: "王",
    visual: "软团压缩成更稳的王座轮廓，浮起小小怨冠，核心像一枚热到发亮的金币。",
    temperament: "有点骄傲，但只对你低头。",
    features: ["怨冠", "金币核心", "王座轮廓"],
    palette: {
      body: "#5042a6",
      belly: "#ffb547",
      accent: "#e95f69",
      glow: "#ffe08a",
      eye: "#fff7c0",
      shadow: "#1d173d"
    },
    line: "软团小宇宙成型。从今往后，你的怨气会变成我的王冠。"
  },
  {
    id: "array",
    level: 6,
    name: "会议碎阵师",
    title: "怨念阵法展开",
    threshold: 760,
    avatar: "阵",
    sigil: "阵",
    visual: "周围漂浮会议纪要碎片和 KPI 残片，像一个会自动归档糟心事的小阵法。",
    temperament: "冷静、会复盘，把每次消耗都炼成下一次边界。",
    features: ["纪要碎片", "怨气阵", "浮空符纸"],
    palette: {
      body: "#46348f",
      belly: "#ff9e66",
      accent: "#6be7d1",
      glow: "#ad8cff",
      eye: "#fff0b7",
      shadow: "#171033"
    },
    line: "我把会议废话排成阵。别怕，糟心事也能被归档、炼化、反打。"
  },
  {
    id: "halo",
    level: 7,
    name: "墨怨法相",
    title: "黑环法力形态",
    threshold: 1050,
    avatar: "冥",
    sigil: "冥",
    visual: "背后浮出黑青色光环，身体边缘像水墨烟袖，怨火被压成一颗稳定灵核。",
    temperament: "不再乱炸，开始像真正的守护灵一样判断时机。",
    features: ["黑青光环", "水墨烟袖", "稳定灵核"],
    palette: {
      body: "#32256f",
      belly: "#ff875f",
      accent: "#55d4c6",
      glow: "#80a7ff",
      eye: "#fff8d5",
      shadow: "#0f0a28"
    },
    line: "怨气不是只会爆炸。现在我会等到最适合反击的时候。"
  },
  {
    id: "thunder",
    level: 8,
    name: "绩雷邪灵",
    title: "KPI 晶角暴走",
    threshold: 1380,
    avatar: "霆",
    sigil: "绩",
    visual: "双角结晶化，青紫雷纹从角尖流到尾巴，身边的 KPI 残片被电成碎光。",
    temperament: "锋利、强硬，会把不合理指标拆成可谈判条款。",
    features: ["晶角", "青紫雷纹", "碎光 KPI"],
    palette: {
      body: "#2b2164",
      belly: "#ff765d",
      accent: "#62f2d7",
      glow: "#a984ff",
      eye: "#fff0a6",
      shadow: "#0e0925"
    },
    line: "KPI 晶角已经成形。它压你，我就把它拆成条款。"
  },
  {
    id: "jade",
    level: 9,
    name: "玄玉怨尊",
    title: "冷静神格前夜",
    threshold: 1760,
    avatar: "玄",
    sigil: "玄",
    visual: "小身体披上玉青与玄黑的短袍，额前有护心符印，表情平静但压迫感很足。",
    temperament: "危险但克制，像把锋利刀收在袖中。",
    features: ["玄玉短袍", "护心符印", "压缩怨核"],
    palette: {
      body: "#241d55",
      belly: "#e85e5a",
      accent: "#77e3c4",
      glow: "#e0c878",
      eye: "#fff6ce",
      shadow: "#0a061f"
    },
    line: "我已经不需要大吵大闹。真正的反击，是把边界说得又稳又硬。"
  },
  {
    id: "immortal",
    level: 10,
    name: "玄怨邪仙",
    title: "职场怨气终阶灵物",
    threshold: 2200,
    avatar: "仙",
    sigil: "仙",
    visual: "最终形态像一枚会漂浮的暗玉邪仙，金青灵纹环绕，既像宠物又像能镇住工位的灵物。",
    temperament: "从吸收怨气到驾驭怨气，调皮、护短、强大但不失温度。",
    features: ["暗玉仙冠", "金青灵纹", "终阶怨核"],
    palette: {
      body: "#17123f",
      belly: "#ff654f",
      accent: "#8df0ce",
      glow: "#f4d477",
      eye: "#fff9d2",
      shadow: "#060318"
    },
    line: "我不是让你一直忍。我把怨气炼成形，是为了让你终于能好好保护自己。"
  }
];

export const mallItems: MallItem[] = [
  {
    id: "coffee",
    name: "带薪续命咖啡券",
    price: 38,
    tag: "即时止损",
    category: "instant",
    description: "把「我还能忍」续航到下一场会。",
    effect: "咖啡因已注入，会议续航 +2h",
    icon: "☕"
  },
  {
    id: "dinner",
    name: "下班热饭基金",
    price: 68,
    tag: "回血",
    category: "heal",
    description: "至少今天不要用冷面包打发自己。",
    effect: "热汤入胃，今日存活确认",
    icon: "🍜"
  },
  {
    id: "earplug",
    name: "工位降噪护盾",
    price: 199,
    tag: "反打扰",
    category: "defense",
    description: "把无效寒暄和临时起意隔在外面。",
    effect: "噪音已屏蔽，专注模式开启",
    icon: "🎧"
  },
  {
    id: "leave",
    name: "请假演练包",
    price: 288,
    tag: "保命预案",
    category: "escape",
    description: "不一定马上跑，但先把逃生路线画出来。",
    effect: "请假话术已生成，随时可发射",
    icon: "📋"
  },
  {
    id: "sleep",
    name: "周末睡到自然醒券",
    price: 520,
    tag: "大额奖励",
    category: "reward",
    description: "用正经名义批准自己关机。",
    effect: "闹钟已关闭，睡到自然醒",
    icon: "😴"
  },
  {
    id: "vent",
    name: "厕所隔间发泄券",
    price: 15,
    tag: "即时止损",
    category: "instant",
    description: "去厕所待五分钟，什么都不想。",
    effect: "深呼吸完成，血压下降 20%",
    icon: "🚻"
  },
  {
    id: "snack",
    name: "工位藏粮补给包",
    price: 45,
    tag: "回血",
    category: "heal",
    description: "抽屉里藏点甜的，防低血糖崩溃。",
    effect: "血糖回升，情绪稳定 +1",
    icon: "🍫"
  },
  {
    id: "screenshot",
    name: "留痕自保截图术",
    price: 128,
    tag: "保命预案",
    category: "escape",
    description: "关键对话截图存档，日后甩锅用。",
    effect: "证据已保存，安全感 +999",
    icon: "📸"
  },
  {
    id: "plant",
    name: "桌面绿植守护灵",
    price: 88,
    tag: "回血",
    category: "heal",
    description: "养一盆不用浇水的电子植物。",
    effect: "光合作用中，心情微亮",
    icon: "🌱"
  },
  {
    id: "flight",
    name: "离职倒计时日历",
    price: 666,
    tag: "大额奖励",
    category: "reward",
    description: "每天撕一页，看着自由越来越近。",
    effect: "又近一天，希望在前方",
    icon: "📅"
  },
  {
    id: "meeting_jar",
    name: "会议废话罐",
    price: 18,
    currency: "rage",
    tag: "怨气供品",
    category: "pet",
    description: "把一下午没结论的会议压成罐头。",
    effect: "投喂后怨气滋养 +14，饱食 +8",
    icon: "🫙",
    petBoost: { rage: 14, satiety: 8, affection: 1 }
  },
  {
    id: "kpi_shard",
    name: "KPI 残片",
    price: 66,
    currency: "rage",
    tag: "怨气供品",
    category: "pet",
    description: "从不合理指标上抠下来的一点碎屑。",
    effect: "投喂后怨气滋养 +45，亲密 +2",
    icon: "💠",
    petBoost: { rage: 45, satiety: 10, affection: 2 }
  },
  {
    id: "boss_pie",
    name: "老板画饼碎屑",
    price: 128,
    currency: "wallet",
    tag: "薪资金币供品",
    category: "pet",
    description: "买来给软团磨牙，别让它咬你。",
    effect: "投喂后怨气滋养 +40，饱食 +22",
    icon: "🥮",
    petBoost: { rage: 40, satiety: 22, affection: 4 }
  },
  {
    id: "dark_incense",
    name: "黑眼圈香炉",
    price: 88,
    currency: "wallet",
    tag: "薪资金币供品",
    category: "pet",
    description: "点上之后，怨气软团会安静陪你加一会儿班。",
    effect: "投喂后亲密 +18，饱食 +16",
    icon: "🪔",
    petBoost: { rage: 18, satiety: 16, affection: 18 }
  },
  {
    id: "claw_whetstone",
    name: "爪尖打磨石",
    price: 120,
    currency: "rage",
    tag: "永久强化",
    category: "pet",
    description: "磨一磨小爪子，之后对战咬人更疼一点。",
    effect: "投喂后攻击 +2，怨气滋养 +18",
    icon: "🪨",
    petBoost: { rage: 18, satiety: 4, affection: 3, attack: 2 }
  },
  {
    id: "mana_dew",
    name: "怨气灵泉瓶",
    price: 160,
    currency: "rage",
    tag: "法力成长",
    category: "pet",
    description: "把糟心事蒸馏成灵泉，给软团扩一扩法力池。",
    effect: "投喂后法力上限 +12，当前法力 +35",
    icon: "💧",
    petBoost: { rage: 12, satiety: 6, affection: 5, manaCap: 12, mana: 35 }
  },
  {
    id: "ward_charm",
    name: "反卷护心符",
    price: 188,
    currency: "wallet",
    tag: "永久强化",
    category: "pet",
    description: "贴在怨气软团额头上，能把无效攻击弹回去一点。",
    effect: "投喂后防御 +2，亲密 +8",
    icon: "🧿",
    petBoost: { rage: 10, satiety: 8, affection: 8, defense: 2 }
  },
  {
    id: "combo_bell",
    name: "连击小铃铛",
    price: 220,
    currency: "rage",
    tag: "暴击成长",
    category: "pet",
    description: "摇一下叮叮作响，软团会更想打出漂亮连段。",
    effect: "投喂后暴击 +3%，攻击 +1",
    icon: "🔔",
    petBoost: { rage: 16, satiety: 5, affection: 6, attack: 1, crit: 3 }
  },
  {
    id: "sunlight_seed",
    name: "晨光种子",
    price: 28,
    currency: "wallet",
    tag: "灵力供品",
    category: "light",
    description: "把今天的一点小确幸种下去，会长出灵力。",
    effect: "投喂后灵力 +12，饱食 +6，亲密 +3",
    icon: "🌻",
    petBoost: { light: 12, satiety: 6, affection: 3 }
  },
  {
    id: "warm_tea",
    name: "暖心热茶",
    price: 48,
    currency: "wallet",
    tag: "灵力供品",
    category: "light",
    description: "不是咖啡，是真正能暖到胃里的那杯。",
    effect: "投喂后灵力 +18，饱食 +10，防御 +1",
    icon: "🍵",
    petBoost: { light: 18, satiety: 10, affection: 4, defense: 1 }
  },
  {
    id: "gratitude_note",
    name: "感恩便利贴",
    price: 15,
    currency: "wallet",
    tag: "灵力供品",
    category: "light",
    description: "写下三件今天没崩的事，贴给软团看。",
    effect: "投喂后灵力 +8，亲密 +8",
    icon: "📝",
    petBoost: { light: 8, satiety: 2, affection: 8 }
  },
  {
    id: "meditation_cushion",
    name: "冥想坐垫",
    price: 158,
    currency: "wallet",
    tag: "灵力成长",
    description: "让软团坐上去静心，怨气会自然消散一些。",
    category: "light",
    effect: "投喂后灵力 +35，法力上限 +8，当前法力 +20",
    icon: "🧘",
    petBoost: { light: 35, satiety: 8, affection: 6, manaCap: 8, mana: 20 }
  },
  {
    id: "kindness_mirror",
    name: "善意之镜",
    price: 288,
    currency: "wallet",
    tag: "永久净化",
    category: "light",
    description: "照一照，让软团看见自己温柔的那一面。",
    effect: "投喂后灵力 +25，暴击 +2%，亲密 +12",
    icon: "🪞",
    petBoost: { light: 25, satiety: 6, affection: 12, crit: 2 }
  },
  {
    id: "moonlight_harp",
    name: "月光竖琴",
    price: 520,
    currency: "wallet",
    tag: "大额净化",
    category: "light",
    description: "弹一曲，怨气化作音符飘散。",
    effect: "投喂后灵力 +55，饱食 +15，法力 +40",
    icon: "🎵",
    petBoost: { light: 55, satiety: 15, affection: 10, mana: 40 }
  }
];

export const transactionCategories: Record<TransactionCategory, { label: string; icon: string; color: string }> = {
  income: { label: "收入", icon: "入", color: "plus" },
  expense: { label: "支出", icon: "出", color: "minus" },
  wish: { label: "心愿", icon: "愿", color: "minus" },
  mall: { label: "商城", icon: "商", color: "minus" },
  pet: { label: "软团", icon: "宠", color: "minus" }
};

export const sampleStories = [
  {
    title: "匿名工友 001",
    content: "客户凌晨两点改需求，早上九点又问为什么还没交。我现在看见消息提醒都像在听丧钟。",
    goal: "目标：Switch 2",
    reactions: ["递纸巾 108", "同款老板 76", "赛博上香 44"]
  },
  {
    title: "匿名工友 017",
    content: "领导说团队要有创业心态，所以周末自愿加班。但调薪？他说大家先讲格局。",
    goal: "目标：海边疗伤基金",
    reactions: ["喂速效救心丸 82", "递纸巾 61", "同款老板 39"]
  },
  {
    title: "匿名工友 233",
    content: "老板把他忘做的事情甩给我，还说不要影响团队形象。我现在已经能在背锅时保持职业微笑了。",
    goal: "目标：AirPods Max",
    reactions: ["赛博上香 88", "同款老板 51", "递纸巾 29"]
  }
];

export const screenTitles: Record<ScreenKey, string> = {
  converter: "忍了吧控制台",
  mall: "情绪补给",
  pet: "怨气软团",
  ninja: "AI 忍术参谋",
  community: "匿名树洞",
  sync: "多端联动与定时唤醒",
  settings: "基础设置"
};

export const navItems: Array<{ key: ScreenKey; label: string; hint: string }> = [
  { key: "converter", label: "忍了吧", hint: "余额、心愿、账本" },
  { key: "mall", label: "补给仓", hint: "商城、背包、使用记录" },
  { key: "pet", label: "怨气软团", hint: "桌宠、投喂、对练" },
  { key: "ninja", label: "AI 忍术", hint: "三段式回复" },
  { key: "community", label: "匿名树洞", hint: "脱敏发布" },
  { key: "sync", label: "多端提醒", hint: "倒计时、推送文案" },
  { key: "settings", label: "设置", hint: "资料、主题、数据" }
];

export const themeLabels: Record<Theme, string> = {
  cyber: "夜班反击",
  dawn: "熬到天亮",
  smog: "雾霾工位",
  paper: "白纸工位",
  mint: "薄荷摸鱼",
  peach: "桃子假期",
  sky: "晴空待办"
};

export const modeLabels: Record<CountMode, string> = {
  natural: "自然日",
  workday: "工作日"
};

export const moodCopy: Record<Mood, { label: string; short: string; comfort: string; tactic: string }> = {
  rage: {
    label: "火大但清醒",
    short: "火大",
    comfort: "这确实是把别人当耗材的操作。你不需要先检讨自己，离谱的人不是你。",
    tactic: "先回一句「收到，我先同步现状、风险和最小可交付版本，半小时给您方案」。先稳住节奏，再把边界立起来。"
  },
  stable: {
    label: "表面稳如老狗",
    short: "稳住",
    comfort: "你已经够克制了，这种场景换谁来都得心里翻白眼。现在不是怂，是在留后手。",
    tactic: "建议用书面同步把事情钉死：目标、时间、依赖人、阻塞项。锅尽量挂流程上，别全挂你身上。"
  },
  numb: {
    label: "已经麻了但活着",
    short: "麻了",
    comfort: "麻木也是一种自救，说明你已经被反复消耗太久了。先别逼自己积极，先保住电量。",
    tactic: "走最小成本执行法：先交能跑的基础版本，再把增量需求拆出来让对方确认优先级。"
  }
};

export const petTouchProfiles = {
  head: { label: "摸头", mood: "顺毛", rage: 1, nourish: 1, affection: 4, satiety: 0, light: 1, logTitle: "软团被顺毛" },
  face: { label: "戳脸", mood: "嫌弃", rage: 2, nourish: 1, affection: 1, satiety: 0, light: 0, logTitle: "软团脸颊告警" },
  belly: { label: "揉肚", mood: "放松", rage: 1, nourish: 1, affection: 3, satiety: 2, light: 1, logTitle: "软团被揉顺" },
  horn: { label: "捏角", mood: "充能", rage: 3, nourish: 2, affection: 0, satiety: 0, light: 0, logTitle: "软团角尖放电" },
  tail: { label: "拽尾", mood: "炸毛", rage: 4, nourish: 3, affection: -2, satiety: 0, light: 0, logTitle: "软团尾巴警报" }
} as const;

export const dailyRageMilestones = [
  { id: "ripple-50", threshold: 50, title: "怨气涟漪 50", action: "ripple" },
  { id: "ricochet-100", threshold: 100, title: "怨气临界 100", action: "ricochet" },
  { id: "storm-150", threshold: 150, title: "怨气风暴 150", action: "storm" },
  { id: "blackout-200", threshold: 200, title: "黑屏结界 200", action: "blackout" },
  { id: "crack-260", threshold: 260, title: "怨念裂痕 260", action: "crack" },
  { id: "overdrive-320", threshold: 320, title: "怨气超载 320", action: "overdrive" },
  { id: "awaken-400", threshold: 400, title: "邪灵觉醒 400", action: "awaken" },
  { id: "nuke-500", threshold: 500, title: "怨气核爆 500", action: "nuke" }
];

export const mallFilters = [
  { key: "all", label: "全部" },
  { key: "instant", label: "即时止损" },
  { key: "heal", label: "回血" },
  { key: "defense", label: "反打扰" },
  { key: "escape", label: "保命预案" },
  { key: "reward", label: "大额奖励" },
  { key: "pet", label: "怨气供品" },
  { key: "light", label: "灵力供品" }
];

export const transactionFilters: Array<{ key: "all" | TransactionCategory; label: string }> = [
  { key: "all", label: "全部" },
  { key: "income", label: "收入" },
  { key: "expense", label: "支出" },
  { key: "wish", label: "心愿" },
  { key: "mall", label: "商城" },
  { key: "pet", label: "软团" }
];
