import {
    PropsWithChildren,
    createContext,
    useContext,
    useState,
} from 'react';

import { supabase } from '../lib/supabase';

export type RunRoutePoint = {
  latitude: number;
  longitude: number;
  timestamp?: number;
};

export type RunEntry = {
  id: string;
  runDate: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  distanceMeters: number;
  averagePaceSecondsPerMile: number | null;
  caloriesBurned: number;
  routePoints: RunRoutePoint[];
};

export type SaveRunInput = {
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  distanceMeters: number;
  averagePaceSecondsPerMile: number | null;
  caloriesBurned: number;
  routePoints: RunRoutePoint[];
};

type RunContextType = {
  runHistory: RunEntry[];
  historyLoading: boolean;
  savingRun: boolean;

  saveRun: (
    run: SaveRunInput
  ) => Promise<RunEntry | null>;

  loadRunHistory:
    () => Promise<boolean>;

  deleteRun: (
    runId: string
  ) => Promise<boolean>;
};

const RunContext =
  createContext<
    RunContextType | undefined
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

function normalizeRoutePoints(
  value: unknown
): RunRoutePoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(
    (point) => {
      if (
        typeof point !== 'object' ||
        point === null
      ) {
        return [];
      }

      const candidate =
        point as {
          latitude?: unknown;
          longitude?: unknown;
          timestamp?: unknown;
        };

      if (
        typeof candidate.latitude !==
          'number' ||
        typeof candidate.longitude !==
          'number'
      ) {
        return [];
      }

      return [
        {
          latitude:
            candidate.latitude,

          longitude:
            candidate.longitude,

          timestamp:
            typeof candidate.timestamp ===
            'number'
              ? candidate.timestamp
              : undefined,
        },
      ];
    }
  );
}

function mapRunEntry(
  data: any
): RunEntry {
  return {
    id: data.id,

    runDate:
      data.run_date,

    startedAt:
      data.started_at,

    completedAt:
      data.completed_at,

    durationSeconds:
      Number(
        data.duration_seconds
      ) || 0,

    distanceMeters:
      Number(
        data.distance_meters
      ) || 0,

    averagePaceSecondsPerMile:
      data.average_pace_seconds_per_mile ===
      null
        ? null
        : Number(
            data.average_pace_seconds_per_mile
          ),

    caloriesBurned:
      Number(
        data.calories_burned
      ) || 0,

    routePoints:
      normalizeRoutePoints(
        data.route_points
      ),
  };
}

export function RunProvider({
  children,
}: PropsWithChildren) {
  const [
    runHistory,
    setRunHistory,
  ] = useState<RunEntry[]>([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    savingRun,
    setSavingRun,
  ] = useState(false);

  async function getCurrentUserId() {
    const {
      data: { session },
      error,
    } =
      await supabase.auth.getSession();

    if (error) {
      console.error(
        'Unable to load run session:',
        error
      );

      return null;
    }

    return (
      session?.user?.id ?? null
    );
  }

  async function saveRun(
    run: SaveRunInput
  ): Promise<RunEntry | null> {
    setSavingRun(true);

    try {
      const userId =
        await getCurrentUserId();

      if (!userId) {
        return null;
      }

      const {
        data,
        error,
      } = await supabase
        .from('run_entries')
        .insert({
          user_id: userId,

          run_date:
            getLocalDateString(),

          started_at:
            run.startedAt,

          completed_at:
            run.completedAt,

          duration_seconds:
            Math.max(
              0,
              Math.round(
                run.durationSeconds
              )
            ),

          distance_meters:
            Math.max(
              0,
              run.distanceMeters
            ),

          average_pace_seconds_per_mile:
            run.averagePaceSecondsPerMile,

          calories_burned:
            Math.max(
              0,
              Math.round(
                run.caloriesBurned
              )
            ),

          route_points:
            run.routePoints,
        })
        .select()
        .single();

      if (error) {
        console.error(
          'Error saving run:',
          error
        );

        return null;
      }

      const savedRun =
        mapRunEntry(data);

      setRunHistory(
        (current) => [
          savedRun,
          ...current.filter(
            (item) =>
              item.id !==
              savedRun.id
          ),
        ]
      );

      return savedRun;
    } finally {
      setSavingRun(false);
    }
  }

  async function loadRunHistory():
    Promise<boolean> {
    setHistoryLoading(true);

    try {
      const userId =
        await getCurrentUserId();

      if (!userId) {
        setRunHistory([]);
        return false;
      }

      const {
        data,
        error,
      } = await supabase
        .from('run_entries')
        .select(
          [
            'id',
            'run_date',
            'started_at',
            'completed_at',
            'duration_seconds',
            'distance_meters',
            'average_pace_seconds_per_mile',
            'calories_burned',
            'route_points',
          ].join(',')
        )
        .eq(
          'user_id',
          userId
        )
        .order(
          'completed_at',
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          'Error loading run history:',
          error
        );

        setRunHistory([]);
        return false;
      }

      setRunHistory(
        (data ?? []).map(
          mapRunEntry
        )
      );

      return true;
    } finally {
      setHistoryLoading(false);
    }
  }

  async function deleteRun(
    runId: string
  ): Promise<boolean> {
    const userId =
      await getCurrentUserId();

    if (!userId) {
      return false;
    }

    const {
      error,
    } = await supabase
      .from('run_entries')
      .delete()
      .eq(
        'id',
        runId
      )
      .eq(
        'user_id',
        userId
      );

    if (error) {
      console.error(
        'Error deleting run:',
        error
      );

      return false;
    }

    setRunHistory(
      (current) =>
        current.filter(
          (run) =>
            run.id !== runId
        )
    );

    return true;
  }

  return (
    <RunContext.Provider
      value={{
        runHistory,
        historyLoading,
        savingRun,
        saveRun,
        loadRunHistory,
        deleteRun,
      }}
    >
      {children}
    </RunContext.Provider>
  );
}

export function useRun() {
  const context =
    useContext(RunContext);

  if (!context) {
    throw new Error(
      'useRun must be used inside RunProvider'
    );
  }

  return context;
}