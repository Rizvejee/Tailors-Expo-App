import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Storage, KEYS } from '../utils/storage';

const C = {
  green: '#1B4332', mid: '#2D6A4F', light: '#A7C4B5', gold: '#D4A853',
  goldDark: '#B45309', orange: '#E07B39', grey: '#6B7280',
  bg: '#F7F4EF', card: '#FFFFFF', dark: '#1A1A1A',
  textMid: '#4B5563', textLight: '#9CA3AF', border: '#E5E0D8',
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [stats,    setStats]    = useState({ todayOrders: 0, pending: 0, ready: 0, customers: 0 });
  const [shopName, setShopName] = useState('Tailors');

  const loadData = async () => {
    const [orders, customers, user] = await Promise.all([
      Storage.get(KEYS.ORDERS), Storage.get(KEYS.CUSTOMERS), Storage.get(KEYS.LOGGED_IN),
    ]);
    const o = orders || [], c = customers || [];
    const today = new Date().toDateString();
    setStats({
      todayOrders: o.filter(x => new Date(x.createdAt).toDateString() === today).length,
      pending:     o.filter(x => x.status === 'Pending').length,
      ready:       o.filter(x => x.status === 'Ready').length,
      customers:   c.length,
    });
    if (user?.name) setShopName(user.name + ' Tailors');
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.green} />
      <View style={s.header}>
        <TouchableOpacity style={s.menuBtn} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={{ color: '#fff', fontSize: 22 }}>☰</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.headerSub}>Welcome back</Text>
          <Text style={s.headerTitle}>{shopName}</Text>
        </View>
        <View style={s.headerBadge}><Text style={{ fontSize: 22 }}>🧵</Text></View>
      </View>
      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={s.dateText}>{dateStr}</Text>
        <Text style={s.sectionTitle}>Today's Overview</Text>
        <View style={s.statsGrid}>
          <StatCard label="Today's Orders" value={stats.todayOrders} color={C.green} />
          <StatCard label="Pending"        value={stats.pending}     color={C.orange} />
          <StatCard label="Ready"          value={stats.ready}       color={C.mid} />
          <StatCard label="Customers"      value={stats.customers}   color={C.gold} />
        </View>
        <View style={s.divider} />
        <Text style={s.sectionTitle}>Quick Access</Text>
        <View style={s.navGrid}>
          <NavBtn label="Customers"    icon="👥" color={C.green}    onPress={() => router.push('/(drawer)/customers')} />
          <NavBtn label="Orders"       icon="📦" color={C.mid}      onPress={() => router.push('/(drawer)/orders')} />
          <NavBtn label="Expenses"     icon="💸" color={C.goldDark} onPress={() => router.push('/(drawer)/expenses')} />
          <NavBtn label="Payments"     icon="💰" color="#92400E"    onPress={() => router.push('/(drawer)/payments')} />
        </View>
        <View style={s.legendCard}>
          <Text style={s.legendTitle}>Order Status Guide</Text>
          <LegendRow color={C.orange} text="Pending — work in progress" />
          <LegendRow color={C.mid}    text="Ready — awaiting pickup" />
          <LegendRow color={C.grey}   text="Delivered — completed" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color }]}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}
function NavBtn({ label, icon, color, onPress }) {
  return (
    <TouchableOpacity style={[s.navBtn, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.82}>
      <Text style={{ fontSize: 30 }}>{icon}</Text>
      <Text style={s.navLabel}>{label}</Text>
    </TouchableOpacity>
  );
}
function LegendRow({ color, text }) {
  return (
    <View style={s.legendRow}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={s.legendText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.green },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  menuBtn:      { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  headerSub:    { fontSize: 11, color: C.light, fontWeight: '500', letterSpacing: 0.6, textTransform: 'uppercase' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerBadge:  { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  body:         { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  dateText:     { fontSize: 12, color: C.textLight, marginHorizontal: 20, marginTop: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.dark, marginHorizontal: 20, marginBottom: 14 },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 6 },
  statCard:     { backgroundColor: C.card, borderRadius: 16, padding: 18, width: '47%', borderLeftWidth: 4, elevation: 2 },
  statValue:    { fontSize: 36, fontWeight: '800', marginBottom: 6 },
  statLabel:    { fontSize: 11, fontWeight: '600', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.3 },
  divider:      { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginVertical: 24 },
  navGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 24 },
  navBtn:       { width: '47%', borderRadius: 18, paddingVertical: 22, alignItems: 'center', gap: 10, elevation: 4 },
  navLabel:     { color: '#fff', fontSize: 14, fontWeight: '700' },
  legendCard:   { backgroundColor: C.card, borderRadius: 16, padding: 18, marginHorizontal: 20, elevation: 2 },
  legendTitle:  { fontSize: 12, fontWeight: '700', color: C.dark, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 },
  legendRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  dot:          { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  legendText:   { fontSize: 13, color: C.textMid },
});
