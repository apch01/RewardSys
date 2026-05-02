"use client";

import { format } from "date-fns";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useKindPoints } from "@/lib/store";
import { Action, ActionType, Child } from "@/lib/types";
import { cn } from "@/lib/utils";

type TimelineProps = {
  actions: Action[];
  childrenList: Child[];
  limit?: number;
  allowChildFilter?: boolean;
  allowTypeFilter?: boolean;
};

export function ActivityTimeline({ actions, childrenList, limit, allowChildFilter = false, allowTypeFilter = false }: TimelineProps) {
  const { undoAction } = useKindPoints();
  const [actionToRemove, setActionToRemove] = useState<Action | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [selectedChildId, setSelectedChildId] = useState("all");
  const [selectedType, setSelectedType] = useState<"all" | ActionType>("all");
  const pageSize = Math.max(1, limit ?? actions.length);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sortedActions = useMemo(() => [...actions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)), [actions]);
  const filteredActions = useMemo(() => sortedActions.filter((action) => {
    const childMatch = selectedChildId === "all" || action.childId === selectedChildId;
    const typeMatch = selectedType === "all" || action.type === selectedType;
    return childMatch && typeMatch;
  }), [selectedChildId, selectedType, sortedActions]);
  const visible = filteredActions.slice(0, visibleCount);
  const canShowMore = visibleCount < filteredActions.length;
  const childForAction = actionToRemove ? childrenList.find((item) => item.id === actionToRemove.childId) : undefined;

  async function removeAction() {
    if (!actionToRemove) return;
    setRemoving(true);
    setError("");

    try {
      await undoAction(actionToRemove.id);
      setActionToRemove(null);
    } catch {
      setError("Could not remove this action. Please try again.");
    } finally {
      setRemoving(false);
    }
  }

  if (!sortedActions.length) return <div className="rounded-3xl bg-white p-5 text-center font-bold text-slate-500 shadow-soft dark:bg-slate-800 dark:text-slate-300">No actions yet. Start by noticing one kind moment.</div>;

  return (
    <>
      {(allowChildFilter || allowTypeFilter) ? (
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {allowChildFilter && childrenList.length > 1 ? (
            <select value={selectedChildId} onChange={(event) => { setSelectedChildId(event.target.value); setVisibleCount(pageSize); }} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black dark:border-slate-600 dark:bg-slate-900">
              <option value="all">All children</option>
              {childrenList.map((child) => <option key={child.id} value={child.id}>{child.avatar} {child.name}</option>)}
            </select>
          ) : null}
          {allowTypeFilter ? (
            <select value={selectedType} onChange={(event) => { setSelectedType(event.target.value as "all" | ActionType); setVisibleCount(pageSize); }} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black dark:border-slate-600 dark:bg-slate-900">
              <option value="all">All categories</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="repair">Repair</option>
            </select>
          ) : null}
        </div>
      ) : null}

      {!visible.length ? <div className="mb-3 rounded-3xl bg-white p-5 text-center font-bold text-slate-500 shadow-soft dark:bg-slate-800 dark:text-slate-300">No matching actions for this filter.</div> : null}

      <div className="space-y-3">
        {visible.map((action) => {
          const child = childrenList.find((item) => item.id === action.childId);
          return (
            <div key={action.id} className="rounded-3xl bg-white p-4 shadow-soft dark:bg-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{child?.avatar ?? "⭐"}</span>
                    <h3 className="font-black">{action.title}</h3>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{child?.name ?? "Child"} • {format(new Date(action.createdAt), "MMM d, h:mm a")}</p>
                  {action.note ? <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{action.note}</p> : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={cn("rounded-full px-3 py-1 text-sm font-black", action.points < 0 ? "bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100" : "bg-mint text-leaf dark:bg-emerald-950 dark:text-emerald-200")}>{action.points > 0 ? "+" : ""}{action.points}</span>
                  <button onClick={() => { setActionToRemove(action); setError(""); }} className="grid h-10 w-10 place-items-center rounded-full bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100" aria-label="Remove action"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {canShowMore ? <button type="button" onClick={() => setVisibleCount((count) => count + pageSize)} className="mt-4 min-h-12 w-full rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-700 dark:bg-slate-700 dark:text-slate-100">Show more</button> : null}
      {actionToRemove ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/45 p-3 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="remove-action-title">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100"><AlertTriangle className="h-5 w-5" /></span>
                <div>
                  <h2 id="remove-action-title" className="text-lg font-black">Remove action?</h2>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-300">This will update the points total.</p>
                </div>
              </div>
              <button onClick={() => setActionToRemove(null)} disabled={removing} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-60 dark:bg-slate-700 dark:text-slate-200" aria-label="Cancel remove action"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{actionToRemove.title}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{childForAction?.name ?? "Child"} • {format(new Date(actionToRemove.createdAt), "MMM d, h:mm a")}</p>
                </div>
                <span className={cn("shrink-0 rounded-full px-3 py-1 text-sm font-black", actionToRemove.points < 0 ? "bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100" : "bg-mint text-leaf dark:bg-emerald-950 dark:text-emerald-200")}>{actionToRemove.points > 0 ? "+" : ""}{actionToRemove.points}</span>
              </div>
            </div>

            {error ? <p className="mt-3 rounded-2xl bg-peach px-4 py-3 text-sm font-black text-amber-950 dark:bg-orange-950 dark:text-orange-100">{error}</p> : null}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => setActionToRemove(null)} disabled={removing} className="min-h-12 rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-700 disabled:opacity-60 dark:bg-slate-700 dark:text-slate-100">Keep it</button>
              <button onClick={removeAction} disabled={removing} className="min-h-12 rounded-2xl bg-peach px-4 py-3 font-black text-amber-950 disabled:opacity-60 dark:bg-orange-950 dark:text-orange-100">{removing ? "Removing" : "Remove"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
