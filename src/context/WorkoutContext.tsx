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

export type WorkoutTemplateExercise = {
  id: string;
  exerciseName: string;
  exerciseOrder: number;
  setCount: number;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  exercises: WorkoutTemplateExercise[];
};

type WorkoutContextType = {
  activeWorkout: Workout | null;
  workoutHistory: WorkoutHistoryItem[];
  workoutTemplates: WorkoutTemplate[];

  loading: boolean;
  historyLoading: boolean;
  templatesLoading: boolean;

  startWorkout: (
    name?: string
  ) => Promise<boolean>;

  loadWorkout: (
    workoutId: string
  ) => Promise<boolean>;

  loadActiveWorkout:
    () => Promise<boolean>;

  loadWorkoutHistory:
    () => Promise<boolean>;

  loadWorkoutTemplates:
    () => Promise<boolean>;

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

  finishWorkout:
    () => Promise<boolean>;

  discardActiveWorkout:
    () => Promise<boolean>;

  saveWorkoutAsTemplate: (
    workoutId: string,
    templateName?: string
  ) => Promise<boolean>;

  startWorkoutFromTemplate: (
    templateId: string
  ) => Promise<boolean>;

  deleteWorkoutTemplate: (
    templateId: string
  ) => Promise<boolean>;

  clearActiveWorkout: () => void;
};

const WorkoutContext =
  createContext<
    WorkoutContextType | undefined
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

export function WorkoutProvider({
  children,
}: PropsWithChildren) {
  const [
    activeWorkout,
    setActiveWorkout,
  ] = useState<Workout | null>(
    null
  );

  const [
    workoutHistory,
    setWorkoutHistory,
  ] = useState<
    WorkoutHistoryItem[]
  >([]);

  const [
    workoutTemplates,
    setWorkoutTemplates,
  ] = useState<
    WorkoutTemplate[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(true);

  const [
    templatesLoading,
    setTemplatesLoading,
  ] = useState(true);

  useEffect(() => {
    loadActiveWorkout();
    loadWorkoutHistory();
    loadWorkoutTemplates();
  }, []);

  async function getCurrentUserId() {
    const {
      data: { session },
      error,
    } =
      await supabase.auth.getSession();

    if (error) {
      console.error(
        'Unable to load workout session:',
        error
      );

      return null;
    }

    return (
      session?.user?.id ?? null
    );
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

    const {
      data,
      error,
    } = await supabase
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
      notes:
        data.notes,
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

    const {
      data,
      error,
    } = await supabase
      .from('workouts')
      .select('id')
      .eq(
        'user_id',
        userId
      )
      .is(
        'completed_at',
        null
      )
      .order(
        'started_at',
        {
          ascending: false,
        }
      )
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

    return await loadWorkout(
      data.id
    );
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
      .eq(
        'id',
        workoutId
      )
      .eq(
        'user_id',
        userId
      )
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
      .from(
        'workout_exercises'
      )
      .select('*')
      .eq(
        'workout_id',
        workoutId
      )
      .order(
        'exercise_order',
        {
          ascending: true,
        }
      );

    if (exerciseError) {
      console.error(
        'Error loading workout exercises:',
        exerciseError
      );

      setLoading(false);
      return false;
    }

    const exercises:
      WorkoutExercise[] = [];

    for (
      const exercise of
        exerciseData ?? []
    ) {
      const {
        data: setData,
        error: setError,
      } = await supabase
        .from(
          'workout_sets'
        )
        .select('*')
        .eq(
          'workout_exercise_id',
          exercise.id
        )
        .order(
          'set_number',
          {
            ascending: true,
          }
        );

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

        sets:
          (setData ?? []).map(
            (set) => ({
              id: set.id,

              setNumber:
                set.set_number,

              weight:
                set.weight === null
                  ? null
                  : Number(
                      set.weight
                    ),

              reps:
                set.reps === null
                  ? null
                  : Number(
                      set.reps
                    ),

              completed:
                set.completed,
            })
          ),
      });
    }

    setActiveWorkout({
      id: workoutData.id,
      name:
        workoutData.name,
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
    setHistoryLoading(
      true
    );

    const userId =
      await getCurrentUserId();

    if (!userId) {
      setWorkoutHistory([]);
      setHistoryLoading(
        false
      );

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
      .eq(
        'user_id',
        userId
      )
      .not(
        'completed_at',
        'is',
        null
      )
      .order(
        'completed_at',
        {
          ascending: false,
        }
      );

    if (workoutError) {
      console.error(
        'Error loading workout history:',
        workoutError
      );

      setWorkoutHistory([]);
      setHistoryLoading(
        false
      );

      return false;
    }

    const historyItems:
      WorkoutHistoryItem[] =
      [];

    for (
      const workout of
        workoutData ?? []
    ) {
      const {
        data: exerciseData,
        error: exerciseError,
      } = await supabase
        .from(
          'workout_exercises'
        )
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

        setHistoryLoading(
          false
        );

        return false;
      }

      const exerciseIds =
        (
          exerciseData ?? []
        ).map(
          (exercise) =>
            exercise.id
        );

      let setCount = 0;

      if (
        exerciseIds.length >
        0
      ) {
        const {
          count,
          error: setError,
        } = await supabase
          .from(
            'workout_sets'
          )
          .select(
            'id',
            {
              count:
                'exact',
              head: true,
            }
          )
          .in(
            'workout_exercise_id',
            exerciseIds
          );

        if (setError) {
          console.error(
            'Error counting workout history sets:',
            setError
          );

          setHistoryLoading(
            false
          );

          return false;
        }

        setCount =
          count ?? 0;
      }

      historyItems.push({
        id: workout.id,
        name:
          workout.name,
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

    setHistoryLoading(
      false
    );

    return true;
  }

  async function loadWorkoutTemplates(): Promise<boolean> {
    setTemplatesLoading(
      true
    );

    const userId =
      await getCurrentUserId();

    if (!userId) {
      setWorkoutTemplates(
        []
      );

      setTemplatesLoading(
        false
      );

      return false;
    }

    const {
      data: templateData,
      error: templateError,
    } = await supabase
      .from(
        'workout_templates'
      )
      .select(
        'id, name, created_at, updated_at'
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
      );

    if (templateError) {
      console.error(
        'Error loading workout templates:',
        templateError
      );

      setWorkoutTemplates(
        []
      );

      setTemplatesLoading(
        false
      );

      return false;
    }

    const templates:
      WorkoutTemplate[] = [];

    for (
      const template of
        templateData ?? []
    ) {
      const {
        data:
          templateExerciseData,
        error:
          templateExerciseError,
      } = await supabase
        .from(
          'workout_template_exercises'
        )
        .select('*')
        .eq(
          'template_id',
          template.id
        )
        .order(
          'exercise_order',
          {
            ascending: true,
          }
        );

      if (
        templateExerciseError
      ) {
        console.error(
          'Error loading template exercises:',
          templateExerciseError
        );

        setTemplatesLoading(
          false
        );

        return false;
      }

      templates.push({
        id:
          template.id,

        name:
          template.name,

        createdAt:
          template.created_at,

        updatedAt:
          template.updated_at,

        exercises:
          (
            templateExerciseData ??
            []
          ).map(
            (exercise) => ({
              id:
                exercise.id,

              exerciseName:
                exercise.exercise_name,

              exerciseOrder:
                exercise.exercise_order,

              setCount:
                exercise.set_count,
            })
          ),
      });
    }

    setWorkoutTemplates(
      templates
    );

    setTemplatesLoading(
      false
    );

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
      activeWorkout.exercises
        .length;

    const {
      data,
      error,
    } = await supabase
      .from(
        'workout_exercises'
      )
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

    const newExercise:
      WorkoutExercise = {
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
    const {
      error,
    } = await supabase
      .from(
        'workout_exercises'
      )
      .delete()
      .eq(
        'id',
        exerciseId
      );

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
        (
          highest,
          set
        ) =>
          Math.max(
            highest,
            set.setNumber
          ),
        0
      );

    const setNumber =
      highestSetNumber + 1;

    const {
      data,
      error,
    } = await supabase
      .from(
        'workout_sets'
      )
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

    const newSet:
      WorkoutSet = {
      id: data.id,

      setNumber:
        data.set_number,

      weight:
        data.weight === null
          ? null
          : Number(
              data.weight
            ),

      reps:
        data.reps === null
          ? null
          : Number(
              data.reps
            ),

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
    const {
      error,
    } = await supabase
      .from(
        'workout_sets'
      )
      .update({
        weight,
        reps,
        completed,
      })
      .eq(
        'id',
        setId
      );

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
                      set.id ===
                      setId
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
    const {
      error,
    } = await supabase
      .from(
        'workout_sets'
      )
      .delete()
      .eq(
        'id',
        setId
      );

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
                      set.id !==
                      setId
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

    const {
      error,
    } = await supabase
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

  async function discardActiveWorkout(): Promise<boolean> {
    if (!activeWorkout) {
      return false;
    }

    const userId =
      await getCurrentUserId();

    if (!userId) {
      return false;
    }

    const workoutId =
      activeWorkout.id;

    const {
      data: workoutData,
      error: workoutError,
    } = await supabase
      .from('workouts')
      .select('id, completed_at')
      .eq(
        'id',
        workoutId
      )
      .eq(
        'user_id',
        userId
      )
      .maybeSingle();

    if (workoutError) {
      console.error(
        'Error verifying workout before discard:',
        workoutError
      );

      return false;
    }

    if (!workoutData) {
      setActiveWorkout(null);

      return true;
    }

    if (
      workoutData.completed_at !==
      null
    ) {
      console.error(
        'Completed workouts cannot be discarded as active workouts.'
      );

      return false;
    }

    const {
      data: exerciseData,
      error: exerciseLoadError,
    } = await supabase
      .from(
        'workout_exercises'
      )
      .select('id')
      .eq(
        'workout_id',
        workoutId
      );

    if (exerciseLoadError) {
      console.error(
        'Error loading workout exercises for discard:',
        exerciseLoadError
      );

      return false;
    }

    const exerciseIds =
      (
        exerciseData ?? []
      ).map(
        (exercise) =>
          exercise.id
      );

    if (
      exerciseIds.length > 0
    ) {
      const {
        error: setDeleteError,
      } = await supabase
        .from(
          'workout_sets'
        )
        .delete()
        .in(
          'workout_exercise_id',
          exerciseIds
        );

      if (setDeleteError) {
        console.error(
          'Error deleting workout sets during discard:',
          setDeleteError
        );

        return false;
      }

      const {
        error:
          exerciseDeleteError,
      } = await supabase
        .from(
          'workout_exercises'
        )
        .delete()
        .eq(
          'workout_id',
          workoutId
        );

      if (
        exerciseDeleteError
      ) {
        console.error(
          'Error deleting workout exercises during discard:',
          exerciseDeleteError
        );

        return false;
      }
    }

    const {
      error: deleteError,
    } = await supabase
      .from('workouts')
      .delete()
      .eq(
        'id',
        workoutId
      )
      .eq(
        'user_id',
        userId
      )
      .is(
        'completed_at',
        null
      );

    if (deleteError) {
      console.error(
        'Error discarding active workout:',
        deleteError
      );

      return false;
    }

    setActiveWorkout(null);

    return true;
  }

  async function saveWorkoutAsTemplate(
    workoutId: string,
    templateName?: string
  ): Promise<boolean> {
    const userId =
      await getCurrentUserId();

    if (!userId) {
      return false;
    }

    const {
      data: workoutData,
      error: workoutError,
    } = await supabase
      .from('workouts')
      .select('id, name')
      .eq(
        'id',
        workoutId
      )
      .eq(
        'user_id',
        userId
      )
      .single();

    if (workoutError) {
      console.error(
        'Error loading workout for template:',
        workoutError
      );

      return false;
    }

    const {
      data: exerciseData,
      error: exerciseError,
    } = await supabase
      .from(
        'workout_exercises'
      )
      .select(
        'id, exercise_name, exercise_order'
      )
      .eq(
        'workout_id',
        workoutId
      )
      .order(
        'exercise_order',
        {
          ascending: true,
        }
      );

    if (exerciseError) {
      console.error(
        'Error loading exercises for template:',
        exerciseError
      );

      return false;
    }

    if (
      !exerciseData ||
      exerciseData.length === 0
    ) {
      console.error(
        'Cannot save an empty workout as a template.'
      );

      return false;
    }

    const finalTemplateName =
      templateName?.trim() ||
      workoutData.name ||
      'Workout Template';

    const {
      data: templateData,
      error: templateError,
    } = await supabase
      .from(
        'workout_templates'
      )
      .insert({
        user_id:
          userId,
        name:
          finalTemplateName,
      })
      .select()
      .single();

    if (templateError) {
      console.error(
        'Error creating workout template:',
        templateError
      );

      return false;
    }

    for (
      const exercise of
        exerciseData
    ) {
      const {
        count,
        error: setCountError,
      } = await supabase
        .from(
          'workout_sets'
        )
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          }
        )
        .eq(
          'workout_exercise_id',
          exercise.id
        );

      if (setCountError) {
        console.error(
          'Error counting template sets:',
          setCountError
        );

        await supabase
          .from(
            'workout_templates'
          )
          .delete()
          .eq(
            'id',
            templateData.id
          );

        return false;
      }

      const {
        error:
          templateExerciseError,
      } = await supabase
        .from(
          'workout_template_exercises'
        )
        .insert({
          template_id:
            templateData.id,

          exercise_name:
            exercise.exercise_name,

          exercise_order:
            exercise.exercise_order,

          set_count:
            count ?? 0,
        });

      if (
        templateExerciseError
      ) {
        console.error(
          'Error creating template exercise:',
          templateExerciseError
        );

        await supabase
          .from(
            'workout_templates'
          )
          .delete()
          .eq(
            'id',
            templateData.id
          );

        return false;
      }
    }

    await loadWorkoutTemplates();

    return true;
  }

  async function startWorkoutFromTemplate(
    templateId: string
  ): Promise<boolean> {
    if (activeWorkout) {
      return false;
    }

    setLoading(true);

    const userId =
      await getCurrentUserId();

    if (!userId) {
      setLoading(false);
      return false;
    }

    const {
      data: templateData,
      error: templateError,
    } = await supabase
      .from(
        'workout_templates'
      )
      .select(
        'id, name'
      )
      .eq(
        'id',
        templateId
      )
      .eq(
        'user_id',
        userId
      )
      .single();

    if (templateError) {
      console.error(
        'Error loading workout template:',
        templateError
      );

      setLoading(false);
      return false;
    }

    const {
      data: templateExercises,
      error:
        templateExercisesError,
    } = await supabase
      .from(
        'workout_template_exercises'
      )
      .select('*')
      .eq(
        'template_id',
        templateId
      )
      .order(
        'exercise_order',
        {
          ascending: true,
        }
      );

    if (
      templateExercisesError
    ) {
      console.error(
        'Error loading workout template exercises:',
        templateExercisesError
      );

      setLoading(false);
      return false;
    }

    const {
      data: workoutData,
      error: workoutError,
    } = await supabase
      .from('workouts')
      .insert({
        user_id:
          userId,

        name:
          templateData.name,

        workout_date:
          getLocalDateString(),
      })
      .select()
      .single();

    if (workoutError) {
      console.error(
        'Error starting workout from template:',
        workoutError
      );

      setLoading(false);
      return false;
    }

    for (
      const templateExercise of
        templateExercises ?? []
    ) {
      const {
        data: exerciseData,
        error: exerciseError,
      } = await supabase
        .from(
          'workout_exercises'
        )
        .insert({
          workout_id:
            workoutData.id,

          exercise_name:
            templateExercise.exercise_name,

          exercise_order:
            templateExercise.exercise_order,
        })
        .select()
        .single();

      if (exerciseError) {
        console.error(
          'Error creating exercise from template:',
          exerciseError
        );

        await supabase
          .from('workouts')
          .delete()
          .eq(
            'id',
            workoutData.id
          );

        setLoading(false);
        return false;
      }

      const setCount =
        Number(
          templateExercise.set_count
        ) || 0;

      for (
        let setNumber = 1;
        setNumber <=
        setCount;
        setNumber += 1
      ) {
        const {
          error: setError,
        } = await supabase
          .from(
            'workout_sets'
          )
          .insert({
            workout_exercise_id:
              exerciseData.id,

            set_number:
              setNumber,

            weight: null,

            reps: null,

            completed:
              false,
          });

        if (setError) {
          console.error(
            'Error creating set from template:',
            setError
          );

          await supabase
            .from(
              'workouts'
            )
            .delete()
            .eq(
              'id',
              workoutData.id
            );

          setLoading(false);
          return false;
        }
      }
    }

    const success =
      await loadWorkout(
        workoutData.id
      );

    setLoading(false);

    return success;
  }

  async function deleteWorkoutTemplate(
    templateId: string
  ): Promise<boolean> {
    const userId =
      await getCurrentUserId();

    if (!userId) {
      return false;
    }

    const {
      error,
    } = await supabase
      .from(
        'workout_templates'
      )
      .delete()
      .eq(
        'id',
        templateId
      )
      .eq(
        'user_id',
        userId
      );

    if (error) {
      console.error(
        'Error deleting workout template:',
        error
      );

      return false;
    }

    setWorkoutTemplates(
      (current) =>
        current.filter(
          (template) =>
            template.id !==
            templateId
        )
    );

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
        workoutTemplates,

        loading,
        historyLoading,
        templatesLoading,

        startWorkout,
        loadWorkout,
        loadActiveWorkout,
        loadWorkoutHistory,
        loadWorkoutTemplates,

        addExercise,
        deleteExercise,

        addSet,
        updateSet,
        deleteSet,

        finishWorkout,
        discardActiveWorkout,

        saveWorkoutAsTemplate,
        startWorkoutFromTemplate,
        deleteWorkoutTemplate,

        clearActiveWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context =
    useContext(
      WorkoutContext
    );

  if (!context) {
    throw new Error(
      'useWorkout must be used inside WorkoutProvider'
    );
  }

  return context;
}