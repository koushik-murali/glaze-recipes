import { StudioSettings, RawMaterial, BaseMaterialType, ClayBody } from '@/types/settings';
import { v4 as uuidv4 } from 'uuid';

const SETTINGS_STORAGE_KEY = 'studio-settings';

// Database of basic material types used in pottery
export const BASE_MATERIAL_TYPES: BaseMaterialType[] = [
  // Clays
  { id: 'clay-1', name: 'Fire Clay', category: 'clay', description: 'High-temperature clay body' },
  { id: 'clay-2', name: 'Ball Clay', category: 'clay', description: 'Plastic clay with high plasticity' },
  { id: 'clay-3', name: 'Kaolin', category: 'clay', description: 'White firing clay, primary component of porcelain' },
  { id: 'clay-4', name: 'China Clay', category: 'clay', description: 'Refined kaolin clay' },
  { id: 'clay-5', name: 'Red Clay', category: 'clay', description: 'Iron-rich clay body' },
  { id: 'clay-6', name: 'Stoneware Clay', category: 'clay', description: 'High-fire clay body' },
  
  // Feldspars
  { id: 'feldspar-1', name: 'Potash Feldspar', category: 'feldspar', description: 'K2O.Al2O3.6SiO2 - potassium feldspar' },
  { id: 'feldspar-2', name: 'Soda Feldspar', category: 'feldspar', description: 'Na2O.Al2O3.6SiO2 - sodium feldspar' },
  { id: 'feldspar-3', name: 'Custer Feldspar', category: 'feldspar', description: 'Potash feldspar from Custer, SD' },
  { id: 'feldspar-4', name: 'G-200 Feldspar', category: 'feldspar', description: 'Soda feldspar' },
  { id: 'feldspar-5', name: 'Nepheline Syenite', category: 'feldspar', description: 'Low-temperature feldspar substitute' },
  
  // Silica
  { id: 'silica-1', name: 'Silica Sand', category: 'silica', description: 'SiO2 - silicon dioxide' },
  { id: 'silica-2', name: 'Flint', category: 'silica', description: 'SiO2 - ground silica' },
  { id: 'silica-3', name: 'Quartz', category: 'silica', description: 'SiO2 - crystalline silica' },
  
  // Fluxes
  { id: 'flux-1', name: 'Whiting', category: 'flux', description: 'CaCO3 - calcium carbonate' },
  { id: 'flux-2', name: 'Dolomite', category: 'flux', description: 'CaCO3.MgCO3 - calcium magnesium carbonate' },
  { id: 'flux-3', name: 'Talc', category: 'flux', description: 'Mg3Si4O10(OH)2 - magnesium silicate' },
  { id: 'flux-4', name: 'Wollastonite', category: 'flux', description: 'CaSiO3 - calcium silicate' },
  { id: 'flux-5', name: 'Bone Ash', category: 'flux', description: 'Ca3(PO4)2 - calcium phosphate' },
  
  // Oxides
  { id: 'oxide-1', name: 'Iron Oxide', category: 'oxide', description: 'Fe2O3 - red iron oxide' },
  { id: 'oxide-2', name: 'Black Iron Oxide', category: 'oxide', description: 'Fe3O4 - magnetite' },
  { id: 'oxide-3', name: 'Chrome Oxide', category: 'oxide', description: 'Cr2O3 - chromium oxide' },
  { id: 'oxide-4', name: 'Cobalt Oxide', category: 'oxide', description: 'CoO - cobalt oxide' },
  { id: 'oxide-5', name: 'Copper Oxide', category: 'oxide', description: 'CuO - copper oxide' },
  { id: 'oxide-6', name: 'Manganese Dioxide', category: 'oxide', description: 'MnO2 - manganese oxide' },
  { id: 'oxide-7', name: 'Rutile', category: 'oxide', description: 'TiO2 - titanium dioxide' },
  { id: 'oxide-8', name: 'Tin Oxide', category: 'oxide', description: 'SnO2 - tin dioxide' },
  { id: 'oxide-9', name: 'Zinc Oxide', category: 'oxide', description: 'ZnO - zinc oxide' },
  { id: 'oxide-10', name: 'Titanium Dioxide', category: 'oxide', description: 'TiO2 - titanium dioxide' },
  
  // Frits
  { id: 'frit-1', name: 'Frit 3124', category: 'frit', description: 'Low-temperature frit' },
  { id: 'frit-2', name: 'Frit 3110', category: 'frit', description: 'High-temperature frit' },
  { id: 'frit-3', name: 'Frit 3195', category: 'frit', description: 'Lead-free frit' },
  { id: 'frit-4', name: 'Frit 3134', category: 'frit', description: 'Boron frit' },
  { id: 'frit-5', name: 'Frit 3249', category: 'frit', description: 'Zinc frit' },
  
  // Other
  { id: 'other-1', name: 'Alumina', category: 'other', description: 'Al2O3 - aluminum oxide' },
  { id: 'other-2', name: 'Bentonite', category: 'other', description: 'Clay suspension agent' },
  { id: 'other-3', name: 'Grog', category: 'other', description: 'Fired clay particles' },
  { id: 'other-4', name: 'Vermiculite', category: 'other', description: 'Expanded mica' },
  { id: 'other-5', name: 'Perlite', category: 'other', description: 'Volcanic glass' },
];

export function getDefaultSettings(): StudioSettings {
  return {
    studioName: '',
    rawMaterials: [],
    clayBodies: []
  };
}

export function isFirstLaunch(): boolean {
  const settings = getSettings();
  return !settings.studioName || settings.studioName.trim() === '';
}

export function getSettings(): StudioSettings {
  if (typeof window === 'undefined') return getDefaultSettings();
  
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return getDefaultSettings();
    
    const settings = JSON.parse(stored);
    return {
      ...settings,
      rawMaterials: settings.rawMaterials.map((material: RawMaterial) => ({
        ...material,
        createdAt: new Date(material.createdAt),
        updatedAt: new Date(material.updatedAt)
      })),
      clayBodies: settings.clayBodies?.map((clay: ClayBody) => ({
        ...clay,
        createdAt: new Date(clay.createdAt),
        updatedAt: new Date(clay.updatedAt)
      })) || []
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return getDefaultSettings();
  }
}

export function saveSettings(settings: StudioSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function updateStudioName(studioName: string): void {
  const settings = getSettings();
  settings.studioName = studioName;
  saveSettings(settings);
}

export function addRawMaterial(material: Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>): RawMaterial {
  const settings = getSettings();
  const now = new Date();
  const newMaterial: RawMaterial = {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    ...material
  };
  
  settings.rawMaterials.push(newMaterial);
  saveSettings(settings);
  return newMaterial;
}

export function updateRawMaterial(id: string, updates: Partial<Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>>): RawMaterial | null {
  const settings = getSettings();
  const index = settings.rawMaterials.findIndex(material => material.id === id);
  
  if (index === -1) return null;
  
  const updatedMaterial = {
    ...settings.rawMaterials[index],
    ...updates,
    updatedAt: new Date()
  };
  
  settings.rawMaterials[index] = updatedMaterial;
  saveSettings(settings);
  return updatedMaterial;
}

export function deleteRawMaterial(id: string): void {
  const settings = getSettings();
  settings.rawMaterials = settings.rawMaterials.filter(material => material.id !== id);
  saveSettings(settings);
}

export function getBaseMaterialTypesByCategory(category: string): BaseMaterialType[] {
  return BASE_MATERIAL_TYPES.filter(material => material.category === category);
}

export function getAllBaseMaterialTypes(): BaseMaterialType[] {
  return BASE_MATERIAL_TYPES;
}

// Clay Body Management
export function addClayBody(clayBody: Omit<ClayBody, 'id' | 'createdAt' | 'updatedAt'>): ClayBody {
  const settings = getSettings();
  const now = new Date();
  const newClayBody: ClayBody = {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    ...clayBody
  };
  
  settings.clayBodies.push(newClayBody);
  saveSettings(settings);
  return newClayBody;
}

export function updateClayBody(id: string, updates: Partial<Omit<ClayBody, 'id' | 'createdAt' | 'updatedAt'>>): ClayBody | null {
  const settings = getSettings();
  const index = settings.clayBodies.findIndex(clay => clay.id === id);
  
  if (index === -1) return null;
  
  const updatedClayBody = {
    ...settings.clayBodies[index],
    ...updates,
    updatedAt: new Date()
  };
  
  settings.clayBodies[index] = updatedClayBody;
  saveSettings(settings);
  return updatedClayBody;
}

export function deleteClayBody(id: string): void {
  const settings = getSettings();
  settings.clayBodies = settings.clayBodies.filter(clay => clay.id !== id);
  saveSettings(settings);
}
