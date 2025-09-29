import { supabase } from './supabase';
import { LiveFiringSession } from '@/types/firing';
import { getConeFromTemperature } from './firing-utils';

export interface ActiveFiringSession {
  id: string;
  user_id: string;
  kiln_name: string;
  firing_type: string;
  target_temperature: number;
  target_cone?: string;
  start_time: string;
  last_update: string;
  is_active: boolean;
  is_paused: boolean;
  current_temperature: number;
  notes?: string;
  interval_minutes: number;
  temperature_entries: any[];
  warning_flags: any[];
  created_at: string;
  updated_at: string;
}

/**
 * Save active firing session to Supabase
 */
export async function saveActiveSessionToSupabase(session: LiveFiringSession, userId: string): Promise<string | null> {
  try {
    const sessionData = {
      user_id: userId,
      kiln_name: session.kilnName,
      firing_type: session.firingType,
      target_temperature: session.targetTemperature,
      target_cone: getConeFromTemperature(session.targetTemperature),
      start_time: session.startTime.toISOString(),
      last_update: new Date().toISOString(),
      is_active: session.isActive,
      is_paused: !session.isActive,
      current_temperature: session.currentTemperature,
      notes: session.notes,
      interval_minutes: 30, // Default interval
      temperature_entries: session.intervals.map(interval => ({
        id: interval.id,
        timestamp: interval.timestamp.toISOString(),
        temperature: interval.temperature,
        notes: interval.notes,
        rampRate: interval.rampRate
      })),
      warning_flags: [] // No warnings in LiveFiringSession
    };

    // Try to update existing session first
    const { data: existingSession } = await supabase
      .from('active_firing_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    let result;
    if (existingSession) {
      // Update existing session
      result = await supabase
        .from('active_firing_sessions')
        .update(sessionData)
        .eq('id', existingSession.id)
        .select('id')
        .single();
    } else {
      // Create new session
      result = await supabase
        .from('active_firing_sessions')
        .insert(sessionData)
        .select('id')
        .single();
    }

    if (result.error) {
      console.error('Error saving active session to Supabase:', result.error);
      return null;
    }

    return result.data.id;
  } catch (error) {
    console.error('Error saving active session:', error);
    return null;
  }
}

/**
 * Load active firing session from Supabase
 */
export async function loadActiveSessionFromSupabase(userId: string): Promise<LiveFiringSession | null> {
  try {
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
    const session: LiveFiringSession = {
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

    return session;
  } catch (error) {
    console.error('Error loading active session:', error);
    return null;
  }
}

/**
 * Complete active firing session (mark as inactive)
 */
export async function completeActiveSession(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('active_firing_sessions')
      .update({ 
        is_active: false,
        last_update: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error completing active session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error completing active session:', error);
    return false;
  }
}

/**
 * Delete active firing session
 */
export async function deleteActiveSession(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('active_firing_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error deleting active session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting active session:', error);
    return false;
  }
}

/**
 * Sync localStorage with Supabase (hybrid approach)
 */
export async function syncActiveSessionWithSupabase(userId: string): Promise<LiveFiringSession | null> {
  try {
    // First try to load from localStorage
    const localSession = getActiveSessionFromLocalStorage();
    
    if (localSession) {
      // Save to Supabase and return local session for immediate use
      await saveActiveSessionToSupabase(localSession, userId);
      return localSession;
    }

    // If no local session, try to load from Supabase
    const supabaseSession = await loadActiveSessionFromSupabase(userId);
    
    if (supabaseSession) {
      // Save to localStorage for immediate access
      saveActiveSessionToLocalStorage(supabaseSession);
      return supabaseSession;
    }

    return null;
  } catch (error) {
    console.error('Error syncing active session:', error);
    // Fallback to localStorage only
    return getActiveSessionFromLocalStorage();
  }
}

/**
 * Get active session from localStorage
 */
export function getActiveSessionFromLocalStorage(): LiveFiringSession | null {
  try {
    const stored = localStorage.getItem('liveFiringSession');
    if (stored) {
      const session = JSON.parse(stored);
      // Parse dates back to Date objects
      session.startTime = new Date(session.startTime);
      session.lastUpdate = new Date(session.lastUpdate);
      session.intervals = session.intervals.map((interval: any) => ({
        ...interval,
        timestamp: new Date(interval.timestamp)
      }));
      return session;
    }
    return null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
}

/**
 * Save active session to localStorage
 */
export function saveActiveSessionToLocalStorage(session: LiveFiringSession): void {
  try {
    localStorage.setItem('liveFiringSession', JSON.stringify(session));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Clear active session from localStorage
 */
export function clearActiveSessionFromLocalStorage(): void {
  try {
    localStorage.removeItem('liveFiringSession');
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}
