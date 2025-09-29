import { 
  invalidateGlazeCache,
  invalidateFiringLogsCache,
  invalidateKilnsCache,
  invalidateClayBodiesCache,
  invalidateRawMaterialsCache,
  invalidateActiveSessionCache,
  invalidateAllCaches
} from './cache-utils';

/**
 * Cache invalidation strategies for different operations
 */
export class CacheInvalidationManager {
  private static instance: CacheInvalidationManager;
  
  static getInstance(): CacheInvalidationManager {
    if (!CacheInvalidationManager.instance) {
      CacheInvalidationManager.instance = new CacheInvalidationManager();
    }
    return CacheInvalidationManager.instance;
  }

  /**
   * Invalidate caches when glaze recipes are modified
   */
  onGlazeRecipeChange(): void {
    console.log('Invalidating glaze cache due to recipe change');
    invalidateGlazeCache();
  }

  /**
   * Invalidate caches when firing logs are modified
   */
  onFiringLogChange(): void {
    console.log('Invalidating firing logs cache due to log change');
    invalidateFiringLogsCache();
  }

  /**
   * Invalidate caches when kilns are modified
   */
  onKilnChange(): void {
    console.log('Invalidating kilns cache due to kiln change');
    invalidateKilnsCache();
  }

  /**
   * Invalidate caches when clay bodies are modified
   */
  onClayBodyChange(): void {
    console.log('Invalidating clay bodies cache due to clay body change');
    invalidateClayBodiesCache();
  }

  /**
   * Invalidate caches when raw materials are modified
   */
  onRawMaterialChange(): void {
    console.log('Invalidating raw materials cache due to material change');
    invalidateRawMaterialsCache();
  }

  /**
   * Invalidate caches when active session changes
   */
  onActiveSessionChange(): void {
    console.log('Invalidating active session cache due to session change');
    invalidateActiveSessionCache();
  }

  /**
   * Invalidate all caches for a user (useful for logout or major changes)
   */
  onUserDataChange(userId: string): void {
    console.log('Invalidating all caches for user:', userId);
    invalidateAllCaches(userId);
  }

  /**
   * Invalidate caches when settings are modified
   */
  onSettingsChange(): void {
    console.log('Invalidating settings-related caches');
    // Settings changes might affect multiple data types
    invalidateClayBodiesCache();
    invalidateRawMaterialsCache();
    invalidateKilnsCache();
  }

  /**
   * Invalidate caches when data is imported/exported
   */
  onDataImportExport(): void {
    console.log('Invalidating all caches due to data import/export');
    // Import/export might affect all data
    invalidateGlazeCache();
    invalidateFiringLogsCache();
    invalidateClayBodiesCache();
    invalidateRawMaterialsCache();
    invalidateKilnsCache();
  }
}

// Export singleton instance
export const cacheInvalidation = CacheInvalidationManager.getInstance();

/**
 * Hook for automatic cache invalidation
 */
export function useCacheInvalidation() {
  return {
    onGlazeRecipeChange: () => cacheInvalidation.onGlazeRecipeChange(),
    onFiringLogChange: () => cacheInvalidation.onFiringLogChange(),
    onKilnChange: () => cacheInvalidation.onKilnChange(),
    onClayBodyChange: () => cacheInvalidation.onClayBodyChange(),
    onRawMaterialChange: () => cacheInvalidation.onRawMaterialChange(),
    onActiveSessionChange: () => cacheInvalidation.onActiveSessionChange(),
    onUserDataChange: (userId: string) => cacheInvalidation.onUserDataChange(userId),
    onSettingsChange: () => cacheInvalidation.onSettingsChange(),
    onDataImportExport: () => cacheInvalidation.onDataImportExport(),
  };
}

/**
 * Automatic cache invalidation for common operations
 */
export const autoInvalidate = {
  // Glaze operations
  glazeCreated: () => cacheInvalidation.onGlazeRecipeChange(),
  glazeUpdated: () => cacheInvalidation.onGlazeRecipeChange(),
  glazeDeleted: () => cacheInvalidation.onGlazeRecipeChange(),
  
  // Firing log operations
  firingLogCreated: () => cacheInvalidation.onFiringLogChange(),
  firingLogUpdated: () => cacheInvalidation.onFiringLogChange(),
  firingLogDeleted: () => cacheInvalidation.onFiringLogChange(),
  
  // Clay body operations
  clayBodyCreated: () => cacheInvalidation.onClayBodyChange(),
  clayBodyUpdated: () => cacheInvalidation.onClayBodyChange(),
  clayBodyDeleted: () => cacheInvalidation.onClayBodyChange(),
  
  // Raw material operations
  rawMaterialCreated: () => cacheInvalidation.onRawMaterialChange(),
  rawMaterialUpdated: () => cacheInvalidation.onRawMaterialChange(),
  rawMaterialDeleted: () => cacheInvalidation.onRawMaterialChange(),
  
  // Kiln operations
  kilnCreated: () => cacheInvalidation.onKilnChange(),
  kilnUpdated: () => cacheInvalidation.onKilnChange(),
  kilnDeleted: () => cacheInvalidation.onKilnChange(),
  
  // Active session operations
  sessionStarted: () => cacheInvalidation.onActiveSessionChange(),
  sessionUpdated: () => cacheInvalidation.onActiveSessionChange(),
  sessionCompleted: () => cacheInvalidation.onActiveSessionChange(),
  
  // Settings operations
  settingsUpdated: () => cacheInvalidation.onSettingsChange(),
  
  // Data operations
  dataImported: () => cacheInvalidation.onDataImportExport(),
  dataExported: () => cacheInvalidation.onDataImportExport(),
};
