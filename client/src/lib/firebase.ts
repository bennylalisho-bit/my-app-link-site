import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// כאן שמתי את המפתחות האמיתיים שלך (במקום המשתנים שלא עבדו)
const firebaseConfig = {
  apiKey: "AIzaSyBVsRSYmzrMu2SXbbXNAG1QJFprguWn9Hs",
  authDomain: "ridesappsync.firebaseapp.com",
  projectId: "ridesappsync",
  storageBucket: "ridesappsync.firebasestorage.app",
  messagingSenderId: "799644961622",
  appId: "1:799644961622:web:0d4f1e710ac28c71a4e4f7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// שמרתי את הפונקציה הזו בדיוק כמו שביקשת
export const initializeAnonymousAuth = async () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User already authenticated:", user.uid);
        resolve(user);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          console.log("Anonymous sign-in successful:", userCredential.user.uid);
          resolve(userCredential.user);
        } catch (error) {
          console.error("Anonymous sign-in failed:", error);
          reject(error);
        }
      }
      unsubscribe();
    });
  });
};