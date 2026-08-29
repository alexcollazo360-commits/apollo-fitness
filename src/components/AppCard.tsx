import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { borderRadius, colors, spacing } from '../constants/theme';

type AppCardProps = PropsWithChildren;

export default function AppCard({ children }: AppCardProps) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
});