"use client";

import { FormEvent, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useKindPoints } from "@/lib/store";
import { ActionType, CustomAction } from "@/lib/types";

export default function ActionsPage() {
  const { data, addCustomAction, updateCustomAction, deleteCustomAction } = useKindPoints();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ActionType>("positive");
  const [pointsInput, setPointsInput] = useState("10");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<ActionType>("positive");
  const [editPointsInput, setEditPointsInput] = useState("10");
  const [editNote, setEditNote] = useState("");

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
    setEditTitle(action.title);
    setEditCategory(action.category);
    setEditPointsInput(String(Math.abs(action.points)));
    setEditNote(action.note ?? "");
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId || !editTitle.trim()) return;
    const basePoints = parsePoints(editPointsInput);
    const points = editCategory === "negative" ? -basePoints : basePoints;
    await updateCustomAction(editingId, { title: editTitle.trim(), category: editCategory, points, note: editNote.trim() || undefined });
    setEditingId(null);
  }

  async function removeAction(action: CustomAction) {
    if (!window.confirm(`Delete action \"${action.title}\"?`)) return;
    await deleteCustomAction(action.id);
    if (editingId === action.id) setEditingId(null);
  }

  function badgeClass(item: ActionType) {
    if (item === "negative") return "bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100";
    if (item === "repair") return "bg-sunshine text-slate-800 dark:bg-amber-900/40 dark:text-amber-100";
    return "bg-mint text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h1 className="text-3xl font-black">Actions</h1>
        <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">Create and manage reusable action templates for positive, negative, and repair moments.</p>
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
        <h2 className="mb-3 text-xl font-black">Custom actions</h2>
        {data.customActions.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.customActions.map((action) => editingId === action.id ? (
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
    </div>
  );
}
