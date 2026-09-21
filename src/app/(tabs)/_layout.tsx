import Ionicons from '@expo/vector-icons/Ionicons';
import type {
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../constants/theme';

const TAB_ICONS = {
  index: {
    active: 'home',
    inactive: 'home-outline',
  },
  food: {
    active: 'restaurant',
    inactive: 'restaurant-outline',
  },
  workout: {
    active: 'barbell',
    inactive: 'barbell-outline',
  },
  progress: {
    active: 'stats-chart',
    inactive: 'stats-chart-outline',
  },
  profile: {
    active: 'person',
    inactive: 'person-outline',
  },
} as const;

type TabRouteName =
  keyof typeof TAB_ICONS;

function ApolloTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets =
    useSafeAreaInsets();

  const { width: screenWidth } =
    useWindowDimensions();

  const capsuleWidth =
    screenWidth * 0.88;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.tabBarLayer,
        {
          paddingBottom:
            Math.max(
              insets.bottom,
              10
            ),
        },
      ]}
    >
      <View
        style={[
          styles.capsule,
          {
            width: capsuleWidth,
          },
        ]}
      >
        {state.routes.map(
          (route, index) => {
            const {
              options,
            } =
              descriptors[
                route.key
              ];

            const isFocused =
              state.index ===
              index;

            const routeName =
              route.name as
                TabRouteName;

            const icons =
              TAB_ICONS[
                routeName
              ];

            if (!icons) {
              return null;
            }

            const label =
              typeof options.title ===
              'string'
                ? options.title
                : route.name;

            const color =
              isFocused
                ? colors.primary
                : colors.textSecondary;

            const onPress =
              () => {
                const event =
                  navigation.emit({
                    type: 'tabPress',
                    target:
                      route.key,
                    canPreventDefault:
                      true,
                  });

                if (
                  !isFocused &&
                  !event.defaultPrevented
                ) {
                  navigation.navigate(
                    route.name,
                    route.params
                  );
                }
              };

            const onLongPress =
              () => {
                navigation.emit({
                  type:
                    'tabLongPress',
                  target:
                    route.key,
                });
              };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={
                  isFocused
                    ? {
                        selected:
                          true,
                      }
                    : {}
                }
                accessibilityLabel={
                  options.tabBarAccessibilityLabel
                }
                testID={
                  options.tabBarButtonTestID
                }
                onPress={
                  onPress
                }
                onLongPress={
                  onLongPress
                }
                style={
                  styles.tabItem
                }
              >
                <Ionicons
                  name={
                    isFocused
                      ? icons.active
                      : icons.inactive
                  }
                  size={
                    routeName ===
                      'index' ||
                    routeName ===
                      'workout'
                      ? 20
                      : 19
                  }
                  color={color}
                />

                <Text
                  numberOfLines={
                    1
                  }
                  style={[
                    styles.tabLabel,
                    {
                      color,
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          }
        )}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <ApolloTabBar
          {...props}
        />
      )}
      screenOptions={{
        headerShown: false,

        sceneStyle: {
          backgroundColor:
            colors.background,
        },

        tabBarHideOnKeyboard:
          true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
        }}
      />

      <Tabs.Screen
        name="food"
        options={{
          title: 'Food',
        }}
      />

      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles =
  StyleSheet.create({
    tabBarLayer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,

      alignItems: 'center',
    },

    capsule: {
      height: 64,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',

      paddingHorizontal: 10,

      backgroundColor:
        colors.surface,

      borderWidth: 1,
      borderColor:
        colors.border,

      borderRadius: 32,

      elevation: 12,

      shadowColor:
        '#000000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.28,
      shadowRadius: 14,
    },

    tabItem: {
      flex: 1,
      height: '100%',

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 18,
    },

    tabLabel: {
      marginTop: 2,

      fontSize: 9,
      fontWeight: '700',
    },
  });