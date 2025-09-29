'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  BarChart3, 
  Download,
  Clock,
  CheckCircle,
  XCircle,
  HardDrive
} from 'lucide-react';
import { useCachePerformance } from '@/lib/cache-performance';
import { getCacheInfo, clearAllCaches } from '@/lib/cache-utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function CacheManagement() {
  const { user } = useAuth();
  const { getSummary, getMetrics, logPerformance, clearMetrics, exportMetrics } = useCachePerformance();
  const [cacheInfo, setCacheInfo] = useState<{ size: number; metadata: any }>({ size: 0, metadata: {} });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    updateCacheInfo();
  }, []);

  const updateCacheInfo = () => {
    const info = getCacheInfo();
    setCacheInfo(info);
  };

  const handleClearCache = async () => {
    if (!user) return;
    
    try {
      clearAllCaches();
      clearMetrics();
      updateCacheInfo();
      toast.success('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      updateCacheInfo();
      logPerformance();
      toast.success('Cache information refreshed');
    } catch (error) {
      console.error('Error refreshing cache info:', error);
      toast.error('Failed to refresh cache information');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportMetrics = () => {
    try {
      const metrics = exportMetrics();
      const blob = new Blob([metrics], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cache-metrics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Cache metrics exported');
    } catch (error) {
      console.error('Error exporting metrics:', error);
      toast.error('Failed to export metrics');
    }
  };

  const summary = getSummary();
  const metrics = getMetrics();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCacheStatusColor = (hitRate: number): string => {
    if (hitRate >= 80) return 'bg-green-100 text-green-800';
    if (hitRate >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Cache Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Overview
          </CardTitle>
          <CardDescription>
            Monitor your local cache performance and storage usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <HardDrive className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">Cache Size</span>
              </div>
              <p className="text-lg font-semibold">{formatBytes(cacheInfo.size)}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">Hit Rate</span>
              </div>
              <p className="text-lg font-semibold">{summary.overallHitRate.toFixed(1)}%</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-600">Avg Response</span>
              </div>
              <p className="text-lg font-semibold">{summary.averageResponseTime.toFixed(0)}ms</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Cache Hit Rate</span>
              <span>{summary.overallHitRate.toFixed(1)}%</span>
            </div>
            <Progress value={summary.overallHitRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>
            Detailed performance statistics by data type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{summary.totalRequests}</p>
                <p className="text-sm text-gray-600">Total Requests</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{summary.totalHits}</p>
                <p className="text-sm text-gray-600">Cache Hits</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{summary.totalMisses}</p>
                <p className="text-sm text-gray-600">Cache Misses</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{summary.dataTypes.length}</p>
                <p className="text-sm text-gray-600">Data Types</p>
              </div>
            </div>

            {/* Data Type Breakdown */}
            <div className="space-y-3">
              <h4 className="font-medium">Performance by Data Type</h4>
              {metrics && metrics instanceof Map && Array.from(metrics.entries()).map(([dataType, metrics]) => {
                const hitRate = (metrics.hits / metrics.totalRequests) * 100;
                return (
                  <div key={dataType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getCacheStatusColor(hitRate)}>
                        {hitRate.toFixed(1)}%
                      </Badge>
                      <span className="font-medium capitalize">{dataType.replace('_', ' ')}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {metrics.totalRequests} requests • {metrics.averageResponseTime.toFixed(0)}ms avg
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Manage your local cache storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Metrics
            </Button>
            
            <Button
              onClick={handleExportMetrics}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Metrics
            </Button>
            
            <Button
              onClick={handleClearCache}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cache Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Cache Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Faster Loading</h4>
                <p className="text-sm text-gray-600">
                  Data loads instantly from local cache instead of waiting for Supabase
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Reduced API Calls</h4>
                <p className="text-sm text-gray-600">
                  Fewer requests to Supabase means better performance and lower costs
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Offline Support</h4>
                <p className="text-sm text-gray-600">
                  View cached data even when internet connection is poor
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Smart Invalidation</h4>
                <p className="text-sm text-gray-600">
                  Cache automatically updates when data changes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
