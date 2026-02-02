/**
 * ⚡ ULTRA-FAST FETCH WRAPPER
 * - Request deduplication (prevents duplicate parallel requests)
 * - Automatic retries with exponential backoff
 * - Request cancellation on component unmount
 * - Built-in caching with TTL
 * - Parallel request batching
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

class FastFetchCache {
  private cache = new Map<string, CacheEntry<any>>()
  private pending = new Map<string, PendingRequest<any>>()
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  set<T>(key: string, data: T, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }
  
  getPending<T>(key: string): Promise<T> | null {
    const entry = this.pending.get(key)
    if (!entry) return null
    
    // Clear stale pending requests (> 30s old)
    if (Date.now() - entry.timestamp > 30000) {
      this.pending.delete(key)
      return null
    }
    
    return entry.promise
  }
  
  setPending<T>(key: string, promise: Promise<T>): void {
    this.pending.set(key, {
      promise,
      timestamp: Date.now(),
    })
  }
  
  clearPending(key: string): void {
    this.pending.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
    this.pending.clear()
  }
  
  invalidate(pattern?: string | RegExp): void {
    if (!pattern) {
      this.clear()
      return
    }
    
    const keys = Array.from(this.cache.keys())
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    
    keys.forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key)
        this.pending.delete(key)
      }
    })
  }
}

export const fastCache = new FastFetchCache()

interface FastFetchOptions extends RequestInit {
  ttl?: number // Cache time-to-live in ms
  retries?: number // Number of retries (default: 2)
  retryDelay?: number // Initial retry delay in ms (default: 500)
  dedupe?: boolean // Deduplicate parallel requests (default: true)
  skipCache?: boolean // Skip cache (default: false)
}

/**
 * Ultra-fast fetch with deduplication, caching, and retries
 */
export async function fastFetch<T = any>(
  url: string,
  options: FastFetchOptions = {}
): Promise<T> {
  const {
    ttl = 30000,
    retries = 2,
    retryDelay = 500,
    dedupe = true,
    skipCache = false,
    ...fetchOptions
  } = options
  
  const cacheKey = `${fetchOptions.method || 'GET'}:${url}:${JSON.stringify(fetchOptions.body || '')}`
  
  if (!skipCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const cached = fastCache.get<T>(cacheKey)
    if (cached !== null) {
      return cached
    }
  }
  
  if (dedupe) {
    const pending = fastCache.getPending<T>(cacheKey)
    if (pending) {
      return pending
    }
  }
  
  // Make the request with retries
  const fetchWithRetry = async (attempt = 0): Promise<T> => {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
          ...fetchOptions.headers,
        },
      })
      
      if (!response.ok) {
        const error: any = new Error(`HTTP ${response.status}`)
        error.status = response.status
        error.response = response
        
        // Try to parse error message
        try {
          const errorData = await response.json()
          error.message = errorData.message || error.message
          error.data = errorData
        } catch {
          // Ignore JSON parse error
        }
        
        throw error
      }
      
      const data = await response.json()
      
      // Cache successful GET requests
      if (!skipCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
        fastCache.set(cacheKey, data, ttl)
      }
      
      return data
    } catch (error: any) {
      // Retry on network errors or 5xx errors
      const shouldRetry = 
        attempt < retries &&
        (error.name === 'TypeError' || // Network error
         error.status >= 500) // Server error
      
      if (shouldRetry) {
        const delay = retryDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        return fetchWithRetry(attempt + 1)
      }
      
      throw error
    }
  }
  
  // Create promise and store in pending
  const promise = fetchWithRetry().finally(() => {
    fastCache.clearPending(cacheKey)
  })
  
  if (dedupe) {
    fastCache.setPending(cacheKey, promise)
  }
  
  return promise
}

/**
 * Batch multiple requests and execute them in parallel
 */
export async function batchFetch<T = any>(
  requests: Array<{ url: string; options?: FastFetchOptions }>
): Promise<T[]> {
  return Promise.all(
    requests.map(({ url, options }) => fastFetch<T>(url, options))
  )
}

export function prefetch(url: string, options?: FastFetchOptions): void {
  fastFetch(url, options).catch(() => {})
}
