export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const width = Math.min(Math.max(value, 0), 100);
  return (
    <div className="space-y-2">
      {label ? <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</div> : null}
      <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="h-full rounded-full bg-gradient-to-r from-leaf to-blueberry transition-all duration-500" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
