import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppCard from '../../components/AppCard';
import {
  colors,
  fontSize,
  spacing,
} from '../../constants/theme';
import { useProfile } from '../../context/ProfileContext';

type MacroSplit = {
  protein: number;
  carbs: number;
  fat: number;
};

function getMacroSplit(
  fitnessGoal: string | null
): MacroSplit {
  switch (fitnessGoal) {
    case 'Lose Weight':
      return {
        protein: 0.35,
        carbs: 0.35,
        fat: 0.3,
      };

    case 'Gain Muscle':
      return {
        protein: 0.3,
        carbs: 0.45,
        fat: 0.25,
      };

    case 'Maintain':
    default:
      return {
        protein: 0.3,
        carbs: 0.4,
        fat: 0.3,
      };
  }
}

export default function NutritionSettingsScreen() {
  const router = useRouter();

  const {
    profile,
    updateNutritionTargets,
  } = useProfile();

  const [calories, setCalories] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setCalories(
      String(
        profile.dailyCalorieTarget
      )
    );
  }, [profile]);

  const macroSplit = useMemo(
    () =>
      getMacroSplit(
        profile?.fitnessGoal ?? null
      ),
    [profile?.fitnessGoal]
  );

  const calculatedMacros =
    useMemo(() => {
      const calorieValue =
        Number(calories);

      if (
        !Number.isFinite(
          calorieValue
        ) ||
        calorieValue <= 0
      ) {
        return {
          protein: 0,
          carbs: 0,
          fat: 0,
        };
      }

      const protein = Math.round(
        (calorieValue *
          macroSplit.protein) /
          4
      );

      const carbs = Math.round(
        (calorieValue *
          macroSplit.carbs) /
          4
      );

      const fat = Math.round(
        (calorieValue *
          macroSplit.fat) /
          9
      );

      return {
        protein,
        carbs,
        fat,
      };
    }, [
      calories,
      macroSplit,
    ]);

  async function handleSave() {
    const calorieValue =
      Number(calories);

    if (
      !Number.isFinite(
        calorieValue
      ) ||
      calorieValue <= 0
    ) {
      Alert.alert(
        'Invalid target',
        'Enter a valid daily calorie target greater than zero.'
      );

      return;
    }

    setSaving(true);

    const success =
      await updateNutritionTargets({
        dailyCalorieTarget:
          calorieValue,

        proteinTarget:
          calculatedMacros.protein,

        carbTarget:
          calculatedMacros.carbs,

        fatTarget:
          calculatedMacros.fat,
      });

    setSaving(false);

    if (!success) {
      Alert.alert(
        'Unable to save',
        'Your nutrition targets could not be updated.'
      );

      return;
    }

    router.replace(
      '/(tabs)/profile'
    );
  }

  function handleCancel() {
    router.replace(
      '/(tabs)/profile'
    );
  }

  const goalLabel =
    profile?.fitnessGoal ??
    'Maintain';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.container
      }
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text
          style={styles.screenTitle}
        >
          Nutrition Settings
        </Text>

        <Text
          style={styles.subtitle}
        >
          Set your daily calorie
          target. Apollo will
          calculate your macros
          automatically.
        </Text>
      </View>

      <AppCard>
        <View
          style={styles.inputGroup}
        >
          <Text
            style={styles.label}
          >
            DAILY CALORIES
          </Text>

          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={
              setCalories
            }
            keyboardType="numeric"
            placeholder="2200"
            placeholderTextColor={
              colors.textSecondary
            }
          />
        </View>
      </AppCard>

      <AppCard>
        <View
          style={styles.macroHeader}
        >
          <View>
            <Text
              style={styles.cardTitle}
            >
              Calculated Macros
            </Text>

            <Text
              style={
                styles.cardSubtitle
              }
            >
              Based on your current
              goal: {goalLabel}
            </Text>
          </View>
        </View>

        <View
          style={styles.macroList}
        >
          <View
            style={styles.macroRow}
          >
            <Text
              style={styles.macroLabel}
            >
              Protein
            </Text>

            <Text
              style={styles.macroValue}
            >
              {
                calculatedMacros.protein
              }
              g
            </Text>
          </View>

          <View
            style={styles.macroRow}
          >
            <Text
              style={styles.macroLabel}
            >
              Carbs
            </Text>

            <Text
              style={styles.macroValue}
            >
              {
                calculatedMacros.carbs
              }
              g
            </Text>
          </View>

          <View
            style={styles.macroRow}
          >
            <Text
              style={styles.macroLabel}
            >
              Fat
            </Text>

            <Text
              style={styles.macroValue}
            >
              {
                calculatedMacros.fat
              }
              g
            </Text>
          </View>
        </View>
      </AppCard>

      <Pressable
        style={[
          styles.saveButton,
          saving &&
            styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text
          style={
            styles.saveButtonText
          }
        >
          {saving
            ? 'SAVING...'
            : 'SAVE TARGETS'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.cancelButton}
        onPress={handleCancel}
        disabled={saving}
      >
        <Text
          style={
            styles.cancelButtonText
          }
        >
          Cancel
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    container: {
      padding: spacing.lg,
      paddingBottom:
        spacing.xxl,
      gap: spacing.md,
    },

    header: {
      marginBottom:
        spacing.sm,
    },

    screenTitle: {
      color: colors.text,
      fontSize:
        fontSize.screenTitle,
      fontWeight: '700',
    },

    subtitle: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
      marginTop:
        spacing.xs,
      lineHeight: 22,
    },

    inputGroup: {
      gap: spacing.sm,
    },

    label: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '600',
      letterSpacing: 1,
    },

    input: {
      backgroundColor:
        colors.surfaceSecondary,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal:
        spacing.md,
      paddingVertical:
        spacing.md,
      color: colors.text,
      fontSize:
        fontSize.body,
    },

    macroHeader: {
      marginBottom:
        spacing.md,
    },

    cardTitle: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    cardSubtitle: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      marginTop:
        spacing.xs,
    },

    macroList: {
      gap: spacing.md,
    },

    macroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    macroLabel: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
    },

    macroValue: {
      color: colors.text,
      fontSize:
        fontSize.body,
      fontWeight: '700',
    },

    saveButton: {
      backgroundColor:
        colors.primary,
      paddingVertical:
        spacing.md,
      borderRadius: 12,
      alignItems: 'center',
    },

    saveButtonDisabled: {
      opacity: 0.5,
    },

    saveButtonText: {
      color:
        colors.background,
      fontSize:
        fontSize.body,
      fontWeight: '700',
    },

    cancelButton: {
      paddingVertical:
        spacing.md,
      alignItems: 'center',
    },

    cancelButtonText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
      fontWeight: '600',
    },
  });