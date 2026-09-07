import {
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

import {
  borderRadius,
  colors,
  fontSize,
  spacing,
} from '../../constants/theme';

import {
  MealType,
  useFood,
} from '../../context/FoodContext';

import { supabase } from '../../lib/supabase';

type SavedFood = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
};

type FavoriteFood = SavedFood & {
  id: string;
};

const mealOptions: MealType[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

function roundNutrition(
  value: number
) {
  return Math.round(
    value * 10
  ) / 10;
}

function scaleServingText(
  serving: string,
  multiplier: number
) {
  const trimmed =
    serving.trim();

  if (
    !trimmed ||
    multiplier === 1
  ) {
    return trimmed;
  }

  const match =
    trimmed.match(
      /^(\d+(?:\.\d+)?)\s*(.*)$/
    );

  if (!match) {
    return `${multiplier} × ${trimmed}`;
  }

  const amount =
    Number(match[1]);

  const unit =
    match[2].trim();

  if (
    !Number.isFinite(amount)
  ) {
    return `${multiplier} × ${trimmed}`;
  }

  const scaledAmount =
    roundNutrition(
      amount * multiplier
    );

  return unit
    ? `${scaledAmount}${unit.startsWith(
        ' '
      )
        ? ''
        : ' '}${unit}`
    : String(
        scaledAmount
      );
}

export default function AddFoodScreen() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{
      id?: string;
    }>();

  const {
    foodEntries,
    addFoodEntry,
    updateFoodEntry,
  } = useFood();

  const editingEntry = id
    ? foodEntries.find(
        (entry) =>
          entry.id === id
      )
    : undefined;

  const isEditing =
    Boolean(editingEntry);

  const [
    selectedMeal,
    setSelectedMeal,
  ] =
    useState<MealType | null>(
      null
    );

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
    servingMultiplier,
    setServingMultiplier,
  ] = useState('1');

  const [
    savedFoods,
    setSavedFoods,
  ] = useState<SavedFood[]>(
    []
  );

  const [
    favoriteFoods,
    setFavoriteFoods,
  ] = useState<
    FavoriteFood[]
  >([]);

  const [
    foodHistoryLoading,
    setFoodHistoryLoading,
  ] = useState(false);

  const [
    favoritesLoading,
    setFavoritesLoading,
  ] = useState(false);

  const [
    favoriteSaving,
    setFavoriteSaving,
  ] = useState(false);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [
    showFoodHistory,
    setShowFoodHistory,
  ] = useState(false);

  const [
    quickAddFood,
    setQuickAddFood,
  ] = useState<
    SavedFood | null
  >(null);

  const [
    quickAddMultiplier,
    setQuickAddMultiplier,
  ] = useState('1');

  const [
    quickAdding,
    setQuickAdding,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    validationError,
    setValidationError,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!editingEntry) {
      return;
    }

    setFoodName(
      editingEntry.name
    );

    setCalories(
      String(
        editingEntry.calories
      )
    );

    setProtein(
      String(
        editingEntry.protein
      )
    );

    setCarbs(
      String(
        editingEntry.carbs
      )
    );

    setFat(
      String(
        editingEntry.fat
      )
    );

    setServing(
      editingEntry.serving
    );

    setSelectedMeal(
      editingEntry.meal
    );

    setServingMultiplier(
      '1'
    );
  }, [editingEntry]);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    loadFoodHistory();
    loadFavoriteFoods();
  }, [isEditing]);

  const recentFoods =
    useMemo(
      () =>
        savedFoods.slice(
          0,
          6
        ),
      [savedFoods]
    );

  const filteredFoods =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return savedFoods;
      }

      return savedFoods.filter(
        (food) => {
          const searchableText =
            [
              food.name,
              food.serving,
            ]
              .join(' ')
              .toLowerCase();

          return searchableText.includes(
            query
          );
        }
      );
    }, [
      savedFoods,
      searchQuery,
    ]);

  const matchingFavorite =
    useMemo(() => {
      const normalizedName =
        foodName
          .trim()
          .toLowerCase();

      const normalizedServing =
        serving
          .trim()
          .toLowerCase();

      if (!normalizedName) {
        return undefined;
      }

      return favoriteFoods.find(
        (food) =>
          food.name
            .trim()
            .toLowerCase() ===
            normalizedName &&
          food.serving
            .trim()
            .toLowerCase() ===
            normalizedServing
      );
    }, [
      favoriteFoods,
      foodName,
      serving,
    ]);

  const multiplier =
    useMemo(() => {
      const parsed =
        Number(
          servingMultiplier
        );

      if (
        !Number.isFinite(
          parsed
        ) ||
        parsed <= 0
      ) {
        return 0;
      }

      return parsed;
    }, [
      servingMultiplier,
    ]);

  const scaledNutrition =
    useMemo(
      () => ({
        calories:
          roundNutrition(
            (Number(
              calories
            ) || 0) *
              multiplier
          ),

        protein:
          roundNutrition(
            (Number(
              protein
            ) || 0) *
              multiplier
          ),

        carbs:
          roundNutrition(
            (Number(
              carbs
            ) || 0) *
              multiplier
          ),

        fat:
          roundNutrition(
            (Number(fat) ||
              0) *
              multiplier
          ),

        serving:
          scaleServingText(
            serving,
            multiplier
          ),
      }),
      [
        calories,
        protein,
        carbs,
        fat,
        serving,
        multiplier,
      ]
    );

  const quickMultiplier =
    useMemo(() => {
      const parsed =
        Number(
          quickAddMultiplier
        );

      if (
        !Number.isFinite(
          parsed
        ) ||
        parsed <= 0
      ) {
        return 0;
      }

      return parsed;
    }, [
      quickAddMultiplier,
    ]);

  const quickScaledNutrition =
    useMemo(() => {
      if (!quickAddFood) {
        return null;
      }

      return {
        calories:
          roundNutrition(
            quickAddFood.calories *
              quickMultiplier
          ),

        protein:
          roundNutrition(
            quickAddFood.protein *
              quickMultiplier
          ),

        carbs:
          roundNutrition(
            quickAddFood.carbs *
              quickMultiplier
          ),

        fat:
          roundNutrition(
            quickAddFood.fat *
              quickMultiplier
          ),

        serving:
          scaleServingText(
            quickAddFood.serving,
            quickMultiplier
          ),
      };
    }, [
      quickAddFood,
      quickMultiplier,
    ]);

  async function getUserId() {
    const {
      data: { session },
      error,
    } =
      await supabase.auth.getSession();

    if (error) {
      console.error(
        'Unable to get current user:',
        error
      );

      return null;
    }

    return (
      session?.user?.id ??
      null
    );
  }

  async function loadFavoriteFoods() {
    setFavoritesLoading(
      true
    );

    const userId =
      await getUserId();

    if (!userId) {
      setFavoriteFoods([]);

      setFavoritesLoading(
        false
      );

      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from('favorite_foods')
      .select(
        'id, name, calories, protein, carbs, fat, serving'
      )
      .eq(
        'user_id',
        userId
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        'Error loading favorite foods:',
        error
      );

      setFavoriteFoods([]);

      setFavoritesLoading(
        false
      );

      return;
    }

    const favorites:
      FavoriteFood[] = (
      data ?? []
    ).map((item) => ({
      id: String(item.id),

      name: String(
        item.name ?? ''
      ).trim(),

      calories:
        Number(
          item.calories
        ) || 0,

      protein:
        Number(
          item.protein
        ) || 0,

      carbs:
        Number(
          item.carbs
        ) || 0,

      fat:
        Number(
          item.fat
        ) || 0,

      serving:
        String(
          item.serving ?? ''
        ).trim(),
    }));

    setFavoriteFoods(
      favorites.filter(
        (food) =>
          Boolean(food.name)
      )
    );

    setFavoritesLoading(
      false
    );
  }

  async function loadFoodHistory() {
    setFoodHistoryLoading(
      true
    );

    const userId =
      await getUserId();

    if (!userId) {
      setSavedFoods([]);

      setFoodHistoryLoading(
        false
      );

      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from('food_entries')
      .select(
        'name, calories, protein, carbs, fat, serving, created_at'
      )
      .eq(
        'user_id',
        userId
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )
      .limit(250);

    if (error) {
      console.error(
        'Error loading food history:',
        error
      );

      setSavedFoods([]);

      setFoodHistoryLoading(
        false
      );

      return;
    }

    const uniqueFoods:
      SavedFood[] = [];

    const seen =
      new Set<string>();

    for (
      const item of
        data ?? []
    ) {
      const name =
        String(
          item.name ?? ''
        ).trim();

      const servingValue =
        String(
          item.serving ?? ''
        ).trim();

      if (!name) {
        continue;
      }

      const key = [
        name.toLowerCase(),
        servingValue.toLowerCase(),
      ].join('|');

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      uniqueFoods.push({
        name,

        calories:
          Number(
            item.calories
          ) || 0,

        protein:
          Number(
            item.protein
          ) || 0,

        carbs:
          Number(
            item.carbs
          ) || 0,

        fat:
          Number(
            item.fat
          ) || 0,

        serving:
          servingValue,
      });
    }

    setSavedFoods(
      uniqueFoods
    );

    setFoodHistoryLoading(
      false
    );
  }

  function selectSavedFood(
    food: SavedFood
  ) {
    setFoodName(
      food.name
    );

    setCalories(
      String(
        food.calories
      )
    );

    setProtein(
      String(
        food.protein
      )
    );

    setCarbs(
      String(
        food.carbs
      )
    );

    setFat(
      String(
        food.fat
      )
    );

    setServing(
      food.serving
    );

    setServingMultiplier(
      '1'
    );

    setValidationError(
      null
    );

    setShowFoodHistory(
      false
    );

    setSearchQuery('');
  }

  function openQuickAdd(
    food: SavedFood
  ) {
    if (quickAdding) {
      return;
    }

    setQuickAddFood(
      food
    );

    setQuickAddMultiplier(
      '1'
    );

    setValidationError(
      null
    );
  }

  function closeQuickAdd() {
    if (quickAdding) {
      return;
    }

    setQuickAddFood(
      null
    );

    setQuickAddMultiplier(
      '1'
    );
  }

  async function handleQuickAdd(
    meal: MealType
  ) {
    if (
      !quickAddFood ||
      !quickScaledNutrition ||
      quickAdding
    ) {
      return;
    }

    if (
      quickMultiplier <= 0
    ) {
      return;
    }

    setQuickAdding(true);

    const success =
      await addFoodEntry({
        name:
          quickAddFood.name,

        calories:
          quickScaledNutrition.calories,

        protein:
          quickScaledNutrition.protein,

        carbs:
          quickScaledNutrition.carbs,

        fat:
          quickScaledNutrition.fat,

        serving:
          quickScaledNutrition.serving,

        meal,
      });

    setQuickAdding(false);

    if (!success) {
      setQuickAddFood(
        null
      );

      setValidationError(
        'Apollo could not add this food. Please try again.'
      );

      return;
    }

    setQuickAddFood(
      null
    );

    setQuickAddMultiplier(
      '1'
    );

    router.replace(
      '/(tabs)/food'
    );
  }

  async function handleToggleFavorite() {
    if (
      favoriteSaving ||
      isEditing
    ) {
      return;
    }

    const trimmedName =
      foodName.trim();

    if (!trimmedName) {
      setValidationError(
        'Enter a food name before saving it as a favorite.'
      );

      return;
    }

    setFavoriteSaving(
      true
    );

    setValidationError(
      null
    );

    const userId =
      await getUserId();

    if (!userId) {
      setFavoriteSaving(
        false
      );

      setValidationError(
        'Apollo could not access your account. Please try again.'
      );

      return;
    }

    if (matchingFavorite) {
      const { error } =
        await supabase
          .from(
            'favorite_foods'
          )
          .delete()
          .eq(
            'id',
            matchingFavorite.id
          )
          .eq(
            'user_id',
            userId
          );

      if (error) {
        console.error(
          'Error removing favorite food:',
          error
        );

        setValidationError(
          'Apollo could not remove this favorite. Please try again.'
        );

        setFavoriteSaving(
          false
        );

        return;
      }

      setFavoriteFoods(
        (current) =>
          current.filter(
            (food) =>
              food.id !==
              matchingFavorite.id
          )
      );

      setFavoriteSaving(
        false
      );

      return;
    }

    const favoriteData = {
      user_id: userId,

      name: trimmedName,

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
        Number(fat) || 0,

      serving:
        serving.trim(),
    };

    const {
      data,
      error,
    } = await supabase
      .from('favorite_foods')
      .insert(favoriteData)
      .select(
        'id, name, calories, protein, carbs, fat, serving'
      )
      .single();

    if (error || !data) {
      console.error(
        'Error saving favorite food:',
        error
      );

      setValidationError(
        'Apollo could not save this favorite. Please try again.'
      );

      setFavoriteSaving(
        false
      );

      return;
    }

    const newFavorite:
      FavoriteFood = {
      id: String(data.id),

      name: String(
        data.name ?? ''
      ).trim(),

      calories:
        Number(
          data.calories
        ) || 0,

      protein:
        Number(
          data.protein
        ) || 0,

      carbs:
        Number(
          data.carbs
        ) || 0,

      fat:
        Number(
          data.fat
        ) || 0,

      serving:
        String(
          data.serving ?? ''
        ).trim(),
    };

    setFavoriteFoods(
      (current) => [
        newFavorite,
        ...current,
      ]
    );

    setFavoriteSaving(
      false
    );
  }

  async function removeFavorite(
    favorite: FavoriteFood
  ) {
    if (favoriteSaving) {
      return;
    }

    setFavoriteSaving(
      true
    );

    const userId =
      await getUserId();

    if (!userId) {
      setFavoriteSaving(
        false
      );

      return;
    }

    const { error } =
      await supabase
        .from('favorite_foods')
        .delete()
        .eq(
          'id',
          favorite.id
        )
        .eq(
          'user_id',
          userId
        );

    if (error) {
      console.error(
        'Error removing favorite food:',
        error
      );

      setValidationError(
        'Apollo could not remove this favorite. Please try again.'
      );

      setFavoriteSaving(
        false
      );

      return;
    }

    setFavoriteFoods(
      (current) =>
        current.filter(
          (food) =>
            food.id !==
            favorite.id
        )
    );

    setFavoriteSaving(
      false
    );
  }

  function selectMeal(
    meal: MealType
  ) {
    setSelectedMeal(meal);

    setValidationError(
      null
    );
  }

  async function handleSaveFood() {
    if (saving) {
      return;
    }

    if (!foodName.trim()) {
      setValidationError(
        'Please enter a food name.'
      );

      return;
    }

    if (
      multiplier <= 0
    ) {
      setValidationError(
        'Please enter a serving amount greater than 0.'
      );

      return;
    }

    if (!selectedMeal) {
      setValidationError(
        'Please select a meal before adding this food.'
      );

      return;
    }

    setValidationError(null);
    setSaving(true);

    const foodData = {
      name:
        foodName.trim(),

      calories:
        scaledNutrition.calories,

      protein:
        scaledNutrition.protein,

      carbs:
        scaledNutrition.carbs,

      fat:
        scaledNutrition.fat,

      serving:
        scaledNutrition.serving,

      meal: selectedMeal,
    };

    let success = false;

    if (
      isEditing &&
      id
    ) {
      success =
        await updateFoodEntry(
          id,
          foodData
        );
    } else {
      success =
        await addFoodEntry(
          foodData
        );
    }

    setSaving(false);

    if (!success) {
      setValidationError(
        'Apollo could not save this food. Please try again.'
      );

      return;
    }

    router.replace(
      '/(tabs)/food'
    );
  }

  function handleCancel() {
    router.replace(
      '/(tabs)/food'
    );
  }

  function FoodActions({
    food,
  }: {
    food: SavedFood;
  }) {
    return (
      <View
        style={
          styles.foodActions
        }
      >
        <Pressable
          onPress={() =>
            selectSavedFood(
              food
            )
          }
        >
          <Text
            style={
              styles.useButtonText
            }
          >
            Use
          </Text>
        </Pressable>

        <Pressable
          style={
            styles.quickAddButton
          }
          onPress={() =>
            openQuickAdd(
              food
            )
          }
        >
          <Text
            style={
              styles.quickAddButtonText
            }
          >
            + Quick Add
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
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
          styles.container
        }
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={styles.header}
        >
          <Pressable
            onPress={
              handleCancel
            }
          >
            <Text
              style={
                styles.backButton
              }
            >
              ‹ Back
            </Text>
          </Pressable>

          <Text
            style={
              styles.screenTitle
            }
          >
            {isEditing
              ? 'Edit Food'
              : 'Add Food'}
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            {isEditing
              ? 'Update the nutrition information for this food.'
              : 'Choose a favorite, reuse a previous food, or enter nutrition information manually.'}
          </Text>
        </View>

        {!isEditing && (
          <>
            <View
              style={
                styles.section
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                FAVORITES
              </Text>

              {favoritesLoading ? (
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
                    Loading favorites...
                  </Text>
                </View>
              ) : favoriteFoods.length >
                0 ? (
                <View
                  style={
                    styles.foodList
                  }
                >
                  {favoriteFoods.map(
                    (food) => (
                      <View
                        key={
                          food.id
                        }
                        style={
                          styles.favoriteFoodCard
                        }
                      >
                        <View
                          style={
                            styles.foodCardTop
                          }
                        >
                          <View
                            style={
                              styles.foodInfo
                            }
                          >
                            <View
                              style={
                                styles.favoriteNameRow
                              }
                            >
                              <Text
                                style={
                                  styles.favoriteStar
                                }
                              >
                                ★
                              </Text>

                              <Text
                                style={
                                  styles.foodName
                                }
                              >
                                {
                                  food.name
                                }
                              </Text>
                            </View>

                            <Text
                              style={
                                styles.foodDetails
                              }
                            >
                              {food.serving
                                ? `${food.serving} • `
                                : ''}
                              {
                                food.calories
                              }{' '}
                              cal
                            </Text>
                          </View>

                          <FoodActions
                            food={
                              food
                            }
                          />
                        </View>

                        <Pressable
                          style={
                            styles.removeFavoriteButton
                          }
                          onPress={() =>
                            removeFavorite(
                              food
                            )
                          }
                          disabled={
                            favoriteSaving
                          }
                        >
                          <Text
                            style={
                              styles.removeFavoriteText
                            }
                          >
                            Remove Favorite
                          </Text>
                        </Pressable>
                      </View>
                    )
                  )}
                </View>
              ) : (
                <Text
                  style={
                    styles.secondaryText
                  }
                >
                  Save foods you eat
                  often for faster
                  logging.
                </Text>
              )}
            </View>

            <View
              style={
                styles.section
              }
            >
              <View
                style={
                  styles.sectionTitleRow
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  RECENT FOODS
                </Text>

                {savedFoods.length >
                  6 && (
                  <Pressable
                    onPress={() => {
                      setShowFoodHistory(
                        !showFoodHistory
                      );

                      setSearchQuery(
                        ''
                      );
                    }}
                  >
                    <Text
                      style={
                        styles.historyToggle
                      }
                    >
                      {showFoodHistory
                        ? 'Hide History'
                        : 'Search History'}
                    </Text>
                  </Pressable>
                )}
              </View>

              {foodHistoryLoading ? (
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
                    Loading foods...
                  </Text>
                </View>
              ) : recentFoods.length >
                0 ? (
                <View
                  style={
                    styles.foodList
                  }
                >
                  {recentFoods.map(
                    (
                      food,
                      index
                    ) => (
                      <View
                        key={`${food.name}-${food.serving}-${index}`}
                        style={
                          styles.foodCard
                        }
                      >
                        <View
                          style={
                            styles.foodInfo
                          }
                        >
                          <Text
                            style={
                              styles.foodName
                            }
                          >
                            {
                              food.name
                            }
                          </Text>

                          <Text
                            style={
                              styles.foodDetails
                            }
                          >
                            {food.serving
                              ? `${food.serving} • `
                              : ''}
                            {
                              food.calories
                            }{' '}
                            cal
                          </Text>
                        </View>

                        <FoodActions
                          food={
                            food
                          }
                        />
                      </View>
                    )
                  )}
                </View>
              ) : (
                <Text
                  style={
                    styles.secondaryText
                  }
                >
                  Foods you log will
                  appear here for
                  faster entry.
                </Text>
              )}
            </View>

            {showFoodHistory && (
              <View
                style={
                  styles.historySection
                }
              >
                <View>
                  <Text
                    style={
                      styles.historyTitle
                    }
                  >
                    Food History
                  </Text>

                  <Text
                    style={
                      styles.historySubtitle
                    }
                  >
                    {
                      savedFoods.length
                    }{' '}
                    saved{' '}
                    {savedFoods.length ===
                    1
                      ? 'food'
                      : 'foods'}
                  </Text>
                </View>

                <TextInput
                  style={
                    styles.searchInput
                  }
                  placeholder="Search chicken, rice, yogurt..."
                  placeholderTextColor={
                    colors.textSecondary
                  }
                  value={
                    searchQuery
                  }
                  onChangeText={
                    setSearchQuery
                  }
                  autoCapitalize="none"
                  autoCorrect={
                    false
                  }
                />

                {filteredFoods.length >
                0 ? (
                  <View
                    style={
                      styles.foodList
                    }
                  >
                    {filteredFoods.map(
                      (
                        food,
                        index
                      ) => (
                        <View
                          key={`history-${food.name}-${food.serving}-${index}`}
                          style={
                            styles.historyFood
                          }
                        >
                          <View
                            style={
                              styles.foodCardTop
                            }
                          >
                            <View
                              style={
                                styles.foodInfo
                              }
                            >
                              <Text
                                style={
                                  styles.foodName
                                }
                              >
                                {
                                  food.name
                                }
                              </Text>

                              <Text
                                style={
                                  styles.foodDetails
                                }
                              >
                                {food.serving
                                  ? `${food.serving} • `
                                  : ''}
                                {
                                  food.calories
                                }{' '}
                                cal
                              </Text>
                            </View>

                            <FoodActions
                              food={
                                food
                              }
                            />
                          </View>

                          <View
                            style={
                              styles.historyMacros
                            }
                          >
                            <Text
                              style={
                                styles.historyMacroText
                              }
                            >
                              P{' '}
                              {
                                food.protein
                              }
                              g
                            </Text>

                            <Text
                              style={
                                styles.historyMacroText
                              }
                            >
                              C{' '}
                              {
                                food.carbs
                              }
                              g
                            </Text>

                            <Text
                              style={
                                styles.historyMacroText
                              }
                            >
                              F{' '}
                              {
                                food.fat
                              }
                              g
                            </Text>
                          </View>
                        </View>
                      )
                    )}
                  </View>
                ) : (
                  <View
                    style={
                      styles.noResultsBox
                    }
                  >
                    <Text
                      style={
                        styles.noResultsTitle
                      }
                    >
                      No foods found
                    </Text>

                    <Text
                      style={
                        styles.secondaryText
                      }
                    >
                      Try a different
                      search.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        <View
          style={styles.section}
        >
          <View
            style={
              styles.foodNameLabelRow
            }
          >
            <Text
              style={styles.label}
            >
              FOOD NAME
            </Text>

            {!isEditing && (
              <Pressable
                style={[
                  styles.favoriteButton,

                  matchingFavorite &&
                    styles.favoriteButtonActive,

                  favoriteSaving &&
                    styles.disabled,
                ]}
                onPress={
                  handleToggleFavorite
                }
                disabled={
                  favoriteSaving
                }
              >
                <Text
                  style={[
                    styles.favoriteButtonText,

                    matchingFavorite &&
                      styles.favoriteButtonTextActive,
                  ]}
                >
                  {favoriteSaving
                    ? 'Saving...'
                    : matchingFavorite
                      ? '★ Favorited'
                      : '☆ Favorite'}
                </Text>
              </Pressable>
            )}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Example: Grilled Chicken"
            placeholderTextColor={
              colors.textSecondary
            }
            value={foodName}
            onChangeText={(
              value
            ) => {
              setFoodName(value);

              setValidationError(
                null
              );
            }}
          />
        </View>

        <View
          style={styles.section}
        >
          <Text
            style={styles.label}
          >
            CALORIES PER SERVING
          </Text>

          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={
              colors.textSecondary
            }
            keyboardType="decimal-pad"
            value={calories}
            onChangeText={
              setCalories
            }
          />
        </View>

        <View
          style={styles.macroRow}
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
              placeholder="0g"
              placeholderTextColor={
                colors.textSecondary
              }
              keyboardType="decimal-pad"
              value={protein}
              onChangeText={
                setProtein
              }
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
              placeholder="0g"
              placeholderTextColor={
                colors.textSecondary
              }
              keyboardType="decimal-pad"
              value={carbs}
              onChangeText={
                setCarbs
              }
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
              placeholder="0g"
              placeholderTextColor={
                colors.textSecondary
              }
              keyboardType="decimal-pad"
              value={fat}
              onChangeText={
                setFat
              }
            />
          </View>
        </View>

        <View
          style={styles.section}
        >
          <Text
            style={styles.label}
          >
            BASE SERVING
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Example: 100g"
            placeholderTextColor={
              colors.textSecondary
            }
            value={serving}
            onChangeText={
              setServing
            }
          />

          <Text
            style={
              styles.helperText
            }
          >
            Nutrition above is for
            one base serving.
          </Text>
        </View>

        <View
          style={styles.section}
        >
          <Text
            style={styles.label}
          >
            SERVINGS EATEN
          </Text>

          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor={
              colors.textSecondary
            }
            keyboardType="decimal-pad"
            value={
              servingMultiplier
            }
            onChangeText={(
              value
            ) => {
              setServingMultiplier(
                value
              );

              setValidationError(
                null
              );
            }}
          />

          {multiplier > 0 && (
            <View
              style={
                styles.scaledPreview
              }
            >
              <View
                style={
                  styles.previewHeader
                }
              >
                <Text
                  style={
                    styles.previewTitle
                  }
                >
                  LOGGED NUTRITION
                </Text>

                <Text
                  style={
                    styles.previewServing
                  }
                >
                  {scaledNutrition.serving ||
                    `${multiplier} serving${multiplier ===
                    1
                      ? ''
                      : 's'}`}
                </Text>
              </View>

              <Text
                style={
                  styles.previewCalories
                }
              >
                {
                  scaledNutrition.calories
                }{' '}
                cal
              </Text>

              <View
                style={
                  styles.previewMacroRow
                }
              >
                <Text
                  style={
                    styles.previewMacro
                  }
                >
                  P{' '}
                  {
                    scaledNutrition.protein
                  }
                  g
                </Text>

                <Text
                  style={
                    styles.previewMacro
                  }
                >
                  C{' '}
                  {
                    scaledNutrition.carbs
                  }
                  g
                </Text>

                <Text
                  style={
                    styles.previewMacro
                  }
                >
                  F{' '}
                  {
                    scaledNutrition.fat
                  }
                  g
                </Text>
              </View>
            </View>
          )}
        </View>

        <View
          style={styles.section}
        >
          <View
            style={
              styles.mealLabelRow
            }
          >
            <Text
              style={styles.label}
            >
              MEAL
            </Text>

            {!selectedMeal && (
              <Text
                style={
                  styles.requiredText
                }
              >
                REQUIRED
              </Text>
            )}
          </View>

          <Text
            style={
              styles.mealHelper
            }
          >
            Choose where this food
            should appear.
          </Text>

          <View
            style={styles.mealRow}
          >
            {mealOptions.map(
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
                      selectMeal(
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

        {validationError && (
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
              {validationError}
            </Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,

            saving &&
              styles.disabled,

            pressed &&
              !saving &&
              styles.pressed,
          ]}
          onPress={
            handleSaveFood
          }
          disabled={saving}
        >
          <Text
            style={
              styles.saveButtonText
            }
          >
            {saving
              ? 'Saving...'
              : isEditing
                ? 'Save Changes'
                : 'Add Food'}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={
          Boolean(
            quickAddFood
          )
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeQuickAdd
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
              QUICK ADD
            </Text>

            <Text
              style={
                styles.modalTitle
              }
            >
              {quickAddFood?.name}
            </Text>

            <Text
              style={
                styles.modalDetails
              }
            >
              Base:{' '}
              {quickAddFood?.serving ||
                '1 serving'}{' '}
              •{' '}
              {
                quickAddFood?.calories
              }{' '}
              cal
            </Text>

            <View
              style={
                styles.quickServingSection
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
                  styles.input
                }
                placeholder="1"
                placeholderTextColor={
                  colors.textSecondary
                }
                keyboardType="decimal-pad"
                value={
                  quickAddMultiplier
                }
                onChangeText={
                  setQuickAddMultiplier
                }
              />

              {quickScaledNutrition &&
                quickMultiplier >
                  0 && (
                  <View
                    style={
                      styles.quickPreview
                    }
                  >
                    <Text
                      style={
                        styles.quickPreviewServing
                      }
                    >
                      {quickScaledNutrition.serving ||
                        `${quickMultiplier} serving${quickMultiplier ===
                        1
                          ? ''
                          : 's'}`}
                    </Text>

                    <Text
                      style={
                        styles.quickPreviewCalories
                      }
                    >
                      {
                        quickScaledNutrition.calories
                      }{' '}
                      cal
                    </Text>

                    <Text
                      style={
                        styles.quickPreviewMacros
                      }
                    >
                      P{' '}
                      {
                        quickScaledNutrition.protein
                      }
                      g · C{' '}
                      {
                        quickScaledNutrition.carbs
                      }
                      g · F{' '}
                      {
                        quickScaledNutrition.fat
                      }
                      g
                    </Text>
                  </View>
                )}
            </View>

            <Text
              style={
                styles.modalPrompt
              }
            >
              Add this food to which
              meal?
            </Text>

            <View
              style={
                styles.modalMealList
              }
            >
              {mealOptions.map(
                (meal) => (
                  <Pressable
                    key={meal}
                    style={({
                      pressed,
                    }) => [
                      styles.modalMealButton,

                      pressed &&
                        !quickAdding &&
                        quickMultiplier >
                          0 &&
                        styles.pressed,

                      (quickAdding ||
                        quickMultiplier <=
                          0) &&
                        styles.disabled,
                    ]}
                    onPress={() =>
                      handleQuickAdd(
                        meal
                      )
                    }
                    disabled={
                      quickAdding ||
                      quickMultiplier <=
                        0
                    }
                  >
                    <Text
                      style={
                        styles.modalMealButtonText
                      }
                    >
                      {quickAdding
                        ? 'Adding...'
                        : meal}
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            <Pressable
              style={
                styles.modalCancel
              }
              onPress={
                closeQuickAdd
              }
              disabled={
                quickAdding
              }
            >
              <Text
                style={
                  styles.modalCancelText
                }
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
      gap: spacing.lg,
    },

    header: {
      gap: spacing.xs,
    },

    backButton: {
      color: colors.primary,
      fontSize:
        fontSize.body,
      fontWeight: '600',
      marginBottom:
        spacing.md,
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
      lineHeight: 22,
    },

    section: {
      gap: spacing.sm,
    },

    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: spacing.md,
    },

    foodNameLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: spacing.md,
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
        colors.surface,
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

    helperText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
    },

    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    secondaryText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
    },

    foodList: {
      gap: spacing.sm,
    },

    foodCard: {
      backgroundColor:
        colors.surface,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius:
        borderRadius.md,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: spacing.md,
    },

    favoriteFoodCard: {
      backgroundColor:
        colors.surface,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius:
        borderRadius.md,
      overflow: 'hidden',
    },

    foodCardTop: {
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: spacing.md,
    },

    foodInfo: {
      flex: 1,
      gap: spacing.xs,
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
    },

    favoriteNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    favoriteStar: {
      color: colors.warning,
      fontSize:
        fontSize.body,
      fontWeight: '700',
    },

    foodActions: {
      alignItems:
        'flex-end',
      gap: spacing.sm,
    },

    useButtonText: {
      color: colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
    },

    quickAddButton: {
      backgroundColor:
        colors.primary,
      borderRadius:
        borderRadius.sm,
      paddingHorizontal:
        spacing.sm,
      paddingVertical:
        spacing.xs,
    },

    quickAddButtonText: {
      color:
        colors.background,
      fontSize:
        fontSize.small,
      fontWeight: '700',
    },

    removeFavoriteButton: {
      borderTopColor:
        colors.border,
      borderTopWidth: 1,
      paddingHorizontal:
        spacing.md,
      paddingVertical:
        spacing.sm,
      alignItems:
        'flex-end',
    },

    removeFavoriteText: {
      color: colors.danger,
      fontSize:
        fontSize.small,
      fontWeight: '700',
    },

    favoriteButton: {
      borderColor:
        colors.primary,
      borderWidth: 1,
      borderRadius:
        borderRadius.md,
      paddingHorizontal:
        spacing.sm,
      paddingVertical:
        spacing.xs,
    },

    favoriteButtonActive: {
      backgroundColor:
        colors.primary,
    },

    favoriteButtonText: {
      color: colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
    },

    favoriteButtonTextActive: {
      color:
        colors.background,
    },

    historyToggle: {
      color: colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
    },

    historySection: {
      backgroundColor:
        colors.surface,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius:
        borderRadius.lg,
      padding: spacing.md,
      gap: spacing.md,
    },

    historyTitle: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    historySubtitle: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      marginTop:
        spacing.xs,
    },

    searchInput: {
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

    historyFood: {
      backgroundColor:
        colors.surfaceSecondary,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius:
        borderRadius.md,
      padding: spacing.md,
      gap: spacing.sm,
    },

    historyMacros: {
      flexDirection: 'row',
      gap: spacing.md,
    },

    historyMacroText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '600',
    },

    noResultsBox: {
      alignItems: 'center',
      paddingVertical:
        spacing.lg,
      gap: spacing.xs,
    },

    noResultsTitle: {
      color: colors.text,
      fontSize:
        fontSize.body,
      fontWeight: '600',
    },

    macroRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },

    macroInput: {
      flex: 1,
      gap: spacing.sm,
    },

    scaledPreview: {
      backgroundColor:
        colors.surface,
      borderColor:
        colors.primary,
      borderWidth: 1,
      borderRadius:
        borderRadius.md,
      padding: spacing.md,
      gap: spacing.sm,
    },

    previewHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      gap: spacing.md,
    },

    previewTitle: {
      color: colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 1,
    },

    previewServing: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      flexShrink: 1,
      textAlign: 'right',
    },

    previewCalories: {
      color: colors.text,
      fontSize:
        fontSize.title,
      fontWeight: '700',
    },

    previewMacroRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },

    previewMacro: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '600',
    },

    mealLabelRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    requiredText: {
      color: colors.warning,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 1,
    },

    mealHelper: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
    },

    mealRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },

    mealButton: {
      backgroundColor:
        colors.surface,
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
      fontWeight: '500',
    },

    mealButtonTextSelected: {
      color:
        colors.background,
      fontWeight: '700',
    },

    errorBox: {
      backgroundColor:
        colors.surface,
      borderColor:
        colors.danger,
      borderWidth: 1,
      borderRadius:
        borderRadius.md,
      padding: spacing.md,
    },

    errorText: {
      color: colors.danger,
      fontSize:
        fontSize.body,
      fontWeight: '600',
    },

    saveButton: {
      backgroundColor:
        colors.primary,
      borderRadius:
        borderRadius.md,
      padding: spacing.md,
      alignItems: 'center',
      marginTop:
        spacing.sm,
    },

    saveButtonText: {
      color:
        colors.background,
      fontSize:
        fontSize.body,
      fontWeight: '700',
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
      maxWidth: 420,
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

    modalDetails: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
    },

    modalPrompt: {
      color: colors.text,
      fontSize:
        fontSize.body,
      fontWeight: '600',
      marginTop:
        spacing.sm,
    },

    quickServingSection: {
      gap: spacing.sm,
    },

    quickPreview: {
      backgroundColor:
        colors.surfaceSecondary,
      borderRadius:
        borderRadius.md,
      padding: spacing.md,
      gap: spacing.xs,
    },

    quickPreviewServing: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
    },

    quickPreviewCalories: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    quickPreviewMacros: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '600',
    },

    modalMealList: {
      gap: spacing.sm,
    },

    modalMealButton: {
      backgroundColor:
        colors.primary,
      borderRadius:
        borderRadius.md,
      padding: spacing.md,
      alignItems: 'center',
    },

    modalMealButtonText: {
      color:
        colors.background,
      fontSize:
        fontSize.body,
      fontWeight: '700',
    },

    modalCancel: {
      padding: spacing.sm,
      alignItems: 'center',
    },

    modalCancelText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
      fontWeight: '600',
    },
  });