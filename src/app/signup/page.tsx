"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const payload = await response.json() as { error?: string };
    if (!response.ok) {
      setLoading(false);
      setError(payload.error ?? "Could not create your account.");
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/" });
    setLoading(false);

    if (result?.error) {
      router.push("/signin");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <section className="w-full rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-800">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-sunshine text-4xl shadow-soft">⭐</span>
          <h1 className="mt-4 text-3xl font-black">Create account</h1>
          <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">Your first account creates the family sync space.</p>
        </div>
        {error ? <div className="mt-5 rounded-2xl bg-peach px-4 py-3 text-sm font-black text-amber-950 dark:bg-orange-950 dark:text-orange-100">{error}</div> : null}
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input value={name} onChange={(event) => setName(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Parent name" autoComplete="name" />
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Email" autoComplete="email" required />
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" placeholder="Password, at least 8 characters" autoComplete="new-password" required />
          <button disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white disabled:opacity-70"><UserPlus className="h-5 w-5" /> {loading ? "Creating account" : "Create account"}</button>
        </form>
        <p className="mt-4 text-center text-sm font-bold text-slate-500 dark:text-slate-300">Already have an account? <Link href="/signin" className="text-blueberry dark:text-sky-300">Sign in</Link></p>
      </section>
    </div>
  );
}