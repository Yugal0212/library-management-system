import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"
import { LoadingDots } from "./loading-dots"

interface PageLoadingProps {
  className?: string
  variant?: "spinner" | "dots" | "skeleton"
  size?: "sm" | "default" | "lg" | "xl"
  text?: string
  fullScreen?: boolean
}

const PageLoading: React.FC<PageLoadingProps> = ({
  className,
  variant = "spinner",
  size = "lg",
  text = "Loading...",
  fullScreen = false,
}) => {
  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-gray-900"
    : "flex flex-col items-center justify-center min-h-[400px] w-full"

  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return <LoadingDots size={size === "xl" ? "lg" : size} className="text-primary" />
      case "skeleton":
        return (
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-48"></div>
            <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-32"></div>
            <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-40"></div>
          </div>
        )
      default:
        return <Spinner size={size} className="text-primary" />
    }
  }

  return (
    <div className={cn(containerClasses, className)}>
      {renderLoader()}
      {text && variant !== "skeleton" && (
        <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-300 animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}

export { PageLoading }
