"use client";

import { useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Check } from "lucide-react";

type Props = {
  /** Checked when the knob arrives. Return false and it slides back. */
  validate: () => boolean;
  /** Called once the knob has arrived at the end. */
  onComplete: () => void;
  /** What the knob does, for screen readers: "Sign in" or "Sign up". */
  action?: string;
};

// Travel: a tap glides the whole way (slow start, smooth stop); a drag let
// go near the end just settles; a give-up springs back with a little bounce.
const GLIDE = { ms: 700, ease: "cubic-bezier(0.65, 0, 0.35, 1)" };
const SETTLE = { ms: 220, ease: "cubic-bezier(0.22, 1, 0.36, 1)" };
const SPRING_BACK = { ms: 550, ease: "cubic-bezier(0.34, 1.12, 0.64, 1)" };
const TAP_SLOP = 6; // px a press may move and still count as a tap

/**
 * "Slide to sign in" (or sign up), like the phone's slide to answer: drag
 * the orange knob to the right end, or just tap it and it glides there on
 * its own. Let go early and it springs back. If something isn't filled in,
 * the bar flashes red on arrival and the knob slides back to the start
 * (the form says what's missing).
 * Keyboard: focus the knob and press Enter or Space (same as a tap).
 */
export function SlideToSignIn({ validate, onComplete, action = "Sign in" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; downX: number; max: number } | null>(null);
  const busy = useRef(false);
  const [x, setX] = useState(0);
  const [max, setMax] = useState(1);
  const [motion, setMotion] = useState(SPRING_BACK);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  // How far the knob can travel: the track minus the knob and its inset.
  const measure = () => {
    const track = trackRef.current;
    const knob = knobRef.current;
    if (!track || !knob) return 1;
    return Math.max(1, track.clientWidth - knob.offsetWidth - 2 * knob.offsetLeft);
  };

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const springBack = () => {
    setMotion(SPRING_BACK);
    setX(0);
  };

  const finish = (glide: boolean) => {
    if (busy.current) return;
    busy.current = true;
    const m = measure();
    const move = reduced() ? { ms: 0, ease: "linear" } : glide ? GLIDE : SETTLE;
    setMax(m);
    setMotion(move);
    setX(m);
    window.setTimeout(() => {
      // Something missing: flash red for a beat, then slide back.
      if (!validate()) {
        setFailed(true);
        window.setTimeout(() => {
          springBack();
          window.setTimeout(() => {
            setFailed(false);
            busy.current = false;
          }, SPRING_BACK.ms);
        }, 300);
        return;
      }
      // Arrived: fill turns orange, the knob pops and shows a tick.
      setDone(true);
      onComplete();
      // Not a real sign-in yet, so return to the start once it has shown.
      window.setTimeout(() => {
        setDone(false);
        springBack();
        busy.current = false;
      }, 1400);
    }, move.ms);
  };

  const progress = Math.min(1, x / max);
  const transition = dragging ? "none" : `${motion.ms}ms ${motion.ease}`;

  return (
    <div
      ref={trackRef}
      className="slide-track"
      data-done={done || undefined}
      data-failed={failed || undefined}
    >
      <div
        aria-hidden="true"
        className="slide-fill"
        style={{ width: `calc(${x}px + 3.5rem)`, transition: dragging ? "none" : `width ${transition}` }}
      />
      <span
        aria-hidden="true"
        className="slide-label"
        style={{
          opacity: Math.max(0, 1 - progress * 1.8),
          transition: dragging ? "none" : `opacity ${motion.ms * 0.6}ms ease`,
        }}
      >
        Slide to {action.toLowerCase()}
      </span>
      <div
        ref={knobRef}
        role="button"
        tabIndex={0}
        aria-label={action}
        className="slide-knob"
        style={
          {
            "--x": `${x}px`,
            transition: dragging ? "none" : `transform ${transition}`,
          } as CSSProperties
        }
        onPointerDown={(e) => {
          if (busy.current) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          const m = measure();
          setMax(m);
          drag.current = { startX: e.clientX - x, downX: e.clientX, max: m };
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setX(Math.min(drag.current.max, Math.max(0, e.clientX - drag.current.startX)));
        }}
        onPointerUp={(e) => {
          if (!drag.current) return;
          const { downX, max: m } = drag.current;
          drag.current = null;
          setDragging(false);
          if (Math.abs(e.clientX - downX) < TAP_SLOP) finish(true); // a tap: glide on its own
          else if (x >= m * 0.85) finish(false);
          else springBack();
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
          springBack();
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          finish(true);
        }}
      >
        {done ? (
          <Check className="slide-tick size-5" aria-hidden="true" />
        ) : (
          <ArrowRight className="size-5" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
