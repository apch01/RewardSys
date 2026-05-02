"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Copy, Download, KeyRound, Link2, MessageSquare, Moon, Send, Shield, Target } from "lucide-react";
import { useKindPoints } from "@/lib/store";

type ChildLevelDraft = {
  title: string;
  minPointsInput: string;
};

const reportEmail = "my.kind.points@gmail.com";

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function SettingsPage() {
  const { data, family, error, updateSettings, joinFamily, rotateSecret } = useKindPoints();
  const [syncId, setSyncId] = useState("");
  const [secret, setSecret] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [reportType, setReportType] = useState("Bug");
  const [reportTitle, setReportTitle] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [reportContact, setReportContact] = useState("");
  const [pinDraft, setPinDraft] = useState(data.settings.parentPin);
  const [pinMessage, setPinMessage] = useState("");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installMessage, setInstallMessage] = useState("");
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [allowNegativeDraft, setAllowNegativeDraft] = useState(data.settings.allowNegativeBalance);
  const [dailyNegativeLimitDraft, setDailyNegativeLimitDraft] = useState(String(data.settings.dailyNegativeLimit));
  const [perIncidentNegativeLimitDraft, setPerIncidentNegativeLimitDraft] = useState(String(data.settings.perIncidentNegativeLimit));
  const [fairnessMessage, setFairnessMessage] = useState("");
  const [goalEnabledDraft, setGoalEnabledDraft] = useState(data.settings.familyGoalEnabled);
  const [goalTitleDraft, setGoalTitleDraft] = useState(data.settings.familyGoalTitle);
  const [goalTargetDraft, setGoalTargetDraft] = useState(String(data.settings.familyGoalTarget));
  const [childLevelsDraft, setChildLevelsDraft] = useState<ChildLevelDraft[]>(
    data.settings.childLevels.map((level) => ({
      title: level.title,
      minPointsInput: String(level.minPoints)
    }))
  );
  const [goalMessage, setGoalMessage] = useState("");
  const [joiningFamily, setJoiningFamily] = useState(false);
  const [revokingSecret, setRevokingSecret] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [savingFairness, setSavingFairness] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    setPinDraft(data.settings.parentPin);
  }, [data.settings.parentPin]);

  useEffect(() => {
    setAllowNegativeDraft(data.settings.allowNegativeBalance);
    setDailyNegativeLimitDraft(String(data.settings.dailyNegativeLimit));
    setPerIncidentNegativeLimitDraft(String(data.settings.perIncidentNegativeLimit));
    setGoalEnabledDraft(data.settings.familyGoalEnabled);
    setGoalTitleDraft(data.settings.familyGoalTitle);
    setGoalTargetDraft(String(data.settings.familyGoalTarget));
    setChildLevelsDraft(data.settings.childLevels.map((level) => ({
      title: level.title,
      minPointsInput: String(level.minPoints)
    })));
  }, [data.settings.allowNegativeBalance, data.settings.dailyNegativeLimit, data.settings.perIncidentNegativeLimit, data.settings.familyGoalEnabled, data.settings.familyGoalTitle, data.settings.familyGoalTarget, data.settings.childLevels]);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));

    function detectStandalone() {
      const byMedia = window.matchMedia("(display-mode: standalone)").matches;
      const byNavigator = Boolean((window.navigator as NavigatorWithStandalone).standalone);
      setIsStandalone(byMedia || byNavigator);
    }

    function onBeforeInstallPrompt(event: Event) {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setInstallPrompt(promptEvent);
    }

    function onAppInstalled() {
      setInstallPrompt(null);
      setInstallMessage("App installed.");
      detectStandalone();
      window.setTimeout(() => setInstallMessage(""), 1800);
    }

    detectStandalone();
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  function parsePositiveNumber(input: string, fallback: number) {
    const parsed = Number(input);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(1, Math.round(parsed));
  }

  async function copySync() {
    if (!family) return;
    await navigator.clipboard.writeText(`KindPoints sync ID: ${family.syncId}\nSecret key: ${family.syncSecret ?? "Ask the first parent to revoke and share a new key."}`);
    setSyncMessage("Copied sync details");
    window.setTimeout(() => setSyncMessage(""), 1600);
  }

  async function submitJoin(event: FormEvent) {
    event.preventDefault();
    if (joiningFamily) return;
    setSyncMessage("");
    setJoiningFamily(true);
    try {
      await joinFamily(syncId, secret);
      setSyncId("");
      setSecret("");
      setSyncMessage("Family connected");
    } finally {
      setJoiningFamily(false);
    }
  }

  async function revokeSecret() {
    if (revokingSecret) return;
    setRevokingSecret(true);
    try {
      await rotateSecret();
      setSyncMessage("Secret key revoked and replaced");
    } finally {
      setRevokingSecret(false);
    }
  }

  async function savePin() {
    if (savingPin) return;
    setSavingPin(true);
    try {
      await updateSettings({ parentPin: pinDraft.trim() });
      setPinMessage(pinDraft.trim() ? "PIN saved" : "PIN removed");
      window.setTimeout(() => setPinMessage(""), 1600);
    } finally {
      setSavingPin(false);
    }
  }

  async function saveFairness() {
    if (savingFairness) return;
    setSavingFairness(true);
    try {
      await updateSettings({
        allowNegativeBalance: allowNegativeDraft,
        dailyNegativeLimit: parsePositiveNumber(dailyNegativeLimitDraft, data.settings.dailyNegativeLimit),
        perIncidentNegativeLimit: parsePositiveNumber(perIncidentNegativeLimitDraft, data.settings.perIncidentNegativeLimit)
      });
      setFairnessMessage("Fairness safeguards saved");
      window.setTimeout(() => setFairnessMessage(""), 1800);
    } finally {
      setSavingFairness(false);
    }
  }

  async function saveGoal() {
    if (savingGoal) return;
    setSavingGoal(true);
    try {
      await updateSettings({
        familyGoalEnabled: goalEnabledDraft,
        familyGoalTitle: goalTitleDraft.trim() || data.settings.familyGoalTitle,
        familyGoalTarget: parsePositiveNumber(goalTargetDraft, data.settings.familyGoalTarget),
        childLevels: childLevelsDraft
          .map((level) => ({
            title: level.title.trim() || "Level",
            minPoints: Math.max(0, Math.round(Number(level.minPointsInput) || 0))
          }))
          .sort((a, b) => b.minPoints - a.minPoints)
      });
      setGoalMessage("Family goal saved");
      window.setTimeout(() => setGoalMessage(""), 1800);
    } finally {
      setSavingGoal(false);
    }
  }

  function updateChildLevel(index: number, next: Partial<ChildLevelDraft>) {
    setChildLevelsDraft((prev) => prev.map((level, levelIndex) => levelIndex === index ? { ...level, ...next } : level));
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setInstallMessage(choice.outcome === "accepted" ? "Install started. Check your home screen." : "Install was canceled.");
    window.setTimeout(() => setInstallMessage(""), 1800);
  }

  function submitReport(event: FormEvent) {
    event.preventDefault();
    if (!reportTitle.trim() || !reportMessage.trim()) return;

    const subject = `KindPoints ${reportType}: ${reportTitle.trim()}`;
    const body = [
      `Type: ${reportType}`,
      `Title: ${reportTitle.trim()}`,
      reportContact.trim() ? `Contact: ${reportContact.trim()}` : "Contact: Not provided",
      "",
      reportMessage.trim()
    ].join("\n");

    window.location.href = `mailto:${reportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-2xl bg-peach px-4 py-3 font-black text-amber-950 dark:bg-orange-950 dark:text-orange-100">{error}</div> : null}
      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-3xl bg-skywash text-blueberry dark:bg-slate-700 dark:text-sky-300"><Shield className="h-7 w-7" /></span>
          <div>
            <h1 className="text-3xl font-black">Parent settings</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">Tune fairness rules, family sync, and parent controls.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mint text-leaf dark:bg-emerald-950 dark:text-emerald-100"><Link2 className="h-6 w-6" /></span>
          <div>
            <h2 className="text-xl font-black">Family sync</h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-300">Use one family sync ID and secret key so both parents see the same children, points, and rewards.</p>
          </div>
        </div>

        {family ? (
          <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <div>
              <div className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-300">Sync ID</div>
              <div className="mt-1 rounded-xl bg-white px-3 py-2 font-mono text-sm font-black dark:bg-slate-800">{family.syncId}</div>
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-300">Secret key</div>
              <div className="mt-1 rounded-xl bg-white px-3 py-2 font-mono text-sm font-black dark:bg-slate-800">{family.syncSecret ?? "Only the first parent can view or revoke the secret."}</div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {family.isCreator ? <button onClick={copySync} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white"><Copy className="h-5 w-5" /> Copy sync details</button> : null}
              {family.isCreator ? <button disabled={revokingSecret} onClick={revokeSecret} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-peach px-4 py-3 font-black text-amber-950 disabled:opacity-60 dark:bg-orange-950 dark:text-orange-100"><KeyRound className="h-5 w-5" /> {revokingSecret ? "Revoking" : "Revoke secret"}</button> : null}
            </div>
          </div>
        ) : null}

        <form onSubmit={submitJoin} className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
          <h3 className="font-black">Join an existing family</h3>
          <input value={syncId} onChange={(event) => setSyncId(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-800" placeholder="Sync ID" />
          <input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-800" placeholder="Secret key" />
          <button disabled={joiningFamily} className="min-h-12 rounded-2xl bg-slate-900 px-4 py-3 font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-900">{joiningFamily ? "Connecting" : "Connect family"}</button>
        </form>
        {syncMessage ? <p className="mt-3 rounded-2xl bg-mint px-4 py-3 text-sm font-black text-leaf dark:bg-emerald-950 dark:text-emerald-100">{syncMessage}</p> : null}
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h2 className="text-xl font-black">Fairness safeguards</h2>
        <label className="mt-4 flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 font-bold dark:bg-slate-900"><span>Allow points below zero</span><input type="checkbox" checked={allowNegativeDraft} onChange={(event) => setAllowNegativeDraft(event.target.checked)} className="h-6 w-6" /></label>
        <NumberField label="Daily negative point limit" value={dailyNegativeLimitDraft} onChange={(event) => setDailyNegativeLimitDraft(event.target.value)} />
        <NumberField label="Per incident negative limit" value={perIncidentNegativeLimitDraft} onChange={(event) => setPerIncidentNegativeLimitDraft(event.target.value)} />
        <button type="button" disabled={savingFairness} onClick={saveFairness} className="mt-4 min-h-12 w-full rounded-2xl bg-blueberry px-4 py-3 font-black text-white disabled:opacity-60">{savingFairness ? "Saving" : "Save fairness safeguards"}</button>
        {fairnessMessage ? <p className="mt-3 rounded-2xl bg-mint px-4 py-3 text-sm font-black text-leaf dark:bg-emerald-950 dark:text-emerald-100">{fairnessMessage}</p> : null}
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sunshine text-slate-800 dark:bg-amber-900/40 dark:text-amber-100"><Target className="h-6 w-6" /></span>
          <div>
            <h2 className="text-xl font-black">Family team goal</h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-300">Set the shared points target shown on the family dashboard.</p>
          </div>
        </div>
        <label className="mt-4 flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 font-bold dark:bg-slate-900"><span>Enable family goal on dashboard</span><input type="checkbox" checked={goalEnabledDraft} onChange={(event) => setGoalEnabledDraft(event.target.checked)} className="h-6 w-6" /></label>
        <label className="mt-4 block">
          <span className="text-sm font-extrabold text-slate-500 dark:text-slate-300">Goal title</span>
          <input value={goalTitleDraft} disabled={!goalEnabledDraft} onChange={(event) => setGoalTitleDraft(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900" />
        </label>
        <NumberField label="Target points" value={goalTargetDraft} disabled={!goalEnabledDraft} onChange={(event) => setGoalTargetDraft(event.target.value)} />
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">Child level defaults</h3>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">Edit level titles and points required.</p>
          <div className="mt-3 space-y-3">
            {childLevelsDraft.map((level, index) => (
              <div key={`${index}-${level.title}`} className="grid gap-2 sm:grid-cols-[1fr_140px]">
                <input
                  value={level.title}
                  onChange={(event) => updateChildLevel(index, { title: event.target.value })}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-800"
                  placeholder="Level title"
                />
                <input
                  type="number"
                  min={0}
                  value={level.minPointsInput}
                  onChange={(event) => updateChildLevel(index, { minPointsInput: event.target.value })}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-800"
                  placeholder="Points"
                />
              </div>
            ))}
          </div>
        </div>
        <button type="button" disabled={savingGoal} onClick={saveGoal} className="mt-4 min-h-12 w-full rounded-2xl bg-blueberry px-4 py-3 font-black text-white disabled:opacity-60">{savingGoal ? "Saving" : "Save goal and levels"}</button>
        {goalMessage ? <p className="mt-3 rounded-2xl bg-mint px-4 py-3 text-sm font-black text-leaf dark:bg-emerald-950 dark:text-emerald-100">{goalMessage}</p> : null}
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-skywash text-blueberry dark:bg-slate-700 dark:text-sky-300"><MessageSquare className="h-6 w-6" /></span>
          <div>
            <h2 className="text-xl font-black">Report a bug or suggestion</h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-300">Send feedback to {reportEmail}.</p>
          </div>
        </div>
        <form onSubmit={submitReport} className="mt-4 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <select value={reportType} onChange={(event) => setReportType(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900">
              <option>Bug</option>
              <option>Suggestion</option>
            </select>
            <input value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Short title" required />
          </div>
          <textarea value={reportMessage} onChange={(event) => setReportMessage(event.target.value)} className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white p-3 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="What happened, or what would you like to see?" required />
          <input value={reportContact} onChange={(event) => setReportContact(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Your email or phone, optional" />
          <button className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white"><Send className="h-5 w-5" /> Send report</button>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h2 className="text-xl font-black">Parent lock and display</h2>
        <label className="mt-4 block text-sm font-extrabold text-slate-500 dark:text-slate-300" htmlFor="pin">Simple parent PIN</label>
        <input id="pin" type="password" value={pinDraft} onChange={(event) => setPinDraft(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Optional PIN" />
        <button type="button" disabled={savingPin} onClick={savePin} className="mt-3 min-h-12 w-full rounded-2xl bg-blueberry px-4 py-3 font-black text-white disabled:opacity-60">{savingPin ? "Saving" : "Confirm PIN and save"}</button>
        {pinMessage ? <p className="mt-3 rounded-2xl bg-mint px-4 py-3 text-sm font-black text-leaf dark:bg-emerald-950 dark:text-emerald-100">{pinMessage}</p> : null}
        <label className="mt-4 flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 font-bold dark:bg-slate-900"><span className="flex items-center gap-2"><Moon className="h-5 w-5" /> Dark mode</span><input type="checkbox" checked={data.settings.darkMode} onChange={(event) => updateSettings({ darkMode: event.target.checked })} className="h-6 w-6" /></label>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft dark:bg-slate-800">
        <h2 className="text-xl font-black">Install app icon</h2>
        <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">Add KindPoints to your home screen for app-like access.</p>
        {isStandalone ? <p className="mt-4 rounded-2xl bg-mint px-4 py-3 text-sm font-black text-leaf dark:bg-emerald-950 dark:text-emerald-100">KindPoints is already installed on this device.</p> : null}
        {!isStandalone && installPrompt ? <button type="button" onClick={installApp} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white"><Download className="h-5 w-5" /> Install on this device</button> : null}
        {!isStandalone && !installPrompt && isIos ? <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200">On iPhone/iPad Safari: tap Share, then tap Add to Home Screen.</div> : null}
        {!isStandalone && !installPrompt && !isIos ? <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200">If install is not available yet, open your browser menu and choose Install app or Add to home screen.</div> : null}
        {installMessage ? <p className="mt-3 rounded-2xl bg-mint px-4 py-3 text-sm font-black text-leaf dark:bg-emerald-950 dark:text-emerald-100">{installMessage}</p> : null}
      </section>
    </div>
  );
}

function NumberField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void; disabled?: boolean }) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-extrabold text-slate-500 dark:text-slate-300">{label}</span>
      <input type="number" disabled={disabled} value={value} onChange={onChange} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900" />
    </label>
  );
}
