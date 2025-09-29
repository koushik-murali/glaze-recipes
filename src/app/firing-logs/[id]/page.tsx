'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Calendar, 
  Thermometer, 
  Clock, 
  AlertTriangle,
  Zap,
  Edit,
  Palette,
  Share2,
  Copy,
  ExternalLink,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { FiringLog, FiringWarning } from '@/types/firing';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlobalNavigation from '@/components/GlobalNavigation';
import { generateUUID } from '@/lib/uuid-utils';
import { copyToClipboard, shareContent, copyToClipboardEnhanced } from '@/lib/clipboard-utils';
import { getFiringLogDisplayTitle } from '@/lib/firing-utils';

export default function FiringLogDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [firingLog, setFiringLog] = useState<FiringLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editTemp, setEditTemp] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');

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
      }
    } catch (error) {
      console.error('Error loading firing log:', error);
      setError('Failed to load firing log');
      toast.error('Failed to load firing log');
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

  const generateShareLink = async () => {
    if (!firingLog || !user) return;
    
    setIsSharing(true);
    try {
      // Generate a public share token
      const shareToken = generateUUID();
      
      // Save the share token to the database
      const { error } = await supabase
        .from('firing_logs')
        .update({ share_token: shareToken })
        .eq('id', firingLog.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Generate the public share link
      const baseUrl = window.location.origin;
      const publicLink = `${baseUrl}/firing-logs/shared/${shareToken}`;
      setShareLink(publicLink);
      
      toast.success('Share link generated successfully!');
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Failed to generate share link');
    } finally {
      setIsSharing(false);
    }
  };

  const copyShareLink = async () => {
    if (shareLink) {
      const success = await copyToClipboardEnhanced(shareLink);
      if (success) {
        toast.success('Share link copied to clipboard!');
      } else {
        toast.error('Failed to copy link. Please try again.');
      }
    }
  };

  const handleNativeShare = async () => {
    if (!firingLog || !shareLink) return;
    
    const success = await shareContent(
      `Check out this firing log: ${firingLog.kiln_name}`,
      `Firing Log: ${firingLog.kiln_name}\nDate: ${format(new Date(firingLog.date), 'MMM dd, yyyy')}\nType: ${firingLog.firing_type}\nTarget: ${firingLog.target_temperature}°C`,
      shareLink
    );
    
    if (!success) {
      // Fallback to copy if native share fails
      await copyShareLink();
    }
  };

  const startEditingEntry = (entry: any) => {
    setEditingEntry(entry.id);
    setEditTemp(entry.temperature.toString());
    setEditNotes(entry.notes || '');
  };

  const cancelEditing = () => {
    setEditingEntry(null);
    setEditTemp('');
    setEditNotes('');
  };

  const saveEditedEntry = async (entryId: string) => {
    if (!firingLog || !user) return;

    try {
      const updatedEntries = firingLog.temperature_entries?.map(entry => 
        entry.id === entryId 
          ? { ...entry, temperature: parseInt(editTemp), notes: editNotes.trim() || undefined }
          : entry
      ) || [];

      const { error } = await supabase
        .from('firing_logs')
        .update({ 
          temperature_entries: updatedEntries,
          updated_at: new Date().toISOString()
        })
        .eq('id', firingLog.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setFiringLog(prev => prev ? { ...prev, temperature_entries: updatedEntries } : null);
      setEditingEntry(null);
      setEditTemp('');
      setEditNotes('');
      toast.success('Temperature entry updated successfully!');
    } catch (error) {
      console.error('Error updating temperature entry:', error);
      toast.error('Failed to update temperature entry');
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!firingLog || !user) return;

    try {
      const updatedEntries = firingLog.temperature_entries?.filter(entry => entry.id !== entryId) || [];

      const { error } = await supabase
        .from('firing_logs')
        .update({ 
          temperature_entries: updatedEntries,
          updated_at: new Date().toISOString()
        })
        .eq('id', firingLog.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setFiringLog(prev => prev ? { ...prev, temperature_entries: updatedEntries } : null);
      toast.success('Temperature entry deleted successfully!');
    } catch (error) {
      console.error('Error deleting temperature entry:', error);
      toast.error('Failed to delete temperature entry');
    }
  };

  const startEditingTitle = () => {
    if (firingLog) {
      setEditTitle(firingLog.title || getFiringLogDisplayTitle(firingLog));
      setIsEditingTitle(true);
    }
  };

  const saveTitle = async () => {
    if (!firingLog || !user) return;

    try {
      const { error } = await supabase
        .from('firing_logs')
        .update({ title: editTitle.trim() || null })
        .eq('id', firingLog.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setFiringLog(prev => prev ? { ...prev, title: editTitle.trim() || undefined } : null);
      setIsEditingTitle(false);
      toast.success('Title updated successfully');
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Failed to update title');
    }
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditTitle('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Firing Log Not Found</h1>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Firing log not found</h3>
              <p className="text-gray-600 text-center mb-4">
                The firing log you're looking for doesn't exist or you don't have permission to view it.
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

      <div className="max-w-4xl mx-auto p-6">
        {/* Header - Mobile Optimized */}
        <div className="space-y-4 mb-6">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => router.push('/firing-logs')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Firing Logs
          </Button>
          
          {/* Title Section */}
          <div className="space-y-3">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl font-bold"
                  placeholder="Enter title"
                />
                <Button size="sm" onClick={saveTitle}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEditingTitle}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 flex-1">
                  {getFiringLogDisplayTitle(firingLog)}
                </h1>
                <Button size="sm" variant="ghost" onClick={startEditingTitle}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getFiringTypeColor(firingLog.firing_type)}>
                {firingLog.firing_type}
              </Badge>
              {firingLog.warning_flags.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {firingLog.warning_flags.length} warning{firingLog.warning_flags.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Action Buttons - Stacked on Mobile */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push(`/firing-logs/${id}/edit`)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Edit className="h-4 w-4" />
              Edit Firing Log
            </Button>
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

            {/* Warnings */}
            {firingLog.warning_flags.length > 0 && (
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


            {/* Temperature Graph */}
            {firingLog.temperature_entries && firingLog.temperature_entries.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5" />
                    Temperature Graph
                    <Badge variant="secondary">{firingLog.temperature_entries.length} data points</Badge>
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
                                  {data.atmosphere && (
                                    <p className={`text-sm font-medium ${data.atmosphere === 'reduction' ? 'text-purple-600' : 'text-red-600'}`}>
                                      Atmosphere: {data.atmosphere}
                                    </p>
                                  )}
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
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <Thermometer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No temperature entries available for this firing log.</p>
                    <p className="text-sm">Temperature data will appear here once entries are added.</p>
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
                            {editingEntry === entry.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editTemp}
                                  onChange={(e) => setEditTemp(e.target.value)}
                                  className="w-20 h-8 text-sm"
                                />
                                <span className="text-sm">°C</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-red-600">{entry.temperature}°C</span>
                                {entry.atmosphere && (
                                  <Badge variant={entry.atmosphere === 'oxidation' ? 'default' : 'secondary'} className="text-xs">
                                    {entry.atmosphere}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-500">
                              Entry #{index + 1}
                            </div>
                            {editingEntry === entry.id ? (
                              <div className="flex gap-1">
                                <Button size="sm" onClick={() => saveEditedEntry(entry.id)}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEditing}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => startEditingEntry(entry)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => deleteEntry(entry.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        {editingEntry === entry.id ? (
                          <div className="mt-2">
                            <Input
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Add notes..."
                              className="text-sm"
                            />
                          </div>
                        ) : (
                          entry.notes && (
                            <div className="mt-2 p-2 bg-white rounded border-l-4 border-blue-500">
                              <div className="flex items-start gap-2">
                                <span className="text-sm text-gray-600 italic">📝</span>
                                <span className="text-sm text-gray-700">{entry.notes}</span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ))}
                  </div>
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
                  <span className="text-sm text-gray-600">Temperature Accuracy</span>
                  <span className={`font-medium ${
                    Math.abs(firingLog.actual_temperature - firingLog.target_temperature) <= 50 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(firingLog.actual_temperature - firingLog.target_temperature)}°C off
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Ramp Rate Status</span>
                  <span className={`font-medium ${
                    firingLog.ramp_rate > 200 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {firingLog.ramp_rate > 200 ? 'High' : 'Normal'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Warnings</span>
                  <span className="font-medium">{firingLog.warning_flags.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => router.push(`/firing-logs/${id}/edit`)}
                  className="w-full"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Firing Log
                </Button>
                
                {/* Sharing Section */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Share Firing Log</div>
                  {!shareLink ? (
                    <Button 
                      variant="outline"
                      onClick={generateShareLink}
                      disabled={isSharing}
                      className="w-full"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {isSharing ? 'Generating...' : 'Generate Share Link'}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="space-y-2">
                        {/* Native Share Button (Mobile) */}
                        {typeof navigator !== 'undefined' && 'share' in navigator && (
                          <Button 
                            variant="outline"
                            onClick={handleNativeShare}
                            className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant="outline"
                            onClick={copyShareLink}
                            className="w-full"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          
                          <Button 
                            variant="outline"
                            onClick={() => window.open(shareLink, '_blank')}
                            className="w-full"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded break-all">
                        {shareLink}
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Export functionality could be added here
                    toast.info('Export functionality coming soon!');
                  }}
                  className="w-full"
                >
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
