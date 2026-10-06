import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppCard from '../../components/AppCard';
import {
    borderRadius,
    colors,
    fontSize,
    spacing,
} from '../../constants/theme';
import { useWorkout } from '../../context/WorkoutContext';

export default function StartWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    activeWorkout,
    workoutTemplates,
    templatesLoading,
    startWorkout,
    startWorkoutFromTemplate,
  } = useWorkout();

  const [workoutName, setWorkoutName] = useState('');
  const [startingQuick, setStartingQuick] = useState(false);
  const [startingTemplateId, setStartingTemplateId] =
    useState<string | null>(null);

  function showMessage(title: string, message: string) {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  }

  async function handleQuickStart() {
    if (activeWorkout) {
      router.replace('/workout/strength');
      return;
    }

    setStartingQuick(true);
    const name =
      workoutName.trim() === ''
        ? 'Workout'
        : workoutName.trim();

    const success = await startWorkout(name);
    setStartingQuick(false);

    if (!success) {
      showMessage(
        'Unable to start workout',
        'Apollo could not create this workout.'
      );
      return;
    }

    router.replace('/workout/strength');
  }

  async function handleStartTemplate(templateId: string) {
    if (activeWorkout) {
      router.replace('/workout/strength');
      return;
    }

    setStartingTemplateId(templateId);
    const success =
      await startWorkoutFromTemplate(templateId);
    setStartingTemplateId(null);

    if (!success) {
      showMessage(
        'Unable to start template',
        'Apollo could not start this workout template.'
      );
      return;
    }

    router.replace('/workout/strength');
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom:
              Math.max(insets.bottom, 10) + spacing.xxl,
          },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.topTitle}>
            <Text style={styles.brand}>APOLLO ULTRA</Text>
            <Text style={styles.title}>Start Workout</Text>
          </View>

          <View style={styles.topSpacer} />
        </View>

        <Text style={styles.intro}>
          Choose how you want to train today.
        </Text>

        {activeWorkout ? (
          <AppCard>
            <View style={styles.optionHeader}>
              <View style={styles.optionIcon}>
                <Ionicons
                  name="barbell-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.optionTitle}>
                  Workout in progress
                </Text>
                <Text style={styles.muted}>
                  {activeWorkout.name}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.primaryButton}
              onPress={() =>
                router.replace('/workout/strength')
              }
            >
              <Text style={styles.primaryButtonText}>
                RESUME WORKOUT
              </Text>
            </Pressable>
          </AppCard>
        ) : (
          <>
            <AppCard>
              <View style={styles.optionHeader}>
                <View style={styles.optionIcon}>
                  <Ionicons
                    name="flash-outline"
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.optionTitle}>
                    Quick Start
                  </Text>
                  <Text style={styles.muted}>
                    Start an empty strength workout and choose exercises from the library.
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  WORKOUT NAME · OPTIONAL
                </Text>
                <TextInput
                  style={styles.input}
                  value={workoutName}
                  onChangeText={setWorkoutName}
                  placeholder="Push Day"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
              </View>

              <Pressable
                style={[
                  styles.primaryButton,
                  startingQuick && styles.disabled,
                ]}
                onPress={handleQuickStart}
                disabled={
                  startingQuick || startingTemplateId !== null
                }
              >
                {startingQuick ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    QUICK START
                  </Text>
                )}
              </Pressable>
            </AppCard>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Saved Templates
              </Text>
              <Text style={styles.sectionSubtitle}>
                Start one of your reusable routines.
              </Text>
            </View>

            {templatesLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : workoutTemplates.length === 0 ? (
              <AppCard>
                <Text style={styles.emptyTitle}>
                  No saved templates yet
                </Text>
                <Text style={styles.muted}>
                  Complete a workout and save it as a template to make future starts faster.
                </Text>
              </AppCard>
            ) : (
              workoutTemplates.map(template => (
                <AppCard key={template.id}>
                  <View style={styles.templateHeader}>
                    <View style={styles.flex}>
                      <Text style={styles.templateName}>
                        {template.name}
                      </Text>
                      <Text style={styles.muted}>
                        {template.exercises.length}{' '}
                        {template.exercises.length === 1
                          ? 'exercise'
                          : 'exercises'}
                      </Text>
                    </View>
                    <View style={styles.templateBadge}>
                      <Ionicons
                        name="bookmark-outline"
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                  </View>

                  {template.exercises.length > 0 ? (
                    <View style={styles.exerciseList}>
                      {template.exercises.slice(0, 4).map(exercise => (
                        <View
                          key={exercise.id}
                          style={styles.exerciseRow}
                        >
                          <Text
                            style={styles.exerciseName}
                            numberOfLines={1}
                          >
                            {exercise.exerciseName}
                          </Text>
                          <Text style={styles.exerciseSets}>
                            {exercise.setCount}{' '}
                            {exercise.setCount === 1 ? 'set' : 'sets'}
                          </Text>
                        </View>
                      ))}
                      {template.exercises.length > 4 ? (
                        <Text style={styles.moreText}>
                          +{template.exercises.length - 4} more
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <Pressable
                    style={[
                      styles.outlineButton,
                      startingTemplateId === template.id &&
                        styles.disabled,
                    ]}
                    disabled={
                      startingQuick || startingTemplateId !== null
                    }
                    onPress={() =>
                      handleStartTemplate(template.id)
                    }
                  >
                    {startingTemplateId === template.id ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.primary}
                      />
                    ) : (
                      <Text style={styles.outlineButtonText}>
                        START TEMPLATE
                      </Text>
                    )}
                  </Pressable>
                </AppCard>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  topBar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  topSpacer: {
    width: 44,
  },
  brand: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '800',
    marginTop: 2,
  },
  intro: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  flex: { flex: 1 },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '800',
  },
  muted: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    lineHeight: 18,
    marginTop: 3,
  },
  inputGroup: { gap: spacing.sm },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  input: {
    minHeight: 50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.body,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: fontSize.body,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    gap: 3,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  loading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '800',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  templateName: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '800',
  },
  templateBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseList: { gap: spacing.sm },
  exerciseRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  exerciseName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.small,
    fontWeight: '600',
  },
  exerciseSets: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  moreText: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: '700',
  },
  outlineButton: {
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  disabled: { opacity: 0.5 },
});
