// Dynamic API base URL that works with network access
function getApiBaseUrl(): string {
  // Use environment variable if provided
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
  }
  
  // For client-side, use the same host as the current window
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    return `${protocol}//${hostname}:8000/api`
  }
  
  // For server-side rendering, fallback to localhost
  return "http://localhost:8000/api"
}

export const API_BASE = getApiBaseUrl()
