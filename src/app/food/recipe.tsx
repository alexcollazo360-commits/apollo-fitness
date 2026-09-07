import Ionicons from '@expo/vector-icons/Ionicons';

import {
    Stack,
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    ActivityIndicator,
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
    FoodLibraryItem,
    useFood,
} from '../../context/FoodContext';

import {
    NewRecipe,
    NewRecipeIngredient,
    useRecipes,
} from '../../context/RecipeContext';

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

export default function RecipeScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      recipeId?: string;
    }>();

  const recipeId =
    typeof params.recipeId ===
    'string'
      ? params.recipeId
      : undefined;

  const {
    searchFoodHistory,
  } = useFood();

  const {
    recipes,
    loading,
    createRecipe,
    updateRecipe,
    getRecipeById,
    calculateRecipeTotals,
    calculatePerServing,
  } = useRecipes();

  const isEditing =
    Boolean(recipeId);

  const [
    initializedRecipeId,
    setInitializedRecipeId,
  ] = useState<
    string | null
  >(null);

  const [
    name,
    setName,
  ] = useState('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [
    instructions,
    setInstructions,
  ] = useState('');

  const [
    servings,
    setServings,
  ] = useState('1');

  const [
    ingredients,
    setIngredients,
  ] = useState<
    NewRecipeIngredient[]
  >([]);

  const [
    showIngredientModal,
    setShowIngredientModal,
  ] = useState(false);

  const [
    editingIngredientIndex,
    setEditingIngredientIndex,
  ] = useState<
    number | null
  >(null);

  const [
    ingredientName,
    setIngredientName,
  ] = useState('');

  const [
    ingredientCalories,
    setIngredientCalories,
  ] = useState('');

  const [
    ingredientProtein,
    setIngredientProtein,
  ] = useState('');

  const [
    ingredientCarbs,
    setIngredientCarbs,
  ] = useState('');

  const [
    ingredientFat,
    setIngredientFat,
  ] = useState('');

  const [
    ingredientServing,
    setIngredientServing,
  ] = useState('');

  const [
    ingredientQuantity,
    setIngredientQuantity,
  ] = useState('1');

  const [
    ingredientSearch,
    setIngredientSearch,
  ] = useState('');

  const [
    ingredientSearchResults,
    setIngredientSearchResults,
  ] = useState<
    FoodLibraryItem[]
  >([]);

  const [
    ingredientSearchLoading,
    setIngredientSearchLoading,
  ] = useState(false);

  const [
    customIngredientMode,
    setCustomIngredientMode,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null);

  const [
    ingredientError,
    setIngredientError,
  ] = useState<
    string | null
  >(null);

  const [
    saving,
    setSaving,
  ] = useState(false);

  useEffect(() => {
    if (!recipeId) {
      return;
    }

    if (loading) {
      return;
    }

    if (
      initializedRecipeId ===
      recipeId
    ) {
      return;
    }

    const recipe =
      getRecipeById(
        recipeId
      );

    if (!recipe) {
      setErrorMessage(
        'Apollo could not find this recipe.'
      );

      return;
    }

    setName(
      recipe.name
    );

    setDescription(
      recipe.description ?? ''
    );

    setInstructions(
      recipe.instructions ?? ''
    );

    setServings(
      String(
        recipe.servings
      )
    );

    setIngredients(
      recipe.ingredients.map(
        (ingredient) => ({
          ingredientName:
            ingredient.ingredientName,

          calories:
            ingredient.calories,

          protein:
            ingredient.protein,

          carbs:
            ingredient.carbs,

          fat:
            ingredient.fat,

          serving:
            ingredient.serving,

          quantity:
            ingredient.quantity,
        })
      )
    );

    setInitializedRecipeId(
      recipeId
    );
  }, [
    recipeId,
    loading,
    recipes,
    getRecipeById,
    initializedRecipeId,
  ]);

  useEffect(() => {
    if (
      !showIngredientModal ||
      editingIngredientIndex !==
        null ||
      customIngredientMode
    ) {
      return;
    }

    let cancelled = false;

    const timer =
      setTimeout(
        async () => {
          setIngredientSearchLoading(
            true
          );

          const results =
            await searchFoodHistory(
              ingredientSearch
            );

          if (cancelled) {
            return;
          }

          setIngredientSearchResults(
            results
          );

          setIngredientSearchLoading(
            false
          );
        },
        ingredientSearch.trim()
          ? 250
          : 0
      );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    showIngredientModal,
    editingIngredientIndex,
    customIngredientMode,
    ingredientSearch,
  ]);

  const recipePreview:
    NewRecipe = useMemo(
      () => ({
        name,
        description,
        instructions,

        servings:
          numberValue(
            servings
          ),

        ingredients,
      }),
      [
        name,
        description,
        instructions,
        servings,
        ingredients,
      ]
    );

  const totals =
    calculateRecipeTotals(
      recipePreview
    );

  const perServing =
    calculatePerServing(
      recipePreview
    );

  function resetIngredientForm() {
    setIngredientName('');
    setIngredientCalories('');
    setIngredientProtein('');
    setIngredientCarbs('');
    setIngredientFat('');
    setIngredientServing('');
    setIngredientQuantity('1');

    setIngredientSearch('');
    setIngredientSearchResults(
      []
    );

    setCustomIngredientMode(
      false
    );

    setEditingIngredientIndex(
      null
    );

    setIngredientError(
      null
    );
  }

  function openNewIngredient() {
    resetIngredientForm();

    setShowIngredientModal(
      true
    );
  }

  function openEditIngredient(
    index: number
  ) {
    const ingredient =
      ingredients[index];

    setEditingIngredientIndex(
      index
    );

    setIngredientName(
      ingredient.ingredientName
    );

    setIngredientCalories(
      String(
        ingredient.calories
      )
    );

    setIngredientProtein(
      String(
        ingredient.protein
      )
    );

    setIngredientCarbs(
      String(
        ingredient.carbs
      )
    );

    setIngredientFat(
      String(
        ingredient.fat
      )
    );

    setIngredientServing(
      ingredient.serving
    );

    setIngredientQuantity(
      String(
        ingredient.quantity
      )
    );

    setCustomIngredientMode(
      true
    );

    setIngredientError(
      null
    );

    setShowIngredientModal(
      true
    );
  }

  function closeIngredientModal() {
    setShowIngredientModal(
      false
    );

    resetIngredientForm();
  }

  function selectFood(
    food: FoodLibraryItem
  ) {
    setIngredientName(
      food.name
    );

    setIngredientCalories(
      String(
        food.calories
      )
    );

    setIngredientProtein(
      String(
        food.protein
      )
    );

    setIngredientCarbs(
      String(
        food.carbs
      )
    );

    setIngredientFat(
      String(
        food.fat
      )
    );

    setIngredientServing(
      food.serving
    );

    setIngredientQuantity(
      '1'
    );

    setCustomIngredientMode(
      true
    );

    setIngredientError(
      null
    );
  }

  function saveIngredient() {
    const trimmedName =
      ingredientName.trim();

    if (!trimmedName) {
      setIngredientError(
        'Ingredient name is required.'
      );

      return;
    }

    const quantity =
      numberValue(
        ingredientQuantity
      );

    if (quantity <= 0) {
      setIngredientError(
        'Quantity must be greater than 0.'
      );

      return;
    }

    const ingredient:
      NewRecipeIngredient = {
        ingredientName:
          trimmedName,

        calories:
          numberValue(
            ingredientCalories
          ),

        protein:
          numberValue(
            ingredientProtein
          ),

        carbs:
          numberValue(
            ingredientCarbs
          ),

        fat:
          numberValue(
            ingredientFat
          ),

        serving:
          ingredientServing.trim(),

        quantity,
      };

    if (
      editingIngredientIndex !==
      null
    ) {
      setIngredients(
        (current) =>
          current.map(
            (
              currentIngredient,
              index
            ) =>
              index ===
              editingIngredientIndex
                ? ingredient
                : currentIngredient
          )
      );
    } else {
      setIngredients(
        (current) => [
          ...current,
          ingredient,
        ]
      );
    }

    closeIngredientModal();
  }

  function removeIngredient(
    index: number
  ) {
    setIngredients(
      (current) =>
        current.filter(
          (
            _ingredient,
            currentIndex
          ) =>
            currentIndex !==
            index
        )
    );
  }

  async function handleSaveRecipe() {
    setErrorMessage(
      null
    );

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      setErrorMessage(
        'Recipe name is required.'
      );

      return;
    }

    const servingCount =
      numberValue(
        servings
      );

    if (servingCount <= 0) {
      setErrorMessage(
        'Recipe servings must be greater than 0.'
      );

      return;
    }

    if (
      ingredients.length === 0
    ) {
      setErrorMessage(
        'Add at least one ingredient.'
      );

      return;
    }

    const recipeData:
      NewRecipe = {
        name: trimmedName,

        description:
          description.trim(),

        instructions:
          instructions.trim(),

        servings:
          servingCount,

        ingredients,
      };

    setSaving(true);

    if (
      isEditing &&
      recipeId
    ) {
      const success =
        await updateRecipe(
          recipeId,
          recipeData
        );

      setSaving(false);

      if (!success) {
        setErrorMessage(
          'Apollo could not update this recipe. Please try again.'
        );

        return;
      }
    } else {
      const newRecipeId =
        await createRecipe(
          recipeData
        );

      setSaving(false);

      if (!newRecipeId) {
        setErrorMessage(
          'Apollo could not save this recipe. Please try again.'
        );

        return;
      }
    }

    router.replace(
      '/(tabs)/food'
    );
  }

  if (
    isEditing &&
    loading &&
    initializedRecipeId !==
      recipeId
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
          Loading recipe...
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

      <KeyboardAvoidingView
        style={styles.screen}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={
              styles.header
            }
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
          </View>

          <Text
            style={
              styles.title
            }
          >
            {isEditing
              ? 'Edit Recipe'
              : 'Create Recipe'}
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            {isEditing
              ? 'Update the recipe and Apollo will recalculate its nutrition automatically.'
              : 'Build a recipe from ingredients and Apollo will calculate its nutrition automatically.'}
          </Text>

          {errorMessage ? (
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
                  errorMessage
                }
              </Text>
            </View>
          ) : null}

          <View
            style={
              styles.section
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              RECIPE DETAILS
            </Text>

            <Text
              style={
                styles.label
              }
            >
              NAME
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={name}
              onChangeText={
                setName
              }
              placeholder="Chicken rice bowl"
              placeholderTextColor={
                colors.textSecondary
              }
            />

            <Text
              style={
                styles.label
              }
            >
              DESCRIPTION
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.multilineInput,
              ]}
              value={
                description
              }
              onChangeText={
                setDescription
              }
              placeholder="Optional description"
              placeholderTextColor={
                colors.textSecondary
              }
              multiline
            />

            <Text
              style={
                styles.label
              }
            >
              SERVINGS MADE
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={
                servings
              }
              onChangeText={
                setServings
              }
              placeholder="1"
              placeholderTextColor={
                colors.textSecondary
              }
              keyboardType="decimal-pad"
            />
          </View>

          <View
            style={
              styles.section
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={
                  styles.sectionHeaderText
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  INGREDIENTS
                </Text>

                <Text
                  style={
                    styles.sectionDescription
                  }
                >
                  {
                    ingredients.length
                  }{' '}
                  ingredient
                  {ingredients.length ===
                  1
                    ? ''
                    : 's'}
                </Text>
              </View>

              <Pressable
                style={
                  styles.addIngredientButton
                }
                onPress={
                  openNewIngredient
                }
              >
                <Ionicons
                  name="add"
                  size={20}
                  color="#08110B"
                />

                <Text
                  style={
                    styles.addIngredientButtonText
                  }
                >
                  Add
                </Text>
              </Pressable>
            </View>

            {ingredients.length ===
            0 ? (
              <View
                style={
                  styles.emptyIngredients
                }
              >
                <Ionicons
                  name="restaurant-outline"
                  size={30}
                  color={
                    colors.textSecondary
                  }
                />

                <Text
                  style={
                    styles.emptyIngredientsTitle
                  }
                >
                  No ingredients yet
                </Text>

                <Text
                  style={
                    styles.emptyIngredientsText
                  }
                >
                  Search your saved
                  foods or add a custom
                  ingredient.
                </Text>
              </View>
            ) : (
              ingredients.map(
                (
                  ingredient,
                  index
                ) => {
                  const quantity =
                    ingredient.quantity;

                  const calories =
                    formatNutrition(
                      ingredient.calories *
                        quantity
                    );

                  const protein =
                    formatNutrition(
                      ingredient.protein *
                        quantity
                    );

                  const carbs =
                    formatNutrition(
                      ingredient.carbs *
                        quantity
                    );

                  const fat =
                    formatNutrition(
                      ingredient.fat *
                        quantity
                    );

                  return (
                    <View
                      key={`${ingredient.ingredientName}-${index}`}
                      style={
                        styles.ingredientCard
                      }
                    >
                      <View
                        style={
                          styles.ingredientTop
                        }
                      >
                        <View
                          style={
                            styles.ingredientMain
                          }
                        >
                          <Text
                            style={
                              styles.ingredientName
                            }
                          >
                            {
                              ingredient.ingredientName
                            }
                          </Text>

                          <Text
                            style={
                              styles.ingredientServing
                            }
                          >
                            {quantity}{' '}
                            ×{' '}
                            {ingredient.serving ||
                              'serving'}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.ingredientActions
                          }
                        >
                          <Pressable
                            style={
                              styles.iconButton
                            }
                            onPress={() =>
                              openEditIngredient(
                                index
                              )
                            }
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={18}
                              color={
                                colors.text
                              }
                            />
                          </Pressable>

                          <Pressable
                            style={
                              styles.iconButton
                            }
                            onPress={() =>
                              removeIngredient(
                                index
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
                          </Pressable>
                        </View>
                      </View>

                      <Text
                        style={
                          styles.ingredientCalories
                        }
                      >
                        {calories} cal
                      </Text>

                      <Text
                        style={
                          styles.ingredientMacros
                        }
                      >
                        P {protein}g · C{' '}
                        {carbs}g · F {fat}g
                      </Text>
                    </View>
                  );
                }
              )
            )}
          </View>

          <View
            style={
              styles.section
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              NUTRITION
            </Text>

            <View
              style={
                styles.nutritionBlock
              }
            >
              <Text
                style={
                  styles.nutritionHeading
                }
              >
                Whole Recipe
              </Text>

              <Text
                style={
                  styles.calorieValue
                }
              >
                {
                  totals.calories
                }{' '}
                cal
              </Text>

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
                      styles.macroValue
                    }
                  >
                    {
                      totals.protein
                    }
                    g
                  </Text>

                  <Text
                    style={
                      styles.macroLabel
                    }
                  >
                    Protein
                  </Text>
                </View>

                <View
                  style={
                    styles.macroItem
                  }
                >
                  <Text
                    style={
                      styles.macroValue
                    }
                  >
                    {
                      totals.carbs
                    }
                    g
                  </Text>

                  <Text
                    style={
                      styles.macroLabel
                    }
                  >
                    Carbs
                  </Text>
                </View>

                <View
                  style={
                    styles.macroItem
                  }
                >
                  <Text
                    style={
                      styles.macroValue
                    }
                  >
                    {
                      totals.fat
                    }
                    g
                  </Text>

                  <Text
                    style={
                      styles.macroLabel
                    }
                  >
                    Fat
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.nutritionBlock
              }
            >
              <Text
                style={
                  styles.nutritionHeading
                }
              >
                Per Serving
              </Text>

              <Text
                style={
                  styles.calorieValue
                }
              >
                {
                  perServing.calories
                }{' '}
                cal
              </Text>

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
                    Protein
                  </Text>
                </View>

                <View
                  style={
                    styles.macroItem
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
                    Carbs
                  </Text>
                </View>

                <View
                  style={
                    styles.macroItem
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
                    Fat
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={
              styles.section
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              INSTRUCTIONS
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.instructionsInput,
              ]}
              value={
                instructions
              }
              onChangeText={
                setInstructions
              }
              placeholder="Optional cooking instructions..."
              placeholderTextColor={
                colors.textSecondary
              }
              multiline
              textAlignVertical="top"
            />
          </View>

          <Pressable
            style={[
              styles.saveButton,
              saving &&
                styles.disabledButton,
            ]}
            onPress={
              handleSaveRecipe
            }
            disabled={saving}
          >
            <Text
              style={
                styles.saveButtonText
              }
            >
              {saving
                ? isEditing
                  ? 'UPDATING...'
                  : 'SAVING...'
                : isEditing
                  ? 'UPDATE RECIPE'
                  : 'SAVE RECIPE'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={
          showIngredientModal
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeIngredientModal
        }
      >
        <KeyboardAvoidingView
          style={
            styles.modalBackdrop
          }
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={
                false
              }
            >
              <View
                style={
                  styles.modalHeader
                }
              >
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  {editingIngredientIndex !==
                  null
                    ? 'Edit Ingredient'
                    : 'Add Ingredient'}
                </Text>

                <Pressable
                  style={
                    styles.modalCloseButton
                  }
                  onPress={
                    closeIngredientModal
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

              {ingredientError ? (
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
                      ingredientError
                    }
                  </Text>
                </View>
              ) : null}

              {editingIngredientIndex ===
                null &&
              !customIngredientMode ? (
                <>
                  <Text
                    style={
                      styles.searchSectionTitle
                    }
                  >
                    SEARCH SAVED FOODS
                  </Text>

                  <View
                    style={
                      styles.searchInputContainer
                    }
                  >
                    <Ionicons
                      name="search"
                      size={19}
                      color={
                        colors.textSecondary
                      }
                    />

                    <TextInput
                      style={
                        styles.searchInput
                      }
                      value={
                        ingredientSearch
                      }
                      onChangeText={
                        setIngredientSearch
                      }
                      placeholder="Search chicken, rice, yogurt..."
                      placeholderTextColor={
                        colors.textSecondary
                      }
                      autoCapitalize="none"
                    />

                    {ingredientSearch ? (
                      <Pressable
                        onPress={() =>
                          setIngredientSearch(
                            ''
                          )
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

                  <Text
                    style={
                      styles.searchHint
                    }
                  >
                    {ingredientSearch.trim()
                      ? 'Search results'
                      : 'Recent foods'}
                  </Text>

                  {ingredientSearchLoading ? (
                    <View
                      style={
                        styles.searchLoading
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
                          styles.searchLoadingText
                        }
                      >
                        Searching foods...
                      </Text>
                    </View>
                  ) : ingredientSearchResults.length >
                    0 ? (
                    <View
                      style={
                        styles.searchResults
                      }
                    >
                      {ingredientSearchResults.map(
                        (
                          food,
                          index
                        ) => (
                          <Pressable
                            key={`${food.name}-${food.serving}-${index}`}
                            style={({ pressed }) => [
                              styles.foodResultCard,
                              pressed &&
                                styles.pressed,
                            ]}
                            onPress={() =>
                              selectFood(
                                food
                              )
                            }
                          >
                            <View
                              style={
                                styles.foodResultMain
                              }
                            >
                              <Text
                                style={
                                  styles.foodResultName
                                }
                                numberOfLines={
                                  1
                                }
                              >
                                {
                                  food.name
                                }
                              </Text>

                              <Text
                                style={
                                  styles.foodResultServing
                                }
                              >
                                {food.serving ||
                                  '1 serving'}
                              </Text>

                              <Text
                                style={
                                  styles.foodResultMacros
                                }
                              >
                                P{' '}
                                {
                                  food.protein
                                }
                                g · C{' '}
                                {
                                  food.carbs
                                }
                                g · F{' '}
                                {
                                  food.fat
                                }
                                g
                              </Text>
                            </View>

                            <View
                              style={
                                styles.foodResultRight
                              }
                            >
                              <Text
                                style={
                                  styles.foodResultCalories
                                }
                              >
                                {
                                  food.calories
                                }
                              </Text>

                              <Text
                                style={
                                  styles.foodResultCalLabel
                                }
                              >
                                cal
                              </Text>

                              <Ionicons
                                name="add-circle"
                                size={22}
                                color={
                                  colors.primary
                                }
                              />
                            </View>
                          </Pressable>
                        )
                      )}
                    </View>
                  ) : (
                    <View
                      style={
                        styles.noSearchResults
                      }
                    >
                      <Ionicons
                        name="nutrition-outline"
                        size={28}
                        color={
                          colors.textSecondary
                        }
                      />

                      <Text
                        style={
                          styles.noSearchResultsTitle
                        }
                      >
                        {ingredientSearch.trim()
                          ? 'No matching foods'
                          : 'No food history yet'}
                      </Text>

                      <Text
                        style={
                          styles.noSearchResultsText
                        }
                      >
                        You can still
                        enter this
                        ingredient manually.
                      </Text>
                    </View>
                  )}

                  <View
                    style={
                      styles.orRow
                    }
                  >
                    <View
                      style={
                        styles.orLine
                      }
                    />

                    <Text
                      style={
                        styles.orText
                      }
                    >
                      OR
                    </Text>

                    <View
                      style={
                        styles.orLine
                      }
                    />
                  </View>

                  <Pressable
                    style={
                      styles.customIngredientButton
                    }
                    onPress={() =>
                      setCustomIngredientMode(
                        true
                      )
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={19}
                      color={
                        colors.primary
                      }
                    />

                    <Text
                      style={
                        styles.customIngredientButtonText
                      }
                    >
                      Enter Custom Ingredient
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  {editingIngredientIndex ===
                    null ? (
                    <Pressable
                      style={
                        styles.backToSearchButton
                      }
                      onPress={() => {
                        setCustomIngredientMode(
                          false
                        );

                        setIngredientName(
                          ''
                        );

                        setIngredientCalories(
                          ''
                        );

                        setIngredientProtein(
                          ''
                        );

                        setIngredientCarbs(
                          ''
                        );

                        setIngredientFat(
                          ''
                        );

                        setIngredientServing(
                          ''
                        );

                        setIngredientQuantity(
                          '1'
                        );

                        setIngredientError(
                          null
                        );
                      }}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={18}
                        color={
                          colors.primary
                        }
                      />

                      <Text
                        style={
                          styles.backToSearchText
                        }
                      >
                        Search Saved Foods
                      </Text>
                    </Pressable>
                  ) : null}

                  <Text
                    style={
                      styles.label
                    }
                  >
                    INGREDIENT
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      ingredientName
                    }
                    onChangeText={
                      setIngredientName
                    }
                    placeholder="Chicken breast"
                    placeholderTextColor={
                      colors.textSecondary
                    }
                  />

                  <Text
                    style={
                      styles.label
                    }
                  >
                    BASE SERVING
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      ingredientServing
                    }
                    onChangeText={
                      setIngredientServing
                    }
                    placeholder="100g"
                    placeholderTextColor={
                      colors.textSecondary
                    }
                  />

                  <Text
                    style={
                      styles.helperText
                    }
                  >
                    Enter nutrition for
                    one base serving.
                  </Text>

                  <View
                    style={
                      styles.twoColumnRow
                    }
                  >
                    <View
                      style={
                        styles.column
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
                          ingredientCalories
                        }
                        onChangeText={
                          setIngredientCalories
                        }
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={
                          colors.textSecondary
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.column
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
                          ingredientProtein
                        }
                        onChangeText={
                          setIngredientProtein
                        }
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={
                          colors.textSecondary
                        }
                      />
                    </View>
                  </View>

                  <View
                    style={
                      styles.twoColumnRow
                    }
                  >
                    <View
                      style={
                        styles.column
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
                          ingredientCarbs
                        }
                        onChangeText={
                          setIngredientCarbs
                        }
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={
                          colors.textSecondary
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.column
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
                          ingredientFat
                        }
                        onChangeText={
                          setIngredientFat
                        }
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={
                          colors.textSecondary
                        }
                      />
                    </View>
                  </View>

                  <Text
                    style={
                      styles.label
                    }
                  >
                    QUANTITY USED
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      ingredientQuantity
                    }
                    onChangeText={
                      setIngredientQuantity
                    }
                    keyboardType="decimal-pad"
                    placeholder="1"
                    placeholderTextColor={
                      colors.textSecondary
                    }
                  />

                  <Text
                    style={
                      styles.helperText
                    }
                  >
                    Example: if the
                    base serving is
                    100g and you use
                    250g, enter 2.5.
                  </Text>

                  <Pressable
                    style={
                      styles.saveIngredientButton
                    }
                    onPress={
                      saveIngredient
                    }
                  >
                    <Text
                      style={
                        styles.saveIngredientButtonText
                      }
                    >
                      {editingIngredientIndex !==
                      null
                        ? 'UPDATE INGREDIENT'
                        : 'ADD INGREDIENT'}
                    </Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
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

    header: {
      marginBottom: 18,
    },

    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf:
        'flex-start',
      gap: 4,
    },

    backText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
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
      lineHeight: 22,
      marginTop: 6,
      marginBottom: 22,
    },

    section: {
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 12,
    },

    sectionHeaderText: {
      flex: 1,
    },

    sectionTitle: {
      color:
        colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 12,
    },

    sectionDescription: {
      color:
        colors.textSecondary,
      fontSize: 13,
      marginTop: -7,
      marginBottom: 10,
    },

    label: {
      color:
        colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginTop: 12,
      marginBottom: 7,
    },

    input: {
      minHeight: 48,
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.text,
      fontSize: 16,
    },

    multilineInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },

    instructionsInput: {
      minHeight: 150,
      textAlignVertical: 'top',
    },

    addIngredientButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 4,
      paddingVertical: 9,
      paddingHorizontal: 13,
      borderRadius: 9,
      backgroundColor:
        colors.primary,
    },

    addIngredientButtonText: {
      color: '#08110B',
      fontSize: 14,
      fontWeight: '800',
    },

    emptyIngredients: {
      minHeight: 150,
      alignItems: 'center',
      justifyContent:
        'center',
      padding: 20,
    },

    emptyIngredientsTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginTop: 10,
    },

    emptyIngredientsText: {
      color:
        colors.textSecondary,
      fontSize: 14,
      marginTop: 5,
      textAlign: 'center',
    },

    ingredientCard: {
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 12,
      padding: 14,
      marginTop: 10,
    },

    ingredientTop: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      justifyContent:
        'space-between',
      gap: 12,
    },

    ingredientMain: {
      flex: 1,
    },

    ingredientName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },

    ingredientServing: {
      color:
        colors.textSecondary,
      fontSize: 13,
      marginTop: 3,
    },

    ingredientActions: {
      flexDirection: 'row',
      gap: 6,
    },

    iconButton: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 8,
      borderWidth: 1,
      borderColor:
        colors.border,
    },

    ingredientCalories: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      marginTop: 12,
    },

    ingredientMacros: {
      color:
        colors.textSecondary,
      fontSize: 13,
      marginTop: 3,
    },

    nutritionBlock: {
      alignItems: 'center',
      paddingVertical: 8,
    },

    nutritionHeading: {
      color:
        colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },

    calorieValue: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
      marginTop: 5,
    },

    macroRow: {
      width: '100%',
      flexDirection: 'row',
      marginTop: 16,
    },

    macroItem: {
      flex: 1,
      alignItems: 'center',
    },

    macroValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },

    macroLabel: {
      color:
        colors.textSecondary,
      fontSize: 11,
      marginTop: 3,
    },

    divider: {
      height: 1,
      backgroundColor:
        colors.border,
      marginVertical: 10,
    },

    saveButton: {
      minHeight: 54,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 12,
      backgroundColor:
        colors.primary,
      marginTop: 4,
    },

    saveButtonText: {
      color: '#08110B',
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 0.7,
    },

    disabledButton: {
      opacity: 0.5,
    },

    errorBox: {
      padding: 12,
      borderRadius: 10,
      backgroundColor:
        'rgba(248, 113, 113, 0.12)',
      borderWidth: 1,
      borderColor:
        colors.danger,
      marginBottom: 14,
    },

    errorText: {
      color: colors.danger,
      fontSize: 14,
      lineHeight: 20,
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor:
        'rgba(0, 0, 0, 0.72)',
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

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 4,
    },

    modalTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
    },

    modalCloseButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 10,
      backgroundColor:
        colors.surfaceSecondary,
    },

    searchSectionTitle: {
      color:
        colors.textSecondary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginTop: 18,
      marginBottom: 8,
    },

    searchInputContainer: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
    },

    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      paddingVertical: 10,
      outlineStyle: 'none',
    } as any,

    searchHint: {
      color:
        colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 14,
      marginBottom: 6,
    },

    searchLoading: {
      minHeight: 90,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 10,
    },

    searchLoadingText: {
      color:
        colors.textSecondary,
      fontSize: 13,
    },

    searchResults: {
      gap: 8,
    },

    foodResultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 12,
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 11,
      padding: 12,
    },

    foodResultMain: {
      flex: 1,
    },

    foodResultName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },

    foodResultServing: {
      color:
        colors.textSecondary,
      fontSize: 12,
      marginTop: 3,
    },

    foodResultMacros: {
      color:
        colors.textSecondary,
      fontSize: 11,
      marginTop: 5,
    },

    foodResultRight: {
      minWidth: 48,
      alignItems: 'center',
    },

    foodResultCalories: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },

    foodResultCalLabel: {
      color:
        colors.textSecondary,
      fontSize: 10,
      marginBottom: 5,
    },

    noSearchResults: {
      minHeight: 125,
      alignItems: 'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 11,
      padding: 16,
      backgroundColor:
        colors.surfaceSecondary,
    },

    noSearchResultsTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      marginTop: 7,
    },

    noSearchResultsText: {
      color:
        colors.textSecondary,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 4,
    },

    orRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginVertical: 18,
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
      fontSize: 11,
      fontWeight: '800',
    },

    customIngredientButton: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
      borderWidth: 1,
      borderColor:
        colors.primary,
      borderRadius: 10,
    },

    customIngredientButtonText: {
      color:
        colors.primary,
      fontSize: 14,
      fontWeight: '800',
    },

    backToSearchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf:
        'flex-start',
      gap: 2,
      marginTop: 12,
      marginBottom: 4,
    },

    backToSearchText: {
      color:
        colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },

    helperText: {
      color:
        colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 7,
    },

    twoColumnRow: {
      flexDirection: 'row',
      gap: 10,
    },

    column: {
      flex: 1,
    },

    saveIngredientButton: {
      minHeight: 50,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 10,
      backgroundColor:
        colors.primary,
      marginTop: 20,
    },

    saveIngredientButtonText: {
      color: '#08110B',
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    pressed: {
      opacity: 0.7,
    },
  });