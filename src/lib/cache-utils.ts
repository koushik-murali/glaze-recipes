import { GlazeRecipe } from '@/types/glaze';
import { FiringLog } from '@/types/firing';
import { ClayBody, RawMaterial } from '@/types/settings';
import { withPerformanceMonitoring } from './cache-performance';

// Cache configuration
const CACHE_KEYS = {
  GLAZES: 'glaze_recipes_cache',
  FIRING_LOGS: 'firing_logs_cache',
  KILNS: 'kilns_cache',
  CLAY_BODIES: 'clay_bodies_cache',
  RAW_MATERIALS: 'raw_materials_cache',
  ACTIVE_SESSION: 'active_session_cache',
  CACHE_METADATA: 'cache_metadata'
} as const;

const CACHE_DURATION = {
  GLAZES: 5 * 60 * 1000, // 5 minutes
  FIRING_LOGS: 2 * 60 * 1000, // 2 minutes
  KILNS: 10 * 60 * 1000, // 10 minutes
  CLAY_BODIES: 10 * 60 * 1000, // 10 minutes
  RAW_MATERIALS: 10 * 60 * 1000, // 10 minutes
  ACTIVE_SESSION: 30 * 1000, // 30 seconds
} as const;

interface CacheMetadata {
  [key: string]: {
    timestamp: number;
    userId: string;
    version: number;
  };
}

interface CacheResult<T> {
  data: T;
  fromCache: boolean;
  timestamp: number;
}

/**
 * Generic cache utility functions
 */
class CacheManager {
  private static instance: CacheManager;
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private getCacheMetadata(): CacheMetadata {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(CACHE_KEYS.CACHE_METADATA);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading cache metadata:', error);
      return {};
    }
  }

  private setCacheMetadata(metadata: CacheMetadata): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CACHE_KEYS.CACHE_METADATA, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error saving cache metadata:', error);
    }
  }

  private isCacheValid(key: string, userId: string): boolean {
    const metadata = this.getCacheMetadata();
    const cacheInfo = metadata[key];
    
    if (!cacheInfo || cacheInfo.userId !== userId) {
      return false;
    }

    const duration = CACHE_DURATION[key as keyof typeof CACHE_DURATION] || 5 * 60 * 1000;
    return Date.now() - cacheInfo.timestamp < duration;
  }

  private updateCacheMetadata(key: string, userId: string): void {
    const metadata = this.getCacheMetadata();
    metadata[key] = {
      timestamp: Date.now(),
      userId,
      version: (metadata[key]?.version || 0) + 1
    };
    this.setCacheMetadata(metadata);
  }

  set<T>(key: string, data: T, userId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
      this.updateCacheMetadata(key, userId);
    } catch (error) {
      console.error(`Error caching ${key}:`, error);
    }
  }

  get<T>(key: string, userId: string): CacheResult<T> | null {
    if (typeof window === 'undefined') return null;
    
    try {
      if (!this.isCacheValid(key, userId)) {
        return null;
      }

      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const data = JSON.parse(stored);
      const metadata = this.getCacheMetadata();
      
      return {
        data,
        fromCache: true,
        timestamp: metadata[key]?.timestamp || 0
      };
    } catch (error) {
      console.error(`Error loading cache ${key}:`, error);
      return null;
    }
  }

  invalidate(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
      const metadata = this.getCacheMetadata();
      delete metadata[key];
      this.setCacheMetadata(metadata);
    } catch (error) {
      console.error(`Error invalidating cache ${key}:`, error);
    }
  }

  invalidateAll(userId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      Object.values(CACHE_KEYS).forEach(key => {
        if (key !== CACHE_KEYS.CACHE_METADATA) {
          localStorage.removeItem(key);
        }
      });
      
      const metadata = this.getCacheMetadata();
      Object.keys(metadata).forEach(key => {
        if (metadata[key].userId === userId) {
          delete metadata[key];
        }
      });
      this.setCacheMetadata(metadata);
    } catch (error) {
      console.error('Error invalidating all caches:', error);
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    
    try {
      Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  getCacheSize(): number {
    if (typeof window === 'undefined') return 0;
    
    let totalSize = 0;
    Object.values(CACHE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length;
      }
    });
    return totalSize;
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

/**
 * Glaze Recipes Cache
 */
export async function getCachedGlazeRecipes(userId: string): Promise<CacheResult<GlazeRecipe[]> | null> {
  return cacheManager.get<GlazeRecipe[]>(CACHE_KEYS.GLAZES, userId);
}

export function setCachedGlazeRecipes(glazes: GlazeRecipe[], userId: string): void {
  cacheManager.set(CACHE_KEYS.GLAZES, glazes, userId);
}

export function invalidateGlazeCache(): void {
  cacheManager.invalidate(CACHE_KEYS.GLAZES);
}

/**
 * Firing Logs Cache
 */
export async function getCachedFiringLogs(userId: string): Promise<CacheResult<FiringLog[]> | null> {
  return cacheManager.get<FiringLog[]>(CACHE_KEYS.FIRING_LOGS, userId);
}

export function setCachedFiringLogs(firingLogs: FiringLog[], userId: string): void {
  cacheManager.set(CACHE_KEYS.FIRING_LOGS, firingLogs, userId);
}

export function invalidateFiringLogsCache(): void {
  cacheManager.invalidate(CACHE_KEYS.FIRING_LOGS);
}

/**
 * Kilns Cache
 */
export async function getCachedKilns(userId: string): Promise<CacheResult<any[]> | null> {
  return cacheManager.get<any[]>(CACHE_KEYS.KILNS, userId);
}

export function setCachedKilns(kilns: any[], userId: string): void {
  cacheManager.set(CACHE_KEYS.KILNS, kilns, userId);
}

export function invalidateKilnsCache(): void {
  cacheManager.invalidate(CACHE_KEYS.KILNS);
}

/**
 * Clay Bodies Cache
 */
export async function getCachedClayBodies(userId: string): Promise<CacheResult<ClayBody[]> | null> {
  return cacheManager.get<ClayBody[]>(CACHE_KEYS.CLAY_BODIES, userId);
}

export function setCachedClayBodies(clayBodies: ClayBody[], userId: string): void {
  cacheManager.set(CACHE_KEYS.CLAY_BODIES, clayBodies, userId);
}

export function invalidateClayBodiesCache(): void {
  cacheManager.invalidate(CACHE_KEYS.CLAY_BODIES);
}

/**
 * Raw Materials Cache
 */
export async function getCachedRawMaterials(userId: string): Promise<CacheResult<RawMaterial[]> | null> {
  return cacheManager.get<RawMaterial[]>(CACHE_KEYS.RAW_MATERIALS, userId);
}

export function setCachedRawMaterials(rawMaterials: RawMaterial[], userId: string): void {
  cacheManager.set(CACHE_KEYS.RAW_MATERIALS, rawMaterials, userId);
}

export function invalidateRawMaterialsCache(): void {
  cacheManager.invalidate(CACHE_KEYS.RAW_MATERIALS);
}

/**
 * Active Session Cache
 */
export async function getCachedActiveSession(userId: string): Promise<CacheResult<any> | null> {
  return cacheManager.get<any>(CACHE_KEYS.ACTIVE_SESSION, userId);
}

export function setCachedActiveSession(session: any, userId: string): void {
  cacheManager.set(CACHE_KEYS.ACTIVE_SESSION, session, userId);
}

export function invalidateActiveSessionCache(): void {
  cacheManager.invalidate(CACHE_KEYS.ACTIVE_SESSION);
}

/**
 * Utility functions
 */
export function invalidateAllCaches(userId: string): void {
  cacheManager.invalidateAll(userId);
}

export function clearAllCaches(): void {
  cacheManager.clear();
}

export function getCacheInfo(): { size: number; metadata: CacheMetadata } {
  return {
    size: cacheManager.getCacheSize(),
    metadata: cacheManager['getCacheMetadata']()
  };
}

/**
 * Cache-first data fetching with fallback to Supabase
 */
export async function fetchWithCache<T>(
  cacheKey: string,
  userId: string,
  fetchFunction: () => Promise<T>,
  setCacheFunction: (data: T, userId: string) => void,
  getCacheFunction: (userId: string) => Promise<CacheResult<T> | null>
): Promise<CacheResult<T>> {
  return withPerformanceMonitoring(cacheKey, async () => {
    // Try to get from cache first
    const cached = await getCacheFunction(userId);
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    // Cache miss, fetch from Supabase
    console.log(`Cache miss for ${cacheKey}, fetching from Supabase`);
    try {
      const data = await fetchFunction();
      setCacheFunction(data, userId);
      
      return {
        data,
        fromCache: false,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`Error fetching ${cacheKey}:`, error);
      throw error;
    }
  });
}
