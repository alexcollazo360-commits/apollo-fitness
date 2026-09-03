import { useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import Svg, {
    Circle,
    Line,
    Polyline,
} from 'react-native-svg';

import {
    colors,
    fontSize,
    spacing,
} from '../constants/theme';
import type { WeightEntry } from '../context/ProgressContext';

type WeightTrendChartProps = {
  entries: WeightEntry[];
};

export default function WeightTrendChart({
  entries,
}: WeightTrendChartProps) {
  const { width } = useWindowDimensions();

  const chartWidth = Math.max(width - spacing.lg * 4, 260);
  const chartHeight = 180;
  const horizontalPadding = 12;
  const verticalPadding = 16;

  const chartData = useMemo(() => {
    return [...entries]
      .sort(
        (a, b) =>
          new Date(a.loggedDate).getTime() -
          new Date(b.loggedDate).getTime()
      )
      .slice(-10);
  }, [entries]);

  if (chartData.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Log at least two weight entries to see your trend.
        </Text>
      </View>
    );
  }

  const weights = chartData.map((entry) => entry.weight);

  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);

  const range =
    maxWeight === minWeight
      ? 1
      : maxWeight - minWeight;

  const usableWidth =
    chartWidth - horizontalPadding * 2;

  const usableHeight =
    chartHeight - verticalPadding * 2;

  const points = chartData.map((entry, index) => {
    const x =
      horizontalPadding +
      (index / (chartData.length - 1)) *
        usableWidth;

    const normalizedWeight =
      (entry.weight - minWeight) / range;

    const y =
      verticalPadding +
      usableHeight -
      normalizedWeight * usableHeight;

    return {
      x,
      y,
      entry,
    };
  });

  const polylinePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(' ');

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.summaryLabel}>START</Text>
          <Text style={styles.summaryValue}>
            {chartData[0].weight} lbs
          </Text>
        </View>

        <View style={styles.summaryRight}>
          <Text style={styles.summaryLabel}>LATEST</Text>
          <Text style={styles.summaryValue}>
            {chartData[chartData.length - 1].weight} lbs
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Svg
          width={chartWidth}
          height={chartHeight}
        >
          <Line
            x1={horizontalPadding}
            y1={chartHeight - verticalPadding}
            x2={chartWidth - horizontalPadding}
            y2={chartHeight - verticalPadding}
            stroke={colors.border}
            strokeWidth={1}
          />

          <Line
            x1={horizontalPadding}
            y1={verticalPadding}
            x2={horizontalPadding}
            y2={chartHeight - verticalPadding}
            stroke={colors.border}
            strokeWidth={1}
          />

          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={colors.primary}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((point) => (
            <Circle
              key={point.entry.id}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={colors.primary}
            />
          ))}
        </Svg>
      </View>

      <Text style={styles.footerText}>
        Last {chartData.length} entries
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  emptyContainer: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: '700',
    letterSpacing: 1,
  },
  summaryValue: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },
  chartContainer: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    textAlign: 'center',
  },
});