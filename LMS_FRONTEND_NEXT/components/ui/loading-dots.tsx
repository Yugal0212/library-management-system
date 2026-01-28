import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg"
}

const LoadingDots = React.forwardRef<HTMLDivElement, LoadingDotsProps>(
  ({ className, size = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-1 h-1",
      default: "w-2 h-2",
      lg: "w-3 h-3",
    }

    return (
      <div
        className={cn("flex space-x-1 items-center", className)}
        ref={ref}
        {...props}
      >
        <div
          className={cn(
            "bg-current rounded-full animate-bounce",
            sizeClasses[size]
          )}
        />
        <div
          className={cn(
            "bg-current rounded-full animate-bounce",
            sizeClasses[size],
            "[animation-delay:0.1s]"
          )}
        />
        <div
          className={cn(
            "bg-current rounded-full animate-bounce",
            sizeClasses[size],
            "[animation-delay:0.2s]"
          )}
        />
      </div>
    )
  }
)
LoadingDots.displayName = "LoadingDots"

export { LoadingDots }
