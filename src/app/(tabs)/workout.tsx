import { ScrollView, StyleSheet, Text, View } from 'react-native';

import AppCard from '../../components/AppCard';
import {
    borderRadius,
    colors,
    fontSize,
    spacing,
} from '../../constants/theme';

export default function WorkoutScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Workout</Text>
        <Text style={styles.subtitle}>Train, track, and improve</Text>
      </View>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Workout</Text>
          <Text style={styles.accentText}>TODAY</Text>
        </View>

        <Text style={styles.emptyTitle}>No workout started</Text>
        <Text style={styles.secondaryText}>
          Start a workout to begin logging exercises, sets, and reps.
        </Text>

        <View style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Start Workout</Text>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Workouts</Text>
          <Text style={styles.accentText}>HISTORY</Text>
        </View>

        <Text style={styles.emptyTitle}>No workout history yet</Text>
        <Text style={styles.secondaryText}>
          Completed workouts will appear here.
        </Text>
      </AppCard>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Workout Templates</Text>
          <Text style={styles.accentText}>ROUTINES</Text>
        </View>

        <Text style={styles.emptyTitle}>No templates created</Text>
        <Text style={styles.secondaryText}>
          Create reusable routines for your regular workouts.
        </Text>

        <View style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>+ Create Template</Text>
        </View>
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
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    marginTop: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '600',
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
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  secondaryButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
});