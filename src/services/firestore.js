// Firestore helper — تمام CRUD operations
import {
  collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';

// Current user کی collection کا reference
const userCol = (colName) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not logged in');
  return collection(db, 'users', uid, colName);
};

const userDoc = (colName, docId) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not logged in');
  return doc(db, 'users', uid, colName, docId);
};

// ── Customers ──
export const fsCustomers = {
  save: async (customer) => {
    await setDoc(userDoc('customers', customer.id), {
      ...customer,
      updatedAt: serverTimestamp(),
    });
  },
  saveAll: async (customers) => {
    await Promise.all(customers.map(c => fsCustomers.save(c)));
  },
  getAll: async () => {
    const snap = await getDocs(userCol('customers'));
    return snap.docs.map(d => d.data());
  },
  delete: async (id) => {
    await deleteDoc(userDoc('customers', id));
  },
};

// ── Orders ──
export const fsOrders = {
  save: async (order) => {
    await setDoc(userDoc('orders', order.id), {
      ...order,
      updatedAt: serverTimestamp(),
    });
  },
  saveAll: async (orders) => {
    await Promise.all(orders.map(o => fsOrders.save(o)));
  },
  getAll: async () => {
    const snap = await getDocs(userCol('orders'));
    return snap.docs.map(d => d.data());
  },
  delete: async (id) => {
    await deleteDoc(userDoc('orders', id));
  },
};

// ── Measurements ──
export const fsMeasurements = {
  save: async (customerId, data) => {
    await setDoc(userDoc('measurements', customerId), {
      ...data,
      customerId,
      updatedAt: serverTimestamp(),
    });
  },
  saveAll: async (measurementsObj) => {
    await Promise.all(
      Object.entries(measurementsObj).map(([cId, data]) =>
        fsMeasurements.save(cId, data)
      )
    );
  },
  getAll: async () => {
    const snap = await getDocs(userCol('measurements'));
    const result = {};
    snap.docs.forEach(d => { result[d.id] = d.data(); });
    return result;
  },
};

// ── Measurements delete ──
fsMeasurements.delete = async (customerId) => {
  await deleteDoc(userDoc('measurements', customerId));
};

// ── Expenses ──
export const fsExpenses = {
  save: async (expense) => {
    await setDoc(userDoc('expenses', expense.id), {
      ...expense,
      updatedAt: serverTimestamp(),
    });
  },
  saveAll: async (expenses) => {
    await Promise.all(expenses.map(e => fsExpenses.save(e)));
  },
  getAll: async () => {
    const snap = await getDocs(userCol('expenses'));
    return snap.docs.map(d => d.data());
  },
  delete: async (id) => {
    await deleteDoc(userDoc('expenses', id));
  },
};

// ── Trash ──
export const fsTrash = {
  save: async (item) => {
    await setDoc(userDoc('trash', item.id), {
      ...item,
      updatedAt: serverTimestamp(),
    });
  },
  saveAll: async (items) => {
    await Promise.all(items.map(i => fsTrash.save(i)));
  },
  getAll: async () => {
    const snap = await getDocs(userCol('trash'));
    return snap.docs.map(d => d.data());
  },
  delete: async (id) => {
    await deleteDoc(userDoc('trash', id));
  },
};

// ── First Login Sync — Firestore سے AsyncStorage میں ──
// جب user login کرے تو Firestore سے data لے کر local میں save کرے
export const syncFromFirestore = async () => {
  const [customers, orders, measurements, expenses, trash] = await Promise.all([
    fsCustomers.getAll(),
    fsOrders.getAll(),
    fsMeasurements.getAll(),
    fsExpenses.getAll(),
    fsTrash.getAll(),
  ]);
  return { customers, orders, measurements, expenses, trash };
};
