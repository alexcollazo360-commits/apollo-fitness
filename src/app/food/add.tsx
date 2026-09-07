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

const mealOptions: MealType[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

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
    savedFoods,
    setSavedFoods,
  ] = useState<SavedFood[]>(
    []
  );

  const [
    foodHistoryLoading,
    setFoodHistoryLoading,
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
  }, [editingEntry]);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    loadFoodHistory();
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

  async function loadFoodHistory() {
    setFoodHistoryLoading(
      true
    );

    const {
      data: { session },
      error: sessionError,
    } =
      await supabase.auth.getSession();

    if (
      sessionError ||
      !session?.user?.id
    ) {
      if (sessionError) {
        console.error(
          'Unable to load food history:',
          sessionError
        );
      }

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
        session.user.id
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

    setValidationError(
      null
    );

    setShowFoodHistory(
      false
    );

    setSearchQuery('');
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
              : 'Reuse a previous food or enter nutrition information manually.'}
          </Text>
        </View>

        {!isEditing && (
          <>
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
                      styles.recentEmpty
                    }
                  >
                    Loading foods...
                  </Text>
                </View>
              ) : recentFoods.length >
                0 ? (
                <View
                  style={
                    styles.recentList
                  }
                >
                  {recentFoods.map(
                    (
                      food,
                      index
                    ) => (
                      <Pressable
                        key={`${food.name}-${food.serving}-${index}`}
                        style={({
                          pressed,
                        }) => [
                          styles.recentFood,
                          pressed &&
                            styles.recentFoodPressed,
                        ]}
                        onPress={() =>
                          selectSavedFood(
                            food
                          )
                        }
                      >
                        <View
                          style={
                            styles.recentFoodInfo
                          }
                        >
                          <Text
                            style={
                              styles.recentFoodName
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
                              styles.recentFoodDetails
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

                        <Text
                          style={
                            styles.recentFoodAdd
                          }
                        >
                          Use
                        </Text>
                      </Pressable>
                    )
                  )}
                </View>
              ) : (
                <Text
                  style={
                    styles.recentEmpty
                  }
                >
                  Foods you log
                  will appear here
                  for faster entry.
                </Text>
              )}
            </View>

            {showFoodHistory && (
              <View
                style={
                  styles.historySection
                }
              >
                <View
                  style={
                    styles.historyHeader
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
                      styles.historyList
                    }
                  >
                    {filteredFoods.map(
                      (
                        food,
                        index
                      ) => (
                        <Pressable
                          key={`history-${food.name}-${food.serving}-${index}`}
                          style={({
                            pressed,
                          }) => [
                            styles.historyFood,
                            pressed &&
                              styles.recentFoodPressed,
                          ]}
                          onPress={() =>
                            selectSavedFood(
                              food
                            )
                          }
                        >
                          <View
                            style={
                              styles.historyFoodTop
                            }
                          >
                            <View
                              style={
                                styles.recentFoodInfo
                              }
                            >
                              <Text
                                style={
                                  styles.recentFoodName
                                }
                              >
                                {
                                  food.name
                                }
                              </Text>

                              <Text
                                style={
                                  styles.recentFoodDetails
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

                            <Text
                              style={
                                styles.recentFoodAdd
                              }
                            >
                              Use
                            </Text>
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
                        </Pressable>
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
                        styles.recentEmpty
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
          <Text
            style={styles.label}
          >
            FOOD NAME
          </Text>

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
            CALORIES
          </Text>

          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={
              colors.textSecondary
            }
            keyboardType="numeric"
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
              keyboardType="numeric"
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
              keyboardType="numeric"
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
              keyboardType="numeric"
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
            SERVING
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
              styles.saveButtonDisabled,

            pressed &&
              !saving &&
              styles.saveButtonPressed,
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

    loadingRow: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: spacing.sm,
    },

    recentList: {
      gap: spacing.sm,
    },

    recentFood: {
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

    recentFoodPressed: {
      opacity: 0.7,
    },

    recentFoodInfo: {
      flex: 1,

      gap: spacing.xs,
    },

    recentFoodName: {
      color: colors.text,

      fontSize:
        fontSize.body,

      fontWeight: '600',
    },

    recentFoodDetails: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.small,
    },

    recentFoodAdd: {
      color: colors.primary,

      fontSize:
        fontSize.body,

      fontWeight: '700',
    },

    recentEmpty: {
      color:
        colors.textSecondary,

      fontSize:
        fontSize.body,
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

    historyHeader: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems: 'center',
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

    historyList: {
      gap: spacing.sm,
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

    historyFoodTop: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      gap: spacing.md,
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

    saveButtonPressed: {
      opacity: 0.8,
    },

    saveButtonDisabled: {
      opacity: 0.5,
    },

    saveButtonText: {
      color:
        colors.background,

      fontSize:
        fontSize.body,

      fontWeight: '700',
    },
  });