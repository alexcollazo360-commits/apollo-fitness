import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    borderRadius,
    colors,
    fontSize,
    spacing,
} from '../../constants/theme';
import { useFood } from '../../context/FoodContext';

export default function AddFoodScreen() {
  const router = useRouter();

  const { meal, id } = useLocalSearchParams<{
    meal?: string;
    id?: string;
  }>();

  const {
    foodEntries,
    addFoodEntry,
    updateFoodEntry,
  } = useFood();

  const editingEntry = id
    ? foodEntries.find((entry) => entry.id === id)
    : undefined;

  const isEditing = Boolean(editingEntry);

  const [selectedMeal, setSelectedMeal] = useState('Breakfast');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [serving, setServing] = useState('');

  useEffect(() => {
    if (editingEntry) {
      setFoodName(editingEntry.name);
      setCalories(String(editingEntry.calories));
      setProtein(String(editingEntry.protein));
      setCarbs(String(editingEntry.carbs));
      setFat(String(editingEntry.fat));
      setServing(editingEntry.serving);
      setSelectedMeal(editingEntry.meal);

      return;
    }

    if (typeof meal === 'string') {
      setSelectedMeal(meal);
    }
  }, [editingEntry, meal]);

  function handleSaveFood() {
    if (!foodName.trim()) {
      return;
    }

    const foodData = {
      name: foodName.trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      serving: serving.trim(),
      meal: selectedMeal as
        | 'Breakfast'
        | 'Lunch'
        | 'Dinner'
        | 'Snacks',
    };

    if (isEditing && id) {
      updateFoodEntry(id, foodData);
    } else {
      addFoodEntry(foodData);
    }

    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backButton}>‹ Back</Text>
          </Pressable>

          <Text style={styles.screenTitle}>
            {isEditing ? 'Edit Food' : 'Add Food'}
          </Text>

          <Text style={styles.subtitle}>
            {isEditing
              ? 'Update the nutrition information for this food.'
              : 'Enter the nutrition information for your food.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>FOOD NAME</Text>

          <TextInput
            style={styles.input}
            placeholder="Example: Grilled Chicken"
            placeholderTextColor={colors.textSecondary}
            value={foodName}
            onChangeText={setFoodName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>CALORIES</Text>

          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={calories}
            onChangeText={setCalories}
          />
        </View>

        <View style={styles.macroRow}>
          <View style={styles.macroInput}>
            <Text style={styles.label}>PROTEIN</Text>

            <TextInput
              style={styles.input}
              placeholder="0g"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={protein}
              onChangeText={setProtein}
            />
          </View>

          <View style={styles.macroInput}>
            <Text style={styles.label}>CARBS</Text>

            <TextInput
              style={styles.input}
              placeholder="0g"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={carbs}
              onChangeText={setCarbs}
            />
          </View>

          <View style={styles.macroInput}>
            <Text style={styles.label}>FAT</Text>

            <TextInput
              style={styles.input}
              placeholder="0g"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={fat}
              onChangeText={setFat}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>SERVING</Text>

          <TextInput
            style={styles.input}
            placeholder="Example: 100g"
            placeholderTextColor={colors.textSecondary}
            value={serving}
            onChangeText={setServing}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>MEAL</Text>

          <View style={styles.mealRow}>
            {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((mealOption) => {
              const isSelected = selectedMeal === mealOption;

              return (
                <Pressable
                  key={mealOption}
                  style={[
                    styles.mealButton,
                    isSelected && styles.mealButtonSelected,
                  ]}
                  onPress={() => setSelectedMeal(mealOption)}
                >
                  <Text
                    style={[
                      styles.mealButtonText,
                      isSelected && styles.mealButtonTextSelected,
                    ]}
                  >
                    {mealOption}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          style={styles.saveButton}
          onPress={handleSaveFood}
        >
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Save Changes' : 'Add Food'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
    gap: spacing.lg,
  },

  header: {
    gap: spacing.xs,
  },

  backButton: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: '600',
    marginBottom: spacing.md,
  },

  screenTitle: {
    color: colors.text,
    fontSize: fontSize.screenTitle,
    fontWeight: '700',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },

  section: {
    gap: spacing.sm,
  },

  label: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: '600',
    letterSpacing: 1,
  },

  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    color: colors.text,
    fontSize: fontSize.body,
    padding: spacing.md,
  },

  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  macroInput: {
    flex: 1,
    gap: spacing.sm,
  },

  mealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  mealButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  mealButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  mealButtonText: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '500',
  },

  mealButtonTextSelected: {
    color: colors.background,
    fontWeight: '700',
  },

  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },

  saveButtonText: {
    color: colors.background,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
});