/**
 * Simple cache testing utilities
 */

import { cacheManager } from './cache-utils';
import { cachePerformance } from './cache-performance';

export async function testCachePerformance() {
  console.log('🧪 Starting cache performance test...');
  
  const testUserId = 'test-user-123';
  const testData = { id: '1', name: 'Test Glaze', color: 'Blue' };
  
  // Clear any existing test data
  cacheManager.clear();
  cachePerformance.clearMetrics();
  
  // Test 1: Cache miss (first load)
  console.log('Test 1: Cache miss');
  const start1 = performance.now();
  cacheManager.set('test_glazes', [testData], testUserId);
  const cached1 = cacheManager.get('test_glazes', testUserId);
  const end1 = performance.now();
  
  console.log(`Cache miss time: ${(end1 - start1).toFixed(2)}ms`);
  console.log(`Data from cache: ${cached1?.fromCache}`);
  
  // Test 2: Cache hit (second load)
  console.log('Test 2: Cache hit');
  const start2 = performance.now();
  const cached2 = cacheManager.get('test_glazes', testUserId);
  const end2 = performance.now();
  
  console.log(`Cache hit time: ${(end2 - start2).toFixed(2)}ms`);
  console.log(`Data from cache: ${cached2?.fromCache}`);
  
  // Test 3: Cache invalidation
  console.log('Test 3: Cache invalidation');
  cacheManager.invalidate('test_glazes');
  const cached3 = cacheManager.get('test_glazes', testUserId);
  console.log(`After invalidation: ${cached3 ? 'Still cached' : 'Cache cleared'}`);
  
  // Test 4: Performance metrics
  console.log('Test 4: Performance metrics');
  cachePerformance.logPerformance();
  
  // Test 5: Cache size
  console.log('Test 5: Cache size');
  const cacheSize = cacheManager.getCacheSize();
  console.log(`Cache size: ${cacheSize} bytes`);
  
  console.log('✅ Cache performance test completed!');
}

export function runCacheTests() {
  if (typeof window !== 'undefined') {
    testCachePerformance();
  } else {
    console.log('Cache tests can only run in browser environment');
  }
}

// Auto-run tests in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run tests after a short delay to ensure everything is loaded
  setTimeout(() => {
    console.log('🚀 Running cache tests in development mode...');
    runCacheTests();
  }, 2000);
}
