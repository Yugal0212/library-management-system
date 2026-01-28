import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { LoadingDots } from "@/components/ui/loading-dots"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { PageLoading } from "@/components/ui/page-loading"
import { LoadingProgress } from "@/components/ui/loading-progress"

export const LoadingDemo: React.FC = () => {
  const [buttonLoading, setButtonLoading] = useState(false)
  const [overlayLoading, setOverlayLoading] = useState(false)
  const [progressLoading, setProgressLoading] = useState(false)

  const handleButtonClick = () => {
    setButtonLoading(true)
    setTimeout(() => setButtonLoading(false), 3000)
  }

  const handleOverlayClick = () => {
    setOverlayLoading(true)
    setTimeout(() => setOverlayLoading(false), 3000)
  }

  const handleProgressClick = () => {
    setProgressLoading(true)
    setTimeout(() => setProgressLoading(false), 3000)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Loading Components Demo</h1>
        <p className="text-gray-600">Showcase of all loading states and animations</p>
      </div>

      {/* Progress Bar Demo */}
      <LoadingProgress isLoading={progressLoading} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Button Loading States */}
        <Card>
          <CardHeader>
            <CardTitle>Button Loading States</CardTitle>
            <CardDescription>Buttons with built-in loading animations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleButtonClick}
              loading={buttonLoading}
              loadingText="Processing..."
              className="w-full"
            >
              Click to Load
            </Button>
            
            <Button 
              variant="outline"
              loading={buttonLoading}
              loadingText="Saving..."
              className="w-full"
            >
              Save Changes
            </Button>
            
            <Button 
              variant="destructive"
              loading={buttonLoading}
              loadingText="Deleting..."
              className="w-full"
            >
              Delete Item
            </Button>
          </CardContent>
        </Card>

        {/* Spinner Variations */}
        <Card>
          <CardHeader>
            <CardTitle>Spinner Components</CardTitle>
            <CardDescription>Different spinner sizes and styles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <Spinner size="sm" />
                <p className="text-xs mt-2">Small</p>
              </div>
              <div className="text-center">
                <Spinner size="default" />
                <p className="text-xs mt-2">Default</p>
              </div>
              <div className="text-center">
                <Spinner size="lg" />
                <p className="text-xs mt-2">Large</p>
              </div>
              <div className="text-center">
                <Spinner size="xl" />
                <p className="text-xs mt-2">Extra Large</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading Dots */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Dots</CardTitle>
            <CardDescription>Animated dot patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div>
                <LoadingDots size="sm" />
                <p className="text-xs mt-2">Small Dots</p>
              </div>
              <div>
                <LoadingDots size="default" />
                <p className="text-xs mt-2">Default Dots</p>
              </div>
              <div>
                <LoadingDots size="lg" />
                <p className="text-xs mt-2">Large Dots</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton Loading */}
        <Card>
          <CardHeader>
            <CardTitle>Skeleton Loading</CardTitle>
            <CardDescription>Content placeholders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>

        {/* Page Loading */}
        <Card>
          <CardHeader>
            <CardTitle>Page Loading</CardTitle>
            <CardDescription>Full page loading states</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 relative border rounded">
              <PageLoading 
                variant="spinner" 
                size="default" 
                text="Loading page..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Loading Overlay */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Overlay</CardTitle>
            <CardDescription>Overlay on existing content</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingOverlay isLoading={overlayLoading} loadingText="Processing...">
              <div className="p-4 bg-gray-50 rounded">
                <p>This is some content that can be overlaid with a loading state.</p>
                <Button onClick={handleOverlayClick} className="mt-2">
                  Trigger Overlay
                </Button>
              </div>
            </LoadingOverlay>
          </CardContent>
        </Card>

      </div>

      {/* Progress Bar Demo Button */}
      <div className="text-center">
        <Button onClick={handleProgressClick}>
          Test Progress Bar (Top of Page)
        </Button>
      </div>

      {/* CSS Animation Demos */}
      <Card>
        <CardHeader>
          <CardTitle>CSS Animation Examples</CardTitle>
          <CardDescription>Custom CSS animations included in globals.css</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-100 rounded animate-fade-in">
              <p className="text-sm">Fade In Animation</p>
            </div>
            <div className="p-4 bg-blue-100 rounded animate-slide-in">
              <p className="text-sm">Slide In Animation</p>
            </div>
            <div className="p-4 bg-green-100 rounded animate-pulse-subtle">
              <p className="text-sm">Subtle Pulse</p>
            </div>
            <div className="p-4 bg-purple-100 rounded loading-shimmer">
              <p className="text-sm">Shimmer Effect</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoadingDemo
