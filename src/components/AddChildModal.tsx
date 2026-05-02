"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { useKindPoints } from "@/lib/store";

const avatars = ["🌟", "🚀", "🦄", "⚽", "🎨", "🎧", "🌈", "🧩", "📚", "🦋"];

export function AddChildModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addChild } = useKindPoints();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(avatars[0]);

  if (!open) return null;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    addChild({ name: name.trim(), avatar });
    setName("");
    setAvatar(avatars[0]);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-900/30 p-3 sm:place-items-center">
      <form onSubmit={submit} className="w-full max-w-md animate-pop rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">Add child</h2>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 dark:bg-slate-700" aria-label="Close add child modal"><X className="h-5 w-5" /></button>
        </div>
        <label className="text-sm font-extrabold text-slate-600 dark:text-slate-200" htmlFor="child-name">Name</label>
        <input id="child-name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Child name" />
        <div className="mt-4 text-sm font-extrabold text-slate-600 dark:text-slate-200">Avatar</div>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {avatars.map((item) => <button key={item} type="button" onClick={() => setAvatar(item)} className={`h-12 rounded-2xl text-2xl ${avatar === item ? "bg-blueberry text-white" : "bg-slate-100 dark:bg-slate-700"}`}>{item}</button>)}
        </div>
        <button className="mt-5 h-13 min-h-12 w-full rounded-2xl bg-blueberry px-5 py-3 text-base font-black text-white shadow-soft">Save child</button>
      </form>
    </div>
  );
}
