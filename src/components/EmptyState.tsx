export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-6 text-center dark:border-slate-700 dark:bg-slate-800/80">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-mint text-2xl">🌱</div>
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">{text}</p>
    </div>
  );
}
