import { GlazeRecipe } from '@/types/glaze';
import { FiringLog } from '@/types/firing';
import { ClayBody, RawMaterial } from '@/types/settings';

export interface ExportData {
  glaze_recipes: GlazeRecipe[];
  firing_logs: FiringLog[];
  clay_bodies: ClayBody[];
  raw_materials: RawMaterial[];
  export_date: string;
  user_id: string;
}

export const exportToJSON = (data: ExportData): string => {
  return JSON.stringify(data, null, 2);
};

export const exportToCSV = (data: ExportData): { glazeRecipes: string; firingLogs: string } => {
  // Export glaze recipes to CSV
  const glazeHeaders = [
    'ID', 'Name', 'Color', 'Finish', 'Date', 'Batch Number', 
    'Clay Body ID', 'Firing Atmosphere', 'Created At', 'Updated At'
  ];
  
  const glazeRows = data.glaze_recipes.map(recipe => [
    recipe.id,
    recipe.name,
    recipe.color,
    recipe.finish,
    recipe.date,
    recipe.batchNumber,
    recipe.clayBodyId,
    recipe.firingAtmosphere || '',
    recipe.createdAt.toISOString(),
    recipe.updatedAt.toISOString(),
  ]);

  const glazeCSV = [glazeHeaders, ...glazeRows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  // Export firing logs to CSV
  const firingHeaders = [
    'ID', 'Kiln Name', 'Date', 'Firing Type', 'Target Temperature', 
    'Actual Temperature', 'Duration (hours)', 'Ramp Rate', 'Notes', 'Created At'
  ];
  
  const firingRows = data.firing_logs.map(log => [
    log.id,
    log.kiln_name,
    log.date,
    log.firing_type,
    log.target_temperature,
    log.actual_temperature,
    log.firing_duration_hours,
    log.ramp_rate,
    log.notes || '',
    log.created_at,
  ]);

  const firingCSV = [firingHeaders, ...firingRows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return {
    glazeRecipes: glazeCSV,
    firingLogs: firingCSV,
  };
};

export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const downloadJSON = (data: ExportData, filename?: string) => {
  const jsonContent = exportToJSON(data);
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `glaze-recipes-export-${timestamp}.json`;
  
  downloadFile(jsonContent, filename || defaultFilename, 'application/json');
};

export const downloadCSV = (data: ExportData, filename?: string) => {
  const csvData = exportToCSV(data);
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Download glaze recipes CSV
  const glazeFilename = filename ? filename.replace('.csv', '-glaze-recipes.csv') : `glaze-recipes-export-${timestamp}-glaze-recipes.csv`;
  downloadFile(csvData.glazeRecipes, glazeFilename, 'text/csv');
  
  // Download firing logs CSV
  const firingFilename = filename ? filename.replace('.csv', '-firing-logs.csv') : `glaze-recipes-export-${timestamp}-firing-logs.csv`;
  downloadFile(csvData.firingLogs, firingFilename, 'text/csv');
};

export const generateExportData = async (userId: string): Promise<ExportData> => {
  // This would typically fetch data from your database
  // For now, returning empty structure
  return {
    glaze_recipes: [],
    firing_logs: [],
    clay_bodies: [],
    raw_materials: [],
    export_date: new Date().toISOString(),
    user_id: userId,
  };
};
