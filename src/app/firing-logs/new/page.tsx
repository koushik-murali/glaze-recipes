'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, Palette } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LiveFiringTracker from '@/components/LiveFiringTracker';
import GlobalNavigation from '@/components/GlobalNavigation';
import { toast } from 'sonner';

export default function NewFiringLogPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [kilns, setKilns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadKilns();
    }
  }, [user]);

  const loadKilns = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kilns')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setKilns(data || []);
    } catch (error) {
      console.error('Error loading kilns:', error);
      toast.error('Failed to load kilns');
    } finally {
      setLoading(false);
    }
  };

  const handleLiveSessionComplete = (session: any) => {
    toast.success('Live firing session completed and saved!');
    // Use window.location.href to force a full page reload and refresh the firing logs list
    window.location.href = '/firing-logs';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Navigation */}
      <GlobalNavigation />

      <div className="max-w-4xl mx-auto p-6">
        {/* Page Header - Mobile Optimized */}
        <div className="space-y-4 mb-6">
          {/* Back Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/firing-logs')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Firing Logs
          </Button>
          
          {/* Title Section */}
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">New Firing Log</h1>
          </div>
        </div>

        {kilns.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No kilns available</h3>
            <p className="text-gray-600 mb-6">
              You need to add kilns in Settings before creating firing logs.
            </p>
            <Button onClick={() => router.push('/settings')}>
              Go to Settings
            </Button>
          </div>
        ) : (
          <LiveFiringTracker
            userId={user?.id || ''}
            kilns={kilns}
            onSessionComplete={handleLiveSessionComplete}
          />
        )}
      </div>
    </div>
  );
}
