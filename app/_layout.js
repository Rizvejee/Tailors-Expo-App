import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(drawer)" />
      <Stack.Screen name="add-customer" />
      <Stack.Screen name="add-order" />
      <Stack.Screen name="order-detail/[id]" />
    </Stack>
  );
}
