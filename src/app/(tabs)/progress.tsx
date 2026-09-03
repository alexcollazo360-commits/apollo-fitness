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
import WorkoutActivityChart from '../../components/WorkoutActivityChart';
import {
  borderRadius,
  colors,
  fontSize,
  spacing,
} from '../../constants/theme';
import { useProfile } from '../../context/ProfileContext';
import { useProgress } from '../../context/ProgressContext';
import { useWorkout } from '../../context/WorkoutContext';

function getLocalDateString(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isValidDateString(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsedDate = new Date(
    year,
    month - 1,
    day
  );

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );
}

function getStartOfWeekDateString() {
  const today = new Date();

  const dayOfWeek = today.getDay();

  const daysSinceMonday =
    dayOfWeek === 0
      ? 6
      : dayOfWeek - 1;

  const startOfWeek = new Date(today);

  startOfWeek.setDate(
    today.getDate() - daysSinceMonday
  );

  return getLocalDateString(startOfWeek);
}

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

  const {
    workoutHistory,
    historyLoading,
  } = useWorkout();

  const today = getLocalDateString(new Date());

  const [weight, setWeight] = useState('');
  const [weightDate, setWeightDate] =
    useState(today);

  const [saving, setSaving] =
    useState(false);

  const [editingEntryId, setEditingEntryId] =
    useState<string | null>(null);

  const [editWeight, setEditWeight] =
    useState('');

  const [editDate, setEditDate] =
    useState('');

  const [updating, setUpdating] =
    useState(false);

  const [deletingEntryId, setDeletingEntryId] =
    useState<string | null>(null);

  async function handleAddWeight() {
    const parsedWeight = Number(weight);

    if (!parsedWeight || parsedWeight <= 0) {
      Alert.alert(
        'Invalid Weight',
        'Enter a valid weight greater than zero.'
      );

      return;
    }

    if (!isValidDateString(weightDate)) {
      Alert.alert(
        'Invalid Date',
        'Enter the date as YYYY-MM-DD.'
      );

      return;
    }

    if (weightDate > today) {
      Alert.alert(
        'Invalid Date',
        'Weight entries cannot be logged for a future date.'
      );

      return;
    }

    setSaving(true);

    try {
      await addWeightEntry(
        parsedWeight,
        weightDate
      );

      setWeight('');
      setWeightDate(today);
    } finally {
      setSaving(false);
    }
  }

  function startEditing(
    entryId: string,
    entryWeight: number,
    loggedDate: string
  ) {
    setEditingEntryId(entryId);
    setEditWeight(String(entryWeight));
    setEditDate(loggedDate);
  }

  function cancelEditing() {
    setEditingEntryId(null);
    setEditWeight('');
    setEditDate('');
  }

  async function handleUpdateWeight(
    entryId: string
  ) {
    const parsedWeight =
      Number(editWeight);

    if (!parsedWeight || parsedWeight <= 0) {
      Alert.alert(
        'Invalid Weight',
        'Enter a valid weight greater than zero.'
      );

      return;
    }

    if (!isValidDateString(editDate)) {
      Alert.alert(
        'Invalid Date',
        'Enter the date as YYYY-MM-DD.'
      );

      return;
    }

    if (editDate > today) {
      Alert.alert(
        'Invalid Date',
        'Weight entries cannot be logged for a future date.'
      );

      return;
    }

    setUpdating(true);

    try {
      await updateWeightEntry(
        entryId,
        parsedWeight,
        editDate
      );

      cancelEditing();
    } finally {
      setUpdating(false);
    }
  }

  async function performDelete(
    entryId: string
  ) {
    setDeletingEntryId(entryId);

    try {
      await deleteWeightEntry(entryId);

      if (editingEntryId === entryId) {
        cancelEditing();
      }
    } finally {
      setDeletingEntryId(null);
    }
  }

  function handleDeleteWeight(
    entryId: string
  ) {
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
          onPress: () =>
            performDelete(entryId),
        },
      ]
    );
  }

  function formatDate(date: string) {
    const parsedDate = new Date(
      `${date}T00:00:00`
    );

    return parsedDate.toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  }

  const startingWeight =
    weightEntries.length > 0
      ? weightEntries[
          weightEntries.length - 1
        ].weight
      : null;

  const goalWeight =
    profile?.goalWeight ?? null;

  let goalProgress = 0;
  let weightChanged = 0;
  let weightRemaining = 0;

  if (
    startingWeight !== null &&
    currentWeight !== null &&
    goalWeight !== null
  ) {
    const totalGoalDistance =
      goalWeight - startingWeight;

    const currentDistance =
      currentWeight - startingWeight;

    if (totalGoalDistance !== 0) {
      goalProgress =
        (currentDistance /
          totalGoalDistance) *
        100;
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

  const totalWorkouts =
    workoutHistory.length;

  const totalExercises =
    workoutHistory.reduce(
      (total, workout) =>
        total + workout.exerciseCount,
      0
    );

  const totalSets =
    workoutHistory.reduce(
      (total, workout) =>
        total + workout.setCount,
      0
    );

  const startOfWeek =
    getStartOfWeekDateString();

  const workoutsThisWeek =
    workoutHistory.filter(
      (workout) =>
        workout.workoutDate >=
          startOfWeek &&
        workout.workoutDate <= today
    ).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.content
      }
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          Progress
        </Text>

        <Text style={styles.subtitle}>
          Track your fitness progress over time.
        </Text>
      </View>

      <AppCard>
        <Text style={styles.cardLabel}>
          CURRENT WEIGHT
        </Text>

        {loading ? (
          <ActivityIndicator
            color={colors.primary}
          />
        ) : (
          <Text
            style={styles.currentWeight}
          >
            {currentWeight !== null
              ? `${currentWeight} lbs`
              : 'No weight logged'}
          </Text>
        )}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>
          Goal Progress
        </Text>

        {loading || profileLoading ? (
          <ActivityIndicator
            color={colors.primary}
          />
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
            <View
              style={styles.goalWeightRow}
            >
              <View
                style={
                  styles.goalWeightColumn
                }
              >
                <Text
                  style={styles.goalLabel}
                >
                  START
                </Text>

                <Text
                  style={
                    styles.goalWeightValue
                  }
                >
                  {startingWeight} lbs
                </Text>
              </View>

              <View
                style={
                  styles.goalWeightColumnCenter
                }
              >
                <Text
                  style={styles.goalLabel}
                >
                  CURRENT
                </Text>

                <Text
                  style={
                    styles.goalCurrentValue
                  }
                >
                  {currentWeight} lbs
                </Text>
              </View>

              <View
                style={
                  styles.goalWeightColumnRight
                }
              >
                <Text
                  style={styles.goalLabel}
                >
                  GOAL
                </Text>

                <Text
                  style={
                    styles.goalWeightValue
                  }
                >
                  {goalWeight} lbs
                </Text>
              </View>
            </View>

            <View
              style={styles.progressTrack}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${goalProgress}%`,
                  },
                ]}
              />
            </View>

            <Text
              style={
                styles.progressPercent
              }
            >
              {Math.round(goalProgress)}%
              {' '}toward goal
            </Text>

            <View
              style={styles.goalStatsRow}
            >
              <View
                style={styles.goalStat}
              >
                <Text
                  style={
                    styles.goalStatValue
                  }
                >
                  {weightChanged.toFixed(1)}
                </Text>

                <Text
                  style={
                    styles.goalStatLabel
                  }
                >
                  lbs{' '}
                  {isWeightLossGoal
                    ? 'lost'
                    : 'gained'}
                </Text>
              </View>

              <View
                style={
                  styles.goalStatDivider
                }
              />

              <View
                style={styles.goalStat}
              >
                <Text
                  style={
                    styles.goalStatValue
                  }
                >
                  {weightRemaining.toFixed(
                    1
                  )}
                </Text>

                <Text
                  style={
                    styles.goalStatLabel
                  }
                >
                  lbs remaining
                </Text>
              </View>
            </View>
          </>
        )}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>
          Workout Progress
        </Text>

        {historyLoading ? (
          <ActivityIndicator
            color={colors.primary}
          />
        ) : (
          <>
            <View
              style={
                styles.workoutStatsGrid
              }
            >
              <View
                style={styles.workoutStat}
              >
                <Text
                  style={
                    styles.workoutStatValue
                  }
                >
                  {totalWorkouts}
                </Text>

                <Text
                  style={
                    styles.workoutStatLabel
                  }
                >
                  Workouts Completed
                </Text>
              </View>

              <View
                style={styles.workoutStat}
              >
                <Text
                  style={
                    styles.workoutStatValue
                  }
                >
                  {workoutsThisWeek}
                </Text>

                <Text
                  style={
                    styles.workoutStatLabel
                  }
                >
                  This Week
                </Text>
              </View>

              <View
                style={styles.workoutStat}
              >
                <Text
                  style={
                    styles.workoutStatValue
                  }
                >
                  {totalExercises}
                </Text>

                <Text
                  style={
                    styles.workoutStatLabel
                  }
                >
                  Total Exercises
                </Text>
              </View>

              <View
                style={styles.workoutStat}
              >
                <Text
                  style={
                    styles.workoutStatValue
                  }
                >
                  {totalSets}
                </Text>

                <Text
                  style={
                    styles.workoutStatLabel
                  }
                >
                  Total Sets
                </Text>
              </View>
            </View>

            <View
              style={
                styles.workoutChartSection
              }
            >
              <WorkoutActivityChart
                workouts={workoutHistory}
              />
            </View>
          </>
        )}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>
          Weight Trend
        </Text>

        <WeightTrendChart
          entries={weightEntries}
        />
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>
          Log Weight
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>
            WEIGHT
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="245"
              placeholderTextColor={
                colors.textSecondary
              }
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <Text style={styles.unit}>
              lbs
            </Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>
            DATE
          </Text>

          <TextInput
            value={weightDate}
            onChangeText={setWeightDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={
              colors.textSecondary
            }
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
            style={styles.dateInput}
          />

          <Text style={styles.helperText}>
            Use YYYY-MM-DD. Defaults to today.
          </Text>
        </View>

        <Pressable
          onPress={handleAddWeight}
          disabled={saving}
          style={({ pressed }) => [
            styles.button,
            pressed &&
              styles.buttonPressed,
            saving &&
              styles.buttonDisabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator
              color={colors.background}
            />
          ) : (
            <Text
              style={styles.buttonText}
            >
              ADD WEIGHT
            </Text>
          )}
        </Pressable>
      </AppCard>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Weight History
        </Text>

        {loading ? (
          <ActivityIndicator
            color={colors.primary}
          />
        ) : weightEntries.length ===
          0 ? (
          <AppCard>
            <Text
              style={styles.emptyText}
            >
              Your weight history will appear here.
            </Text>
          </AppCard>
        ) : (
          weightEntries.map((entry) => {
            const isEditing =
              editingEntryId === entry.id;

            const isDeleting =
              deletingEntryId === entry.id;

            return (
              <View
                key={entry.id}
                style={styles.historyRow}
              >
                {isEditing ? (
                  <>
                    <View
                      style={
                        styles.editFormGroup
                      }
                    >
                      <Text
                        style={
                          styles.inputLabel
                        }
                      >
                        WEIGHT
                      </Text>

                      <View
                        style={
                          styles.editInputRow
                        }
                      >
                        <TextInput
                          value={editWeight}
                          onChangeText={
                            setEditWeight
                          }
                          keyboardType="decimal-pad"
                          autoFocus
                          style={
                            styles.editInput
                          }
                        />

                        <Text
                          style={styles.unit}
                        >
                          lbs
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.editFormGroup
                      }
                    >
                      <Text
                        style={
                          styles.inputLabel
                        }
                      >
                        DATE
                      </Text>

                      <TextInput
                        value={editDate}
                        onChangeText={
                          setEditDate
                        }
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={
                          colors.textSecondary
                        }
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={10}
                        style={
                          styles.editDateInput
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.actionRow
                      }
                    >
                      <Pressable
                        onPress={
                          cancelEditing
                        }
                        disabled={updating}
                        style={({
                          pressed,
                        }) => [
                          styles.secondaryButton,
                          pressed &&
                            styles.buttonPressed,
                        ]}
                      >
                        <Text
                          style={
                            styles.secondaryButtonText
                          }
                        >
                          CANCEL
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          handleUpdateWeight(
                            entry.id
                          )
                        }
                        disabled={updating}
                        style={({
                          pressed,
                        }) => [
                          styles.saveButton,
                          pressed &&
                            styles.buttonPressed,
                          updating &&
                            styles.buttonDisabled,
                        ]}
                      >
                        {updating ? (
                          <ActivityIndicator
                            color={
                              colors.background
                            }
                          />
                        ) : (
                          <Text
                            style={
                              styles.saveButtonText
                            }
                          >
                            SAVE
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <View
                      style={
                        styles.historyHeader
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.historyWeight
                          }
                        >
                          {entry.weight} lbs
                        </Text>

                        <Text
                          style={
                            styles.historyDate
                          }
                        >
                          {formatDate(
                            entry.loggedDate
                          )}
                        </Text>
                      </View>

                      {isDeleting && (
                        <ActivityIndicator
                          color={
                            colors.danger
                          }
                        />
                      )}
                    </View>

                    <View
                      style={
                        styles.actionRow
                      }
                    >
                      <Pressable
                        onPress={() =>
                          startEditing(
                            entry.id,
                            entry.weight,
                            entry.loggedDate
                          )
                        }
                        disabled={
                          isDeleting
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.secondaryButton,
                          pressed &&
                            styles.buttonPressed,
                        ]}
                      >
                        <Text
                          style={
                            styles.secondaryButtonText
                          }
                        >
                          EDIT
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          handleDeleteWeight(
                            entry.id
                          )
                        }
                        disabled={
                          isDeleting
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.deleteButton,
                          pressed &&
                            styles.buttonPressed,
                          isDeleting &&
                            styles.buttonDisabled,
                        ]}
                      >
                        <Text
                          style={
                            styles.deleteButtonText
                          }
                        >
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
    backgroundColor:
      colors.surfaceSecondary,
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
  workoutStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  workoutStat: {
    width: '48%',
    minHeight: 92,
    backgroundColor:
      colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    justifyContent: 'center',
  },
  workoutStatValue: {
    color: colors.primary,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  workoutStatLabel: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  workoutChartSection: {
    paddingTop: spacing.sm,
  },
  formGroup: {
    gap: spacing.sm,
  },
  editFormGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
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
    height: 48,
    backgroundColor:
      colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    color: colors.text,
    fontSize: fontSize.body,
    paddingHorizontal: spacing.md,
  },
  dateInput: {
    width: '100%',
    height: 48,
    backgroundColor:
      colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    color: colors.text,
    fontSize: fontSize.body,
    paddingHorizontal: spacing.md,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
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
    backgroundColor:
      colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    color: colors.text,
    fontSize: fontSize.body,
    paddingHorizontal: spacing.md,
  },
  editDateInput: {
    width: '100%',
    height: 44,
    backgroundColor:
      colors.surfaceSecondary,
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