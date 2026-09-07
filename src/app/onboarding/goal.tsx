import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';
import { useState } from 'react';
import {
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

type GoalOption = {
  value:
    | 'Lose Weight'
    | 'Maintain Weight'
    | 'Gain Muscle';
  title: string;
  description: string;
};

const goalOptions: GoalOption[] = [
  {
    value: 'Lose Weight',
    title: 'Lose Weight',
    description:
      'Reduce body weight while preserving strength and muscle.',
  },
  {
    value: 'Maintain Weight',
    title: 'Maintain Weight',
    description:
      'Stay near your current weight while improving fitness.',
  },
  {
    value: 'Gain Muscle',
    title: 'Gain Muscle',
    description:
      'Support muscle growth and gradual weight gain.',
  },
];

export default function OnboardingGoalScreen() {
  const router = useRouter();

  const {
    displayName,
    heightInches,
    currentWeight,
  } = useLocalSearchParams<{
    displayName: string;
    heightInches: string;
    currentWeight: string;
  }>();

  const [
    selectedGoal,
    setSelectedGoal,
  ] = useState<
    GoalOption['value'] | null
  >(null);

  const [
    goalWeight,
    setGoalWeight,
  ] = useState('');

  const [error, setError] =
    useState('');

  function handleContinue() {
    setError('');

    if (!selectedGoal) {
      setError(
        'Choose a fitness goal.'
      );

      return;
    }

    const parsedCurrentWeight =
      Number(currentWeight);

    let finalGoalWeight =
      parsedCurrentWeight;

    if (
      selectedGoal !==
      'Maintain Weight'
    ) {
      const parsedGoalWeight =
        Number(goalWeight);

      if (
        goalWeight.trim() === '' ||
        Number.isNaN(
          parsedGoalWeight
        ) ||
        parsedGoalWeight <= 0
      ) {
        setError(
          'Enter a valid goal weight.'
        );

        return;
      }

      if (
        selectedGoal ===
          'Lose Weight' &&
        parsedGoalWeight >=
          parsedCurrentWeight
      ) {
        setError(
          'For weight loss, your goal weight should be lower than your current weight.'
        );

        return;
      }

      if (
        selectedGoal ===
          'Gain Muscle' &&
        parsedGoalWeight <=
          parsedCurrentWeight
      ) {
        setError(
          'For muscle gain, your goal weight should be higher than your current weight.'
        );

        return;
      }

      finalGoalWeight =
        parsedGoalWeight;
    }

    router.push({
      pathname:
        '/onboarding/activity',
      params: {
        displayName,
        heightInches,
        currentWeight,
        fitnessGoal:
          selectedGoal,
        goalWeight:
          String(
            finalGoalWeight
          ),
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
      <View style={styles.topSection}>
        <Text style={styles.step}>
          STEP 2 OF 4
        </Text>

        <Text style={styles.title}>
          What is your goal?
        </Text>

        <Text style={styles.subtitle}>
          Choose the primary goal you
          want Apollo to help you work
          toward.
        </Text>
      </View>

      <View style={styles.options}>
        {goalOptions.map(
          (option) => {
            const selected =
              selectedGoal ===
              option.value;

            return (
              <Pressable
                key={option.value}
                style={[
                  styles.goalCard,
                  selected &&
                    styles.goalCardSelected,
                ]}
                onPress={() => {
                  setSelectedGoal(
                    option.value
                  );

                  if (
                    option.value ===
                    'Maintain Weight'
                  ) {
                    setGoalWeight(
                      String(
                        currentWeight ??
                          ''
                      )
                    );
                  } else {
                    setGoalWeight('');
                  }

                  setError('');
                }}
              >
                <View
                  style={
                    styles.goalTextContainer
                  }
                >
                  <Text
                    style={[
                      styles.goalTitle,
                      selected &&
                        styles.goalTitleSelected,
                    ]}
                  >
                    {option.title}
                  </Text>

                  <Text
                    style={
                      styles.goalDescription
                    }
                  >
                    {
                      option.description
                    }
                  </Text>
                </View>

                <View
                  style={[
                    styles.radioOuter,
                    selected &&
                      styles.radioOuterSelected,
                  ]}
                >
                  {selected && (
                    <View
                      style={
                        styles.radioInner
                      }
                    />
                  )}
                </View>
              </Pressable>
            );
          }
        )}
      </View>

      {selectedGoal &&
        selectedGoal !==
          'Maintain Weight' && (
          <View
            style={
              styles.inputGroup
            }
          >
            <Text
              style={styles.label}
            >
              GOAL WEIGHT
            </Text>

            <View
              style={
                styles.weightRow
              }
            >
              <TextInput
                style={styles.input}
                value={goalWeight}
                onChangeText={
                  setGoalWeight
                }
                placeholder={
                  selectedGoal ===
                  'Lose Weight'
                    ? '200'
                    : '250'
                }
                placeholderTextColor={
                  colors.textSecondary
                }
                keyboardType="decimal-pad"
              />

              <Text
                style={
                  styles.unitLabel
                }
              >
                lbs
              </Text>
            </View>
          </View>
        )}

      {selectedGoal ===
        'Maintain Weight' && (
        <View
          style={
            styles.maintainCard
          }
        >
          <Text
            style={
              styles.maintainLabel
            }
          >
            TARGET WEIGHT
          </Text>

          <Text
            style={
              styles.maintainValue
            }
          >
            {currentWeight} lbs
          </Text>

          <Text
            style={
              styles.maintainText
            }
          >
            Apollo will use your current
            weight as your target.
          </Text>
        </View>
      )}

      {error ? (
        <Text style={styles.errorText}>
          {error}
        </Text>
      ) : null}

      <View style={styles.bottomSection}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed &&
              styles.buttonPressed,
          ]}
          onPress={handleContinue}
        >
          <Text
            style={
              styles.continueButtonText
            }
          >
            CONTINUE
          </Text>
        </Pressable>
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

    container: {
      flexGrow: 1,
      padding: spacing.lg,
      paddingTop: spacing.xxl,
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

    options: {
      gap: spacing.md,
    },

    goalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        colors.surface,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: spacing.lg,
      gap: spacing.md,
    },

    goalCardSelected: {
      borderColor:
        colors.primary,
      borderWidth: 2,
    },

    goalTextContainer: {
      flex: 1,
      gap: spacing.xs,
    },

    goalTitle: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    goalTitleSelected: {
      color:
        colors.primary,
    },

    goalDescription: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
      lineHeight: 22,
    },

    radioOuter: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderColor:
        colors.border,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    radioOuterSelected: {
      borderColor:
        colors.primary,
    },

    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor:
        colors.primary,
    },

    inputGroup: {
      gap: spacing.sm,
      marginTop:
        spacing.xl,
    },

    label: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 1,
    },

    weightRow: {
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

    unitLabel: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
      fontWeight: '600',
    },

    maintainCard: {
      marginTop:
        spacing.xl,
      backgroundColor:
        colors.surface,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: spacing.lg,
      gap: spacing.xs,
    },

    maintainLabel: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 1,
    },

    maintainValue: {
      color:
        colors.primary,
      fontSize:
        fontSize.title,
      fontWeight: '700',
    },

    maintainText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
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
    },

    continueButton: {
      backgroundColor:
        colors.primary,
      borderRadius: 12,
      paddingVertical:
        spacing.md,
      alignItems: 'center',
    },

    continueButtonText: {
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
  });