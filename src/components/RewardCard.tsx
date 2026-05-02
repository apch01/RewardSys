"use client";

import { Gift, Pencil, Trash2 } from "lucide-react";
import { Reward } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RewardCard({ reward, canRedeem, onRedeem, onEdit, onDelete, busy }: { reward: Reward; canRedeem: boolean; onRedeem?: () => void; onEdit?: () => void; onDelete?: () => void; busy?: boolean }) {
  return (
    <div className={cn("rounded-3xl bg-white p-4 shadow-soft dark:bg-slate-800", reward.redeemed && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sunshine text-2xl"><Gift className="h-6 w-6 text-amber-700" /></span>
          <div>
            <h3 className="font-black">{reward.title}</h3>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{reward.description}</p>
          </div>
        </div>
        <span className="rounded-full bg-skywash px-3 py-1 text-sm font-black text-blueberry dark:bg-slate-700 dark:text-sky-300">{reward.cost}</span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {onRedeem && (canRedeem || reward.redeemed) ? <button disabled={reward.redeemed || busy} onClick={onRedeem} className="min-h-12 flex-1 rounded-2xl bg-blueberry px-4 py-3 font-black text-white disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700">{reward.redeemed ? "Redeemed" : busy ? "Processing" : "Redeem reward"}</button> : null}
        <div className="ml-auto flex items-center gap-2">
          {onEdit ? <button type="button" disabled={busy} onClick={onEdit} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600 disabled:opacity-60 dark:bg-slate-700 dark:text-slate-200" aria-label={`Edit ${reward.title}`}><Pencil className="h-5 w-5" /></button> : null}
          {onDelete ? <button type="button" disabled={busy} onClick={onDelete} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-peach text-amber-950 disabled:opacity-60 dark:bg-orange-950 dark:text-orange-100" aria-label={`Delete ${reward.title}`}><Trash2 className="h-5 w-5" /></button> : null}
        </div>
      </div>
    </div>
  );
}
