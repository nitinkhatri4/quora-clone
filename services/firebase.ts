
// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- STEP-BY-STEP FIREBASE CONFIGURATION ---
// 1. Go to the Firebase console: https://console.firebase.google.com/
// 2. Click on "Add project" and give your project a name (e.g., "quora-clone").
// 3. Once the project is created, click on the "Web" icon (</>) to add a web app.
// 4. Register the app with a nickname (e.g., "Quora Clone Web").
// 5. Firebase will provide you with a `firebaseConfig` object. Copy this object.
// 6. Paste the copied object below, replacing the placeholder `firebaseConfig`.

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKfO4o5yY5P8XwjinNSxz4W4AVYMaS8xs",
  authDomain: "quora-clone-7f93a.firebaseapp.com",
  projectId: "quora-clone-7f93a",
  storageBucket: "quora-clone-7f93a.firebasestorage.app",
  messagingSenderId: "649169026097",
  appId: "1:649169026097:web:4a1b52d70c1e32feb8a910",
  measurementId: "G-S6SYFKQ8HQ",
};

// 7. In the Firebase console, navigate to "Authentication" in the left-hand menu.
// 8. Click the "Get started" button.
// 9. Go to the "Sign-in method" tab and enable "Email/Password" as a sign-in provider.

// 10. In the Firebase console, navigate to "Firestore Database" in the left-hand menu.
// 11. Click "Create database" and start in "test mode" for now. This allows open access
//     for development. For production, you MUST configure security rules.
// 12. Create the following collections manually in the Firestore UI or let the app create them:
//     - `questions`
//     - `answers`

// --- END OF CONFIGURATION STEPS ---


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Get Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
