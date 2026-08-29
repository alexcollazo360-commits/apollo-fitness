import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
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