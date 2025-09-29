'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Thermometer, 
  AlertTriangle, 
  Save,
  Timer,
  Zap,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateUUID } from '@/lib/uuid-utils';

interface LiveFiringSession {
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

interface FiringInterval {
  id: string;
  timestamp: Date;
  temperature: number;
  notes?: string;
  atmosphere?: 'oxidation' | 'reduction';
  rampRate?: number;
}

interface LiveFiringTrackerProps {
  userId: string;
  kilns: any[];
  onSessionComplete?: (session: LiveFiringSession) => void;
}

export default function LiveFiringTracker({ userId, kilns, onSessionComplete }: LiveFiringTrackerProps) {
  const [session, setSession] = useState<LiveFiringSession | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentTemp, setCurrentTemp] = useState('');
  const [targetTemp, setTargetTemp] = useState('06');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  const [tempAtmosphere, setTempAtmosphere] = useState<'oxidation' | 'reduction'>('oxidation');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editTempValue, setEditTempValue] = useState('');
  const [editNotesValue, setEditNotesValue] = useState('');
  const [editAtmosphereValue, setEditAtmosphereValue] = useState<'oxidation' | 'reduction'>('oxidation');
  const [firingType, setFiringType] = useState('bisque');
  const [notes, setNotes] = useState('');
  const [selectedKilnId, setSelectedKilnId] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const firingTypes = [
    { value: 'bisque', label: 'Bisque Firing' },
    { value: 'glaze', label: 'Glaze Firing' },
    { value: 'raku', label: 'Raku Firing' },
    { value: 'wood', label: 'Wood Firing' },
    { value: 'soda', label: 'Soda Firing' },
    { value: 'other', label: 'Other' },
  ];

  // Pottery cone data (Official Orton cone chart - accurate temperatures)
  const potteryCones = [
    { cone: '022', temp: 586, description: 'Very Low Fire' },
    { cone: '021', temp: 600, description: 'Very Low Fire' },
    { cone: '020', temp: 626, description: 'Very Low Fire' },
    { cone: '019', temp: 678, description: 'Very Low Fire' },
    { cone: '018', temp: 715, description: 'Very Low Fire' },
    { cone: '017', temp: 732, description: 'Very Low Fire' },
    { cone: '016', temp: 752, description: 'Very Low Fire' },
    { cone: '015', temp: 771, description: 'Very Low Fire' },
    { cone: '014', temp: 793, description: 'Very Low Fire' },
    { cone: '013', temp: 814, description: 'Very Low Fire' },
    { cone: '012', temp: 835, description: 'Very Low Fire' },
    { cone: '011', temp: 856, description: 'Very Low Fire' },
    { cone: '010', temp: 891, description: 'Low Fire' },
    { cone: '09', temp: 900, description: 'Low Fire' },
    { cone: '08', temp: 921, description: 'Low Fire' },
    { cone: '07', temp: 960, description: 'Low Fire' },
    { cone: '06', temp: 999, description: 'Low Fire' },
    { cone: '05', temp: 1046, description: 'Low Fire' },
    { cone: '04', temp: 1060, description: 'Low Fire' },
    { cone: '03', temp: 1101, description: 'Mid Fire' },
    { cone: '02', temp: 1127, description: 'Mid Fire' },
    { cone: '01', temp: 1153, description: 'Mid Fire' },
    { cone: '1', temp: 1186, description: 'Mid Fire' },
    { cone: '2', temp: 1222, description: 'Mid Fire' },
    { cone: '3', temp: 1240, description: 'Mid Fire' },
    { cone: '4', temp: 1250, description: 'Mid Fire' },
    { cone: '5', temp: 1260, description: 'Mid Fire' },
    { cone: '6', temp: 1285, description: 'High Fire' },
    { cone: '7', temp: 1305, description: 'High Fire' },
    { cone: '8', temp: 1315, description: 'High Fire' },
    { cone: '9', temp: 1330, description: 'High Fire' },
    { cone: '10', temp: 1340, description: 'High Fire' },
  ];

  const getConeTemp = (cone: string) => {
    const coneData = potteryCones.find(c => c.cone === cone);
    return coneData ? coneData.temp : 999;
  };

  const getConeDescription = (cone: string) => {
    const coneData = potteryCones.find(c => c.cone === cone);
    return coneData ? coneData.description : 'Unknown';
  };

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        const stored = localStorage.getItem('liveFiringSession');
        if (stored) {
          const sessionData = JSON.parse(stored);
          if (sessionData && sessionData.isActive) {
            // Parse dates back to Date objects
            sessionData.startTime = new Date(sessionData.startTime);
            sessionData.intervals = sessionData.intervals.map((interval: any) => ({
              ...interval,
              timestamp: new Date(interval.timestamp)
            }));
            setSession(sessionData);
            setIsActive(sessionData.isActive);
            setCurrentTemp(sessionData.currentTemperature.toString());
            setTargetTemp(sessionData.targetTemperature ? 
              potteryCones.find(c => c.temp === sessionData.targetTemperature)?.cone || '06' : '06');
            setTempAtmosphere(sessionData.tempAtmosphere || 'oxidation');
          }
        }
      } catch (error) {
        console.error('Error loading session from localStorage:', error);
      }
    };

    loadSession();
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem('liveFiringSession', JSON.stringify(session));
    } else {
      localStorage.removeItem('liveFiringSession');
    }
  }, [session]);

  // Auto-update session title when form values change
  useEffect(() => {
    if (!session && (targetTemp || firingType)) {
      setSessionTitle(generateSetupTitle());
    }
  }, [targetTemp, firingType]);

  const getElapsedTime = () => {
    if (!session || !session.startTime) return '0h 0m';
    
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - session.startTime.getTime()) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const startFiring = () => {
    if (!selectedKilnId) {
      toast.error('Please select a kiln first');
      return;
    }

    if (!currentTemp || parseInt(currentTemp) <= 0) {
      toast.error('Please enter a valid starting temperature');
      return;
    }

    const selectedKiln = kilns.find(k => k.id === selectedKilnId);
    if (!selectedKiln) {
      toast.error('Selected kiln not found');
      return;
    }

    const targetTemperature = getConeTemp(targetTemp);
    if (targetTemperature > selectedKiln.max_temperature) {
      toast.error(`Target temperature (${targetTemperature}°C) exceeds kiln maximum (${selectedKiln.max_temperature}°C)`);
      return;
    }

    const newSession: LiveFiringSession = {
      id: generateUUID(),
      kilnId: selectedKilnId,
      kilnName: selectedKiln.name,
      firingType,
      title: sessionTitle || generateSetupTitle(),
      startTime: new Date(),
      isActive: true,
      currentTemperature: parseInt(currentTemp),
      targetTemperature,
      notes,
      intervals: []
    };

    setSession(newSession);
    setIsActive(true);
    startTimeRef.current = new Date();
    
    // Auto-add the starting temperature as the first log entry
    if (parseInt(currentTemp) > 0) {
      const startingInterval: FiringInterval = {
        id: generateUUID(),
        timestamp: new Date(),
        temperature: parseInt(currentTemp),
        notes: 'Starting temperature',
        atmosphere: tempAtmosphere,
        rampRate: undefined
      };

      const updatedSessionWithStartingTemp = {
        ...newSession,
        intervals: [startingInterval],
        currentTemperature: parseInt(currentTemp)
      };

      setSession(updatedSessionWithStartingTemp);
      
      // Clear the current temp input since it's now logged
      setCurrentTemp('');
      setTempNotes('');
    }
    
    toast.success('Firing session started!');
  };

  const pauseFiring = () => {
    if (!session) return;
    
    const updatedSession = { ...session, isActive: false };
    setSession(updatedSession);
    setIsActive(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    toast.success('Firing session paused');
  };

  const resumeFiring = () => {
    if (!session) return;
    
    const updatedSession = { ...session, isActive: true };
    setSession(updatedSession);
    setIsActive(true);
    
    toast.success('Firing session resumed');
  };

  const addInterval = () => {
    if (!session || !currentTemp || parseInt(currentTemp) <= 0) return;

    const now = new Date();
    const currentTempValue = parseInt(currentTemp);
    
    // Calculate ramp rate
    const elapsedMinutes = session.intervals.length > 0 ? 
      (now.getTime() - session.intervals[session.intervals.length - 1].timestamp.getTime()) / (1000 * 60) : 0;
    
    const newInterval: FiringInterval = {
      id: generateUUID(),
      timestamp: now,
      temperature: currentTempValue,
      notes: tempNotes.trim() || undefined,
      atmosphere: tempAtmosphere,
      rampRate: session.intervals.length > 0 ? 
        calculateRampRate(session.intervals[session.intervals.length - 1].temperature, currentTempValue, elapsedMinutes) : 
        undefined
    };

    const updatedSession = {
      ...session,
      intervals: [...session.intervals, newInterval],
      currentTemperature: currentTempValue
    };

    setSession(updatedSession);
    
    // Check for warnings
    checkWarnings(currentTempValue, updatedSession.intervals);
    
    // Clear form
    setCurrentTemp('');
    setTempNotes('');
    
    toast.success('Temperature logged successfully!');
  };

  const calculateRampRate = (prevTemp: number, currentTemp: number, elapsedMinutes: number): number => {
    if (elapsedMinutes <= 0) return 0;
    const tempDiff = currentTemp - prevTemp;
    const hours = elapsedMinutes / 60;
    return Math.round((tempDiff / hours) * 100) / 100;
  };

  const checkWarnings = (currentTemp: number, intervals: FiringInterval[]) => {
    const newWarnings: string[] = [];
    
    if (intervals.length > 1) {
      const lastInterval = intervals[intervals.length - 1];
      if (lastInterval.rampRate && lastInterval.rampRate > 200) {
        newWarnings.push(`🔥 High ramp rate: ${lastInterval.rampRate}°C/h`);
      }
      
      if (currentTemp > session!.targetTemperature + 50) {
        newWarnings.push(`🌡️ Temperature exceeds target by ${currentTemp - session!.targetTemperature}°C`);
      }
      
      if (currentTemp > session!.targetTemperature * 1.1) {
        newWarnings.push(`⚠️ Temperature is 10% above target`);
      }
    }
    
    setWarnings(newWarnings);
  };

  const stopFiring = async () => {
    if (!session) return;
    
    try {
      await saveFiringSession();
      
      // Clear session
      setSession(null);
      setIsActive(false);
      setCurrentTemp('');
      setTempNotes('');
      setWarnings([]);
      setIsEditingTitle(false);
      setEditTitle('');
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      startTimeRef.current = null;
      localStorage.removeItem('liveFiringSession');
      
      toast.success('Firing session completed and saved!');
    } catch (error) {
      console.error('Error completing firing session:', error);
      toast.error('Failed to complete firing session');
    }
  };

  const resetForm = () => {
    setSelectedKilnId('');
    setFiringType('bisque');
    setTargetTemp('06');
    setCurrentTemp('');
    setNotes('');
    setTempNotes('');
    setTempAtmosphere('oxidation');
    setWarnings([]);
    setIsEditingTitle(false);
    setEditTitle('');
    setSessionTitle('');
  };

  const startEditingEntry = (entryId: string, currentTemp: number, currentNotes: string, currentAtmosphere: 'oxidation' | 'reduction' = 'oxidation') => {
    setEditingEntryId(entryId);
    setEditTempValue(currentTemp.toString());
    setEditNotesValue(currentNotes || '');
    setEditAtmosphereValue(currentAtmosphere);
  };

  const cancelEditing = () => {
    setEditingEntryId(null);
    setEditTempValue('');
    setEditNotesValue('');
    setEditAtmosphereValue('oxidation');
  };

  const saveEditedEntry = (entryId: string) => {
    if (!session || !editTempValue || parseInt(editTempValue) <= 0) return;

    const updatedIntervals = session.intervals.map(interval => {
      if (interval.id === entryId) {
        return {
          ...interval,
          temperature: parseInt(editTempValue),
          notes: editNotesValue.trim() || undefined,
          atmosphere: editAtmosphereValue
        };
      }
      return interval;
    });

    const updatedSession = {
      ...session,
      intervals: updatedIntervals
    };

    setSession(updatedSession);
    cancelEditing();
    toast.success('Entry updated successfully!');
  };

  const deleteEntry = (entryId: string) => {
    if (!session) return;

    const updatedIntervals = session.intervals.filter(interval => interval.id !== entryId);
    const updatedSession = {
      ...session,
      intervals: updatedIntervals
    };

    setSession(updatedSession);
    toast.success('Entry deleted successfully!');
  };

  const startEditingTitle = () => {
    setIsEditingTitle(true);
    setEditTitle(session?.title || generateDefaultTitle());
  };

  const saveTitle = () => {
    if (!session) return;

    const updatedSession = {
      ...session,
      title: editTitle.trim() || undefined
    };

    setSession(updatedSession);
    setIsEditingTitle(false);
    toast.success('Firing log title updated!');
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditTitle('');
  };

  const getConeFromTemperature = (temp: number): string => {
    if (temp >= 1060 && temp <= 1080) return '04';
    if (temp >= 1040 && temp <= 1060) return '05';
    if (temp >= 990 && temp <= 1020) return '06';
    if (temp >= 950 && temp <= 980) return '07';
    if (temp >= 910 && temp <= 940) return '08';
    if (temp >= 890 && temp <= 920) return '09';
    if (temp >= 880 && temp <= 900) return '10';
    return `${temp}°C`;
  };

  const generateDefaultTitle = () => {
    const cone = getConeFromTemperature(session?.targetTemperature || 0);
    const date = format(session?.startTime || new Date(), 'MMM dd, yyyy');
    return `Cone ${cone}, ${date}`;
  };

  const generateSetupTitle = () => {
    const selectedFiringType = firingTypes.find(type => type.value === firingType);
    const firingTypeLabel = selectedFiringType ? selectedFiringType.label : 'Firing';
    const date = format(new Date(), 'MMM dd, yyyy');
    return `Cone ${targetTemp} ${firingTypeLabel}, ${date}`;
  };

  const saveFiringSession = async () => {
    if (!session) {
      console.error('No session to save');
      toast.error('No active session to save');
      return;
    }

    if (!userId) {
      console.error('No user ID provided');
      toast.error('User not authenticated');
      return;
    }

    // Allow saving even with no intervals (user might have started but not logged any temperatures)
    const finalTemp = session.intervals.length > 0 
      ? session.intervals[session.intervals.length - 1].temperature 
      : session.currentTemperature;
    
    const totalDuration = startTimeRef.current ? 
      (new Date().getTime() - startTimeRef.current.getTime()) / (1000 * 60 * 60) : 
      (session.startTime ? (new Date().getTime() - session.startTime.getTime()) / (1000 * 60 * 60) : 0);
    
    const avgRampRate = session.intervals.length > 1 ? 
      calculateAverageRampRate(session.intervals) : 0;

    try {
      const firingLogData = {
        user_id: userId,
        kiln_name: session.kilnName,
        title: session.title || generateDefaultTitle(),
        date: session.startTime.toISOString().split('T')[0],
        notes: session.notes || null,
        firing_type: session.firingType,
        target_temperature: session.targetTemperature,
        actual_temperature: finalTemp,
        firing_duration_hours: Math.round(totalDuration * 100) / 100,
        ramp_rate: avgRampRate,
        warning_flags: warnings.map(w => ({ message: w, severity: 'warning' as const })),
        temperature_entries: session.intervals.map(interval => ({
          id: interval.id,
          time: interval.timestamp.toTimeString().split(' ')[0].substring(0, 5),
          temperature: interval.temperature,
          notes: interval.notes || null,
          atmosphere: interval.atmosphere || 'oxidation',
          rampRate: interval.rampRate || null
        }))
      };

      console.log('Saving firing log data:', firingLogData);
      console.log('Session intervals count:', session.intervals.length);
      console.log('User ID:', userId);
      console.log('Session object:', session);
      console.log('Start time ref:', startTimeRef.current);
      console.log('Warnings:', warnings);

      // Validate required fields
      if (!firingLogData.kiln_name) {
        throw new Error('Kiln name is required');
      }
      if (!firingLogData.firing_type) {
        throw new Error('Firing type is required');
      }
      if (!firingLogData.target_temperature || firingLogData.target_temperature <= 0) {
        throw new Error('Valid target temperature is required');
      }
      if (!firingLogData.actual_temperature || firingLogData.actual_temperature <= 0) {
        throw new Error('Valid actual temperature is required');
      }

      const { data, error } = await supabase
        .from('firing_logs')
        .insert(firingLogData)
        .select();

      if (error) {
        console.error('Supabase error saving firing log:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('Firing log saved successfully:', data);
      
      // Verify the data was actually saved by querying it back
      if (data && data[0] && data[0].id) {
        const { data: verifyData, error: verifyError } = await supabase
          .from('firing_logs')
          .select('id, title, kiln_name, created_at')
          .eq('id', data[0].id)
          .single();
          
        if (verifyError) {
          console.error('Error verifying saved data:', verifyError);
        } else {
          console.log('Data verification successful:', verifyData);
        }
      }
      
      toast.success('Firing session saved successfully!');
      onSessionComplete?.(session);
    } catch (error) {
      console.error('Error saving firing session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save firing session';
      toast.error(errorMessage);
    }
  };

  const calculateAverageRampRate = (intervals: FiringInterval[]): number => {
    if (intervals.length < 2) return 0;

    let totalRampRate = 0;
    let validIntervals = 0;

    for (let i = 1; i < intervals.length; i++) {
      const prev = intervals[i - 1];
      const curr = intervals[i];
      const timeDiff = (curr.timestamp.getTime() - prev.timestamp.getTime()) / (1000 * 60 * 60);
      
      if (timeDiff > 0) {
        const tempDiff = curr.temperature - prev.temperature;
        const rampRate = tempDiff / timeDiff;
        totalRampRate += rampRate;
        validIntervals++;
      }
    }

    return validIntervals > 0 ? Math.round((totalRampRate / validIntervals) * 100) / 100 : 0;
  };


  return (
    <div className="space-y-4">
      {!session ? (
        // Setup Form - Single Card
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <h2 className="text-xl font-semibold">Start New Firing Session</h2>
          
          <div className="space-y-3">
            <Label>Kiln</Label>
            <Select value={selectedKilnId} onValueChange={setSelectedKilnId}>
              <SelectTrigger>
                <SelectValue placeholder="Select kiln" />
              </SelectTrigger>
              <SelectContent>
                {kilns.map(kiln => (
                  <SelectItem key={kiln.id} value={kiln.id}>
                    {kiln.name} ({kiln.type} - Max {kiln.max_temperature}°C)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Firing Type</Label>
            <Select value={firingType} onValueChange={setFiringType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {firingTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Target Cone</Label>
            <Select value={targetTemp} onValueChange={setTargetTemp}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {potteryCones
                  .filter(cone => parseInt(cone.cone) >= 4 && parseInt(cone.cone) <= 10)
                  .map(cone => (
                    <SelectItem key={cone.cone} value={cone.cone}>
                      Cone {cone.cone} - {cone.temp}°C
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Firing Session Title</Label>
            <Input
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="Enter firing session title"
              className="h-[45px] w-full"
            />
            <p className="text-xs text-gray-500">
              Title will be used to identify this firing session
            </p>
          </div>

          <div className="space-y-3">
            <Label>Starting Temperature</Label>
            <Input
              type="number"
              value={currentTemp}
              onChange={(e) => setCurrentTemp(e.target.value)}
              placeholder="Enter starting temperature in °C"
              className="h-[45px] w-full"
            />
          </div>

          <div className="space-y-3">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this firing..."
              rows={3}
            />
          </div>

          <Button 
            onClick={startFiring} 
            className="w-full h-[45px] text-lg"
            disabled={!selectedKilnId || !currentTemp || parseInt(currentTemp) <= 0}
          >
            <Play className="h-5 w-5 mr-2" />
            Start Firing Session
          </Button>
        </div>
      ) : (
        // Active Session - Single Card
        <div className="bg-white border rounded-lg p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Live Firing Session</h2>
            {!isEditingTitle ? (
              <Button size="sm" variant="ghost" onClick={startEditingTitle}>
                <Edit className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button size="sm" onClick={saveTitle}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEditingTitle}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Session Title */}
          {isEditingTitle ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Enter firing log title"
              className="h-[45px] w-full"
            />
          ) : (
            <p className="text-lg font-medium text-gray-800">
              {session?.title || generateDefaultTitle()}
            </p>
          )}

          {/* Session Stats */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-600">Elapsed</p>
                <p className="text-sm font-bold text-blue-800">{getElapsedTime()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Current</p>
                <p className="text-sm font-bold text-red-600">
                  {session?.intervals?.length > 0 
                    ? `${session.intervals[session.intervals.length - 1].temperature}°C`
                    : `${session?.currentTemperature || 0}°C`
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Target</p>
                <p className="text-sm font-bold text-green-600">Cone {targetTemp}</p>
              </div>
            </div>
            <p className="text-xs text-blue-700 text-center mt-2">
              {session?.kilnName} • {session?.firingType}
            </p>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Warnings</span>
              </div>
              <div className="space-y-1">
                {warnings.map((warning, index) => (
                  <p key={index} className="text-sm text-red-700">{warning}</p>
                ))}
              </div>
            </div>
          )}

          {/* Temperature Graph */}
          {session && session.intervals.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Temperature Graph</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={session.intervals.map((interval, index) => ({
                    time: format(interval.timestamp, 'HH:mm'),
                    temperature: interval.temperature,
                    target: getConeTemp(targetTemp),
                    index: index,
                    atmosphere: interval.atmosphere || 'oxidation'
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      fontSize={10}
                      tick={{ fontSize: 8 }}
                    />
                    <YAxis 
                      fontSize={10}
                      tick={{ fontSize: 8 }}
                      domain={['dataMin - 50', 'dataMax + 50']}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border rounded shadow text-xs">
                              <p className="font-medium">{`${label}`}</p>
                              <p className="text-red-600">{`${data.temperature}°C`}</p>
                              {data.atmosphere && <p className="text-gray-600">{data.atmosphere}</p>}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', strokeWidth: 1, r: 3 }}
                      activeDot={{ r: 4, fill: '#ef4444' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#22c55e" 
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Temperature Input Form - CORRECT ORDER */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Log Temperature</h3>
            
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Temperature (°C)</Label>
            <Input
              type="number"
              value={currentTemp}
              onChange={(e) => setCurrentTemp(e.target.value)}
              className="h-[45px] w-full"
              placeholder="Enter temperature"
            />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Atmosphere</Label>
              <div className="flex items-center justify-start">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setTempAtmosphere('oxidation')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      tempAtmosphere === 'oxidation'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Oxidation
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempAtmosphere('reduction')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      tempAtmosphere === 'reduction'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Reduction
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Notes (Optional)</Label>
            <Input
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Add notes for this reading"
              className="h-[45px] w-full"
            />
            </div>

            {/* Log Button comes AFTER notes field */}
              <Button 
                onClick={() => addInterval()} 
                className="w-full h-[45px]"
                disabled={!currentTemp || parseInt(currentTemp) <= 0}
              >
              <Thermometer className="h-4 w-4 mr-2" />
              Log Temperature
            </Button>
          </div>

          {/* Session Log */}
          {session && session.intervals.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Temperature Log</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {session.intervals.map((interval, index) => (
                  <div key={interval.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    {editingEntryId === interval.id ? (
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            value={editTempValue}
                            onChange={(e) => setEditTempValue(e.target.value)}
                            className="flex-1 h-8 text-sm"
                            placeholder="Temp"
                          />
                          <div className="flex bg-gray-100 rounded p-0.5">
                            <button
                              type="button"
                              onClick={() => setEditAtmosphereValue('oxidation')}
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                editAtmosphereValue === 'oxidation'
                                  ? 'bg-white text-gray-900 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              O
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditAtmosphereValue('reduction')}
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                editAtmosphereValue === 'reduction'
                                  ? 'bg-white text-gray-900 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              R
                            </button>
                          </div>
                        </div>
                        <Input
                          value={editNotesValue}
                          onChange={(e) => setEditNotesValue(e.target.value)}
                          placeholder="Notes"
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => saveEditedEntry(interval.id)} className="h-6 text-xs">
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing} className="h-6 text-xs">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-red-600">{interval.temperature}°C</span>
                            {interval.atmosphere && (
                              <Badge variant={interval.atmosphere === 'oxidation' ? 'default' : 'secondary'} className="text-xs h-4">
                                {interval.atmosphere === 'oxidation' ? 'O' : 'R'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{interval.timestamp.toTimeString().split(' ')[0].substring(0, 5)}</p>
                          {interval.notes && (
                            <p className="text-xs text-gray-700 truncate" title={interval.notes}>
                              {interval.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => startEditingEntry(interval.id, interval.temperature, interval.notes || '', interval.atmosphere)} className="h-6 w-6 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteEntry(interval.id)} className="h-6 w-6 p-0">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {!isActive ? (
              <Button onClick={resumeFiring} className="h-10">
                <Play className="h-4 w-4 mr-2" />
                Continue
              </Button>
            ) : (
              <Button onClick={pauseFiring} variant="outline" className="h-10">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            
            <Button onClick={() => setShowCompleteDialog(true)} variant="destructive" className="h-10">
              <Square className="h-4 w-4 mr-2" />
              Complete
            </Button>
          </div>
        </div>
      )}

      {/* Complete Firing Confirmation Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Firing Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to complete this firing session? This action cannot be undone.
            </DialogDescription>
            {session && session.intervals.length > 0 && (
              <div className="mt-2 text-sm">
                <p className="font-medium">Session Summary:</p>
                <p>• Duration: {getElapsedTime()}</p>
                <p>• Temperature readings: {session.intervals.length}</p>
                <p>• Final temperature: {session.intervals[session.intervals.length - 1]?.temperature || session.currentTemperature}°C</p>
              </div>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setShowCompleteDialog(false);
                stopFiring();
              }}
            >
              Yes, Complete Firing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}