import { Storage, KEYS } from './storage';

export const syncHelper = {

  saveCustomers: async (data) => {
    await Storage.set(KEYS.CUSTOMERS, data);
  },

  saveOrders: async (data) => {
    await Storage.set(KEYS.ORDERS, data);
  },

  saveMeasurements: async (data) => {
    await Storage.set(KEYS.MEASUREMENTS, data);
  },

  saveExpenses: async (data) => {
    await Storage.set(KEYS.EXPENSES, data);
  },

  saveTrash: async (data) => {
    await Storage.set(KEYS.TRASH, data);
  },

  // Delete operations — AsyncStorage میں array سے item ہٹانا
  deleteCustomer: async (id) => {
    const all = await Storage.get(KEYS.CUSTOMERS) || [];
    await Storage.set(KEYS.CUSTOMERS, all.filter(c => c.id !== id));
  },

  deleteOrder: async (id) => {
    const all = await Storage.get(KEYS.ORDERS) || [];
    await Storage.set(KEYS.ORDERS, all.filter(o => o.id !== id));
  },

  deleteExpense: async (id) => {
    const all = await Storage.get(KEYS.EXPENSES) || [];
    await Storage.set(KEYS.EXPENSES, all.filter(e => e.id !== id));
  },

  deleteTrashItem: async (id) => {
    const all = await Storage.get(KEYS.TRASH) || [];
    await Storage.set(KEYS.TRASH, all.filter(t => t.id !== id));
  },

  deleteMeasurement: async (customerId) => {
    const all = await Storage.get(KEYS.MEASUREMENTS) || {};
    const updated = { ...all };
    delete updated[customerId];
    await Storage.set(KEYS.MEASUREMENTS, updated);
  },
};
