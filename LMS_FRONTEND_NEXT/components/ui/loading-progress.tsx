import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingProgressProps {
  isLoading: boolean
  className?: string
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({
  isLoading,
  className,
}) => {
  if (!isLoading) return null

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 z-50",
        "page-loading-bar",
        className
      )}
    />
  )
}

export { LoadingProgress }
