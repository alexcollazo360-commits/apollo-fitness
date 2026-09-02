import type { Session } from '@supabase/supabase-js';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import { colors } from '../constants/theme';
import { FoodProvider } from '../context/FoodContext';
import { ProfileProvider } from '../context/ProfileContext';
import { WorkoutProvider } from '../context/WorkoutContext';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    const isInAuthGroup = segments[0] === 'auth';

    if (!session && !isInAuthGroup) {
      router.replace('/auth/login');
      return;
    }

    if (session && isInAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  return (
    <ProfileProvider>
      <FoodProvider>
        <WorkoutProvider>
          <Stack>
            <Stack.Screen
              name="index"
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="auth"
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="food/add"
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="profile/nutrition"
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="profile/edit"
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="profile/goals"
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="profile/account"
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="workout/details"
              options={{ headerShown: false }}
            />
          </Stack>
        </WorkoutProvider>
      </FoodProvider>
    </ProfileProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});