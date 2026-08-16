import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Storage, KEYS } from '../utils/storage';
import { router, useLocalSearchParams } from 'expo-router';
import { syncHelper } from '../utils/syncHelper';
import CustomAlert from '../components/CustomAlert';

const C = {
  green: '#1B4332', mid: '#2D6A4F', light: '#A7C4B5', gold: '#D4A853',
  orange: '#E07B39', grey: '#6B7280', bg: '#F7F4EF', card: '#FFFFFF',
  dark: '#1A1A1A', textMid: '#4B5563', textLight: '#9CA3AF', border: '#E5E0D8', danger: '#DC2626',
};
const STATUS_LIST   = ['Pending', 'Ready', 'Delivered'];
const STATUS_COLORS = { Pending: C.orange, Ready: C.mid, Delivered: C.grey };
const BADGE_BG      = { Pending: '#FFF3E0', Ready: '#ECFDF5', Delivered: '#F3F4F6' };

export default function OrderDetailScreen() {
  const { id: orderId } = useLocalSearchParams();
  const [order,       setOrder]       = useState(null);
  const [customer,    setCustomer]    = useState(null);
  const [payment,     setPayment]     = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title, message, buttons) => setAlertConfig({ visible: true, title, message, buttons });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useEffect(() => { loadOrder(); }, []);

  const loadOrder = async () => {
    // orderId from useLocalSearchParams above
    const [orders, customers] = await Promise.all([Storage.get(KEYS.ORDERS), Storage.get(KEYS.CUSTOMERS)]);
    const o = (orders    || []).find(x => x.id === orderId);
    const c = o ? (customers || []).find(x => x.id === o.customerId) : null;
    setOrder(o || null);
    setCustomer(c || null);
  };

  const changeStatus = async (newStatus) => {
    const orders = (await Storage.get(KEYS.ORDERS)) || [];
    const idx    = orders.findIndex(o => o.id === order.id);
    orders[idx].status = newStatus;
    // ✅ AsyncStorage + Firebase دونوں میں save
    await syncHelper.saveOrders(orders);
    setOrder(prev => ({ ...prev, status: newStatus }));
    showAlert('Updated', `Order is now "${newStatus}".`, [{ text: 'OK', style: 'confirm' }]);
  };

  const addPayment = async () => {
    const amount = parseFloat(payment);
    if (!amount || amount <= 0) {
      showAlert('Invalid', 'Please enter a valid amount.', [{ text: 'OK', style: 'confirm' }]); return;
    }
    if (amount > order.remaining) {
      showAlert('Too Much', `Max remaining is Rs. ${order.remaining.toLocaleString()}.`, [{ text: 'OK', style: 'confirm' }]); return;
    }
    const orders = (await Storage.get(KEYS.ORDERS)) || [];
    const idx    = orders.findIndex(o => o.id === order.id);
    orders[idx].advance   = (orders[idx].advance || 0) + amount;
    orders[idx].remaining = Math.max(0, orders[idx].remaining - amount);
    // ✅ AsyncStorage + Firebase دونوں میں save
    await syncHelper.saveOrders(orders);
    setOrder(prev => ({ ...prev, advance: orders[idx].advance, remaining: orders[idx].remaining }));
    setPayment('');
    showAlert('Payment Added', `Rs. ${amount.toLocaleString()} recorded.`, [{ text: 'OK', style: 'confirm' }]);
  };

  const deleteOrder = () => {
    showAlert('Delete Order', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const orders = ((await Storage.get(KEYS.ORDERS)) || []).filter(o => o.id !== order.id);
          // ✅ AsyncStorage + Firebase دونوں میں save
          await syncHelper.saveOrders(orders);
          router.back();
        },
      },
    ]);
  };

  const sendWhatsApp = () => {
    if (!customer) return;
    const phone = customer.phone.replace(/\D/g, '').replace(/^0/, '92');
    const msg   = encodeURIComponent(
      `Assalam o Alaikum ${customer.name}!\n\nYour order from *Tailors* is now *${order.status}*.\n\n` +
      `📌 Cloth: ${order.clothType}\n📅 Delivery: ${order.deliveryDate || '—'}\n` +
      `💰 Remaining: Rs. ${Number(order.remaining || 0).toLocaleString()}\n\nJazakAllah Khair 🙏`
    );
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
  };

  if (!order) return (
    <SafeAreaView style={s.safe}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff' }}>Order not found</Text>
      </View>
    </SafeAreaView>
  );

  const pct      = order.price > 0 ? Math.round((order.advance / order.price) * 100) : 0;
  const barColor = pct === 100 ? C.mid : pct > 50 ? C.gold : C.orange;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerSub}>Tailors</Text>
            <Text style={s.headerTitle}>Order Detail</Text>
          </View>
          <TouchableOpacity style={s.deleteBtn} onPress={deleteOrder}>
            <Text style={{ fontSize: 18 }}>🗑</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={s.statusHero}>
            <View>
              <Text style={s.statusLabel}>Current Status</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[order.status] }]} />
                <Text style={[s.statusValue, { color: STATUS_COLORS[order.status] }]}>{order.status}</Text>
              </View>
            </View>
            <Text style={s.deliveryText}>📅 {order.deliveryDate || '—'}</Text>
          </View>

          <Text style={s.smallLabel}>UPDATE STATUS</Text>
          <View style={s.statusRow}>
            {STATUS_LIST.map(st => (
              <TouchableOpacity key={st}
                style={[s.statusBtn, order.status === st && { backgroundColor: BADGE_BG[st], borderColor: STATUS_COLORS[st] }]}
                onPress={() => changeStatus(st)}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: order.status === st ? STATUS_COLORS[st] : C.textMid }}>
                  {st === 'Pending' ? '🟠' : st === 'Ready' ? '🟢' : '⚫'} {st}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>ORDER INFO</Text>
            <DetailRow k="Customer"     v={customer?.name || '—'} />
            <DetailRow k="Cloth Type"   v={order.clothType} />
            <DetailRow k="Cloth Owner"  v={order.clothOwner || '—'} />
            <DetailRow k="Instructions" v={order.instructions || '—'} />
            <DetailRow k="Delivery"     v={order.deliveryDate || '—'} />
            <DetailRow k="Order Date"   v={new Date(order.createdAt).toLocaleDateString('en-PK')} last />
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>PAYMENT</Text>
            <DetailRow k="Total Price"  v={`Rs. ${Number(order.price || 0).toLocaleString()}`} />
            <DetailRow k="Advance Paid" v={`Rs. ${Number(order.advance || 0).toLocaleString()}`} />
            <DetailRow k="Remaining"    v={`Rs. ${Number(order.remaining || 0).toLocaleString()}`} />
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={s.progressLabel}>{pct}% paid</Text>
            {order.remaining > 0 ? (
              <View style={{ marginTop: 16 }}>
                <Text style={s.smallLabel}>ADD PAYMENT</Text>
                <View style={s.payRow}>
                  <TextInput style={s.payInput} value={payment} onChangeText={setPayment}
                    placeholder="Amount (Rs.)" placeholderTextColor={C.textLight} keyboardType="numeric" />
                  <TouchableOpacity style={s.payBtn} onPress={addPayment}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={{ color: C.mid, fontWeight: '700', fontSize: 13, marginTop: 10 }}>✅ Fully paid</Text>
            )}
          </View>

          <TouchableOpacity style={s.waBtn} onPress={sendWhatsApp}>
            <Text style={{ fontSize: 20 }}>💬</Text>
            <Text style={s.waBtnText}>Send WhatsApp Message</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title}
        message={alertConfig.message} buttons={alertConfig.buttons} onClose={hideAlert} />
    </SafeAreaView>
  );
}

function DetailRow({ k, v, last }) {
  return (
    <View style={[s.detailRow, last && { borderBottomWidth: 0 }]}>
      <Text style={s.detailKey}>{k}</Text>
      <Text style={s.detailVal}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.green },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  backBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  deleteBtn:     { backgroundColor: 'rgba(220,38,38,0.18)', borderRadius: 10, padding: 10 },
  headerSub:     { fontSize: 11, color: C.light, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerTitle:   { fontSize: 22, fontWeight: '800', color: '#fff' },
  body:          { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  statusHero:    { backgroundColor: C.card, borderRadius: 18, padding: 20, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  statusLabel:   { fontSize: 11, fontWeight: '700', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  statusDot:     { width: 12, height: 12, borderRadius: 6 },
  statusValue:   { fontSize: 22, fontWeight: '800' },
  deliveryText:  { fontSize: 13, color: C.textLight },
  smallLabel:    { fontSize: 11, fontWeight: '700', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 },
  statusRow:     { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statusBtn:     { flex: 1, paddingVertical: 12, paddingHorizontal: 6, borderRadius: 12, borderWidth: 2, borderColor: C.border, backgroundColor: C.card, alignItems: 'center' },
  card:          { backgroundColor: C.card, borderRadius: 18, padding: 18, marginBottom: 16, elevation: 2 },
  cardTitle:     { fontSize: 11, fontWeight: '700', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  detailRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  detailKey:     { fontSize: 13, color: C.textMid, fontWeight: '500' },
  detailVal:     { fontSize: 13, color: C.dark, fontWeight: '700', maxWidth: '55%', textAlign: 'right' },
  progressBg:    { height: 7, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden', marginTop: 12, marginBottom: 5 },
  progressFill:  { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 12, color: C.textLight },
  payRow:        { flexDirection: 'row', gap: 10, alignItems: 'center' },
  payInput:      { flex: 1, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.dark },
  payBtn:        { backgroundColor: C.green, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 },
  waBtn:         { backgroundColor: '#25D366', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  waBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
});
