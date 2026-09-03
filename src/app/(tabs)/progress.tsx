import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppCard from '../../components/AppCard';
import {
  borderRadius,
  colors,
  fontSize,
  spacing,
} from '../../constants/theme';
import { useProgress } from '../../context/ProgressContext';

export default function ProgressScreen() {
  const {
    weightEntries,
    loading,
    currentWeight,
    addWeightEntry,
  } = useProgress();

  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAddWeight() {
    const parsedWeight = Number(weight);

    if (!parsedWeight || parsedWeight <= 0) {
      return;
    }

    setSaving(true);

    await addWeightEntry(parsedWeight);

    setWeight('');
    setSaving(false);
  }

  function formatDate(date: string) {
    const parsedDate = new Date(`${date}T00:00:00`);

    return parsedDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>
          Track your body weight over time.
        </Text>
      </View>

      <AppCard>
        <Text style={styles.cardLabel}>CURRENT WEIGHT</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.currentWeight}>
            {currentWeight !== null
              ? `${currentWeight} lbs`
              : 'No weight logged'}
          </Text>
        )}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Log Weight</Text>

        <View style={styles.inputRow}>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            placeholder="245"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.unit}>lbs</Text>
        </View>

        <Pressable
          onPress={handleAddWeight}
          disabled={saving}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            saving && styles.buttonDisabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.buttonText}>ADD WEIGHT</Text>
          )}
        </Pressable>
      </AppCard>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weight History</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : weightEntries.length === 0 ? (
          <AppCard>
            <Text style={styles.emptyText}>
              Your weight history will appear here.
            </Text>
          </AppCard>
        ) : (
          weightEntries.map((entry) => (
            <View
              key={entry.id}
              style={styles.historyRow}
            >
              <View>
                <Text style={styles.historyWeight}>
                  {entry.weight} lbs
                </Text>

                <Text style={styles.historyDate}>
                  {formatDate(entry.loggedDate)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.screenTitle,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  cardLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: '700',
    letterSpacing: 1,
  },
  currentWeight: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    color: colors.text,
    fontSize: fontSize.body,
    paddingHorizontal: spacing.md,
  },
  unit: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  button: {
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.background,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  historyRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  historyWeight: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },
  historyDate: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
});