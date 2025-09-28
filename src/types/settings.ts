export interface ClayBody {
  id: string;
  name: string;
  shrinkage: number;
  color: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudioSettings {
  studioName: string;
  rawMaterials: RawMaterial[];
  clayBodies: ClayBody[];
}

export interface RawMaterial {
  id: string;
  name: string;
  baseMaterialType: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseMaterialType {
  id: string;
  name: string;
  category: 'clay' | 'feldspar' | 'silica' | 'flux' | 'oxide' | 'frit' | 'other';
  description: string;
}
