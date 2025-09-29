import { supabase } from './supabase';
import { GlazeRecipe, CreateGlazeData, Composition } from '@/types/glaze';
import { ClayBody, RawMaterial } from '@/types/settings';
import { FiringLog } from '@/types/firing';
import {
  getCachedGlazeRecipes,
  setCachedGlazeRecipes,
  invalidateGlazeCache,
  getCachedFiringLogs,
  setCachedFiringLogs,
  invalidateFiringLogsCache,
  getCachedKilns,
  setCachedKilns,
  invalidateKilnsCache,
  getCachedClayBodies,
  setCachedClayBodies,
  invalidateClayBodiesCache,
  getCachedRawMaterials,
  setCachedRawMaterials,
  invalidateRawMaterialsCache,
  getCachedActiveSession,
  setCachedActiveSession,
  invalidateActiveSessionCache,
  fetchWithCache
} from './cache-utils';
import { autoInvalidate } from './cache-invalidation';

// Glaze Recipes with caching
export async function getGlazeRecipesCached(userId: string): Promise<GlazeRecipe[]> {
  const result = await fetchWithCache(
    'glazes',
    userId,
    async () => {
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
    },
    setCachedGlazeRecipes,
    getCachedGlazeRecipes
  );

  return result.data;
}

export async function saveGlazeRecipeCached(glazeData: CreateGlazeData, userId: string): Promise<GlazeRecipe> {
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

  const newGlaze = {
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

  // Invalidate cache to force refresh
  autoInvalidate.glazeCreated();
  
  return newGlaze;
}

export async function updateGlazeRecipeCached(id: string, updates: Partial<CreateGlazeData>, userId: string): Promise<GlazeRecipe | null> {
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

  const updatedGlaze = {
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

  // Invalidate cache to force refresh
  autoInvalidate.glazeUpdated();
  
  return updatedGlaze;
}

export async function deleteGlazeRecipeCached(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('glaze_recipes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;

  // Invalidate cache to force refresh
  autoInvalidate.glazeDeleted();
}

// Firing Logs with caching
export async function getFiringLogsCached(userId: string): Promise<FiringLog[]> {
  const result = await fetchWithCache(
    'firing_logs',
    userId,
    async () => {
      const { data, error } = await supabase
        .from('firing_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    setCachedFiringLogs,
    getCachedFiringLogs
  );

  return result.data;
}

export async function getKilnsCached(userId: string): Promise<any[]> {
  const result = await fetchWithCache(
    'kilns',
    userId,
    async () => {
      const { data, error } = await supabase
        .from('kilns')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    setCachedKilns,
    getCachedKilns
  );

  return result.data;
}

// Clay Bodies with caching
export async function getClayBodiesCached(userId: string): Promise<ClayBody[]> {
  const result = await fetchWithCache(
    'clay_bodies',
    userId,
    async () => {
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
    },
    setCachedClayBodies,
    getCachedClayBodies
  );

  return result.data;
}

export async function addClayBodyCached(clayBody: Omit<ClayBody, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<ClayBody> {
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

  const newClayBody = {
    id: data.id,
    name: data.name,
    shrinkage: data.shrinkage,
    color: data.color,
    notes: data.notes || '',
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.created_at),
  };

  // Invalidate cache to force refresh
  autoInvalidate.clayBodyCreated();
  
  return newClayBody;
}

export async function deleteClayBodyCached(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('clay_bodies')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;

  // Invalidate cache to force refresh
  autoInvalidate.clayBodyDeleted();
}

// Raw Materials with caching
export async function getRawMaterialsCached(userId: string): Promise<RawMaterial[]> {
  const result = await fetchWithCache(
    'raw_materials',
    userId,
    async () => {
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
    },
    setCachedRawMaterials,
    getCachedRawMaterials
  );

  return result.data;
}

export async function addRawMaterialCached(material: Omit<RawMaterial, 'id'>, userId: string): Promise<RawMaterial> {
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

  const newMaterial = {
    id: data.id,
    name: data.name,
    baseMaterialType: data.base_material_type,
    description: data.description || '',
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.created_at),
  };

  // Invalidate cache to force refresh
  autoInvalidate.rawMaterialCreated();
  
  return newMaterial;
}

export async function deleteRawMaterialCached(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('raw_materials')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;

  // Invalidate cache to force refresh
  autoInvalidate.rawMaterialDeleted();
}

// Active Session with caching
export async function getActiveSessionCached(userId: string): Promise<any | null> {
  const result = await fetchWithCache(
    'active_session',
    userId,
    async () => {
      const { data, error } = await supabase
        .from('active_firing_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      // Convert Supabase data back to LiveFiringSession format
      return {
        id: data.id,
        kilnId: data.kiln_id || '',
        kilnName: data.kiln_name,
        firingType: data.firing_type,
        targetTemperature: data.target_temperature,
        startTime: new Date(data.start_time),
        isActive: data.is_active,
        currentTemperature: data.current_temperature,
        notes: data.notes,
        intervals: data.temperature_entries.map((entry: any) => ({
          id: entry.id,
          timestamp: new Date(entry.timestamp),
          temperature: entry.temperature,
          notes: entry.notes,
          rampRate: entry.rampRate
        }))
      };
    },
    setCachedActiveSession,
    getCachedActiveSession
  );

  return result.data;
}

export async function saveActiveSessionCached(session: any, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('active_firing_sessions')
    .upsert({
      id: session.id,
      user_id: userId,
      kiln_id: session.kilnId,
      kiln_name: session.kilnName,
      firing_type: session.firingType,
      target_temperature: session.targetTemperature,
      start_time: session.startTime.toISOString(),
      is_active: session.isActive,
      current_temperature: session.currentTemperature,
      notes: session.notes,
      temperature_entries: session.intervals.map((interval: any) => ({
        id: interval.id,
        timestamp: interval.timestamp.toISOString(),
        temperature: interval.temperature,
        notes: interval.notes,
        rampRate: interval.rampRate
      }))
    })
    .select()
    .single();

  if (error) throw error;

  // Invalidate cache to force refresh
  autoInvalidate.sessionUpdated();
  
  return data?.id || null;
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

// Export cache invalidation functions for use in components
export {
  invalidateGlazeCache,
  invalidateFiringLogsCache,
  invalidateKilnsCache,
  invalidateClayBodiesCache,
  invalidateRawMaterialsCache,
  invalidateActiveSessionCache
};
