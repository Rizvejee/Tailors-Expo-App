import { useFocusEffect } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, TextInput, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Storage, KEYS } from '../utils/storage';
import useShopName from '../utils/useShopName';
import CustomAlert from '../components/CustomAlert';

const C = {
  green: '#1B4332', mid: '#2D6A4F', light: '#A7C4B5', gold: '#D4A853',
  orange: '#E07B39', danger: '#DC2626', bg: '#F7F4EF', card: '#FFFFFF',
  dark: '#1A1A1A', textMid: '#4B5563', textLight: '#9CA3AF', border: '#E5E0D8',
};

const CATEGORIES = ['Rent', 'Utilities', 'Materials', 'Salary', 'Bill', 'Other'];

export default function ExpensesScreen() {
  const shopName   = useShopName();
  const navigation = useNavigation();

  const [expenses,    setExpenses]    = useState([]);
  const [showModal,   setShowModal]   = useState(false);
  const [title,       setTitle]       = useState('');
  const [amount,      setAmount]      = useState('');
  const [category,    setCategory]    = useState('Other');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (t, m, b) => setAlertConfig({ visible: true, title: t, message: m, buttons: b });
  const hideAlert = () => setAlertConfig(p => ({ ...p, visible: false }));

  useFocusEffect(useCallback(() => {
    Storage.get(KEYS.EXPENSES).then(e => setExpenses(e || []));
  }, []));

  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();


  const addExpense = async () => {
    if (!title.trim()) {
      showAlert('Missing Info', 'Please enter a title.', [{ text: 'OK', style: 'confirm' }]); return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount.', [{ text: 'OK', style: 'confirm' }]); return;
    }
    const newExpense = {
      id:       Date.now().toString(),
      title:    title.trim(),
      amount:   Number(amount),
      category,
      date:     new Date().toISOString(),
    };
    const updated = [newExpense, ...expenses];
    await Storage.set(KEYS.EXPENSES, updated);
    setExpenses(updated);
    setTitle(''); setAmount(''); setCategory('Other');
    setShowModal(false);
  };

  const deleteExpense = (id) => {
    showAlert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const updated = expenses.filter(e => e.id !== id);
        await Storage.set(KEYS.EXPENSES, updated);
        setExpenses(updated);
      }},
    ]);
  };

  const catColor = (cat) => ({
    Rent: '#6366F1', Utilities: '#F59E0B', Materials: C.mid,
    Salary: C.gold, Bill: '#EC4899', Other: C.textMid,
  }[cat] || C.textMid);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.menuBtn} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={{ color: '#fff', fontSize: 22 }}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>{shopName}</Text>
          <Text style={s.headerTitle}>Expenses</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        <Text style={s.sectionTitle}>All Expenses</Text>

        <FlatList
          data={expenses}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48 }}>💸</Text>
              <Text style={s.emptyTitle}>No expenses this month</Text>
              <Text style={s.emptySub}>Tap "+ Add" to record an expense</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={[s.catDot, { backgroundColor: catColor(item.category) }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardCat}>{item.category} • {new Date(item.date).toLocaleDateString('en-PK')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={s.cardAmount}>Rs. {item.amount.toLocaleString()}</Text>
                <TouchableOpacity onPress={() => deleteExpense(item.id)}>
                  <Text style={{ fontSize: 16 }}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      {/* Add Expense Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add Expense</Text>

            <Text style={s.label}>Title</Text>
            <TextInput
              style={s.input} value={title} onChangeText={setTitle}
              placeholder="e.g. Electricity bill" placeholderTextColor={C.textLight}
            />

            <Text style={s.label}>Amount (Rs.)</Text>
            <TextInput
              style={s.input} value={amount} onChangeText={setAmount}
              keyboardType="numeric" placeholder="0"
              placeholderTextColor={C.textLight}
            />

            <Text style={s.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[s.catBtn, category === cat && { backgroundColor: C.green }]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[s.catBtnText, category === cat && { color: '#fff' }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowModal(false); setTitle(''); setAmount(''); setCategory('Other'); }}>
                <Text style={{ color: C.textMid, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={addExpense}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title}
        message={alertConfig.message} buttons={alertConfig.buttons} onClose={hideAlert} />
    </SafeAreaView>
  );
}


const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.green },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  menuBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerSub:    { fontSize: 11, color: C.light, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#fff' },
  addBtn:       { backgroundColor: C.gold, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  body:         { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.dark, marginHorizontal: 20, marginBottom: 14 },
  card:         { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 2 },
  catDot:       { width: 12, height: 12, borderRadius: 6 },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 4 },
  cardCat:      { fontSize: 12, color: C.textLight },
  cardAmount:   { fontSize: 15, fontWeight: '800', color: C.danger },
  empty:        { alignItems: 'center', paddingTop: 60 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: C.dark, marginTop: 14, marginBottom: 6 },
  emptySub:     { fontSize: 13, color: C.textLight },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
  modalTitle:   { fontSize: 20, fontWeight: '800', color: C.dark, marginBottom: 20 },
  label:        { fontSize: 12, fontWeight: '700', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input:        { backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 13, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: C.dark, marginBottom: 16 },
  catBtn:       { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border },
  catBtnText:   { fontSize: 13, fontWeight: '600', color: C.textMid },
  cancelBtn:    { flex: 1, backgroundColor: C.bg, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveBtn:      { flex: 1, backgroundColor: C.green, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
});
