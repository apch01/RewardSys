"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { defaultRewards, defaultSettings, sampleData } from "./defaults";
import { createId, todaysNegativePoints } from "./utils";
import { Action, ActionType, AppData, Child, CustomAction, Reward, Settings } from "./types";

const STORAGE_KEY = "kindpoints-data-v1";

type AddActionInput = {
  childId: string;
  title: string;
  type: ActionType;
  points: number;
  note?: string;
};

type StoreContextValue = {
  data: AppData;
  hydrated: boolean;
  addChild: (child: Pick<Child, "name" | "avatar">) => void;
  updateChild: (id: string, updates: Pick<Child, "name" | "avatar">) => void;
  deleteChild: (id: string) => void;
  addAction: (input: AddActionInput) => Action | undefined;
  undoAction: (id: string) => void;
  addCustomAction: (input: Omit<CustomAction, "id" | "createdAt">) => void;
  addReward: (input: Pick<Reward, "title" | "cost" | "description">) => void;
  redeemReward: (rewardId: string, childId: string) => void;
  updateSettings: (updates: Partial<Settings>) => void;
  resetPeriod: (period: "weekly" | "monthly") => void;
  clearAll: () => void;
  exportData: () => string;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function normalizeData(data: AppData): AppData {
  return {
    children: data.children ?? [],
    actions: data.actions ?? [],
    rewards: data.rewards?.length ? data.rewards : defaultRewards,
    customActions: data.customActions ?? [],
    settings: { ...defaultSettings, ...(data.settings ?? {}), defaultPointValues: { ...defaultSettings.defaultPointValues, ...(data.settings?.defaultPointValues ?? {}) } }
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(sampleData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData(normalizeData(JSON.parse(saved) as AppData));
      } catch {
        setData(sampleData);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    document.documentElement.classList.toggle("dark", data.settings.darkMode);
  }, [data, hydrated]);

  const value = useMemo<StoreContextValue>(() => ({
    data,
    hydrated,
    addChild: (child) => {
      const newChild: Child = { id: createId("child"), points: 0, createdAt: new Date().toISOString(), ...child };
      setData((current) => ({ ...current, children: [...current.children, newChild] }));
    },
    updateChild: (id, updates) => {
      setData((current) => ({ ...current, children: current.children.map((child) => child.id === id ? { ...child, ...updates } : child) }));
    },
    deleteChild: (id) => {
      setData((current) => ({
        ...current,
        children: current.children.filter((child) => child.id !== id),
        actions: current.actions.filter((action) => action.childId !== id)
      }));
    },
    addAction: (input) => {
      let created: Action | undefined;
      setData((current) => {
        const child = current.children.find((item) => item.id === input.childId);
        if (!child) return current;

        let points = input.points;
        if (input.type === "negative") {
          const incidentCap = Math.abs(current.settings.perIncidentNegativeLimit);
          points = -Math.min(Math.abs(points), incidentCap);
          const usedToday = todaysNegativePoints(current.actions.filter((action) => action.childId === input.childId));
          const remaining = Math.max(current.settings.dailyNegativeLimit - usedToday, 0);
          points = remaining === 0 ? 0 : -Math.min(Math.abs(points), remaining);
        }

        const nextPoints = current.settings.allowNegativeBalance ? child.points + points : Math.max(0, child.points + points);
        const appliedPoints = nextPoints - child.points;
        created = { id: createId("action"), ...input, points: appliedPoints, createdAt: new Date().toISOString() };

        return {
          ...current,
          children: current.children.map((item) => item.id === child.id ? { ...item, points: nextPoints } : item),
          actions: [created, ...current.actions]
        };
      });
      return created;
    },
    undoAction: (id) => {
      setData((current) => {
        const action = current.actions.find((item) => item.id === id);
        if (!action) return current;
        return {
          ...current,
          children: current.children.map((child) => child.id === action.childId ? { ...child, points: Math.max(0, child.points - action.points) } : child),
          actions: current.actions.filter((item) => item.id !== id)
        };
      });
    },
    addCustomAction: (input) => {
      const points = input.category === "negative" ? -Math.abs(input.points) : Math.abs(input.points);
      setData((current) => ({ ...current, customActions: [{ id: createId("custom"), ...input, points, createdAt: new Date().toISOString() }, ...current.customActions] }));
    },
    addReward: (input) => {
      const reward: Reward = { id: createId("reward"), ...input, redeemed: false, createdAt: new Date().toISOString() };
      setData((current) => ({ ...current, rewards: [reward, ...current.rewards] }));
    },
    redeemReward: (rewardId, childId) => {
      setData((current) => {
        const reward = current.rewards.find((item) => item.id === rewardId);
        const child = current.children.find((item) => item.id === childId);
        if (!reward || !child || reward.redeemed || child.points < reward.cost) return current;
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
          ...current,
          children: current.children.map((item) => item.id === childId ? { ...item, points: item.points - reward.cost } : item),
          rewards: current.rewards.map((item) => item.id === rewardId ? { ...item, redeemed: true, redeemedBy: childId, redeemedAt: new Date().toISOString() } : item),
          actions: [action, ...current.actions]
        };
      });
    },
    updateSettings: (updates) => {
      setData((current) => ({ ...current, settings: { ...current.settings, ...updates, defaultPointValues: { ...current.settings.defaultPointValues, ...(updates.defaultPointValues ?? {}) } } }));
    },
    resetPeriod: () => {
      setData((current) => ({ ...current, children: current.children.map((child) => ({ ...child, points: 0 })), actions: [] }));
    },
    clearAll: () => {
      setData({ ...sampleData, children: [], actions: [], rewards: defaultRewards, customActions: [] });
      window.localStorage.removeItem(STORAGE_KEY);
    },
    exportData: () => JSON.stringify(data, null, 2)
  }), [data, hydrated]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useKindPoints() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useKindPoints must be used inside StoreProvider");
  return context;
}
