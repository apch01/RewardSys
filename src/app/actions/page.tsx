"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, ClipboardList, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { negativeBehaviours, positiveBehaviours, repairActions } from "@/lib/defaults";
import { useKindPoints } from "@/lib/store";
import { ActionType, CustomAction } from "@/lib/types";

type PresetAction = {
  key: string;
  title: string;
  category: ActionType;
  points: number;
  emoji: string;
  defaultSortIndex: number;
};

type DeleteTarget =
  | { kind: "custom"; id: string; title: string }
  | { kind: "preset"; presetKey: string; title: string };

export default function ActionsPage() {
  const { data, addCustomAction, updateCustomAction, deleteCustomAction } = useKindPoints();
  const [tab, setTab] = useState<ActionType>("positive");
  const [title, setTitle] = useState("");
  const [pointsInput, setPointsInput] = useState("10");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPresetKey, setEditingPresetKey] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPointsInput, setEditPointsInput] = useState("10");
  const [editNote, setEditNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const presetActions = useMemo(() => {
    const asPreset = (items: typeof positiveBehaviours, type: ActionType) => items.map((item, index) => ({
      key: `${type}:${index}`,
      title: item.title,
      category: type,
      points: item.points,
      emoji: item.emoji,
      defaultSortIndex: index + 1
    }));
    return [
      ...asPreset(positiveBehaviours, "positive"),
      ...asPreset(negativeBehaviours, "negative"),
      ...asPreset(repairActions, "repair")
    ] as PresetAction[];
  }, []);

  const presetByKey = useMemo(() => new Map(presetActions.map((preset) => [preset.key, preset])), [presetActions]);

  const presetOverrides = useMemo(() => {
    return new Map(data.customActions.filter((action) => action.presetKey).map((action) => [action.presetKey as string, action]));
  }, [data.customActions]);

  const tabPresets = useMemo(() => {
    return presetActions
      .filter((preset) => preset.category === tab)
      .map((preset) => {
        const override = presetOverrides.get(preset.key);
        return {
          preset,
          override,
          isDeleted: Boolean(override?.disabled),
          shownTitle: override?.title ?? preset.title,
          shownPoints: override?.points ?? preset.points,
          shownNote: override?.note,
          sortIndex: override?.sortIndex ?? preset.defaultSortIndex
        };
      })
      .sort((a, b) => a.sortIndex - b.sortIndex);
  }, [presetActions, presetOverrides, tab]);

  const customActionsForTab = useMemo(() => {
    return data.customActions
      .filter((action) => action.category === tab && !action.presetKey && !action.disabled)
      .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
  }, [data.customActions, tab]);

  function parsePoints(input: string) {
    const parsed = Number(input);
    if (!Number.isFinite(parsed)) return 1;
    return Math.max(1, Math.round(Math.abs(parsed)));
  }

  function badgeClass(item: ActionType) {
    if (item === "negative") return "bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100";
    if (item === "repair") return "bg-sunshine text-slate-800 dark:bg-amber-900/40 dark:text-amber-100";
    return "bg-mint text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100";
  }

  async function upsertPresetOverride(presetKey: string, updates: Partial<Pick<CustomAction, "title" | "points" | "note" | "disabled" | "sortIndex">>) {
    const preset = presetByKey.get(presetKey);
    if (!preset) return;
    const existingOverride = presetOverrides.get(presetKey);

    const payload = {
      title: updates.title ?? existingOverride?.title ?? preset.title,
      category: preset.category,
      points: updates.points ?? existingOverride?.points ?? preset.points,
      note: updates.note ?? existingOverride?.note,
      presetKey,
      disabled: updates.disabled ?? existingOverride?.disabled ?? false,
      sortIndex: updates.sortIndex ?? existingOverride?.sortIndex ?? preset.defaultSortIndex
    };

    if (existingOverride) {
      await updateCustomAction(existingOverride.id, payload);
    } else {
      await addCustomAction(payload);
    }
  }

  async function movePreset(presetKey: string, direction: -1 | 1) {
    const index = tabPresets.findIndex((item) => item.preset.key === presetKey);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= tabPresets.length) return;

    const ordered = [...tabPresets];
    const [moved] = ordered.splice(index, 1);
    ordered.splice(nextIndex, 0, moved);

    for (let i = 0; i < ordered.length; i += 1) {
      await upsertPresetOverride(ordered[i].preset.key, { sortIndex: i + 1 });
    }
  }

  async function moveCustom(action: CustomAction, direction: -1 | 1) {
    const index = customActionsForTab.findIndex((item) => item.id === action.id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= customActionsForTab.length) return;

    const current = customActionsForTab[index];
    const next = customActionsForTab[nextIndex];
    await updateCustomAction(current.id, {
      title: current.title,
      category: current.category,
      points: current.points,
      note: current.note,
      sortIndex: next.sortIndex ?? nextIndex + 1
    });
    await updateCustomAction(next.id, {
      title: next.title,
      category: next.category,
      points: next.points,
      note: next.note,
      sortIndex: current.sortIndex ?? index + 1
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const basePoints = parsePoints(pointsInput);
    const points = tab === "negative" ? -basePoints : basePoints;
    const nextSortIndex = (customActionsForTab[customActionsForTab.length - 1]?.sortIndex ?? customActionsForTab.length) + 1;
    await addCustomAction({ title: title.trim(), category: tab, points, note: note.trim() || undefined, sortIndex: nextSortIndex });
    setTitle("");
    setPointsInput("10");
    setNote("");
  }

  function startEdit(action: CustomAction) {
    setEditingId(action.id);
    setEditingPresetKey(null);
    setEditTitle(action.title);
    setEditPointsInput(String(Math.abs(action.points)));
    setEditNote(action.note ?? "");
  }

  function startPresetEdit(presetKey: string) {
    const preset = presetByKey.get(presetKey);
    if (!preset) return;
    const override = presetOverrides.get(presetKey);
    setEditingPresetKey(presetKey);
    setEditingId(null);
    setEditTitle(override?.title ?? preset.title);
    setEditPointsInput(String(Math.abs(override?.points ?? preset.points)));
    setEditNote(override?.note ?? "");
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId || !editTitle.trim()) return;
    const existing = customActionsForTab.find((item) => item.id === editingId);
    if (!existing) return;
    const basePoints = parsePoints(editPointsInput);
    const points = tab === "negative" ? -basePoints : basePoints;
    await updateCustomAction(editingId, {
      title: editTitle.trim(),
      category: existing.category,
      points,
      note: editNote.trim() || undefined,
      sortIndex: existing.sortIndex
    });
    setEditingId(null);
  }

  async function savePresetEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingPresetKey || !editTitle.trim()) return;
    const preset = presetByKey.get(editingPresetKey);
    if (!preset) return;
    const basePoints = parsePoints(editPointsInput);
    const points = preset.category === "negative" ? -basePoints : basePoints;
    await upsertPresetOverride(editingPresetKey, { title: editTitle.trim(), points, note: editNote.trim() || undefined, disabled: false });
    setEditingPresetKey(null);
  }

  function removeAction(action: CustomAction) {
    setDeleteTarget({ kind: "custom", id: action.id, title: action.title });
  }

  function deletePreset(presetKey: string) {
    const preset = presetByKey.get(presetKey);
    const override = presetOverrides.get(presetKey);
    if (!preset) return;
    setDeleteTarget({ kind: "preset", presetKey, title: override?.title ?? preset.title });
  }

  async function restorePreset(presetKey: string) {
    await upsertPresetOverride(presetKey, { disabled: false });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "custom") {
      await deleteCustomAction(deleteTarget.id);
      if (editingId === deleteTarget.id) setEditingId(null);
    }
    if (deleteTarget.kind === "preset") {
      await upsertPresetOverride(deleteTarget.presetKey, { disabled: true });
      if (editingPresetKey === deleteTarget.presetKey) setEditingPresetKey(null);
    }
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-3xl bg-skywash text-blueberry dark:bg-slate-700 dark:text-sky-300"><ClipboardList className="h-7 w-7" /></span>
          <div>
            <h1 className="text-3xl font-black">Actions</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">Manage preset and custom templates by category, then reorder them for the record-action picker.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-700">
          {(["positive", "negative", "repair"] as ActionType[]).map((item) => <button key={item} type="button" onClick={() => { setTab(item); setEditingId(null); setEditingPresetKey(null); }} className={`min-h-11 rounded-xl text-sm font-black capitalize ${tab === item ? "bg-white text-blueberry shadow-sm dark:bg-slate-900 dark:text-sky-300" : "text-slate-500 dark:text-slate-300"}`}>{item}</button>)}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black">Preset actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {tabPresets.map((item, index) => {
            const isEditing = editingPresetKey === item.preset.key;

            if (isEditing) {
              return (
                <form key={item.preset.key} onSubmit={savePresetEdit} className="rounded-3xl bg-white p-4 shadow-soft dark:bg-slate-800">
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
              <article key={item.preset.key} className="rounded-3xl bg-white p-4 shadow-soft dark:bg-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{item.preset.emoji} {item.shownTitle}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{item.isDeleted ? "Deleted from picker" : item.shownNote || "Preset action"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${badgeClass(item.preset.category)}`}>{item.preset.category}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-black text-blueberry dark:text-sky-300">{item.shownPoints > 0 ? "+" : ""}{item.shownPoints} pts</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => movePreset(item.preset.key, -1)} disabled={index === 0} className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 disabled:opacity-50 dark:bg-slate-700" aria-label={`Move ${item.shownTitle} up`}><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => movePreset(item.preset.key, 1)} disabled={index === tabPresets.length - 1} className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 disabled:opacity-50 dark:bg-slate-700" aria-label={`Move ${item.shownTitle} down`}><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" onClick={() => startPresetEdit(item.preset.key)} className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-700" aria-label={`Edit ${item.shownTitle}`}><Pencil className="h-5 w-5" /></button>
                    {item.isDeleted ? <button type="button" onClick={() => restorePreset(item.preset.key)} className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100" aria-label={`Restore ${item.shownTitle}`}><RotateCcw className="h-4 w-4" /></button> : <button type="button" onClick={() => deletePreset(item.preset.key)} className="grid h-11 w-11 place-items-center rounded-2xl bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100" aria-label={`Delete ${item.shownTitle}`}><Trash2 className="h-5 w-5" /></button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h2 className="text-xl font-black">Custom actions</h2>
        <form onSubmit={submit} className="mt-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Action title" />
            <input type="number" value={pointsInput} min={1} onChange={(event) => setPointsInput(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" />
          </div>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-white p-3 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Optional note" />
          <button className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white"><Plus className="h-5 w-5" /> Add custom action</button>
        </form>
      </section>

      <section>
        {customActionsForTab.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {customActionsForTab.map((action, index) => editingId === action.id ? (
              <form key={action.id} onSubmit={saveEdit} className="rounded-3xl bg-white p-4 shadow-soft dark:bg-slate-800">
                <h3 className="font-black">Edit custom action</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_110px]">
                  <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Action title" />
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
                    <button type="button" onClick={() => moveCustom(action, -1)} disabled={index === 0} className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 disabled:opacity-50 dark:bg-slate-700" aria-label={`Move ${action.title} up`}><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => moveCustom(action, 1)} disabled={index === customActionsForTab.length - 1} className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 disabled:opacity-50 dark:bg-slate-700" aria-label={`Move ${action.title} down`}><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" onClick={() => startEdit(action)} className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-700" aria-label={`Edit ${action.title}`}><Pencil className="h-5 w-5" /></button>
                    <button type="button" onClick={() => removeAction(action)} className="grid h-11 w-11 place-items-center rounded-2xl bg-peach text-amber-950 dark:bg-orange-950 dark:text-orange-100" aria-label={`Delete ${action.title}`}><Trash2 className="h-5 w-5" /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-5 text-sm font-bold text-slate-500 shadow-soft dark:bg-slate-800 dark:text-slate-300">No custom actions in this category yet.</div>
        )}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-slate-900/30 p-3 sm:place-items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
            <h2 className="text-xl font-black">Delete action?</h2>
            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">
              {deleteTarget.kind === "preset"
                ? `This will hide "${deleteTarget.title}" from the action picker. Previously saved child actions stay unchanged.`
                : `This will delete "${deleteTarget.title}" from reusable custom actions. Previously saved child actions stay unchanged.`}
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
