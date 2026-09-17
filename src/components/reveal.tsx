"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Single scroll-triggered reveal. `lift` adds a gentle hover raise (for cards).
export function Reveal({ children, className = "", delay = 0, y = 20, lift = false }: { children: React.ReactNode; className?: string; delay?: number; y?: number; lift?: boolean }) {
  const reduced = useReducedMotion();
  return <motion.div
    className={className}
    initial={reduced ? false : { opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    whileHover={lift && !reduced ? { y: -6, transition: { duration: 0.4, ease: EASE } } : undefined}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.75, delay, ease: EASE }}
  >{children}</motion.div>;
}

// Container that reveals its <Item> children one after another on scroll.
export function Stagger({ children, className = "", gap = 0.1, delay = 0, amount = 0.2 }: { children: React.ReactNode; className?: string; gap?: number; delay?: number; amount?: number }) {
  const reduced = useReducedMotion();
  return <motion.div
    className={className}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount }}
    variants={{ hidden: {}, show: { transition: { staggerChildren: reduced ? 0 : gap, delayChildren: delay } } }}
  >{children}</motion.div>;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function Item({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} variants={reduced ? undefined : itemVariants}>{children}</motion.div>;
}
