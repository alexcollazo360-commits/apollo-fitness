import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export type FoodEntry = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  meal: MealType;
};

type FoodContextType = {
  foodEntries: FoodEntry[];
  loading: boolean;
  addFoodEntry: (entry: Omit<FoodEntry, 'id'>) => Promise<boolean>;
  updateFoodEntry: (
    id: string,
    entry: Omit<FoodEntry, 'id'>
  ) => Promise<boolean>;
  deleteFoodEntry: (id: string) => Promise<boolean>;
  refreshFoodEntries: () => Promise<void>;
};

const FoodContext = createContext<FoodContextType | undefined>(undefined);

export function FoodProvider({ children }: PropsWithChildren) {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshFoodEntries();
  }, []);

  async function getCurrentUserId() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('Unable to get current user:', error);
      return null;
    }

    return user.id;
  }

  async function refreshFoodEntries() {
    setLoading(true);

    const userId = await getCurrentUserId();

    if (!userId) {
      setFoodEntries([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading food entries:', error);
      setLoading(false);
      return;
    }

    const formattedEntries: FoodEntry[] = (data ?? []).map((entry) => ({
      id: entry.id,
      name: entry.name,
      calories: Number(entry.calories),
      protein: Number(entry.protein),
      carbs: Number(entry.carbs),
      fat: Number(entry.fat),
      serving: entry.serving ?? '',
      meal: entry.meal as MealType,
    }));

    setFoodEntries(formattedEntries);
    setLoading(false);
  }

  async function addFoodEntry(
    entry: Omit<FoodEntry, 'id'>
  ): Promise<boolean> {
    const userId = await getCurrentUserId();

    if (!userId) {
      return false;
    }

    const { error } = await supabase
      .from('food_entries')
      .insert({
        user_id: userId,
        name: entry.name,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        serving: entry.serving,
        meal: entry.meal,
      });

    if (error) {
      console.error('Error adding food entry:', error);
      return false;
    }

    await refreshFoodEntries();
    return true;
  }

  async function updateFoodEntry(
    id: string,
    updatedEntry: Omit<FoodEntry, 'id'>
  ): Promise<boolean> {
    const userId = await getCurrentUserId();

    if (!userId) {
      return false;
    }

    const { error } = await supabase
      .from('food_entries')
      .update({
        name: updatedEntry.name,
        calories: updatedEntry.calories,
        protein: updatedEntry.protein,
        carbs: updatedEntry.carbs,
        fat: updatedEntry.fat,
        serving: updatedEntry.serving,
        meal: updatedEntry.meal,
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating food entry:', error);
      return false;
    }

    await refreshFoodEntries();
    return true;
  }

  async function deleteFoodEntry(id: string): Promise<boolean> {
    const userId = await getCurrentUserId();

    if (!userId) {
      return false;
    }

    const { error } = await supabase
      .from('food_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting food entry:', error);
      return false;
    }

    await refreshFoodEntries();
    return true;
  }

  return (
    <FoodContext.Provider
      value={{
        foodEntries,
        loading,
        addFoodEntry,
        updateFoodEntry,
        deleteFoodEntry,
        refreshFoodEntries,
      }}
    >
      {children}
    </FoodContext.Provider>
  );
}

export function useFood() {
  const context = useContext(FoodContext);

  if (!context) {
    throw new Error('useFood must be used inside FoodProvider');
  }

  return context;
}