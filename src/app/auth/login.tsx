import {
  type Href,
  useRouter,
} from 'expo-router';
import { useState } from 'react';
import {
  Alert,
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

  async function handleLogin() {
    if (
      !email.trim() ||
      !password
    ) {
      Alert.alert(
        'Missing information',
        'Enter your email and password.'
      );

      return;
    }

    setLoading(true);

    const {
      data: loginData,
      error: loginError,
    } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      setLoading(false);

      Alert.alert(
        'Login failed',
        loginError.message
      );

      return;
    }

    const userId =
      loginData.user?.id;

    if (!userId) {
      setLoading(false);

      Alert.alert(
        'Login failed',
        'Apollo could not load your account.'
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

      setLoading(false);

      Alert.alert(
        'Account error',
        'Apollo could not load your profile.'
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

        setLoading(false);

        Alert.alert(
          'Account error',
          'Apollo could not create your profile.'
        );

        return;
      }

      setLoading(false);

      router.replace(
        '/onboarding' as Href
      );

      return;
    }

    setLoading(false);

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
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={
                colors.textSecondary
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={
                setEmail
              }
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
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={
                colors.textSecondary
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={
                setPassword
              }
            />
          </View>

          <Pressable
            style={({
              pressed,
            }) => [
              styles.primaryButton,
              pressed &&
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