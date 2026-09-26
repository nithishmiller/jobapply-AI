"use client"

import { useScroll, useTransform, motion } from "motion/react"

export function ScrollProgressRail() {
  const { scrollYProgress } = useScroll()

  const progressY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "100%"]
  )

  return (
    <div
      className="fixed right-6 top-1/2 -translate-y-1/2 z-[200] hidden lg:flex flex-col items-center gap-4 bg-black/20 backdrop-blur-md px-3 py-6 rounded-full border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
      style={{ height: "400px" }}
    >
      <div className="text-[9px] font-mono text-primary uppercase tracking-widest leading-none">STAGE</div>

      <div className="relative w-[2px] h-[250px] bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-full bg-primary rounded-full shadow-[0_0_15px_rgba(108,198,212,0.8)]"
          style={{ height: progressY }}
        />
      </div>

      <div className="flex flex-col justify-between h-[60px] text-[10px] font-mono text-neutral-400">
        <span className="text-center font-bold text-primary animate-pulse">01</span>
        <div className="w-1.5 h-1.5 rounded-full bg-primary/30 mx-auto" />
        <span className="text-center text-neutral-500">08</span>
      </div>
    </div>
  )
}