"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { BookText, ClipboardCopy, FileUp, GraduationCap, PenSquare } from "lucide-react";
import { useKindPoints } from "@/lib/store";
import { ChildSpellingData, SpellingWord } from "@/lib/types";

const extractionPrompt = `You are helping me prepare Chinese spelling practice for my child.

From the image or text I provide, extract ONLY the Chinese test words or characters that the child needs to practice.

Ignore:
- instructions
- names
- dates
- page numbers
- English text
- punctuation
- example sentences
- unrelated Chinese text

Return the result in this exact JSON format only:

{
  "title": "Chinese Spelling Practice",
  "language": "zh",
  "words": [
    {
      "text": "学校",
      "characters": ["学", "校"],
      "meaning": "",
      "pinyin": ""
    }
  ]
}

Rules:
1. Only include actual tested words or characters.
2. Do not include explanations.
3. Do not wrap the JSON in markdown.
4. If you are unsure, include the possible word but set "uncertain": true.
5. Keep the original order from the worksheet.
6. For single characters, still use the same format.

Now extract the tested Chinese spelling words from the content I upload.`;

function normalizeSpellingData(value: unknown): ChildSpellingData | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { title?: unknown; language?: unknown; words?: unknown };
  if (raw.language !== "zh" || !Array.isArray(raw.words)) return null;

  const words = raw.words
    .map((word) => {
      const item = word as { text?: unknown; characters?: unknown; meaning?: unknown; pinyin?: unknown; uncertain?: unknown };
      const text = String(item?.text ?? "").trim();
      const chars = Array.isArray(item?.characters)
        ? item.characters.map((char) => String(char ?? "").trim()).filter(Boolean)
        : [];
      if (!text || !chars.length) return null;
      return {
        text,
        characters: chars,
        meaning: String(item?.meaning ?? "").trim(),
        pinyin: String(item?.pinyin ?? "").trim(),
        uncertain: Boolean(item?.uncertain)
      } satisfies SpellingWord;
    })
    .filter(Boolean) as SpellingWord[];

  if (!words.length) return null;

  return {
    title: String(raw.title ?? "Chinese Spelling Practice").trim() || "Chinese Spelling Practice",
    language: "zh",
    words,
    updatedAt: new Date().toISOString()
  };
}

function PracticeCharacter({ character }: { character: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    import("hanzi-writer").then((module) => {
      if (cancelled || !containerRef.current) return;
      const writer = module.default.create(containerRef.current, character, {
        width: 110,
        height: 110,
        padding: 8,
        showCharacter: true,
        showOutline: true,
        strokeAnimationSpeed: 1,
        delayBetweenLoops: 500
      });
      writer.animateCharacter({ loop: true });
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [character]);

  return <div ref={containerRef} className="rounded-2xl bg-white p-2 shadow-soft dark:bg-slate-800" />;
}

function TestCharacter({ character }: { character: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    import("hanzi-writer").then((module) => {
      if (cancelled || !containerRef.current) return;
      const writer = module.default.create(containerRef.current, character, {
        width: 180,
        height: 180,
        padding: 8,
        showCharacter: false,
        showOutline: true,
        drawingWidth: 12,
        strokeColor: "#1d4ed8"
      });
      writer.quiz({ showHintAfterMisses: 2 });
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [character]);

  return <div ref={containerRef} className="mx-auto w-fit rounded-3xl bg-white p-3 shadow-soft dark:bg-slate-800" />;
}

export default function SpellingPage() {
  const { data, updateChildSpelling } = useKindPoints();
  const [selectedChildId, setSelectedChildId] = useState(data.children[0]?.id ?? "");
  const [rawJson, setRawJson] = useState("");
  const [mode, setMode] = useState<"practice" | "test">("practice");
  const [wordIndex, setWordIndex] = useState(0);
  const [message, setMessage] = useState("");
  const selectedChild = data.children.find((child) => child.id === selectedChildId) ?? data.children[0];
  const attachedData = selectedChild?.spellingData;

  useEffect(() => {
    if (!selectedChildId && data.children[0]?.id) setSelectedChildId(data.children[0].id);
  }, [data.children, selectedChildId]);

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

  function copyPrompt() {
    navigator.clipboard.writeText(extractionPrompt).then(() => setMessage("Prompt copied."));
  }

  const words = attachedData?.words ?? [];
  const activeWord = words[wordIndex] ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="flex items-start gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-3xl bg-skywash text-blueberry dark:bg-slate-700 dark:text-sky-300"><BookText className="h-7 w-7" /></span>
          <div>
            <h1 className="text-3xl font-black">Spelling</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">Attach Chinese spelling lists to each child and practise with Hanzi Writer.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h2 className="text-xl font-black">1) Create JSON with ChatGPT</h2>
        <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">Take a clear photo of the worksheet in ChatGPT, then paste this prompt and copy the JSON output.</p>
        <textarea value={extractionPrompt} readOnly className="mt-3 min-h-48 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold outline-none dark:border-slate-600 dark:bg-slate-900" />
        <button type="button" onClick={copyPrompt} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-blueberry px-4 py-2 font-black text-white"><ClipboardCopy className="h-4 w-4" /> Copy prompt</button>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h2 className="text-xl font-black">2) Import JSON to child</h2>
        <label className="mt-3 block text-sm font-extrabold text-slate-500 dark:text-slate-300">Select child</label>
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
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-black">3) Practice and test</h2>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-700">
            <button type="button" onClick={() => setMode("practice")} className={`min-h-10 rounded-xl px-3 text-sm font-black ${mode === "practice" ? "bg-white text-blueberry dark:bg-slate-900 dark:text-sky-300" : "text-slate-500 dark:text-slate-300"}`}><PenSquare className="mr-1 inline h-4 w-4" /> Practice</button>
            <button type="button" onClick={() => setMode("test")} className={`min-h-10 rounded-xl px-3 text-sm font-black ${mode === "test" ? "bg-white text-blueberry dark:bg-slate-900 dark:text-sky-300" : "text-slate-500 dark:text-slate-300"}`}><GraduationCap className="mr-1 inline h-4 w-4" /> Test</button>
          </div>
        </div>

        {!selectedChild ? <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-300">Add a child first to use spelling.</p> : null}
        {selectedChild && !attachedData ? <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-300">No spelling JSON attached to this child yet.</p> : null}

        {attachedData ? (
          <>
            <p className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-300">{attachedData.title} • {attachedData.words.length} words</p>
            <div className="mt-3 flex items-center gap-2">
              <button type="button" disabled={wordIndex <= 0} onClick={() => setWordIndex((index) => Math.max(0, index - 1))} className="min-h-10 rounded-xl bg-slate-100 px-3 text-sm font-black disabled:opacity-60 dark:bg-slate-700">Prev</button>
              <button type="button" disabled={wordIndex >= words.length - 1} onClick={() => setWordIndex((index) => Math.min(words.length - 1, index + 1))} className="min-h-10 rounded-xl bg-slate-100 px-3 text-sm font-black disabled:opacity-60 dark:bg-slate-700">Next</button>
              <span className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-400">{wordIndex + 1} / {words.length}</span>
            </div>

            {activeWord ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                <h3 className="text-2xl font-black">{activeWord.text}</h3>
                {(activeWord.pinyin || activeWord.meaning) ? <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{activeWord.pinyin || ""} {activeWord.meaning ? `• ${activeWord.meaning}` : ""}</p> : null}
                {mode === "practice" ? (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {activeWord.characters.map((character) => <PracticeCharacter key={`${activeWord.text}-${character}`} character={character} />)}
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="mb-2 text-sm font-bold text-slate-500 dark:text-slate-300">Trace each character in order:</p>
                    <div className="flex flex-wrap gap-3">
                      {activeWord.characters.map((character) => <TestCharacter key={`${activeWord.text}-test-${character}`} character={character} />)}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}
