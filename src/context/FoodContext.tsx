import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';

export type MealType =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Snacks';

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

export type FoodLibraryItem = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
};

export type MealHistoryDay = {
  loggedDate: string;
  entryCount: number;
  calories: number;
};

export type DayHistoryItem = {
  loggedDate: string;
  entryCount: number;
  calories: number;
  mealCount: number;
};

type FoodContextType = {
  foodEntries: FoodEntry[];
  loading: boolean;

  addFoodEntry: (
    entry: Omit<FoodEntry, 'id'>
  ) => Promise<boolean>;

  updateFoodEntry: (
    id: string,
    entry: Omit<FoodEntry, 'id'>
  ) => Promise<boolean>;

  deleteFoodEntry: (
    id: string
  ) => Promise<boolean>;

  searchFoodHistory: (
    query?: string
  ) => Promise<FoodLibraryItem[]>;

  getMealHistory: (
    meal: MealType
  ) => Promise<MealHistoryDay[]>;

  copyMealFromDate: (
    sourceDate: string,
    meal: MealType
  ) => Promise<number | null>;

  getDayHistory:
    () => Promise<DayHistoryItem[]>;

  copyDayFromDate: (
    sourceDate: string
  ) => Promise<number | null>;

  refreshFoodEntries:
    () => Promise<void>;
};

const FoodContext =
  createContext<
    FoodContextType | undefined
  >(undefined);

function getLocalDateString() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    now.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeFoodKey(
  name: string,
  serving: string
) {
  return `${name
    .trim()
    .toLowerCase()}|${serving
    .trim()
    .toLowerCase()}`;
}

export function FoodProvider({
  children,
}: PropsWithChildren) {
  const [
    foodEntries,
    setFoodEntries,
  ] = useState<FoodEntry[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeFood() {
      const {
        data: { session },
        error,
      } =
        await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (
        error ||
        !session?.user?.id
      ) {
        if (error) {
          console.error(
            'Unable to load food session:',
            error
          );
        }

        setFoodEntries([]);
        setLoading(false);

        return;
      }

      await loadFoodEntriesForUser(
        session.user.id
      );
    }

    initializeFood();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!mounted) {
            return;
          }

          if (!session?.user?.id) {
            setFoodEntries([]);
            setLoading(false);

            return;
          }

          setFoodEntries([]);
          setLoading(true);

          const userId =
            session.user.id;

          setTimeout(() => {
            if (!mounted) {
              return;
            }

            loadFoodEntriesForUser(
              userId
            );
          }, 0);
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function getCurrentUserId() {
    const {
      data: { session },
      error,
    } =
      await supabase.auth.getSession();

    if (error) {
      console.error(
        'Unable to get current session:',
        error
      );

      return null;
    }

    return (
      session?.user?.id ?? null
    );
  }

  async function loadFoodEntriesForUser(
    userId: string
  ) {
    setLoading(true);

    const today =
      getLocalDateString();

    const {
      data,
      error,
    } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', userId)
      .eq(
        'logged_date',
        today
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        'Error loading food entries:',
        error
      );

      setFoodEntries([]);
      setLoading(false);

      return;
    }

    const formattedEntries:
      FoodEntry[] =
      (data ?? []).map(
        (entry) => ({
          id: entry.id,

          name:
            entry.name,

          calories:
            Number(
              entry.calories
            ),

          protein:
            Number(
              entry.protein
            ),

          carbs:
            Number(
              entry.carbs
            ),

          fat:
            Number(
              entry.fat
            ),

          serving:
            entry.serving ??
            '',

          meal:
            entry.meal as MealType,
        })
      );

    setFoodEntries(
      formattedEntries
    );

    setLoading(false);
  }

  async function refreshFoodEntries() {
    const userId =
      await getCurrentUserId();

    if (!userId) {
      setFoodEntries([]);
      setLoading(false);

      return;
    }

    await loadFoodEntriesForUser(
      userId
    );
  }

  async function addFoodEntry(
    entry: Omit<
      FoodEntry,
      'id'
    >
  ): Promise<boolean> {
    const userId =
      await getCurrentUserId();

    if (!userId) {
      return false;
    }

    const today =
      getLocalDateString();

    const { error } =
      await supabase
        .from('food_entries')
        .insert({
          user_id:
            userId,

          name:
            entry.name,

          calories:
            entry.calories,

          protein:
            entry.protein,

          carbs:
            entry.carbs,

          fat:
            entry.fat,

          serving:
            entry.serving,

          meal:
            entry.meal,

          logged_date:
            today,
        });

    if (error) {
      console.error(
        'Error adding food entry:',
        error
      );

      return false;
    }

    await loadFoodEntriesForUser(
      userId
    );

    return true;
  }

  async function updateFoodEntry(
    id: string,
    updatedEntry: Omit<
      FoodEntry,
      'id'
    >
  ): Promise<boolean> {
    const userId =
      await getCurrentUserId();

    if (!userId) {
      return false;
    }

    const { error } =
      await supabase
        .from('food_entries')
        .update({
          name:
            updatedEntry.name,

          calories:
            updatedEntry.calories,

          protein:
            updatedEntry.protein,

          carbs:
            updatedEntry.carbs,

          fat:
            updatedEntry.fat,

          serving:
            updatedEntry.serving,

          meal:
            updatedEntry.meal,
        })
        .eq('id', id)
        .eq(
          'user_id',
          userId
        );

    if (error) {
      console.error(
        'Error updating food entry:',
        error
      );

      return false;
    }

    await loadFoodEntriesForUser(
      userId
    );

    return true;
  }

  async function deleteFoodEntry(
    id: string
  ): Promise<boolean> {
    const userId =
      await getCurrentUserId();

    if (!userId) {
      return false;
    }

    const { error } =
      await supabase
        .from('food_entries')
        .delete()
        .eq('id', id)
        .eq(
          'user_id',
          userId
        );

    if (error) {
      console.error(
        'Error deleting food entry:',
        error
      );

      return false;
    }

    await loadFoodEntriesForUser(
      userId
    );

    return true;
  }

  async function searchFoodHistory(
    query = ''
  ): Promise<FoodLibraryItem[]> {
    const userId =
      await getCurrentUserId();

    if (!userId) {
      return [];
    }

    let request =
      supabase
        .from('food_entries')
        .select(
          'name, calories, protein, carbs, fat, serving, created_at'
        )
        .eq(
          'user_id',
          userId
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        )
        .limit(250);

    const trimmedQuery =
      query.trim();

    if (trimmedQuery) {
      request =
        request.ilike(
          'name',
          `%${trimmedQuery}%`
        );
    }

    const {
      data,
      error,
    } = await request;

    if (error) {
      console.error(
        'Error searching food history:',
        error
      );

      return [];
    }

    const uniqueFoods =
      new Map<
        string,
        FoodLibraryItem
      >();

    for (
      const entry of
        data ?? []
    ) {
      const name =
        String(
          entry.name ?? ''
        ).trim();

      if (!name) {
        continue;
      }

      const serving =
        String(
          entry.serving ?? ''
        ).trim();

      const key =
        normalizeFoodKey(
          name,
          serving
        );

      if (
        uniqueFoods.has(key)
      ) {
        continue;
      }

      uniqueFoods.set(
        key,
        {
          name,

          calories:
            Number(
              entry.calories
            ) || 0,

          protein:
            Number(
              entry.protein
            ) || 0,

          carbs:
            Number(
              entry.carbs
            ) || 0,

          fat:
            Number(
              entry.fat
            ) || 0,

          serving,
        }
      );

      if (
        uniqueFoods.size >=
        30
      ) {
        break;
      }
    }

    return Array.from(
      uniqueFoods.values()
    );
  }

  async function getMealHistory(
    meal: MealType
  ): Promise<MealHistoryDay[]> {
    const userId =
      await getCurrentUserId();

    if (!userId) {
      return [];
    }

    const today =
      getLocalDateString();

    const {
      data,
      error,
    } = await supabase
      .from('food_entries')
      .select(
        'logged_date, calories'
      )
      .eq(
        'user_id',
        userId
      )
      .eq(
        'meal',
        meal
      )
      .lt(
        'logged_date',
        today
      )
      .order(
        'logged_date',
        {
          ascending: false,
        }
      )
      .limit(250);

    if (error) {
      console.error(
        'Error loading meal history:',
        error
      );

      return [];
    }

    const grouped =
      new Map<
        string,
        MealHistoryDay
      >();

    for (
      const entry of
        data ?? []
    ) {
      const loggedDate =
        String(
          entry.logged_date ??
          ''
        );

      if (!loggedDate) {
        continue;
      }

      const existing =
        grouped.get(
          loggedDate
        );

      if (existing) {
        existing.entryCount +=
          1;

        existing.calories +=
          Number(
            entry.calories
          ) || 0;
      } else {
        grouped.set(
          loggedDate,
          {
            loggedDate,
            entryCount: 1,
            calories:
              Number(
                entry.calories
              ) || 0,
          }
        );
      }
    }

    return Array.from(
      grouped.values()
    ).slice(0, 14);
  }

  async function copyMealFromDate(
    sourceDate: string,
    meal: MealType
  ): Promise<number | null> {
    const userId =
      await getCurrentUserId();

    if (!userId) {
      return null;
    }

    const today =
      getLocalDateString();

    if (
      sourceDate === today
    ) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from('food_entries')
      .select(
        'name, calories, protein, carbs, fat, serving, meal'
      )
      .eq(
        'user_id',
        userId
      )
      .eq(
        'logged_date',
        sourceDate
      )
      .eq(
        'meal',
        meal
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        'Error loading meal to copy:',
        error
      );

      return null;
    }

    if (
      !data ||
      data.length === 0
    ) {
      return 0;
    }

    const copiedEntries =
      data.map(
        (entry) => ({
          user_id:
            userId,

          name:
            entry.name,

          calories:
            Number(
              entry.calories
            ) || 0,

          protein:
            Number(
              entry.protein
            ) || 0,

          carbs:
            Number(
              entry.carbs
            ) || 0,

          fat:
            Number(
              entry.fat
            ) || 0,

          serving:
            entry.serving ??
            '',

          meal,

          logged_date:
            today,
        })
      );

    const {
      error: insertError,
    } = await supabase
      .from('food_entries')
      .insert(
        copiedEntries
      );

    if (insertError) {
      console.error(
        'Error copying meal:',
        insertError
      );

      return null;
    }

    await loadFoodEntriesForUser(
      userId
    );

    return copiedEntries.length;
  }

  async function getDayHistory():
    Promise<DayHistoryItem[]> {
    const userId =
      await getCurrentUserId();

    if (!userId) {
      return [];
    }

    const today =
      getLocalDateString();

    const {
      data,
      error,
    } = await supabase
      .from('food_entries')
      .select(
        'logged_date, calories, meal'
      )
      .eq(
        'user_id',
        userId
      )
      .lt(
        'logged_date',
        today
      )
      .order(
        'logged_date',
        {
          ascending: false,
        }
      )
      .limit(500);

    if (error) {
      console.error(
        'Error loading day history:',
        error
      );

      return [];
    }

    const grouped =
      new Map<
        string,
        {
          loggedDate: string;
          entryCount: number;
          calories: number;
          meals: Set<string>;
        }
      >();

    for (
      const entry of
        data ?? []
    ) {
      const loggedDate =
        String(
          entry.logged_date ??
          ''
        );

      if (!loggedDate) {
        continue;
      }

      const existing =
        grouped.get(
          loggedDate
        );

      if (existing) {
        existing.entryCount +=
          1;

        existing.calories +=
          Number(
            entry.calories
          ) || 0;

        if (entry.meal) {
          existing.meals.add(
            String(
              entry.meal
            )
          );
        }
      } else {
        const meals =
          new Set<string>();

        if (entry.meal) {
          meals.add(
            String(
              entry.meal
            )
          );
        }

        grouped.set(
          loggedDate,
          {
            loggedDate,
            entryCount: 1,
            calories:
              Number(
                entry.calories
              ) || 0,
            meals,
          }
        );
      }
    }

    return Array.from(
      grouped.values()
    )
      .map(
        (day) => ({
          loggedDate:
            day.loggedDate,
          entryCount:
            day.entryCount,
          calories:
            day.calories,
          mealCount:
            day.meals.size,
        })
      )
      .slice(0, 14);
  }

  async function copyDayFromDate(
    sourceDate: string
  ): Promise<number | null> {
    const userId =
      await getCurrentUserId();

    if (!userId) {
      return null;
    }

    const today =
      getLocalDateString();

    if (
      sourceDate === today
    ) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from('food_entries')
      .select(
        'name, calories, protein, carbs, fat, serving, meal'
      )
      .eq(
        'user_id',
        userId
      )
      .eq(
        'logged_date',
        sourceDate
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        'Error loading day to copy:',
        error
      );

      return null;
    }

    if (
      !data ||
      data.length === 0
    ) {
      return 0;
    }

    const copiedEntries =
      data.map(
        (entry) => ({
          user_id:
            userId,

          name:
            entry.name,

          calories:
            Number(
              entry.calories
            ) || 0,

          protein:
            Number(
              entry.protein
            ) || 0,

          carbs:
            Number(
              entry.carbs
            ) || 0,

          fat:
            Number(
              entry.fat
            ) || 0,

          serving:
            entry.serving ??
            '',

          meal:
            entry.meal,

          logged_date:
            today,
        })
      );

    const {
      error: insertError,
    } = await supabase
      .from('food_entries')
      .insert(
        copiedEntries
      );

    if (insertError) {
      console.error(
        'Error copying day:',
        insertError
      );

      return null;
    }

    await loadFoodEntriesForUser(
      userId
    );

    return copiedEntries.length;
  }

  return (
    <FoodContext.Provider
      value={{
        foodEntries,
        loading,
        addFoodEntry,
        updateFoodEntry,
        deleteFoodEntry,
        searchFoodHistory,
        getMealHistory,
        copyMealFromDate,
        getDayHistory,
        copyDayFromDate,
        refreshFoodEntries,
      }}
    >
      {children}
    </FoodContext.Provider>
  );
}

export function useFood() {
  const context =
    useContext(FoodContext);

  if (!context) {
    throw new Error(
      'useFood must be used inside FoodProvider'
    );
  }

  return context;
}