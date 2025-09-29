'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Zap, Palette, Plus, Thermometer, Trash2 } from 'lucide-react';
import { FiringLog, TemperatureEntry } from '@/types/firing';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import GlobalNavigation from '@/components/GlobalNavigation';
import { generateUUID } from '@/lib/uuid-utils';

export default function EditFiringLogPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [firingLog, setFiringLog] = useState<FiringLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [kilnName, setKilnName] = useState('');
  const [date, setDate] = useState('');
  const [firingType, setFiringType] = useState('bisque');
  const [targetTemperature, setTargetTemperature] = useState(1000);
  const [actualTemperature, setActualTemperature] = useState(1000);
  const [firingDurationHours, setFiringDurationHours] = useState(0);
  const [rampRate, setRampRate] = useState(0);
  const [notes, setNotes] = useState('');
  
  // Temperature entries for detailed tracking
  const [temperatureEntries, setTemperatureEntries] = useState<TemperatureEntry[]>([]);
  const [newEntryTime, setNewEntryTime] = useState('');
  const [newEntryTemp, setNewEntryTemp] = useState('');
  const [newEntryNotes, setNewEntryNotes] = useState('');

  const firingTypes = [
    { value: 'bisque', label: 'Bisque Firing' },
    { value: 'glaze', label: 'Glaze Firing' },
    { value: 'raku', label: 'Raku Firing' },
    { value: 'wood', label: 'Wood Firing' },
    { value: 'soda', label: 'Soda Firing' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (user && id) {
      loadFiringLog();
    }
  }, [user, id]);

  const loadFiringLog = async () => {
    if (!user || !id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('firing_logs')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Firing log not found');
        } else {
          throw error;
        }
      } else {
        setFiringLog(data);
        // Populate form with existing data
        setKilnName(data.kiln_name);
        setDate(data.date);
        setFiringType(data.firing_type);
        setTargetTemperature(data.target_temperature);
        setActualTemperature(data.actual_temperature);
        setFiringDurationHours(data.firing_duration_hours);
        setRampRate(data.ramp_rate);
        setNotes(data.notes || '');
        
        // Load temperature entries if they exist
        if (data.temperature_entries) {
          setTemperatureEntries(data.temperature_entries);
        }
      }
    } catch (error) {
      console.error('Error loading firing log:', error);
      setError('Failed to load firing log');
      toast.error('Failed to load firing log');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !id) return;

    // Validation
    if (!kilnName.trim()) {
      toast.error('Kiln name is required');
      return;
    }
    if (!date) {
      toast.error('Date is required');
      return;
    }
    if (targetTemperature <= 0) {
      toast.error('Target temperature must be greater than 0');
      return;
    }
    if (actualTemperature <= 0) {
      toast.error('Actual temperature must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('firing_logs')
        .update({
          kiln_name: kilnName.trim(),
          date,
          firing_type: firingType,
          target_temperature: targetTemperature,
          actual_temperature: actualTemperature,
        firing_duration_hours: firingDurationHours,
        ramp_rate: rampRate,
        notes: notes.trim() || null,
        temperature_entries: temperatureEntries.length > 0 ? temperatureEntries : null,
        updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Firing log updated successfully');
      router.push(`/firing-logs/${id}`);
    } catch (error) {
      console.error('Error updating firing log:', error);
      toast.error('Failed to update firing log');
    } finally {
      setSaving(false);
    }
  };

  const addTemperatureEntry = () => {
    if (!newEntryTime || !newEntryTemp) {
      toast.error('Please fill in time and temperature');
      return;
    }

    const newEntry = {
      id: generateUUID(),
      time: newEntryTime,
      temperature: parseInt(newEntryTemp),
      notes: newEntryNotes.trim() || undefined
    };

    setTemperatureEntries(prev => [...prev, newEntry].sort((a, b) => a.time.localeCompare(b.time)));
    setNewEntryTime('');
    setNewEntryTemp('');
    setNewEntryNotes('');
    toast.success('Temperature entry added');
  };

  const removeTemperatureEntry = (entryId: string) => {
    setTemperatureEntries(prev => prev.filter(entry => entry.id !== entryId));
    toast.success('Temperature entry removed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !firingLog) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Edit Firing Log</h1>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-semibold mb-2">Firing log not found</h3>
              <p className="text-gray-600 text-center mb-4">
                The firing log you're trying to edit doesn't exist or you don't have permission to edit it.
              </p>
              <Button onClick={() => router.push('/firing-logs')}>
                Back to Firing Logs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Navigation */}
      <GlobalNavigation />

      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Edit Firing Log</h1>
              <p className="text-gray-600">Update firing log details</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Firing Log Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kilnName">Kiln Name *</Label>
                <Input
                  id="kilnName"
                  value={kilnName}
                  onChange={(e) => setKilnName(e.target.value)}
                  placeholder="Enter kiln name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firingType">Firing Type *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="targetTemp">Target Temperature (°C) *</Label>
                <Input
                  id="targetTemp"
                  type="number"
                  value={targetTemperature}
                  onChange={(e) => setTargetTemperature(parseInt(e.target.value) || 0)}
                  min="500"
                  max="2000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actualTemp">Actual Temperature (°C) *</Label>
                <Input
                  id="actualTemp"
                  type="number"
                  value={actualTemperature}
                  onChange={(e) => setActualTemperature(parseInt(e.target.value) || 0)}
                  min="0"
                  max="2000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  step="0.1"
                  value={firingDurationHours}
                  onChange={(e) => setFiringDurationHours(parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rampRate">Ramp Rate (°C/hour)</Label>
              <Input
                id="rampRate"
                type="number"
                value={rampRate}
                onChange={(e) => setRampRate(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this firing..."
                rows={4}
              />
            </div>

            {/* Temperature Entries Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Temperature Entries</Label>
                <span className="text-sm text-gray-500">{temperatureEntries.length} entries</span>
              </div>

              {/* Add New Entry Form */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="newEntryTime">Time</Label>
                        <Input
                          id="newEntryTime"
                          type="time"
                          value={newEntryTime}
                          onChange={(e) => setNewEntryTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="newEntryTemp">Temperature (°C)</Label>
                        <Input
                          id="newEntryTemp"
                          type="number"
                          value={newEntryTemp}
                          onChange={(e) => setNewEntryTemp(e.target.value)}
                          placeholder="e.g. 1000"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          onClick={addTemperatureEntry}
                          className="w-full"
                          disabled={!newEntryTime || !newEntryTemp}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Entry
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="newEntryNotes">Notes (Optional)</Label>
                      <Input
                        id="newEntryNotes"
                        value={newEntryNotes}
                        onChange={(e) => setNewEntryNotes(e.target.value)}
                        placeholder="Additional notes for this temperature reading..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Temperature Entries List */}
              {temperatureEntries.length > 0 && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {temperatureEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Thermometer className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{entry.time}</span>
                            </div>
                            <span className="text-lg font-bold">{entry.temperature}°C</span>
                            {entry.notes && (
                              <span className="text-sm text-gray-600 italic">{entry.notes}</span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTemperatureEntry(entry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
