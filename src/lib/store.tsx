"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { emptyData } from "./defaults";
import { Action, ActionType, AppData, Child, CustomAction, FamilyInfo, FamilyPayload, Reward, Settings } from "./types";

type AddActionInput = {
  childId: string;
  title: string;
  type: ActionType;
  points: number;
  note?: string;
};

type StoreContextValue = {
  data: AppData;
  family?: FamilyInfo;
  hydrated: boolean;
  error?: string;
  addChild: (child: Pick<Child, "name" | "avatar" | "birthday" | "gender" | "bio">) => Promise<void>;
  updateChild: (id: string, updates: Pick<Child, "name" | "avatar" | "birthday" | "gender" | "bio">) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;
  addAction: (input: AddActionInput) => Promise<Action | undefined>;
  undoAction: (id: string) => Promise<void>;
  addCustomAction: (input: Omit<CustomAction, "id" | "createdAt">) => Promise<void>;
  updateCustomAction: (id: string, updates: Pick<CustomAction, "title" | "category" | "points" | "note" | "presetKey" | "disabled" | "sortIndex">) => Promise<void>;
  deleteCustomAction: (id: string) => Promise<void>;
  addReward: (input: Pick<Reward, "title" | "cost" | "description">) => Promise<void>;
  updateReward: (id: string, updates: Pick<Reward, "title" | "cost" | "description">) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
  redeemReward: (rewardId: string, childId: string) => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  joinFamily: (syncId: string, secret: string) => Promise<void>;
  rotateSecret: () => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [data, setData] = useState<AppData>(emptyData);
  const [family, setFamily] = useState<FamilyInfo | undefined>();
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setData(emptyData);
      setFamily(undefined);
      setHydrated(true);
      return;
    }

    let cancelled = false;
    setHydrated(false);
    fetch("/api/family")
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json() as { error?: string }).error ?? "Could not load family data.");
        return response.json() as Promise<FamilyPayload>;
      })
      .then((payload) => {
        if (cancelled) return;
        setData(payload.data);
        setFamily(payload.family);
        setError(undefined);
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Could not load family data.");
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => { cancelled = true; };
  }, [status]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", data.settings.darkMode);
  }, [data.settings.darkMode]);

  async function requestFamily(body: object) {
    const response = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json() as (FamilyPayload & { created?: Action; error?: string });
    if (!response.ok) {
      const message = payload.error ?? "Could not update family data.";
      setError(message);
      throw new Error(message);
    }
    setData(payload.data);
    setFamily(payload.family);
    setError(undefined);
    return payload;
  }

  const value = useMemo<StoreContextValue>(() => ({
    data,
    family,
    hydrated,
    error,
    addChild: async (child) => { await requestFamily({ type: "addChild", child }); },
    updateChild: async (id, updates) => { await requestFamily({ type: "updateChild", id, updates }); },
    deleteChild: async (id) => { await requestFamily({ type: "deleteChild", id }); },
    addAction: async (input) => (await requestFamily({ type: "addAction", input })).created,
    undoAction: async (id) => { await requestFamily({ type: "undoAction", id }); },
    addCustomAction: async (input) => { await requestFamily({ type: "addCustomAction", input }); },
    updateCustomAction: async (id, updates) => { await requestFamily({ type: "updateCustomAction", id, updates }); },
    deleteCustomAction: async (id) => { await requestFamily({ type: "deleteCustomAction", id }); },
    addReward: async (input) => { await requestFamily({ type: "addReward", input }); },
    updateReward: async (id, updates) => { await requestFamily({ type: "updateReward", id, updates }); },
    deleteReward: async (id) => { await requestFamily({ type: "deleteReward", id }); },
    redeemReward: async (rewardId, childId) => { await requestFamily({ type: "redeemReward", rewardId, childId }); },
    updateSettings: async (updates) => { await requestFamily({ type: "updateSettings", updates }); },
    joinFamily: async (syncId, secret) => { await requestFamily({ type: "joinFamily", syncId, secret }); },
    rotateSecret: async () => { await requestFamily({ type: "rotateSecret" }); }
  }), [data, family, hydrated, error]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useKindPoints() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useKindPoints must be used inside StoreProvider");
  return context;
}
