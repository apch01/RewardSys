"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { useKindPoints } from "@/lib/store";

const avatars = [
  "👦", "👧", "🧒", "🧑", "👶", "🧢", "🎀", "👑", "🕶️", "🤓",
  "🌟", "🚀", "🦄", "⚽", "🏀", "🎾", "🏐", "🎯", "🏓", "🥋",
  "🎨", "🖍️", "🎵", "🎧", "🎤", "🎻", "🥁", "🎮", "🧩", "🧪",
  "📚", "📝", "🔭", "🧠", "🌈", "🔥", "❄️", "🌸", "🍀", "🌻",
  "🦋", "🐶", "🐱", "🐼", "🦊", "🐯", "🐸", "🐨", "🐬", "🦖"
];

export function AddChildModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addChild } = useKindPoints();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(avatars[0]);
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState<"boy" | "girl" | "other">("other");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!name.trim() || !birthday || !gender) return;
    setSaving(true);
    try {
      await addChild({ name: name.trim(), avatar, birthday, gender, bio: bio.trim() || undefined });
      setName("");
      setAvatar(avatars[0]);
      setBirthday("");
      setGender("other");
      setBio("");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-900/30 p-3 sm:place-items-center">
      <form onSubmit={submit} className="w-full max-w-[calc(100vw-1.5rem)] animate-pop rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800 sm:max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">Add child</h2>
          <button type="button" disabled={saving} onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 disabled:opacity-60 dark:bg-slate-700" aria-label="Close add child modal"><X className="h-5 w-5" /></button>
        </div>
        <label className="text-sm font-extrabold text-slate-600 dark:text-slate-200" htmlFor="child-name">Name</label>
        <input id="child-name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Child name" required />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-extrabold text-slate-600 dark:text-slate-200">Birthday</span>
            <input type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} max={new Date().toISOString().slice(0, 10)} className="mobile-date-input mt-2 h-12 w-full min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" required />
          </label>
          <label className="block">
            <span className="text-sm font-extrabold text-slate-600 dark:text-slate-200">Gender</span>
            <select value={gender} onChange={(event) => setGender(event.target.value as "boy" | "girl" | "other")} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" required>
              <option value="boy">Boy</option>
              <option value="girl">Girl</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm font-extrabold text-slate-600 dark:text-slate-200" htmlFor="child-bio">Bio (optional)</label>
        <textarea id="child-bio" value={bio} onChange={(event) => setBio(event.target.value)} className="mt-2 min-h-20 w-full rounded-2xl border border-slate-200 bg-white p-3 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="A few words about this child" />
        <div className="mt-4 text-sm font-extrabold text-slate-600 dark:text-slate-200">Avatar</div>
        <div className="mt-2 min-w-0 overflow-x-auto pb-1">
          <div className="grid w-max grid-flow-col grid-rows-2 gap-2">
            {avatars.map((item) => <button key={item} type="button" onClick={() => setAvatar(item)} className={`h-12 w-12 rounded-2xl text-2xl ${avatar === item ? "bg-blueberry text-white" : "bg-slate-100 dark:bg-slate-700"}`}>{item}</button>)}
          </div>
        </div>
        <button disabled={saving} className="mt-5 h-13 min-h-12 w-full rounded-2xl bg-blueberry px-5 py-3 text-base font-black text-white shadow-soft disabled:opacity-60">{saving ? "Saving" : "Save child"}</button>
      </form>
    </div>
  );
}
