'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Database, Calendar } from 'lucide-react';
import { exportToJSON, exportToCSV, downloadJSON, downloadCSV } from '@/lib/export-utils';
import { GlazeRecipe } from '@/types/glaze';
import { FiringLog } from '@/types/firing';
import { ClayBody, RawMaterial } from '@/types/settings';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  glazeRecipes: GlazeRecipe[];
  firingLogs?: FiringLog[];
  clayBodies?: ClayBody[];
  rawMaterials?: RawMaterial[];
  userId: string;
}

export default function ExportDialog({
  open,
  onOpenChange,
  glazeRecipes,
  firingLogs = [],
  clayBodies = [],
  rawMaterials = [],
  userId
}: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = {
    glaze_recipes: glazeRecipes,
    firing_logs: firingLogs,
    clay_bodies: clayBodies,
    raw_materials: rawMaterials,
    export_date: new Date().toISOString(),
    user_id: userId,
  };

  const handleJSONExport = async () => {
    setIsExporting(true);
    try {
      downloadJSON(exportData);
    } catch (error) {
      console.error('Error exporting JSON:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCSVExport = async () => {
    setIsExporting(true);
    try {
      downloadCSV(exportData);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5" />
                Data Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{glazeRecipes.length}</div>
                  <div className="text-sm text-gray-600">Glaze Recipes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{firingLogs.length}</div>
                  <div className="text-sm text-gray-600">Firing Logs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{clayBodies.length}</div>
                  <div className="text-sm text-gray-600">Clay Bodies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{rawMaterials.length}</div>
                  <div className="text-sm text-gray-600">Raw Materials</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Export Format</h3>
            
            {/* JSON Export */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">JSON Format</h4>
                      <p className="text-sm text-gray-600">
                        Complete data with all details. Best for backups and importing to other systems.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">Complete</Badge>
                        <Badge variant="secondary">Structured</Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={handleJSONExport}
                    disabled={isExporting}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export JSON
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CSV Export */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">CSV Format</h4>
                      <p className="text-sm text-gray-600">
                        Spreadsheet format. Separate files for glaze recipes and firing logs.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">Spreadsheet</Badge>
                        <Badge variant="secondary">Multiple Files</Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={handleCSVExport}
                    disabled={isExporting}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Export Information</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Export includes all your data as of {new Date().toLocaleDateString()}</li>
              <li>• JSON format preserves all data types and relationships</li>
              <li>• CSV format creates separate files for different data types</li>
              <li>• Files will be downloaded to your default download folder</li>
              <li>• Keep your exported data secure as it contains your personal information</li>
            </ul>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
