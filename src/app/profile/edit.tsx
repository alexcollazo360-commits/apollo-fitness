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

export default function EditProfileScreen() {
  const router = useRouter();

  const {
    profile,
    updatePersonalInfo,
  } = useProfile();

  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }

    if (profile.heightInches !== null) {
      const feet = Math.floor(profile.heightInches / 12);
      const inches = profile.heightInches % 12;

      setHeightFeet(String(feet));
      setHeightInches(String(inches));
    }

    if (profile.currentWeight !== null) {
      setCurrentWeight(String(profile.currentWeight));
    }
  }, [profile]);

  async function handleSave() {
    const feetValue =
      heightFeet.trim() === '' ? null : Number(heightFeet);

    const inchesValue =
      heightInches.trim() === '' ? null : Number(heightInches);

    const weightValue =
      currentWeight.trim() === '' ? null : Number(currentWeight);

    if (
      feetValue !== null &&
      (!Number.isFinite(feetValue) || feetValue < 0)
    ) {
      Alert.alert(
        'Invalid height',
        'Please enter a valid number of feet.'
      );
      return;
    }

    if (
      inchesValue !== null &&
      (!Number.isFinite(inchesValue) ||
        inchesValue < 0 ||
        inchesValue >= 12)
    ) {
      Alert.alert(
        'Invalid height',
        'Inches must be between 0 and 11.'
      );
      return;
    }

    if (
      weightValue !== null &&
      (!Number.isFinite(weightValue) || weightValue <= 0)
    ) {
      Alert.alert(
        'Invalid weight',
        'Please enter a valid current weight.'
      );
      return;
    }

    let totalHeightInches: number | null = null;

    if (feetValue !== null || inchesValue !== null) {
      totalHeightInches =
        (feetValue ?? 0) * 12 + (inchesValue ?? 0);

      if (totalHeightInches <= 0) {
        Alert.alert(
          'Invalid height',
          'Please enter a valid height.'
        );
        return;
      }
    }

    setSaving(true);

    const success = await updatePersonalInfo({
      currentWeight: weightValue,
      heightInches: totalHeightInches,
    });

    setSaving(false);

    if (!success) {
      Alert.alert(
        'Unable to save',
        'Your profile information could not be updated.'
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
        <Text style={styles.screenTitle}>Edit Profile</Text>

        <Text style={styles.subtitle}>
          Update your personal fitness information.
        </Text>
      </View>

      <AppCard>
        <Text style={styles.sectionTitle}>Height</Text>

        <View style={styles.heightRow}>
          <View style={styles.heightInput}>
            <Text style={styles.label}>FEET</Text>

            <TextInput
              style={styles.input}
              value={heightFeet}
              onChangeText={setHeightFeet}
              keyboardType="numeric"
              placeholder="5"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.heightInput}>
            <Text style={styles.label}>INCHES</Text>

            <TextInput
              style={styles.input}
              value={heightInches}
              onChangeText={setHeightInches}
              keyboardType="numeric"
              placeholder="11"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CURRENT WEIGHT (LB)</Text>

          <TextInput
            style={styles.input}
            value={currentWeight}
            onChangeText={setCurrentWeight}
            keyboardType="decimal-pad"
            placeholder="200"
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
          {saving ? 'SAVING...' : 'SAVE PROFILE'}
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

  heightRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  heightInput: {
    flex: 1,
    gap: spacing.sm,
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