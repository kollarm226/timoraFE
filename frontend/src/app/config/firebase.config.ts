import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBB34Apb6IPdRREUJ74SHkjqLjbXJPnetg",
  authDomain: "timoraauth.firebaseapp.com",
  projectId: "timoraauth",
  storageBucket: "timoraauth.firebasestorage.app",
  messagingSenderId: "1073086542267",
  appId: "1:1073086542267:web:e68a8558f22d43f338949e",
  measurementId: "G-GK0JC3ZSXN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Analytics
export const analytics = getAnalytics(app);

export default app;
