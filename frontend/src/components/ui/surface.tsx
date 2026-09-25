import { cn } from "@/lib/utils"

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 0 | 1 | 2 | 3 | 4
  interactive?: boolean
  className?: string
}

const surfaceClasses = {
  0: "surface-0",
  1: "surface-1",
  2: "surface-2",
  3: "surface-3",
  4: "surface-4",
} as const

const interactiveClasses = {
  true: "transition-all duration-200 hover:shadow-lg hover:-translate-y-1 active:translate-y-0",
  false: "",
} as const

function Surface({
  level = 0,
  interactive = false,
  className,
  children,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-xl",
        surfaceClasses[level],
        interactive ? interactiveClasses.true : interactiveClasses.false,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Surface }