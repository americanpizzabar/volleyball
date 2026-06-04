// Firebase client initialization.
// All values are public (NEXT_PUBLIC_*) — safe to ship to the browser.
// Security is enforced by Firestore Security Rules (see firestore.rules), not by
// hiding these keys. Copy .env.local.example to .env.local and fill in your
// project's values from the Firebase console (Project settings → Your apps).
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/** True when the required env vars are present so the UI can show a setup hint. */
export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
);

// Fallback placeholders let the SDK initialize without throwing during build /
// prerender when env vars are absent. They never reach the network because the
// UI shows a setup notice while `isFirebaseConfigured` is false.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-api-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-project",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "demo-project.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "0000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:0:web:0",
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseApp = app;
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
