export type ActionType = "positive" | "negative" | "repair";

export type Child = {
  id: string;
  name: string;
  avatar: string;
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
  createdAt: string;
};

export type Settings = {
  allowNegativeBalance: boolean;
  dailyNegativeLimit: number;
  perIncidentNegativeLimit: number;
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

export type BehaviourTemplate = {
  title: string;
  type: ActionType;
  points: number;
  emoji: string;
};
