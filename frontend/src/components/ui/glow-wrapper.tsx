import { cn } from "@/lib/utils"
import { motion, type HTMLMotionProps } from "motion/react"
import { variants } from "@/lib/motion"

interface GlowWrapperProps extends HTMLMotionProps<"div"> {
  intensity?: "subtle" | "default" | "strong"
  animated?: boolean
  children: React.ReactNode
}

const glowStyles = {
  subtle: "shadow-[0_0_10px_oklch(0.75_0.2_195_/_0.2)]",
  default: "shadow-[0_0_20px_oklch(0.75_0.2_195_/_0.4)]",
  strong: "shadow-[0_0_40px_oklch(0.75_0.2_195_/_0.6)]",
} as const

function GlowWrapper({
  intensity = "default",
  animated = false,
  className,
  children,
  ...props
}: GlowWrapperProps) {
  const glowClass = glowStyles[intensity]
  const animationVariants = animated ? variants.glowPulse : undefined

  return (
    <motion.div
      className={cn(
        "rounded-xl border border-primary/30 bg-surface-2",
        glowClass,
        className
      )}
      variants={animationVariants}
      initial="initial"
      animate={animated ? "animate" : undefined}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export { GlowWrapper }