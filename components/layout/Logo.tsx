// Text wordmark until the approved logo files are collected (plan phase 0A).
export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden="true" className="grid size-7 grid-cols-2 gap-0.5 rounded-md p-1 ring-1 ring-white/15">
        <span className="rounded-[2px] bg-brand-orange" />
        <span className="rounded-[2px] bg-brand-white/90" />
        <span className="rounded-[2px] bg-brand-blue" />
        <span className="rounded-[2px] bg-brand-blue/40" />
      </span>
      <span className="font-display text-base font-semibold uppercase tracking-[0.14em]">
        Pixel <span className="text-muted-foreground">IT Center</span>
      </span>
    </span>
  );
}
