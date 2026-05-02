"use client";

import { useMemo, useState } from "react";
import { Gift, Plus, Sparkles, Target, TrendingUp, Users } from "lucide-react";
import { AddActionModal } from "@/components/AddActionModal";
import { AddChildModal } from "@/components/AddChildModal";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { ChildCard } from "@/components/ChildCard";
import { EmptyState } from "@/components/EmptyState";
import { ProgressBar } from "@/components/ProgressBar";
import { StatPill } from "@/components/StatPill";
import { kindnessChallenges } from "@/lib/defaults";
import { useKindPoints } from "@/lib/store";
import { Child } from "@/lib/types";
import { familyTotal, todayPoints, weeklyPoints } from "@/lib/utils";

export default function HomePage() {
  const { data } = useKindPoints();
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [actionChild, setActionChild] = useState<Child | undefined>();
  const challenge = useMemo(() => kindnessChallenges[new Date().getDay() % kindnessChallenges.length], []);
  const total = familyTotal(data.children);
  const goalProgress = data.settings.familyGoalTarget ? (total / data.settings.familyGoalTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-skywash via-white to-mint p-5 shadow-soft dark:from-slate-800 dark:via-slate-800 dark:to-slate-700">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold uppercase text-blueberry dark:text-sky-300">Growth, kindness, teamwork</p>
            <h1 className="mt-1 text-3xl font-black tracking-normal sm:text-4xl">Family Reward Points</h1>
            <p className="mt-2 max-w-xl text-sm font-bold text-slate-600 dark:text-slate-200">Celebrate positive choices, make space for repair, and keep each child on their own path.</p>
          </div>
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-sunshine text-4xl shadow-soft">⭐</span>
        </div>
        <div className="mt-5 rounded-3xl bg-white/80 p-4 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 text-sm font-black text-slate-600 dark:text-slate-200"><Sparkles className="h-4 w-4 text-amberSoft" /> Daily kindness challenge</div>
          <p className="mt-1 text-lg font-black">{challenge}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill icon={Users} label="Children" value={data.children.length} />
        <StatPill icon={TrendingUp} label="Today" value={todayPoints(data.actions)} />
        <StatPill icon={Sparkles} label="This week" value={weeklyPoints(data.actions)} />
        <StatPill icon={Gift} label="Rewards" value={data.rewards.filter((reward) => !reward.redeemed).length} />
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black">Family teamwork goal</h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-300">{total} / {data.settings.familyGoalTarget} points toward {data.settings.familyGoalTitle}</p>
          </div>
          <Target className="h-6 w-6 text-blueberry dark:text-sky-300" />
        </div>
        <ProgressBar value={goalProgress} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">Children</h2>
          <button onClick={() => setAddChildOpen(true)} className="flex min-h-11 items-center gap-2 rounded-2xl bg-blueberry px-4 py-2 font-black text-white shadow-soft"><Plus className="h-5 w-5" /> Add</button>
        </div>
        {data.children.length ? <div className="grid gap-4 sm:grid-cols-2">{data.children.map((child) => <div key={child.id} className="space-y-2"><ChildCard child={child} actions={data.actions} rewards={data.rewards} /><button onClick={() => setActionChild(child)} className="min-h-12 w-full rounded-2xl bg-slate-900 px-4 py-3 font-black text-white dark:bg-white dark:text-slate-900">Record action</button></div>)}</div> : <EmptyState title="Add your first child" text="KindPoints starts with one child and one positive moment." />}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black">Recent actions</h2>
        <ActivityTimeline actions={data.actions} childrenList={data.children} limit={10} allowChildFilter allowTypeFilter />
      </section>

      <AddChildModal open={addChildOpen} onClose={() => setAddChildOpen(false)} />
      <AddActionModal open={Boolean(actionChild)} child={actionChild} onClose={() => setActionChild(undefined)} />
    </div>
  );
}
