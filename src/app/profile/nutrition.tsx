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

export default function NutritionSettingsScreen() {
  const router = useRouter();

  const {
    profile,
    updateNutritionTargets,
  } = useProfile();

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setCalories(String(profile.dailyCalorieTarget));
    setProtein(String(profile.proteinTarget));
    setCarbs(String(profile.carbTarget));
    setFat(String(profile.fatTarget));
  }, [profile]);

  async function handleSave() {
    const calorieValue = Number(calories);
    const proteinValue = Number(protein);
    const carbValue = Number(carbs);
    const fatValue = Number(fat);

    if (
      !Number.isFinite(calorieValue) ||
      !Number.isFinite(proteinValue) ||
      !Number.isFinite(carbValue) ||
      !Number.isFinite(fatValue)
    ) {
      Alert.alert(
        'Invalid targets',
        'Please enter a valid number for every nutrition target.'
      );

      return;
    }

    if (
      calorieValue <= 0 ||
      proteinValue < 0 ||
      carbValue < 0 ||
      fatValue < 0
    ) {
      Alert.alert(
        'Invalid targets',
        'Calories must be greater than zero, and macro targets cannot be negative.'
      );

      return;
    }

    setSaving(true);

    const success = await updateNutritionTargets({
      dailyCalorieTarget: calorieValue,
      proteinTarget: proteinValue,
      carbTarget: carbValue,
      fatTarget: fatValue,
    });

    setSaving(false);

    if (!success) {
      Alert.alert(
        'Unable to save',
        'Your nutrition targets could not be updated.'
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
        <Text style={styles.screenTitle}>Nutrition Settings</Text>

        <Text style={styles.subtitle}>
          Set your daily calorie and macro targets.
        </Text>
      </View>

      <AppCard>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>DAILY CALORIES</Text>

          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
            placeholder="2200"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>PROTEIN (G)</Text>

          <TextInput
            style={styles.input}
            value={protein}
            onChangeText={setProtein}
            keyboardType="numeric"
            placeholder="180"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CARBS (G)</Text>

          <TextInput
            style={styles.input}
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="numeric"
            placeholder="190"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>FAT (G)</Text>

          <TextInput
            style={styles.input}
            value={fat}
            onChangeText={setFat}
            keyboardType="numeric"
            placeholder="80"
            placeholderTextColor={colors.textSecondary}
          />
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
          {saving ? 'SAVING...' : 'SAVE TARGETS'}
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