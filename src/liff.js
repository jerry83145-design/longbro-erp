import { allowedEmails, firebaseConfig } from "./firebase-config.js";

const defaultOptionsByType = {
  expense: {
    counterparties: ["卡商", "IKEA", "Topps", "自訂"],
    cashflows: ["銀行轉帳", "現金", "信用卡", "自訂"],
    accounts: ["公司帳戶", "股東代墊", "現金", "自訂"],
    majors: ["進貨成本", "營業費用", "自訂"],
    middles: ["卡盒", "包材", "運費", "自訂"],
    minors: ["卡盒進貨", "包材", "運費", "自訂"],
  },
  income: {
    counterparties: ["買家", "平台", "自訂"],
    cashflows: ["銀行轉帳", "現金", "平台撥款", "自訂"],
    accounts: ["公司帳戶", "平台帳戶", "現金", "自訂"],
    majors: ["銷貨收入", "自訂"],
    middles: ["團拆收入", "卡片銷售", "自訂"],
    minors: ["球員卡收入", "卡盒收入", "自訂"],
  },
};

const fields = {
  date: document.querySelector("#dateInput"),
  amount: document.querySelector("#amountInput"),
  counterparty: document.querySelector("#counterpartySelect"),
  item: document.querySelector("#itemInput"),
  cashflow: document.querySelector("#cashflowSelect"),
  account: document.querySelector("#accountSelect"),
  major: document.querySelector("#majorSelect"),
  middle: document.querySelector("#middleSelect"),
  minor: document.querySelector("#minorSelect"),
  dueDate: document.querySelector("#dueDateInput"),
  voucherLinks: document.querySelector("#voucherLinksInput"),
  note: document.querySelector("#noteInput"),
};

const authStatus = document.querySelector("#authStatus");
const signInButton = document.querySelector("#signInButton");
const signOutButton = document.querySelector("#signOutButton");
const submitButton = document.querySelector("#submitButton");
const draftForm = document.querySelector("#draftForm");
const toast = document.querySelector("#toast");

let firebaseApi = {};
let app;
let auth;
let db;
let currentUser = null;
let recordType = "expense";
let optionsByType = cloneDefaultOptions();

setDefaultDate();
renderOptions();
initializeFirebase().catch((error) => {
  authStatus.textContent = "Firebase 載入失敗";
  signInButton.disabled = true;
  submitButton.disabled = true;
  showToast(`Firebase 載入失敗：${error.message}`);
});

document.querySelectorAll("[data-type]").forEach((button) => {
  button.addEventListener("click", () => {
    recordType = button.dataset.type;
    document.querySelectorAll("[data-type]").forEach((item) => item.classList.toggle("active", item === button));
    renderOptions();
  });
});

document.querySelectorAll("[data-add-option]").forEach((button) => {
  button.addEventListener("click", async () => {
    await addOption(button.dataset.addOption);
  });
});

signInButton.addEventListener("click", async () => {
  try {
    await firebaseApi.signInWithPopup(auth, new firebaseApi.GoogleAuthProvider());
  } catch (error) {
    showToast(`登入失敗：${error.message}`);
  }
});

signOutButton.addEventListener("click", async () => {
  await firebaseApi.signOut(auth);
});

draftForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitDraft();
});

async function initializeFirebase() {
  const [appModule, authModule, firestoreModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
  ]);

  firebaseApi = {
    ...authModule,
    ...firestoreModule,
  };

  app = appModule.initializeApp(firebaseConfig);
  auth = authModule.getAuth(app);
  db = firestoreModule.getFirestore(app);
  authModule.onAuthStateChanged(auth, handleAuthState);
}

async function handleAuthState(user) {
  currentUser = user;

  if (!user) {
    authStatus.textContent = "尚未登入";
    signInButton.hidden = false;
    signOutButton.hidden = true;
    submitButton.disabled = true;
    renderOptions();
    return;
  }

  const allowed = allowedEmails.includes(user.email);
  authStatus.textContent = allowed ? user.email : `${user.email} 未授權`;
  signInButton.hidden = true;
  signOutButton.hidden = false;
  submitButton.disabled = !allowed;

  if (!allowed) {
    showToast("這個 Google 帳號尚未授權使用隆博ERP。");
    return;
  }

  await loadSharedOptions();
}

async function loadSharedOptions() {
  try {
    const reference = firebaseApi.doc(db, "systemSettings", "options");
    const snapshot = await firebaseApi.getDoc(reference);
    optionsByType = snapshot.exists() ? normalizeOptionsByType(snapshot.data()?.options || {}) : cloneDefaultOptions();
    renderOptions();
  } catch {
    optionsByType = cloneDefaultOptions();
    renderOptions();
    showToast("雲端選項讀取失敗，先使用預設選項。");
  }
}

async function saveSharedOptions() {
  if (!currentUser) return;
  await firebaseApi.setDoc(
    firebaseApi.doc(db, "systemSettings", "options"),
    {
      options: normalizeOptionsByType(optionsByType),
      updatedAt: firebaseApi.serverTimestamp(),
      updatedBy: currentUser.email,
      userId: currentUser.uid,
    },
    { merge: true },
  );
}

function renderOptions() {
  const options = optionsByType[recordType] || defaultOptionsByType[recordType];
  fillSelect(fields.counterparty, options.counterparties);
  fillSelect(fields.cashflow, options.cashflows);
  fillSelect(fields.account, options.accounts);
  fillSelect(fields.major, options.majors);
  fillSelect(fields.middle, options.middles);
  fillSelect(fields.minor, options.minors);
}

function fillSelect(select, values) {
  select.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
}

async function addOption(key) {
  const value = window.prompt("請輸入新增選項");
  if (!value?.trim()) return;

  const current = optionsByType[recordType][key] || [];
  optionsByType[recordType][key] = normalizeOptions([...current, value.trim()], defaultOptionsByType[recordType][key]);
  renderOptions();

  try {
    await saveSharedOptions();
    showToast("選項已同步到 ERP。");
  } catch {
    showToast("選項暫時無法同步，請稍後再試。");
  }
}

async function submitDraft() {
  if (!currentUser) {
    showToast("請先登入。");
    return;
  }

  const amount = Number(fields.amount.value || 0);
  const item = fields.item.value.trim();

  if (!amount || amount <= 0) {
    showToast("請輸入正確金額。");
    return;
  }

  if (!item) {
    showToast("請輸入項目或摘要。");
    return;
  }

  const voucherLinks = fields.voucherLinks.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const draft = {
    type: recordType,
    date: fields.date.value,
    amount,
    counterparty: fields.counterparty.value,
    item,
    cashflow: fields.cashflow.value,
    account: fields.account.value,
    major: fields.major.value,
    middle: fields.middle.value,
    minor: fields.minor.value,
    dueDate: fields.dueDate.value,
    note: fields.note.value.trim(),
    voucherLinks,
    status: "draft",
    needsReview: true,
    source: "line-liff",
    userId: currentUser.uid,
    createdBy: currentUser.email,
    createdAt: firebaseApi.serverTimestamp(),
    updatedAt: firebaseApi.serverTimestamp(),
  };

  try {
    await firebaseApi.addDoc(firebaseApi.collection(db, "lineDrafts"), draft);
    draftForm.reset();
    setDefaultDate();
    renderOptions();
    showToast("已建立 LINE 草稿，請回 ERP 待處理事項確認。");
  } catch (error) {
    showToast(`建立草稿失敗：${error.message}`);
  }
}

function normalizeOptionsByType(saved = {}) {
  return {
    expense: normalizeOptionGroup(saved.expense, defaultOptionsByType.expense),
    income: normalizeOptionGroup(saved.income, defaultOptionsByType.income),
  };
}

function cloneDefaultOptions() {
  return JSON.parse(JSON.stringify(defaultOptionsByType));
}

function normalizeOptionGroup(savedGroup = {}, fallbackGroup = {}) {
  return Object.fromEntries(
    Object.keys(fallbackGroup).map((key) => [
      key,
      normalizeOptions(Array.isArray(savedGroup[key]) ? savedGroup[key] : fallbackGroup[key], fallbackGroup[key]),
    ]),
  );
}

function normalizeOptions(values, fallback = []) {
  const normalized = values.length ? Array.from(new Set(values.filter(Boolean))) : [...fallback];
  if (!normalized.includes("自訂")) normalized.push("自訂");
  return normalized;
}

function setDefaultDate() {
  const today = new Date();
  const year = Math.min(Math.max(today.getFullYear(), 2026), 2035);
  fields.date.value = `${year}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.setTimeout(() => {
    toast.hidden = true;
  }, 3600);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
