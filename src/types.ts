export type Theme = "forest" | "arcade" | "sakura" | "ink" | "citrus";
export type CountMode = "natural" | "workday";
export type Mood = "rage" | "stable" | "numb";
export type Currency = "wallet" | "rage";
export type ScreenKey = "converter" | "mall" | "pet" | "ninja" | "community" | "sync" | "settings";
export type PetStyle = "rageBlob" | "capybaraZen" | "lazyCat" | "lazyDog" | "honestCow";

export type PetStagePalette = {
  body: string;
  belly: string;
  accent: string;
  glow: string;
  eye: string;
  shadow: string;
};

export type PetStage = {
  id: string;
  style?: PetStyle;
  level: number;
  name: string;
  title: string;
  threshold: number;
  avatar: string;
  line: string;
  visual: string;
  temperament: string;
  sigil: string;
  features: string[];
  palette: PetStagePalette;
};

export type Part = {
  id: string;
  name: string;
  ratio: number;
  narrative: string;
};

export type PetBoost = {
  rage?: number;
  light?: number;
  satiety?: number;
  affection?: number;
  manaCap?: number;
  mana?: number;
  hunger?: number;
  bloodPressure?: number;
};

export type MallItem = {
  id: string;
  name: string;
  price: number;
  currency?: Currency;
  tag: string;
  category: string;
  description: string;
  effect: string;
  icon: string;
  petBoost?: PetBoost;
};

export type TransactionCategory = "income" | "expense" | "wish" | "mall" | "pet";

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  note: string;
  time: string;
  date: string;
  category: TransactionCategory;
};

export type UsageLogItem = {
  id: string;
  name: string;
  icon: string;
  effect: string;
  time: string;
};

export type PetLogItem = {
  title: string;
  detail: string;
  time: string;
};

export type PetState = {
  name: string;
  rage: number;
  light: number;
  mana: number;
  manaBonus: number;
  cultivation: number;
  satiety: number;
  affection: number;
  hunger: number;
  bloodPressure: number;
  summoned: boolean;
  gameBest: number;
  lastLine: string;
  lastAmbientPeriod: string;
  touchCount: number;
  touchHeat: number;
  touchMood: string;
  battleWins: number;
  battleLosses: number;
  battleBestCombo: number;
  lastBusinessHint: string;
};

export type WageClawState = {
  nickname: string;
  salary: number;
  wish: string;
  price: number;
  rageMinutes: number;
  mood: Mood;
  theme: Theme;
  petStyle: PetStyle;
  countMode: CountMode;
  startTime: string;
  endTime: string;
  payday: number;
  walletBalance: number;
  rageBalance: number;
  dailyRage: {
    date: string;
    value: number;
    triggered: string[];
  };
  lastClaimTime: string;
  unlockedParts: string[];
  inventory: Record<string, number>;
  pet: PetState;
  transactions: Transaction[];
  usageLog: UsageLogItem[];
  petLog: PetLogItem[];
  transactionFilter: "all" | TransactionCategory;
  mallFilter: string;
  privacyMode: boolean;
};
