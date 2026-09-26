"use client"

import { useScroll, useTransform, motion } from "motion/react"

const sectionIds = [
  { id: "hero", label: "01" },
  { id: "cv-intelligence", label: "02" },
  { id: "germany-engine", label: "03" },
  { id: "city-network", label: "04" },
  { id: "ai-match-matrix", label: "05" },
  { id: "application-studio", label: "06" },
  { id: "command-tracker", label: "07" },
  { id: "cta", label: "08" },
] as const

export function ScrollProgressRail() {
  const { scrollYProgress } = useScroll()

  const progressY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "100%"]
  )

  const activeIndex = useTransform(
    scrollYProgress,
    [0, 1],
    [0, sectionIds.length - 1]
  )

  return (
    <motion.div
      className="fixed right-6 top-1/2 -translate-y-1/2 z-[200] flex flex-col items-center gap-2"
      style={{ height: "60vh", maxHeight: "500px" }}
    >
      <div className="text-[10px] font-mono text-primary uppercase tracking-wider mb-4">STAGE</div>
      <motion.div
        className="relative w-1 h-full bg-white/5 rounded-full overflow-hidden"
      >
        <motion.div
          className="absolute left-0 w-full bg-primary rounded-full shadow-[0_0_15px_rgba(108,198,212,0.6)]"
          style={{ height: progressY }}
        />
      </motion.div>
      <div className="flex flex-col gap-4 text-[10px] font-mono text-neutral-400">
        {sectionIds.map((_, i) => (
          <motion.span
            key={i}
            className="text-center w-10"
            style={{ color: activeIndex }}
            animate={{ opacity: [0.3, 1, 0.3], color: ["text-neutral-400", "text-primary", "text-neutral-400"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {sectionIds[i].label}
          </motion.span>
        ))}
      </div>
    </motion.div>
  )
}