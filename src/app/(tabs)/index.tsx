import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
  borderRadius,
  colors,
  fontSize,
  spacing,
} from '../../constants/theme';
import { useFood } from '../../context/FoodContext';
import { useProfile } from '../../context/ProfileContext';
import { useProgress } from '../../context/ProgressContext';
import { useWorkout } from '../../context/WorkoutContext';

type Meal =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Snacks';

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

function getProgress(
  current: number,
  target: number
) {
  if (target <= 0) {
    return 0;
  }

  return Math.min(
    (current / target) * 100,
    100
  );
}

function getDefaultMeal(): Meal {
  const hour = new Date().getHours();

  if (hour < 11) {
    return 'Breakfast';
  }

  if (hour < 16) {
    return 'Lunch';
  }

  if (hour < 21) {
    return 'Dinner';
  }

  return 'Snacks';
}

export default function TodayScreen() {
  const {
    foodEntries,
    addFoodEntry,
  } = useFood();

  const {
    profile,
    loading: profileLoading,
  } = useProfile();

  const {
    currentWeight,
    loading: progressLoading,
    addWeightEntry,
  } = useProgress();

  const {
    activeWorkout,
    workoutHistory,
    historyLoading,
    startWorkout,
  } = useWorkout();

  const [
    foodModalVisible,
    setFoodModalVisible,
  ] = useState(false);

  const [
    workoutModalVisible,
    setWorkoutModalVisible,
  ] = useState(false);

  const [
    weightModalVisible,
    setWeightModalVisible,
  ] = useState(false);

  const [
    savingFood,
    setSavingFood,
  ] = useState(false);

  const [
    startingWorkout,
    setStartingWorkout,
  ] = useState(false);

  const [
    savingWeight,
    setSavingWeight,
  ] = useState(false);

  const [foodName, setFoodName] =
    useState('');

  const [calories, setCalories] =
    useState('');

  const [protein, setProtein] =
    useState('');

  const [carbs, setCarbs] =
    useState('');

  const [fat, setFat] =
    useState('');

  const [serving, setServing] =
    useState('');

  const [
    selectedMeal,
    setSelectedMeal,
  ] = useState<Meal>('Breakfast');

  const [
    workoutName,
    setWorkoutName,
  ] = useState('');

  const [
    quickWeight,
    setQuickWeight,
  ] = useState('');

  const calorieTarget =
    profile?.dailyCalorieTarget ?? 2200;

  const proteinTarget =
    profile?.proteinTarget ?? 180;

  const carbTarget =
    profile?.carbTarget ?? 190;

  const fatTarget =
    profile?.fatTarget ?? 80;

  const goalWeight =
    profile?.goalWeight ?? null;

  const totalCalories = foodEntries.reduce(
    (total, entry) =>
      total + entry.calories,
    0
  );

  const totalProtein = foodEntries.reduce(
    (total, entry) =>
      total + entry.protein,
    0
  );

  const totalCarbs = foodEntries.reduce(
    (total, entry) =>
      total + entry.carbs,
    0
  );

  const totalFat = foodEntries.reduce(
    (total, entry) =>
      total + entry.fat,
    0
  );

  const caloriesRemaining = Math.max(
    calorieTarget - totalCalories,
    0
  );

  const calorieProgress = getProgress(
    totalCalories,
    calorieTarget
  );

  const proteinProgress = getProgress(
    totalProtein,
    proteinTarget
  );

  const carbProgress = getProgress(
    totalCarbs,
    carbTarget
  );

  const fatProgress = getProgress(
    totalFat,
    fatTarget
  );

  const todayDate =
    getLocalDateString(new Date());

  const formattedDate =
    new Date().toLocaleDateString(
      undefined,
      {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }
    );

  const todaysCompletedWorkouts =
    workoutHistory.filter(
      (workout) =>
        workout.workoutDate === todayDate
    );

  const todaysCompletedWorkout =
    todaysCompletedWorkouts[0] ?? null;

  const activeWorkoutIsToday =
    activeWorkout?.workoutDate ===
    todayDate;

  const activeExerciseCount =
    activeWorkoutIsToday
      ? activeWorkout?.exercises.length ??
        0
      : 0;

  const activeSetCount =
    activeWorkoutIsToday
      ? activeWorkout?.exercises.reduce(
          (total, exercise) =>
            total +
            exercise.sets.length,
          0
        ) ?? 0
      : 0;

  const weightToGoal =
    currentWeight !== null &&
    goalWeight !== null
      ? Math.abs(
          currentWeight - goalWeight
        )
      : null;

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

  function goToFood() {
    router.push('/(tabs)/food');
  }

  function goToWorkout() {
    router.push('/(tabs)/workout');
  }

  function goToProgress() {
    router.push('/(tabs)/progress');
  }

  function resetFoodForm() {
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setServing('');
    setSelectedMeal('Breakfast');
  }

  function openFoodModal() {
    resetFoodForm();
    setSelectedMeal(getDefaultMeal());
    setFoodModalVisible(true);
  }

  function closeFoodModal() {
    if (savingFood) {
      return;
    }

    resetFoodForm();
    setFoodModalVisible(false);
  }

  async function handleSaveFood() {
    if (!foodName.trim()) {
      showMessage(
        'Food name required',
        'Enter a food name before saving.'
      );

      return;
    }

    setSavingFood(true);

    await addFoodEntry({
      name: foodName.trim(),
      calories:
        Number(calories) || 0,
      protein:
        Number(protein) || 0,
      carbs:
        Number(carbs) || 0,
      fat:
        Number(fat) || 0,
      serving: serving.trim(),
      meal: selectedMeal,
    });

    setSavingFood(false);

    resetFoodForm();
    setFoodModalVisible(false);
  }

  function openWorkoutModal() {
    setWorkoutName('');
    setWorkoutModalVisible(true);
  }

  function closeWorkoutModal() {
    if (startingWorkout) {
      return;
    }

    setWorkoutName('');
    setWorkoutModalVisible(false);
  }

  async function handleStartWorkout() {
    const name =
      workoutName.trim() === ''
        ? 'Workout'
        : workoutName.trim();

    setStartingWorkout(true);

    const success =
      await startWorkout(name);

    setStartingWorkout(false);

    if (!success) {
      showMessage(
        'Unable to start workout',
        'There was a problem creating your workout.'
      );

      return;
    }

    setWorkoutName('');
    setWorkoutModalVisible(false);
  }

  function handleContinueWorkout() {
    setWorkoutModalVisible(false);
    goToWorkout();
  }

  function openWeightModal() {
    setQuickWeight('');
    setWeightModalVisible(true);
  }

  function closeWeightModal() {
    if (savingWeight) {
      return;
    }

    setQuickWeight('');
    setWeightModalVisible(false);
  }

  async function handleSaveWeight() {
    const parsedWeight =
      Number(quickWeight);

    if (
      quickWeight.trim() === '' ||
      Number.isNaN(parsedWeight) ||
      parsedWeight <= 0
    ) {
      showMessage(
        'Invalid weight',
        'Enter a valid weight greater than 0.'
      );

      return;
    }

    setSavingWeight(true);

    await addWeightEntry(
      parsedWeight
    );

    setSavingWeight(false);

    setQuickWeight('');
    setWeightModalVisible(false);
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={
          styles.container
        }
      >
        <View style={styles.header}>
          <Text
            style={styles.screenTitle}
          >
            Today
          </Text>

          <Text
            style={styles.dateText}
          >
            {formattedDate}
          </Text>
        </View>

        <View
          style={styles.quickActions}
        >
          <Pressable
            onPress={openFoodModal}
            style={({ pressed }) => [
              styles.quickActionButton,
              pressed &&
                styles.quickActionPressed,
            ]}
          >
            <Text
              style={
                styles.quickActionLabel
              }
            >
              ADD FOOD
            </Text>

            <Text
              style={
                styles.quickActionText
              }
            >
              Log a meal
            </Text>
          </Pressable>

          <Pressable
            onPress={openWorkoutModal}
            style={({ pressed }) => [
              styles.quickActionButton,
              pressed &&
                styles.quickActionPressed,
            ]}
          >
            <Text
              style={
                styles.quickActionLabel
              }
            >
              {activeWorkout
                ? 'RESUME'
                : 'WORKOUT'}
            </Text>

            <Text
              style={
                styles.quickActionText
              }
            >
              {activeWorkout
                ? 'Continue training'
                : 'Start training'}
            </Text>
          </Pressable>

          <Pressable
            onPress={openWeightModal}
            style={({ pressed }) => [
              styles.quickActionButton,
              pressed &&
                styles.quickActionPressed,
            ]}
          >
            <Text
              style={
                styles.quickActionLabel
              }
            >
              LOG WEIGHT
            </Text>

            <Text
              style={
                styles.quickActionText
              }
            >
              Add today's weight
            </Text>
          </Pressable>
        </View>

        <AppCard>
          <View
            style={styles.cardHeader}
          >
            <Text
              style={styles.cardTitle}
            >
              Daily Nutrition
            </Text>

            <Pressable
              onPress={goToFood}
              hitSlop={12}
            >
              <Text
                style={styles.accentText}
              >
                FOOD
              </Text>
            </Pressable>
          </View>

          <View>
            <Text style={styles.label}>
              CALORIES
            </Text>

            <View
              style={styles.calorieRow}
            >
              <Text
                style={
                  styles.calorieValue
                }
              >
                {totalCalories}
              </Text>

              <Text
                style={
                  styles.calorieTarget
                }
              >
                {' '}
                /{' '}
                {calorieTarget.toLocaleString()}{' '}
                kcal
              </Text>
            </View>

            <View
              style={
                styles.progressTrack
              }
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${calorieProgress}%`,
                  },
                ]}
              />
            </View>

            <View
              style={
                styles.calorieSummaryRow
              }
            >
              <Text
                style={
                  styles.secondaryText
                }
              >
                {caloriesRemaining.toLocaleString()}{' '}
                kcal remaining
              </Text>

              <Text
                style={
                  styles.progressText
                }
              >
                {Math.round(
                  calorieProgress
                )}
                %
              </Text>
            </View>
          </View>

          <View
            style={styles.macroList}
          >
            <View
              style={styles.macroBlock}
            >
              <View
                style={
                  styles.macroHeaderRow
                }
              >
                <Text
                  style={styles.label}
                >
                  PROTEIN
                </Text>

                <Text
                  style={
                    styles.macroSummary
                  }
                >
                  {totalProtein} /{' '}
                  {proteinTarget}g
                </Text>
              </View>

              <View
                style={
                  styles.macroProgressTrack
                }
              >
                <View
                  style={[
                    styles.macroProgressFill,
                    {
                      width: `${proteinProgress}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View
              style={styles.macroBlock}
            >
              <View
                style={
                  styles.macroHeaderRow
                }
              >
                <Text
                  style={styles.label}
                >
                  CARBS
                </Text>

                <Text
                  style={
                    styles.macroSummary
                  }
                >
                  {totalCarbs} /{' '}
                  {carbTarget}g
                </Text>
              </View>

              <View
                style={
                  styles.macroProgressTrack
                }
              >
                <View
                  style={[
                    styles.macroProgressFill,
                    {
                      width: `${carbProgress}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View
              style={styles.macroBlock}
            >
              <View
                style={
                  styles.macroHeaderRow
                }
              >
                <Text
                  style={styles.label}
                >
                  FAT
                </Text>

                <Text
                  style={
                    styles.macroSummary
                  }
                >
                  {totalFat} /{' '}
                  {fatTarget}g
                </Text>
              </View>

              <View
                style={
                  styles.macroProgressTrack
                }
              >
                <View
                  style={[
                    styles.macroProgressFill,
                    {
                      width: `${fatProgress}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </AppCard>

        <AppCard>
          <View
            style={styles.cardHeader}
          >
            <Text
              style={styles.cardTitle}
            >
              Today's Workout
            </Text>

            <Pressable
              onPress={goToWorkout}
              hitSlop={12}
            >
              <Text
                style={styles.accentText}
              >
                WORKOUT
              </Text>
            </Pressable>
          </View>

          {historyLoading ? (
            <ActivityIndicator
              color={colors.primary}
            />
          ) : activeWorkoutIsToday &&
            activeWorkout ? (
            <>
              <View
                style={styles.statusRow}
              >
                <View
                  style={
                    styles.statusIndicator
                  }
                />

                <Text
                  style={
                    styles.statusText
                  }
                >
                  IN PROGRESS
                </Text>
              </View>

              <Text
                style={
                  styles.workoutName
                }
              >
                {activeWorkout.name}
              </Text>

              <View
                style={
                  styles.workoutStatsRow
                }
              >
                <View
                  style={
                    styles.workoutStat
                  }
                >
                  <Text
                    style={
                      styles.workoutStatValue
                    }
                  >
                    {
                      activeExerciseCount
                    }
                  </Text>

                  <Text
                    style={
                      styles.workoutStatLabel
                    }
                  >
                    Exercises
                  </Text>
                </View>

                <View
                  style={
                    styles.workoutStat
                  }
                >
                  <Text
                    style={
                      styles.workoutStatValue
                    }
                  >
                    {activeSetCount}
                  </Text>

                  <Text
                    style={
                      styles.workoutStatLabel
                    }
                  >
                    Sets
                  </Text>
                </View>
              </View>
            </>
          ) : todaysCompletedWorkout ? (
            <>
              <View
                style={styles.statusRow}
              >
                <View
                  style={
                    styles.statusIndicator
                  }
                />

                <Text
                  style={
                    styles.statusText
                  }
                >
                  COMPLETED
                </Text>
              </View>

              <Text
                style={
                  styles.workoutName
                }
              >
                {
                  todaysCompletedWorkout.name
                }
              </Text>

              <View
                style={
                  styles.workoutStatsRow
                }
              >
                <View
                  style={
                    styles.workoutStat
                  }
                >
                  <Text
                    style={
                      styles.workoutStatValue
                    }
                  >
                    {
                      todaysCompletedWorkout.exerciseCount
                    }
                  </Text>

                  <Text
                    style={
                      styles.workoutStatLabel
                    }
                  >
                    Exercises
                  </Text>
                </View>

                <View
                  style={
                    styles.workoutStat
                  }
                >
                  <Text
                    style={
                      styles.workoutStatValue
                    }
                  >
                    {
                      todaysCompletedWorkout.setCount
                    }
                  </Text>

                  <Text
                    style={
                      styles.workoutStatLabel
                    }
                  >
                    Sets
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text
                style={styles.emptyTitle}
              >
                No workout logged
              </Text>

              <Text
                style={
                  styles.secondaryText
                }
              >
                Start a workout when
                you're ready to train.
              </Text>
            </>
          )}
        </AppCard>

        <AppCard>
          <View
            style={styles.cardHeader}
          >
            <Text
              style={styles.cardTitle}
            >
              Weight Progress
            </Text>

            <Pressable
              onPress={goToProgress}
              hitSlop={12}
            >
              <Text
                style={styles.accentText}
              >
                PROGRESS
              </Text>
            </Pressable>
          </View>

          {progressLoading ||
          profileLoading ? (
            <ActivityIndicator
              color={colors.primary}
            />
          ) : currentWeight === null ? (
            <>
              <Text
                style={styles.emptyTitle}
              >
                No weight logged
              </Text>

              <Text
                style={
                  styles.secondaryText
                }
              >
                Log your weight to begin
                tracking your progress.
              </Text>
            </>
          ) : (
            <>
              <View
                style={
                  styles.weightSummaryRow
                }
              >
                <View>
                  <Text
                    style={styles.label}
                  >
                    CURRENT
                  </Text>

                  <Text
                    style={
                      styles.weightValue
                    }
                  >
                    {currentWeight} lbs
                  </Text>
                </View>

                {goalWeight !== null && (
                  <View
                    style={
                      styles.goalWeightBlock
                    }
                  >
                    <Text
                      style={styles.label}
                    >
                      GOAL
                    </Text>

                    <Text
                      style={
                        styles.goalWeightValue
                      }
                    >
                      {goalWeight} lbs
                    </Text>
                  </View>
                )}
              </View>

              {weightToGoal !== null && (
                <View
                  style={
                    styles.weightRemainingBox
                  }
                >
                  <Text
                    style={
                      styles.weightRemainingValue
                    }
                  >
                    {weightToGoal.toFixed(
                      1
                    )}
                  </Text>

                  <Text
                    style={
                      styles.weightRemainingLabel
                    }
                  >
                    lbs from goal
                  </Text>
                </View>
              )}
            </>
          )}
        </AppCard>
      </ScrollView>

      <Modal
        visible={foodModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeFoodModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View
            style={styles.largeModalCard}
          >
            <View
              style={styles.modalHeader}
            >
              <View>
                <Text
                  style={styles.modalTitle}
                >
                  Add Food
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Log food without
                  leaving Today.
                </Text>
              </View>

              <Pressable
                onPress={closeFoodModal}
                disabled={savingFood}
                hitSlop={12}
              >
                <Text
                  style={styles.closeText}
                >
                  ✕
                </Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={
                styles.modalScrollContent
              }
            >
              <View
                style={styles.inputGroup}
              >
                <Text style={styles.label}>
                  FOOD NAME
                </Text>

                <TextInput
                  style={styles.input}
                  value={foodName}
                  onChangeText={
                    setFoodName
                  }
                  placeholder="Example: Grilled Chicken"
                  placeholderTextColor={
                    colors.textSecondary
                  }
                />
              </View>

              <View
                style={styles.inputGroup}
              >
                <Text style={styles.label}>
                  CALORIES
                </Text>

                <TextInput
                  style={styles.input}
                  value={calories}
                  onChangeText={
                    setCalories
                  }
                  placeholder="0"
                  placeholderTextColor={
                    colors.textSecondary
                  }
                  keyboardType="numeric"
                />
              </View>

              <View
                style={styles.macroInputs}
              >
                <View
                  style={
                    styles.macroInput
                  }
                >
                  <Text
                    style={styles.label}
                  >
                    PROTEIN
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={protein}
                    onChangeText={
                      setProtein
                    }
                    placeholder="0"
                    placeholderTextColor={
                      colors.textSecondary
                    }
                    keyboardType="numeric"
                  />
                </View>

                <View
                  style={
                    styles.macroInput
                  }
                >
                  <Text
                    style={styles.label}
                  >
                    CARBS
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={carbs}
                    onChangeText={
                      setCarbs
                    }
                    placeholder="0"
                    placeholderTextColor={
                      colors.textSecondary
                    }
                    keyboardType="numeric"
                  />
                </View>

                <View
                  style={
                    styles.macroInput
                  }
                >
                  <Text
                    style={styles.label}
                  >
                    FAT
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={fat}
                    onChangeText={setFat}
                    placeholder="0"
                    placeholderTextColor={
                      colors.textSecondary
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View
                style={styles.inputGroup}
              >
                <Text style={styles.label}>
                  SERVING
                </Text>

                <TextInput
                  style={styles.input}
                  value={serving}
                  onChangeText={
                    setServing
                  }
                  placeholder="Example: 100g"
                  placeholderTextColor={
                    colors.textSecondary
                  }
                />
              </View>

              <View
                style={styles.inputGroup}
              >
                <Text style={styles.label}>
                  MEAL
                </Text>

                <View
                  style={styles.mealRow}
                >
                  {(
                    [
                      'Breakfast',
                      'Lunch',
                      'Dinner',
                      'Snacks',
                    ] as Meal[]
                  ).map(
                    (mealOption) => {
                      const isSelected =
                        selectedMeal ===
                        mealOption;

                      return (
                        <Pressable
                          key={
                            mealOption
                          }
                          style={[
                            styles.mealButton,
                            isSelected &&
                              styles.mealButtonSelected,
                          ]}
                          onPress={() =>
                            setSelectedMeal(
                              mealOption
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.mealButtonText,
                              isSelected &&
                                styles.mealButtonTextSelected,
                            ]}
                          >
                            {mealOption}
                          </Text>
                        </Pressable>
                      );
                    }
                  )}
                </View>
              </View>

              <Pressable
                onPress={handleSaveFood}
                disabled={savingFood}
                style={[
                  styles.primaryButton,
                  savingFood &&
                    styles.disabledButton,
                ]}
              >
                {savingFood ? (
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
                    ADD FOOD
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={workoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={
          closeWorkoutModal
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={styles.modalHeader}
            >
              <View>
                <Text
                  style={styles.modalTitle}
                >
                  {activeWorkout
                    ? 'Resume Workout'
                    : 'Start Workout'}
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  {activeWorkout
                    ? 'Your workout is still active.'
                    : 'Create a new training session.'}
                </Text>
              </View>

              <Pressable
                onPress={
                  closeWorkoutModal
                }
                disabled={
                  startingWorkout
                }
                hitSlop={12}
              >
                <Text
                  style={styles.closeText}
                >
                  ✕
                </Text>
              </Pressable>
            </View>

            {activeWorkout ? (
              <>
                <View
                  style={
                    styles.activeWorkoutBox
                  }
                >
                  <Text
                    style={
                      styles.activeWorkoutLabel
                    }
                  >
                    ACTIVE WORKOUT
                  </Text>

                  <Text
                    style={
                      styles.activeWorkoutName
                    }
                  >
                    {activeWorkout.name}
                  </Text>

                  <View
                    style={
                      styles.modalWorkoutStats
                    }
                  >
                    <Text
                      style={
                        styles.secondaryText
                      }
                    >
                      {
                        activeWorkout
                          .exercises
                          .length
                      }{' '}
                      exercises
                    </Text>

                    <Text
                      style={
                        styles.secondaryText
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
                      )}{' '}
                      sets
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={
                    handleContinueWorkout
                  }
                  style={
                    styles.primaryButton
                  }
                >
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    CONTINUE TRAINING
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View
                  style={styles.inputGroup}
                >
                  <Text
                    style={styles.label}
                  >
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
                  onPress={
                    handleStartWorkout
                  }
                  disabled={
                    startingWorkout
                  }
                  style={[
                    styles.primaryButton,
                    startingWorkout &&
                      styles.disabledButton,
                  ]}
                >
                  {startingWorkout ? (
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
                      START WORKOUT
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={weightModalVisible}
        transparent
        animationType="fade"
        onRequestClose={
          closeWeightModal
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={styles.modalHeader}
            >
              <View>
                <Text
                  style={styles.modalTitle}
                >
                  Log Weight
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Today's weight
                </Text>
              </View>

              <Pressable
                onPress={
                  closeWeightModal
                }
                disabled={savingWeight}
                hitSlop={12}
              >
                <Text
                  style={styles.closeText}
                >
                  ✕
                </Text>
              </Pressable>
            </View>

            {currentWeight !== null && (
              <View
                style={
                  styles.currentWeightBox
                }
              >
                <Text
                  style={styles.label}
                >
                  CURRENT WEIGHT
                </Text>

                <Text
                  style={
                    styles.currentWeightText
                  }
                >
                  {currentWeight} lbs
                </Text>
              </View>
            )}

            <View
              style={styles.inputGroup}
            >
              <Text style={styles.label}>
                WEIGHT
              </Text>

              <View
                style={
                  styles.weightInputRow
                }
              >
                <TextInput
                  style={
                    styles.weightInput
                  }
                  value={quickWeight}
                  onChangeText={
                    setQuickWeight
                  }
                  placeholder="235"
                  placeholderTextColor={
                    colors.textSecondary
                  }
                  keyboardType="decimal-pad"
                  autoFocus
                  editable={!savingWeight}
                  onSubmitEditing={
                    handleSaveWeight
                  }
                />

                <Text
                  style={
                    styles.weightUnit
                  }
                >
                  lbs
                </Text>
              </View>
            </View>

            <View
              style={styles.modalActions}
            >
              <Pressable
                onPress={
                  closeWeightModal
                }
                disabled={savingWeight}
                style={
                  styles.secondaryButton
                }
              >
                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  CANCEL
                </Text>
              </Pressable>

              <Pressable
                onPress={
                  handleSaveWeight
                }
                disabled={savingWeight}
                style={[
                  styles.primaryButton,
                  styles.modalPrimaryButton,
                  savingWeight &&
                    styles.disabledButton,
                ]}
              >
                {savingWeight ? (
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
                    SAVE WEIGHT
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
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

  dateText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    marginTop: spacing.xs,
  },

  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  quickActionButton: {
    flex: 1,
    minHeight: 82,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    justifyContent: 'center',
  },

  quickActionPressed: {
    backgroundColor:
      colors.surfaceSecondary,
    opacity: 0.85,
  },

  quickActionLabel: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: '700',
    letterSpacing: 1,
  },

  quickActionText: {
    color: colors.text,
    fontSize: fontSize.small,
    fontWeight: '600',
    marginTop: spacing.xs,
  },

  cardTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '600',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },

  label: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: '600',
    letterSpacing: 1,
  },

  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },

  calorieValue: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '700',
  },

  calorieTarget: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },

  progressTrack: {
    height: 8,
    backgroundColor:
      colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
  },

  calorieSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },

  progressText: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: '700',
  },

  macroList: {
    gap: spacing.md,
  },

  macroBlock: {
    gap: spacing.sm,
  },

  macroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  macroSummary: {
    color: colors.text,
    fontSize: fontSize.small,
    fontWeight: '600',
  },

  macroProgressTrack: {
    height: 6,
    backgroundColor:
      colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },

  macroProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },

  accentText: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: '700',
    letterSpacing: 1,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '600',
  },

  secondaryText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  statusText: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: '700',
  },

  workoutName: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },

  workoutStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  workoutStat: {
    flex: 1,
    backgroundColor:
      colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },

  workoutStatValue: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },

  workoutStatLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    marginTop: spacing.xs,
  },

  weightSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  weightValue: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '700',
  },

  goalWeightBlock: {
    alignItems: 'flex-end',
  },

  goalWeightValue: {
    color: colors.primary,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },

  weightRemainingBox: {
    backgroundColor:
      colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },

  weightRemainingValue: {
    color: colors.primary,
    fontSize: fontSize.title,
    fontWeight: '700',
  },

  weightRemainingLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },

  modalCard: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },

  largeModalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },

  modalTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },

  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    marginTop: spacing.xs,
  },

  closeText: {
    color: colors.textSecondary,
    fontSize: 22,
  },

  modalScrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },

  inputGroup: {
    gap: spacing.sm,
  },

  input: {
    backgroundColor:
      colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    color: colors.text,
    fontSize: fontSize.body,
    padding: spacing.md,
  },

  macroInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  macroInput: {
    flex: 1,
    gap: spacing.sm,
  },

  mealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  mealButton: {
    backgroundColor:
      colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  mealButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  mealButtonText: {
    color: colors.text,
    fontSize: fontSize.body,
  },

  mealButtonTextSelected: {
    color: colors.background,
    fontWeight: '700',
  },

  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
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

  activeWorkoutBox: {
    backgroundColor:
      colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },

  activeWorkoutLabel: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: '700',
    letterSpacing: 1,
  },

  activeWorkoutName: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },

  modalWorkoutStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },

  currentWeightBox: {
    backgroundColor:
      colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },

  currentWeightText: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
    marginTop: spacing.xs,
  },

  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },

  weightInput: {
    flex: 1,
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    paddingVertical: spacing.md,
  },

  weightUnit: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },

  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  secondaryButton: {
    flex: 1,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    fontWeight: '700',
  },

  modalPrimaryButton: {
    flex: 1,
  },
});