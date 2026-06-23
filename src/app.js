import { allowedEmails, firebaseConfig } from "./firebase-config.js";

const defaultOptionsByType = {
  expense: {
    counterparties: ["IKEA", "酷澎", "momo", "九乘九購物網", "Topps", "PSA", "股東代墊", "自訂"],
    cashflows: ["銀行轉帳", "信用卡", "現金", "LINE Pay", "街口支付", "自訂"],
    accounts: ["股東代墊", "公司帳戶", "信用卡", "現金", "平台帳戶", "自訂"],
    majors: ["進貨成本", "行銷與業務", "辦公設備", "營業費用", "稅捐規費", "待確認", "自訂"],
    middles: ["廣告", "運費", "包材", "設備", "訂閱服務", "手續費", "待確認", "自訂"],
    minors: ["活動與贈品", "國內運費", "海外運費", "直播設備", "平台費", "待確認", "自訂"],
    notes: ["無", "待補發票", "待確認付款方式", "待會計師確認", "自訂"],
  },
  income: {
    counterparties: ["買家", "卡友", "團拆參與者", "平台", "自訂"],
    cashflows: ["銀行轉帳", "現金", "LINE Pay", "街口支付", "平台撥款", "自訂"],
    accounts: ["公司帳戶", "現金", "平台帳戶", "自訂"],
    majors: ["銷貨收入", "勞務收入", "其他收入", "待確認", "自訂"],
    middles: ["團拆收入", "卡片銷售", "代購收入", "運費收入", "待確認", "自訂"],
    minors: ["球員卡收入", "拆盒收入", "單卡收入", "平台收入", "待確認", "自訂"],
    notes: ["無", "待確認收款方式", "待會計師確認", "自訂"],
  },
};

const optionLabels = {
  counterparties: "交易對象",
  cashflows: "金流方式",
  accounts: "帳戶",
  majors: "大類",
  middles: "中類",
  minors: "細項",
  notes: "備註",
};

const setupNotice = document.querySelector("#setupNotice");
const authStatus = document.querySelector("#authStatus");
const signInButton = document.querySelector("#signInButton");
const signOutButton = document.querySelector("#signOutButton");
const ledgerForm = document.querySelector("#ledgerForm");
const formTitle = document.querySelector("#formTitle");
const amountLabel = document.querySelector("#amountLabel");
const accountLabel = document.querySelector("#accountLabel");
const saveButton = document.querySelector("#saveButton");
const clearButton = document.querySelector("#clearButton");
const toggleOptionsButton = document.querySelector("#toggleOptionsButton");
const optionsPanel = document.querySelector("#optionsPanel");
const optionsTitle = document.querySelector("#optionsTitle");
const optionsEditor = document.querySelector("#optionsEditor");
const resetOptionsButton = document.querySelector("#resetOptionsButton");
const recordsList = document.querySelector("#recordsList");
const toast = document.querySelector("#toast");
const voucherInput = document.querySelector("#voucherInput");
const voucherPreview = document.querySelector("#voucherPreview");
const pageEyebrow = document.querySelector("#pageEyebrow");
const pageTitle = document.querySelector("#pageTitle");
const pageSubtitle = document.querySelector("#pageSubtitle");
const topActionButton = document.querySelector("#topActionButton");
const reportStartInput = document.querySelector("#reportStartInput");
const reportEndInput = document.querySelector("#reportEndInput");
const generateReportButton = document.querySelector("#generateReportButton");
const exportReportButton = document.querySelector("#exportReportButton");
const customReportResult = document.querySelector("#customReportResult");
const expenseSummaryLabel = document.querySelector("#expenseSummaryLabel");
const incomeSummaryLabel = document.querySelector("#incomeSummaryLabel");
const countSummaryLabel = document.querySelector("#countSummaryLabel");
const pendingSummaryLabel = document.querySelector("#pendingSummaryLabel");
const importLedgerButton = document.querySelector("#importLedgerButton");
const importLedgerInput = document.querySelector("#importLedgerInput");

const fields = {
  date: document.querySelector("#dateInput"),
  counterparty: document.querySelector("#counterpartySelect"),
  item: document.querySelector("#itemInput"),
  amount: document.querySelector("#amountInput"),
  cashflow: document.querySelector("#cashflowSelect"),
  account: document.querySelector("#accountSelect"),
  major: document.querySelector("#majorSelect"),
  middle: document.querySelector("#middleSelect"),
  minor: document.querySelector("#minorSelect"),
  note: document.querySelector("#noteSelect"),
  noteText: document.querySelector("#noteInput"),
};

let app;
let auth;
let db;
let storage;
let currentUser = null;
let firebaseApi = {};
let recordType = "expense";
let currentView = "overview";
let recordsCache = loadLocalRecords();
let optionsByType = loadOptions();
let lastReportRows = [];
let lastReportSummary = null;
let editingRecordId = null;

const isConfigured = !Object.values(firebaseConfig).some((value) =>
  String(value).includes("請填入"),
);

const pageMeta = {
  overview: {
    eyebrow: "ERP OVERVIEW",
    title: "營運總覽",
    subtitle: "查看內帳損益、現金狀態、庫存與待處理事項",
    action: "新增紀錄",
  },
  expense: {
    eyebrow: "EXPENSE MANAGEMENT",
    title: "支出管理",
    subtitle: "新增、整理並追蹤每一筆公司支出",
    action: "＋ 新增支出",
  },
  income: {
    eyebrow: "INCOME MANAGEMENT",
    title: "收入管理",
    subtitle: "整理團拆收入、卡片銷售與平台撥款",
    action: "＋ 新增收入",
  },
  pending: {
    eyebrow: "ACTION CENTER",
    title: "待處理事項",
    subtitle: "集中查看待補憑證、待確認交易與專業判斷項目",
    action: "回到新增紀錄",
  },
  reports: {
    eyebrow: "REPORT CENTER",
    title: "報表中心",
    subtitle: "查看自訂區間損益、毛利率、淨利率與分類彙總",
    action: "新增紀錄",
  },
  cashflow: {
    eyebrow: "CASHFLOW",
    title: "現金流",
    subtitle: "匯入銀行對帳單，追蹤實際收款、付款、平台待撥款與股東代墊",
    action: "新增支出",
  },
  inventory: {
    eyebrow: "INVENTORY",
    title: "進銷存",
    subtitle: "管理進貨、銷貨、庫存與實際商品成本",
    action: "新增收入",
  },
  vouchers: {
    eyebrow: "VOUCHERS",
    title: "憑證中心",
    subtitle: "集中管理發票、收據、待補憑證與重複入帳提醒",
    action: "新增紀錄",
  },
  settings: {
    eyebrow: "SYSTEM RULES",
    title: "系統設定",
    subtitle: "管理會計規則、報表規則與自動化設定",
    action: "新增紀錄",
  },
};

setDefaultDate();
setDefaultReportDates();
restoreOrder(".sidebar-nav", ".nav-item", "sidebarNavOrder", getNavKey);
restoreOrder(".summary-grid", ".summary-card", "summaryCardOrder", (item) => item.dataset.cardId);
enableDragSort(".sidebar-nav", ".nav-item", ".drag-handle", "sidebarNavOrder", getNavKey);
enableDragSort(".summary-grid", ".summary-card", ".card-drag-handle", "summaryCardOrder", (item) => item.dataset.cardId);
updatePageMeta("overview");
renderAllOptions();
renderOptionsEditor();
updateFormLabels();

if (isConfigured) {
  initializeFirebase();
} else {
  setupNotice.hidden = false;
  setReportDatesFromRecords(recordsCache);
  renderRecords(recordsCache);
  updateSummary(recordsCache);
  renderCustomReport();
}

async function initializeFirebase() {
  const [appModule, authModule, firestoreModule, storageModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js"),
  ]);

  firebaseApi = {
    ...authModule,
    ...firestoreModule,
    ...storageModule,
  };

  app = appModule.initializeApp(firebaseConfig);
  auth = authModule.getAuth(app);
  db = firestoreModule.getFirestore(app);
  storage = storageModule.getStorage(app);
  authModule.onAuthStateChanged(auth, handleAuthState);
}

signInButton.addEventListener("click", async () => {
  if (!isConfigured) {
    showToast("請先完成 Firebase 設定。");
    return;
  }

  try {
    await firebaseApi.signInWithPopup(auth, new firebaseApi.GoogleAuthProvider());
  } catch (error) {
    showToast(`登入失敗：${error.message}`);
  }
});

signOutButton.addEventListener("click", async () => {
  await firebaseApi.signOut(auth);
});

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    setRecordType(button.dataset.type);
    setActiveNavForType(button.dataset.type);
  });
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    showView(view);

    if (view === "ledger" && button.dataset.type) {
      setRecordType(button.dataset.type);
    } else {
      updatePageMeta(view);
    }
  });
});

topActionButton.addEventListener("click", () => {
  if (currentView === "cashflow") setRecordType("expense");
  if (currentView === "inventory") setRecordType("income");
  showView("ledger");
  setActiveNavForType(recordType);
  document.querySelector(".ledger-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

generateReportButton.addEventListener("click", renderCustomReport);
exportReportButton.addEventListener("click", exportCurrentReport);

importLedgerButton.addEventListener("click", () => {
  importLedgerInput.click();
});

importLedgerInput.addEventListener("change", async () => {
  const file = importLedgerInput.files?.[0];
  if (!file) return;

  try {
    await importLedgerFile(file);
  } catch (error) {
    showToast(`匯入失敗：${error.message}`);
  } finally {
    importLedgerInput.value = "";
  }
});

document.querySelectorAll("[data-add-option]").forEach((button) => {
  button.addEventListener("click", () => {
    addOption(button.dataset.addOption);
  });
});

fields.note.addEventListener("change", () => {
  fields.noteText.hidden = fields.note.value !== "自訂";
});

voucherInput.addEventListener("change", () => {
  const file = voucherInput.files?.[0];
  voucherPreview.textContent = file
    ? `已選擇：${file.name} (${formatBytes(file.size)})，發票狀態將自動標記為有`
    : "目前默認：無發票";
});

toggleOptionsButton.addEventListener("click", () => {
  optionsPanel.hidden = !optionsPanel.hidden;
});

resetOptionsButton.addEventListener("click", () => {
  optionsByType[recordType] = structuredClone(defaultOptionsByType[recordType]);
  saveOptions();
  renderAllOptions();
  renderOptionsEditor();
  showToast(`已還原${typeLabel(recordType)}預設選項。`);
});

clearButton.addEventListener("click", () => {
  ledgerForm.reset();
  setDefaultDate();
  voucherInput.value = "";
  voucherPreview.textContent = "目前默認：無發票";
  fields.noteText.hidden = true;
  resetEditingState();
});

document.querySelector("#refreshRecordsButton").addEventListener("click", loadRecords);

recordsList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-record-action]");
  if (!button) return;

  const record = recordsCache.find((item) => item.id === button.dataset.recordId);
  if (!record) return;

  if (button.dataset.recordAction === "edit") {
    startEditingRecord(record);
    return;
  }

  if (button.dataset.recordAction === "delete") {
    await handleDeleteRecord(record);
  }
});

ledgerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser && isConfigured) {
    showToast("請先登入。");
    return;
  }

  const record = buildRecord();
  if (!record) return;

  saveButton.disabled = true;
  saveButton.textContent = "儲存中...";

  try {
    const previousRecord = editingRecordId ? recordsCache.find((item) => item.id === editingRecordId) : null;
    const duplicate = editingRecordId ? null : findPossibleDuplicate(record);
    if (duplicate) {
      const shouldDeletePrevious = window.confirm(buildDuplicateMessage(duplicate, record));
      if (shouldDeletePrevious) {
        await deletePreviousRecord(duplicate);
      }
    }

    if (editingRecordId) {
      if (previousRecord && !record.voucherFile && previousRecord.voucher) {
        record.voucher = previousRecord.voucher;
        record.hasVoucher = true;
        record.pendingReason = "";
      }
      await updateRecord(record);
    } else if (isConfigured) {
      await saveRecordToFirebase(record);
      await loadRecords();
    } else {
      recordsCache.unshift({ id: crypto.randomUUID(), ...stripFile(record), createdAt: new Date() });
      saveLocalRecords();
      renderRecords(recordsCache);
      updateSummary(recordsCache);
    }

    clearButton.click();
    showToast(previousRecord ? "紀錄已更新。" : "紀錄已儲存。");
  } catch (error) {
    showToast(`儲存失敗：${error.message}`);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "儲存紀錄";
  }
});

function handleAuthState(user) {
  currentUser = user;

  if (!user) {
    authStatus.textContent = "尚未登入";
    signInButton.hidden = false;
    signOutButton.hidden = true;
    saveButton.disabled = true;
    return;
  }

  const allowed = allowedEmails.includes(user.email);
  authStatus.textContent = allowed ? user.email : `${user.email} 未授權`;
  signInButton.hidden = true;
  signOutButton.hidden = false;
  saveButton.disabled = !allowed;

  if (!allowed) {
    showToast("此 Gmail 尚未列入允許清單。");
    return;
  }

  loadRecords();
}

function setDefaultDate() {
  const today = new Date();
  const year = Math.min(Math.max(today.getFullYear(), 2026), 2035);
  fields.date.value = `${year}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function setDefaultReportDates() {
  const today = new Date();
  const year = Math.min(Math.max(today.getFullYear(), 2026), 2035);
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  reportStartInput.value = `${year}-${month}-01`;
  reportEndInput.value = `${year}-${month}-${day}`;
}

function renderAllOptions() {
  const options = optionsByType[recordType];
  fillSelect(fields.counterparty, options.counterparties);
  fillSelect(fields.cashflow, options.cashflows);
  fillSelect(fields.account, options.accounts);
  fillSelect(fields.major, options.majors);
  fillSelect(fields.middle, options.middles);
  fillSelect(fields.minor, options.minors);
  fillSelect(fields.note, options.notes);
}

function fillSelect(select, values) {
  select.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("");
}

function renderOptionsEditor() {
  const options = optionsByType[recordType];
  optionsTitle.textContent = `管理${typeLabel(recordType)}選項`;
  optionsEditor.innerHTML = Object.entries(optionLabels)
    .map(([key, label]) => {
      return `
        <article class="option-box">
          <h3>${typeLabel(recordType)}：${label}</h3>
          <textarea data-option-editor="${key}">${escapeHtml(options[key].join("\n"))}</textarea>
        </article>
      `;
    })
    .join("");

  optionsEditor.querySelectorAll("[data-option-editor]").forEach((textarea) => {
    textarea.addEventListener("change", () => {
      const key = textarea.dataset.optionEditor;
      const values = textarea.value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      optionsByType[recordType][key] = normalizeOptions(values, defaultOptionsByType[recordType][key]);
      saveOptions();
      renderAllOptions();
      showToast(`${typeLabel(recordType)}${optionLabels[key]}已更新。`);
    });
  });
}

function normalizeOptions(values, fallback) {
  const normalized = values.length ? Array.from(new Set(values)) : [...fallback];
  if (!normalized.includes("自訂")) normalized.push("自訂");
  return normalized;
}

function addOption(key) {
  const value = window.prompt(`新增${typeLabel(recordType)}${optionLabels[key]}`);
  if (!value?.trim()) return;

  optionsByType[recordType][key] = normalizeOptions(
    [...optionsByType[recordType][key], value.trim()],
    defaultOptionsByType[recordType][key],
  );
  saveOptions();
  renderAllOptions();
  renderOptionsEditor();
}

function updateFormLabels() {
  const isExpense = recordType === "expense";
  formTitle.textContent = isExpense ? "新增支出紀錄" : "新增收入紀錄";
  amountLabel.textContent = isExpense ? "支出金額" : "收入金額";
  accountLabel.textContent = isExpense ? "支出帳戶" : "收款帳戶";
  updateActiveSummaryCard();
  if (currentView === "ledger") updatePageMeta(recordType);
}

function setRecordType(type) {
  recordType = type;
  document.querySelectorAll(".segment").forEach((item) => {
    item.classList.toggle("active", item.dataset.type === type);
  });
  renderAllOptions();
  renderOptionsEditor();
  updateFormLabels();
}

function setActiveNavForType(type) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === "ledger" && item.dataset.type === type);
  });
}

function showView(view) {
  currentView = view;
  document.querySelectorAll(".view-panel").forEach((panel) => panel.classList.remove("active"));
  document.querySelector(`#${view}View`)?.classList.add("active");
}

function updatePageMeta(key) {
  const meta = pageMeta[key] || pageMeta.expense;
  pageEyebrow.textContent = meta.eyebrow;
  pageTitle.textContent = meta.title;
  pageSubtitle.textContent = meta.subtitle;
  topActionButton.textContent = meta.action;
}

function updateActiveSummaryCard() {
  document.querySelectorAll("[data-summary-type]").forEach((card) => {
    card.classList.toggle("primary", card.dataset.summaryType === recordType);
    card.classList.toggle("income", card.dataset.summaryType === "income" && card.dataset.summaryType !== recordType);
  });
}

function enableDragSort(containerSelector, itemSelector, handleSelector, storageKey, getKey) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  let draggedItem = null;

  container.querySelectorAll(itemSelector).forEach((item) => {
    const handle = item.querySelector(handleSelector);
    if (!handle) return;

    handle.addEventListener("dragstart", (event) => {
      draggedItem = item;
      item.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", getKey(item) || "");
    });

    handle.addEventListener("dragend", () => {
      draggedItem?.classList.remove("dragging");
      container.querySelectorAll(itemSelector).forEach((node) => node.classList.remove("drag-over"));
      draggedItem = null;
      saveOrder(container, itemSelector, storageKey, getKey);
    });
  });

  container.addEventListener("dragover", (event) => {
    event.preventDefault();
    const target = event.target.closest(itemSelector);
    if (!target || !draggedItem || target === draggedItem || !container.contains(target)) return;

    container.querySelectorAll(itemSelector).forEach((node) => node.classList.remove("drag-over"));
    target.classList.add("drag-over");

    const rect = target.getBoundingClientRect();
    const isHorizontal = Math.abs(event.clientX - rect.left) > Math.abs(event.clientY - rect.top);
    const before = isHorizontal
      ? event.clientX < rect.left + rect.width / 2
      : event.clientY < rect.top + rect.height / 2;
    container.insertBefore(draggedItem, before ? target : target.nextSibling);
  });

  container.addEventListener("drop", (event) => {
    event.preventDefault();
    container.querySelectorAll(itemSelector).forEach((node) => node.classList.remove("drag-over"));
    saveOrder(container, itemSelector, storageKey, getKey);
  });
}

function restoreOrder(containerSelector, itemSelector, storageKey, getKey) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const order = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (!order.length) return;

  const items = Array.from(container.querySelectorAll(itemSelector));
  order.forEach((key) => {
    const item = items.find((node) => getKey(node) === key);
    if (item) container.appendChild(item);
  });
}

function saveOrder(container, itemSelector, storageKey, getKey) {
  const order = Array.from(container.querySelectorAll(itemSelector)).map(getKey).filter(Boolean);
  localStorage.setItem(storageKey, JSON.stringify(order));
}

function getNavKey(item) {
  return `${item.dataset.view}:${item.dataset.type || ""}`;
}

function buildRecord() {
  const date = fields.date.value;
  const amount = Number(fields.amount.value);
  const note = fields.note.value === "自訂" ? fields.noteText.value.trim() : fields.note.value;
  const voucherFile = voucherInput.files?.[0] || null;

  if (!date || date < "2026-01-01" || date > "2035-12-31") {
    showToast("請選擇 2026-2035 之間的日期。");
    return null;
  }

  if (!fields.item.value.trim()) {
    showToast("請輸入項目／摘要。");
    return null;
  }

  if (!amount || amount <= 0) {
    showToast("請輸入大於 0 的金額。");
    return null;
  }

  return {
    type: recordType,
    date,
    month: date.slice(0, 7).replace("-", ""),
    counterparty: fields.counterparty.value,
    item: fields.item.value.trim(),
    amount,
    invoiceStatus: voucherFile ? "有" : "無",
    cashflow: fields.cashflow.value,
    account: fields.account.value,
    major: fields.major.value,
    middle: fields.middle.value,
    minor: fields.minor.value,
    note,
    hasVoucher: Boolean(voucherFile),
    pendingReason: voucherFile ? "" : "待補憑證",
    voucherFile,
  };
}

function findPossibleDuplicate(record) {
  if (!record.hasVoucher) return null;

  return recordsCache.find((existing) => {
    const existingHasVoucher = Boolean(existing.hasVoucher || existing.voucher);
    return (
      existing.type === record.type &&
      existing.date === record.date &&
      existing.counterparty === record.counterparty &&
      existing.item === record.item &&
      Number(existing.amount) === Number(record.amount) &&
      !existingHasVoucher
    );
  });
}

function buildDuplicateMessage(previous, current) {
  return [
    "偵測到可能重複入帳：你這次有上傳發票，但前一筆相同紀錄尚未附憑證。",
    "",
    "前一筆資料：",
    `日期：${previous.date}`,
    `交易對象：${previous.counterparty}`,
    `項目：${previous.item}`,
    `金額：NT$ ${formatNumber(previous.amount)}`,
    `金流方式：${previous.cashflow}`,
    `帳戶：${previous.account}`,
    `憑證：${previous.invoiceStatus || "無"}`,
    "",
    "這次資料：",
    `日期：${current.date}`,
    `交易對象：${current.counterparty}`,
    `項目：${current.item}`,
    `金額：NT$ ${formatNumber(current.amount)}`,
    `金流方式：${current.cashflow}`,
    `帳戶：${current.account}`,
    "憑證：有",
    "",
    "是否刪除前一筆資料？",
    "按「確定」會刪除前一筆，再儲存這筆；按「取消」會保留前一筆並仍儲存這筆。",
  ].join("\n");
}

async function deletePreviousRecord(record) {
  if (isConfigured) {
    await firebaseApi.deleteDoc(firebaseApi.doc(db, "ledgerRecords", record.id));
  }
  recordsCache = recordsCache.filter((item) => item.id !== record.id);
  if (!isConfigured) saveLocalRecords();
}

async function handleDeleteRecord(record) {
  const confirmed = window.confirm(
    `確定要刪除這筆紀錄嗎？\n\n日期：${record.date}\n項目：${record.item}\n金額：NT$ ${formatNumber(record.amount)}`,
  );
  if (!confirmed) return;

  await deletePreviousRecord(record);
  resetEditingState();
  renderRecords(recordsCache);
  updateSummary(recordsCache);
  renderCustomReport();
  showToast("紀錄已刪除。");
}

async function updateRecord(record) {
  const cleanedRecord = {
    ...stripFile(record),
    voucher: record.voucher || null,
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  };

  if (isConfigured) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, "ledgerRecords", editingRecordId), cleanedRecord);
    await loadRecords();
    return;
  }

  recordsCache = recordsCache.map((item) =>
    item.id === editingRecordId ? { ...item, ...cleanedRecord } : item,
  );
  saveLocalRecords();
  renderRecords(recordsCache);
  updateSummary(recordsCache);
  renderCustomReport();
}

function startEditingRecord(record) {
  editingRecordId = record.id;
  setRecordType(record.type);
  setActiveNavForType(record.type);
  showView("ledger");

  fields.date.value = record.date || "";
  ensureSelectValue(fields.counterparty, record.counterparty);
  fields.item.value = record.item || "";
  fields.amount.value = Number(record.amount || 0);
  ensureSelectValue(fields.cashflow, record.cashflow);
  ensureSelectValue(fields.account, record.account);
  ensureSelectValue(fields.major, record.major);
  ensureSelectValue(fields.middle, record.middle);
  ensureSelectValue(fields.minor, record.minor);
  setNoteValue(record.note);
  voucherInput.value = "";
  voucherPreview.textContent = record.voucher?.name
    ? `目前憑證：${record.voucher.name}`
    : "未上傳時默認無發票；有上傳會自動標記為有";
  saveButton.textContent = "更新紀錄";
  ledgerForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetEditingState() {
  editingRecordId = null;
  saveButton.textContent = "儲存紀錄";
}

function ensureSelectValue(select, value) {
  if (!value) return;
  const exists = Array.from(select.options).some((option) => option.value === value);
  if (!exists) {
    select.add(new Option(value, value));
  }
  select.value = value;
}

function setNoteValue(note) {
  if (!note) {
    fields.noteText.hidden = true;
    return;
  }

  const exists = Array.from(fields.note.options).some((option) => option.value === note);
  if (exists) {
    fields.note.value = note;
    fields.noteText.hidden = true;
    fields.noteText.value = "";
    return;
  }

  const customValue = optionsByType[recordType].notes.at(-1);
  fields.note.value = customValue;
  fields.noteText.hidden = false;
  fields.noteText.value = note;
}

async function saveRecordToFirebase(record) {
  let voucher = null;

  if (record.voucherFile) {
    const safeName = `${Date.now()}_${record.voucherFile.name}`;
    const storagePath = `vouchers/${record.month}/${record.type}/${safeName}`;
    const fileRef = firebaseApi.ref(storage, storagePath);
    await firebaseApi.uploadBytes(fileRef, record.voucherFile, {
      contentType: record.voucherFile.type || "application/octet-stream",
    });
    voucher = {
      name: record.voucherFile.name,
      storagePath,
      downloadURL: await firebaseApi.getDownloadURL(fileRef),
      size: record.voucherFile.size,
    };
  }

  await firebaseApi.addDoc(firebaseApi.collection(db, "ledgerRecords"), {
    ...stripFile(record),
    voucher,
    createdAt: firebaseApi.serverTimestamp(),
    createdBy: currentUser.email,
    updatedAt: firebaseApi.serverTimestamp(),
    userId: currentUser.uid,
  });
}

async function saveCleanRecord(record) {
  if (isConfigured) {
    await firebaseApi.addDoc(firebaseApi.collection(db, "ledgerRecords"), {
      ...record,
      voucher: null,
      createdAt: firebaseApi.serverTimestamp(),
      createdBy: currentUser.email,
      updatedAt: firebaseApi.serverTimestamp(),
      userId: currentUser.uid,
    });
  } else {
    recordsCache.unshift({ id: crypto.randomUUID(), ...record, createdAt: new Date() });
  }
}

async function importLedgerFile(file) {
  if (!window.XLSX) {
    throw new Error("Excel 套件尚未載入，請確認網路可連線後重試。");
  }

  if (!currentUser && isConfigured) {
    showToast("請先登入。");
    return;
  }

  const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames.includes("每日流水帳") ? "每日流水帳" : workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[sheetName];
  const rows = readLedgerRows(firstSheet);
  const parsed = rows.map((row) => parseImportRow(row.values, row.sourceRow)).filter(Boolean);

  if (!parsed.length) {
    showToast("沒有可匯入的資料。");
    return;
  }

  const confirmed = window.confirm(`將匯入 ${parsed.length} 筆${typeLabel(recordType)}資料。是否繼續？`);
  if (!confirmed) return;

  for (const record of parsed) {
    await saveCleanRecord(record);
  }

  if (isConfigured) {
    await loadRecords();
  } else {
    saveLocalRecords();
    setReportDatesFromRecords(recordsCache);
    renderRecords(recordsCache);
    updateSummary(recordsCache);
    renderCustomReport();
  }

  showToast(`已匯入 ${parsed.length} 筆資料。`);
}

function parseImportRow(row, sourceRow) {
  const date = normalizeImportDate(pickValue(row, ["日期", "交易日期", "date"]));
  const typeText = String(pickValue(row, ["類型", "收支", "type"]) || "").trim();
  const incomeAmount = parseAmount(pickValue(row, ["收入金額", "收入", "收款金額", "營收", "商品收入", "淨銷售額", "金流／物流收入", "金流/物流收入"]));
  const expenseAmount = parseAmount(pickValue(row, ["支出金額", "支出", "付款金額"]));
  const genericAmount = parseAmount(pickValue(row, ["金額", "amount"]));
  const type = typeText.includes("收") || typeText.toLowerCase() === "income" || incomeAmount > 0
    ? "income"
    : recordType;
  const amount = incomeAmount || expenseAmount || genericAmount;
  const item = String(pickValue(row, ["項目", "摘要", "項目／摘要", "item"]) || inferImportItem(row, type)).trim();
  const counterparty = String(pickValue(row, ["交易對象", "對象", "廠商", "客戶", "counterparty"]) || inferImportCounterparty(row, type)).trim();
  const invoiceRaw = pickValue(row, ["有無發票", "發票", "發票狀態", "invoiceStatus"]);
  const invoiceStatus = normalizeInvoiceStatus(invoiceRaw);
  const invoiceFileName = String(pickValue(row, ["發票檔名", "憑證檔名", "收據檔名"]) || "").trim();
  const shouldRequireVoucher = type === "expense" || Boolean(invoiceRaw) || Boolean(invoiceFileName);
  const productCost = parseAmount(pickValue(row, ["商品成本", "銷貨成本"]));
  const logisticsCost = parseAmount(pickValue(row, ["金流／物流成本", "金流/物流成本", "物流成本", "金流成本"]));
  const logisticsIncome = parseAmount(pickValue(row, ["金流／物流收入", "金流/物流收入", "物流收入", "金流收入"]));
  const extraExpense = parseAmount(pickValue(row, ["額外費用", "其他費用"]));
  const refundAmount = parseAmount(pickValue(row, ["退貨金額", "退款金額"]));
  const netSales = parseAmount(pickValue(row, ["淨銷售額", "淨銷售", "淨收入"]));

  if (!date || !amount || !item) {
    return null;
  }

  return {
    type,
    date,
    month: date.slice(0, 7).replace("-", ""),
    counterparty,
    item,
    amount: Math.abs(amount),
    invoiceStatus,
    cashflow: String(pickValue(row, ["金流方式", "付款方式", "收款方式", "支出方式", "收入方式", "cashflow"]) || inferImportCashflow(row, type)).trim(),
    account: String(pickValue(row, ["帳戶", "支出帳戶", "收款帳戶", "account"]) || inferImportAccount(type)).trim(),
    major: String(pickValue(row, ["大類", "major"]) || inferImportMajor(type)).trim(),
    middle: String(pickValue(row, ["中類", "middle"]) || inferImportMiddle(row, type)).trim(),
    minor: String(pickValue(row, ["細項", "minor"]) || inferImportMinor(row, type)).trim(),
    note: String(pickValue(row, ["備註", "note"]) || `Excel 匯入列 ${sourceRow}`).trim(),
    hasVoucher: invoiceStatus === "有" || Boolean(invoiceFileName),
    pendingReason: invoiceStatus === "有" || invoiceFileName || !shouldRequireVoucher ? "" : "待補憑證",
    voucherFileName: invoiceFileName,
    productCost,
    logisticsCost,
    logisticsIncome,
    extraExpense,
    refundAmount,
    netSales,
    importSource: "Excel",
    sourceRow,
  };
}

function readLedgerRows(sheet) {
  const matrix = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  const headerIndex = matrix.findIndex((row) => {
    const headers = row.map(normalizeHeader);
    const hasDate = headers.includes(normalizeHeader("日期")) || headers.includes("date");
    const hasItem = headers.includes(normalizeHeader("項目／摘要")) || headers.includes(normalizeHeader("摘要"));
    const hasAmount = headers.some((header) => ["金額", "支出金額", "收入金額", "amount"].map(normalizeHeader).includes(header));
    const hasSalesAmount = headers.some((header) =>
      ["營收", "商品收入", "淨銷售額", "金流/物流收入", "金流／物流收入"].map(normalizeHeader).includes(header),
    );
    return hasDate && ((hasItem && hasAmount) || hasSalesAmount);
  });

  if (headerIndex < 0) return [];

  const headers = matrix[headerIndex].map((value) => String(value).trim());
  return matrix.slice(headerIndex + 1).map((row, rowOffset) => {
    const values = {};
    headers.forEach((header, index) => {
      if (header) values[header] = row[index];
    });
    return { values, sourceRow: headerIndex + rowOffset + 2 };
  });
}

function inferImportItem(row, type) {
  if (type === "income" && hasAnyColumn(row, ["營收", "商品收入", "淨銷售額"])) return "每日銷售收入";
  return "待確認";
}

function inferImportCounterparty(row, type) {
  if (type === "income" && hasAnyColumn(row, ["新增訂單數", "購買商品數", "營收"])) return "買家";
  return "待確認";
}

function inferImportCashflow(row, type) {
  if (type === "income" && hasAnyColumn(row, ["金流/物流收入", "金流／物流收入", "營收"])) return "平台撥款";
  return "待確認";
}

function inferImportAccount(type) {
  return type === "income" ? "平台帳戶" : "待確認";
}

function inferImportMajor(type) {
  return type === "income" ? "銷貨收入" : "待確認";
}

function inferImportMiddle(row, type) {
  if (type === "income" && hasAnyColumn(row, ["營收", "商品收入", "淨銷售額"])) return "卡片銷售";
  return "待確認";
}

function inferImportMinor(row, type) {
  if (type === "income" && hasAnyColumn(row, ["營收", "商品收入", "淨銷售額"])) return "球員卡收入";
  return "待確認";
}

function hasAnyColumn(row, names) {
  return names.some((name) => pickValue(row, [name]) !== "");
}

function pickValue(row, names) {
  const entries = Object.entries(row);
  for (const name of names) {
    const found = entries.find(([key]) => normalizeHeader(key) === normalizeHeader(name));
    if (found) return found[1];
  }
  return "";
}

function normalizeHeader(value) {
  return String(value).replace(/[\s*＊:：]/g, "").toLowerCase();
}

function normalizeImportDate(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return toDateValue(value);

  const text = String(value).trim();
  const slash = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (slash) {
    return `${slash[1]}-${slash[2].padStart(2, "0")}-${slash[3].padStart(2, "0")}`;
  }

  const shortSlash = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
  if (shortSlash) {
    return `20${shortSlash[3]}-${shortSlash[1].padStart(2, "0")}-${shortSlash[2].padStart(2, "0")}`;
  }

  const compact = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) {
    return `${compact[1]}-${compact[2]}-${compact[3]}`;
  }

  return "";
}

function parseAmount(value) {
  const amount = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount) ? Math.abs(amount) : 0;
}

function normalizeInvoiceStatus(value) {
  const text = String(value || "").trim();
  if (["是", "有", "yes", "y", "true"].includes(text.toLowerCase())) return "有";
  return "無";
}

async function loadRecords() {
  if (!currentUser || !db) return;

  const snapshot = await firebaseApi.getDocs(
    firebaseApi.query(
      firebaseApi.collection(db, "ledgerRecords"),
      firebaseApi.where("userId", "==", currentUser.uid),
      firebaseApi.limit(100),
    ),
  );
  recordsCache = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  setReportDatesFromRecords(recordsCache);
  renderRecords(recordsCache);
  updateSummary(recordsCache);
  if (document.querySelector("#reportsView")?.classList.contains("active")) {
    renderCustomReport();
  }
}

function renderCustomReport() {
  const start = reportStartInput.value;
  const end = reportEndInput.value;

  if (!start || !end) {
    customReportResult.innerHTML = `<div class="empty-state">請先選擇起始日期與結束日期。</div>`;
    exportReportButton.disabled = true;
    return;
  }

  if (start > end) {
    customReportResult.innerHTML = `<div class="empty-state">起始日期不可晚於結束日期。</div>`;
    exportReportButton.disabled = true;
    return;
  }

  const records = recordsCache.filter((record) => record.date >= start && record.date <= end);
  const expense = sumByType(records, "expense");
  const income = sumByType(records, "income");
  const productCost = sumField(records, "productCost");
  const logisticsCost = sumField(records, "logisticsCost");
  const packagingCost = sumPackagingCost(records);
  const pending = records.filter((record) => record.pendingReason).length;
  const grossProfit = income - productCost - logisticsCost - packagingCost;
  const otherExpense = Math.max(expense - packagingCost, 0);
  const net = grossProfit - otherExpense;
  const grossMargin = income ? grossProfit / income : null;
  const netMargin = income ? net / income : null;
  const breakdown = buildCategoryBreakdown(records);
  lastReportRows = records;
  lastReportSummary = {
    start,
    end,
    income,
    expense,
    productCost,
    logisticsCost,
    packagingCost,
    grossProfit,
    grossMargin,
    otherExpense,
    net,
    netMargin,
    pending,
    count: records.length,
    breakdown,
  };
  exportReportButton.disabled = records.length === 0;

  customReportResult.innerHTML = `
    <div class="report-summary-grid">
      <article class="report-summary-card">
        <span>區間收入</span>
        <strong>NT$ ${formatNumber(income)}</strong>
      </article>
      <article class="report-summary-card">
        <span>區間支出</span>
        <strong>NT$ ${formatNumber(expense)}</strong>
      </article>
      <article class="report-summary-card">
        <span>毛利率</span>
        <strong>${formatPercent(grossMargin)}</strong>
      </article>
      <article class="report-summary-card">
        <span>淨利率</span>
        <strong>${formatPercent(netMargin)}</strong>
      </article>
      <article class="report-summary-card">
        <span>收支淨額</span>
        <strong>${net >= 0 ? "" : "-"}NT$ ${formatNumber(Math.abs(net))}</strong>
      </article>
      <article class="report-summary-card">
        <span>筆數／待補憑證</span>
        <strong>${records.length} 筆 / ${pending} 筆</strong>
      </article>
    </div>
    <div class="category-breakdown">
      ${breakdown.length ? breakdown.map(renderCategoryRow).join("") : `<div class="empty-state">此區間沒有紀錄。</div>`}
    </div>
  `;
}

function exportCurrentReport() {
  if (!window.XLSX) {
    showToast("Excel 套件尚未載入，請確認網路可連線後重試。");
    return;
  }

  if (!lastReportSummary || !lastReportRows.length) {
    showToast("請先產生有資料的區間報表。");
    return;
  }

  const workbook = window.XLSX.utils.book_new();
  appendSheet(workbook, "交易明細", buildTransactionDetailSheet());
  appendSheet(workbook, "分錄草稿", buildJournalDraftSheet());
  appendSheet(workbook, "待確認", buildPendingSheet());
  appendSheet(workbook, "損益表", buildIncomeStatementSheet());
  appendSheet(workbook, "每日收支", buildDailySheet());
  appendSheet(workbook, "三級科目明細", buildAccountDetailSheet());
  appendSheet(workbook, "稅額彙總", buildTaxSheet());
  appendSheet(workbook, "現金流摘要", buildCashflowSheet());
  appendSheet(workbook, "檢查與來源", buildCheckSheet());
  appendSheet(workbook, "來源索引", buildSourceIndexSheet());
  appendSheet(workbook, "區間總覽", buildOverviewSheet());
  window.XLSX.writeFile(workbook, `${lastReportSummary.start}_${lastReportSummary.end}_會計報表草稿.xlsx`);
}

function appendSheet(workbook, name, rows) {
  const sheet = window.XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = inferColumnWidths(rows);
  window.XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function inferColumnWidths(rows) {
  const maxCols = Math.max(...rows.map((row) => row.length));
  return Array.from({ length: maxCols }, (_, col) => {
    const width = Math.min(
      Math.max(
        ...rows.map((row) => String(row[col] ?? "").length),
        10,
      ),
      42,
    );
    return { wch: width + 2 };
  });
}

function buildTransactionDetailSheet() {
  return [
    ["交易明細與分類依據"],
    [],
    ["日期", "類型", "交易對象", "摘要", "收入", "營業費用／成本", "商品成本", "金流／物流成本", "三級科目", "含稅／總額", "未稅金額", "金流方式", "帳戶", "發票狀態", "待處理原因", "備註", "來源"],
    ...lastReportRows.map((record) => {
      const income = record.type === "income" ? Number(record.amount || 0) : 0;
      const expense = record.type === "expense" ? Number(record.amount || 0) : Number(record.logisticsCost || 0) + Number(record.extraExpense || 0);
      const account = inferAccountCode(record);
      return [
        record.date,
        typeLabel(record.type),
        record.counterparty,
        record.item,
        income,
        expense,
        Number(record.productCost || 0),
        Number(record.logisticsCost || 0),
        account,
        Number(record.amount || 0),
        Number(record.amount || 0),
        record.cashflow,
        record.account,
        record.invoiceStatus || (record.hasVoucher ? "有" : "無"),
        record.pendingReason || "",
        record.note || "",
        record.importSource ? `${record.importSource}｜第 ${record.sourceRow || ""} 列` : "網頁輸入",
      ];
    }),
  ];
}

function buildJournalDraftSheet() {
  const rows = [["權責發生制分錄草稿"], [], ["分錄號", "日期", "摘要", "借方科目", "貸方科目", "金額", "來源", "備註"]];
  let index = 1;
  lastReportRows.forEach((record) => {
    const no = `E${String(index).padStart(4, "0")}`;
    if (record.type === "income") {
      rows.push([no, record.date, record.item, "1103 應收帳款", inferAccountCode(record), Number(record.amount || 0), record.importSource || "網頁輸入", "收入與收款狀態待確認"]);
      if (Number(record.productCost || 0) > 0) {
        rows.push([no, record.date, "銷貨成本結轉", "5102 銷貨成本", "1201 存貨", Number(record.productCost || 0), record.importSource || "網頁輸入", "依匯入銷售報表商品成本，待存貨盤點確認"]);
      }
      if (Number(record.logisticsCost || 0) > 0) {
        rows.push([no, record.date, "金流／物流成本", "6112 手續費", "2102 其他應付款", Number(record.logisticsCost || 0), record.importSource || "網頁輸入", "付款狀態待確認"]);
      }
    } else {
      rows.push([no, record.date, record.item, inferAccountCode(record), inferCreditAccount(record), Number(record.amount || 0), record.importSource || "網頁輸入", record.pendingReason || ""]);
    }
    index += 1;
  });
  return rows;
}

function buildPendingSheet() {
  return [
    ["待確認交易"],
    [],
    ["日期", "交易對象", "摘要", "金額", "暫分類", "待確認原因", "建議處理方式", "來源檔案"],
    ...lastReportRows
      .filter((record) => record.pendingReason || record.type === "income")
      .map((record) => [
        record.date,
        record.counterparty,
        record.item,
        Number(record.amount || 0),
        inferAccountCode(record),
        record.pendingReason || "收入收款、發票號碼、課稅別及銷項稅資訊待確認。",
        "請確認科目、稅額、權責期間及收付款狀態；確認後再更新正式分錄。",
        record.importSource ? `${record.importSource}｜第 ${record.sourceRow || ""} 列` : "網頁輸入",
      ]),
  ];
}

function buildIncomeStatementSheet() {
  const income = lastReportSummary.income;
  const productCost = lastReportSummary.productCost;
  const logisticsCost = lastReportSummary.logisticsCost;
  const packagingCost = lastReportSummary.packagingCost;
  const otherExpense = lastReportSummary.otherExpense;
  return [
    [`${lastReportSummary.start} 至 ${lastReportSummary.end} 損益表草稿`],
    [],
    ["項目", "金額", "說明"],
    ["商品直接收入", income, "依匯入收入與銷售報表；銷項稅待確認"],
    ["商品成本", productCost, "依銷售報表商品成本；若未匯入則為 0"],
    ["金流／物流成本", logisticsCost, "依銷售報表金流／物流成本"],
    ["包材", packagingCost, "依支出中包材、包裝、紙箱、氣泡、膠帶等關鍵字彙總"],
    ["毛利", { f: "B4-B5-B6-B7" }, "商品直接收入減商品成本、金流物流成本與包材"],
    ["毛利率", { f: "IF(B4=0,0,B8/B4)" }, "毛利除以商品直接收入"],
    ["其他營業費用", otherExpense, "支出扣除已列入毛利的包材"],
    ["營業損益", { f: "B8-B10" }, "毛利減其他營業費用"],
    ["淨利率", { f: "IF(B4=0,0,B11/B4)" }, "營業損益除以商品直接收入"],
    ["本期損益", { f: "B11" }, "未含折舊、期末調整及所得稅"],
  ];
}

function buildDailySheet() {
  const days = getDateRange(lastReportSummary.start, lastReportSummary.end);
  return [
    ["每日收入、成本與支出"],
    [],
    ["日期", "收入", "銷貨成本", "營業費用", "金流／物流成本", "交易筆數"],
    ...days.map((date) => {
      const records = lastReportRows.filter((record) => record.date === date);
      return [
        date,
        sumByType(records, "income"),
        sumField(records, "productCost"),
        sumByType(records, "expense"),
        sumField(records, "logisticsCost"),
        records.length,
      ];
    }),
  ];
}

function buildAccountDetailSheet() {
  const totals = new Map();
  lastReportRows.forEach((record) => {
    const account = inferAccountCode(record);
    const current = totals.get(account) || { debit: 0, credit: 0 };
    if (record.type === "income") current.credit += Number(record.amount || 0);
    else current.debit += Number(record.amount || 0);
    totals.set(account, current);
  });
  return [
    ["三級科目借貸彙總"],
    [],
    ["三級科目", "借方", "貸方", "借方淨額"],
    ...Array.from(totals.entries()).map(([account, total], index) => [
      account,
      total.debit,
      total.credit,
      { f: `B${index + 4}-C${index + 4}` },
    ]),
  ];
}

function buildTaxSheet() {
  return [
    ["營業稅彙總草稿"],
    [],
    ["項目", "金額", "說明"],
    ["進項稅額", 0, "目前網頁流水帳尚未拆分可確認進項稅額"],
    ["銷項稅額", 0, "目前收入匯入尚未提供可確認銷項稅額"],
    ["差額", { f: "B5-B4" }, "銷項減進項"],
    ["申報狀態", 0, "僅為會計草稿，不代表已完成營業稅申報"],
  ];
}

function buildCashflowSheet() {
  const inflow = sumByType(lastReportRows, "income");
  const outflow = sumByType(lastReportRows, "expense");
  return [
    ["現金流摘要（已知交易）"],
    [],
    ["類別", "流入", "流出", "淨額"],
    ["營業活動", inflow, outflow, { f: "B4-C4" }],
    ["投資活動", 0, 0, { f: "B5-C5" }],
    ["籌資活動", 0, 0, { f: "B6-C6" }],
    ["合計", { f: "SUM(B4:B6)" }, { f: "SUM(C4:C6)" }, { f: "SUM(D4:D6)" }],
    [],
    ["本表依網頁流水帳已知金流方式彙總；仍需銀行明細與平台撥款資料核對。"],
  ];
}

function buildCheckSheet() {
  return [
    ["檢查、限制與來源"],
    [],
    ["檢查項目", "實際值", "預期值", "差異", "狀態", "說明", "來源"],
    ["交易筆數", lastReportSummary.count, lastReportSummary.count, 0, "OK", "依目前區間流水帳納入。", "ledgerRecords"],
    ["待確認筆數", lastReportSummary.pending, 0, lastReportSummary.pending, lastReportSummary.pending ? "待確認" : "OK", "未附憑證或收入稅務資訊待確認。", "ledgerRecords"],
    ["期間", `${lastReportSummary.start} 至 ${lastReportSummary.end}`, `${lastReportSummary.start} 至 ${lastReportSummary.end}`, "", "OK", "使用者自訂區間。", "報表期間"],
    ["稅額完整性", 0, "待憑證確認", "", "待確認", "目前尚未拆分進項稅額與銷項稅額。", "網頁流水帳"],
  ];
}

function buildSourceIndexSheet() {
  return [
    ["來源索引與處理範圍"],
    [],
    ["來源", "工作表／頁面", "用途", "備註"],
    ["網頁流水帳 ledgerRecords", "目前自訂區間", "收入、支出、分類與憑證狀態", "保留匯入列號與來源標記"],
    ...Array.from(new Set(lastReportRows.map((record) => record.importSource).filter(Boolean))).map((source) => [
      source,
      "Excel 匯入",
      "流水帳資料",
      "詳細列號見交易明細來源欄",
    ]),
  ];
}

function buildOverviewSheet() {
  const totalCost = lastReportSummary.productCost + lastReportSummary.logisticsCost + lastReportSummary.expense;
  return [
    [`${lastReportSummary.start} 至 ${lastReportSummary.end} 會計報表`],
    [],
    ["期間開始", lastReportSummary.start, "", "收入", "成本與費用", "毛利率", "淨利率", "待補憑證", "交易筆數"],
    ["期間結束", lastReportSummary.end, "", lastReportSummary.income, totalCost, formatPercent(lastReportSummary.grossMargin), formatPercent(lastReportSummary.netMargin), lastReportSummary.pending, lastReportSummary.count],
    ["幣別", "TWD"],
    ["會計基礎", "權責發生基礎草稿"],
    ["報表狀態", lastReportSummary.pending ? "草稿／有待確認" : "草稿"],
  ];
}

function inferAccountCode(record) {
  if (record.type === "income") return "4101 銷貨收入";
  if (record.major === "進貨成本") return "5102 銷貨成本";
  if (record.major === "辦公設備") return "1502 辦公設備";
  if (record.major === "行銷與業務") return "6108 廣告費";
  if (record.major === "營業費用") return "6199 雜項費用";
  return `${record.major || "待確認"} / ${record.middle || ""} / ${record.minor || ""}`;
}

function inferCreditAccount(record) {
  if (record.account?.includes("股東")) return "3102 業主往來";
  if (record.account?.includes("信用卡")) return "2102 其他應付款";
  if (record.account?.includes("公司") || record.account?.includes("銀行")) return "1102 銀行存款";
  return "2102 其他應付款";
}

function sumField(records, field) {
  return records.reduce((total, record) => total + Number(record[field] || 0), 0);
}

function sumPackagingCost(records) {
  return records
    .filter((record) => record.type === "expense" && isPackagingRecord(record))
    .reduce((total, record) => total + Number(record.amount || 0), 0);
}

function isPackagingRecord(record) {
  const text = [record.item, record.major, record.middle, record.minor, record.note].join(" ");
  return /包材|包裝|紙箱|氣泡|膠帶|紙袋|信封|耗材/.test(text);
}

function getDateRange(start, end) {
  const dates = [];
  const current = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  while (current <= last) {
    dates.push(toDateValue(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function buildCategoryBreakdown(records) {
  const totals = new Map();

  records.forEach((record) => {
    const key = `${record.type}|${record.major || "未分類"}`;
    const current = totals.get(key) || {
      type: record.type,
      major: record.major || "未分類",
      amount: 0,
      count: 0,
    };
    current.amount += Number(record.amount || 0);
    current.count += 1;
    totals.set(key, current);
  });

  return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
}

function renderCategoryRow(row) {
  return `
    <article class="category-row">
      <strong>${escapeHtml(typeLabel(row.type))} - ${escapeHtml(row.major)}</strong>
      <span>NT$ ${formatNumber(row.amount)}</span>
      <span>${row.count} 筆</span>
    </article>
  `;
}

function renderRecords(records) {
  if (!records.length) {
    recordsList.className = "record-list empty-state";
    recordsList.textContent = "尚無資料";
    return;
  }

  recordsList.className = "record-list";
  recordsList.innerHTML = records
    .map((record) => {
      const label = typeLabel(record.type);
      const amountPrefix = record.type === "income" ? "+" : "-";
      const hasVoucher = Boolean(record.hasVoucher || record.voucher);
      return `
        <article class="record-item">
          <span class="pill ${record.type === "income" ? "income" : ""}">${label}</span>
          <div class="record-main">
            <strong>${escapeHtml(record.item)}</strong>
            <span>${escapeHtml(record.counterparty)} · ${escapeHtml(record.major)} / ${escapeHtml(record.middle)} / ${escapeHtml(record.minor)}</span>
          </div>
          <strong class="record-amount">${amountPrefix} NT$ ${formatNumber(record.amount)}</strong>
          <div class="record-meta">
            ${escapeHtml(record.date)}<br />
            ${escapeHtml(record.cashflow)} · ${hasVoucher ? "有發票" : "無發票"}
            ${record.pendingReason ? `<br /><span class="pill pending">${escapeHtml(record.pendingReason)}</span>` : ""}
          </div>
          <div class="record-actions">
            <button type="button" data-record-action="edit" data-record-id="${escapeHtml(record.id)}">修改</button>
            <button type="button" class="danger" data-record-action="delete" data-record-id="${escapeHtml(record.id)}">刪除</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function updateSummary(records) {
  const summaryMonth = pickSummaryMonth(records);
  const monthRecords = summaryMonth ? records.filter((record) => record.month === summaryMonth) : [];
  const expense = sumByType(monthRecords, "expense");
  const income = sumByType(monthRecords, "income");
  const pending = monthRecords.filter((record) => record.pendingReason).length;
  const label = summaryMonth ? `${summaryMonth.slice(0, 4)}/${summaryMonth.slice(4, 6)}` : "本月";

  expenseSummaryLabel.textContent = `${label}支出`;
  incomeSummaryLabel.textContent = `${label}收入`;
  countSummaryLabel.textContent = `${label}筆數`;
  pendingSummaryLabel.textContent = `${label}待補憑證`;
  document.querySelector("#monthExpense").textContent = `NT$ ${formatNumber(expense)}`;
  document.querySelector("#monthIncome").textContent = `NT$ ${formatNumber(income)}`;
  document.querySelector("#monthCount").textContent = `${monthRecords.length} 筆`;
  document.querySelector("#pendingVoucher").textContent = `${pending} 筆`;
}

function pickSummaryMonth(records) {
  if (!records.length) return toDateValue(new Date()).slice(0, 7).replace("-", "");

  const currentMonth = toDateValue(new Date()).slice(0, 7).replace("-", "");
  if (records.some((record) => record.month === currentMonth)) return currentMonth;

  return records
    .map((record) => record.month)
    .filter(Boolean)
    .sort()
    .at(-1);
}

function setReportDatesFromRecords(records) {
  if (!records.length) return;

  const currentRangeHasData = records.some((record) => {
    return reportStartInput.value && reportEndInput.value && record.date >= reportStartInput.value && record.date <= reportEndInput.value;
  });
  if (currentRangeHasData) return;

  const latestDate = records
    .map((record) => record.date)
    .filter(Boolean)
    .sort()
    .at(-1);
  if (!latestDate) return;

  reportStartInput.value = `${latestDate.slice(0, 7)}-01`;
  reportEndInput.value = latestDate;
}

function sumByType(records, type) {
  return records
    .filter((record) => record.type === type)
    .reduce((total, record) => total + Number(record.amount || 0), 0);
}

function loadOptions() {
  try {
    const saved = JSON.parse(localStorage.getItem("ledgerOptionsByType") || "{}");
    return {
      expense: { ...structuredClone(defaultOptionsByType.expense), ...(saved.expense || {}) },
      income: { ...structuredClone(defaultOptionsByType.income), ...(saved.income || {}) },
    };
  } catch {
    return structuredClone(defaultOptionsByType);
  }
}

function saveOptions() {
  localStorage.setItem("ledgerOptionsByType", JSON.stringify(optionsByType));
}

function loadLocalRecords() {
  try {
    return JSON.parse(localStorage.getItem("ledgerRecordsPreview") || "[]");
  } catch {
    return [];
  }
}

function saveLocalRecords() {
  localStorage.setItem("ledgerRecordsPreview", JSON.stringify(recordsCache));
}

function stripFile(record) {
  const { voucherFile, ...cleanRecord } = record;
  return cleanRecord;
}

function typeLabel(type) {
  return type === "income" ? "收入" : "支出";
}

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.setTimeout(() => {
    toast.hidden = true;
  }, 3800);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
