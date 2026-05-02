"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });
    const payload = await response.json() as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not reset your password.");
      return;
    }

    router.push("/signin?reset=success");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <section className="w-full rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-800">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-skywash text-blueberry shadow-soft dark:bg-slate-700 dark:text-sky-300"><KeyRound className="h-8 w-8" /></span>
          <h1 className="mt-4 text-3xl font-black">Choose new password</h1>
          <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">Use at least 8 characters.</p>
        </div>
        {!token ? <div className="mt-5 rounded-2xl bg-peach px-4 py-3 text-sm font-black text-amber-950 dark:bg-orange-950 dark:text-orange-100">Reset token is missing.</div> : null}
        {error ? <div className="mt-5 rounded-2xl bg-peach px-4 py-3 text-sm font-black text-amber-950 dark:bg-orange-950 dark:text-orange-100">{error}</div> : null}
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="New password" autoComplete="new-password" required />
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Confirm new password" autoComplete="new-password" required />
          <button disabled={loading || !token} className="min-h-12 w-full rounded-2xl bg-blueberry px-4 py-3 font-black text-white disabled:opacity-70">{loading ? "Saving" : "Save new password"}</button>
        </form>
      </section>
    </div>
  );
}