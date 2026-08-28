import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Storage, KEYS } from '../utils/storage';

const BACKUP_VERSION = 1;

// ── Backup بنانا اور share/save کرنا ──
export const createBackup = async () => {
  const [customers, orders, measurements, expenses, trash] = await Promise.all([
    Storage.get(KEYS.CUSTOMERS),
    Storage.get(KEYS.ORDERS),
    Storage.get(KEYS.MEASUREMENTS),
    Storage.get(KEYS.EXPENSES),
    Storage.get(KEYS.TRASH),
  ]);

  const backup = {
    backupVersion: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    customers:    customers    || [],
    orders:       orders       || [],
    measurements: measurements || {},
    expenses:     expenses     || [],
    trash:        trash        || [],
  };

  const date = new Date().toISOString().slice(0, 10);
  const fileName = `tailors-backup-${date}.json`;
  const jsonContent = JSON.stringify(backup, null, 2);

  // پہلے cache میں لکھیں
  const cacheFilePath = FileSystem.cacheDirectory + fileName;
  await FileSystem.writeAsStringAsync(cacheFilePath, jsonContent);

  // Sharing available ہے تو share کریں، نہیں تو Downloads میں save کریں
  const canShare = await Sharing.isAvailableAsync();

  if (canShare) {
    await Sharing.shareAsync(cacheFilePath, {
      mimeType: 'application/json',
      dialogTitle: 'Save Tailors Backup',
    });
  } else {
    // Downloads folder میں save کریں
    const downloadPath = FileSystem.documentDirectory + fileName;
    await FileSystem.copyAsync({ from: cacheFilePath, to: downloadPath });
    return { success: true, fileName, savedTo: downloadPath };
  }

  return { success: true, fileName };
};

// ── Backup restore کرنا ──
export const restoreBackup = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', '*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled) return { success: false, reason: 'canceled' };

  const fileUri = result.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(fileUri);

  let backup;
  try {
    backup = JSON.parse(content);
  } catch {
    throw new Error('Invalid backup file. Could not read the file.');
  }

  if (!backup.backupVersion || !backup.createdAt) {
    throw new Error('Invalid backup file. Required fields are missing.');
  }

  await Promise.all([
    Storage.set(KEYS.CUSTOMERS,    backup.customers    || []),
    Storage.set(KEYS.ORDERS,       backup.orders       || []),
    Storage.set(KEYS.MEASUREMENTS, backup.measurements || {}),
    Storage.set(KEYS.EXPENSES,     backup.expenses     || []),
    Storage.set(KEYS.TRASH,        backup.trash        || []),
  ]);

  return { success: true, createdAt: backup.createdAt };
};
