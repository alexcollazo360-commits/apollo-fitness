import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useState,
} from 'react';

import { supabase } from '../lib/supabase';

export type WeightEntry = {
  id: string;
  weight: number;
  loggedDate: string;
  createdAt: string;
};

type ProgressContextType = {
  weightEntries: WeightEntry[];
  loading: boolean;
  currentWeight: number | null;
  addWeightEntry: (weight: number, loggedDate?: string) => Promise<void>;
  updateWeightEntry: (
    entryId: string,
    weight: number,
    loggedDate: string
  ) => Promise<void>;
  deleteWeightEntry: (entryId: string) => Promise<void>;
  loadWeightEntries: () => Promise<void>;
};

const ProgressContext = createContext<ProgressContextType | undefined>(
  undefined
);

export function ProgressProvider({
  children,
}: PropsWithChildren) {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeightEntries();
  }, []);

  async function loadWeightEntries() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Unable to load weight entry user:', userError);
      setWeightEntries([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading weight entries:', error);
      setLoading(false);
      return;
    }

    const formattedEntries: WeightEntry[] = (data ?? []).map(
      (entry) => ({
        id: entry.id,
        weight: Number(entry.weight),
        loggedDate: entry.logged_date,
        createdAt: entry.created_at,
      })
    );

    setWeightEntries(formattedEntries);
    setLoading(false);
  }

  async function addWeightEntry(
    weight: number,
    loggedDate?: string
  ) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Unable to add weight entry user:', userError);
      return;
    }

    const date =
      loggedDate ?? new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('weight_entries').insert({
      user_id: user.id,
      weight,
      logged_date: date,
    });

    if (error) {
      console.error('Error adding weight entry:', error);
      return;
    }

    await loadWeightEntries();
  }

  async function updateWeightEntry(
    entryId: string,
    weight: number,
    loggedDate: string
  ) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Unable to update weight entry user:', userError);
      return;
    }

    const { error } = await supabase
      .from('weight_entries')
      .update({
        weight,
        logged_date: loggedDate,
      })
      .eq('id', entryId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating weight entry:', error);
      return;
    }

    await loadWeightEntries();
  }

  async function deleteWeightEntry(entryId: string) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Unable to delete weight entry user:', userError);
      return;
    }

    const { error } = await supabase
      .from('weight_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting weight entry:', error);
      return;
    }

    await loadWeightEntries();
  }

  const currentWeight =
    weightEntries.length > 0 ? weightEntries[0].weight : null;

  return (
    <ProgressContext.Provider
      value={{
        weightEntries,
        loading,
        currentWeight,
        addWeightEntry,
        updateWeightEntry,
        deleteWeightEntry,
        loadWeightEntries,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error(
      'useProgress must be used inside a ProgressProvider'
    );
  }

  return context;
}