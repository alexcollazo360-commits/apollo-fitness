import { useRouter } from 'expo-router';
import {
    Alert,
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
import { supabase } from '../../lib/supabase';

export default function AccountSettingsScreen() {
  const router = useRouter();

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert(
        'Unable to sign out',
        'There was a problem signing you out.'
      );
      return;
    }

    router.replace('/auth/login');
  }

  function confirmSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: handleSignOut,
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Account Settings</Text>

        <Text style={styles.subtitle}>
          Manage your Apollo Fitness account.
        </Text>
      </View>

      <AppCard>
        <Text style={styles.sectionTitle}>Account</Text>

        <Text style={styles.description}>
          Sign out of your account on this device.
        </Text>

        <Pressable
          style={styles.signOutButton}
          onPress={confirmSignOut}
        >
          <Text style={styles.signOutButtonText}>SIGN OUT</Text>
        </Pressable>
      </AppCard>

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
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

  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '600',
  },

  description: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },

  signOutButton: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },

  signOutButtonText: {
    color: colors.background,
    fontSize: fontSize.body,
    fontWeight: '700',
  },

  backButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  backButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
});