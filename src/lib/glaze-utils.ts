import { GlazeRecipe, CreateGlazeData } from '@/types/glaze';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'glaze-recipes';

export function generateBatchNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `G${year}${month}${day}-${random}`;
}

export function saveGlazeRecipe(glazeData: CreateGlazeData): GlazeRecipe {
  const now = new Date();
  const glaze: GlazeRecipe = {
    id: uuidv4(),
    batchNumber: glazeData.batchNumber || generateBatchNumber(),
    composition: glazeData.composition.map(comp => ({
      id: uuidv4(),
      name: comp.name,
      percentage: comp.percentage
    })),
    createdAt: now,
    updatedAt: now,
    name: glazeData.name,
    color: glazeData.color,
    finish: glazeData.finish,
    date: glazeData.date,
    clayBodyId: glazeData.clayBodyId,
    photos: glazeData.photos
  };

  const existingRecipes = getGlazeRecipes();
  const updatedRecipes = [...existingRecipes, glaze];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecipes));
  
  return glaze;
}

export function getGlazeRecipes(): GlazeRecipe[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const recipes = JSON.parse(stored);
    return recipes.map((recipe: GlazeRecipe) => ({
      ...recipe,
      createdAt: new Date(recipe.createdAt),
      updatedAt: new Date(recipe.updatedAt)
    }));
  } catch (error) {
    console.error('Error loading glaze recipes:', error);
    return [];
  }
}

export function deleteGlazeRecipe(id: string): void {
  const recipes = getGlazeRecipes();
  const filtered = recipes.filter(recipe => recipe.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function updateGlazeRecipe(id: string, updates: Partial<CreateGlazeData>): GlazeRecipe | null {
  const recipes = getGlazeRecipes();
  const index = recipes.findIndex(recipe => recipe.id === id);
  
  if (index === -1) return null;
  
  const updatedRecipe = {
    ...recipes[index],
    ...updates,
    updatedAt: new Date(),
    composition: updates.composition ? 
      updates.composition.map(comp => ({ 
        id: uuidv4(),
        name: comp.name,
        percentage: comp.percentage
      })) :
      recipes[index].composition
  };
  
  recipes[index] = updatedRecipe;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  
  return updatedRecipe;
}
