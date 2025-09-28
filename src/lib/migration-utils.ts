import { GlazeRecipe } from '@/types/glaze';
import { ClayBody, RawMaterial } from '@/types/settings';

// Migration utility to convert localStorage data to Supabase format
export function migrateLocalStorageToSupabase() {
  if (typeof window === 'undefined') return null;

  try {
    // Get existing data from localStorage
    const glazeRecipes = JSON.parse(localStorage.getItem('glaze-recipes') || '[]');
    const settings = JSON.parse(localStorage.getItem('glaze-settings') || '{}');
    
    return {
      glazeRecipes: glazeRecipes as GlazeRecipe[],
      clayBodies: settings.clayBodies || [],
      rawMaterials: settings.rawMaterials || [],
    };
  } catch (error) {
    console.error('Error migrating localStorage data:', error);
    return null;
  }
}

// Convert old glaze recipe format to new format
export function convertGlazeRecipe(recipe: any): GlazeRecipe {
  return {
    id: recipe.id,
    name: recipe.name,
    color: recipe.color,
    finish: recipe.finish,
    composition: recipe.composition.map((comp: any, index: number) => ({
      id: comp.id || `${recipe.id}-${index}`,
      name: comp.name,
      percentage: comp.percentage,
    })),
    date: recipe.date,
    batchNumber: recipe.batchNumber,
    photos: recipe.photos || [],
    clayBodyId: recipe.clayBodyId,
    createdAt: new Date(recipe.createdAt),
    updatedAt: new Date(recipe.updatedAt),
  };
}

// Clear localStorage after successful migration
export function clearLocalStorage() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('glaze-recipes');
  localStorage.removeItem('glaze-settings');
}
