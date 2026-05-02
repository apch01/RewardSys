"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookText, ClipboardList, Gift, Home, LogOut, Menu, Settings, Sparkles, X } from "lucide-react";
import { useKindPoints } from "@/lib/store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/actions", label: "Actions", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings }
];

const appMenuItems = [
  { href: "/", label: "KindPoints", icon: Home },
  { href: "/spelling", label: "Spelling", icon: BookText }
];

const publicPaths = ["/signin", "/signup", "/forgot-password", "/reset-password"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hydrated } = useKindPoints();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  const signedIn = Boolean(session?.user?.email);
  const isPublicPage = publicPaths.includes(pathname);

  useEffect(() => {
    if (status === "unauthenticated" && !isPublicPage) router.replace("/signin");
  }, [isPublicPage, router, status]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return <AppLoader message="Loading KindPoints" />;
  }

  if (!signedIn && !isPublicPage) {
    return <AppLoader message="Sign In to KindPoints" />;
  }

  if (signedIn && !hydrated) {
    return <AppLoader message="Syncing Your Family" />;
  }

  return (
    <div className="min-h-screen bg-[#f7fbff] text-slate-900 dark:bg-slate-900 dark:text-white">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-[#f7fbff]/90 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            {signedIn ? (
              <button type="button" onClick={() => setMenuOpen((value) => !value)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-slate-600 shadow-soft dark:bg-slate-800 dark:text-slate-200" aria-label="Open menu">
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            ) : null}
            <Link href="/" className="flex items-center gap-2 rounded-full text-lg font-extrabold text-blueberry focus:outline-none focus:ring-2 focus:ring-blueberry/30 dark:text-sky-300">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-sunshine text-xl shadow-soft">⭐</span>
              <span>KindPoints</span>
            </Link>
          </div>
          {signedIn ? <div className="hidden items-center gap-2 rounded-full bg-white p-1 shadow-soft dark:bg-slate-800 sm:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition", active ? "bg-blueberry text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700")}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div> : null}
          {signedIn ? (
            <button onClick={() => signOut({ callbackUrl: "/signin" })} className="grid h-11 w-11 place-items-center rounded-full bg-white text-slate-600 shadow-soft dark:bg-slate-800 dark:text-slate-200" aria-label="Sign out">
              <LogOut className="h-5 w-5" />
            </button>
          ) : (
            <Sparkles className="h-6 w-6 text-amberSoft" />
          )}
        </div>
      </header>
      {signedIn && menuOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-900/30" onClick={() => setMenuOpen(false)}>
          <aside className="h-full w-72 max-w-[80vw] bg-white p-4 shadow-xl dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-300">Menu</p>
              <button type="button" onClick={() => setMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {appMenuItems.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/spelling" ? pathname.startsWith("/spelling") : !pathname.startsWith("/spelling");
                return (
                  <Link key={item.href} href={item.href} className={cn("flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-black", active ? "bg-blueberry text-white" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800")}>
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      ) : null}
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:pb-10">{children}</main>
      {signedIn ? <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:hidden">
        <div className="mx-auto grid max-w-sm grid-cols-4 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn("flex min-h-14 flex-col items-center justify-center rounded-2xl text-xs font-extrabold transition", active ? "bg-blueberry text-white" : "text-slate-500 dark:text-slate-300")}>
                <Icon className="mb-1 h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav> : null}
    </div>
  );
}

function AppLoader({ message }: { message: string }) {
  return (
    <div className="relative grid min-h-screen overflow-hidden bg-[#f7fbff] px-6 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="absolute left-1/2 top-24 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-200/60 blur-3xl dark:bg-sky-700/30" />
      <div className="absolute bottom-12 right-[-5rem] h-60 w-60 rounded-full bg-emerald-200/60 blur-3xl dark:bg-emerald-700/20" />
      <div className="relative mx-auto flex w-full max-w-sm flex-col items-center justify-center text-center">
        <div className="relative grid h-28 w-28 place-items-center rounded-[2rem] bg-white shadow-soft dark:bg-slate-900">
          <div className="absolute inset-[-10px] animate-loaderSpin rounded-[2.4rem] bg-[conic-gradient(from_0deg,#2563eb,#38bdf8,#facc15,#2563eb)] opacity-90" />
          <div className="relative grid h-24 w-24 place-items-center rounded-[1.75rem] bg-white dark:bg-slate-900">
            <span className="text-5xl">⭐</span>
          </div>
        </div>
        <h1 className="mt-7 text-3xl font-black tracking-tight text-blueberry dark:text-sky-300">KindPoints</h1>
        <p className="mt-2 text-sm font-extrabold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">{message}</p>
        <div className="mt-6 flex items-center gap-2" aria-hidden="true">
          <span className="h-2.5 w-2.5 animate-loaderBounce rounded-full bg-blueberry [animation-delay:-0.2s] dark:bg-sky-300" />
          <span className="h-2.5 w-2.5 animate-loaderBounce rounded-full bg-blueberry [animation-delay:-0.1s] dark:bg-sky-300" />
          <span className="h-2.5 w-2.5 animate-loaderBounce rounded-full bg-blueberry dark:bg-sky-300" />
        </div>
      </div>
    </div>
  );
}
