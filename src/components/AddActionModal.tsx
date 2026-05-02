"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, MinusCircle, X } from "lucide-react";
import { negativeBehaviours, positiveBehaviours, repairActions } from "@/lib/defaults";
import { useKindPoints } from "@/lib/store";
import { ActionType, BehaviourTemplate, Child } from "@/lib/types";
import { actionsForChild, cn, positiveRatio, todaysNegativeCount } from "@/lib/utils";

export function AddActionModal({ open, child, onClose }: { open: boolean; child?: Child; onClose: () => void }) {
  const { data, addAction, addCustomAction } = useKindPoints();
  const [tab, setTab] = useState<ActionType>("positive");
  const [note, setNote] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customPointsInput, setCustomPointsInput] = useState("10");
  const [saveCustom, setSaveCustom] = useState(false);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ points: number; title: string; id: number } | null>(null);
  const [pinAttempt, setPinAttempt] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  function parsePoints(input: string) {
    const parsed = Number(input);
    if (!Number.isFinite(parsed)) return 1;
    return Math.max(1, Math.round(Math.abs(parsed)));
  }

  const childActions = child ? actionsForChild(data.actions, child.id) : [];
  const ratio = positiveRatio(childActions);
  const tooManyCorrections = todaysNegativeCount(childActions) >= 3;
  const templates = useMemo(() => {
    const base = tab === "positive" ? positiveBehaviours : tab === "negative" ? negativeBehaviours : repairActions;
    const presetWithKeys = base.map((template, index) => ({ ...template, key: `${tab}:${index}`, defaultIndex: index }));
    const overrideByPresetKey = new Map(
      data.customActions
        .filter((action) => action.presetKey)
        .map((action) => [action.presetKey as string, action])
    );

    const presetItems = presetWithKeys.map((template) => {
      const override = overrideByPresetKey.get(template.key);
      if (!override) return { template, sortIndex: template.defaultIndex, disabled: false };
      return {
        template: {
          title: override.title,
          type: override.category,
          points: override.points,
          emoji: template.emoji
        },
        sortIndex: override.sortIndex ?? template.defaultIndex,
        disabled: Boolean(override.disabled)
      };
    }).filter((item) => !item.disabled).map((item) => ({ ...item, kind: "preset" as const }));

    const customItems = data.customActions
      .filter((action) => action.category === tab && !action.presetKey && !action.disabled)
      .map((action, index) => ({
        template: { title: action.title, type: action.category, points: action.points, emoji: tab === "negative" ? "🧡" : "✨" } as BehaviourTemplate,
        sortIndex: action.sortIndex ?? 1000 + index,
        kind: "custom" as const
      }))
      .sort((a, b) => a.sortIndex - b.sortIndex);

    return [...presetItems, ...customItems].sort((a, b) => a.sortIndex - b.sortIndex).map((item) => item.template);
  }, [data.customActions, tab]);

  useEffect(() => {
    if (!open) {
      setUnlocked(false);
      setPinAttempt("");
      setFeedback(null);
      setLastPoints(null);
    }
  }, [open]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  if (!open || !child) return null;

  const needsPin = Boolean(data.settings.parentPin) && !unlocked;

  async function record(template: BehaviourTemplate) {
    if (!child) return;
    const created = await addAction({ childId: child.id, title: template.title, type: template.type, points: template.points, note: note.trim() || undefined });
    const points = created?.points ?? 0;
    setLastPoints(points);
    setFeedback({ points, title: template.title, id: Date.now() });
    if (navigator.vibrate) navigator.vibrate(points < 0 ? [35, 30, 35] : 35);
    setNote("");
  }

  async function submitCustom(event: FormEvent) {
    event.preventDefault();
    if (!child) return;
    if (!customTitle.trim()) return;
    const basePoints = parsePoints(customPointsInput);
    const points = tab === "negative" ? -basePoints : basePoints;
    const created = await addAction({ childId: child.id, title: customTitle.trim(), type: tab, points, note: note.trim() || undefined });
    if (saveCustom) await addCustomAction({ title: customTitle.trim(), category: tab, points, note: note.trim() || undefined });
    const appliedPoints = created?.points ?? points;
    setFeedback({ points: appliedPoints, title: customTitle.trim(), id: Date.now() });
    if (navigator.vibrate) navigator.vibrate(appliedPoints < 0 ? [35, 30, 35] : 35);
    setCustomTitle("");
    setCustomPointsInput("10");
    setNote("");
    setSaveCustom(false);
    setLastPoints(appliedPoints);
  }

  function feedbackText(points: number) {
    if (points > 0) return `${points} point${points === 1 ? "" : "s"} added`;
    if (points < 0) return `${Math.abs(points)} point${Math.abs(points) === 1 ? "" : "s"} deducted`;
    return "No points changed";
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-900/30 p-3 sm:place-items-center">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        {feedback ? (
          <div key={feedback.id} role="status" aria-live="polite" className={cn("fixed left-4 right-4 top-4 z-[60] mx-auto flex max-w-md animate-pop items-center gap-3 rounded-3xl px-4 py-3 font-black shadow-soft sm:absolute sm:left-1/2 sm:right-auto sm:-translate-x-1/2", feedback.points < 0 ? "bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100" : feedback.points > 0 ? "bg-mint text-leaf dark:bg-emerald-950 dark:text-emerald-100" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100")}>
            {feedback.points < 0 ? <MinusCircle className="h-6 w-6 shrink-0" /> : <CheckCircle2 className="h-6 w-6 shrink-0" />}
            <div>
              <div>{feedbackText(feedback.points)}</div>
              <div className="text-xs font-extrabold opacity-80">{feedback.title}</div>
            </div>
          </div>
        ) : null}
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
        {lastPoints !== null ? <div className={cn("mb-3 rounded-2xl px-4 py-3 text-sm font-black", lastPoints < 0 ? "bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100" : "bg-mint text-leaf dark:bg-emerald-950 dark:text-emerald-200")}>{feedbackText(lastPoints)}.</div> : null}
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
            <input type="number" value={customPointsInput} onChange={(event) => setCustomPointsInput(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-800" />
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
