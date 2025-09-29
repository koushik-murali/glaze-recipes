export interface TemperatureEntry {
  id: string;
  time: string;
  temperature: number;
  notes?: string;
  atmosphere?: 'oxidation' | 'reduction';
}

export interface FiringInterval {
  id: string;
  timestamp: Date;
  temperature: number;
  notes?: string;
  atmosphere?: 'oxidation' | 'reduction';
  rampRate?: number;
}

export interface LiveFiringSession {
  id: string;
  kilnId: string;
  kilnName: string;
  firingType: string;
  title?: string;
  startTime: Date;
  isActive: boolean;
  currentTemperature: number;
  targetTemperature: number;
  notes: string;
  intervals: FiringInterval[];
}

export interface FiringLog {
  id: string;
  user_id: string;
  kiln_name: string;
  title?: string; // User-defined title (defaults to cone value + date)
  date: string; // ISO date string
  notes?: string;
  firing_type: 'bisque' | 'glaze' | 'raku' | 'wood' | 'soda' | 'other';
  target_temperature: number;
  actual_temperature: number;
  firing_duration_hours: number;
  ramp_rate: number; // degrees per hour
  warning_flags: FiringWarning[];
  temperature_entries?: TemperatureEntry[];
  share_token?: string;
  created_at: string;
  updated_at: string;
}

export interface FiringWarning {
  type: 'high_ramp_rate' | 'temperature_exceeded' | 'duration_exceeded';
  message: string;
  severity: 'warning' | 'critical';
  triggered_at: number; // timestamp
}

export interface Kiln {
  id: string;
  user_id: string;
  name: string;
  max_temperature: number;
  type: 'electric' | 'gas' | 'wood' | 'raku' | 'other';
  notes?: string;
  created_at: string;
} 