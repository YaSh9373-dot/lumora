"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

export const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export function PageEnter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
      {children}
    </motion.div>
  );
}

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.5, ease: EASE });
    return () => controls.stop();
  }, [value, mv, reduce]);
  return <motion.span className={className}>{rounded}</motion.span>;
}

/** Fires once when scrolled into view; returns ref + inView flag. */
export function useOnceInView<T extends Element>() {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return { ref, inView };
}
