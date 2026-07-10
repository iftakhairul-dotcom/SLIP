import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
}).format;

let unsubscribe = null;

export function renderLedgerTab(container, app, showToast) {
  const db = getFirestore(app);

  container.innerHTML = `
    <div class="card">
      <button class="fab" id="add-expense-btn">＋ Add expense</button>
    </div>
    <div id="ledger-body"></div>
  `;

  container.querySelector("#add-expense-btn").addEventListener("click", () => openAddModal(db, showToast));

  if (unsubscribe) unsubscribe(); // avoid stacking listeners across tab switches

  const body = container.querySelector("#ledger-body");
  const q = query(collection(db, "construction_ledger"), orderBy("timestamp", "desc"));

  body.innerHTML = `<p style="color:rgba(248,245,238,0.6)">Loading ledger…</p>`;

  unsubscribe = onSnapshot(
    q,
    (snap) => {
      const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderList(body, db, entries, showToast);
    },
    (err) => {
      body.innerHTML = `<div class="form-error">Could not load the ledger: ${err.message}</div>`;
    }
  );
}

function renderList(body, db, entries, showToast) {
  if (entries.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">▤</div>
        <div class="empty-title">No expenses logged yet</div>
        <div class="empty-sub">Tap "Add expense" to record your first\nconstruction cost.</div>
      </div>`;
    return;
  }

  const total = entries.reduce((sum, e) => sum + (e.cost || 0), 0);

  body.innerHTML = `
    <div class="hero-card">
      <div class="ledger-total">
        <div>
          <p class="title-lg" style="margin-bottom:2px">Total Recorded Cost</p>
          <span style="font-size:12px;color:rgba(248,245,238,0.6)">${entries.length} entries</span>
        </div>
        <span class="amount">${currency(total)}</span>
      </div>
    </div>
    <div class="ledger-list">
      ${entries.map((e) => renderItem(e)).join("")}
    </div>
  `;

  body.querySelectorAll("[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", () => confirmDelete(db, btn.dataset.deleteId, btn.dataset.deleteLabel, showToast));
  });
}

function renderItem(e) {
  const sub = e.supplier ? `${e.project} • ${e.supplier}` : e.project;
  return `
    <div class="ledger-item">
      <div class="avatar">🧱</div>
      <div class="info">
        <div class="item-name">${escapeHtml(e.item || "")}</div>
        <div class="item-sub">${escapeHtml(sub || "")}</div>
      </div>
      <div class="item-cost">${currency(e.cost || 0)}</div>
      <button class="delete-btn" data-delete-id="${e.id}" data-delete-label="${escapeHtml(e.item || "")}">✕</button>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function confirmDelete(db, id, label, showToast) {
  if (!window.confirm(`Delete expense "${label}"? This cannot be undone.`)) return;
  try {
    await deleteDoc(doc(db, "construction_ledger", id));
    showToast("Expense deleted");
  } catch (e) {
    showToast(`Could not delete: ${e.message}`);
  }
}

function openAddModal(db, showToast) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-grabber"></div>
      <div class="modal-title">🧾 Add Construction Expense</div>
      <form id="add-expense-form">
        <label class="field-label">Project name</label>
        <input class="field-input" id="f-project" required />
        <div class="field-error" id="err-project" hidden>Required</div>

        <label class="field-label">Item / material</label>
        <input class="field-input" id="f-item" required />
        <div class="field-error" id="err-item" hidden>Required</div>

        <label class="field-label">Amount (BDT)</label>
        <input class="field-input" id="f-amount" type="number" step="0.01" min="0.01" required />
        <div class="field-error" id="err-amount" hidden>Enter a valid amount</div>

        <label class="field-label">Supplier (optional)</label>
        <input class="field-input" id="f-supplier" />

        <button type="submit" class="btn-primary" style="margin-top:20px">
          <span class="btn-label">Save Expense</span>
          <span class="btn-spinner" hidden></span>
        </button>
        <button type="button" class="btn-primary" id="cancel-btn"
          style="background:transparent;border:1px solid var(--divider);color:var(--cream);margin-top:10px">
          Cancel
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector("#cancel-btn").addEventListener("click", close);

  const form = backdrop.querySelector("#add-expense-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const project = backdrop.querySelector("#f-project").value.trim();
    const item = backdrop.querySelector("#f-item").value.trim();
    const amount = parseFloat(backdrop.querySelector("#f-amount").value);
    const supplier = backdrop.querySelector("#f-supplier").value.trim();

    let valid = true;
    toggleError(backdrop, "#err-project", !project); if (!project) valid = false;
    toggleError(backdrop, "#err-item", !item); if (!item) valid = false;
    toggleError(backdrop, "#err-amount", !(amount > 0)); if (!(amount > 0)) valid = false;
    if (!valid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.querySelector(".btn-spinner").hidden = false;
    submitBtn.querySelector(".btn-label").textContent = "Saving...";

    try {
      await addDoc(collection(db, "construction_ledger"), {
        projectName: project,
        item,
        cost: amount,
        supplier,
        timestamp: serverTimestamp(),
      });
      close();
      showToast("Expense saved");
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.querySelector(".btn-spinner").hidden = true;
      submitBtn.querySelector(".btn-label").textContent = "Save Expense";
      showToast(`Could not save: ${err.message}`);
    }
  });
}

function toggleError(root, selector, show) {
  root.querySelector(selector).hidden = !show;
}
