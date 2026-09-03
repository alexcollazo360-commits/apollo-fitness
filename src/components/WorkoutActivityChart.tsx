import { useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    borderRadius,
    colors,
    fontSize,
    spacing,
} from '../constants/theme';
import type { WorkoutHistoryItem } from '../context/WorkoutContext';

type WorkoutActivityChartProps = {
  workouts?: WorkoutHistoryItem[];
};

type DayData = {
  date: string;
  label: string;
  count: number;
};

function getLocalDateString(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function WorkoutActivityChart({
  workouts = [],
}: WorkoutActivityChartProps) {
  const days = useMemo(() => {
    const result: DayData[] = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();

      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - offset);

      const dateString = getLocalDateString(date);

      const count = workouts.filter(
        (workout) =>
          workout.workoutDate === dateString
      ).length;

      result.push({
        date: dateString,
        label: date.toLocaleDateString(undefined, {
          weekday: 'short',
        }),
        count,
      });
    }

    return result;
  }, [workouts]);

  const maxCount = Math.max(
    1,
    ...days.map((day) => day.count)
  );

  const totalLastSevenDays = days.reduce(
    (total, day) => total + day.count,
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>
          LAST 7 DAYS
        </Text>

        <Text style={styles.summaryValue}>
          {totalLastSevenDays}{' '}
          {totalLastSevenDays === 1
            ? 'workout'
            : 'workouts'}
        </Text>
      </View>

      <View style={styles.chart}>
        {days.map((day) => {
          const heightPercent =
            day.count === 0
              ? 4
              : Math.max(
                  15,
                  (day.count / maxCount) * 100
                );

          return (
            <View
              key={day.date}
              style={styles.dayColumn}
            >
              <View style={styles.barArea}>
                {day.count > 0 && (
                  <Text style={styles.countText}>
                    {day.count}
                  </Text>
                )}

                <View
                  style={[
                    styles.bar,
                    {
                      height: `${heightPercent}%`,
                    },
                    day.count === 0 &&
                      styles.emptyBar,
                  ]}
                />
              </View>

              <Text style={styles.dayLabel}>
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: '700',
    letterSpacing: 1,
  },
  summaryValue: {
    color: colors.text,
    fontSize: fontSize.small,
    fontWeight: '700',
  },
  chart: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  barArea: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.xs,
  },
  countText: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  bar: {
    width: '70%',
    minHeight: 6,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  emptyBar: {
    backgroundColor: colors.surfaceSecondary,
  },
  dayLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
});