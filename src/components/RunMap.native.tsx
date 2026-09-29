import {
    forwardRef,
    useImperativeHandle,
    useRef,
} from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { colors } from '../constants/theme';

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
  function RunMap(
    { style, currentCoordinate, routePoints },
    ref
  ) {
    const nativeMapRef = useRef<MapView | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        animateToRegion(region, duration) {
          nativeMapRef.current?.animateToRegion(region, duration);
        },
      }),
      []
    );

    return (
      <MapView
        ref={nativeMapRef}
        style={style}
        initialRegion={{
          latitude: currentCoordinate.latitude,
          longitude: currentCoordinate.longitude,
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
            coordinates={routePoints}
            strokeColor={colors.primary}
            strokeWidth={5}
          />
        ) : null}

        {routePoints.length > 0 ? (
          <Marker
            coordinate={routePoints[0]}
            title="Run Start"
          />
        ) : null}
      </MapView>
    );
  }
);

export default RunMap;
