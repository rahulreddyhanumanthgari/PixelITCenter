"use client";

import { useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";

type Props = {
  /** Called when the knob reaches the end. Return false to spring it back. */
  onComplete: () => boolean;
  /** What the knob does, for screen readers: "Sign in" or "Sign up". */
  action?: string;
};

/**
 * "Slide to sign in" (or sign up), like the phone's slide to answer: drag the orange
 * knob to the right end to sign in. Let go early and it springs back.
 * Keyboard: focus the knob and press Enter or Space.
 */
export function SlideToSignIn({ onComplete, action = "Sign in" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; max: number } | null>(null);
  const [x, setX] = useState(0);
  const [max, setMax] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);

  // How far the knob can travel: the track minus the knob and its inset.
  const measure = () => {
    const track = trackRef.current;
    const knob = knobRef.current;
    if (!track || !knob) return 1;
    return Math.max(1, track.clientWidth - knob.offsetWidth - 2 * knob.offsetLeft);
  };

  const finish = () => {
    if (!onComplete()) {
      setX(0);
      return;
    }
    const m = measure();
    setMax(m);
    setX(m);
    setDone(true);
    // Not a real sign-in yet, so return to the start once it has shown.
    window.setTimeout(() => {
      setDone(false);
      setX(0);
    }, 1400);
  };

  const progress = Math.min(1, x / max);

  return (
    <div ref={trackRef} className="slide-track" data-done={done || undefined}>
      <div aria-hidden="true" className="slide-fill" style={{ width: `calc(${x}px + 3.5rem)` }} />
      <span aria-hidden="true" className="slide-label" style={{ opacity: Math.max(0, 1 - progress * 1.8) }}>
        Slide to {action.toLowerCase()}
      </span>
      <div
        ref={knobRef}
        role="button"
        tabIndex={0}
        aria-label={action}
        className="slide-knob"
        style={{
          transform: `translateX(${x}px)`,
          transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        onPointerDown={(e) => {
          if (done) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          const m = measure();
          setMax(m);
          drag.current = { startX: e.clientX - x, max: m };
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setX(Math.min(drag.current.max, Math.max(0, e.clientX - drag.current.startX)));
        }}
        onPointerUp={() => {
          if (!drag.current) return;
          const reached = x >= drag.current.max * 0.85;
          drag.current = null;
          setDragging(false);
          if (reached) finish();
          else setX(0);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
          setX(0);
        }}
        onKeyDown={(e) => {
          if (done || (e.key !== "Enter" && e.key !== " ")) return;
          e.preventDefault();
          finish();
        }}
      >
        {done ? <Check className="size-5" aria-hidden="true" /> : <ArrowRight className="size-5" aria-hidden="true" />}
      </div>
    </div>
  );
}
