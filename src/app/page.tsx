'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Palette, Menu, Mail, Settings, LogOut, Download, Zap } from 'lucide-react';
import { GlazeRecipe } from '@/types/glaze';
import { getGlazeRecipes, deleteGlazeRecipe } from '@/lib/supabase-utils';
import { getSettings, isFirstLaunch } from '@/lib/settings-utils';
import CreateGlazeDialog from '@/components/CreateGlazeDialog';
import GlazeGallery from '@/components/GlazeGallery';
import ViewGlazeDialog from '@/components/ViewGlazeDialog';
import SearchFilterPanel from '@/components/SearchFilterPanel';
import ExportDialog from '@/components/ExportDialog';
import ActiveFiringCard from '@/components/ActiveFiringCard';
import GlobalNavigation from '@/components/GlobalNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [glazes, setGlazes] = useState<GlazeRecipe[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGlaze, setEditingGlaze] = useState<GlazeRecipe | null>(null);
  const [viewingGlaze, setViewingGlaze] = useState<GlazeRecipe | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [studioName, setStudioName] = useState('My Studio');
  const [showFirstTimeBanner, setShowFirstTimeBanner] = useState(false);
  const [isFilterPanelCollapsed, setIsFilterPanelCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filteredGlazes, setFilteredGlazes] = useState<GlazeRecipe[]>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const glazesData = await getGlazeRecipes(user.id);
          setGlazes(glazesData);
          setFilteredGlazes(glazesData); // Initialize filtered glazes
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

  // Update filtered glazes when glazes change
  useEffect(() => {
    setFilteredGlazes(glazes);
  }, [glazes]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Global Navigation */}
      <GlobalNavigation studioName={studioName} />

      {/* Page Content Header */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
              Glaze Recipes
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Email Help Link */}
            <a
              href="mailto:koushik@studiogenki.in"
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email for help</span>
            </a>
            
            
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create New Glaze</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 lg:px-6 py-3">
        <h2 className="text-sm font-medium text-blue-800">
          Welcome to {studioName}
        </h2>
      </div>

      <div className="flex gap-6">
        {/* Desktop Search & Filter Panel */}
        <div className="hidden lg:block flex-shrink-0">
          <SearchFilterPanel 
            glazes={glazes}
            onFilteredGlazes={setFilteredGlazes}
            isCollapsed={isFilterPanelCollapsed}
            onToggleCollapse={() => setIsFilterPanelCollapsed(!isFilterPanelCollapsed)}
          />
        </div>

        {/* Mobile Search & Filter Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-80 p-4">
              <SearchFilterPanel 
                glazes={glazes}
                onFilteredGlazes={setFilteredGlazes}
                isCollapsed={false}
                onToggleCollapse={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">

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
                      Use the sidebar to manage your clay bodies and materials, then create your first glaze recipe.
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

            {/* Active Firing Session Card */}
            <div className="mb-6">
              <ActiveFiringCard />
            </div>

            {/* Glaze Gallery */}
            <GlazeGallery 
              glazes={filteredGlazes} 
              onEditGlaze={handleEditGlaze}
              onDeleteGlaze={handleDeleteGlaze}
              onViewGlaze={handleViewGlaze}
            />
          </div>
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

      {/* Export Dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        glazeRecipes={glazes}
        userId={user?.id || ''}
      />

    </div>
  );
}
