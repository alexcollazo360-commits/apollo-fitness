import {
  type Href,
  useRouter,
} from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
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
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [loginError, setLoginError] =
    useState('');

  function clearError() {
    if (loginError) {
      setLoginError('');
    }
  }

  async function handleLogin() {
    setLoginError('');

    const trimmedEmail =
      email.trim();

    if (!trimmedEmail) {
      setLoginError(
        'Enter your email address.'
      );
      return;
    }

    if (!password) {
      setLoginError(
        'Enter your password.'
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: loginData,
        error: authError,
      } =
        await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

      if (authError) {
        const normalizedMessage =
          authError.message.toLowerCase();

        if (
          normalizedMessage.includes(
            'invalid login credentials'
          )
        ) {
          setLoginError(
            'Incorrect email or password. Please try again.'
          );
        } else if (
          normalizedMessage.includes(
            'email not confirmed'
          )
        ) {
          setLoginError(
            'Please confirm your email address before signing in.'
          );
        } else {
          setLoginError(
            authError.message ||
              'Unable to sign in. Please try again.'
          );
        }

        return;
      }

      if (!loginData.user?.id) {
        setLoginError(
          'Apollo could not load your account. Please try again.'
        );
        return;
      }

      /*
       * Refresh the newly-created session before Apollo
       * begins loading authenticated application data.
       *
       * This gives the app one authoritative, current
       * access token before FoodContext, ProgressContext,
       * RecipeContext, etc. begin their Supabase queries.
       */
      const {
        data: refreshedSession,
        error: refreshError,
      } =
        await supabase.auth.refreshSession();

      if (refreshError) {
        console.error(
          'Error refreshing login session:',
          refreshError
        );

        await supabase.auth.signOut();

        setLoginError(
          'Apollo could not establish a valid session. Please sign in again.'
        );

        return;
      }

      const userId =
        refreshedSession.user?.id ??
        loginData.user.id;

      if (!userId) {
        await supabase.auth.signOut();

        setLoginError(
          'Apollo could not load your account. Please try again.'
        );

        return;
      }

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(
          'onboarding_completed'
        )
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error(
          'Error checking onboarding status:',
          profileError
        );

        setLoginError(
          'Apollo could not load your profile. Please try again.'
        );

        return;
      }

      if (!profileData) {
        const {
          error: insertError,
        } = await supabase
          .from('profiles')
          .insert({
            id: userId,
          });

        if (insertError) {
          console.error(
            'Error creating profile:',
            insertError
          );

          setLoginError(
            'Apollo could not create your profile. Please try again.'
          );

          return;
        }

        router.replace(
          '/onboarding' as Href
        );

        return;
      }

      if (
        profileData.onboarding_completed
      ) {
        router.replace(
          '/(tabs)'
        );

        return;
      }

      router.replace(
        '/onboarding' as Href
      );
    } catch (error) {
      console.error(
        'Unexpected login error:',
        error
      );

      setLoginError(
        'Something went wrong while signing in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View
        style={styles.container}
      >
        <View
          style={styles.header}
        >
          <Text
            style={styles.title}
          >
            Welcome Back
          </Text>

          <Text
            style={styles.subtitle}
          >
            Sign in to continue to
            Apollo Fitness.
          </Text>
        </View>

        <View style={styles.form}>
          <View
            style={styles.section}
          >
            <Text
              style={styles.label}
            >
              EMAIL
            </Text>

            <TextInput
              style={[
                styles.input,
                loginError
                  ? styles.inputError
                  : null,
              ]}
              placeholder="you@example.com"
              placeholderTextColor={
                colors.textSecondary
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                clearError();
              }}
              editable={!loading}
              returnKeyType="next"
            />
          </View>

          <View
            style={styles.section}
          >
            <Text
              style={styles.label}
            >
              PASSWORD
            </Text>

            <TextInput
              style={[
                styles.input,
                loginError
                  ? styles.inputError
                  : null,
              ]}
              placeholder="Enter password"
              placeholderTextColor={
                colors.textSecondary
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearError();
              }}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={
                handleLogin
              }
            />
          </View>

          {loginError ? (
            <View
              style={
                styles.errorContainer
              }
            >
              <Text
                style={styles.errorText}
              >
                {loginError}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={({
              pressed,
            }) => [
              styles.primaryButton,
              pressed &&
                !loading &&
                styles.buttonPressed,
              loading &&
                styles.disabledButton,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {loading
                ? 'Signing In...'
                : 'Sign In'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push(
                '/auth/signup'
              )
            }
            disabled={loading}
          >
            <Text
              style={styles.linkText}
            >
              Don&apos;t have an
              account? Sign Up
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
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
      flex: 1,
      justifyContent:
        'center',
      padding: spacing.lg,
      gap: spacing.xl,
    },

    header: {
      gap: spacing.sm,
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
    },

    form: {
      gap: spacing.lg,
    },

    section: {
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
        colors.surface,
      borderColor:
        colors.border,
      borderWidth: 1,
      borderRadius:
        borderRadius.md,
      color: colors.text,
      fontSize:
        fontSize.body,
      padding: spacing.md,
    },

    inputError: {
      borderColor:
        colors.danger,
    },

    errorContainer: {
      backgroundColor:
        colors.surface,
      borderColor:
        colors.danger,
      borderWidth: 1,
      borderRadius:
        borderRadius.md,
      padding: spacing.md,
    },

    errorText: {
      color: colors.danger,
      fontSize:
        fontSize.small,
      lineHeight: 20,
    },

    primaryButton: {
      backgroundColor:
        colors.primary,
      borderRadius:
        borderRadius.md,
      padding: spacing.md,
      alignItems: 'center',
    },

    primaryButtonText: {
      color:
        colors.background,
      fontSize:
        fontSize.body,
      fontWeight: '700',
    },

    linkText: {
      color: colors.primary,
      fontSize:
        fontSize.body,
      textAlign: 'center',
      fontWeight: '600',
    },

    buttonPressed: {
      opacity: 0.8,
    },

    disabledButton: {
      opacity: 0.6,
    },
  });