"use client"

import dynamic from 'next/dynamic'
import { ReactNode, Suspense } from 'react'

interface NoSSRProps {
  children: ReactNode
  fallback?: ReactNode
}

function NoSSRComponent({ children, fallback }: NoSSRProps) {
  return (
    <Suspense fallback={fallback || null}>
      {children}
    </Suspense>
  )
}

// Export the component with SSR disabled
export const NoSSR = dynamic(() => Promise.resolve(NoSSRComponent), {
  ssr: false,
  loading: () => null
})

export default NoSSR
