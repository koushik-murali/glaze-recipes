import { supabase } from './supabase';
import { SubscriptionPlan, UserSubscription, UserWithSubscription } from '@/types/subscription';

export const getUserSubscription = async (userId: string): Promise<UserWithSubscription | null> => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Get recipe count
    const { count: recipeCount } = await supabase
      .from('glaze_recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const currentPlan = data.subscription_plans as SubscriptionPlan;
    const subscription = data as UserSubscription;
    const recipeCountNum = recipeCount || 0;

    const canCreateRecipe = currentPlan.recipe_limit === -1 || recipeCountNum < currentPlan.recipe_limit;

    return {
      user_id: userId,
      current_plan: currentPlan,
      subscription: subscription,
      recipe_count: recipeCountNum,
      can_create_recipe: canCreateRecipe,
    };
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return null;
  }
};

export const checkRecipeLimit = async (userId: string): Promise<{ canCreate: boolean; currentCount: number; limit: number }> => {
  try {
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      // Default to free plan limits if no subscription found
      return {
        canCreate: false,
        currentCount: 0,
        limit: 10,
      };
    }

    const { current_plan, recipe_count } = subscription;
    const limit = current_plan.recipe_limit === -1 ? Infinity : current_plan.recipe_limit;
    
    return {
      canCreate: recipe_count < limit,
      currentCount: recipe_count,
      limit: current_plan.recipe_limit,
    };
  } catch (error) {
    console.error('Error checking recipe limit:', error);
    return {
      canCreate: false,
      currentCount: 0,
      limit: 10,
    };
  }
};

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('monthly_price', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSubscriptionPlans:', error);
    return [];
  }
};

export const createSubscription = async (
  userId: string,
  planId: string,
  status: 'active' | 'trial' = 'active',
  expiresAt?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status,
        expires_at: expiresAt,
      });

    if (error) {
      console.error('Error creating subscription:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in createSubscription:', error);
    return { success: false, error: 'Failed to create subscription' };
  }
};

export const upgradeSubscription = async (
  userId: string,
  newPlanId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First, cancel the current subscription
    const { error: cancelError } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (cancelError) {
      console.error('Error cancelling current subscription:', cancelError);
      return { success: false, error: cancelError.message };
    }

    // Create new subscription
    const result = await createSubscription(userId, newPlanId);
    return result;
  } catch (error) {
    console.error('Error in upgradeSubscription:', error);
    return { success: false, error: 'Failed to upgrade subscription' };
  }
};
