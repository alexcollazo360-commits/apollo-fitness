import { ScrollView, StyleSheet, Text, View } from 'react-native';

import AppCard from '../../components/AppCard';
import {
    colors,
    fontSize,
    spacing,
} from '../../constants/theme';

export default function FoodScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Food</Text>
        <Text style={styles.subtitle}>Track today&apos;s nutrition</Text>
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Today's Nutrition</Text>

        <View>
          <Text style={styles.label}>CALORIES</Text>

          <View style={styles.calorieRow}>
            <Text style={styles.calorieValue}>0</Text>
            <Text style={styles.calorieTarget}> / 2,200 kcal</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.label}>PROTEIN</Text>
            <Text style={styles.macroValue}>0</Text>
            <Text style={styles.macroTarget}>of 180g</Text>
          </View>

          <View style={styles.macroItem}>
            <Text style={styles.label}>CARBS</Text>
            <Text style={styles.macroValue}>0</Text>
            <Text style={styles.macroTarget}>of 190g</Text>
          </View>

          <View style={styles.macroItem}>
            <Text style={styles.label}>FAT</Text>
            <Text style={styles.macroValue}>0</Text>
            <Text style={styles.macroTarget}>of 80g</Text>
          </View>
        </View>
      </AppCard>

      {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((meal) => (
        <AppCard key={meal}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{meal}</Text>
            <Text style={styles.accentText}>+ ADD FOOD</Text>
          </View>

          <Text style={styles.emptyTitle}>No foods logged</Text>
          <Text style={styles.secondaryText}>
            Add food to start tracking this meal.
          </Text>
        </AppCard>
      ))}
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
    width: '0%',
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
});