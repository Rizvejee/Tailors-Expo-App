import { router, useFocusEffect } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Storage, KEYS } from '../utils/storage';

const C = {
  green: '#1B4332', mid: '#2D6A4F', light: '#A7C4B5', gold: '#D4A853',
  orange: '#E07B39', bg: '#F7F4EF', card: '#FFFFFF',
  dark: '#1A1A1A', textMid: '#4B5563', textLight: '#9CA3AF', border: '#E5E0D8',
};

export default function PaymentsScreen() {
  const navigation = useNavigation();
  const [orders,    setOrders]    = useState([]);
  const [customers, setCustomers] = useState([]);

  useFocusEffect(useCallback(() => {
    Promise.all([Storage.get(KEYS.ORDERS), Storage.get(KEYS.CUSTOMERS)]).then(([o, c]) => {
      setOrders(o || []);
      setCustomers(c || []);
    });
  }, []));

  const getName = (id) => (customers.find(c => c.id === id) || {}).name || 'Unknown';

  const today = new Date().toDateString();
  const month = new Date().getMonth();
  const year  = new Date().getFullYear();

  const todayIncome    = orders.reduce((s, o) => new Date(o.createdAt).toDateString() === today ? s + (o.advance || 0) : s, 0);
  const monthIncome    = orders.reduce((s, o) => { const d = new Date(o.createdAt); return d.getMonth() === month && d.getFullYear() === year ? s + (o.advance || 0) : s; }, 0);
  const totalPaid      = orders.reduce((s, o) => s + (o.advance    || 0), 0);
  const totalRemaining = orders.reduce((s, o) => s + (o.remaining  || 0), 0);

  const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const renderItem = ({ item }) => {
    const pct = item.price > 0 ? Math.round((item.advance / item.price) * 100) : 0;
    const barColor = pct === 100 ? C.mid : pct > 50 ? C.gold : C.orange;
    return (
      <TouchableOpacity style={s.payCard} onPress={() => router.push({ pathname: '/order-detail/[id]', params: { id: item.id } })} activeOpacity={0.82}>
        <View style={s.payTop}>
          <View>
            <Text style={s.payName}>{getName(item.customerId)}</Text>
            <Text style={s.payType}>📌 {item.clothType}</Text>
          </View>
          <Text style={s.payDate}>{new Date(item.createdAt).toLocaleDateString('en-PK')}</Text>
        </View>
        <View style={s.amountRow}>
          <AmountBox label="Total" value={item.price || 0} color={C.dark} />
          <AmountBox label="Paid"  value={item.advance || 0} color={C.mid} />
          <AmountBox label="Due"   value={item.remaining || 0} color={C.orange} />
        </View>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
        </View>
        <Text style={s.progressLabel}>{pct}% paid</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.menuBtn} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={{ color: '#fff', fontSize: 22 }}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>Rizwan Tailors</Text>
          <Text style={s.headerTitle}>Payments</Text>
        </View>
      </View>

      <View style={s.body}>
        <View style={s.summaryGrid}>
          <SumCard label="Today's Income"  value={todayIncome}    color={C.mid} />
          <SumCard label="This Month"      value={monthIncome}    color={C.gold} />
          <SumCard label="Total Received"  value={totalPaid}      color={C.green} />
          <SumCard label="Total Remaining" value={totalRemaining} color={C.orange} />
        </View>

        <Text style={s.sectionTitle}>All Payments</Text>

        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 52 }}>💰</Text>
              <Text style={s.emptyTitle}>No payments yet</Text>
              <Text style={s.emptySub}>Payments will appear as orders are created</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

function SumCard({ label, value, color }) {
  return (
    <View style={[s.sumCard, { borderLeftColor: color }]}>
      <Text style={[s.sumValue, { color }]}>Rs. {value.toLocaleString()}</Text>
      <Text style={s.sumLabel}>{label}</Text>
    </View>
  );
}
function AmountBox({ label, value, color }) {
  return (
    <View style={s.amountBox}>
      <Text style={s.amountLabel}>{label}</Text>
      <Text style={[s.amountValue, { color }]}>Rs. {Number(value).toLocaleString()}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.green },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  menuBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerSub:    { fontSize: 11, color: C.light, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#fff' },
  body:         { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20 },
  summaryGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  sumCard:      { backgroundColor: C.card, borderRadius: 16, padding: 16, width: '47%', borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  sumValue:     { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sumLabel:     { fontSize: 10, fontWeight: '600', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.3 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.dark, marginHorizontal: 20, marginBottom: 14 },
  payCard:      { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  payTop:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  payName:      { fontSize: 15, fontWeight: '700', color: C.dark },
  payType:      { fontSize: 12, color: C.textMid },
  payDate:      { fontSize: 12, color: C.textLight },
  amountRow:    { flexDirection: 'row', gap: 8, marginBottom: 12 },
  amountBox:    { flex: 1, backgroundColor: C.bg, borderRadius: 10, padding: 10 },
  amountLabel:  { fontSize: 10, fontWeight: '600', color: C.textLight, textTransform: 'uppercase', marginBottom: 3 },
  amountValue:  { fontSize: 13, fontWeight: '800' },
  progressBg:   { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel:{ fontSize: 11, color: C.textLight, marginTop: 4 },
  empty:        { alignItems: 'center', paddingTop: 60 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 6, marginTop: 14 },
  emptySub:     { fontSize: 13, color: C.textLight },
});
