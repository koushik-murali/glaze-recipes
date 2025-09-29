'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  X, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  Hash, 
  Palette 
} from 'lucide-react';
import { GlazeRecipe, Finish } from '@/types/glaze';

interface SearchFilterPanelProps {
  glazes: GlazeRecipe[];
  onFilteredGlazes: (glazes: GlazeRecipe[]) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const finishOptions: { value: Finish | 'all' | 'none'; label: string }[] = [
  { value: 'all', label: 'All Finishes' },
  { value: 'none', label: 'None' },
  { value: 'glossy', label: 'Glossy' },
  { value: 'matte', label: 'Matte' },
  { value: 'semi-matte', label: 'Semi-Matte' },
  { value: 'crystalline', label: 'Crystalline' },
  { value: 'raku', label: 'Raku' },
  { value: 'wood-fired', label: 'Wood-Fired' },
  { value: 'soda', label: 'Soda' },
];

export default function SearchFilterPanel({ 
  glazes, 
  onFilteredGlazes, 
  isCollapsed, 
  onToggleCollapse 
}: SearchFilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFinish, setSelectedFinish] = useState<Finish | 'all' | 'none'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'batch'>('date');

  // Filter and sort glazes
  const filterAndSortGlazes = () => {
    const filtered = glazes.filter(glaze => {
      const matchesSearch = glaze.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           glaze.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           glaze.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFinish = true;
      if (selectedFinish === 'none') {
        matchesFinish = !glaze.finish;
      } else if (selectedFinish !== 'all') {
        matchesFinish = glaze.finish === selectedFinish;
      }
      
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

    onFilteredGlazes(filtered);
  };

  // Update filtered glazes whenever filters change
  useEffect(() => {
    filterAndSortGlazes();
  }, [glazes, searchTerm, selectedFinish, sortBy]);

  const hasActiveFilters = searchTerm || selectedFinish !== 'all';


  if (isCollapsed) {
    return (
      <Card className="w-16 mx-4 my-4">
        <CardContent className="p-4 flex flex-col items-center space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-full hover:bg-gray-100"
            title="Expand Search & Filter"
          >
            <Search className="h-5 w-5 text-blue-600" />
          </Button>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
              {glazes.length}
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-4 my-4 w-80">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-xl">Search & Filter</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Search and Filters */}
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, color, or batch number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Finish Filter */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">Finish Type</label>
                      <Select value={selectedFinish} onValueChange={(value) => setSelectedFinish(value as Finish | 'all' | 'none')}>
            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-gray-500" />
                <SelectValue placeholder="Filter by finish" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {finishOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Options */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">Sort by</label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'name' | 'batch')}>
            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-gray-500" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">
                Date (Newest First)
              </SelectItem>
              <SelectItem value="name">
                Name (A-Z)
              </SelectItem>
              <SelectItem value="batch">
                Batch Number
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                <Filter className="h-4 w-4" />
                Active Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-2 w-fit bg-blue-100 text-blue-800 hover:bg-blue-200">
                  Search: &quot;{searchTerm}&quot;
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {selectedFinish !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-2 w-fit bg-green-100 text-green-800 hover:bg-green-200">
                  Finish: {finishOptions.find(f => f.value === selectedFinish)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => setSelectedFinish('all')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
