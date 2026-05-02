"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Gift, Home, LogOut, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/settings", label: "Settings", icon: Settings }
];

const publicPaths = ["/signin", "/signup", "/forgot-password", "/reset-password"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

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

  if (status === "loading") {
    return <div className="grid min-h-screen place-items-center bg-[#f7fbff] font-black text-blueberry dark:bg-slate-900 dark:text-sky-300">Loading KindPoints...</div>;
  }

  if (!signedIn && !isPublicPage) {
    return <div className="grid min-h-screen place-items-center bg-[#f7fbff] font-black text-blueberry dark:bg-slate-900 dark:text-sky-300">Opening sign in...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7fbff] text-slate-900 dark:bg-slate-900 dark:text-white">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-[#f7fbff]/90 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 rounded-full text-lg font-extrabold text-blueberry focus:outline-none focus:ring-2 focus:ring-blueberry/30 dark:text-sky-300">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sunshine text-xl shadow-soft">⭐</span>
            <span>KindPoints</span>
          </Link>
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
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:pb-10">{children}</main>
      {signedIn ? <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:hidden">
        <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
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
