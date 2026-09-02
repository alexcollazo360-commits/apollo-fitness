import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
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
import { useProfile } from '../../context/ProfileContext';

const FITNESS_GOALS = [
  'Lose Weight',
  'Maintain Weight',
  'Gain Weight',
];

const ACTIVITY_LEVELS = [
  'Sedentary',
  'Lightly Active',
  'Moderately Active',
  'Very Active',
];

export default function GoalsScreen() {
  const router = useRouter();

  const {
    profile,
    updateFitnessGoals,
  } = useProfile();

  const [goalWeight, setGoalWeight] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState<string | null>(null);
  const [activityLevel, setActivityLevel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }

    if (profile.goalWeight !== null) {
      setGoalWeight(String(profile.goalWeight));
    }

    setFitnessGoal(profile.fitnessGoal);
    setActivityLevel(profile.activityLevel);
  }, [profile]);

  async function handleSave() {
    const goalWeightValue =
      goalWeight.trim() === '' ? null : Number(goalWeight);

    if (
      goalWeightValue !== null &&
      (!Number.isFinite(goalWeightValue) || goalWeightValue <= 0)
    ) {
      Alert.alert(
        'Invalid goal weight',
        'Please enter a valid goal weight.'
      );
      return;
    }

    setSaving(true);

    const success = await updateFitnessGoals({
      goalWeight: goalWeightValue,
      fitnessGoal,
      activityLevel,
    });

    setSaving(false);

    if (!success) {
      Alert.alert(
        'Unable to save',
        'Your fitness goals could not be updated.'
      );
      return;
    }

    router.back();
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Update Goals</Text>

        <Text style={styles.subtitle}>
          Set your goal weight, fitness goal, and activity level.
        </Text>
      </View>

      <AppCard>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>GOAL WEIGHT (LB)</Text>

          <TextInput
            style={styles.input}
            value={goalWeight}
            onChangeText={setGoalWeight}
            keyboardType="decimal-pad"
            placeholder="200"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>Fitness Goal</Text>

        <View style={styles.optionGroup}>
          {FITNESS_GOALS.map((goal) => {
            const selected = fitnessGoal === goal;

            return (
              <Pressable
                key={goal}
                style={[
                  styles.optionButton,
                  selected && styles.optionButtonSelected,
                ]}
                onPress={() => setFitnessGoal(goal)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {goal}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>Activity Level</Text>

        <View style={styles.optionGroup}>
          {ACTIVITY_LEVELS.map((level) => {
            const selected = activityLevel === level;

            return (
              <Pressable
                key={level}
                style={[
                  styles.optionButton,
                  selected && styles.optionButtonSelected,
                ]}
                onPress={() => setActivityLevel(level)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <Pressable
        style={[
          styles.saveButton,
          saving && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'SAVING...' : 'SAVE GOALS'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.cancelButton}
        onPress={() => router.back()}
        disabled={saving}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  header: {
    marginBottom: spacing.sm,
  },

  screenTitle: {
    color: colors.text,
    fontSize: fontSize.screenTitle,
    fontWeight: '700',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    marginTop: spacing.xs,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '600',
  },

  inputGroup: {
    gap: spacing.sm,
  },

  label: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: '600',
    letterSpacing: 1,
  },

  input: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSize.body,
  },

  optionGroup: {
    gap: spacing.sm,
  },

  optionButton: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },

  optionButtonSelected: {
    borderColor: colors.primary,
  },

  optionText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    fontWeight: '600',
  },

  optionTextSelected: {
    color: colors.primary,
  },

  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },

  saveButtonText: {
    color: colors.background,
    fontSize: fontSize.body,
    fontWeight: '700',
  },

  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
});