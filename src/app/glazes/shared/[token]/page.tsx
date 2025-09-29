'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Hash, 
  Palette,
  ArrowLeft,
  Home,
  Share2,
  AlertTriangle
} from 'lucide-react';
import { GlazeRecipe, Finish } from '@/types/glaze';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

const finishOptions: { value: Finish; label: string }[] = [
  { value: 'glossy', label: 'Glossy' },
  { value: 'matte', label: 'Matte' },
  { value: 'semi-matte', label: 'Semi-Matte' },
  { value: 'crystalline', label: 'Crystalline' },
  { value: 'raku', label: 'Raku' },
  { value: 'wood-fired', label: 'Wood-Fired' },
  { value: 'soda', label: 'Soda' },
];

export default function SharedGlazePage() {
  const { token } = useParams();
  const [glaze, setGlaze] = useState<GlazeRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (token) {
      loadSharedGlaze();
    }
  }, [token]);

  const loadSharedGlaze = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('glaze_recipes')
        .select('*')
        .eq('share_token', token)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Shared glaze recipe not found or link has expired');
        } else {
          throw error;
        }
      } else {
        // Convert the data to match our GlazeRecipe interface
        const glazeData: GlazeRecipe = {
          id: data.id,
          name: data.name,
          color: data.color,
          finish: data.finish,
          composition: data.composition || [],
          date: data.date,
          batchNumber: data.batch_number || '',
          photos: data.photos || [],
          clayBodyId: data.clay_body_id || '',
          firingAtmosphere: data.firing_atmosphere,
          share_token: data.share_token,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setGlaze(glazeData);
      }
    } catch (error) {
      console.error('Error loading shared glaze:', error);
      setError('Failed to load shared glaze recipe');
    } finally {
      setLoading(false);
    }
  };

  const getFinishColor = (finish: Finish) => {
    const colors = {
      glossy: 'bg-blue-100 text-blue-800',
      matte: 'bg-gray-100 text-gray-800',
      'semi-matte': 'bg-slate-100 text-slate-800',
      crystalline: 'bg-purple-100 text-purple-800',
      raku: 'bg-orange-100 text-orange-800',
      'wood-fired': 'bg-amber-100 text-amber-800',
      soda: 'bg-green-100 text-green-800',
    };
    return colors[finish] || colors.glossy;
  };

  const finishLabel = finishOptions.find(f => f.value === glaze?.finish)?.label || glaze?.finish;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
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

  if (!glaze) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Glaze recipe not found</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Palette className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">Glaze Recipes</span>
            </button>
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
              <span>Shared Glaze Recipe</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Share2 className="h-3 w-3 mr-1" />
              Shared
            </Badge>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="h-4 w-4" />
              Home
            </button>
          </div>
        </div>
      </div>

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
            <Palette className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{glaze.name}</h1>
              <p className="text-gray-600">Shared glaze recipe</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Photos and Basic Info */}
          <div className="space-y-6">
            {/* Photos */}
            {glaze.photos && glaze.photos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={glaze.photos[currentPhotoIndex]}
                        alt={`${glaze.name} - Photo ${currentPhotoIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {glaze.photos.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {glaze.photos.map((photo, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                              index === currentPhotoIndex 
                                ? 'border-blue-500' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={photo}
                              alt={`${glaze.name} - Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Color:</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: glaze.color }}
                    />
                    <span className="font-medium">{glaze.color}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Finish:</span>
                  <Badge className={getFinishColor(glaze.finish)}>
                    {finishLabel}
                  </Badge>
                </div>

                {glaze.firingAtmosphere && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Firing Atmosphere:</span>
                    <Badge variant="outline">
                      {glaze.firingAtmosphere}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="font-medium">{format(new Date(glaze.date), 'MMM dd, yyyy')}</span>
                </div>

                {glaze.batchNumber && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Batch:</span>
                    <span className="font-medium">{glaze.batchNumber}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Composition and Details */}
          <div className="space-y-6">
            {/* Composition */}
            <Card>
              <CardHeader>
                <CardTitle>Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {glaze.composition.map((comp, index) => (
                    <div key={comp.id || index} className="flex justify-between items-center">
                      <span className="font-medium">{comp.name}</span>
                      <span className="font-medium">{comp.percentage}%</span>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t mt-3">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total</span>
                      <span className="text-gray-600">
                        {glaze.composition.reduce((sum, comp) => sum + comp.percentage, 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shared Glaze Recipe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  This glaze recipe has been shared publicly. Anyone with this link can view the details.
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Share2 className="h-3 w-3 mr-1" />
                  Public Access
                </Badge>
                <div className="text-xs text-gray-500">
                  Created: {format(new Date(glaze.createdAt), 'MMM dd, yyyy')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
