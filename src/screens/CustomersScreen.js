import { router, useFocusEffect } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Storage, KEYS } from '../utils/storage';
import { syncHelper } from '../utils/syncHelper';
import CustomAlert from '../components/CustomAlert';

const C = {
  green: '#1B4332', mid: '#2D6A4F', light: '#A7C4B5', gold: '#D4A853',
  bg: '#F7F4EF', card: '#FFFFFF', dark: '#1A1A1A',
  textMid: '#4B5563', textLight: '#9CA3AF', border: '#E5E0D8',
};

export default function CustomersScreen() {
  const [customers,   setCustomers]   = useState([]);
  const [orders,      setOrders]      = useState([]);
  const [query,       setQuery]       = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons) => setAlertConfig({ visible: true, title, message, buttons });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useFocusEffect(useCallback(() => {
    Promise.all([Storage.get(KEYS.CUSTOMERS), Storage.get(KEYS.ORDERS)]).then(([c, o]) => {
      setCustomers(c || []);
      setOrders(o || []);
    });
  }, []));

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.phone.toLowerCase().includes(query.toLowerCase())
  );

  const deleteCustomer = (id) => {
    const customer = customers.find(c => c.id === id);
    showAlert('Move to Trash', `"${customer.name}" will be moved to Trash.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Move to Trash', style: 'destructive',
        onPress: async () => {
          const trash = (await Storage.get(KEYS.TRASH)) || [];
          trash.push({ ...customer, type: 'customer', deletedAt: new Date().toISOString() });
          const newC = customers.filter(c => c.id !== id);
          const newO = orders.filter(o => o.customerId !== id);
          const allM = (await Storage.get(KEYS.MEASUREMENTS)) || {};
          delete allM[id];
          await Promise.all([
            syncHelper.saveCustomers(newC),
            syncHelper.saveOrders(newO),
            syncHelper.saveMeasurements(allM),
            syncHelper.saveTrash(trash),
          ]);
          setCustomers(newC);
          setOrders(newO);
        },
      },
    ]);
  };

  const getInitials = (name) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const renderItem = ({ item }) => {
    const orderCount = orders.filter(o => o.customerId === item.id).length;
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push({ pathname: '/(drawer)/measurements', params: { customerId: item.id } })}
        activeOpacity={0.82}
      >
        <View style={s.avatar}><Text style={s.avatarText}>{getInitials(item.name)}</Text></View>
        <View style={s.info}>
          <Text style={s.name}>{item.name}</Text>
          <Text style={s.phone}>📞 {item.phone}</Text>
          <View style={s.badge}>
            <Text style={s.badgeText}>{orderCount} order{orderCount !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => deleteCustomer(item.id)} style={s.deleteBtn}>
          <Text style={{ fontSize: 18 }}>🗑</Text>
        </TouchableOpacity>
        <Text style={s.arrow}>›</Text>
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
          <Text style={s.headerSub}>Tailors</Text>
          <Text style={s.headerTitle}>Customers</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/add-customer')}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        <View style={s.searchWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput style={s.searchInput} value={query} onChangeText={setQuery}
            placeholder="Search by name or phone..." placeholderTextColor={C.textLight} />
        </View>
        <Text style={s.countText}>{filtered.length} customer{filtered.length !== 1 ? 's' : ''} found</Text>
        <FlatList
          data={filtered} keyExtractor={item => item.id} renderItem={renderItem}
          showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>👥</Text>
              <Text style={s.emptyTitle}>{query ? 'No results' : 'No customers yet'}</Text>
              <Text style={s.emptySub}>{query ? 'Try different name' : 'Tap "+ Add" to add first customer'}</Text>
            </View>
          }
        />
      </View>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title}
        message={alertConfig.message} buttons={alertConfig.buttons} onClose={hideAlert} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.green },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  menuBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerSub:   { fontSize: 11, color: C.light, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  addBtn:      { backgroundColor: C.gold, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  body:        { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, marginBottom: 14 },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 14, color: C.dark },
  countText:   { fontSize: 12, color: C.textLight, fontWeight: '500', marginBottom: 14 },
  card:        { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 2 },
  avatar:      { width: 48, height: 48, borderRadius: 24, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { color: '#fff', fontWeight: '700', fontSize: 18 },
  info:        { flex: 1 },
  name:        { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 2 },
  phone:       { fontSize: 13, color: C.textMid, marginBottom: 4 },
  badge:       { backgroundColor: '#ECFDF5', borderRadius: 20, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:   { fontSize: 11, fontWeight: '600', color: C.mid },
  deleteBtn:   { padding: 4 },
  arrow:       { fontSize: 22, color: C.textLight },
  empty:       { alignItems: 'center', paddingTop: 60 },
  emptyIcon:   { fontSize: 52, marginBottom: 14 },
  emptyTitle:  { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 6 },
  emptySub:    { fontSize: 13, color: C.textLight, textAlign: 'center' },
});
