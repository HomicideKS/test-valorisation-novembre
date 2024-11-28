import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager
} from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBBQf4lpJn-QSDp6VdDcvCeMXmQezNnKco",
  authDomain: "valorisation-2eb94.firebaseapp.com",
  projectId: "valorisation-2eb94",
  storageBucket: "valorisation-2eb94.firebasestorage.app",
  messagingSenderId: "363148371744",
  appId: "1:363148371744:web:995549d1535bc29d501945",
  measurementId: "G-B6401NQGRC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.warn('Auth persistence setup failed:', error);
});

// Initialize Firestore with persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager()
  })
});

export { auth, db };