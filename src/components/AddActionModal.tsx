"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { negativeBehaviours, positiveBehaviours, repairActions } from "@/lib/defaults";
import { useKindPoints } from "@/lib/store";
import { ActionType, BehaviourTemplate, Child } from "@/lib/types";
import { actionsForChild, cn, positiveRatio, todaysNegativeCount } from "@/lib/utils";

export function AddActionModal({ open, child, onClose }: { open: boolean; child?: Child; onClose: () => void }) {
  const { data, addAction, addCustomAction } = useKindPoints();
  const [tab, setTab] = useState<ActionType>("positive");
  const [note, setNote] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customPoints, setCustomPoints] = useState(10);
  const [saveCustom, setSaveCustom] = useState(false);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [pinAttempt, setPinAttempt] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const childActions = child ? actionsForChild(data.actions, child.id) : [];
  const ratio = positiveRatio(childActions);
  const tooManyCorrections = todaysNegativeCount(childActions) >= 3;
  const templates = useMemo(() => {
    const custom = data.customActions.filter((action) => action.category === tab).map<BehaviourTemplate>((action) => ({ title: action.title, type: action.category, points: action.points, emoji: tab === "negative" ? "🧡" : "✨" }));
    const base = tab === "positive" ? positiveBehaviours : tab === "negative" ? negativeBehaviours : repairActions;
    return [...base, ...custom];
  }, [data.customActions, tab]);

  useEffect(() => {
    if (!open) {
      setUnlocked(false);
      setPinAttempt("");
    }
  }, [open]);

  if (!open || !child) return null;

  const needsPin = Boolean(data.settings.parentPin) && !unlocked;

  async function record(template: BehaviourTemplate) {
    if (!child) return;
    const created = await addAction({ childId: child.id, title: template.title, type: template.type, points: template.points, note: note.trim() || undefined });
    setLastPoints(created?.points ?? null);
    setNote("");
  }

  async function submitCustom(event: FormEvent) {
    event.preventDefault();
    if (!child) return;
    if (!customTitle.trim()) return;
    const points = tab === "negative" ? -Math.abs(customPoints) : Math.abs(customPoints);
    const created = await addAction({ childId: child.id, title: customTitle.trim(), type: tab, points, note: note.trim() || undefined });
    if (saveCustom) await addCustomAction({ title: customTitle.trim(), category: tab, points, note: note.trim() || undefined });
    setCustomTitle("");
    setNote("");
    setSaveCustom(false);
    setLastPoints(created?.points ?? points);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-900/30 p-3 sm:place-items-center">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">Record action for {child.name}</h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-300">Track effort, repair, and growth.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 dark:bg-slate-700" aria-label="Close add action modal"><X className="h-5 w-5" /></button>
        </div>
        {needsPin ? (
          <form onSubmit={(event) => { event.preventDefault(); if (pinAttempt === data.settings.parentPin) setUnlocked(true); }} className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
            <h3 className="font-black">Parent PIN</h3>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">Enter the parent PIN to record point changes.</p>
            <input type="password" value={pinAttempt} onChange={(event) => setPinAttempt(event.target.value)} className="mt-3 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-800" placeholder="PIN" />
            <button className="mt-3 min-h-12 w-full rounded-2xl bg-blueberry px-4 py-3 font-black text-white">Unlock</button>
          </form>
        ) : (
          <>
        {lastPoints !== null ? <div className="mb-3 animate-pop rounded-2xl bg-mint px-4 py-3 text-sm font-black text-leaf dark:bg-emerald-950 dark:text-emerald-200">{lastPoints >= 0 ? "+" : ""}{lastPoints} points added. Nice moment to notice.</div> : null}
        {tab === "negative" && tooManyCorrections ? <div className="mb-3 rounded-2xl bg-peach px-4 py-3 text-sm font-black text-amber-900 dark:bg-orange-950 dark:text-orange-100">Pause check: this is several corrections today. Try adding three positive recognitions before another correction.</div> : null}
        {ratio < 3 && childActions.some((action) => action.type === "negative") ? <div className="mb-3 rounded-2xl bg-sunshine px-4 py-3 text-sm font-black text-slate-700 dark:bg-amber-900/40 dark:text-amber-100">Fairness nudge: the current positive-to-correction ratio is below 3:1.</div> : null}
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-700">
          {(["positive", "negative", "repair"] as ActionType[]).map((item) => <button key={item} onClick={() => setTab(item)} className={cn("min-h-11 rounded-xl text-sm font-black capitalize", tab === item ? "bg-white text-blueberry shadow-sm dark:bg-slate-900 dark:text-sky-300" : "text-slate-500 dark:text-slate-300")}>{item}</button>)}
        </div>
        {tab === "negative" ? <p className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-300">Corrections use orange language, never punish emotions, and suggest repair actions right away.</p> : null}
        <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-4 min-h-20 w-full rounded-2xl border border-slate-200 bg-white p-3 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Optional parent note" />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {templates.map((template) => <button key={`${template.title}-${template.points}`} onClick={() => record(template)} className={cn("flex min-h-14 items-center justify-between rounded-2xl px-4 py-3 text-left font-black transition hover:scale-[1.01]", template.type === "negative" ? "bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100" : template.type === "repair" ? "bg-sunshine text-slate-800 dark:bg-amber-900/40 dark:text-amber-100" : "bg-mint text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100")}>
            <span className="flex items-center gap-2"><span className="text-xl">{template.emoji}</span>{template.title}</span>
            <span>{template.points > 0 ? "+" : ""}{template.points}</span>
          </button>)}
        </div>
        <form onSubmit={submitCustom} className="mt-5 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
          <h3 className="font-black">Custom behaviour</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px]">
            <input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-800" placeholder="Title" />
            <input type="number" value={customPoints} onChange={(event) => setCustomPoints(Number(event.target.value))} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-800" />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-200"><input type="checkbox" checked={saveCustom} onChange={(event) => setSaveCustom(event.target.checked)} className="h-5 w-5 rounded" /> Save as reusable action</label>
          <button className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white"><Check className="h-5 w-5" /> Add custom action</button>
        </form>
          </>
        )}
      </div>
    </div>
  );
}
