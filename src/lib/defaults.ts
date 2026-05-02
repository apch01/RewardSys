import { AppData, BehaviourTemplate, Reward, Settings } from "./types";

const sampleCreatedAt = "2026-05-02T09:45:00.000Z";

export const positiveBehaviours: BehaviourTemplate[] = [
  { title: "Kind words", type: "positive", points: 10, emoji: "💬" },
  { title: "Sharing toys", type: "positive", points: 10, emoji: "🧸" },
  { title: "Helping sibling", type: "positive", points: 15, emoji: "🤝" },
  { title: "Finishing homework", type: "positive", points: 15, emoji: "📚" },
  { title: "Cleaning up toys", type: "positive", points: 10, emoji: "🧺" },
  { title: "Brushing teeth without reminder", type: "positive", points: 5, emoji: "🪥" },
  { title: "Saying sorry sincerely", type: "positive", points: 15, emoji: "💛" },
  { title: "Being patient", type: "positive", points: 10, emoji: "🌱" },
  { title: "Helping parent", type: "positive", points: 15, emoji: "🏡" },
  { title: "Good school behaviour", type: "positive", points: 20, emoji: "🎒" }
];

export const negativeBehaviours: BehaviourTemplate[] = [
  { title: "Fighting", type: "negative", points: -10, emoji: "🧡" },
  { title: "Snatching toys", type: "negative", points: -10, emoji: "🧡" },
  { title: "Lying", type: "negative", points: -15, emoji: "🧡" },
  { title: "Rude words", type: "negative", points: -10, emoji: "🧡" },
  { title: "Ignoring repeated instructions", type: "negative", points: -10, emoji: "🧡" },
  { title: "Hurting someone", type: "negative", points: -20, emoji: "🧡" },
  { title: "Throwing things", type: "negative", points: -15, emoji: "🧡" },
  { title: "Screaming/tantrum", type: "negative", points: -10, emoji: "🧡" },
  { title: "Not taking responsibility", type: "negative", points: -10, emoji: "🧡" }
];

export const repairActions: BehaviourTemplate[] = [
  { title: "Say sorry sincerely", type: "repair", points: 10, emoji: "💛" },
  { title: "Help fix the problem", type: "repair", points: 10, emoji: "🛠️" },
  { title: "Calm down and explain", type: "repair", points: 10, emoji: "🌬️" },
  { title: "Share after conflict", type: "repair", points: 10, emoji: "🤲" },
  { title: "Help the person they hurt", type: "repair", points: 15, emoji: "🤗" }
];

export const kindnessChallenges = [
  "Notice one kind thing someone did today.",
  "Help without being asked once.",
  "Use calm words during a tricky moment.",
  "Share something you enjoy with someone else.",
  "Make one repair after a mistake."
];

export const defaultRewards: Reward[] = [
  { id: "reward-story", title: "Choose bedtime story", cost: 50, description: "Pick tonight's story for family reading time.", redeemed: false, createdAt: sampleCreatedAt },
  { id: "reward-sticker", title: "Small toy / sticker", cost: 100, description: "A small treat for steady growth.", redeemed: false, createdAt: sampleCreatedAt },
  { id: "reward-screen", title: "Extra 20 min screen time", cost: 150, description: "A parent-approved bonus screen session.", redeemed: false, createdAt: sampleCreatedAt },
  { id: "reward-activity", title: "Family activity choice", cost: 200, description: "Choose a family game, walk, craft, or baking activity.", redeemed: false, createdAt: sampleCreatedAt },
  { id: "reward-outing", title: "Special outing", cost: 300, description: "Plan a bigger shared adventure together.", redeemed: false, createdAt: sampleCreatedAt }
];

export const defaultSettings: Settings = {
  allowNegativeBalance: false,
  dailyNegativeLimit: 30,
  perIncidentNegativeLimit: 20,
  childLevels: [
    { title: "Kindness Captain", minPoints: 500 },
    { title: "Teamwork Trailblazer", minPoints: 300 },
    { title: "Growth Guide", minPoints: 150 },
    { title: "Sharing Star", minPoints: 75 },
    { title: "Kindness Sprout", minPoints: 0 }
  ],
  familyGoalEnabled: true,
  familyGoalTitle: "Family movie night",
  familyGoalTarget: 500,
  parentPin: "",
  darkMode: false,
  defaultPointValues: {
    smallGood: 5,
    normalGood: 10,
    bigEffort: 15,
    excellentDay: 20,
    minorCorrection: -5,
    repeatedIssue: -10,
    seriousUnsafe: -20
  }
};

export const sampleData: AppData = {
  children: [
    { id: "child-maya", name: "Maya", avatar: "🌟", birthday: "2018-05-10", gender: "girl", bio: "Loves art and helping younger kids.", points: 85, createdAt: sampleCreatedAt },
    { id: "child-leo", name: "Leo", avatar: "🚀", birthday: "2016-10-03", gender: "boy", bio: "Enjoys soccer and science experiments.", points: 120, createdAt: sampleCreatedAt }
  ],
  actions: [
    { id: "action-1", childId: "child-maya", title: "Helping sibling", type: "positive", points: 15, note: "Helped find a missing book.", createdAt: sampleCreatedAt },
    { id: "action-2", childId: "child-leo", title: "Cleaning up toys", type: "positive", points: 10, createdAt: sampleCreatedAt },
    { id: "action-3", childId: "child-maya", title: "Calm down and explain", type: "repair", points: 10, note: "Used words after feeling frustrated.", createdAt: sampleCreatedAt }
  ],
  rewards: defaultRewards,
  customActions: [],
  settings: defaultSettings
};

export const emptyData: AppData = {
  children: [],
  actions: [],
  rewards: defaultRewards,
  customActions: [],
  settings: defaultSettings
};
