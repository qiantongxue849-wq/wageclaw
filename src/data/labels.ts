import type { CountMode, Mood, ScreenKey, Theme, TransactionCategory } from "@/types";

export const transactionCategories: Record<TransactionCategory, { label: string; icon: string; color: string }> = {
  income: { label: "收入", icon: "入", color: "plus" },
  expense: { label: "支出", icon: "出", color: "minus" },
  wish: { label: "心愿", icon: "愿", color: "minus" },
  mall: { label: "商城", icon: "商", color: "minus" },
  pet: { label: "软团", icon: "宠", color: "minus" }
};

export const screenTitles: Record<ScreenKey, string> = {
  converter: "忍了吧控制台",
  mall: "补给仓",
  pet: "怨气桌宠",
  settings: "基础设置"
};

export const navItems: Array<{ key: ScreenKey; label: string; hint: string }> = [
  { key: "converter", label: "忍了吧", hint: "余额、心愿、账本" },
  { key: "mall", label: "补给仓", hint: "商城、背包、使用记录" },
  { key: "pet", label: "怨气桌宠", hint: "桌宠、投喂、炼化" },
  { key: "settings", label: "设置", hint: "资料、主题、数据" }
];

export const themeLabels: Record<Theme, string> = {
  forest: "林间摸鱼",
  arcade: "像素夜游",
  sakura: "樱花便当",
  ink: "墨色公文",
  citrus: "柑橘汽水"
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


export const transactionFilters: Array<{ key: "all" | TransactionCategory; label: string }> = [
  { key: "all", label: "全部" },
  { key: "income", label: "收入" },
  { key: "expense", label: "支出" },
  { key: "wish", label: "心愿" },
  { key: "mall", label: "商城" },
  { key: "pet", label: "软团" }
];
