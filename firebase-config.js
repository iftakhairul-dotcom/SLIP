// -----------------------------------------------------------------------
// Replace the placeholder values below with YOUR Firebase project's web
// config. Find it in the Firebase console:
//   Project settings (gear icon) → General → Your apps → Web app → SDK setup
// -----------------------------------------------------------------------
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// URL of the Cloud Function that proxies AI Post generation requests.
// Deploy the function in /functions (see functions/index.js) and paste its
// URL here — it will look like:
// https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/generateFbPost
export const generatePostEndpoint = "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/generateFbPost";
