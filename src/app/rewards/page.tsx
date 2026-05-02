"use client";

import { FormEvent, useState } from "react";
import { Check, Gift, Plus, X } from "lucide-react";
import { RewardCard } from "@/components/RewardCard";
import { useKindPoints } from "@/lib/store";
import { Reward } from "@/lib/types";

export default function RewardsPage() {
  const { data, addReward, updateReward, deleteReward, redeemReward } = useKindPoints();
  const [title, setTitle] = useState("");
  const [costInput, setCostInput] = useState("50");
  const [description, setDescription] = useState("");
  const [childId, setChildId] = useState(data.children[0]?.id ?? "");
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCostInput, setEditCostInput] = useState("50");
  const [editDescription, setEditDescription] = useState("");

  function parsePointValue(input: string, fallback: number) {
    const parsed = Number(input);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(1, Math.round(parsed));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const cost = parsePointValue(costInput, 50);
    await addReward({ title: title.trim(), cost, description: description.trim() || "A family-approved reward." });
    setTitle("");
    setCostInput("50");
    setDescription("");
  }

  function startEdit(reward: Reward) {
    setEditingRewardId(reward.id);
    setEditTitle(reward.title);
    setEditCostInput(String(reward.cost));
    setEditDescription(reward.description);
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingRewardId || !editTitle.trim()) return;
    const editCost = parsePointValue(editCostInput, 50);
    await updateReward(editingRewardId, { title: editTitle.trim(), cost: editCost, description: editDescription.trim() || "A family-approved reward." });
    setEditingRewardId(null);
  }

  async function removeReward(reward: Reward) {
    if (!window.confirm(`Delete "${reward.title}" from the reward shop?`)) return;
    await deleteReward(reward.id);
    if (editingRewardId === reward.id) setEditingRewardId(null);
  }

  const selectedChild = data.children.find((child) => child.id === childId) ?? data.children[0];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-3xl bg-sunshine"><Gift className="h-7 w-7 text-amber-700" /></span>
          <div>
            <h1 className="text-3xl font-black">Rewards</h1>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-300">Create meaningful rewards and redeem them when a child is ready.</p>
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h2 className="text-xl font-black">Custom reward</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px]">
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Reward title" />
          <input type="number" value={costInput} min={1} onChange={(event) => setCostInput(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" />
        </div>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-white p-3 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Description" />
        <button className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white"><Plus className="h-5 w-5" /> Add reward</button>
      </form>

      {data.children.length ? <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800"><label className="text-sm font-extrabold text-slate-500 dark:text-slate-300" htmlFor="reward-child">Redeem for</label><select id="reward-child" value={selectedChild?.id ?? ""} onChange={(event) => setChildId(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-black dark:border-slate-600 dark:bg-slate-900">{data.children.map((child) => <option key={child.id} value={child.id}>{child.avatar} {child.name} - {child.points} points</option>)}</select></section> : null}

      <section>
        <h2 className="mb-3 text-xl font-black">Reward shop</h2>
        <div className="grid gap-3 sm:grid-cols-2">{data.rewards.map((reward) => editingRewardId === reward.id ? (
          <form key={reward.id} onSubmit={saveEdit} className="rounded-3xl bg-white p-4 shadow-soft dark:bg-slate-800">
            <h3 className="font-black">Edit reward</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_110px]">
              <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Reward title" />
              <input type="number" value={editCostInput} min={1} onChange={(event) => setEditCostInput(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" />
            </div>
            <textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-white p-3 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Description" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white"><Check className="h-5 w-5" /> Save</button>
              <button type="button" onClick={() => setEditingRewardId(null)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-600 dark:bg-slate-700 dark:text-slate-200"><X className="h-5 w-5" /> Cancel</button>
            </div>
          </form>
        ) : <RewardCard key={reward.id} reward={reward} canRedeem={Boolean(selectedChild && selectedChild.points >= reward.cost)} onRedeem={selectedChild ? () => redeemReward(reward.id, selectedChild.id) : undefined} onEdit={() => startEdit(reward)} onDelete={() => removeReward(reward)} />)}</div>
      </section>
    </div>
  );
}
