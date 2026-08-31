import { ScrollView, StyleSheet, Text, View } from 'react-native';

import AppCard from '../../components/AppCard';
import {
  colors,
  fontSize,
  spacing,
} from '../../constants/theme';
import { useFood } from '../../context/FoodContext';
import { useProfile } from '../../context/ProfileContext';

export default function TodayScreen() {
  const { foodEntries } = useFood();
  const { profile } = useProfile();

  const calorieTarget = profile?.dailyCalorieTarget ?? 2200;
  const proteinTarget = profile?.proteinTarget ?? 180;
  const carbTarget = profile?.carbTarget ?? 190;
  const fatTarget = profile?.fatTarget ?? 80;

  const totalCalories = foodEntries.reduce(
    (total, entry) => total + entry.calories,
    0
  );

  const totalProtein = foodEntries.reduce(
    (total, entry) => total + entry.protein,
    0
  );

  const totalCarbs = foodEntries.reduce(
    (total, entry) => total + entry.carbs,
    0
  );

  const totalFat = foodEntries.reduce(
    (total, entry) => total + entry.fat,
    0
  );

  const calorieProgress =
    calorieTarget > 0
      ? Math.min((totalCalories / calorieTarget) * 100, 100)
      : 0;

  const currentWeight = profile?.currentWeight ?? null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Today</Text>
        <Text style={styles.dateText}>Your daily overview</Text>
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Daily Summary</Text>

        <View>
          <Text style={styles.label}>CALORIES</Text>

          <View style={styles.calorieRow}>
            <Text style={styles.calorieValue}>
              {totalCalories}
            </Text>

            <Text style={styles.calorieTarget}>
              {' '}
              / {calorieTarget.toLocaleString()} kcal
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${calorieProgress}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.label}>PROTEIN</Text>
            <Text style={styles.macroValue}>
              {totalProtein}
            </Text>
            <Text style={styles.macroTarget}>
              of {proteinTarget}g
            </Text>
          </View>

          <View style={styles.macroItem}>
            <Text style={styles.label}>CARBS</Text>
            <Text style={styles.macroValue}>
              {totalCarbs}
            </Text>
            <Text style={styles.macroTarget}>
              of {carbTarget}g
            </Text>
          </View>

          <View style={styles.macroItem}>
            <Text style={styles.label}>FAT</Text>
            <Text style={styles.macroValue}>
              {totalFat}
            </Text>
            <Text style={styles.macroTarget}>
              of {fatTarget}g
            </Text>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Workout</Text>
          <Text style={styles.accentText}>WORKOUT</Text>
        </View>

        <Text style={styles.emptyTitle}>No workout logged</Text>
        <Text style={styles.secondaryText}>
          Start a workout when you're ready to train.
        </Text>
      </AppCard>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Current Weight</Text>
          <Text style={styles.accentText}>PROGRESS</Text>
        </View>

        {currentWeight === null ? (
          <>
            <Text style={styles.emptyTitle}>No weight logged</Text>
            <Text style={styles.secondaryText}>
              Log your weight to begin tracking your progress.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.weightValue}>
              {currentWeight} lb
            </Text>

            <Text style={styles.secondaryText}>
              Current profile weight
            </Text>
          </>
        )}
      </AppCard>
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

  dateText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    marginTop: spacing.xs,
  },

  cardTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '600',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },

  label: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: '600',
    letterSpacing: 1,
  },

  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },

  calorieValue: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '700',
  },

  calorieTarget: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },

  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 100,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },

  macroRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  macroItem: {
    flex: 1,
  },

  macroValue: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
    marginTop: spacing.xs,
  },

  macroTarget: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },

  accentText: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: '700',
    letterSpacing: 1,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '600',
  },

  secondaryText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },

  weightValue: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '700',
  },
});