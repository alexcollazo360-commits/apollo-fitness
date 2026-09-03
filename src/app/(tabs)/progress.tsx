import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppCard from '../../components/AppCard';
import WeightTrendChart from '../../components/WeightTrendChart';
import {
  borderRadius,
  colors,
  fontSize,
  spacing,
} from '../../constants/theme';
import { useProfile } from '../../context/ProfileContext';
import { useProgress } from '../../context/ProgressContext';

export default function ProgressScreen() {
  const {
    weightEntries,
    loading,
    currentWeight,
    addWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
  } = useProgress();

  const {
    profile,
    loading: profileLoading,
  } = useProfile();

  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(
    null
  );
  const [editWeight, setEditWeight] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(
    null
  );

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

  function startEditing(entryId: string, entryWeight: number) {
    setEditingEntryId(entryId);
    setEditWeight(String(entryWeight));
  }

  function cancelEditing() {
    setEditingEntryId(null);
    setEditWeight('');
  }

  async function handleUpdateWeight(
    entryId: string,
    loggedDate: string
  ) {
    const parsedWeight = Number(editWeight);

    if (!parsedWeight || parsedWeight <= 0) {
      return;
    }

    setUpdating(true);

    await updateWeightEntry(
      entryId,
      parsedWeight,
      loggedDate
    );

    setEditingEntryId(null);
    setEditWeight('');
    setUpdating(false);
  }

  async function performDelete(entryId: string) {
    setDeletingEntryId(entryId);

    await deleteWeightEntry(entryId);

    if (editingEntryId === entryId) {
      cancelEditing();
    }

    setDeletingEntryId(null);
  }

  function handleDeleteWeight(entryId: string) {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Delete this weight entry?'
      );

      if (confirmed) {
        performDelete(entryId);
      }

      return;
    }

    Alert.alert(
      'Delete Weight Entry',
      'Are you sure you want to delete this weight entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(entryId),
        },
      ]
    );
  }

  function formatDate(date: string) {
    const parsedDate = new Date(`${date}T00:00:00`);

    return parsedDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const startingWeight =
    weightEntries.length > 0
      ? weightEntries[weightEntries.length - 1].weight
      : null;

  const goalWeight = profile?.goalWeight ?? null;

  let goalProgress = 0;
  let weightChanged = 0;
  let weightRemaining = 0;

  if (
    startingWeight !== null &&
    currentWeight !== null &&
    goalWeight !== null
  ) {
    const totalGoalDistance = goalWeight - startingWeight;
    const currentDistance = currentWeight - startingWeight;

    if (totalGoalDistance !== 0) {
      goalProgress =
        (currentDistance / totalGoalDistance) * 100;
    }

    goalProgress = Math.max(
      0,
      Math.min(100, goalProgress)
    );

    weightChanged = Math.abs(
      currentWeight - startingWeight
    );

    weightRemaining = Math.abs(
      currentWeight - goalWeight
    );
  }

  const isWeightLossGoal =
    startingWeight !== null &&
    goalWeight !== null &&
    goalWeight < startingWeight;

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
        <Text style={styles.cardTitle}>Goal Progress</Text>

        {loading || profileLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : startingWeight === null ? (
          <Text style={styles.emptyText}>
            Log your weight to begin tracking goal progress.
          </Text>
        ) : goalWeight === null ? (
          <Text style={styles.emptyText}>
            Set a goal weight in your Profile to track progress.
          </Text>
        ) : (
          <>
            <View style={styles.goalWeightRow}>
              <View style={styles.goalWeightColumn}>
                <Text style={styles.goalLabel}>START</Text>
                <Text style={styles.goalWeightValue}>
                  {startingWeight} lbs
                </Text>
              </View>

              <View style={styles.goalWeightColumnCenter}>
                <Text style={styles.goalLabel}>CURRENT</Text>
                <Text style={styles.goalCurrentValue}>
                  {currentWeight} lbs
                </Text>
              </View>

              <View style={styles.goalWeightColumnRight}>
                <Text style={styles.goalLabel}>GOAL</Text>
                <Text style={styles.goalWeightValue}>
                  {goalWeight} lbs
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${goalProgress}%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.progressPercent}>
              {Math.round(goalProgress)}% toward goal
            </Text>

            <View style={styles.goalStatsRow}>
              <View style={styles.goalStat}>
                <Text style={styles.goalStatValue}>
                  {weightChanged.toFixed(1)}
                </Text>

                <Text style={styles.goalStatLabel}>
                  lbs {isWeightLossGoal ? 'lost' : 'gained'}
                </Text>
              </View>

              <View style={styles.goalStatDivider} />

              <View style={styles.goalStat}>
                <Text style={styles.goalStatValue}>
                  {weightRemaining.toFixed(1)}
                </Text>

                <Text style={styles.goalStatLabel}>
                  lbs remaining
                </Text>
              </View>
            </View>
          </>
        )}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Weight Trend</Text>

        <WeightTrendChart entries={weightEntries} />
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
          weightEntries.map((entry) => {
            const isEditing = editingEntryId === entry.id;
            const isDeleting = deletingEntryId === entry.id;

            return (
              <View
                key={entry.id}
                style={styles.historyRow}
              >
                {isEditing ? (
                  <>
                    <Text style={styles.historyDate}>
                      {formatDate(entry.loggedDate)}
                    </Text>

                    <View style={styles.editInputRow}>
                      <TextInput
                        value={editWeight}
                        onChangeText={setEditWeight}
                        keyboardType="decimal-pad"
                        autoFocus
                        style={styles.editInput}
                      />

                      <Text style={styles.unit}>lbs</Text>
                    </View>

                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={cancelEditing}
                        disabled={updating}
                        style={({ pressed }) => [
                          styles.secondaryButton,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.secondaryButtonText}>
                          CANCEL
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          handleUpdateWeight(
                            entry.id,
                            entry.loggedDate
                          )
                        }
                        disabled={updating}
                        style={({ pressed }) => [
                          styles.saveButton,
                          pressed && styles.buttonPressed,
                          updating && styles.buttonDisabled,
                        ]}
                      >
                        {updating ? (
                          <ActivityIndicator
                            color={colors.background}
                          />
                        ) : (
                          <Text style={styles.saveButtonText}>
                            SAVE
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.historyHeader}>
                      <View>
                        <Text style={styles.historyWeight}>
                          {entry.weight} lbs
                        </Text>

                        <Text style={styles.historyDate}>
                          {formatDate(entry.loggedDate)}
                        </Text>
                      </View>

                      {isDeleting && (
                        <ActivityIndicator
                          color={colors.danger}
                        />
                      )}
                    </View>

                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={() =>
                          startEditing(
                            entry.id,
                            entry.weight
                          )
                        }
                        disabled={isDeleting}
                        style={({ pressed }) => [
                          styles.secondaryButton,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.secondaryButtonText}>
                          EDIT
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          handleDeleteWeight(entry.id)
                        }
                        disabled={isDeleting}
                        style={({ pressed }) => [
                          styles.deleteButton,
                          pressed && styles.buttonPressed,
                          isDeleting && styles.buttonDisabled,
                        ]}
                      >
                        <Text style={styles.deleteButtonText}>
                          DELETE
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            );
          })
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
  goalWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  goalWeightColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  goalWeightColumnCenter: {
    flex: 1,
    alignItems: 'center',
  },
  goalWeightColumnRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  goalLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  goalWeightValue: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  goalCurrentValue: {
    marginTop: spacing.xs,
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
  },
  progressPercent: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    textAlign: 'center',
  },
  goalStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  goalStat: {
    flex: 1,
    alignItems: 'center',
  },
  goalStatDivider: {
    width: 1,
    height: 44,
    backgroundColor: colors.border,
  },
  goalStatValue: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },
  goalStatLabel: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: fontSize.small,
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
    gap: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyWeight: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },
  historyDate: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  editInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    color: colors.text,
    fontSize: fontSize.body,
    paddingHorizontal: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    height: 42,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: fontSize.small,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    height: 42,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: colors.background,
    fontSize: fontSize.small,
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    height: 42,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: fontSize.small,
    fontWeight: '700',
  },
});