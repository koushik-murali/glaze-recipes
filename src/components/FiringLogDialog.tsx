'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Thermometer, Zap } from 'lucide-react';
import { FiringLog, FiringWarning, Kiln } from '@/types/firing';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/uuid-utils';

interface FiringLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFiringLogCreated: (firingLog: FiringLog) => void;
  onFiringLogUpdated?: (firingLog: FiringLog) => void;
  editingFiringLog?: FiringLog | null;
  userId: string;
}

const firingTypes = [
  { value: 'bisque', label: 'Bisque Firing' },
  { value: 'glaze', label: 'Glaze Firing' },
  { value: 'raku', label: 'Raku Firing' },
  { value: 'wood', label: 'Wood Firing' },
  { value: 'soda', label: 'Soda Firing' },
  { value: 'other', label: 'Other' },
];

export default function FiringLogDialog({
  open,
  onOpenChange,
  onFiringLogCreated,
  onFiringLogUpdated,
  editingFiringLog,
  userId
}: FiringLogDialogProps) {
  const [kilnName, setKilnName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [firingType, setFiringType] = useState<'bisque' | 'glaze' | 'raku' | 'wood' | 'soda' | 'other'>('bisque');
  const [targetTemperature, setTargetTemperature] = useState(1000);
  const [actualTemperature, setActualTemperature] = useState(1000);
  const [firingDuration, setFiringDuration] = useState(8);
  const [rampRate, setRampRate] = useState(125);
  const [warnings, setWarnings] = useState<FiringWarning[]>([]);
  const [kilns, setKilns] = useState<any[]>([]);
  const [selectedKilnId, setSelectedKilnId] = useState('');

  useEffect(() => {
    if (open && userId) {
      loadKilns();
    }
    
    if (editingFiringLog) {
      setKilnName(editingFiringLog.kiln_name);
      setDate(editingFiringLog.date);
      setNotes(editingFiringLog.notes || '');
      setFiringType(editingFiringLog.firing_type);
      setTargetTemperature(editingFiringLog.target_temperature);
      setActualTemperature(editingFiringLog.actual_temperature);
      setFiringDuration(editingFiringLog.firing_duration_hours);
      setRampRate(editingFiringLog.ramp_rate);
      setWarnings(editingFiringLog.warning_flags);
    } else {
      resetForm();
    }
  }, [editingFiringLog, open, userId]);

  const loadKilns = async () => {
    try {
      const { data, error } = await supabase
        .from('kilns')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      setKilns(data || []);
    } catch (error) {
      console.error('Error loading kilns:', error);
      toast.error('Failed to load kilns');
    }
  };

  const resetForm = () => {
    setKilnName('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setFiringType('bisque');
    setTargetTemperature(1000);
    setActualTemperature(1000);
    setFiringDuration(8);
    setRampRate(125);
    setWarnings([]);
    setSelectedKilnId('');
  };

  const calculateWarnings = (): FiringWarning[] => {
    const newWarnings: FiringWarning[] = [];

    // Check ramp rate
    if (rampRate > 200) {
      newWarnings.push({
        type: 'high_ramp_rate',
        message: `High ramp rate: ${rampRate}°C/hour (recommended max: 200°C/hour)`,
        severity: rampRate > 300 ? 'critical' : 'warning',
        triggered_at: Date.now()
      });
    }

    // Check if actual temperature exceeds target by more than 50°C
    if (actualTemperature > targetTemperature + 50) {
      newWarnings.push({
        type: 'temperature_exceeded',
        message: `Temperature exceeded target by ${actualTemperature - targetTemperature}°C`,
        severity: 'warning',
        triggered_at: Date.now()
      });
    }

    // Check firing duration (warn if longer than 24 hours)
    if (firingDuration > 24) {
      newWarnings.push({
        type: 'duration_exceeded',
        message: `Long firing duration: ${firingDuration} hours`,
        severity: 'warning',
        triggered_at: Date.now()
      });
    }

    return newWarnings;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedKilnId || kilns.length === 0) {
      toast.error('Please select a kiln first');
      return;
    }
    
    const newWarnings = calculateWarnings();
    setWarnings(newWarnings);

    const firingLogData: Omit<FiringLog, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      kiln_name: kilnName,
      date,
      notes,
      firing_type: firingType,
      target_temperature: targetTemperature,
      actual_temperature: actualTemperature,
      firing_duration_hours: firingDuration,
      ramp_rate: rampRate,
      warning_flags: newWarnings,
    };

    if (editingFiringLog) {
      const updatedLog: FiringLog = {
        ...editingFiringLog,
        ...firingLogData,
        updated_at: new Date().toISOString(),
      };
      onFiringLogUpdated?.(updatedLog);
    } else {
      const newLog: FiringLog = {
        ...firingLogData,
        id: generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      onFiringLogCreated(newLog);
    }

    onOpenChange(false);
  };

  const getWarningColor = (severity: 'warning' | 'critical') => {
    return severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {editingFiringLog ? 'Edit Firing Log' : 'Add New Firing Log'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kilnName">Kiln Name *</Label>
              <Select value={selectedKilnId} onValueChange={(value) => {
                setSelectedKilnId(value);
                const selectedKiln = kilns.find(k => k.id === value);
                if (selectedKiln) {
                  setKilnName(selectedKiln.name);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a kiln" />
                </SelectTrigger>
                <SelectContent>
                  {kilns.length === 0 ? (
                    <SelectItem value="no-kilns" disabled>
                      No kilns available. Add kilns in Settings.
                    </SelectItem>
                  ) : (
                    kilns.map(kiln => (
                      <SelectItem key={kiln.id} value={kiln.id}>
                        {kiln.name} ({kiln.type} - Max {kiln.max_temperature}°C)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {kilns.length === 0 && (
                <p className="text-sm text-amber-600">
                  No kilns found. Please add kilns in Settings first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="firingType">Firing Type *</Label>
            <Select value={firingType} onValueChange={(value: any) => setFiringType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select firing type" />
              </SelectTrigger>
              <SelectContent>
                {firingTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperature Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Thermometer className="h-5 w-5" />
                Temperature Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetTemp">Target Temperature (°C) *</Label>
                  <Input
                    id="targetTemp"
                    type="number"
                    value={targetTemperature}
                    onChange={(e) => setTargetTemperature(Number(e.target.value))}
                    min="0"
                    max="1400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualTemp">Actual Temperature (°C) *</Label>
                  <Input
                    id="actualTemp"
                    type="number"
                    value={actualTemperature}
                    onChange={(e) => setActualTemperature(Number(e.target.value))}
                    min="0"
                    max="1400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Firing Duration (hours) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={firingDuration}
                    onChange={(e) => setFiringDuration(Number(e.target.value))}
                    min="0"
                    step="0.5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rampRate">Ramp Rate (°C/hour) *</Label>
                  <Input
                    id="rampRate"
                    type="number"
                    value={rampRate}
                    onChange={(e) => setRampRate(Number(e.target.value))}
                    min="0"
                    step="1"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {warnings.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {warnings.map((warning, index) => (
                    <Badge
                      key={index}
                      className={`${getWarningColor(warning.severity)} flex items-center gap-1`}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {warning.message}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the firing process, issues encountered, results, etc."
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {editingFiringLog ? 'Update Firing Log' : 'Add Firing Log'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
