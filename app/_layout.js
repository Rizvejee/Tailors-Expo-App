import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';


export default function RootLayout() {
  useEffect(() => {
    NavigationBar.setBackgroundColorAsync('#1B4332')
    NavigationBar.setButtonStyleAsync('light')
  }, []);

  return (
    <>
    <StatusBar style='light' backgroundColor='#1B4332'/>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(drawer)" />
      <Stack.Screen name="add-customer" />
      <Stack.Screen name="add-order" />
      <Stack.Screen name="order-detail/[id]" />
      <Stack.Screen name="measurements" />
    </Stack>
    </>
  );
}
