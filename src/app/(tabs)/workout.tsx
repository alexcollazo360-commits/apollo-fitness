import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

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
import ExercisePersonalRecord from '../../components/ExercisePersonalRecord';
import PreviousExercisePerformance from '../../components/PreviousExercisePerformance';

import {
  exerciseLibrary,
  type ExerciseLibraryItem,
} from '../../constants/exercises';

import {
  colors,
  fontSize,
  spacing,
} from '../../constants/theme';

import {
  useWorkout,
  type WorkoutSet,
} from '../../context/WorkoutContext';

import { supabase } from '../../lib/supabase';

type SetRowProps = {
  set: WorkoutSet;
  deleting: boolean;

  onSave: (
    setId: string,
    weight: number | null,
    reps: number | null,
    completed: boolean
  ) => Promise<void>;

  onToggleCompleted: (
    setId: string,
    weight: number | null,
    reps: number | null,
    completed: boolean
  ) => Promise<void>;

  onDelete: (
    setId: string,
    setNumber: number
  ) => void;
};

function parseNumberInput(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue === '') {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  if (Number.isNaN(parsedValue)) {
    return null;
  }

  return parsedValue;
}

function SetRow({
  set,
  deleting,
  onSave,
  onToggleCompleted,
  onDelete,
}: SetRowProps) {
  const [weightInput, setWeightInput] = useState(
    set.weight === null
      ? ''
      : String(set.weight)
  );

  const [repsInput, setRepsInput] = useState(
    set.reps === null
      ? ''
      : String(set.reps)
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setWeightInput(
      set.weight === null
        ? ''
        : String(set.weight)
    );
  }, [set.weight]);

  useEffect(() => {
    setRepsInput(
      set.reps === null
        ? ''
        : String(set.reps)
    );
  }, [set.reps]);

  async function saveCurrentValues() {
    const weight = parseNumberInput(
      weightInput
    );

    const reps = parseNumberInput(
      repsInput
    );

    const weightUnchanged =
      weight === set.weight;

    const repsUnchanged =
      reps === set.reps;

    if (
      weightUnchanged &&
      repsUnchanged
    ) {
      return;
    }

    setSaving(true);

    await onSave(
      set.id,
      weight,
      reps,
      set.completed
    );

    setSaving(false);
  }

  async function toggleCompleted() {
    const weight = parseNumberInput(
      weightInput
    );

    const reps = parseNumberInput(
      repsInput
    );

    setSaving(true);

    await onToggleCompleted(
      set.id,
      weight,
      reps,
      set.completed
    );

    setSaving(false);
  }

  return (
    <View style={styles.setRow}>
      <View
        style={[
          styles.setNumberCell,
          styles.setNumberColumn,
        ]}
      >
        <Text style={styles.setNumberText}>
          {set.setNumber}
        </Text>
      </View>

      <TextInput
        style={[
          styles.setInput,
          styles.inputColumn,
        ]}
        value={weightInput}
        onChangeText={setWeightInput}
        onBlur={saveCurrentValues}
        placeholder="0"
        placeholderTextColor={
          colors.textSecondary
        }
        keyboardType="decimal-pad"
        editable={!saving}
      />

      <TextInput
        style={[
          styles.setInput,
          styles.inputColumn,
        ]}
        value={repsInput}
        onChangeText={setRepsInput}
        onBlur={saveCurrentValues}
        placeholder="0"
        placeholderTextColor={
          colors.textSecondary
        }
        keyboardType="number-pad"
        editable={!saving}
      />

      <Pressable
        style={[
          styles.completeButton,
          styles.doneColumn,
          set.completed &&
            styles.completedButton,
        ]}
        onPress={toggleCompleted}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator
            size="small"
            color={
              set.completed
                ? colors.background
                : colors.primary
            }
          />
        ) : (
          <Text
            style={[
              styles.completeButtonText,
              set.completed &&
                styles.completedButtonText,
            ]}
          >
            {set.completed
              ? '✓'
              : '○'}
          </Text>
        )}
      </Pressable>

      <Pressable
        style={styles.deleteSetButton}
        disabled={
          deleting || saving
        }
        onPress={() =>
          onDelete(
            set.id,
            set.setNumber
          )
        }
      >
        {deleting ? (
          <ActivityIndicator
            size="small"
            color={colors.danger}
          />
        ) : (
          <Text
            style={
              styles.deleteSetText
            }
          >
            ×
          </Text>
        )}
      </Pressable>
    </View>
  );
}

export default function WorkoutScreen() {
  const router = useRouter();

  const {
    activeWorkout,
    workoutHistory,
    workoutTemplates,

    loading,
    historyLoading,
    templatesLoading,

    startWorkout,
    addExercise,
    deleteExercise,
    addSet,
    updateSet,
    deleteSet,

    finishWorkout,
    discardActiveWorkout,
    clearActiveWorkout,

    loadWorkoutHistory,

    saveWorkoutAsTemplate,
    startWorkoutFromTemplate,
    deleteWorkoutTemplate,
  } = useWorkout();

  const [
    workoutName,
    setWorkoutName,
  ] = useState('');

  const [
    exerciseSearch,
    setExerciseSearch,
  ] = useState('');

  const [
    selectedExercise,
    setSelectedExercise,
  ] = useState<
    ExerciseLibraryItem | null
  >(null);

  const [
    customExerciseMode,
    setCustomExerciseMode,
  ] = useState(false);

  const [
    customExerciseName,
    setCustomExerciseName,
  ] = useState('');

  const [
    addingExercise,
    setAddingExercise,
  ] = useState(false);

  const [
    finishingWorkout,
    setFinishingWorkout,
  ] = useState(false);

  const [
    discardingWorkout,
    setDiscardingWorkout,
  ] = useState(false);

  const [
    deletingExerciseId,
    setDeletingExerciseId,
  ] = useState<string | null>(
    null
  );

  const [
    deletingSetId,
    setDeletingSetId,
  ] = useState<string | null>(
    null
  );

  const [
    deletingWorkoutId,
    setDeletingWorkoutId,
  ] = useState<string | null>(
    null
  );

  const [
    savingTemplateWorkoutId,
    setSavingTemplateWorkoutId,
  ] = useState<string | null>(
    null
  );

  const [
    startingTemplateId,
    setStartingTemplateId,
  ] = useState<string | null>(
    null
  );

  const [
    deletingTemplateId,
    setDeletingTemplateId,
  ] = useState<string | null>(
    null
  );

  const filteredExercises =
    useMemo(() => {
      const query =
        exerciseSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return [];
      }

      return exerciseLibrary
        .filter((exercise) => {
          const searchableText =
            `${exercise.name} ${exercise.category}`.toLowerCase();

          return searchableText.includes(
            query
          );
        })
        .slice(0, 12);
    }, [exerciseSearch]);

  function showMessage(
    title: string,
    message: string
  ) {
    if (Platform.OS === 'web') {
      window.alert(
        `${title}\n\n${message}`
      );

      return;
    }

    Alert.alert(title, message);
  }

  function resetExercisePicker() {
    setExerciseSearch('');
    setSelectedExercise(null);
    setCustomExerciseMode(false);
    setCustomExerciseName('');
  }

  function selectLibraryExercise(
    exercise: ExerciseLibraryItem
  ) {
    setSelectedExercise(exercise);
    setExerciseSearch(
      exercise.name
    );
    setCustomExerciseMode(false);
    setCustomExerciseName('');
  }

  function openCustomExerciseMode() {
    setSelectedExercise(null);
    setExerciseSearch('');
    setCustomExerciseMode(true);
  }

  function cancelCustomExerciseMode() {
    setCustomExerciseMode(false);
    setCustomExerciseName('');
  }

  async function handleStartWorkout() {
    const name =
      workoutName.trim() === ''
        ? 'Workout'
        : workoutName.trim();

    const success =
      await startWorkout(name);

    if (!success) {
      showMessage(
        'Unable to start workout',
        'There was a problem creating your workout.'
      );

      return;
    }

    setWorkoutName('');
  }

  async function handleStartTemplate(
    templateId: string
  ) {
    setStartingTemplateId(
      templateId
    );

    const success =
      await startWorkoutFromTemplate(
        templateId
      );

    setStartingTemplateId(null);

    if (!success) {
      showMessage(
        'Unable to start template',
        'Apollo could not start this workout template.'
      );
    }
  }

  async function handleSaveTemplate(
    workoutId: string,
    workoutNameToSave: string
  ) {
    setSavingTemplateWorkoutId(
      workoutId
    );

    const success =
      await saveWorkoutAsTemplate(
        workoutId,
        workoutNameToSave
      );

    setSavingTemplateWorkoutId(
      null
    );

    if (!success) {
      showMessage(
        'Unable to save template',
        'Make sure this workout contains at least one exercise.'
      );

      return;
    }

    showMessage(
      'Template Saved',
      `${workoutNameToSave} is now available in Saved Templates.`
    );
  }

  function confirmSaveTemplate(
    workoutId: string,
    workoutNameToSave: string
  ) {
    const message =
      `Save "${workoutNameToSave}" as a reusable workout template?`;

    if (Platform.OS === 'web') {
      const confirmed =
        window.confirm(message);

      if (confirmed) {
        handleSaveTemplate(
          workoutId,
          workoutNameToSave
        );
      }

      return;
    }

    Alert.alert(
      'Save Template',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: () =>
            handleSaveTemplate(
              workoutId,
              workoutNameToSave
            ),
        },
      ]
    );
  }

  async function removeTemplate(
    templateId: string
  ) {
    setDeletingTemplateId(
      templateId
    );

    const success =
      await deleteWorkoutTemplate(
        templateId
      );

    setDeletingTemplateId(null);

    if (!success) {
      showMessage(
        'Unable to delete template',
        'There was a problem deleting this workout template.'
      );
    }
  }

  function confirmDeleteTemplate(
    templateId: string,
    templateName: string
  ) {
    const message =
      `Delete "${templateName}" from Saved Templates?`;

    if (Platform.OS === 'web') {
      const confirmed =
        window.confirm(message);

      if (confirmed) {
        removeTemplate(
          templateId
        );
      }

      return;
    }

    Alert.alert(
      'Delete Template',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            removeTemplate(
              templateId
            ),
        },
      ]
    );
  }

  async function handleAddExercise() {
    let exerciseNameToAdd =
      '';

    if (customExerciseMode) {
      exerciseNameToAdd =
        customExerciseName.trim();

      if (!exerciseNameToAdd) {
        showMessage(
          'Exercise name required',
          'Enter a name for your custom exercise.'
        );

        return;
      }
    } else {
      if (!selectedExercise) {
        showMessage(
          'Select an exercise',
          'Search the exercise library and select an exercise first.'
        );

        return;
      }

      exerciseNameToAdd =
        selectedExercise.name;
    }

    setAddingExercise(true);

    const success =
      await addExercise(
        exerciseNameToAdd
      );

    setAddingExercise(false);

    if (!success) {
      showMessage(
        'Unable to add exercise',
        'There was a problem adding this exercise.'
      );

      return;
    }

    resetExercisePicker();
  }

  async function handleAddSet(
    exerciseId: string
  ) {
    const success =
      await addSet(
        exerciseId
      );

    if (!success) {
      showMessage(
        'Unable to add set',
        'There was a problem adding this set.'
      );
    }
  }

  async function handleSaveSet(
    setId: string,
    weight: number | null,
    reps: number | null,
    completed: boolean
  ) {
    await updateSet(
      setId,
      weight,
      reps,
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

  async function removeExercise(
    exerciseId: string
  ) {
    setDeletingExerciseId(
      exerciseId
    );

    const success =
      await deleteExercise(
        exerciseId
      );

    setDeletingExerciseId(null);

    if (!success) {
      showMessage(
        'Unable to remove exercise',
        'There was a problem deleting this exercise.'
      );
    }
  }

  function confirmDeleteExercise(
    exerciseId: string,
    exerciseNameToDelete: string
  ) {
    const message =
      `Remove ${exerciseNameToDelete}? ` +
      'All sets inside this exercise will also be deleted.';

    if (Platform.OS === 'web') {
      const confirmed =
        window.confirm(message);

      if (confirmed) {
        removeExercise(
          exerciseId
        );
      }

      return;
    }

    Alert.alert(
      'Remove Exercise',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            removeExercise(
              exerciseId
            ),
        },
      ]
    );
  }

  async function removeSet(
    setId: string
  ) {
    setDeletingSetId(setId);

    const success =
      await deleteSet(setId);

    setDeletingSetId(null);

    if (!success) {
      showMessage(
        'Unable to remove set',
        'There was a problem deleting this set.'
      );
    }
  }

  function confirmDeleteSet(
    setId: string,
    setNumber: number
  ) {
    const message =
      `Remove set ${setNumber}?`;

    if (Platform.OS === 'web') {
      const confirmed =
        window.confirm(message);

      if (confirmed) {
        removeSet(setId);
      }

      return;
    }

    Alert.alert(
      'Remove Set',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            removeSet(setId),
        },
      ]
    );
  }

  async function completeWorkout() {
    setFinishingWorkout(true);

    const success =
      await finishWorkout();

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
    const message =
      'Finish this workout? Your completed workout will be saved.';

    if (Platform.OS === 'web') {
      const confirmed =
        window.confirm(message);

      if (confirmed) {
        completeWorkout();
      }

      return;
    }

    Alert.alert(
      'Finish Workout',
      message,
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

  async function discardWorkout() {
    setDiscardingWorkout(true);

    const success =
      await discardActiveWorkout();

    setDiscardingWorkout(false);

    if (!success) {
      showMessage(
        'Unable to discard workout',
        'There was a problem deleting this active workout.'
      );

      return;
    }

    resetExercisePicker();

    showMessage(
      'Workout Discarded',
      'The unfinished workout was permanently deleted.'
    );
  }

  function confirmDiscardWorkout() {
    const message =
      'Discard this workout? This unfinished workout, its exercises, and all sets will be permanently deleted.';

    if (Platform.OS === 'web') {
      const confirmed =
        window.confirm(message);

      if (confirmed) {
        discardWorkout();
      }

      return;
    }

    Alert.alert(
      'Discard Workout',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: discardWorkout,
        },
      ]
    );
  }

  async function deleteCompletedWorkout(
    workoutId: string
  ) {
    setDeletingWorkoutId(
      workoutId
    );

    const {
      data: exerciseData,
      error:
        exerciseLoadError,
    } = await supabase
      .from('workout_exercises')
      .select('id')
      .eq(
        'workout_id',
        workoutId
      );

    if (exerciseLoadError) {
      console.error(
        'Error loading workout exercises for deletion:',
        exerciseLoadError
      );

      setDeletingWorkoutId(null);

      showMessage(
        'Unable to delete workout',
        'There was a problem loading this workout.'
      );

      return;
    }

    const exerciseIds =
      (exerciseData ?? []).map(
        (exercise) =>
          exercise.id
      );

    if (exerciseIds.length > 0) {
      const {
        error:
          setDeleteError,
      } = await supabase
        .from('workout_sets')
        .delete()
        .in(
          'workout_exercise_id',
          exerciseIds
        );

      if (setDeleteError) {
        console.error(
          'Error deleting workout sets:',
          setDeleteError
        );

        setDeletingWorkoutId(null);

        showMessage(
          'Unable to delete workout',
          'There was a problem deleting the workout sets.'
        );

        return;
      }

      const {
        error:
          exerciseDeleteError,
      } = await supabase
        .from('workout_exercises')
        .delete()
        .eq(
          'workout_id',
          workoutId
        );

      if (exerciseDeleteError) {
        console.error(
          'Error deleting workout exercises:',
          exerciseDeleteError
        );

        setDeletingWorkoutId(null);

        showMessage(
          'Unable to delete workout',
          'There was a problem deleting the workout exercises.'
        );

        return;
      }
    }

    const {
      error:
        workoutDeleteError,
    } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId);

    if (workoutDeleteError) {
      console.error(
        'Error deleting workout:',
        workoutDeleteError
      );

      setDeletingWorkoutId(null);

      showMessage(
        'Unable to delete workout',
        'There was a problem deleting this workout.'
      );

      return;
    }

    await loadWorkoutHistory();

    setDeletingWorkoutId(null);
  }

  function confirmDeleteWorkout(
    workoutId: string,
    workoutNameToDelete: string
  ) {
    const message =
      `Delete "${workoutNameToDelete}"? ` +
      'This workout, its exercises, and all sets will be permanently deleted.';

    if (Platform.OS === 'web') {
      const confirmed =
        window.confirm(message);

      if (confirmed) {
        deleteCompletedWorkout(
          workoutId
        );
      }

      return;
    }

    Alert.alert(
      'Delete Workout',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteCompletedWorkout(
              workoutId
            ),
        },
      ]
    );
  }

  function formatWorkoutDate(
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
        year: 'numeric',
      }
    );
  }

  function openWorkoutDetails(
    workoutId: string
  ) {
    router.push({
      pathname:
        '/workout/details',

      params: {
        workoutId,
      },
    });
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.container
      }
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
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading workout...
          </Text>
        </View>
      ) : activeWorkout ? (
        <>
          <AppCard>
            <View
              style={
                styles.cardHeader
              }
            >
              <Text
                style={
                  styles.cardTitle
                }
              >
                {activeWorkout.name}
              </Text>

              <Text
                style={
                  styles.activeText
                }
              >
                ACTIVE
              </Text>
            </View>

            <View style={styles.statRow}>
              <View
                style={
                  styles.statItem
                }
              >
                <Text
                  style={
                    styles.statValue
                  }
                >
                  {
                    activeWorkout
                      .exercises
                      .length
                  }
                </Text>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  Exercises
                </Text>
              </View>

              <View
                style={
                  styles.statItem
                }
              >
                <Text
                  style={
                    styles.statValue
                  }
                >
                  {activeWorkout.exercises.reduce(
                    (
                      total,
                      exercise
                    ) =>
                      total +
                      exercise.sets
                        .length,
                    0
                  )}
                </Text>

                <Text
                  style={
                    styles.statLabel
                  }
                >
                  Sets
                </Text>
              </View>
            </View>

            <Pressable
              style={[
                styles.templateOutlineButton,
                savingTemplateWorkoutId ===
                  activeWorkout.id &&
                  styles.disabledButton,
              ]}
              disabled={
                savingTemplateWorkoutId ===
                activeWorkout.id
              }
              onPress={() =>
                confirmSaveTemplate(
                  activeWorkout.id,
                  activeWorkout.name
                )
              }
            >
              {savingTemplateWorkoutId ===
              activeWorkout.id ? (
                <ActivityIndicator
                  size="small"
                  color={
                    colors.primary
                  }
                />
              ) : (
                <Text
                  style={
                    styles.templateOutlineButtonText
                  }
                >
                  SAVE AS TEMPLATE
                </Text>
              )}
            </Pressable>
          </AppCard>

          <AppCard>
            <Text style={styles.cardTitle}>
              Add Exercise
            </Text>

            <Text
              style={
                styles.secondaryText
              }
            >
              Search the exercise library or add a custom exercise.
            </Text>

            {!customExerciseMode ? (
              <>
                <View
                  style={
                    styles.inputGroup
                  }
                >
                  <Text
                    style={
                      styles.label
                    }
                  >
                    SEARCH EXERCISES
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={
                      exerciseSearch
                    }
                    onChangeText={(
                      value
                    ) => {
                      setExerciseSearch(
                        value
                      );

                      setSelectedExercise(
                        null
                      );
                    }}
                    placeholder="Bench press, back, biceps..."
                    placeholderTextColor={
                      colors.textSecondary
                    }
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                {selectedExercise ? (
                  <View
                    style={
                      styles.selectedExerciseCard
                    }
                  >
                    <View
                      style={
                        styles.selectedExerciseInfo
                      }
                    >
                      <Text
                        style={
                          styles.selectedExerciseLabel
                        }
                      >
                        SELECTED
                      </Text>

                      <Text
                        style={
                          styles.selectedExerciseName
                        }
                      >
                        {
                          selectedExercise.name
                        }
                      </Text>

                      <Text
                        style={
                          styles.selectedExerciseCategory
                        }
                      >
                        {
                          selectedExercise.category
                        }
                      </Text>
                    </View>

                    <Pressable
                      style={
                        styles.clearSelectionButton
                      }
                      onPress={() => {
                        setSelectedExercise(
                          null
                        );

                        setExerciseSearch(
                          ''
                        );
                      }}
                    >
                      <Text
                        style={
                          styles.clearSelectionText
                        }
                      >
                        CHANGE
                      </Text>
                    </Pressable>
                  </View>
                ) : exerciseSearch.trim() !==
                  '' ? (
                  <View
                    style={
                      styles.searchResults
                    }
                  >
                    {filteredExercises.length >
                    0 ? (
                      filteredExercises.map(
                        (
                          exercise
                        ) => (
                          <Pressable
                            key={`${exercise.category}-${exercise.name}`}
                            style={
                              styles.searchResultRow
                            }
                            onPress={() =>
                              selectLibraryExercise(
                                exercise
                              )
                            }
                          >
                            <View
                              style={
                                styles.searchResultInfo
                              }
                            >
                              <Text
                                style={
                                  styles.searchResultName
                                }
                              >
                                {
                                  exercise.name
                                }
                              </Text>

                              <Text
                                style={
                                  styles.searchResultCategory
                                }
                              >
                                {
                                  exercise.category
                                }
                              </Text>
                            </View>

                            <Text
                              style={
                                styles.searchResultAction
                              }
                            >
                              SELECT
                            </Text>
                          </Pressable>
                        )
                      )
                    ) : (
                      <View
                        style={
                          styles.noSearchResults
                        }
                      >
                        <Text
                          style={
                            styles.emptyTitle
                          }
                        >
                          No exercises found
                        </Text>

                        <Text
                          style={
                            styles.secondaryText
                          }
                        >
                          Try another search or add it as a custom exercise.
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View
                    style={
                      styles.searchHint
                    }
                  >
                    <Text
                      style={
                        styles.searchHintText
                      }
                    >
                      Search by exercise name or muscle group.
                    </Text>
                  </View>
                )}

                <Pressable
                  style={[
                    styles.primaryButton,
                    (!selectedExercise ||
                      addingExercise) &&
                      styles.disabledButton,
                  ]}
                  onPress={
                    handleAddExercise
                  }
                  disabled={
                    !selectedExercise ||
                    addingExercise
                  }
                >
                  {addingExercise ? (
                    <ActivityIndicator
                      color={
                        colors.background
                      }
                    />
                  ) : (
                    <Text
                      style={
                        styles.primaryButtonText
                      }
                    >
                      ADD EXERCISE
                    </Text>
                  )}
                </Pressable>

                <View style={styles.orRow}>
                  <View style={styles.orLine} />

                  <Text style={styles.orText}>
                    OR
                  </Text>

                  <View style={styles.orLine} />
                </View>

                <Pressable
                  style={
                    styles.customExerciseButton
                  }
                  onPress={
                    openCustomExerciseMode
                  }
                >
                  <Text
                    style={
                      styles.customExerciseButtonText
                    }
                  >
                    + CUSTOM EXERCISE
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View
                  style={
                    styles.customHeader
                  }
                >
                  <View
                    style={
                      styles.customHeaderInfo
                    }
                  >
                    <Text style={styles.label}>
                      CUSTOM EXERCISE
                    </Text>

                    <Text
                      style={
                        styles.secondaryText
                      }
                    >
                      Add an exercise that is not in the library.
                    </Text>
                  </View>

                  <Pressable
                    onPress={
                      cancelCustomExerciseMode
                    }
                  >
                    <Text
                      style={
                        styles.cancelCustomText
                      }
                    >
                      CANCEL
                    </Text>
                  </Pressable>
                </View>

                <TextInput
                  style={styles.input}
                  value={
                    customExerciseName
                  }
                  onChangeText={
                    setCustomExerciseName
                  }
                  placeholder="Enter exercise name"
                  placeholderTextColor={
                    colors.textSecondary
                  }
                  autoCapitalize="words"
                />

                <Pressable
                  style={[
                    styles.primaryButton,
                    (customExerciseName.trim() ===
                      '' ||
                      addingExercise) &&
                      styles.disabledButton,
                  ]}
                  onPress={
                    handleAddExercise
                  }
                  disabled={
                    customExerciseName.trim() ===
                      '' ||
                    addingExercise
                  }
                >
                  {addingExercise ? (
                    <ActivityIndicator
                      color={
                        colors.background
                      }
                    />
                  ) : (
                    <Text
                      style={
                        styles.primaryButtonText
                      }
                    >
                      ADD CUSTOM EXERCISE
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </AppCard>

          {activeWorkout.exercises.length ===
          0 ? (
            <AppCard>
              <Text style={styles.emptyTitle}>
                No exercises yet
              </Text>

              <Text
                style={
                  styles.secondaryText
                }
              >
                Add your first exercise above.
              </Text>
            </AppCard>
          ) : (
            activeWorkout.exercises.map(
              (
                exercise,
                index
              ) => (
                <AppCard key={exercise.id}>
                  <View
                    style={
                      styles.exerciseHeader
                    }
                  >
                    <View
                      style={
                        styles.exerciseNumber
                      }
                    >
                      <Text
                        style={
                          styles.exerciseNumberText
                        }
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.exerciseInfo
                      }
                    >
                      <Text
                        style={
                          styles.exerciseName
                        }
                      >
                        {
                          exercise.exerciseName
                        }
                      </Text>

                      <Text
                        style={
                          styles.secondaryText
                        }
                      >
                        {
                          exercise.sets
                            .length
                        }{' '}
                        {exercise.sets
                          .length === 1
                          ? 'set'
                          : 'sets'}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        confirmDeleteExercise(
                          exercise.id,
                          exercise.exerciseName
                        )
                      }
                      disabled={
                        deletingExerciseId ===
                        exercise.id
                      }
                      style={
                        styles.removeExerciseButton
                      }
                    >
                      {deletingExerciseId ===
                      exercise.id ? (
                        <ActivityIndicator
                          size="small"
                          color={
                            colors.danger
                          }
                        />
                      ) : (
                        <Text
                          style={
                            styles.removeExerciseText
                          }
                        >
                          REMOVE
                        </Text>
                      )}
                    </Pressable>
                  </View>

                  <PreviousExercisePerformance
                    exerciseName={
                      exercise.exerciseName
                    }
                  />

                  <ExercisePersonalRecord
                    exerciseName={
                      exercise.exerciseName
                    }
                    currentSets={
                      exercise.sets
                    }
                  />

                  {exercise.sets.length >
                    0 && (
                    <View
                      style={
                        styles.setTable
                      }
                    >
                      <View
                        style={
                          styles.setHeaderRow
                        }
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

                        <View
                          style={
                            styles.deleteColumn
                          }
                        />
                      </View>

                      {exercise.sets.map(
                        (set) => (
                          <SetRow
                            key={set.id}
                            set={set}
                            deleting={
                              deletingSetId ===
                              set.id
                            }
                            onSave={
                              handleSaveSet
                            }
                            onToggleCompleted={
                              handleToggleCompleted
                            }
                            onDelete={
                              confirmDeleteSet
                            }
                          />
                        )
                      )}
                    </View>
                  )}

                  <Pressable
                    style={
                      styles.addSetButton
                    }
                    onPress={() =>
                      handleAddSet(
                        exercise.id
                      )
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
            onPress={
              confirmFinishWorkout
            }
            disabled={
              finishingWorkout ||
              discardingWorkout
            }
          >
            {finishingWorkout ? (
              <ActivityIndicator
                color={colors.text}
              />
            ) : (
              <Text
                style={
                  styles.finishButtonText
                }
              >
                FINISH WORKOUT
              </Text>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.discardButton,
              discardingWorkout &&
                styles.disabledButton,
            ]}
            onPress={
              confirmDiscardWorkout
            }
            disabled={
              discardingWorkout ||
              finishingWorkout
            }
          >
            {discardingWorkout ? (
              <ActivityIndicator
                color={
                  colors.danger
                }
              />
            ) : (
              <Text
                style={
                  styles.discardButtonText
                }
              >
                DISCARD WORKOUT
              </Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Saved Templates
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Start a routine instantly.
              </Text>
            </View>

            <Text
              style={
                styles.historyCount
              }
            >
              {workoutTemplates.length}
            </Text>
          </View>

          {templatesLoading ? (
            <View
              style={
                styles.historyLoading
              }
            >
              <ActivityIndicator
                color={colors.primary}
              />
            </View>
          ) : workoutTemplates.length ===
            0 ? (
            <AppCard>
              <Text
                style={
                  styles.emptyTitle
                }
              >
                No templates yet
              </Text>

              <Text
                style={
                  styles.secondaryText
                }
              >
                Save an active or completed workout to create your first reusable routine.
              </Text>
            </AppCard>
          ) : (
            workoutTemplates.map(
              (template) => {
                const totalSets =
                  template.exercises.reduce(
                    (
                      total,
                      exercise
                    ) =>
                      total +
                      exercise.setCount,
                    0
                  );

                return (
                  <AppCard
                    key={template.id}
                  >
                    <View
                      style={
                        styles.templateHeader
                      }
                    >
                      <View
                        style={
                          styles.templateInfo
                        }
                      >
                        <Text
                          style={
                            styles.templateName
                          }
                        >
                          {template.name}
                        </Text>

                        <Text
                          style={
                            styles.secondaryText
                          }
                        >
                          {
                            template
                              .exercises
                              .length
                          }{' '}
                          {template
                            .exercises
                            .length ===
                          1
                            ? 'exercise'
                            : 'exercises'}{' '}
                          • {totalSets}{' '}
                          {totalSets === 1
                            ? 'set'
                            : 'sets'}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.templateBadge
                        }
                      >
                        TEMPLATE
                      </Text>
                    </View>

                    {template.exercises
                      .length > 0 && (
                      <View
                        style={
                          styles.templateExerciseList
                        }
                      >
                        {template.exercises.map(
                          (exercise) => (
                            <View
                              key={
                                exercise.id
                              }
                              style={
                                styles.templateExerciseRow
                              }
                            >
                              <Text
                                style={
                                  styles.templateExerciseName
                                }
                              >
                                {
                                  exercise.exerciseName
                                }
                              </Text>

                              <Text
                                style={
                                  styles.templateExerciseSets
                                }
                              >
                                {
                                  exercise.setCount
                                }{' '}
                                {exercise.setCount ===
                                1
                                  ? 'set'
                                  : 'sets'}
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    )}

                    <View
                      style={
                        styles.templateActions
                      }
                    >
                      <Pressable
                        style={[
                          styles.startTemplateButton,
                          startingTemplateId ===
                            template.id &&
                            styles.disabledButton,
                        ]}
                        disabled={
                          startingTemplateId ===
                            template.id ||
                          deletingTemplateId ===
                            template.id
                        }
                        onPress={() =>
                          handleStartTemplate(
                            template.id
                          )
                        }
                      >
                        {startingTemplateId ===
                        template.id ? (
                          <ActivityIndicator
                            size="small"
                            color={
                              colors.background
                            }
                          />
                        ) : (
                          <Text
                            style={
                              styles.startTemplateButtonText
                            }
                          >
                            START
                          </Text>
                        )}
                      </Pressable>

                      <Pressable
                        style={
                          styles.deleteTemplateButton
                        }
                        disabled={
                          deletingTemplateId ===
                            template.id ||
                          startingTemplateId ===
                            template.id
                        }
                        onPress={() =>
                          confirmDeleteTemplate(
                            template.id,
                            template.name
                          )
                        }
                      >
                        {deletingTemplateId ===
                        template.id ? (
                          <ActivityIndicator
                            size="small"
                            color={
                              colors.danger
                            }
                          />
                        ) : (
                          <Text
                            style={
                              styles.deleteTemplateButtonText
                            }
                          >
                            DELETE
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </AppCard>
                );
              }
            )
          )}

          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                New Workout
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Start from scratch.
              </Text>
            </View>
          </View>

          <AppCard>
            <Text style={styles.cardTitle}>
              Start a Workout
            </Text>

            <Text
              style={
                styles.secondaryText
              }
            >
              Give your workout a name, or leave it blank to use "Workout".
            </Text>

            <View
              style={
                styles.inputGroup
              }
            >
              <Text style={styles.label}>
                WORKOUT NAME
              </Text>

              <TextInput
                style={styles.input}
                value={workoutName}
                onChangeText={
                  setWorkoutName
                }
                placeholder="Push Day"
                placeholderTextColor={
                  colors.textSecondary
                }
              />
            </View>

            <Pressable
              style={
                styles.primaryButton
              }
              onPress={
                handleStartWorkout
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                START WORKOUT
              </Text>
            </Pressable>
          </AppCard>
        </>
      )}

      {!loading && (
        <>
          <View style={styles.historyHeader}>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Workout History
            </Text>

            <Text
              style={
                styles.historyCount
              }
            >
              {workoutHistory.length}
            </Text>
          </View>

          {historyLoading ? (
            <View
              style={
                styles.historyLoading
              }
            >
              <ActivityIndicator
                color={colors.primary}
              />
            </View>
          ) : workoutHistory.length ===
            0 ? (
            <AppCard>
              <Text
                style={
                  styles.emptyTitle
                }
              >
                No completed workouts
              </Text>

              <Text
                style={
                  styles.secondaryText
                }
              >
                Finish a workout and it will appear here.
              </Text>
            </AppCard>
          ) : (
            workoutHistory.map(
              (workout) => (
                <AppCard key={workout.id}>
                  <View
                    style={
                      styles.historyCardHeader
                    }
                  >
                    <View
                      style={
                        styles.historyInfo
                      }
                    >
                      <Text
                        style={
                          styles.historyName
                        }
                      >
                        {workout.name}
                      </Text>

                      <Text
                        style={
                          styles.historyDate
                        }
                      >
                        {formatWorkoutDate(
                          workout.workoutDate
                        )}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.completedText
                      }
                    >
                      COMPLETE
                    </Text>
                  </View>

                  <View
                    style={
                      styles.historyStatRow
                    }
                  >
                    <View
                      style={
                        styles.historyStat
                      }
                    >
                      <Text
                        style={
                          styles.historyStatValue
                        }
                      >
                        {
                          workout.exerciseCount
                        }
                      </Text>

                      <Text
                        style={
                          styles.historyStatLabel
                        }
                      >
                        Exercises
                      </Text>
                    </View>

                    <View
                      style={
                        styles.historyStat
                      }
                    >
                      <Text
                        style={
                          styles.historyStatValue
                        }
                      >
                        {workout.setCount}
                      </Text>

                      <Text
                        style={
                          styles.historyStatLabel
                        }
                      >
                        Sets
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.historyActions
                    }
                  >
                    <Pressable
                      style={
                        styles.historyPrimaryAction
                      }
                      onPress={() =>
                        openWorkoutDetails(
                          workout.id
                        )
                      }
                      disabled={
                        deletingWorkoutId ===
                        workout.id
                      }
                    >
                      <Text
                        style={
                          styles.historyPrimaryActionText
                        }
                      >
                        VIEW
                      </Text>
                    </Pressable>

                    <Pressable
                      style={
                        styles.historySecondaryAction
                      }
                      disabled={
                        savingTemplateWorkoutId ===
                          workout.id ||
                        deletingWorkoutId ===
                          workout.id
                      }
                      onPress={() =>
                        confirmSaveTemplate(
                          workout.id,
                          workout.name
                        )
                      }
                    >
                      {savingTemplateWorkoutId ===
                      workout.id ? (
                        <ActivityIndicator
                          size="small"
                          color={
                            colors.primary
                          }
                        />
                      ) : (
                        <Text
                          style={
                            styles.historySecondaryActionText
                          }
                        >
                          SAVE TEMPLATE
                        </Text>
                      )}
                    </Pressable>

                    <Pressable
                      style={
                        styles.historyDeleteAction
                      }
                      disabled={
                        deletingWorkoutId ===
                        workout.id
                      }
                      onPress={() =>
                        confirmDeleteWorkout(
                          workout.id,
                          workout.name
                        )
                      }
                    >
                      {deletingWorkoutId ===
                      workout.id ? (
                        <ActivityIndicator
                          size="small"
                          color={
                            colors.danger
                          }
                        />
                      ) : (
                        <Text
                          style={
                            styles.historyDeleteActionText
                          }
                        >
                          DELETE
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </AppCard>
              )
            )
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    container: {
      padding: spacing.lg,
      paddingBottom:
        spacing.xxl,
      gap: spacing.md,
    },

    header: {
      marginBottom:
        spacing.sm,
    },

    screenTitle: {
      color: colors.text,
      fontSize:
        fontSize.screenTitle,
      fontWeight: '700',
    },

    subtitle: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
      marginTop:
        spacing.xs,
    },

    loadingContainer: {
      alignItems: 'center',
      justifyContent:
        'center',
      paddingVertical:
        spacing.xxl,
      gap: spacing.md,
    },

    loadingText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
    },

    cardHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      gap: spacing.md,
    },

    cardTitle: {
      color: colors.text,
      fontSize:
        fontSize.title,
      fontWeight: '600',
    },

    activeText: {
      color: colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 1,
    },

    secondaryText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
    },

    inputGroup: {
      gap: spacing.sm,
    },

    label: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '600',
      letterSpacing: 1,
    },

    input: {
      backgroundColor:
        colors.surfaceSecondary,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal:
        spacing.md,
      paddingVertical:
        spacing.md,
      color: colors.text,
      fontSize:
        fontSize.body,
    },

    primaryButton: {
      backgroundColor:
        colors.primary,
      paddingVertical:
        spacing.md,
      borderRadius: 12,
      alignItems: 'center',
    },

    primaryButtonText: {
      color:
        colors.background,
      fontSize:
        fontSize.body,
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
      backgroundColor:
        colors.surfaceSecondary,
      borderRadius: 12,
      padding: spacing.md,
      alignItems: 'center',
    },

    statValue: {
      color: colors.text,
      fontSize:
        fontSize.title,
      fontWeight: '700',
    },

    statLabel: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      marginTop:
        spacing.xs,
    },

    emptyTitle: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '600',
    },

    templateOutlineButton: {
      width: '100%',
      minHeight: 44,
      borderColor:
        colors.primary,
      borderWidth: 1,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    templateOutlineButtonText: {
      color: colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 0.5,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginTop:
        spacing.sm,
    },

    sectionTitle: {
      color: colors.text,
      fontSize:
        fontSize.title,
      fontWeight: '700',
    },

    sectionSubtitle: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      marginTop:
        spacing.xs,
    },

    selectedExerciseCard: {
      backgroundColor:
        colors.surfaceSecondary,
      borderColor:
        colors.primary,
      borderWidth: 1,
      borderRadius: 12,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: spacing.md,
    },

    selectedExerciseInfo: {
      flex: 1,
    },

    selectedExerciseLabel: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom:
        spacing.xs,
    },

    selectedExerciseName: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    selectedExerciseCategory: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      marginTop:
        spacing.xs,
    },

    clearSelectionButton: {
      minHeight: 36,
      justifyContent:
        'center',
      paddingHorizontal:
        spacing.sm,
    },

    clearSelectionText: {
      color: colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
    },

    searchResults: {
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },

    searchResultRow: {
      minHeight: 58,
      paddingHorizontal:
        spacing.md,
      paddingVertical:
        spacing.sm,
      backgroundColor:
        colors.surfaceSecondary,
      borderBottomColor:
        colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },

    searchResultInfo: {
      flex: 1,
    },

    searchResultName: {
      color: colors.text,
      fontSize:
        fontSize.body,
      fontWeight: '600',
    },

    searchResultCategory: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      marginTop:
        spacing.xs,
    },

    searchResultAction: {
      color: colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
    },

    noSearchResults: {
      padding: spacing.md,
      backgroundColor:
        colors.surfaceSecondary,
      gap: spacing.xs,
    },

    searchHint: {
      paddingVertical:
        spacing.sm,
    },

    searchHintText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
    },

    orRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    orLine: {
      flex: 1,
      height: 1,
      backgroundColor:
        colors.border,
    },

    orText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '600',
    },

    customExerciseButton: {
      minHeight: 44,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    customExerciseButtonText: {
      color: colors.text,
      fontSize:
        fontSize.small,
      fontWeight: '700',
    },

    customHeader: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      justifyContent:
        'space-between',
      gap: spacing.md,
    },

    customHeaderInfo: {
      flex: 1,
      gap: spacing.xs,
    },

    cancelCustomText: {
      color: colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
    },

    templateHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
      gap: spacing.md,
    },

    templateInfo: {
      flex: 1,
    },

    templateName: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    templateBadge: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
    },

    templateExerciseList: {
      gap: spacing.sm,
    },

    templateExerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      backgroundColor:
        colors.surfaceSecondary,
      borderRadius: 10,
      paddingVertical:
        spacing.sm,
      paddingHorizontal:
        spacing.md,
      gap: spacing.sm,
    },

    templateExerciseName: {
      flex: 1,
      color: colors.text,
      fontSize:
        fontSize.body,
      fontWeight: '500',
    },

    templateExerciseSets: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
    },

    templateActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },

    startTemplateButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: 10,
      backgroundColor:
        colors.primary,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    startTemplateButtonText: {
      color:
        colors.background,
      fontSize:
        fontSize.body,
      fontWeight: '700',
    },

    deleteTemplateButton: {
      minWidth: 90,
      minHeight: 44,
      borderRadius: 10,
      borderColor:
        colors.danger,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal:
        spacing.md,
    },

    deleteTemplateButtonText: {
      color: colors.danger,
      fontSize:
        fontSize.small,
      fontWeight: '700',
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
      backgroundColor:
        colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    exerciseNumberText: {
      color: colors.primary,
      fontSize:
        fontSize.body,
      fontWeight: '700',
    },

    exerciseInfo: {
      flex: 1,
    },

    exerciseName: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '600',
    },

    removeExerciseButton: {
      minWidth: 64,
      minHeight: 36,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    removeExerciseText: {
      color: colors.danger,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 0.5,
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
      color:
        colors.textSecondary,
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

    deleteColumn: {
      width: 34,
      flexShrink: 0,
    },

    setNumberCell: {
      height: 44,
      justifyContent:
        'center',
      alignItems: 'center',
    },

    setNumberText: {
      color: colors.text,
      fontSize:
        fontSize.body,
      fontWeight: '600',
    },

    setInput: {
      height: 44,
      minWidth: 0,
      backgroundColor:
        colors.surfaceSecondary,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius: 10,
      color: colors.text,
      fontSize:
        fontSize.body,
      textAlign: 'center',
      paddingHorizontal: 4,
    },

    completeButton: {
      height: 44,
      borderRadius: 10,
      backgroundColor:
        colors.surfaceSecondary,
      borderColor:
        colors.border,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    completedButton: {
      backgroundColor:
        colors.primary,
      borderColor:
        colors.primary,
    },

    completeButtonText: {
      color:
        colors.textSecondary,
      fontSize: 22,
      fontWeight: '700',
    },

    completedButtonText: {
      color:
        colors.background,
    },

    deleteSetButton: {
      width: 34,
      height: 44,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    deleteSetText: {
      color: colors.danger,
      fontSize: 24,
      lineHeight: 26,
      fontWeight: '600',
    },

    addSetButton: {
      width: '100%',
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical:
        spacing.md,
      alignItems: 'center',
    },

    addSetButtonText: {
      color: colors.primary,
      fontSize:
        fontSize.body,
      fontWeight: '700',
    },

    finishButton: {
      width: '100%',
      backgroundColor:
        colors.surfaceSecondary,
      borderColor:
        colors.primary,
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical:
        spacing.md,
      alignItems: 'center',
      marginTop:
        spacing.sm,
    },

    finishButtonText: {
      color: colors.primary,
      fontSize:
        fontSize.body,
      fontWeight: '700',
    },

    discardButton: {
      width: '100%',
      backgroundColor:
        colors.surface,
      borderColor:
        colors.danger,
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical:
        spacing.md,
      alignItems: 'center',
    },

    discardButtonText: {
      color: colors.danger,
      fontSize:
        fontSize.body,
      fontWeight: '700',
    },

    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginTop:
        spacing.sm,
    },

    historyCount: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
      fontWeight: '600',
    },

    historyLoading: {
      paddingVertical:
        spacing.lg,
      alignItems: 'center',
    },

    historyCardHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
      gap: spacing.md,
    },

    historyInfo: {
      flex: 1,
    },

    historyName: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    historyDate: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      marginTop:
        spacing.xs,
    },

    completedText: {
      color: colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 1,
    },

    historyStatRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },

    historyStat: {
      flex: 1,
      backgroundColor:
        colors.surfaceSecondary,
      borderRadius: 10,
      padding: spacing.md,
      alignItems: 'center',
    },

    historyStatValue: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    historyStatLabel: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      marginTop:
        spacing.xs,
    },

    historyActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop:
        spacing.xs,
    },

    historyPrimaryAction: {
      minWidth: 72,
      minHeight: 42,
      borderRadius: 10,
      borderColor:
        colors.primary,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal:
        spacing.md,
    },

    historyPrimaryActionText: {
      color: colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
    },

    historySecondaryAction: {
      flex: 1,
      minWidth: 120,
      minHeight: 42,
      borderRadius: 10,
      borderColor:
        colors.border,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal:
        spacing.sm,
    },

    historySecondaryActionText: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '700',
    },

    historyDeleteAction: {
      minWidth: 80,
      minHeight: 42,
      borderRadius: 10,
      borderColor:
        colors.danger,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal:
        spacing.sm,
    },

    historyDeleteActionText: {
      color: colors.danger,
      fontSize:
        fontSize.small,
      fontWeight: '700',
    },
  });