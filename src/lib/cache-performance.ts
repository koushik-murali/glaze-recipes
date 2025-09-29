/**
 * Cache performance monitoring and analytics
 */

interface CachePerformanceMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  averageResponseTime: number;
  cacheSize: number;
  lastUpdated: number;
}

interface CacheTiming {
  startTime: number;
  endTime?: number;
  fromCache: boolean;
  dataType: string;
}

class CachePerformanceMonitor {
  private static instance: CachePerformanceMonitor;
  private metrics: Map<string, CachePerformanceMetrics> = new Map();
  private timings: CacheTiming[] = [];

  static getInstance(): CachePerformanceMonitor {
    if (!CachePerformanceMonitor.instance) {
      CachePerformanceMonitor.instance = new CachePerformanceMonitor();
    }
    return CachePerformanceMonitor.instance;
  }

  /**
   * Start timing a cache operation
   */
  startTiming(dataType: string): string {
    const timingId = `${dataType}_${Date.now()}_${Math.random()}`;
    this.timings.push({
      startTime: performance.now(),
      fromCache: false,
      dataType
    });
    return timingId;
  }

  /**
   * End timing and record metrics
   */
  endTiming(timingId: string, fromCache: boolean, dataType: string): void {
    const timing = this.timings.find(t => 
      t.dataType === dataType && 
      !t.endTime && 
      Math.abs(t.startTime - performance.now()) < 10000 // Within 10 seconds
    );
    
    if (timing) {
      timing.endTime = performance.now();
      timing.fromCache = fromCache;
      
      const responseTime = timing.endTime - timing.startTime;
      this.recordMetric(dataType, fromCache, responseTime);
    }
  }

  /**
   * Record a cache metric
   */
  private recordMetric(dataType: string, fromCache: boolean, responseTime: number): void {
    const existing = this.metrics.get(dataType) || {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      cacheSize: 0,
      lastUpdated: Date.now()
    };

    if (fromCache) {
      existing.hits++;
    } else {
      existing.misses++;
    }

    existing.totalRequests++;
    existing.averageResponseTime = 
      (existing.averageResponseTime * (existing.totalRequests - 1) + responseTime) / existing.totalRequests;
    existing.lastUpdated = Date.now();

    this.metrics.set(dataType, existing);
  }

  /**
   * Get performance metrics for a specific data type
   */
  getMetrics(dataType: string): CachePerformanceMetrics | null {
    return this.metrics.get(dataType) || null;
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): Map<string, CachePerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get cache hit rate for a data type
   */
  getHitRate(dataType: string): number {
    const metrics = this.metrics.get(dataType);
    if (!metrics || metrics.totalRequests === 0) return 0;
    return (metrics.hits / metrics.totalRequests) * 100;
  }

  /**
   * Get overall cache performance summary
   */
  getPerformanceSummary(): {
    totalRequests: number;
    totalHits: number;
    totalMisses: number;
    overallHitRate: number;
    averageResponseTime: number;
    dataTypes: string[];
  } {
    let totalRequests = 0;
    let totalHits = 0;
    let totalMisses = 0;
    let totalResponseTime = 0;
    const dataTypes: string[] = [];

    this.metrics.forEach((metrics, dataType) => {
      totalRequests += metrics.totalRequests;
      totalHits += metrics.hits;
      totalMisses += metrics.misses;
      totalResponseTime += metrics.averageResponseTime * metrics.totalRequests;
      dataTypes.push(dataType);
    });

    return {
      totalRequests,
      totalHits,
      totalMisses,
      overallHitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      dataTypes
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.timings = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    const summary = this.getPerformanceSummary();
    const detailedMetrics = Object.fromEntries(this.metrics);
    
    return JSON.stringify({
      summary,
      detailedMetrics,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Log performance metrics to console
   */
  logPerformance(): void {
    const summary = this.getPerformanceSummary();
    
    console.group('🚀 Cache Performance Metrics');
    console.log(`📊 Total Requests: ${summary.totalRequests}`);
    console.log(`✅ Cache Hits: ${summary.totalHits}`);
    console.log(`❌ Cache Misses: ${summary.totalMisses}`);
    console.log(`📈 Hit Rate: ${summary.overallHitRate.toFixed(2)}%`);
    console.log(`⏱️ Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`);
    
    console.group('📋 By Data Type');
    this.metrics.forEach((metrics, dataType) => {
      const hitRate = this.getHitRate(dataType);
      console.log(`${dataType}: ${hitRate.toFixed(2)}% hit rate, ${metrics.averageResponseTime.toFixed(2)}ms avg`);
    });
    console.groupEnd();
    
    console.groupEnd();
  }
}

// Export singleton instance
export const cachePerformance = CachePerformanceMonitor.getInstance();

/**
 * Higher-order function to wrap cache operations with performance monitoring
 */
export function withPerformanceMonitoring<T>(
  dataType: string,
  operation: () => Promise<{ data: T; fromCache: boolean; timestamp: number }>
): Promise<{ data: T; fromCache: boolean; timestamp: number }> {
  const timingId = cachePerformance.startTiming(dataType);
  
  return operation().then(result => {
    cachePerformance.endTiming(timingId, result.fromCache, dataType);
    return result;
  }).catch(error => {
    cachePerformance.endTiming(timingId, false, dataType);
    throw error;
  });
}

/**
 * React hook for cache performance monitoring
 */
export function useCachePerformance() {
  const getMetrics = (dataType?: string) => {
    if (dataType) {
      return cachePerformance.getMetrics(dataType);
    }
    return cachePerformance.getAllMetrics();
  };

  const getHitRate = (dataType: string) => {
    return cachePerformance.getHitRate(dataType);
  };

  const getSummary = () => {
    return cachePerformance.getPerformanceSummary();
  };

  const logPerformance = () => {
    cachePerformance.logPerformance();
  };

  const clearMetrics = () => {
    cachePerformance.clearMetrics();
  };

  const exportMetrics = () => {
    return cachePerformance.exportMetrics();
  };

  return {
    getMetrics,
    getHitRate,
    getSummary,
    logPerformance,
    clearMetrics,
    exportMetrics
  };
}
