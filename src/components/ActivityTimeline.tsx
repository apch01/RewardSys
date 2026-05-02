"use client";

import { format } from "date-fns";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useKindPoints } from "@/lib/store";
import { Action, Child } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ActivityTimeline({ actions, childrenList, limit }: { actions: Action[]; childrenList: Child[]; limit?: number }) {
  const { undoAction } = useKindPoints();
  const [actionToRemove, setActionToRemove] = useState<Action | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const visible = [...actions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, limit ?? actions.length);
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

  if (!visible.length) return <div className="rounded-3xl bg-white p-5 text-center font-bold text-slate-500 shadow-soft dark:bg-slate-800 dark:text-slate-300">No actions yet. Start by noticing one kind moment.</div>;

  return (
    <>
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
