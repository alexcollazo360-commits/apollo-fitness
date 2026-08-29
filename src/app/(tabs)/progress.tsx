import { ScrollView, StyleSheet, Text, View } from 'react-native';

import AppCard from '../../components/AppCard';
import {
    borderRadius,
    colors,
    fontSize,
    spacing,
} from '../../constants/theme';

export default function ProgressScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Progress</Text>
        <Text style={styles.subtitle}>Track changes over time</Text>
      </View>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Weight Progress</Text>
          <Text style={styles.accentText}>WEIGHT</Text>
        </View>

        <View style={styles.weightRow}>
          <View style={styles.statItem}>
            <Text style={styles.label}>CURRENT</Text>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statTarget}>No weight logged</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.label}>GOAL</Text>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statTarget}>Not set</Text>
          </View>
        </View>

        <View style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Log Weight</Text>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Weight History</Text>
          <Text style={styles.accentText}>HISTORY</Text>
        </View>

        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>
            Your weight chart will appear here
          </Text>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Fitness Summary</Text>
          <Text style={styles.accentText}>SUMMARY</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>0</Text>
            <Text style={styles.summaryLabel}>Workouts</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>0</Text>
            <Text style={styles.summaryLabel}>Days Tracked</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>--</Text>
            <Text style={styles.summaryLabel}>Weight Change</Text>
          </View>
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
  weightRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: '600',
    letterSpacing: 1,
  },
  statValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  statTarget: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
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
  chartPlaceholder: {
    height: 180,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPlaceholderText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryValue: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});