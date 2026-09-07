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
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    colors,
    fontSize,
    spacing,
} from '../../constants/theme';
import { useProfile } from '../../context/ProfileContext';
import { useProgress } from '../../context/ProgressContext';

type MacroSplit = {
  protein: number;
  carbs: number;
  fat: number;
};

function getMacroSplit(
  fitnessGoal: string
): MacroSplit {
  if (fitnessGoal === 'Lose Weight') {
    return {
      protein: 0.35,
      carbs: 0.35,
      fat: 0.3,
    };
  }

  if (fitnessGoal === 'Gain Muscle') {
    return {
      protein: 0.3,
      carbs: 0.45,
      fat: 0.25,
    };
  }

  return {
    protein: 0.3,
    carbs: 0.4,
    fat: 0.3,
  };
}

export default function OnboardingTargetsScreen() {
  const router = useRouter();

  const {
    displayName,
    heightInches,
    currentWeight,
    fitnessGoal,
    goalWeight,
    activityLevel,
  } = useLocalSearchParams<{
    displayName: string;
    heightInches: string;
    currentWeight: string;
    fitnessGoal: string;
    goalWeight: string;
    activityLevel: string;
  }>();

  const {
    profile,
    loading: profileLoading,
    updateNutritionTargets,
    updatePersonalInfo,
    updateFitnessGoals,
    completeOnboarding,
  } = useProfile();

  const {
    weightEntries,
    addWeightEntry,
    updateWeightEntry,
  } = useProgress();

  const [
    calories,
    setCalories,
  ] = useState('');

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!profile) {
      return;
    }

    setCalories(
      String(
        profile.dailyCalorieTarget
      )
    );
  }, [profile]);

  const macroSplit =
    useMemo(
      () =>
        getMacroSplit(
          fitnessGoal ?? ''
        ),
      [fitnessGoal]
    );

  const calculatedMacros =
    useMemo(() => {
      const parsedCalories =
        Number(calories);

      if (
        Number.isNaN(
          parsedCalories
        ) ||
        parsedCalories <= 0
      ) {
        return {
          protein: 0,
          carbs: 0,
          fat: 0,
        };
      }

      return {
        protein: Math.round(
          (parsedCalories *
            macroSplit.protein) /
            4
        ),

        carbs: Math.round(
          (parsedCalories *
            macroSplit.carbs) /
            4
        ),

        fat: Math.round(
          (parsedCalories *
            macroSplit.fat) /
            9
        ),
      };
    }, [
      calories,
      macroSplit,
    ]);

  function getLocalDateString(
    date: Date
  ) {
    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  async function saveStartingWeight(
    weight: number
  ) {
    const today =
      getLocalDateString(
        new Date()
      );

    const todaysEntry =
      weightEntries.find(
        (entry) =>
          entry.loggedDate === today
      );

    if (todaysEntry) {
      await updateWeightEntry(
        todaysEntry.id,
        weight,
        today
      );

      return;
    }

    await addWeightEntry(
      weight,
      today
    );
  }

  async function handleFinish() {
    setError('');

    const trimmedName =
      displayName?.trim();

    const parsedCalories =
      Number(calories);

    const parsedCurrentWeight =
      Number(currentWeight);

    const parsedGoalWeight =
      Number(goalWeight);

    const parsedHeight =
      Number(heightInches);

    if (!trimmedName) {
      setError(
        'Your name is missing. Please restart onboarding.'
      );

      return;
    }

    if (
      calories.trim() === '' ||
      Number.isNaN(
        parsedCalories
      ) ||
      parsedCalories <= 0
    ) {
      setError(
        'Enter a valid calorie target.'
      );

      return;
    }

    if (
      Number.isNaN(
        parsedCurrentWeight
      ) ||
      parsedCurrentWeight <= 0 ||
      Number.isNaN(
        parsedGoalWeight
      ) ||
      parsedGoalWeight <= 0 ||
      Number.isNaN(
        parsedHeight
      ) ||
      parsedHeight <= 0
    ) {
      setError(
        'Some onboarding information is missing. Please restart onboarding.'
      );

      return;
    }

    if (
      !fitnessGoal ||
      !activityLevel
    ) {
      setError(
        'Some onboarding information is missing. Please restart onboarding.'
      );

      return;
    }

    setSaving(true);

    const personalInfoSaved =
      await updatePersonalInfo({
        displayName:
          trimmedName,
        currentWeight:
          parsedCurrentWeight,
        heightInches:
          parsedHeight,
      });

    if (!personalInfoSaved) {
      setSaving(false);

      setError(
        'We could not save your personal information.'
      );

      return;
    }

    const goalsSaved =
      await updateFitnessGoals({
        goalWeight:
          parsedGoalWeight,
        activityLevel,
        fitnessGoal,
      });

    if (!goalsSaved) {
      setSaving(false);

      setError(
        'We could not save your fitness goals.'
      );

      return;
    }

    const nutritionSaved =
      await updateNutritionTargets({
        dailyCalorieTarget:
          parsedCalories,
        proteinTarget:
          calculatedMacros.protein,
        carbTarget:
          calculatedMacros.carbs,
        fatTarget:
          calculatedMacros.fat,
      });

    if (!nutritionSaved) {
      setSaving(false);

      setError(
        'We could not save your nutrition targets.'
      );

      return;
    }

    await saveStartingWeight(
      parsedCurrentWeight
    );

    const onboardingSaved =
      await completeOnboarding();

    if (!onboardingSaved) {
      setSaving(false);

      setError(
        'Your information was saved, but Apollo could not complete setup.'
      );

      return;
    }

    setSaving(false);

    router.replace('/(tabs)');
  }

  if (profileLoading) {
    return (
      <View
        style={
          styles.loadingScreen
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
          Loading your targets...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.container
      }
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={styles.topSection}
      >
        <Text style={styles.step}>
          STEP 4 OF 4
        </Text>

        <Text style={styles.title}>
          Set your daily target
        </Text>

        <Text
          style={styles.subtitle}
        >
          Enter your daily calorie
          target. Apollo will
          automatically calculate your
          macros based on your fitness
          goal.
        </Text>
      </View>

      <View
        style={styles.summaryCard}
      >
        <Text
          style={
            styles.summaryLabel
          }
        >
          YOUR PLAN
        </Text>

        <Text
          style={
            styles.summaryName
          }
        >
          {displayName}
        </Text>

        <Text
          style={
            styles.summaryGoal
          }
        >
          {fitnessGoal}
        </Text>

        <Text
          style={
            styles.summaryText
          }
        >
          {currentWeight} lbs →{' '}
          {goalWeight} lbs
        </Text>

        <Text
          style={
            styles.summaryText
          }
        >
          {activityLevel}
        </Text>
      </View>

      <View
        style={styles.form}
      >
        <View
          style={
            styles.inputGroup
          }
        >
          <Text
            style={styles.label}
          >
            DAILY CALORIES
          </Text>

          <View
            style={styles.inputRow}
          >
            <TextInput
              style={styles.input}
              value={calories}
              onChangeText={
                setCalories
              }
              placeholder="2200"
              placeholderTextColor={
                colors.textSecondary
              }
              keyboardType="number-pad"
            />

            <Text
              style={styles.unit}
            >
              kcal
            </Text>
          </View>
        </View>
      </View>

      <View
        style={styles.macroCard}
      >
        <View
          style={
            styles.macroHeader
          }
        >
          <Text
            style={
              styles.macroCardTitle
            }
          >
            Recommended Macros
          </Text>

          <Text
            style={
              styles.autoLabel
            }
          >
            AUTO
          </Text>
        </View>

        <Text
          style={
            styles.macroDescription
          }
        >
          Based on your{' '}
          {fitnessGoal?.toLowerCase()}{' '}
          goal.
        </Text>

        <View
          style={styles.macroRow}
        >
          <View
            style={styles.macroItem}
          >
            <Text
              style={
                styles.macroValue
              }
            >
              {
                calculatedMacros.protein
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

            <Text
              style={
                styles.percentage
              }
            >
              {Math.round(
                macroSplit.protein *
                  100
              )}
              %
            </Text>
          </View>

          <View
            style={styles.macroItem}
          >
            <Text
              style={
                styles.macroValue
              }
            >
              {
                calculatedMacros.carbs
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

            <Text
              style={
                styles.percentage
              }
            >
              {Math.round(
                macroSplit.carbs *
                  100
              )}
              %
            </Text>
          </View>

          <View
            style={styles.macroItem}
          >
            <Text
              style={
                styles.macroValue
              }
            >
              {
                calculatedMacros.fat
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

            <Text
              style={
                styles.percentage
              }
            >
              {Math.round(
                macroSplit.fat *
                  100
              )}
              %
            </Text>
          </View>
        </View>
      </View>

      {error ? (
        <Text
          style={styles.errorText}
        >
          {error}
        </Text>
      ) : null}

      <View
        style={
          styles.bottomSection
        }
      >
        <Pressable
          style={({ pressed }) => [
            styles.finishButton,
            pressed &&
              styles.buttonPressed,
            saving &&
              styles.disabledButton,
          ]}
          onPress={handleFinish}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator
              color={
                colors.background
              }
            />
          ) : (
            <Text
              style={
                styles.finishButtonText
              }
            >
              FINISH SETUP
            </Text>
          )}
        </Pressable>

        <Text
          style={
            styles.footerText
          }
        >
          Your calorie target and macros
          can be changed later from your
          Profile.
        </Text>
      </View>
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

    loadingScreen: {
      flex: 1,
      backgroundColor:
        colors.background,
      alignItems: 'center',
      justifyContent:
        'center',
      gap: spacing.md,
    },

    loadingText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
    },

    container: {
      flexGrow: 1,
      padding: spacing.lg,
      paddingTop:
        spacing.xxl,
      paddingBottom:
        spacing.xxl,
    },

    topSection: {
      gap: spacing.sm,
      marginBottom:
        spacing.xl,
    },

    step: {
      color: colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 1.5,
    },

    title: {
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
      lineHeight: 24,
    },

    summaryCard: {
      backgroundColor:
        colors.surface,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: spacing.lg,
      gap: spacing.xs,
      marginBottom:
        spacing.xl,
    },

    summaryLabel: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 1,
    },

    summaryName: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    summaryGoal: {
      color:
        colors.primary,
      fontSize:
        fontSize.title,
      fontWeight: '700',
    },

    summaryText: {
      color: colors.text,
      fontSize:
        fontSize.body,
    },

    form: {
      gap: spacing.lg,
    },

    inputGroup: {
      gap: spacing.sm,
    },

    label: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 1,
    },

    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    input: {
      flex: 1,
      backgroundColor:
        colors.surface,
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
        fontSize.subtitle,
    },

    unit: {
      width: 40,
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
      fontWeight: '600',
    },

    macroCard: {
      backgroundColor:
        colors.surface,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: spacing.lg,
      gap: spacing.md,
      marginTop:
        spacing.xl,
    },

    macroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: spacing.sm,
    },

    macroCardTitle: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    autoLabel: {
      color:
        colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 1,
    },

    macroDescription: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
    },

    macroRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },

    macroItem: {
      flex: 1,
      backgroundColor:
        colors.surfaceSecondary,
      borderRadius: 12,
      paddingVertical:
        spacing.md,
      alignItems: 'center',
    },

    macroValue: {
      color:
        colors.primary,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    macroLabel: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      marginTop:
        spacing.xs,
    },

    percentage: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      marginTop:
        spacing.xs,
    },

    errorText: {
      color: colors.danger,
      fontSize:
        fontSize.body,
      marginTop:
        spacing.md,
    },

    bottomSection: {
      marginTop: 'auto',
      paddingTop:
        spacing.xxl,
      gap: spacing.md,
    },

    finishButton: {
      backgroundColor:
        colors.primary,
      borderRadius: 12,
      paddingVertical:
        spacing.md,
      alignItems: 'center',
      minHeight: 52,
      justifyContent:
        'center',
    },

    finishButtonText: {
      color:
        colors.background,
      fontSize:
        fontSize.body,
      fontWeight: '700',
      letterSpacing: 0.5,
    },

    buttonPressed: {
      opacity: 0.8,
    },

    disabledButton: {
      opacity: 0.6,
    },

    footerText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      textAlign: 'center',
    },
  });