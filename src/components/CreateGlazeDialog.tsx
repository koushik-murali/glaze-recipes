'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Camera, X } from 'lucide-react';
import { GlazeRecipe, CreateGlazeData, Finish } from '@/types/glaze';
import { saveGlazeRecipe, updateGlazeRecipe, getClayBodies, addClayBody } from '@/lib/supabase-utils';
import { getSettings, getAllBaseMaterialTypes } from '@/lib/settings-utils';
import { parseGlazeIngredients, suggestIngredientName } from '@/lib/natural-language-parser';
import { useAuth } from '@/contexts/AuthContext';
import { compressImage, getFileSizeString } from '@/lib/image-compression';
import { checkRecipeLimit } from '@/lib/subscription-utils';
import { toast } from 'sonner';

const finishOptions: { value: Finish; label: string }[] = [
  { value: 'glossy', label: 'Glossy' },
  { value: 'matte', label: 'Matte' },
  { value: 'semi-matte', label: 'Semi-Matte' },
  { value: 'crystalline', label: 'Crystalline' },
  { value: 'raku', label: 'Raku' },
  { value: 'wood-fired', label: 'Wood-Fired' },
  { value: 'soda', label: 'Soda' },
];

const compositionSchema = z.object({
  name: z.string().min(1, 'Component name is required'),
  percentage: z.union([z.string(), z.number()]).transform((val) => {
    if (val === '' || val === null || val === undefined) return 0;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? 0 : num;
  }).refine((val) => val >= 0.1, 'Percentage must be at least 0.1%')
    .refine((val) => val <= 100, 'Percentage cannot exceed 100%'),
});

const formSchema = z.object({
  name: z.string().min(1, 'Glaze name is required'),
  color: z.string().min(1, 'Color is required'),
  finish: z.enum(['glossy', 'matte', 'semi-matte', 'crystalline', 'raku', 'wood-fired', 'soda'] as const),
  composition: z.array(compositionSchema).min(1, 'At least one component is required'),
  date: z.string().min(1, 'Date is required'),
  batchNumber: z.string().optional(),
  photos: z.array(z.string()).optional(),
  clayBodyId: z.string().min(1, 'Clay body is required'),
  firingAtmosphere: z.enum(['oxidation', 'reduction']).optional(),
});

type FormData = {
  name: string;
  color: string;
  finish: Finish;
  composition: { name: string; percentage: string | number }[];
  date: string;
  batchNumber?: string;
  photos?: string[];
  clayBodyId: string;
  firingAtmosphere?: 'oxidation' | 'reduction';
};

interface CreateGlazeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGlazeCreated: (glaze: GlazeRecipe) => void;
  onGlazeUpdated?: (glaze: GlazeRecipe) => void;
  editingGlaze?: GlazeRecipe | null;
}

export default function CreateGlazeDialog({ open, onOpenChange, onGlazeCreated, onGlazeUpdated, editingGlaze }: CreateGlazeDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studioMaterials, setStudioMaterials] = useState(getSettings().rawMaterials);
  const [clayBodies, setClayBodies] = useState<any[]>([]);
  const allBaseMaterials = getAllBaseMaterialTypes();
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isAddingClayBody, setIsAddingClayBody] = useState(false);
  const [newClayBodyName, setNewClayBodyName] = useState('');
  const [newClayBodyShrinkage, setNewClayBodyShrinkage] = useState(0);
  const [newClayBodyColor, setNewClayBodyColor] = useState('');
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      color: '',
      finish: 'glossy',
      composition: [{ name: '', percentage: '' }],
      date: new Date().toISOString().split('T')[0],
      batchNumber: '',
      photos: [],
      clayBodyId: '',
    },
  });

  // Reset form when editing glaze changes
  useEffect(() => {
    if (editingGlaze) {
      form.reset({
        name: editingGlaze.name,
        color: editingGlaze.color,
        finish: editingGlaze.finish,
        composition: editingGlaze.composition.map(comp => ({
          name: comp.name,
          percentage: comp.percentage
        })),
        date: editingGlaze.date,
        batchNumber: editingGlaze.batchNumber,
        photos: editingGlaze.photos || [],
        clayBodyId: editingGlaze.clayBodyId,
      });
      setPhotoPreviews(editingGlaze.photos || []);
    } else {
      form.reset({
        name: '',
        color: '',
        finish: 'glossy',
        composition: [{ name: '', percentage: '' }],
        date: new Date().toISOString().split('T')[0],
        batchNumber: '',
        photos: [],
        clayBodyId: '',
      });
      setPhotoPreviews([]);
    }
  }, [editingGlaze, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'composition',
  });

  const addComposition = () => {
    append({ name: '', percentage: 0 });
  };

  const removeComposition = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    let processedCount = 0;
    
    for (const file of Array.from(files)) {
      try {
        // Compress the image
        const compressionResult = await compressImage(file);
        
        if (!compressionResult.success) {
          toast.error(compressionResult.error || 'Failed to compress image');
          continue;
        }

        // Convert compressed file to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            newPhotos.push(result);
          }
          processedCount++;
          
          if (processedCount === files.length) {
            const updatedPhotos = [...photoPreviews, ...newPhotos];
            setPhotoPreviews(updatedPhotos);
            form.setValue('photos', updatedPhotos);
            
            if (compressionResult.originalSize && compressionResult.compressedSize) {
              const originalSize = getFileSizeString(compressionResult.originalSize);
              const compressedSize = getFileSizeString(compressionResult.compressedSize);
              toast.success(`Image compressed: ${originalSize} → ${compressedSize}`);
            }
          }
        };
        
        if (compressionResult.file) {
          reader.readAsDataURL(compressionResult.file);
        }
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error('Failed to process image');
        processedCount++;
      }
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photoPreviews.filter((_, i) => i !== index);
    setPhotoPreviews(updatedPhotos);
    form.setValue('photos', updatedPhotos);
  };

  const handleAddClayBody = async () => {
    if (newClayBodyName.trim() && user) {
      try {
        const newClayBody = await addClayBody({
          name: newClayBodyName.trim(),
          shrinkage: newClayBodyShrinkage,
          color: newClayBodyColor.trim() || 'Not specified',
          notes: ''
        }, user.id);
        
        setClayBodies(prev => [...prev, newClayBody]);
        form.setValue('clayBodyId', newClayBody.id);
        
        // Reset form
        setNewClayBodyName('');
        setNewClayBodyShrinkage(0);
        setNewClayBodyColor('');
        setIsAddingClayBody(false);
      } catch (error) {
        console.error('Error adding clay body:', error);
        alert('Error adding clay body: ' + (error as Error).message);
      }
    }
  };

  const handleCancelAddClayBody = () => {
    setIsAddingClayBody(false);
    setNewClayBodyName('');
    setNewClayBodyShrinkage(0);
    setNewClayBodyColor('');
  };

  const handleNaturalLanguageParse = () => {
    if (!naturalLanguageInput.trim()) return;

    const result = parseGlazeIngredients(naturalLanguageInput);
    
    if (result.isValid && result.ingredients.length > 0) {
      // Clear existing composition
      form.setValue('composition', []);
      
      // Add parsed ingredients
      result.ingredients.forEach((ingredient, index) => {
        const suggestedName = suggestIngredientName(ingredient.name);
        append({ 
          name: suggestedName, 
          percentage: ingredient.percentage 
        });
      });
      
      // Clear the natural language input
      setNaturalLanguageInput('');
    } else {
      // Show error message (you could add a toast notification here)
      alert(result.error || 'Failed to parse ingredients');
    }
  };

  // Update studio materials and clay bodies when dialog opens
  useEffect(() => {
    const loadData = async () => {
      if (open && user) {
        try {
          const settings = getSettings();
          setStudioMaterials(settings.rawMaterials);
          
          // Load clay bodies from Supabase
          const clayBodiesData = await getClayBodies(user.id);
          
          // If no clay bodies exist, create a default one
          if (clayBodiesData.length === 0) {
            console.log('No clay bodies found, creating default clay body');
            const defaultClayBody = await addClayBody({
              name: 'Default Clay Body',
              shrinkage: 10,
              color: 'White',
              notes: 'Default clay body for new users'
            }, user.id);
            setClayBodies([defaultClayBody]);
          } else {
            setClayBodies(clayBodiesData);
          }
        } catch (error) {
          console.error('Error loading clay bodies:', error);
        }
      }
    };
    
    loadData();
  }, [open, user]);


  const onSubmit = async (data: FormData) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    // Check subscription limits for new recipes
    if (!editingGlaze) {
      const limitCheck = await checkRecipeLimit(user.id);
      if (!limitCheck.canCreate) {
        toast.error(
          `Recipe limit reached (${limitCheck.currentCount}/${limitCheck.limit}). Upgrade your plan to create more recipes.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const glazeData: CreateGlazeData = {
        ...data,
        composition: data.composition.map(comp => ({
          name: comp.name,
          percentage: typeof comp.percentage === 'string' ? parseFloat(comp.percentage) || 0 : comp.percentage,
        })),
      };

      if (editingGlaze) {
        // Update existing glaze
        const updatedGlaze = await updateGlazeRecipe(editingGlaze.id, glazeData, user.id);
        if (updatedGlaze && onGlazeUpdated) {
          onGlazeUpdated(updatedGlaze);
        }
      } else {
        // Create new glaze
        const newGlaze = await saveGlazeRecipe(glazeData, user.id);
        onGlazeCreated(newGlaze);
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating glaze:', error);
      alert('Error creating glaze: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mobile-scroll touch-manipulation">
        <DialogHeader>
          <DialogTitle>
            {editingGlaze ? 'Edit Glaze Recipe' : 'Create New Glaze Recipe'}
          </DialogTitle>
          <DialogDescription>
            {editingGlaze 
              ? 'Update the glaze recipe with its composition and properties.'
              : 'Add a new glaze recipe with its composition and properties.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Glaze Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Blue Celadon" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Deep Blue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="finish"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Finish</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select finish" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {finishOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="batchNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Auto-generated if empty" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clayBodyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clay Body *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select clay body" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clayBodies.length === 0 ? (
                        <SelectItem value="no-clay-bodies" disabled>
                          No clay bodies available. Add one below.
                        </SelectItem>
                      ) : (
                        clayBodies.map((clayBody) => (
                          <SelectItem key={clayBody.id} value={clayBody.id}>
                            {clayBody.name} ({clayBody.color} - {clayBody.shrinkage}% shrinkage)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  
                  {/* Add New Clay Body Section */}
                  <div className="mt-4 space-y-4">
                    {!isAddingClayBody ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingClayBody(true)}
                        className="w-full flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add New Clay Body
                      </Button>
                    ) : (
                      <Card className="border-2 border-dashed">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Add New Clay Body</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelAddClayBody}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input
                                placeholder="Clay body name"
                                value={newClayBodyName}
                                onChange={(e) => setNewClayBodyName(e.target.value)}
                              />
                              <Input
                                placeholder="Color (optional)"
                                value={newClayBodyColor}
                                onChange={(e) => setNewClayBodyColor(e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="shrinkage">Shrinkage %</Label>
                              <div className="flex gap-2">
                                <Input
                                  id="shrinkage"
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  placeholder="Shrinkage %"
                                  value={newClayBodyShrinkage}
                                  onChange={(e) => setNewClayBodyShrinkage(parseFloat(e.target.value) || 0)}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  onClick={handleAddClayBody}
                                  disabled={!newClayBodyName.trim()}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </FormItem>
              )}
            />

            {/* Firing Atmosphere */}
            <FormField
              control={form.control}
              name="firingAtmosphere"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firing Atmosphere (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="oxidation"
                          checked={field.value === 'oxidation'}
                          onChange={() => field.onChange('oxidation')}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Oxidation</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="reduction"
                          checked={field.value === 'reduction'}
                          onChange={() => field.onChange('reduction')}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Reduction</span>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photo Upload */}
            <FormField
              control={form.control}
              name="photos"
              render={() => (
                <FormItem>
                  <FormLabel>Photos (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {photoPreviews.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {photoPreviews.map((photo, index) => (
                            <div key={index} className="relative">
                              <img
                                src={photo}
                                alt={`Glaze preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removePhoto(index)}
                                className="absolute top-2 right-2"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('photo-upload')?.click()}
                          className="flex items-center gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          Choose Photos
                        </Button>
                        
                        <Input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="camera-capture"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('camera-capture')?.click()}
                          className="flex items-center gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          Take Photos
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Natural Language Entry */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="natural-language-input" className="text-base font-medium">
                  Natural Language Entry
                </Label>
                <div className="flex gap-2">
                  <Textarea
                    id="natural-language-input"
                    placeholder="e.g., 10 china clay 20 potash feldspar 10 Iron Oxide 15 Calcium Carbonate"
                    value={naturalLanguageInput}
                    onChange={(e) => setNaturalLanguageInput(e.target.value)}
                    className="flex-1 min-h-[60px]"
                    rows={2}
                  />
                  <Button
                    type="button"
                    onClick={handleNaturalLanguageParse}
                    disabled={!naturalLanguageInput.trim()}
                    className="self-end"
                  >
                    Parse
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Composition</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addComposition}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Component
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name={`composition.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Component Name</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input 
                                placeholder="e.g., China clay" 
                                {...field}
                                list={`materials-${index}`}
                              />
                              <datalist id={`materials-${index}`}>
                                {/* Studio materials first */}
                                {studioMaterials.map((material) => (
                                  <option key={`studio-${material.id}`} value={material.name}>
                                    {material.name} ({material.baseMaterialType}) - Studio
                                  </option>
                                ))}
                                {/* All base materials */}
                                {allBaseMaterials.map((material) => (
                                  <option key={`base-${material.id}`} value={material.name}>
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
                  <div className="w-24">
                    <FormField
                      control={form.control}
                      name={`composition.${index}.percentage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>%</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              placeholder=""
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeComposition(index)}
                    disabled={fields.length === 1}
                    className="px-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {form.formState.errors.composition && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.composition.message}
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (editingGlaze ? 'Updating...' : 'Creating...') 
                  : (editingGlaze ? 'Update Glaze' : 'Create Glaze')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
