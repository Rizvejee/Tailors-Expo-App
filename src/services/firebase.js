import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyCS4leYtYn5UQxRaphUVuY3MjPAn38W5Aw",
  authDomain:        "tailors-c5aef.firebaseapp.com",
  projectId:         "tailors-c5aef",
  storageBucket:     "tailors-c5aef.firebasestorage.app",
  messagingSenderId: "642877000903",
  appId:             "1:642877000903:web:dbe3325f07e88c834802e2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
