// syncHelper — صرف AsyncStorage، Firebase نہیں
import { Storage, KEYS } from './storage';

export const syncHelper = {
  saveCustomers:    async (data) => Storage.set(KEYS.CUSTOMERS,    data),
  saveOrders:       async (data) => Storage.set(KEYS.ORDERS,       data),
  saveMeasurements: async (data) => Storage.set(KEYS.MEASUREMENTS, data),
  saveTrash:        async (data) => Storage.set(KEYS.TRASH,        data),
};
