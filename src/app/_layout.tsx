import type { Session } from '@supabase/supabase-js';

import {
  type Href,
  Stack,
  useRouter,
  useSegments,
} from 'expo-router';

import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import { colors } from '../constants/theme';

import {
  ProfileProvider,
  useProfile,
} from '../context/ProfileContext';

import { FoodProvider } from '../context/FoodContext';
import { ProgressProvider } from '../context/ProgressContext';
import { RecipeProvider } from '../context/RecipeContext';
import { WorkoutProvider } from '../context/WorkoutContext';

import { supabase } from '../lib/supabase';

function AppNavigator() {
  const router = useRouter();
  const segments = useSegments();

  const {
    profile,
    loading: profileLoading,
  } = useProfile();

  const [session, setSession] =
    useState<Session | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      const {
        data: { session: currentSession },
        error,
      } =
        await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error(
          'Error loading session:',
          error
        );
      }

      setSession(currentSession);
      setAuthLoading(false);
    }

    initializeAuth();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, nextSession) => {
          if (!mounted) {
            return;
          }

          setSession(nextSession);
          setAuthLoading(false);
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const firstSegment =
      segments[0];

    const isInAuth =
      firstSegment === 'auth';

    const isInOnboarding =
      firstSegment === 'onboarding';

    const isAtRoot =
      !firstSegment;

    /*
     * SIGNED OUT
     */
    if (!session) {
      if (!isInAuth) {
        router.replace(
          '/auth/login'
        );
      }

      return;
    }

    /*
     * SIGNED IN
     *
     * Wait until ProfileContext
     * finishes loading the profile.
     */
    if (profileLoading) {
      return;
    }

    /*
     * If a session exists but the
     * profile has not loaded yet,
     * wait instead of guessing
     * where the user belongs.
     */
    if (!profile) {
      return;
    }

    /*
     * ONBOARDING NOT COMPLETE
     */
    if (
      !profile.onboardingCompleted
    ) {
      if (!isInOnboarding) {
        router.replace(
          '/onboarding' as Href
        );
      }

      return;
    }

    /*
     * ONBOARDING COMPLETE
     */
    if (
      isInAuth ||
      isInOnboarding ||
      isAtRoot
    ) {
      router.replace(
        '/(tabs)'
      );
    }
  }, [
    session,
    authLoading,
    profile,
    profileLoading,
    segments,
    router,
  ]);

  if (
    authLoading ||
    (session && profileLoading)
  ) {
    return (
      <View
        style={styles.loadingScreen}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  return (
    <RecipeProvider>
      <FoodProvider>
        <WorkoutProvider>
          <ProgressProvider>
            <Stack>
              <Stack.Screen
                name="index"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="auth"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="onboarding"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="food/add"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="profile/nutrition"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="profile/edit"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="profile/goals"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="profile/account"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="workout/details"
                options={{
                  headerShown: false,
                }}
              />
            </Stack>
          </ProgressProvider>
        </WorkoutProvider>
      </FoodProvider>
    </RecipeProvider>
  );
}

export default function RootLayout() {
  return (
    <ProfileProvider>
      <AppNavigator />
    </ProfileProvider>
  );
}

const styles =
  StyleSheet.create({
    loadingScreen: {
      flex: 1,
      backgroundColor:
        colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });