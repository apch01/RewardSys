"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, LogIn, Sparkles } from "lucide-react";

type ProviderInfo = {
  id: string;
  name: string;
  type: string;
};

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoadingId, setOauthLoadingId] = useState<string | null>(null);
  const [oauthProviders, setOauthProviders] = useState<ProviderInfo[]>([]);

  useEffect(() => {
    getProviders().then((providers) => {
      setOauthProviders(Object.values(providers ?? {}).filter((provider) => provider.type === "oauth"));
    });
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading || oauthLoadingId) return;
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/" });
    setLoading(false);

    if (result?.error) {
      setError("Email or password is not correct.");
      return;
    }

    router.push(result?.url ?? "/");
    router.refresh();
  }

  async function submitOauth(providerId: string) {
    if (loading || oauthLoadingId) return;
    setOauthLoadingId(providerId);
    await signIn(providerId, { callbackUrl: "/" });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <section className="w-full rounded-3xl bg-white p-6 shadow-soft dark:bg-slate-800">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-sunshine text-4xl shadow-soft">⭐</span>
          <p className="mt-4 text-sm font-extrabold uppercase text-blueberry dark:text-sky-300">Growth, kindness, teamwork</p>
          <h1 className="mt-1 text-3xl font-black">Family Reward Points</h1>
          <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-300">Celebrate positive choices, make space for repair, and keep each child on their own path.</p>
        </div>

        {searchParams.get("reset") === "success" ? <div className="mt-5 rounded-2xl bg-mint px-4 py-3 text-sm font-black text-leaf dark:bg-emerald-950 dark:text-emerald-100">Password updated. Sign in with your new password.</div> : null}
        {error ? <div className="mt-5 rounded-2xl bg-peach px-4 py-3 text-sm font-black text-amber-950 dark:bg-orange-950 dark:text-orange-100">{error}</div> : null}

        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm font-extrabold text-slate-600 dark:text-slate-200">Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" autoComplete="email" required />
          </label>
          <label className="block">
            <span className="text-sm font-extrabold text-slate-600 dark:text-slate-200">Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none focus:border-blueberry dark:border-slate-600 dark:bg-slate-900" autoComplete="current-password" required />
          </label>
          <button disabled={loading || Boolean(oauthLoadingId)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blueberry px-4 py-3 font-black text-white disabled:opacity-70"><LogIn className="h-5 w-5" /> {loading ? "Signing in" : "Sign in"}</button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm font-bold">
          <Link href="/signup" className="text-blueberry dark:text-sky-300">Create account</Link>
          <Link href="/forgot-password" className="text-slate-500 dark:text-slate-300">Forgot password?</Link>
        </div>

        {oauthProviders.length ? <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 dark:border-slate-700">
          {oauthProviders.map((provider) => (
            <button key={provider.id} type="button" disabled={loading || Boolean(oauthLoadingId)} onClick={() => submitOauth(provider.id)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-black text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
              {provider.id === "google" ? <Sparkles className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
              {oauthLoadingId === provider.id ? `Connecting ${provider.name}` : `Continue with ${provider.name}`}
            </button>
          ))}
        </div> : null}
      </section>
    </div>
  );
}
