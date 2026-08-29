import { PropsWithChildren, createContext, useContext, useState } from 'react';

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
  addFoodEntry: (entry: Omit<FoodEntry, 'id'>) => void;
  updateFoodEntry: (id: string, entry: Omit<FoodEntry, 'id'>) => void;
  deleteFoodEntry: (id: string) => void;
};

const FoodContext = createContext<FoodContextType | undefined>(undefined);

export function FoodProvider({ children }: PropsWithChildren) {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);

  function addFoodEntry(entry: Omit<FoodEntry, 'id'>) {
    const newEntry: FoodEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random()}`,
    };

    setFoodEntries((currentEntries) => [...currentEntries, newEntry]);
  }

  function updateFoodEntry(
    id: string,
    updatedEntry: Omit<FoodEntry, 'id'>
  ) {
    setFoodEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === id
          ? {
              ...updatedEntry,
              id,
            }
          : entry
      )
    );
  }

  function deleteFoodEntry(id: string) {
    setFoodEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== id)
    );
  }

  return (
    <FoodContext.Provider
      value={{
        foodEntries,
        addFoodEntry,
        updateFoodEntry,
        deleteFoodEntry,
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