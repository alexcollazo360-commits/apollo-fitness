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
    View,
} from 'react-native';

import {
    colors,
    fontSize,
    spacing,
} from '../../constants/theme';

type ActivityOption = {
  value:
    | 'Sedentary'
    | 'Lightly Active'
    | 'Moderately Active'
    | 'Very Active';
  title: string;
  description: string;
};

const activityOptions: ActivityOption[] = [
  {
    value: 'Sedentary',
    title: 'Sedentary',
    description:
      'Mostly sitting with little structured exercise.',
  },
  {
    value: 'Lightly Active',
    title: 'Lightly Active',
    description:
      'Light exercise or active movement 1–3 days per week.',
  },
  {
    value: 'Moderately Active',
    title: 'Moderately Active',
    description:
      'Exercise or active movement 3–5 days per week.',
  },
  {
    value: 'Very Active',
    title: 'Very Active',
    description:
      'Hard training or highly active work most days of the week.',
  },
];

export default function OnboardingActivityScreen() {
  const router = useRouter();

  const {
    displayName,
    heightInches,
    currentWeight,
    fitnessGoal,
    goalWeight,
  } = useLocalSearchParams<{
    displayName: string;
    heightInches: string;
    currentWeight: string;
    fitnessGoal: string;
    goalWeight: string;
  }>();

  const [
    selectedActivity,
    setSelectedActivity,
  ] = useState<
    ActivityOption['value'] | null
  >(null);

  const [error, setError] =
    useState('');

  function handleContinue() {
    setError('');

    if (!selectedActivity) {
      setError(
        'Choose your activity level.'
      );

      return;
    }

    router.push({
      pathname:
        '/onboarding/targets',
      params: {
        displayName,
        heightInches,
        currentWeight,
        fitnessGoal,
        goalWeight,
        activityLevel:
          selectedActivity,
      },
    });
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.container
      }
    >
      <View style={styles.topSection}>
        <Text style={styles.step}>
          STEP 3 OF 4
        </Text>

        <Text style={styles.title}>
          How active are you?
        </Text>

        <Text style={styles.subtitle}>
          Choose the option that best
          matches your normal weekly
          activity.
        </Text>
      </View>

      <View style={styles.options}>
        {activityOptions.map(
          (option) => {
            const selected =
              selectedActivity ===
              option.value;

            return (
              <Pressable
                key={option.value}
                style={[
                  styles.activityCard,
                  selected &&
                    styles.activityCardSelected,
                ]}
                onPress={() => {
                  setSelectedActivity(
                    option.value
                  );

                  setError('');
                }}
              >
                <View
                  style={
                    styles.activityTextContainer
                  }
                >
                  <Text
                    style={[
                      styles.activityTitle,
                      selected &&
                        styles.activityTitleSelected,
                    ]}
                  >
                    {option.title}
                  </Text>

                  <Text
                    style={
                      styles.activityDescription
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  container: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },

  topSection: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },

  step: {
    color: colors.primary,
    fontSize: fontSize.small,
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
    fontSize: fontSize.body,
    lineHeight: 24,
  },

  options: {
    gap: spacing.md,
  },

  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },

  activityCardSelected: {
    borderColor:
      colors.primary,
    borderWidth: 2,
  },

  activityTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },

  activityTitle: {
    color: colors.text,
    fontSize:
      fontSize.subtitle,
    fontWeight: '700',
  },

  activityTitleSelected: {
    color:
      colors.primary,
  },

  activityDescription: {
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

  errorText: {
    color: colors.danger,
    fontSize:
      fontSize.body,
    marginTop: spacing.md,
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