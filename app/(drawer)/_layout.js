import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import CustomDrawer from '../../src/components/CustomDrawer';

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawer {...props} />}
        screenOptions={{ headerShown: false, drawerStyle: { width: '78%' } }}
      >
        <Drawer.Screen name="index"        options={{ drawerLabel: 'Dashboard' }} />
        <Drawer.Screen name="customers"    options={{ drawerLabel: 'Customers' }} />
        <Drawer.Screen name="measurements" options={{ drawerLabel: 'Measurements' }} />
        <Drawer.Screen name="orders"       options={{ drawerLabel: 'Orders' }} />
        <Drawer.Screen name="payments"     options={{ drawerLabel: 'Payments' }} />
        <Drawer.Screen name="trash"        options={{ drawerLabel: 'Trash' }} />
        <Drawer.Screen name="settings"     options={{ drawerLabel: 'Settings' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
