const STORAGE_KEY = "wageclaw-state-v3";
const VIEW_MODE = new URLSearchParams(window.location.search).get("view") || "main";
const PET_LAST_INTERACTION_KEY = "wageclaw-pet-last-interaction-at";
const PET_FOCUS_REMINDER_KEY = "wageclaw-pet-focus-reminder-at";
const PET_IDLE_REMINDER_MS = 60 * 60 * 1000;
const PET_IDLE_REMINDER_SNOOZE_MS = 58 * 60 * 1000;

const dailyRageMilestones = [
  {
    id: "ripple-50",
    threshold: 50,
    action: "ripple",
    title: "怨气涟漪 50",
    line: "每日怨气开始涌动，我先抖一抖，替你把第一波不爽甩出去。"
  },
  {
    id: "ricochet-100",
    threshold: 100,
    action: "ricochet",
    title: "怨气临界 100",
    line: "每日怨气冲到 100，我先在桌面弹射三圈，把那些离谱需求撞回去。"
  },
  {
    id: "storm-150",
    threshold: 150,
    action: "storm",
    title: "怨气风暴 150",
    line: "每日怨气搅成风暴，屏幕边缘开始卷风，软团膨胀了一圈。"
  },
  {
    id: "blackout-200",
    threshold: 200,
    action: "blackout",
    title: "黑屏结界 200",
    line: "每日怨气突破 200，黑屏结界自动张开。世界先闭嘴，你先喘口气。"
  },
  {
    id: "crack-260",
    threshold: 260,
    action: "crack",
    title: "怨念裂痕 260",
    line: "每日怨气把屏幕劈出裂痕，软团在裂缝里闪烁。你扛的够多了。"
  },
  {
    id: "overdrive-320",
    threshold: 320,
    action: "overdrive",
    title: "怨气超载 320",
    line: "每日怨气已经超载，我把它压成护心风暴：你不是脆弱，是今天太吵。"
  },
  {
    id: "awaken-400",
    threshold: 400,
    action: "awaken",
    title: "邪灵觉醒 400",
    line: "每日怨气喂出觉醒，软团进化完成。从今往后，谁惹你，我先上。"
  },
  {
    id: "nuke-500",
    threshold: 500,
    action: "nuke",
    title: "怨气核爆 500",
    line: "每日怨气核爆，整个工位都在震。你不是在忍耐，你是在蓄力。"
  }
];

const petFocusReminderCopies = [
  {
    title: "专注巡逻提醒",
    body: "你是不是一直在专注？已经坐很久了，起来走两分钟，喝口水，让肩颈从工位结界里逃一下。"
  },
  {
    title: "软团轻轻敲桌",
    body: "你一小时没理我了。不是怪你，是提醒你：身体不是外设，别只给电脑散热，也给自己散散热。"
  },
  {
    title: "怨气软团值班报告",
    body: "专注很酷，但久坐不酷。站起来活动一下，我替你守着这摊活，回来继续也来得及。"
  }
];

const parts = [
  {
    id: "screen",
    name: "屏幕",
    ratio: 0.38,
    narrative: "屏幕最贵，毕竟未来摸鱼和跑路计划都得靠它发光。"
  },
  {
    id: "memory",
    name: "内存",
    ratio: 0.2,
    narrative: "脑子快炸时，先把设备的脑容量补上。"
  },
  {
    id: "trackpad",
    name: "触控板",
    ratio: 0.14,
    narrative: "最适合当第一块点亮的碎片，能给人一点踏实感。"
  },
  {
    id: "shell",
    name: "外壳",
    ratio: 0.28,
    narrative: "外壳是体面，你表面稳住，里面再慢慢攒。"
  }
];

const petStages = [
  {
    id: "mist",
    level: 1,
    name: "怨气软团",
    threshold: 0,
    avatar: "☁️",
    line: "我是一颗刚从工位烟雾里捏出来的软团。别怕，我只对离谱需求龇牙。"
  },
  {
    id: "imp",
    level: 2,
    name: "电缆小怪",
    threshold: 80,
    avatar: "👁️",
    line: "尾巴接上了充电线，专门侦测临时需求和甩锅现场。"
  },
  {
    id: "lord",
    level: 3,
    name: "软胶护主兽",
    threshold: 220,
    avatar: "😈",
    line: "小金属角长出来了。先别自责，把锅的来龙去脉写清楚，我帮你守着。"
  },
  {
    id: "demon",
    level: 4,
    name: "怨气守护物",
    threshold: 420,
    avatar: "👹",
    line: "我已经从软团变成桌面守护物。你的怨气不会白忍，都会变成我的护盾。"
  },
  {
    id: "overlord",
    level: 5,
    name: "工位软团王",
    threshold: 680,
    avatar: "⚡",
    line: "软胶小宇宙已成型。从今往后，谁敢让你不爽，我先把它弹出屏幕。"
  }
];

const mallItems = [
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
    category: "light",
    description: "让软团坐上去静心，怨气会自然消散一些。",
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

const transactionCategories = {
  income: { label: "收入", icon: "📥", color: "plus" },
  expense: { label: "支出", icon: "📤", color: "minus" },
  wish: { label: "心愿", icon: "⭐", color: "minus" },
  mall: { label: "商城", icon: "🛒", color: "minus" },
  pet: { label: "软团", icon: "🌀", color: "minus" }
};

const sampleStories = [
  {
    title: "匿名工友 001",
    content:
      "客户凌晨两点改需求，早上九点又问为什么还没交。我现在看见消息提醒都像在听丧钟。",
    goal: "目标：Switch 2",
    reactions: ["递纸巾 108", "同款老板 76", "赛博上香 44"]
  },
  {
    title: "匿名工友 017",
    content:
      "领导说团队要有创业心态，所以周末自愿加班。但调薪？他说大家先讲格局。",
    goal: "目标：海边疗伤基金",
    reactions: ["喂速效救心丸 82", "递纸巾 61", "同款老板 39"]
  },
  {
    title: "匿名工友 233",
    content:
      "老板把他忘做的事情甩给我，还说不要影响团队形象。我现在已经能在背锅时保持职业微笑了。",
    goal: "目标：AirPods Max",
    reactions: ["赛博上香 88", "同款老板 51", "递纸巾 29"]
  }
];

const screenTitles = {
  converter: "工位控制台",
  mall: "情绪补给",
  pet: "怨气软团",
  ninja: "AI 工位参谋",
  community: "匿名树洞",
  sync: "多端联动与定时唤醒",
  widget: "桌面挂件",
  settings: "基础设置"
};

const themeLabels = {
  cyber: "3D 软胶工位",
  dawn: "熬到天亮",
  smog: "雾霾工位",
  paper: "白纸工位",
  mint: "薄荷摸鱼",
  peach: "桃子假期",
  sky: "晴空待办"
};

const modeLabels = {
  natural: "自然日",
  workday: "工作日"
};

const moodCopy = {
  rage: {
    label: "火大但清醒",
    short: "火大",
    comfort:
      "这确实是纯纯把别人当耗材的脑干缺失操作。你不需要先检讨自己，离谱的人不是你。",
    tactic:
      "先回一句「收到，我先同步现状、风险和最小可交付版本，半小时给您方案」。先稳住节奏，再把边界立起来。"
  },
  stable: {
    label: "表面稳如老狗",
    short: "稳住",
    comfort:
      "你已经够克制了，这种场景换谁来都得心里翻白眼。现在不是怂，是在留后手。",
    tactic:
      "建议用书面同步把事情钉死：目标、时间、依赖人、阻塞项。锅尽量挂流程上，别全挂你身上。"
  },
  numb: {
    label: "已经麻了但活着",
    short: "麻了",
    comfort:
      "麻木也是一种自救，说明你已经被反复消耗太久了。先别逼自己积极，先保住电量。",
    tactic:
      "走最小成本执行法：先交能跑的基础版本，再把增量需求拆出来让对方确认优先级。"
  }
};

const petAmbientLines = {
  morning: [
    "早上先别急着自我燃烧，我替你盯着今天第一波离谱需求。",
    "晨会之前先稳住呼吸，真要炸我替你先记仇。"
  ],
  noon: [
    "中午别只吃情绪，最好真吃两口热的。",
    "午间巡逻中：建议补糖、补水、补一点不想理人的权利。"
  ],
  evening: [
    "快到下班了，谁再塞需求我就替你龇牙。",
    "傍晚是人最容易妥协的时候，记得先守住边界。"
  ],
  late: [
    "这么晚还在亮屏？我陪着，但我不同意这是常态。",
    "夜深工位凉，我把怨气烧热点，别让你一个人扛。"
  ]
};

const petTouchResponses = {
  head: [
    "摸头有效。今天先不咬人，先陪你稳住。",
    "头顶充能完毕，我对你暂时温柔一点。",
    "这下顺毛了。等会儿谁再惹你，我先替你记名字。"
  ],
  face: [
    "别老戳脸，我也是有尊严的怨念体。",
    "脸给你戳一下可以，再戳我要加收供品。",
    "戳脸会涨怨气，这不是威胁，这是收费标准。"
  ],
  belly: [
    "揉肚归揉肚，供品也别忘了上。",
    "这下舒服了，亲密度算你一笔。",
    "肚子被揉顺了，今天暂时不在你桌面上打滚。"
  ],
  horn: [
    "角可以捏，但别把我当解压玩具。我会记账。",
    "捏角等于点火，怨气反应堆开始预热。",
    "你碰到战斗开关了。工位对战的时候我会更认真。"
  ],
  tail: [
    "尾巴不是拉环。你再拽，我就把怨气甩你屏幕上。",
    "拽尾成功，软团进入半秒钟记仇模式。",
    "尾巴警报响了。很好，怨气值又多了一点素材。"
  ]
};

const petTouchProfiles = {
  head: {
    label: "摸头",
    mood: "顺毛",
    effect: "heart",
    glyph: "心",
    rage: 1,
    nourish: 1,
    affection: 4,
    satiety: 0,
    light: 1,
    moodClass: "pleased",
    logTitle: "软团被顺毛"
  },
  face: {
    label: "戳脸",
    mood: "嫌弃",
    effect: "poke",
    glyph: "戳",
    rage: 2,
    nourish: 1,
    affection: 1,
    satiety: 0,
    light: 0,
    moodClass: "annoyed",
    logTitle: "软团脸颊告警"
  },
  belly: {
    label: "揉肚",
    mood: "放松",
    effect: "snack",
    glyph: "软",
    rage: 1,
    nourish: 1,
    affection: 3,
    satiety: 2,
    light: 1,
    moodClass: "cozy",
    logTitle: "软团被揉顺"
  },
  horn: {
    label: "捏角",
    mood: "充能",
    effect: "spark",
    glyph: "啪",
    rage: 3,
    nourish: 2,
    affection: 0,
    satiety: 0,
    light: 0,
    moodClass: "charged",
    logTitle: "软团角尖放电"
  },
  tail: {
    label: "拽尾",
    mood: "炸毛",
    effect: "tail",
    glyph: "怒",
    rage: 4,
    nourish: 3,
    affection: -2,
    satiety: 0,
    light: 0,
    moodClass: "furious",
    logTitle: "软团尾巴警报"
  }
};

const petTouchOverloadLines = [
  "你手速可以，但我耐心不行。怨气过载，先收你一笔精神损耗。",
  "连续触摸次数过高，我宣布进入炸毛收费模式。",
  "别点了别点了，我已经从软团变成桌面投诉热线。"
];

const petBusinessLines = {
  rich: [
    "账户变厚了。我建议先奖励自己，再谈继续忍。",
    "额度不错，今天不是只能靠意志力活着的日子。"
  ],
  broke: [
    "账户有点薄，我先陪你把情绪值顶住。",
    "额度紧张时更要谨慎发疯，我帮你攒着劲。"
  ],
  wishNear: [
    "离心愿只差临门一脚了，别在最后几步乱花。",
    "再稳几天，那件想要的东西就快真的归你了。"
  ],
  offWorkSoon: [
    "快下班了，挺住，别在终点前给人白送加班。",
    "离自由只差一点时间，我已经替你开始倒数。"
  ]
};

const petBattleOnlineCopy = [
  "联机位已预留：后续可接房间号、匹配队列和战绩榜。",
  "当前先开放工位对战，联机协议层我已经给你留了接口位。",
  "未来这里可以接 WebSocket 房间，把别人的软团也拉进工位擂台。"
];

const duelMoves = {
  punch: {
    label: "普通拳",
    playerPhase: "你贴身抢先手",
    enemyPhase: "老板怨念体贴脸反咬",
    playerHit: "普通拳",
    enemyHit: "反咬",
    miss: "拳头擦着空气过去，先压近一点。",
    timer: 10,
    reach: 10.5,
    damage: 10,
    knockback: 3.2,
    guardBreak: 8,
    energyGain: 9,
    cooldown: 0,
    cost: 0
  },
  kick: {
    label: "反弹脚",
    playerPhase: "你把甩锅踢回去",
    enemyPhase: "老板怨念体抬脚反扑",
    playerHit: "反弹脚",
    enemyHit: "反踢",
    miss: "这一脚抡空了，等对方进身再踢。",
    timer: 16,
    reach: 15,
    damage: 16,
    knockback: 4.6,
    guardBreak: 12,
    energyGain: 12,
    cooldown: 0,
    cost: 0
  },
  uppercut: {
    label: "嘴替暴击",
    playerPhase: "你把那句不敢说的边界打出去",
    enemyPhase: "老板怨念体起身反挑",
    playerHit: "嘴替暴击",
    enemyHit: "反挑",
    miss: "嘴替没打到点上，先靠近一点再输出边界。",
    timer: 20,
    reach: 12.5,
    damage: 22,
    knockback: 2.4,
    lift: -8,
    guardBreak: 18,
    energyGain: 3,
    cooldown: 28,
    cost: 28
  },
  blast: {
    label: "怨气波",
    playerPhase: "你把怨气打成波",
    enemyPhase: "老板怨念体蓄出怨气波",
    playerHit: "怨气波",
    enemyHit: "怨气波",
    miss: "怨气波从边上穿过去了，角度再正一点。",
    timer: 24,
    reach: 38,
    damage: 24,
    knockback: 6,
    guardBreak: 20,
    energyGain: 0,
    cooldown: 46,
    cost: 40
  },
  heal: {
    label: "安抚回血",
    playerPhase: "你先把自己从崩溃边缘拉回来",
    enemyPhase: "老板怨念体短暂迟疑",
    playerHit: "回血",
    enemyHit: "迟疑",
    miss: "安抚不是逃避，是先把血条拉住。",
    timer: 18,
    reach: 0,
    damage: 0,
    knockback: 0,
    guardBreak: 0,
    energyGain: 0,
    cooldown: 74,
    cost: 30
  }
};

const defaultState = {
  nickname: "工位逃兵",
  salary: 12000,
  wish: "MacBook Pro",
  price: 15000,
  rageMinutes: 45,
  mood: "rage",
  masked: false,
  theme: "cyber",
  countMode: "natural",
  startTime: "09:30",
  endTime: "18:30",
  payday: 10,
  widgetDefaultView: "wallet",
  widgetView: "wallet",
  walletBalance: 4242,
  rageBalance: 88,
  dailyRage: {
    date: getLocalDateKey(),
    value: 0,
    triggered: []
  },
  lastClaimDate: "",
  unlockedParts: ["trackpad"],
  inventory: {
    coffee: 1,
    meeting_jar: 1
  },
  pet: {
    name: "怨气软团",
    rage: 35,
    light: 0,
    mana: 46,
    attackBonus: 0,
    defenseBonus: 0,
    manaBonus: 0,
    critBonus: 0,
    cultivation: 0,
    satiety: 62,
    affection: 18,
    summoned: false,
    gameBest: 0,
    lastLine: "把今天吞下去的那口气给我，我替你养成能反击的样子。",
    lastAmbientPeriod: "",
    touchCount: 0,
    touchHeat: 0,
    touchMood: "乖巧待机",
    battleWins: 0,
    battleLosses: 0,
    battleBestCombo: 0,
    lastBusinessHint: ""
  },
  transactions: [
    {
      title: "初始薪资账户余额",
      amount: 6380,
      note: "来自前几天硬扛记录",
      time: "刚刚",
      category: "income",
      date: new Date().toISOString().slice(0, 10)
    },
    {
      title: "点亮 触控板",
      amount: -2100,
      note: "MacBook Pro",
      time: "刚刚",
      category: "wish",
      date: new Date().toISOString().slice(0, 10)
    },
    {
      title: "购买 带薪续命咖啡券",
      amount: -38,
      note: "情绪补给",
      time: "刚刚",
      category: "mall",
      date: new Date().toISOString().slice(0, 10)
    }
  ],
  usageLog: [],
  petLog: [
    {
      title: "怨气软团醒了",
      detail: "一团怨气在桌角成形，正在等你投喂。",
      time: "刚刚"
    }
  ],
  transactionFilter: "all",
  mallFilter: "all"
};

const state = {
  ...defaultState,
  unlockedParts: [...defaultState.unlockedParts],
  inventory: { ...defaultState.inventory },
  pet: { ...defaultState.pet },
  transactions: defaultState.transactions.map((item) => ({ ...item })),
  usageLog: [...defaultState.usageLog],
  petLog: defaultState.petLog.map((item) => ({ ...item }))
};

const PAGE_SIZE = 10;

const runtime = {
  petGameActive: false,
  petGameScore: 0,
  blackoutTimer: null,
  petAmbientTimer: null,
  petIdleTimer: null,
  petFocusReminderTimer: null,
  petCareToastTimer: null,
  rageSurgeTimer: null,
  petRicochetTimer: null,
  petRippleTimer: null,
  rageStormTimer: null,
  rageCrackTimer: null,
  rageAwakenTimer: null,
  rageNukeTimer: null,
  appStartedAt: Date.now(),
  petTouchFxTimer: null,
  petTouchStreak: 0,
  petLastTouchAt: 0,
  petClickTimer: null,
  petClickCount: 0,
  petBubbleTimer: null,
  petRadialTimer: null,
  petShakeDirection: 0,
  petShakeCount: 0,
  petShakeStartedAt: 0,
  duelLoop: null,
  duelActive: false,
  duelKeys: new Set(),
  pagination: {
    walletTransactions: 1,
    partShop: 1,
    mallCatalog: 1,
    inventory: 1,
    usageLog: 1,
    petSupply: 1,
    petLog: 1,
    community: 1
  },
  duelState: {
    player: {
      x: 18,
      y: 62,
      hp: 100,
      energy: 36,
      maxEnergy: 100,
      guard: 72,
      maxGuard: 72,
      facing: 1,
      attackTimer: 0,
      attackType: "",
      hitCooldown: 0,
      hitFlash: 0,
      dashCooldown: 0,
      invulnTimer: 0,
      guarding: false,
      moving: false,
      skillCooldowns: { uppercut: 0, blast: 0, dash: 0, guard: 0 }
    },
    enemy: {
      x: 74,
      y: 62,
      hp: 100,
      mana: 46,
      maxMana: 80,
      guard: 64,
      maxGuard: 64,
      facing: -1,
      attackTimer: 0,
      attackType: "",
      hitCooldown: 0,
      hitFlash: 0,
      dashCooldown: 0,
      invulnTimer: 0,
      guarding: false,
      moving: false,
      aiTimer: 0
    },
    combo: 0,
    comboTimer: 0,
    fxText: "",
    fxTimer: 0,
    phase: "待命中",
    resultText: "",
    resultTimer: 0,
    cameraShake: 0,
    status: "按开始后用 W S A D 移动，J 出拳，K 踢击。",
    onlinePreview: false
  }
};

const els = {
  body: document.body,
  setupForm: document.getElementById("setupForm"),
  nicknameInput: document.getElementById("nickname"),
  salaryInput: document.getElementById("salary"),
  wishInput: document.getElementById("wish"),
  priceInput: document.getElementById("price"),
  rageMinutesInput: document.getElementById("rageMinutes"),
  screenTitle: document.getElementById("screenTitle"),
  navItems: document.querySelectorAll(".nav-item"),
  screens: document.querySelectorAll(".screen"),
  screenJumps: document.querySelectorAll("[data-screen-jump]"),
  accountTabs: document.querySelectorAll("[data-account-tab]"),
  accountPanels: document.querySelectorAll("[data-account-panel]"),
  moduleTabs: document.querySelectorAll("[data-module-tab]"),
  modulePanels: document.querySelectorAll("[data-module-panel]"),
  chips: document.querySelectorAll(".chip"),
  partButtons: document.querySelectorAll(".part"),
  todayCoins: document.getElementById("todayCoins"),
  topWalletBalance: document.getElementById("topWalletBalance"),
  topRageBalance: document.getElementById("topRageBalance"),
  topDailyRage: document.getElementById("topDailyRage"),
  unlockedCount: document.getElementById("unlockedCount"),
  topOffWork: document.getElementById("topOffWork"),
  dailyUnlock: document.getElementById("dailyUnlock"),
  coinBalance: document.getElementById("coinBalance"),
  wishSpent: document.getElementById("wishSpent"),
  remainingAmount: document.getElementById("remainingAmount"),
  daysNeeded: document.getElementById("daysNeeded"),
  walletSubline: document.getElementById("walletSubline"),
  claimWalletButton: document.getElementById("claimWalletButton"),
  walletTransactionList: document.getElementById("walletTransactionList"),
  wishlistProgressBar: document.getElementById("wishlistProgressBar"),
  wishProgressText: document.getElementById("wishProgressText"),
  partNarrative: document.getElementById("partNarrative"),
  partShop: document.getElementById("partShop"),
  coachButton: document.getElementById("coachButton"),
  rantInput: document.getElementById("rantInput"),
  aiResponse: document.getElementById("aiResponse"),
  communityList: document.getElementById("communityList"),
  rawPost: document.getElementById("rawPost"),
  safePost: document.getElementById("safePost"),
  morningPush: document.getElementById("morningPush"),
  eveningPush: document.getElementById("eveningPush"),
  followUpPush: document.getElementById("followUpPush"),
  offWorkDetail: document.getElementById("offWorkDetail"),
  saturdayDetail: document.getElementById("saturdayDetail"),
  holidayDetail: document.getElementById("holidayDetail"),
  maskToggle: document.getElementById("maskToggle"),
  widgetBadge: document.querySelector(".widget-badge"),
  floatingWidget: document.querySelector(".floating-widget"),
  widgetViewButtons: document.querySelectorAll("[data-widget-view]"),
  widgetPanels: document.querySelectorAll("[data-widget-panel]"),
  widgetBalance: document.getElementById("widgetBalance"),
  widgetWishName: document.getElementById("widgetWishName"),
  widgetWishProgress: document.getElementById("widgetWishProgress"),
  widgetWishBar: document.getElementById("widgetWishBar"),
  widgetMoodTitle: document.getElementById("widgetMoodTitle"),
  widgetAiLine: document.getElementById("widgetAiLine"),
  widgetAiWishLine: document.getElementById("widgetAiWishLine"),
  widgetAiTacticLine: document.getElementById("widgetAiTacticLine"),
  widgetPetAvatar: document.getElementById("widgetPetAvatar"),
  widgetPetStage: document.getElementById("widgetPetStage"),
  widgetPetMoodBadge: document.getElementById("widgetPetMoodBadge"),
  widgetPetLine: document.getElementById("widgetPetLine"),
  widgetPetRage: document.getElementById("widgetPetRage"),
  widgetPetBar: document.getElementById("widgetPetBar"),
  widgetPetActionToggle: document.getElementById("widgetPetActionToggle"),
  widgetPetActionMenu: document.getElementById("widgetPetActionMenu"),
  summonPetButton: document.getElementById("summonPetButton"),
  widgetPetBlackoutButton: document.getElementById("widgetPetBlackoutButton"),
  widgetPetPlayButton: document.getElementById("widgetPetPlayButton"),
  widgetPetDuelButton: document.getElementById("widgetPetDuelButton"),
  widgetPetOnlineButton: document.getElementById("widgetPetOnlineButton"),
  widgetStreak: document.getElementById("widgetStreak"),
  widgetMode: document.getElementById("widgetMode"),
  widgetOffWork: document.getElementById("widgetOffWork"),
  widgetSaturday: document.getElementById("widgetSaturday"),
  widgetHoliday: document.getElementById("widgetHoliday"),
  widgetPepTalk: document.getElementById("widgetPepTalk"),
  openMainPanel: document.getElementById("openMainPanel"),
  widgetExplainStreak: document.getElementById("widgetExplainStreak"),
  widgetExplainOffWork: document.getElementById("widgetExplainOffWork"),
  widgetExplainHoliday: document.getElementById("widgetExplainHoliday"),
  widgetModeCard: document.getElementById("widgetModeCard"),
  widgetShiftCard: document.getElementById("widgetShiftCard"),
  widgetCoinCard: document.getElementById("widgetCoinCard"),
  widgetProgressCard: document.getElementById("widgetProgressCard"),
  themeSelect: document.getElementById("themeSelect"),
  countModeSelect: document.getElementById("countModeSelect"),
  widgetDefaultViewSelect: document.getElementById("widgetDefaultViewSelect"),
  settingsThemePreview: document.getElementById("settingsThemePreview"),
  settingsModePreview: document.getElementById("settingsModePreview"),
  settingsWidgetPreview: document.getElementById("settingsWidgetPreview"),
  startTimeInput: document.getElementById("startTimeInput"),
  endTimeInput: document.getElementById("endTimeInput"),
  paydayInput: document.getElementById("paydayInput"),
  saveSettings: document.getElementById("saveSettings"),
  monthlyIncome: document.getElementById("monthlyIncome"),
  monthlyExpense: document.getElementById("monthlyExpense"),
  monthlyNet: document.getElementById("monthlyNet"),
  incomeBar: document.getElementById("incomeBar"),
  expenseBar: document.getElementById("expenseBar"),
  transactionCount: document.getElementById("transactionCount"),
  transactionFilterLabel: document.getElementById("transactionFilterLabel"),
  quickMallPreview: document.getElementById("quickMallPreview"),
  mallBalance: document.getElementById("mallBalance"),
  mallBalanceSubline: document.getElementById("mallBalanceSubline"),
  mallListEnhanced: document.getElementById("mallListEnhanced"),
  inventoryListEnhanced: document.getElementById("inventoryListEnhanced"),
  inventoryUsageLog: document.getElementById("inventoryUsageLog"),
  petAvatar: document.getElementById("petAvatar"),
  petStageName: document.getElementById("petStageName"),
  petLevel: document.getElementById("petLevel"),
  petLine: document.getElementById("petLine"),
  petMoodBadge: document.getElementById("petMoodBadge"),
  petTouchHeat: document.getElementById("petTouchHeat"),
  petDailyRageBadge: document.getElementById("petDailyRageBadge"),
  petRageBalance: document.getElementById("petRageBalance"),
  petDailyRage: document.getElementById("petDailyRage"),
  petLightBalance: document.getElementById("petLightBalance"),
  petAffinity: document.getElementById("petAffinity"),
  petAffinityBar: document.getElementById("petAffinityBar"),
  petAttackPower: document.getElementById("petAttackPower"),
  petAttackBar: document.getElementById("petAttackBar"),
  petMana: document.getElementById("petMana"),
  petManaBar: document.getElementById("petManaBar"),
  petDefensePower: document.getElementById("petDefensePower"),
  petDefenseBar: document.getElementById("petDefenseBar"),
  petCritRate: document.getElementById("petCritRate"),
  petCritBar: document.getElementById("petCritBar"),
  petCombatPower: document.getElementById("petCombatPower"),
  petCultivation: document.getElementById("petCultivation"),
  petCultivationBar: document.getElementById("petCultivationBar"),
  petRageProgress: document.getElementById("petRageProgress"),
  petRageBar: document.getElementById("petRageBar"),
  petSatiety: document.getElementById("petSatiety"),
  petSatietyBar: document.getElementById("petSatietyBar"),
  petAffection: document.getElementById("petAffection"),
  petAffectionBar: document.getElementById("petAffectionBar"),
  petRantInput: document.getElementById("petRantInput"),
  refineRageButton: document.getElementById("refineRageButton"),
  refineLightButton: document.getElementById("refineLightButton"),
  petSupplyList: document.getElementById("petSupplyList"),
  petLogList: document.getElementById("petLogList"),
  petMallButton: document.getElementById("petMallButton"),
  summonPetPanelButton: document.getElementById("summonPetPanelButton"),
  petGameButton: document.getElementById("petGameButton"),
  petTrainButton: document.getElementById("petTrainButton"),
  petTrainingCost: document.getElementById("petTrainingCost"),
  petBlackoutButton: document.getElementById("petBlackoutButton"),
  petGamePanel: document.getElementById("petGamePanel"),
  petGameScore: document.getElementById("petGameScore"),
  petGameTarget: document.getElementById("petGameTarget"),
  petDuelModeLabel: document.getElementById("petDuelModeLabel"),
  petDuelRecord: document.getElementById("petDuelRecord"),
  petDuelPanel: document.getElementById("petDuelPanel"),
  petDuelArena: document.getElementById("petDuelArena"),
  petPlayerHp: document.getElementById("petPlayerHp"),
  petEnemyHp: document.getElementById("petEnemyHp"),
  petPlayerEnergy: document.getElementById("petPlayerEnergy"),
  petEnemyMana: document.getElementById("petEnemyMana"),
  petPlayerHpText: document.getElementById("petPlayerHpText"),
  petEnemyHpText: document.getElementById("petEnemyHpText"),
  petPlayerEnergyText: document.getElementById("petPlayerEnergyText"),
  petEnemyManaText: document.getElementById("petEnemyManaText"),
  petPlayerFighter: document.getElementById("petPlayerFighter"),
  petEnemyFighter: document.getElementById("petEnemyFighter"),
  petDuelFx: document.getElementById("petDuelFx"),
  petDuelResult: document.getElementById("petDuelResult"),
  petDuelCombo: document.getElementById("petDuelCombo"),
  petDuelPhase: document.getElementById("petDuelPhase"),
  petDuelStatus: document.getElementById("petDuelStatus"),
  petDuelStartButton: document.getElementById("petDuelStartButton"),
  petDuelOnlineButton: document.getElementById("petDuelOnlineButton"),
  petDuelHint: document.getElementById("petDuelHint"),
  petDuelSkills: document.querySelectorAll("[data-duel-skill]"),
  petDuelModeLabelMain: document.getElementById("petDuelModeLabelMain"),
  petDuelRecordMain: document.getElementById("petDuelRecordMain"),
  petDuelPanelMain: document.getElementById("petDuelPanelMain"),
  petDuelArenaMain: document.getElementById("petDuelArenaMain"),
  petPlayerHpMain: document.getElementById("petPlayerHpMain"),
  petEnemyHpMain: document.getElementById("petEnemyHpMain"),
  petPlayerEnergyMain: document.getElementById("petPlayerEnergyMain"),
  petEnemyManaMain: document.getElementById("petEnemyManaMain"),
  petPlayerHpTextMain: document.getElementById("petPlayerHpTextMain"),
  petEnemyHpTextMain: document.getElementById("petEnemyHpTextMain"),
  petPlayerEnergyTextMain: document.getElementById("petPlayerEnergyTextMain"),
  petEnemyManaTextMain: document.getElementById("petEnemyManaTextMain"),
  petPlayerFighterMain: document.getElementById("petPlayerFighterMain"),
  petEnemyFighterMain: document.getElementById("petEnemyFighterMain"),
  petDuelFxMain: document.getElementById("petDuelFxMain"),
  petDuelResultMain: document.getElementById("petDuelResultMain"),
  petDuelComboMain: document.getElementById("petDuelComboMain"),
  petDuelPhaseMain: document.getElementById("petDuelPhaseMain"),
  petDuelStatusMain: document.getElementById("petDuelStatusMain"),
  petDuelStartButtonMain: document.getElementById("petDuelStartButtonMain"),
  petDuelOnlineButtonMain: document.getElementById("petDuelOnlineButtonMain"),
  petDuelHintMain: document.getElementById("petDuelHintMain"),
  petDuelSkillsMain: document.querySelectorAll("#petDuelPanelMain [data-duel-skill]"),
  petTouchButtons: document.querySelectorAll("[data-pet-touch]"),
  summonedPet: document.getElementById("summonedPet"),
  summonedPetAvatar: document.getElementById("summonedPetAvatar"),
  summonedPetMoodBadge: document.getElementById("summonedPetMoodBadge"),
  summonedPetBubble: document.getElementById("summonedPetBubble"),
  petRadialMenu: document.getElementById("petRadialMenu"),
  petRadialActions: document.querySelectorAll("[data-pet-action]"),
  rageBlackout: document.getElementById("rageBlackout"),
  resetDataButton: document.getElementById("resetDataButton"),
  desktopDuelOverlay: document.getElementById("desktopDuelOverlay"),
  deskPlayerHpBar: document.getElementById("deskPlayerHpBar"),
  deskEnemyHpBar: document.getElementById("deskEnemyHpBar"),
  deskPlayerHpText: document.getElementById("deskPlayerHpText"),
  deskEnemyHpText: document.getElementById("deskEnemyHpText"),
  deskPlayerEnergyText: document.getElementById("deskPlayerEnergyText"),
  deskEnemyManaText: document.getElementById("deskEnemyManaText"),
  deskPlayerFighter: document.getElementById("deskPlayerFighter"),
  deskEnemyFighter: document.getElementById("deskEnemyFighter"),
  deskDuelCombo: document.getElementById("deskDuelCombo"),
  deskDuelFx: document.getElementById("deskDuelFx"),
  deskDuelStatus: document.getElementById("deskDuelStatus"),
  deskDuelResult: document.getElementById("deskDuelResult"),
  deskDuelSkills: document.querySelectorAll(".desktop-duel-skills [data-duel-skill]")
};

function normalizeState() {
  const validThemes = Object.keys(themeLabels);
  const validWidgetViews = ["wallet", "ai", "pet", "countdown"];
  state.salary = Math.max(1, Number(state.salary) || defaultState.salary);
  state.price = Math.max(1, Number(state.price) || defaultState.price);
  state.rageMinutes = Math.max(0, Number(state.rageMinutes) || 0);
  state.walletBalance = Math.max(0, Number(state.walletBalance) || 0);
  state.rageBalance = Math.max(0, Number(state.rageBalance) || 0);
  const todayKey = getLocalDateKey();
  const dailyRage = state.dailyRage && typeof state.dailyRage === "object" ? state.dailyRage : {};
  state.dailyRage = {
    date: todayKey,
    value: dailyRage.date === todayKey ? Math.max(0, Number(dailyRage.value) || 0) : 0,
    triggered: dailyRage.date === todayKey && Array.isArray(dailyRage.triggered)
      ? dailyRage.triggered.filter((id, index, arr) => dailyRageMilestones.some((item) => item.id === id) && arr.indexOf(id) === index)
      : []
  };
  state.theme = validThemes.includes(state.theme) ? state.theme : defaultState.theme;
  state.widgetDefaultView = validWidgetViews.includes(state.widgetDefaultView)
    ? state.widgetDefaultView
    : defaultState.widgetDefaultView;
  state.widgetView = validWidgetViews.includes(state.widgetView) ? state.widgetView : state.widgetDefaultView;
  state.unlockedParts = Array.isArray(state.unlockedParts)
    ? state.unlockedParts.filter((id, index, arr) => parts.some((part) => part.id === id) && arr.indexOf(id) === index)
    : [];
  state.inventory = state.inventory && typeof state.inventory === "object" ? state.inventory : {};
  state.pet = state.pet && typeof state.pet === "object" ? { ...defaultState.pet, ...state.pet } : { ...defaultState.pet };
  state.pet.rage = Math.max(0, Number(state.pet.rage) || 0);
  state.pet.light = Math.max(0, Number(state.pet.light) || 0);
  state.pet.mana = Math.max(0, Number(state.pet.mana) || 0);
  state.pet.attackBonus = Math.max(0, Number(state.pet.attackBonus) || 0);
  state.pet.defenseBonus = Math.max(0, Number(state.pet.defenseBonus) || 0);
  state.pet.manaBonus = Math.max(0, Number(state.pet.manaBonus) || 0);
  state.pet.critBonus = Math.max(0, Number(state.pet.critBonus) || 0);
  state.pet.cultivation = Math.max(0, Number(state.pet.cultivation) || 0);
  state.pet.satiety = Math.min(100, Math.max(0, Number(state.pet.satiety) || 0));
  state.pet.affection = Math.min(100, Math.max(0, Number(state.pet.affection) || 0));
  clampPetMana();
  state.pet.summoned = Boolean(state.pet.summoned);
  state.pet.gameBest = Math.max(0, Number(state.pet.gameBest) || 0);
  state.pet.touchCount = Math.max(0, Number(state.pet.touchCount) || 0);
  state.pet.touchHeat = Math.min(100, Math.max(0, Number(state.pet.touchHeat) || 0));
  state.pet.touchMood = state.pet.touchMood || "乖巧待机";
  state.pet.battleWins = Math.max(0, Number(state.pet.battleWins) || 0);
  state.pet.battleLosses = Math.max(0, Number(state.pet.battleLosses) || 0);
  state.pet.battleBestCombo = Math.max(0, Number(state.pet.battleBestCombo) || 0);
  state.pet.lastLine = state.pet.lastLine || defaultState.pet.lastLine;
  state.pet.lastAmbientPeriod = state.pet.lastAmbientPeriod || "";
  state.pet.lastBusinessHint = state.pet.lastBusinessHint || "";
  state.transactions = Array.isArray(state.transactions) ? state.transactions : [];
  state.usageLog = Array.isArray(state.usageLog) ? state.usageLog : [];
  state.petLog = Array.isArray(state.petLog) ? state.petLog : [];
  state.transactionFilter = ["all", "income", "expense", "wish", "mall", "pet"].includes(state.transactionFilter)
    ? state.transactionFilter
    : "all";
  state.mallFilter = ["all", "instant", "heal", "defense", "escape", "reward", "pet", "light"].includes(state.mallFilter)
    ? state.mallFilter
    : "all";
}

function loadStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
    normalizeState();
  } catch (error) {
    console.warn("Failed to load settings", error);
  }
}

function persistSettings() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...state,
      unlockedParts: [...state.unlockedParts],
      inventory: { ...state.inventory },
      pet: { ...state.pet },
      transactions: state.transactions,
      usageLog: state.usageLog,
      petLog: state.petLog
    })
  );
}

function formatMoney(value, decimals = 2) {
  const num = Number(value) || 0;
  const fixed = num.toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const formattedInt = Number(intPart).toLocaleString("zh-CN");
  return decimals > 0 ? `¥${formattedInt}.${decPart}` : `¥${formattedInt}`;
}

function formatRage(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("zh-CN")} 怨气`;
}

function formatLight(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("zh-CN")} 灵力`;
}

function getPetAffinity() {
  const rage = Number(state.pet.rage) || 0;
  const light = Number(state.pet.light) || 0;
  const total = rage + light;
  if (total === 0) return { type: "neutral", percent: 50, label: "混沌初开" };
  const ragePercent = Math.round((rage / total) * 100);
  if (ragePercent >= 70) return { type: "demon", percent: ragePercent, label: "魔丸" };
  if (ragePercent <= 30) return { type: "spirit", percent: 100 - ragePercent, label: "灵珠" };
  return { type: "neutral", percent: ragePercent, label: "亦正亦邪" };
}

function formatResource(value, currency = "wallet") {
  return currency === "rage" ? formatRage(value) : formatMoney(value);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getDailySalary() {
  return Math.round(state.salary / 21.75);
}

function getDailyCoins() {
  return getDailySalary();
}

function getWalletCoins() {
  const dynamicBase = getDynamicBalance();
  return Math.max(0, dynamicBase + state.walletBalance);
}

function getRageCoins() {
  return state.rageBalance;
}

function ensureDailyRageBucket() {
  const todayKey = getLocalDateKey();
  if (!state.dailyRage || typeof state.dailyRage !== "object" || state.dailyRage.date !== todayKey) {
    state.dailyRage = { date: todayKey, value: 0, triggered: [] };
  }
  if (!Array.isArray(state.dailyRage.triggered)) {
    state.dailyRage.triggered = [];
  }
  state.dailyRage.value = Math.max(0, Number(state.dailyRage.value) || 0);
  return state.dailyRage;
}

function getDailyRageValue() {
  return ensureDailyRageBucket().value;
}

function addRageCoins(amount, source = "怨气增长", options = {}) {
  const gained = Math.max(0, Math.round(Number(amount) || 0));
  if (!gained) return 0;
  state.rageBalance += gained;
  const bucket = ensureDailyRageBucket();
  bucket.value += gained;
  if (!options.skipMilestones) {
    maybeTriggerDailyRageMilestones(source);
  }
  return gained;
}

function getMallItemCurrency(item) {
  return item.currency || "wallet";
}

function getResourceBalance(currency = "wallet") {
  return currency === "rage" ? getRageCoins() : getWalletCoins();
}

function getPartPrice(part) {
  return Math.round(state.price * part.ratio);
}

function getUnlockedPartCount() {
  return parts.filter((part) => state.unlockedParts.includes(part.id)).length;
}

function getWishSpent() {
  return parts.filter((part) => state.unlockedParts.includes(part.id)).reduce((total, part) => total + getPartPrice(part), 0);
}

function getWishRemainingCost() {
  return Math.max(0, state.price - getWishSpent());
}

function getNextLockedPart() {
  return parts.find((part) => !state.unlockedParts.includes(part.id)) || null;
}

function hasClaimedToday() {
  return state.lastClaimDate === getLocalDateKey();
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function getHolidayAnchor(now = new Date()) {
  const year = now.getFullYear();
  const holidays = [
    { name: "元旦", month: 0, day: 1 },
    { name: "春节", month: 0, day: 29 },
    { name: "清明假期", month: 3, day: 4 },
    { name: "五一假期", month: 4, day: 1 },
    { name: "端午假期", month: 5, day: 19 },
    { name: "中秋假期", month: 8, day: 25 },
    { name: "国庆假期", month: 9, day: 1 }
  ];

  const currentYearHolidays = holidays.map(h => {
    const date = new Date(year, h.month, h.day, 9, 0, 0);
    return { name: h.name, date };
  });

  const nextHoliday = currentYearHolidays.find(h => h.date > now);
  if (nextHoliday) return nextHoliday;

  const firstNextYear = new Date(year + 1, holidays[0].month, holidays[0].day, 9, 0, 0);
  return { name: holidays[0].name, date: firstNextYear };
}

function getWorkdayGap(start, end) {
  let count = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const target = new Date(end);
  target.setHours(0, 0, 0, 0);
  while (cursor < target) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function getNextSaturday(now = new Date()) {
  const result = new Date(now);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  const gap = (6 - day + 7) % 7 || 7;
  result.setDate(result.getDate() + gap);
  return result;
}

function getCountdowns() {
  const now = new Date();
  const [startHour, startMinute] = state.startTime.split(":").map(Number);
  const [endHour, endMinute] = state.endTime.split(":").map(Number);
  const start = new Date(now);
  start.setHours(startHour || 9, startMinute || 30, 0, 0);
  const end = new Date(now);
  end.setHours(endHour || 18, endMinute || 30, 0, 0);
  const streakMs = Math.max(0, now - start);
  const offWorkMs = Math.max(0, end - now);
  const saturday = getNextSaturday(now);
  const holiday = getHolidayAnchor();
  const saturdayNatural = Math.ceil((saturday - now) / 86400000);
  const holidayNatural = Math.ceil((holiday.date - now) / 86400000);
  return {
    streakMs,
    offWorkMs,
    saturdayNatural: Math.max(0, saturdayNatural),
    saturdayWorkday: Math.max(0, getWorkdayGap(now, saturday)),
    holiday,
    holidayNatural: Math.max(0, holidayNatural),
    holidayWorkday: Math.max(0, getWorkdayGap(now, holiday.date))
  };
}

function formatDuration(ms, withSeconds = true) {
  const safeMs = Math.max(0, Number(ms) || 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分`);
  if (withSeconds && (seconds > 0 || parts.length === 0)) parts.push(`${seconds}秒`);
  
  return parts.join("");
}

function getPetStage() {
  return petStages.reduce((current, stage) => (state.pet.rage >= stage.threshold ? stage : current), petStages[0]);
}

function getNextPetStage() {
  return petStages.find((stage) => stage.threshold > state.pet.rage) || null;
}

function getPetProgress() {
  const current = getPetStage();
  const next = getNextPetStage();
  if (!next) {
    return { percent: 100, label: "满阶守护中" };
  }
  const gained = state.pet.rage - current.threshold;
  const needed = next.threshold - current.threshold;
  return {
    percent: Math.min(100, Math.round((gained / needed) * 100)),
    label: `${Math.max(0, next.threshold - state.pet.rage)} 怨气后进化`
  };
}

function getPetStats() {
  const stage = getPetStage();
  const cultivation = Math.max(0, Number(state.pet.cultivation) || 0);
  const rageTier = Math.floor((Number(state.pet.rage) || 0) / 80);
  const affectionTier = Math.floor((Number(state.pet.affection) || 0) / 25);
  const attackBonus = Math.max(0, Number(state.pet.attackBonus) || 0);
  const defenseBonus = Math.max(0, Number(state.pet.defenseBonus) || 0);
  const manaBonus = Math.max(0, Number(state.pet.manaBonus) || 0);
  const critBonus = Math.max(0, Number(state.pet.critBonus) || 0);
  const attack = 8 + stage.level * 4 + rageTier * 2 + attackBonus + Math.floor(cultivation * 1.2);
  const defense = 2 + stage.level * 2 + affectionTier + defenseBonus + Math.floor(cultivation / 3);
  const maxMana = 34 + stage.level * 16 + Math.floor((Number(state.pet.rage) || 0) / 10) + manaBonus + cultivation * 4;
  const crit = Math.min(38, 4 + stage.level * 2 + critBonus + Math.floor(cultivation / 2));
  const spellCost = Math.max(24, 34 - stage.level * 2);
  const spellPower = 10 + stage.level * 5 + Math.floor(maxMana / 18) + Math.floor(attack / 3);
  const combatPower = attack * 4 + defense * 3 + Math.floor(maxMana / 3) + crit * 2;
  return { stage, cultivation, attack, defense, maxMana, crit, spellCost, spellPower, combatPower };
}

function clampPetMana() {
  const stats = getPetStats();
  state.pet.mana = Math.min(stats.maxMana, Math.max(0, Number(state.pet.mana) || 0));
  return state.pet.mana;
}

function restorePetMana(amount) {
  const stats = getPetStats();
  const current = Math.max(0, Number(state.pet.mana) || 0);
  state.pet.mana = typeof amount === "number" ? Math.min(stats.maxMana, current + amount) : stats.maxMana;
  return state.pet.mana;
}

function getPetTrainingCost() {
  const stats = getPetStats();
  return 52 + stats.cultivation * 28 + stats.stage.level * 16;
}

function getNextTrainingReward() {
  const next = (Math.max(0, Number(state.pet.cultivation) || 0) + 1) % 4;
  if (next === 1) return { label: "攻击 +2", apply: () => { state.pet.attackBonus += 2; } };
  if (next === 2) return { label: "法力上限 +10", apply: () => { state.pet.manaBonus += 10; } };
  if (next === 3) return { label: "防御 +1", apply: () => { state.pet.defenseBonus += 1; } };
  return { label: "暴击 +2%", apply: () => { state.pet.critBonus += 2; } };
}

function setPetEnergyBar(el, value, max) {
  if (!el) return;
  const percent = Math.max(0, Math.min(100, Math.round((Number(value) || 0) / Math.max(1, Number(max) || 1) * 100)));
  el.style.width = `${percent}%`;
}

function formatPetBoost(boost = {}) {
  const parts = [];
  if (boost.rage) parts.push(`怨气滋养 +${boost.rage}`);
  if (boost.light) parts.push(`灵力 +${boost.light}`);
  if (boost.satiety) parts.push(`饱食 +${boost.satiety}`);
  if (boost.affection) parts.push(`亲密 +${boost.affection}`);
  if (boost.attack) parts.push(`攻击 +${boost.attack}`);
  if (boost.defense) parts.push(`防御 +${boost.defense}`);
  if (boost.manaCap) parts.push(`法力上限 +${boost.manaCap}`);
  if (boost.mana) parts.push(`法力 +${boost.mana}`);
  if (boost.crit) parts.push(`暴击 +${boost.crit}%`);
  return parts.join("，");
}

function canUseBlackoutSkill() {
  return state.pet.rage >= 200 || getDailyRageValue() >= 200;
}

function getSummonButtonLabel() {
  if (VIEW_MODE === "pet") return "已召唤";
  return state.pet.summoned ? "收回软团" : "召唤软团";
}

function createPetAvatarMarkup(stage, variant = "main") {
  const stageId = stage?.id || "mist";
  return `
    <span class="pet-creature pet-creature-${variant} stage-${stageId}" aria-hidden="true">
      <span class="pet-creature-aura"></span>
      <span class="pet-creature-halo"></span>
      <span class="pet-creature-wisp wisp-one"></span>
      <span class="pet-creature-wisp wisp-two"></span>
      <span class="pet-creature-wisp wisp-three"></span>
      <span class="pet-creature-tail"></span>
      <span class="pet-creature-horn horn-left"></span>
      <span class="pet-creature-horn horn-right"></span>
      <span class="pet-creature-body">
        <span class="pet-creature-mark"></span>
        <span class="pet-creature-eye eye-left"></span>
        <span class="pet-creature-eye eye-right"></span>
        <span class="pet-creature-eye eye-third"></span>
        <span class="pet-creature-cheek cheek-left"></span>
        <span class="pet-creature-cheek cheek-right"></span>
        <span class="pet-creature-mouth"></span>
        <span class="pet-creature-fang fang-left"></span>
        <span class="pet-creature-fang fang-right"></span>
      </span>
      <span class="pet-creature-paw paw-left"></span>
      <span class="pet-creature-paw paw-right"></span>
    </span>
  `;
}

function updatePetAvatarMarkup(el, stage, variant = "main") {
  if (!el || !stage) return;
  if (el.dataset.petStage !== stage.id || el.dataset.petVariant !== variant || !el.querySelector(".pet-creature")) {
    el.innerHTML = createPetAvatarMarkup(stage, variant);
    el.dataset.petStage = stage.id;
    el.dataset.petVariant = variant;
  }
  el.setAttribute("aria-label", `${stage.name} Lv.${stage.level}`);
}

function renderPetAvatar(el, stage, baseClass, variant = "main") {
  if (!el || !stage) return;
  el.className = `${baseClass} stage-${stage.id}`;
  updatePetAvatarMarkup(el, stage, variant);
}

function isPartUnlocked(part) {
  return state.unlockedParts.includes(part.id);
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function addTransaction(title, amount, note = "", category = "expense") {
  const now = new Date();
  state.transactions.unshift({
    title,
    amount,
    note,
    time: now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    category,
    date: now.toISOString().slice(0, 10)
  });
  state.transactions = state.transactions.slice(0, 200);
}

function addPetLog(title, detail) {
  const now = new Date();
  state.petLog.unshift({
    title,
    detail,
    time: now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  });
  state.petLog = state.petLog.slice(0, 30);
}

function getMonthlyStats() {
  const currentMonth = getCurrentMonthKey();
  let income = 0;
  let expense = 0;
  state.transactions.forEach((t) => {
    if (t.date && t.date.startsWith(currentMonth)) {
      if (t.amount > 0) {
        income += t.amount;
      } else {
        expense += Math.abs(t.amount);
      }
    }
  });
  return { income, expense, net: income - expense };
}

function getFilteredTransactions() {
  if (state.transactionFilter === "all") return state.transactions;
  return state.transactions.filter((item) => item.category === state.transactionFilter);
}

function getTransactionFilterLabel() {
  return state.transactionFilter === "all"
    ? "全部记录"
    : transactionCategories[state.transactionFilter]?.label || "全部记录";
}

function getPetAmbientPeriod(now = new Date()) {
  const hour = now.getHours();
  if (hour < 11) return "morning";
  if (hour < 15) return "noon";
  if (hour < 20) return "evening";
  return "late";
}

function setPetLine(line, logTitle = "软团发话", shouldPersist = true) {
  state.pet.lastLine = line;
  if (logTitle) {
    addPetLog(logTitle, line);
  }
  if (shouldPersist) {
    persistSettings();
  }
  renderSummary();
}

function triggerPetAmbientLine(force = false) {
  const period = getPetAmbientPeriod();
  if (!force && state.pet.lastAmbientPeriod === period) return;
  state.pet.lastAmbientPeriod = period;
  const line = pickRandom(petAmbientLines[period]);
  state.pet.lastLine = line;
  addPetLog("软团巡逻", line);
  persistSettings();
  renderSummary();
}

function maybeTriggerPetBusinessHint(reason = "") {
  const countdowns = getCountdowns();
  const remainingCost = getWishRemainingCost();
  let bucket = "rich";
  if (countdowns.offWorkMs > 0 && countdowns.offWorkMs <= 45 * 60 * 1000) {
    bucket = "offWorkSoon";
  } else if (remainingCost > 0 && remainingCost <= Math.max(800, state.price * 0.12)) {
    bucket = "wishNear";
  } else if (getWalletCoins() <= Math.max(300, getDailyCoins() * 0.5)) {
    bucket = "broke";
  }
  if (!reason && state.pet.lastBusinessHint === bucket) return;
  state.pet.lastBusinessHint = bucket;
  const line = pickRandom(petBusinessLines[bucket]);
  state.pet.lastLine = line;
  addPetLog("软团看账本", line);
  persistSettings();
  renderSummary();
}

function readStoredNumber(key, fallback = 0) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStoredNumber(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch (error) {
    console.warn("Failed to write local timestamp", error);
  }
}

function markPetInteraction(reason = "") {
  const now = Date.now();
  writeStoredNumber(PET_LAST_INTERACTION_KEY, now);
  if (reason) {
    state.pet.lastBusinessHint = "";
  }
}

function shouldRunPetFocusReminder() {
  return VIEW_MODE === "widget" || VIEW_MODE === "pet" || !isDesktopApiAvailable();
}

function showPetCareToast(copy) {
  const message = copy || pickRandom(petFocusReminderCopies);
  if (VIEW_MODE === "pet" && els.summonedPetBubble) {
    showPetBubble(`<strong>${message.title}</strong><span>${message.body}</span>`);
    return;
  }

  let toast = document.getElementById("petCareToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "petCareToast";
    toast.className = "pet-care-toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <strong>${message.title}</strong>
    <p>${message.body}</p>
    <button type="button">我去活动一下</button>
  `;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("active"));
  toast.querySelector("button")?.addEventListener("click", () => {
    markPetInteraction("focus-reminder-dismissed");
    toast.classList.remove("active");
    setTimeout(() => {
      toast.hidden = true;
    }, 220);
  }, { once: true });
  clearTimeout(runtime.petCareToastTimer);
  runtime.petCareToastTimer = setTimeout(() => {
    toast.classList.remove("active");
    setTimeout(() => {
      toast.hidden = true;
    }, 220);
  }, 14000);
}

function maybeShowPetFocusReminder(force = false) {
  if (!force && !shouldRunPetFocusReminder()) return;
  const now = Date.now();
  const lastInteraction = Math.max(readStoredNumber(PET_LAST_INTERACTION_KEY, runtime.appStartedAt), runtime.appStartedAt);
  const lastReminder = readStoredNumber(PET_FOCUS_REMINDER_KEY, 0);
  if (!force && now - runtime.appStartedAt < PET_IDLE_REMINDER_MS) return;
  if (!force && now - lastInteraction < PET_IDLE_REMINDER_MS) return;
  if (!force && lastReminder && now - lastReminder < PET_IDLE_REMINDER_SNOOZE_MS) return;

  const copy = pickRandom(petFocusReminderCopies);
  writeStoredNumber(PET_FOCUS_REMINDER_KEY, now);
  state.pet.lastLine = copy.body;
  addPetLog("久坐关怀提醒", `${copy.title}：${copy.body}`);
  persistSettings();
  renderPet();
  renderWidgetCards();
  showPetCareToast(copy);
}

function startPetFocusReminderLoop() {
  if (!shouldRunPetFocusReminder()) return;
  clearInterval(runtime.petFocusReminderTimer);
  runtime.petFocusReminderTimer = setInterval(() => maybeShowPetFocusReminder(false), 60000);
}

function showRageSurgeToast(milestone) {
  let toast = document.getElementById("rageSurgeToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "rageSurgeToast";
    toast.className = "rage-surge-toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <span>DAILY RAGE ${milestone.threshold}</span>
    <strong>${milestone.title}</strong>
    <p>${milestone.line}</p>
  `;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("active", `surge-${milestone.action}`));
  clearTimeout(runtime.rageSurgeTimer);
  runtime.rageSurgeTimer = setTimeout(() => {
    toast.className = "rage-surge-toast";
    toast.hidden = true;
  }, ["blackout", "nuke", "awaken"].includes(milestone.action) ? 5200 : milestone.threshold >= 260 ? 4200 : 3600);
}

function triggerPetRicochetEffect(options = {}) {
  if (!state.pet.summoned) {
    state.pet.summoned = true;
    const api = getDesktopApi();
    if (VIEW_MODE !== "pet" && api?.toggle_pet) {
      api.toggle_pet(true);
    }
  }

  const api = getDesktopApi();
  if (!options.localOnly && api?.pet_ricochet) {
    api.pet_ricochet();
  }

  renderSummonedPet();
  const targets = [els.summonedPet, els.petAvatar, els.widgetPetAvatar, els.summonedPetAvatar].filter(Boolean);
  requestAnimationFrame(() => {
    targets.forEach((target) => {
      target.classList.remove("rage-ricochet");
      void target.offsetWidth;
      target.classList.add("rage-ricochet");
    });
    els.body.classList.add("rage-ricochet-body");
  });

  const trailInterval = setInterval(() => {
    if (!els.summonedPet || els.summonedPet.hidden) return;
    const rect = els.summonedPet.getBoundingClientRect();
    const particle = document.createElement("div");
    particle.className = "ricochet-trail-particle";
    particle.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 30) + "px";
    particle.style.top = (rect.top + rect.height / 2 + (Math.random() - 0.5) * 30) + "px";
    particle.style.width = (8 + Math.random() * 10) + "px";
    particle.style.height = particle.style.width;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 700);
  }, 80);

  clearTimeout(runtime.petRicochetTimer);
  runtime.petRicochetTimer = setTimeout(() => {
    clearInterval(trailInterval);
    targets.forEach((target) => target.classList.remove("rage-ricochet"));
    els.body.classList.remove("rage-ricochet-body");
  }, 2900);
}

function triggerRageOverdriveEffect() {
  els.body.classList.add("rage-overdrive");

  const dataChars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ";
  const streamInterval = setInterval(() => {
    const stream = document.createElement("div");
    stream.className = "overdrive-data-stream";
    stream.style.left = (2 + Math.random() * 96) + "vw";
    stream.style.top = "-20px";
    let text = "";
    const len = 8 + Math.floor(Math.random() * 20);
    for (let i = 0; i < len; i++) {
      text += dataChars[Math.floor(Math.random() * dataChars.length)];
    }
    stream.textContent = text;
    document.body.appendChild(stream);
    setTimeout(() => stream.remove(), 2100);
  }, 150);

  setTimeout(() => {
    clearInterval(streamInterval);
    els.body.classList.remove("rage-overdrive");
  }, 3300);
}

function triggerRageRippleEffect() {
  const targets = [els.summonedPet, els.petAvatar, els.widgetPetAvatar, els.summonedPetAvatar].filter(Boolean);
  requestAnimationFrame(() => {
    targets.forEach((target) => {
      target.classList.remove("rage-ripple");
      void target.offsetWidth;
      target.classList.add("rage-ripple");
    });
    els.body.classList.add("rage-ripple-body");
  });

  const petEl = els.summonedPetAvatar || els.petAvatar || els.widgetPetAvatar;
  if (petEl) {
    const rect = petEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const ring = document.createElement("div");
        ring.className = "ripple-ring";
        ring.style.left = cx + "px";
        ring.style.top = cy + "px";
        document.body.appendChild(ring);
        setTimeout(() => ring.remove(), 1900);
      }, i * 300);
    }
  }

  clearTimeout(runtime.petRippleTimer);
  runtime.petRippleTimer = setTimeout(() => {
    targets.forEach((target) => target.classList.remove("rage-ripple"));
    els.body.classList.remove("rage-ripple-body");
  }, 2300);
}

function triggerRageStormEffect() {
  els.body.classList.add("rage-storm");
  const targets = [els.summonedPet, els.petAvatar, els.widgetPetAvatar, els.summonedPetAvatar].filter(Boolean);
  requestAnimationFrame(() => {
    targets.forEach((target) => {
      target.classList.remove("rage-storm-pet");
      void target.offsetWidth;
      target.classList.add("rage-storm-pet");
    });
  });

  const lightningInterval = setInterval(() => {
    const bolt = document.createElement("div");
    bolt.className = "storm-lightning";
    bolt.style.left = (5 + Math.random() * 90) + "vw";
    bolt.style.top = "0";
    bolt.style.width = (2 + Math.random() * 4) + "px";
    bolt.style.height = (30 + Math.random() * 60) + "vh";
    bolt.style.transform = `rotate(${(Math.random() - 0.5) * 20}deg)`;
    document.body.appendChild(bolt);
    setTimeout(() => bolt.remove(), 200);
  }, 400);

  const windInterval = setInterval(() => {
    const streak = document.createElement("div");
    streak.className = "storm-wind-streak";
    streak.style.top = (10 + Math.random() * 80) + "vh";
    streak.style.width = (100 + Math.random() * 300) + "px";
    document.body.appendChild(streak);
    setTimeout(() => streak.remove(), 1300);
  }, 300);

  const api = getDesktopApi();
  if (api?.pet_storm) {
    api.pet_storm();
  }
  clearTimeout(runtime.rageStormTimer);
  runtime.rageStormTimer = setTimeout(() => {
    clearInterval(lightningInterval);
    clearInterval(windInterval);
    els.body.classList.remove("rage-storm");
    targets.forEach((target) => target.classList.remove("rage-storm-pet"));
  }, 3900);
}

function triggerRageCrackEffect() {
  els.body.classList.add("rage-crack");
  const targets = [els.summonedPet, els.petAvatar, els.widgetPetAvatar, els.summonedPetAvatar].filter(Boolean);
  requestAnimationFrame(() => {
    targets.forEach((target) => {
      target.classList.remove("rage-crack-pet");
      void target.offsetWidth;
      target.classList.add("rage-crack-pet");
    });
  });

  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const shard = document.createElement("div");
      shard.className = "glass-shard";
      shard.style.left = (10 + Math.random() * 80) + "vw";
      shard.style.top = (10 + Math.random() * 80) + "vh";
      shard.style.width = (8 + Math.random() * 20) + "px";
      shard.style.height = (12 + Math.random() * 30) + "px";
      shard.style.setProperty("--shard-dx", ((Math.random() - 0.5) * 400) + "px");
      shard.style.setProperty("--shard-dy", ((Math.random() - 0.5) * 400 - 100) + "px");
      shard.style.setProperty("--shard-rot", (Math.random() * 360) + "deg");
      document.body.appendChild(shard);
      setTimeout(() => shard.remove(), 2600);
    }, i * 80);
  }

  clearTimeout(runtime.rageCrackTimer);
  runtime.rageCrackTimer = setTimeout(() => {
    els.body.classList.remove("rage-crack");
    targets.forEach((target) => target.classList.remove("rage-crack-pet"));
  }, 4300);
}

function triggerRageAwakenEffect() {
  els.body.classList.add("rage-awaken");
  const targets = [els.summonedPet, els.petAvatar, els.widgetPetAvatar, els.summonedPetAvatar].filter(Boolean);
  requestAnimationFrame(() => {
    targets.forEach((target) => {
      target.classList.remove("rage-awaken-pet");
      void target.offsetWidth;
      target.classList.add("rage-awaken-pet");
    });
  });

  const petEl = els.summonedPetAvatar || els.petAvatar || els.widgetPetAvatar;
  if (petEl) {
    const rect = petEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ["#c89bff", "#ff765d", "#65d8d1", "#dff36c", "#ffffff"];
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const particle = document.createElement("div");
        particle.className = "awaken-particle";
        particle.style.left = cx + "px";
        particle.style.top = cy + "px";
        particle.style.width = (4 + Math.random() * 10) + "px";
        particle.style.height = particle.style.width;
        particle.style.color = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 300;
        particle.style.setProperty("--ap-dx", Math.cos(angle) * dist + "px");
        particle.style.setProperty("--ap-dy", Math.sin(angle) * dist + "px");
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 2600);
      }, i * 40);
    }
  }

  clearTimeout(runtime.rageAwakenTimer);
  runtime.rageAwakenTimer = setTimeout(() => {
    els.body.classList.remove("rage-awaken");
    targets.forEach((target) => target.classList.remove("rage-awaken-pet"));
  }, 4900);
}

function triggerRageNukeEffect() {
  els.body.classList.add("rage-nuke");
  const targets = [els.summonedPet, els.petAvatar, els.widgetPetAvatar, els.summonedPetAvatar].filter(Boolean);
  requestAnimationFrame(() => {
    targets.forEach((target) => {
      target.classList.remove("rage-nuke-pet");
      void target.offsetWidth;
      target.classList.add("rage-nuke-pet");
    });
  });

  els.body.classList.add("rage-nuke-shake");
  setTimeout(() => els.body.classList.remove("rage-nuke-shake"), 700);

  const petEl = els.summonedPetAvatar || els.petAvatar || els.widgetPetAvatar;
  if (petEl) {
    const rect = petEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let w = 0; w < 3; w++) {
      setTimeout(() => {
        const wave = document.createElement("div");
        wave.className = "nuke-shockwave";
        wave.style.left = cx + "px";
        wave.style.top = cy + "px";
        document.body.appendChild(wave);
        setTimeout(() => wave.remove(), 2100);
      }, w * 300);
    }

    for (let i = 0; i < 40; i++) {
      setTimeout(() => {
        const spark = document.createElement("div");
        spark.className = "nuke-spark";
        spark.style.left = cx + "px";
        spark.style.top = cy + "px";
        const angle = Math.random() * Math.PI * 2;
        const dist = 150 + Math.random() * 400;
        spark.style.setProperty("--ns-dx", Math.cos(angle) * dist + "px");
        spark.style.setProperty("--ns-dy", Math.sin(angle) * dist + "px");
        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 2100);
      }, i * 30);
    }
  }

  const api = getDesktopApi();
  if (api?.pet_nuke) {
    api.pet_nuke();
  }
  clearTimeout(runtime.rageNukeTimer);
  runtime.rageNukeTimer = setTimeout(() => {
    els.body.classList.remove("rage-nuke");
    targets.forEach((target) => target.classList.remove("rage-nuke-pet"));
  }, 5500);
}

function triggerDailyRageMilestone(milestone, source) {
  state.pet.lastLine = milestone.line;
  addPetLog(milestone.title, `${source} 后，今日怨气累计 ${formatRage(getDailyRageValue())}。${milestone.line}`);
  showRageSurgeToast(milestone);

  if (milestone.action === "ripple") {
    triggerRageRippleEffect();
    return;
  }
  if (milestone.action === "ricochet") {
    triggerPetRicochetEffect();
    return;
  }
  if (milestone.action === "storm") {
    triggerRageStormEffect();
    return;
  }
  if (milestone.action === "blackout") {
    triggerBlackoutSkill({ automatic: true, bypassUnlock: true, duration: 5200 });
    return;
  }
  if (milestone.action === "crack") {
    triggerRageCrackEffect();
    return;
  }
  if (milestone.action === "overdrive") {
    triggerRageOverdriveEffect();
    return;
  }
  if (milestone.action === "awaken") {
    triggerRageAwakenEffect();
    return;
  }
  if (milestone.action === "nuke") {
    triggerRageNukeEffect();
  }
}

function maybeTriggerDailyRageMilestones(source = "怨气增长") {
  const bucket = ensureDailyRageBucket();
  dailyRageMilestones.forEach((milestone) => {
    if (bucket.value < milestone.threshold || bucket.triggered.includes(milestone.id)) return;
    bucket.triggered.push(milestone.id);
    triggerDailyRageMilestone(milestone, source);
  });
}

function executePetCommand(payload = {}) {
  const command = typeof payload === "string" ? { action: payload } : payload;
  const action = command?.action;
  if (!action) return;
  markPetInteraction(`pet-command-${action}`);
  if (action === "blackout") {
    triggerBlackoutSkill({
      automatic: Boolean(command.automatic),
      bypassUnlock: Boolean(command.bypassUnlock),
      duration: Number(command.duration) || 4200
    });
    return;
  }
  if (action === "duel") {
    setActiveScreen("pet");
    setModuleTab("pet", "status");
    startPetDuel();
    return;
  }
  if (action === "online") {
    setActiveScreen("pet");
    setModuleTab("pet", "status");
    previewOnlineBattle();
    return;
  }
  if (action === "ricochet") {
    triggerPetRicochetEffect({ localOnly: true });
    return;
  }
  if (action === "ripple") {
    triggerRageRippleEffect();
    return;
  }
  if (action === "storm") {
    triggerRageStormEffect();
    return;
  }
  if (action === "crack") {
    triggerRageCrackEffect();
    return;
  }
  if (action === "overdrive") {
    triggerRageOverdriveEffect();
    return;
  }
  if (action === "awaken") {
    triggerRageAwakenEffect();
    return;
  }
  if (action === "nuke") {
    triggerRageNukeEffect();
  }
}

function getPetHeatState() {
  const heat = Math.max(0, Number(state.pet.touchHeat) || 0);
  if (heat >= 78) return { level: "overload", label: "怨气过载" };
  if (heat >= 52) return { level: "annoyed", label: "快炸毛了" };
  if (heat >= 26) return { level: "warm", label: "互动升温" };
  return { level: "calm", label: state.pet.touchMood || "乖巧待机" };
}

function triggerPetTouchFeedback(part, event, moodClass, rageGain, isOverload) {
  const profile = petTouchProfiles[part] || petTouchProfiles.head;
  const touchClass = `touch-${profile.effect}`;
  const moodClassName = `mood-${moodClass}`;
  const targets = [els.petAvatar, els.widgetPetAvatar, els.summonedPetAvatar].filter(Boolean);
  targets.forEach((target) => {
    target.classList.add("touching", touchClass, moodClassName);
    if (isOverload) target.classList.add("touch-overload");
  });
  window.clearTimeout(runtime.petTouchFxTimer);
  runtime.petTouchFxTimer = window.setTimeout(() => {
    targets.forEach((target) => {
      target.classList.remove("touching", touchClass, moodClassName, "touch-overload");
    });
  }, isOverload ? 900 : 620);

  const source = event?.currentTarget || event?.target || els.summonedPetAvatar || els.petAvatar;
  if (source?.classList) {
    source.classList.add("active");
    window.setTimeout(() => source.classList.remove("active"), 420);
  }
  const rect = source?.getBoundingClientRect?.();
  const cx = event?.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth - 120);
  const cy = event?.clientY || (rect ? rect.top + rect.height / 2 : window.innerHeight - 120);
  const burst = document.createElement("span");
  burst.className = `pet-touch-fx fx-${profile.effect} ${isOverload ? "overload" : ""}`;
  burst.style.left = `${cx}px`;
  burst.style.top = `${cy}px`;
  burst.innerHTML = `<b>${profile.glyph}</b><i>怨 +${rageGain}</i>`;
  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 980);
}

function handlePetTouch(part, event) {
  const lines = petTouchResponses[part];
  const profile = petTouchProfiles[part];
  if (!lines || !profile) return;
  markPetInteraction(`touch-${part}`);
  const now = Date.now();
  const isRapid = now - runtime.petLastTouchAt < 1500;
  runtime.petTouchStreak = isRapid ? runtime.petTouchStreak + 1 : 1;
  runtime.petLastTouchAt = now;

  const baseHeat = isRapid ? state.pet.touchHeat : Math.max(0, state.pet.touchHeat - 14);
  const heatGain = 8 + Math.max(0, profile.rage - 1) + Math.min(18, runtime.petTouchStreak * 2);
  state.pet.touchHeat = Math.min(100, baseHeat + heatGain);
  const isAnnoyed = runtime.petTouchStreak >= 4 || state.pet.touchHeat >= 52;
  const isOverload = runtime.petTouchStreak >= 8 || state.pet.touchHeat >= 78;
  const rageGain = profile.rage + (isAnnoyed ? 1 : 0) + (isOverload ? 2 : 0);
  const nourishGain = profile.nourish + (isOverload ? 1 : isAnnoyed ? 1 : 0);
  const affectionDelta = profile.affection - (isOverload ? 4 : isAnnoyed ? 1 : 0);

  state.pet.touchCount += 1;
  addRageCoins(rageGain, profile.logTitle);
  state.pet.rage += nourishGain;
  state.pet.light += profile.light || 0;
  state.pet.affection = Math.min(100, Math.max(0, state.pet.affection + affectionDelta));
  state.pet.satiety = Math.min(100, Math.max(0, state.pet.satiety + profile.satiety));
  state.pet.touchMood = isOverload ? "怨气过载" : isAnnoyed ? "不耐烦" : profile.mood;

  const line = isOverload
    ? pickRandom(petTouchOverloadLines)
    : isAnnoyed
      ? `${pickRandom(lines)} 连点太密，我开始记仇了。`
      : pickRandom(lines);
  state.pet.lastLine = line;
  addPetLog(profile.logTitle, `${profile.label}：${line} 怨气 +${rageGain}，滋养 +${nourishGain}，触摸热度 ${Math.round(state.pet.touchHeat)}。`);
  persistSettings();
  renderSummary();
  triggerPetTouchFeedback(part, event, isOverload ? "furious" : isAnnoyed ? "annoyed" : profile.moodClass, rageGain, isOverload);
}

function renderWallet() {
  const balance = getWalletCoins();
  const dailyCoins = getDailyCoins();
  const stats = getMonthlyStats();
  const filteredTransactions = getFilteredTransactions();
  const totalFilteredAmount = filteredTransactions.reduce((sum, item) => sum + item.amount, 0);
  const incomeRatio = stats.income + stats.expense === 0 ? 50 : Math.round((stats.income / (stats.income + stats.expense)) * 100);
  const expenseRatio = 100 - incomeRatio;

  els.todayCoins.textContent = formatMoney(dailyCoins);
  els.topWalletBalance.textContent = formatMoney(balance);
  els.topRageBalance.textContent = `${Math.round(getRageCoins()).toLocaleString("zh-CN")}`;
  els.topDailyRage.textContent = `${Math.round(getDailyRageValue()).toLocaleString("zh-CN")}`;
  els.unlockedCount.textContent = `${getUnlockedPartCount()} / ${parts.length}`;
  els.dailyUnlock.textContent = formatMoney(dailyCoins);
  els.coinBalance.textContent = formatMoney(balance);
  els.widgetBalance.textContent = formatMoney(balance);
  els.claimWalletButton.disabled = true;
  els.claimWalletButton.textContent = "动态增长中";
  els.walletSubline.textContent = `账户按月薪 ${formatMoney(state.salary)} 实时计算，每秒自动到账。`;

  if (els.monthlyIncome) els.monthlyIncome.textContent = formatMoney(stats.income);
  if (els.monthlyExpense) els.monthlyExpense.textContent = formatMoney(stats.expense);
  if (els.monthlyNet) {
    els.monthlyNet.textContent = formatMoney(stats.net);
    els.monthlyNet.className = stats.net >= 0 ? "plus" : "minus";
  }
  if (els.incomeBar) els.incomeBar.style.width = `${incomeRatio}%`;
  if (els.expenseBar) els.expenseBar.style.width = `${expenseRatio}%`;
  if (els.transactionCount) els.transactionCount.textContent = `${filteredTransactions.length} 笔 / ${formatMoney(totalFilteredAmount)}`;
  if (els.transactionFilterLabel) els.transactionFilterLabel.textContent = getTransactionFilterLabel();

  if (els.walletTransactionList) {
    const pagedTransactions = getPagedItems(filteredTransactions, "walletTransactions");
    els.walletTransactionList.innerHTML = filteredTransactions.length
      ? `
          <div class="transaction-scroll-area">
            ${pagedTransactions.items.map((item) => {
              const meta = transactionCategories[item.category] || transactionCategories.expense;
              return `
                <article class="transaction-item">
                  <div class="transaction-info">
                    <div class="transaction-title-row">
                      <strong>${escapeHtml(item.title)}</strong>
                      <span class="transaction-category">${meta.icon} ${meta.label}</span>
                    </div>
                    <span class="transaction-meta">${escapeHtml(item.note || "无备注")} · ${escapeHtml(item.time || "刚刚")}</span>
                  </div>
                  <strong class="${item.amount >= 0 ? "plus" : "minus"}">${item.amount >= 0 ? "+" : "-"}${formatMoney(Math.abs(item.amount))}</strong>
                </article>
              `;
            }).join("")}
          </div>
          ${createPaginationMarkup("walletTransactions", pagedTransactions.currentPage, pagedTransactions.totalPages, pagedTransactions.totalItems)}
        `
      : `<p class="inventory-empty">当前筛选下还没有记录。</p>`;
    bindPagination(els.walletTransactionList, renderWallet);
  }
}

function renderParts() {
  if (!els.partShop) return;
  const unlocked = getUnlockedPartCount();
  const progress = Math.round((unlocked / parts.length) * 100);
  els.wishProgressText.textContent = `${unlocked} / ${parts.length} 已点亮`;
  els.wishlistProgressBar.style.width = `${progress}%`;
  els.widgetWishName.textContent = state.wish;
  els.widgetWishProgress.textContent = `${unlocked} / ${parts.length} 已点亮`;
  els.widgetWishBar.style.width = `${progress}%`;
  const nextPart = getNextLockedPart();
  if (els.partNarrative) {
    els.partNarrative.textContent = nextPart
      ? `${nextPart.narrative} 还差 ${formatMoney(Math.max(0, getPartPrice(nextPart) - getWalletCoins()))}。`
      : `${state.wish} 已全部点亮，可以开始考虑下一件真正想要的东西了。`;
  }
  const pagedParts = getPagedItems(parts, "partShop");
  els.partShop.innerHTML = `
    <div class="shop-scroll-area">
      ${pagedParts.items.map((part) => {
        const unlockedPart = isPartUnlocked(part);
        const price = getPartPrice(part);
        const shortfall = Math.max(0, price - getWalletCoins());
        return `
          <article class="shop-item ${unlockedPart ? "done" : getWalletCoins() >= price ? "affordable" : ""}">
            <div>
              <strong>${part.name}</strong>
              <p>${unlockedPart ? "这一块已经点亮，可以继续往下一块攒。" : shortfall > 0 ? `还差 ${formatMoney(shortfall)} 才能拿下。` : "额度够了，随时可以点亮。"}</p>
            </div>
            <div class="shop-meta">
              <span>${unlockedPart ? "已点亮" : formatMoney(price)}</span>
              <button class="mini-button" data-buy-part="${part.id}" type="button" ${unlockedPart ? "disabled" : ""}>${unlockedPart ? "已完成" : "点亮"}</button>
            </div>
          </article>
        `;
      }).join("")}
    </div>
    ${createPaginationMarkup("partShop", pagedParts.currentPage, pagedParts.totalPages, pagedParts.totalItems)}
  `;
  bindPagination(els.partShop, renderParts);
}

function renderMall() {
  const balance = getWalletCoins();
  const rageBalance = getRageCoins();
  document.querySelectorAll(".mall-category-filters .filter-chip").forEach((button) => {
    button.classList.toggle("active", button.dataset.mallFilter === state.mallFilter);
  });
  if (els.mallBalance) {
    els.mallBalance.textContent = formatMoney(balance);
    const affordableCount = mallItems.filter((item) => getResourceBalance(getMallItemCurrency(item)) >= item.price).length;
    els.mallBalanceSubline.textContent = affordableCount
      ? `当前可购买 ${affordableCount} 件商品；薪资金币 ${formatMoney(balance)}，怨气 ${formatRage(rageBalance)}，灵力 ${formatLight(state.pet.light)}。`
      : "资源不足，先去领薪资金币或炼一点糟心事。";
  }

  const filteredMall = state.mallFilter === "all"
    ? mallItems
    : mallItems.filter((item) => item.category === state.mallFilter);

  if (els.mallListEnhanced) {
    const pagedMall = getPagedItems(filteredMall, "mallCatalog");
    els.mallListEnhanced.innerHTML = `
      <div class="mall-scroll-area">
        ${pagedMall.items.map((item) => {
          const currency = getMallItemCurrency(item);
          const canBuy = getResourceBalance(currency) >= item.price;
          const categoryLabel = item.category === "pet" ? "软团供品" : item.category === "light" ? "灵力净化" : item.category;
          return `
            <article class="mall-card-enhanced ${canBuy ? "affordable" : "locked"} ${item.petBoost ? (item.category === "light" ? "light-supply" : "pet-supply") : ""}">
              <div class="mall-card-icon">${item.icon}</div>
              <div class="mall-card-body">
                <div class="mall-card-tags">
                  <span class="mall-tag">${item.tag}</span>
                  <span class="mall-category">${categoryLabel}</span>
                </div>
                <strong>${item.name}</strong>
                <p>${item.description}</p>
                <div class="mall-card-effect"><span>效果：</span>${item.effect}</div>
              </div>
              <div class="mall-action-enhanced">
                <em>${formatResource(item.price, currency)}</em>
                <button class="mini-button" data-buy-mall="${item.id}" type="button" ${canBuy ? "" : "disabled"}>${canBuy ? "收入背包" : "额度不足"}</button>
              </div>
            </article>
          `;
        }).join("")}
      </div>
      ${createPaginationMarkup("mallCatalog", pagedMall.currentPage, pagedMall.totalPages, pagedMall.totalItems)}
    `;
    bindPagination(els.mallListEnhanced, renderMall);
  }

  if (els.inventoryListEnhanced) {
    const ownedItems = Object.entries(state.inventory)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => {
        const item = mallItems.find((mallItem) => mallItem.id === id);
        return item ? { ...item, count } : null;
      })
      .filter(Boolean);
    const pagedInventory = getPagedItems(ownedItems, "inventory");
    els.inventoryListEnhanced.innerHTML = ownedItems.length
      ? `
          <div class="inventory-scroll-area">
            ${pagedInventory.items.map((item) => {
              const categoryLabel = item.category === "pet" ? "软团供品" : item.category === "light" ? "灵力净化" : item.category;
              return `
                <article class="inventory-card-enhanced ${item.petBoost ? (item.category === "light" ? "light-supply" : "pet-supply") : ""}">
                  <div class="inventory-card-icon">${item.icon}</div>
                  <div class="inventory-card-body">
                    <div class="mall-card-tags">
                      <span class="mall-tag">${item.tag}</span>
                      <span class="mall-category">${categoryLabel}</span>
                    </div>
                    <strong>${item.name}</strong>
                    <p>${item.description}</p>
                    <div class="mall-card-effect"><span>效果：</span>${item.effect}</div>
                  </div>
                  <div class="inventory-card-action">
                    <em>x${item.count}</em>
                    <button class="mini-button" data-use-item="${item.id}" type="button">立即使用</button>
                  </div>
                </article>
              `;
            }).join("")}
          </div>
          ${createPaginationMarkup("inventory", pagedInventory.currentPage, pagedInventory.totalPages, pagedInventory.totalItems)}
        `
      : `<p class="inventory-empty">背包还空着，先去买点能救命的东西。</p>`;
    bindPagination(els.inventoryListEnhanced, renderMall);
  }

  if (els.inventoryUsageLog) {
    const pagedUsageLog = getPagedItems(state.usageLog, "usageLog");
    els.inventoryUsageLog.innerHTML = state.usageLog.length
      ? `
        <strong>最近使用</strong>
        <div class="usage-log-scroll-area">
          <div class="usage-log-list">
            ${pagedUsageLog.items.map((log) => `
              <div class="usage-log-item">
                <span>${log.icon} ${escapeHtml(log.name)} · ${escapeHtml(log.effect)}</span>
                <span>${escapeHtml(log.time)}</span>
              </div>
            `).join("")}
          </div>
        </div>
        ${createPaginationMarkup("usageLog", pagedUsageLog.currentPage, pagedUsageLog.totalPages, pagedUsageLog.totalItems)}
      `
      : "";
    bindPagination(els.inventoryUsageLog, renderMall);
  }

  renderQuickMallPreview();
}

function renderQuickMallPreview() {
  if (!els.quickMallPreview) return;
  const featured = ["leave", "earplug", "meeting_jar"]
    .map((id) => mallItems.find((item) => item.id === id))
    .filter(Boolean);
  els.quickMallPreview.innerHTML = `
    ${featured.map((item) => `
      <article class="quick-supply-card">
        <span>${item.icon}</span>
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <p>${escapeHtml(item.tag)} · ${formatResource(item.price, getMallItemCurrency(item))}</p>
        </div>
      </article>
    `).join("")}
    <button class="mini-button" data-screen-jump="mall" type="button">打开补给货架</button>
  `;
}

function renderCoach() {
  const mood = moodCopy[state.mood];
  const rant = (els.rantInput?.value || "").trim();
  els.aiResponse.innerHTML = `
    <article>
      <span>护短安抚</span>
      <p>${mood.comfort}</p>
    </article>
    <article>
      <span>目标锚定</span>
      <p>${rant ? `把这件事先归档成一次离谱样本，不要让它决定你对自己的判断。目标还是 ${state.wish}。` : `今天先保住电量，再把多余的力气攒给 ${state.wish}。`}</p>
    </article>
    <article>
      <span>战术指导</span>
      <p>${mood.tactic}</p>
    </article>
  `;
}

function renderCommunity() {
  const pagedStories = getPagedItems(sampleStories, "community");
  els.communityList.innerHTML = pagedStories.totalItems
    ? `
        <div class="community-scroll-area">
          ${pagedStories.items.map((story) => `
            <article class="story-card">
              <div class="story-footer">
                <strong>${story.title}</strong>
                <span>${story.goal}</span>
              </div>
              <p>${story.content}</p>
              <div class="reaction-row">
                ${story.reactions.map((item) => `<span>${item}</span>`).join("")}
              </div>
            </article>
          `).join("")}
        </div>
        ${createPaginationMarkup("community", pagedStories.currentPage, pagedStories.totalPages, pagedStories.totalItems)}
      `
    : `<p class="inventory-empty">信息流暂时还空着。</p>`;
  bindPagination(els.communityList, renderCommunity);

  const raw = "王总在上海 XX科技会议室让我把客户数据今晚重跑一遍，还不能告诉任何人。";
  els.rawPost.textContent = raw;
  els.safePost.textContent = sanitizePost(raw);
}

function sanitizePost(raw) {
  return raw.replace(/王总/g, "某负责人").replace(/上海/g, "某地").replace(/XX科技/g, "某公司");
}

function getPagedItems(items, pageKey) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, runtime.pagination[pageKey] || 1), totalPages);
  runtime.pagination[pageKey] = currentPage;
  const start = (currentPage - 1) * PAGE_SIZE;
  return {
    items: items.slice(start, start + PAGE_SIZE),
    currentPage,
    totalPages,
    totalItems: items.length
  };
}

function createPaginationMarkup(pageKey, currentPage, totalPages, totalItems) {
  if (totalItems <= PAGE_SIZE) return "";
  return `
    <div class="list-pagination" data-page-key="${pageKey}">
      <button class="mini-button" data-page-action="prev" data-page-key="${pageKey}" type="button" ${currentPage <= 1 ? "disabled" : ""}>上一页</button>
      <span class="pagination-status">第 ${currentPage} / ${totalPages} 页 · 共 ${totalItems} 条</span>
      <button class="mini-button" data-page-action="next" data-page-key="${pageKey}" type="button" ${currentPage >= totalPages ? "disabled" : ""}>下一页</button>
    </div>
  `;
}

function bindPagination(container, rerender) {
  if (!container || container.dataset.paginationBound === "true") return;
  container.dataset.paginationBound = "true";
  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page-action]");
    if (!button) return;
    const pageKey = button.dataset.pageKey;
    if (!pageKey) return;
    const currentPage = runtime.pagination[pageKey] || 1;
    runtime.pagination[pageKey] = button.dataset.pageAction === "prev"
      ? Math.max(1, currentPage - 1)
      : currentPage + 1;
    rerender();
  });
}

function updateBalanceDisplay() {
  const base = getWalletCoins();
  const todayRealtime = getTodayRealtimeEarnings();
  const display = base + todayRealtime;
  const formatted = formatMoney(display, 4);
  if (els.topWalletBalance) {
    els.topWalletBalance.textContent = formatted;
    els.topWalletBalance.classList.add("ticking");
    setTimeout(() => els.topWalletBalance.classList.remove("ticking"), 80);
  }
  if (els.coinBalance) {
    els.coinBalance.textContent = formatted;
    els.coinBalance.classList.add("ticking");
    setTimeout(() => els.coinBalance.classList.remove("ticking"), 80);
  }
  if (els.widgetBalance) {
    els.widgetBalance.textContent = formatted;
    els.widgetBalance.classList.add("ticking");
    setTimeout(() => els.widgetBalance.classList.remove("ticking"), 80);
  }
  if (els.mallBalance) {
    els.mallBalance.textContent = formatted;
    els.mallBalance.classList.add("ticking");
    setTimeout(() => els.mallBalance.classList.remove("ticking"), 80);
  }
}

function startBalanceTicker() {
  setInterval(updateBalanceDisplay, 50);
}

function renderCountdownPanels() {
  const countdowns = getCountdowns();
  const modeLabel = modeLabels[state.countMode];
  const nextPart = getNextLockedPart();
  const nextPartGap = nextPart ? Math.max(0, getPartPrice(nextPart) - getWalletCoins()) : 0;

  els.topOffWork.textContent = formatDuration(countdowns.offWorkMs);
  els.offWorkDetail.textContent = `已硬扛 ${formatDuration(countdowns.streakMs)}，距下班 ${formatDuration(countdowns.offWorkMs)}`;
  els.saturdayDetail.textContent = `${countdowns.saturdayNatural} 自然日 / ${countdowns.saturdayWorkday} 工作日`;
  els.holidayDetail.textContent = `${countdowns.holiday.name}：${countdowns.holidayNatural} 自然日 / ${countdowns.holidayWorkday} 工作日`;

  els.morningPush.textContent = nextPart
    ? `早安！你的 ${state.wish} ${nextPart.name} 还差 ${formatMoney(nextPartGap)}，去把这笔薪资金币赚回来。`
    : `早安！${state.wish} 已经点亮完毕，今天赚到的额度可以拿去认真奖励自己。`;
  els.eveningPush.textContent = `打卡成功！今天理论上从公司领回 ${formatMoney(getDailySalary())}，记得别把所有额度都花在忍耐上。`;
  els.followUpPush.textContent = `刚才那波剧烈吐槽我记着呢。现在账户里还有 ${formatMoney(getWalletCoins())}，先吃点热的，再决定要不要继续骂。`;

  els.widgetStreak.textContent = `已硬扛 ${formatDuration(countdowns.streakMs)}`;
  els.widgetMode.textContent = modeLabel;
  els.widgetOffWork.textContent = `距下班 ${formatDuration(countdowns.offWorkMs)}`;
  els.widgetSaturday.textContent = `周六 ${countdowns.saturdayNatural}天 / ${countdowns.saturdayWorkday}工`;
  els.widgetHoliday.textContent = `${countdowns.holiday.name} ${countdowns.holidayNatural}天 / ${countdowns.holidayWorkday}工`;
  els.widgetPepTalk.textContent = nextPart && getWalletCoins() >= getPartPrice(nextPart)
    ? `${nextPart.name} 已经买得起，打开主面板点亮它。`
    : `再扛 ${formatDuration(countdowns.offWorkMs, false)}，今天这笔薪资金币就领完了。`;

  els.widgetExplainStreak.textContent = `当前额度 ${formatMoney(getWalletCoins())}，${state.wish} 已点亮 ${getUnlockedPartCount()} / ${parts.length}。`;
  els.widgetExplainOffWork.textContent = `距离下班 ${formatDuration(countdowns.offWorkMs)}，让最痛苦的时段可以被倒计时切碎。`;
  els.widgetExplainHoliday.textContent = `下个锚点是 ${countdowns.holiday.name}：${countdowns.holidayNatural} 自然日 / ${countdowns.holidayWorkday} 工作日。`;
}

function renderPetDuel() {
  const stage = getPetStage();
  const { player, enemy, combo, fxText, fxTimer, phase, resultText, resultTimer, status, onlinePreview } = runtime.duelState;
  
  function updatePanel(isMain) {
    const prefix = isMain ? "Main" : "";
    const panel = els[`petDuelPanel${prefix}`];
    const playerHp = els[`petPlayerHp${prefix}`];
    const enemyHp = els[`petEnemyHp${prefix}`];
    const playerEnergy = els[`petPlayerEnergy${prefix}`];
    const enemyMana = els[`petEnemyMana${prefix}`];
    const playerHpText = els[`petPlayerHpText${prefix}`];
    const enemyHpText = els[`petEnemyHpText${prefix}`];
    const playerEnergyText = els[`petPlayerEnergyText${prefix}`];
    const enemyManaText = els[`petEnemyManaText${prefix}`];
    const arena = els[`petDuelArena${prefix}`];
    const playerFighter = els[`petPlayerFighter${prefix}`];
    const enemyFighter = els[`petEnemyFighter${prefix}`];
    const duelCombo = els[`petDuelCombo${prefix}`];
    const duelPhase = els[`petDuelPhase${prefix}`];
    const duelFx = els[`petDuelFx${prefix}`];
    const duelResult = els[`petDuelResult${prefix}`];
    const duelStatus = els[`petDuelStatus${prefix}`];
    const duelRecord = els[`petDuelRecord${prefix}`];
    const duelModeLabel = els[`petDuelModeLabel${prefix}`];
    const duelSkills = isMain ? els.petDuelSkillsMain : els.petDuelSkills;

    if (panel) {
      panel.hidden = !runtime.duelActive && !onlinePreview;
    }
    if (playerHp) playerHp.style.width = `${Math.max(0, player.hp)}%`;
    if (enemyHp) enemyHp.style.width = `${Math.max(0, enemy.hp)}%`;
    if (playerHpText) playerHpText.textContent = `${Math.max(0, Math.round(player.hp))}/100`;
    if (enemyHpText) enemyHpText.textContent = `${Math.max(0, Math.round(enemy.hp))}/100`;
    if (playerEnergy) {
      const energyPercent = player.maxEnergy ? Math.round((Math.max(0, player.energy) / player.maxEnergy) * 100) : 0;
      playerEnergy.style.width = `${Math.min(100, energyPercent)}%`;
    }
    if (playerEnergyText) playerEnergyText.textContent = `${Math.max(0, Math.round(player.energy))}/${player.maxEnergy}`;
    if (enemyMana) {
      const manaPercent = enemy.maxMana ? Math.round((Math.max(0, enemy.mana) / enemy.maxMana) * 100) : 0;
      enemyMana.style.width = `${Math.min(100, manaPercent)}%`;
    }
    if (enemyManaText) enemyManaText.textContent = `${Math.max(0, Math.round(enemy.mana))}/${enemy.maxMana || 0}`;
    if (arena) {
      arena.className = `pet-duel-arena ${runtime.duelState.cameraShake > 0 ? "impact" : ""}`;
    }
    if (playerFighter) {
      playerFighter.style.left = `${player.x}%`;
      playerFighter.style.top = `${player.y}%`;
      playerFighter.className = [
        "pet-fighter",
        "player",
        `facing-${player.facing < 0 ? "left" : "right"}`,
        player.attackType ? `attack-${player.attackType}` : "",
        player.hitFlash > 0 ? "is-hit" : "",
        player.guarding ? "guarding" : "",
        player.moving ? "is-moving" : ""
      ].filter(Boolean).join(" ");
    }
    if (enemyFighter) {
      enemyFighter.style.left = `${enemy.x}%`;
      enemyFighter.style.top = `${enemy.y}%`;
      enemyFighter.className = [
        "pet-fighter",
        "enemy",
        `stage-${stage.id}`,
        `facing-${enemy.facing < 0 ? "left" : "right"}`,
        enemy.attackType ? `attack-${enemy.attackType}` : "",
        enemy.hitFlash > 0 ? "is-hit" : "",
        enemy.guarding ? "guarding" : "",
        enemy.moving ? "is-moving" : ""
      ].filter(Boolean).join(" ");
      updatePetAvatarMarkup(enemyFighter, stage, "duel");
    }
    if (duelCombo) {
      duelCombo.textContent = `连击 x${combo}`;
      duelCombo.classList.toggle("active", combo >= 2);
    }
    if (duelPhase) {
      duelPhase.textContent = phase;
      duelPhase.className = `pet-duel-phase ${runtime.duelActive ? "live" : onlinePreview ? "preview" : "idle"}`;
    }
    if (duelFx) {
      duelFx.hidden = fxTimer <= 0 || !fxText;
      duelFx.textContent = fxText || "";
      duelFx.classList.toggle("active", fxTimer > 0 && Boolean(fxText));
    }
    if (duelResult) {
      duelResult.hidden = resultTimer <= 0 || !resultText;
      duelResult.textContent = resultText || "";
      duelResult.className = `pet-duel-result ${resultTimer > 0 ? "active" : ""} ${resultText.includes("赢") ? "win" : resultText.includes("被压") || resultText.includes("落败") ? "lose" : ""}`;
    }
    if (duelStatus) {
      duelStatus.textContent = status;
    }
    if (duelRecord) {
      duelRecord.textContent = `${state.pet.battleWins} 胜 / ${state.pet.battleLosses} 负 / 最佳 ${state.pet.battleBestCombo}`;
    }
    if (duelModeLabel) {
      duelModeLabel.textContent = onlinePreview
        ? "联机预演模式：当前展示未来联机入口说明"
        : runtime.duelActive
          ? "工位对战已开启，联机协议预留中"
          : "点击软团功能后可发起工位对战";
    }
    if (duelSkills) {
      duelSkills.forEach((button) => {
        const skill = button.dataset.duelSkill;
        const move = duelMoves[skill];
        const cooldown = player.skillCooldowns?.[skill] || 0;
        const lackingEnergy = move ? player.energy < move.cost : false;
        const disabled = !runtime.duelActive || cooldown > 0 || lackingEnergy || player.attackTimer > 0;
        button.disabled = !runtime.duelActive || (disabled && skill !== "guard");
        button.classList.toggle("ready", Boolean(move && player.energy >= move.cost && cooldown <= 0 && runtime.duelActive));
        button.classList.toggle("active", skill === "guard" && player.guarding);
        button.classList.toggle("cooling", cooldown > 0 || lackingEnergy);
        button.title = move
          ? cooldown > 0
            ? `${move.label}冷却中`
            : lackingEnergy
              ? `需要 ${move.cost} 爆发`
              : `${move.label}就绪`
          : skill === "guard"
            ? "按住 Shift 格挡"
            : "闪身调整身位";
      });
    }
  }

  updatePanel(false);
  updatePanel(true);
  
  if (runtime.duelState.desktopMode) {
    updateDesktopDuel();
  }
  
  if (els.widgetPetActionToggle) {
    els.widgetPetActionToggle.textContent = runtime.duelActive ? "软团功能 · 对战中" : "软团功能";
  }
}

function renderPrototypeBoards() {
  const stage = getPetStage();
  const dailyRage = getDailyRageValue();
  const nextMilestone = dailyRageMilestones.find((milestone) => dailyRage < milestone.threshold);
  const nextLabel = document.getElementById("rageNextMilestone");

  document.querySelectorAll("[data-pet-form]").forEach((card) => {
    card.classList.toggle("active", card.dataset.petForm === stage.id);
    card.classList.toggle("passed", petStages.some((item) => item.id === card.dataset.petForm && item.threshold < stage.threshold));
  });

  document.querySelectorAll("[data-rage-threshold]").forEach((node) => {
    const threshold = Number(node.dataset.rageThreshold) || 0;
    const active = dailyRage >= threshold;
    const isNext = nextMilestone && nextMilestone.threshold === threshold;
    node.classList.toggle("achieved", active);
    node.classList.toggle("next", !active && Boolean(isNext));
    node.setAttribute("aria-pressed", String(active));
  });

  if (nextLabel) {
    nextLabel.textContent = nextMilestone
      ? `下一节点：${nextMilestone.threshold} ${nextMilestone.title.replace(/^[^ ]+ /, "")}`
      : "今日怨气节点已全部触发";
  }
}

function previewRageMilestone(action) {
  const milestone = dailyRageMilestones.find((item) => item.action === action);
  if (milestone) {
    showRageSurgeToast({
      ...milestone,
      line: `原型预览：${milestone.line}`
    });
  }
  if (action === "ripple") {
    triggerRageRippleEffect();
    return;
  }
  if (action === "ricochet") {
    triggerPetRicochetEffect();
    return;
  }
  if (action === "storm") {
    triggerRageStormEffect();
    return;
  }
  if (action === "blackout") {
    triggerBlackoutSkill({ automatic: true, bypassUnlock: true, duration: 3600 });
    return;
  }
  if (action === "crack") {
    triggerRageCrackEffect();
    return;
  }
  if (action === "overdrive") {
    triggerRageOverdriveEffect();
    return;
  }
  if (action === "awaken") {
    triggerRageAwakenEffect();
    return;
  }
  if (action === "nuke") {
    triggerRageNukeEffect();
  }
}

function updateDesktopDuel() {
  const stage = getPetStage();
  const { player, enemy, combo, fxText, fxTimer, resultText, resultTimer, status } = runtime.duelState;
  
  if (els.deskPlayerHpBar) els.deskPlayerHpBar.style.width = `${Math.max(0, player.hp)}%`;
  if (els.deskEnemyHpBar) els.deskEnemyHpBar.style.width = `${Math.max(0, enemy.hp)}%`;
  if (els.deskPlayerHpText) els.deskPlayerHpText.textContent = `${Math.max(0, Math.round(player.hp))}/100`;
  if (els.deskEnemyHpText) els.deskEnemyHpText.textContent = `${Math.max(0, Math.round(enemy.hp))}/100`;
  if (els.deskPlayerEnergyText) els.deskPlayerEnergyText.textContent = `${Math.max(0, Math.round(player.energy))}/${player.maxEnergy}`;
  if (els.deskEnemyManaText) els.deskEnemyManaText.textContent = `${Math.max(0, Math.round(enemy.mana))}/${enemy.maxMana || 0}`;
  
  if (els.deskPlayerFighter) {
    els.deskPlayerFighter.style.left = `${player.x}%`;
    els.deskPlayerFighter.style.top = `${player.y}%`;
    els.deskPlayerFighter.className = [
      "desktop-fighter",
      "player",
      `facing-${player.facing < 0 ? "left" : "right"}`,
      player.attackType ? `attack-${player.attackType}` : "",
      player.hitFlash > 0 ? "is-hit" : "",
      player.guarding ? "guarding" : "",
      player.moving ? "is-moving" : ""
    ].filter(Boolean).join(" ");
  }
  
  if (els.deskEnemyFighter) {
    els.deskEnemyFighter.style.left = `${enemy.x}%`;
    els.deskEnemyFighter.style.top = `${enemy.y}%`;
    els.deskEnemyFighter.className = [
      "desktop-fighter",
      "enemy",
      `stage-${stage.id}`,
      `facing-${enemy.facing < 0 ? "left" : "right"}`,
      enemy.attackType ? `attack-${enemy.attackType}` : "",
      enemy.hitFlash > 0 ? "is-hit" : "",
      enemy.guarding ? "guarding" : "",
      enemy.moving ? "is-moving" : ""
    ].filter(Boolean).join(" ");
    updatePetAvatarMarkup(els.deskEnemyFighter, stage, "duel");
  }
  
  if (els.deskDuelFx) {
    els.deskDuelFx.hidden = fxTimer <= 0 || !fxText;
    els.deskDuelFx.textContent = fxText || "";
    els.deskDuelFx.classList.toggle("active", fxTimer > 0 && Boolean(fxText));
  }
  
  if (els.deskDuelCombo) {
    els.deskDuelCombo.textContent = `连击 x${combo}`;
    els.deskDuelCombo.classList.toggle("active", combo >= 2);
  }
  
  if (els.deskDuelStatus) {
    els.deskDuelStatus.textContent = status || "WASD 走位，J 普通拳，K 反弹脚，I 嘴替暴击，H 安抚回血";
  }
  
  if (els.deskDuelResult) {
    els.deskDuelResult.hidden = resultTimer <= 0 || !resultText;
    els.deskDuelResult.textContent = resultText || "";
    els.deskDuelResult.className = `desktop-duel-result ${resultTimer > 0 ? "active" : ""} ${resultText?.includes("赢") ? "win" : resultText?.includes("被压") || resultText?.includes("落败") ? "lose" : ""}`;
  }
  
  if (els.deskDuelSkills) {
    els.deskDuelSkills.forEach((button) => {
      const skill = button.dataset.duelSkill;
      const move = duelMoves[skill];
      const cooldown = player.skillCooldowns?.[skill] || 0;
      const lackingEnergy = move ? player.energy < move.cost : false;
      const disabled = !runtime.duelActive || cooldown > 0 || lackingEnergy || player.attackTimer > 0;
      button.disabled = !runtime.duelActive || (disabled && skill !== "guard");
      button.classList.toggle("ready", Boolean(move && player.energy >= move.cost && cooldown <= 0 && runtime.duelActive));
      button.classList.toggle("active", skill === "guard" && player.guarding);
      button.classList.toggle("cooling", cooldown > 0 || lackingEnergy);
    });
  }
}

function renderPet() {
  const stage = getPetStage();
  const progress = getPetProgress();
  const stats = getPetStats();
  const currentMana = Math.round(clampPetMana());
  const trainingCost = getPetTrainingCost();
  const nextTrainingReward = getNextTrainingReward();
  const line = state.pet.lastLine || stage.line;
  const heatState = getPetHeatState();
  const ownedPetSupplies = Object.entries(state.inventory)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => {
      const item = mallItems.find((mallItem) => mallItem.id === id && mallItem.petBoost);
      return item ? { ...item, count } : null;
    })
    .filter(Boolean);

  if (els.petAvatar) {
    renderPetAvatar(els.petAvatar, stage, "pet-avatar", "main");
  }
  if (els.petStageName) {
    els.petStageName.textContent = stage.name;
  }
  if (els.petLevel) {
    els.petLevel.textContent = `Lv.${stage.level}`;
  }
  if (els.petLine) {
    els.petLine.textContent = line;
  }
  if (els.petMoodBadge) {
    els.petMoodBadge.textContent = heatState.label;
    els.petMoodBadge.dataset.heat = heatState.level;
  }
  if (els.petTouchHeat) {
    els.petTouchHeat.textContent = `触摸热度 ${Math.round(state.pet.touchHeat)} · 已互动 ${state.pet.touchCount}`;
    els.petTouchHeat.dataset.heat = heatState.level;
  }
  if (els.petDailyRageBadge) {
    els.petDailyRageBadge.textContent = `今日怨气 ${Math.round(getDailyRageValue()).toLocaleString("zh-CN")}`;
    els.petDailyRageBadge.dataset.heat = heatState.level;
  }
  if (els.petRageBalance) {
    els.petRageBalance.textContent = `${Math.round(getRageCoins()).toLocaleString("zh-CN")}`;
  }
  if (els.petDailyRage) {
    els.petDailyRage.textContent = `${Math.round(getDailyRageValue()).toLocaleString("zh-CN")}`;
  }
  if (els.petLightBalance) {
    els.petLightBalance.textContent = formatLight(state.pet.light);
  }
  if (els.petAffinity) {
    const affinity = getPetAffinity();
    els.petAffinity.textContent = affinity.label;
    els.petAffinity.dataset.affinity = affinity.type;
  }
  if (els.petAffinityBar) {
    const affinity = getPetAffinity();
    const barPercent = affinity.type === "demon" ? 50 + affinity.percent / 2 : affinity.type === "spirit" ? 50 - affinity.percent / 2 : 50;
    els.petAffinityBar.style.width = `${barPercent}%`;
    els.petAffinityBar.dataset.affinity = affinity.type;
  }
  if (els.petAttackPower) {
    els.petAttackPower.textContent = `${stats.attack}`;
  }
  setPetEnergyBar(els.petAttackBar, stats.attack, 80);
  if (els.petMana) {
    els.petMana.textContent = `${currentMana} / ${stats.maxMana}`;
  }
  setPetEnergyBar(els.petManaBar, currentMana, stats.maxMana);
  if (els.petDefensePower) {
    els.petDefensePower.textContent = `${stats.defense}`;
  }
  setPetEnergyBar(els.petDefenseBar, stats.defense, 42);
  if (els.petCritRate) {
    els.petCritRate.textContent = `${stats.crit}%`;
  }
  setPetEnergyBar(els.petCritBar, stats.crit, 38);
  if (els.petCombatPower) {
    els.petCombatPower.textContent = `${stats.combatPower} 战力`;
  }
  if (els.petCultivation) {
    els.petCultivation.textContent = `${stats.cultivation} 重`;
  }
  setPetEnergyBar(els.petCultivationBar, stats.cultivation, 18);
  if (els.petRageProgress) {
    els.petRageProgress.textContent = progress.label;
  }
  if (els.petRageBar) {
    els.petRageBar.style.width = `${progress.percent}%`;
  }
  if (els.petSatiety) {
    els.petSatiety.textContent = `${state.pet.satiety}%`;
  }
  setPetEnergyBar(els.petSatietyBar, state.pet.satiety, 100);
  if (els.petAffection) {
    els.petAffection.textContent = `${state.pet.affection}%`;
  }
  setPetEnergyBar(els.petAffectionBar, state.pet.affection, 100);
  if (els.petSupplyList) {
    const pagedSupplies = getPagedItems(ownedPetSupplies, "petSupply");
    els.petSupplyList.innerHTML = ownedPetSupplies.length
      ? `
          <div class="pet-supply-scroll-area">
            ${pagedSupplies.items.map((item) => `
              <article class="pet-supply-item">
                <div>
                  <span>${item.icon}</span>
                  <strong>${item.name}</strong>
                  <p>${item.effect}</p>
                </div>
                <button class="mini-button" data-use-item="${item.id}" type="button">投喂 x${item.count}</button>
              </article>
            `).join("")}
          </div>
          ${createPaginationMarkup("petSupply", pagedSupplies.currentPage, pagedSupplies.totalPages, pagedSupplies.totalItems)}
        `
      : `<p class="inventory-empty">还没有供品。去商城买一点，或者先把糟心事炼成怨气。</p>`;
    bindPagination(els.petSupplyList, renderPet);
  }
  if (els.petLogList) {
    const pagedPetLog = getPagedItems(state.petLog, "petLog");
    els.petLogList.innerHTML = state.petLog.length
      ? `
          <div class="pet-log-scroll-area">
            ${pagedPetLog.items.map((log) => `
              <article class="pet-log-item">
                <span>${escapeHtml(log.time)}</span>
                <strong>${escapeHtml(log.title)}</strong>
                <p>${escapeHtml(log.detail)}</p>
              </article>
            `).join("")}
          </div>
          ${createPaginationMarkup("petLog", pagedPetLog.currentPage, pagedPetLog.totalPages, pagedPetLog.totalItems)}
        `
      : `<p class="inventory-empty">最近还没有互动记录。</p>`;
    bindPagination(els.petLogList, renderPet);
  }
  if (els.summonPetPanelButton) {
    els.summonPetPanelButton.textContent = getSummonButtonLabel();
  }
  if (els.summonPetButton) {
    els.summonPetButton.textContent = state.pet.summoned ? "收回" : "召唤";
  }
  if (els.petTrainButton) {
    const canTrain = getRageCoins() >= trainingCost;
    els.petTrainButton.disabled = !canTrain;
    els.petTrainButton.textContent = canTrain ? "怨气修炼" : "怨气不足";
    els.petTrainButton.title = `消耗 ${formatRage(trainingCost)}，${nextTrainingReward.label}`;
  }
  if (els.petTrainingCost) {
    els.petTrainingCost.textContent = `下次修炼消耗 ${formatRage(trainingCost)}，预计获得 ${nextTrainingReward.label}，并提升少量怨气滋养和法力。`;
  }
  const blackoutUnlocked = canUseBlackoutSkill();
  [els.petBlackoutButton, els.widgetPetBlackoutButton].forEach((button) => {
    if (!button) return;
    button.disabled = !blackoutUnlocked;
    button.title = blackoutUnlocked ? "释放黑屏结界" : "软团滋养或今日怨气达到 200 解锁";
  });
  if (els.petGameScore) {
    els.petGameScore.textContent = `${runtime.petGameScore} / 5 · 最佳 ${state.pet.gameBest}`;
  }
  if (els.widgetPetAvatar) {
    renderPetAvatar(els.widgetPetAvatar, stage, "widget-pet-avatar", "widget");
  }
  if (els.widgetPetStage) {
    els.widgetPetStage.textContent = `${stage.name} Lv.${stage.level}`;
  }
  if (els.widgetPetMoodBadge) {
    els.widgetPetMoodBadge.textContent = heatState.label;
    els.widgetPetMoodBadge.dataset.heat = heatState.level;
  }
  if (els.widgetPetLine) {
    els.widgetPetLine.textContent = line;
  }
  if (els.widgetPetRage) {
    const affinity = getPetAffinity();
    els.widgetPetRage.textContent = `${formatRage(getRageCoins())} · ${formatLight(state.pet.light)} · ${affinity.label}`;
  }
  if (els.widgetPetBar) {
    els.widgetPetBar.style.width = `${progress.percent}%`;
  }
  renderSummonedPet();
  renderPetDuel();
}

function renderSummonedPet() {
  if (!els.summonedPet) return;
  const stage = getPetStage();
  const visible = VIEW_MODE === "pet" || state.pet.summoned;
  const heatState = getPetHeatState();
  els.summonedPet.hidden = !visible;
  els.summonedPet.className = `summoned-pet stage-${stage.id} heat-${heatState.level} ${visible ? "active" : ""}`;
  if (els.summonedPetAvatar) {
    renderPetAvatar(els.summonedPetAvatar, stage, "summoned-pet-avatar", "summoned");
  }
  if (els.summonedPetMoodBadge) {
    els.summonedPetMoodBadge.textContent = heatState.label;
    els.summonedPetMoodBadge.dataset.heat = heatState.level;
  }
}

function applyTheme() {
  els.body.dataset.theme = state.theme;
  if (els.widgetModeCard) els.widgetModeCard.textContent = modeLabels[state.countMode];
  if (els.widgetShiftCard) els.widgetShiftCard.textContent = `${state.startTime} - ${state.endTime}`;
  if (els.settingsThemePreview) els.settingsThemePreview.textContent = themeLabels[state.theme] || state.theme;
  if (els.settingsModePreview) els.settingsModePreview.textContent = modeLabels[state.countMode] || state.countMode;
  if (els.settingsWidgetPreview) {
    const widgetViewLabels = { wallet: "工位控制台", ai: "AI 参谋", pet: "怨气软团", countdown: "倒计时" };
    els.settingsWidgetPreview.textContent = widgetViewLabels[state.widgetDefaultView] || state.widgetDefaultView;
  }
}

function syncSettingsControls() {
  els.themeSelect.value = state.theme;
  els.countModeSelect.value = state.countMode;
  els.widgetDefaultViewSelect.value = state.widgetDefaultView;
  els.startTimeInput.value = state.startTime;
  els.endTimeInput.value = state.endTime;
  els.paydayInput.value = state.payday;
}

function syncSetupControls() {
  els.nicknameInput.value = state.nickname;
  els.salaryInput.value = state.salary;
  els.wishInput.value = state.wish;
  els.priceInput.value = state.price;
  els.rageMinutesInput.value = state.rageMinutes;
}

function renderWidgetCards() {
  if (els.widgetCoinCard) els.widgetCoinCard.textContent = formatMoney(getWalletCoins());
  els.floatingWidget.classList.toggle("masked", state.masked);
  els.maskToggle.textContent = state.masked ? "显" : "隐";
  els.widgetBadge.textContent = state.masked ? "Project Pulse" : "工位控制台";
  els.widgetPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.widgetPanel === state.widgetView);
  });
  els.widgetViewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.widgetView === state.widgetView);
  });
  const mood = moodCopy[state.mood];
  els.widgetMoodTitle.textContent = mood.label;
  els.widgetAiLine.textContent = mood.comfort;
  els.widgetAiWishLine.textContent = `目标锚点：${state.wish}`;
  els.widgetAiTacticLine.textContent = `策略：${mood.short}模式，先把边界写下来。`;
}

function renderSummary() {
  const remainingCost = getWishRemainingCost();
  const balanceAfterWish = Math.max(0, remainingCost - getWalletCoins());
  const daysNeeded = remainingCost === 0 ? "已完成" : balanceAfterWish === 0 ? "可点亮" : `${Math.ceil(balanceAfterWish / getDailyCoins())} 天`;

  els.wishSpent.textContent = formatMoney(getWishSpent());
  els.remainingAmount.textContent = formatMoney(remainingCost);
  els.daysNeeded.textContent = daysNeeded;

  renderWallet();
  renderParts();
  renderMall();
  renderCoach();
  renderCommunity();
  renderCountdownPanels();
  renderPet();
  renderPrototypeBoards();
  renderWidgetCards();
  applyTheme();
}

function setActiveScreen(screen) {
  els.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.screen === screen);
  });
  els.screens.forEach((section) => {
    section.classList.toggle("active", section.id === `screen-${screen}`);
  });
  els.screenTitle.textContent = screenTitles[screen] || screenTitles.converter;
}

function setAccountTab(tab) {
  els.accountTabs.forEach((button) => {
    const active = button.dataset.accountTab === tab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  els.accountPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.accountPanel === tab);
  });
}

function setModuleTab(group, value) {
  els.moduleTabs.forEach((button) => {
    if (button.dataset.moduleTab !== group) return;
    const active = button.dataset.tabValue === value;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  els.modulePanels.forEach((panel) => {
    if (panel.dataset.modulePanel !== group) return;
    panel.classList.toggle("active", panel.dataset.panelValue === value);
  });
}

function syncFromSetupForm(formData) {
  state.nickname = formData.get("nickname") || state.nickname;
  state.salary = Number(formData.get("salary")) || state.salary;
  state.wish = formData.get("wish") || state.wish;
  state.price = Number(formData.get("price")) || state.price;
  state.rageMinutes = Number(formData.get("rageMinutes")) || state.rageMinutes;
  normalizeState();
  persistSettings();
}

function syncFromSettingsForm() {
  state.theme = els.themeSelect.value;
  state.countMode = els.countModeSelect.value;
  state.widgetDefaultView = els.widgetDefaultViewSelect.value;
  state.widgetView = state.widgetDefaultView;
  state.startTime = els.startTimeInput.value || state.startTime;
  state.endTime = els.endTimeInput.value || state.endTime;
  state.payday = Math.max(1, Math.min(31, Number(els.paydayInput.value) || 10));
  persistSettings();
  renderSummary();
}

function showPetBubble(message) {
  if (!els.summonedPetBubble) return;
  els.summonedPetBubble.innerHTML = message;
  els.summonedPetBubble.hidden = false;
  els.summonedPetBubble.classList.add("active");
  clearTimeout(runtime.petBubbleTimer);
}

function hidePetBubble() {
  if (!els.summonedPetBubble || els.summonedPetBubble.hidden) return;
  els.summonedPetBubble.classList.remove("active");
  setTimeout(() => {
    if (els.summonedPetBubble) els.summonedPetBubble.hidden = true;
  }, 180);
}

function getNextPayday(now = new Date()) {
  const payday = new Date(now);
  payday.setHours(9, 0, 0, 0);
  const day = Math.max(1, Math.min(31, Number(state.payday) || 10));
  payday.setDate(day);
  if (payday <= now) {
    payday.setMonth(payday.getMonth() + 1, day);
  }
  return payday;
}

function getWorkdaysInMonth(year, month) {
  let count = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const day = date.getDay();
    if (day !== 0 && day !== 6) count += 1;
  }
  return count;
}

function getWorkdaysInCurrentMonth() {
  const now = new Date();
  return getWorkdaysInMonth(now.getFullYear(), now.getMonth());
}

function getDailyEarnings() {
  const workdays = getWorkdaysInCurrentMonth();
  return workdays > 0 ? state.salary / workdays : 0;
}

function getMinuteEarnings() {
  const daily = getDailyEarnings();
  return daily / (8 * 60);
}

function getDynamicBalance() {
  const now = new Date();
  const [startHour, startMinute] = state.startTime.split(":").map(Number);
  const start = new Date(now);
  start.setHours(startHour || 9, startMinute || 30, 0, 0);
  const [endHour, endMinute] = state.endTime.split(":").map(Number);
  const end = new Date(now);
  end.setHours(endHour || 18, endMinute || 30, 0, 0);

  const daily = getDailyEarnings();
  const minuteRate = daily / (8 * 60);

  let todayEarned = 0;
  if (now >= start && now <= end) {
    todayEarned = ((now - start) / 1000 / 60) * minuteRate;
  } else if (now > end) {
    todayEarned = daily;
  }

  let monthEarned = 0;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const cursor = new Date(monthStart);
  while (cursor < now) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      monthEarned += daily;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  monthEarned = monthEarned - daily + todayEarned;

  return Math.max(0, monthEarned);
}

function getTodayRealtimeEarnings() {
  const now = new Date();
  const [startHour, startMinute] = state.startTime.split(":").map(Number);
  const start = new Date(now);
  start.setHours(startHour || 9, startMinute || 30, 0, 0);
  const [endHour, endMinute] = state.endTime.split(":").map(Number);
  const end = new Date(now);
  end.setHours(endHour || 18, endMinute || 30, 0, 0);

  const daily = getDailyEarnings();
  const minuteRate = daily / (8 * 60);

  if (now < start) return 0;
  if (now > end) return daily;
  return ((now - start) / 1000 / 60) * minuteRate;
}

const petCountdownLines = {
  offWork: [
    "再扛 <strong>{offWork}</strong> 就下班了，别在最后关头被临时需求绊住",
    "还有 <strong>{offWork}</strong>，撑住，自由已经在路上了",
    "<strong>{offWork}</strong> 后你就是自己的了，现在先别炸",
    "下班倒计时 <strong>{offWork}</strong>，我已经替你盯紧那些想加塞的人了"
  ],
  holiday: [
    "<strong>{holidayName}</strong> 还有 <strong>{holidayNatural} 天</strong>（<strong>{holidayWorkday} 个工作日</strong>），再忍忍就有盼头了",
    "距离 <strong>{holidayName}</strong> 只剩 <strong>{holidayWorkday} 个工作日</strong>，把假期当成终点线冲",
    "<strong>{holidayName}</strong> 在 <strong>{holidayNatural} 天</strong>后等你，现在每多忍一秒，假期就多值一秒"
  ],
  payday: [
    "发工资还有 <strong>{paydayDays} 天</strong>，这笔钱是替你挨的每一顿骂结的账",
    "<strong>{paydayDays} 天</strong>后到账，到时候该花就花，别全换成薪资金币",
    "再熬 <strong>{paydayDays} 天</strong>，工资到账那天，我建议你先买杯贵的"
  ],
  pep: [
    "你今天已经硬扛了 <strong>{streak}</strong>，这本身就很能打",
    "<strong>{streak}</strong> 了，不是所有人都能撑这么久，你比大部分人硬",
    "已扛 <strong>{streak}</strong>，怨气我替你收着，你别自己咽",
    "<strong>{streak}</strong> 的战绩，换成别人可能早就掀桌了"
  ],
  earningsDay: [
    "这个月每坚持 <strong>1 天</strong>，就能赚 <strong>{dailyEarnings}</strong>，今天的正在到账",
    "工作日每天值 <strong>{dailyEarnings}</strong>，你现在流的汗，月底都会变成数字",
    "撑过今天，账户就多 <strong>{dailyEarnings}</strong>，这比任何鸡汤都实在"
  ],
  earningsMinute: [
    "每多忍 <strong>1 分钟</strong>，账户就多 <strong>{minuteEarnings}</strong>，呼吸都在赚钱",
    "你刚才那口气值 <strong>{minuteEarnings}</strong>，下一口也一样",
    "时间不是流水，是 <strong>{minuteEarnings}</strong>/分钟的进账，别浪费"
  ]
};

let lastEarningsType = "day";

function getPetCountdownMessage() {
  const countdowns = getCountdowns();
  const payday = getNextPayday();
  const paydayDays = Math.max(0, Math.ceil((payday - new Date()) / 86400000));
  const offWorkLine = pickRandom(petCountdownLines.offWork);
  const holidayLine = pickRandom(petCountdownLines.holiday);
  const paydayLine = pickRandom(petCountdownLines.payday);
  const pepLine = pickRandom(petCountdownLines.pep);

  lastEarningsType = lastEarningsType === "day" ? "minute" : "day";
  const earningsKey = lastEarningsType === "day" ? "earningsDay" : "earningsMinute";
  const earningsLine = pickRandom(petCountdownLines[earningsKey])
    .replace("{dailyEarnings}", formatMoney(getDailyEarnings()))
    .replace("{minuteEarnings}", formatMoney(getMinuteEarnings()));

  const lines = [
    offWorkLine.replace("{offWork}", formatDuration(countdowns.offWorkMs)),
    holidayLine
      .replace("{holidayName}", countdowns.holiday.name)
      .replace("{holidayNatural}", countdowns.holidayNatural)
      .replace("{holidayWorkday}", countdowns.holidayWorkday),
    paydayLine.replace("{paydayDays}", paydayDays),
    pepLine.replace("{streak}", formatDuration(countdowns.streakMs)),
    earningsLine
  ];

  return `<p class="pet-bubble-line">${lines.join("。")}。</p>`;
}

function handleSummonedPetClick(event) {
  if (event.target.closest("button")) return;
  markPetInteraction("summoned-pet-click");
  runtime.petClickCount += 1;
  clearTimeout(runtime.petClickTimer);
  
  const clickX = event.clientX;
  const clickY = event.clientY;
  const isHitzone = event.target.closest(".pet-hitzone");
  const hitzoneType = isHitzone ? isHitzone.dataset.petTouch : null;
  
  runtime.petClickTimer = setTimeout(() => {
    const count = runtime.petClickCount;
    runtime.petClickCount = 0;
    if (count >= 3) {
      openMainPanelFromPet();
    } else if (count === 2) {
      showPetBubble(getPetCountdownMessage());
    } else if (hitzoneType) {
      handlePetTouch(hitzoneType, { clientX: clickX, clientY: clickY });
    }
  }, 260);
}

function openMainPanelFromPet() {
  const api = getDesktopApi();
  if (api?.open_main_panel) {
    api.open_main_panel();
  } else {
    setActiveScreen("pet");
  }
  showPetBubble("<strong>后台已打开</strong><span>我把控制台给你叫出来了。</span>");
}

function togglePetRadialMenu(force) {
  if (!els.petRadialMenu) return;
  const next = typeof force === "boolean" ? force : els.petRadialMenu.hidden;
  els.petRadialMenu.hidden = !next;
  els.petRadialMenu.classList.toggle("active", next);
  clearTimeout(runtime.petRadialTimer);
  if (next) {
    runtime.petRadialTimer = setTimeout(() => {
      document.addEventListener("pointerdown", dismissPetRadialOnOutside, { once: true, capture: true });
    }, 80);
  } else {
    document.removeEventListener("pointerdown", dismissPetRadialOnOutside, { capture: true });
  }
}

function dismissPetRadialOnOutside(event) {
  if (!els.petRadialMenu || els.petRadialMenu.hidden) return;
  if (els.petRadialMenu.contains(event.target)) return;
  togglePetRadialMenu(false);
}

function registerPetShake(dx) {
  const now = Date.now();
  const direction = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  if (!direction || Math.abs(dx) < 9) return;
  if (now - runtime.petShakeStartedAt > 900) {
    runtime.petShakeStartedAt = now;
    runtime.petShakeCount = 0;
    runtime.petShakeDirection = direction;
  }
  if (runtime.petShakeDirection && runtime.petShakeDirection !== direction) {
    runtime.petShakeCount += 1;
    runtime.petShakeDirection = direction;
  }
  if (runtime.petShakeCount >= 3) {
    runtime.petShakeCount = 0;
    runtime.petShakeStartedAt = now;
    togglePetRadialMenu(true);
  }
}

function handlePetRadialAction(action) {
  togglePetRadialMenu(false);
  markPetInteraction(`radial-${action}`);
  if (VIEW_MODE === "pet" && ["blackout", "duel", "online"].includes(action)) {
    const api = getDesktopApi();
    if (api?.pet_command) {
      api.pet_command({
        action,
        source: "pet-radial",
        bypassUnlock: action === "blackout" && canUseBlackoutSkill(),
        duration: action === "blackout" ? 4200 : undefined
      });
      const labels = { blackout: "黑屏结界已转交主窗口", duel: "擂台已打开，去主面板开打", online: "联机预演已打开" };
      showPetBubble(`<strong>${labels[action]}</strong><span>我从桌面小窗把指令递过去了。</span>`);
      return;
    }
  }
  if (action === "retract") {
    setPetSummoned(false);
    return;
  }
  if (action === "blackout") {
    triggerBlackoutSkill();
    return;
  }
  if (action === "duel") {
    if (VIEW_MODE === "pet") {
      const api = getDesktopApi();
      if (api?.focus_screen) {
        api.focus_screen("pet");
      } else {
        setActiveScreen("pet");
      }
    }
    setModuleTab("pet", "status");
    startPetDuel();
    return;
  }
  if (action === "online") {
    previewOnlineBattle();
  }
}

function setWidgetView(view) {
  const validWidgetViews = ["wallet", "ai", "pet", "countdown"];
  if (!validWidgetViews.includes(view)) return;
  state.widgetView = view;
  if (view !== "pet") {
    runtime.duelKeys.clear();
  }
  persistSettings();
  renderWidgetCards();
}

function toggleWidgetPetMenu(force) {
  if (!els.widgetPetActionMenu || !els.widgetPetActionToggle) return;
  const next = typeof force === "boolean" ? force : els.widgetPetActionMenu.hidden;
  els.widgetPetActionMenu.hidden = !next;
  els.widgetPetActionToggle.setAttribute("aria-expanded", String(next));
  if (!next && !runtime.duelActive && els.petDuelPanel) {
    els.petDuelPanel.hidden = true;
  }
}

function claimDailyWallet() {
  return;
}

function buyPart(partId) {
  const part = parts.find((item) => item.id === partId);
  if (!part || isPartUnlocked(part)) return;
  const price = getPartPrice(part);
  if (getWalletCoins() < price) {
    els.partNarrative.textContent = `${part.name} 还差 ${formatMoney(price - getWalletCoins())}，账户暂时顶不住。`;
    return;
  }
  state.walletBalance -= price;
  state.unlockedParts.push(part.id);
  addTransaction(`点亮 ${part.name}`, -price, state.wish, "wish");
  state.pet.lastLine = `你把 ${part.name} 点亮了。很好，花出去的钱终于有点像在给自己铺路。`;
  addPetLog("软团围观消费", `${part.name} 已点亮，${state.wish} 更近了一步。`);
  persistSettings();
  renderSummary();
}

function buyMallItem(itemId) {
  const item = mallItems.find((mallItem) => mallItem.id === itemId);
  if (!item) return;
  const currency = getMallItemCurrency(item);
  if (getResourceBalance(currency) < item.price) return;
  if (currency === "rage") {
    state.rageBalance -= item.price;
    addPetLog("怨气兑换供品", `${item.name} 已收入背包，少了一点怨气，多了一点盼头。`);
  } else {
    state.walletBalance -= item.price;
    addTransaction(`购买 ${item.name}`, -item.price, item.petBoost ? "滋养软团" : "情绪补给", item.petBoost ? "pet" : "mall");
  }
  state.inventory[item.id] = (state.inventory[item.id] || 0) + 1;
  if (item.petBoost) {
    state.pet.lastLine = `${item.name} 我闻到了。你这次花钱，属于对症下药。`;
  }
  persistSettings();
  renderSummary();
}

function useItem(itemId) {
  const item = mallItems.find((mallItem) => mallItem.id === itemId);
  if (!item || !state.inventory[itemId] || state.inventory[itemId] <= 0) return;
  state.inventory[itemId] -= 1;
  if (state.inventory[itemId] <= 0) {
    delete state.inventory[itemId];
  }
  if (item.petBoost) {
    feedPet(item);
    persistSettings();
    renderSummary();
    return;
  }
  const now = new Date();
  state.usageLog.unshift({
    id: item.id,
    name: item.name,
    icon: item.icon,
    effect: item.effect,
    time: now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  });
  state.usageLog = state.usageLog.slice(0, 50);
  if (item.category === "heal") {
    state.pet.lastLine = `你总算对自己好一点了。继续保持，别只会硬扛。`;
    addPetLog("软团观察到回血", `${item.name} 已使用，软团情绪稳定度略有提升。`);
  }
  persistSettings();
  renderSummary();
}

function feedPet(item) {
  const boost = item.petBoost || {};
  const beforeStage = getPetStage();
  const beforeAffinity = getPetAffinity();
  state.pet.rage += Number(boost.rage) || 0;
  state.pet.light += Number(boost.light) || 0;
  state.pet.satiety = Math.min(100, state.pet.satiety + (Number(boost.satiety) || 0));
  state.pet.affection = Math.min(100, state.pet.affection + (Number(boost.affection) || 0));
  state.pet.attackBonus += Number(boost.attack) || 0;
  state.pet.defenseBonus += Number(boost.defense) || 0;
  state.pet.manaBonus += Number(boost.manaCap) || 0;
  state.pet.critBonus += Number(boost.crit) || 0;
  restorePetMana(Number(boost.mana) || (boost.manaCap ? undefined : 0));
  const afterStage = getPetStage();
  const afterAffinity = getPetAffinity();
  const evolved = afterStage.id !== beforeStage.id;
  const affinityShifted = afterAffinity.type !== beforeAffinity.type;
  const boostDetail = formatPetBoost(boost);
  let line;
  if (evolved && affinityShifted) {
    line = `${item.name} 很对胃口。我进化成 ${afterStage.name} 了，而且体内气息变了——现在是${afterAffinity.label}。`;
  } else if (evolved) {
    line = `${item.name} 很对胃口。我进化成 ${afterStage.name} 了，今天这口气没白忍。`;
  } else if (affinityShifted) {
    line = `${item.name} 生效了。体内气息在变化……现在是${afterAffinity.label}。`;
  } else if (boost.light) {
    line = `${item.name} 很温柔。灵力在我体内流转，怨气被冲淡了一些。`;
  } else {
    line = `${item.name} 收下了。${boost.attack || boost.defense || boost.manaCap || boost.crit ? "属性也长了一截，等会儿对战你会看见。" : "放心，这点怨气我会替你妥善保存。"}`;
  }
  state.pet.lastLine = line;
  addPetLog(
    evolved ? "软团进化" : affinityShifted ? "气息转变" : "投喂成功",
    evolved
      ? `${beforeStage.name} 进化为 ${afterStage.name}，怨气滋养累计 ${formatRage(state.pet.rage)}，灵力累计 ${formatLight(state.pet.light)}。`
      : affinityShifted
        ? `体内气息从 ${beforeAffinity.label} 转变为 ${afterAffinity.label}。`
        : `${item.name} 生效：${boostDetail || "状态稳定"}。`
  );
}

function cultivatePet() {
  markPetInteraction("cultivate-pet");
  const cost = getPetTrainingCost();
  if (getRageCoins() < cost) {
    const gap = cost - getRageCoins();
    state.pet.lastLine = `这次修炼还差 ${formatRage(gap)}。先把糟心事炼一炼，再给我闭关。`;
    renderSummary();
    return;
  }
  const beforeStage = getPetStage();
  const reward = getNextTrainingReward();
  state.rageBalance -= cost;
  state.pet.cultivation += 1;
  reward.apply();
  const growth = 12 + beforeStage.level * 5 + Math.floor(cost / 14);
  state.pet.rage += growth;
  state.pet.affection = Math.min(100, state.pet.affection + 3);
  state.pet.satiety = Math.max(0, state.pet.satiety - 4);
  restorePetMana(24 + beforeStage.level * 8);
  const afterStage = getPetStage();
  const evolved = afterStage.id !== beforeStage.id;
  state.pet.lastLine = evolved
    ? `闭关结束，我进化成 ${afterStage.name} 了。${reward.label}，这波修炼很值。`
    : `闭关结束：${reward.label}。我现在更像一个能打的邪物了。`;
  addPetLog(
    evolved ? "修炼突破" : "怨气修炼",
    `消耗 ${formatRage(cost)}，获得 ${reward.label}，怨气滋养 +${growth}，当前修炼 ${state.pet.cultivation} 重。`
  );
  persistSettings();
  renderSummary();
}

function refineRageFromRant() {
  if (!els.petRantInput) return;
  const text = els.petRantInput.value.trim();
  if (!text) {
    state.pet.lastLine = "空口无凭不炼怨气。写两句，哪怕只写「今天真烦」。";
    renderPet();
    renderWidgetCards();
    return;
  }
  const base = Math.min(120, Math.max(12, Math.round(text.length * 0.9)));
  const moodBonus = state.mood === "rage" ? 12 : state.mood === "numb" ? 8 : 6;
  const workBonus = Math.min(40, Math.round(state.rageMinutes / 6));
  const gained = base + moodBonus + workBonus;
  addRageCoins(gained, "糟心事炼化");
  const manaRecover = Math.max(8, Math.round(gained * 0.28));
  restorePetMana(manaRecover);
  state.pet.affection = Math.min(100, state.pet.affection + 2);
  state.pet.lastLine = `炼出 ${formatRage(gained)}，顺手回了 ${manaRecover} 点法力。这段糟心事我先收着。`;
  addPetLog("糟心事炼化", `新增 ${formatRage(gained)}，法力 +${manaRecover}，可去商城换怨气供品或修炼。`);
  els.petRantInput.value = "";
  persistSettings();
  renderSummary();
}

function refineLightFromRant() {
  if (!els.petRantInput) return;
  const text = els.petRantInput.value.trim();
  if (!text) {
    state.pet.lastLine = "想转化灵力，得先写下点什么。哪怕是一句「今天还行」。";
    renderPet();
    renderWidgetCards();
    return;
  }
  const base = Math.min(120, Math.max(12, Math.round(text.length * 0.9)));
  const moodBonus = state.mood === "calm" ? 12 : state.mood === "numb" ? 8 : 6;
  const workBonus = Math.min(40, Math.round(state.rageMinutes / 6));
  const gained = base + moodBonus + workBonus;
  state.pet.light += gained;
  const manaRecover = Math.max(8, Math.round(gained * 0.28));
  restorePetMana(manaRecover);
  state.pet.affection = Math.min(100, state.pet.affection + 3);
  const affinity = getPetAffinity();
  state.pet.lastLine = `转化出 ${formatLight(gained)}，法力回复 ${manaRecover}。现在体内是${affinity.label}的气息。`;
  addPetLog("心事转化", `新增 ${formatLight(gained)}，法力 +${manaRecover}，当前气息：${affinity.label}。`);
  els.petRantInput.value = "";
  persistSettings();
  renderSummary();
}

async function setPetSummoned(enabled = !state.pet.summoned) {
  markPetInteraction(enabled ? "summon-pet" : "retract-pet");
  state.pet.summoned = Boolean(enabled);
  state.pet.lastLine = state.pet.summoned
    ? "召唤成功。我现在趴在桌面边缘，负责盯着那些离谱需求。"
    : "行，我先缩回怨气壶里。需要我时再叫一声。";
  addPetLog(state.pet.summoned ? "软团被召唤" : "软团被收回", state.pet.lastLine);
  persistSettings();
  renderSummary();

  const api = getDesktopApi();
  if (VIEW_MODE !== "pet" && api?.toggle_pet) {
    await api.toggle_pet(state.pet.summoned);
  }
  if (VIEW_MODE === "pet" && !state.pet.summoned && api?.toggle_pet) {
    await api.toggle_pet(false);
  }
}

function triggerBlackoutSkill(options = {}) {
  if (options?.target) {
    options = {};
  }
  const automatic = Boolean(options.automatic);
  const bypassUnlock = Boolean(options.bypassUnlock);
  const duration = Math.max(2400, Number(options.duration) || 4200);
  markPetInteraction(automatic ? "auto-blackout" : "blackout");

  if (!bypassUnlock && !canUseBlackoutSkill()) {
    const bestProgress = Math.max(state.pet.rage, getDailyRageValue());
    const gap = Math.max(0, 200 - bestProgress);
    state.pet.lastLine = `黑屏结界还差 ${formatRage(gap)}。软团滋养或今日怨气到 200，我就能把世界静音一会儿。`;
    renderSummary();
    return;
  }
  state.pet.lastLine = automatic
    ? "每日怨气过载，黑屏结界自动张开。你不用道歉，今天确实吵。"
    : "黑屏结界已张开。假装关机四秒钟，让世界先闭嘴。";
  addPetLog(
    automatic ? "每日怨气触发黑屏" : "释放黑屏结界",
    automatic ? "今日怨气达到 200，自动触发黑屏结界和怨气裂纹特效。" : "应用内黑屏特效已触发，数秒后自动散去。"
  );
  persistSettings();
  renderSummary();

  const api = getDesktopApi();
  if (api?.trigger_blackout) {
    api.trigger_blackout({ automatic, duration });
  }

  if (!els.rageBlackout) return;
  clearTimeout(runtime.blackoutTimer);
  els.rageBlackout.hidden = false;
  els.rageBlackout.dataset.mode = automatic ? "auto" : "manual";
  requestAnimationFrame(() => els.rageBlackout.classList.add("active"));
  runtime.blackoutTimer = setTimeout(() => {
    els.rageBlackout.classList.remove("active");
    setTimeout(() => {
      els.rageBlackout.hidden = true;
    }, 220);
  }, duration);
}

function startPetGame() {
  markPetInteraction("pet-game");
  runtime.petGameActive = true;
  runtime.petGameScore = 0;
  state.pet.lastLine = "来，抓住那团乱跑的怨气。抓到五下，我给你炼点小奖励。";
  if (els.petGamePanel) {
    els.petGamePanel.hidden = false;
  }
  if (VIEW_MODE === "widget" && isDesktopApiAvailable()) {
    const api = getDesktopApi();
    if (api?.focus_screen) {
      api.focus_screen("pet");
    }
  } else {
    setActiveScreen("pet");
  }
  movePetGameTarget();
  renderSummary();
}

function movePetGameTarget() {
  if (!els.petGameTarget) return;
  const left = 12 + Math.round(Math.random() * 68);
  const top = 18 + Math.round(Math.random() * 54);
  els.petGameTarget.style.left = `${left}%`;
  els.petGameTarget.style.top = `${top}%`;
}

function hitPetGameTarget() {
  if (!runtime.petGameActive) {
    startPetGame();
    return;
  }
  runtime.petGameScore += 1;
  if (runtime.petGameScore >= 5) {
    runtime.petGameActive = false;
    const reward = 18 + getPetStage().level * 6;
    addRageCoins(reward, "怨气追逐完成");
    state.pet.affection = Math.min(100, state.pet.affection + 5);
    state.pet.gameBest = Math.max(state.pet.gameBest, runtime.petGameScore);
    state.pet.lastLine = `抓得不错，奖励 ${formatRage(reward)}。你这手速，适合闪避临时需求。`;
    addPetLog("怨气追逐完成", `小游戏完成，获得 ${formatRage(reward)}，亲密度 +5。`);
    if (els.petGamePanel) {
      els.petGamePanel.hidden = true;
    }
    persistSettings();
    renderSummary();
    return;
  }
  state.pet.gameBest = Math.max(state.pet.gameBest, runtime.petGameScore);
  movePetGameTarget();
  renderPet();
}

function clampDuelValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createDuelActor(kind, overrides = {}) {
  const isPlayer = kind === "player";
  const guard = isPlayer ? 72 : overrides.guard || 64;
  return {
    x: isPlayer ? 18 : 74,
    y: 62,
    hp: 100,
    facing: isPlayer ? 1 : -1,
    attackTimer: 0,
    attackType: "",
    hitCooldown: 0,
    hitFlash: 0,
    dashCooldown: 0,
    invulnTimer: 0,
    guard,
    maxGuard: guard,
    guarding: false,
    guardTimer: 0,
    moving: false,
    ...(isPlayer
      ? { energy: 36, maxEnergy: 100, skillCooldowns: { uppercut: 0, blast: 0, heal: 0, dash: 0, guard: 0 } }
      : { mana: 0, maxMana: 0, aiTimer: 0 }),
    ...overrides
  };
}

function resetDuelState() {
  const stats = getPetStats();
  const mana = clampPetMana();
  const enemyGuard = Math.min(84, 54 + stats.stage.level * 6 + Math.floor(stats.defense / 2));
  runtime.duelState = {
    player: createDuelActor("player"),
    enemy: createDuelActor("enemy", {
      mana,
      maxMana: stats.maxMana,
      guard: enemyGuard,
      maxGuard: enemyGuard
    }),
    combo: 0,
    comboTimer: 0,
    matchBestCombo: 0,
    fxText: "",
    fxTimer: 0,
    phase: "待命中",
    resultText: "",
    resultTimer: 0,
    cameraShake: 0,
    status: "WASD 走位，J 普通拳，K 反弹脚，I 嘴替暴击，L 怨气波，H 安抚回血，Shift 格挡，Q/E 闪身。",
    onlinePreview: false
  };
}

function startPetDuel() {
  markPetInteraction("pet-duel");
  togglePetRadialMenu(false);
  resetDuelState();
  runtime.duelKeys.clear();
  runtime.duelActive = true;
  runtime.duelState.onlinePreview = false;
  runtime.duelState.phase = "开打中";
  runtime.duelState.resultText = "开打";
  runtime.duelState.resultTimer = 18;
  
  els.body.classList.add("duel-active");
  if (els.desktopDuelOverlay) {
    els.desktopDuelOverlay.hidden = false;
  }
  runtime.duelState.desktopMode = true;
  
  state.pet.lastLine = "来，正面对战。你控制自己，我控制怨念，看看今天谁更硬。";
  addPetLog("工位对战开启", "WSAD 控制走位，J 普通拳，K 反弹脚，I 嘴替暴击，L 怨气波，H 安抚回血，Shift 格挡，Q/E 闪身。");
  renderSummary();
  runPetDuelLoop();
}

function endPetDuel(result) {
  runtime.duelActive = false;
  window.clearTimeout(runtime.duelLoop);
  runtime.duelLoop = null;
  state.pet.mana = Math.max(0, Math.round(runtime.duelState.enemy.mana || 0));
  const matchBestCombo = Math.max(runtime.duelState.matchBestCombo || 0, runtime.duelState.combo || 0);
  if (result === "win") {
    state.pet.battleWins += 1;
    const reward = 26 + getPetStage().level * 8 + Math.min(18, matchBestCombo * 2);
    addRageCoins(reward, "工位对战胜利");
    state.pet.affection = Math.min(100, state.pet.affection + 6);
    runtime.duelState.phase = "胜局已定";
    runtime.duelState.resultText = "你赢了";
    runtime.duelState.resultTimer = 42;
    state.pet.lastLine = `这一局你赢了。奖励 ${formatRage(reward)}，看样子你今天还没被生活打散。`;
    addPetLog("工位对战胜利", `工位对战获胜，获得 ${formatRage(reward)}，最佳连段 ${matchBestCombo}。`);
  } else if (result === "lose") {
    state.pet.battleLosses += 1;
    runtime.duelState.phase = "节奏断了";
    runtime.duelState.resultText = "被老板怨念体压制";
    runtime.duelState.resultTimer = 42;
    state.pet.lastLine = "这局算我替现实赢了一次。没事，再开一把，把节奏抢回来。";
    addPetLog("工位对战失利", "这次被老板怨念体压制了，建议多用走位拉开再反打。");
  }
  state.pet.battleBestCombo = Math.max(state.pet.battleBestCombo, matchBestCombo);
  persistSettings();
  renderSummary();
  setTimeout(() => {
    els.body.classList.remove("duel-active");
    if (els.desktopDuelOverlay) {
      els.desktopDuelOverlay.hidden = true;
    }
  }, 2400);
}

function performPlayerAttack(type) {
  if (!runtime.duelActive) return;
  if (type === "guard") {
    startPlayerGuardBurst();
    return;
  }
  if (type === "dash") {
    performPlayerDash(runtime.duelState.player.facing);
    return;
  }
  if (type === "heal") {
    performPlayerHeal();
    return;
  }
  const move = duelMoves[type];
  if (!move) return;
  const actor = runtime.duelState.player;
  if (actor.attackTimer > 0) return;
  if ((actor.skillCooldowns?.[type] || 0) > 0) {
    runtime.duelState.status = `${move.label}还在收招，先用走位把距离吃回来。`;
    return;
  }
  if (actor.energy < move.cost) {
    runtime.duelState.phase = "爆发不足";
    runtime.duelState.status = `${move.label}需要 ${move.cost} 点爆发，先用拳脚命中或格挡攒回来。`;
    return;
  }
  actor.energy = Math.max(0, actor.energy - move.cost);
  if (move.cooldown > 0 && actor.skillCooldowns) {
    actor.skillCooldowns[type] = move.cooldown;
  }
  actor.guarding = false;
  actor.attackType = type;
  actor.attackTimer = move.timer;
  actor.facing = runtime.duelState.enemy.x >= actor.x ? 1 : -1;
  runtime.duelState.phase = move.playerPhase;
  attemptHit("player", type);
}

function performPlayerHeal() {
  const actor = runtime.duelState.player;
  const move = duelMoves.heal;
  if (!runtime.duelActive || actor.attackTimer > 0) return;
  if ((actor.skillCooldowns?.heal || 0) > 0) {
    runtime.duelState.status = "安抚回血还在冷却，先格挡或者闪身拖一下。";
    return;
  }
  if (actor.energy < move.cost) {
    runtime.duelState.phase = "爆发不足";
    runtime.duelState.status = `安抚回血需要 ${move.cost} 点爆发，先用普通拳或格挡把节奏拿回来。`;
    return;
  }

  const healAmount = Math.min(34, 18 + Math.floor((Number(state.pet.affection) || 0) / 8) + Math.floor((Number(state.pet.light) || 0) / 80));
  const beforeHp = actor.hp;
  actor.energy = Math.max(0, actor.energy - move.cost);
  actor.hp = Math.min(100, actor.hp + healAmount);
  actor.guard = Math.min(actor.maxGuard, actor.guard + 10);
  actor.attackType = "heal";
  actor.attackTimer = move.timer;
  actor.guarding = false;
  actor.skillCooldowns.heal = move.cooldown;
  runtime.duelState.combo = 0;
  runtime.duelState.comboTimer = 0;
  runtime.duelState.fxText = `回血 +${Math.round(actor.hp - beforeHp)}`;
  runtime.duelState.fxTimer = 18;
  runtime.duelState.cameraShake = 2;
  runtime.duelState.phase = move.playerPhase;
  runtime.duelState.status = "安抚回血生效：先把自己救回来，再继续处理老板怨念体。";
}

function performEnemyAttack(type) {
  const stats = getPetStats();
  const enemy = runtime.duelState.enemy;
  if (enemy.attackTimer > 0) return;
  let cost = 0;
  if (type === "blast") cost = stats.spellCost;
  if (type === "uppercut") cost = Math.max(14, Math.round(stats.spellCost * 0.72));
  if (cost > 0 && enemy.mana < cost) {
    type = Math.random() > 0.48 ? "kick" : "punch";
  } else if (cost > 0) {
    enemy.mana = Math.max(0, enemy.mana - cost);
  }
  const chosenMove = duelMoves[type] || duelMoves.punch;
  enemy.guarding = false;
  enemy.attackType = type;
  enemy.attackTimer = chosenMove.timer + 2;
  enemy.facing = runtime.duelState.player.x >= enemy.x ? 1 : -1;
  runtime.duelState.phase = chosenMove.enemyPhase;
  attemptHit("enemy", type);
}

function startPlayerGuardBurst() {
  const actor = runtime.duelState.player;
  if (!runtime.duelActive || actor.guard <= 0 || actor.attackTimer > 0) return;
  actor.guardTimer = 18;
  actor.guarding = true;
  actor.skillCooldowns.guard = 10;
  runtime.duelState.phase = "你架住防线";
  runtime.duelState.status = "格挡会削掉大部分伤害，防御条打空会被破防。";
}

function performPlayerDash(direction) {
  const actor = runtime.duelState.player;
  if (!runtime.duelActive || actor.dashCooldown > 0 || actor.attackTimer > 0) return;
  const dashDirection = direction || actor.facing || 1;
  actor.facing = dashDirection;
  actor.x = clampDuelValue(actor.x + dashDirection * 10, 6, 92);
  actor.attackType = "dash";
  actor.attackTimer = 8;
  actor.invulnTimer = 7;
  actor.dashCooldown = 18;
  actor.guarding = false;
  actor.energy = Math.min(actor.maxEnergy, actor.energy + 4);
  if (actor.skillCooldowns) actor.skillCooldowns.dash = 18;
  runtime.duelState.phase = dashDirection > 0 ? "你向前闪身" : "你后撤闪身";
  runtime.duelState.status = "闪身有极短无敌，适合躲软团的起手再反打。";
}

function attemptHit(side, type) {
  const source = side === "player" ? runtime.duelState.player : runtime.duelState.enemy;
  const target = side === "player" ? runtime.duelState.enemy : runtime.duelState.player;
  const move = duelMoves[type] || duelMoves.punch;
  if (target.hitCooldown > 0 || target.invulnTimer > 0) return;
  const distance = Math.abs(source.x - target.x) + Math.abs(source.y - target.y) * 0.6;
  const direction = target.x >= source.x ? 1 : -1;
  const facingTarget = source.facing === direction || type === "blast";
  if (distance > move.reach || !facingTarget) {
    if (side === "player") {
      runtime.duelState.status = move.miss;
      runtime.duelState.phase = "你的节奏略空";
    }
    return;
  }
  const stats = getPetStats();
  const comboBoost = side === "player" ? Math.min(8, Math.floor(runtime.duelState.combo / 2) * 2) : 0;
  const enemyBoost = side === "enemy" ? Math.floor(stats.attack / 5) : 0;
  const spellBoost = side === "enemy" && type === "blast" ? Math.floor(stats.spellPower / 3) : 0;
  const crit = side === "enemy" && Math.random() * 100 < stats.crit;
  let damage = move.damage + comboBoost + enemyBoost + spellBoost + (crit ? 7 : 0);
  const blocked = target.guarding && target.guard > 0 && target.facing === -direction;
  source.facing = direction;
  target.facing = -direction;
  let knockback = direction * move.knockback;
  if (blocked) {
    target.guard = Math.max(0, target.guard - move.guardBreak);
    damage = Math.max(2, Math.round(damage * 0.34));
    knockback *= 0.42;
    if (target.guard <= 0) {
      damage += 5;
      target.guarding = false;
      target.hitCooldown = 12;
      runtime.duelState.phase = side === "player" ? "你打出破防" : "你被打破防";
    } else {
      target.hitCooldown = 4;
    }
  } else {
    target.hitCooldown = type === "blast" || type === "uppercut" ? 10 : 8;
  }
  target.hp = Math.max(0, target.hp - damage);
  target.hitFlash = blocked ? 4 : 7;
  target.x = clampDuelValue(target.x + knockback, 6, 92);
  if (side === "player") {
    source.energy = Math.min(source.maxEnergy, source.energy + move.energyGain + (blocked ? 3 : 0));
  }
  runtime.duelState.fxText = blocked
    ? `格挡 -${damage}`
    : side === "player"
      ? `${move.playerHit} -${damage}`
      : `${move.enemyHit}${crit ? "暴击" : ""} -${damage}`;
  runtime.duelState.fxTimer = type === "blast" || type === "uppercut" ? 16 : 11;
  runtime.duelState.cameraShake = type === "blast" || type === "uppercut" ? 8 : 4;
  if (side === "player") {
    runtime.duelState.combo += 1;
    runtime.duelState.comboTimer = 72;
    runtime.duelState.matchBestCombo = Math.max(runtime.duelState.matchBestCombo, runtime.duelState.combo);
    runtime.duelState.phase = runtime.duelState.combo >= 4 ? "你已打出连段压制" : blocked ? "对方架住了" : "你正在追击";
    runtime.duelState.status = blocked
      ? "老板怨念体把这一招挡住了，换节奏或用怨气波磨防。"
      : type === "blast"
        ? "怨气波命中，距离优势拿到了。"
        : type === "uppercut"
          ? "嘴替暴击命中，老板怨念体被你从进攻里挑出来。"
          : `${move.label}命中，连段继续。`;
  } else {
    if (!blocked) {
      runtime.duelState.combo = 0;
      runtime.duelState.comboTimer = 0;
    }
    runtime.duelState.phase = blocked ? "你稳住了防线" : "老板怨念体反扑中";
    runtime.duelState.status = blocked
      ? "你把这下挡住了，爆发回了一点，马上可以反打。"
      : type === "blast"
        ? "老板怨念体的怨气波轰了过来，别直线吃法术。"
        : `${move.label}打到你，节奏被断。`;
    if (blocked) {
      target.energy = Math.min(target.maxEnergy, target.energy + 8);
    }
  }
}

function updateEnemyAI() {
  const { player, enemy } = runtime.duelState;
  if (enemy.hp <= 0 || player.hp <= 0) return;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const distance = Math.abs(dx) + Math.abs(dy) * 0.6;
  enemy.moving = false;
  enemy.facing = dx > 0 ? 1 : -1;
  if (enemy.aiTimer > 0) {
    enemy.aiTimer -= 1;
    return;
  }
  if (player.attackTimer > 0 && distance < 17 && enemy.guard > 10 && Math.random() > 0.35) {
    enemy.guarding = true;
    enemy.aiTimer = 5;
    runtime.duelState.phase = "老板怨念体架起防线";
    return;
  }
  enemy.guarding = false;
  if (distance > 28 && enemy.mana >= getPetStats().spellCost && Math.random() > 0.72) {
    performEnemyAttack("blast");
    enemy.aiTimer = 12;
    return;
  }
  if (Math.abs(dx) > 9) {
    const speed = distance > 26 ? 0.38 : 0.28;
    enemy.x += dx > 0 ? speed : -speed;
    enemy.moving = true;
    enemy.facing = dx > 0 ? 1 : -1;
    if (Math.abs(dx) > 20) {
      runtime.duelState.phase = "老板怨念体逼近中";
    }
  } else if (Math.abs(dy) > 3) {
    enemy.y += dy > 0 ? 0.2 : -0.2;
    enemy.moving = true;
  } else if (enemy.attackTimer <= 0) {
    const canSpend = enemy.mana >= Math.max(14, Math.round(getPetStats().spellCost * 0.72));
    const roll = Math.random();
    const type = canSpend && roll > 0.76 ? "uppercut" : roll > 0.5 ? "kick" : "punch";
    performEnemyAttack(type);
    enemy.aiTimer = type === "punch" ? 6 : 10;
  }
}

function updateDuelMotion() {
  const { player, enemy } = runtime.duelState;
  const keys = runtime.duelKeys;
  player.moving = false;
  const moveScale = player.guarding ? 0.46 : player.attackTimer > 0 ? 0.58 : 1;
  if (keys.has("a")) {
    player.x = Math.max(6, player.x - 0.42 * moveScale);
    player.facing = -1;
    player.moving = true;
  }
  if (keys.has("d")) {
    player.x = Math.min(92, player.x + 0.42 * moveScale);
    player.facing = 1;
    player.moving = true;
  }
  if (keys.has("w")) {
    player.y = Math.max(24, player.y - 0.35 * moveScale);
    player.moving = true;
  }
  if (keys.has("s")) {
    player.y = Math.min(80, player.y + 0.35 * moveScale);
    player.moving = true;
  }
  player.guarding = (keys.has("shift") || player.guardTimer > 0) && player.guard > 0 && player.attackTimer <= 0;
  if (player.guarding) {
    player.guard = Math.max(0, player.guard - 1.25);
    player.energy = Math.min(player.maxEnergy, player.energy + 0.24);
    if (player.guard <= 0) {
      player.guarding = false;
      player.skillCooldowns.guard = 34;
      runtime.duelState.phase = "防线被压空";
      runtime.duelState.status = "防御条空了，先闪身拉开等它恢复。";
    }
  } else {
    player.guard = Math.min(player.maxGuard, player.guard + 0.52);
  }
  if (!enemy.guarding) {
    enemy.guard = Math.min(enemy.maxGuard, enemy.guard + 0.32);
  } else {
    enemy.guard = Math.max(0, enemy.guard - 0.58);
  }
  player.energy = Math.min(player.maxEnergy, player.energy + 0.22);
  enemy.mana = Math.min(enemy.maxMana, enemy.mana + 0.18);
  [player, enemy].forEach((actor) => {
    actor.attackTimer = Math.max(0, actor.attackTimer - 1);
    actor.hitCooldown = Math.max(0, actor.hitCooldown - 1);
    actor.hitFlash = Math.max(0, (actor.hitFlash || 0) - 1);
    actor.dashCooldown = Math.max(0, (actor.dashCooldown || 0) - 1);
    actor.invulnTimer = Math.max(0, (actor.invulnTimer || 0) - 1);
    actor.guardTimer = Math.max(0, (actor.guardTimer || 0) - 1);
    if (actor.skillCooldowns) {
      Object.keys(actor.skillCooldowns).forEach((skill) => {
        actor.skillCooldowns[skill] = Math.max(0, actor.skillCooldowns[skill] - 1);
      });
    }
    if (actor.attackTimer === 0) {
      actor.attackType = "";
    }
  });
  if (runtime.duelState.comboTimer > 0) {
    runtime.duelState.comboTimer -= 1;
  } else if (runtime.duelState.combo > 0) {
    runtime.duelState.combo = 0;
    runtime.duelState.phase = "连段窗口重置";
  }
  runtime.duelState.fxTimer = Math.max(0, runtime.duelState.fxTimer - 1);
  if (runtime.duelState.fxTimer === 0) {
    runtime.duelState.fxText = "";
  }
  runtime.duelState.resultTimer = Math.max(0, runtime.duelState.resultTimer - 1);
  runtime.duelState.cameraShake = Math.max(0, runtime.duelState.cameraShake - 1);
  if (runtime.duelState.resultTimer === 0 && !runtime.duelActive) {
    runtime.duelState.resultText = "";
  }
}

function runPetDuelLoop() {
  if (!runtime.duelActive) return;
  updateDuelMotion();
  updateEnemyAI();
  renderPetDuel();
  const { player, enemy } = runtime.duelState;
  if (enemy.hp <= 0) {
    endPetDuel("win");
    return;
  }
  if (player.hp <= 0) {
    endPetDuel("lose");
    return;
  }
  runtime.duelLoop = window.setTimeout(runPetDuelLoop, 40);
}

function previewOnlineBattle() {
  markPetInteraction("pet-online-preview");
  if (VIEW_MODE === "widget") toggleWidgetPetMenu(true);
  if (els.petDuelPanelMain) {
    els.petDuelPanelMain.hidden = false;
  }
  runtime.duelActive = false;
  runtime.duelState.onlinePreview = true;
  runtime.duelState.phase = "联机预演中";
  runtime.duelState.resultText = "房间位预留";
  runtime.duelState.resultTimer = 36;
  runtime.duelState.status = pickRandom(petBattleOnlineCopy);
  state.pet.lastLine = "联机不是不能做，是现在先把单机体验打磨到够上头。";
  addPetLog("联机预演", "已展示联机对战的预留方向：房间、匹配、同步和战绩。");
  persistSettings();
  renderSummary();
}

function handleDuelKeydown(event) {
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d", "j", "k", "i", "l", "h", "q", "e", "shift"].includes(key)) {
    event.preventDefault();
  }
  if (["w", "a", "s", "d", "shift"].includes(key)) {
    runtime.duelKeys.add(key);
    return;
  }
  if (key === "q") {
    performPlayerDash(-runtime.duelState.player.facing);
    return;
  }
  if (key === "e") {
    performPlayerDash(runtime.duelState.player.facing);
    return;
  }
  if (key === "j") {
    performPlayerAttack("punch");
    return;
  }
  if (key === "k") {
    performPlayerAttack("kick");
    return;
  }
  if (key === "i") {
    performPlayerAttack("uppercut");
    return;
  }
  if (key === "l") {
    performPlayerAttack("blast");
    return;
  }
  if (key === "h") {
    performPlayerAttack("heal");
  }
}

function handleDuelKeyup(event) {
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d", "shift"].includes(key)) {
    runtime.duelKeys.delete(key);
  }
}

function resetAllData() {
  if (!confirm("确定要重置所有数据吗？包括额度、怨气、软团、交易记录、背包物品和心愿点亮进度。此操作不可撤销。")) return;
  localStorage.removeItem(STORAGE_KEY);
  Object.assign(state, {
    ...defaultState,
    unlockedParts: [...defaultState.unlockedParts],
    inventory: { ...defaultState.inventory },
    pet: { ...defaultState.pet },
    transactions: defaultState.transactions.map((item) => ({ ...item })),
    usageLog: [],
    petLog: defaultState.petLog.map((item) => ({ ...item }))
  });
  normalizeState();
  runtime.petGameActive = false;
  runtime.petGameScore = 0;
  resetDuelState();
  runtime.duelActive = false;
  if (els.petGamePanel) {
    els.petGamePanel.hidden = true;
  }
  syncSetupControls();
  syncSettingsControls();
  renderSummary();
}

function isDesktopApiAvailable() {
  return Boolean(window.wageclawDesktop);
}

function getDesktopApi() {
  if (window.wageclawDesktop) {
    return {
      focus_screen: window.wageclawDesktop.focusScreen,
      set_widget_mode: window.wageclawDesktop.setWidgetOnTop,
      open_main_panel: window.wageclawDesktop.openMainPanel,
      toggle_pet: window.wageclawDesktop.togglePet,
      pet_command: window.wageclawDesktop.petCommand,
      trigger_blackout: window.wageclawDesktop.triggerBlackout,
      pet_ricochet: window.wageclawDesktop.petRicochet,
      pet_storm: window.wageclawDesktop.petStorm,
      pet_nuke: window.wageclawDesktop.petNuke,
      pet_resize: window.wageclawDesktop.petResize,
      show_pet: window.wageclawDesktop.showPet,
      on_navigate: window.wageclawDesktop.onNavigate,
      on_pet_command: window.wageclawDesktop.onPetCommand
    };
  }
  return null;
}

function setupViewMode() {
  if (VIEW_MODE === "widget") {
    els.body.classList.add("widget-only");
    toggleWidgetPetMenu(false);
  } else if (VIEW_MODE === "pet") {
    els.body.classList.add("pet-only");
    state.pet.summoned = true;
  }
}

function bindDesktopBridge() {
  const api = getDesktopApi();
  if (api?.on_navigate) {
    api.on_navigate((payload) => {
      if (payload?.screen) {
        setActiveScreen(payload.screen);
      }
    });
  }
  if (api?.on_pet_command) {
    api.on_pet_command((payload) => executePetCommand(payload));
  }
  window.addEventListener("wageclaw:navigate", (event) => {
    if (event.detail?.screen) {
      setActiveScreen(event.detail.screen);
    }
  });
  window.addEventListener("wageclaw:pet-command", (event) => {
    executePetCommand(event.detail);
  });
}

function startPetAmbientLoop() {
  clearInterval(runtime.petAmbientTimer);
  runtime.petAmbientTimer = setInterval(() => {
    triggerPetAmbientLine(false);
    maybeTriggerPetBusinessHint("");
  }, 60000);
}

const petIdleAnimations = ["idle-bounce", "idle-hop", "idle-wiggle", "idle-squash"];

function triggerPetIdleAnimation() {
  if (!els.summonedPet || els.summonedPet.hidden) return;
  if (els.summonedPet.classList.contains("dragging")) return;
  const anim = petIdleAnimations[Math.floor(Math.random() * petIdleAnimations.length)];
  els.summonedPet.classList.remove(...petIdleAnimations);
  void els.summonedPet.offsetWidth;
  els.summonedPet.classList.add(anim);
  setTimeout(() => {
    if (els.summonedPet) els.summonedPet.classList.remove(anim);
  }, 1400);
}

function startPetIdleLoop() {
  clearInterval(runtime.petIdleTimer);
  runtime.petIdleTimer = setInterval(() => {
    if (Math.random() < 0.55) triggerPetIdleAnimation();
  }, 3200);
}

loadStoredSettings();
normalizeState();
state.widgetView = state.widgetDefaultView;
syncSetupControls();
syncSettingsControls();
setupViewMode();
bindDesktopBridge();
resetDuelState();

els.setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  syncFromSetupForm(new FormData(event.currentTarget));
  renderSummary();
});

els.navItems.forEach((item) => {
  item.addEventListener("click", () => {
    setActiveScreen(item.dataset.screen);
  });
});

els.screenJumps.forEach((button) => {
  button.addEventListener("click", () => setActiveScreen(button.dataset.screenJump));
});

els.accountTabs.forEach((button) => {
  button.addEventListener("click", () => setAccountTab(button.dataset.accountTab));
});

els.moduleTabs.forEach((button) => {
  button.addEventListener("click", () => setModuleTab(button.dataset.moduleTab, button.dataset.tabValue));
});

document.querySelectorAll("[data-rage-action]").forEach((button) => {
  button.addEventListener("click", () => previewRageMilestone(button.dataset.rageAction));
});

els.widgetViewButtons.forEach((button) => {
  button.addEventListener("click", () => setWidgetView(button.dataset.widgetView));
});

els.chips.forEach((button) => {
  button.addEventListener("click", () => {
    els.chips.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.mood = button.dataset.mood;
    persistSettings();
    renderCoach();
    renderWidgetCards();
  });
});

if (els.partShop) {
  els.partShop.addEventListener("click", (event) => {
    const button = event.target.closest("[data-buy-part]");
    if (button) {
      buyPart(button.dataset.buyPart);
    }
  });
}

if (els.mallListEnhanced) {
  els.mallListEnhanced.addEventListener("click", (event) => {
    const button = event.target.closest("[data-buy-mall]");
    if (button) {
      buyMallItem(button.dataset.buyMall);
    }
  });
}

if (els.inventoryListEnhanced) {
  els.inventoryListEnhanced.addEventListener("click", (event) => {
    const button = event.target.closest("[data-use-item]");
    if (button) {
      useItem(button.dataset.useItem);
    }
  });
}

if (els.petSupplyList) {
  els.petSupplyList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-use-item]");
    if (button) {
      useItem(button.dataset.useItem);
    }
  });
}

if (els.refineRageButton) {
  els.refineRageButton.addEventListener("click", refineRageFromRant);
}

if (els.refineLightButton) {
  els.refineLightButton.addEventListener("click", refineLightFromRant);
}

[
  els.summonPetButton,
  els.summonPetPanelButton
].forEach((button) => {
  if (!button) return;
  button.addEventListener("click", () => setPetSummoned());
});

[
  els.petBlackoutButton,
  els.widgetPetBlackoutButton
].forEach((button) => {
  if (!button) return;
  button.addEventListener("click", triggerBlackoutSkill);
});

[
  els.petGameButton
].forEach((button) => {
  if (!button) return;
  button.addEventListener("click", startPetGame);
});

if (els.petTrainButton) {
  els.petTrainButton.addEventListener("click", cultivatePet);
}

if (els.petGameTarget) {
  els.petGameTarget.addEventListener("click", hitPetGameTarget);
}

if (els.widgetPetActionToggle) {
  els.widgetPetActionToggle.addEventListener("click", () => toggleWidgetPetMenu());
}

if (els.widgetPetPlayButton) {
  els.widgetPetPlayButton.addEventListener("click", () => {
    toggleWidgetPetMenu(true);
    startPetGame();
  });
}

if (els.widgetPetDuelButton) {
  els.widgetPetDuelButton.addEventListener("click", startPetDuel);
}

if (els.widgetPetOnlineButton) {
  els.widgetPetOnlineButton.addEventListener("click", previewOnlineBattle);
}

if (els.petDuelStartButton) {
  els.petDuelStartButton.addEventListener("click", startPetDuel);
}

if (els.petDuelOnlineButton) {
  els.petDuelOnlineButton.addEventListener("click", previewOnlineBattle);
}

if (els.petDuelStartButtonMain) {
  els.petDuelStartButtonMain.addEventListener("click", startPetDuel);
}

if (els.petDuelOnlineButtonMain) {
  els.petDuelOnlineButtonMain.addEventListener("click", previewOnlineBattle);
}

if (els.petDuelPanelButton) {
  els.petDuelPanelButton.addEventListener("click", () => {
    if (els.petDuelPanelMain) {
      els.petDuelPanelMain.hidden = false;
    }
    startPetDuel();
  });
}

if (els.petDuelArena) {
  els.petDuelArena.addEventListener("keydown", handleDuelKeydown);
  els.petDuelArena.addEventListener("keyup", handleDuelKeyup);
}

if (els.petDuelArenaMain) {
  els.petDuelArenaMain.addEventListener("keydown", handleDuelKeydown);
  els.petDuelArenaMain.addEventListener("keyup", handleDuelKeyup);
}

els.petRadialActions.forEach((button) => {
  button.addEventListener("click", () => handlePetRadialAction(button.dataset.petAction));
});

els.petDuelSkills.forEach((button) => {
  button.addEventListener("click", () => {
    const skill = button.dataset.duelSkill;
    if (els.petDuelArena) {
      els.petDuelArena.focus();
    }
    if (skill === "dash") {
      performPlayerDash(runtime.duelState.player.facing);
    } else {
      performPlayerAttack(skill);
    }
    renderPetDuel();
  });
});

if (els.petDuelSkillsMain) {
  els.petDuelSkillsMain.forEach((button) => {
    button.addEventListener("click", () => {
      const skill = button.dataset.duelSkill;
      if (els.petDuelArenaMain) {
        els.petDuelArenaMain.focus();
      }
      if (skill === "dash") {
        performPlayerDash(runtime.duelState.player.facing);
      } else {
        performPlayerAttack(skill);
      }
      renderPetDuel();
    });
  });
}

if (els.deskDuelSkills) {
  els.deskDuelSkills.forEach((button) => {
    button.addEventListener("click", () => {
      const skill = button.dataset.duelSkill;
      if (skill === "dash") {
        performPlayerDash(runtime.duelState.player.facing);
      } else {
        performPlayerAttack(skill);
      }
      renderPetDuel();
    });
  });
}

window.addEventListener("keydown", (event) => {
  if (document.activeElement === els.petDuelArena || document.activeElement === els.petDuelArenaMain || runtime.duelActive) {
    handleDuelKeydown(event);
  }
});
window.addEventListener("keyup", handleDuelKeyup);

els.petTouchButtons.forEach((button) => {
  button.addEventListener("click", (event) => handlePetTouch(button.dataset.petTouch, event));
});

(function setupPetDrag() {
  if (!els.summonedPet) return;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let hasMoved = false;
  let dragThreshold = 5;

  const isDesktop = isDesktopApiAvailable();
  if (isDesktop) dragThreshold = 3;

  function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    currentX += dx;
    currentY += dy;
    startX = e.clientX;
    startY = e.clientY;

    if (Math.abs(currentX) > dragThreshold || Math.abs(currentY) > dragThreshold) {
      hasMoved = true;
    }
    registerPetShake(dx);

    if (!isDesktop && els.summonedPet) {
      const rect = els.summonedPet.getBoundingClientRect();
      els.summonedPet.style.left = `${rect.left + dx}px`;
      els.summonedPet.style.top = `${rect.top + dy}px`;
      els.summonedPet.style.right = "auto";
      els.summonedPet.style.bottom = "auto";
    }

    if (isDesktop && window.wageclawDesktop?.petDragMove) {
      window.wageclawDesktop.petDragMove(dx, dy);
    }
  }

  function onMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    els.summonedPet.style.cursor = "grab";
    els.summonedPet.classList.remove("dragging");
    if (!hasMoved) {
      handleSummonedPetClick(e);
    }
  }

  els.summonedPet.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;
    markPetInteraction("pet-drag");
    isDragging = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    currentX = 0;
    currentY = 0;
    els.summonedPet.style.cursor = "grabbing";
    els.summonedPet.classList.add("dragging");
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  document.addEventListener("click", (e) => {
    if (!els.summonedPetBubble || els.summonedPetBubble.hidden) return;
    if (els.summonedPet.contains(e.target) || els.summonedPetBubble.contains(e.target)) return;
    hidePetBubble();
  });

  els.summonedPet.style.cursor = "grab";
})();

if (els.rageBlackout) {
  els.rageBlackout.addEventListener("click", () => {
    clearTimeout(runtime.blackoutTimer);
    els.rageBlackout.classList.remove("active");
    setTimeout(() => {
      els.rageBlackout.hidden = true;
    }, 180);
  });
}

if (els.petMallButton) {
  els.petMallButton.addEventListener("click", () => {
    state.mallFilter = "pet";
    document.querySelectorAll(".mall-category-filters .filter-chip").forEach((item) => {
      item.classList.toggle("active", item.dataset.mallFilter === "pet");
    });
    setActiveScreen("mall");
    renderMall();
  });
}

if (els.quickMallPreview) {
  els.quickMallPreview.addEventListener("click", (event) => {
    const button = event.target.closest("[data-screen-jump]");
    if (button) {
      setActiveScreen(button.dataset.screenJump);
    }
  });
}

document.querySelectorAll(".transaction-filters .filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".transaction-filters .filter-chip").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.transactionFilter = button.dataset.filter;
    persistSettings();
    renderWallet();
  });
});

document.querySelectorAll(".mall-category-filters .filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mall-category-filters .filter-chip").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.mallFilter = button.dataset.mallFilter;
    persistSettings();
    renderMall();
  });
});

els.claimWalletButton.addEventListener("click", claimDailyWallet);
els.coachButton.addEventListener("click", renderCoach);

els.maskToggle.addEventListener("click", () => {
  state.masked = !state.masked;
  persistSettings();
  renderWidgetCards();
  if (isDesktopApiAvailable()) {
    getDesktopApi().set_widget_mode(!state.masked);
  }
});

if (els.openMainPanel) {
  els.openMainPanel.addEventListener("click", () => {
    const api = getDesktopApi();
    if (api?.open_main_panel) {
      api.open_main_panel();
    }
  });
}

els.saveSettings.addEventListener("click", syncFromSettingsForm);
els.themeSelect.addEventListener("change", syncFromSettingsForm);
els.countModeSelect.addEventListener("change", syncFromSettingsForm);
els.widgetDefaultViewSelect.addEventListener("change", syncFromSettingsForm);
els.startTimeInput.addEventListener("change", syncFromSettingsForm);
els.endTimeInput.addEventListener("change", syncFromSettingsForm);
els.paydayInput.addEventListener("change", syncFromSettingsForm);

if (els.resetDataButton) {
  els.resetDataButton.addEventListener("click", resetAllData);
}

renderSummary();
setActiveScreen("converter");
triggerPetAmbientLine(true);
maybeTriggerPetBusinessHint("init");
startPetAmbientLoop();
startPetIdleLoop();
startPetFocusReminderLoop();
setInterval(renderCountdownPanels, 1000);
startBalanceTicker();
