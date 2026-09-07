import { useRouter } from 'expo-router';

import {
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
  useFood,
} from '../../context/FoodContext';

import { useProfile } from '../../context/ProfileContext';

import {
  Recipe,
  useRecipes,
} from '../../context/RecipeContext';

const mealSections: MealType[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

function roundNutrition(
  value: number
) {
  return (
    Math.round(value * 10) /
    10
  );
}

export default function FoodScreen() {
  const router = useRouter();

  const {
    foodEntries,
    addFoodEntry,
    deleteFoodEntry,
    getMealHistory,
    copyMealFromDate,
    getDayHistory,
    copyDayFromDate,
  } = useFood();

  const {
    profile,
    loading: profileLoading,
  } = useProfile();

  const {
    recipes,
    loading: recipesLoading,
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
    Recipe | null
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

  const calorieProgress =
    calorieTarget > 0
      ? Math.min(
          (totalCalories /
            calorieTarget) *
            100,
          100
        )
      : 0;

  const previewRecipes =
    recipes.slice(0, 3);

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

  function handleAddFood() {
    router.push(
      '/food/add'
    );
  }

  function handleCreateRecipe() {
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
    recipe: Recipe
  ) {
    setSelectedRecipe(
      recipe
    );

    setRecipeServings('1');
    setRecipeLogError(null);
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
      });

    setLoggingRecipe(false);

    if (!success) {
      setRecipeLogError(
        'Apollo could not log this recipe. Please try again.'
      );

      return;
    }

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
        contentContainerStyle={
          styles.container
        }
      >
        <View
          style={styles.header}
        >
          <View
            style={
              styles.headerText
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
              Track today&apos;s
              nutrition
            </Text>
          </View>

          <Pressable
            style={({
              pressed,
            }) => [
              styles.addFoodButton,
              pressed &&
                styles.pressed,
            ]}
            onPress={
              handleAddFood
            }
          >
            <Text
              style={
                styles.addFoodButtonText
              }
            >
              + Add Food
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={({
            pressed,
          }) => [
            styles.copyDayButton,
            pressed &&
              styles.pressed,
          ]}
          onPress={
            openCopyDay
          }
        >
          <Text
            style={
              styles.copyDayButtonText
            }
          >
            Copy Previous Day
          </Text>

          <Text
            style={
              styles.copyDayButtonSubtext
            }
          >
            Duplicate all meals from
            another day
          </Text>
        </Pressable>

        <AppCard>
          <Text
            style={
              styles.cardTitle
            }
          >
            Today&apos;s Nutrition
          </Text>

          <View>
            <Text
              style={styles.label}
            >
              CALORIES
            </Text>

            <View
              style={
                styles.calorieRow
              }
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
          </View>

          <View
            style={
              styles.macroRow
            }
          >
            <View
              style={
                styles.macroItem
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                PROTEIN
              </Text>

              <Text
                style={
                  styles.macroValue
                }
              >
                {totalProtein}
              </Text>

              <Text
                style={
                  styles.macroTarget
                }
              >
                of {proteinTarget}g
              </Text>
            </View>

            <View
              style={
                styles.macroItem
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                CARBS
              </Text>

              <Text
                style={
                  styles.macroValue
                }
              >
                {totalCarbs}
              </Text>

              <Text
                style={
                  styles.macroTarget
                }
              >
                of {carbTarget}g
              </Text>
            </View>

            <View
              style={
                styles.macroItem
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                FAT
              </Text>

              <Text
                style={
                  styles.macroValue
                }
              >
                {totalFat}
              </Text>

              <Text
                style={
                  styles.macroTarget
                }
              >
                of {fatTarget}g
              </Text>
            </View>
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
          <View
            style={
              styles.recipeHeader
            }
          >
            <View
              style={
                styles.recipeHeaderText
              }
            >
              <Text
                style={
                  styles.cardTitle
                }
              >
                Recipes
              </Text>

              <Text
                style={
                  styles.secondaryText
                }
              >
                Build and reuse your
                own meals.
              </Text>
            </View>

            <View
              style={
                styles.recipeHeaderActions
              }
            >
              <Pressable
                style={({
                  pressed,
                }) => [
                  styles.viewRecipesButton,
                  pressed &&
                    styles.pressed,
                ]}
                onPress={
                  handleViewRecipes
                }
              >
                <Text
                  style={
                    styles.viewRecipesButtonText
                  }
                >
                  View All
                </Text>
              </Pressable>

              <Pressable
                style={({
                  pressed,
                }) => [
                  styles.createRecipeButton,
                  pressed &&
                    styles.pressed,
                ]}
                onPress={
                  handleCreateRecipe
                }
              >
                <Text
                  style={
                    styles.createRecipeButtonText
                  }
                >
                  + Create
                </Text>
              </Pressable>
            </View>
          </View>

          {recipesLoading ? (
            <View
              style={
                styles.recipeLoading
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
                Loading recipes...
              </Text>
            </View>
          ) : recipes.length ===
            0 ? (
            <View
              style={
                styles.emptyRecipes
              }
            >
              <Text
                style={
                  styles.emptyTitle
                }
              >
                No saved recipes
              </Text>

              <Text
                style={
                  styles.secondaryText
                }
              >
                Create a recipe and
                Apollo will calculate
                its nutrition per
                serving.
              </Text>
            </View>
          ) : (
            <>
              {previewRecipes.map(
                (recipe) => {
                  const perServing =
                    calculatePerServing(
                      recipe
                    );

                  const isDeleting =
                    deletingRecipeId ===
                    recipe.id;

                  return (
                    <View
                      key={
                        recipe.id
                      }
                      style={
                        styles.recipeCard
                      }
                    >
                      <View
                        style={
                          styles.recipeCardTop
                        }
                      >
                        <View
                          style={
                            styles.recipeInfo
                          }
                        >
                          <Text
                            style={
                              styles.recipeName
                            }
                          >
                            {
                              recipe.name
                            }
                          </Text>

                          <Text
                            style={
                              styles.recipeServingText
                            }
                          >
                            {
                              recipe.servings
                            }{' '}
                            {recipe.servings ===
                            1
                              ? 'serving'
                              : 'servings'}{' '}
                            ·{' '}
                            {
                              recipe.ingredients
                                .length
                            }{' '}
                            {recipe.ingredients
                              .length ===
                            1
                              ? 'ingredient'
                              : 'ingredients'}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.recipeCaloriesArea
                          }
                        >
                          <Text
                            style={
                              styles.recipeCalories
                            }
                          >
                            {
                              perServing.calories
                            }
                          </Text>

                          <Text
                            style={
                              styles.recipeCaloriesLabel
                            }
                          >
                            kcal / serving
                          </Text>
                        </View>
                      </View>

                      <View
                        style={
                          styles.recipeMacroRow
                        }
                      >
                        <Text
                          style={
                            styles.recipeMacroText
                          }
                        >
                          P{' '}
                          {
                            perServing.protein
                          }
                          g
                        </Text>

                        <Text
                          style={
                            styles.recipeMacroText
                          }
                        >
                          C{' '}
                          {
                            perServing.carbs
                          }
                          g
                        </Text>

                        <Text
                          style={
                            styles.recipeMacroText
                          }
                        >
                          F{' '}
                          {
                            perServing.fat
                          }
                          g
                        </Text>
                      </View>

                      {recipe.description ? (
                        <Text
                          style={
                            styles.recipeDescription
                          }
                        >
                          {
                            recipe.description
                          }
                        </Text>
                      ) : null}

                      <View
                        style={
                          styles.recipeActions
                        }
                      >
                        <Pressable
                          style={({
                            pressed,
                          }) => [
                            styles.logRecipeButton,

                            pressed &&
                              styles.pressed,
                          ]}
                          onPress={() =>
                            openLogRecipe(
                              recipe
                            )
                          }
                        >
                          <Text
                            style={
                              styles.logRecipeButtonText
                            }
                          >
                            Log Recipe
                          </Text>
                        </Pressable>

                        <Pressable
                          style={({
                            pressed,
                          }) => [
                            styles.editRecipeButton,

                            pressed &&
                              styles.pressed,
                          ]}
                          onPress={() =>
                            handleEditRecipe(
                              recipe
                            )
                          }
                        >
                          <Text
                            style={
                              styles.editRecipeButtonText
                            }
                          >
                            Edit
                          </Text>
                        </Pressable>

                        <Pressable
                          style={({
                            pressed,
                          }) => [
                            styles.deleteRecipeButton,

                            pressed &&
                              !isDeleting &&
                              styles.pressed,

                            isDeleting &&
                              styles.disabled,
                          ]}
                          onPress={() =>
                            handleDeleteRecipe(
                              recipe
                            )
                          }
                          disabled={
                            Boolean(
                              deletingRecipeId
                            )
                          }
                        >
                          <Text
                            style={
                              styles.deleteRecipeButtonText
                            }
                          >
                            {isDeleting
                              ? 'Deleting...'
                              : 'Delete'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                }
              )}

              {recipes.length > 3 ? (
                <Pressable
                  style={({
                    pressed,
                  }) => [
                    styles.moreRecipesButton,
                    pressed &&
                      styles.pressed,
                  ]}
                  onPress={
                    handleViewRecipes
                  }
                >
                  <Text
                    style={
                      styles.moreRecipesButtonText
                    }
                  >
                    View{' '}
                    {recipes.length -
                      3}{' '}
                    more{' '}
                    {recipes.length -
                      3 ===
                    1
                      ? 'recipe'
                      : 'recipes'}
                  </Text>
                </Pressable>
              ) : null}
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
                            : 'Copy'}
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
                  meal on another
                  day, it will appear
                  here.
                </Text>
              </View>
            )}

            {copyMessage && (
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
            )}

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
      paddingBottom:
        spacing.xxl,
      gap: spacing.md,
    },

    header: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom:
        spacing.sm,
    },

    headerText: {
      flex: 1,
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

    addFoodButton: {
      backgroundColor:
        colors.primary,
      paddingHorizontal:
        spacing.md,
      paddingVertical:
        spacing.sm,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    addFoodButtonText: {
      color:
        colors.background,
      fontSize:
        fontSize.body,
      fontWeight: '700',
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