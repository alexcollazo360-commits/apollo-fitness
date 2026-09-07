import { useEffect, useState } from 'react';

import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    colors,
    fontSize,
    spacing,
} from '../constants/theme';

import { supabase } from '../lib/supabase';

type PreviousSet = {
  setNumber: number;
  weight: number | null;
  reps: number | null;
};

type PreviousPerformance = {
  workoutDate: string;
  workoutName: string;
  sets: PreviousSet[];
};

type Props = {
  exerciseName: string;
};

export default function PreviousExercisePerformance({
  exerciseName,
}: Props) {
  const [
    performance,
    setPerformance,
  ] = useState<PreviousPerformance | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPreviousPerformance() {
      setLoading(true);
      setPerformance(null);

      const {
        data: sessionData,
      } = await supabase.auth.getSession();

      const userId =
        sessionData.session?.user.id;

      if (!userId) {
        if (!cancelled) {
          setLoading(false);
        }

        return;
      }

      const {
        data: workouts,
        error: workoutsError,
      } = await supabase
        .from('workouts')
        .select(
          'id, name, workout_date, completed_at'
        )
        .eq('user_id', userId)
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
        )
        .limit(30);

      if (
        workoutsError ||
        !workouts ||
        workouts.length === 0
      ) {
        if (workoutsError) {
          console.error(
            'Error loading previous workouts:',
            workoutsError
          );
        }

        if (!cancelled) {
          setLoading(false);
        }

        return;
      }

      const workoutIds =
        workouts.map(
          (workout) =>
            workout.id
        );

      const {
        data: exercises,
        error: exercisesError,
      } = await supabase
        .from(
          'workout_exercises'
        )
        .select(
          'id, workout_id, exercise_name'
        )
        .in(
          'workout_id',
          workoutIds
        )
        .ilike(
          'exercise_name',
          exerciseName
        );

      if (
        exercisesError ||
        !exercises ||
        exercises.length === 0
      ) {
        if (exercisesError) {
          console.error(
            'Error loading previous exercise:',
            exercisesError
          );
        }

        if (!cancelled) {
          setLoading(false);
        }

        return;
      }

      let matchingExercise:
        | (typeof exercises)[number]
        | null = null;

      let matchingWorkout:
        | (typeof workouts)[number]
        | null = null;

      for (
        const workout of workouts
      ) {
        const exercise =
          exercises.find(
            (item) =>
              item.workout_id ===
              workout.id
          );

        if (exercise) {
          matchingExercise =
            exercise;

          matchingWorkout =
            workout;

          break;
        }
      }

      if (
        !matchingExercise ||
        !matchingWorkout
      ) {
        if (!cancelled) {
          setLoading(false);
        }

        return;
      }

      const {
        data: sets,
        error: setsError,
      } = await supabase
        .from('workout_sets')
        .select(
          'set_number, weight, reps, completed'
        )
        .eq(
          'workout_exercise_id',
          matchingExercise.id
        )
        .order(
          'set_number',
          {
            ascending: true,
          }
        );

      if (setsError) {
        console.error(
          'Error loading previous exercise sets:',
          setsError
        );

        if (!cancelled) {
          setLoading(false);
        }

        return;
      }

      const completedSets =
        (sets ?? []).filter(
          (set) =>
            set.completed &&
            (
              set.weight !== null ||
              set.reps !== null
            )
        );

      const fallbackSets =
        (sets ?? []).filter(
          (set) =>
            set.weight !== null ||
            set.reps !== null
        );

      const setsToShow =
        completedSets.length > 0
          ? completedSets
          : fallbackSets;

      if (!cancelled) {
        setPerformance({
          workoutDate:
            matchingWorkout.workout_date,

          workoutName:
            matchingWorkout.name,

          sets: setsToShow.map(
            (set) => ({
              setNumber:
                set.set_number,

              weight:
                set.weight,

              reps:
                set.reps,
            })
          ),
        });

        setLoading(false);
      }
    }

    loadPreviousPerformance();

    return () => {
      cancelled = true;
    };
  }, [exerciseName]);

  function formatDate(
    date: string
  ) {
    const parsedDate =
      new Date(
        `${date}T00:00:00`
      );

    return parsedDate.toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric',
      }
    );
  }

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="small"
          color={colors.primary}
        />

        <Text
          style={styles.loadingText}
        >
          Checking previous performance...
        </Text>
      </View>
    );
  }

  if (!performance) {
    return (
      <View
        style={
          styles.firstTimeContainer
        }
      >
        <Text
          style={
            styles.firstTimeLabel
          }
        >
          FIRST TIME
        </Text>

        <Text
          style={
            styles.firstTimeText
          }
        >
          No previous performance recorded for this exercise.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={
        styles.container
      }
    >
      <View
        style={styles.header}
      >
        <View>
          <Text
            style={styles.label}
          >
            PREVIOUS
          </Text>

          <Text
            style={
              styles.workoutName
            }
          >
            {
              performance.workoutName
            }
          </Text>
        </View>

        <Text
          style={styles.date}
        >
          {formatDate(
            performance.workoutDate
          )}
        </Text>
      </View>

      {performance.sets.length >
      0 ? (
        <View
          style={
            styles.setList
          }
        >
          {performance.sets.map(
            (set) => (
              <View
                key={
                  set.setNumber
                }
                style={
                  styles.setRow
                }
              >
                <Text
                  style={
                    styles.setNumber
                  }
                >
                  Set {set.setNumber}
                </Text>

                <Text
                  style={
                    styles.setPerformance
                  }
                >
                  {set.weight !==
                  null
                    ? set.weight
                    : '—'}
                  {' × '}
                  {set.reps !== null
                    ? `${set.reps} reps`
                    : '—'}
                </Text>
              </View>
            )
          )}
        </View>
      ) : (
        <Text
          style={
            styles.noSetsText
          }
        >
          No weight or reps were recorded.
        </Text>
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      backgroundColor:
        colors.surfaceSecondary,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.sm,
    },

    loadingContainer: {
      minHeight: 52,
      backgroundColor:
        colors.surfaceSecondary,
      borderRadius: 12,
      paddingHorizontal:
        spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    loadingText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
    },

    firstTimeContainer: {
      backgroundColor:
        colors.surfaceSecondary,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.xs,
    },

    firstTimeLabel: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
    },

    firstTimeText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
    },

    header: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
      gap: spacing.md,
    },

    label: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
    },

    workoutName: {
      color: colors.text,
      fontSize:
        fontSize.small,
      fontWeight: '600',
      marginTop:
        spacing.xs,
    },

    date: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
    },

    setList: {
      gap: spacing.xs,
    },

    setRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      paddingVertical:
        spacing.xs,
    },

    setNumber: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
    },

    setPerformance: {
      color: colors.text,
      fontSize:
        fontSize.body,
      fontWeight: '600',
    },

    noSetsText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
    },
  });