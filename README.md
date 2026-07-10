# SLIP Web App — Source

This is the web version of the SLIP (Smart Land Investment Platform) app —
sign in with an ID and password, then use the ROI Calculator, Construction
Ledger, and AI Post tools from any laptop, tablet, or phone browser.

**For full setup instructions, deployment steps, and how to use the app,
see the accompanying PDF: `SLIP_Web_App_User_Manual.pdf`.**

## Folder contents

```
index.html              Main page (login screen + app shell)
css/style.css            All styling
js/app.js                 App entry point — routing, auth wiring
js/auth.js                 Firebase Authentication helpers
js/roi.js                   ROI Calculator tab
js/ledger.js                 Construction Ledger tab (Firestore)
js/ai.js                      AI Post tab (calls the Cloud Function below)
js/firebase-config.js          ⚠️ Fill in with your Firebase project's keys
functions/index.js               Cloud Function: proxies AI requests, keeps
                                   your OpenAI key off the browser
functions/package.json
firestore.rules                    Security rules for the ledger data
firebase.json                       Firebase Hosting + Functions config
.firebaserc                          Firebase project ID placeholder
```

## Quick start

1. Fill in `js/firebase-config.js` with your Firebase project's web config.
2. Deploy the Cloud Function in `functions/` and paste its URL into
   `js/firebase-config.js` (`generatePostEndpoint`).
3. Deploy Firestore rules: `firebase deploy --only firestore:rules`
4. Deploy hosting: `firebase deploy --only hosting`
5. Create your team's accounts in Firebase Console → Authentication →
   Add user (email + password) — there is no public sign-up page.

Full details, screenshots-in-words, and troubleshooting are in the PDF manual.
