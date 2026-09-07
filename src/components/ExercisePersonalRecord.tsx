import { useEffect, useMemo, useState } from 'react';

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

import {
    type WorkoutSet,
} from '../context/WorkoutContext';

import { supabase } from '../lib/supabase';

type Props = {
  exerciseName: string;
  currentSets: WorkoutSet[];
};

type PreviousRecords = {
  maxWeight: number | null;
  estimatedOneRepMax: number | null;
  hasHistory: boolean;
};

function calculateEstimatedOneRepMax(
  weight: number,
  reps: number
) {
  if (reps <= 0) {
    return weight;
  }

  if (reps === 1) {
    return weight;
  }

  return weight * (1 + reps / 30);
}

export default function ExercisePersonalRecord({
  exerciseName,
  currentSets,
}: Props) {
  const [
    previousRecords,
    setPreviousRecords,
  ] = useState<PreviousRecords>({
    maxWeight: null,
    estimatedOneRepMax: null,
    hasHistory: false,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPreviousRecords() {
      setLoading(true);

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
        .select('id')
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
        .limit(100);

      if (workoutsError) {
        console.error(
          'Error loading workouts for PR calculation:',
          workoutsError
        );

        if (!cancelled) {
          setLoading(false);
        }

        return;
      }

      if (
        !workouts ||
        workouts.length === 0
      ) {
        if (!cancelled) {
          setPreviousRecords({
            maxWeight: null,
            estimatedOneRepMax: null,
            hasHistory: false,
          });

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
        .select('id')
        .in(
          'workout_id',
          workoutIds
        )
        .ilike(
          'exercise_name',
          exerciseName
        );

      if (exercisesError) {
        console.error(
          'Error loading exercises for PR calculation:',
          exercisesError
        );

        if (!cancelled) {
          setLoading(false);
        }

        return;
      }

      if (
        !exercises ||
        exercises.length === 0
      ) {
        if (!cancelled) {
          setPreviousRecords({
            maxWeight: null,
            estimatedOneRepMax: null,
            hasHistory: false,
          });

          setLoading(false);
        }

        return;
      }

      const exerciseIds =
        exercises.map(
          (exercise) =>
            exercise.id
        );

      const {
        data: sets,
        error: setsError,
      } = await supabase
        .from('workout_sets')
        .select(
          'weight, reps, completed'
        )
        .in(
          'workout_exercise_id',
          exerciseIds
        );

      if (setsError) {
        console.error(
          'Error loading sets for PR calculation:',
          setsError
        );

        if (!cancelled) {
          setLoading(false);
        }

        return;
      }

      const validSets =
        (sets ?? []).filter(
          (set) =>
            set.completed &&
            set.weight !== null &&
            set.reps !== null &&
            set.weight > 0 &&
            set.reps > 0
        );

      if (
        validSets.length === 0
      ) {
        if (!cancelled) {
          setPreviousRecords({
            maxWeight: null,
            estimatedOneRepMax: null,
            hasHistory: false,
          });

          setLoading(false);
        }

        return;
      }

      let maxWeight:
        number | null = null;

      let estimatedOneRepMax:
        number | null = null;

      for (
        const set of validSets
      ) {
        const weight =
          Number(set.weight);

        const reps =
          Number(set.reps);

        if (
          maxWeight === null ||
          weight > maxWeight
        ) {
          maxWeight = weight;
        }

        const estimatedMax =
          calculateEstimatedOneRepMax(
            weight,
            reps
          );

        if (
          estimatedOneRepMax === null ||
          estimatedMax >
            estimatedOneRepMax
        ) {
          estimatedOneRepMax =
            estimatedMax;
        }
      }

      if (!cancelled) {
        setPreviousRecords({
          maxWeight,
          estimatedOneRepMax,
          hasHistory: true,
        });

        setLoading(false);
      }
    }

    loadPreviousRecords();

    return () => {
      cancelled = true;
    };
  }, [exerciseName]);

  const currentPerformance =
    useMemo(() => {
      const completedSets =
        currentSets.filter(
          (set) =>
            set.completed &&
            set.weight !== null &&
            set.reps !== null &&
            set.weight > 0 &&
            set.reps > 0
        );

      let maxWeight:
        number | null = null;

      let estimatedOneRepMax:
        number | null = null;

      for (
        const set of completedSets
      ) {
        const weight =
          Number(set.weight);

        const reps =
          Number(set.reps);

        if (
          maxWeight === null ||
          weight > maxWeight
        ) {
          maxWeight = weight;
        }

        const estimatedMax =
          calculateEstimatedOneRepMax(
            weight,
            reps
          );

        if (
          estimatedOneRepMax === null ||
          estimatedMax >
            estimatedOneRepMax
        ) {
          estimatedOneRepMax =
            estimatedMax;
        }
      }

      return {
        maxWeight,
        estimatedOneRepMax,
        hasCompletedSets:
          completedSets.length > 0,
      };
    }, [currentSets]);

  const weightPR =
    previousRecords.hasHistory &&
    currentPerformance.maxWeight !== null &&
    previousRecords.maxWeight !== null &&
    currentPerformance.maxWeight >
      previousRecords.maxWeight;

  const estimatedOneRepMaxPR =
    previousRecords.hasHistory &&
    currentPerformance.estimatedOneRepMax !==
      null &&
    previousRecords.estimatedOneRepMax !==
      null &&
    currentPerformance.estimatedOneRepMax >
      previousRecords.estimatedOneRepMax;

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
          style={
            styles.loadingText
          }
        >
          Checking personal records...
        </Text>
      </View>
    );
  }

  if (
    !currentPerformance.hasCompletedSets
  ) {
    return null;
  }

  if (
    !previousRecords.hasHistory
  ) {
    return (
      <View
        style={
          styles.baselineCard
        }
      >
        <Text
          style={
            styles.baselineLabel
          }
        >
          BASELINE
        </Text>

        <Text
          style={
            styles.baselineText
          }
        >
          This workout will establish your first recorded performance for this exercise.
        </Text>
      </View>
    );
  }

  if (
    !weightPR &&
    !estimatedOneRepMaxPR
  ) {
    return null;
  }

  return (
    <View
      style={
        styles.recordCard
      }
    >
      <View
        style={styles.header}
      >
        <Text
          style={
            styles.recordLabel
          }
        >
          NEW PR
        </Text>

        <Text
          style={
            styles.exerciseName
          }
        >
          {exerciseName}
        </Text>
      </View>

      {weightPR && (
        <View
          style={
            styles.recordRow
          }
        >
          <View>
            <Text
              style={
                styles.recordType
              }
            >
              HEAVIEST WEIGHT
            </Text>

            <Text
              style={
                styles.recordValue
              }
            >
              {
                currentPerformance.maxWeight
              }{' '}
              lbs
            </Text>
          </View>

          <Text
            style={
              styles.previousValue
            }
          >
            Previous:{' '}
            {
              previousRecords.maxWeight
            }{' '}
            lbs
          </Text>
        </View>
      )}

      {estimatedOneRepMaxPR && (
        <View
          style={
            styles.recordRow
          }
        >
          <View>
            <Text
              style={
                styles.recordType
              }
            >
              EST. 1RM
            </Text>

            <Text
              style={
                styles.recordValue
              }
            >
              {Math.round(
                currentPerformance.estimatedOneRepMax ??
                  0
              )}{' '}
              lbs
            </Text>
          </View>

          <Text
            style={
              styles.previousValue
            }
          >
            Previous:{' '}
            {Math.round(
              previousRecords.estimatedOneRepMax ??
                0
            )}{' '}
            lbs
          </Text>
        </View>
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    loadingContainer: {
      minHeight: 48,
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

    baselineCard: {
      backgroundColor:
        colors.surfaceSecondary,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.xs,
    },

    baselineLabel: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
    },

    baselineText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
    },

    recordCard: {
      backgroundColor:
        colors.surfaceSecondary,
      borderColor:
        colors.primary,
      borderWidth: 1,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.md,
    },

    header: {
      gap: spacing.xs,
    },

    recordLabel: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.4,
    },

    exerciseName: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    recordRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'flex-end',
      gap: spacing.md,
    },

    recordType: {
      color:
        colors.textSecondary,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
    },

    recordValue: {
      color: colors.primary,
      fontSize:
        fontSize.title,
      fontWeight: '800',
      marginTop:
        spacing.xs,
    },

    previousValue: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      textAlign: 'right',
    },
  });