import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    borderRadius,
    colors,
    fontSize,
    spacing,
} from '../../constants/theme';

import { useRun } from '../../context/RunContext';

type RunStatus =
  | 'ready'
  | 'running'
  | 'paused'
  | 'finished';

function formatElapsedTime(totalSeconds: number) {
  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds =
    totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(
      2,
      '0'
    )}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(
      2,
      '0'
    )}`;
  }

  return `${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(
    2,
    '0'
  )}`;
}

type RoutePoint = {
  latitude: number;
  longitude: number;
};

export default function RunTrackerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    saveRun,
    savingRun,
  } = useRun();

  const [
    saveError,
    setSaveError,
  ] = useState<string | null>(null);

  const runStartedAt =
    useRef<string | null>(null);

  const runSaved =
    useRef(false);

  const [runStatus, setRunStatus] =
    useState<RunStatus>('ready');
  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);
  const [distanceMeters, setDistanceMeters] =
    useState(0);
  const [currentSpeedMps, setCurrentSpeedMps] =
    useState<number | null>(null);
  const [gpsStatus, setGpsStatus] =
    useState('GPS CHECKING');
  const [gpsReady, setGpsReady] =
    useState(false);
  const [gpsAccuracy, setGpsAccuracy] =
    useState<number | null>(null);
  const [locationError, setLocationError] =
    useState<string | null>(null);

  const [routePoints, setRoutePoints] =
    useState<RoutePoint[]>([]);
  const [currentCoordinate, setCurrentCoordinate] =
    useState<RoutePoint | null>(null);

  const mapRef = useRef<MapView | null>(null);

  const locationSubscription =
    useRef<Location.LocationSubscription | null>(
      null
    );
  const lastCoordinate =
    useRef<Location.LocationObjectCoords | null>(
      null
    );

  const isRunning =
    runStatus === 'running';
  const hasStarted =
    runStatus !== 'ready';

  const distanceMiles =
    distanceMeters / 1609.344;

  function formatPace(
    secondsPerMile: number | null
  ) {
    if (
      secondsPerMile === null ||
      !Number.isFinite(secondsPerMile) ||
      secondsPerMile <= 0
    ) {
      return '--:--';
    }

    const roundedSeconds =
      Math.round(secondsPerMile);
    const minutes =
      Math.floor(roundedSeconds / 60);
    const seconds =
      roundedSeconds % 60;

    return `${minutes}:${String(
      seconds
    ).padStart(2, '0')}`;
  }

  function haversineMeters(
    first: Location.LocationObjectCoords,
    second: Location.LocationObjectCoords
  ) {
    const earthRadiusMeters = 6371000;
    const toRadians = (degrees: number) =>
      (degrees * Math.PI) / 180;

    const latitude1 =
      toRadians(first.latitude);
    const latitude2 =
      toRadians(second.latitude);
    const latitudeDelta =
      toRadians(
        second.latitude - first.latitude
      );
    const longitudeDelta =
      toRadians(
        second.longitude - first.longitude
      );

    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(latitude1) *
        Math.cos(latitude2) *
        Math.sin(longitudeDelta / 2) ** 2;

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return earthRadiusMeters * c;
  }

  const averagePace =
    distanceMiles >= 0.02 &&
    elapsedSeconds > 0
      ? formatPace(
          elapsedSeconds / distanceMiles
        )
      : '--:--';

  const currentPace =
    currentSpeedMps !== null &&
    currentSpeedMps > 0.5
      ? formatPace(
          1609.344 / currentSpeedMps
        )
      : '--:--';

  // Temporary estimate until run saving is connected
  // to the user's profile/body-weight data.
  const caloriesBurned =
    Math.round(distanceMiles * 100);

  useEffect(() => {
    let mounted = true;

    async function prepareLocation() {
      try {
        const servicesEnabled =
          await Location.hasServicesEnabledAsync();

        if (!servicesEnabled) {
          if (mounted) {
            setGpsStatus('LOCATION OFF');
            setLocationError(
              'Turn on Location Services to track your run.'
            );
          }
          return;
        }

        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (
          permission.status !== 'granted'
        ) {
          if (mounted) {
            setGpsStatus(
              'PERMISSION NEEDED'
            );
            setLocationError(
              'Location permission is required for GPS run tracking.'
            );
          }
          return;
        }

        if (mounted) {
          setGpsStatus(
            'ACQUIRING GPS'
          );
          setLocationError(null);
        }

        const location =
          await Location.getCurrentPositionAsync({
            accuracy:
              Location.Accuracy.High,
          });

        if (!mounted) {
          return;
        }

        lastCoordinate.current =
          location.coords;

        const initialPoint = {
          latitude:
            location.coords.latitude,
          longitude:
            location.coords.longitude,
        };

        setCurrentCoordinate(
          initialPoint
        );
        setRoutePoints([
          initialPoint,
        ]);
        setGpsAccuracy(
          location.coords.accuracy
        );
        setGpsReady(true);
        setGpsStatus('GPS READY');
      } catch (error) {
        console.error(
          'Unable to prepare GPS:',
          error
        );

        if (mounted) {
          setGpsReady(false);
          setGpsStatus('GPS ERROR');
          setLocationError(
            'Apollo could not connect to GPS. Check Location Services and try again.'
          );
        }
      }
    }

    prepareLocation();

    return () => {
      mounted = false;
      locationSubscription.current?.remove();
      locationSubscription.current =
        null;
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds(
        (current) => current + 1
      );
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || !gpsReady) {
      locationSubscription.current?.remove();
      locationSubscription.current =
        null;
      setCurrentSpeedMps(null);
      return;
    }

    let cancelled = false;

    async function beginTracking() {
      try {
        locationSubscription.current?.remove();

        locationSubscription.current =
          await Location.watchPositionAsync(
            {
              accuracy:
                Location.Accuracy.High,
              timeInterval: 1000,
              distanceInterval: 3,
            },
            (location) => {
              if (cancelled) {
                return;
              }

              const coords =
                location.coords;
              const accuracy =
                coords.accuracy;
              const nextPoint = {
                latitude:
                  coords.latitude,
                longitude:
                  coords.longitude,
              };

              setCurrentCoordinate(
                nextPoint
              );
              setGpsAccuracy(accuracy);
              setGpsStatus('GPS ACTIVE');

              mapRef.current?.animateToRegion(
                {
                  latitude:
                    nextPoint.latitude,
                  longitude:
                    nextPoint.longitude,
                  latitudeDelta: 0.006,
                  longitudeDelta: 0.006,
                },
                500
              );

              if (
                coords.speed !== null &&
                coords.speed >= 0
              ) {
                setCurrentSpeedMps(
                  coords.speed
                );
              }

              const previous =
                lastCoordinate.current;

              if (previous) {
                const segmentMeters =
                  haversineMeters(
                    previous,
                    coords
                  );

                const acceptableAccuracy =
                  accuracy === null ||
                  accuracy <= 35;

                // Reject obvious GPS jumps while
                // still allowing normal running.
                if (
                  acceptableAccuracy &&
                  segmentMeters >= 1 &&
                  segmentMeters <= 100
                ) {
                  setDistanceMeters(
                    (current) =>
                      current +
                      segmentMeters
                  );

                  setRoutePoints(
                    (current) => [
                      ...current,
                      nextPoint,
                    ]
                  );
                }
              }

              lastCoordinate.current =
                coords;
            }
          );
      } catch (error) {
        console.error(
          'Unable to track run location:',
          error
        );
        setGpsStatus('GPS ERROR');
        setLocationError(
          'GPS tracking stopped unexpectedly.'
        );
      }
    }

    beginTracking();

    return () => {
      cancelled = true;
      locationSubscription.current?.remove();
      locationSubscription.current =
        null;
    };
  }, [isRunning, gpsReady]);

  const statusLabel =
    useMemo(() => {
      if (runStatus === 'running') {
        return 'RUNNING';
      }

      if (runStatus === 'paused') {
        return 'PAUSED';
      }

      if (runStatus === 'finished') {
        return 'FINISHED';
      }

      return 'READY';
    }, [runStatus]);

  async function refreshGps() {
    setGpsStatus('ACQUIRING GPS');
    setLocationError(null);

    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (
        permission.status !== 'granted'
      ) {
        setGpsReady(false);
        setGpsStatus(
          'PERMISSION NEEDED'
        );
        setLocationError(
          'Location permission is required for GPS run tracking.'
        );
        return;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy:
            Location.Accuracy.High,
        });

      lastCoordinate.current =
        location.coords;

      const refreshedPoint = {
        latitude:
          location.coords.latitude,
        longitude:
          location.coords.longitude,
      };

      setCurrentCoordinate(
        refreshedPoint
      );
      setRoutePoints([
        refreshedPoint,
      ]);
      setGpsAccuracy(
        location.coords.accuracy
      );

      mapRef.current?.animateToRegion(
        {
          latitude:
            refreshedPoint.latitude,
          longitude:
            refreshedPoint.longitude,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        },
        500
      );
      setGpsReady(true);
      setGpsStatus('GPS READY');
    } catch (error) {
      console.error(
        'Unable to refresh GPS:',
        error
      );
      setGpsReady(false);
      setGpsStatus('GPS ERROR');
      setLocationError(
        'Apollo could not connect to GPS.'
      );
    }
  }

  function handleStart() {
    if (!gpsReady) {
      refreshGps();
      return;
    }

    if (currentCoordinate) {
      setRoutePoints([
        currentCoordinate,
      ]);
    }

    setDistanceMeters(0);
    setElapsedSeconds(0);
    setCurrentSpeedMps(null);
    setSaveError(null);
    runSaved.current = false;
    runStartedAt.current =
      new Date().toISOString();
    setRunStatus('running');
  }

  function handlePause() {
    setRunStatus('paused');
  }

  function handleResume() {
    lastCoordinate.current = null;
    setRunStatus('running');
  }

  async function handleFinish() {
    if (
      savingRun ||
      runSaved.current
    ) {
      return;
    }

    locationSubscription.current?.remove();
    locationSubscription.current =
      null;

    setCurrentSpeedMps(null);
    setSaveError(null);

    const completedAt =
      new Date().toISOString();

    const startedAt =
      runStartedAt.current ??
      new Date(
        Date.now() -
          elapsedSeconds * 1000
      ).toISOString();

    const averagePaceSecondsPerMile =
      distanceMiles >= 0.02 &&
      elapsedSeconds > 0
        ? elapsedSeconds /
          distanceMiles
        : null;

    const savedRun =
      await saveRun({
        startedAt,
        completedAt,
        durationSeconds:
          elapsedSeconds,
        distanceMeters,
        averagePaceSecondsPerMile,
        caloriesBurned,
        routePoints:
          routePoints.map(
            (point) => ({
              latitude:
                point.latitude,
              longitude:
                point.longitude,
            })
          ),
      });

    if (!savedRun) {
      setSaveError(
        'Apollo could not save this run. Check your connection and try Finish again.'
      );

      setGpsStatus(
        gpsReady
          ? 'GPS READY'
          : 'GPS NOT READY'
      );

      return;
    }

    runSaved.current = true;
    setRunStatus('finished');

    setGpsStatus(
      gpsReady
        ? 'GPS READY'
        : 'GPS NOT READY'
    );
  }

  function handleReset() {
    locationSubscription.current?.remove();
    locationSubscription.current =
      null;
    lastCoordinate.current = null;
    runStartedAt.current = null;
    runSaved.current = false;
    setSaveError(null);
    setElapsedSeconds(0);
    setDistanceMeters(0);
    setCurrentSpeedMps(null);
    setRoutePoints(
      currentCoordinate
        ? [currentCoordinate]
        : []
    );
    setRunStatus('ready');
    setGpsStatus(
      gpsReady
        ? 'GPS READY'
        : 'GPS NOT READY'
    );
  }

  function handleBack() {
    locationSubscription.current?.remove();
    locationSubscription.current =
      null;
    router.back();
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop:
              insets.top +
              spacing.md,
            paddingBottom:
              Math.max(
                insets.bottom,
                10
              ) +
              spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.text}
            />
          </Pressable>

          <View
            style={
              styles.topBarTitleContainer
            }
          >
            <Text
              style={
                styles.topBarEyebrow
              }
            >
              APOLLO ULTRA
            </Text>

            <Text
              style={
                styles.topBarTitle
              }
            >
              Outdoor Run
            </Text>
          </View>

          <View
            style={
              styles.topBarSpacer
            }
          />
        </View>

        <View
          style={styles.statusRow}
        >
          <View
            style={[
              styles.statusDot,
              isRunning &&
                styles.statusDotActive,
            ]}
          />

          <Text
            style={styles.statusText}
          >
            {statusLabel}
          </Text>
        </View>

        <View style={styles.mapCard}>
          {currentCoordinate ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude:
                  currentCoordinate.latitude,
                longitude:
                  currentCoordinate.longitude,
                latitudeDelta: 0.006,
                longitudeDelta: 0.006,
              }}
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              {routePoints.length > 1 ? (
                <Polyline
                  coordinates={
                    routePoints
                  }
                  strokeColor={
                    colors.primary
                  }
                  strokeWidth={5}
                />
              ) : null}

              {routePoints.length > 0 ? (
                <Marker
                  coordinate={
                    routePoints[0]
                  }
                  title="Run Start"
                />
              ) : null}
            </MapView>
          ) : (
            <View
              style={
                styles.mapPlaceholder
              }
            >
              <View
                style={
                  styles.locationIcon
                }
              >
                <Ionicons
                  name="location"
                  size={28}
                  color={
                    colors.primary
                  }
                />
              </View>

              <Text
                style={
                  styles.mapTitle
                }
              >
                GPS Tracking
              </Text>

              <Text
                style={
                  styles.mapSubtitle
                }
              >
                Apollo is acquiring your
                location for the live route
                map.
              </Text>
            </View>
          )}

          <View
            style={[
              styles.gpsBadge,
              gpsReady &&
                styles.gpsBadgeReady,
            ]}
          >
            <View
              style={[
                styles.gpsDot,
                gpsReady &&
                  styles.gpsDotReady,
              ]}
            />

            <Text
              style={[
                styles.gpsBadgeText,
                gpsReady &&
                  styles.gpsBadgeTextReady,
              ]}
            >
              {gpsStatus}
            </Text>
          </View>

          {gpsAccuracy !== null ? (
            <View
              style={
                styles.mapAccuracyBadge
              }
            >
              <Text
                style={
                  styles.mapAccuracyText
                }
              >
                ±
                {Math.round(
                  gpsAccuracy
                )}{' '}
                m
              </Text>
            </View>
          ) : null}

          {locationError ? (
            <View
              style={
                styles.mapErrorBanner
              }
            >
              <Text
                style={
                  styles.mapErrorText
                }
              >
                {locationError}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={
            styles.primaryStats
          }
        >
          <View
            style={
              styles.distanceSection
            }
          >
            <Text
              style={styles.statLabel}
            >
              DISTANCE
            </Text>

            <View
              style={
                styles.distanceValueRow
              }
            >
              <Text
                style={
                  styles.distanceValue
                }
              >
                {distanceMiles.toFixed(
                  2
                )}
              </Text>

              <Text
                style={
                  styles.distanceUnit
                }
              >
                mi
              </Text>
            </View>
          </View>

          <View
            style={
              styles.timeSection
            }
          >
            <Text
              style={styles.statLabel}
            >
              TIME
            </Text>

            <Text
              style={styles.timeValue}
            >
              {formatElapsedTime(
                elapsedSeconds
              )}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View
              style={styles.statIcon}
            >
              <Ionicons
                name="speedometer-outline"
                size={20}
                color={
                  colors.primary
                }
              />
            </View>

            <Text
              style={
                styles.smallStatLabel
              }
            >
              AVG PACE
            </Text>

            <Text
              style={
                styles.smallStatValue
              }
            >
              {averagePace}
            </Text>

            <Text
              style={
                styles.smallStatUnit
              }
            >
              /mi
            </Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={styles.statIcon}
            >
              <Ionicons
                name="flash-outline"
                size={20}
                color="#60A5FA"
              />
            </View>

            <Text
              style={
                styles.smallStatLabel
              }
            >
              CURRENT PACE
            </Text>

            <Text
              style={
                styles.smallStatValue
              }
            >
              {currentPace}
            </Text>

            <Text
              style={
                styles.smallStatUnit
              }
            >
              /mi
            </Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={styles.statIcon}
            >
              <Ionicons
                name="flame-outline"
                size={20}
                color={
                  colors.warning
                }
              />
            </View>

            <Text
              style={
                styles.smallStatLabel
              }
            >
              CALORIES
            </Text>

            <Text
              style={
                styles.smallStatValue
              }
            >
              {caloriesBurned}
            </Text>

            <Text
              style={
                styles.smallStatUnit
              }
            >
              kcal
            </Text>
          </View>
        </View>

        <View
          style={
            styles.controlSection
          }
        >
          {runStatus === 'ready' ? (
            <>
              <Pressable
                onPress={
                  handleStart
                }
                style={({ pressed }) => [
                  styles.startButton,
                  !gpsReady &&
                    styles.startButtonWaiting,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name={
                    gpsReady
                      ? 'play'
                      : 'locate'
                  }
                  size={28}
                  color={
                    colors.background
                  }
                />

                <Text
                  style={
                    styles.startButtonText
                  }
                >
                  {gpsReady
                    ? 'START RUN'
                    : 'CONNECT GPS'}
                </Text>
              </Pressable>
            </>
          ) : null}

          {runStatus ===
          'running' ? (
            <View
              style={
                styles.activeControls
              }
            >
              <Pressable
                onPress={
                  handlePause
                }
                style={({ pressed }) => [
                  styles.pauseButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name="pause"
                  size={26}
                  color={
                    colors.text
                  }
                />

                <Text
                  style={
                    styles.pauseButtonText
                  }
                >
                  PAUSE
                </Text>
              </Pressable>

              <Pressable
                onPress={
                  handleFinish
                }
                disabled={savingRun}
                style={({ pressed }) => [
                  styles.finishButton,
                  savingRun &&
                    styles.buttonDisabled,
                  pressed &&
                    !savingRun &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name="stop"
                  size={24}
                  color={
                    colors.text
                  }
                />

                <Text
                  style={
                    styles.finishButtonText
                  }
                >
                  {savingRun
                    ? 'SAVING...'
                    : 'FINISH'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {runStatus ===
          'paused' ? (
            <View
              style={
                styles.activeControls
              }
            >
              <Pressable
                onPress={
                  handleResume
                }
                style={({ pressed }) => [
                  styles.resumeButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name="play"
                  size={26}
                  color={
                    colors.background
                  }
                />

                <Text
                  style={
                    styles.resumeButtonText
                  }
                >
                  RESUME
                </Text>
              </Pressable>

              <Pressable
                onPress={
                  handleFinish
                }
                disabled={savingRun}
                style={({ pressed }) => [
                  styles.finishButton,
                  savingRun &&
                    styles.buttonDisabled,
                  pressed &&
                    !savingRun &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name="stop"
                  size={24}
                  color={
                    colors.text
                  }
                />

                <Text
                  style={
                    styles.finishButtonText
                  }
                >
                  {savingRun
                    ? 'SAVING...'
                    : 'FINISH'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {runStatus ===
          'finished' ? (
            <View
              style={
                styles.finishedSection
              }
            >
              <View
                style={
                  styles.finishedMessage
                }
              >
                <Ionicons
                  name="checkmark-circle"
                  size={26}
                  color={
                    colors.primary
                  }
                />

                <View
                  style={
                    styles.finishedTextContainer
                  }
                >
                  <Text
                    style={
                      styles.finishedTitle
                    }
                  >
                    Run Complete
                  </Text>

                  <Text
                    style={
                      styles.finishedSubtitle
                    }
                  >
                    {distanceMiles.toFixed(
                      2
                    )}{' '}
                    mi •{' '}
                    {formatElapsedTime(
                      elapsedSeconds
                    )}{' '}
                    • {averagePace}/mi
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={
                  handleReset
                }
                style={({ pressed }) => [
                  styles.resetButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.resetButtonText
                  }
                >
                  START NEW RUN
                </Text>
              </Pressable>
            </View>
          ) : null}

          {saveError ? (
            <Text
              style={
                styles.saveError
              }
            >
              {saveError}
            </Text>
          ) : null}

          {hasStarted &&
          runStatus !== 'finished' ? (
            <Text
              style={
                styles.controlHelper
              }
            >
              Keep Apollo open during this
              test. Background GPS will be
              added separately.
            </Text>
          ) : null}
        </View>
      </ScrollView>
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

    content: {
      paddingHorizontal:
        spacing.lg,
      gap: spacing.lg,
    },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
    },

    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    topBarTitleContainer: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal:
        spacing.sm,
    },

    topBarSpacer: {
      width: 44,
    },

    topBarEyebrow: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 2,
    },

    topBarTitle: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
      marginTop: 2,
    },

    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: spacing.sm,
    },

    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor:
        colors.textSecondary,
    },

    statusDotActive: {
      backgroundColor:
        colors.primary,
    },

    statusText: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '800',
      letterSpacing: 1.5,
    },

    mapCard: {
      height: 230,
      width: '100%',
      backgroundColor:
        colors.surface,
      borderRadius:
        borderRadius.xl,
      borderWidth: 1,
      borderColor:
        colors.border,
      overflow: 'hidden',
      position: 'relative',
    },

    map: {
      width: '100%',
      height: '100%',
    },

    mapAccuracyBadge: {
      position: 'absolute',
      left: spacing.md,
      bottom: spacing.md,
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 100,
      paddingHorizontal:
        spacing.sm,
      paddingVertical: 6,
    },

    mapAccuracyText: {
      color: colors.text,
      fontSize: 10,
      fontWeight: '800',
    },

    mapErrorBanner: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      bottom: spacing.md,
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.danger,
      borderRadius:
        borderRadius.md,
      padding: spacing.sm,
    },

    mapErrorText: {
      color: colors.danger,
      fontSize: 10,
      lineHeight: 14,
      textAlign: 'center',
      fontWeight: '700',
    },

    mapPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal:
        spacing.xl,
    },

    locationIcon: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor:
        colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom:
        spacing.md,
    },

    mapTitle: {
      color: colors.text,
      fontSize:
        fontSize.subtitle,
      fontWeight: '700',
    },

    mapSubtitle: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      lineHeight: 18,
      textAlign: 'center',
      marginTop:
        spacing.sm,
    },

    gpsBadge: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor:
        colors.surfaceSecondary,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 100,
      paddingHorizontal:
        spacing.sm,
      paddingVertical: 6,
    },

    gpsDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor:
        colors.warning,
    },

    gpsBadgeText: {
      color:
        colors.textSecondary,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.7,
    },

    primaryStats: {
      flexDirection: 'row',
      backgroundColor:
        colors.surface,
      borderRadius:
        borderRadius.xl,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding: spacing.lg,
    },

    distanceSection: {
      flex: 1,
      borderRightWidth: 1,
      borderRightColor:
        colors.border,
      paddingRight:
        spacing.md,
    },

    timeSection: {
      flex: 1,
      paddingLeft:
        spacing.lg,
    },

    statLabel: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      fontWeight: '800',
      letterSpacing: 1.2,
    },

    distanceValueRow: {
      flexDirection: 'row',
      alignItems:
        'flex-end',
      marginTop:
        spacing.sm,
    },

    distanceValue: {
      color: colors.text,
      fontSize: 42,
      fontWeight: '800',
      letterSpacing: -1,
    },

    distanceUnit: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.body,
      fontWeight: '600',
      marginLeft: 6,
      marginBottom: 6,
    },

    timeValue: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -0.5,
      marginTop:
        spacing.sm,
    },

    statsGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
    },

    statCard: {
      flex: 1,
      minHeight: 132,
      backgroundColor:
        colors.surface,
      borderRadius:
        borderRadius.lg,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding: spacing.md,
    },

    statIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor:
        colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom:
        spacing.md,
    },

    smallStatLabel: {
      color:
        colors.textSecondary,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.7,
    },

    smallStatValue: {
      color: colors.text,
      fontSize:
        fontSize.title,
      fontWeight: '800',
      marginTop: 4,
    },

    smallStatUnit: {
      color:
        colors.textSecondary,
      fontSize: 10,
      marginTop: 2,
    },

    controlSection: {
      gap: spacing.md,
    },

    startButton: {
      minHeight: 64,
      backgroundColor:
        colors.primary,
      borderRadius: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: spacing.sm,
    },

    startButtonText: {
      color:
        colors.background,
      fontSize:
        fontSize.body,
      fontWeight: '900',
      letterSpacing: 1,
    },

    activeControls: {
      flexDirection: 'row',
      gap: spacing.md,
    },

    pauseButton: {
      flex: 1,
      minHeight: 60,
      backgroundColor:
        colors.surface,
      borderRadius: 30,
      borderWidth: 1,
      borderColor:
        colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: spacing.sm,
    },

    pauseButtonText: {
      color: colors.text,
      fontSize:
        fontSize.body,
      fontWeight: '800',
    },

    resumeButton: {
      flex: 1,
      minHeight: 60,
      backgroundColor:
        colors.primary,
      borderRadius: 30,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: spacing.sm,
    },

    resumeButtonText: {
      color:
        colors.background,
      fontSize:
        fontSize.body,
      fontWeight: '800',
    },

    finishButton: {
      flex: 1,
      minHeight: 60,
      backgroundColor:
        colors.surface,
      borderRadius: 30,
      borderWidth: 1,
      borderColor:
        colors.danger,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: spacing.sm,
    },

    finishButtonText: {
      color:
        colors.danger,
      fontSize:
        fontSize.body,
      fontWeight: '800',
    },

    controlHelper: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      textAlign: 'center',
    },

    saveError: {
      color: colors.danger,
      fontSize:
        fontSize.small,
      lineHeight: 18,
      textAlign: 'center',
    },

    buttonDisabled: {
      opacity: 0.55,
    },

    finishedSection: {
      gap: spacing.md,
    },

    finishedMessage: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius:
        borderRadius.lg,
      padding: spacing.md,
      gap: spacing.md,
    },

    finishedTextContainer: {
      flex: 1,
    },

    finishedTitle: {
      color: colors.text,
      fontSize:
        fontSize.body,
      fontWeight: '700',
    },

    finishedSubtitle: {
      color:
        colors.textSecondary,
      fontSize:
        fontSize.small,
      lineHeight: 17,
      marginTop: 3,
    },

    resetButton: {
      minHeight: 56,
      borderRadius: 28,
      borderWidth: 1,
      borderColor:
        colors.primary,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    resetButtonText: {
      color:
        colors.primary,
      fontSize:
        fontSize.body,
      fontWeight: '800',
    },

    accuracyText: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '700',
      marginTop: spacing.sm,
    },

    locationError: {
      color: colors.danger,
      fontSize: 10,
      lineHeight: 14,
      textAlign: 'center',
      marginTop: spacing.sm,
      maxWidth: 240,
    },

    gpsBadgeReady: {
      borderColor: colors.primary,
    },

    gpsDotReady: {
      backgroundColor:
        colors.primary,
    },

    gpsBadgeTextReady: {
      color: colors.primary,
    },

    startButtonWaiting: {
      opacity: 0.85,
    },

    pressed: {
      opacity: 0.8,
    },
  });