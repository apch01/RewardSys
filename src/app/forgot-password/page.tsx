"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setDevResetUrl("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; devResetUrl?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not request a reset link. Please try again.");
        return;
      }

      setMessage("If an account exists for that email, a reset link has been sent.");
      setDevResetUrl(payload.devResetUrl ?? "");
    } catch {
      setError("Could not reach the reset service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <section className="w-full rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-800">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-skywash text-blueberry shadow-soft dark:bg-slate-700 dark:text-sky-300"><Mail className="h-8 w-8" /></span>
          <h1 className="mt-4 text-3xl font-black">Reset password</h1>
          <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">Enter your email and we will send a password reset link.</p>
        </div>

        {message ? <div className="mt-5 rounded-2xl bg-mint px-4 py-3 text-sm font-black text-leaf dark:bg-emerald-950 dark:text-emerald-100">{message}</div> : null}
        {error ? <div className="mt-5 rounded-2xl bg-peach px-4 py-3 text-sm font-black text-amber-950 dark:bg-orange-950 dark:text-orange-100">{error}</div> : null}
        {devResetUrl ? <Link href={devResetUrl} className="mt-3 block break-words rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-blueberry dark:bg-slate-900 dark:text-sky-300">Open local reset link</Link> : null}

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Email" autoComplete="email" required />
          <button disabled={loading} className="min-h-12 w-full rounded-2xl bg-blueberry px-4 py-3 font-black text-white disabled:opacity-70">{loading ? "Sending" : "Send reset link"}</button>
        </form>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm font-bold">
          <Link href="/signin" className="text-blueberry dark:text-sky-300">Back to sign in</Link>
          <Link href="/reset-password" className="text-slate-500 dark:text-slate-300">I have a reset link</Link>
        </div>
      </section>
    </div>
  );
}