import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Modal,
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
  colors,
  fontSize,
  spacing,
} from '../../constants/theme';

import {
  DayHistoryItem,
  MealHistoryDay,
  MealType,
  RecentRecipeHistoryItem,
  useFood,
} from '../../context/FoodContext';

import { useProfile } from '../../context/ProfileContext';

import {
  CuratedRecipe,
  Recipe,
  useRecipes,
} from '../../context/RecipeContext';

const mealSections: MealType[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

type LoggableRecipe =
  | Recipe
  | CuratedRecipe;

function roundNutrition(
  value: number
) {
  return (
    Math.round(value * 10) /
    10
  );
}

export default function FoodScreen() {
  const insets = useSafeAreaInsets();

  const router = useRouter();

  const [
    fabOpen,
    setFabOpen,
  ] = useState(false);

  const {
    foodEntries,
    addFoodEntry,
    deleteFoodEntry,
    getMealHistory,
    copyMealFromDate,
    getRecentRecipeHistory,
    getDayHistory,
    copyDayFromDate,
  } = useFood();

  const {
    profile,
    loading: profileLoading,
  } = useProfile();

  const {
    recipes,
    curatedRecipes,
    loading: recipesLoading,
    curatedLoading,
    deleteRecipe,
    calculatePerServing,
  } = useRecipes();

  const [
    copyMeal,
    setCopyMeal,
  ] =
    useState<MealType | null>(
      null
    );

  const [
    mealHistory,
    setMealHistory,
  ] = useState<
    MealHistoryDay[]
  >([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    copyingDate,
    setCopyingDate,
  ] = useState<
    string | null
  >(null);

  const [
    copyMessage,
    setCopyMessage,
  ] = useState<
    string | null
  >(null);

  const [
    showCopyDay,
    setShowCopyDay,
  ] = useState(false);

  const [
    dayHistory,
    setDayHistory,
  ] = useState<
    DayHistoryItem[]
  >([]);

  const [
    dayHistoryLoading,
    setDayHistoryLoading,
  ] = useState(false);

  const [
    copyingDayDate,
    setCopyingDayDate,
  ] = useState<
    string | null
  >(null);

  const [
    dayCopyMessage,
    setDayCopyMessage,
  ] = useState<
    string | null
  >(null);

  const [
    deletingRecipeId,
    setDeletingRecipeId,
  ] = useState<
    string | null
  >(null);

  const [
    selectedRecipe,
    setSelectedRecipe,
  ] = useState<
    LoggableRecipe | null
  >(null);

  const [
    recipeServings,
    setRecipeServings,
  ] = useState('1');

  const [
    recipeLogError,
    setRecipeLogError,
  ] = useState<
    string | null
  >(null);

  const [
    loggingRecipe,
    setLoggingRecipe,
  ] = useState(false);

  const [
    recentRecipeHistory,
    setRecentRecipeHistory,
  ] = useState<
    RecentRecipeHistoryItem[]
  >([]);

  const [
    recentRecipesLoading,
    setRecentRecipesLoading,
  ] = useState(true);

  const [
    weeklyLoggedDates,
    setWeeklyLoggedDates,
  ] = useState<string[]>([]);

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

  const getProgress = (
    current: number,
    target: number
  ) => {
    if (target <= 0) {
      return 0;
    }

    return Math.min(
      (current / target) * 100,
      100
    );
  };

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

  const recentRecipes =
    recentRecipeHistory
      .map((historyItem) => {
        const recipe =
          historyItem.recipeSource ===
          'apollo'
            ? curatedRecipes.find(
                (item) =>
                  item.id ===
                  historyItem.recipeId
              )
            : recipes.find(
                (item) =>
                  item.id ===
                  historyItem.recipeId
              );

        return recipe
          ? {
              recipe,
              source:
                historyItem.recipeSource,
            }
          : null;
      })
      .filter(
        (
          item
        ): item is {
          recipe: LoggableRecipe;
          source:
            | 'personal'
            | 'apollo';
        } =>
          item !== null
      )
      .slice(0, 3);

  const selectedRecipePerServing =
    selectedRecipe
      ? calculatePerServing(
          selectedRecipe
        )
      : null;

  const recipeServingMultiplier =
    Number(
      recipeServings
    );

  const validRecipeServingMultiplier =
    Number.isFinite(
      recipeServingMultiplier
    ) &&
    recipeServingMultiplier > 0;

  const scaledRecipeNutrition =
    selectedRecipePerServing &&
    validRecipeServingMultiplier
      ? {
          calories:
            roundNutrition(
              selectedRecipePerServing.calories *
                recipeServingMultiplier
            ),

          protein:
            roundNutrition(
              selectedRecipePerServing.protein *
                recipeServingMultiplier
            ),

          carbs:
            roundNutrition(
              selectedRecipePerServing.carbs *
                recipeServingMultiplier
            ),

          fat:
            roundNutrition(
              selectedRecipePerServing.fat *
                recipeServingMultiplier
            ),
        }
      : {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        };

  async function loadRecentRecipes() {
    setRecentRecipesLoading(
      true
    );

    const history =
      await getRecentRecipeHistory(
        3
      );

    setRecentRecipeHistory(
      history
    );

    setRecentRecipesLoading(
      false
    );
  }

  useEffect(() => {
    loadRecentRecipes();
  }, []);



  function handleAddFood() {
    setFabOpen(false);

    router.push(
      '/food/add'
    );
  }

  function handleCreateRecipe() {
    setFabOpen(false);

    router.push(
      '/food/recipe'
    );
  }

  function handleViewRecipes() {
    router.push(
      '/food/recipes'
    );
  }

  function handleEditRecipe(
    recipe: Recipe
  ) {
    router.push({
      pathname:
        '/food/recipe',

      params: {
        recipeId:
          recipe.id,
      },
    });
  }

  function openLogRecipe(
    recipe: LoggableRecipe
  ) {
    setSelectedRecipe(
      recipe
    );

    setRecipeServings('1');

    setRecipeLogError(
      null
    );
  }

  function closeLogRecipe() {
    if (loggingRecipe) {
      return;
    }

    setSelectedRecipe(null);

    setRecipeServings('1');

    setRecipeLogError(null);
  }

  async function handleLogRecipe(
    meal: MealType
  ) {
    if (
      !selectedRecipe ||
      loggingRecipe
    ) {
      return;
    }

    if (
      !validRecipeServingMultiplier
    ) {
      setRecipeLogError(
        'Servings eaten must be greater than 0.'
      );

      return;
    }

    setRecipeLogError(null);

    setLoggingRecipe(true);

    const success =
      await addFoodEntry({
        name:
          selectedRecipe.name,

        calories:
          scaledRecipeNutrition.calories,

        protein:
          scaledRecipeNutrition.protein,

        carbs:
          scaledRecipeNutrition.carbs,

        fat:
          scaledRecipeNutrition.fat,

        serving:
          `${recipeServingMultiplier} ${
            recipeServingMultiplier ===
            1
              ? 'recipe serving'
              : 'recipe servings'
          }`,

        meal,
        recipeId:
          selectedRecipe.id,
        recipeSource:
          'category' in
          selectedRecipe
            ? 'apollo'
            : 'personal',
      });

    setLoggingRecipe(false);

    if (!success) {
      setRecipeLogError(
        'Apollo could not log this recipe. Please try again.'
      );

      return;
    }

    await loadRecentRecipes();

    setSelectedRecipe(null);

    setRecipeServings('1');

    setRecipeLogError(null);
  }

  async function handleDeleteRecipe(
    recipe: Recipe
  ) {
    if (deletingRecipeId) {
      return;
    }

    let confirmed = true;

    if (
      typeof window !==
        'undefined' &&
      typeof window.confirm ===
        'function'
    ) {
      confirmed =
        window.confirm(
          `Delete "${recipe.name}"?`
        );
    }

    if (!confirmed) {
      return;
    }

    setDeletingRecipeId(
      recipe.id
    );

    await deleteRecipe(
      recipe.id
    );

    setDeletingRecipeId(
      null
    );
  }

  async function openCopyMeal(
    meal: MealType
  ) {
    setCopyMeal(meal);

    setMealHistory([]);

    setCopyMessage(null);

    setHistoryLoading(true);

    const history =
      await getMealHistory(
        meal
      );

    setMealHistory(
      history
    );

    setHistoryLoading(
      false
    );
  }

  function closeCopyMeal() {
    if (copyingDate) {
      return;
    }

    setCopyMeal(null);

    setMealHistory([]);

    setCopyMessage(null);
  }

  async function handleCopyMeal(
    historyDay: MealHistoryDay
  ) {
    if (
      !copyMeal ||
      copyingDate
    ) {
      return;
    }

    setCopyingDate(
      historyDay.loggedDate
    );

    setCopyMessage(null);

    const copiedCount =
      await copyMealFromDate(
        historyDay.loggedDate,
        copyMeal
      );

    setCopyingDate(null);

    if (
      copiedCount === null
    ) {
      setCopyMessage(
        'Apollo could not copy this meal. Please try again.'
      );

      return;
    }

    if (
      copiedCount === 0
    ) {
      setCopyMessage(
        'No foods were found for that meal.'
      );

      return;
    }

    setCopyMeal(null);

    setMealHistory([]);

    setCopyMessage(null);
  }

  async function openCopyDay() {
    setShowCopyDay(true);

    setDayHistory([]);

    setDayCopyMessage(null);

    setDayHistoryLoading(
      true
    );

    const history =
      await getDayHistory();

    setDayHistory(
      history
    );

    setDayHistoryLoading(
      false
    );
  }

  function closeCopyDay() {
    if (copyingDayDate) {
      return;
    }

    setShowCopyDay(false);

    setDayHistory([]);

    setDayCopyMessage(null);
  }

  async function handleCopyDay(
    historyDay: DayHistoryItem
  ) {
    if (copyingDayDate) {
      return;
    }

    setCopyingDayDate(
      historyDay.loggedDate
    );

    setDayCopyMessage(null);

    const copiedCount =
      await copyDayFromDate(
        historyDay.loggedDate
      );

    setCopyingDayDate(null);

    if (
      copiedCount === null
    ) {
      setDayCopyMessage(
        'Apollo could not copy this day. Please try again.'
      );

      return;
    }

    if (
      copiedCount === 0
    ) {
      setDayCopyMessage(
        'No foods were found for that day.'
      );

      return;
    }

    setShowCopyDay(false);

    setDayHistory([]);

    setDayCopyMessage(null);
  }

  useEffect(() => {
    let mounted = true;

    async function loadWeeklyLogging() {
      const history =
        await getDayHistory();

      if (!mounted) {
        return;
      }

      setWeeklyLoggedDates(
        history.map(
          (day) =>
            day.loggedDate
        )
      );
    }

    loadWeeklyLogging();

    return () => {
      mounted = false;
    };
  }, [
    foodEntries,
  ]);

  function getLocalDateKey(
    date: Date
  ) {
    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function getCurrentWeek() {
    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const monday =
      new Date(today);

    const dayOfWeek =
      today.getDay();

    const daysSinceMonday =
      dayOfWeek === 0
        ? 6
        : dayOfWeek - 1;

    monday.setDate(
      today.getDate() -
        daysSinceMonday
    );

    return Array.from(
      { length: 7 },
      (_, index) => {
        const date =
          new Date(monday);

        date.setDate(
          monday.getDate() +
            index
        );

        return {
          label:
            [
              'MON',
              'TUE',
              'WED',
              'THU',
              'FRI',
              'SAT',
              'SUN',
            ][index],

          dateKey:
            getLocalDateKey(
              date
            ),

          isToday:
            getLocalDateKey(
              date
            ) ===
            getLocalDateKey(
              today
            ),

          isFuture:
            date.getTime() >
            today.getTime(),
        };
      }
    );
  }

  const currentWeek =
    getCurrentWeek();

  const todayDateKey =
    getLocalDateKey(
      new Date()
    );

  const loggedDateSet =
    new Set(
      weeklyLoggedDates
    );

  if (
    foodEntries.length > 0
  ) {
    loggedDateSet.add(
      todayDateKey
    );
  }

  const loggedDaysThisWeek =
    currentWeek.filter(
      (day) =>
        loggedDateSet.has(
          day.dateKey
        )
    ).length;



  function formatHistoryDate(
    dateString: string
  ) {
    const [
      year,
      month,
      day,
    ] = dateString
      .split('-')
      .map(Number);

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    const yesterday =
      new Date();

    yesterday.setHours(
      0,
      0,
      0,
      0
    );

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    if (
      date.getFullYear() ===
        yesterday.getFullYear() &&
      date.getMonth() ===
        yesterday.getMonth() &&
      date.getDate() ===
        yesterday.getDate()
    ) {
      return 'Yesterday';
    }

    return date.toLocaleDateString(
      undefined,
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }
    );
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop:
              insets.top +
              spacing.md,

            paddingBottom:
              Math.max(
                insets.bottom,
                10
              ) + 150,
          },
        ]}
      >
        <View
          style={styles.header}
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
              styles.foodHeading
            }
          >
            <Text
              style={
                styles.screenTitle
              }
            >
              Food
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Track today&apos;s nutrition
            </Text>
          </View>
        </View>

        <View
          style={
            styles.consistencyStrip
          }
        >
          <View
            style={
              styles.consistencyDays
            }
          >
            {currentWeek.map(
              (day) => {
                const logged =
                  loggedDateSet.has(
                    day.dateKey
                  );

                return (
                  <View
                    key={
                      day.dateKey
                    }
                    style={
                      styles.consistencyDay
                    }
                  >
                    <View
                      style={[
                        styles.consistencyCircle,

                        logged &&
                          styles.consistencyCircleLogged,

                        day.isToday &&
                          styles.consistencyCircleToday,

                        day.isFuture &&
                          styles.consistencyCircleFuture,
                      ]}
                    >
                      {logged ? (
                        <Ionicons
                          name="checkmark"
                          size={12}
                          color="#08110B"
                        />
                      ) : null}
                    </View>

                    <Text
                      style={[
                        styles.consistencyDayLabel,

                        day.isToday &&
                          styles.consistencyDayLabelToday,

                        day.isFuture &&
                          styles.consistencyDayLabelFuture,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </View>
                );
              }
            )}
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
              Today&apos;s Nutrition
            </Text>
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
                  styles.nutritionMacroItem
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
                    {totalProtein} / {proteinTarget} g
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
                  styles.nutritionMacroItem
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
                    {totalCarbs} / {carbTarget} g
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
                  styles.nutritionMacroItem
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
                    {totalFat} / {fatTarget} g
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
                {calorieStatusAmount.toLocaleString()} kcal{' '}
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

          {profileLoading && (
            <Text
              style={
                styles.secondaryText
              }
            >
              Loading nutrition
              targets...
            </Text>
          )}
        </AppCard>
        <AppCard>
          <View style={styles.recipeHeader}>
            <View style={styles.recipeHeaderText}>
              <Text style={styles.cardTitle}>
                Recent Recipes
              </Text>
              <Text style={styles.secondaryText}>
                Quickly log recipes you&apos;ve used before.
              </Text>
            </View>

            <View style={styles.recipeHeaderActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.viewRecipesButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleViewRecipes}
              >
                <Text style={styles.viewRecipesButtonText}>
                  View All
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.createRecipeButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleCreateRecipe}
              >
                <Text style={styles.createRecipeButtonText}>
                  + Create
                </Text>
              </Pressable>
            </View>
          </View>

          {recentRecipesLoading ||
          recipesLoading ||
          curatedLoading ? (
            <View style={styles.recipeLoading}>
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />
              <Text style={styles.secondaryText}>
                Loading recent recipes...
              </Text>
            </View>
          ) : recentRecipes.length === 0 ? (
            <View style={styles.emptyRecipes}>
              <Text style={styles.emptyTitle}>
                No recent recipes
              </Text>
              <Text style={styles.secondaryText}>
                Recipes you log will appear here for quick access.
              </Text>
            </View>
          ) : (
            <>
              {recentRecipes.map(
                ({ recipe, source }) => {
                  const perServing =
                    calculatePerServing(recipe);

                  return (
                    <View
                      key={`${source}:${recipe.id}`}
                      style={styles.recipeCard}
                    >
                      <View style={styles.recipeCardTop}>
                        <View style={styles.recipeInfo}>
                          <Text style={styles.recipeName}>
                            {recipe.name}
                          </Text>
                          <Text style={styles.recipeServingText}>
                            {source === 'apollo'
                              ? 'Apollo Recipe'
                              : 'My Recipe'}{' '}
                            · {recipe.servings}{' '}
                            {recipe.servings === 1
                              ? 'serving'
                              : 'servings'}
                          </Text>
                        </View>

                        <View style={styles.recipeCaloriesArea}>
                          <Text style={styles.recipeCalories}>
                            {perServing.calories}
                          </Text>
                          <Text style={styles.recipeCaloriesLabel}>
                            kcal / serving
                          </Text>
                        </View>
                      </View>

                      <View style={styles.recipeMacroRow}>
                        <Text style={styles.recipeMacroText}>
                          P {perServing.protein}g
                        </Text>
                        <Text style={styles.recipeMacroText}>
                          C {perServing.carbs}g
                        </Text>
                        <Text style={styles.recipeMacroText}>
                          F {perServing.fat}g
                        </Text>
                      </View>

                      <View style={styles.recipeActions}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.logRecipeButton,
                            pressed && styles.pressed,
                          ]}
                          onPress={() =>
                            openLogRecipe(recipe)
                          }
                        >
                          <Text style={styles.logRecipeButtonText}>
                            Log Again
                          </Text>
                        </Pressable>

                        <Pressable
                          style={({ pressed }) => [
                            styles.viewRecipesButton,
                            pressed && styles.pressed,
                          ]}
                          onPress={handleViewRecipes}
                        >
                          <Text style={styles.viewRecipesButtonText}>
                            Recipe Library
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                }
              )}
            </>
          )}
        </AppCard>
        {mealSections.map(
          (meal) => {
            const mealEntries =
              foodEntries.filter(
                (entry) =>
                  entry.meal ===
                  meal
              );

            const mealCalories =
              mealEntries.reduce(
                (
                  total,
                  entry
                ) =>
                  total +
                  entry.calories,
                0
              );

            return (
              <AppCard
                key={meal}
              >
                <View
                  style={
                    styles.cardHeader
                  }
                >
                  <View
                    style={
                      styles.mealTitleArea
                    }
                  >
                    <Text
                      style={
                        styles.cardTitle
                      }
                    >
                      {meal}
                    </Text>

                    {mealEntries.length >
                      0 && (
                      <Text
                        style={
                          styles.mealCalories
                        }
                      >
                        {mealCalories}{' '}
                        kcal
                      </Text>
                    )}
                  </View>

                  <Pressable
                    style={({
                      pressed,
                    }) => [
                      styles.copyMealButton,

                      pressed &&
                        styles.pressed,
                    ]}
                    onPress={() =>
                      openCopyMeal(
                        meal
                      )
                    }
                  >
                    <Text
                      style={
                        styles.copyMealButtonText
                      }
                    >
                      Copy Previous
                    </Text>
                  </Pressable>
                </View>

                {mealEntries.length ===
                0 ? (
                  <>
                    <Text
                      style={
                        styles.emptyTitle
                      }
                    >
                      No foods logged
                    </Text>

                    <Text
                      style={
                        styles.secondaryText
                      }
                    >
                      Foods assigned
                      to{' '}
                      {meal.toLowerCase()}{' '}
                      will appear here.
                    </Text>
                  </>
                ) : (
                  mealEntries.map(
                    (entry) => (
                      <View
                        key={
                          entry.id
                        }
                        style={
                          styles.foodEntry
                        }
                      >
                        <Pressable
                          style={
                            styles.foodEntryContent
                          }
                          onPress={() =>
                            router.push(
                              {
                                pathname:
                                  '/food/add',

                                params: {
                                  id: entry.id,
                                },
                              }
                            )
                          }
                        >
                          <View
                            style={
                              styles.foodEntryInfo
                            }
                          >
                            <Text
                              style={
                                styles.foodName
                              }
                            >
                              {
                                entry.name
                              }
                            </Text>

                            <Text
                              style={
                                styles.foodDetails
                              }
                            >
                              {entry.serving ||
                                'Serving not specified'}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.foodNutrition
                            }
                          >
                            <Text
                              style={
                                styles.foodCalories
                              }
                            >
                              {
                                entry.calories
                              }{' '}
                              kcal
                            </Text>

                            <Text
                              style={
                                styles.foodMacros
                              }
                            >
                              P{' '}
                              {
                                entry.protein
                              }
                              g · C{' '}
                              {
                                entry.carbs
                              }
                              g · F{' '}
                              {
                                entry.fat
                              }
                              g
                            </Text>
                          </View>
                        </Pressable>

                        <View
                          style={
                            styles.entryActions
                          }
                        >
                          <Pressable
                            onPress={() =>
                              router.push(
                                {
                                  pathname:
                                    '/food/add',

                                  params: {
                                    id: entry.id,
                                  },
                                }
                              )
                            }
                          >
                            <Text
                              style={
                                styles.editButtonText
                              }
                            >
                              Edit
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() =>
                              deleteFoodEntry(
                                entry.id
                              )
                            }
                          >
                            <Text
                              style={
                                styles.deleteButtonText
                              }
                            >
                              Delete
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )
                  )
                )}
              </AppCard>
            );
          }
        )}
      </ScrollView>

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
              styles.fabActions
            }
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create recipe"
              onPress={
                handleCreateRecipe
              }
              style={({
                pressed,
              }) => [
                styles.fabActionRow,

                pressed &&
                  styles.pressed,
              ]}
            >
              <View
                style={
                  styles.fabActionLabel
                }
              >
                <Text
                  style={
                    styles.fabActionLabelText
                  }
                >
                  Create Recipe
                </Text>
              </View>

              <View
                style={
                  styles.fabActionButton
                }
              >
                <Ionicons
                  name="restaurant-outline"
                  size={22}
                  color={
                    colors.background
                  }
                />
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add food"
              onPress={
                handleAddFood
              }
              style={({
                pressed,
              }) => [
                styles.fabActionRow,

                pressed &&
                  styles.pressed,
              ]}
            >
              <View
                style={
                  styles.fabActionLabel
                }
              >
                <Text
                  style={
                    styles.fabActionLabelText
                  }
                >
                  Add Food
                </Text>
              </View>

              <View
                style={
                  styles.fabActionButton
                }
              >
                <Ionicons
                  name="add-outline"
                  size={24}
                  color={
                    colors.background
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
              ? 'Close food actions'
              : 'Open food actions'
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
          Boolean(
            selectedRecipe
          )
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeLogRecipe
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <Text
              style={
                styles.modalEyebrow
              }
            >
              LOG RECIPE
            </Text>

            <Text
              style={
                styles.modalTitle
              }
            >
              {
                selectedRecipe?.name
              }
            </Text>

            <Text
              style={
                styles.modalSubtitle
              }
            >
              Choose how much you ate,
              then select a meal.
            </Text>

            <View
              style={
                styles.recipeLogSection
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                SERVINGS EATEN
              </Text>

              <TextInput
                style={
                  styles.recipeServingInput
                }
                value={
                  recipeServings
                }
                onChangeText={
                  setRecipeServings
                }
                keyboardType="decimal-pad"
                placeholder="1"
                placeholderTextColor={
                  colors.textSecondary
                }
              />
            </View>

            <View
              style={
                styles.recipePreview
              }
            >
              <Text
                style={
                  styles.recipePreviewLabel
                }
              >
                LOGGED NUTRITION
              </Text>

              <Text
                style={
                  styles.recipePreviewCalories
                }
              >
                {
                  scaledRecipeNutrition.calories
                }{' '}
                kcal
              </Text>

              <Text
                style={
                  styles.recipePreviewMacros
                }
              >
                P{' '}
                {
                  scaledRecipeNutrition.protein
                }
                g · C{' '}
                {
                  scaledRecipeNutrition.carbs
                }
                g · F{' '}
                {
                  scaledRecipeNutrition.fat
                }
                g
              </Text>
            </View>

            {recipeLogError ? (
              <View
                style={
                  styles.errorBox
                }
              >
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {
                    recipeLogError
                  }
                </Text>
              </View>
            ) : null}

            <Text
              style={
                styles.mealPickerLabel
              }
            >
              ADD TO
            </Text>

            <View
              style={
                styles.mealPicker
              }
            >
              {mealSections.map(
                (meal) => (
                  <Pressable
                    key={meal}
                    style={({
                      pressed,
                    }) => [
                      styles.mealChoiceButton,

                      pressed &&
                        !loggingRecipe &&
                        validRecipeServingMultiplier &&
                        styles.pressed,

                      (!validRecipeServingMultiplier ||
                        loggingRecipe) &&
                        styles.disabled,
                    ]}
                    onPress={() =>
                      handleLogRecipe(
                        meal
                      )
                    }
                    disabled={
                      !validRecipeServingMultiplier ||
                      loggingRecipe
                    }
                  >
                    <Text
                      style={
                        styles.mealChoiceButtonText
                      }
                    >
                      {loggingRecipe
                        ? 'Saving...'
                        : meal}
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            <Pressable
              style={
                styles.cancelButton
              }
              onPress={
                closeLogRecipe
              }
              disabled={
                loggingRecipe
              }
            >
              <Text
                style={
                  styles.cancelButtonText
                }
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          Boolean(copyMeal)
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeCopyMeal
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <Text
              style={
                styles.modalEyebrow
              }
            >
              COPY PREVIOUS MEAL
            </Text>

            <Text
              style={
                styles.modalTitle
              }
            >
              {copyMeal}
            </Text>

            <Text
              style={
                styles.modalSubtitle
              }
            >
              Choose a previous day
              to copy into today.
            </Text>

            {historyLoading ? (
              <View
                style={
                  styles.loadingRow
                }
              >
                <ActivityIndicator
                  size="small"
                  color={
                    colors.primary
                  }
                />

                <Text
                  style={
                    styles.secondaryText
                  }
                >
                  Loading previous
                  meals...
                </Text>
              </View>
            ) : mealHistory.length >
              0 ? (
              <ScrollView
                style={
                  styles.historyList
                }
                contentContainerStyle={
                  styles.historyListContent
                }
              >
                {mealHistory.map(
                  (
                    historyDay
                  ) => {
                    const isCopying =
                      copyingDate ===
                      historyDay.loggedDate;

                    return (
                      <Pressable
                        key={
                          historyDay.loggedDate
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.historyDay,

                          pressed &&
                            !copyingDate &&
                            styles.pressed,

                          isCopying &&
                            styles.disabled,
                        ]}
                        onPress={() =>
                          handleCopyMeal(
                            historyDay
                          )
                        }
                        disabled={
                          Boolean(
                            copyingDate
                          )
                        }
                      >
                        <View
                          style={
                            styles.historyDayTop
                          }
                        >
                          <Text
                            style={
                              styles.historyDayDate
                            }
                          >
                            {formatHistoryDate(
                              historyDay.loggedDate
                            )}
                          </Text>

                          <Text
                            style={
                              styles.historyDayCalories
                            }
                          >
                            {
                              historyDay.calories
                            }{' '}
                            kcal
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.historyDayFoods
                          }
                          numberOfLines={
                            2
                          }
                        >
                          {historyDay.entryCount}{' '}
                          {historyDay.entryCount ===
                          1
                            ? 'item'
                            : 'items'}
                        </Text>

                        <Text
                          style={
                            styles.historyDayAction
                          }
                        >
                          {isCopying
                            ? 'Copying...'
                            : `Copy ${historyDay.entryCount} ${
                                historyDay.entryCount ===
                                1
                                  ? 'item'
                                  : 'items'
                              }`}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </ScrollView>
            ) : (
              <View
                style={
                  styles.emptyHistory
                }
              >
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No previous{' '}
                  {copyMeal?.toLowerCase()}{' '}
                  meals
                </Text>

                <Text
                  style={
                    styles.secondaryText
                  }
                >
                  Once you log this
                  meal on another day,
                  it will appear here.
                </Text>
              </View>
            )}

            {copyMessage ? (
              <View
                style={
                  styles.errorBox
                }
              >
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {copyMessage}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={
                styles.cancelButton
              }
              onPress={
                closeCopyMeal
              }
              disabled={
                Boolean(
                  copyingDate
                )
              }
            >
              <Text
                style={
                  styles.cancelButtonText
                }
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCopyDay}
        transparent
        animationType="fade"
        onRequestClose={
          closeCopyDay
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <Text
              style={
                styles.modalEyebrow
              }
            >
              COPY PREVIOUS DAY
            </Text>

            <Text
              style={
                styles.modalTitle
              }
            >
              Copy an entire day
            </Text>

            <Text
              style={
                styles.modalSubtitle
              }
            >
              Breakfast, lunch,
              dinner, and snacks will
              be copied into today.
            </Text>

            {dayHistoryLoading ? (
              <View
                style={
                  styles.loadingRow
                }
              >
                <ActivityIndicator
                  size="small"
                  color={
                    colors.primary
                  }
                />

                <Text
                  style={
                    styles.secondaryText
                  }
                >
                  Loading previous
                  days...
                </Text>
              </View>
            ) : dayHistory.length >
              0 ? (
              <ScrollView
                style={
                  styles.historyList
                }
                contentContainerStyle={
                  styles.historyListContent
                }
              >
                {dayHistory.map(
                  (
                    historyDay
                  ) => {
                    const isCopying =
                      copyingDayDate ===
                      historyDay.loggedDate;

                    return (
                      <Pressable
                        key={
                          historyDay.loggedDate
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.historyDay,

                          pressed &&
                            !copyingDayDate &&
                            styles.pressed,

                          isCopying &&
                            styles.disabled,
                        ]}
                        onPress={() =>
                          handleCopyDay(
                            historyDay
                          )
                        }
                        disabled={
                          Boolean(
                            copyingDayDate
                          )
                        }
                      >
                        <View
                          style={
                            styles.historyDayInfo
                          }
                        >
                          <Text
                            style={
                              styles.historyDayTitle
                            }
                          >
                            {formatHistoryDate(
                              historyDay.loggedDate
                            )}
                          </Text>

                          <Text
                            style={
                              styles.historyDayDetails
                            }
                          >
                            {
                              historyDay.entryCount
                            }{' '}
                            {historyDay.entryCount ===
                            1
                              ? 'food'
                              : 'foods'}{' '}
                            ·{' '}
                            {
                              historyDay.mealCount
                            }{' '}
                            {historyDay.mealCount ===
                            1
                              ? 'meal'
                              : 'meals'}{' '}
                            ·{' '}
                            {
                              historyDay.calories
                            }{' '}
                            kcal
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.historyDayAction
                          }
                        >
                          {isCopying
                            ? 'Copying...'
                            : 'Copy Day'}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </ScrollView>
            ) : (
              <View
                style={
                  styles.emptyHistory
                }
              >
                <Text
                  style={
                    styles.emptyHistoryTitle
                  }
                >
                  No previous days
                </Text>

                <Text
                  style={
                    styles.secondaryText
                  }
                >
                  Log food on another
                  day and it will
                  appear here.
                </Text>
              </View>
            )}

            {dayCopyMessage && (
              <View
                style={
                  styles.errorBox
                }
              >
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {dayCopyMessage}
                </Text>
              </View>
            )}

            <Pressable
              style={
                styles.cancelButton
              }
              onPress={
                closeCopyDay
              }
              disabled={
                Boolean(
                  copyingDayDate
                )
              }
            >
              <Text
                style={
                  styles.cancelButtonText
                }
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
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

      paddingBottom: 180,

      gap: spacing.md,
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

    foodHeading: {
      marginTop: 14,
      marginBottom: 8,
    },

    screenTitle: {
      color: colors.text,
      fontSize: 34,
      lineHeight: 37,
      fontWeight: '800',
      letterSpacing: -1.25,
    },

    subtitle: {
      color:
        colors.textSecondary,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '600',
      marginTop: 4,
    },

    fabContainer: {
      position: 'absolute',

      right: spacing.lg,

      alignItems: 'flex-end',

      gap: spacing.sm,
    },

    fabActions: {
      alignItems: 'flex-end',

      gap: spacing.sm,
    },

    fabActionRow: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'flex-end',

      gap: spacing.sm,
    },

    fabActionLabel: {
      backgroundColor:
        colors.surface,

      borderColor:
        colors.border,

      borderWidth: 1,

      borderRadius: 10,

      paddingHorizontal:
        spacing.md,

      paddingVertical:
        spacing.sm,

      shadowColor: '#000000',

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.25,

      shadowRadius: 6,

      elevation: 8,
    },

    fabActionLabelText: {
      color: colors.text,

      fontSize:
        fontSize.small,

      fontWeight: '700',
    },

    fabActionButton: {
      width: 46,

      height: 46,

      borderRadius: 23,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        colors.primary,

      shadowColor: '#000000',

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.28,

      shadowRadius: 7,

      elevation: 9,
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

      shadowColor: '#000000',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.32,

      shadowRadius: 10,

      elevation: 12,
    },

    fabButtonPressed: {
      opacity: 0.82,

      transform: [
        {
          scale: 0.96,
        },
      ],
    },

    copyDayButton: {
      backgroundColor:
        colors.surface,

      borderColor:
        colors.primary,

      borderWidth: 1,

      borderRadius: 12,

      padding: spacing.md,

      gap: spacing.xs,
    },

    copyDayButtonText: {
      color: colors.primary,

      fontSize:
        fontSize.body,

      fontWeight: '700',
    },

    copyDayButtonSubtext: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,
    },

    cardTitle: {
      color: colors.text,

      fontSize:
        fontSize.title,

      fontWeight: '600',
    },

    recipeHeader: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems: 'center',

      gap: spacing.md,
    },

    recipeHeaderText: {
      flex: 1,

      gap: spacing.xs,
    },

    recipeHeaderActions: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: spacing.sm,
    },

    viewRecipesButton: {
      borderColor:
        colors.primary,

      borderWidth: 1,

      paddingHorizontal:
        spacing.sm,

      paddingVertical:
        spacing.sm,

      borderRadius: 10,
    },

    viewRecipesButtonText: {
      color:
        colors.primary,

      fontSize:
        fontSize.small,

      fontWeight: '700',
    },

    createRecipeButton: {
      backgroundColor:
        colors.primary,

      paddingHorizontal:
        spacing.md,

      paddingVertical:
        spacing.sm,

      borderRadius: 10,
    },

    createRecipeButtonText: {
      color:
        colors.background,

      fontSize:
        fontSize.small,

      fontWeight: '800',
    },

    recipeLoading: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: spacing.sm,

      paddingVertical:
        spacing.md,
    },

    emptyRecipes: {
      borderTopColor:
        colors.border,

      borderTopWidth: 1,

      paddingTop:
        spacing.md,

      gap: spacing.xs,
    },

    recipeCard: {
      borderTopColor:
        colors.border,

      borderTopWidth: 1,

      paddingTop:
        spacing.md,

      marginTop:
        spacing.sm,

      gap: spacing.sm,
    },

    recipeCardTop: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems:
        'flex-start',

      gap: spacing.md,
    },

    recipeInfo: {
      flex: 1,
    },

    recipeName: {
      color: colors.text,

      fontSize:
        fontSize.subtitle,

      fontWeight: '700',
    },

    recipeServingText: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,

      marginTop:
        spacing.xs,
    },

    recipeCaloriesArea: {
      alignItems: 'flex-end',
    },

    recipeCalories: {
      color: colors.text,

      fontSize:
        fontSize.title,

      fontWeight: '700',
    },

    recipeCaloriesLabel: {
      color:
        colors.textSecondary,

      fontSize: 11,

      marginTop: 2,
    },

    recipeMacroRow: {
      flexDirection: 'row',

      gap: spacing.md,
    },

    recipeMacroText: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,

      fontWeight: '600',
    },

    recipeDescription: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,

      lineHeight: 18,
    },

    recipeActions: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: spacing.sm,

      marginTop:
        spacing.xs,
    },

    logRecipeButton: {
      flex: 1,

      backgroundColor:
        colors.primary,

      borderRadius: 9,

      paddingVertical:
        spacing.sm,

      paddingHorizontal:
        spacing.md,

      alignItems: 'center',
    },

    logRecipeButtonText: {
      color:
        colors.background,

      fontSize:
        fontSize.small,

      fontWeight: '800',
    },

    editRecipeButton: {
      borderColor:
        colors.primary,

      borderWidth: 1,

      borderRadius: 9,

      paddingVertical:
        spacing.sm,

      paddingHorizontal:
        spacing.md,
    },

    editRecipeButtonText: {
      color:
        colors.primary,

      fontSize:
        fontSize.small,

      fontWeight: '700',
    },

    deleteRecipeButton: {
      borderColor:
        colors.danger,

      borderWidth: 1,

      borderRadius: 9,

      paddingVertical:
        spacing.sm,

      paddingHorizontal:
        spacing.md,
    },

    deleteRecipeButtonText: {
      color: colors.danger,

      fontSize:
        fontSize.small,

      fontWeight: '700',
    },

    moreRecipesButton: {
      borderTopColor:
        colors.border,

      borderTopWidth: 1,

      marginTop:
        spacing.md,

      paddingTop:
        spacing.md,

      alignItems: 'center',
    },

    moreRecipesButtonText: {
      color:
        colors.primary,

      fontSize:
        fontSize.small,

      fontWeight: '700',
    },

    apolloHeader: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems: 'center',

      gap: spacing.md,
    },

    apolloHeaderText: {
      flex: 1,

      gap: spacing.xs,
    },

    apolloTitleRow: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: spacing.sm,
    },

    apolloIcon: {
      width: 28,

      height: 28,

      borderRadius: 14,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        colors.surfaceSecondary,

      borderColor:
        colors.primary,

      borderWidth: 1,
    },

    apolloIconText: {
      color:
        colors.primary,

      fontSize: 16,

      fontWeight: '800',
    },

    viewApolloButton: {
      borderColor:
        colors.primary,

      borderWidth: 1,

      paddingHorizontal:
        spacing.sm,

      paddingVertical:
        spacing.sm,

      borderRadius: 10,
    },

    viewApolloButtonText: {
      color:
        colors.primary,

      fontSize:
        fontSize.small,

      fontWeight: '700',
    },

    apolloRecipeCard: {
      borderTopColor:
        colors.border,

      borderTopWidth: 1,

      paddingTop:
        spacing.md,

      marginTop:
        spacing.sm,

      gap: spacing.sm,
    },

    apolloBadgeRow: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      alignItems: 'center',

      gap: spacing.xs,
    },

    apolloBadge: {
      borderColor:
        colors.primary,

      borderWidth: 1,

      borderRadius: 6,

      paddingHorizontal: 7,
            paddingVertical: 3,

      backgroundColor:
        'rgba(74, 222, 128, 0.10)',
    },

    apolloBadgeText: {
      color:
        colors.primary,

      fontSize: 9,

      fontWeight: '800',

      letterSpacing: 0.8,
    },

    apolloCategoryBadge: {
      borderColor:
        colors.border,

      borderWidth: 1,

      borderRadius: 6,

      paddingHorizontal: 7,

      paddingVertical: 3,

      backgroundColor:
        colors.surfaceSecondary,
    },

    apolloCategoryText: {
      color:
        colors.textSecondary,

      fontSize: 9,

      fontWeight: '700',

      textTransform:
        'uppercase',
    },

    featuredBadge: {
      borderColor:
        colors.border,

      borderWidth: 1,

      borderRadius: 6,

      paddingHorizontal: 7,

      paddingVertical: 3,

      backgroundColor:
        colors.surfaceSecondary,
    },

    featuredBadgeText: {
      color:
        colors.primary,

      fontSize: 9,

      fontWeight: '800',
    },

    apolloLogButton: {
      backgroundColor:
        colors.primary,

      borderRadius: 9,

      paddingVertical:
        spacing.sm,

      paddingHorizontal:
        spacing.md,

      alignItems: 'center',

      marginTop:
        spacing.xs,
    },

    apolloLogButtonText: {
      color:
        colors.background,

      fontSize:
        fontSize.small,

      fontWeight: '800',
    },

    browseApolloButton: {
      borderTopColor:
        colors.border,

      borderTopWidth: 1,

      marginTop:
        spacing.md,

      paddingTop:
        spacing.md,

      paddingBottom:
        spacing.xs,

      alignItems: 'center',
    },

    browseApolloButtonText: {
      color:
        colors.primary,

      fontSize:
        fontSize.small,

      fontWeight: '700',
    },

    recipeLogSection: {
      gap: spacing.xs,
    },

    recipeServingInput: {
      minHeight: 48,

      backgroundColor:
        colors.surfaceSecondary,

      borderColor:
        colors.border,

      borderWidth: 1,

      borderRadius: 10,

      paddingHorizontal:
        spacing.md,

      color: colors.text,

      fontSize:
        fontSize.body,
    },

    recipePreview: {
      backgroundColor:
        colors.surfaceSecondary,

      borderColor:
        colors.border,

      borderWidth: 1,

      borderRadius: 12,

      padding: spacing.md,

      gap: spacing.xs,
    },

    recipePreviewLabel: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,

      fontWeight: '700',

      letterSpacing: 1,
    },

    recipePreviewCalories: {
      color: colors.text,

      fontSize:
        fontSize.title,

      fontWeight: '700',
    },

    recipePreviewMacros: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,
    },

    mealPickerLabel: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,

      fontWeight: '700',

      letterSpacing: 1,
    },

    mealPicker: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: spacing.sm,
    },

    mealChoiceButton: {
      width: '48%',

      minHeight: 46,

      backgroundColor:
        colors.primary,

      borderRadius: 10,

      alignItems: 'center',

      justifyContent:
        'center',

      paddingHorizontal:
        spacing.sm,
    },

    mealChoiceButtonText: {
      color:
        colors.background,

      fontSize:
        fontSize.small,

      fontWeight: '800',
    },

    cardHeader: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems: 'center',

      gap: spacing.md,
    },

    mealTitleArea: {
      flex: 1,

      gap: spacing.xs,
    },

    mealCalories: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,

      fontWeight: '600',
    },

    copyMealButton: {
      borderColor:
        colors.primary,

      borderWidth: 1,

      borderRadius: 10,

      paddingHorizontal:
        spacing.sm,

      paddingVertical:
        spacing.xs,
    },

    copyMealButtonText: {
      color: colors.primary,

      fontSize:
        fontSize.small,

      fontWeight: '700',
    },

    cardHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      gap: spacing.md,
    },

    nutritionDashboard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingTop: 0,
    },

    consistencyStrip: {
      paddingHorizontal: 4,
      marginBottom: 2,
    },

    consistencyDays: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent:
        'space-between',
    },

    consistencyDay: {
      flex: 1,
      alignItems: 'center',
      gap: 5,
    },

    consistencyCircle: {
      width: 27,
      height: 27,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        'transparent',
    },

    consistencyCircleLogged: {
      backgroundColor:
        colors.primary,
      borderColor:
        colors.primary,
    },

    consistencyCircleToday: {
      borderWidth: 2,
      borderColor:
        colors.primary,
    },

    consistencyCircleFuture: {
      opacity: 0.3,
    },

    consistencyDayLabel: {
      color:
        colors.textSecondary,
      fontSize: 8,
      fontWeight: '700',
      letterSpacing: 0.35,
    },

    consistencyDayLabelToday: {
      color: colors.primary,
      fontWeight: '900',
    },

    consistencyDayLabelFuture: {
      opacity: 0.4,
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

    nutritionMacroItem: {
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

    label: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,

      fontWeight: '600',

      letterSpacing: 1,
    },

    calorieRow: {
      flexDirection: 'row',

      alignItems: 'baseline',

      marginTop:
        spacing.xs,
    },

    calorieValue: {
      color: colors.text,

      fontSize: 36,

      fontWeight: '700',
    },

    calorieTarget: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.body,
    },

    progressTrack: {
      height: 8,

      backgroundColor:
        colors.surfaceSecondary,

      borderRadius: 100,

      marginTop:
        spacing.sm,

      overflow: 'hidden',
    },

    progressFill: {
      height: '100%',

      backgroundColor:
        colors.primary,
    },

    macroRow: {
      flexDirection: 'row',

      gap: spacing.md,
    },

    macroItem: {
      flex: 1,
    },

    macroValue: {
      color: colors.text,

      fontSize:
        fontSize.title,

      fontWeight: '700',

      marginTop:
        spacing.xs,
    },

    macroTarget: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,
    },

    emptyTitle: {
      color: colors.text,

      fontSize:
        fontSize.subtitle,

      fontWeight: '600',
    },

    secondaryText: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.body,
    },

    foodEntry: {
      borderTopColor:
        colors.border,

      borderTopWidth: 1,

      paddingVertical:
        spacing.md,

      gap: spacing.sm,
    },

    foodEntryContent: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems: 'center',

      gap: spacing.md,
    },

    foodEntryInfo: {
      flex: 1,
    },

    foodName: {
      color: colors.text,

      fontSize:
        fontSize.body,

      fontWeight: '600',
    },

    foodDetails: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,

      marginTop:
        spacing.xs,
    },

    foodNutrition: {
      alignItems: 'flex-end',
    },

    foodCalories: {
      color: colors.text,

      fontSize:
        fontSize.body,

      fontWeight: '600',
    },

    foodMacros: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,

      marginTop:
        spacing.xs,
    },

    entryActions: {
      flexDirection: 'row',

      gap: spacing.md,
    },

    editButtonText: {
      color: colors.primary,

      fontSize:
        fontSize.small,

      fontWeight: '600',
    },

    deleteButtonText: {
      color: colors.danger,

      fontSize:
        fontSize.small,

      fontWeight: '600',
    },

    pressed: {
      opacity: 0.75,
    },

    disabled: {
      opacity: 0.5,
    },

    modalBackdrop: {
      flex: 1,

      backgroundColor:
        'rgba(0, 0, 0, 0.75)',

      justifyContent:
        'center',

      alignItems: 'center',

      padding: spacing.lg,
    },

    modalCard: {
      width: '100%',

      maxWidth: 440,

      maxHeight: '80%',

      backgroundColor:
        colors.surface,

      borderColor:
        colors.border,

      borderWidth: 1,

      borderRadius: 16,

      padding: spacing.lg,

      gap: spacing.md,
    },

    modalEyebrow: {
      color: colors.primary,

      fontSize:
        fontSize.small,

      fontWeight: '700',

      letterSpacing: 1,
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
    },

    loadingRow: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: spacing.sm,

      paddingVertical:
        spacing.md,
    },

    historyList: {
      maxHeight: 360,
    },

    historyListContent: {
      gap: spacing.sm,
    },

    historyDay: {
      backgroundColor:
        colors.surfaceSecondary,

      borderColor:
        colors.border,

      borderWidth: 1,

      borderRadius: 12,

      padding: spacing.md,

      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems: 'center',

      gap: spacing.md,
    },

    historyDayInfo: {
      flex: 1,

      gap: spacing.xs,
    },

    historyDayTitle: {
      color: colors.text,

      fontSize:
        fontSize.body,

      fontWeight: '600',
    },

    historyDayDetails: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,
    },

    historyDayTop: {
      width: '100%',

      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems: 'center',

      gap: spacing.sm,
    },

    historyDayDate: {
      color: colors.text,

      fontSize:
        fontSize.body,

      fontWeight: '600',
    },

    historyDayCalories: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,

      fontWeight: '600',
    },

    historyDayFoods: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,

      lineHeight: 18,
    },

    historyDayAction: {
      color: colors.primary,

      fontSize:
        fontSize.body,

      fontWeight: '700',
    },

    emptyHistory: {
      paddingVertical:
        spacing.lg,

      gap: spacing.sm,

      alignItems: 'center',
    },

    emptyHistoryTitle: {
      color: colors.text,

      fontSize:
        fontSize.subtitle,

      fontWeight: '600',

      textAlign: 'center',
    },

    errorBox: {
      backgroundColor:
        colors.surfaceSecondary,

      borderColor:
        colors.danger,

      borderWidth: 1,

      borderRadius: 12,

      padding: spacing.md,
    },

    errorText: {
      color: colors.danger,

      fontSize:
        fontSize.body,

      fontWeight: '600',
    },

    cancelButton: {
      alignItems: 'center',

      paddingVertical:
        spacing.sm,
    },

    cancelButtonText: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.body,

      fontWeight: '600',
    },
  });