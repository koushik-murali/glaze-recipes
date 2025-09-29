'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Zap, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Thermometer, 
  Clock, 
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  Download,
  Palette,
  RefreshCw
} from 'lucide-react';
import { FiringLog, FiringWarning } from '@/types/firing';
import { useAuth } from '@/contexts/AuthContext';
import { getFiringLogsCached, getKilnsCached } from '@/lib/cached-supabase-utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import GlobalNavigation from '@/components/GlobalNavigation';

export default function FiringLogsPage() {
  const { user } = useAuth();
  const [firingLogs, setFiringLogs] = useState<FiringLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<FiringLog[]>([]);
  const [kilns, setKilns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKiln, setSelectedKiln] = useState<string>('all');
  const [selectedFiringType, setSelectedFiringType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'kiln' | 'temperature'>('date');

  const firingTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'bisque', label: 'Bisque' },
    { value: 'glaze', label: 'Glaze' },
    { value: 'raku', label: 'Raku' },
    { value: 'wood', label: 'Wood' },
    { value: 'soda', label: 'Soda' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Refresh data when page becomes visible (e.g., after completing a firing session)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('Page became visible, refreshing data...');
        loadData();
      }
    };

    const handleFocus = () => {
      if (user) {
        console.log('Window focused, refreshing data...');
        loadData();
      }
    };

    // Also refresh when the page loads (in case user navigated back from completed firing)
    const handlePageShow = () => {
      if (user) {
        console.log('Page shown, refreshing data...');
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [user]);

  useEffect(() => {
    filterAndSortLogs();
  }, [firingLogs, searchTerm, selectedKiln, selectedFiringType, sortBy]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load firing logs with caching
      const logsData = await getFiringLogsCached(user.id);
      console.log('Loaded firing logs:', logsData);
      setFiringLogs(logsData);

      // Load kilns with caching
      const kilnsData = await getKilnsCached(user.id);
      setKilns(kilnsData);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load firing logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
    toast.success('Data refreshed');
  };

  const filterAndSortLogs = () => {
    let filtered = firingLogs.filter(log => {
      const matchesSearch = searchTerm === '' || 
                           log.kiln_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesKiln = selectedKiln === 'all' || log.kiln_name === selectedKiln;
      const matchesType = selectedFiringType === 'all' || log.firing_type === selectedFiringType;
      
      return matchesSearch && matchesKiln && matchesType;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'kiln':
          return a.kiln_name.localeCompare(b.kiln_name);
        case 'temperature':
          return b.target_temperature - a.target_temperature;
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    setFilteredLogs(filtered);
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

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this firing log?')) return;
    
    try {
      const { error } = await supabase
        .from('firing_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      setFiringLogs(prev => prev.filter(log => log.id !== logId));
      toast.success('Firing log deleted successfully');
    } catch (error) {
      console.error('Error deleting firing log:', error);
      toast.error('Failed to delete firing log');
    }
  };

  const exportFiringLogs = () => {
    const csvData = filteredLogs.map(log => ({
      'Date': log.date,
      'Kiln': log.kiln_name,
      'Type': log.firing_type,
      'Target Temp': log.target_temperature,
      'Actual Temp': log.actual_temperature,
      'Duration (hrs)': log.firing_duration_hours,
      'Ramp Rate': log.ramp_rate,
      'Notes': log.notes || '',
      'Warnings': log.warning_flags.length,
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `firing-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Navigation */}
      <GlobalNavigation />

      {/* Page Content Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-slate-900 mb-4">Firing Logs</h1>
          
          {/* Action Buttons - Moved below heading */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => {
                // Navigate to create firing log
                window.location.href = '/firing-logs/new';
              }}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              New Firing Log
            </Button>
            
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <Input
                  placeholder="Search by title, kiln name, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Kiln Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Kiln</label>
                <Select value={selectedKiln} onValueChange={setSelectedKiln}>
                  <SelectTrigger>
                    <SelectValue placeholder="All kilns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Kilns</SelectItem>
                    {kilns.map(kiln => (
                      <SelectItem key={kiln.id} value={kiln.name}>
                        {kiln.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Firing Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Firing Type</label>
                <Select value={selectedFiringType} onValueChange={setSelectedFiringType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
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

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort by</label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date (Newest)</SelectItem>
                    <SelectItem value="kiln">Kiln Name</SelectItem>
                    <SelectItem value="temperature">Temperature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            {filteredLogs.length} of {firingLogs.length} firing logs
          </p>
        </div>

        {/* Firing Logs Grid */}
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Zap className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No firing logs found</h3>
              <p className="text-gray-600 text-center mb-4">
                {firingLogs.length === 0 
                  ? 'Create your first firing log to start tracking your kiln firings.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              <Button onClick={() => window.location.href = '/firing-logs/new'}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Firing Log
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLogs.map((log) => (
              <Card key={log.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{log.title || log.kiln_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getFiringTypeColor(log.firing_type)}>
                          {log.firing_type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {log.kiln_name}
                        </Badge>
                        {log.warning_flags.length > 0 && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {log.warning_flags.length} warning{log.warning_flags.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {format(new Date(log.date), 'MMM dd, yyyy')}
                  </div>

                  {/* Temperature */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Thermometer className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Temperature</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Target:</span>
                        <span className="ml-1 font-medium">{log.target_temperature}°C</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Actual:</span>
                        <span className={`ml-1 font-medium ${
                          log.actual_temperature > log.target_temperature + 50 ? 'text-red-600' :
                          log.actual_temperature < log.target_temperature - 50 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {log.actual_temperature}°C
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Duration & Ramp Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Firing Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-1 font-medium">{log.firing_duration_hours}h</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Ramp:</span>
                        <span className={`ml-1 font-medium ${
                          log.ramp_rate > 200 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {log.ramp_rate}°C/h
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {log.warning_flags.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">Warnings</span>
                      </div>
                      <div className="space-y-1">
                        {log.warning_flags.slice(0, 2).map((warning: FiringWarning, index: number) => (
                          <Badge key={index} className={`${getWarningColor(warning.severity)} text-xs`}>
                            {warning.message}
                          </Badge>
                        ))}
                        {log.warning_flags.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{log.warning_flags.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes Preview */}
                  {log.notes && (
                    <div className="text-sm">
                      <span className="text-gray-600">Notes:</span>
                      <p className="text-gray-800 mt-1 line-clamp-2">
                        {log.notes}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to edit firing log
                        window.location.href = `/firing-logs/${log.id}/edit`;
                      }}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to view firing log
                        window.location.href = `/firing-logs/${log.id}`;
                      }}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLog(log.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
