"use client"

import { useMotionValue, useTransform, motion, type HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/utils"

interface CursorTiltCardProps extends Omit<HTMLMotionProps<"div">, "onMouseMove" | "onMouseLeave"> {
  children: React.ReactNode
  intensity?: number
  className?: string
}

export function CursorTiltCard({ children, intensity = 12, className, ...props }: CursorTiltCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useTransform(y, [-intensity, intensity], [intensity, -intensity])
  const rotateY = useTransform(x, [-intensity, intensity], [-intensity, intensity])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) / (rect.width / 2))
    y.set((e.clientY - centerY) / (rect.height / 2))
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      {...props}
      className={cn("perspective-1000", className)}
      style={{
        transformStyle: "preserve-3d",
        willChange: "transform",
        ...props.style,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          transformStyle: "preserve-3d",
          rotateX,
          rotateY,
        }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}