'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Thermometer, 
  Clock, 
  AlertTriangle,
  Zap,
  Palette,
  ArrowLeft,
  Home,
  Share2
} from 'lucide-react';
import { FiringLog, FiringWarning } from '@/types/firing';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlobalNavigation from '@/components/GlobalNavigation';

export default function SharedFiringLogPage() {
  const { token } = useParams();
  const [firingLog, setFiringLog] = useState<FiringLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadSharedFiringLog();
    }
  }, [token]);

  const loadSharedFiringLog = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('firing_logs')
        .select('*')
        .eq('share_token', token)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Shared firing log not found or link has expired');
        } else {
          throw error;
        }
      } else {
        setFiringLog(data);
      }
    } catch (error) {
      console.error('Error loading shared firing log:', error);
      setError('Failed to load shared firing log');
    } finally {
      setLoading(false);
    }
  };

  const getWarningColor = (severity: 'warning' | 'critical') => {
    return severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getFiringTypeColor = (type: string) => {
    const colors = {
      bisque: 'bg-gray-100 text-gray-800',
      glaze: 'bg-blue-100 text-blue-800',
      raku: 'bg-orange-100 text-orange-800',
      wood: 'bg-amber-100 text-amber-800',
      soda: 'bg-green-100 text-green-800',
      other: 'bg-purple-100 text-purple-800',
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!firingLog) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Firing log not found</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Navigation */}
      <GlobalNavigation />

      <div className="max-w-6xl mx-auto p-6">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Shared Firing Log</h1>
              <p className="text-gray-600">Shared by {firingLog.user_id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Firing Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="font-medium">{format(new Date(firingLog.date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="font-medium">{firingLog.firing_duration_hours}h</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Target Temperature:</span>
                    <span className="font-medium">{firingLog.target_temperature}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Actual Temperature:</span>
                    <span className={`font-medium ${
                      firingLog.actual_temperature > firingLog.target_temperature + 50 ? 'text-red-600' :
                      firingLog.actual_temperature < firingLog.target_temperature - 50 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {firingLog.actual_temperature}°C
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Ramp Rate:</span>
                  <span className={`font-medium ${
                    firingLog.ramp_rate > 200 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {firingLog.ramp_rate}°C/h
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Temperature Graph */}
            {firingLog.temperature_entries && firingLog.temperature_entries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5" />
                    Temperature Graph
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={firingLog.temperature_entries.map((entry, index) => ({
                        time: entry.time,
                        temperature: entry.temperature,
                        target: firingLog.target_temperature,
                        index: index,
                        notes: entry.notes,
                        atmosphere: entry.atmosphere || 'oxidation'
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          domain={['dataMin - 50', 'dataMax + 50']}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value: any, name: string) => [
                            `${value}°C`, 
                            name === 'temperature' ? 'Actual Temperature' : 
                            name === 'target' ? 'Target Temperature' : name
                          ]}
                          labelFormatter={(label) => `Time: ${label}`}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border rounded-lg shadow-lg">
                                  <p className="font-medium">{`Time: ${label}`}</p>
                                  <p className="text-red-600">{`Temperature: ${data.temperature}°C`}</p>
                                  {data.target && (
                                    <p className="text-green-600">{`Target: ${data.target}°C`}</p>
                                  )}
                                  {data.notes && (
                                    <p className="text-gray-600 text-sm italic">{data.notes}</p>
                                  )}
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
                          strokeWidth={3}
                          dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="target" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Temperature Entries */}
            {firingLog.temperature_entries && firingLog.temperature_entries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5" />
                    Temperature Entries
                    <Badge variant="secondary">{firingLog.temperature_entries.length} readings</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {firingLog.temperature_entries.map((entry, index) => (
                      <div key={entry.id || index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{entry.time}</span>
                            </div>
                            <span className="text-lg font-bold text-red-600">{entry.temperature}°C</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Entry #{index + 1}
                          </div>
                        </div>
                        {entry.notes && (
                          <div className="mt-2 p-2 bg-white rounded border-l-4 border-blue-500">
                            <div className="flex items-start gap-2">
                              <span className="text-sm text-gray-600 italic">📝</span>
                              <span className="text-sm text-gray-700">{entry.notes}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {firingLog.warning_flags && firingLog.warning_flags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {firingLog.warning_flags.map((warning: FiringWarning, index: number) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <Badge className={`${getWarningColor(warning.severity)} mr-2`}>
                            {warning.severity.toUpperCase()}
                          </Badge>
                          {warning.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {firingLog.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{firingLog.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kiln:</span>
                  <span className="font-medium">{firingLog.kiln_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <Badge className={getFiringTypeColor(firingLog.firing_type)}>
                    {firingLog.firing_type}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{format(new Date(firingLog.created_at), 'MMM dd, yyyy')}</span>
                </div>
                {firingLog.temperature_entries && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Readings:</span>
                    <span className="font-medium">{firingLog.temperature_entries.length}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Share Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shared Firing Log</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  This firing log has been shared publicly. Anyone with this link can view the details.
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Share2 className="h-3 w-3 mr-1" />
                  Public Access
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
