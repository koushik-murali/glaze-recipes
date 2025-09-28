'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Palette } from 'lucide-react';
import { GlazeRecipe } from '@/types/glaze';
import { getGlazeRecipes, deleteGlazeRecipe } from '@/lib/supabase-utils';
import { getSettings, isFirstLaunch } from '@/lib/settings-utils';
import CreateGlazeDialog from '@/components/CreateGlazeDialog';
import GlazeGallery from '@/components/GlazeGallery';
import ViewGlazeDialog from '@/components/ViewGlazeDialog';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">
                Glaze Recipes
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-slate-700">
                Welcome to {studioName}
              </h2>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center gap-2"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                Create New Glaze
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">


          {/* First Time Banner */}
          {showFirstTimeBanner && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Palette className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-800">
                    Welcome to Glaze Recipes!
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Use the left sidebar to manage your clay bodies and materials, then create your first glaze recipe.
                  </p>
                  <div className="mt-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowFirstTimeBanner(false)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Glaze Gallery */}
          <GlazeGallery 
            glazes={glazes} 
            onEditGlaze={handleEditGlaze}
            onDeleteGlaze={handleDeleteGlaze}
            onViewGlaze={handleViewGlaze}
          />
        </div>
      </div>

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
  );
}
