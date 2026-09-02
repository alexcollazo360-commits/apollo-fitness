import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppCard from '../../components/AppCard';
import {
  colors,
  fontSize,
  spacing,
} from '../../constants/theme';
import { useProfile } from '../../context/ProfileContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useProfile();

  const calorieTarget = profile?.dailyCalorieTarget ?? 2200;
  const proteinTarget = profile?.proteinTarget ?? 180;
  const carbTarget = profile?.carbTarget ?? 190;
  const fatTarget = profile?.fatTarget ?? 80;

  const height =
    profile?.heightInches === null || profile?.heightInches === undefined
      ? 'Not set'
      : `${Math.floor(profile.heightInches / 12)} ft ${
          profile.heightInches % 12
        } in`;

  const currentWeight =
    profile?.currentWeight === null || profile?.currentWeight === undefined
      ? 'Not set'
      : `${profile.currentWeight} lb`;

  const goalWeight =
    profile?.goalWeight === null || profile?.goalWeight === undefined
      ? 'Not set'
      : `${profile.goalWeight} lb`;

  const fitnessGoal = profile?.fitnessGoal ?? 'Not set';
  const activityLevel = profile?.activityLevel ?? 'Not set';

  const settings = [
    {
      label: 'Edit Profile',
      onPress: () => router.push('/profile/edit'),
    },
    {
      label: 'Update Goals',
      onPress: () => router.push('/profile/goals'),
    },
    {
      label: 'Nutrition Settings',
      onPress: () => router.push('/profile/nutrition'),
    },
    {
      label: 'Account Settings',
      onPress: () => {},
    },
  ];

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
          <Text style={styles.infoValue}>{height}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Current Weight</Text>
          <Text style={styles.infoValue}>{currentWeight}</Text>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Fitness Goals</Text>
          <Text style={styles.accentText}>GOALS</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Goal</Text>
          <Text style={styles.infoValue}>{fitnessGoal}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Goal Weight</Text>
          <Text style={styles.infoValue}>{goalWeight}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Activity Level</Text>
          <Text style={styles.infoValue}>{activityLevel}</Text>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Nutrition Targets</Text>
          <Text style={styles.accentText}>DAILY</Text>
        </View>

        <View style={styles.targetRow}>
          <View style={styles.targetItem}>
            <Text style={styles.targetValue}>
              {calorieTarget.toLocaleString()}
            </Text>
            <Text style={styles.targetLabel}>Calories</Text>
          </View>

          <View style={styles.targetItem}>
            <Text style={styles.targetValue}>{proteinTarget}g</Text>
            <Text style={styles.targetLabel}>Protein</Text>
          </View>
        </View>

        <View style={styles.targetRow}>
          <View style={styles.targetItem}>
            <Text style={styles.targetValue}>{carbTarget}g</Text>
            <Text style={styles.targetLabel}>Carbs</Text>
          </View>

          <View style={styles.targetItem}>
            <Text style={styles.targetValue}>{fatTarget}g</Text>
            <Text style={styles.targetLabel}>Fat</Text>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Settings</Text>
          <Text style={styles.accentText}>ACCOUNT</Text>
        </View>

        {settings.map((item, index) => (
          <View key={item.label}>
            <Pressable
              style={styles.settingRow}
              onPress={item.onPress}
            >
              <Text style={styles.settingText}>{item.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {index < settings.length - 1 && (
              <View style={styles.divider} />
            )}
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
    paddingVertical: spacing.sm,
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