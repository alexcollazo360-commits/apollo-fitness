import { ScrollView, StyleSheet, Text, View } from 'react-native';

import AppCard from '../../components/AppCard';
import {
    colors,
    fontSize,
    spacing,
} from '../../constants/theme';

export default function ProfileScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Profile</Text>
        <Text style={styles.subtitle}>Manage your fitness settings</Text>
      </View>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <Text style={styles.accentText}>PROFILE</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>Not set</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Height</Text>
          <Text style={styles.infoValue}>Not set</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Current Weight</Text>
          <Text style={styles.infoValue}>Not set</Text>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Fitness Goals</Text>
          <Text style={styles.accentText}>GOALS</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Goal</Text>
          <Text style={styles.infoValue}>Not set</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Goal Weight</Text>
          <Text style={styles.infoValue}>Not set</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Activity Level</Text>
          <Text style={styles.infoValue}>Not set</Text>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Nutrition Targets</Text>
          <Text style={styles.accentText}>DAILY</Text>
        </View>

        <View style={styles.targetRow}>
          <View style={styles.targetItem}>
            <Text style={styles.targetValue}>2,200</Text>
            <Text style={styles.targetLabel}>Calories</Text>
          </View>

          <View style={styles.targetItem}>
            <Text style={styles.targetValue}>180g</Text>
            <Text style={styles.targetLabel}>Protein</Text>
          </View>
        </View>

        <View style={styles.targetRow}>
          <View style={styles.targetItem}>
            <Text style={styles.targetValue}>190g</Text>
            <Text style={styles.targetLabel}>Carbs</Text>
          </View>

          <View style={styles.targetItem}>
            <Text style={styles.targetValue}>80g</Text>
            <Text style={styles.targetLabel}>Fat</Text>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Settings</Text>
          <Text style={styles.accentText}>ACCOUNT</Text>
        </View>

        {[
          'Edit Profile',
          'Update Goals',
          'Nutrition Settings',
          'Account Settings',
        ].map((item, index, items) => (
          <View key={item}>
            <View style={styles.settingRow}>
              <Text style={styles.settingText}>{item}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>

            {index < items.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  infoValue: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  targetRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  targetItem: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: 12,
  },
  targetValue: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  targetLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    marginTop: spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  settingText: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '500',
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 28,
  },
});