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
  voucherFiles: document.querySelector("#voucherFilesInput"),
  voucherFilesHint: document.querySelector("#voucherFilesHint"),
  voucherLinks: document.querySelector("#voucherLinksInput"),
  note: document.querySelector("#noteInput"),
};

const authStatus = document.querySelector("#authStatus");
const signInButton = document.querySelector("#signInButton");
const signOutButton = document.querySelector("#signOutButton");
const submitButton = document.querySelector("#submitButton");
const draftForm = document.querySelector("#draftForm");
const toast = document.querySelector("#toast");
const externalBrowserNotice = document.querySelector("#externalBrowserNotice");

let firebaseApi = {};
let app;
let auth;
let db;
let currentUser = null;
let recordType = getInitialRecordType();
let optionsByType = cloneDefaultOptions();
let driveAccessToken = "";
const driveFolderCache = new Map();

setDefaultDate();
syncTypeTabs();
renderOptions();
syncLineBrowserState();
initializeFirebase().catch((error) => {
  authStatus.textContent = "Firebase 載入失敗";
  signInButton.disabled = true;
  submitButton.disabled = true;
  showToast(`Firebase 載入失敗：${error.message}`);
});

document.querySelectorAll("[data-type]").forEach((button) => {
  button.addEventListener("click", () => {
    setRecordType(button.dataset.type);
    window.history.replaceState(null, "", `?type=${recordType}`);
  });
});

function setRecordType(type) {
  recordType = type === "income" ? "income" : "expense";
  syncTypeTabs();
  renderOptions();
}

function syncTypeTabs() {
  document.querySelectorAll("[data-type]").forEach((item) => {
    item.classList.toggle("active", item.dataset.type === recordType);
  });
}

function getInitialRecordType() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  return type === "income" ? "income" : "expense";
}

document.querySelectorAll("[data-add-option]").forEach((button) => {
  button.addEventListener("click", async () => {
    await addOption(button.dataset.addOption);
  });
});

signInButton.addEventListener("click", async () => {
  if (isLineInAppBrowser()) {
    openInExternalBrowser();
    return;
  }

  try {
    const result = await firebaseApi.signInWithPopup(auth, createGoogleProvider());
    driveAccessToken = firebaseApi.GoogleAuthProvider.credentialFromResult(result)?.accessToken || "";
  } catch (error) {
    showToast(`登入失敗：${error.message}`);
  }
});

function syncLineBrowserState() {
  if (!isLineInAppBrowser()) return;
  if (externalBrowserNotice) externalBrowserNotice.hidden = false;
  signInButton.textContent = "用外部瀏覽器開啟";
}

function isLineInAppBrowser() {
  return /Line/i.test(navigator.userAgent);
}

function openInExternalBrowser() {
  const url = window.location.href;
  if (window.liff?.openWindow) {
    window.liff.openWindow({ url, external: true });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
  showToast("請在外部瀏覽器開啟後再登入。");
}

signOutButton.addEventListener("click", async () => {
  driveAccessToken = "";
  await firebaseApi.signOut(auth);
});

fields.voucherFiles.addEventListener("change", () => {
  const count = fields.voucherFiles.files.length;
  fields.voucherFilesHint.textContent = count
    ? `已選 ${count} 個檔案，會全部掛在同一筆草稿。`
    : getVoucherHintText();
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

function createGoogleProvider() {
  const provider = new firebaseApi.GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/drive.file");
  provider.setCustomParameters({ prompt: "select_account consent" });
  return provider;
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

  const selectedFiles = Array.from(fields.voucherFiles.files || []);
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = selectedFiles.length ? "上傳憑證中..." : "建立草稿中...";

  let uploadedVouchers = [];

  try {
    if (selectedFiles.length) {
      uploadedVouchers = await uploadVoucherFiles(selectedFiles, {
        date: fields.date.value,
        type: recordType,
        counterparty: fields.counterparty.value,
        item,
      });
    }

    const allVoucherLinks = [
      ...voucherLinks,
      ...uploadedVouchers.map((file) => file.webViewLink || file.webContentLink).filter(Boolean),
    ];

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
      voucherLinks: allVoucherLinks,
      voucherFiles: uploadedVouchers,
      status: "draft",
      needsReview: true,
      source: "line-liff",
      userId: currentUser.uid,
      createdBy: currentUser.email,
      createdAt: firebaseApi.serverTimestamp(),
      updatedAt: firebaseApi.serverTimestamp(),
    };

    await firebaseApi.addDoc(firebaseApi.collection(db, "lineDrafts"), draft);
    draftForm.reset();
    setDefaultDate();
    renderOptions();
    fields.voucherFilesHint.textContent = getVoucherHintText();
    showToast(
      uploadedVouchers.length
        ? `已上傳 ${uploadedVouchers.length} 個憑證並建立 LINE 草稿。`
        : "已建立 LINE 草稿，請回 ERP 待處理事項確認。",
    );
  } catch (error) {
    showToast(`建立草稿失敗：${error.message}`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

async function uploadVoucherFiles(files, context) {
  if (!driveAccessToken) {
    const result = await firebaseApi.signInWithPopup(auth, createGoogleProvider());
    driveAccessToken = firebaseApi.GoogleAuthProvider.credentialFromResult(result)?.accessToken || "";
  }

  if (!driveAccessToken) {
    throw new Error("沒有取得 Google Drive 上傳權限，請重新登入。");
  }

  const folderId = await ensureVoucherFolder(context.date);
  const uploaded = [];
  for (const [index, file] of files.entries()) {
    uploaded.push(await uploadFileToDrive(file, buildVoucherFileName(file, context, index + 1), folderId));
  }
  return uploaded;
}

async function uploadFileToDrive(file, fileName, folderId) {
  const metadata = {
    name: fileName,
    mimeType: file.type || "application/octet-stream",
    description: "隆博ERP LINE 手機記帳憑證",
    parents: folderId ? [folderId] : undefined,
    appProperties: {
      source: "longbro-erp-liff",
    },
  };

  const boundary = `longbro_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const body = new Blob(
    [
      `--${boundary}\r\n`,
      "Content-Type: application/json; charset=UTF-8\r\n\r\n",
      JSON.stringify(metadata),
      `\r\n--${boundary}\r\n`,
      `Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n`,
      file,
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` },
  );

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${driveAccessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 403) {
      throw new Error("Google Drive API 尚未啟用，請到 Google Cloud 啟用 Drive API 後再試。");
    }
    throw new Error(`Google Drive 上傳失敗：${detail.slice(0, 120)}`);
  }

  const result = await response.json();
  return {
    id: result.id,
    name: result.name,
    mimeType: result.mimeType,
    webViewLink: result.webViewLink || "",
    webContentLink: result.webContentLink || "",
    originalName: file.name,
    size: file.size,
  };
}

async function ensureVoucherFolder(dateValue) {
  const month = String(dateValue || "").slice(0, 7) || "未填日期";
  const rootFolderId = await ensureDriveFolder("隆博ERP憑證");
  return ensureDriveFolder(month, rootFolderId);
}

async function ensureDriveFolder(name, parentId = "") {
  const cacheKey = `${parentId || "root"}:${name}`;
  if (driveFolderCache.has(cacheKey)) return driveFolderCache.get(cacheKey);

  const existing = await findDriveFolder(name, parentId);
  if (existing) {
    driveFolderCache.set(cacheKey, existing);
    return existing;
  }

  const created = await createDriveFolder(name, parentId);
  driveFolderCache.set(cacheKey, created);
  return created;
}

async function findDriveFolder(name, parentId = "") {
  const escapedName = name.replaceAll("'", "\\'");
  const parentQuery = parentId ? ` and '${parentId}' in parents` : "";
  const query = `name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${parentQuery}`;
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=1`,
    {
      headers: {
        Authorization: `Bearer ${driveAccessToken}`,
      },
    },
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Google Drive API 尚未啟用，請到 Google Cloud 啟用 Drive API 後再試。");
    }
    return "";
  }
  const result = await response.json();
  return result.files?.[0]?.id || "";
}

async function createDriveFolder(name, parentId = "") {
  const metadata = {
    name,
    mimeType: "application/vnd.google-apps.folder",
    parents: parentId ? [parentId] : undefined,
    appProperties: {
      source: "longbro-erp-liff",
    },
  };

  const response = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${driveAccessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 403) {
      throw new Error("Google Drive API 尚未啟用，請到 Google Cloud 啟用 Drive API 後再試。");
    }
    throw new Error(`Google Drive 資料夾建立失敗：${detail.slice(0, 120)}`);
  }

  const result = await response.json();
  return result.id;
}

function buildVoucherFileName(file, context, index) {
  const typeLabel = context.type === "income" ? "收入" : "支出";
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const safeCounterparty = sanitizeFileName(context.counterparty || "未命名對象");
  const safeItem = sanitizeFileName(context.item || "未命名項目");
  return `${context.date}_${typeLabel}_${safeCounterparty}_${safeItem}_${String(index).padStart(2, "0")}${ext}`;
}

function sanitizeFileName(value) {
  return String(value)
    .replace(/[\\/:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, "")
    .slice(0, 40);
}

function getVoucherHintText() {
  return "同一份憑證可拍多張或多選檔案，會跟這一筆草稿一起上傳到 Google Drive。";
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
