export type ActionType = "positive" | "negative" | "repair";

export type ChildLevel = {
  title: string;
  minPoints: number;
};

export type SpellingWord = {
  text: string;
  characters: string[];
  meaning?: string;
  pinyin?: string;
  uncertain?: boolean;
};

export type ChildSpellingData = {
  title: string;
  language: "zh";
  words: SpellingWord[];
  updatedAt: string;
};

export type Child = {
  id: string;
  name: string;
  avatar: string;
  birthday: string;
  gender: "boy" | "girl" | "other";
  bio?: string;
  spellingData?: ChildSpellingData;
  points: number;
  createdAt: string;
};

export type Action = {
  id: string;
  childId: string;
  title: string;
  type: ActionType;
  points: number;
  note?: string;
  createdAt: string;
};

export type Reward = {
  id: string;
  title: string;
  cost: number;
  description: string;
  redeemMode: "once" | "multiple";
  redeemed: boolean;
  redeemedBy?: string;
  redeemedAt?: string;
  createdAt: string;
};

export type CustomAction = {
  id: string;
  title: string;
  category: ActionType;
  points: number;
  note?: string;
  presetKey?: string;
  disabled?: boolean;
  sortIndex?: number;
  createdAt: string;
};

export type Settings = {
  allowNegativeBalance: boolean;
  dailyNegativeLimit: number;
  perIncidentNegativeLimit: number;
  childLevels: ChildLevel[];
  familyGoalEnabled: boolean;
  familyGoalTitle: string;
  familyGoalTarget: number;
  parentPin: string;
  darkMode: boolean;
  defaultPointValues: {
    smallGood: number;
    normalGood: number;
    bigEffort: number;
    excellentDay: number;
    minorCorrection: number;
    repeatedIssue: number;
    seriousUnsafe: number;
  };
};

export type AppData = {
  children: Child[];
  actions: Action[];
  rewards: Reward[];
  customActions: CustomAction[];
  settings: Settings;
};

export type FamilyInfo = {
  id: string;
  syncId: string;
  syncSecret?: string;
  isCreator: boolean;
  createdAt: string;
};

export type FamilyPayload = {
  data: AppData;
  family: FamilyInfo;
};

export type BehaviourTemplate = {
  title: string;
  type: ActionType;
  points: number;
  emoji: string;
};
