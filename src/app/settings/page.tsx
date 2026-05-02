"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { Download, Moon, RefreshCcw, Shield, Trash2 } from "lucide-react";
import { useKindPoints } from "@/lib/store";

export default function SettingsPage() {
  const { data, updateSettings, resetPeriod, clearAll, exportData } = useKindPoints();
  const [copied, setCopied] = useState(false);
  const exported = useMemo(() => exportData(), [exportData]);

  function updateNumber(key: "dailyNegativeLimit" | "perIncidentNegativeLimit" | "familyGoalTarget", event: ChangeEvent<HTMLInputElement>) {
    updateSettings({ [key]: Number(event.target.value) });
  }

  function downloadJson() {
    const blob = new Blob([exported], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "kindpoints-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-3xl bg-skywash text-blueberry dark:bg-slate-700 dark:text-sky-300"><Shield className="h-7 w-7" /></span>
          <div>
            <h1 className="text-3xl font-black">Parent settings</h1>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-300">Tune fairness rules, exports, resets, and parent controls.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h2 className="text-xl font-black">Fairness safeguards</h2>
        <label className="mt-4 flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 font-bold dark:bg-slate-900"><span>Allow points below zero</span><input type="checkbox" checked={data.settings.allowNegativeBalance} onChange={(event) => updateSettings({ allowNegativeBalance: event.target.checked })} className="h-6 w-6" /></label>
        <NumberField label="Daily negative point limit" value={data.settings.dailyNegativeLimit} onChange={(event) => updateNumber("dailyNegativeLimit", event)} />
        <NumberField label="Per incident negative limit" value={data.settings.perIncidentNegativeLimit} onChange={(event) => updateNumber("perIncidentNegativeLimit", event)} />
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h2 className="text-xl font-black">Family goal</h2>
        <input value={data.settings.familyGoalTitle} onChange={(event) => updateSettings({ familyGoalTitle: event.target.value })} className="mt-4 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" />
        <NumberField label="Target points" value={data.settings.familyGoalTarget} onChange={(event) => updateNumber("familyGoalTarget", event)} />
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h2 className="text-xl font-black">Parent lock and display</h2>
        <label className="mt-4 block text-sm font-extrabold text-slate-500 dark:text-slate-300" htmlFor="pin">Simple parent PIN</label>
        <input id="pin" type="password" value={data.settings.parentPin} onChange={(event) => updateSettings({ parentPin: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Optional PIN" />
        <label className="mt-4 flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 font-bold dark:bg-slate-900"><span className="flex items-center gap-2"><Moon className="h-5 w-5" /> Dark mode</span><input type="checkbox" checked={data.settings.darkMode} onChange={(event) => updateSettings({ darkMode: event.target.checked })} className="h-6 w-6" /></label>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h2 className="text-xl font-black">Data tools</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button onClick={downloadJson} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white"><Download className="h-5 w-5" /> {copied ? "Exported" : "Export JSON"}</button>
          <button onClick={() => resetPeriod("weekly")} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sunshine px-4 py-3 font-black text-slate-800 dark:bg-amber-900/40 dark:text-amber-100"><RefreshCcw className="h-5 w-5" /> Reset weekly/monthly</button>
          <button onClick={clearAll} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-peach px-4 py-3 font-black text-amber-950 dark:bg-orange-950 dark:text-orange-100 sm:col-span-2"><Trash2 className="h-5 w-5" /> Clear all data</button>
        </div>
        <textarea readOnly value={exported} className="mt-4 h-44 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs outline-none dark:border-slate-600 dark:bg-slate-900" />
      </section>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-extrabold text-slate-500 dark:text-slate-300">{label}</span>
      <input type="number" value={value} onChange={onChange} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" />
    </label>
  );
}
