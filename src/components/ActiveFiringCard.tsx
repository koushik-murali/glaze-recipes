'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Play, 
  Pause, 
  Clock, 
  Thermometer, 
  Timer,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LiveFiringSession {
  id: string;
  kilnId: string;
  kilnName: string;
  firingType: string;
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
  rampRate?: number;
}

export default function ActiveFiringCard() {
  const [session, setSession] = useState<LiveFiringSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const router = useRouter();

  useEffect(() => {
    // Load saved session from localStorage
    const savedSession = localStorage.getItem('liveFiringSession');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        // Convert date strings back to Date objects
        parsedSession.startTime = new Date(parsedSession.startTime);
        parsedSession.intervals = parsedSession.intervals.map((interval: any) => ({
          ...interval,
          timestamp: new Date(interval.timestamp)
        }));
        setSession(parsedSession);
      } catch (error) {
        console.error('Error loading saved session:', error);
        localStorage.removeItem('liveFiringSession');
      }
    }
  }, []);

  useEffect(() => {
    if (!session) return;

    const updateElapsedTime = () => {
      const elapsed = new Date().getTime() - new Date(session.startTime).getTime();
      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
      
      setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    const interval = setInterval(updateElapsedTime, 1000);
    updateElapsedTime(); // Initial call

    return () => clearInterval(interval);
  }, [session]);

  if (!session) {
    return null; // Don't render anything if no active session
  }

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

  const getConeFromTemp = (temp: number): string => {
    // Official Orton cone chart temperatures
    if (temp >= 1285) return '10';
    if (temp >= 1260) return '09';
    if (temp >= 1250) return '08';
    if (temp >= 1240) return '07';
    if (temp >= 1222) return '06';
    if (temp >= 1186) return '05';
    if (temp >= 1162) return '04';
    if (temp >= 1152) return '03';
    if (temp >= 1142) return '02';
    if (temp >= 1137) return '01';
    if (temp >= 1119) return '1';
    if (temp >= 1102) return '2';
    if (temp >= 1086) return '3';
    if (temp >= 1063) return '4';
    if (temp >= 1031) return '5';
    if (temp >= 998) return '6';
    if (temp >= 976) return '7';
    if (temp >= 942) return '8';
    if (temp >= 920) return '9';
    if (temp >= 902) return '10';
    if (temp >= 875) return '011';
    if (temp >= 861) return '012';
    if (temp >= 837) return '013';
    if (temp >= 807) return '014';
    if (temp >= 791) return '015';
    if (temp >= 772) return '016';
    if (temp >= 738) return '017';
    if (temp >= 715) return '018';
    if (temp >= 678) return '019';
    if (temp >= 626) return '020';
    if (temp >= 600) return '021';
    if (temp >= 586) return '022';
    return 'Unknown';
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Zap className="h-5 w-5" />
          Active Firing Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Info */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{session.kilnName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getFiringTypeColor(session.firingType)}>
                {session.firingType}
              </Badge>
              <Badge variant={session.isActive ? "default" : "secondary"}>
                {session.isActive ? 'Active' : 'Paused'}
              </Badge>
            </div>
          </div>
          <Button
            onClick={() => router.push('/firing-logs/new')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Continue
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Timer className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-600">Elapsed</span>
            </div>
            <p className="text-sm font-medium">{elapsedTime}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Thermometer className="h-4 w-4 text-red-600" />
              <span className="text-xs text-gray-600">Current</span>
            </div>
            <p className="text-sm font-medium">{session.currentTemperature}°C</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-600">Target</span>
            </div>
            <p className="text-sm font-medium">
              Cone {getConeFromTemp(session.targetTemperature)}
            </p>
          </div>
        </div>

        {/* Progress Info */}
        <div className="bg-white rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Temperature Logs:</span>
            <span className="font-medium">{session.intervals.length} readings</span>
          </div>
          {session.intervals.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Reading:</span>
              <span className="font-medium">
                {new Date(session.intervals[session.intervals.length - 1].timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Status Message */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {session.isActive 
              ? 'Firing is actively running. Click Continue to manage the session.'
              : 'Firing is paused. Click Continue to resume.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
