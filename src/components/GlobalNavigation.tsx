'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Home, 
  Settings, 
  Zap,
  Play,
  Thermometer,
  Clock,
  Target,
  LogOut
} from 'lucide-react';
import { LiveFiringSession } from '@/types/firing';
import { useAuth } from '@/contexts/AuthContext';

interface GlobalNavigationProps {
  studioName?: string;
}

export default function GlobalNavigation({ studioName = "Studio" }: GlobalNavigationProps) {
  const pathname = usePathname();
  const [activeSession, setActiveSession] = useState<LiveFiringSession | null>(null);
  const { signOut } = useAuth();

  // Load active session from localStorage
  useEffect(() => {
    const loadActiveSession = () => {
      try {
        const stored = localStorage.getItem('liveFiringSession');
        if (stored) {
          const session = JSON.parse(stored);
          if (session && session.isActive) {
            // Parse dates back to Date objects
            session.startTime = new Date(session.startTime);
            session.lastUpdate = new Date(session.lastUpdate);
            setActiveSession(session);
          } else {
            setActiveSession(null);
          }
        } else {
          setActiveSession(null);
        }
      } catch (error) {
        console.error('Error loading active session:', error);
        setActiveSession(null);
      }
    };

    loadActiveSession();
    
    // Listen for storage changes (when session is updated in another tab)
    const handleStorageChange = () => {
      loadActiveSession();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case localStorage is updated by the same tab
    const interval = setInterval(loadActiveSession, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const getConeFromTemp = (temp: number) => {
    const cones = [
      { cone: '04', temp: 1060 },
      { cone: '05', temp: 1046 },
      { cone: '06', temp: 999 },
      { cone: '07', temp: 960 },
      { cone: '08', temp: 921 },
      { cone: '09', temp: 900 },
      { cone: '10', temp: 891 }
    ];
    
    const cone = cones.find(c => Math.abs(c.temp - temp) < 20);
    return cone ? `Cone ${cone.cone}` : `${temp}°C`;
  };

  const formatElapsedTime = (startTime: Date) => {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Palette className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">{studioName}</span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href="/" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              
              <Link 
                href="/firing-logs" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith('/firing-logs') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>Firing Logs</span>
              </Link>
              
              <Link 
                href="/settings" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/settings' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </div>
          </div>

          {/* Active firing status and actions */}
          <div className="flex items-center space-x-4">
            {activeSession && (
              <Card className="px-4 py-2 bg-orange-50 border-orange-200">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Play className="h-4 w-4 text-orange-600" />
                    <Badge variant="outline" className="text-orange-700 border-orange-300">
                      {activeSession.isActive ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                  
                  <div className="hidden sm:flex items-center space-x-2 text-sm">
                    <div className="flex items-center space-x-1">
                      <Thermometer className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-700">
                        {activeSession.currentTemperature}°C
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Target className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-700">
                        {getConeFromTemp(activeSession.targetTemperature)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-700">
                        {formatElapsedTime(activeSession.startTime)}
                      </span>
                    </div>
                  </div>
                  
                  <Link href="/firing-logs/new">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      {activeSession.isActive ? 'Continue' : 'Resume'}
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            <Button 
              variant="outline" 
              size="sm"
              onClick={signOut}
              className="flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden border-t border-gray-200 py-2">
          <div className="flex items-center justify-around">
            <Link 
              href="/" 
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                pathname === '/' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            
            <Link 
              href="/firing-logs" 
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                pathname.startsWith('/firing-logs') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>Firing Logs</span>
            </Link>
            
            <Link 
              href="/settings" 
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                pathname === '/settings' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
