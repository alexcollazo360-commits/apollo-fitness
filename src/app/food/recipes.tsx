import Ionicons from '@expo/vector-icons/Ionicons';

import {
    Stack,
    useRouter,
} from 'expo-router';

import {
    useMemo,
    useState,
} from 'react';

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

import { colors } from '../../constants/theme';

import {
    MealType,
    useFood,
} from '../../context/FoodContext';

import {
    CuratedRecipe,
    Recipe,
    useRecipes,
} from '../../context/RecipeContext';

const meals: MealType[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

type LibraryRecipe =
  | Recipe
  | CuratedRecipe;

type SelectedRecipe = {
  recipe: LibraryRecipe;
  source: 'personal' | 'curated';
};

function numberValue(
  value: string
) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed)
  ) {
    return 0;
  }

  return parsed;
}

function formatNutrition(
  value: number
) {
  return (
    Math.round(
      value * 10
    ) / 10
  );
}

function matchesSearch(
  recipe: LibraryRecipe,
  search: string
) {
  const normalizedSearch =
    search
      .trim()
      .toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const name =
    recipe.name
      .toLowerCase();

  const description =
    recipe.description
      .toLowerCase();

  const ingredients =
    recipe.ingredients
      .map(
        (ingredient) =>
          ingredient.ingredientName.toLowerCase()
      )
      .join(' ');

  const category =
    'category' in recipe
      ? recipe.category.toLowerCase()
      : '';

  return (
    name.includes(
      normalizedSearch
    ) ||
    description.includes(
      normalizedSearch
    ) ||
    ingredients.includes(
      normalizedSearch
    ) ||
    category.includes(
      normalizedSearch
    )
  );
}

export default function RecipesScreen() {
  const router =
    useRouter();

  const {
    addFoodEntry,
  } = useFood();

  const {
    recipes,
    curatedRecipes,
    loading,
    curatedLoading,
    deleteRecipe,
    saveCuratedRecipeToMyRecipes,
    calculatePerServing,
  } = useRecipes();

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    selected,
    setSelected,
  ] = useState<
    SelectedRecipe | null
  >(null);

  const [
    showLogModal,
    setShowLogModal,
  ] = useState(false);

  const [
    logServings,
    setLogServings,
  ] = useState('1');

  const [
    logging,
    setLogging,
  ] = useState(false);

  const [
    logError,
    setLogError,
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
    savingCuratedRecipeId,
    setSavingCuratedRecipeId,
  ] = useState<
    string | null
  >(null);

  const [
    savedCuratedRecipeId,
    setSavedCuratedRecipeId,
  ] = useState<
    string | null
  >(null);

  const [
    saveError,
    setSaveError,
  ] = useState<
    string | null
  >(null);

  const filteredRecipes =
    useMemo(
      () =>
        recipes.filter(
          (recipe) =>
            matchesSearch(
              recipe,
              search
            )
        ),
      [
        recipes,
        search,
      ]
    );

  const filteredCuratedRecipes =
    useMemo(
      () =>
        curatedRecipes.filter(
          (recipe) =>
            matchesSearch(
              recipe,
              search
            )
        ),
      [
        curatedRecipes,
        search,
      ]
    );

  const totalResults =
    filteredRecipes.length +
    filteredCuratedRecipes.length;

  const selectedRecipe =
    selected?.recipe ??
    null;

  const selectedSource =
    selected?.source ??
    null;

  function openRecipe(
    recipe: LibraryRecipe,
    source:
      | 'personal'
      | 'curated'
  ) {
    setSaveError(null);

    setSavedCuratedRecipeId(
      null
    );

    setSelected({
      recipe,
      source,
    });
  }

  function closeRecipe() {
    setSelected(null);

    setShowLogModal(
      false
    );

    setLogServings(
      '1'
    );

    setLogError(
      null
    );

    setSaveError(
      null
    );

    setSavedCuratedRecipeId(
      null
    );
  }

  function handleEditRecipe(
    recipe: Recipe
  ) {
    setSelected(null);

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
    recipe: LibraryRecipe,
    source:
      | 'personal'
      | 'curated'
  ) {
    setSelected({
      recipe,
      source,
    });

    setLogServings(
      '1'
    );

    setLogError(
      null
    );

    setShowLogModal(
      true
    );
  }

  function closeLogModal() {
    setShowLogModal(
      false
    );

    setLogServings(
      '1'
    );

    setLogError(
      null
    );
  }

  async function handleLogRecipe(
    meal: MealType
  ) {
    if (
      !selectedRecipe
    ) {
      return;
    }

    const servingCount =
      numberValue(
        logServings
      );

    if (
      servingCount <= 0
    ) {
      setLogError(
        'Servings must be greater than 0.'
      );

      return;
    }

    const perServing =
      calculatePerServing(
        selectedRecipe
      );

    setLogging(true);

    const success =
      await addFoodEntry({
        name:
          selectedRecipe.name,

        calories:
          formatNutrition(
            perServing.calories *
              servingCount
          ),

        protein:
          formatNutrition(
            perServing.protein *
              servingCount
          ),

        carbs:
          formatNutrition(
            perServing.carbs *
              servingCount
          ),

        fat:
          formatNutrition(
            perServing.fat *
              servingCount
          ),

        serving:
          `${servingCount} ${
            servingCount === 1
              ? 'serving'
              : 'servings'
          }`,

        meal,
      });

    setLogging(false);

    if (!success) {
      setLogError(
        'Apollo could not log this recipe. Please try again.'
      );

      return;
    }

    closeRecipe();

    router.replace(
      '/(tabs)/food'
    );
  }

  async function handleSaveCuratedRecipe(
    recipe: CuratedRecipe
  ) {
    if (
      savingCuratedRecipeId
    ) {
      return;
    }

    setSaveError(null);

    setSavedCuratedRecipeId(
      null
    );

    setSavingCuratedRecipeId(
      recipe.id
    );

    const newRecipeId =
      await saveCuratedRecipeToMyRecipes(
        recipe.id
      );

    setSavingCuratedRecipeId(
      null
    );

    if (!newRecipeId) {
      setSaveError(
        'Apollo could not save this recipe. Please try again.'
      );

      return;
    }

    setSavedCuratedRecipeId(
      recipe.id
    );
  }

  async function performDelete(
    recipe: Recipe
  ) {
    setDeletingRecipeId(
      recipe.id
    );

    const success =
      await deleteRecipe(
        recipe.id
      );

    setDeletingRecipeId(
      null
    );

    if (!success) {
      if (
        Platform.OS ===
        'web'
      ) {
        window.alert(
          'Apollo could not delete this recipe.'
        );
      } else {
        Alert.alert(
          'Unable to Delete',
          'Apollo could not delete this recipe.'
        );
      }

      return;
    }

    if (
      selectedRecipe?.id ===
        recipe.id &&
      selectedSource ===
        'personal'
    ) {
      closeRecipe();
    }
  }

  function handleDeleteRecipe(
    recipe: Recipe
  ) {
    if (
      deletingRecipeId
    ) {
      return;
    }

    if (
      Platform.OS ===
      'web'
    ) {
      const confirmed =
        window.confirm(
          `Delete "${recipe.name}"? This cannot be undone.`
        );

      if (confirmed) {
        performDelete(
          recipe
        );
      }

      return;
    }

    Alert.alert(
      'Delete Recipe',
      `Delete "${recipe.name}"? This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style:
            'destructive',
          onPress: () =>
            performDelete(
              recipe
            ),
        },
      ]
    );
  }

  function renderRecipeCard(
    recipe: LibraryRecipe,
    source:
      | 'personal'
      | 'curated'
  ) {
    const perServing =
      calculatePerServing(
        recipe
      );

    const curated =
      source === 'curated'
        ? (recipe as CuratedRecipe)
        : null;

    return (
      <Pressable
        key={`${source}-${recipe.id}`}
        style={({
          pressed,
        }) => [
          styles.recipeCard,
          pressed &&
            styles.pressed,
        ]}
        onPress={() =>
          openRecipe(
            recipe,
            source
          )
        }
      >
        <View
          style={
            styles.recipeCardTop
          }
        >
          <View
            style={
              styles.recipeCardMain
            }
          >
            {curated ? (
              <View
                style={
                  styles.badgeRow
                }
              >
                <View
                  style={
                    styles.apolloBadge
                  }
                >
                  <Text
                    style={
                      styles.apolloBadgeText
                    }
                  >
                    APOLLO
                  </Text>
                </View>

                {curated.category ? (
                  <View
                    style={
                      styles.categoryBadge
                    }
                  >
                    <Text
                      style={
                        styles.categoryBadgeText
                      }
                    >
                      {
                        curated.category
                      }
                    </Text>
                  </View>
                ) : null}

                {curated.isFeatured ? (
                  <View
                    style={
                      styles.featuredBadge
                    }
                  >
                    <Ionicons
                      name="star"
                      size={11}
                      color={
                        colors.primary
                      }
                    />

                    <Text
                      style={
                        styles.featuredBadgeText
                      }
                    >
                      FEATURED
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <Text
              style={
                styles.recipeName
              }
              numberOfLines={
                1
              }
            >
              {recipe.name}
            </Text>

            {recipe.description ? (
              <Text
                style={
                  styles.recipeDescription
                }
                numberOfLines={
                  2
                }
              >
                {
                  recipe.description
                }
              </Text>
            ) : null}

            <Text
              style={
                styles.recipeMeta
              }
            >
              {recipe.servings}{' '}
              serving
              {recipe.servings ===
              1
                ? ''
                : 's'}{' '}
              ·{' '}
              {
                recipe
                  .ingredients
                  .length
              }{' '}
              ingredient
              {recipe.ingredients
                .length ===
              1
                ? ''
                : 's'}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              colors.textSecondary
            }
          />
        </View>

        <View
          style={
            styles.nutritionRow
          }
        >
          <View
            style={
              styles.calorieBlock
            }
          >
            <Text
              style={
                styles.calorieValue
              }
            >
              {
                perServing.calories
              }
            </Text>

            <Text
              style={
                styles.calorieLabel
              }
            >
              CAL
            </Text>
          </View>

          <View
            style={
              styles.macroBlock
            }
          >
            <Text
              style={
                styles.macroValue
              }
            >
              {
                perServing.protein
              }
              g
            </Text>

            <Text
              style={
                styles.macroLabel
              }
            >
              PROTEIN
            </Text>
          </View>

          <View
            style={
              styles.macroBlock
            }
          >
            <Text
              style={
                styles.macroValue
              }
            >
              {
                perServing.carbs
              }
              g
            </Text>

            <Text
              style={
                styles.macroLabel
              }
            >
              CARBS
            </Text>
          </View>

          <View
            style={
              styles.macroBlock
            }
          >
            <Text
              style={
                styles.macroValue
              }
            >
              {
                perServing.fat
              }
              g
            </Text>

            <Text
              style={
                styles.macroLabel
              }
            >
              FAT
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.perServingLabel
          }
        >
          Nutrition per serving
        </Text>
      </Pressable>
    );
  }

  if (
    loading ||
    curatedLoading
  ) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <ActivityIndicator
          size="large"
          color={
            colors.primary
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading recipe library...
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View
        style={
          styles.screen
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            style={
              styles.backButton
            }
            onPress={() =>
              router.replace(
                '/(tabs)/food'
              )
            }
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={
                colors.text
              }
            />

            <Text
              style={
                styles.backText
              }
            >
              Food
            </Text>
          </Pressable>

          <View
            style={
              styles.titleRow
            }
          >
            <View
              style={
                styles.titleBlock
              }
            >
              <Text
                style={
                  styles.title
                }
              >
                Recipe Library
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Your recipes and
                high-protein recipes
                from Apollo.
              </Text>
            </View>

            <Pressable
              style={
                styles.createButton
              }
              onPress={() =>
                router.push(
                  '/food/recipe'
                )
              }
            >
              <Ionicons
                name="add"
                size={20}
                color="#08110B"
              />

              <Text
                style={
                  styles.createButtonText
                }
              >
                New
              </Text>
            </Pressable>
          </View>

          <View
            style={
              styles.searchContainer
            }
          >
            <Ionicons
              name="search"
              size={20}
              color={
                colors.textSecondary
              }
            />

            <TextInput
              style={
                styles.searchInput
              }
              value={search}
              onChangeText={
                setSearch
              }
              placeholder="Search recipes, ingredients, or categories..."
              placeholderTextColor={
                colors.textSecondary
              }
            />

            {search ? (
              <Pressable
                onPress={() =>
                  setSearch('')
                }
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={
                    colors.textSecondary
                  }
                />
              </Pressable>
            ) : null}
          </View>

          {search.trim() ? (
            <>
              <View
                style={
                  styles.libraryHeader
                }
              >
                <Text
                  style={
                    styles.libraryLabel
                  }
                >
                  SEARCH RESULTS
                </Text>

                <Text
                  style={
                    styles.recipeCount
                  }
                >
                  {totalResults}{' '}
                  recipe
                  {totalResults ===
                  1
                    ? ''
                    : 's'}
                </Text>
              </View>

              {totalResults ===
              0 ? (
                <View
                  style={
                    styles.emptyState
                  }
                >
                  <Ionicons
                    name="search-outline"
                    size={42}
                    color={
                      colors.textSecondary
                    }
                  />

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    No recipes found
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Try a different
                    recipe name,
                    ingredient, or
                    category.
                  </Text>
                </View>
              ) : (
                <View
                  style={
                    styles.recipeList
                  }
                >
                  {filteredRecipes.map(
                    (recipe) =>
                      renderRecipeCard(
                        recipe,
                        'personal'
                      )
                  )}

                  {filteredCuratedRecipes.map(
                    (recipe) =>
                      renderRecipeCard(
                        recipe,
                        'curated'
                      )
                  )}
                </View>
              )}
            </>
          ) : (
            <>
              <View
                style={
                  styles.section
                }
              >
                <View
                  style={
                    styles.libraryHeader
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.libraryLabel
                      }
                    >
                      MY RECIPES
                    </Text>

                    <Text
                      style={
                        styles.sectionSubtitle
                      }
                    >
                      Recipes you
                      created or saved
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.recipeCount
                    }
                  >
                    {
                      recipes.length
                    }
                  </Text>
                </View>

                {recipes.length ===
                0 ? (
                  <View
                    style={
                      styles.compactEmptyState
                    }
                  >
                    <Text
                      style={
                        styles.emptyTitle
                      }
                    >
                      No personal
                      recipes yet
                    </Text>

                    <Text
                      style={
                        styles.emptyText
                      }
                    >
                      Create your own
                      recipe or save an
                      Apollo recipe.
                    </Text>

                    <Pressable
                      style={
                        styles.emptyButton
                      }
                      onPress={() =>
                        router.push(
                          '/food/recipe'
                        )
                      }
                    >
                      <Text
                        style={
                          styles.emptyButtonText
                        }
                      >
                        CREATE RECIPE
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View
                    style={
                      styles.recipeList
                    }
                  >
                    {recipes.map(
                      (recipe) =>
                        renderRecipeCard(
                          recipe,
                          'personal'
                        )
                    )}
                  </View>
                )}
              </View>

              <View
                style={
                  styles.section
                }
              >
                <View
                  style={
                    styles.libraryHeader
                  }
                >
                  <View>
                    <View
                      style={
                        styles.apolloSectionTitle
                      }
                    >
                      <Ionicons
                        name="sparkles"
                        size={15}
                        color={
                          colors.primary
                        }
                      />

                      <Text
                        style={
                          styles.libraryLabel
                        }
                      >
                        APOLLO RECIPES
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.sectionSubtitle
                      }
                    >
                      Built-in recipes
                      ready to log or
                      save
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.recipeCount
                    }
                  >
                    {
                      curatedRecipes.length
                    }
                  </Text>
                </View>

                {curatedRecipes.length ===
                0 ? (
                  <View
                    style={
                      styles.compactEmptyState
                    }
                  >
                    <Text
                      style={
                        styles.emptyTitle
                      }
                    >
                      No Apollo recipes
                    </Text>

                    <Text
                      style={
                        styles.emptyText
                      }
                    >
                      Built-in recipes
                      will appear here
                      when available.
                    </Text>
                  </View>
                ) : (
                  <View
                    style={
                      styles.recipeList
                    }
                  >
                    {curatedRecipes.map(
                      (recipe) =>
                        renderRecipeCard(
                          recipe,
                          'curated'
                        )
                    )}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={
          Boolean(
            selectedRecipe
          ) &&
          !showLogModal
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeRecipe
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
            {selectedRecipe ? (
              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
              >
                <View
                  style={
                    styles.modalHeader
                  }
                >
                  <View
                    style={
                      styles.modalHeaderText
                    }
                  >
                    {selectedSource ===
                    'curated' ? (
                      <View
                        style={
                          styles.modalBadgeRow
                        }
                      >
                        <View
                          style={
                            styles.apolloBadge
                          }
                        >
                          <Text
                            style={
                              styles.apolloBadgeText
                            }
                          >
                            APOLLO
                          </Text>
                        </View>

                        {'category' in
                          selectedRecipe &&
                        selectedRecipe.category ? (
                          <View
                            style={
                              styles.categoryBadge
                            }
                          >
                            <Text
                              style={
                                styles.categoryBadgeText
                              }
                            >
                              {
                                selectedRecipe.category
                              }
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      {
                        selectedRecipe.name
                      }
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      {
                        selectedRecipe.servings
                      }{' '}
                      serving
                      {selectedRecipe.servings ===
                      1
                        ? ''
                        : 's'}
                    </Text>
                  </View>

                  <Pressable
                    style={
                      styles.closeButton
                    }
                    onPress={
                      closeRecipe
                    }
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={
                        colors.text
                      }
                    />
                  </Pressable>
                </View>

                {selectedRecipe.description ? (
                  <Text
                    style={
                      styles.detailDescription
                    }
                  >
                    {
                      selectedRecipe.description
                    }
                  </Text>
                ) : null}

                <Text
                  style={
                    styles.detailSectionTitle
                  }
                >
                  NUTRITION PER SERVING
                </Text>

                {(() => {
                  const nutrition =
                    calculatePerServing(
                      selectedRecipe
                    );

                  return (
                    <View
                      style={
                        styles.detailNutrition
                      }
                    >
                      <View
                        style={
                          styles.detailNutritionItem
                        }
                      >
                        <Text
                          style={
                            styles.detailNutritionValue
                          }
                        >
                          {
                            nutrition.calories
                          }
                        </Text>

                        <Text
                          style={
                            styles.detailNutritionLabel
                          }
                        >
                          Calories
                        </Text>
                      </View>

                      <View
                        style={
                          styles.detailNutritionItem
                        }
                      >
                        <Text
                          style={
                            styles.detailNutritionValue
                          }
                        >
                          {
                            nutrition.protein
                          }
                          g
                        </Text>

                        <Text
                          style={
                            styles.detailNutritionLabel
                          }
                        >
                          Protein
                        </Text>
                      </View>

                      <View
                        style={
                          styles.detailNutritionItem
                        }
                      >
                        <Text
                          style={
                            styles.detailNutritionValue
                          }
                        >
                          {
                            nutrition.carbs
                          }
                          g
                        </Text>

                        <Text
                          style={
                            styles.detailNutritionLabel
                          }
                        >
                          Carbs
                        </Text>
                      </View>

                      <View
                        style={
                          styles.detailNutritionItem
                        }
                      >
                        <Text
                          style={
                            styles.detailNutritionValue
                          }
                        >
                          {
                            nutrition.fat
                          }
                          g
                        </Text>

                        <Text
                          style={
                            styles.detailNutritionLabel
                          }
                        >
                          Fat
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                <Text
                  style={
                    styles.detailSectionTitle
                  }
                >
                  INGREDIENTS
                </Text>

                <View
                  style={
                    styles.ingredientList
                  }
                >
                  {selectedRecipe.ingredients.map(
                    (
                      ingredient,
                      index
                    ) => (
                      <View
                        key={
                          ingredient.id
                        }
                        style={
                          styles.detailIngredient
                        }
                      >
                        <View
                          style={
                            styles.ingredientNumber
                          }
                        >
                          <Text
                            style={
                              styles.ingredientNumberText
                            }
                          >
                            {index +
                              1}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.detailIngredientMain
                          }
                        >
                          <Text
                            style={
                              styles.detailIngredientName
                            }
                          >
                            {
                              ingredient.ingredientName
                            }
                          </Text>

                          <Text
                            style={
                              styles.detailIngredientServing
                            }
                          >
                            {
                              ingredient.quantity
                            }{' '}
                            ×{' '}
                            {ingredient.serving ||
                              'serving'}
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.detailIngredientCalories
                          }
                        >
                          {formatNutrition(
                            ingredient.calories *
                              ingredient.quantity
                          )}{' '}
                          cal
                        </Text>
                      </View>
                    )
                  )}
                </View>

                {selectedRecipe.instructions ? (
                  <>
                    <Text
                      style={
                        styles.detailSectionTitle
                      }
                    >
                      INSTRUCTIONS
                    </Text>

                    <View
                      style={
                        styles.instructionsBox
                      }
                    >
                      <Text
                        style={
                          styles.instructionsText
                        }
                      >
                        {
                          selectedRecipe.instructions
                        }
                      </Text>
                    </View>
                  </>
                ) : null}

                <Pressable
                  style={
                    styles.logButton
                  }
                  onPress={() =>
                    openLogRecipe(
                      selectedRecipe,
                      selectedSource ??
                        'personal'
                    )
                  }
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color="#08110B"
                  />

                  <Text
                    style={
                      styles.logButtonText
                    }
                  >
                    LOG RECIPE
                  </Text>
                </Pressable>

                {selectedSource ===
                'personal' ? (
                  <View
                    style={
                      styles.actionRow
                    }
                  >
                    <Pressable
                      style={
                        styles.editButton
                      }
                      onPress={() =>
                        handleEditRecipe(
                          selectedRecipe as Recipe
                        )
                      }
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={18}
                        color={
                          colors.primary
                        }
                      />

                      <Text
                        style={
                          styles.editButtonText
                        }
                      >
                        Edit
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.deleteButton,

                        deletingRecipeId ===
                          selectedRecipe.id &&
                          styles.disabledButton,
                      ]}
                      onPress={() =>
                        handleDeleteRecipe(
                          selectedRecipe as Recipe
                        )
                      }
                      disabled={
                        Boolean(
                          deletingRecipeId
                        )
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={
                          colors.danger
                        }
                      />

                      <Text
                        style={
                          styles.deleteButtonText
                        }
                      >
                        {deletingRecipeId ===
                        selectedRecipe.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    {saveError ? (
                      <View
                        style={
                          styles.saveErrorBox
                        }
                      >
                        <Text
                          style={
                            styles.errorText
                          }
                        >
                          {
                            saveError
                          }
                        </Text>
                      </View>
                    ) : null}

                    <Pressable
                      style={[
                        styles.saveRecipeButton,

                        savingCuratedRecipeId ===
                          selectedRecipe.id &&
                          styles.disabledButton,

                        savedCuratedRecipeId ===
                          selectedRecipe.id &&
                          styles.savedRecipeButton,
                      ]}
                      onPress={() =>
                        handleSaveCuratedRecipe(
                          selectedRecipe as CuratedRecipe
                        )
                      }
                      disabled={
                        Boolean(
                          savingCuratedRecipeId
                        ) ||
                        savedCuratedRecipeId ===
                          selectedRecipe.id
                      }
                    >
                      {savingCuratedRecipeId ===
                      selectedRecipe.id ? (
                        <ActivityIndicator
                          size="small"
                          color={
                            colors.primary
                          }
                        />
                      ) : (
                        <Ionicons
                          name={
                            savedCuratedRecipeId ===
                            selectedRecipe.id
                              ? 'checkmark-circle'
                              : 'bookmark-outline'
                          }
                          size={19}
                          color={
                            colors.primary
                          }
                        />
                      )}

                      <Text
                        style={
                          styles.saveRecipeButtonText
                        }
                      >
                        {savingCuratedRecipeId ===
                        selectedRecipe.id
                          ? 'SAVING...'
                          : savedCuratedRecipeId ===
                              selectedRecipe.id
                            ? 'SAVED TO MY RECIPES'
                            : 'SAVE TO MY RECIPES'}
                      </Text>
                    </Pressable>

                    <View
                      style={
                        styles.readOnlyNote
                      }
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={16}
                        color={
                          colors.textSecondary
                        }
                      />

                      <Text
                        style={
                          styles.readOnlyText
                        }
                      >
                        Saving creates
                        your own editable
                        copy. The original
                        Apollo recipe
                        stays unchanged.
                      </Text>
                    </View>
                  </>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          Boolean(
            selectedRecipe
          ) &&
          showLogModal
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeLogModal
        }
      >
        <KeyboardAvoidingView
          style={
            styles.modalBackdrop
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
              styles.logModalCard
            }
          >
            {selectedRecipe ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
              >
                <View
                  style={
                    styles.modalHeader
                  }
                >
                  <View
                    style={
                      styles.modalHeaderText
                    }
                  >
                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      Log Recipe
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      {
                        selectedRecipe.name
                      }
                    </Text>
                  </View>

                  <Pressable
                    style={
                      styles.closeButton
                    }
                    onPress={
                      closeLogModal
                    }
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={
                        colors.text
                      }
                    />
                  </Pressable>
                </View>

                {logError ? (
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
                        logError
                      }
                    </Text>
                  </View>
                ) : null}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  SERVINGS
                </Text>

                <TextInput
                  style={
                    styles.servingInput
                  }
                  value={
                    logServings
                  }
                  onChangeText={
                    setLogServings
                  }
                  keyboardType="decimal-pad"
                  placeholder="1"
                  placeholderTextColor={
                    colors.textSecondary
                  }
                />

                {(() => {
                  const servingCount =
                    numberValue(
                      logServings
                    );

                  const nutrition =
                    calculatePerServing(
                      selectedRecipe
                    );

                  return (
                    <View
                      style={
                        styles.logPreview
                      }
                    >
                      <Text
                        style={
                          styles.logPreviewLabel
                        }
                      >
                        NUTRITION TO LOG
                      </Text>

                      <Text
                        style={
                          styles.logPreviewCalories
                        }
                      >
                        {formatNutrition(
                          nutrition.calories *
                            servingCount
                        )}{' '}
                        cal
                      </Text>

                      <Text
                        style={
                          styles.logPreviewMacros
                        }
                      >
                        P{' '}
                        {formatNutrition(
                          nutrition.protein *
                            servingCount
                        )}
                        g · C{' '}
                        {formatNutrition(
                          nutrition.carbs *
                            servingCount
                        )}
                        g · F{' '}
                        {formatNutrition(
                          nutrition.fat *
                            servingCount
                        )}
                        g
                      </Text>
                    </View>
                  );
                })()}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  ADD TO
                </Text>

                <View
                  style={
                    styles.mealList
                  }
                >
                  {meals.map(
                    (meal) => (
                      <Pressable
                        key={meal}
                        style={[
                          styles.mealButton,

                          logging &&
                            styles.disabledButton,
                        ]}
                        onPress={() =>
                          handleLogRecipe(
                            meal
                          )
                        }
                        disabled={
                          logging
                        }
                      >
                        <Text
                          style={
                            styles.mealButtonText
                          }
                        >
                          {logging
                            ? 'Logging...'
                            : meal}
                        </Text>

                        {!logging ? (
                          <Ionicons
                            name="chevron-forward"
                            size={19}
                            color={
                              colors.primary
                            }
                          />
                        ) : null}
                      </Pressable>
                    )
                  )}
                </View>

                <Pressable
                  style={
                    styles.backToRecipeButton
                  }
                  onPress={
                    closeLogModal
                  }
                >
                  <Text
                    style={
                      styles.backToRecipeText
                    }
                  >
                    BACK TO RECIPE
                  </Text>
                </Pressable>
              </ScrollView>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles =
  StyleSheet.create({
    loadingScreen: {
      flex: 1,
      backgroundColor:
        colors.background,
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 12,
    },

    loadingText: {
      color:
        colors.textSecondary,
      fontSize: 15,
    },

    screen: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    content: {
      padding: 20,
      paddingBottom: 60,
    },

    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf:
        'flex-start',
      gap: 4,
      marginBottom: 20,
    },

    backText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },

    titleRow: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      justifyContent:
        'space-between',
      gap: 14,
      marginBottom: 20,
    },

    titleBlock: {
      flex: 1,
    },

    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '800',
    },

    subtitle: {
      color:
        colors.textSecondary,
      fontSize: 15,
      lineHeight: 21,
      marginTop: 5,
    },

    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor:
        colors.primary,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 10,
    },

    createButtonText: {
      color: '#08110B',
      fontSize: 14,
      fontWeight: '800',
    },

    searchContainer: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 12,
      paddingHorizontal: 13,
      marginBottom: 22,
    },

    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      paddingVertical: 10,
    },

    section: {
      marginBottom: 30,
    },

    libraryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 10,
    },

    libraryLabel: {
      color:
        colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.9,
    },

    sectionSubtitle: {
      color:
        colors.textSecondary,
      fontSize: 12,
      marginTop: 4,
    },

    apolloSectionTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    recipeCount: {
      color:
        colors.textSecondary,
      fontSize: 12,
    },

    recipeList: {
      gap: 12,
    },

    recipeCard: {
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 15,
      padding: 16,
    },

    recipeCardTop: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 10,
    },

    recipeCardMain: {
      flex: 1,
    },

    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      marginBottom: 9,
    },

    apolloBadge: {
      backgroundColor:
        'rgba(74, 222, 128, 0.14)',
      borderWidth: 1,
      borderColor:
        colors.primary,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },

    apolloBadgeText: {
      color:
        colors.primary,
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.8,
    },

    categoryBadge: {
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },

    categoryBadgeText: {
      color:
        colors.textSecondary,
      fontSize: 9,
      fontWeight: '800',
      textTransform:
        'uppercase',
    },

    featuredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },

    featuredBadgeText: {
      color:
        colors.primary,
      fontSize: 9,
      fontWeight: '900',
    },

    recipeName: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },

    recipeDescription: {
      color:
        colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 5,
    },

    recipeMeta: {
      color:
        colors.textSecondary,
      fontSize: 12,
      marginTop: 8,
    },

    nutritionRow: {
      flexDirection: 'row',
      marginTop: 18,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
    },

    calorieBlock: {
      flex: 1,
    },

    macroBlock: {
      flex: 1,
      alignItems: 'center',
    },

    calorieValue: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },

    calorieLabel: {
      color:
        colors.textSecondary,
      fontSize: 9,
      fontWeight: '700',
      marginTop: 2,
    },

    macroValue: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },

    macroLabel: {
      color:
        colors.textSecondary,
      fontSize: 9,
      fontWeight: '700',
      marginTop: 2,
    },

    perServingLabel: {
      color:
        colors.textSecondary,
      fontSize: 10,
      marginTop: 10,
    },

    emptyState: {
      minHeight: 300,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 16,
      padding: 26,
    },

    compactEmptyState: {
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 16,
      padding: 24,
    },

    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginTop: 4,
      textAlign: 'center',
    },

    emptyText: {
      color:
        colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginTop: 7,
    },

    emptyButton: {
      backgroundColor:
        colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 10,
      marginTop: 18,
    },

    emptyButtonText: {
      color: '#08110B',
      fontSize: 13,
      fontWeight: '900',
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor:
        'rgba(0, 0, 0, 0.75)',
      justifyContent:
        'center',
      padding: 18,
    },

    modalCard: {
      maxHeight: '90%',
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 18,
      padding: 18,
    },

    logModalCard: {
      maxHeight: '88%',
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 18,
      padding: 18,
    },

    modalHeader: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      justifyContent:
        'space-between',
      gap: 12,
      marginBottom: 16,
    },

    modalHeaderText: {
      flex: 1,
    },

    modalBadgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 9,
    },

    modalTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
    },

    modalSubtitle: {
      color:
        colors.textSecondary,
      fontSize: 13,
      marginTop: 4,
    },

    closeButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 10,
      backgroundColor:
        colors.surfaceSecondary,
    },

    detailDescription: {
      color:
        colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 18,
    },

    detailSectionTitle: {
      color:
        colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.9,
      marginTop: 12,
      marginBottom: 9,
    },

    detailNutrition: {
      flexDirection: 'row',
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 12,
      paddingVertical: 14,
    },

    detailNutritionItem: {
      flex: 1,
      alignItems: 'center',
    },

    detailNutritionValue: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },

    detailNutritionLabel: {
      color:
        colors.textSecondary,
      fontSize: 10,
      marginTop: 3,
    },

    ingredientList: {
      gap: 8,
    },

    detailIngredient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      padding: 11,
    },

    ingredientNumber: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 13,
      backgroundColor:
        colors.border,
    },

    ingredientNumberText: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '800',
    },

    detailIngredientMain: {
      flex: 1,
    },

    detailIngredientName: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },

    detailIngredientServing: {
      color:
        colors.textSecondary,
      fontSize: 11,
      marginTop: 2,
    },

    detailIngredientCalories: {
      color:
        colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },

    instructionsBox: {
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 11,
      padding: 13,
    },

    instructionsText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 21,
    },

    logButton: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 7,
      backgroundColor:
        colors.primary,
      borderRadius: 11,
      marginTop: 20,
    },

    logButtonText: {
      color: '#08110B',
      fontSize: 14,
      fontWeight: '900',
    },

    actionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },

    editButton: {
      flex: 1,
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 6,
      borderWidth: 1,
      borderColor:
        colors.primary,
      borderRadius: 10,
    },

    editButtonText: {
      color:
        colors.primary,
      fontSize: 13,
      fontWeight: '800',
    },

    deleteButton: {
      flex: 1,
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 6,
      borderWidth: 1,
      borderColor:
        colors.danger,
      borderRadius: 10,
    },

    deleteButtonText: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: '800',
    },

    saveRecipeButton: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 7,
      borderWidth: 1,
      borderColor:
        colors.primary,
      borderRadius: 10,
      marginTop: 10,
    },

    savedRecipeButton: {
      backgroundColor:
        'rgba(74, 222, 128, 0.08)',
    },

    saveRecipeButtonText: {
      color:
        colors.primary,
      fontSize: 13,
      fontWeight: '900',
    },

    saveErrorBox: {
      padding: 12,
      borderRadius: 10,
      backgroundColor:
        'rgba(248, 113, 113, 0.12)',
      borderWidth: 1,
      borderColor:
        colors.danger,
      marginTop: 10,
    },

    readOnlyNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 7,
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      padding: 12,
      marginTop: 10,
    },

    readOnlyText: {
      flex: 1,
      color:
        colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },

    inputLabel: {
      color:
        colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginTop: 10,
      marginBottom: 7,
    },

    servingInput: {
      minHeight: 48,
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      color: colors.text,
      fontSize: 16,
    },

    logPreview: {
      alignItems: 'center',
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 12,
      padding: 16,
      marginTop: 14,
    },

    logPreviewLabel: {
      color:
        colors.textSecondary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
    },

    logPreviewCalories: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
      marginTop: 5,
    },

    logPreviewMacros: {
      color:
        colors.textSecondary,
      fontSize: 13,
      marginTop: 4,
    },

    mealList: {
      gap: 8,
    },

    mealButton: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
    },

    mealButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },

    backToRecipeButton: {
      alignItems: 'center',
      justifyContent:
        'center',
      minHeight: 46,
      marginTop: 12,
    },

    backToRecipeText: {
      color:
        colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
    },

    errorBox: {
      padding: 12,
      borderRadius: 10,
      backgroundColor:
        'rgba(248, 113, 113, 0.12)',
      borderWidth: 1,
      borderColor:
        colors.danger,
      marginBottom: 12,
    },

    errorText: {
      color: colors.danger,
      fontSize: 13,
    },

    disabledButton: {
      opacity: 0.5,
    },

    pressed: {
      opacity: 0.7,
    },
  });