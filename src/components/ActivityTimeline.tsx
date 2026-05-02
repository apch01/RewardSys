"use client";

import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useKindPoints } from "@/lib/store";
import { Action, Child } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ActivityTimeline({ actions, childrenList, limit }: { actions: Action[]; childrenList: Child[]; limit?: number }) {
  const { undoAction } = useKindPoints();
  const visible = [...actions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, limit ?? actions.length);

  function removeAction(action: Action) {
    if (!window.confirm(`Remove "${action.title}" from the activity history and reverse its points?`)) return;
    undoAction(action.id);
  }

  if (!visible.length) return <div className="rounded-3xl bg-white p-5 text-center font-bold text-slate-500 shadow-soft dark:bg-slate-800 dark:text-slate-300">No actions yet. Start by noticing one kind moment.</div>;

  return (
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
                <button onClick={() => removeAction(action)} className="grid h-10 w-10 place-items-center rounded-full bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100" aria-label="Remove action"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
