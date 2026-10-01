"use client";

import { chooseDesign, SHOW_DESIGN_SWITCH, type Design } from "@/lib/design";

const DESIGNS: { id: Design; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
];

/**
 * Review tool, not part of either design: a small floating control that
 * switches the homepage between the two candidate designs (chooseDesign in
 * lib/design.ts). Styled on its own so it reads the same on both.
 */
export function DesignSwitch({ current }: { current: Design }) {
  if (!SHOW_DESIGN_SWITCH) return null;

  return (
    <div
      role="group"
      aria-label="Website design"
      style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-[60] flex items-center gap-1 rounded-full border border-white/15 bg-[#1b1f27]/90 p-1 text-[13px] text-white shadow-lg backdrop-blur"
    >
      <span className="px-2 text-white/60">Design</span>
      {DESIGNS.map((d) => (
        <button
          key={d.id}
          type="button"
          aria-pressed={d.id === current}
          onClick={() => d.id !== current && chooseDesign(d.id)}
          className="min-h-11 rounded-full px-3 sm:min-h-8 font-medium transition-colors aria-pressed:bg-white aria-pressed:text-[#1b1f27] hover:bg-white/15 aria-pressed:hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
