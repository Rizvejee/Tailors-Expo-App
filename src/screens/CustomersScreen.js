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
  const navigation = useNavigation();
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
          // orders اور measurements الگ سے save کریں trash میں
          const allOrders = (await Storage.get(KEYS.ORDERS)) || [];
          const allMeasurements = (await Storage.get(KEYS.MEASUREMENTS)) || {};

          const customerOrders = allOrders.filter(o => o.customerId === id);
          const customerMeasurements = allMeasurements[id] || null;

          const trash = (await Storage.get(KEYS.TRASH)) || [];
          trash.push({
            ...customer,
            type: 'customer',
            deletedAt: new Date().toISOString(),
            // orders اور measurements trash کے ساتھ محفوظ کریں
            _orders: customerOrders,
            _measurements: customerMeasurements,
          });

          // صرف active list سے ہٹائیں، data محفوظ ہے trash میں
          const newC = customers.filter(c => c.id !== id);
          const newO = allOrders.filter(o => o.customerId !== id);
          const newM = { ...allMeasurements };
          delete newM[id];

          await Promise.all([
            syncHelper.saveCustomers(newC),
            syncHelper.saveOrders(newO),
            syncHelper.saveMeasurements(newM),
            syncHelper.saveTrash(trash),
          ]);
          setCustomers(newC);
          setOrders(newO);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.menuBtn} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={{ color: '#fff', fontSize: 22 }}>☰</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Customers</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/add-customer')}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        <View style={s.searchWrap}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={{ flex: 1, fontSize: 15, color: C.dark }}
            placeholder="Search by name or phone..."
            placeholderTextColor={C.textLight}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontSize: 40 }}>👥</Text>
              <Text style={{ color: C.textLight, marginTop: 12, fontSize: 14 }}>No customers yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const orderCount = orders.filter(o => o.customerId === item.id).length;
            return (
              <View style={s.card}>
                <TouchableOpacity
                  style={s.avatar}
                  onPress={() => router.push({ pathname: '/(drawer)/measurements', params: { customerId: item.id } })}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.name}</Text>
                  <Text style={s.phone}>{item.phone}</Text>
                  <View style={s.badge}>
                    <Text style={{ fontSize: 11, color: C.mid, fontWeight: '600' }}>
                      {orderCount} order{orderCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => deleteCustomer(item.id)} style={s.deleteBtn}>
                  <Text style={{ fontSize: 18 }}>🗑</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.green },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  menuBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  addBtn:      { backgroundColor: C.gold, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  body:        { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, marginBottom: 14 },
  card:        { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 2 },
  avatar:      { width: 48, height: 48, borderRadius: 24, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  name:        { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 2 },
  phone:       { fontSize: 13, color: C.textMid, marginBottom: 6 },
  badge:       { backgroundColor: '#ECFDF5', borderRadius: 20, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2 },
  deleteBtn:   { padding: 4 },
});
