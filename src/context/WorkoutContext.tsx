import {
    PropsWithChildren,
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

import { supabase } from '../lib/supabase';

export type WorkoutSet = {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
};

export type WorkoutExercise = {
  id: string;
  exerciseName: string;
  exerciseOrder: number;
  sets: WorkoutSet[];
};

export type Workout = {
  id: string;
  name: string;
  workoutDate: string;
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
  exercises: WorkoutExercise[];
};

export type WorkoutHistoryItem = {
  id: string;
  name: string;
  workoutDate: string;
  startedAt: string;
  completedAt: string;
  exerciseCount: number;
  setCount: number;
};

type WorkoutContextType = {
  activeWorkout: Workout | null;
  workoutHistory: WorkoutHistoryItem[];
  loading: boolean;
  historyLoading: boolean;

  startWorkout: (
    name?: string
  ) => Promise<boolean>;

  loadWorkout: (
    workoutId: string
  ) => Promise<boolean>;

  loadActiveWorkout: () => Promise<boolean>;

  loadWorkoutHistory: () => Promise<boolean>;

  addExercise: (
    exerciseName: string
  ) => Promise<boolean>;

  deleteExercise: (
    exerciseId: string
  ) => Promise<boolean>;

  addSet: (
    workoutExerciseId: string
  ) => Promise<boolean>;

  updateSet: (
    setId: string,
    weight: number | null,
    reps: number | null,
    completed: boolean
  ) => Promise<boolean>;

  deleteSet: (
    setId: string
  ) => Promise<boolean>;

  finishWorkout: () => Promise<boolean>;

  clearActiveWorkout: () => void;
};

const WorkoutContext =
  createContext<WorkoutContextType | undefined>(
    undefined
  );

function getLocalDateString() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    now.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function WorkoutProvider({
  children,
}: PropsWithChildren) {
  const [activeWorkout, setActiveWorkout] =
    useState<Workout | null>(null);

  const [
    workoutHistory,
    setWorkoutHistory,
  ] = useState<WorkoutHistoryItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(true);

  useEffect(() => {
    loadActiveWorkout();
    loadWorkoutHistory();
  }, []);

  async function getCurrentUserId() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user.id;
  }

  async function startWorkout(
    name = 'Workout'
  ): Promise<boolean> {
    setLoading(true);

    const userId =
      await getCurrentUserId();

    if (!userId) {
      setLoading(false);
      return false;
    }

    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        name,
        workout_date:
          getLocalDateString(),
      })
      .select()
      .single();

    if (error) {
      console.error(
        'Error starting workout:',
        error
      );

      setLoading(false);
      return false;
    }

    setActiveWorkout({
      id: data.id,
      name: data.name,
      workoutDate:
        data.workout_date,
      startedAt:
        data.started_at,
      completedAt:
        data.completed_at,
      notes: data.notes,
      exercises: [],
    });

    setLoading(false);

    return true;
  }

  async function loadActiveWorkout(): Promise<boolean> {
    setLoading(true);

    const userId =
      await getCurrentUserId();

    if (!userId) {
      setActiveWorkout(null);
      setLoading(false);
      return false;
    }

    const { data, error } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', userId)
      .is('completed_at', null)
      .order('started_at', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        'Error finding active workout:',
        error
      );

      setActiveWorkout(null);
      setLoading(false);
      return false;
    }

    if (!data) {
      setActiveWorkout(null);
      setLoading(false);
      return true;
    }

    return await loadWorkout(data.id);
  }

  async function loadWorkout(
    workoutId: string
  ): Promise<boolean> {
    setLoading(true);

    const userId =
      await getCurrentUserId();

    if (!userId) {
      setLoading(false);
      return false;
    }

    const {
      data: workoutData,
      error: workoutError,
    } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .eq('user_id', userId)
      .single();

    if (workoutError) {
      console.error(
        'Error loading workout:',
        workoutError
      );

      setLoading(false);
      return false;
    }

    const {
      data: exerciseData,
      error: exerciseError,
    } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('exercise_order', {
        ascending: true,
      });

    if (exerciseError) {
      console.error(
        'Error loading workout exercises:',
        exerciseError
      );

      setLoading(false);
      return false;
    }

    const exercises: WorkoutExercise[] = [];

    for (const exercise of
      exerciseData ?? []) {
      const {
        data: setData,
        error: setError,
      } = await supabase
        .from('workout_sets')
        .select('*')
        .eq(
          'workout_exercise_id',
          exercise.id
        )
        .order('set_number', {
          ascending: true,
        });

      if (setError) {
        console.error(
          'Error loading workout sets:',
          setError
        );

        setLoading(false);
        return false;
      }

      exercises.push({
        id: exercise.id,

        exerciseName:
          exercise.exercise_name,

        exerciseOrder:
          exercise.exercise_order,

        sets: (setData ?? []).map(
          (set) => ({
            id: set.id,

            setNumber:
              set.set_number,

            weight:
              set.weight === null
                ? null
                : Number(set.weight),

            reps:
              set.reps === null
                ? null
                : Number(set.reps),

            completed:
              set.completed,
          })
        ),
      });
    }

    setActiveWorkout({
      id: workoutData.id,

      name: workoutData.name,

      workoutDate:
        workoutData.workout_date,

      startedAt:
        workoutData.started_at,

      completedAt:
        workoutData.completed_at,

      notes:
        workoutData.notes,

      exercises,
    });

    setLoading(false);

    return true;
  }

  async function loadWorkoutHistory(): Promise<boolean> {
    setHistoryLoading(true);

    const userId =
      await getCurrentUserId();

    if (!userId) {
      setWorkoutHistory([]);
      setHistoryLoading(false);
      return false;
    }

    const {
      data: workoutData,
      error: workoutError,
    } = await supabase
      .from('workouts')
      .select(
        'id, name, workout_date, started_at, completed_at'
      )
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', {
        ascending: false,
      });

    if (workoutError) {
      console.error(
        'Error loading workout history:',
        workoutError
      );

      setWorkoutHistory([]);
      setHistoryLoading(false);
      return false;
    }

    const historyItems: WorkoutHistoryItem[] = [];

    for (const workout of workoutData ?? []) {
      const {
        data: exerciseData,
        error: exerciseError,
      } = await supabase
        .from('workout_exercises')
        .select('id')
        .eq(
          'workout_id',
          workout.id
        );

      if (exerciseError) {
        console.error(
          'Error loading workout history exercises:',
          exerciseError
        );

        setHistoryLoading(false);
        return false;
      }

      const exerciseIds =
        (exerciseData ?? []).map(
          (exercise) => exercise.id
        );

      let setCount = 0;

      if (exerciseIds.length > 0) {
        const {
          count,
          error: setError,
        } = await supabase
          .from('workout_sets')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .in(
            'workout_exercise_id',
            exerciseIds
          );

        if (setError) {
          console.error(
            'Error counting workout history sets:',
            setError
          );

          setHistoryLoading(false);
          return false;
        }

        setCount = count ?? 0;
      }

      historyItems.push({
        id: workout.id,

        name: workout.name,

        workoutDate:
          workout.workout_date,

        startedAt:
          workout.started_at,

        completedAt:
          workout.completed_at,

        exerciseCount:
          exerciseIds.length,

        setCount,
      });
    }

    setWorkoutHistory(
      historyItems
    );

    setHistoryLoading(false);

    return true;
  }

  async function addExercise(
    exerciseName: string
  ): Promise<boolean> {
    if (!activeWorkout) {
      return false;
    }

    const trimmedName =
      exerciseName.trim();

    if (!trimmedName) {
      return false;
    }

    const exerciseOrder =
      activeWorkout.exercises.length;

    const { data, error } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id:
          activeWorkout.id,

        exercise_name:
          trimmedName,

        exercise_order:
          exerciseOrder,
      })
      .select()
      .single();

    if (error) {
      console.error(
        'Error adding exercise:',
        error
      );

      return false;
    }

    const newExercise: WorkoutExercise = {
      id: data.id,

      exerciseName:
        data.exercise_name,

      exerciseOrder:
        data.exercise_order,

      sets: [],
    };

    setActiveWorkout(
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          exercises: [
            ...current.exercises,
            newExercise,
          ],
        };
      }
    );

    return true;
  }

  async function deleteExercise(
    exerciseId: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', exerciseId);

    if (error) {
      console.error(
        'Error deleting exercise:',
        error
      );

      return false;
    }

    setActiveWorkout(
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          exercises:
            current.exercises.filter(
              (exercise) =>
                exercise.id !==
                exerciseId
            ),
        };
      }
    );

    return true;
  }

  async function addSet(
    workoutExerciseId: string
  ): Promise<boolean> {
    if (!activeWorkout) {
      return false;
    }

    const exercise =
      activeWorkout.exercises.find(
        (item) =>
          item.id ===
          workoutExerciseId
      );

    if (!exercise) {
      return false;
    }

    const highestSetNumber =
      exercise.sets.reduce(
        (highest, set) =>
          Math.max(
            highest,
            set.setNumber
          ),
        0
      );

    const setNumber =
      highestSetNumber + 1;

    const { data, error } = await supabase
      .from('workout_sets')
      .insert({
        workout_exercise_id:
          workoutExerciseId,

        set_number:
          setNumber,

        weight: null,

        reps: null,

        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error(
        'Error adding workout set:',
        error
      );

      return false;
    }

    const newSet: WorkoutSet = {
      id: data.id,

      setNumber:
        data.set_number,

      weight:
        data.weight === null
          ? null
          : Number(data.weight),

      reps:
        data.reps === null
          ? null
          : Number(data.reps),

      completed:
        data.completed,
    };

    setActiveWorkout(
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          exercises:
            current.exercises.map(
              (item) =>
                item.id ===
                workoutExerciseId
                  ? {
                      ...item,

                      sets: [
                        ...item.sets,
                        newSet,
                      ],
                    }
                  : item
            ),
        };
      }
    );

    return true;
  }

  async function updateSet(
    setId: string,
    weight: number | null,
    reps: number | null,
    completed: boolean
  ): Promise<boolean> {
    const { error } = await supabase
      .from('workout_sets')
      .update({
        weight,
        reps,
        completed,
      })
      .eq('id', setId);

    if (error) {
      console.error(
        'Error updating workout set:',
        error
      );

      return false;
    }

    setActiveWorkout(
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          exercises:
            current.exercises.map(
              (exercise) => ({
                ...exercise,

                sets:
                  exercise.sets.map(
                    (set) =>
                      set.id === setId
                        ? {
                            ...set,
                            weight,
                            reps,
                            completed,
                          }
                        : set
                  ),
              })
            ),
        };
      }
    );

    return true;
  }

  async function deleteSet(
    setId: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('workout_sets')
      .delete()
      .eq('id', setId);

    if (error) {
      console.error(
        'Error deleting workout set:',
        error
      );

      return false;
    }

    setActiveWorkout(
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          exercises:
            current.exercises.map(
              (exercise) => ({
                ...exercise,

                sets:
                  exercise.sets.filter(
                    (set) =>
                      set.id !== setId
                  ),
              })
            ),
        };
      }
    );

    return true;
  }

  async function finishWorkout(): Promise<boolean> {
    if (!activeWorkout) {
      return false;
    }

    const completedAt =
      new Date().toISOString();

    const { error } = await supabase
      .from('workouts')
      .update({
        completed_at:
          completedAt,
      })
      .eq(
        'id',
        activeWorkout.id
      );

    if (error) {
      console.error(
        'Error finishing workout:',
        error
      );

      return false;
    }

    setActiveWorkout({
      ...activeWorkout,
      completedAt,
    });

    await loadWorkoutHistory();

    return true;
  }

  function clearActiveWorkout() {
    setActiveWorkout(null);
  }

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        workoutHistory,
        loading,
        historyLoading,
        startWorkout,
        loadWorkout,
        loadActiveWorkout,
        loadWorkoutHistory,
        addExercise,
        deleteExercise,
        addSet,
        updateSet,
        deleteSet,
        finishWorkout,
        clearActiveWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context =
    useContext(WorkoutContext);

  if (!context) {
    throw new Error(
      'useWorkout must be used inside WorkoutProvider'
    );
  }

  return context;
}