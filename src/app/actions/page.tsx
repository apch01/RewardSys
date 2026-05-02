"use client";

import { DragEvent, FormEvent, TouchEvent, useMemo, useState } from "react";
import { Check, ClipboardList, GripVertical, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
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

type CombinedAction = {
  key: string;
  kind: "preset" | "custom";
  title: string;
  category: ActionType;
  points: number;
  note?: string;
  sortIndex: number;
  emoji?: string;
  customId?: string;
  presetKey?: string;
  isDeleted?: boolean;
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
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPointsInput, setEditPointsInput] = useState("10");
  const [editNote, setEditNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [touchDropKey, setTouchDropKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const combinedActions = useMemo(() => {
    const presetRows = presetActions
      .filter((preset) => preset.category === tab)
      .map<CombinedAction>((preset) => {
        const override = presetOverrides.get(preset.key);
        return {
          key: `preset:${preset.key}`,
          kind: "preset",
          title: override?.title ?? preset.title,
          category: preset.category,
          points: override?.points ?? preset.points,
          note: override?.note,
          sortIndex: override?.sortIndex ?? preset.defaultSortIndex,
          emoji: preset.emoji,
          presetKey: preset.key,
          isDeleted: Boolean(override?.disabled)
        };
      });

    const customRows = data.customActions
      .filter((action) => action.category === tab && !action.presetKey && !action.disabled)
      .map<CombinedAction>((action) => ({
        key: `custom:${action.id}`,
        kind: "custom",
        title: action.title,
        category: action.category,
        points: action.points,
        note: action.note,
        sortIndex: action.sortIndex ?? 1000,
        customId: action.id
      }));

    return [...presetRows, ...customRows].sort((a, b) => a.sortIndex - b.sortIndex);
  }, [data.customActions, presetActions, presetOverrides, tab]);

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

  async function persistSortOrder(ordered: CombinedAction[]) {
    for (let index = 0; index < ordered.length; index += 1) {
      const item = ordered[index];
      const sortIndex = index + 1;
      if (item.kind === "preset" && item.presetKey) {
        await upsertPresetOverride(item.presetKey, { sortIndex });
      }
      if (item.kind === "custom" && item.customId) {
        const existing = data.customActions.find((action) => action.id === item.customId);
        if (!existing) continue;
        await updateCustomAction(item.customId, {
          title: existing.title,
          category: existing.category,
          points: existing.points,
          note: existing.note,
          sortIndex
        });
      }
    }
  }

  async function handleDrop(targetKey: string) {
    if (busy) return;
    if (!draggingKey || draggingKey === targetKey) return;
    const fromIndex = combinedActions.findIndex((item) => item.key === draggingKey);
    const toIndex = combinedActions.findIndex((item) => item.key === targetKey);
    if (fromIndex < 0 || toIndex < 0) return;

    const reordered = [...combinedActions];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setBusy(true);
    try {
      await persistSortOrder(reordered);
      setDraggingKey(null);
    } finally {
      setBusy(false);
    }
  }

  function detectTouchDropKey(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0] ?? event.changedTouches[0];
    if (!touch) return null;
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = element?.closest("[data-action-key]") as HTMLElement | null;
    return card?.dataset.actionKey ?? null;
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>, sourceKey: string) {
    if (busy) return;
    event.preventDefault();
    setDraggingKey(sourceKey);
    setTouchDropKey(sourceKey);
  }

  function handleTouchMove(event: TouchEvent<HTMLElement>) {
    if (!draggingKey || busy) return;
    event.preventDefault();
    const key = detectTouchDropKey(event);
    if (key) setTouchDropKey(key);
  }

  async function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    if (!draggingKey || busy) return;
    event.preventDefault();
    const key = detectTouchDropKey(event) ?? touchDropKey;
    if (key) {
      await handleDrop(key);
    } else {
      setDraggingKey(null);
    }
    setTouchDropKey(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!title.trim()) return;
    const basePoints = parsePoints(pointsInput);
    const points = tab === "negative" ? -basePoints : basePoints;
    setBusy(true);
    try {
      await addCustomAction({ title: title.trim(), category: tab, points, note: note.trim() || undefined });
      setTitle("");
      setPointsInput("10");
      setNote("");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(item: CombinedAction) {
    if (busy) return;
    setEditingKey(item.key);
    setEditTitle(item.title);
    setEditPointsInput(String(Math.abs(item.points)));
    setEditNote(item.note ?? "");
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!editingKey || !editTitle.trim()) return;
    const item = combinedActions.find((entry) => entry.key === editingKey);
    if (!item) return;
    const basePoints = parsePoints(editPointsInput);
    const points = item.category === "negative" ? -basePoints : basePoints;

    setBusy(true);
    try {
      if (item.kind === "custom" && item.customId) {
        await updateCustomAction(item.customId, {
          title: editTitle.trim(),
          category: item.category,
          points,
          note: editNote.trim() || undefined,
          sortIndex: item.sortIndex
        });
      }

      if (item.kind === "preset" && item.presetKey) {
        await upsertPresetOverride(item.presetKey, {
          title: editTitle.trim(),
          points,
          note: editNote.trim() || undefined,
          disabled: false,
          sortIndex: item.sortIndex
        });
      }

      setEditingKey(null);
    } finally {
      setBusy(false);
    }
  }

  function queueDelete(item: CombinedAction) {
    if (busy) return;
    if (item.kind === "custom" && item.customId) {
      setDeleteTarget({ kind: "custom", id: item.customId, title: item.title });
    }
    if (item.kind === "preset" && item.presetKey) {
      setDeleteTarget({ kind: "preset", presetKey: item.presetKey, title: item.title });
    }
  }

  async function restorePreset(presetKey: string) {
    if (busy) return;
    setBusy(true);
    try {
      await upsertPresetOverride(presetKey, { disabled: false });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (busy) return;
    if (!deleteTarget) return;
    setBusy(true);
    try {
      if (deleteTarget.kind === "custom") {
        await deleteCustomAction(deleteTarget.id);
      }
      if (deleteTarget.kind === "preset") {
        await upsertPresetOverride(deleteTarget.presetKey, { disabled: true });
      }
      setDeleteTarget(null);
      if (editingKey && deleteTarget.kind === "custom" && editingKey === `custom:${deleteTarget.id}`) {
        setEditingKey(null);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-3xl bg-skywash text-blueberry dark:bg-slate-700 dark:text-sky-300"><ClipboardList className="h-7 w-7" /></span>
          <div>
            <h1 className="text-3xl font-black">Actions</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">Manage actions by category. Drag the grip handle on each card to reorder the record-action picker.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-700">
          {(["positive", "negative", "repair"] as ActionType[]).map((item) => <button key={item} disabled={busy} type="button" onClick={() => { setTab(item); setEditingKey(null); }} className={`min-h-11 rounded-xl text-sm font-black capitalize disabled:opacity-60 ${tab === item ? "bg-white text-blueberry shadow-sm dark:bg-slate-900 dark:text-sky-300" : "text-slate-500 dark:text-slate-300"}`}>{item}</button>)}
        </div>

        <form onSubmit={submit} className="mt-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder={`Add ${tab} action`} />
            <input type="number" value={pointsInput} min={1} onChange={(event) => setPointsInput(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" />
          </div>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-white p-3 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Optional note" />
          <button disabled={busy} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white disabled:opacity-60"><Plus className="h-5 w-5" /> {busy ? "Saving" : "Add action"}</button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black">Actions</h2>
        {combinedActions.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {combinedActions.map((item) => {
              const isEditing = editingKey === item.key;
              const isPresetDeleted = item.kind === "preset" && item.isDeleted;

              if (isEditing) {
                return (
                  <form key={item.key} onSubmit={saveEdit} className="rounded-3xl bg-white p-4 shadow-soft dark:bg-slate-800">
                    <h3 className="font-black">Edit action</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_110px]">
                      <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Action title" />
                      <input type="number" value={editPointsInput} min={1} onChange={(event) => setEditPointsInput(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" />
                    </div>
                    <textarea value={editNote} onChange={(event) => setEditNote(event.target.value)} className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-white p-3 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Optional note" />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button disabled={busy} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white disabled:opacity-60"><Check className="h-5 w-5" /> {busy ? "Saving" : "Save"}</button>
                      <button type="button" disabled={busy} onClick={() => setEditingKey(null)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-600 disabled:opacity-60 dark:bg-slate-700 dark:text-slate-200"><X className="h-5 w-5" /> Cancel</button>
                    </div>
                  </form>
                );
              }

              return (
                <article
                  key={item.key}
                  data-action-key={item.key}
                  onDragOver={(event: DragEvent<HTMLElement>) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
                  onDrop={(event: DragEvent<HTMLElement>) => { event.preventDefault(); handleDrop(item.key); }}
                  onDragEnd={() => setDraggingKey(null)}
                  className={`select-none rounded-3xl bg-white p-4 shadow-soft dark:bg-slate-800 ${draggingKey === item.key ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span
                        draggable={!busy}
                        onDragStart={(event: DragEvent<HTMLElement>) => { setDraggingKey(item.key); event.dataTransfer.effectAllowed = "move"; }}
                        onTouchStart={(event) => handleTouchStart(event, item.key)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={(event) => event.preventDefault()}
                        className="mt-0.5 grid h-7 w-7 cursor-grab touch-none place-items-center rounded-lg bg-slate-100 text-slate-500 active:cursor-grabbing dark:bg-slate-700 dark:text-slate-300"
                        title="Drag to reorder"
                        aria-label="Drag to reorder"
                      >
                        <GripVertical className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-lg font-black">{item.emoji ? `${item.emoji} ` : ""}{item.title}</h3>
                        {isPresetDeleted ? <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">Deleted from picker</p> : null}
                        {!isPresetDeleted && item.note ? <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{item.note}</p> : null}
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${badgeClass(item.category)}`}>{item.category}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-black text-blueberry dark:text-sky-300">{item.points > 0 ? "+" : ""}{item.points} pts</span>
                    <div className="flex items-center gap-2">
                      <button type="button" disabled={busy} onClick={() => startEdit(item)} className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 disabled:opacity-60 dark:bg-slate-700" aria-label={`Edit ${item.title}`}><Pencil className="h-5 w-5" /></button>
                      {isPresetDeleted && item.presetKey ? <button type="button" disabled={busy} onClick={() => restorePreset(item.presetKey as string)} className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-emerald-900 disabled:opacity-60 dark:bg-emerald-950 dark:text-emerald-100" aria-label={`Restore ${item.title}`}><RotateCcw className="h-4 w-4" /></button> : null}
                      {!isPresetDeleted ? <button type="button" disabled={busy} onClick={() => queueDelete(item)} className="grid h-11 w-11 place-items-center rounded-2xl bg-peach text-amber-950 disabled:opacity-60 dark:bg-orange-950 dark:text-orange-100" aria-label={`Delete ${item.title}`}><Trash2 className="h-5 w-5" /></button> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-5 text-sm font-bold text-slate-500 shadow-soft dark:bg-slate-800 dark:text-slate-300">No actions in this category yet.</div>
        )}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-slate-900/30 p-3 sm:place-items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
            <h2 className="text-xl font-black">Delete action?</h2>
            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">
              {deleteTarget.kind === "preset"
                ? `This will hide "${deleteTarget.title}" from the action picker. Previously saved child actions stay unchanged.`
                : `This will delete "${deleteTarget.title}" from reusable actions. Previously saved child actions stay unchanged.`}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={() => setDeleteTarget(null)} className="flex min-h-12 items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-700 disabled:opacity-60 dark:bg-slate-700 dark:text-slate-100">Cancel</button>
              <button type="button" disabled={busy} onClick={confirmDelete} className="flex min-h-12 items-center justify-center rounded-2xl bg-peach px-4 py-3 font-black text-amber-950 disabled:opacity-60 dark:bg-orange-950 dark:text-orange-100">{busy ? "Deleting" : "Yes, delete"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
