import type { CountMode, MallItem, Mood, Part, PetStage, PetStyle, ScreenKey, Theme, TransactionCategory } from "@/types";

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

type PetStageDraft = Omit<PetStage, "id" | "level" | "threshold" | "style"> & {
  idSuffix: string;
};

function buildPetStyleStages(style: Exclude<PetStyle, "rageBlob">, drafts: PetStageDraft[]): PetStage[] {
  return drafts.map(({ idSuffix, ...draft }, index) => ({
    ...draft,
    id: `${style}-${idSuffix}`,
    style,
    level: index + 1,
    threshold: petStages[index]?.threshold ?? 0
  }));
}

const capybaraZenStages: PetStageDraft[] = [
  {
    idSuffix: "seed",
    name: "无争小团",
    title: "卡皮巴拉佛系初醒",
    avatar: "水",
    sigil: "静",
    visual: "一小团暖棕色卡皮巴拉缩在水边，头顶一片嫩叶，表情像已经原谅了全世界。",
    temperament: "不争不抢，先替你把情绪泡进温水里。",
    features: ["嫩叶", "温水", "闭眼"],
    palette: { body: "#b88959", belly: "#f2d7a7", accent: "#6e8b5d", glow: "#c9e8b4", eye: "#332417", shadow: "#5c3e28" },
    line: "先别急着赢，今天能不被带跑就已经很好了。"
  },
  {
    idSuffix: "leaf",
    name: "荷叶躺平兽",
    title: "摸鱼水面漂浮体",
    avatar: "叶",
    sigil: "躺",
    visual: "抱着荷叶在水面慢慢漂，旁边飘着小气泡，像把待办先放到了岸上。",
    temperament: "会把紧张感稀释成可以呼吸的节奏。",
    features: ["荷叶", "气泡", "慢漂"],
    palette: { body: "#bd9161", belly: "#f5dbb1", accent: "#5b9471", glow: "#bde6d2", eye: "#382819", shadow: "#62442a" },
    line: "我漂一下，你也漂一下，事情不会因为我们吸气而塌掉。"
  },
  {
    idSuffix: "tea",
    name: "热茶卡皮",
    title: "办公桌温吞守卫",
    avatar: "茶",
    sigil: "茶",
    visual: "披着浅绿色小围巾，捧着一杯热茶，尾巴旁有一小摞被驯服的消息。",
    temperament: "很慢，但会稳稳地替你挡住催促。",
    features: ["热茶", "围巾", "消息堆"],
    palette: { body: "#c29665", belly: "#f7dfb8", accent: "#719b64", glow: "#d9c07b", eye: "#352514", shadow: "#64452b" },
    line: "先喝一口。对方急，不等于你必须乱。"
  },
  {
    idSuffix: "cushion",
    name: "蒲团静修兽",
    title: "会议噪音钝化器",
    avatar: "蒲",
    sigil: "缓",
    visual: "坐在圆蒲团上，身边绕着几粒小木鱼光点，把会议噪音压成低频嗡嗡。",
    temperament: "佛系但不软弱，能把噪声降到可处理。",
    features: ["蒲团", "木鱼光", "降噪"],
    palette: { body: "#b88354", belly: "#efd19d", accent: "#8d9d55", glow: "#efe0a1", eye: "#2f2115", shadow: "#593b25" },
    line: "听见了，但不必全部接住。"
  },
  {
    idSuffix: "bamboo",
    name: "竹影卡皮僧",
    title: "边界感入门导师",
    avatar: "竹",
    sigil: "界",
    visual: "穿着短短竹青外袍，背后有几片竹影，爪边立着一块写给自己的边界石。",
    temperament: "温和地说不，把拒绝说得像天气一样自然。",
    features: ["竹袍", "边界石", "微笑"],
    palette: { body: "#a9774a", belly: "#f0d5a6", accent: "#527d56", glow: "#a8d68d", eye: "#322214", shadow: "#51351f" },
    line: "可以帮，但要有范围；可以快，但不能无限快。"
  },
  {
    idSuffix: "spring",
    name: "温泉无事君",
    title: "加班蒸汽缓释形",
    avatar: "泉",
    sigil: "息",
    visual: "半个身体泡在小温泉里，头上顶着热毛巾，蒸汽里藏着被熄火的怨气。",
    temperament: "把爆炸倒计时改成泡澡计时。",
    features: ["温泉", "热毛巾", "蒸汽"],
    palette: { body: "#bd8653", belly: "#f4d8a5", accent: "#659c8b", glow: "#b7efe2", eye: "#362616", shadow: "#5b3a20" },
    line: "热气上来了，火气就不用再上来了。"
  },
  {
    idSuffix: "bonsai",
    name: "盆景看破者",
    title: "需求风浪旁观席",
    avatar: "景",
    sigil: "看",
    visual: "坐在小盆景旁，披着苔绿色披风，看需求风暴绕过去而不是撞上来。",
    temperament: "能看穿不合理，但不急着消耗自己证明。",
    features: ["盆景", "苔绿披风", "风环"],
    palette: { body: "#a96f45", belly: "#efc987", accent: "#4b7454", glow: "#d8bf67", eye: "#2b1e13", shadow: "#4d2f1c" },
    line: "有些风只需要看着它过去，不需要站起来和它打架。"
  },
  {
    idSuffix: "monk",
    name: "不争禅师",
    title: "低血压反击大师",
    avatar: "禅",
    sigil: "稳",
    visual: "戴着小木珠，背后有一圈淡淡圆光，爪里握着一枚写着稍后处理的竹签。",
    temperament: "非常稳，稳到别人催你也催不动。",
    features: ["木珠", "圆光", "竹签"],
    palette: { body: "#9a643e", belly: "#eec485", accent: "#647f4d", glow: "#f0dc95", eye: "#271a11", shadow: "#422818" },
    line: "稍后处理不是逃避，是把主导权拿回来。"
  },
  {
    idSuffix: "lotus",
    name: "莲座卡皮尊",
    title: "职场风雨避水形",
    avatar: "莲",
    sigil: "净",
    visual: "坐在小莲座上，周围漂浮着金币和荷叶护盾，像一只温吞但很难撼动的守护灵。",
    temperament: "不卷，但会守住你真正想要的东西。",
    features: ["莲座", "荷叶盾", "金币"],
    palette: { body: "#955f3a", belly: "#eebd7c", accent: "#587d68", glow: "#f2d979", eye: "#24170f", shadow: "#3b2216" },
    line: "我们不抢风头，我们守目标。"
  },
  {
    idSuffix: "sage",
    name: "无争水豚仙",
    title: "佛系桌面终阶灵物",
    avatar: "仙",
    sigil: "安",
    visual: "最终形态披着青金色小袍，身后是温泉圆光和竹影，神情安静但非常可靠。",
    temperament: "把怨气化成定力，替你在桌面边缘安营扎寨。",
    features: ["温泉圆光", "青金小袍", "竹影"],
    palette: { body: "#835437", belly: "#e7bd80", accent: "#3f6d59", glow: "#f2d46b", eye: "#21140d", shadow: "#321e14" },
    line: "今天也不必赢过所有人，赢回自己就够了。"
  }
];

const lazyCatStages: PetStageDraft[] = [
  {
    idSuffix: "loaf",
    name: "摆烂猫饼",
    title: "今日开机失败",
    avatar: "猫",
    sigil: "困",
    visual: "一只黑白小猫摊成猫饼，爪垫露在外面，眼神写着再睡五分钟。",
    temperament: "可爱但拒绝营业，适合把焦虑摁成一滩。",
    features: ["猫饼", "爪垫", "半睁眼"],
    palette: { body: "#34373b", belly: "#fff2df", accent: "#f28d87", glow: "#ffe3a0", eye: "#fff7dc", shadow: "#1f2226" },
    line: "我先倒下了，你要不要也把肩膀放下来一点。"
  },
  {
    idSuffix: "blanket",
    name: "毛毯咸鱼猫",
    title: "被窝远程办公体",
    avatar: "毯",
    sigil: "懒",
    visual: "裹着小毛毯，只伸出耳朵和尾巴，旁边有一个没关掉的闹钟。",
    temperament: "会用无声抗议提醒你别过度透支。",
    features: ["毛毯", "闹钟", "尾巴"],
    palette: { body: "#3d4146", belly: "#fff0d8", accent: "#e98579", glow: "#cfe9d6", eye: "#fff6d4", shadow: "#202327" },
    line: "闹钟响了，但我的灵魂没有同意。"
  },
  {
    idSuffix: "pillow",
    name: "抱枕逃班猫",
    title: "午休合法化倡议者",
    avatar: "枕",
    sigil: "睡",
    visual: "趴在珊瑚色抱枕上，身边散着两张待办纸条，纸条已经被压扁。",
    temperament: "会把待办压住一会儿，让你先恢复血条。",
    features: ["抱枕", "待办纸", "软爪"],
    palette: { body: "#30343a", belly: "#fff3e1", accent: "#ef8f7c", glow: "#ffd476", eye: "#fff8dc", shadow: "#181b20" },
    line: "纸被我压住了，暂时不会追你。"
  },
  {
    idSuffix: "box",
    name: "纸箱摆烂王",
    title: "需求躲避临时堡垒",
    avatar: "箱",
    sigil: "藏",
    visual: "坐进纸箱堡垒，只露出脑袋，箱子外贴着一只歪掉的爪印。",
    temperament: "能在精神过载时给你一个小小撤退区。",
    features: ["纸箱", "歪爪印", "堡垒"],
    palette: { body: "#383c42", belly: "#fff2df", accent: "#d88b5c", glow: "#f6c36f", eye: "#fff7db", shadow: "#1c2026" },
    line: "不是逃，是战略性钻箱。"
  },
  {
    idSuffix: "desk",
    name: "键盘压阵猫",
    title: "输入法暂停守门员",
    avatar: "键",
    sigil: "停",
    visual: "趴在键盘上，尾巴压住回车键，脸上写着今天先别提交人生。",
    temperament: "会阻止你在气头上发出危险回复。",
    features: ["键盘", "回车键", "尾巴"],
    palette: { body: "#2e3238", belly: "#fff1dd", accent: "#ee7f7b", glow: "#a8ead6", eye: "#fff4cc", shadow: "#171a1f" },
    line: "这条消息先别发，我尾巴已经替你按住了。"
  },
  {
    idSuffix: "chair",
    name: "老板椅瘫猫",
    title: "被动管理能量池",
    avatar: "椅",
    sigil: "瘫",
    visual: "仰在小老板椅里，肚皮朝天，旁边摞着已经无害化的会议纪要。",
    temperament: "看似废，实际上在低功耗整理战场。",
    features: ["老板椅", "会议纪要", "肚皮"],
    palette: { body: "#292e35", belly: "#fff3df", accent: "#db716e", glow: "#ffd27a", eye: "#fff8dc", shadow: "#14181d" },
    line: "我在瘫着，但我的边界感还醒着。"
  },
  {
    idSuffix: "crown",
    name: "躺平小猫王",
    title: "不内耗王座初成",
    avatar: "王",
    sigil: "摆",
    visual: "戴着小歪冠趴在软王座上，爪边有一条写着不接急锅的绶带。",
    temperament: "开始有一点傲娇，但只对不合理需求傲娇。",
    features: ["歪冠", "软王座", "绶带"],
    palette: { body: "#252a31", belly: "#fff4e4", accent: "#f29373", glow: "#f8d06d", eye: "#fff6d0", shadow: "#11151a" },
    line: "本王宣布：急锅不自动继承。"
  },
  {
    idSuffix: "sofa",
    name: "沙发结界猫",
    title: "加班请求反弹层",
    avatar: "界",
    sigil: "弹",
    visual: "陷在红色小沙发里，周围浮着软软的反弹结界，把无效催促弹成小气泡。",
    temperament: "懒得吵，但很会弹开消耗。",
    features: ["沙发", "软结界", "气泡"],
    palette: { body: "#20252c", belly: "#fff1dd", accent: "#de6f74", glow: "#a2efe3", eye: "#fff6d4", shadow: "#0f1217" },
    line: "我不解释了，结界会自己解释。"
  },
  {
    idSuffix: "duke",
    name: "午睡公爵猫",
    title: "精神贵族拒绝透支",
    avatar: "爵",
    sigil: "贵",
    visual: "披着奶油披肩，在小靠椅上闭眼午睡，爪边有一盏柔光台灯。",
    temperament: "疲惫但体面，能帮你把休息说得理直气壮。",
    features: ["披肩", "靠椅", "柔光灯"],
    palette: { body: "#1f242b", belly: "#fff0dd", accent: "#d8616f", glow: "#f6ca65", eye: "#fff8df", shadow: "#0c1015" },
    line: "休息不是奖励，是维护系统稳定。"
  },
  {
    idSuffix: "overlord",
    name: "摆烂猫大人",
    title: "可爱废物终阶霸主",
    avatar: "主",
    sigil: "躺",
    visual: "最终形态坐在豪华软椅上，怀里抱着小鱼抱枕，眼神温柔但坚决不加班。",
    temperament: "用可爱和摆烂同时保护你，必要时会替你冷处理。",
    features: ["豪华软椅", "小鱼抱枕", "拒绝加班"],
    palette: { body: "#181d24", belly: "#fff3e2", accent: "#e26970", glow: "#ffd16e", eye: "#fff7d6", shadow: "#090c10" },
    line: "本大人批准你今天少内耗一点。"
  }
];

const lazyDogStages: PetStageDraft[] = [
  {
    idSuffix: "pup",
    name: "趴趴小狗",
    title: "刚睡醒的忠诚体",
    avatar: "狗",
    sigil: "趴",
    visual: "一只浅棕小狗趴在圆垫上，耳朵垂下来，像刚把世界音量调低。",
    temperament: "温顺可靠，先陪你把心率降下来。",
    features: ["圆垫", "垂耳", "慢呼吸"],
    palette: { body: "#c68f56", belly: "#f7dfbd", accent: "#58718a", glow: "#e7c27a", eye: "#352316", shadow: "#684123" },
    line: "我在，先趴一会儿，别马上冲出去。"
  },
  {
    idSuffix: "ball",
    name: "毛球守门犬",
    title: "通知免打扰幼犬",
    avatar: "球",
    sigil: "守",
    visual: "抱着蓝色小球睡觉，尾巴挡住一串通知气泡。",
    temperament: "不擅长激烈反击，但非常擅长挡噪音。",
    features: ["蓝球", "通知气泡", "尾巴盾"],
    palette: { body: "#c98f55", belly: "#f5ddb8", accent: "#517897", glow: "#b7d6df", eye: "#372414", shadow: "#6b4324" },
    line: "通知我先挡着，你别每一条都扑过去。"
  },
  {
    idSuffix: "blanket",
    name: "毯毯懒狗",
    title: "工位低功耗陪伴",
    avatar: "毯",
    sigil: "暖",
    visual: "裹着蓝灰色小毯子，只露出鼻尖和两只耳朵，旁边有一杯温水。",
    temperament: "陪伴感很足，行动力很低，但低得让人安心。",
    features: ["小毯子", "温水", "鼻尖"],
    palette: { body: "#bd8150", belly: "#f3d8ad", accent: "#667c91", glow: "#c9d8b7", eye: "#322011", shadow: "#5f391f" },
    line: "低功耗模式不是废，是续航。"
  },
  {
    idSuffix: "cushion",
    name: "抱枕巡逻犬",
    title: "边界巡逻慢速版",
    avatar: "枕",
    sigil: "巡",
    visual: "拖着一个绿色抱枕慢慢巡逻，脚边有几个被标记为稍后的任务。",
    temperament: "慢慢检查边界，发现越界就轻轻汪一声。",
    features: ["抱枕", "稍后任务", "慢巡逻"],
    palette: { body: "#b9784b", belly: "#efd2a2", accent: "#5f7e63", glow: "#e7c36d", eye: "#302013", shadow: "#58331d" },
    line: "我走得慢，但不代表别人能越界。"
  },
  {
    idSuffix: "hoodie",
    name: "卫衣打盹犬",
    title: "临时需求缓冲器",
    avatar: "衣",
    sigil: "缓",
    visual: "穿着宽松蓝色卫衣坐在懒人沙发里，爪边有一张缓冲清单。",
    temperament: "懂得把突然袭来的任务先放进缓冲区。",
    features: ["卫衣", "懒人沙发", "缓冲清单"],
    palette: { body: "#b87548", belly: "#f1d3a5", accent: "#4d6f8d", glow: "#d7c17a", eye: "#2c1c10", shadow: "#50301b" },
    line: "先放缓冲区，别让它直接撞进你脑子里。"
  },
  {
    idSuffix: "mug",
    name: "马克杯老实犬",
    title: "桌边热饮守护位",
    avatar: "杯",
    sigil: "陪",
    visual: "抱着马克杯坐在办公椅脚边，眼镜歪歪的，看起来很困但很认真。",
    temperament: "老实、忠诚，会认真陪你熬过但不鼓励你硬熬。",
    features: ["马克杯", "眼镜", "办公椅"],
    palette: { body: "#aa6d44", belly: "#edc995", accent: "#536b7c", glow: "#c8e1c4", eye: "#2a1a0e", shadow: "#482a18" },
    line: "陪你可以，硬扛不行。"
  },
  {
    idSuffix: "briefcase",
    name: "公文包慢狗",
    title: "责任感不过载形",
    avatar: "包",
    sigil: "责",
    visual: "背着小公文包但走得很慢，包上挂着一个写着只背自己的锅的小牌。",
    temperament: "责任感很强，但开始学会只背自己的部分。",
    features: ["公文包", "小牌", "慢步"],
    palette: { body: "#a86742", belly: "#eac58f", accent: "#476f68", glow: "#e0bd69", eye: "#29190d", shadow: "#432616" },
    line: "包可以背，别人的锅不可以自动装进去。"
  },
  {
    idSuffix: "lamp",
    name: "暖灯守夜犬",
    title: "夜班情绪巡航形",
    avatar: "灯",
    sigil: "夜",
    visual: "坐在暖色台灯旁，披着格纹小毯，眼神像深夜还愿意听你说完。",
    temperament: "温柔但坚定，会提醒你深夜别做重大决定。",
    features: ["暖灯", "格纹毯", "守夜"],
    palette: { body: "#98613f", belly: "#e6bd86", accent: "#6b7151", glow: "#f0c76b", eye: "#25170c", shadow: "#3b2113" },
    line: "夜里先别下结论，明天的你会感谢现在的暂停。"
  },
  {
    idSuffix: "elder",
    name: "摇椅老狗",
    title: "慢生活顾问",
    avatar: "椅",
    sigil: "慢",
    visual: "坐在小摇椅上，耳朵已经有点白，怀里抱着一本边界手册。",
    temperament: "经历过很多工位风浪，所以不再被急字吓到。",
    features: ["摇椅", "白耳", "边界手册"],
    palette: { body: "#89563a", belly: "#dfb37c", accent: "#5b6750", glow: "#efc067", eye: "#21140b", shadow: "#321d11" },
    line: "真正重要的事，通常经得起你先睡一觉。"
  },
  {
    idSuffix: "guardian",
    name: "慵懒守护犬",
    title: "桌面终阶陪伴灵",
    avatar: "护",
    sigil: "安",
    visual: "最终形态坐在木质办公桌旁，戴着小圆眼镜，背后有暖灯与盾形光环。",
    temperament: "不催你变强，只陪你变稳。",
    features: ["小圆眼镜", "暖灯", "盾形光环"],
    palette: { body: "#744932", belly: "#d9aa72", accent: "#48625f", glow: "#e8b85f", eye: "#1d1209", shadow: "#2a180e" },
    line: "我会慢慢守着你，不让工位把你变成另一个人。"
  }
];

const honestCowStages: PetStageDraft[] = [
  {
    idSuffix: "calf",
    name: "老实小牛犊",
    title: "工位草坪初醒形",
    avatar: "牛",
    sigil: "忍",
    visual: "黑白斑纹小牛蹲在桌角，眉毛皱得很认真，鼻口粉粉的，像刚听完一句离谱需求。",
    temperament: "老实但不傻，先替你把委屈含住，再慢慢嚼碎。",
    features: ["黑白斑", "皱眉", "粉鼻口"],
    palette: { body: "#f7f2e8", belly: "#ffd5bc", accent: "#242424", glow: "#d7e7a6", eye: "#171717", shadow: "#34312c" },
    line: "哞。老实不是好欺负，我只是先把这口气咽成反刍素材。"
  },
  {
    idSuffix: "straw",
    name: "叼吸管牛牛",
    title: "奶茶续命观察体",
    avatar: "茶",
    sigil: "茶",
    visual: "小牛叼着奶茶吸管，眼神斜斜盯住需求方，黑耳朵一抖一抖。",
    temperament: "表面在喝奶茶，实际在记下每一次临时变更。",
    features: ["奶茶", "吸管", "斜眼"],
    palette: { body: "#f8f1e5", belly: "#ffd1b4", accent: "#202020", glow: "#f0d66b", eye: "#151515", shadow: "#302d28" },
    line: "我先喝一口，免得把刚才那句话直接顶回去。"
  },
  {
    idSuffix: "brow",
    name: "凶眉打工牛",
    title: "不服但在岗形",
    avatar: "眉",
    sigil: "顶",
    visual: "眉毛压得更低，额头冒出两只短角，蹄子边散着几张被嚼皱的待办便签。",
    temperament: "开始有脾气，但脾气会先变成行动清单。",
    features: ["短角", "凶眉", "待办便签"],
    palette: { body: "#f5efe4", belly: "#ffc9aa", accent: "#1f1f1f", glow: "#b8df8d", eye: "#111111", shadow: "#2b2926" },
    line: "可以做，但要写清楚边界。我的角已经开始记仇了。"
  },
  {
    idSuffix: "tie",
    name: "领结牛牛",
    title: "礼貌反击入门形",
    avatar: "结",
    sigil: "礼",
    visual: "胸前系上黑色小领结，站姿乖巧，眉眼却写着我全都听见了。",
    temperament: "礼貌、克制、但不会再自动背锅。",
    features: ["黑领结", "端正站姿", "克制眼神"],
    palette: { body: "#fbf4e8", belly: "#ffc7a7", accent: "#191919", glow: "#efe2a0", eye: "#111111", shadow: "#292522" },
    line: "收到。我会配合，但这锅请按流程分配，不要默认挂我角上。"
  },
  {
    idSuffix: "suit",
    name: "西装老实牛",
    title: "职业微笑防御形",
    avatar: "装",
    sigil: "稳",
    visual: "穿上黑色小西装，白衬衫和领结齐全，胸口别着一枚小花，像参考图里那只强撑体面的牛。",
    temperament: "体面到有点好笑，但体面下面是很硬的边界感。",
    features: ["黑西装", "小花", "职业皱眉"],
    palette: { body: "#f8f2e7", belly: "#ffc8aa", accent: "#151515", glow: "#f4d16e", eye: "#101010", shadow: "#26221f" },
    line: "我穿西装不是为了忍，是为了让反击看起来很正式。"
  },
  {
    idSuffix: "badge",
    name: "工牌主管牛",
    title: "需求验收看门形",
    avatar: "牌",
    sigil: "审",
    visual: "西装胸口多了工牌和小印章，身边漂着几枚验收勾选框，眉峰像两道门禁。",
    temperament: "开始审需求、审口头承诺、审谁在装没说过。",
    features: ["工牌", "印章", "验收框"],
    palette: { body: "#f6efe3", belly: "#ffc19f", accent: "#171717", glow: "#9fd7b0", eye: "#0f0f0f", shadow: "#24211f" },
    line: "口头说的也算数。牛牛已经把它盖章进记忆里了。"
  },
  {
    idSuffix: "boss",
    name: "老实巴交老板牛",
    title: "反向管理预备形",
    avatar: "板",
    sigil: "管",
    visual: "戴上小墨镜，西装更挺，手边有一杯奶茶和一叠需求变更单。",
    temperament: "不再只执行，开始反向管理混乱。",
    features: ["墨镜", "奶茶", "变更单"],
    palette: { body: "#f3ece1", belly: "#ffba98", accent: "#111111", glow: "#e9d575", eye: "#0b0b0b", shadow: "#201d1a" },
    line: "我不是老板，但我现在要开始管理老板的想象力。"
  },
  {
    idSuffix: "storm",
    name: "顶角风暴牛",
    title: "会议废话清障形",
    avatar: "角",
    sigil: "清",
    visual: "双角变亮，周围旋着被顶飞的废话气泡和 KPI 碎片，眼神凶得很正义。",
    temperament: "遇到空话会直接顶散，给你留出能呼吸的空间。",
    features: ["发光牛角", "废话气泡", "KPI 碎片"],
    palette: { body: "#f0e9de", belly: "#ffaf8a", accent: "#0f0f0f", glow: "#8bd9c4", eye: "#080808", shadow: "#1c1a18" },
    line: "这句没信息量，我先顶走。下一句请讲人话。"
  },
  {
    idSuffix: "tux",
    name: "礼服牛牛尊",
    title: "职场体面反击形",
    avatar: "礼",
    sigil: "尊",
    visual: "黑白礼服完整成型，胸前小花发光，背后是一圈奶茶色护盾光环。",
    temperament: "又体面又不好惹，能把愤怒压成清晰条款。",
    features: ["礼服", "小花光", "奶茶护盾"],
    palette: { body: "#eee7db", belly: "#ffa983", accent: "#0d0d0d", glow: "#f0c96a", eye: "#060606", shadow: "#171513" },
    line: "体面不是退让，是让每一句边界都站得更稳。"
  },
  {
    idSuffix: "legend",
    name: "老实巴交牛仙",
    title: "牛牛桌宠终阶灵物",
    avatar: "仙",
    sigil: "牛",
    visual: "最终形态像一只穿黑礼服的牛仙，凶眉、粉鼻、黑白斑纹和金色工牌光环同时在线。",
    temperament: "忠厚、护主、会反刍怨气，也会把你从过度忍耐里顶出来。",
    features: ["牛仙光环", "黑礼服", "金色工牌"],
    palette: { body: "#ebe4d8", belly: "#ffa27c", accent: "#080808", glow: "#f2d36c", eye: "#030303", shadow: "#11100f" },
    line: "老实可以，巴交可以，但被欺负不可以。今天由牛牛替你顶住。"
  }
];

export const petStageSeries: Record<PetStyle, PetStage[]> = {
  rageBlob: petStages.map((stage) => ({ ...stage, style: "rageBlob" })),
  capybaraZen: buildPetStyleStages("capybaraZen", capybaraZenStages),
  lazyCat: buildPetStyleStages("lazyCat", lazyCatStages),
  lazyDog: buildPetStyleStages("lazyDog", lazyDogStages),
  honestCow: buildPetStyleStages("honestCow", honestCowStages)
};

export const mallItems: MallItem[] = [
  {
    id: "noodle_soup",
    name: "板面",
    price: 18,
    tag: "主食",
    category: "food",
    description: "热腾腾的宽面配辣椒，给软团补一口实在的。",
    effect: "投喂后饱食 +28，饥饿 -35",
    icon: "🍜",
    petBoost: { hunger: 35, satiety: 28, affection: 2 }
  },
  {
    id: "cake_slice",
    name: "奶油蛋糕",
    price: 25,
    tag: "甜点",
    category: "food",
    description: "一小块绵密的奶油蛋糕，软团吃完心情会好。",
    effect: "投喂后饱食 +22，饥饿 -25，亲密 +8",
    icon: "🍰",
    petBoost: { hunger: 25, satiety: 22, affection: 8 }
  },
  {
    id: "steamed_bun",
    name: "热包子",
    price: 12,
    tag: "主食",
    category: "food",
    description: "刚出笼的肉包子，软团闻到味就凑过来了。",
    effect: "投喂后饱食 +20，饥饿 -20",
    icon: "🥟",
    petBoost: { hunger: 20, satiety: 20, affection: 2 }
  },
  {
    id: "dumpling",
    name: "饺子",
    price: 15,
    tag: "主食",
    category: "food",
    description: "皮薄馅大的手工饺子，蘸醋更香。",
    effect: "投喂后饱食 +24，饥饿 -28，亲密 +3",
    icon: "🥟",
    petBoost: { hunger: 28, satiety: 24, affection: 3 }
  },
  {
    id: "hotpot",
    name: "迷你火锅",
    price: 68,
    tag: "大餐",
    category: "food",
    description: "一小锅咕嘟咕嘟的麻辣火锅，治愈一整天。",
    effect: "投喂后饱食 +50，饥饿 -60，亲密 +15",
    icon: "🍲",
    petBoost: { hunger: 60, satiety: 50, affection: 15 }
  },
  {
    id: "milk_tea",
    name: "奶茶",
    price: 22,
    tag: "饮品",
    category: "food",
    description: "三分糖去冰加珍珠，软团吸一口就眯眼。",
    effect: "投喂后饱食 +18，饥饿 -18，亲密 +6",
    icon: "🧋",
    petBoost: { hunger: 18, satiety: 18, affection: 6 }
  },
  {
    id: "fried_chicken",
    name: "炸鸡腿",
    price: 28,
    tag: "小吃",
    category: "food",
    description: "外酥里嫩的脆皮鸡腿，加班夜的最佳搭档。",
    effect: "投喂后饱食 +32，饥饿 -35，亲密 +5",
    icon: "🍗",
    petBoost: { hunger: 35, satiety: 32, affection: 5 }
  },
  {
    id: "rice_ball",
    name: "饭团",
    price: 10,
    tag: "主食",
    category: "food",
    description: "三角饭团裹海苔，中间夹着咸蛋黄。简单但管饱。",
    effect: "投喂后饱食 +16，饥饿 -15",
    icon: "🍙",
    petBoost: { hunger: 15, satiety: 16, affection: 1 }
  },
  {
    id: "ice_cream",
    name: "冰淇淋",
    price: 16,
    tag: "甜点",
    category: "food",
    description: "草莓味甜筒，给被折磨的下午来一点清凉。",
    effect: "投喂后饱食 +14，饥饿 -14，灵力 +8",
    icon: "🍦",
    petBoost: { hunger: 14, satiety: 14, light: 8, affection: 4 }
  },
  {
    id: "chocolate_bar",
    name: "巧克力",
    price: 14,
    tag: "甜点",
    category: "food",
    description: "黑巧入口先苦后甜，让人重新相信生活。",
    effect: "投喂后饱食 +16，饥饿 -14，亲密 +4",
    icon: "🍫",
    petBoost: { hunger: 14, satiety: 16, affection: 4 }
  },
  {
    id: "sushi_platter",
    name: "寿司拼盘",
    price: 88,
    tag: "大餐",
    category: "food",
    description: "三文鱼、甜虾、鳗鱼各两贯，软团的豪华日料。",
    effect: "投喂后饱食 +45，饥饿 -55，亲密 +18，灵力 +15",
    icon: "🍣",
    petBoost: { hunger: 55, satiety: 45, affection: 18, light: 15 }
  },
  {
    id: "steamed_fish",
    name: "清蒸鲈鱼",
    price: 58,
    tag: "大餐",
    category: "food",
    description: "葱姜清蒸，鲜嫩不腻。认真吃一顿才算活着。",
    effect: "投喂后饱食 +42，饥饿 -50，灵力 +20",
    icon: "🐟",
    petBoost: { hunger: 50, satiety: 42, light: 20, affection: 8 }
  },
  {
    id: "bp_pill",
    name: "降压药",
    price: 20,
    tag: "药品",
    category: "medicine",
    description: "硝苯地平一颗，把飙升的血压拉回安全区。",
    effect: "使用后血压 -35，饱食 +2",
    icon: "💊",
    petBoost: { bloodPressure: -35, satiety: 2 }
  },
  {
    id: "heart_pill",
    name: "速效救心丸",
    price: 38,
    tag: "药品",
    category: "medicine",
    description: "被气到胸闷时含一粒，先稳住心跳再说。",
    effect: "使用后血压 -55，灵力 +10",
    icon: "❤️‍🩹",
    petBoost: { bloodPressure: -55, light: 10, affection: 3 }
  },
  {
    id: "adrenaline",
    name: "肾上腺素",
    price: 55,
    tag: "药品",
    category: "medicine",
    description: "Deadline 前最后一针，搏一搏把命续上。",
    effect: "使用后血压 -20，饥饿 -10",
    icon: "💉",
    petBoost: { bloodPressure: -20, hunger: 10, satiety: 5 }
  },
  {
    id: "sedative",
    name: "安神补脑液",
    price: 32,
    tag: "药品",
    category: "medicine",
    description: "加班焦虑患者标配，喝一管脑子能静下来。",
    effect: "使用后血压 -30，灵力 +15，亲密 +5",
    icon: "🧪",
    petBoost: { bloodPressure: -30, light: 15, affection: 5 }
  },
  {
    id: "stomach_pill",
    name: "胃药",
    price: 15,
    tag: "药品",
    category: "medicine",
    description: "工位常备铝碳酸镁，外卖吃坏肚子全靠它。",
    effect: "使用后血压 -15，饱食 +8，饥饿 -10",
    icon: "💊",
    petBoost: { bloodPressure: -15, satiety: 8, hunger: 10 }
  },
  {
    id: "oxygen_mask",
    name: "氧气瓶",
    price: 72,
    tag: "急救",
    category: "medicine",
    description: "连续开完 4 个会后对着吸两口，感觉还能再撑。",
    effect: "使用后血压 -40，灵力 +20，法力 +40",
    icon: "🫧",
    petBoost: { bloodPressure: -40, light: 20, mana: 40, affection: 4 }
  },
  {
    id: "vitamin",
    name: "复合维生素",
    price: 24,
    tag: "保健品",
    category: "medicine",
    description: "日常补一补，让软团从内到外少出点状况。",
    effect: "使用后血压 -10，亲密 +4",
    icon: "💪",
    petBoost: { bloodPressure: -10, affection: 4 }
  },
  {
    id: "eye_drop",
    name: "人工泪液",
    price: 12,
    tag: "药品",
    category: "medicine",
    description: "屏幕盯久了眼睛发干，软团帮你滴两下。",
    effect: "使用后血压 -8，亲密 +3",
    icon: "👁️",
    petBoost: { bloodPressure: -8, affection: 3 }
  },
  {
    id: "blood_tonic",
    name: "当归补血汤",
    price: 46,
    tag: "保健品",
    category: "medicine",
    description: "被 PUA 到怀疑人生时，先补一补气血。",
    effect: "使用后血压 -25，灵力 +25",
    icon: "🍵",
    petBoost: { bloodPressure: -25, light: 25, affection: 5 }
  },
  {
    id: "emergency_kit",
    name: "急救包",
    price: 128,
    tag: "急救",
    category: "medicine",
    description: "内含纱布碘伏创可贴，工位真的什么都会发生。",
    effect: "使用后血压 -60，灵力 +30，法力上限 +10",
    icon: "🩹",
    petBoost: { bloodPressure: -60, light: 30, manaCap: 10, affection: 8 }
  },
  {
    id: "massage_gun",
    name: "筋膜枪",
    price: 98,
    tag: "保健品",
    category: "medicine",
    description: "对着颈椎来几下，僵硬的肩颈终于松了。",
    effect: "使用后血压 -20，饱食 -5（消耗热量）",
    icon: "🔫",
    petBoost: { bloodPressure: -20, satiety: 5, affection: 6 }
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
  forest: "林间摸鱼",
  arcade: "像素夜游",
  sakura: "樱花便当",
  ink: "墨色公文",
  citrus: "柑橘汽水"
};

export const petStyleLabels: Record<PetStyle, string> = {
  rageBlob: "怨气软团",
  capybaraZen: "与世无争卡皮巴拉",
  lazyCat: "摆烂猫系列",
  lazyDog: "慵懒狗系",
  honestCow: "老实巴交牛牛"
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
  { key: "food", label: "食物" },
  { key: "medicine", label: "药品" }
];

export const transactionFilters: Array<{ key: "all" | TransactionCategory; label: string }> = [
  { key: "all", label: "全部" },
  { key: "income", label: "收入" },
  { key: "expense", label: "支出" },
  { key: "wish", label: "心愿" },
  { key: "mall", label: "商城" },
  { key: "pet", label: "软团" }
];
