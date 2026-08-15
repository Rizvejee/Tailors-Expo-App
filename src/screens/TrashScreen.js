import { useFocusEffect } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Storage, KEYS } from '../utils/storage';
import { syncHelper } from '../utils/syncHelper';
import CustomAlert from '../components/CustomAlert';

const C = {
  green: '#1B4332', mid: '#2D6A4F', light: '#A7C4B5',
  bg: '#F7F4EF', card: '#FFFFFF', dark: '#1A1A1A',
  textMid: '#4B5563', textLight: '#9CA3AF', border: '#E5E0D8', danger: '#DC2626',
};
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export default function TrashScreen() {
  const navigation = useNavigation();
  const [trashItems,  setTrashItems]  = useState([]);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons) => setAlertConfig({ visible: true, title, message, buttons });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useFocusEffect(useCallback(() => { loadTrash(); }, []));

  const loadTrash = async () => {
    const trash = (await Storage.get(KEYS.TRASH)) || [];
    const valid = trash.filter(i => Date.now() - new Date(i.deletedAt).getTime() < THIRTY_DAYS);
    if (valid.length !== trash.length) await syncHelper.saveTrash(valid);
    setTrashItems(valid);
  };

  const restore = (item) => {
    showAlert('Restore Item', `Restore "${item.name}" back to your list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore', style: 'confirm',
        onPress: async () => {
          const trash    = (await Storage.get(KEYS.TRASH)) || [];
          const newTrash = trash.filter(t => t.id !== item.id);
          await syncHelper.saveTrash(newTrash);

          if (item.type === 'customer') {
            // customer واپس لائیں
            const customers = (await Storage.get(KEYS.CUSTOMERS)) || [];
            const { type, deletedAt, _orders, _measurements, ...original } = item;
            customers.push(original);
            await syncHelper.saveCustomers(customers);

            // orders واپس لائیں (اگر trash میں محفوظ تھے)
            if (_orders && _orders.length > 0) {
              const allOrders = (await Storage.get(KEYS.ORDERS)) || [];
              await syncHelper.saveOrders([...allOrders, ..._orders]);
            }

            // measurements واپس لائیں
            if (_measurements) {
              const allM = (await Storage.get(KEYS.MEASUREMENTS)) || {};
              allM[item.id] = _measurements;
              await syncHelper.saveMeasurements(allM);
            }
          }
          loadTrash();
        },
      },
    ]);
  };

  const permanentDelete = (item) => {
    showAlert('Delete Forever', `"${item.name}" will be permanently deleted forever.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Forever', style: 'destructive',
        onPress: async () => {
          const trash    = (await Storage.get(KEYS.TRASH)) || [];
          const newTrash = trash.filter(t => t.id !== item.id);
          await syncHelper.saveTrash(newTrash);

          // customer کا باقی data بھی مٹائیں (اگر trash میں نہیں تھا)
          if (item.type === 'customer') {
            const allOrders = (await Storage.get(KEYS.ORDERS)) || [];
            const filtered  = allOrders.filter(o => o.customerId !== item.id);
            if (filtered.length !== allOrders.length) {
              await syncHelper.saveOrders(filtered);
            }
            const allM = (await Storage.get(KEYS.MEASUREMENTS)) || {};
            if (allM[item.id]) {
              delete allM[item.id];
              await syncHelper.saveMeasurements(allM);
            }
          }
          loadTrash();
        },
      },
    ]);
  };

  const emptyTrash = () => {
    showAlert('Empty Trash', 'All items will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Empty Trash', style: 'destructive',
        onPress: async () => {
          await syncHelper.saveTrash([]);
          setTrashItems([]);
        },
      },
    ]);
  };

  const daysLeft = (deletedAt) => {
    const diff = THIRTY_DAYS - (Date.now() - new Date(deletedAt).getTime());
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  };

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <View style={s.cardIcon}>
        <Text style={{ fontSize: 22 }}>{item.type === 'customer' ? '👤' : '📦'}</Text>
      </View>
      <View style={s.cardInfo}>
        <Text style={s.cardName}>{item.name}</Text>
        <Text style={s.cardSub}>{item.type === 'customer' ? `📞 ${item.phone}` : item.clothType}</Text>
        <Text style={s.cardDays}>🗓 {daysLeft(item.deletedAt)} days left</Text>
      </View>
      <View style={s.cardActions}>
        <TouchableOpacity style={s.restoreBtn} onPress={() => restore(item)}>
          <Text style={s.restoreBtnText}>↩ Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.deleteBtn} onPress={() => permanentDelete(item)}>
          <Text style={{ fontSize: 18 }}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.menuBtn} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={{ color: '#fff', fontSize: 22 }}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>Tailors</Text>
          <Text style={s.headerTitle}>Trash</Text>
        </View>
        {trashItems.length > 0 && (
          <TouchableOpacity style={s.emptyBtn} onPress={emptyTrash}>
            <Text style={s.emptyBtnText}>Empty All</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={s.body}>
        <Text style={s.infoText}>Items are automatically deleted after 30 days</Text>
        <FlatList data={trashItems} keyExtractor={item => item.id} renderItem={renderItem}
          showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 52, marginBottom: 14 }}>🗑</Text>
              <Text style={s.emptyTitle}>Trash is empty</Text>
              <Text style={s.emptySub}>Deleted items will appear here</Text>
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
  safe:           { flex: 1, backgroundColor: C.green },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  menuBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerSub:      { fontSize: 11, color: C.light, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerTitle:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  emptyBtn:       { backgroundColor: 'rgba(220,38,38,0.25)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  emptyBtnText:   { color: '#fff', fontWeight: '700', fontSize: 13 },
  body:           { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20 },
  infoText:       { fontSize: 12, color: C.textLight, marginBottom: 16, textAlign: 'center' },
  card:           { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 2 },
  cardIcon:       { width: 44, height: 44, borderRadius: 22, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  cardInfo:       { flex: 1 },
  cardName:       { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 2 },
  cardSub:        { fontSize: 12, color: C.textMid, marginBottom: 2 },
  cardDays:       { fontSize: 11, color: C.danger, fontWeight: '600' },
  cardActions:    { flexDirection: 'row', gap: 8, alignItems: 'center' },
  restoreBtn:     { backgroundColor: '#ECFDF5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  restoreBtnText: { fontSize: 12, fontWeight: '700', color: C.mid },
  deleteBtn:      { padding: 6 },
  empty:          { alignItems: 'center', paddingTop: 60 },
  emptyTitle:     { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 6 },
  emptySub:       { fontSize: 13, color: C.textLight },
});
