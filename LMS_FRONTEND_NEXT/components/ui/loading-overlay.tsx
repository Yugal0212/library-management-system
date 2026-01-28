import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
  overlayClassName?: string
  spinnerSize?: "sm" | "default" | "lg" | "xl"
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  loadingText = "Loading...",
  className,
  overlayClassName,
  spinnerSize = "default",
}) => {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm",
            overlayClassName
          )}
        >
          <Spinner size={spinnerSize} className="text-primary" />
          {loadingText && (
            <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">
              {loadingText}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export { LoadingOverlay }
