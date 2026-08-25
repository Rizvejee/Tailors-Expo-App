import { Storage, KEYS } from './storage';
import { auth } from '../services/firebase';
import {
  fsCustomers, fsOrders, fsMeasurements,
  fsExpenses, fsTrash,
} from '../services/firestore';

const isLoggedIn = () => !!auth.currentUser;

export const syncHelper = {

  saveCustomers: async (data) => {
    await Storage.set(KEYS.CUSTOMERS, data);
    if (isLoggedIn()) { try { await fsCustomers.saveAll(data); } catch {} }
  },

  saveOrders: async (data) => {
    await Storage.set(KEYS.ORDERS, data);
    if (isLoggedIn()) { try { await fsOrders.saveAll(data); } catch {} }
  },

  saveMeasurements: async (data) => {
    await Storage.set(KEYS.MEASUREMENTS, data);
    if (isLoggedIn()) { try { await fsMeasurements.saveAll(data); } catch {} }
  },

  saveExpenses: async (data) => {
    await Storage.set(KEYS.EXPENSES, data);
    if (isLoggedIn()) { try { await fsExpenses.saveAll(data); } catch {} }
  },

  saveTrash: async (data) => {
    await Storage.set(KEYS.TRASH, data);
    if (isLoggedIn()) { try { await fsTrash.saveAll(data); } catch {} }
  },

  // ── Delete operations ──
  deleteCustomer: async (id) => {
    if (isLoggedIn()) { try { await fsCustomers.delete(id); } catch {} }
  },

  deleteOrder: async (id) => {
    if (isLoggedIn()) { try { await fsOrders.delete(id); } catch {} }
  },

  deleteExpense: async (id) => {
    if (isLoggedIn()) { try { await fsExpenses.delete(id); } catch {} }
  },

  deleteTrashItem: async (id) => {
    if (isLoggedIn()) { try { await fsTrash.delete(id); } catch {} }
  },

  deleteMeasurement: async (customerId) => {
    if (isLoggedIn()) { try { await fsMeasurements.delete(customerId); } catch {} }
  },
};
