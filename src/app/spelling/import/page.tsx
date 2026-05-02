"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, FileUp } from "lucide-react";
import { useKindPoints } from "@/lib/store";
import { normalizeSpellingData } from "@/lib/spelling";

export default function SpellingImportPage() {
  const { data, updateChildSpelling } = useKindPoints();
  const [selectedChildId, setSelectedChildId] = useState(data.children[0]?.id ?? "");
  const [rawJson, setRawJson] = useState("");
  const [message, setMessage] = useState("");

  const selectedChild = data.children.find((child) => child.id === selectedChildId) ?? data.children[0];

  const parsedImport = useMemo(() => {
    if (!rawJson.trim()) return null;
    try {
      return normalizeSpellingData(JSON.parse(rawJson));
    } catch {
      return null;
    }
  }, [rawJson]);

  function onJsonFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((content) => {
      setRawJson(content);
      setMessage("JSON loaded. Review and import to selected child.");
    }).catch(() => {
      setMessage("Could not read this JSON file.");
    });
  }

  async function attachImportToChild() {
    if (!selectedChild || !parsedImport) return;
    await updateChildSpelling(selectedChild.id, parsedImport);
    setMessage(`Imported ${parsedImport.words.length} words to ${selectedChild.name}.`);
    setRawJson("");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h1 className="text-3xl font-black">Spelling Step 2: Import JSON</h1>
        <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">Upload or paste JSON and attach it to a selected child.</p>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <label className="text-sm font-extrabold text-slate-500 dark:text-slate-300">Select child</label>
        <select value={selectedChild?.id ?? ""} onChange={(event) => setSelectedChildId(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-black dark:border-slate-600 dark:bg-slate-900">
          {data.children.map((child) => <option key={child.id} value={child.id}>{child.avatar} {child.name}</option>)}
        </select>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-black dark:border-slate-600 dark:bg-slate-900">
            <FileUp className="h-5 w-5" /> Upload JSON file
            <input type="file" accept="application/json,.json" onChange={onJsonFileUpload} className="hidden" />
          </label>
          <button type="button" disabled={!parsedImport || !selectedChild} onClick={attachImportToChild} className="min-h-12 rounded-2xl bg-blueberry px-4 py-3 font-black text-white disabled:opacity-60">Import to child</button>
        </div>

        <label className="mt-4 block text-sm font-extrabold text-slate-500 dark:text-slate-300">Or paste JSON</label>
        <textarea value={rawJson} onChange={(event) => setRawJson(event.target.value)} className="mt-2 min-h-40 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold outline-none dark:border-slate-600 dark:bg-slate-900" placeholder='{"title":"Chinese Spelling Practice","language":"zh","words":[...]}' />
        {rawJson ? <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-300">{parsedImport ? `Parsed ${parsedImport.words.length} words from JSON.` : "JSON format is invalid for spelling import."}</p> : null}
        {message ? <p className="mt-3 rounded-2xl bg-mint px-4 py-3 text-sm font-black text-leaf dark:bg-emerald-950 dark:text-emerald-100">{message}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/spelling" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 font-black dark:bg-slate-700"><ArrowLeft className="h-4 w-4" /> Step 1</Link>
          <Link href="/spelling/practice" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-blueberry px-4 py-2 font-black text-white"><ArrowRight className="h-4 w-4" /> Step 3</Link>
        </div>
      </section>
    </div>
  );
}
