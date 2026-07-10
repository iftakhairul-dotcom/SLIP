import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { firebaseConfig } from "./firebase-config.js";
import { initAuth, login, logout, friendlyAuthError } from "./auth.js";
import { renderRoiTab } from "./roi.js";
import { renderLedgerTab } from "./ledger.js";
import { renderAiTab } from "./ai.js";

const app = initializeApp(firebaseConfig);

// ---- DOM refs ------------------------------------------------------------
const loginScreen = document.getElementById("login-screen");
const appShell = document.getElementById("app-shell");
const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");
const loginSubmit = document.getElementById("login-submit");
const sideRailUser = document.getElementById("side-rail-user");
const topbarTitle = document.getElementById("topbar-title");
const toastEl = document.getElementById("toast");

const tabs = {
  roi: { panel: document.getElementById("tab-roi"), label: "ROI Calculator", rendered: false },
  ledger: { panel: document.getElementById("tab-ledger"), label: "Construction Ledger", rendered: false },
  ai: { panel: document.getElementById("tab-ai"), label: "AI Post", rendered: false },
};

let currentTab = "roi";
let currentUser = null;

// ---- Toast helper ----------------------------------------------------------
let toastTimer = null;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3200);
}

// ---- Tab routing -----------------------------------------------------------
function setActiveTab(tabName) {
  currentTab = tabName;
  Object.entries(tabs).forEach(([name, t]) => {
    t.panel.hidden = name !== tabName;
  });
  topbarTitle.textContent = tabs[tabName].label;

  document.querySelectorAll(".nav-item[data-tab], .bottom-item[data-tab]").forEach((el) => {
    el.classList.toggle("active", el.dataset.tab === tabName);
  });

  // Lazily render each tab the first time it's opened.
  if (tabName === "roi" && !tabs.roi.rendered) {
    renderRoiTab(tabs.roi.panel);
    tabs.roi.rendered = true;
  }
  if (tabName === "ledger") {
    // Re-render on every visit so the Firestore listener is fresh and scoped
    // to this view (see ledger.js — it tears down the previous listener).
    renderLedgerTab(tabs.ledger.panel, app, showToast);
    tabs.ledger.rendered = true;
  }
  if (tabName === "ai" && !tabs.ai.rendered) {
    renderAiTab(tabs.ai.panel, () => currentUser.getIdToken(), showToast);
    tabs.ai.rendered = true;
  }
}

document.querySelectorAll(".nav-item[data-tab], .bottom-item[data-tab]").forEach((el) => {
  el.addEventListener("click", () => setActiveTab(el.dataset.tab));
});

// ---- Auth wiring -----------------------------------------------------------
const auth = initAuth(app, {
  onSignedIn: (user) => {
    currentUser = user;
    loginScreen.hidden = true;
    appShell.hidden = false;
    sideRailUser.textContent = user.email || "";
    setActiveTab(currentTab);
  },
  onSignedOut: () => {
    currentUser = null;
    appShell.hidden = true;
    loginScreen.hidden = false;
    // Reset lazy-render flags so a different user starts fresh next login.
    Object.values(tabs).forEach((t) => { t.rendered = false; });
  },
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  loginSubmit.disabled = true;
  loginSubmit.querySelector(".btn-spinner").hidden = false;
  loginSubmit.querySelector(".btn-label").textContent = "Signing in...";

  try {
    await login(auth, loginEmail.value.trim(), loginPassword.value);
    // onAuthStateChanged (above) takes care of showing the app shell.
  } catch (err) {
    loginError.textContent = friendlyAuthError(err);
    loginError.hidden = false;
  } finally {
    loginSubmit.disabled = false;
    loginSubmit.querySelector(".btn-spinner").hidden = true;
    loginSubmit.querySelector(".btn-label").textContent = "Sign in";
  }
});

document.getElementById("signout-btn-desktop").addEventListener("click", () => logout(auth));
document.getElementById("signout-btn-mobile").addEventListener("click", () => logout(auth));
