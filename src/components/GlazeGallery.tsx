'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Calendar, Hash, Palette, Edit, Trash2, Eye } from 'lucide-react';
import { GlazeRecipe, Finish } from '@/types/glaze';
import { getSettings } from '@/lib/settings-utils';
import { format } from 'date-fns';

interface GlazeGalleryProps {
  glazes: GlazeRecipe[];
  onEditGlaze?: (glaze: GlazeRecipe) => void;
  onDeleteGlaze?: (glazeId: string) => void;
  onViewGlaze?: (glaze: GlazeRecipe) => void;
}

const finishOptions: { value: Finish | 'all'; label: string }[] = [
  { value: 'all', label: 'All Finishes' },
  { value: 'glossy', label: 'Glossy' },
  { value: 'matte', label: 'Matte' },
  { value: 'semi-matte', label: 'Semi-Matte' },
  { value: 'crystalline', label: 'Crystalline' },
  { value: 'raku', label: 'Raku' },
  { value: 'wood-fired', label: 'Wood-Fired' },
  { value: 'soda', label: 'Soda' },
];

export default function GlazeGallery({ glazes, onEditGlaze, onDeleteGlaze, onViewGlaze }: GlazeGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFinish, setSelectedFinish] = useState<Finish | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'batch'>('date');
  const [clayBodies] = useState(getSettings().clayBodies);

  const filteredAndSortedGlazes = useMemo(() => {
    const filtered = glazes.filter(glaze => {
      const matchesSearch = glaze.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           glaze.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           glaze.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFinish = selectedFinish === 'all' || glaze.finish === selectedFinish;
      
      return matchesSearch && matchesFinish;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'batch':
          return a.batchNumber.localeCompare(b.batchNumber);
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return filtered;
  }, [glazes, searchTerm, selectedFinish, sortBy]);

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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFinish('all');
  };

  const hasActiveFilters = searchTerm || selectedFinish !== 'all';

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, color, or batch number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedFinish} onValueChange={(value) => setSelectedFinish(value as Finish | 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by finish" />
                </SelectTrigger>
                <SelectContent>
                  {finishOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'name' | 'batch')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="batch">Batch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: &quot;{searchTerm}&quot;
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {selectedFinish !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Finish: {finishOptions.find(f => f.value === selectedFinish)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => setSelectedFinish('all')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="ml-2"
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredAndSortedGlazes.length} of {glazes.length} glaze recipes
        </p>
      </div>

      {/* Glaze Cards */}
      {filteredAndSortedGlazes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Palette className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No glaze recipes found</h3>
            <p className="text-muted-foreground text-center">
              {hasActiveFilters 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first glaze recipe to get started.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredAndSortedGlazes.map((glaze) => (
            <Card key={glaze.id} className={`hover:shadow-lg transition-shadow mobile-card touch-manipulation ${glaze.photos && glaze.photos.length > 0 ? 'p-0' : ''}`}>
              {glaze.photos && glaze.photos.length > 0 && (
                <div className="aspect-square overflow-hidden rounded-t-lg relative">
                  <img
                    src={glaze.photos[0]}
                    alt={glaze.name}
                    className="w-full h-full object-cover"
                  />
                  {glaze.photos.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      +{glaze.photos.length - 1}
                    </div>
                  )}
                </div>
              )}
              <CardHeader className={glaze.photos && glaze.photos.length > 0 ? 'px-6 pt-6 pb-4' : ''}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{glaze.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      {glaze.color}
                    </CardDescription>
                  </div>
                  <Badge className={getFinishColor(glaze.finish)}>
                    {glaze.finish.replace('-', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className={`space-y-4 ${glaze.photos && glaze.photos.length > 0 ? 'px-6 pb-6' : ''}`}>
                {/* Batch Number and Date */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    {glaze.batchNumber}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(glaze.date), 'MMM dd, yyyy')}
                  </div>
                </div>

                {/* Clay Body */}
                {(() => {
                  const clayBody = clayBodies.find(cb => cb.id === glaze.clayBodyId);
                  return clayBody ? (
                    <div className="text-sm">
                      <span className="font-medium">Clay Body:</span> {clayBody.name} ({clayBody.color} - {clayBody.shrinkage}% shrinkage)
                    </div>
                  ) : null;
                })()}

                {/* Composition */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Composition</h4>
                  <div className="space-y-1">
                    {glaze.composition.map((comp, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{comp.name}</span>
                        <span className="font-medium">{comp.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Percentage Check */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total</span>
                    <span className="text-muted-foreground">
                      {glaze.composition.reduce((sum, comp) => sum + comp.percentage, 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {(onViewGlaze || onEditGlaze || onDeleteGlaze) && (
                  <div className="pt-3 border-t">
                    <div className="flex gap-2">
                      {onViewGlaze && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewGlaze(glaze)}
                          className="flex-1 flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      )}
                      {onEditGlaze && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditGlaze(glaze)}
                          className="flex-1 flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                      {onDeleteGlaze && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteGlaze(glaze.id)}
                          className="px-3 text-red-600 hover:text-red-700 hover:border-red-300"
                          title="Delete recipe"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
