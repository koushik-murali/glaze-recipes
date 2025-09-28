export interface Composition {
  id: string;
  name: string;
  percentage: number;
}

export type Finish = 
  | 'glossy' 
  | 'matte' 
  | 'semi-matte' 
  | 'crystalline' 
  | 'raku' 
  | 'wood-fired' 
  | 'soda';

export interface GlazeRecipe {
  id: string;
  name: string;
  color: string;
  finish: Finish;
  composition: Composition[];
  date: string;
  batchNumber: string;
  photos?: string[]; // Array of Base64 encoded images
  clayBodyId: string; // Reference to clay body
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGlazeData {
  name: string;
  color: string;
  finish: Finish;
  composition: Omit<Composition, 'id'>[];
  date: string;
  batchNumber?: string;
  photos?: string[];
  clayBodyId: string;
}
