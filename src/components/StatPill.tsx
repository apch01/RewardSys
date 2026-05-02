import { LucideIcon } from "lucide-react";

export function StatPill({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft dark:bg-slate-800">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-skywash text-blueberry dark:bg-slate-700 dark:text-sky-300">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-lg font-black leading-tight">{value}</div>
        <div className="text-xs font-bold text-slate-500 dark:text-slate-300">{label}</div>
      </div>
    </div>
  );
}
