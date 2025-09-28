import { supabase } from './supabase';
import { GlazeRecipe, CreateGlazeData, Composition } from '@/types/glaze';
import { ClayBody, RawMaterial } from '@/types/settings';

// Glaze Recipes
export async function saveGlazeRecipe(glazeData: CreateGlazeData, userId: string): Promise<GlazeRecipe> {
  const { data, error } = await supabase
    .from('glaze_recipes')
    .insert({
      user_id: userId,
      name: glazeData.name,
      color: glazeData.color,
      finish: glazeData.finish,
      composition: glazeData.composition,
      date: glazeData.date,
      batch_number: glazeData.batchNumber || generateBatchNumber(),
      photos: glazeData.photos || null,
      clay_body_id: glazeData.clayBodyId,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    color: data.color,
    finish: data.finish as any,
    composition: data.composition.map((comp: any, index: number) => ({
      id: `${data.id}-${index}`,
      name: comp.name,
      percentage: comp.percentage,
    })),
    date: data.date,
    batchNumber: data.batch_number,
    photos: data.photos || [],
    clayBodyId: data.clay_body_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function getGlazeRecipes(userId: string): Promise<GlazeRecipe[]> {
  const { data, error } = await supabase
    .from('glaze_recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(recipe => ({
    id: recipe.id,
    name: recipe.name,
    color: recipe.color,
    finish: recipe.finish as any,
    composition: recipe.composition.map((comp: any, index: number) => ({
      id: `${recipe.id}-${index}`,
      name: comp.name,
      percentage: comp.percentage,
    })),
    date: recipe.date,
    batchNumber: recipe.batch_number,
    photos: recipe.photos || [],
    clayBodyId: recipe.clay_body_id,
    createdAt: new Date(recipe.created_at),
    updatedAt: new Date(recipe.updated_at),
  }));
}

export async function updateGlazeRecipe(id: string, updates: Partial<CreateGlazeData>, userId: string): Promise<GlazeRecipe | null> {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name) updateData.name = updates.name;
  if (updates.color) updateData.color = updates.color;
  if (updates.finish) updateData.finish = updates.finish;
  if (updates.composition) updateData.composition = updates.composition;
  if (updates.date) updateData.date = updates.date;
  if (updates.batchNumber) updateData.batch_number = updates.batchNumber;
  if (updates.photos) updateData.photos = updates.photos;
  if (updates.clayBodyId) updateData.clay_body_id = updates.clayBodyId;

  const { data, error } = await supabase
    .from('glaze_recipes')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    color: data.color,
    finish: data.finish as any,
    composition: data.composition.map((comp: any, index: number) => ({
      id: `${data.id}-${index}`,
      name: comp.name,
      percentage: comp.percentage,
    })),
    date: data.date,
    batchNumber: data.batch_number,
    photos: data.photos || [],
    clayBodyId: data.clay_body_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function deleteGlazeRecipe(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('glaze_recipes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

// Clay Bodies
export async function getClayBodies(userId: string): Promise<ClayBody[]> {
  const { data, error } = await supabase
    .from('clay_bodies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(clayBody => ({
    id: clayBody.id,
    name: clayBody.name,
    shrinkage: clayBody.shrinkage,
    color: clayBody.color,
    notes: clayBody.notes || '',
    createdAt: new Date(clayBody.created_at),
    updatedAt: new Date(clayBody.created_at),
  }));
}

export async function addClayBody(clayBody: Omit<ClayBody, 'id'>, userId: string): Promise<ClayBody> {
  const { data, error } = await supabase
    .from('clay_bodies')
    .insert({
      user_id: userId,
      name: clayBody.name,
      shrinkage: clayBody.shrinkage,
      color: clayBody.color,
      notes: clayBody.notes || null,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    shrinkage: data.shrinkage,
    color: data.color,
    notes: data.notes || '',
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.created_at),
  };
}

// Raw Materials
export async function getRawMaterials(userId: string): Promise<RawMaterial[]> {
  const { data, error } = await supabase
    .from('raw_materials')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(material => ({
    id: material.id,
    name: material.name,
    baseMaterialType: material.base_material_type,
    description: material.description || '',
    createdAt: new Date(material.created_at),
    updatedAt: new Date(material.created_at),
  }));
}

export async function addRawMaterial(material: Omit<RawMaterial, 'id'>, userId: string): Promise<RawMaterial> {
  const { data, error } = await supabase
    .from('raw_materials')
    .insert({
      user_id: userId,
      name: material.name,
      base_material_type: material.baseMaterialType,
      description: material.description || null,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    baseMaterialType: data.base_material_type,
    description: data.description || '',
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.created_at),
  };
}

// Utility function
function generateBatchNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `G${year}${month}${day}-${random}`;
}
