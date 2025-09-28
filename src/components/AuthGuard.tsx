'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthDialog from './AuthDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Palette } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    // Show auth dialog if user is not authenticated and not loading
    if (!loading && !user) {
      setShowAuthDialog(true);
    } else if (user) {
      setShowAuthDialog(false);
    }
  }, [user, loading]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Palette className="h-12 w-12 text-blue-600" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-lg font-medium">Loading Glaze Recipes...</span>
              </div>
              <p className="text-sm text-gray-600">
                Please wait while we check your authentication status.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show auth dialog if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Palette className="h-12 w-12 text-blue-600" />
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                Glaze Recipes
              </h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Capture, organize, and manage your ceramic glaze recipes digitally. 
              Perfect for potters and ceramic artists.
            </p>
          </div>

          {/* Sign In Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600">
                  Please sign in to access your glaze recipes
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => setShowAuthDialog(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Sign In to Continue
                </button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Don't have an account? Sign up is free!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auth Dialog */}
        <AuthDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
        />
      </div>
    );
  }

  // User is authenticated, show the app
  return <>{children}</>;
}
