import { Stack } from 'expo-router';

import { FoodProvider } from '../context/FoodContext';

export default function RootLayout() {
  return (
    <FoodProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="food/add"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </FoodProvider>
  );
}