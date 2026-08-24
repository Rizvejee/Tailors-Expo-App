import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Storage, KEYS } from '../utils/storage';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import CustomAlert from './CustomAlert';

const C = { green: '#1B4332', light: '#A7C4B5', textMid: '#4B5563', danger: '#DC2626' };

const ITEMS = [
  { label: 'Dashboard',    icon: '🏠', route: '/(drawer)/'            },
  { label: 'Customers',    icon: '👥', route: '/(drawer)/customers'    },
  { label: 'Orders',       icon: '📦', route: '/(drawer)/orders'       },
  { label: 'Payments',     icon: '💰', route: '/(drawer)/payments'     },
  { label: 'Expenses',     icon: '💸', route: '/(drawer)/expenses'     },
  { label: 'Trash',        icon: '🗑',  route: '/(drawer)/trash'        },
  { label: 'Settings',     icon: '⚙️', route: '/(drawer)/settings'    },
];

export default function CustomDrawer(props) {
  const [shopName,    setShopName]    = useState('Tailors');
  const [userName,    setUserName]    = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons) => setAlertConfig({ visible: true, title, message, buttons });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const active = props.state.routeNames[props.state.index];

  useEffect(() => {
    // Firebase currentUser سے تازہ name لیں
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const name = firebaseUser.displayName || firebaseUser.email.split('@')[0];
      setUserName(name);
      setShopName(name + ' Tailors');
    } else {
      // fallback AsyncStorage
      Storage.get(KEYS.LOGGED_IN).then(u => {
        if (u) {
          setUserName(u.name || u.email || '');
          setShopName((u.name || 'My') + ' Tailors');
        }
      });
    }
  }, []);

  const logout = () => {
    showAlert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await signOut(auth);
          await Storage.remove(KEYS.LOGGED_IN);
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1B4332' }}>
      <View style={s.drawerHeader}>
        <Text style={s.logoEmoji}>🧵</Text>
        <Text style={s.drawerTitle}>{shopName}</Text>
        <Text style={s.drawerUser}>👤 {userName}</Text>
      </View>

      <DrawerContentScrollView {...props} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={s.navSection}>
          {ITEMS.map(item => (
            <TouchableOpacity
              key={item.route}
              style={[s.navItem, active === item.label && s.navItemActive]}
              onPress={() => { props.navigation.closeDrawer(); router.push(item.route); }}
            >
              <Text style={s.navIcon}>{item.icon}</Text>
              <Text style={[s.navLabel, active === item.label && s.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </DrawerContentScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.logoutBtn} onPress={logout}>
          <Text style={{ fontSize: 18 }}>🚪</Text>
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title}
        message={alertConfig.message} buttons={alertConfig.buttons} onClose={hideAlert} />
    </View>
  );
}

const s = StyleSheet.create({
  drawerHeader:   { backgroundColor: C.green, padding: 24, paddingTop: 52 },
  logoEmoji:      { fontSize: 36, marginBottom: 10 },
  drawerTitle:    { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  drawerUser:     { fontSize: 13, color: C.light, fontWeight: '500' },
  navSection:     { paddingHorizontal: 12, paddingTop: 12 },
  navItem:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, marginBottom: 4 },
  navItemActive:  { backgroundColor: '#ECFDF5' },
  navIcon:        { fontSize: 20, width: 28, textAlign: 'center' },
  navLabel:       { fontSize: 15, fontWeight: '600', color: C.textMid },
  navLabelActive: { color: C.green },
  footer:         { padding: 16, paddingBottom: 52, backgroundColor: '#FFFFFF' },
  logoutBtn:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 14, backgroundColor: '#FEE2E2' },
  logoutText:     { fontSize: 15, fontWeight: '700', color: C.danger },
});
