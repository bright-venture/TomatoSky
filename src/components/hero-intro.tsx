"use client";

import Image from "next/image";
import { useRef } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "motion/react";
// Static import: the built URL includes a content hash, so replacing the file
// changes the URL and the optimized-image cache busts automatically.
import heroSky from "../../public/hero-sky.png";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function HeroIntro() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Start slightly zoomed so the parallax shift never exposes the container edge.
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "6%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.16]);

  const outer: Variants = { hidden: {}, show: { transition: { staggerChildren: reduced ? 0 : 0.14, delayChildren: 0.15 } } };
  const group: Variants = { hidden: {}, show: { transition: { staggerChildren: reduced ? 0 : 0.12 } } };
  const item: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 24, filter: "blur(6px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.85, ease: EASE } },
  };
  const lines: Variants = { hidden: {}, show: { transition: { staggerChildren: reduced ? 0 : 0.14 } } };
  const line: Variants = {
    hidden: reduced ? {} : { opacity: 0, y: 30, filter: "blur(8px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: EASE } },
  };

  return <section className="hero" aria-labelledby="hero-title" ref={ref}>
    <motion.div className="hero-content" variants={outer} initial="hidden" animate="show">
      <motion.div variants={group}>
        <motion.p className="eyebrow" variants={item}><span className="tiny-line" /> ROOTED IN LEBANON</motion.p>
        <motion.h1 id="hero-title" variants={lines}>
          <motion.span className="hero-line" variants={line}>Good things.</motion.span>
          <motion.span className="hero-line" variants={line}>Grown <em>together.</em></motion.span>
        </motion.h1>
        <motion.p className="hero-description" variants={item}>A home for food, agriculture, and the brands that bring them to life. We are TomatoSky.</motion.p>
        <motion.a className="button button-dark" href="#brands" variants={item}>Meet our brands <ArrowUpRight size={19} /></motion.a>
      </motion.div>
      <motion.div className="hero-bottom" variants={item}><span>TOMATO SKY SAL</span><a href="#about" aria-label="Discover our story"><ArrowDown size={21} /></a><span>LEBANON</span></motion.div>
    </motion.div>
    <div className="hero-image">
      <motion.div className="hero-image-parallax" style={reduced ? undefined : { y: imageY, scale: imageScale }}>
        <motion.div className="hero-image-fade" initial={reduced ? false : { opacity: 0, scale: 1.12 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: EASE }}>
          <Image src={heroSky} alt="A tomato glowing like a sun in a cloudy sky" fill priority sizes="(max-width: 760px) 100vw, 51vw" />
        </motion.div>
      </motion.div>
      <div className="image-label"><span>ONE COMPANY.<br />A WORLD OF POSSIBILITY.</span><span className="image-label-mark" aria-hidden="true">T.</span></div>
    </div>
  </section>;
}
