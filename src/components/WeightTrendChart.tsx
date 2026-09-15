import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import Svg, {
  Circle,
  Line,
  Polyline,
  Text as SvgText,
} from 'react-native-svg';

import {
  borderRadius,
  colors,
  fontSize,
  spacing,
} from '../constants/theme';

import type { WeightEntry } from '../context/ProgressContext';

type WeightTrendChartProps = {
  entries?: WeightEntry[];
};

type TimeRange =
  | '7D'
  | '30D'
  | '90D'
  | 'ALL';

const TIME_RANGES: TimeRange[] = [
  '7D',
  '30D',
  '90D',
  'ALL',
];

function parseLocalDate(
  dateString: string
) {
  const [year, month, day] =
    dateString
      .split('-')
      .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

function getCutoffDate(
  days: number
) {
  const cutoff = new Date();

  cutoff.setHours(
    0,
    0,
    0,
    0
  );

  cutoff.setDate(
    cutoff.getDate() -
      days
  );

  return cutoff;
}

function formatShortDate(
  dateString: string
) {
  return parseLocalDate(
    dateString
  ).toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    }
  );
}

function formatChange(
  value: number
) {
  if (
    Math.abs(value) < 0.05
  ) {
    return '0.0 lbs';
  }

  const sign =
    value > 0 ? '+' : '';

  return `${sign}${value.toFixed(
    1
  )} lbs`;
}

export default function WeightTrendChart({
  entries = [],
}: WeightTrendChartProps) {
  const { width } =
    useWindowDimensions();

  const [
    selectedRange,
    setSelectedRange,
  ] =
    useState<TimeRange>('30D');

  const chartWidth =
    Math.max(
      Math.min(
        width -
          spacing.lg * 4,
        700
      ),
      260
    );

  const chartHeight = 210;

  const leftPadding = 44;
  const rightPadding = 14;
  const topPadding = 18;
  const bottomPadding = 32;

  const sortedEntries =
    useMemo(() => {
      return [...entries].sort(
        (a, b) => {
          const dateDifference =
            parseLocalDate(
              a.loggedDate
            ).getTime() -
            parseLocalDate(
              b.loggedDate
            ).getTime();

          if (
            dateDifference !== 0
          ) {
            return dateDifference;
          }

          return (
            new Date(
              a.createdAt
            ).getTime() -
            new Date(
              b.createdAt
            ).getTime()
          );
        }
      );
    }, [entries]);

  const chartData =
    useMemo(() => {
      if (
        selectedRange ===
        'ALL'
      ) {
        return sortedEntries;
      }

      const days =
        selectedRange === '7D'
          ? 7
          : selectedRange ===
              '30D'
            ? 30
            : 90;

      const cutoff =
        getCutoffDate(days);

      return sortedEntries.filter(
        (entry) =>
          parseLocalDate(
            entry.loggedDate
          ).getTime() >=
          cutoff.getTime()
      );
    }, [
      selectedRange,
      sortedEntries,
    ]);

  const periodChange =
    useMemo(() => {
      if (
        chartData.length < 2
      ) {
        return null;
      }

      return (
        chartData[
          chartData.length - 1
        ].weight -
        chartData[0].weight
      );
    }, [chartData]);

  const rangeSelector = (
    <View
      style={
        styles.rangeSelector
      }
    >
      {TIME_RANGES.map(
        (range) => {
          const selected =
            selectedRange ===
            range;

          return (
            <Pressable
              key={range}
              onPress={() =>
                setSelectedRange(
                  range
                )
              }
              style={({
                pressed,
              }) => [
                styles.rangeButton,

                selected &&
                  styles.rangeButtonSelected,

                pressed &&
                  styles.rangeButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.rangeButtonText,

                  selected &&
                    styles.rangeButtonTextSelected,
                ]}
              >
                {range}
              </Text>
            </Pressable>
          );
        }
      )}
    </View>
  );

  if (
    entries.length === 0
  ) {
    return (
      <View
        style={styles.container}
      >
        {rangeSelector}

        <View
          style={
            styles.emptyContainer
          }
        >
          <Text
            style={
              styles.emptyText
            }
          >
            Log your first weight
            entry to begin building
            your trend.
          </Text>
        </View>
      </View>
    );
  }

  if (
    chartData.length < 2
  ) {
    return (
      <View
        style={styles.container}
      >
        {rangeSelector}

        <View
          style={
            styles.emptyContainer
          }
        >
          <Text
            style={
              styles.emptyTitle
            }
          >
            Not enough data in{' '}
            {selectedRange}
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            At least two weigh-ins
            are needed in this time
            range to draw a trend.
          </Text>
        </View>
      </View>
    );
  }

  const weights =
    chartData.map(
      (entry) =>
        entry.weight
    );

  const rawMinWeight =
    Math.min(...weights);

  const rawMaxWeight =
    Math.max(...weights);

  const rawRange =
    rawMaxWeight -
    rawMinWeight;

  const minimumVisualRange = 4;

  const visualRange =
    Math.max(
      rawRange,
      minimumVisualRange
    );

  const rangePadding =
    Math.max(
      visualRange * 0.15,
      1
    );

  const centerWeight =
    (rawMaxWeight +
      rawMinWeight) /
    2;

  const minWeight =
    centerWeight -
    visualRange / 2 -
    rangePadding;

  const maxWeight =
    centerWeight +
    visualRange / 2 +
    rangePadding;

  const weightRange =
    maxWeight -
    minWeight;

  const usableWidth =
    chartWidth -
    leftPadding -
    rightPadding;

  const usableHeight =
    chartHeight -
    topPadding -
    bottomPadding;

  const firstDate =
    parseLocalDate(
      chartData[0].loggedDate
    ).getTime();

  const lastDate =
    parseLocalDate(
      chartData[
        chartData.length - 1
      ].loggedDate
    ).getTime();

  const dateRange =
    Math.max(
      lastDate -
        firstDate,
      1
    );

  const points =
    chartData.map(
      (entry) => {
        const entryDate =
          parseLocalDate(
            entry.loggedDate
          ).getTime();

        const x =
          leftPadding +
          ((entryDate -
            firstDate) /
            dateRange) *
            usableWidth;

        const normalizedWeight =
          (entry.weight -
            minWeight) /
          weightRange;

        const y =
          topPadding +
          usableHeight -
          normalizedWeight *
            usableHeight;

        return {
          x,
          y,
          entry,
        };
      }
    );

  const polylinePoints =
    points
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(' ');

  const latestEntry =
    chartData[
      chartData.length - 1
    ];

  const firstEntry =
    chartData[0];

  const middleEntry =
    chartData[
      Math.floor(
        (chartData.length - 1) /
          2
      )
    ];

  const topLabel =
    maxWeight.toFixed(1);

  const middleLabel =
    (
      (maxWeight +
        minWeight) /
      2
    ).toFixed(1);

  const bottomLabel =
    minWeight.toFixed(1);

  return (
    <View
      style={styles.container}
    >
      {rangeSelector}

      <View
        style={
          styles.summaryRow
        }
      >
        <View>
          <Text
            style={
              styles.summaryLabel
            }
          >
            START
          </Text>

          <Text
            style={
              styles.summaryValue
            }
          >
            {firstEntry.weight}{' '}
            lbs
          </Text>
        </View>

        <View
          style={
            styles.summaryCenter
          }
        >
          <Text
            style={
              styles.summaryLabel
            }
          >
            CHANGE
          </Text>

          <Text
            style={
              styles.changeValue
            }
          >
            {periodChange !==
            null
              ? formatChange(
                  periodChange
                )
              : '—'}
          </Text>
        </View>

        <View
          style={
            styles.summaryRight
          }
        >
          <Text
            style={
              styles.summaryLabel
            }
          >
            LATEST
          </Text>

          <Text
            style={
              styles.summaryValue
            }
          >
            {latestEntry.weight}{' '}
            lbs
          </Text>
        </View>
      </View>

      <View
        style={
          styles.chartContainer
        }
      >
        <Svg
          width={chartWidth}
          height={chartHeight}
        >
          <Line
            x1={leftPadding}
            y1={topPadding}
            x2={
              chartWidth -
              rightPadding
            }
            y2={topPadding}
            stroke={
              colors.border
            }
            strokeWidth={1}
          />

          <Line
            x1={leftPadding}
            y1={
              topPadding +
              usableHeight / 2
            }
            x2={
              chartWidth -
              rightPadding
            }
            y2={
              topPadding +
              usableHeight / 2
            }
            stroke={
              colors.border
            }
            strokeWidth={1}
          />

          <Line
            x1={leftPadding}
            y1={
              topPadding +
              usableHeight
            }
            x2={
              chartWidth -
              rightPadding
            }
            y2={
              topPadding +
              usableHeight
            }
            stroke={
              colors.border
            }
            strokeWidth={1}
          />

          <SvgText
            x={2}
            y={
              topPadding + 4
            }
            fill={
              colors.textSecondary
            }
            fontSize="10"
          >
            {topLabel}
          </SvgText>

          <SvgText
            x={2}
            y={
              topPadding +
              usableHeight / 2 +
              4
            }
            fill={
              colors.textSecondary
            }
            fontSize="10"
          >
            {middleLabel}
          </SvgText>

          <SvgText
            x={2}
            y={
              topPadding +
              usableHeight +
              4
            }
            fill={
              colors.textSecondary
            }
            fontSize="10"
          >
            {bottomLabel}
          </SvgText>

          <Polyline
            points={
              polylinePoints
            }
            fill="none"
            stroke={
              colors.primary
            }
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map(
            (point) => (
              <Circle
                key={
                  point.entry.id
                }
                cx={point.x}
                cy={point.y}
                r={4}
                fill={
                  colors.primary
                }
              />
            )
          )}

          <SvgText
            x={leftPadding}
            y={
              chartHeight - 6
            }
            fill={
              colors.textSecondary
            }
            fontSize="10"
            textAnchor="start"
          >
            {formatShortDate(
              firstEntry.loggedDate
            )}
          </SvgText>

          {chartData.length >
          2 ? (
            <SvgText
              x={
                leftPadding +
                usableWidth / 2
              }
              y={
                chartHeight - 6
              }
              fill={
                colors.textSecondary
              }
              fontSize="10"
              textAnchor="middle"
            >
              {formatShortDate(
                middleEntry.loggedDate
              )}
            </SvgText>
          ) : null}

          <SvgText
            x={
              chartWidth -
              rightPadding
            }
            y={
              chartHeight - 6
            }
            fill={
              colors.textSecondary
            }
            fontSize="10"
            textAnchor="end"
          >
            {formatShortDate(
              latestEntry.loggedDate
            )}
          </SvgText>
        </Svg>
      </View>

      <Text
        style={
          styles.footerText
        }
      >
        {chartData.length}{' '}
        {chartData.length === 1
          ? 'weigh-in'
          : 'weigh-ins'}{' '}
        shown
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: spacing.md,
    },

    rangeSelector: {
      flexDirection: 'row',
      backgroundColor:
        colors.surfaceSecondary,
      borderRadius:
        borderRadius.md,
      padding: 4,
      gap: 4,
    },

    rangeButton: {
      flex: 1,
      minHeight: 36,
      borderRadius:
        borderRadius.sm,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    rangeButtonSelected: {
      backgroundColor:
        colors.primary,
    },

    rangeButtonPressed: {
      opacity: 0.8,
    },

    rangeButtonText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
    },

    rangeButtonTextSelected: {
      color:
        colors.background,
    },

    emptyContainer: {
      minHeight: 150,
      alignItems: 'center',
      justifyContent:
        'center',
      gap: spacing.sm,
      paddingHorizontal:
        spacing.md,
    },

    emptyTitle: {
      color: colors.text,
      fontSize:
        fontSize.body,
      fontWeight: '700',
      textAlign: 'center',
    },

    emptyText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
      textAlign: 'center',
      lineHeight: 21,
    },

    summaryRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
    },

    summaryCenter: {
      flex: 1,
      alignItems: 'center',
    },

    summaryRight: {
      alignItems:
        'flex-end',
    },

    summaryLabel: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '700',
      letterSpacing: 1,
    },

    summaryValue: {
      marginTop:
        spacing.xs,
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    changeValue: {
      marginTop:
        spacing.xs,
      color:
        colors.primary,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    chartContainer: {
      alignItems: 'center',
      overflow: 'hidden',
    },

    footerText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      textAlign: 'center',
    },
  });