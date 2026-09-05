Tailors
A mobile business management app for tailoring shops — built with React Native and Expo.

Features
Dashboard — Today's orders overview, pending and ready counts, quick navigation
Customers — Add, search, and manage customer records
Orders — Create and track orders with status (Pending / Ready / Delivered)
Measurements — Save male and female measurements per customer
Payments — Track paid and remaining amounts per order
Expenses — Record shop expenses
Backup & Restore — Export full data as a JSON file and restore anytime
Tech Stack
Layer	Technology
Framework	React Native 0.81 + Expo 54
Navigation	Expo Router (file-based) + Drawer
Local Storage	AsyncStorage
Authentication	Firebase Authentication
Backup	expo-sharing + expo-document-picker
Architecture
The app follows a local-first architecture:

Firebase Authentication
        ↓
    User Login
        ↓
  AsyncStorage ← Primary data store
        ↓
 Export/Import Backup (JSON file)
        ↓
 Google Drive / WhatsApp / Email / Any storage
All business data (customers, orders, measurements, payments, expenses) is stored locally on the device using AsyncStorage. No Firestore or cloud database is used — this keeps the app fast and fully functional offline.

Firebase is used only for Authentication (login, signup, logout).

Backup System
Tap Backup Now in Settings to export all data as a .json file
The share sheet opens — save to Google Drive, WhatsApp, email, or any location
To restore, tap Restore Backup and select the .json file
Backup includes: customers, orders, measurements, expenses, trash
Project Structure
tailors/
├── app/                    # Expo Router screens (routes)
│   ├── _layout.js
│   ├── index.js            # Splash / auth check
│   ├── login.js
│   ├── (drawer)/           # Main app screens
│   ├── add-customer.js
│   ├── add-order.js
│   ├── measurements.js
│   └── order-detail/
├── src/
│   ├── screens/            # Screen components
│   ├── components/         # Reusable UI components
│   ├── services/
│   │   ├── firebase.js     # Firebase Auth init
│   │   └── backupService.js# Export / Import logic
│   └── utils/
│       ├── storage.js      # AsyncStorage wrapper + keys
│       └── syncHelper.js   # Data save/delete helpers
└── package.json
Getting Started
Prerequisites
Node.js 18+
Expo CLI
Expo Go app on your Android device
Installation
git clone https://github.com/your-username/tailors.git
cd tailors
npm install
Firebase Setup
Create a project at firebase.google.com
Enable Email/Password authentication
Copy your config into src/services/firebase.js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.firebasestorage.app",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
Run
npx expo start
Scan the QR code with Expo Go on your Android device.

License
Private project — all rights reserved.
