export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  recipe_limit: number; // -1 for unlimited
  monthly_price: number;
  is_active: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  started_at: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithSubscription {
  user_id: string;
  current_plan: SubscriptionPlan;
  subscription: UserSubscription;
  recipe_count: number;
  can_create_recipe: boolean;
}
