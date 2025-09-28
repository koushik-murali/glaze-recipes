'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Palette, Settings, User } from 'lucide-react';
import { GlazeRecipe } from '@/types/glaze';
import { getGlazeRecipes, deleteGlazeRecipe } from '@/lib/supabase-utils';
import { getSettings, isFirstLaunch } from '@/lib/settings-utils';
import CreateGlazeDialog from '@/components/CreateGlazeDialog';
import GlazeGallery from '@/components/GlazeGallery';
import ViewGlazeDialog from '@/components/ViewGlazeDialog';
import UserProfile from '@/components/UserProfile';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [glazes, setGlazes] = useState<GlazeRecipe[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGlaze, setEditingGlaze] = useState<GlazeRecipe | null>(null);
  const [viewingGlaze, setViewingGlaze] = useState<GlazeRecipe | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [studioName, setStudioName] = useState('My Studio');
  const [showFirstTimeBanner, setShowFirstTimeBanner] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const glazesData = await getGlazeRecipes(user.id);
          setGlazes(glazesData);
        } catch (error) {
          console.error('Error loading glazes:', error);
        }
      }
      const settings = getSettings();
      setStudioName(settings.studioName || 'My Studio');
      setShowFirstTimeBanner(isFirstLaunch());
    };
    
    loadData();
  }, [user]);

  const handleGlazeCreated = (newGlaze: GlazeRecipe) => {
    console.log('Glaze created callback called with:', newGlaze);
    setGlazes(prev => {
      const updated = [...prev, newGlaze];
      console.log('Updated glazes array:', updated);
      return updated;
    });
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

  const handleDeleteGlaze = async (glazeId: string) => {
    if (confirm('Are you sure you want to delete this glaze recipe?') && user) {
      try {
        await deleteGlazeRecipe(glazeId, user.id);
        setGlazes(prev => prev.filter(glaze => glaze.id !== glazeId));
      } catch (error) {
        console.error('Error deleting glaze:', error);
      }
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
        <div className="mb-8">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Palette className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                Glaze Recipes
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <UserProfile onSettingsClick={() => router.push('/settings')} />
              <Link href="/settings">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Welcome Section */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Welcome to {studioName}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Capture, organize, and manage your ceramic glaze recipes digitally. 
              Perfect for potters and ceramic artists.
            </p>
          </div>
        </div>


        {/* First Time Banner */}
        {showFirstTimeBanner && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Welcome to Glaze Recipes!
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Set up your studio name and add clay bodies to get started with creating glaze recipes.
                </p>
                <div className="mt-3">
                  <Link href="/settings">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Go to Settings
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowFirstTimeBanner(false)}
                    className="ml-2"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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
