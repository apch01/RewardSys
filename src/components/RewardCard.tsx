"use client";

import { Gift } from "lucide-react";
import { Reward } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RewardCard({ reward, canRedeem, onRedeem }: { reward: Reward; canRedeem: boolean; onRedeem?: () => void }) {
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
      {onRedeem ? <button disabled={!canRedeem || reward.redeemed} onClick={onRedeem} className="mt-4 min-h-12 w-full rounded-2xl bg-blueberry px-4 py-3 font-black text-white disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700">{reward.redeemed ? "Redeemed" : canRedeem ? "Redeem reward" : "Keep growing"}</button> : null}
    </div>
  );
}
