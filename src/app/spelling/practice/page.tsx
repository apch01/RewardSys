"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, GraduationCap, PenSquare } from "lucide-react";
import { useKindPoints } from "@/lib/store";

function PracticeCharacters({ characters }: { characters: string[] }) {
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    let cancelled = false;
    const currentRefs = refs.current;
    currentRefs.forEach((element) => {
      if (element) element.innerHTML = "";
    });

    import("hanzi-writer").then((module) => {
      if (cancelled) return;
      const writers = characters.map((character, index) => {
        const container = currentRefs[index];
        if (!container) return null;
        return module.default.create(container, character, {
          width: 110,
          height: 110,
          padding: 8,
          showCharacter: true,
          showOutline: true,
          strokeAnimationSpeed: 1,
          delayBetweenLoops: 500
        });
      });

      writers.forEach((writer, index) => {
        if (!writer) return;
        window.setTimeout(() => {
          if (!cancelled) writer.animateCharacter();
        }, index * 700);
      });
    }).catch(() => undefined);

    return () => {
      cancelled = true;
      currentRefs.forEach((element) => {
        if (element) element.innerHTML = "";
      });
    };
  }, [characters]);

  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {characters.map((character, index) => (
        <div key={`${character}-${index}`} ref={(element) => { refs.current[index] = element; }} className="rounded-2xl bg-white p-2 shadow-soft dark:bg-slate-800" />
      ))}
    </div>
  );
}

function TestCharacter({ character }: { character: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    import("hanzi-writer").then((module) => {
      if (cancelled || !container) return;
      const writer = module.default.create(container, character, {
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
      if (container) container.innerHTML = "";
    };
  }, [character]);

  return <div ref={containerRef} className="mx-auto w-fit rounded-3xl bg-white p-3 shadow-soft dark:bg-slate-800" />;
}

export default function SpellingPracticePage() {
  const { data } = useKindPoints();
  const [selectedChildId, setSelectedChildId] = useState(data.children[0]?.id ?? "");
  const [mode, setMode] = useState<"practice" | "test">("practice");
  const [wordIndex, setWordIndex] = useState(0);

  const selectedChild = data.children.find((child) => child.id === selectedChildId) ?? data.children[0];
  const attachedData = selectedChild?.spellingData;
  const words = attachedData?.words ?? [];
  const activeWord = words[wordIndex] ?? null;

  useEffect(() => {
    setWordIndex(0);
  }, [selectedChildId]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h1 className="text-3xl font-black">Spelling Step 3: Practice and Test</h1>
        <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">Practice animates left-to-right. Test shows only pinyin.</p>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <label className="text-sm font-extrabold text-slate-500 dark:text-slate-300">Select child</label>
        <select value={selectedChild?.id ?? ""} onChange={(event) => setSelectedChildId(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-black dark:border-slate-600 dark:bg-slate-900">
          {data.children.map((child) => <option key={child.id} value={child.id}>{child.avatar} {child.name}</option>)}
        </select>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-700">
            <button type="button" onClick={() => setMode("practice")} className={`min-h-10 rounded-xl px-3 text-sm font-black ${mode === "practice" ? "bg-white text-blueberry dark:bg-slate-900 dark:text-sky-300" : "text-slate-500 dark:text-slate-300"}`}><PenSquare className="mr-1 inline h-4 w-4" /> Practice</button>
            <button type="button" onClick={() => setMode("test")} className={`min-h-10 rounded-xl px-3 text-sm font-black ${mode === "test" ? "bg-white text-blueberry dark:bg-slate-900 dark:text-sky-300" : "text-slate-500 dark:text-slate-300"}`}><GraduationCap className="mr-1 inline h-4 w-4" /> Test</button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={wordIndex <= 0} onClick={() => setWordIndex((index) => Math.max(0, index - 1))} className="min-h-10 rounded-xl bg-slate-100 px-3 text-sm font-black disabled:opacity-60 dark:bg-slate-700">Prev</button>
            <button type="button" disabled={wordIndex >= words.length - 1} onClick={() => setWordIndex((index) => Math.min(words.length - 1, index + 1))} className="min-h-10 rounded-xl bg-slate-100 px-3 text-sm font-black disabled:opacity-60 dark:bg-slate-700">Next</button>
            <span className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-400">{words.length ? `${wordIndex + 1} / ${words.length}` : "0 / 0"}</span>
          </div>
        </div>

        {!selectedChild ? <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-300">Add a child first to use spelling.</p> : null}
        {selectedChild && !attachedData ? <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-300">No spelling JSON attached to this child yet. Import in Step 2.</p> : null}

        {activeWord ? (
          <div key={`${selectedChild?.id}-${mode}-${wordIndex}`} className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            {mode === "practice" ? (
              <>
                <h3 className="text-2xl font-black">{activeWord.text}</h3>
                {(activeWord.pinyin || activeWord.meaning) ? <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{activeWord.pinyin || ""} {activeWord.meaning ? `• ${activeWord.meaning}` : ""}</p> : null}
                <PracticeCharacters characters={activeWord.characters} />
              </>
            ) : (
              <>
                <p className="text-lg font-black">{activeWord.pinyin || "(No pinyin provided)"}</p>
                {activeWord.meaning ? <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{activeWord.meaning}</p> : null}
                <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">Trace each character in order:</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {activeWord.characters.map((character, index) => <TestCharacter key={`${selectedChild?.id}-${wordIndex}-${character}-${index}`} character={character} />)}
                </div>
              </>
            )}
          </div>
        ) : null}

        <div className="mt-4">
          <Link href="/spelling/import" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 font-black dark:bg-slate-700"><ArrowLeft className="h-4 w-4" /> Back to Step 2</Link>
        </div>
      </section>
    </div>
  );
}
