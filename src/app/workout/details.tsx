import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import AppCard from '../../components/AppCard';
import {
    colors,
    fontSize,
    spacing,
} from '../../constants/theme';
import type {
    Workout,
    WorkoutExercise,
} from '../../context/WorkoutContext';
import { supabase } from '../../lib/supabase';

export default function WorkoutDetailsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    workoutId?: string;
  }>();

  const [workout, setWorkout] =
    useState<Workout | null>(null);

  const [loading, setLoading] =
    useState(true);

  const workoutId =
    typeof params.workoutId === 'string'
      ? params.workoutId
      : null;

  useEffect(() => {
    loadWorkoutDetails();
  }, [workoutId]);

  async function loadWorkoutDetails() {
    setLoading(true);

    if (!workoutId) {
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        'Unable to load workout user:',
        userError
      );

      setLoading(false);
      return;
    }

    const {
      data: workoutData,
      error: workoutError,
    } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .eq('user_id', user.id)
      .single();

    if (workoutError) {
      console.error(
        'Error loading workout details:',
        workoutError
      );

      setLoading(false);
      return;
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
      return;
    }

    const exercises: WorkoutExercise[] = [];

    for (const exercise of exerciseData ?? []) {
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
        return;
      }

      exercises.push({
        id: exercise.id,

        exerciseName:
          exercise.exercise_name,

        exerciseOrder:
          exercise.exercise_order,

        sets: (setData ?? []).map((set) => ({
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
        })),
      });
    }

    setWorkout({
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
  }

  const totalSets =
    workout?.exercises.reduce(
      (total, exercise) =>
        total + exercise.sets.length,
      0
    ) ?? 0;

  function formatWorkoutDate(date: string) {
    const parsedDate = new Date(
      `${date}T00:00:00`
    );

    return parsedDate.toLocaleDateString(
      undefined,
      {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading workout...
        </Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.errorTitle}>
          Workout not found
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            GO BACK
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <Pressable
        style={styles.backLink}
        onPress={() => router.back()}
      >
        <Text style={styles.backLinkText}>
          ← Back
        </Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.screenTitle}>
          {workout.name}
        </Text>

        <Text style={styles.subtitle}>
          {formatWorkoutDate(
            workout.workoutDate
          )}
        </Text>
      </View>

      <AppCard>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {workout.exercises.length}
            </Text>

            <Text style={styles.summaryLabel}>
              Exercises
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {totalSets}
            </Text>

            <Text style={styles.summaryLabel}>
              Sets
            </Text>
          </View>
        </View>
      </AppCard>

      {workout.exercises.length === 0 ? (
        <AppCard>
          <Text style={styles.emptyTitle}>
            No exercises recorded
          </Text>
        </AppCard>
      ) : (
        workout.exercises.map(
          (exercise, exerciseIndex) => (
            <AppCard key={exercise.id}>
              <View style={styles.exerciseHeader}>
                <View
                  style={styles.exerciseNumber}
                >
                  <Text
                    style={
                      styles.exerciseNumberText
                    }
                  >
                    {exerciseIndex + 1}
                  </Text>
                </View>

                <View style={styles.exerciseInfo}>
                  <Text
                    style={styles.exerciseName}
                  >
                    {exercise.exerciseName}
                  </Text>

                  <Text
                    style={styles.secondaryText}
                  >
                    {exercise.sets.length}{' '}
                    {exercise.sets.length === 1
                      ? 'set'
                      : 'sets'}
                  </Text>
                </View>
              </View>

              {exercise.sets.length > 0 && (
                <View style={styles.setTable}>
                  <View
                    style={styles.setHeaderRow}
                  >
                    <Text
                      style={[
                        styles.setHeaderText,
                        styles.setNumberColumn,
                      ]}
                    >
                      SET
                    </Text>

                    <Text
                      style={[
                        styles.setHeaderText,
                        styles.inputColumn,
                      ]}
                    >
                      WEIGHT
                    </Text>

                    <Text
                      style={[
                        styles.setHeaderText,
                        styles.inputColumn,
                      ]}
                    >
                      REPS
                    </Text>

                    <Text
                      style={[
                        styles.setHeaderText,
                        styles.doneColumn,
                      ]}
                    >
                      DONE
                    </Text>
                  </View>

                  {exercise.sets.map((set) => (
                    <View
                      key={set.id}
                      style={styles.setRow}
                    >
                      <View
                        style={[
                          styles.setNumberCell,
                          styles.setNumberColumn,
                        ]}
                      >
                        <Text
                          style={
                            styles.setNumberText
                          }
                        >
                          {set.setNumber}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.valueCell,
                          styles.inputColumn,
                        ]}
                      >
                        <Text
                          style={styles.valueText}
                        >
                          {set.weight ?? '—'}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.valueCell,
                          styles.inputColumn,
                        ]}
                      >
                        <Text
                          style={styles.valueText}
                        >
                          {set.reps ?? '—'}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.doneCell,
                          styles.doneColumn,
                          set.completed &&
                            styles.completedCell,
                        ]}
                      >
                        <Text
                          style={[
                            styles.doneText,
                            set.completed &&
                              styles.completedText,
                          ]}
                        >
                          {set.completed
                            ? '✓'
                            : '○'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </AppCard>
          )
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },

  errorTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },

  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },

  backButtonText: {
    color: colors.background,
    fontSize: fontSize.body,
    fontWeight: '700',
  },

  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },

  backLinkText: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: '600',
  },

  header: {
    gap: spacing.xs,
  },

  screenTitle: {
    color: colors.text,
    fontSize: fontSize.screenTitle,
    fontWeight: '700',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  summaryItem: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },

  summaryValue: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },

  summaryLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    marginTop: spacing.xs,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '600',
  },

  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  exerciseNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  exerciseNumberText: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: '700',
  },

  exerciseInfo: {
    flex: 1,
  },

  exerciseName: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '600',
  },

  secondaryText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },

  setTable: {
    width: '100%',
    gap: spacing.sm,
  },

  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 6,
  },

  setHeaderText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 6,
  },

  setNumberColumn: {
    width: 32,
    flexShrink: 0,
  },

  inputColumn: {
    flex: 1,
    minWidth: 0,
  },

  doneColumn: {
    width: 42,
    flexShrink: 0,
  },

  setNumberCell: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  setNumberText: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '600',
  },

  valueCell: {
    height: 44,
    minWidth: 0,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  valueText: {
    color: colors.text,
    fontSize: fontSize.body,
  },

  doneCell: {
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  completedCell: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  doneText: {
    color: colors.textSecondary,
    fontSize: 22,
    fontWeight: '700',
  },

  completedText: {
    color: colors.background,
  },
});