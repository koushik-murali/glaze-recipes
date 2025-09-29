'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Users } from 'lucide-react';
import { UserWithSubscription } from '@/types/subscription';
import { getUserSubscription, getSubscriptionPlans } from '@/lib/subscription-utils';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionCardProps {
  className?: string;
}

export default function SubscriptionCard({ className }: SubscriptionCardProps) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserWithSubscription | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) return;
    
    try {
      const [subscriptionData, plansData] = await Promise.all([
        getUserSubscription(user.id),
        getSubscriptionPlans()
      ]);
      
      setSubscription(subscriptionData);
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">Unable to load subscription information.</p>
          <Button onClick={loadSubscriptionData} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { current_plan, recipe_count } = subscription;
  const isUnlimited = current_plan.recipe_limit === -1;
  const usagePercentage = isUnlimited ? 0 : (recipe_count / current_plan.recipe_limit) * 100;

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
        return <Zap className="h-4 w-4" />;
      case 'pro':
        return <Crown className="h-4 w-4" />;
      case 'studio':
        return <Users className="h-4 w-4" />;
      default:
        return <Crown className="h-4 w-4" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'pro':
        return 'bg-blue-100 text-blue-800';
      case 'studio':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Current Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Plan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getPlanIcon(current_plan.name)}
            <span className="font-semibold">{current_plan.name}</span>
          </div>
          <Badge className={getPlanColor(current_plan.name)}>
            {current_plan.monthly_price === 0 ? 'Free' : `$${current_plan.monthly_price}/month`}
          </Badge>
        </div>

        {/* Recipe Usage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Recipe Usage</span>
            <span>
              {recipe_count} / {isUnlimited ? '∞' : current_plan.recipe_limit}
            </span>
          </div>
          
          {!isUnlimited && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  usagePercentage > 80 ? 'bg-red-500' : 
                  usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Plan Features */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Plan Features:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-600" />
              {isUnlimited ? 'Unlimited glaze recipes' : `${current_plan.recipe_limit} glaze recipes`}
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-600" />
              Firing logs tracking
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-600" />
              Data export
            </li>
            {current_plan.name !== 'Free' && (
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                Priority support
              </li>
            )}
          </ul>
        </div>

        {/* Upgrade Button for Free Users */}
        {current_plan.name === 'Free' && (
          <div className="pt-4 border-t">
            <Button className="w-full" onClick={() => {
              // In a real app, this would redirect to a payment page
              alert('Upgrade functionality would be implemented here');
            }}>
              Upgrade to Pro
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Unlock unlimited recipes and premium features
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
