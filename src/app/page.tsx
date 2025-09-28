'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Palette, Settings } from 'lucide-react';
import { GlazeRecipe } from '@/types/glaze';
import { getGlazeRecipes, deleteGlazeRecipe } from '@/lib/glaze-utils';
import { getSettings, isFirstLaunch } from '@/lib/settings-utils';
import CreateGlazeDialog from '@/components/CreateGlazeDialog';
import GlazeGallery from '@/components/GlazeGallery';
import ViewGlazeDialog from '@/components/ViewGlazeDialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [glazes, setGlazes] = useState<GlazeRecipe[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGlaze, setEditingGlaze] = useState<GlazeRecipe | null>(null);
  const [viewingGlaze, setViewingGlaze] = useState<GlazeRecipe | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [studioName, setStudioName] = useState('My Studio');

  useEffect(() => {
    setGlazes(getGlazeRecipes());
    const settings = getSettings();
    setStudioName(settings.studioName);
    
    // Redirect to settings if it's the first launch
    if (isFirstLaunch()) {
      router.push('/settings');
    }
  }, [router]);

  const handleGlazeCreated = (newGlaze: GlazeRecipe) => {
    setGlazes(prev => [...prev, newGlaze]);
  };

  const handleGlazeUpdated = (updatedGlaze: GlazeRecipe) => {
    setGlazes(prev => prev.map(glaze => 
      glaze.id === updatedGlaze.id ? updatedGlaze : glaze
    ));
    setEditingGlaze(null);
  };

  const handleEditGlaze = (glaze: GlazeRecipe) => {
    setEditingGlaze(glaze);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteGlaze = (glazeId: string) => {
    if (confirm('Are you sure you want to delete this glaze recipe?')) {
      deleteGlazeRecipe(glazeId);
      setGlazes(prev => prev.filter(glaze => glaze.id !== glazeId));
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      setEditingGlaze(null);
    }
  };

  const handleViewGlaze = (glaze: GlazeRecipe) => {
    setViewingGlaze(glaze);
    setIsViewDialogOpen(true);
  };

  const handleViewDialogClose = (open: boolean) => {
    setIsViewDialogOpen(open);
    if (!open) {
      setViewingGlaze(null);
    }
  };

  const handleEditFromView = (glaze: GlazeRecipe) => {
    setViewingGlaze(null);
    setIsViewDialogOpen(false);
    setEditingGlaze(glaze);
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 safe-area-inset">
      <div className="container mx-auto px-4 py-4 sm:py-8 mobile-scroll">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Palette className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              Glaze Recipes
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-4">
            Capture, organize, and manage your ceramic glaze recipes digitally. 
            Perfect for potters and ceramic artists.
          </p>
          <div className="flex items-center justify-center gap-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              Welcome to {studioName}
            </h2>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>


        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Create New Glaze
          </Button>
        </div>

        {/* Glaze Gallery */}
        <GlazeGallery 
          glazes={glazes} 
          onEditGlaze={handleEditGlaze}
          onDeleteGlaze={handleDeleteGlaze}
          onViewGlaze={handleViewGlaze}
        />

        {/* Create/Edit Glaze Dialog */}
        <CreateGlazeDialog
          open={isCreateDialogOpen}
          onOpenChange={handleDialogClose}
          onGlazeCreated={handleGlazeCreated}
          onGlazeUpdated={handleGlazeUpdated}
          editingGlaze={editingGlaze}
        />

        {/* View Glaze Dialog */}
        <ViewGlazeDialog
          open={isViewDialogOpen}
          onOpenChange={handleViewDialogClose}
          glaze={viewingGlaze}
          onEdit={handleEditFromView}
        />
      </div>
    </div>
  );
}
