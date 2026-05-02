"use client";

import Link from "next/link";
import { BookText, ClipboardCopy } from "lucide-react";
import { extractionPrompt } from "@/lib/spelling";

export default function SpellingStepOnePage() {
  function copyPrompt() {
    navigator.clipboard.writeText(extractionPrompt).catch(() => undefined);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="flex items-start gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-3xl bg-skywash text-blueberry dark:bg-slate-700 dark:text-sky-300"><BookText className="h-7 w-7" /></span>
          <div>
            <h1 className="text-3xl font-black">Spelling Step 1: Create JSON</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">Take a photo in ChatGPT, run this prompt, and get clean JSON output.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Instructions</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm font-bold text-slate-600 dark:text-slate-300">
          <li>Open ChatGPT and upload a clear photo of the spelling worksheet.</li>
          <li>Paste the prompt below exactly and submit.</li>
          <li>Copy the JSON-only response.</li>
          <li>Continue to Step 2 to import and attach it to a child.</li>
        </ol>

        <textarea value={extractionPrompt} readOnly className="mt-4 min-h-56 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold outline-none dark:border-slate-600 dark:bg-slate-900" />

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={copyPrompt} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-blueberry px-4 py-2 font-black text-white"><ClipboardCopy className="h-4 w-4" /> Copy prompt</button>
          <Link href="/spelling/import" className="inline-flex min-h-11 items-center rounded-2xl bg-slate-100 px-4 py-2 font-black dark:bg-slate-700">Go to Step 2</Link>
        </div>
      </section>
    </div>
  );
}
