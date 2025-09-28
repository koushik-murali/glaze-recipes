'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Palette, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  User,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getClayBodies, addClayBody, deleteClayBody } from '@/lib/supabase-utils';
import { getSettings, addRawMaterial, deleteRawMaterial } from '@/lib/settings-utils';
import { ClayBody, RawMaterial } from '@/types/settings';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'settings' | 'clay' | 'materials'>('settings');
  const [clayBodies, setClayBodies] = useState<ClayBody[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [studioName, setStudioName] = useState('My Studio');
  
  // New item states
  const [isAddingClay, setIsAddingClay] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newClayName, setNewClayName] = useState('');
  const [newClayShrinkage, setNewClayShrinkage] = useState(10);
  const [newClayColor, setNewClayColor] = useState('');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialType, setNewMaterialType] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          // Load clay bodies from Supabase
          const clayData = await getClayBodies(user.id);
          setClayBodies(clayData);
          
          // Load raw materials from settings
          const settings = getSettings();
          setRawMaterials(settings.rawMaterials);
          setStudioName(settings.studioName || 'My Studio');
        } catch (error) {
          console.error('Error loading data:', error);
        }
      }
    };
    
    loadData();
  }, [user]);

  const handleAddClay = async () => {
    if (newClayName.trim() && user) {
      try {
        const newClay = await addClayBody({
          name: newClayName.trim(),
          shrinkage: newClayShrinkage,
          color: newClayColor.trim() || 'Not specified',
          notes: ''
        }, user.id);
        
        setClayBodies(prev => [...prev, newClay]);
        setNewClayName('');
        setNewClayShrinkage(10);
        setNewClayColor('');
        setIsAddingClay(false);
      } catch (error) {
        console.error('Error adding clay body:', error);
      }
    }
  };

  const handleDeleteClay = async (clayId: string) => {
    if (user && confirm('Are you sure you want to delete this clay body?')) {
      try {
        await deleteClayBody(clayId, user.id);
        setClayBodies(prev => prev.filter(clay => clay.id !== clayId));
      } catch (error) {
        console.error('Error deleting clay body:', error);
      }
    }
  };

  const handleAddMaterial = () => {
    if (newMaterialName.trim() && newMaterialType.trim()) {
      const newMaterial = addRawMaterial({
        name: newMaterialName.trim(),
        baseMaterialType: newMaterialType.trim(),
        description: ''
      });
      
      setRawMaterials(prev => [...prev, newMaterial]);
      setNewMaterialName('');
      setNewMaterialType('');
      setIsAddingMaterial(false);
    }
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      deleteRawMaterial(materialId);
      setRawMaterials(prev => prev.filter(material => material.id !== materialId));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const sidebarContent = () => {
    if (isCollapsed) {
      return (
        <div className="flex flex-col items-center space-y-4 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('settings')}
            className="w-full"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTab === 'clay' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('clay')}
            className="w-full"
          >
            <Palette className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTab === 'materials' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('materials')}
            className="w-full"
          >
            <Package className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Studio Management</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-gray-500">{studioName}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('settings')}
            className="flex-1 rounded-none"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant={activeTab === 'clay' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('clay')}
            className="flex-1 rounded-none"
          >
            <Palette className="h-4 w-4 mr-2" />
            Clay Bodies
          </Button>
          <Button
            variant={activeTab === 'materials' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('materials')}
            className="flex-1 rounded-none"
          >
            <Package className="h-4 w-4 mr-2" />
            Materials
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Studio Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/settings')}
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Open Settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'clay' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Clay Bodies</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingClay(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {isAddingClay && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Clay body name"
                        value={newClayName}
                        onChange={(e) => setNewClayName(e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                      <input
                        type="text"
                        placeholder="Color"
                        value={newClayColor}
                        onChange={(e) => setNewClayColor(e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                      <input
                        type="number"
                        placeholder="Shrinkage %"
                        value={newClayShrinkage}
                        onChange={(e) => setNewClayShrinkage(Number(e.target.value))}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={handleAddClay} className="flex-1">
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsAddingClay(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {clayBodies.map((clay) => (
                  <Card key={clay.id} className="p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{clay.name}</p>
                        <p className="text-xs text-gray-500">{clay.color} - {clay.shrinkage}%</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClay(clay.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Raw Materials</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingMaterial(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {isAddingMaterial && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Material name"
                        value={newMaterialName}
                        onChange={(e) => setNewMaterialName(e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                      <input
                        type="text"
                        placeholder="Base material type"
                        value={newMaterialType}
                        onChange={(e) => setNewMaterialType(e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={handleAddMaterial} className="flex-1">
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsAddingMaterial(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {rawMaterials.map((material) => (
                  <Card key={material.id} className="p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{material.name}</p>
                        <p className="text-xs text-gray-500">{material.baseMaterialType}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      {sidebarContent()}
    </div>
  );
}
