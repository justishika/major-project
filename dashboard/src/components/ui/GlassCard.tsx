import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hoverEffect = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-panel p-6",
          hoverEffect && "glass-panel-hover cursor-default",
          className
        )}
        {...props}
      />
    )
  }
)
GlassCard.displayName = "GlassCard"

export { GlassCard }
