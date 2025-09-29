'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Settings, ArrowLeft, Edit, BarChart3, Pencil, Zap, Download } from 'lucide-react';
import Link from 'next/link';
import { StudioSettings } from '@/types/settings';
import { getSettings, updateStudioName, addRawMaterial, updateRawMaterial, deleteRawMaterial, getAllBaseMaterialTypes, addClayBody, updateClayBody, deleteClayBody } from '@/lib/settings-utils';
import { getGlazeRecipes } from '@/lib/glaze-utils';
import { getGlazeRecipesCached, getClayBodiesCached, getRawMaterialsCached, addClayBodyCached, deleteClayBodyCached, addRawMaterialCached, deleteRawMaterialCached } from '@/lib/cached-supabase-utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import GlobalNavigation from '@/components/GlobalNavigation';
import CacheManagement from '@/components/CacheManagement';

const studioNameSchema = z.object({
  studioName: z.string().min(1, 'Studio name is required'),
});

const rawMaterialSchema = z.object({
  name: z.string().min(1, 'Material name is required'),
  baseMaterialType: z.string().min(1, 'Base material type is required'),
  description: z.string().optional(),
});

const clayBodySchema = z.object({
  name: z.string().min(1, 'Clay body name is required'),
  shrinkage: z.number().min(0, 'Shrinkage must be 0 or greater').max(100, 'Shrinkage cannot exceed 100%'),
  color: z.string().min(1, 'Color is required'),
  notes: z.string().optional(),
});

const kilnSchema = z.object({
  name: z.string().min(1, 'Kiln name is required'),
  max_temperature: z.number().min(500, 'Max temperature must be at least 500°C').max(2000, 'Max temperature cannot exceed 2000°C'),
  type: z.enum(['electric', 'gas', 'wood', 'raku', 'other']),
  notes: z.string().optional(),
});

type StudioNameFormData = z.infer<typeof studioNameSchema>;
type RawMaterialFormData = z.infer<typeof rawMaterialSchema>;
type ClayBodyFormData = z.infer<typeof clayBodySchema>;
type KilnFormData = z.infer<typeof kilnSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<StudioSettings>(getSettings());
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [isAddingClayBody, setIsAddingClayBody] = useState(false);
  const [editingClayBody, setEditingClayBody] = useState<string | null>(null);
  const [isEditingStudioName, setIsEditingStudioName] = useState(false);
  const [glazes, setGlazes] = useState(getGlazeRecipes());
  const baseMaterialTypes = getAllBaseMaterialTypes();
  
  // Kiln management state
  const [kilns, setKilns] = useState<any[]>([]);
  const [isAddingKiln, setIsAddingKiln] = useState(false);
  const [editingKiln, setEditingKiln] = useState<string | null>(null);

  const studioNameForm = useForm<StudioNameFormData>({
    resolver: zodResolver(studioNameSchema),
    defaultValues: {
      studioName: settings.studioName,
    },
  });

  const rawMaterialForm = useForm<RawMaterialFormData>({
    resolver: zodResolver(rawMaterialSchema),
    defaultValues: {
      name: '',
      baseMaterialType: '',
      description: '',
    },
  });

  const clayBodyForm = useForm<ClayBodyFormData>({
    resolver: zodResolver(clayBodySchema),
    defaultValues: {
      name: '',
      shrinkage: 0,
      color: '',
      notes: '',
    },
  });

  const kilnForm = useForm<KilnFormData>({
    resolver: zodResolver(kilnSchema),
    defaultValues: {
      name: '',
      max_temperature: 1000,
      type: 'electric',
      notes: '',
    },
  });

  useEffect(() => {
    const currentSettings = getSettings();
    setSettings(currentSettings);
    setGlazes(getGlazeRecipes());
    studioNameForm.reset({ studioName: currentSettings.studioName });
    
    // Load kilns
    if (user) {
      loadKilns();
    }
  }, [studioNameForm, user]);

  const loadKilns = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('kilns')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setKilns(data || []);
    } catch (error) {
      console.error('Error loading kilns:', error);
    }
  };

  const onStudioNameSubmit = (data: StudioNameFormData) => {
    updateStudioName(data.studioName);
    setSettings(getSettings());
    setIsEditingStudioName(false);
  };

  const handleEditStudioName = () => {
    setIsEditingStudioName(true);
    studioNameForm.reset({ studioName: settings.studioName });
  };

  const handleCancelEditStudioName = () => {
    setIsEditingStudioName(false);
    studioNameForm.reset({ studioName: settings.studioName });
  };

  const onRawMaterialSubmit = (data: RawMaterialFormData) => {
    if (editingMaterial) {
      updateRawMaterial(editingMaterial, data);
      setEditingMaterial(null);
    } else {
      addRawMaterial(data);
    }
    setSettings(getSettings());
    rawMaterialForm.reset();
    setIsAddingMaterial(false);
  };

  const handleDeleteMaterial = (id: string) => {
    deleteRawMaterial(id);
    setSettings(getSettings());
  };

  const handleEditMaterial = (material: { id: string; name: string; baseMaterialType: string; description?: string }) => {
    setEditingMaterial(material.id);
    rawMaterialForm.reset({
      name: material.name,
      baseMaterialType: material.baseMaterialType,
      description: material.description || '',
    });
    setIsAddingMaterial(true);
  };

  const handleCancelMaterial = () => {
    setIsAddingMaterial(false);
    setEditingMaterial(null);
    rawMaterialForm.reset();
  };

  const onClayBodySubmit = (data: ClayBodyFormData) => {
    if (editingClayBody) {
      updateClayBody(editingClayBody, data);
      setEditingClayBody(null);
    } else {
      addClayBody(data);
    }
    setSettings(getSettings());
    clayBodyForm.reset();
    setIsAddingClayBody(false);
  };

  const handleEditClayBody = (clayBody: { id: string; name: string; shrinkage: number; color: string; notes?: string }) => {
    setEditingClayBody(clayBody.id);
    clayBodyForm.reset({
      name: clayBody.name,
      shrinkage: clayBody.shrinkage,
      color: clayBody.color,
      notes: clayBody.notes || '',
    });
    setIsAddingClayBody(true);
  };

  const handleDeleteClayBody = (id: string) => {
    deleteClayBody(id);
    setSettings(getSettings());
  };

  const handleCancelClayBody = () => {
    setIsAddingClayBody(false);
    setEditingClayBody(null);
    clayBodyForm.reset();
  };

  // Kiln management functions
  const onKilnSubmit = async (data: KilnFormData) => {
    if (!user) return;
    
    try {
      if (editingKiln) {
        const { error } = await supabase
          .from('kilns')
          .update(data)
          .eq('id', editingKiln)
          .eq('user_id', user.id);
        
        if (error) throw error;
        setEditingKiln(null);
      } else {
        const { error } = await supabase
          .from('kilns')
          .insert({
            ...data,
            user_id: user.id,
          });
        
        if (error) throw error;
      }
      
      await loadKilns();
      kilnForm.reset();
      setIsAddingKiln(false);
    } catch (error) {
      console.error('Error saving kiln:', error);
      alert('Error saving kiln: ' + (error as Error).message);
    }
  };

  const handleEditKiln = (kiln: any) => {
    setEditingKiln(kiln.id);
    kilnForm.reset({
      name: kiln.name,
      max_temperature: kiln.max_temperature,
      type: kiln.type,
      notes: kiln.notes || '',
    });
    setIsAddingKiln(true);
  };

  const handleDeleteKiln = async (id: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this kiln?')) return;
    
    try {
      const { error } = await supabase
        .from('kilns')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await loadKilns();
    } catch (error) {
      console.error('Error deleting kiln:', error);
      alert('Error deleting kiln: ' + (error as Error).message);
    }
  };

  const handleCancelKiln = () => {
    setIsAddingKiln(false);
    setEditingKiln(null);
    kilnForm.reset();
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      clay: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      feldspar: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      silica: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      flux: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      oxide: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      frit: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      other: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  // Export functions
  const exportGlazes = async () => {
    if (!user) return;
    
    try {
      const glazesData = await getGlazeRecipesCached(user.id);
      const csvData = glazesData.map(glaze => ({
        'Name': glaze.name,
        'Color': glaze.color,
        'Finish': glaze.finish,
        'Batch Number': glaze.batchNumber,
        'Date': glaze.date,
        'Firing Atmosphere': glaze.firingAtmosphere || '',
        'Composition': glaze.composition.map(comp => `${comp.name}: ${comp.percentage}%`).join('; '),
        'Clay Body': glaze.clayBodyId,
        'Photos': glaze.photos ? glaze.photos.length : 0,
        'Created': glaze.createdAt,
        'Updated': glaze.updatedAt,
      }));

      const csvContent = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `glaze-recipes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Glaze recipes exported successfully!');
    } catch (error) {
      console.error('Error exporting glazes:', error);
      toast.error('Failed to export glaze recipes');
    }
  };

  const exportFiringLogs = async () => {
    if (!user) return;
    
    try {
      const { data: firingLogs, error } = await supabase
        .from('firing_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const csvData = firingLogs.map(log => ({
        'Date': log.date,
        'Kiln': log.kiln_name,
        'Type': log.firing_type,
        'Target Temp': log.target_temperature,
        'Actual Temp': log.actual_temperature,
        'Duration (hrs)': log.firing_duration_hours,
        'Ramp Rate': log.ramp_rate,
        'Notes': log.notes || '',
        'Warnings': log.warning_flags?.length || 0,
      }));

      const csvContent = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `firing-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Firing logs exported successfully!');
    } catch (error) {
      console.error('Error exporting firing logs:', error);
      toast.error('Failed to export firing logs');
    }
  };

  const exportAllData = async () => {
    if (!user) return;
    
    try {
      // Get all data
      const glazesData = await getGlazeRecipesCached(user.id);
      const { data: firingLogs } = await supabase
        .from('firing_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Get kilns
      const { data: kilnsData } = await supabase
        .from('kilns')
        .select('*')
        .eq('user_id', user.id);

      // Get settings
      const settingsData = getSettings();

      // Create comprehensive export
      const exportData = {
        exportDate: new Date().toISOString(),
        studioName: settingsData.studioName,
        settings: settingsData,
        glazeRecipes: glazesData,
        firingLogs: firingLogs || [],
        kilns: kilnsData || [],
        rawMaterials: settingsData.rawMaterials,
        clayBodies: settingsData.clayBodies,
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `studio-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Complete studio data exported successfully!');
    } catch (error) {
      console.error('Error exporting all data:', error);
      toast.error('Failed to export studio data');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 safe-area-inset">
      {/* Global Navigation */}
      <GlobalNavigation studioName={settings.studioName} />
      
      <div className="container mx-auto px-4 py-4 sm:py-8 mobile-scroll">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              Settings
            </h1>
          </div>
        </div>

        <div className="space-y-8">
          {/* Dashboard Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dashboard
              </CardTitle>
              <CardDescription>
                Overview of your glaze recipes and studio statistics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{glazes.length}</div>
                  <p className="text-sm text-muted-foreground">Total Recipes</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {glazes.filter(glaze => {
                      const glazeDate = new Date(glaze.date);
                      const now = new Date();
                      return glazeDate.getMonth() === now.getMonth() && 
                             glazeDate.getFullYear() === now.getFullYear();
                    }).length}
                  </div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {new Set(glazes.map(glaze => glaze.finish)).size}
                  </div>
                  <p className="text-sm text-muted-foreground">Unique Finishes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Export
              </CardTitle>
              <CardDescription>
                Export your studio data for backup or analysis purposes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline"
                  onClick={exportGlazes}
                  className="flex items-center gap-2 h-auto py-4 flex-col"
                >
                  <Download className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Export Glaze Recipes</div>
                    <div className="text-sm text-muted-foreground">CSV format</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={exportFiringLogs}
                  className="flex items-center gap-2 h-auto py-4 flex-col"
                >
                  <Download className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Export Firing Logs</div>
                    <div className="text-sm text-muted-foreground">CSV format</div>
                  </div>
                </Button>
                
                <Button 
                  onClick={exportAllData}
                  className="flex items-center gap-2 h-auto py-4 flex-col"
                >
                  <Download className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Export All Data</div>
                    <div className="text-sm text-muted-foreground">Complete backup (JSON)</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Studio Name Section */}
          <Card>
            <CardHeader>
              <CardTitle>Studio Information</CardTitle>
              <CardDescription>
                Set your studio name which will be displayed in the welcome message.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isEditingStudioName ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Studio Name</Label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{settings.studioName}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleEditStudioName}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Form {...studioNameForm}>
                  <form onSubmit={studioNameForm.handleSubmit(onStudioNameSubmit)} className="space-y-4">
                    <FormField
                      control={studioNameForm.control}
                      name="studioName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Studio Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your studio name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button type="submit">Save</Button>
                      <Button type="button" variant="outline" onClick={handleCancelEditStudioName}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {/* Raw Materials Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Raw Materials</CardTitle>
                  <CardDescription>
                    Manage the raw materials available in your studio.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddingMaterial(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Material
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add/Edit Material Form */}
              {isAddingMaterial && (
                <Card className="border-2 border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        {editingMaterial ? 'Edit Material' : 'Add New Material'}
                      </h3>
                    </div>
                    <Form {...rawMaterialForm}>
                      <form onSubmit={rawMaterialForm.handleSubmit(onRawMaterialSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={rawMaterialForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Material Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Than Clay" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={rawMaterialForm.control}
                            name="baseMaterialType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Base Material Type</FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    <Input 
                                      placeholder="e.g., Fire Clay" 
                                      {...field}
                                      list="base-materials"
                                    />
                                    <datalist id="base-materials">
                                      {baseMaterialTypes.map((material) => (
                                        <option key={material.id} value={material.name}>
                                          {material.name} - {material.description}
                                        </option>
                                      ))}
                                    </datalist>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={rawMaterialForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Additional notes about this material" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button type="submit">
                            {editingMaterial ? 'Update Material' : 'Add Material'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelMaterial}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Materials List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Your Materials ({settings.rawMaterials.length})</h3>
                {settings.rawMaterials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No materials added yet. Add your first material to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {settings.rawMaterials.map((material) => {
                      const baseType = baseMaterialTypes.find(bt => bt.name === material.baseMaterialType);
                      return (
                        <Card key={material.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">{material.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {material.baseMaterialType}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditMaterial(material)}
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteMaterial(material.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {baseType && (
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(baseType.category)}`}>
                                  {baseType.category}
                                </span>
                              </div>
                            )}
                            {material.description && (
                              <p className="text-sm text-muted-foreground">
                                {material.description}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Clay Bodies Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Clay Bodies</CardTitle>
                  <CardDescription>
                    Manage the clay bodies available in your studio.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddingClayBody(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Clay Body
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add/Edit Clay Body Form */}
              {isAddingClayBody && (
                <Card className="border-2 border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        {editingClayBody ? 'Edit Clay Body' : 'Add New Clay Body'}
                      </h3>
                    </div>
                    <Form {...clayBodyForm}>
                      <form onSubmit={clayBodyForm.handleSubmit(onClayBodySubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={clayBodyForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Clay Body Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Stoneware Red" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={clayBodyForm.control}
                            name="shrinkage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Shrinkage (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    placeholder="0" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={clayBodyForm.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Red, White, Brown" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={clayBodyForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Additional notes about this clay body" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button type="submit">
                            {editingClayBody ? 'Update Clay Body' : 'Add Clay Body'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelClayBody}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Clay Bodies List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Your Clay Bodies ({settings.clayBodies.length})</h3>
                {settings.clayBodies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No clay bodies added yet. Add your first clay body to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {settings.clayBodies.map((clayBody) => (
                      <Card key={clayBody.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{clayBody.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {clayBody.color} • {clayBody.shrinkage}% shrinkage
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClayBody(clayBody)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClayBody(clayBody.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {clayBody.notes && (
                            <p className="text-sm text-muted-foreground">
                              {clayBody.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Kilns Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Kilns
                  </CardTitle>
                  <CardDescription>
                    Manage the kilns in your studio for firing log tracking.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddingKiln(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Kiln
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add/Edit Kiln Form */}
              {isAddingKiln && (
                <Card className="border-2 border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        {editingKiln ? 'Edit Kiln' : 'Add New Kiln'}
                      </h3>
                    </div>
                    <Form {...kilnForm}>
                      <form onSubmit={kilnForm.handleSubmit(onKilnSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={kilnForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Kiln Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Skutt 1027, Gas Kiln #1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={kilnForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Kiln Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select kiln type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="electric">Electric</SelectItem>
                                    <SelectItem value="gas">Gas</SelectItem>
                                    <SelectItem value="wood">Wood</SelectItem>
                                    <SelectItem value="raku">Raku</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={kilnForm.control}
                          name="max_temperature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Temperature (°C)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="10"
                                  min="500"
                                  max="2000"
                                  placeholder="1000" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={kilnForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Additional notes about this kiln" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button type="submit">
                            {editingKiln ? 'Update Kiln' : 'Add Kiln'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelKiln}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Kilns List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Your Kilns ({kilns.length})</h3>
                {kilns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No kilns added yet. Add your first kiln to start tracking firings.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kilns.map((kiln) => (
                      <Card key={kiln.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{kiln.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {kiln.type.charAt(0).toUpperCase() + kiln.type.slice(1)} • Max {kiln.max_temperature}°C
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditKiln(kiln)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteKiln(kiln.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {kiln.notes && (
                            <p className="text-sm text-muted-foreground">
                              {kiln.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cache Management Section */}
        <div className="mb-6">
          <CacheManagement />
        </div>
      </div>
    </div>
  );
}
