import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppCard from '../../components/AppCard';
import {
  colors,
  fontSize,
  spacing,
} from '../../constants/theme';
import { useWorkout } from '../../context/WorkoutContext';

export default function WorkoutScreen() {
  const router = useRouter();

  const {
    activeWorkout,
    workoutHistory,
    loading,
    historyLoading,
    startWorkout,
    addExercise,
    addSet,
    updateSet,
    finishWorkout,
    clearActiveWorkout,
  } = useWorkout();

  const [workoutName, setWorkoutName] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [addingExercise, setAddingExercise] = useState(false);
  const [finishingWorkout, setFinishingWorkout] = useState(false);

  async function handleStartWorkout() {
    const name =
      workoutName.trim() === ''
        ? 'Workout'
        : workoutName.trim();

    const success = await startWorkout(name);

    if (!success) {
      showMessage(
        'Unable to start workout',
        'There was a problem creating your workout.'
      );

      return;
    }

    setWorkoutName('');
  }

  async function handleAddExercise() {
    const trimmedName = exerciseName.trim();

    if (!trimmedName) {
      showMessage(
        'Exercise name required',
        'Enter an exercise name before adding it.'
      );

      return;
    }

    setAddingExercise(true);

    const success = await addExercise(trimmedName);

    setAddingExercise(false);

    if (!success) {
      showMessage(
        'Unable to add exercise',
        'There was a problem adding this exercise.'
      );

      return;
    }

    setExerciseName('');
  }

  async function handleAddSet(exerciseId: string) {
    const success = await addSet(exerciseId);

    if (!success) {
      showMessage(
        'Unable to add set',
        'There was a problem adding this set.'
      );
    }
  }

  async function handleWeightChange(
    setId: string,
    text: string,
    reps: number | null,
    completed: boolean
  ) {
    const value =
      text.trim() === ''
        ? null
        : Number(text);

    if (value !== null && Number.isNaN(value)) {
      return;
    }

    await updateSet(
      setId,
      value,
      reps,
      completed
    );
  }

  async function handleRepsChange(
    setId: string,
    text: string,
    weight: number | null,
    completed: boolean
  ) {
    const value =
      text.trim() === ''
        ? null
        : Number(text);

    if (value !== null && Number.isNaN(value)) {
      return;
    }

    await updateSet(
      setId,
      weight,
      value,
      completed
    );
  }

  async function handleToggleCompleted(
    setId: string,
    weight: number | null,
    reps: number | null,
    completed: boolean
  ) {
    await updateSet(
      setId,
      weight,
      reps,
      !completed
    );
  }

  function showMessage(
    title: string,
    message: string
  ) {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  }

  async function completeWorkout() {
    setFinishingWorkout(true);

    const success = await finishWorkout();

    setFinishingWorkout(false);

    if (!success) {
      showMessage(
        'Unable to finish workout',
        'There was a problem saving your completed workout.'
      );

      return;
    }

    clearActiveWorkout();

    showMessage(
      'Workout Complete',
      'Your workout has been saved.'
    );
  }

  function confirmFinishWorkout() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Finish this workout? Your completed workout will be saved.'
      );

      if (confirmed) {
        completeWorkout();
      }

      return;
    }

    Alert.alert(
      'Finish Workout',
      'Finish this workout? Your completed workout will be saved.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Finish',
          onPress: completeWorkout,
        },
      ]
    );
  }

  function formatWorkoutDate(date: string) {
    const parsedDate = new Date(
      `${date}T00:00:00`
    );

    return parsedDate.toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  }

  function openWorkoutDetails(workoutId: string) {
    router.push({
      pathname: '/workout/details',
      params: {
        workoutId,
      },
    });
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.screenTitle}>
          Workout
        </Text>

        <Text style={styles.subtitle}>
          Log your training sessions.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading workout...
          </Text>
        </View>
      ) : activeWorkout ? (
        <>
          <AppCard>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {activeWorkout.name}
              </Text>

              <Text style={styles.activeText}>
                ACTIVE
              </Text>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {activeWorkout.exercises.length}
                </Text>

                <Text style={styles.statLabel}>
                  Exercises
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {activeWorkout.exercises.reduce(
                    (total, exercise) =>
                      total + exercise.sets.length,
                    0
                  )}
                </Text>

                <Text style={styles.statLabel}>
                  Sets
                </Text>
              </View>
            </View>
          </AppCard>

          <AppCard>
            <Text style={styles.cardTitle}>
              Add Exercise
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                EXERCISE NAME
              </Text>

              <TextInput
                style={styles.input}
                value={exerciseName}
                onChangeText={setExerciseName}
                placeholder="Bench Press"
                placeholderTextColor={
                  colors.textSecondary
                }
              />
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                addingExercise &&
                  styles.disabledButton,
              ]}
              onPress={handleAddExercise}
              disabled={addingExercise}
            >
              {addingExercise ? (
                <ActivityIndicator
                  color={colors.background}
                />
              ) : (
                <Text style={styles.primaryButtonText}>
                  ADD EXERCISE
                </Text>
              )}
            </Pressable>
          </AppCard>

          {activeWorkout.exercises.length === 0 ? (
            <AppCard>
              <Text style={styles.emptyTitle}>
                No exercises yet
              </Text>

              <Text style={styles.secondaryText}>
                Add your first exercise above.
              </Text>
            </AppCard>
          ) : (
            activeWorkout.exercises.map(
              (exercise, index) => (
                <AppCard key={exercise.id}>
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseNumber}>
                      <Text
                        style={
                          styles.exerciseNumberText
                        }
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>
                        {exercise.exerciseName}
                      </Text>

                      <Text style={styles.secondaryText}>
                        {exercise.sets.length}{' '}
                        {exercise.sets.length === 1
                          ? 'set'
                          : 'sets'}
                      </Text>
                    </View>
                  </View>

                  {exercise.sets.length > 0 && (
                    <View style={styles.setTable}>
                      <View style={styles.setHeaderRow}>
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

                          <TextInput
                            style={[
                              styles.setInput,
                              styles.inputColumn,
                            ]}
                            value={
                              set.weight === null
                                ? ''
                                : String(set.weight)
                            }
                            onChangeText={(text) =>
                              handleWeightChange(
                                set.id,
                                text,
                                set.reps,
                                set.completed
                              )
                            }
                            placeholder="0"
                            placeholderTextColor={
                              colors.textSecondary
                            }
                            keyboardType="decimal-pad"
                          />

                          <TextInput
                            style={[
                              styles.setInput,
                              styles.inputColumn,
                            ]}
                            value={
                              set.reps === null
                                ? ''
                                : String(set.reps)
                            }
                            onChangeText={(text) =>
                              handleRepsChange(
                                set.id,
                                text,
                                set.weight,
                                set.completed
                              )
                            }
                            placeholder="0"
                            placeholderTextColor={
                              colors.textSecondary
                            }
                            keyboardType="number-pad"
                          />

                          <Pressable
                            style={[
                              styles.completeButton,
                              styles.doneColumn,
                              set.completed &&
                                styles.completedButton,
                            ]}
                            onPress={() =>
                              handleToggleCompleted(
                                set.id,
                                set.weight,
                                set.reps,
                                set.completed
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.completeButtonText,
                                set.completed &&
                                  styles.completedButtonText,
                              ]}
                            >
                              {set.completed ? '✓' : '○'}
                            </Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}

                  <Pressable
                    style={styles.addSetButton}
                    onPress={() =>
                      handleAddSet(exercise.id)
                    }
                  >
                    <Text
                      style={
                        styles.addSetButtonText
                      }
                    >
                      + ADD SET
                    </Text>
                  </Pressable>
                </AppCard>
              )
            )
          )}

          <Pressable
            style={[
              styles.finishButton,
              finishingWorkout &&
                styles.disabledButton,
            ]}
            onPress={confirmFinishWorkout}
            disabled={finishingWorkout}
          >
            {finishingWorkout ? (
              <ActivityIndicator
                color={colors.text}
              />
            ) : (
              <Text style={styles.finishButtonText}>
                FINISH WORKOUT
              </Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
          <AppCard>
            <Text style={styles.cardTitle}>
              Start a Workout
            </Text>

            <Text style={styles.secondaryText}>
              Give your workout a name, or leave it
              blank to use "Workout".
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                WORKOUT NAME
              </Text>

              <TextInput
                style={styles.input}
                value={workoutName}
                onChangeText={setWorkoutName}
                placeholder="Push Day"
                placeholderTextColor={
                  colors.textSecondary
                }
              />
            </View>

            <Pressable
              style={styles.primaryButton}
              onPress={handleStartWorkout}
            >
              <Text style={styles.primaryButtonText}>
                START WORKOUT
              </Text>
            </Pressable>
          </AppCard>

          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>
              Workout History
            </Text>

            <Text style={styles.historyCount}>
              {workoutHistory.length}
            </Text>
          </View>

          {historyLoading ? (
            <View style={styles.historyLoading}>
              <ActivityIndicator
                color={colors.primary}
              />
            </View>
          ) : workoutHistory.length === 0 ? (
            <AppCard>
              <Text style={styles.emptyTitle}>
                No completed workouts
              </Text>

              <Text style={styles.secondaryText}>
                Finish a workout and it will appear here.
              </Text>
            </AppCard>
          ) : (
            workoutHistory.map((workout) => (
              <Pressable
                key={workout.id}
                onPress={() =>
                  openWorkoutDetails(workout.id)
                }
                style={({ pressed }) => [
                  styles.historyPressable,
                  pressed &&
                    styles.historyPressablePressed,
                ]}
              >
                <AppCard>
                  <View style={styles.historyCardHeader}>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyName}>
                        {workout.name}
                      </Text>

                      <Text style={styles.historyDate}>
                        {formatWorkoutDate(
                          workout.workoutDate
                        )}
                      </Text>
                    </View>

                    <View style={styles.historyRight}>
                      <Text style={styles.completedText}>
                        COMPLETE
                      </Text>

                      <Text style={styles.chevron}>
                        ›
                      </Text>
                    </View>
                  </View>

                  <View style={styles.historyStatRow}>
                    <View style={styles.historyStat}>
                      <Text
                        style={styles.historyStatValue}
                      >
                        {workout.exerciseCount}
                      </Text>

                      <Text
                        style={styles.historyStatLabel}
                      >
                        Exercises
                      </Text>
                    </View>

                    <View style={styles.historyStat}>
                      <Text
                        style={styles.historyStatValue}
                      >
                        {workout.setCount}
                      </Text>

                      <Text
                        style={styles.historyStatLabel}
                      >
                        Sets
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.viewWorkoutText}>
                    VIEW WORKOUT
                  </Text>
                </AppCard>
              </Pressable>
            ))
          )}
        </>
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

  header: {
    marginBottom: spacing.sm,
  },

  screenTitle: {
    color: colors.text,
    fontSize: fontSize.screenTitle,
    fontWeight: '700',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    marginTop: spacing.xs,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },

  cardTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '600',
  },

  activeText: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: '700',
    letterSpacing: 1,
  },

  secondaryText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },

  inputGroup: {
    gap: spacing.sm,
  },

  label: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: '600',
    letterSpacing: 1,
  },

  input: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSize.body,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: colors.background,
    fontSize: fontSize.body,
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.6,
  },

  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  statItem: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },

  statValue: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },

  statLabel: {
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
    justifyContent: 'center',
    alignItems: 'center',
  },

  setNumberText: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '600',
  },

  setInput: {
    height: 44,
    minWidth: 0,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    fontSize: fontSize.body,
    textAlign: 'center',
    paddingHorizontal: 4,
  },

  completeButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  completedButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  completeButtonText: {
    color: colors.textSecondary,
    fontSize: 22,
    fontWeight: '700',
  },

  completedButtonText: {
    color: colors.background,
  },

  addSetButton: {
    width: '100%',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  addSetButtonText: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: '700',
  },

  finishButton: {
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },

  finishButtonText: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: '700',
  },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },

  historyCount: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    fontWeight: '600',
  },

  historyLoading: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },

  historyPressable: {
    width: '100%',
  },

  historyPressablePressed: {
    opacity: 0.75,
  },

  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },

  historyInfo: {
    flex: 1,
  },

  historyName: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },

  historyDate: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    marginTop: spacing.xs,
  },

  historyRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },

  completedText: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: '700',
    letterSpacing: 1,
  },

  chevron: {
    color: colors.textSecondary,
    fontSize: 26,
    lineHeight: 26,
  },

  historyStatRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  historyStat: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
  },

  historyStatValue: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },

  historyStatLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    marginTop: spacing.xs,
  },

  viewWorkoutText: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'right',
  },
});