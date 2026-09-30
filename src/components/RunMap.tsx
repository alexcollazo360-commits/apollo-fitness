import {
    forwardRef,
    useImperativeHandle,
} from 'react';
import {
    StyleSheet,
    Text,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import {
    borderRadius,
    colors,
    fontSize,
    spacing,
} from '../constants/theme';

export type RunMapPoint = {
  latitude: number;
  longitude: number;
};

export type RunMapHandle = {
  animateToRegion: (
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    },
    duration?: number
  ) => void;
};

type RunMapProps = {
  style?: StyleProp<ViewStyle>;
  currentCoordinate: RunMapPoint;
  routePoints: RunMapPoint[];
};

const RunMap = forwardRef<RunMapHandle, RunMapProps>(
  function RunMap({ style }, ref) {
    useImperativeHandle(
      ref,
      () => ({
        animateToRegion() {
          // Native map animation is intentionally unavailable on web.
        },
      }),
      []
    );

    return (
      <View style={[style, styles.container]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>GPS RUN TRACKING</Text>
        </View>

        <Text style={styles.title}>Live map available on mobile</Text>
        <Text style={styles.subtitle}>
          Apollo Ultra keeps the native GPS map on iOS and Android.
          The browser version uses this web-safe map placeholder.
        </Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
  },
  badge: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginBottom: spacing.md,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 300,
  },
});

export default RunMap;
