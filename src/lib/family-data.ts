import { defaultRewards, defaultSettings } from "./defaults";
import { Action, AppData, Child, CustomAction, Reward } from "./types";
import { createId, todaysNegativePoints } from "./utils";

function birthdayFromLegacyAge(age: number | undefined): string {
  if (!Number.isFinite(age) || (age ?? 0) <= 0) return "";
  const now = new Date();
  const year = now.getUTCFullYear() - Math.round(age as number);
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type AddActionInput = {
  childId: string;
  title: string;
  type: Action["type"];
  points: number;
  note?: string;
};

type FamilyMutationResult = {
  data: AppData;
  created?: Action;
};

export function normalizeData(data: Partial<AppData> | null | undefined): AppData {
  return {
    children: (data?.children ?? []).map((child) => ({
      ...child,
      birthday: (child as Child & { age?: number }).birthday ?? birthdayFromLegacyAge((child as Child & { age?: number }).age),
      gender: child.gender ?? "other",
      bio: child.bio ?? ""
    })),
    actions: data?.actions ?? [],
    rewards: data?.rewards?.length ? data.rewards : defaultRewards,
    customActions: data?.customActions ?? [],
    settings: {
      ...defaultSettings,
      ...(data?.settings ?? {}),
      defaultPointValues: {
        ...defaultSettings.defaultPointValues,
        ...(data?.settings?.defaultPointValues ?? {})
      }
    }
  };
}

export function addChildToData(data: AppData, child: Pick<Child, "name" | "avatar" | "birthday" | "gender" | "bio">): FamilyMutationResult {
  const newChild: Child = { id: createId("child"), points: 0, createdAt: new Date().toISOString(), ...child };
  return { data: { ...data, children: [...data.children, newChild] } };
}

export function updateChildInData(data: AppData, id: string, updates: Pick<Child, "name" | "avatar" | "birthday" | "gender" | "bio">): FamilyMutationResult {
  return { data: { ...data, children: data.children.map((child) => child.id === id ? { ...child, ...updates } : child) } };
}

export function deleteChildFromData(data: AppData, id: string): FamilyMutationResult {
  return {
    data: {
      ...data,
      children: data.children.filter((child) => child.id !== id),
      actions: data.actions.filter((action) => action.childId !== id)
    }
  };
}

export function addActionToData(data: AppData, input: AddActionInput): FamilyMutationResult {
  const child = data.children.find((item) => item.id === input.childId);
  if (!child) return { data };

  let points = input.points;
  if (input.type === "negative") {
    const incidentCap = Math.abs(data.settings.perIncidentNegativeLimit);
    points = -Math.min(Math.abs(points), incidentCap);
    const usedToday = todaysNegativePoints(data.actions.filter((action) => action.childId === input.childId));
    const remaining = Math.max(data.settings.dailyNegativeLimit - usedToday, 0);
    points = remaining === 0 ? 0 : -Math.min(Math.abs(points), remaining);
  }

  const nextPoints = data.settings.allowNegativeBalance ? child.points + points : Math.max(0, child.points + points);
  const appliedPoints = nextPoints - child.points;
  const created: Action = { id: createId("action"), ...input, points: appliedPoints, createdAt: new Date().toISOString() };

  return {
    created,
    data: {
      ...data,
      children: data.children.map((item) => item.id === child.id ? { ...item, points: nextPoints } : item),
      actions: [created, ...data.actions]
    }
  };
}

export function undoActionInData(data: AppData, id: string): FamilyMutationResult {
  const action = data.actions.find((item) => item.id === id);
  if (!action) return { data };
  return {
    data: {
      ...data,
      children: data.children.map((child) => child.id === action.childId ? { ...child, points: Math.max(0, child.points - action.points) } : child),
      actions: data.actions.filter((item) => item.id !== id)
    }
  };
}

export function addCustomActionToData(data: AppData, input: Omit<CustomAction, "id" | "createdAt">): FamilyMutationResult {
  const points = input.category === "negative" ? -Math.abs(input.points) : Math.abs(input.points);
  const minSortIndex = data.customActions
    .filter((action) => action.category === input.category)
    .map((action) => action.sortIndex ?? 0)
    .reduce((min, value) => Math.min(min, value), 0);
  const nextSortIndex = minSortIndex - 1;
  return {
    data: {
      ...data,
      customActions: [{ id: createId("custom"), ...input, points, sortIndex: input.sortIndex ?? nextSortIndex, createdAt: new Date().toISOString() }, ...data.customActions]
    }
  };
}

export function updateCustomActionInData(data: AppData, id: string, updates: Pick<CustomAction, "title" | "category" | "points" | "note" | "presetKey" | "disabled" | "sortIndex">): FamilyMutationResult {
  const points = updates.category === "negative" ? -Math.abs(updates.points) : Math.abs(updates.points);
  return {
    data: {
      ...data,
      customActions: data.customActions.map((action) => action.id === id ? { ...action, ...updates, points } : action)
    }
  };
}

export function deleteCustomActionFromData(data: AppData, id: string): FamilyMutationResult {
  return { data: { ...data, customActions: data.customActions.filter((action) => action.id !== id) } };
}

export function addRewardToData(data: AppData, input: Pick<Reward, "title" | "cost" | "description">): FamilyMutationResult {
  const reward: Reward = { id: createId("reward"), ...input, redeemed: false, createdAt: new Date().toISOString() };
  return { data: { ...data, rewards: [reward, ...data.rewards] } };
}

export function updateRewardInData(data: AppData, id: string, updates: Pick<Reward, "title" | "cost" | "description">): FamilyMutationResult {
  return { data: { ...data, rewards: data.rewards.map((reward) => reward.id === id ? { ...reward, ...updates } : reward) } };
}

export function deleteRewardFromData(data: AppData, id: string): FamilyMutationResult {
  return { data: { ...data, rewards: data.rewards.filter((reward) => reward.id !== id) } };
}

export function redeemRewardInData(data: AppData, rewardId: string, childId: string): FamilyMutationResult {
  const reward = data.rewards.find((item) => item.id === rewardId);
  const child = data.children.find((item) => item.id === childId);
  if (!reward || !child || reward.redeemed || child.points < reward.cost) return { data };

  const action: Action = {
    id: createId("action"),
    childId,
    title: `Redeemed reward: ${reward.title}`,
    type: "repair",
    points: -reward.cost,
    note: "Reward redeemed from the shop.",
    createdAt: new Date().toISOString()
  };

  return {
    data: {
      ...data,
      children: data.children.map((item) => item.id === childId ? { ...item, points: item.points - reward.cost } : item),
      rewards: data.rewards.map((item) => item.id === rewardId ? { ...item, redeemed: true, redeemedBy: childId, redeemedAt: new Date().toISOString() } : item),
      actions: [action, ...data.actions]
    }
  };
}