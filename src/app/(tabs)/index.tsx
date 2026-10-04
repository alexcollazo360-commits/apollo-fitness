import Ionicons from '@expo/vector-icons/Ionicons';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

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

const MEALS: Meal[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

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
  const insets = useSafeAreaInsets();

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
    fabOpen,
    setFabOpen,
  ] = useState(false);

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

  const [
    foodName,
    setFoodName,
  ] = useState('');

  const [
    calories,
    setCalories,
  ] = useState('');

  const [
    protein,
    setProtein,
  ] = useState('');

  const [
    carbs,
    setCarbs,
  ] = useState('');

  const [
    fat,
    setFat,
  ] = useState('');

  const [
    serving,
    setServing,
  ] = useState('');

  const [
    selectedMeal,
    setSelectedMeal,
  ] =
    useState<Meal>('Breakfast');

  const [
    workoutName,
    setWorkoutName,
  ] = useState('');

  const [
    quickWeight,
    setQuickWeight,
  ] = useState('');

  const calorieTarget =
    profile?.dailyCalorieTarget ??
    2200;

  const proteinTarget =
    profile?.proteinTarget ??
    180;

  const carbTarget =
    profile?.carbTarget ??
    190;

  const fatTarget =
    profile?.fatTarget ??
    80;

  const goalWeight =
    profile?.goalWeight ??
    null;

  const totalCalories =
    foodEntries.reduce(
      (total, entry) =>
        total + entry.calories,
      0
    );

  const totalProtein =
    foodEntries.reduce(
      (total, entry) =>
        total + entry.protein,
      0
    );

  const totalCarbs =
    foodEntries.reduce(
      (total, entry) =>
        total + entry.carbs,
      0
    );

  const totalFat =
    foodEntries.reduce(
      (total, entry) =>
        total + entry.fat,
      0
    );

  const calorieDifference =
    calorieTarget -
    totalCalories;

  const isOverCalories =
    calorieDifference < 0;

  const calorieStatusAmount =
    Math.abs(
      calorieDifference
    );

  const calorieProgress =
    getProgress(
      totalCalories,
      calorieTarget
    );

  const proteinProgress =
    getProgress(
      totalProtein,
      proteinTarget
    );

  const carbProgress =
    getProgress(
      totalCarbs,
      carbTarget
    );

  const fatProgress =
    getProgress(
      totalFat,
      fatTarget
    );

  const mealSummaries =
    MEALS.map((meal) => {
      const entries =
        foodEntries.filter(
          (entry) =>
            entry.meal === meal
        );

      const mealCalories =
        entries.reduce(
          (total, entry) =>
            total +
            entry.calories,
          0
        );

      return {
        meal,
        entries,
        entryCount:
          entries.length,
        calories:
          mealCalories,
      };
    });

  const todayDate =
    getLocalDateString(
      new Date()
    );

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
        workout.workoutDate ===
        todayDate
    );

  const todaysCompletedWorkout =
    todaysCompletedWorkouts[0] ??
    null;

  const activeWorkoutIsToday =
    activeWorkout?.workoutDate ===
    todayDate;

  const activeExerciseCount =
    activeWorkoutIsToday
      ? activeWorkout?.exercises
          .length ?? 0
      : 0;

  const activeSetCount =
    activeWorkoutIsToday
      ? activeWorkout?.exercises.reduce(
          (
            total,
            exercise
          ) =>
            total +
            exercise.sets.length,
          0
        ) ?? 0
      : 0;

  const weightToGoal =
    currentWeight !== null &&
    goalWeight !== null
      ? Math.abs(
          currentWeight -
            goalWeight
        )
      : null;

  function showMessage(
    title: string,
    message: string
  ) {
    if (
      Platform.OS === 'web'
    ) {
      window.alert(
        `${title}\n\n${message}`
      );

      return;
    }

    Alert.alert(
      title,
      message
    );
  }

  function goToFood() {
    router.push(
      '/(tabs)/food'
    );
  }

  function goToWorkout() {
    router.push(
      '/(tabs)/workout'
    );
  }

  function goToProgress() {
    router.push(
      '/(tabs)/progress'
    );
  }

  function resetFoodForm() {
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setServing('');
    setSelectedMeal(
      'Breakfast'
    );
  }

  function openFoodModal(
    meal?: Meal
  ) {
    setFabOpen(false);

    resetFoodForm();

    setSelectedMeal(
      meal ??
        getDefaultMeal()
    );

    setFoodModalVisible(
      true
    );
  }

  function closeFoodModal() {
    if (savingFood) {
      return;
    }

    resetFoodForm();

    setFoodModalVisible(
      false
    );
  }

  async function handleSaveFood() {
    if (
      !foodName.trim()
    ) {
      showMessage(
        'Food name required',
        'Enter a food name before saving.'
      );

      return;
    }

    setSavingFood(true);

    try {
      await addFoodEntry({
        name:
          foodName.trim(),

        calories:
          Number(calories) ||
          0,

        protein:
          Number(protein) ||
          0,

        carbs:
          Number(carbs) ||
          0,

        fat:
          Number(fat) ||
          0,

        serving:
          serving.trim(),

        meal:
          selectedMeal,
      });

      resetFoodForm();

      setFoodModalVisible(
        false
      );
    } finally {
      setSavingFood(false);
    }
  }

  function openWorkoutModal() {
    setFabOpen(false);

    setWorkoutName('');

    setWorkoutModalVisible(
      true
    );
  }

  function closeWorkoutModal() {
    if (
      startingWorkout
    ) {
      return;
    }

    setWorkoutName('');

    setWorkoutModalVisible(
      false
    );
  }

  async function handleStartWorkout() {
    const name =
      workoutName.trim() ===
      ''
        ? 'Workout'
        : workoutName.trim();

    setStartingWorkout(
      true
    );

    try {
      const success =
        await startWorkout(
          name
        );

      if (!success) {
        showMessage(
          'Unable to start workout',
          'There was a problem creating your workout.'
        );

        return;
      }

      setWorkoutName('');

      setWorkoutModalVisible(
        false
      );
    } finally {
      setStartingWorkout(
        false
      );
    }
  }

  function handleContinueWorkout() {
    setWorkoutModalVisible(
      false
    );

    goToWorkout();
  }

  function openWeightModal() {
    setFabOpen(false);

    setQuickWeight('');

    setWeightModalVisible(
      true
    );
  }

  function closeWeightModal() {
    if (savingWeight) {
      return;
    }

    setQuickWeight('');

    setWeightModalVisible(
      false
    );
  }

  async function handleSaveWeight() {
    const parsedWeight =
      Number(quickWeight);

    if (
      quickWeight.trim() ===
        '' ||
      Number.isNaN(
        parsedWeight
      ) ||
      parsedWeight <= 0
    ) {
      showMessage(
        'Invalid weight',
        'Enter a valid weight greater than 0.'
      );

      return;
    }

    setSavingWeight(true);

    try {
      await addWeightEntry(
        parsedWeight
      );

      setQuickWeight('');

      setWeightModalVisible(
        false
      );
    } finally {
      setSavingWeight(false);
    }
  }

  return (
    <View
      style={
        styles.root
      }
    >
      <ScrollView
        style={
          styles.screen
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={[
          styles.container,
          {
            paddingTop:
              insets.top +
              spacing.md,
          },
        ]}
      >
        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.brandRow
            }
          >
            <View
              style={
                styles.brandMark
              }
            >
              <Text
                style={
                  styles.brandMarkText
                }
              >
                AU
              </Text>
            </View>

            <View
              style={
                styles.brandCopy
              }
            >
              <Text
                style={
                  styles.brandName
                }
              >
                APOLLO ULTRA
              </Text>

              <Text
                style={
                  styles.brandTagline
                }
              >
                TRACK TODAY. BUILD TOMORROW.
              </Text>
            </View>
          </View>

          <View
            style={
              styles.todayHeadingRow
            }
          >
            <View>
              <Text
                style={
                  styles.screenTitle
                }
              >
                Today
              </Text>

              <Text
                style={
                  styles.dateText
                }
              >
                {formattedDate}
              </Text>
            </View>

            <View
              style={
                styles.todayBadge
              }
            >
              <Ionicons
                name="pulse-outline"
                size={18}
                color={
                  colors.primary
                }
              />
            </View>
          </View>
        </View>

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
              Daily Nutrition
            </Text>

            <Pressable
              onPress={
                goToFood
              }
              hitSlop={12}
            >
              <Text
                style={
                  styles.accentText
                }
              >
                FOOD
              </Text>
            </Pressable>
          </View>

          <View
            style={
              styles.nutritionDashboard
            }
          >
            <View
              style={
                styles.calorieRingWrap
              }
            >
              <Svg
                width={124}
                height={124}
                viewBox="0 0 150 150"
              >
                <Circle
                  cx="75"
                  cy="75"
                  r="61"
                  fill="none"
                  stroke={
                    colors.surfaceSecondary
                  }
                  strokeWidth="13"
                />

                <Circle
                  cx="75"
                  cy="75"
                  r="61"
                  fill="none"
                  stroke={
                    isOverCalories
                      ? colors.warning
                      : colors.primary
                  }
                  strokeWidth="13"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 61}`}
                  strokeDashoffset={`${
                    2 *
                    Math.PI *
                    61 *
                    (1 -
                      calorieProgress /
                        100)
                  }`}
                  transform="rotate(-90 75 75)"
                />
              </Svg>

              <View
                style={
                  styles.calorieRingContent
                }
              >
                <Text
                  style={
                    styles.calorieRingValue
                  }
                >
                  {totalCalories.toLocaleString()}
                </Text>

                <Text
                  style={
                    styles.calorieRingTarget
                  }
                >
                  of {calorieTarget.toLocaleString()}
                </Text>

                <Text
                  style={
                    styles.calorieRingUnit
                  }
                >
                  kcal
                </Text>
              </View>
            </View>

            <View
              style={
                styles.macroPanel
              }
            >
              <View
                style={
                  styles.macroItem
                }
              >
                <View
                  style={
                    styles.macroLabelRow
                  }
                >
                  <Text
                    style={
                      styles.macroName
                    }
                  >
                    Protein
                  </Text>

                  <Text
                    style={
                      styles.macroNumbers
                    }
                  >
                    {totalProtein} /{' '}
                    {proteinTarget} g
                  </Text>
                </View>

                <View
                  style={
                    styles.macroTrack
                  }
                >
                  <View
                    style={[
                      styles.macroFill,
                      {
                        width: `${proteinProgress}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View
                style={
                  styles.macroItem
                }
              >
                <View
                  style={
                    styles.macroLabelRow
                  }
                >
                  <Text
                    style={
                      styles.macroName
                    }
                  >
                    Carbs
                  </Text>

                  <Text
                    style={
                      styles.macroNumbers
                    }
                  >
                    {totalCarbs} /{' '}
                    {carbTarget} g
                  </Text>
                </View>

                <View
                  style={
                    styles.macroTrack
                  }
                >
                  <View
                    style={[
                      styles.macroFill,
                      {
                        width: `${carbProgress}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View
                style={
                  styles.macroItem
                }
              >
                <View
                  style={
                    styles.macroLabelRow
                  }
                >
                  <Text
                    style={
                      styles.macroName
                    }
                  >
                    Fat
                  </Text>

                  <Text
                    style={
                      styles.macroNumbers
                    }
                  >
                    {totalFat} /{' '}
                    {fatTarget} g
                  </Text>
                </View>

                <View
                  style={
                    styles.macroTrack
                  }
                >
                  <View
                    style={[
                      styles.macroFill,
                      {
                        width: `${fatProgress}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          <View
            style={
              styles.calorieFooter
            }
          >
            <View
              style={
                styles.calorieStatus
              }
            >
              <Ionicons
                name={
                  isOverCalories
                    ? 'alert-circle-outline'
                    : 'flame-outline'
                }
                size={15}
                color={
                  isOverCalories
                    ? colors.warning
                    : colors.primary
                }
              />

              <Text
                style={[
                  styles.calorieStatusText,

                  isOverCalories &&
                    styles.calorieStatusOver,
                ]}
              >
                {calorieStatusAmount.toLocaleString()}{' '}
                kcal{' '}
                {isOverCalories
                  ? 'over target'
                  : 'remaining'}
              </Text>
            </View>

            <Text
              style={
                styles.caloriePercent
              }
            >
              {Math.round(
                (totalCalories /
                  Math.max(
                    calorieTarget,
                    1
                  )) *
                  100
              )}
              %
            </Text>
          </View>
        </AppCard>

        <AppCard>
          <View
            style={
              styles.cardHeader
            }
          >
            <View>
              <Text
                style={
                  styles.cardTitle
                }
              >
                Today's Meals
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }
              >
                Tap a meal to add food
              </Text>
            </View>

            <Pressable
              onPress={
                goToFood
              }
              hitSlop={12}
            >
              <Text
                style={
                  styles.accentText
                }
              >
                SEE ALL
              </Text>
            </Pressable>
          </View>

          <View
            style={
              styles.mealSummaryList
            }
          >
            {mealSummaries.map(
              ({
                meal,
                calories:
                  mealCalories,
                entryCount,
              }) => (
                <Pressable
                  key={meal}
                  onPress={() =>
                    openFoodModal(
                      meal
                    )
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.mealSummaryRow,

                    pressed &&
                      styles.mealSummaryPressed,
                  ]}
                >
                  <View
                    style={
                      styles.mealIcon
                    }
                  >
                    <Ionicons
                      name={
                        meal ===
                        'Breakfast'
                          ? 'sunny-outline'
                          : meal ===
                              'Lunch'
                            ? 'restaurant-outline'
                            : meal ===
                                'Dinner'
                              ? 'moon-outline'
                              : 'cafe-outline'
                      }
                      size={17}
                      color={
                        entryCount >
                        0
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.mealSummaryCenter
                    }
                  >
                    <Text
                      style={
                        styles.mealSummaryName
                      }
                    >
                      {meal}
                    </Text>

                    <Text
                      style={
                        styles.mealSummaryItems
                      }
                    >
                      {entryCount >
                      0
                        ? `${entryCount} ${
                            entryCount ===
                            1
                              ? 'item'
                              : 'items'
                          } logged`
                        : 'Nothing logged'}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.mealSummaryRight
                    }
                  >
                    <Text
                      style={
                        styles.mealSummaryCalories
                      }
                    >
                      {
                        mealCalories
                      }
                    </Text>

                    <Text
                      style={
                        styles.mealSummaryUnit
                      }
                    >
                      kcal
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={15}
                    color={
                      colors.textSecondary
                    }
                  />
                </Pressable>
              )
            )}
          </View>
        </AppCard>

        <AppCard>
          <View
            style={
              styles.cardHeader
            }
          >
            <View>
              <Text
                style={
                  styles.cardTitle
                }
              >
                Today's Workout
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }
              >
                Move with purpose
              </Text>
            </View>

            <Pressable
              onPress={
                goToWorkout
              }
              hitSlop={12}
            >
              <Text
                style={
                  styles.accentText
                }
              >
                WORKOUT
              </Text>
            </Pressable>
          </View>

          {historyLoading ? (
            <ActivityIndicator
              color={
                colors.primary
              }
            />
          ) : activeWorkoutIsToday &&
            activeWorkout ? (
            <Pressable
              onPress={
                goToWorkout
              }
              style={({
                pressed,
              }) => [
                styles.workoutFeature,

                pressed &&
                  styles.featurePressed,
              ]}
            >
              <View
                style={
                  styles.workoutIconBox
                }
              >
                <Ionicons
                  name="barbell-outline"
                  size={23}
                  color={
                    colors.background
                  }
                />
              </View>

              <View
                style={
                  styles.workoutFeatureContent
                }
              >
                <View
                  style={
                    styles.statusRow
                  }
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
                  numberOfLines={
                    1
                  }
                >
                  {
                    activeWorkout.name
                  }
                </Text>

                <Text
                  style={
                    styles.workoutMeta
                  }
                >
                  {
                    activeExerciseCount
                  }{' '}
                  exercises ·{' '}
                  {
                    activeSetCount
                  }{' '}
                  sets
                </Text>
              </View>

              <View
                style={
                  styles.chevronCircle
                }
              >
                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color={
                    colors.text
                  }
                />
              </View>
            </Pressable>
          ) : todaysCompletedWorkout ? (
            <Pressable
              onPress={
                goToWorkout
              }
              style={({
                pressed,
              }) => [
                styles.workoutFeature,

                pressed &&
                  styles.featurePressed,
              ]}
            >
              <View
                style={[
                  styles.workoutIconBox,
                  styles.workoutIconBoxComplete,
                ]}
              >
                <Ionicons
                  name="checkmark"
                  size={24}
                  color={
                    colors.background
                  }
                />
              </View>

              <View
                style={
                  styles.workoutFeatureContent
                }
              >
                <View
                  style={
                    styles.statusRow
                  }
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
                  numberOfLines={
                    1
                  }
                >
                  {
                    todaysCompletedWorkout.name
                  }
                </Text>

                <Text
                  style={
                    styles.workoutMeta
                  }
                >
                  {
                    todaysCompletedWorkout.exerciseCount
                  }{' '}
                  exercises ·{' '}
                  {
                    todaysCompletedWorkout.setCount
                  }{' '}
                  sets
                </Text>
              </View>

              <View
                style={
                  styles.chevronCircle
                }
              >
                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color={
                    colors.text
                  }
                />
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={
                openWorkoutModal
              }
              style={({
                pressed,
              }) => [
                styles.workoutFeature,
                styles.workoutFeatureEmpty,

                pressed &&
                  styles.featurePressed,
              ]}
            >
              <View
                style={
                  styles.workoutIconBox
                }
              >
                <Ionicons
                  name="barbell-outline"
                  size={23}
                  color={
                    colors.background
                  }
                />
              </View>

              <View
                style={
                  styles.workoutFeatureContent
                }
              >
                <Text
                  style={
                    styles.workoutName
                  }
                >
                  Start workout
                </Text>

                <Text
                  style={
                    styles.workoutMeta
                  }
                >
                  Track your training
                  session
                </Text>
              </View>

              <View
                style={
                  styles.chevronCircle
                }
              >
                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color={
                    colors.text
                  }
                />
              </View>
            </Pressable>
          )}
        </AppCard>

        <AppCard>
          <View
            style={
              styles.cardHeader
            }
          >
            <View>
              <Text
                style={
                  styles.cardTitle
                }
              >
                Weight
              </Text>

              <Text
                style={
                  styles.cardSubtitle
                }
              >
                Keep moving toward your
                goal
              </Text>
            </View>

            <Pressable
              onPress={
                goToProgress
              }
              hitSlop={12}
            >
              <Text
                style={
                  styles.accentText
                }
              >
                PROGRESS
              </Text>
            </Pressable>
          </View>

          {progressLoading ||
          profileLoading ? (
            <ActivityIndicator
              color={
                colors.primary
              }
            />
          ) : currentWeight ===
            null ? (
            <Pressable
              onPress={
                openWeightModal
              }
              style={({
                pressed,
              }) => [
                styles.weightFeature,

                pressed &&
                  styles.featurePressed,
              ]}
            >
              <View
                style={
                  styles.weightIconBox
                }
              >
                <Ionicons
                  name="scale-outline"
                  size={21}
                  color={
                    colors.primary
                  }
                />
              </View>

              <View
                style={
                  styles.weightFeatureContent
                }
              >
                <Text
                  style={
                    styles.weightEmptyTitle
                  }
                >
                  Log your first weight
                </Text>

                <Text
                  style={
                    styles.weightMeta
                  }
                >
                  Start tracking your
                  progress
                </Text>
              </View>

              <Ionicons
                name="add"
                size={21}
                color={
                  colors.primary
                }
              />
            </Pressable>
          ) : (
            <View
              style={
                styles.weightFeature
              }
            >
              <View
                style={
                  styles.weightMain
                }
              >
                <Text
                  style={
                    styles.weightCurrentLabel
                  }
                >
                  CURRENT
                </Text>

                <View
                  style={
                    styles.weightValueRow
                  }
                >
                  <Text
                    style={
                      styles.weightValue
                    }
                  >
                    {
                      currentWeight
                    }
                  </Text>

                  <Text
                    style={
                      styles.weightUnitText
                    }
                  >
                    lbs
                  </Text>
                </View>

                {weightToGoal !==
                  null && (
                  <View
                    style={
                      styles.goalProgressRow
                    }
                  >
                    <Ionicons
                      name="trending-down-outline"
                      size={14}
                      color={
                        colors.primary
                      }
                    />

                    <Text
                      style={
                        styles.goalProgressText
                      }
                    >
                      {weightToGoal.toFixed(
                        1
                      )}{' '}
                      lbs from goal
                    </Text>
                  </View>
                )}
              </View>

              {goalWeight !==
                null && (
                <View
                  style={
                    styles.goalWeightPanel
                  }
                >
                  <Text
                    style={
                      styles.goalWeightLabel
                    }
                  >
                    GOAL
                  </Text>

                  <Text
                    style={
                      styles.goalWeightValue
                    }
                  >
                    {
                      goalWeight
                    }
                  </Text>

                  <Text
                    style={
                      styles.goalWeightUnit
                    }
                  >
                    lbs
                  </Text>
                </View>
              )}
            </View>
          )}
        </AppCard>
      </ScrollView>

      {fabOpen && (
        <Pressable
          style={
            styles.fabBackdrop
          }
          onPress={() =>
            setFabOpen(false)
          }
        />
      )}

      <View
        pointerEvents="box-none"
        style={[
          styles.fabContainer,
          {
            bottom:
              Math.max(
                insets.bottom,
                10
              ) + 78,
          },
        ]}
      >
        {fabOpen && (
          <View
            style={
              styles.fabMenu
            }
          >
            <Pressable
              onPress={() =>
                openFoodModal()
              }
              style={({
                pressed,
              }) => [
                styles.fabAction,

                pressed &&
                  styles.fabActionPressed,
              ]}
            >
              <View
                style={
                  styles.fabActionLabel
                }
              >
                <Text
                  style={
                    styles.fabActionText
                  }
                >
                  Add Food
                </Text>
              </View>

              <View
                style={
                  styles.fabActionIcon
                }
              >
                <Ionicons
                  name="restaurant-outline"
                  size={20}
                  color={
                    colors.text
                  }
                />
              </View>
            </Pressable>

            <Pressable
              onPress={
                openWorkoutModal
              }
              style={({
                pressed,
              }) => [
                styles.fabAction,

                pressed &&
                  styles.fabActionPressed,
              ]}
            >
              <View
                style={
                  styles.fabActionLabel
                }
              >
                <Text
                  style={
                    styles.fabActionText
                  }
                >
                  {activeWorkout
                    ? 'Resume Workout'
                    : 'Start Workout'}
                </Text>
              </View>

              <View
                style={
                  styles.fabActionIcon
                }
              >
                <Ionicons
                  name="barbell-outline"
                  size={21}
                  color={
                    colors.text
                  }
                />
              </View>
            </Pressable>

            <Pressable
              onPress={
                openWeightModal
              }
              style={({
                pressed,
              }) => [
                styles.fabAction,

                pressed &&
                  styles.fabActionPressed,
              ]}
            >
              <View
                style={
                  styles.fabActionLabel
                }
              >
                <Text
                  style={
                    styles.fabActionText
                  }
                >
                  Log Weight
                </Text>
              </View>

              <View
                style={
                  styles.fabActionIcon
                }
              >
                <Ionicons
                  name="scale-outline"
                  size={21}
                  color={
                    colors.text
                  }
                />
              </View>
            </Pressable>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            fabOpen
              ? 'Close quick actions'
              : 'Open quick actions'
          }
          onPress={() =>
            setFabOpen(
              (current) =>
                !current
            )
          }
          style={({
            pressed,
          }) => [
            styles.fabButton,

            fabOpen &&
              styles.fabButtonOpen,

            pressed &&
              styles.fabButtonPressed,
          ]}
        >
          <Ionicons
            name={
              fabOpen
                ? 'close'
                : 'add'
            }
            size={30}
            color={
              colors.background
            }
          />
        </Pressable>
      </View>

      <Modal
        visible={
          foodModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeFoodModal
        }
      >
        <KeyboardAvoidingView
          style={
            styles.modalOverlay
          }
          behavior={
            Platform.OS ===
            'ios'
              ? 'padding'
              : undefined
          }
        >
          <View
            style={
              styles.largeModalCard
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.modalTitle
                  }
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
                onPress={
                  closeFoodModal
                }
                disabled={
                  savingFood
                }
                hitSlop={12}
              >
                <Text
                  style={
                    styles.closeText
                  }
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
                style={
                  styles.inputGroup
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  FOOD NAME
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  value={
                    foodName
                  }
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
                style={
                  styles.inputGroup
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  CALORIES
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  value={
                    calories
                  }
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
                style={
                  styles.macroInputs
                }
              >
                <View
                  style={
                    styles.macroInput
                  }
                >
                  <Text
                    style={
                      styles.label
                    }
                  >
                    PROTEIN
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      protein
                    }
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
                    style={
                      styles.label
                    }
                  >
                    CARBS
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      carbs
                    }
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
                    style={
                      styles.label
                    }
                  >
                    FAT
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      fat
                    }
                    onChangeText={
                      setFat
                    }
                    placeholder="0"
                    placeholderTextColor={
                      colors.textSecondary
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

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
                  SERVING
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  value={
                    serving
                  }
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
                style={
                  styles.inputGroup
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  MEAL
                </Text>

                <View
                  style={
                    styles.mealRow
                  }
                >
                  {MEALS.map(
                    (
                      mealOption
                    ) => {
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
                            {
                              mealOption
                            }
                          </Text>
                        </Pressable>
                      );
                    }
                  )}
                </View>
              </View>

              <Pressable
                onPress={
                  handleSaveFood
                }
                disabled={
                  savingFood
                }
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
        visible={
          workoutModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeWorkoutModal
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.modalTitle
                  }
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
                  style={
                    styles.closeText
                  }
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
                    {
                      activeWorkout.name
                    }
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
                          exercise
                            .sets
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
                  style={
                    styles.inputGroup
                  }
                >
                  <Text
                    style={
                      styles.label
                    }
                  >
                    WORKOUT NAME
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      workoutName
                    }
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
        visible={
          weightModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeWeightModal
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.modalTitle
                  }
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
                disabled={
                  savingWeight
                }
                hitSlop={12}
              >
                <Text
                  style={
                    styles.closeText
                  }
                >
                  ✕
                </Text>
              </Pressable>
            </View>

            {currentWeight !==
              null && (
              <View
                style={
                  styles.currentWeightBox
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  CURRENT WEIGHT
                </Text>

                <Text
                  style={
                    styles.currentWeightText
                  }
                >
                  {
                    currentWeight
                  }{' '}
                  lbs
                </Text>
              </View>
            )}

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
                  value={
                    quickWeight
                  }
                  onChangeText={
                    setQuickWeight
                  }
                  placeholder="235"
                  placeholderTextColor={
                    colors.textSecondary
                  }
                  keyboardType="decimal-pad"
                  autoFocus
                  editable={
                    !savingWeight
                  }
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
              style={
                styles.modalActions
              }
            >
              <Pressable
                onPress={
                  closeWeightModal
                }
                disabled={
                  savingWeight
                }
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
                disabled={
                  savingWeight
                }
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
    </View>
  );
}

const styles =
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    screen: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    container: {
      paddingHorizontal:
        spacing.lg,
      paddingBottom: 180,
      gap: 10,
    },

    header: {
      marginBottom: 2,
      gap: 8,
    },

    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    brandMark: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.surface,
    },

    brandMarkText: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
    },

    brandCopy: {
      flex: 1,
      gap: 1,
    },

    brandName: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 2.2,
    },

    brandTagline: {
      color:
        colors.textSecondary,
      fontSize: 8,
      fontWeight: '700',
      letterSpacing: 1.05,
    },

    todayHeadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: spacing.md,
    },

    todayBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
    },

    screenTitle: {
      color: colors.text,
      fontSize: 36,
      lineHeight: 39,
      fontWeight: '800',
      letterSpacing: -1.4,
    },

    dateText: {
      color:
        colors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 1,
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
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: -0.35,
    },

    cardSubtitle: {
      color:
        colors.textSecondary,
      fontSize: 10,
      marginTop: 1,
    },

    accentText: {
      color:
        colors.primary,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.25,
    },

    nutritionDashboard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingTop: 0,
    },

    calorieRingWrap: {
      width: 124,
      height: 124,
      alignItems: 'center',
      justifyContent: 'center',
    },

    calorieRingContent: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },

    calorieRingValue: {
      color: colors.text,
      fontSize: 26,
      lineHeight: 29,
      fontWeight: '800',
      letterSpacing: -1,
    },

    calorieRingTarget: {
      color:
        colors.textSecondary,
      fontSize: 9,
      fontWeight: '600',
      marginTop: 1,
    },

    calorieRingUnit: {
      color:
        colors.textSecondary,
      fontSize: 8,
      fontWeight: '600',
      marginTop: 1,
    },

    macroPanel: {
      flex: 1,
      gap: 10,
    },

    macroItem: {
      gap: 5,
    },

    macroLabelRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      gap: 6,
    },

    macroName: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '600',
    },

    macroNumbers: {
      color:
        colors.textSecondary,
      fontSize: 9,
      fontWeight: '600',
    },

    macroTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor:
        colors.surfaceSecondary,
      overflow: 'hidden',
    },

    macroFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor:
        colors.primary,
    },

    calorieFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      paddingTop: 6,
      marginTop: 0,
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
    },

    calorieStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    calorieStatusText: {
      color:
        colors.textSecondary,
      fontSize: 10,
      fontWeight: '600',
    },

    calorieStatusOver: {
      color:
        colors.warning,
    },

    caloriePercent: {
      color:
        colors.primary,
      fontSize: 10,
      fontWeight: '800',
    },

    mealSummaryList: {
      gap: 4,
    },

    mealSummaryRow: {
      minHeight: 42,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        colors.surfaceSecondary,
      borderRadius: 13,
      paddingHorizontal: 11,
      paddingVertical: 4,
      gap: 9,
    },

    mealSummaryPressed: {
      opacity: 0.78,
    },

    mealIcon: {
      width: 29,
      height: 29,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        colors.surface,
    },

    mealSummaryCenter: {
      flex: 1,
    },

    mealSummaryName: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
    },

    mealSummaryItems: {
      color:
        colors.textSecondary,
      fontSize: 9,
      marginTop: 1,
    },

    mealSummaryRight: {
      alignItems:
        'flex-end',
    },

    mealSummaryCalories: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
    },

    mealSummaryUnit: {
      color:
        colors.textSecondary,
      fontSize: 8,
      marginTop: 1,
    },

    workoutFeature: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 60,
      padding: 8,
      gap: 10,
      backgroundColor:
        colors.surfaceSecondary,
      borderRadius: 15,
    },

    workoutFeatureEmpty: {
      minHeight: 58,
    },

    featurePressed: {
      opacity: 0.78,
    },

    workoutIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        colors.primary,
    },

    workoutIconBoxComplete: {
      backgroundColor:
        colors.primary,
    },

    workoutFeatureContent: {
      flex: 1,
      gap: 2,
    },

    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    statusIndicator: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor:
        colors.primary,
    },

    statusText: {
      color:
        colors.primary,
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 0.85,
    },

    workoutName: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },

    workoutMeta: {
      color:
        colors.textSecondary,
      fontSize: 10,
    },

    chevronCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        colors.surface,
    },

    weightFeature: {
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        colors.surfaceSecondary,
      borderRadius: 15,
      padding: 10,
      gap: 10,
    },

    weightIconBox: {
      width: 39,
      height: 39,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        colors.surface,
    },

    weightFeatureContent: {
      flex: 1,
    },

    weightEmptyTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
    },

    weightMeta: {
      color:
        colors.textSecondary,
      fontSize: 10,
      marginTop: 1,
    },

    weightMain: {
      flex: 1,
    },

    weightCurrentLabel: {
      color:
        colors.textSecondary,
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 1,
    },

    weightValueRow: {
      flexDirection: 'row',
      alignItems:
        'baseline',
      marginTop: 0,
    },

    weightValue: {
      color: colors.text,
      fontSize: 26,
      lineHeight: 29,
      fontWeight: '800',
      letterSpacing: -0.8,
    },

    weightUnitText: {
      color:
        colors.textSecondary,
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 4,
    },

    goalProgressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },

    goalProgressText: {
      color:
        colors.primary,
      fontSize: 9,
      fontWeight: '600',
    },

    goalWeightPanel: {
      minWidth: 64,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        colors.surface,
      borderRadius: 13,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },

    goalWeightLabel: {
      color:
        colors.textSecondary,
      fontSize: 7,
      fontWeight: '800',
      letterSpacing: 0.8,
    },

    goalWeightValue: {
      color:
        colors.primary,
      fontSize: 19,
      fontWeight: '800',
      marginTop: 1,
    },

    goalWeightUnit: {
      color:
        colors.textSecondary,
      fontSize: 8,
    },
        label: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '600',
      letterSpacing: 1,
    },

    secondaryText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
    },

    fabBackdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor:
        'rgba(0, 0, 0, 0.22)',
    },

    fabContainer: {
      position: 'absolute',
      right: spacing.lg,
      alignItems: 'flex-end',
      gap: spacing.sm,
    },

    fabMenu: {
      alignItems: 'flex-end',
      gap: spacing.sm,
      marginBottom:
        spacing.xs,
    },

    fabAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'flex-end',
      gap: spacing.sm,
    },

    fabActionPressed: {
      opacity: 0.72,
    },

    fabActionLabel: {
      minHeight: 42,
      justifyContent:
        'center',
      paddingHorizontal:
        spacing.md,
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 21,

      shadowColor:
        '#000000',
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.24,
      shadowRadius: 8,

      elevation: 8,
    },

    fabActionText: {
      color: colors.text,
      fontSize:
        fontSize.small,
      fontWeight: '700',
    },

    fabActionIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,

      shadowColor:
        '#000000',
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.24,
      shadowRadius: 8,

      elevation: 8,
    },

    fabButton: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        colors.primary,

      shadowColor:
        '#000000',
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.32,
      shadowRadius: 10,

      elevation: 12,
    },

    fabButtonOpen: {
      transform: [
        {
          rotate: '0deg',
        },
      ],
    },

    fabButtonPressed: {
      opacity: 0.82,
      transform: [
        {
          scale: 0.96,
        },
      ],
    },

    modalOverlay: {
      flex: 1,
      backgroundColor:
        'rgba(0, 0, 0, 0.78)',
      alignItems: 'center',
      justifyContent:
        'center',
      padding: spacing.lg,
    },

    modalCard: {
      width: '100%',
      maxWidth: 430,
      backgroundColor:
        colors.surface,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius:
        borderRadius.lg,
      padding: spacing.lg,
      gap: spacing.lg,
    },

    largeModalCard: {
      width: '100%',
      maxWidth: 520,
      maxHeight: '90%',
      backgroundColor:
        colors.surface,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius:
        borderRadius.lg,
      padding: spacing.lg,
      gap: spacing.md,
    },

    modalHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
      gap: spacing.md,
    },

    modalTitle: {
      color: colors.text,
      fontSize:
        fontSize.title,
      fontWeight: '700',
    },

    modalSubtitle: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
      marginTop:
        spacing.xs,
    },

    closeText: {
      color:
        colors.textSecondary,
      fontSize: 22,
    },

    modalScrollContent: {
      gap: spacing.md,
      paddingBottom:
        spacing.sm,
    },

    inputGroup: {
      gap: spacing.sm,
    },

    input: {
      backgroundColor:
        colors.surfaceSecondary,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius:
        borderRadius.md,
      color: colors.text,
      fontSize:
        fontSize.body,
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
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius:
        borderRadius.md,
      paddingHorizontal:
        spacing.md,
      paddingVertical:
        spacing.sm,
    },

    mealButtonSelected: {
      backgroundColor:
        colors.primary,
      borderColor:
        colors.primary,
    },

    mealButtonText: {
      color: colors.text,
      fontSize:
        fontSize.body,
    },

    mealButtonTextSelected: {
      color:
        colors.background,
      fontWeight: '700',
    },

    primaryButton: {
      backgroundColor:
        colors.primary,
      borderRadius:
        borderRadius.md,
      padding: spacing.md,
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

    activeWorkoutBox: {
      backgroundColor:
        colors.surfaceSecondary,
      borderRadius:
        borderRadius.md,
      padding: spacing.md,
      gap: spacing.sm,
    },

    activeWorkoutLabel: {
      color:
        colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 1,
    },

    activeWorkoutName: {
      color: colors.text,
      fontSize:
        fontSize.title,
      fontWeight: '700',
    },

    modalWorkoutStats: {
      flexDirection: 'row',
      gap: spacing.lg,
    },

    currentWeightBox: {
      backgroundColor:
        colors.surfaceSecondary,
      borderRadius:
        borderRadius.md,
      padding: spacing.md,
    },

    currentWeightText: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
      marginTop:
        spacing.xs,
    },

    weightInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        colors.surfaceSecondary,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius:
        borderRadius.md,
      paddingHorizontal:
        spacing.md,
    },

    weightInput: {
      flex: 1,
      color: colors.text,
      fontSize: 28,
      fontWeight: '700',
      paddingVertical:
        spacing.md,
    },

    weightUnit: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
    },

    modalActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },

    secondaryButton: {
      flex: 1,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius:
        borderRadius.md,
      padding: spacing.md,
      alignItems: 'center',
    },

    secondaryButtonText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
      fontWeight: '700',
    },

    modalPrimaryButton: {
      flex: 1,
    },
  });
