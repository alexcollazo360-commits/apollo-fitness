import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
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

  refreshWeightEntries: () => Promise<void>;

  addWeightEntry: (
    weight: number,
    loggedDate?: string
  ) => Promise<void>;

  updateWeightEntry: (
    entryId: string,
    weight: number,
    loggedDate: string
  ) => Promise<void>;

  deleteWeightEntry: (
    entryId: string
  ) => Promise<void>;
};

const ProgressContext =
  createContext<ProgressContextType | undefined>(
    undefined
  );

function getLocalDateString(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function ProgressProvider({
  children,
}: PropsWithChildren) {
  const [
    weightEntries,
    setWeightEntries,
  ] = useState<WeightEntry[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeProgress() {
      setLoading(true);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          'Error getting session for progress:',
          error
        );

        setWeightEntries([]);
        setLoading(false);

        return;
      }

      if (!session?.user?.id) {
        setWeightEntries([]);
        setLoading(false);

        return;
      }

      await loadWeightEntriesForUser(
        session.user.id
      );
    }

    initializeProgress();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) {
          return;
        }

        if (!session?.user?.id) {
          setWeightEntries([]);
          setLoading(false);

          return;
        }

        setWeightEntries([]);
        setLoading(true);

        const userId =
          session.user.id;

        setTimeout(() => {
          if (!mounted) {
            return;
          }

          loadWeightEntriesForUser(
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

  async function loadWeightEntriesForUser(
    userId: string
  ) {
    setLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from('weight_entries')
      .select(
        'id, weight, logged_date, created_at'
      )
      .eq('user_id', userId)
      .order(
        'logged_date',
        {
          ascending: false,
        }
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        'Error loading weight entries:',
        error
      );

      setWeightEntries([]);
      setLoading(false);

      return;
    }

    const formattedEntries: WeightEntry[] =
      (data ?? []).map(
        (entry) => ({
          id: entry.id,

          weight: Number(
            entry.weight
          ),

          loggedDate:
            entry.logged_date,

          createdAt:
            entry.created_at,
        })
      );

    setWeightEntries(
      formattedEntries
    );

    setLoading(false);
  }

  async function refreshWeightEntries() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (
      error ||
      !session?.user?.id
    ) {
      if (error) {
        console.error(
          'Unable to refresh weight entries:',
          error
        );
      }

      setWeightEntries([]);
      setLoading(false);

      return;
    }

    await loadWeightEntriesForUser(
      session.user.id
    );
  }

  async function addWeightEntry(
    weight: number,
    loggedDate = getLocalDateString(
      new Date()
    )
  ) {
    const {
      data: { session },
      error: sessionError,
    } =
      await supabase.auth.getSession();

    if (
      sessionError ||
      !session?.user?.id
    ) {
      console.error(
        'Unable to add weight entry:',
        sessionError
      );

      return;
    }

    const { error } =
      await supabase
        .from('weight_entries')
        .insert({
          user_id:
            session.user.id,

          weight,

          logged_date:
            loggedDate,
        });

    if (error) {
      console.error(
        'Error adding weight entry:',
        error
      );

      return;
    }

    await loadWeightEntriesForUser(
      session.user.id
    );
  }

  async function updateWeightEntry(
    entryId: string,
    weight: number,
    loggedDate: string
  ) {
    const {
      data: { session },
      error: sessionError,
    } =
      await supabase.auth.getSession();

    if (
      sessionError ||
      !session?.user?.id
    ) {
      console.error(
        'Unable to update weight entry:',
        sessionError
      );

      return;
    }

    const { error } =
      await supabase
        .from('weight_entries')
        .update({
          weight,
          logged_date:
            loggedDate,
        })
        .eq(
          'id',
          entryId
        )
        .eq(
          'user_id',
          session.user.id
        );

    if (error) {
      console.error(
        'Error updating weight entry:',
        error
      );

      return;
    }

    await loadWeightEntriesForUser(
      session.user.id
    );
  }

  async function deleteWeightEntry(
    entryId: string
  ) {
    const {
      data: { session },
      error: sessionError,
    } =
      await supabase.auth.getSession();

    if (
      sessionError ||
      !session?.user?.id
    ) {
      console.error(
        'Unable to delete weight entry:',
        sessionError
      );

      return;
    }

    const { error } =
      await supabase
        .from('weight_entries')
        .delete()
        .eq(
          'id',
          entryId
        )
        .eq(
          'user_id',
          session.user.id
        );

    if (error) {
      console.error(
        'Error deleting weight entry:',
        error
      );

      return;
    }

    await loadWeightEntriesForUser(
      session.user.id
    );
  }

  const currentWeight =
    useMemo(() => {
      if (
        weightEntries.length === 0
      ) {
        return null;
      }

      return (
        weightEntries[0]?.weight ??
        null
      );
    }, [weightEntries]);

  return (
    <ProgressContext.Provider
      value={{
        weightEntries,
        loading,
        currentWeight,
        refreshWeightEntries,
        addWeightEntry,
        updateWeightEntry,
        deleteWeightEntry,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context =
    useContext(ProgressContext);

  if (!context) {
    throw new Error(
      'useProgress must be used inside ProgressProvider'
    );
  }

  return context;
}