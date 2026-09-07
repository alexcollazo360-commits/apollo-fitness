import { useRouter } from 'expo-router';
import { useState } from 'react';
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
    colors,
    fontSize,
    spacing,
} from '../../constants/theme';

export default function OnboardingPersonalInfoScreen() {
  const router = useRouter();

  const [
    displayName,
    setDisplayName,
  ] = useState('');

  const [feet, setFeet] =
    useState('');

  const [inches, setInches] =
    useState('');

  const [
    currentWeight,
    setCurrentWeight,
  ] = useState('');

  const [error, setError] =
    useState('');

  function handleContinue() {
    setError('');

    const trimmedName =
      displayName.trim();

    const parsedFeet =
      Number(feet);

    const parsedInches =
      Number(inches);

    const parsedWeight =
      Number(currentWeight);

    if (!trimmedName) {
      setError(
        'Enter your name.'
      );

      return;
    }

    if (
      feet.trim() === '' ||
      Number.isNaN(parsedFeet) ||
      parsedFeet < 3 ||
      parsedFeet > 8
    ) {
      setError(
        'Enter a valid height in feet.'
      );

      return;
    }

    if (
      inches.trim() === '' ||
      Number.isNaN(parsedInches) ||
      parsedInches < 0 ||
      parsedInches > 11
    ) {
      setError(
        'Enter inches between 0 and 11.'
      );

      return;
    }

    if (
      currentWeight.trim() === '' ||
      Number.isNaN(parsedWeight) ||
      parsedWeight <= 0
    ) {
      setError(
        'Enter a valid current weight.'
      );

      return;
    }

    const heightInches =
      parsedFeet * 12 +
      parsedInches;

    router.push({
      pathname:
        '/onboarding/goal',
      params: {
        displayName:
          trimmedName,
        heightInches:
          String(heightInches),
        currentWeight:
          String(parsedWeight),
      },
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={styles.topSection}
        >
          <Text style={styles.step}>
            STEP 1 OF 4
          </Text>

          <Text style={styles.title}>
            Tell us about yourself
          </Text>

          <Text
            style={styles.subtitle}
          >
            Apollo uses this
            information to personalize
            your fitness and nutrition
            targets.
          </Text>
        </View>

        <View style={styles.form}>
          <View
            style={styles.inputGroup}
          >
            <Text
              style={styles.label}
            >
              NAME
            </Text>

            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={
                setDisplayName
              }
              placeholder="Your name"
              placeholderTextColor={
                colors.textSecondary
              }
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View
            style={styles.inputGroup}
          >
            <Text
              style={styles.label}
            >
              HEIGHT
            </Text>

            <View
              style={
                styles.heightRow
              }
            >
              <View
                style={
                  styles.heightInputGroup
                }
              >
                <TextInput
                  style={
                    styles.input
                  }
                  value={feet}
                  onChangeText={
                    setFeet
                  }
                  placeholder="5"
                  placeholderTextColor={
                    colors.textSecondary
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                />

                <Text
                  style={
                    styles.unitLabel
                  }
                >
                  ft
                </Text>
              </View>

              <View
                style={
                  styles.heightInputGroup
                }
              >
                <TextInput
                  style={
                    styles.input
                  }
                  value={inches}
                  onChangeText={
                    setInches
                  }
                  placeholder="11"
                  placeholderTextColor={
                    colors.textSecondary
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                />

                <Text
                  style={
                    styles.unitLabel
                  }
                >
                  in
                </Text>
              </View>
            </View>
          </View>

          <View
            style={styles.inputGroup}
          >
            <Text
              style={styles.label}
            >
              CURRENT WEIGHT
            </Text>

            <View
              style={
                styles.weightRow
              }
            >
              <TextInput
                style={[
                  styles.input,
                  styles.weightInput,
                ]}
                value={
                  currentWeight
                }
                onChangeText={
                  setCurrentWeight
                }
                placeholder="235"
                placeholderTextColor={
                  colors.textSecondary
                }
                keyboardType="decimal-pad"
              />

              <Text
                style={
                  styles.unitLabel
                }
              >
                lbs
              </Text>
            </View>
          </View>

          {error ? (
            <Text
              style={
                styles.errorText
              }
            >
              {error}
            </Text>
          ) : null}
        </View>

        <View
          style={
            styles.bottomSection
          }
        >
          <Pressable
            style={({
              pressed,
            }) => [
              styles.continueButton,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={
              handleContinue
            }
          >
            <Text
              style={
                styles.continueButtonText
              }
            >
              CONTINUE
            </Text>
          </Pressable>

          <Text
            style={
              styles.footerText
            }
          >
            You can change this later
            in your Profile.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
      flexGrow: 1,
      padding: spacing.lg,
      paddingTop:
        spacing.xxl,
      paddingBottom:
        spacing.xxl,
    },

    topSection: {
      gap: spacing.sm,
      marginBottom:
        spacing.xl,
    },

    step: {
      color: colors.primary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 1.5,
    },

    title: {
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
      lineHeight: 24,
    },

    form: {
      gap: spacing.xl,
    },

    inputGroup: {
      gap: spacing.sm,
    },

    label: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 1,
    },

    heightRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },

    heightInputGroup: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    weightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    weightInput: {
      flex: 1,
    },

    input: {
      flex: 1,
      backgroundColor:
        colors.surface,
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
        fontSize.subtitle,
    },

    unitLabel: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
      fontWeight: '600',
    },

    errorText: {
      color: colors.danger,
      fontSize:
        fontSize.body,
    },

    bottomSection: {
      marginTop: 'auto',
      paddingTop:
        spacing.xxl,
      gap: spacing.md,
    },

    continueButton: {
      backgroundColor:
        colors.primary,
      borderRadius: 12,
      paddingVertical:
        spacing.md,
      alignItems: 'center',
    },

    continueButtonText: {
      color:
        colors.background,
      fontSize:
        fontSize.body,
      fontWeight: '700',
      letterSpacing: 0.5,
    },

    buttonPressed: {
      opacity: 0.8,
    },

    footerText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      textAlign: 'center',
    },
  });