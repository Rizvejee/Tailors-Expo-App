import { router, useFocusEffect } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Storage, KEYS } from '../utils/storage';
import useShopName from '../utils/useShopName';

const C = {
  green: '#1B4332', mid: '#2D6A4F', light: '#A7C4B5', gold: '#D4A853',
  orange: '#E07B39', grey: '#6B7280', bg: '#F7F4EF', card: '#FFFFFF',
  dark: '#1A1A1A', textMid: '#4B5563', textLight: '#9CA3AF', border: '#E5E0D8',
};
const BORDER = { Pending: '#E07B39', Ready: '#2D6A4F', Delivered: '#6B7280' };
const BADGE_BG = { Pending: '#FFF3E0', Ready: '#ECFDF5', Delivered: '#F3F4F6' };
const BADGE_TEXT = { Pending: '#E07B39', Ready: '#2D6A4F', Delivered: '#6B7280' };
const FILTERS = ['All', 'Pending', 'Ready'];

export default function OrdersScreen() {
  const shopName = useShopName();
  const navigation = useNavigation();
  const [orders,    setOrders]    = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filter,    setFilter]    = useState('All');

  useFocusEffect(useCallback(() => {
    Promise.all([Storage.get(KEYS.ORDERS), Storage.get(KEYS.CUSTOMERS)]).then(([o, c]) => {
      setOrders(o || []);
      setCustomers(c || []);
    });
  }, []));

  const getName = (id) => (customers.find(c => c.id === id) || {}).name || 'Unknown';

  const filtered = orders.filter(o => o.status !== 'Delivered')
    .filter(o => filter === 'All' ? true : o.status === filter)
    .slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[s.card, { borderLeftColor: BORDER[item.status] || '#ccc' }]}
      onPress={() => router.push({ pathname: '/order-detail/[id]', params: { id: item.id } })}
      activeOpacity={0.82}
    >
      <View style={s.cardTop}>
        <View>
          <Text style={s.cardName}>{getName(item.customerId)}</Text>
          <Text style={s.cardType}>📌 {item.clothType}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: BADGE_BG[item.status] }]}>
          <Text style={[s.badgeText, { color: BADGE_TEXT[item.status] }]}>{item.status}</Text>
        </View>
      </View>
      <View style={s.cardBottom}>
        <Text style={s.cardDate}>📅 {item.deliveryDate || '—'}</Text>
        <Text style={s.cardPrice}>Rs. {Number(item.price || 0).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.menuBtn} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={{ color: '#fff', fontSize: 22 }}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>{shopName}</Text>
          <Text style={s.headerTitle}>Orders</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/add-order')}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        {/* Filter chips */}
        <View style={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.filterChip, filter === f && s.filterChipActive]} onPress={() => setFilter(f)}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.countText}>{filtered.length} order{filtered.length !== 1 ? 's' : ''}</Text>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📦</Text>
              <Text style={s.emptyTitle}>No orders found</Text>
              <Text style={s.emptySub}>Tap "+ Add" to create a new order</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: C.green },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  menuBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerSub:      { fontSize: 11, color: C.light, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerTitle:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  addBtn:         { backgroundColor: C.gold, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText:     { color: '#fff', fontWeight: '700', fontSize: 13 },
  body:           { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20 },
  filterRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  filterChip:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: C.border, backgroundColor: C.card },
  filterChipActive:{ borderColor: C.green, backgroundColor: C.green },
  filterText:     { fontSize: 13, fontWeight: '600', color: C.textMid },
  filterTextActive:{ color: '#fff' },
  countText:      { fontSize: 12, color: C.textLight, fontWeight: '500', marginHorizontal: 20, marginBottom: 14 },
  card:           { backgroundColor: C.card, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12, borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  cardTop:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardName:       { fontSize: 15, fontWeight: '700', color: C.dark },
  cardType:       { fontSize: 12, color: C.textMid, marginTop: 2 },
  badge:          { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText:      { fontSize: 11, fontWeight: '700' },
  cardBottom:     { flexDirection: 'row', justifyContent: 'space-between' },
  cardDate:       { fontSize: 12, color: C.textLight },
  cardPrice:      { fontSize: 14, fontWeight: '700', color: C.green },
  empty:          { alignItems: 'center', paddingTop: 60 },
  emptyIcon:      { fontSize: 52, marginBottom: 14 },
  emptyTitle:     { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 6 },
  emptySub:       { fontSize: 13, color: C.textLight },
});
