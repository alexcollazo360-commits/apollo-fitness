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
import { useFood } from '../../context/FoodContext';

export default function FoodScreen() {
  const router = useRouter();
  const { foodEntries, deleteFoodEntry } = useFood();

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
        <Text style={styles.cardTitle}>Today&apos;s Nutrition</Text>

        <View>
          <Text style={styles.label}>CALORIES</Text>

          <View style={styles.calorieRow}>
            <Text style={styles.calorieValue}>{totalCalories}</Text>
            <Text style={styles.calorieTarget}> / 2,200 kcal</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    (totalCalories / 2200) * 100,
                    100
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.label}>PROTEIN</Text>
            <Text style={styles.macroValue}>{totalProtein}</Text>
            <Text style={styles.macroTarget}>of 180g</Text>
          </View>

          <View style={styles.macroItem}>
            <Text style={styles.label}>CARBS</Text>
            <Text style={styles.macroValue}>{totalCarbs}</Text>
            <Text style={styles.macroTarget}>of 190g</Text>
          </View>

          <View style={styles.macroItem}>
            <Text style={styles.label}>FAT</Text>
            <Text style={styles.macroValue}>{totalFat}</Text>
            <Text style={styles.macroTarget}>of 80g</Text>
          </View>
        </View>
      </AppCard>

      {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((meal) => {
        const mealEntries = foodEntries.filter(
          (entry) => entry.meal === meal
        );

        return (
          <AppCard key={meal}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{meal}</Text>

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/food/add',
                    params: { meal },
                  })
                }
              >
                <Text style={styles.accentText}>+ ADD FOOD</Text>
              </Pressable>
            </View>

            {mealEntries.length === 0 ? (
              <>
                <Text style={styles.emptyTitle}>No foods logged</Text>

                <Text style={styles.secondaryText}>
                  Add food to start tracking this meal.
                </Text>
              </>
            ) : (
              mealEntries.map((entry) => (
                <View key={entry.id} style={styles.foodEntry}>
                  <Pressable
                    style={styles.foodEntryContent}
                    onPress={() =>
                      router.push({
                        pathname: '/food/add',
                        params: {
                          id: entry.id,
                        },
                      })
                    }
                  >
                    <View style={styles.foodEntryInfo}>
                      <Text style={styles.foodName}>
                        {entry.name}
                      </Text>

                      <Text style={styles.foodDetails}>
                        {entry.serving || 'Serving not specified'}
                      </Text>
                    </View>

                    <View style={styles.foodNutrition}>
                      <Text style={styles.foodCalories}>
                        {entry.calories} kcal
                      </Text>

                      <Text style={styles.foodMacros}>
                        P {entry.protein}g · C {entry.carbs}g · F{' '}
                        {entry.fat}g
                      </Text>
                    </View>
                  </Pressable>

                  <View style={styles.entryActions}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/food/add',
                          params: {
                            id: entry.id,
                          },
                        })
                      }
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => deleteFoodEntry(entry.id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </AppCard>
        );
      })}
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

  foodEntry: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },

  foodEntryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },

  foodEntryInfo: {
    flex: 1,
  },

  foodName: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '600',
  },

  foodDetails: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    marginTop: spacing.xs,
  },

  foodNutrition: {
    alignItems: 'flex-end',
  },

  foodCalories: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '600',
  },

  foodMacros: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    marginTop: spacing.xs,
  },

  entryActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  editButtonText: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: '600',
  },

  deleteButtonText: {
    color: colors.danger,
    fontSize: fontSize.small,
    fontWeight: '600',
  },
});