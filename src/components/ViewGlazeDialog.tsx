'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Calendar, Hash, Palette } from 'lucide-react';
import { GlazeRecipe, Finish } from '@/types/glaze';
import { getSettings } from '@/lib/settings-utils';
import { format } from 'date-fns';

interface ViewGlazeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  glaze: GlazeRecipe | null;
  onEdit?: (glaze: GlazeRecipe) => void;
}

const finishOptions: { value: Finish; label: string }[] = [
  { value: 'glossy', label: 'Glossy' },
  { value: 'matte', label: 'Matte' },
  { value: 'semi-matte', label: 'Semi-Matte' },
  { value: 'crystalline', label: 'Crystalline' },
  { value: 'raku', label: 'Raku' },
  { value: 'wood-fired', label: 'Wood-Fired' },
  { value: 'soda', label: 'Soda' },
];

export default function ViewGlazeDialog({ open, onOpenChange, glaze, onEdit }: ViewGlazeDialogProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const settings = getSettings();
  
  if (!glaze) return null;

  const clayBody = settings.clayBodies.find(cb => cb.id === glaze.clayBodyId);
  const finishLabel = finishOptions.find(f => f.value === glaze.finish)?.label || glaze.finish;

  const getFinishColor = (finish: Finish) => {
    const colors = {
      glossy: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      matte: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'semi-matte': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
      crystalline: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      raku: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'wood-fired': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      soda: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[finish] || colors.glossy;
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{glaze.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-2">
                <Palette className="h-4 w-4" />
                {glaze.color}
              </DialogDescription>
            </div>
            {onEdit && (
              <Button onClick={() => onEdit(glaze)} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Recipe
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photos Section */}
          {glaze.photos && glaze.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Photos ({glaze.photos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="aspect-video overflow-hidden rounded-lg">
                    <img
                      src={glaze.photos[currentPhotoIndex]}
                      alt={`${glaze.name} - Photo ${currentPhotoIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {glaze.photos.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded">
                      {currentPhotoIndex + 1} / {glaze.photos.length}
                    </div>
                  )}
                </div>
                
                {/* Photo Thumbnails */}
                {glaze.photos.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto">
                    {glaze.photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                          index === currentPhotoIndex ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recipe Details */}
          <div className="grid grid-cols-1 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Recipe Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Finish</span>
                  <Badge className={getFinishColor(glaze.finish)}>
                    {finishLabel}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Batch:</span>
                  <span className="font-medium">{glaze.batchNumber}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="font-medium">{format(new Date(glaze.date), 'MMM dd, yyyy')}</span>
                </div>

                {clayBody && (
                  <div className="pt-2 border-t">
                    <div className="text-sm text-muted-foreground mb-1">Clay Body</div>
                    <div className="font-medium">{clayBody.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {clayBody.color} • {clayBody.shrinkage}% shrinkage
                    </div>
                    {clayBody.notes && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {clayBody.notes}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Composition */}
            <Card>
              <CardHeader>
                <CardTitle>Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {glaze.composition.map((comp, index) => (
                    <div key={index} className="flex justify-between items-center py-1">
                      <span className="text-sm">{comp.name}</span>
                      <span className="font-medium">{comp.percentage}%</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-3 border-t mt-3">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total</span>
                    <span className="text-muted-foreground">
                      {glaze.composition.reduce((sum, comp) => sum + comp.percentage, 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
