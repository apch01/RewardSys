"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit3, Plus, Trash2 } from "lucide-react";
import { AddActionModal } from "@/components/AddActionModal";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { ProgressBar } from "@/components/ProgressBar";
import { RewardCard } from "@/components/RewardCard";
import { useKindPoints } from "@/lib/store";
import { actionsForChild, ageFromBirthday, availableRewards, badgeForActions, childLevel, nextReward, positiveRatio } from "@/lib/utils";

export default function ChildProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, updateChild, deleteChild, redeemReward } = useKindPoints();
  const child = data.children.find((item) => item.id === params.id);
  const [actionOpen, setActionOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [name, setName] = useState(child?.name ?? "");
  const [avatar, setAvatar] = useState(child?.avatar ?? "⭐");
  const [birthday, setBirthday] = useState(child?.birthday ?? "");
  const [gender, setGender] = useState<"boy" | "girl" | "other">(child?.gender ?? "other");
  const [bio, setBio] = useState(child?.bio ?? "");

  useEffect(() => {
    if (!child) return;
    setName(child.name);
    setAvatar(child.avatar);
    setBirthday(child.birthday ?? "");
    setGender(child.gender);
    setBio(child.bio ?? "");
  }, [child]);

  const childActions = useMemo(() => child ? actionsForChild(data.actions, child.id) : [], [child, data.actions]);
  const next = child ? nextReward(data.rewards, child.points) : undefined;
  const unlocked = child ? availableRewards(data.rewards, child.points) : [];
  const badges = badgeForActions(childActions);
  const goodBehaviours = childActions.filter((action) => action.points > 0).slice(0, 4);
  const improve = childActions.filter((action) => action.type === "negative").slice(0, 3);

  if (!child) {
    return <div className="rounded-3xl bg-white p-6 text-center shadow-soft dark:bg-slate-800"><p className="font-black">Child not found.</p><Link href="/" className="mt-4 inline-block rounded-2xl bg-blueberry px-4 py-3 font-black text-white">Back home</Link></div>;
  }

  function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!birthday) return;
    updateChild(child!.id, {
      name: name.trim() || child!.name,
      avatar,
      birthday,
      gender,
      bio: bio.trim()
    });
    setEditing(false);
  }

  function confirmRemoveChild() {
    if (!child) return;
    setConfirmDeleteOpen(false);
    deleteChild(child.id);
    router.push("/");
  }

  const progress = next ? (child.points / next.cost) * 100 : 100;
  const age = ageFromBirthday(child.birthday);

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 py-2 font-black text-slate-600 shadow-soft dark:bg-slate-800 dark:text-slate-200"><ArrowLeft className="h-4 w-4" /> Home</Link>

      <section className="rounded-3xl bg-white p-5 text-center shadow-soft dark:bg-slate-800">
        {editing ? (
          <form onSubmit={saveEdit} className="space-y-3">
            <input value={avatar} onChange={(event) => setAvatar(event.target.value)} className="mx-auto h-16 w-20 rounded-3xl border border-slate-200 bg-slate-50 text-center text-4xl dark:border-slate-600 dark:bg-slate-900" />
            <input value={name} onChange={(event) => setName(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-xl font-black dark:border-slate-600 dark:bg-slate-900" />
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <input type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} max={new Date().toISOString().slice(0, 10)} className="mobile-date-input block h-12 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold dark:border-slate-600 dark:bg-slate-900" />
              </div>
              <div className="min-w-0">
                <select value={gender} onChange={(event) => setGender(event.target.value as "boy" | "girl" | "other")} className="block h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center font-black dark:border-slate-600 dark:bg-slate-900">
                  <option value="boy">Boy</option>
                  <option value="girl">Girl</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} className="min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-bold dark:border-slate-600 dark:bg-slate-900" placeholder="Bio (optional)" />
            <button className="min-h-12 w-full rounded-2xl bg-blueberry px-4 py-3 font-black text-white">Save profile</button>
          </form>
        ) : (
          <>
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-[2rem] bg-skywash text-6xl dark:bg-slate-700">{child.avatar}</div>
            <h1 className="mt-3 text-3xl font-black">{child.name}</h1>
            <p className="font-bold text-slate-500 dark:text-slate-300">{childLevel(child.points)}</p>
            <p className="text-sm font-extrabold uppercase text-slate-400 dark:text-slate-400">{age !== null ? `Age ${age}` : "Age not set"} • {child.gender}</p>
            {child.bio ? <p className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{child.bio}</p> : null}
            <div className="mt-4 text-5xl font-black text-blueberry dark:text-sky-300">{child.points}</div>
            <div className="text-sm font-extrabold uppercase text-slate-500 dark:text-slate-300">total points</div>
          </>
        )}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <button onClick={() => setActionOpen(true)} className="flex min-h-12 items-center justify-center gap-1 rounded-2xl bg-blueberry px-3 py-2 text-sm font-black text-white"><Plus className="h-4 w-4" /> Action</button>
          <button onClick={() => setEditing((value) => !value)} className="flex min-h-12 items-center justify-center gap-1 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black dark:bg-slate-700"><Edit3 className="h-4 w-4" /> Edit</button>
          <button onClick={() => setConfirmDeleteOpen(true)} className="flex min-h-12 items-center justify-center gap-1 rounded-2xl bg-peach px-3 py-2 text-sm font-black text-amber-950 dark:bg-orange-950 dark:text-orange-100"><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black">Next reward</h2>
          <span className="text-sm font-black text-blueberry dark:text-sky-300">Ratio {positiveRatio(childActions).toFixed(1)}:1</span>
        </div>
        <ProgressBar value={progress} label={next ? `${next.cost - child.points} points to ${next.title}` : "All current rewards unlocked"} />
      </section>

      {badges.length ? <section><h2 className="mb-3 text-xl font-black">Achievement badges</h2><div className="grid gap-2 sm:grid-cols-2">{badges.map((badge) => <div key={badge} className="rounded-2xl bg-sunshine px-4 py-3 font-black text-slate-800 dark:bg-amber-900/40 dark:text-amber-100">🏅 {badge}</div>)}</div></section> : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-black">Recent good behaviours</h2>
          <div className="space-y-2">{goodBehaviours.length ? goodBehaviours.map((action) => <div key={action.id} className="rounded-2xl bg-mint px-4 py-3 font-black text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">{action.title} +{action.points}</div>) : <p className="font-bold text-slate-500 dark:text-slate-300">Add a positive recognition to begin.</p>}</div>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
          <h2 className="mb-3 text-lg font-black">Areas to improve</h2>
          <div className="space-y-2">{improve.length ? improve.map((action) => <div key={action.id} className="rounded-2xl bg-peach px-4 py-3 font-black text-amber-950 dark:bg-orange-950 dark:text-orange-100">{action.title}</div>) : <p className="font-bold text-slate-500 dark:text-slate-300">No correction patterns yet.</p>}</div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black">Reward shop</h2>
        <div className="grid gap-3 sm:grid-cols-2">{data.rewards.filter((reward) => !reward.redeemed).slice(0, 4).map((reward) => <RewardCard key={reward.id} reward={reward} canRedeem={child.points >= reward.cost} onRedeem={() => redeemReward(reward.id, child.id)} />)}</div>
        {unlocked.length ? <p className="mt-3 rounded-2xl bg-mint px-4 py-3 text-sm font-black text-leaf dark:bg-emerald-950 dark:text-emerald-100">{unlocked.length} reward{unlocked.length === 1 ? " is" : "s are"} ready.</p> : null}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black">Activity timeline</h2>
        <ActivityTimeline actions={childActions} childrenList={data.children} limit={10} allowTypeFilter />
      </section>

      <AddActionModal open={actionOpen} child={child} onClose={() => setActionOpen(false)} />

      {confirmDeleteOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-slate-900/30 p-3 sm:place-items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
            <h2 className="text-xl font-black">Delete child profile?</h2>
            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">This will remove {child.name}&apos;s profile and activity history. This action cannot be undone.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setConfirmDeleteOpen(false)} className="flex min-h-12 items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-700 dark:bg-slate-700 dark:text-slate-100">Cancel</button>
              <button type="button" onClick={confirmRemoveChild} className="flex min-h-12 items-center justify-center rounded-2xl bg-peach px-4 py-3 font-black text-amber-950 dark:bg-orange-950 dark:text-orange-100">Yes, delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
