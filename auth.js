import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

export function initAuth(app, { onSignedIn, onSignedOut }) {
  const auth = getAuth(app);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      onSignedIn(user);
    } else {
      onSignedOut();
    }
  });

  return auth;
}

export async function login(auth, email, password) {
  // Firebase surfaces its own error codes (auth/invalid-credential,
  // auth/too-many-requests, etc.) — the caller maps these to friendly text.
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout(auth) {
  return signOut(auth);
}

/** Turns a Firebase Auth error code into a short, non-technical message. */
export function friendlyAuthError(err) {
  const code = err?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Incorrect ID or password. Please try again.";
  }
  if (code.includes("too-many-requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (code.includes("network-request-failed")) {
    return "Network error. Check your connection and try again.";
  }
  return "Could not sign in. Please try again.";
}
