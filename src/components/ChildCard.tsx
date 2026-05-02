"use client";

import Link from "next/link";
import { Award, Gift, TrendingUp } from "lucide-react";
import { Action, Child, Reward } from "@/lib/types";
import { actionsForChild, availableRewards, childLevel, positiveStreak, todayPoints, weeklyPoints } from "@/lib/utils";
import { ProgressBar } from "./ProgressBar";

export function ChildCard({ child, actions, rewards }: { child: Child; actions: Action[]; rewards: Reward[] }) {
  const childActions = actionsForChild(actions, child.id);
  const nextReward = rewards.filter((reward) => !reward.redeemed && reward.cost > child.points).sort((a, b) => a.cost - b.cost)[0];
  const progress = nextReward ? (child.points / nextReward.cost) * 100 : 100;

  return (
    <Link href={`/children/${child.id}`} className="block animate-floatUp rounded-3xl bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-skywash text-4xl dark:bg-slate-700">{child.avatar}</div>
          <div>
            <h2 className="text-xl font-black">{child.name}</h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-300">{childLevel(child.points)}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-mint px-3 py-2 text-center text-leaf dark:bg-emerald-950 dark:text-emerald-200">
          <div className="text-2xl font-black">{child.points}</div>
          <div className="text-[11px] font-extrabold uppercase">points</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <MiniStat icon={<TrendingUp className="h-4 w-4" />} label="Today" value={todayPoints(childActions)} />
        <MiniStat icon={<Award className="h-4 w-4" />} label="Week" value={weeklyPoints(childActions)} />
        <MiniStat icon={<Gift className="h-4 w-4" />} label="Rewards" value={availableRewards(rewards, child.points).length} />
      </div>
      <div className="mt-4">
        <ProgressBar value={progress} label={nextReward ? `${nextReward.cost - child.points} points to ${nextReward.title}` : "All current rewards unlocked"} />
      </div>
      <div className="mt-3 rounded-2xl bg-sunshine/60 px-3 py-2 text-sm font-extrabold text-slate-700 dark:bg-amber-900/30 dark:text-amber-100">🔥 Positive streak: {positiveStreak(childActions)}</div>
    </Link>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-2 py-3 dark:bg-slate-700/70">
      <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center text-blueberry dark:text-sky-300">{icon}</div>
      <div className="text-base font-black">{value}</div>
      <div className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-300">{label}</div>
    </div>
  );
}
