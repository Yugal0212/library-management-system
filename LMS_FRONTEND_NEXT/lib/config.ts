// Dynamic API base URL that works with network access
function getApiBaseUrl(): string {
  // Use environment variable if provided (REQUIRED for production)
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
  }
  
  // For client-side
  if (typeof window !== 'undefined') {
    // In production, use environment variable or fail clearly
    if (process.env.NODE_ENV === 'production') {
      console.warn('NEXT_PUBLIC_API_BASE_URL not set in production!')
      // Fallback to same domain (assumes backend is on different port or subdomain)
      return `${window.location.origin}/api`
    }
    
    // Development: use localhost with port 8000
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    return `${protocol}//${hostname}:8000/api`
  }
  
  // For server-side rendering, fallback to localhost
  return "http://localhost:8000/api"
}

export const API_BASE = getApiBaseUrl()
