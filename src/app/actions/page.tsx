"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, ClipboardList, Pencil, Plus, Trash2, X } from "lucide-react";
import { negativeBehaviours, positiveBehaviours, repairActions } from "@/lib/defaults";
import { useKindPoints } from "@/lib/store";
import { ActionType, CustomAction } from "@/lib/types";

type DeleteTarget =
  | { kind: "custom"; id: string; title: string }
  | { kind: "presetOverride"; presetKey: string; title: string };

export default function ActionsPage() {
  const { data, addCustomAction, updateCustomAction, deleteCustomAction } = useKindPoints();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ActionType>("positive");
  const [pointsInput, setPointsInput] = useState("10");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPresetKey, setEditingPresetKey] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<ActionType>("positive");
  const [editPointsInput, setEditPointsInput] = useState("10");
  const [editNote, setEditNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const presetActions = useMemo(() => {
    const asPreset = (items: typeof positiveBehaviours, type: ActionType) => items.map((item, index) => ({
      key: `${type}:${index}`,
      title: item.title,
      category: type,
      points: item.points,
      emoji: item.emoji
    }));
    return [
      ...asPreset(positiveBehaviours, "positive"),
      ...asPreset(negativeBehaviours, "negative"),
      ...asPreset(repairActions, "repair")
    ];
  }, []);

  const presetOverrides = useMemo(() => {
    return new Map(data.customActions.filter((action) => action.presetKey).map((action) => [action.presetKey as string, action]));
  }, [data.customActions]);

  const standaloneCustomActions = useMemo(() => data.customActions.filter((action) => !action.presetKey), [data.customActions]);

  function parsePoints(input: string) {
    const parsed = Number(input);
    if (!Number.isFinite(parsed)) return 1;
    return Math.max(1, Math.round(Math.abs(parsed)));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const basePoints = parsePoints(pointsInput);
    const points = category === "negative" ? -basePoints : basePoints;
    await addCustomAction({ title: title.trim(), category, points, note: note.trim() || undefined });
    setTitle("");
    setCategory("positive");
    setPointsInput("10");
    setNote("");
  }

  function startEdit(action: CustomAction) {
    setEditingId(action.id);
    setEditingPresetKey(null);
    setEditTitle(action.title);
    setEditCategory(action.category);
    setEditPointsInput(String(Math.abs(action.points)));
    setEditNote(action.note ?? "");
  }

  function startPresetEdit(presetKey: string, type: ActionType) {
    const fallbackPreset = presetActions.find((item) => item.key === presetKey);
    if (!fallbackPreset) return;
    const override = presetOverrides.get(presetKey);
    setEditingPresetKey(presetKey);
    setEditingId(null);
    setEditTitle(override?.title ?? fallbackPreset.title);
    setEditCategory(type);
    setEditPointsInput(String(Math.abs(override?.points ?? fallbackPreset.points)));
    setEditNote(override?.note ?? "");
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId || !editTitle.trim()) return;
    const basePoints = parsePoints(editPointsInput);
    const points = editCategory === "negative" ? -basePoints : basePoints;
    await updateCustomAction(editingId, { title: editTitle.trim(), category: editCategory, points, note: editNote.trim() || undefined });
    setEditingId(null);
  }

  async function savePresetEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingPresetKey || !editTitle.trim()) return;
    const basePoints = parsePoints(editPointsInput);
    const points = editCategory === "negative" ? -basePoints : basePoints;
    const existingOverride = presetOverrides.get(editingPresetKey);
    if (existingOverride) {
      await updateCustomAction(existingOverride.id, {
        title: editTitle.trim(),
        category: editCategory,
        points,
        note: editNote.trim() || undefined,
        presetKey: editingPresetKey
      });
    } else {
      await addCustomAction({
        title: editTitle.trim(),
        category: editCategory,
        points,
        note: editNote.trim() || undefined,
        presetKey: editingPresetKey
      });
    }
    setEditingPresetKey(null);
  }

  async function removeAction(action: CustomAction) {
    setDeleteTarget({ kind: "custom", id: action.id, title: action.title });
  }

  async function resetPreset(presetKey: string) {
    const override = presetOverrides.get(presetKey);
    if (!override) return;
    setDeleteTarget({ kind: "presetOverride", presetKey, title: override.title });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "custom") {
      await deleteCustomAction(deleteTarget.id);
      if (editingId === deleteTarget.id) setEditingId(null);
    }
    if (deleteTarget.kind === "presetOverride") {
      const override = presetOverrides.get(deleteTarget.presetKey);
      if (override) await deleteCustomAction(override.id);
      if (editingPresetKey === deleteTarget.presetKey) setEditingPresetKey(null);
    }
    setDeleteTarget(null);
  }

  function badgeClass(item: ActionType) {
    if (item === "negative") return "bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100";
    if (item === "repair") return "bg-sunshine text-slate-800 dark:bg-amber-900/40 dark:text-amber-100";
    return "bg-mint text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-3xl bg-skywash text-blueberry dark:bg-slate-700 dark:text-sky-300"><ClipboardList className="h-7 w-7" /></span>
          <div>
            <h1 className="text-3xl font-black">Actions</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">Create and manage reusable action templates for positive, negative, and repair moments.</p>
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h2 className="text-xl font-black">Add custom action</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_130px_120px]">
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Action title" />
          <select value={category} onChange={(event) => setCategory(event.target.value as ActionType)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900">
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="repair">Repair</option>
          </select>
          <input type="number" value={pointsInput} min={1} onChange={(event) => setPointsInput(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" />
        </div>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-white p-3 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Optional note" />
        <button className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white"><Plus className="h-5 w-5" /> Add action</button>
      </form>

      <section>
        <h2 className="mb-3 text-xl font-black">Preset actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {presetActions.map((preset) => {
            const override = presetOverrides.get(preset.key);
            const shownTitle = override?.title ?? preset.title;
            const shownPoints = override?.points ?? preset.points;
            const shownNote = override?.note;
            const isEditing = editingPresetKey === preset.key;

            if (isEditing) {
              return (
                <form key={preset.key} onSubmit={savePresetEdit} className="rounded-3xl bg-white p-4 shadow-soft dark:bg-slate-800">
                  <h3 className="font-black">Edit preset action</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_110px]">
                    <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Action title" />
                    <input type="number" value={editPointsInput} min={1} onChange={(event) => setEditPointsInput(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" />
                  </div>
                  <textarea value={editNote} onChange={(event) => setEditNote(event.target.value)} className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-white p-3 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Optional note" />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white"><Check className="h-5 w-5" /> Save</button>
                    <button type="button" onClick={() => setEditingPresetKey(null)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-600 dark:bg-slate-700 dark:text-slate-200"><X className="h-5 w-5" /> Cancel</button>
                  </div>
                </form>
              );
            }

            return (
              <article key={preset.key} className="rounded-3xl bg-white p-4 shadow-soft dark:bg-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{preset.emoji} {shownTitle}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{shownNote || "Preset action"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${badgeClass(preset.category)}`}>{preset.category}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-black text-blueberry dark:text-sky-300">{shownPoints > 0 ? "+" : ""}{shownPoints} pts</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => startPresetEdit(preset.key, preset.category)} className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-700" aria-label={`Edit ${shownTitle}`}><Pencil className="h-5 w-5" /></button>
                    {override ? <button type="button" onClick={() => resetPreset(preset.key)} className="grid h-11 w-11 place-items-center rounded-2xl bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100" aria-label={`Reset ${shownTitle}`}><Trash2 className="h-5 w-5" /></button> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black">Custom actions</h2>
        {standaloneCustomActions.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {standaloneCustomActions.map((action) => editingId === action.id ? (
              <form key={action.id} onSubmit={saveEdit} className="rounded-3xl bg-white p-4 shadow-soft dark:bg-slate-800">
                <h3 className="font-black">Edit action</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_130px_110px]">
                  <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Action title" />
                  <select value={editCategory} onChange={(event) => setEditCategory(event.target.value as ActionType)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900">
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="repair">Repair</option>
                  </select>
                  <input type="number" value={editPointsInput} min={1} onChange={(event) => setEditPointsInput(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" />
                </div>
                <textarea value={editNote} onChange={(event) => setEditNote(event.target.value)} className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-white p-3 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Optional note" />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white"><Check className="h-5 w-5" /> Save</button>
                  <button type="button" onClick={() => setEditingId(null)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-600 dark:bg-slate-700 dark:text-slate-200"><X className="h-5 w-5" /> Cancel</button>
                </div>
              </form>
            ) : (
              <article key={action.id} className="rounded-3xl bg-white p-4 shadow-soft dark:bg-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{action.title}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{action.note || "No note"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${badgeClass(action.category)}`}>{action.category}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-black text-blueberry dark:text-sky-300">{action.points > 0 ? "+" : ""}{action.points} pts</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => startEdit(action)} className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-700" aria-label={`Edit ${action.title}`}><Pencil className="h-5 w-5" /></button>
                    <button type="button" onClick={() => removeAction(action)} className="grid h-11 w-11 place-items-center rounded-2xl bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100" aria-label={`Delete ${action.title}`}><Trash2 className="h-5 w-5" /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-5 text-sm font-bold text-slate-500 shadow-soft dark:bg-slate-800 dark:text-slate-300">No custom actions yet. Add one above to reuse it in the action modal.</div>
        )}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-slate-900/30 p-3 sm:place-items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
            <h2 className="text-xl font-black">Delete action?</h2>
            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">
              {deleteTarget.kind === "presetOverride"
                ? `This will reset "${deleteTarget.title}" back to its default preset values.`
                : `This will delete "${deleteTarget.title}" from your reusable custom actions.`}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="flex min-h-12 items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-700 dark:bg-slate-700 dark:text-slate-100">Cancel</button>
              <button type="button" onClick={confirmDelete} className="flex min-h-12 items-center justify-center rounded-2xl bg-peach px-4 py-3 font-black text-amber-950 dark:bg-orange-950 dark:text-orange-100">Yes, delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
