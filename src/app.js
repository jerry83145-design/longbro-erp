import { allowedEmails, firebaseConfig } from "./firebase-config.js";
import { lineEndpointConfig } from "./line-endpoint-config.js";

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

const inventorySources = {
  box: ["進貨"],
  card: ["團拆入卡", "拆盒入卡", "玩家收購"],
  supply: ["包材採購", "進貨", "其他"],
};

const inventoryTypeLabels = {
  box: "卡盒",
  card: "卡片",
  supply: "包材",
};

const inventoryActionLabels = {
  in: "入庫",
  out: "出庫",
  adjust: "調整",
};

const inventoryUnitLabels = {
  box: "盒",
  card: "張",
  supply: "件",
};

const settlementStatuses = {
  expense: ["已付款", "待付款", "信用卡未請款", "月結未付", "股東代墊未沖", "不適用"],
  income: ["已收款", "待收款", "平台待撥", "月結未收", "不適用"],
};

const setupNotice = document.querySelector("#setupNotice");
const authStatus = document.querySelector("#authStatus");
const signInButton = document.querySelector("#signInButton");
const signOutButton = document.querySelector("#signOutButton");
const ledgerForm = document.querySelector("#ledgerForm");
const formTitle = document.querySelector("#formTitle");
const amountLabel = document.querySelector("#amountLabel");
const accountLabel = document.querySelector("#accountLabel");
const settlementStatusLabel = document.querySelector("#settlementStatusLabel");
const dueDateLabel = document.querySelector("#dueDateLabel");
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
const batchVoucherList = document.querySelector("#batchVoucherList");
const pageEyebrow = document.querySelector("#pageEyebrow");
const pageTitle = document.querySelector("#pageTitle");
const pageSubtitle = document.querySelector("#pageSubtitle");
const topActionButton = document.querySelector("#topActionButton");
const reportStartInput = document.querySelector("#reportStartInput");
const reportEndInput = document.querySelector("#reportEndInput");
const generateReportButton = document.querySelector("#generateReportButton");
const exportReportButton = document.querySelector("#exportReportButton");
const customReportResult = document.querySelector("#customReportResult");
const cashflowStartInput = document.querySelector("#cashflowStartInput");
const cashflowEndInput = document.querySelector("#cashflowEndInput");
const cashflowOpeningBankInput = document.querySelector("#cashflowOpeningBankInput");
const cashflowOpeningCashInput = document.querySelector("#cashflowOpeningCashInput");
const cashflowOpeningPlatformInput = document.querySelector("#cashflowOpeningPlatformInput");
const cashflowOpeningAdvanceInput = document.querySelector("#cashflowOpeningAdvanceInput");
const saveCashflowSettingsButton = document.querySelector("#saveCashflowSettingsButton");
const generateCashflowButton = document.querySelector("#generateCashflowButton");
const cashflowResult = document.querySelector("#cashflowResult");
const bankAccountInput = document.querySelector("#bankAccountInput");
const bankImportInput = document.querySelector("#bankImportInput");
const bankPhotoInput = document.querySelector("#bankPhotoInput");
const bankImportPreview = document.querySelector("#bankImportPreview");
const bankTransactionList = document.querySelector("#bankTransactionList");
const expenseSummaryLabel = document.querySelector("#expenseSummaryLabel");
const incomeSummaryLabel = document.querySelector("#incomeSummaryLabel");
const countSummaryLabel = document.querySelector("#countSummaryLabel");
const pendingSummaryLabel = document.querySelector("#pendingSummaryLabel");
const importLedgerButton = document.querySelector("#importLedgerButton");
const importLedgerInput = document.querySelector("#importLedgerInput");
const pendingSummary = document.querySelector("#pendingSummary");
const pendingList = document.querySelector("#pendingList");
const voucherSummary = document.querySelector("#voucherSummary");
const voucherList = document.querySelector("#voucherList");
const voucherOcrPanel = document.querySelector("#voucherOcrPanel");
const voucherOcrStatus = document.querySelector("#voucherOcrStatus");
const voucherOcrResults = document.querySelector("#voucherOcrResults");
const voucherOcrInput = document.querySelector("#voucherOcrInput");
const voucherInboxList = document.querySelector("#voucherInboxList");
const voucherInboxFilter = document.querySelector("#voucherInboxFilter");
const voucherInboxFields = {
  invoiceNumber: document.querySelector("#voucherInboxInvoiceInput"),
  date: document.querySelector("#voucherInboxDateInput"),
  counterparty: document.querySelector("#voucherInboxCounterpartyInput"),
  amount: document.querySelector("#voucherInboxAmountInput"),
  link: document.querySelector("#voucherInboxLinkInput"),
  note: document.querySelector("#voucherInboxNoteInput"),
};
const saveVoucherInboxButton = document.querySelector("#saveVoucherInboxButton");
const syncDriveVoucherInboxButton = document.querySelector("#syncDriveVoucherInboxButton");
const importVoucherInboxButton = document.querySelector("#importVoucherInboxButton");
const importVoucherInboxInput = document.querySelector("#importVoucherInboxInput");
const settlementList = document.querySelector("#settlementList");
const inventoryForm = document.querySelector("#inventoryForm");
const inventoryDateInput = document.querySelector("#inventoryDateInput");
const inventoryTypeSelect = document.querySelector("#inventoryTypeSelect");
const inventoryActionSelect = document.querySelector("#inventoryActionSelect");
const inventorySourceSelect = document.querySelector("#inventorySourceSelect");
const inventoryNameInput = document.querySelector("#inventoryNameInput");
const inventoryQtyInput = document.querySelector("#inventoryQtyInput");
const inventoryUnitCostInput = document.querySelector("#inventoryUnitCostInput");
const inventoryTotalCostInput = document.querySelector("#inventoryTotalCostInput");
const inventoryReferenceInput = document.querySelector("#inventoryReferenceInput");
const inventoryNoteInput = document.querySelector("#inventoryNoteInput");
const clearInventoryButton = document.querySelector("#clearInventoryButton");
const saveInventoryButton = document.querySelector("#saveInventoryButton");
const inventorySummary = document.querySelector("#inventorySummary");
const inventoryList = document.querySelector("#inventoryList");
const inventoryOpeningBoxQtyInput = document.querySelector("#inventoryOpeningBoxQtyInput");
const inventoryOpeningCardQtyInput = document.querySelector("#inventoryOpeningCardQtyInput");
const inventoryOpeningCostInput = document.querySelector("#inventoryOpeningCostInput");
const saveInventorySettingsButton = document.querySelector("#saveInventorySettingsButton");
const recycleBinList = document.querySelector("#recycleBinList");
const refreshRecycleBinButton = document.querySelector("#refreshRecycleBinButton");
const auditLogList = document.querySelector("#auditLogList");
const refreshAuditLogButton = document.querySelector("#refreshAuditLogButton");

const fields = {
  date: document.querySelector("#dateInput"),
  counterparty: document.querySelector("#counterpartySelect"),
  item: document.querySelector("#itemInput"),
  amount: document.querySelector("#amountInput"),
  cashflow: document.querySelector("#cashflowSelect"),
  account: document.querySelector("#accountSelect"),
  settlementStatus: document.querySelector("#settlementStatusSelect"),
  dueDate: document.querySelector("#dueDateInput"),
  invoiceNumber: document.querySelector("#invoiceNumberInput"),
  major: document.querySelector("#majorSelect"),
  middle: document.querySelector("#middleSelect"),
  minor: document.querySelector("#minorSelect"),
  note: document.querySelector("#noteSelect"),
  noteText: document.querySelector("#noteInput"),
  inventorySync: document.querySelector("#inventorySyncSelect"),
  inventorySyncHint: document.querySelector("#inventorySyncHint"),
  inventoryPicker: document.querySelector("#ledgerInventoryPicker"),
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
let inventoryCache = loadLocalInventoryRecords();
let bankTransactionsCache = loadLocalBankTransactions();
let lineDraftsCache = loadLocalLineDrafts();
let voucherInboxCache = loadLocalVoucherInbox();
let optionsByType = loadOptions();
let lastReportRows = [];
let lastReportSummary = null;
let currentVoucherOcrRecordId = "";
let activeVoucherMatchId = "";
let activeVoucherEditId = "";
let voucherInboxStatusFilter = "open";
let editingRecordId = null;
let editingInventoryId = null;
let recycleBinCache = [];
let auditLogCache = [];

const recycleCollections = [
  { name: "ledgerRecords", label: "流水帳" },
  { name: "bankTransactions", label: "銀行資料" },
  { name: "inventoryRecords", label: "庫存" },
];

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
  settlement: {
    eyebrow: "SETTLEMENT",
    title: "收付款核對",
    subtitle: "處理應收、應付、帳期與後續銀行對帳單核對",
    action: "新增紀錄",
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
setDefaultInventoryDate();
setDefaultReportDates();
setDefaultCashflowDates();
loadCashflowSettings();
loadInventorySettings();
restoreOrder(".sidebar-nav", ".nav-item", "sidebarNavOrder", getNavKey);
restoreOrder(".summary-grid", ".summary-card", "summaryCardOrder", (item) => item.dataset.cardId);
enableDragSort(".sidebar-nav", ".nav-item", ".drag-handle", "sidebarNavOrder", getNavKey);
enableDragSort(".summary-grid", ".summary-card", ".card-drag-handle", "summaryCardOrder", (item) => item.dataset.cardId);
updatePageMeta("overview");
renderAllOptions();
renderOptionsEditor();
updateFormLabels();
renderBatchVoucherList([]);
renderLedgerInventorySync();
renderInventorySources();
renderInventory();
renderPendingCenter();
renderVoucherCenter();
renderSettlementCenter();
renderBankTransactions();

if (isConfigured) {
  initializeFirebase();
} else {
  setupNotice.hidden = false;
  setReportDatesFromRecords(recordsCache);
  setCashflowDatesFromRecords(recordsCache);
  renderRecords(recordsCache);
  updateSummary(recordsCache);
  renderCustomReport();
  renderCashflow();
  renderInventory();
  renderPendingCenter();
  renderVoucherCenter();
  renderSettlementCenter();
  renderBankTransactions();
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
generateCashflowButton.addEventListener("click", renderCashflow);
saveCashflowSettingsButton.addEventListener("click", () => {
  saveCashflowSettings();
  renderCashflow();
  showToast("現金流期初已儲存。");
});

cashflowResult.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-bank-action]");
  if (!button) return;

  const transaction = bankTransactionsCache.find((item) => item.id === button.dataset.bankId);
  if (!transaction) return;

  if (button.dataset.bankAction === "reconcile") {
    await reconcileBankTransaction(transaction);
    return;
  }

  if (button.dataset.bankAction === "unmatch") {
    await unmatchBankTransaction(transaction);
  }
});

saveInventorySettingsButton.addEventListener("click", () => {
  saveInventorySettings();
  renderInventory();
  showToast("庫存期初已儲存。");
});

refreshRecycleBinButton?.addEventListener("click", loadRecycleBinRecords);
refreshAuditLogButton?.addEventListener("click", loadAuditLogs);

recycleBinList?.addEventListener("click", async (event) => {
  const restoreButton = event.target.closest("[data-recycle-restore]");
  if (!restoreButton) return;
  await restoreDeletedRecord(restoreButton.dataset.collection, restoreButton.dataset.recordId);
});

bankImportInput.addEventListener("change", async () => {
  const file = bankImportInput.files?.[0];
  if (!file) return;

  try {
    await importBankFile(file);
  } catch (error) {
    showToast(`銀行匯入失敗：${error.message}`);
  } finally {
    bankImportInput.value = "";
  }
});

bankPhotoInput.addEventListener("change", async () => {
  const files = Array.from(bankPhotoInput.files || []);
  if (!files.length) return;

  try {
    await registerBankPhotos(files);
  } catch (error) {
    showToast(`存摺照片登記失敗：${error.message}`);
  } finally {
    bankPhotoInput.value = "";
  }
});

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

inventoryTypeSelect.addEventListener("change", renderInventorySources);
inventoryQtyInput.addEventListener("input", syncInventoryTotalCost);
inventoryUnitCostInput.addEventListener("input", syncInventoryTotalCost);
clearInventoryButton.addEventListener("click", clearInventoryForm);
inventoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser && isConfigured) {
    showToast("請先登入。");
    return;
  }

  const record = buildInventoryRecord();
  if (!record) return;

  try {
    await saveInventoryRecord(record);
    clearInventoryForm();
    showToast("庫存已儲存。");
  } catch (error) {
    showToast(`庫存儲存失敗：${error.message}`);
  }
});

pendingList.addEventListener("click", async (event) => {
  const lineDraftButton = event.target.closest("[data-line-draft-action]");
  if (lineDraftButton) {
    await handleLineDraftAction(lineDraftButton.dataset.lineDraftAction, lineDraftButton.dataset.draftId);
    return;
  }

  const button = event.target.closest("[data-pending-target]");
  if (!button) return;

  const target = button.dataset.pendingTarget;
  const type = button.dataset.pendingType;

  navigateToViewTarget(target, type, button.dataset.recordId);
});

voucherList?.addEventListener("click", (event) => {
  const matchButton = event.target.closest("[data-voucher-match]");
  if (matchButton) {
    matchVoucherInbox(matchButton.dataset.voucherId);
    return;
  }

  const scanButton = event.target.closest("[data-voucher-scan]");
  if (scanButton) {
    startVoucherOcr(scanButton.dataset.recordId);
    return;
  }

  const button = event.target.closest("[data-pending-target]");
  if (!button) return;

  navigateToViewTarget(button.dataset.pendingTarget, button.dataset.pendingType, button.dataset.recordId);
});

voucherInboxList?.addEventListener("click", (event) => {
  const saveEditButton = event.target.closest("[data-voucher-save-edit]");
  if (saveEditButton) {
    saveVoucherInboxEdit(saveEditButton.dataset.voucherId);
    return;
  }

  const cancelEditButton = event.target.closest("[data-voucher-cancel-edit]");
  if (cancelEditButton) {
    activeVoucherEditId = "";
    renderVoucherCenter();
    return;
  }

  const editButton = event.target.closest("[data-voucher-edit]");
  if (editButton) {
    activeVoucherEditId = activeVoucherEditId === editButton.dataset.voucherId ? "" : editButton.dataset.voucherId;
    activeVoucherMatchId = "";
    renderVoucherCenter();
    return;
  }

  const applyButton = event.target.closest("[data-voucher-apply-match]");
  if (applyButton) {
    applyVoucherMatches(applyButton.dataset.voucherId);
    return;
  }

  const matchButton = event.target.closest("[data-voucher-match]");
  if (matchButton) {
    activeVoucherEditId = "";
    matchVoucherInbox(matchButton.dataset.voucherId);
    return;
  }
});

voucherInboxFilter?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-voucher-filter]");
  if (!button) return;

  voucherInboxStatusFilter = button.dataset.voucherFilter || "open";
  activeVoucherMatchId = "";
  activeVoucherEditId = "";
  renderVoucherInbox();
});

saveVoucherInboxButton?.addEventListener("click", saveVoucherInboxFromForm);

syncDriveVoucherInboxButton?.addEventListener("click", syncDriveVoucherInbox);

importVoucherInboxButton?.addEventListener("click", () => {
  importVoucherInboxInput?.click();
});

importVoucherInboxInput?.addEventListener("change", async () => {
  const file = importVoucherInboxInput.files?.[0];
  if (!file) return;

  try {
    await importVoucherInboxFile(file);
  } catch (error) {
    showToast(`憑證清單匯入失敗：${error.message}`);
  } finally {
    importVoucherInboxInput.value = "";
  }
});

voucherOcrInput?.addEventListener("change", handleVoucherOcrFile);

voucherOcrPanel?.addEventListener("click", async (event) => {
  const closeButton = event.target.closest("[data-voucher-ocr-close]");
  if (closeButton) {
    closeVoucherOcrPanel();
    return;
  }

  const pickLocalButton = event.target.closest("[data-voucher-ocr-pick-local]");
  if (pickLocalButton) {
    voucherOcrInput.value = "";
    voucherOcrInput.click();
    return;
  }

  const applyButton = event.target.closest("[data-apply-invoice-number]");
  if (!applyButton) return;

  await applyScannedInvoiceNumber(applyButton.dataset.applyInvoiceNumber);
});

settlementList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-settlement-action]");
  if (!button) return;

  const record = recordsCache.find((item) => item.id === button.dataset.recordId);
  if (!record) return;

  if (button.dataset.settlementAction === "settle") {
    await settleLedgerRecord(record);
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

fields.inventorySync.addEventListener("change", renderLedgerInventorySync);
fields.minor.addEventListener("change", renderLedgerInventorySync);

voucherInput.addEventListener("change", () => {
  const files = getVoucherFiles();
  voucherPreview.textContent = files.length
    ? `已選擇 ${files.length} 個檔案，發票狀態將自動標記為有`
    : "目前默認：無發票";
  renderBatchVoucherList(files);
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
  fields.invoiceNumber.value = "";
  renderBatchVoucherList([]);
  fields.noteText.hidden = true;
  renderSettlementStatusOptions();
  renderLedgerInventorySync();
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
    return;
  }

  if (button.dataset.recordAction === "match-inventory") {
    await handleInventoryMatch(record, button);
  }
});

bankTransactionList.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("[data-bank-action]");
  if (actionButton) {
    const transaction = bankTransactionsCache.find((item) => item.id === actionButton.dataset.bankId);
    if (!transaction) return;

    if (actionButton.dataset.bankAction === "reconcile") {
      await reconcileBankTransaction(transaction);
      return;
    }

    if (actionButton.dataset.bankAction === "unmatch") {
      await unmatchBankTransaction(transaction);
      return;
    }

    if (actionButton.dataset.bankAction === "edit") {
      await handleEditBankTransaction(transaction);
      return;
    }

    if (actionButton.dataset.bankAction === "delete") {
      await handleDeleteBankTransaction(transaction);
      return;
    }
  }

  const button = event.target.closest("[data-bank-status]");
  if (!button) return;

  const transaction = bankTransactionsCache.find((item) => item.id === button.dataset.bankId);
  if (!transaction) return;

  await updateBankTransactionStatus(transaction, button.dataset.bankStatus);
});

inventoryList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-inventory-action]");
  if (!button) return;

  const record = inventoryCache.find((item) => item.id === button.dataset.inventoryId);
  if (!record) return;

  if (button.dataset.inventoryAction === "edit") {
    startEditingInventoryRecord(record);
    return;
  }

  if (button.dataset.inventoryAction === "delete") {
    await handleDeleteInventoryRecord(record);
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
      if (previousRecord?.settledDate) {
        record.settledDate = previousRecord.settledDate;
        record.settlementStatus = record.type === "income" ? "已收款" : "已付款";
      }
      if (previousRecord && !record.voucherFiles.length && (previousRecord.voucher || previousRecord.vouchers?.length || previousRecord.voucherFileNames?.length)) {
        record.voucher = previousRecord.voucher;
        record.vouchers = previousRecord.vouchers || [];
        record.voucherFileNames = getVoucherNames(previousRecord);
        record.hasVoucher = true;
        record.pendingReason = resolveVoucherPendingReason(record);
      }
      await updateRecord(record);
    } else if (isConfigured) {
      const savedId = await saveRecordToFirebase(record);
      await handleLedgerInventorySync({ id: savedId, ...stripFile(record) });
      await loadRecords();
      await loadInventoryRecords();
    } else {
      const savedRecord = { id: crypto.randomUUID(), ...stripFile(record), createdAt: new Date() };
      recordsCache.unshift(savedRecord);
      saveLocalRecords();
      await handleLedgerInventorySync(savedRecord);
      renderRecords(recordsCache);
      updateSummary(recordsCache);
      renderCustomReport();
      renderCashflow();
      renderPendingCenter();
      renderSettlementCenter();
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

async function handleAuthState(user) {
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

  await loadSharedOptions();
  loadRecords();
  loadInventoryRecords();
  loadBankTransactions();
  loadLineDrafts();
  loadVoucherInbox();
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

function setDefaultCashflowDates() {
  cashflowStartInput.value = reportStartInput.value;
  cashflowEndInput.value = reportEndInput.value;
}

function loadCashflowSettings() {
  const settings = JSON.parse(localStorage.getItem("cashflowSettings") || "{}");
  cashflowOpeningBankInput.value = settings.openingBank ?? "";
  cashflowOpeningCashInput.value = settings.openingCash ?? "";
  cashflowOpeningPlatformInput.value = settings.openingPlatform ?? "";
  cashflowOpeningAdvanceInput.value = settings.openingAdvance ?? "";
}

function saveCashflowSettings() {
  localStorage.setItem(
    "cashflowSettings",
    JSON.stringify({
      openingBank: Number(cashflowOpeningBankInput.value || 0),
      openingCash: Number(cashflowOpeningCashInput.value || 0),
      openingPlatform: Number(cashflowOpeningPlatformInput.value || 0),
      openingAdvance: Number(cashflowOpeningAdvanceInput.value || 0),
    }),
  );
}

function loadInventorySettings() {
  const settings = JSON.parse(localStorage.getItem("inventorySettings") || "{}");
  inventoryOpeningBoxQtyInput.value = settings.openingBoxQty ?? "";
  inventoryOpeningCardQtyInput.value = settings.openingCardQty ?? "";
  inventoryOpeningCostInput.value = settings.openingCost ?? "";
}

function saveInventorySettings() {
  localStorage.setItem(
    "inventorySettings",
    JSON.stringify({
      openingBoxQty: Number(inventoryOpeningBoxQtyInput.value || 0),
      openingCardQty: Number(inventoryOpeningCardQtyInput.value || 0),
      openingCost: Number(inventoryOpeningCostInput.value || 0),
    }),
  );
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
  settlementStatusLabel.textContent = isExpense ? "付款狀態" : "收款狀態";
  dueDateLabel.textContent = isExpense ? "預計付款日" : "預計收款日";
  renderSettlementStatusOptions();
  updateActiveSummaryCard();
  if (currentView === "ledger") updatePageMeta(recordType);
}

function renderSettlementStatusOptions(value = fields.settlementStatus.value) {
  const options = settlementStatuses[recordType];
  fields.settlementStatus.innerHTML = options.map((status) => `<option value="${status}">${status}</option>`).join("");
  fields.settlementStatus.value = options.includes(value) ? value : options[0];
}

function setRecordType(type) {
  recordType = type;
  document.querySelectorAll(".segment").forEach((item) => {
    item.classList.toggle("active", item.dataset.type === type);
  });
  renderAllOptions();
  renderOptionsEditor();
  updateFormLabels();
  renderLedgerInventorySync();
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
  if (view === "cashflow") renderCashflow();
  if (view === "settlement") renderSettlementCenter();
  if (view === "inventory") renderInventory();
  if (view === "pending") renderPendingCenter();
  if (view === "vouchers") renderVoucherCenter();
  if (view === "settings") {
    loadRecycleBinRecords();
    loadAuditLogs();
  }
}

function updatePageMeta(key) {
  const meta = pageMeta[key] || pageMeta.expense;
  pageEyebrow.textContent = meta.eyebrow;
  pageTitle.textContent = meta.title;
  pageSubtitle.textContent = meta.subtitle;
  topActionButton.textContent = meta.action;
}

function navigateToViewTarget(target, type = "", recordId = "") {
  if (target === "ledger") {
    const resolvedType = type || recordsCache.find((item) => item.id === recordId)?.type || recordType;
    setRecordType(resolvedType);
    setActiveNavForType(resolvedType);
  } else {
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.view === target);
    });
  }

  showView(target);
  updatePageMeta(target === "ledger" ? recordType : target);
  highlightRecord(recordId);
}

function highlightRecord(recordId) {
  if (!recordId) return;

  requestAnimationFrame(() => {
    const element = document.querySelector(`[data-record-id="${recordId}"]`);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("highlight");
    window.setTimeout(() => element.classList.remove("highlight"), 2400);
  });
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
  const voucherFiles = getVoucherFiles();
  const voucherFileNames = voucherFiles.map((file) => file.name);
  const dueDate = fields.dueDate.value;
  const invoiceNumber = normalizeInvoiceNumber(fields.invoiceNumber.value);
  const settlementStatus = resolveSettlementStatus(fields.settlementStatus.value, dueDate, "", recordType);

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

  const record = {
    type: recordType,
    date,
    month: date.slice(0, 7).replace("-", ""),
    counterparty: fields.counterparty.value,
    item: fields.item.value.trim(),
    amount,
    invoiceStatus: voucherFiles.length ? "有" : "無",
    invoiceNumber,
    invoiceRequired: recordType === "expense" || Boolean(voucherFiles.length || invoiceNumber),
    cashflow: fields.cashflow.value,
    account: fields.account.value,
    settlementStatus,
    dueDate,
    settledDate: "",
    major: fields.major.value,
    middle: fields.middle.value,
    minor: fields.minor.value,
    note,
    hasVoucher: Boolean(voucherFiles.length),
    pendingReason: "",
    voucherFiles,
    voucherFileNames,
    voucherBatchStatus: voucherFiles.length > 1 ? "待配對" : "",
  };

  record.pendingReason = resolveVoucherPendingReason(record);
  return record;
}

function resolveSettlementStatus(status, dueDate, settledDate, type) {
  if (settledDate) return type === "income" ? "已收款" : "已付款";
  if (dueDate && status === "已收款") return "待收款";
  if (dueDate && status === "已付款") return "待付款";
  return status;
}

function getVoucherFiles() {
  return Array.from(voucherInput.files || []);
}

function buildVoucherMetadata(files = []) {
  return Array.from(files).map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    status: "待配對",
    storage: "pending-google-drive",
  }));
}

function renderBatchVoucherList(files) {
  if (!batchVoucherList) return;

  if (!files.length) {
    batchVoucherList.innerHTML = `<li>尚未選擇批次檔案</li>`;
    return;
  }

  batchVoucherList.innerHTML = files
    .map((file) => `<li><strong>${escapeHtml(file.name)}</strong><span>${formatBytes(file.size)}</span></li>`)
    .join("");
}

function getVoucherNames(record) {
  if (record.voucherFileNames?.length) return record.voucherFileNames;
  if (record.vouchers?.length) return record.vouchers.map((file) => file.name).filter(Boolean);
  if (record.voucher?.name) return [record.voucher.name];
  if (record.voucherFileName) return [record.voucherFileName];
  return [];
}

function getVoucherLinks(record) {
  const links = [];
  if (Array.isArray(record.voucherLinks)) links.push(...record.voucherLinks);
  if (Array.isArray(record.vouchers)) links.push(...record.vouchers.map((file) => file.url || file.webViewLink));
  if (Array.isArray(record.voucherFiles)) links.push(...record.voucherFiles.map((file) => file.url || file.webViewLink));
  if (record.voucher?.url) links.push(record.voucher.url);
  if (record.voucher?.webViewLink) links.push(record.voucher.webViewLink);
  return links.filter(Boolean);
}

function getVoucherFileRefs(record) {
  const refs = [];
  const addRef = (file, index = refs.length) => {
    if (!file) return;
    const url = file.url || file.webViewLink || file.link || "";
    const id = file.id || extractDriveFileId(url);
    if (!id && !url) return;
    refs.push({
      id,
      url,
      name: file.name || file.originalName || `憑證 ${index + 1}`,
      mimeType: file.mimeType || "",
    });
  };

  if (Array.isArray(record.vouchers)) record.vouchers.forEach(addRef);
  if (Array.isArray(record.voucherFiles)) record.voucherFiles.forEach(addRef);
  if (record.voucher) addRef(record.voucher);
  if (Array.isArray(record.voucherLinks)) {
    record.voucherLinks.forEach((url, index) => addRef({ url, name: getVoucherNames(record)[index] || `憑證 ${index + 1}` }, index));
  }

  const seen = new Set();
  return refs.filter((ref) => {
    const key = ref.id || ref.url;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractDriveFileId(url) {
  const value = String(url || "");
  return (
    value.match(/\/file\/d\/([^/?#]+)/)?.[1] ||
    value.match(/[?&]id=([^&#]+)/)?.[1] ||
    ""
  );
}

function normalizeInvoiceNumber(value) {
  return String(value || "").trim().toUpperCase();
}

function hasAttachedVoucher(record) {
  return Boolean(
    getVoucherLinks(record).length ||
      getVoucherNames(record).length ||
      record.voucherFiles?.length ||
      record.hasVoucher ||
      record.voucher,
  );
}

function recordNeedsVoucher(record) {
  return Boolean(
    record.invoiceRequired === true ||
      record.type === "expense" ||
      record.invoiceStatus === "有" ||
      hasAttachedVoucher(record) ||
      /發票|收據|憑證/.test(record.pendingReason || ""),
  );
}

function resolveVoucherPendingReason(record) {
  if (!recordNeedsVoucher(record)) return record.pendingReason || "";
  if (!hasAttachedVoucher(record)) return "待補憑證";
  if (!normalizeInvoiceNumber(record.invoiceNumber)) return "待補發票號碼";
  if (record.pendingReason && !/發票|收據|憑證/.test(record.pendingReason)) return record.pendingReason;
  return "";
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
  await softDeleteRecord("ledgerRecords", record.id, record);
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
  renderCashflow();
  renderPendingCenter();
  renderSettlementCenter();
  showToast("紀錄已刪除。");
}

async function updateRecord(record) {
  const newVoucherMetadata = buildVoucherMetadata(record.voucherFiles);
  const existingVoucherNames = getVoucherNames(record);
  const cleanedRecord = {
    ...stripFile(record),
    voucher: record.voucher || newVoucherMetadata[0] || null,
    vouchers: newVoucherMetadata.length ? newVoucherMetadata : record.vouchers || [],
    voucherFileNames: newVoucherMetadata.length ? newVoucherMetadata.map((file) => file.name) : existingVoucherNames,
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  };

  const previousRecord = recordsCache.find((item) => item.id === editingRecordId);
  await writeAuditLog("update", "ledgerRecords", editingRecordId, previousRecord, cleanedRecord);

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
  renderCashflow();
  renderPendingCenter();
  renderSettlementCenter();
}

async function updateLedgerRecordFields(previousRecord, updatedRecord) {
  const cleanedRecord = {
    ...stripFile(updatedRecord),
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  };

  await writeAuditLog("update", "ledgerRecords", previousRecord.id, previousRecord, cleanedRecord);

  if (isConfigured) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, "ledgerRecords", previousRecord.id), cleanedRecord);
    await loadRecords();
  } else {
    recordsCache = recordsCache.map((item) => (item.id === previousRecord.id ? { ...item, ...cleanedRecord } : item));
    saveLocalRecords();
    renderRecords(recordsCache);
    updateSummary(recordsCache);
  }

  renderCustomReport();
  renderCashflow();
  renderPendingCenter();
  renderSettlementCenter();
  renderVoucherCenter();
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
  renderSettlementStatusOptions(record.settlementStatus);
  fields.dueDate.value = record.dueDate || "";
  fields.invoiceNumber.value = record.invoiceNumber || "";
  ensureSelectValue(fields.major, record.major);
  ensureSelectValue(fields.middle, record.middle);
  ensureSelectValue(fields.minor, record.minor);
  setNoteValue(record.note);
  voucherInput.value = "";
  renderBatchVoucherList([]);
  voucherPreview.textContent = getVoucherNames(record).length
    ? `目前憑證：${getVoucherNames(record).join("、")}`
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
  const voucher = buildVoucherMetadata(record.voucherFiles);

  const docRef = await firebaseApi.addDoc(firebaseApi.collection(db, "ledgerRecords"), {
    ...stripFile(record),
    voucher,
    createdAt: firebaseApi.serverTimestamp(),
    createdBy: currentUser.email,
    updatedAt: firebaseApi.serverTimestamp(),
    userId: currentUser.uid,
  });
  return docRef.id;
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

async function loadLineDrafts() {
  if (!isConfigured || !currentUser || !db) {
    renderPendingCenter();
    return;
  }

  const snapshot = await firebaseApi.getDocs(
    firebaseApi.query(
      firebaseApi.collection(db, "lineDrafts"),
      firebaseApi.limit(100),
    ),
  );

  lineDraftsCache = snapshot.docs
    .map((doc) => normalizeLineDraft({ id: doc.id, ...doc.data() }))
    .filter((draft) => {
      const belongsToCurrentUser = !draft.userId || draft.userId === currentUser.uid;
      return belongsToCurrentUser && !draft.deletedAt && !["confirmed", "ignored"].includes(draft.status);
    })
    .sort((a, b) => getRecordTimeValue(b) - getRecordTimeValue(a));
  renderPendingCenter();
  renderVoucherCenter();
}

function normalizeLineDraft(draft) {
  const normalized = {};

  Object.entries(draft || {}).forEach(([key, value]) => {
    const cleanKey = String(key).replace(/\u00a0/g, " ").trim();
    normalized[cleanKey] = value;
  });

  return {
    ...normalized,
    amount: Number(normalized.amount || 0),
    type: normalized.type === "income" ? "income" : "expense",
    item: normalized.item || normalized.product || normalized.description || "",
    counterparty: normalized.counterparty || normalized.vendor || normalized.customer || "",
    cashflow: normalized.cashflow || normalized.paymentMethod || "",
    account: normalized.account || normalized.bankAccount || "",
    major: normalized.major || normalized.category || "",
    middle: normalized.middle || normalized.subcategory || "",
    minor: normalized.minor || normalized.detail || "",
    needsReview: normalized.needsReview === true || normalized.needsReview === "true",
  };
}

async function handleLineDraftAction(action, draftId) {
  const draft = lineDraftsCache.find((item) => item.id === draftId);
  if (!draft) {
    showToast("找不到 LINE 草稿。");
    return;
  }

  if (action === "confirm") {
    await confirmLineDraft(draft);
    return;
  }

  if (action === "ignore") {
    await updateLineDraftStatus(draft, "ignored");
    showToast("LINE 草稿已略過。");
  }
}

async function confirmLineDraft(draft) {
  syncLineDraftOptions(draft);
  const record = buildRecordFromLineDraft(draft);
  if (!record) return;

  const cleanRecord = stripFile(record);

  if (isConfigured) {
    await firebaseApi.addDoc(firebaseApi.collection(db, "ledgerRecords"), {
      ...cleanRecord,
      voucher: buildLineDraftVoucherMetadata(draft),
      createdAt: firebaseApi.serverTimestamp(),
      createdBy: currentUser.email,
      updatedAt: firebaseApi.serverTimestamp(),
      userId: currentUser.uid,
    });
    await updateLineDraftStatus(draft, "confirmed");
    await loadRecords();
    await loadLineDrafts();
    showToast("LINE 草稿已確認入帳。");
    return;
  }

  recordsCache.unshift({ id: crypto.randomUUID(), ...cleanRecord, createdAt: new Date() });
  saveLocalRecords();
  await updateLineDraftStatus(draft, "confirmed");
  renderRecords(recordsCache);
  updateSummary(recordsCache);
  renderPendingCenter();
  showToast("LINE 草稿已確認入帳。");
}

function syncLineDraftOptions(draft) {
  const type = draft.type === "income" ? "income" : "expense";
  const optionMap = {
    counterparty: "counterparties",
    cashflow: "cashflows",
    account: "accounts",
    major: "majors",
    middle: "middles",
    minor: "minors",
  };

  let changed = false;
  Object.entries(optionMap).forEach(([draftKey, optionKey]) => {
    const value = String(draft[draftKey] || "").trim();
    if (!value) return;
    const current = optionsByType[type][optionKey] || [];
    if (current.includes(value)) return;
    optionsByType[type][optionKey] = normalizeOptions([...current, value], defaultOptionsByType[type][optionKey]);
    changed = true;
  });

  if (draft.note) {
    const note = String(draft.note).trim();
    const currentNotes = optionsByType[type].notes || [];
    if (note && !currentNotes.includes(note)) {
      optionsByType[type].notes = normalizeOptions([...currentNotes, note], defaultOptionsByType[type].notes);
      changed = true;
    }
  }

  if (changed) {
    saveOptions();
    renderAllOptions();
    renderOptionsEditor();
  }
}

function buildRecordFromLineDraft(draft) {
  const type = draft.type === "income" ? "income" : "expense";
  const options = optionsByType[type] || defaultOptionsByType[type];
  const date = draft.date || toDateValue(new Date());
  const amount = Number(draft.amount || 0);
  const item = getLineDraftItem(draft);

  if (!amount || amount <= 0) {
    showToast("LINE 草稿缺少金額，請先回 LINE 或之後 ERP 編輯草稿。");
    return null;
  }

  if (!item) {
    showToast("LINE 草稿缺少項目，請先補上項目。");
    return null;
  }

  const dueDate = draft.dueDate || "";
  const settlementStatus = resolveSettlementStatus(
    draft.settlementStatus || (type === "income" ? "已收款" : "已付款"),
    dueDate,
    "",
    type,
  );

  const voucherLinks = Array.isArray(draft.voucherLinks) ? draft.voucherLinks.filter(Boolean) : [];
  const voucherMetadata = buildLineDraftVoucherMetadata(draft);
  const invoiceNumber = normalizeInvoiceNumber(draft.invoiceNumber);

  const record = {
    type,
    date,
    month: date.slice(0, 7).replace("-", ""),
    counterparty: draft.counterparty || options.counterparties?.[0] || "LINE",
    item,
    amount,
    invoiceStatus: voucherLinks.length ? "有" : "無",
    invoiceNumber,
    invoiceRequired: type === "expense" || Boolean(voucherLinks.length || invoiceNumber),
    cashflow: draft.cashflow || options.cashflows?.[0] || "",
    account: draft.account || options.accounts?.[0] || "",
    settlementStatus,
    dueDate,
    settledDate: "",
    major: draft.major || options.majors?.[0] || "",
    middle: draft.middle || options.middles?.[0] || "",
    minor: draft.minor || options.minors?.[0] || "",
    note: draft.note || "LINE 草稿匯入",
    hasVoucher: Boolean(voucherLinks.length),
    pendingReason: "",
    voucherLinks,
    vouchers: voucherMetadata,
    voucherFiles: voucherMetadata,
    voucherFileNames: voucherLinks.map((_, index) => `LINE 憑證 ${index + 1}`),
    voucherBatchStatus: voucherLinks.length > 1 ? "LINE 多筆憑證" : "",
    source: "line",
    importSource: "LINE Bot 草稿",
    lineDraftId: draft.id,
    lineDraftRaw: draft,
  };

  record.pendingReason = resolveVoucherPendingReason(record);
  return record;
}

function getLineDraftItem(draft) {
  return String(
    draft.item ||
      draft.description ||
      draft.minor ||
      draft.middle ||
      draft.major ||
      (draft.type === "income" ? "LINE收入草稿" : "LINE支出草稿"),
  ).trim();
}

function buildLineDraftVoucherMetadata(draft) {
  const links = Array.isArray(draft.voucherLinks) ? draft.voucherLinks.filter(Boolean) : [];
  const files = Array.isArray(draft.voucherFiles) ? draft.voucherFiles : [];
  return links.map((url, index) => ({
    id: files[index]?.id || extractDriveFileId(url),
    name: draft.voucherFileNames?.[index] || `LINE 憑證 ${index + 1}`,
    originalName: files[index]?.originalName || "",
    mimeType: files[index]?.mimeType || "",
    url,
    webViewLink: files[index]?.webViewLink || url,
    status: "google-drive-link",
    storage: "google-drive",
  }));
}

async function updateLineDraftStatus(draft, status) {
  const updates = {
    status,
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
    reviewedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
    reviewedBy: currentUser?.email || "local-preview",
  };

  if (isConfigured) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, "lineDrafts", draft.id), updates);
    await loadLineDrafts();
    return;
  }

  lineDraftsCache = lineDraftsCache.map((item) => (item.id === draft.id ? { ...item, ...updates } : item));
  saveLocalLineDrafts();
  renderPendingCenter();
}

async function handleLedgerInventorySync(record) {
  if (fields.inventorySync.value !== "yes") return;

  if (record.type === "expense") {
    await createInventoryInFromExpense(record);
    return;
  }

  if (record.type === "income") {
    await createInventoryOutFromIncome(record);
  }
}

async function createInventoryInFromExpense(record) {
  const quantityText = window.prompt(`請輸入「${record.minor || record.item}」入庫數量`, "1");
  if (quantityText === null) return;
  const quantity = Number(quantityText || 0);
  if (!quantity || quantity <= 0) {
    showToast("入庫數量必須大於 0。");
    return;
  }

  const inventoryRecord = {
    date: record.date,
    month: record.month,
    type: inferInventoryTypeFromText(`${record.minor} ${record.item}`),
    action: "in",
    source: "支出同步入庫",
    name: record.minor || record.item,
    quantity,
    unitCost: Number(record.amount || 0) / quantity,
    totalCost: Number(record.amount || 0),
    reference: `支出：${record.item}`,
    note: `由支出紀錄同步入庫；交易對象：${record.counterparty}`,
    linkedLedgerId: record.id,
  };

  await addInventoryRecord(inventoryRecord);
}

async function createInventoryOutFromIncome(record) {
  const selected = getSelectedLedgerInventoryLots();
  if (!selected.length) {
    showToast("已選擇同步出庫，但尚未選取庫存。");
    return;
  }

  if (selected.some((item) => item.quantity <= 0 || item.quantity > item.lot.remainingQuantity)) {
    showToast("出庫數量必須大於 0，且不可超過可用庫存。");
    return;
  }

  const links = [];
  for (const item of selected) {
    const unitCost = Number(item.lot.unitCost || item.lot.totalCost / item.lot.quantity || 0);
    const outRecord = {
      date: record.date,
      month: record.month,
      type: item.lot.type,
      action: "out",
      source: "銷售出庫",
      name: item.lot.name,
      quantity: item.quantity,
      unitCost,
      totalCost: unitCost * item.quantity,
      reference: `收入：${record.item}`,
      note: `由收入紀錄同步出庫；來源庫存：${item.lot.source}`,
      linkedLedgerId: record.id,
      sourceInventoryId: item.lot.id,
    };
    const savedId = await addInventoryRecord(outRecord);
    links.push({
      inventoryRecordId: savedId,
      sourceInventoryId: item.lot.id,
      name: item.lot.name,
      type: item.lot.type,
      quantity: item.quantity,
      unitCost,
      totalCost: unitCost * item.quantity,
    });
  }

  await updateLedgerInventoryLinks(record, links);
}

function inferInventoryTypeFromText(text) {
  if (/包材|紙箱|氣泡|膠帶|耗材|信封|保護殼|卡磚|卡夾/.test(text)) return "supply";
  if (/卡片|單卡|球員卡/.test(text)) return "card";
  return "box";
}

function getSelectedLedgerInventoryLots() {
  if (fields.inventorySync.value !== "yes" || recordType !== "income") return [];
  const availableLots = getAvailableInventoryLots();
  return Array.from(fields.inventoryPicker.querySelectorAll("[data-ledger-inventory-id]:checked")).map((checkbox) => {
    const lot = availableLots.find((item) => item.id === checkbox.dataset.ledgerInventoryId);
    const qtyInput = fields.inventoryPicker.querySelector(`[data-ledger-inventory-qty="${CSS.escape(checkbox.dataset.ledgerInventoryId)}"]`);
    return { lot, quantity: Number(qtyInput?.value || 0) };
  }).filter((item) => item.lot);
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
    setCashflowDatesFromRecords(recordsCache);
    renderRecords(recordsCache);
    updateSummary(recordsCache);
    renderCustomReport();
    renderCashflow();
    renderPendingCenter();
    renderSettlementCenter();
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
  const invoiceNumber = normalizeInvoiceNumber(pickValue(row, ["發票號碼", "憑證號碼", "invoiceNumber"]));
  const invoiceFileName = String(pickValue(row, ["發票檔名", "憑證檔名", "收據檔名"]) || "").trim();
  const shouldRequireVoucher = type === "expense" || Boolean(invoiceRaw) || Boolean(invoiceFileName) || Boolean(invoiceNumber);
  const productCost = parseAmount(pickValue(row, ["商品成本", "銷貨成本"]));
  const logisticsCost = parseAmount(pickValue(row, ["金流／物流成本", "金流/物流成本", "物流成本", "金流成本"]));
  const logisticsIncome = parseAmount(pickValue(row, ["金流／物流收入", "金流/物流收入", "物流收入", "金流收入"]));
  const extraExpense = parseAmount(pickValue(row, ["額外費用", "其他費用"]));
  const refundAmount = parseAmount(pickValue(row, ["退貨金額", "退款金額"]));
  const netSales = parseAmount(pickValue(row, ["淨銷售額", "淨銷售", "淨收入"]));
  const dueDate = normalizeImportDate(pickValue(row, ["預計收付款日", "預計付款日", "預計收款日", "到期日", "帳期日", "dueDate"])) || "";
  const settledDate = normalizeImportDate(pickValue(row, ["實際收付款日", "實際付款日", "實際收款日", "settledDate"])) || "";
  const settlementStatus = resolveSettlementStatus(
    normalizeSettlementStatus(pickValue(row, ["收付款狀態", "付款狀態", "收款狀態", "狀態", "settlementStatus"]), type),
    dueDate,
    settledDate,
    type,
  );

  if (!date || !amount || !item) {
    return null;
  }

  const record = {
    type,
    date,
    month: date.slice(0, 7).replace("-", ""),
    counterparty,
    item,
    amount: Math.abs(amount),
    invoiceStatus,
    invoiceNumber,
    invoiceRequired: shouldRequireVoucher,
    cashflow: String(pickValue(row, ["金流方式", "付款方式", "收款方式", "支出方式", "收入方式", "cashflow"]) || inferImportCashflow(row, type)).trim(),
    account: String(pickValue(row, ["帳戶", "支出帳戶", "收款帳戶", "account"]) || inferImportAccount(type)).trim(),
    settlementStatus,
    dueDate,
    settledDate,
    major: String(pickValue(row, ["大類", "major"]) || inferImportMajor(type)).trim(),
    middle: String(pickValue(row, ["中類", "middle"]) || inferImportMiddle(row, type)).trim(),
    minor: String(pickValue(row, ["細項", "minor"]) || inferImportMinor(row, type)).trim(),
    note: String(pickValue(row, ["備註", "note"]) || `Excel 匯入列 ${sourceRow}`).trim(),
    hasVoucher: invoiceStatus === "有" || Boolean(invoiceFileName),
    pendingReason: "",
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

  record.pendingReason = resolveVoucherPendingReason(record);
  return record;
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

function parseSignedAmount(value) {
  const text = String(value || "").trim();
  if (!text) return 0;
  const isParenthesesNegative = /^\(.*\)$/.test(text);
  const amount = Number(text.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(amount)) return 0;
  return isParenthesesNegative ? -Math.abs(amount) : amount;
}

function normalizeInvoiceStatus(value) {
  const text = String(value || "").trim();
  if (["是", "有", "yes", "y", "true"].includes(text.toLowerCase())) return "有";
  return "無";
}

function normalizeSettlementStatus(value, type) {
  const text = String(value || "").trim();
  const options = settlementStatuses[type] || settlementStatuses.expense;
  if (!text) return type === "income" ? "已收款" : "已付款";
  if (options.includes(text)) return text;
  if (/已收|收訖|入帳/.test(text)) return "已收款";
  if (/待撥/.test(text)) return "平台待撥";
  if (/未收|待收|應收/.test(text)) return "待收款";
  if (/已付|付訖|付款完成/.test(text)) return "已付款";
  if (/信用卡|刷卡|未請款/.test(text)) return "信用卡未請款";
  if (/月結/.test(text)) return type === "income" ? "月結未收" : "月結未付";
  if (/未付|待付|應付/.test(text)) return "待付款";
  return type === "income" ? "待收款" : "待付款";
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
    .filter((record) => !record.deletedAt)
    .sort(compareRecordsByDateAndCreatedTime);
  setReportDatesFromRecords(recordsCache);
  setCashflowDatesFromRecords(recordsCache);
  renderRecords(recordsCache);
  updateSummary(recordsCache);
  if (document.querySelector("#reportsView")?.classList.contains("active")) {
    renderCustomReport();
  }
  if (document.querySelector("#cashflowView")?.classList.contains("active")) {
    renderCashflow();
  }
  renderPendingCenter();
  renderVoucherCenter();
  renderSettlementCenter();
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
  const soldCost = buildSoldCostSummary(records);
  const salesIncome = soldCost.salesIncome;
  const productCost = soldCost.productCost;
  const bankDirectCost = sumBankSalesDirectCosts(start, end);
  const logisticsCost = soldCost.logisticsCost + bankDirectCost;
  const packagingCost = soldCost.packagingCost;
  const costOfGoodsSold = productCost + logisticsCost + packagingCost;
  const pending = records.filter((record) => record.pendingReason).length;
  const grossProfit = salesIncome - productCost - logisticsCost - packagingCost;
  const operatingExpense = sumOperatingExpense(records);
  const net = grossProfit - operatingExpense;
  const grossMargin = salesIncome ? grossProfit / salesIncome : null;
  const netMargin = salesIncome ? net / salesIncome : null;
  const breakdown = buildCategoryBreakdown(records);
  lastReportRows = records;
  lastReportSummary = {
    start,
    end,
    income,
    salesIncome,
    expense,
    productCost,
    logisticsCost,
    packagingCost,
    costOfGoodsSold,
    bankDirectCost,
    grossProfit,
    grossMargin,
    otherExpense: operatingExpense,
    operatingExpense,
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
        <span>銷售收入</span>
        <strong>NT$ ${formatNumber(salesIncome)}</strong>
      </article>
      <article class="report-summary-card">
        <span>銷貨成本</span>
        <strong>NT$ ${formatNumber(costOfGoodsSold)}</strong>
      </article>
      <article class="report-summary-card">
        <span>營業費用</span>
        <strong>NT$ ${formatNumber(operatingExpense)}</strong>
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
        <span>營業損益</span>
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

function renderCashflow() {
  const start = cashflowStartInput.value;
  const end = cashflowEndInput.value;

  if (!start || !end) {
    cashflowResult.innerHTML = `<div class="empty-state">請先選擇起始日期與結束日期。</div>`;
    return;
  }

  if (start > end) {
    cashflowResult.innerHTML = `<div class="empty-state">起始日期不可晚於結束日期。</div>`;
    return;
  }

  const records = recordsCache.filter((record) => record.date >= start && record.date <= end);
  const bankTransactions = bankTransactionsCache.filter((transaction) => transaction.date >= start && transaction.date <= end);
  const summary = buildCashflowSummary(records, {
    openingBank: Number(cashflowOpeningBankInput.value || 0),
    openingCash: Number(cashflowOpeningCashInput.value || 0),
    openingPlatform: Number(cashflowOpeningPlatformInput.value || 0),
    openingAdvance: Number(cashflowOpeningAdvanceInput.value || 0),
  }, bankTransactions);

  cashflowResult.innerHTML = `
    <div class="cashflow-summary-grid">
      ${renderCashflowCard("公司現金流入", summary.cashIn, "income")}
      ${renderCashflowCard("公司現金流出", summary.cashOut, "expense")}
      ${renderCashflowCard("期末可用現金", summary.endingCash, "balance")}
      ${renderCashflowCard("平台待撥款", summary.platformPending, "pending")}
      ${renderCashflowCard("股東代墊餘額", summary.shareholderAdvance, "advance")}
      ${renderCashflowCard("已還代墊", summary.shareholderRepayment, "expense")}
      ${renderCashflowCard("銀行未正式配帳", summary.bankUnmatchedCount, "count", "筆")}
    </div>

    <div class="cashflow-breakdown">
      <section>
        <h3>帳戶小計</h3>
        ${summary.accountRows.length ? summary.accountRows.map(renderCashflowAccountRow).join("") : `<div class="record-group-empty">尚無帳戶資料</div>`}
      </section>
      <section>
        <h3>銀行核對表</h3>
        ${renderBankReconciliationReport(bankTransactions)}
      </section>
      <section>
        <h3>銀行核對異常</h3>
        ${renderBankReconciliationIssues(records, bankTransactions)}
      </section>
      <section>
        <h3>現金流明細</h3>
        ${summary.flowRows.length ? summary.flowRows.map(renderCashflowFlowRow).join("") : `<div class="record-group-empty">此區間尚無現金流資料</div>`}
      </section>
    </div>
  `;
}

function buildCashflowSummary(records, opening, bankTransactions = []) {
  const accountTotals = new Map();
  const flowRows = [];
  let cashIn = 0;
  let cashOut = 0;
  let platformPending = Number(opening.openingPlatform || 0);
  let shareholderAdvance = Number(opening.openingAdvance || 0);
  let shareholderRepayment = 0;
  let reconcileCount = 0;

  records.forEach((record) => {
    const amount = Number(record.amount || 0);
    const bucket = classifyCashflowRecord(record);
    const account = record.account || "未指定帳戶";
    const current = accountTotals.get(account) || { account, cashIn: 0, cashOut: 0, pending: 0, advance: 0 };

    if (bucket === "cashIn") {
      cashIn += amount;
      current.cashIn += amount;
    } else if (bucket === "cashOut") {
      cashOut += amount;
      current.cashOut += amount;
    } else if (bucket === "platformPending") {
      platformPending += amount;
      current.pending += amount;
    } else if (bucket === "shareholderAdvance") {
      shareholderAdvance += amount;
      current.advance += amount;
    } else if (bucket === "shareholderRepayment") {
      const advanceAccount = "股東代墊";
      const advanceCurrent = accountTotals.get(advanceAccount) || { account: advanceAccount, cashIn: 0, cashOut: 0, pending: 0, advance: 0 };
      cashOut += amount;
      shareholderRepayment += amount;
      shareholderAdvance -= amount;
      current.cashOut += amount;
      advanceCurrent.advance -= amount;
      accountTotals.set(advanceAccount, advanceCurrent);
    }

    if (bucket === "cashIn" || bucket === "cashOut" || bucket === "shareholderRepayment") reconcileCount += 1;
    accountTotals.set(account, current);
    flowRows.push({ ...record, bucket, amount });
  });

  bankTransactions.forEach((transaction) => {
    if (isBankTransactionFormallyMatched(transaction)) return;
    if (transaction.status !== "已配代墊還款") return;

    const amount = Number(transaction.withdrawal || transaction.deposit || 0);
    if (!amount) return;

    const account = transaction.account || "未指定帳戶";
    const current = accountTotals.get(account) || { account, cashIn: 0, cashOut: 0, pending: 0, advance: 0 };
    const advanceAccount = "股東代墊";
    const advanceCurrent = accountTotals.get(advanceAccount) || { account: advanceAccount, cashIn: 0, cashOut: 0, pending: 0, advance: 0 };
    cashOut += amount;
    shareholderRepayment += amount;
    shareholderAdvance -= amount;
    current.cashOut += amount;
    advanceCurrent.advance -= amount;
    accountTotals.set(account, current);
    accountTotals.set(advanceAccount, advanceCurrent);
    flowRows.push({
      date: transaction.date,
      item: transaction.description || transaction.sourceFile || "代墊還款",
      account,
      type: "expense",
      bucket: "shareholderRepayment",
      amount,
    });
  });

  return {
    cashIn,
    cashOut,
    platformPending,
    shareholderAdvance,
    shareholderRepayment,
    endingCash: Number(opening.openingBank || 0) + Number(opening.openingCash || 0) + cashIn - cashOut,
    reconcileCount,
    bankUnmatchedCount: bankTransactions.filter((transaction) =>
      !isBankTransactionFormallyMatched(transaction) && transaction.status !== "不入帳",
    ).length,
    accountRows: Array.from(accountTotals.values()).sort((a, b) => a.account.localeCompare(b.account, "zh-Hant")),
    flowRows,
  };
}

function classifyCashflowRecord(record) {
  const text = `${record.cashflow || ""} ${record.account || ""} ${record.note || ""} ${record.item || ""}`;
  if (record.settlementStatus === "平台待撥") return "platformPending";
  if (record.settlementStatus === "股東代墊未沖") return "shareholderAdvance";
  if (record.type === "expense" && /張晟睿.*墊付|張晟睿.*代墊|墊付款|償還代墊|代墊款/.test(text)) return "shareholderRepayment";
  if (record.type === "expense" && /信用卡|刷卡|股東代墊|代墊/.test(text)) return "shareholderAdvance";
  if (record.settlementStatus === "已收款") return "cashIn";
  if (record.settlementStatus === "已付款") return "cashOut";
  if (record.type === "income" && /平台|待撥/.test(text)) return "platformPending";
  return record.type === "income" ? "cashIn" : "cashOut";
}

function renderCashflowCard(title, value, tone, unit = "NT$") {
  const display = unit === "NT$" ? `NT$ ${formatNumber(value)}` : `${formatNumber(value)} ${unit}`;
  return `
    <article class="cashflow-card ${tone}">
      <span>${escapeHtml(title)}</span>
      <strong>${display}</strong>
    </article>
  `;
}

function renderCashflowAccountRow(row) {
  const net = row.cashIn - row.cashOut;
  const isAdvanceAccount = /股東|代墊/.test(row.account);
  const endingLabel = isAdvanceAccount ? "待沖銷" : "淨額";
  const endingAmount = isAdvanceAccount ? row.advance : net;
  return `
    <article class="cashflow-row">
      <strong>${escapeHtml(row.account)}</strong>
      <span>流入 NT$ ${formatNumber(row.cashIn)}</span>
      <span>流出 NT$ ${formatNumber(row.cashOut)}</span>
      <span>待撥 NT$ ${formatNumber(row.pending)}</span>
      <span>代墊 NT$ ${formatNumber(row.advance)}</span>
      <strong>${endingLabel} NT$ ${formatNumber(endingAmount)}</strong>
    </article>
  `;
}

function renderCashflowFlowRow(record) {
  const bucketLabel = {
    cashIn: "公司流入",
    cashOut: "公司流出",
    platformPending: "平台待撥",
    shareholderAdvance: "股東代墊",
    shareholderRepayment: "償還代墊",
  }[record.bucket];
  const sign = record.type === "income" ? "+" : "-";

  return `
    <article class="cashflow-row detail">
      <strong>${escapeHtml(record.date)}</strong>
      <span>${escapeHtml(bucketLabel)}</span>
      <span>${escapeHtml(record.item || "")}</span>
      <span>${escapeHtml(record.account || "")}</span>
      <strong>${sign} NT$ ${formatNumber(record.amount)}</strong>
    </article>
  `;
}

function renderBankReconciliationReport(transactions) {
  if (!transactions.length) {
    return `<div class="record-group-empty">此區間尚無銀行資料。</div>`;
  }

  const matched = transactions.filter(isBankTransactionFormallyMatched);
  const classified = transactions.filter(isBankTransactionClassified);
  const ignored = transactions.filter((transaction) => transaction.status === "不入帳");
  const unmatched = transactions.filter((transaction) =>
    !isBankTransactionFormallyMatched(transaction)
    && !isBankTransactionClassified(transaction)
    && transaction.status !== "不入帳"
  );

  return `
    <div class="bank-reconcile-summary">
      <article>
        <span>正式配帳務</span>
        <strong>${formatNumber(matched.length)} 筆</strong>
      </article>
      <article>
        <span>已分類未配帳務</span>
        <strong>${formatNumber(classified.length)} 筆</strong>
      </article>
      <article>
        <span>未配對</span>
        <strong>${formatNumber(unmatched.length)} 筆</strong>
      </article>
      <article>
        <span>不入帳</span>
        <strong>${formatNumber(ignored.length)} 筆</strong>
      </article>
    </div>
    <div class="bank-reconcile-columns">
      ${renderBankReconciliationGroup("正式配帳務", matched, "matched")}
      ${renderBankReconciliationGroup("已分類未配帳務", classified, "classified")}
      ${renderBankReconciliationGroup("未配對", unmatched, "unmatched")}
      ${renderBankReconciliationGroup("不入帳", ignored, "ignored")}
    </div>
  `;
}

function isBankTransactionFormallyMatched(transaction) {
  return getMatchedLedgerIds(transaction).length > 0;
}

function isBankTransactionClassified(transaction) {
  return !isBankTransactionFormallyMatched(transaction)
    && ["已配收入", "已配支出", "已配平台撥款", "已配代墊還款"].includes(transaction.status);
}

function getMatchedLedgerIds(transaction) {
  if (Array.isArray(transaction.matchedLedgerIds) && transaction.matchedLedgerIds.length) {
    return transaction.matchedLedgerIds.filter(Boolean);
  }
  return transaction.matchedLedgerId ? [transaction.matchedLedgerId] : [];
}

function renderBankReconciliationGroup(title, transactions, tone) {
  return `
    <section class="bank-reconcile-group ${tone}">
      <h4>${title}</h4>
      ${
        transactions.length
          ? transactions.map(renderBankReconciliationItem).join("")
          : `<div class="record-group-empty">目前沒有資料</div>`
      }
    </section>
  `;
}

function renderBankReconciliationItem(transaction) {
  const amount = Number(transaction.deposit || 0) || Number(transaction.withdrawal || 0);
  const sign = Number(transaction.deposit || 0) ? "+" : "-";
  const ledgerText = transaction.matchedLedgerItem
    ? `配對帳務：${transaction.matchedLedgerItem}`
    : transaction.matchedLedgerId
      ? "配對帳務：已配帳務"
      : isBankTransactionClassified(transaction)
        ? `${transaction.status}，尚未配帳務`
        : "尚未選擇帳務";
  const differenceText = transaction.matchDifference
    ? `差額：NT$ ${formatNumber(transaction.matchDifference)} · ${transaction.differenceHandling || "待確認"}`
    : "";

  return `
    <article class="bank-reconcile-item">
      <div>
        <strong>${escapeHtml(transaction.date)}</strong>
        <span>${escapeHtml(transaction.description || transaction.sourceFile || "銀行資料")}</span>
        <small>${escapeHtml(ledgerText)}</small>
        ${differenceText ? `<small>${escapeHtml(differenceText)}</small>` : ""}
      </div>
      <div>
        <strong>${sign} NT$ ${formatNumber(amount)}</strong>
        <span>${escapeHtml(transaction.status || "待核對")}</span>
        <div class="bank-reconcile-actions">
          ${isBankTransactionFormallyMatched(transaction)
            ? `<button type="button" data-bank-id="${escapeHtml(transaction.id)}" data-bank-action="reconcile">重新配帳</button>`
            : transaction.status !== "不入帳"
              ? `<button type="button" data-bank-id="${escapeHtml(transaction.id)}" data-bank-action="reconcile">配帳務</button>`
              : ""}
          ${isBankTransactionFormallyMatched(transaction) || isBankTransactionClassified(transaction) ? `<button type="button" data-bank-id="${escapeHtml(transaction.id)}" data-bank-action="unmatch">退回待核對</button>` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderBankReconciliationIssues(records, transactions) {
  const issues = buildBankReconciliationIssues(records, transactions);

  if (!issues.length) {
    return `<div class="record-group-empty">目前沒有核對異常。</div>`;
  }

  const counts = issues.reduce((map, issue) => {
    map[issue.type] = (map[issue.type] || 0) + 1;
    return map;
  }, {});

  return `
    <div class="bank-issue-summary">
      <article>
        <span>金額不一致</span>
        <strong>${formatNumber(counts.amountMismatch || 0)} 筆</strong>
      </article>
      <article>
        <span>帳務未配銀行</span>
        <strong>${formatNumber(counts.ledgerUnmatched || 0)} 筆</strong>
      </article>
      <article>
        <span>未正式配帳務</span>
        <strong>${formatNumber(counts.bankUnmatched || 0)} 筆</strong>
      </article>
      <article>
        <span>重複配對</span>
        <strong>${formatNumber(counts.duplicateMatch || 0)} 筆</strong>
      </article>
    </div>
    <div class="bank-issue-list">
      ${issues.map(renderBankReconciliationIssue).join("")}
    </div>
  `;
}

function buildBankReconciliationIssues(records, transactions) {
  const issues = [];
  const recordsById = new Map(records.map((record) => [record.id, record]));
  const matchedTransactions = transactions.filter((transaction) => getMatchedLedgerIds(transaction).length);
  const matchCounts = matchedTransactions.reduce((map, transaction) => {
    getMatchedLedgerIds(transaction).forEach((ledgerId) => {
      map[ledgerId] = (map[ledgerId] || 0) + 1;
    });
    return map;
  }, {});

  matchedTransactions.forEach((transaction) => {
    const matchedLedgerIds = getMatchedLedgerIds(transaction);
    const matchedRecords = matchedLedgerIds.map((ledgerId) => recordsById.get(ledgerId)).filter(Boolean);
    const bankAmount = getBankTransactionAmount(transaction);
    const ledgerAmount = Number(transaction.matchedLedgerAmount || matchedRecords.reduce((total, record) => total + Number(record.amount || 0), 0));

    const handledDifference = transaction.differenceHandling && transaction.differenceHandling !== "待確認";
    if (matchedRecords.length && bankAmount !== ledgerAmount && !handledDifference) {
      issues.push({
        type: "amountMismatch",
        title: "金額不一致",
        date: transaction.date,
        subject: transaction.description || transaction.sourceFile || "銀行資料",
        detail: `銀行 NT$ ${formatNumber(bankAmount)}，帳務 NT$ ${formatNumber(ledgerAmount)}。${transaction.differenceHandling ? `差額處理：${transaction.differenceHandling}` : ""}`,
      });
    }
  });

  records
    .filter((record) => ["已收款", "已付款"].includes(record.settlementStatus))
    .filter((record) => !record.bankTransactionId)
    .forEach((record) => {
      issues.push({
        type: "ledgerUnmatched",
        title: "帳務已收付，銀行未核對",
        date: record.date,
        subject: record.item,
        detail: `${record.type === "income" ? "收入" : "支出"} NT$ ${formatNumber(record.amount)} 尚未配到銀行交易。`,
      });
    });

  transactions
    .filter((transaction) => !isBankTransactionFormallyMatched(transaction) && transaction.status !== "不入帳")
    .forEach((transaction) => {
      const classified = isBankTransactionClassified(transaction);
      issues.push({
        type: "bankUnmatched",
        title: classified ? "已分類未配帳務" : "銀行交易未配對",
        date: transaction.date,
        subject: transaction.description || transaction.sourceFile || "銀行資料",
        detail: classified
          ? `${transaction.status}，但尚未選到實際收入／支出。銀行金額 NT$ ${formatNumber(getBankTransactionAmount(transaction))}。`
          : `銀行金額 NT$ ${formatNumber(getBankTransactionAmount(transaction))} 尚未配到帳務。`,
      });
    });

  Object.entries(matchCounts)
    .filter(([, count]) => count > 1)
    .forEach(([ledgerId, count]) => {
      const record = recordsById.get(ledgerId);
      issues.push({
        type: "duplicateMatch",
        title: "同一筆帳務被多筆銀行交易配對",
        date: record?.date || "",
        subject: record?.item || "已配帳務",
        detail: `目前有 ${formatNumber(count)} 筆銀行交易配到同一筆帳務，請確認是否為分批付款或重複配對。`,
      });
    });

  return issues.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function renderBankReconciliationIssue(issue) {
  return `
    <article class="bank-issue-item ${issue.type}">
      <span>${escapeHtml(issue.title)}</span>
      <div>
        <strong>${escapeHtml(issue.subject)}</strong>
        <small>${escapeHtml(issue.date)} · ${escapeHtml(issue.detail)}</small>
      </div>
    </article>
  `;
}

function getBankTransactionAmount(transaction) {
  return Number(transaction.deposit || 0) || Number(transaction.withdrawal || 0);
}

async function writeAuditLog(action, collectionName, recordId, before = null, after = null) {
  const log = {
    action,
    collectionName,
    recordId,
    before: sanitizeAuditRecord(before),
    after: sanitizeAuditRecord(after),
    createdAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
    createdBy: currentUser?.email || "local-preview",
    userId: currentUser?.uid || "local-preview",
  };

  if (isConfigured) {
    await firebaseApi.addDoc(firebaseApi.collection(db, "auditLogs"), log);
    return;
  }

  const logs = JSON.parse(localStorage.getItem("auditLogsPreview") || "[]");
  logs.unshift({ id: crypto.randomUUID(), ...log });
  localStorage.setItem("auditLogsPreview", JSON.stringify(logs.slice(0, 300)));
}

function sanitizeAuditRecord(record) {
  if (!record) return null;
  const { voucherFiles, voucherFile, ...safeRecord } = record;
  return safeRecord;
}

async function loadAuditLogs() {
  if (!auditLogList) return;

  if (!isConfigured) {
    auditLogCache = loadLocalAuditLogs();
    renderAuditLogs();
    return;
  }

  if (!currentUser || !db) {
    auditLogCache = [];
    renderAuditLogs();
    return;
  }

  const snapshot = await firebaseApi.getDocs(
    firebaseApi.query(
      firebaseApi.collection(db, "auditLogs"),
      firebaseApi.where("userId", "==", currentUser.uid),
      firebaseApi.limit(100),
    ),
  );

  auditLogCache = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => getRecordTimeValue({ updatedAt: b.createdAt }) - getRecordTimeValue({ updatedAt: a.createdAt }));
  renderAuditLogs();
}

function renderAuditLogs() {
  if (!auditLogList) return;

  if (!auditLogCache.length) {
    auditLogList.className = "pending-list empty-state";
    auditLogList.textContent = "目前沒有操作紀錄。";
    return;
  }

  auditLogList.className = "pending-list audit-list";
  auditLogList.innerHTML = auditLogCache.slice(0, 50).map(renderAuditLogItem).join("");
}

function renderAuditLogItem(log) {
  const targetRecord = log.after || log.before || {};
  const title = getAuditRecordTitle(log.collectionName, targetRecord);
  const meta = getAuditRecordMeta(log.collectionName, targetRecord);
  const diff = getAuditDiffText(log);

  return `
    <article class="pending-item recycle-item">
      <div class="pending-left">
        <span class="status-pill">${escapeHtml(getAuditActionLabel(log.action))}</span>
        <div>
          <strong>${escapeHtml(getRecycleCollectionLabel(log.collectionName))} · ${escapeHtml(title)}</strong>
          <p>${escapeHtml(meta)}</p>
          <small>${escapeHtml(formatRecordTime(log.createdAt))} · ${escapeHtml(log.createdBy || "未知操作者")}${diff ? ` · ${escapeHtml(diff)}` : ""}</small>
        </div>
      </div>
    </article>
  `;
}

function getAuditActionLabel(action) {
  if (action === "update") return "修改";
  if (action === "delete") return "刪除";
  if (action === "restore") return "復原";
  return action || "操作";
}

function getAuditRecordTitle(collectionName, record) {
  if (collectionName === "bankTransactions") return record.description || record.sourceFile || "銀行資料";
  if (collectionName === "inventoryRecords") return record.name || "庫存紀錄";
  return record.item || record.counterparty || "流水帳紀錄";
}

function getAuditRecordMeta(collectionName, record) {
  if (collectionName === "bankTransactions") {
    const amount = Number(record.deposit || record.withdrawal || 0);
    const direction = record.deposit ? "流入" : record.withdrawal ? "流出" : "金額";
    return `${record.date || "未填日期"} · ${record.account || "未填帳戶"} · ${direction} NT$ ${formatNumber(amount)}`;
  }

  if (collectionName === "inventoryRecords") {
    const action = inventoryActionLabels[record.action] || record.action || "庫存";
    return `${record.date || "未填日期"} · ${action} · ${formatNumber(record.quantity)} · NT$ ${formatNumber(record.totalCost)}`;
  }

  return `${record.date || "未填日期"} · ${typeLabel(record.type)} · ${record.counterparty || "未填對象"} · NT$ ${formatNumber(record.amount)}`;
}

function getAuditDiffText(log) {
  if (log.action !== "update" || !log.before || !log.after) return "";
  const changes = [];
  ["date", "counterparty", "item", "amount", "account", "settlementStatus", "name", "quantity", "totalCost", "status"].forEach((field) => {
    if (String(log.before[field] ?? "") !== String(log.after[field] ?? "")) changes.push(field);
  });
  return changes.length ? `變更 ${changes.length} 欄` : "內容已更新";
}

async function softDeleteRecord(collectionName, recordId, record) {
  const updates = {
    deletedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
    deletedBy: currentUser?.email || "local-preview",
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  };

  await writeAuditLog("delete", collectionName, recordId, record, { ...record, ...updates });

  if (isConfigured) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, collectionName, recordId), updates);
    return;
  }

  const deletedRecords = loadLocalDeletedRecords();
  deletedRecords.unshift({ collectionName, id: recordId, ...record, ...updates });
  localStorage.setItem("deletedRecordsPreview", JSON.stringify(deletedRecords.slice(0, 300)));
}

async function loadRecycleBinRecords() {
  if (!recycleBinList) return;

  if (!isConfigured) {
    recycleBinCache = loadLocalDeletedRecords();
    renderRecycleBin();
    return;
  }

  if (!currentUser || !db) {
    recycleBinCache = [];
    renderRecycleBin();
    return;
  }

  const deletedRecords = [];

  for (const collectionInfo of recycleCollections) {
    const snapshot = await firebaseApi.getDocs(
      firebaseApi.query(
        firebaseApi.collection(db, collectionInfo.name),
        firebaseApi.where("userId", "==", currentUser.uid),
        firebaseApi.limit(200),
      ),
    );

    snapshot.docs
      .map((doc) => ({ id: doc.id, collectionName: collectionInfo.name, collectionLabel: collectionInfo.label, ...doc.data() }))
      .filter((record) => record.deletedAt)
      .forEach((record) => deletedRecords.push(record));
  }

  recycleBinCache = deletedRecords.sort((a, b) => getRecordTimeValue({ updatedAt: b.deletedAt }) - getRecordTimeValue({ updatedAt: a.deletedAt }));
  renderRecycleBin();
}

function renderRecycleBin() {
  if (!recycleBinList) return;

  if (!recycleBinCache.length) {
    recycleBinList.className = "pending-list empty-state";
    recycleBinList.textContent = "目前沒有刪除資料。";
    return;
  }

  recycleBinList.className = "pending-list recycle-list";
  recycleBinList.innerHTML = recycleBinCache.map(renderRecycleBinItem).join("");
}

function renderRecycleBinItem(record) {
  const title = getRecycleItemTitle(record);
  const meta = getRecycleItemMeta(record);
  const deletedBy = record.deletedBy ? ` · 刪除者：${record.deletedBy}` : "";

  return `
    <article class="pending-item recycle-item">
      <div class="pending-left">
        <span class="status-pill">${escapeHtml(record.collectionLabel || getRecycleCollectionLabel(record.collectionName))}</span>
        <div>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(meta)}</p>
          <small>刪除時間：${escapeHtml(formatRecordTime(record.deletedAt))}${escapeHtml(deletedBy)}</small>
        </div>
      </div>
      <button class="secondary-button" type="button" data-recycle-restore data-collection="${escapeHtml(record.collectionName)}" data-record-id="${escapeHtml(record.id)}">復原</button>
    </article>
  `;
}

function getRecycleCollectionLabel(collectionName) {
  return recycleCollections.find((item) => item.name === collectionName)?.label || collectionName;
}

function getRecycleItemTitle(record) {
  if (record.collectionName === "bankTransactions") return record.description || record.sourceFile || "銀行資料";
  if (record.collectionName === "inventoryRecords") return record.name || "庫存紀錄";
  return record.item || record.counterparty || "流水帳紀錄";
}

function getRecycleItemMeta(record) {
  if (record.collectionName === "bankTransactions") {
    const amount = Number(record.deposit || record.withdrawal || 0);
    const direction = record.deposit ? "流入" : record.withdrawal ? "流出" : "金額";
    return `${record.date || "未填日期"} · ${record.account || "未填帳戶"} · ${direction} NT$ ${formatNumber(amount)}`;
  }

  if (record.collectionName === "inventoryRecords") {
    const action = inventoryActionLabels[record.action] || record.action || "庫存";
    return `${record.date || "未填日期"} · ${action} · ${formatNumber(record.quantity)} · NT$ ${formatNumber(record.totalCost)}`;
  }

  return `${record.date || "未填日期"} · ${typeLabel(record.type)} · ${record.counterparty || "未填對象"} · NT$ ${formatNumber(record.amount)}`;
}

function formatRecordTime(value) {
  if (!value) return "未記錄";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(getRecordTimeValue({ updatedAt: value }));
  if (Number.isNaN(date.getTime())) return "未記錄";
  return `${toDateValue(date)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

async function restoreDeletedRecord(collectionName, recordId) {
  const record = recycleBinCache.find((item) => item.collectionName === collectionName && item.id === recordId);
  if (!record) {
    showToast("找不到要復原的資料。");
    return;
  }

  const updates = {
    deletedAt: null,
    deletedBy: "",
    restoredAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
    restoredBy: currentUser?.email || "local-preview",
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  };

  await writeAuditLog("restore", collectionName, recordId, record, { ...record, ...updates });

  if (isConfigured) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, collectionName, recordId), updates);
  } else {
    restoreLocalDeletedRecord(collectionName, recordId, updates);
  }

  await loadRecycleBinRecords();
  await refreshDataAfterRestore(collectionName);
  showToast("資料已復原。");
}

async function refreshDataAfterRestore(collectionName) {
  if (collectionName === "ledgerRecords") {
    if (isConfigured) await loadRecords();
    else {
      renderRecords(recordsCache);
      updateSummary(recordsCache);
    }
    return;
  }

  if (collectionName === "bankTransactions") {
    if (isConfigured) await loadBankTransactions();
    else renderBankTransactions();
    return;
  }

  if (collectionName === "inventoryRecords") {
    if (isConfigured) await loadInventoryRecords();
    else renderInventory();
  }
}

function restoreLocalDeletedRecord(collectionName, recordId, updates) {
  const deletedRecords = loadLocalDeletedRecords();
  const record = deletedRecords.find((item) => item.collectionName === collectionName && item.id === recordId);
  if (!record) return;

  const restoredRecord = { ...record, ...updates };
  delete restoredRecord.collectionName;
  delete restoredRecord.collectionLabel;
  delete restoredRecord.deletedAt;
  delete restoredRecord.deletedBy;

  if (collectionName === "ledgerRecords") {
    recordsCache.unshift(restoredRecord);
    saveLocalRecords();
  }

  if (collectionName === "bankTransactions") {
    bankTransactionsCache.unshift(restoredRecord);
    saveLocalBankTransactions();
  }

  if (collectionName === "inventoryRecords") {
    inventoryCache.unshift(restoredRecord);
    saveLocalInventoryRecords();
  }

  localStorage.setItem(
    "deletedRecordsPreview",
    JSON.stringify(deletedRecords.filter((item) => !(item.collectionName === collectionName && item.id === recordId))),
  );
}

function getBankTransactionKey(transaction) {
  if (transaction.importKey) return transaction.importKey;
  return [
    transaction.date || "",
    normalizeKeyText(transaction.account || ""),
    normalizeKeyText(transaction.description || ""),
    Number(transaction.deposit || 0),
    Number(transaction.withdrawal || 0),
    Number(transaction.balance || 0),
  ].join("|");
}

function normalizeKeyText(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/[，,。．.]/g, "")
    .toLowerCase();
}

async function importBankFile(file) {
  if (!window.XLSX) {
    throw new Error("Excel 套件尚未載入，請確認網路可連線後重試。");
  }

  if (!currentUser && isConfigured) {
    showToast("請先登入。");
    return;
  }

  const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = readBankRows(sheet);
  const parsed = rows.map((row) => parseBankRow(row.values, row.sourceRow, file.name)).filter(Boolean);

  if (!parsed.length) {
    showToast("沒有可匯入的銀行資料。");
    return;
  }

  if (isConfigured) await loadBankTransactions();

  const existingKeys = new Set(bankTransactionsCache.map(getBankTransactionKey));
  const currentImportKeys = new Set();
  const uniqueTransactions = parsed.filter((transaction) => {
    const key = getBankTransactionKey(transaction);
    if (existingKeys.has(key) || currentImportKeys.has(key)) return false;
    currentImportKeys.add(key);
    transaction.importKey = key;
    return true;
  });

  for (const transaction of uniqueTransactions) {
    await saveBankTransaction(transaction);
  }

  if (isConfigured) await loadBankTransactions();
  else {
    saveLocalBankTransactions();
    renderBankTransactions();
    renderPendingCenter();
  }

  const skippedCount = parsed.length - uniqueTransactions.length;
  bankImportPreview.textContent = `已新增 ${uniqueTransactions.length} 筆銀行資料，略過 ${skippedCount} 筆已存在資料：${file.name}`;
  showToast(`已新增 ${uniqueTransactions.length} 筆銀行資料，略過 ${skippedCount} 筆已存在資料。`);
}

async function registerBankPhotos(files) {
  if (!currentUser && isConfigured) {
    showToast("請先登入。");
    return;
  }

  const account = bankAccountInput.value.trim() || "未指定帳戶";
  const today = toDateValue(new Date());
  const records = files.map((file) => ({
    date: today,
    account,
    description: `存摺照片待辨識：${file.name}`,
    deposit: 0,
    withdrawal: 0,
    balance: 0,
    sourceType: "photo",
    sourceFile: file.name,
    status: "待辨識",
    pendingReason: "存摺照片尚未人工辨識或 OCR。",
    fileMeta: {
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      storage: "pending-google-drive",
    },
  }));

  for (const record of records) {
    await saveBankTransaction(record);
  }

  if (isConfigured) await loadBankTransactions();
  else {
    saveLocalBankTransactions();
    renderBankTransactions();
    renderPendingCenter();
  }

  bankImportPreview.textContent = `已登記 ${records.length} 張存摺照片待辨識。`;
  showToast(`已登記 ${records.length} 張存摺照片。`);
}

function readBankRows(sheet) {
  const matrix = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  const headerIndex = matrix.findIndex((row) => {
    const headers = row.map((cell) => normalizeHeader(cell));
    const hasDate = headers.some((header) =>
      ["日期", "交易日期", "入帳日", "交易日", "帳務日", "date"].map(normalizeHeader).includes(header),
    );
    const hasMoneyColumn = headers.some((header) =>
      [
        "存入",
        "收入",
        "貸方",
        "入金",
        "匯入",
        "轉入",
        "存款金額",
        "收入金額",
        "提出",
        "支出",
        "借方",
        "扣款",
        "匯出",
        "轉出",
        "提款金額",
        "支出金額",
        "金額",
        "交易金額",
        "收支金額",
        "餘額",
        "結餘",
        "存款餘額",
      ].map(normalizeHeader).includes(header),
    );
    return hasDate && hasMoneyColumn;
  });
  if (headerIndex === -1) return [];

  const headers = matrix[headerIndex].map((cell) => String(cell).trim());
  return matrix.slice(headerIndex + 1).map((row, index) => ({
    sourceRow: headerIndex + index + 2,
    values: Object.fromEntries(headers.map((header, col) => [header, row[col]])),
  }));
}

function parseBankRow(row, sourceRow, sourceFile) {
  const date = normalizeImportDate(pickValue(row, ["日期", "交易日期", "入帳日", "交易日", "帳務日", "date"]));
  const descriptionText = String(pickValue(row, ["摘要", "說明", "交易說明", "交易明細", "交易內容", "備註", "description"]) || "").trim();
  const counterpartyText = String(pickValue(row, ["匯款人／收款人", "匯款人/收款人", "匯款人", "收款人", "交易對象", "counterparty"]) || "").trim();
  const description = [descriptionText, counterpartyText].filter(Boolean).join(" · ");
  let deposit = parseAmount(pickValue(row, ["存入", "收入", "貸方", "貸", "入金", "匯入", "轉入", "存款金額", "收入金額", "收方", "右方", "deposit", "credit"]));
  let withdrawal = parseAmount(pickValue(row, ["提出", "支出", "借方", "借", "扣款", "匯出", "轉出", "提款金額", "支出金額", "付方", "左方", "withdrawal", "debit"]));
  const signedAmount = parseSignedAmount(pickValue(row, ["金額", "交易金額", "收支金額", "amount"]));
  const balance = parseAmount(pickValue(row, ["餘額", "結餘", "存款餘額", "balance"]));

  if (!deposit && !withdrawal) {
    const sideAmounts = inferBankSideAmounts(row);
    deposit = sideAmounts.deposit;
    withdrawal = sideAmounts.withdrawal;
  }

  if (!deposit && !withdrawal && signedAmount) {
    if (signedAmount > 0) deposit = signedAmount;
    if (signedAmount < 0) withdrawal = Math.abs(signedAmount);
  }

  if (!date || (!description && !deposit && !withdrawal && !balance)) return null;

  return {
    date,
    account: bankAccountInput.value.trim() || "公司帳戶",
    description,
    deposit,
    withdrawal,
    balance,
    sourceType: "excel",
    sourceFile,
    sourceRow,
    status: "待核對",
    matchedType: "",
    pendingReason: "尚未與收入、支出、平台撥款或代墊還款配對。",
  };
}

function inferBankSideAmounts(row) {
  let deposit = 0;
  let withdrawal = 0;

  Object.entries(row).forEach(([key, value]) => {
    const header = normalizeHeader(key);
    const amount = parseAmount(value);
    if (!amount) return;

    if (/存入|收入|貸方|入金|匯入|轉入|收方|存款/.test(header)) {
      deposit += amount;
    } else if (/提出|支出|借方|扣款|匯出|轉出|付方|提款/.test(header)) {
      withdrawal += amount;
    }
  });

  return { deposit, withdrawal };
}

async function saveBankTransaction(transaction) {
  if (isConfigured) {
    await firebaseApi.addDoc(firebaseApi.collection(db, "bankTransactions"), {
      ...transaction,
      createdAt: firebaseApi.serverTimestamp(),
      createdBy: currentUser.email,
      userId: currentUser.uid,
    });
    return;
  }

  bankTransactionsCache.unshift({ id: crypto.randomUUID(), ...transaction, createdAt: new Date() });
}

async function loadBankTransactions() {
  if (!currentUser || !db) return;

  const snapshot = await firebaseApi.getDocs(
    firebaseApi.query(
      firebaseApi.collection(db, "bankTransactions"),
      firebaseApi.where("userId", "==", currentUser.uid),
      firebaseApi.limit(200),
    ),
  );
  bankTransactionsCache = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((transaction) => !transaction.deletedAt)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  renderBankTransactions();
  renderPendingCenter();
}

function renderBankTransactions() {
  if (!bankTransactionsCache.length) {
    bankTransactionList.className = "bank-transaction-list empty-state";
    bankTransactionList.textContent = "尚無銀行交易。";
    return;
  }

  bankTransactionList.className = "bank-transaction-list";
  bankTransactionList.innerHTML = bankTransactionsCache.slice(0, 30).map(renderBankTransactionRow).join("");
}

function renderBankTransactionRow(transaction) {
  const amountText = transaction.deposit
    ? `+ NT$ ${formatNumber(transaction.deposit)}`
    : transaction.withdrawal
      ? `- NT$ ${formatNumber(transaction.withdrawal)}`
      : "待辨識";
  const status = transaction.status || "待核對";
  const matchedText = transaction.matchedLedgerItem
    ? `已配：${transaction.matchedLedgerItem}`
    : transaction.matchedLedgerId
      ? "已配帳務"
      : "";
  const statusButtons = [
    ["已配收入", "配收入"],
    ["已配支出", "配支出"],
    ["已配平台撥款", "平台撥款"],
    ["已配代墊還款", "代墊還款"],
    ["不入帳", "不入帳"],
  ];
  return `
    <article class="bank-row">
      <strong>${escapeHtml(transaction.date)}</strong>
      <div>
        <strong>${escapeHtml(transaction.description || transaction.sourceFile || "銀行資料")}</strong>
        <span>${escapeHtml(transaction.account)} · ${escapeHtml(transaction.sourceFile || "")}</span>
        ${matchedText ? `<small>${escapeHtml(matchedText)}</small>` : ""}
      </div>
      <strong>${amountText}</strong>
      <span>${escapeHtml(status)}</span>
      <div class="bank-actions">
        <button type="button" data-bank-id="${escapeHtml(transaction.id)}" data-bank-action="reconcile">配帳務</button>
        ${isBankTransactionFormallyMatched(transaction) || isBankTransactionClassified(transaction) ? `<button type="button" data-bank-id="${escapeHtml(transaction.id)}" data-bank-action="unmatch">退回待核對</button>` : ""}
        ${statusButtons
          .map(([nextStatus, label]) => `
            <button type="button" data-bank-id="${escapeHtml(transaction.id)}" data-bank-status="${escapeHtml(nextStatus)}" ${status === nextStatus ? "disabled" : ""}>${label}</button>
          `)
          .join("")}
        <button type="button" data-bank-id="${escapeHtml(transaction.id)}" data-bank-action="edit">修改</button>
        <button type="button" class="danger" data-bank-id="${escapeHtml(transaction.id)}" data-bank-action="delete">刪除</button>
      </div>
    </article>
  `;
}

async function updateBankTransactionStatus(transaction, status) {
  const pendingReason = ["待核對", "待辨識"].includes(status)
    ? transaction.pendingReason || "尚未配對帳務"
    : "";
  const updates = {
    status,
    pendingReason,
    matchedType: status,
    matchedLedgerId: "",
    matchedLedgerIds: [],
    matchedLedgerItem: "",
    matchedLedgerItems: [],
    matchedLedgerAmount: 0,
    matchDifference: 0,
    differenceHandling: "",
    differenceNote: "",
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  };
  const matchedLedgerIds = getMatchedLedgerIds(transaction);
  const linkedRecords = recordsCache.filter((record) => matchedLedgerIds.includes(record.id));
  const buildLedgerUpdates = (record) => ({
    settlementStatus: getUnmatchedLedgerSettlementStatus(record),
    settledDate: "",
    bankTransactionId: "",
    bankMatchedDate: "",
    bankMatchedAmount: 0,
    bankMatchedDescription: "",
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  });

  if (isConfigured) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, "bankTransactions", transaction.id), updates);
    for (const linkedRecord of linkedRecords) {
      await firebaseApi.updateDoc(firebaseApi.doc(db, "ledgerRecords", linkedRecord.id), buildLedgerUpdates(linkedRecord));
    }
    if (linkedRecords.length) await loadRecords();
    await loadBankTransactions();
  } else {
    bankTransactionsCache = bankTransactionsCache.map((item) =>
      item.id === transaction.id ? { ...item, ...updates } : item,
    );
    if (linkedRecords.length) {
      recordsCache = recordsCache.map((record) =>
        matchedLedgerIds.includes(record.id) ? { ...record, ...buildLedgerUpdates(record) } : record,
      );
      saveLocalRecords();
    }
    saveLocalBankTransactions();
    renderBankTransactions();
    renderPendingCenter();
  }

  renderRecords(recordsCache);
  updateSummary(recordsCache);
  renderCustomReport();
  renderCashflow();
  renderSettlementCenter();
  showToast(`銀行交易已分類為：${status}`);
}

async function reconcileBankTransaction(transaction) {
  const direction = getBankTransactionDirection(transaction);
  if (!direction) {
    showToast("這筆銀行資料沒有存入或提出金額，無法配帳務。");
    return;
  }

  if (getMatchedLedgerIds(transaction).length) {
    const confirmed = window.confirm("這筆銀行資料已經配過帳務，是否重新配對？");
    if (!confirmed) return;
  }

  const candidates = getBankLedgerCandidates(transaction, direction);
  if (!candidates.length) {
    showToast(`找不到可配對的${direction.type === "income" ? "收入" : "支出"}紀錄。`);
    return;
  }

  const selectedRecords = await openLedgerMatchDialog(transaction, direction, candidates.slice(0, 30));
  if (!selectedRecords) return;

  if (!selectedRecords.length) {
    showToast("請至少勾選一筆帳務。");
    return;
  }

  const selectedTotal = selectedRecords.reduce((total, record) => total + Number(record.amount || 0), 0);
  const differenceInfo = getMatchDifferenceInfo(direction.amount, selectedTotal);
  if (!differenceInfo) return;

  await applyBankLedgerMatches(transaction, selectedRecords, direction, differenceInfo);
}

function getMatchDifferenceInfo(bankAmount, ledgerAmount) {
  const difference = bankAmount - ledgerAmount;
  if (!difference) {
    return { difference: 0, handling: "", note: "" };
  }

  const choice = window.prompt(
    [
      "銀行金額與勾選帳務合計不同，請選擇差額處理：",
      "",
      `銀行：NT$ ${formatNumber(bankAmount)}`,
      `帳務合計：NT$ ${formatNumber(ledgerAmount)}`,
      `差額：NT$ ${formatNumber(difference)}`,
      "",
      "1. 銷貨成本－金流／平台成本",
      "2. 短溢收",
      "3. 待確認",
      "4. 仍視為可接受差額",
    ].join("\n"),
    "3",
  );
  if (choice === null) return null;

  const handlingMap = {
    1: "銷貨成本－金流／平台成本",
    2: "短溢收",
    3: "待確認",
    4: "可接受差額",
  };
  const handling = handlingMap[String(choice).trim()];
  if (!handling) {
    showToast("差額處理選項無效，請重新配對。");
    return null;
  }

  const note = window.prompt("差額備註，可留空", handling) ?? "";
  return { difference, handling, note };
}

function openLedgerMatchDialog(transaction, direction, candidates) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "match-dialog-overlay";
    overlay.innerHTML = `
      <div class="match-dialog" role="dialog" aria-modal="true" aria-label="配帳務">
        <div class="match-dialog-header">
          <div>
            <p class="eyebrow">BANK MATCH</p>
            <h3>勾選要配對的帳務</h3>
            <p>銀行資料：${escapeHtml(transaction.date)} · NT$ ${formatNumber(direction.amount)} · ${escapeHtml(transaction.description || transaction.sourceFile || "")}</p>
          </div>
          <button type="button" data-match-close>×</button>
        </div>
        <div class="match-dialog-summary">
          <span>銀行金額 <strong>NT$ ${formatNumber(direction.amount)}</strong></span>
          <span>已選合計 <strong data-match-total>NT$ 0</strong></span>
          <span>差額 <strong data-match-diff>NT$ ${formatNumber(direction.amount)}</strong></span>
        </div>
        <div class="match-dialog-list">
          ${candidates.map((record) => `
            <label class="match-option">
              <input type="checkbox" data-match-record-id="${escapeHtml(record.id)}" />
              <span>
                <strong>${escapeHtml(record.date)} · ${escapeHtml(record.item)}</strong>
                <small>${escapeHtml(record.counterparty)} · ${escapeHtml(record.settlementStatus || "")}</small>
              </span>
              <strong>NT$ ${formatNumber(record.amount)}</strong>
            </label>
          `).join("")}
        </div>
        <div class="match-dialog-actions">
          <button type="button" class="secondary-button" data-match-cancel>取消</button>
          <button type="button" data-match-confirm>確認配對</button>
        </div>
      </div>
    `;

    const close = (value) => {
      overlay.remove();
      resolve(value);
    };
    const updateTotal = () => {
      const selectedIds = Array.from(overlay.querySelectorAll("[data-match-record-id]:checked")).map((item) => item.dataset.matchRecordId);
      const total = candidates
        .filter((record) => selectedIds.includes(record.id))
        .reduce((sum, record) => sum + Number(record.amount || 0), 0);
      overlay.querySelector("[data-match-total]").textContent = `NT$ ${formatNumber(total)}`;
      overlay.querySelector("[data-match-diff]").textContent = `NT$ ${formatNumber(direction.amount - total)}`;
    };

    overlay.addEventListener("change", updateTotal);
    overlay.querySelector("[data-match-close]").addEventListener("click", () => close(null));
    overlay.querySelector("[data-match-cancel]").addEventListener("click", () => close(null));
    overlay.querySelector("[data-match-confirm]").addEventListener("click", () => {
      const selectedIds = Array.from(overlay.querySelectorAll("[data-match-record-id]:checked")).map((item) => item.dataset.matchRecordId);
      close(candidates.filter((record) => selectedIds.includes(record.id)));
    });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close(null);
    });

    document.body.appendChild(overlay);
  });
}

function getBankTransactionDirection(transaction) {
  const deposit = Number(transaction.deposit || 0);
  const withdrawal = Number(transaction.withdrawal || 0);
  if (deposit > 0) return { type: "income", amount: deposit, status: "已配收入", settlementStatus: "已收款" };
  if (withdrawal > 0) return { type: "expense", amount: withdrawal, status: "已配支出", settlementStatus: "已付款" };
  return null;
}

function getBankLedgerCandidates(transaction, direction) {
  return recordsCache
    .filter((record) => record.type === direction.type)
    .filter((record) => !record.bankTransactionId || record.bankTransactionId === transaction.id)
    .sort((a, b) => {
      const aAmountScore = Number(a.amount || 0) === direction.amount ? 1 : 0;
      const bAmountScore = Number(b.amount || 0) === direction.amount ? 1 : 0;
      if (aAmountScore !== bAmountScore) return bAmountScore - aAmountScore;
      return getDateDistance(a.date, transaction.date) - getDateDistance(b.date, transaction.date);
    });
}

function getDateDistance(a, b) {
  const first = new Date(`${a || ""}T00:00:00`).getTime();
  const second = new Date(`${b || ""}T00:00:00`).getTime();
  if (!Number.isFinite(first) || !Number.isFinite(second)) return Number.MAX_SAFE_INTEGER;
  return Math.abs(first - second);
}

async function applyBankLedgerMatches(transaction, selectedRecords, direction, differenceInfo = { difference: 0, handling: "", note: "" }) {
  const matchedLedgerIds = selectedRecords.map((record) => record.id);
  const matchedLedgerItems = selectedRecords.map((record) => record.item);
  const matchedLedgerAmount = selectedRecords.reduce((total, record) => total + Number(record.amount || 0), 0);
  const bankUpdates = {
    status: direction.status,
    pendingReason: "",
    matchedType: direction.status,
    matchedLedgerId: matchedLedgerIds[0],
    matchedLedgerIds,
    matchedLedgerItem: matchedLedgerItems.join("、"),
    matchedLedgerItems,
    matchedLedgerAmount,
    matchDifference: differenceInfo.difference || 0,
    differenceHandling: differenceInfo.handling || "",
    differenceNote: differenceInfo.note || "",
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  };
  const buildLedgerUpdates = (record) => ({
    settlementStatus: direction.settlementStatus,
    settledDate: transaction.date || toDateValue(new Date()),
    bankTransactionId: transaction.id,
    bankMatchedDate: transaction.date || "",
    bankMatchedAmount: Number(record.amount || 0),
    bankMatchedDescription: transaction.description || transaction.sourceFile || "",
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  });

  if (isConfigured) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, "bankTransactions", transaction.id), bankUpdates);
    for (const record of selectedRecords) {
      await firebaseApi.updateDoc(firebaseApi.doc(db, "ledgerRecords", record.id), buildLedgerUpdates(record));
    }
    await loadRecords();
    await loadBankTransactions();
  } else {
    bankTransactionsCache = bankTransactionsCache.map((item) =>
      item.id === transaction.id ? { ...item, ...bankUpdates } : item,
    );
    recordsCache = recordsCache.map((item) =>
      matchedLedgerIds.includes(item.id) ? { ...item, ...buildLedgerUpdates(item) } : item,
    );
    saveLocalBankTransactions();
    saveLocalRecords();
  }

  renderRecords(recordsCache);
  updateSummary(recordsCache);
  renderCustomReport();
  renderCashflow();
  renderBankTransactions();
  renderPendingCenter();
  renderSettlementCenter();
  showToast("銀行交易已配對帳務。");
}

async function unmatchBankTransaction(transaction) {
  if (!isBankTransactionFormallyMatched(transaction) && !isBankTransactionClassified(transaction)) {
    showToast("這筆銀行交易目前沒有配對狀態。");
    return;
  }

  const matchedLedgerIds = getMatchedLedgerIds(transaction);
  const matchedRecords = recordsCache.filter((item) => matchedLedgerIds.includes(item.id));
  const recordNames = matchedRecords.map((record) => record.item).join("、");
  const confirmed = window.confirm(
    `確定要將這筆銀行交易退回待核對嗎？\n\n銀行：${transaction.description || transaction.sourceFile || "銀行資料"}\n目前狀態：${transaction.status || "待核對"}${transaction.matchedLedgerItem || recordNames ? `\n帳務：${transaction.matchedLedgerItem || recordNames}` : ""}`,
  );
  if (!confirmed) return;

  const bankUpdates = {
    status: "待核對",
    pendingReason: "已取消配對，尚未重新核對帳務。",
    matchedType: "",
    matchedLedgerId: "",
    matchedLedgerIds: [],
    matchedLedgerItem: "",
    matchedLedgerItems: [],
    matchedLedgerAmount: 0,
    matchDifference: 0,
    differenceHandling: "",
    differenceNote: "",
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  };
  const buildLedgerUpdates = (record) => ({
    settlementStatus: getUnmatchedLedgerSettlementStatus(record),
    settledDate: "",
    bankTransactionId: "",
    bankMatchedDate: "",
    bankMatchedAmount: 0,
    bankMatchedDescription: "",
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  });

  if (isConfigured) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, "bankTransactions", transaction.id), bankUpdates);
    for (const record of matchedRecords) {
      await firebaseApi.updateDoc(firebaseApi.doc(db, "ledgerRecords", record.id), buildLedgerUpdates(record));
    }
    await loadRecords();
    await loadBankTransactions();
  } else {
    bankTransactionsCache = bankTransactionsCache.map((item) =>
      item.id === transaction.id ? { ...item, ...bankUpdates } : item,
    );
    if (matchedRecords.length) {
      recordsCache = recordsCache.map((item) =>
        matchedLedgerIds.includes(item.id) ? { ...item, ...buildLedgerUpdates(item) } : item,
      );
    }
    saveLocalBankTransactions();
    saveLocalRecords();
  }

  renderRecords(recordsCache);
  updateSummary(recordsCache);
  renderCustomReport();
  renderCashflow();
  renderBankTransactions();
  renderPendingCenter();
  renderSettlementCenter();
  showToast("已退回待核對，可重新配帳務。");
}

function getUnmatchedLedgerSettlementStatus(record) {
  if (record.dueDate) return record.type === "income" ? "待收款" : "待付款";
  return record.type === "income" ? "已收款" : "已付款";
}

async function handleEditBankTransaction(transaction) {
  const date = window.prompt("交易日期", transaction.date || "");
  if (date === null) return;
  const description = window.prompt("摘要", transaction.description || "");
  if (description === null) return;
  const deposit = window.prompt("存入金額，沒有請填 0", transaction.deposit || 0);
  if (deposit === null) return;
  const withdrawal = window.prompt("提出金額，沒有請填 0", transaction.withdrawal || 0);
  if (withdrawal === null) return;
  const balance = window.prompt("餘額，沒有請填 0", transaction.balance || 0);
  if (balance === null) return;

  const updates = {
    date: normalizeImportDate(date) || transaction.date,
    description: description.trim(),
    deposit: parseAmount(deposit),
    withdrawal: parseAmount(withdrawal),
    balance: parseAmount(balance),
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  };

  await writeAuditLog("update", "bankTransactions", transaction.id, transaction, { ...transaction, ...updates });

  if (isConfigured) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, "bankTransactions", transaction.id), updates);
    await loadBankTransactions();
  } else {
    bankTransactionsCache = bankTransactionsCache.map((item) =>
      item.id === transaction.id ? { ...item, ...updates } : item,
    );
    saveLocalBankTransactions();
    renderBankTransactions();
    renderPendingCenter();
  }

  renderCashflow();
  showToast("銀行交易已更新。");
}

async function handleDeleteBankTransaction(transaction) {
  const confirmed = window.confirm(
    `確定要刪除這筆銀行資料嗎？\n\n日期：${transaction.date}\n摘要：${transaction.description || transaction.sourceFile}\n金額：NT$ ${formatNumber(transaction.deposit || transaction.withdrawal || 0)}`,
  );
  if (!confirmed) return;

  if (isConfigured) {
    await softDeleteRecord("bankTransactions", transaction.id, transaction);
    await loadBankTransactions();
  } else {
    bankTransactionsCache = bankTransactionsCache.filter((item) => item.id !== transaction.id);
    saveLocalBankTransactions();
    renderBankTransactions();
    renderPendingCenter();
  }

  renderCashflow();
  showToast("銀行資料已移到刪除紀錄。");
}

function renderPendingCenter() {
  const items = buildPendingItems();
  const counts = items.reduce((map, item) => {
    map[item.group] = (map[item.group] || 0) + 1;
    return map;
  }, {});
  const urgentCount = items.filter((item) => item.priority >= 80).length;
  const today = toDateValue(new Date());
  const dueCount = items.filter((item) => item.date && item.date <= today).length;

  pendingSummary.innerHTML = [
    ["全部待辦", items.length],
    ["優先處理", urgentCount],
    ["今日以前", dueCount],
    ["待核對金流", counts.cashflow || 0],
    ["待配庫存", counts.inventory || 0],
  ]
    .map(([label, count]) => `
      <article class="pending-card">
        <span>${label}</span>
        <strong>${formatNumber(count)} 筆</strong>
      </article>
    `)
    .join("");

  if (!items.length) {
    pendingList.className = "pending-list empty-state";
    pendingList.textContent = "目前沒有待處理事項。";
    return;
  }

  pendingList.className = "pending-list";
  pendingList.innerHTML = items.map(renderPendingItem).join("");
}

function renderVoucherCenter() {
  if (!voucherSummary || !voucherList) return;

  const rows = buildVoucherRows();
  renderVoucherInbox();
  const uploadedCount = rows.reduce((sum, row) => sum + Number(row.voucherCount || 0), 0);
  const linkedCount = rows.filter((row) => row.status === "已核實").length;
  const waitingCount = rows.filter((row) => ["LINE待覆核", "待補憑證", "待補發票號碼"].includes(row.status)).length;
  const failedCount = rows.filter((row) => row.status === "上傳失敗").length;

  voucherSummary.innerHTML = [
    ["憑證張數", uploadedCount],
    ["已核實", linkedCount],
    ["待核實", waitingCount],
    ["上傳失敗", failedCount],
  ]
    .map(([label, count]) => `
      <article class="pending-card">
        <span>${label}</span>
        <strong>${formatNumber(count)} 筆</strong>
      </article>
    `)
    .join("");

  if (!rows.length) {
    voucherList.className = "pending-list empty-state";
    voucherList.textContent = "目前沒有憑證資料。";
    return;
  }

  voucherList.className = "pending-list";
  voucherList.innerHTML = rows.map(renderVoucherCenterRow).join("");
}

async function loadVoucherInbox() {
  if (!isConfigured) {
    voucherInboxCache = loadLocalVoucherInbox();
    renderVoucherCenter();
    return;
  }

  if (!currentUser || !db) {
    voucherInboxCache = [];
    renderVoucherCenter();
    return;
  }

  const snapshot = await firebaseApi.getDocs(
    firebaseApi.query(
      firebaseApi.collection(db, "voucherInbox"),
      firebaseApi.where("userId", "==", currentUser.uid),
      firebaseApi.limit(100),
    ),
  );

  voucherInboxCache = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((voucher) => !voucher.deletedAt)
    .sort(compareRecordsByDateAndCreatedTime);
  renderVoucherCenter();
}

async function saveVoucherInboxFromForm() {
  const invoiceNumber = normalizeInvoiceNumber(voucherInboxFields.invoiceNumber?.value || "");
  const amount = parseAmount(voucherInboxFields.amount?.value || 0);

  if (!amount) {
    showToast("請先填憑證總金額。");
    return;
  }

  const voucher = {
    type: "expense",
    invoiceNumber,
    date: voucherInboxFields.date?.value || toDateValue(new Date()),
    counterparty: voucherInboxFields.counterparty?.value?.trim() || "",
    totalAmount: amount,
    matchedAmount: 0,
    remainingAmount: amount,
    voucherLinks: voucherInboxFields.link?.value?.trim() ? [voucherInboxFields.link.value.trim()] : [],
    note: voucherInboxFields.note?.value?.trim() || "",
    matches: [],
    status: "unmatched",
    source: "manual",
    createdAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
    createdBy: currentUser?.email || "local-preview",
    userId: currentUser?.uid || "local-preview",
  };

  if (isConfigured) {
    const docRef = await firebaseApi.addDoc(firebaseApi.collection(db, "voucherInbox"), voucher);
    await writeAuditLog("create", "voucherInbox", docRef.id, null, voucher);
    await loadVoucherInbox();
  } else {
    voucherInboxCache.unshift({ id: crypto.randomUUID(), ...voucher });
    saveLocalVoucherInbox();
    renderVoucherCenter();
  }

  Object.values(voucherInboxFields).forEach((field) => {
    if (field) field.value = "";
  });
  showToast("已加入憑證暫存池。");
}

async function saveImportedVoucherInboxRecord(voucher) {
  if (isConfigured) {
    const docRef = await firebaseApi.addDoc(firebaseApi.collection(db, "voucherInbox"), voucher);
    await writeAuditLog("create", "voucherInbox", docRef.id, null, voucher);
    return docRef.id;
  }

  const id = crypto.randomUUID();
  voucherInboxCache.unshift({ id, ...voucher });
  return id;
}

async function syncDriveVoucherInbox() {
  if (!lineEndpointConfig.endpointUrl || !lineEndpointConfig.sharedSecret) {
    showToast("尚未設定 LINE 後端網址，無法同步 Drive 行政清單。");
    return;
  }

  if (!currentUser && isConfigured) {
    showToast("請先登入後再同步 Drive 行政清單。");
    return;
  }

  syncDriveVoucherInboxButton.disabled = true;
  syncDriveVoucherInboxButton.textContent = "同步中...";

  try {
    const result = await requestLineBackendJsonp({
      action: "readAdminVoucherFolders",
      secret: lineEndpointConfig.sharedSecret,
      userId: currentUser?.uid || "local-preview",
      userEmail: currentUser?.email || "local-preview",
    });
    const vouchers = Array.isArray(result.vouchers) ? result.vouchers : [];
    let importedCount = 0;
    let skippedCount = 0;

    for (const voucher of vouchers) {
      const normalizedVoucher = normalizeDriveVoucherInbox(voucher);
      if (isDuplicateVoucherInbox(normalizedVoucher)) {
        skippedCount += 1;
        continue;
      }
      await saveImportedVoucherInboxRecord(normalizedVoucher);
      importedCount += 1;
    }

    if (isConfigured) {
      await loadVoucherInbox();
    } else {
      saveLocalVoucherInbox();
      renderVoucherCenter();
    }

    showToast(`Drive 同步完成：新增 ${importedCount} 筆，略過重複 ${skippedCount} 筆。`);
  } catch (error) {
    showToast(`Drive 同步失敗：${error.message}`);
  } finally {
    syncDriveVoucherInboxButton.disabled = false;
    syncDriveVoucherInboxButton.textContent = "同步 Drive 行政清單";
  }
}

function normalizeDriveVoucherInbox(voucher) {
  const amount = parseAmount(voucher.totalAmount || voucher.amount || 0);
  const type = resolveVoucherRecordType(voucher);
  return {
    type,
    invoiceNumber: normalizeInvoiceNumber(voucher.invoiceNumber),
    date: normalizeImportDate(voucher.date) || toDateValue(new Date()),
    counterparty: String(voucher.counterparty || "").trim(),
    item: String(voucher.item || "").trim(),
    quantity: parseAmount(voucher.quantity),
    unitPrice: parseAmount(voucher.unitPrice),
    netAmount: parseAmount(voucher.netAmount),
    taxAmount: parseAmount(voucher.taxAmount),
    totalAmount: amount,
    matchedAmount: parseAmount(voucher.matchedAmount),
    remainingAmount: amount,
    voucherLinks: Array.isArray(voucher.voucherLinks) ? voucher.voucherLinks.filter(Boolean) : [],
    sourceFileName: voucher.sourceFileName || "",
    sourceWorkbook: voucher.sourceWorkbook || "",
    sourceRow: voucher.sourceRow || "",
    voucherType: voucher.voucherType || "",
    processResult: voucher.processResult || "",
    note: voucher.note || "",
    matches: [],
    status: "unmatched",
    source: "admin-drive",
    createdAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
    createdBy: currentUser?.email || voucher.createdBy || "local-preview",
    userId: currentUser?.uid || voucher.userId || "local-preview",
  };
}

function isDuplicateVoucherInbox(voucher) {
  const key = buildVoucherInboxDedupeKey(voucher);
  return voucherInboxCache.some((item) => buildVoucherInboxDedupeKey(item) === key);
}

function buildVoucherInboxDedupeKey(voucher) {
  return [
    normalizeInvoiceNumber(voucher.invoiceNumber),
    normalizeImportDate(voucher.date) || voucher.date || "",
    String(voucher.sourceWorkbook || "").trim(),
    String(voucher.sourceRow || "").trim(),
    String(voucher.sourceFileName || "").trim(),
    Number(voucher.totalAmount || 0),
  ].join("|");
}

async function importVoucherInboxFile(file) {
  if (!window.XLSX) {
    throw new Error("目前缺少 Excel 讀取元件，請重新整理後再試一次。");
  }

  if (!currentUser && isConfigured) {
    showToast("請先登入後再匯入憑證清單。");
    return;
  }

  const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const rows = readAdminVoucherRows(workbook.Sheets[sheetName]);
  const vouchers = rows
    .map((row) => parseAdminVoucherRow(row.values, row.sourceRow, file.name))
    .filter(Boolean);

  if (!vouchers.length) {
    showToast("沒有找到可匯入的憑證資料。");
    return;
  }

  const confirmed = window.confirm(`準備匯入 ${vouchers.length} 筆行政憑證到暫存池，之後可用金額配正式收入/支出。是否繼續？`);
  if (!confirmed) return;

  for (const voucher of vouchers) {
    await saveImportedVoucherInboxRecord(voucher);
  }

  if (isConfigured) {
    await loadVoucherInbox();
  } else {
    saveLocalVoucherInbox();
    renderVoucherCenter();
  }

  showToast(`已匯入 ${vouchers.length} 筆行政憑證。`);
}

function readAdminVoucherRows(sheet) {
  const matrix = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  const headerIndex = matrix.findIndex((row) => {
    const headers = row.map(normalizeHeader);
    const hasVoucherSignal = ["發票日期", "發票號碼", "供應商名稱", "新檔名"].some((name) =>
      headers.includes(normalizeHeader(name)),
    );
    const hasAmount = ["含稅價", "支出金額", "未稅總價", "稅金"].some((name) =>
      headers.includes(normalizeHeader(name)),
    );
    return hasVoucherSignal && hasAmount;
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

function parseAdminVoucherRow(row, sourceRow, sourceWorkbook) {
  const invoiceNumber = normalizeInvoiceNumber(pickValue(row, ["發票號碼", "憑證號碼"]));
  const date = normalizeImportDate(pickValue(row, ["發票日期", "日期"]));
  const counterparty = String(pickValue(row, ["供應商名稱", "供應商", "交易對象", "廠商"]) || "").trim();
  const item = String(pickValue(row, ["品項", "項目", "摘要"]) || "").trim();
  const quantity = parseAmount(pickValue(row, ["數量"]));
  const unitPrice = parseAmount(pickValue(row, ["單價"]));
  const netAmount = parseAmount(pickValue(row, ["未稅總價", "未稅金額"]));
  const taxAmount = parseAmount(pickValue(row, ["稅金", "稅額"]));
  const grossAmount = parseAmount(pickValue(row, ["含稅價", "含稅金額", "總金額"]));
  const expenseAmount = parseAmount(pickValue(row, ["支出金額", "金額"]));
  const amount = grossAmount || expenseAmount || netAmount + taxAmount || netAmount;
  const sourceFileName = String(pickValue(row, ["新檔名", "檔名", "憑證檔名"]) || "").trim();
  const voucherType = String(pickValue(row, ["發票型式", "憑證型式"]) || "").trim();
  const processResult = String(pickValue(row, ["處理結果"]) || "").trim();
  const rawNote = String(pickValue(row, ["備註"]) || "").trim();
  const link = String(pickValue(row, ["憑證連結", "檔案連結", "Google Drive", "連結"]) || "").trim();

  if (!amount || (!invoiceNumber && !sourceFileName && !counterparty && !item)) return null;

  return {
    type: "expense",
    invoiceNumber,
    date: date || toDateValue(new Date()),
    counterparty,
    item,
    quantity,
    unitPrice,
    netAmount,
    taxAmount,
    totalAmount: amount,
    matchedAmount: 0,
    remainingAmount: amount,
    voucherLinks: link ? [link] : [],
    sourceFileName,
    sourceWorkbook,
    sourceRow,
    voucherType,
    processResult,
    note: [
      item,
      processResult,
      rawNote,
      sourceFileName ? `檔名：${sourceFileName}` : "",
      `來源：${sourceWorkbook} 第 ${sourceRow} 列`,
    ].filter(Boolean).join("｜"),
    matches: [],
    status: "unmatched",
    source: "admin-list",
    createdAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
    createdBy: currentUser?.email || "local-preview",
    userId: currentUser?.uid || "local-preview",
  };
}

function renderVoucherInbox() {
  if (!voucherInboxList) return;

  updateVoucherInboxFilter();

  if (!voucherInboxCache.length) {
    voucherInboxList.className = "voucher-inbox-list empty-state";
    voucherInboxList.textContent = "目前沒有暫存憑證。";
    return;
  }

  const visibleVouchers = voucherInboxCache.filter((voucher) => shouldShowVoucherInboxItem(voucher));

  if (!visibleVouchers.length) {
    voucherInboxList.className = "voucher-inbox-list empty-state";
    voucherInboxList.textContent = getVoucherFilterEmptyText();
    return;
  }

  voucherInboxList.className = "voucher-inbox-list";
  voucherInboxList.innerHTML = visibleVouchers.map(renderVoucherInboxRow).join("");
}

function renderVoucherInboxRow(voucher) {
  const matchedAmount = getVoucherMatchedAmount(voucher);
  const totalAmount = Number(voucher.totalAmount || 0);
  const remainingAmount = Math.max(0, totalAmount - matchedAmount);
  const overAmount = Math.max(0, matchedAmount - totalAmount);
  const statusInfo = getVoucherInboxStatusInfo(voucher);
  const tone = statusInfo.status === "matched" ? "income" : statusInfo.status === "partial" || statusInfo.status === "overmatched" ? "pending" : "";
  const voucherType = resolveVoucherRecordType(voucher);
  const voucherTypeLabel = voucherType === "income" ? "銷項收入憑證" : "進項支出憑證";
  const links = Array.isArray(voucher.voucherLinks) ? voucher.voucherLinks.filter(Boolean) : [];
  const matchPanel = activeVoucherMatchId === voucher.id ? renderVoucherMatchPanel(voucher, remainingAmount) : "";
  const editPanel = activeVoucherEditId === voucher.id ? renderVoucherEditPanel(voucher) : "";

  return `
    <article class="voucher-inbox-item ${escapeHtml(statusInfo.status)}">
      <span class="pill ${tone}">${escapeHtml(statusInfo.label)}</span>
      <div class="voucher-inbox-main">
        <strong>${escapeHtml(voucher.invoiceNumber || "未填發票號碼")}</strong>
        <span>${escapeHtml(voucherTypeLabel)} · ${escapeHtml(voucher.date || "")} · ${escapeHtml(voucher.counterparty || "未填交易對象")}</span>
        <span>${escapeHtml(voucher.item || "未填品項")}</span>
        <div class="voucher-amount-grid">
          <span><small>總額</small><strong>NT$ ${formatNumber(voucher.totalAmount)}</strong></span>
          <span><small>已配</small><strong>NT$ ${formatNumber(matchedAmount)}</strong></span>
          <span class="${overAmount ? "danger" : ""}"><small>${overAmount ? "超配" : "剩餘"}</small><strong>NT$ ${formatNumber(overAmount || remainingAmount)}</strong></span>
        </div>
        ${renderVoucherLedgerMatchSummary(voucher)}
        ${renderVoucherInfoHint(voucher)}
        ${links.map((url, index) => `<a class="voucher-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">查看憑證 ${index + 1}</a>`).join("")}
      </div>
      <div class="voucher-actions">
        <button type="button" data-voucher-edit data-voucher-id="${escapeHtml(voucher.id)}">${activeVoucherEditId === voucher.id ? "收合編輯" : "編輯"}</button>
        <button type="button" data-voucher-match data-voucher-id="${escapeHtml(voucher.id)}">${activeVoucherMatchId === voucher.id ? "收合配帳" : "配帳"}</button>
      </div>
      ${editPanel}
      ${matchPanel}
    </article>
  `;
}

function renderVoucherInfoHint(voucher) {
  if (!voucher.note) return "";

  return `
    <span class="voucher-info-hint" tabindex="0">
      <span class="voucher-info-label">! 發票資訊</span>
      <span class="voucher-info-popover">${escapeHtml(voucher.note)}</span>
    </span>
  `;
}

function renderVoucherEditPanel(voucher) {
  const links = Array.isArray(voucher.voucherLinks) ? voucher.voucherLinks.filter(Boolean).join("\n") : "";
  return `
    <div class="voucher-edit-panel" data-voucher-edit-panel="${escapeHtml(voucher.id)}">
      <label>
        <span>發票號碼</span>
        <input type="text" value="${escapeHtml(voucher.invoiceNumber || "")}" data-voucher-edit-field="invoiceNumber" placeholder="例如：ZX04555853" />
      </label>
      <label>
        <span>憑證日期</span>
        <input type="date" value="${escapeHtml(voucher.date || "")}" data-voucher-edit-field="date" />
      </label>
      <label>
        <span>交易對象</span>
        <input type="text" value="${escapeHtml(voucher.counterparty || "")}" data-voucher-edit-field="counterparty" placeholder="例如：供應商名稱" />
      </label>
      <label class="wide">
        <span>品項</span>
        <input type="text" value="${escapeHtml(voucher.item || "")}" data-voucher-edit-field="item" placeholder="例如：入財金3盒" />
      </label>
      <label>
        <span>憑證總金額</span>
        <input type="number" min="0" step="1" value="${escapeHtml(String(voucher.totalAmount || ""))}" data-voucher-edit-field="totalAmount" />
      </label>
      <label class="wide">
        <span>憑證連結</span>
        <textarea data-voucher-edit-field="voucherLinks" placeholder="一行一個 Google Drive 或發票連結">${escapeHtml(links)}</textarea>
      </label>
      <label class="wide">
        <span>發票資訊／備註</span>
        <textarea data-voucher-edit-field="note" placeholder="掃描錯誤、行政清單來源、待確認原因等">${escapeHtml(voucher.note || "")}</textarea>
      </label>
      <div class="voucher-edit-actions">
        <button type="button" data-voucher-save-edit data-voucher-id="${escapeHtml(voucher.id)}">儲存憑證</button>
        <button type="button" data-voucher-cancel-edit data-voucher-id="${escapeHtml(voucher.id)}">取消</button>
      </div>
    </div>
  `;
}

function renderVoucherLedgerMatchSummary(voucher) {
  const matches = Array.isArray(voucher.matches) ? voucher.matches : [];
  if (!matches.length) {
    return `
      <div class="voucher-ledger-summary empty">
        <strong>已配帳務</strong>
        <span>尚未配到任何收入／支出。</span>
      </div>
    `;
  }

  return `
    <div class="voucher-ledger-summary">
      <strong>已配帳務 ${matches.length} 筆</strong>
      <div class="voucher-ledger-list">
        ${matches.map(renderVoucherLedgerMatchRow).join("")}
      </div>
    </div>
  `;
}

function renderVoucherLedgerMatchRow(match) {
  const record = recordsCache.find((item) => item.id === match.ledgerId);
  const title = record?.item || "找不到原帳務";
  const type = record ? typeLabel(record.type) : "未知";
  const date = record?.date || "";
  const counterparty = record?.counterparty || "未填交易對象";
  const amount = Number(match.amount || 0);

  return `
    <div class="voucher-ledger-row ${record ? "" : "missing"}">
      <span>
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(date)} · ${escapeHtml(type)} · ${escapeHtml(counterparty)}</small>
      </span>
      <b>NT$ ${formatNumber(amount)}</b>
    </div>
  `;
}

function updateVoucherInboxFilter() {
  if (!voucherInboxFilter) return;

  const counts = getVoucherInboxFilterCounts();
  voucherInboxFilter.querySelectorAll("[data-voucher-filter]").forEach((button) => {
    const filter = button.dataset.voucherFilter || "open";
    button.classList.toggle("active", filter === voucherInboxStatusFilter);
    const label = getVoucherInboxFilterLabel(filter);
    button.textContent = `${label} ${counts[filter] || 0}`;
  });
}

function getVoucherInboxFilterCounts() {
  const counts = { open: 0, unmatched: 0, partial: 0, overmatched: 0, matched: 0, all: voucherInboxCache.length };
  voucherInboxCache.forEach((voucher) => {
    const status = getVoucherInboxStatusInfo(voucher).status;
    counts[status] += 1;
    if (status !== "matched") counts.open += 1;
  });
  return counts;
}

function getVoucherInboxFilterLabel(filter) {
  const labels = {
    open: "待處理",
    unmatched: "待配帳",
    partial: "部分配帳",
    overmatched: "金額異常",
    matched: "已配完",
    all: "全部",
  };
  return labels[filter] || labels.open;
}

function shouldShowVoucherInboxItem(voucher) {
  const status = getVoucherInboxStatusInfo(voucher).status;
  if (voucherInboxStatusFilter === "all") return true;
  if (voucherInboxStatusFilter === "open") return status !== "matched";
  return status === voucherInboxStatusFilter;
}

function getVoucherFilterEmptyText() {
  const label = getVoucherInboxFilterLabel(voucherInboxStatusFilter);
  return `目前沒有${label}憑證。`;
}

function getVoucherInboxStatusInfo(voucher) {
  const matchedAmount = getVoucherMatchedAmount(voucher);
  const totalAmount = Number(voucher.totalAmount || 0);
  const remainingAmount = Math.max(0, totalAmount - matchedAmount);
  if (totalAmount > 0 && matchedAmount > totalAmount) return { status: "overmatched", label: "金額異常" };
  if (remainingAmount <= 0 && totalAmount > 0) return { status: "matched", label: "已配完" };
  if (matchedAmount > 0) return { status: "partial", label: "部分配帳" };
  return { status: "unmatched", label: "待配帳" };
}

function renderVoucherMatchPanel(voucher, remainingAmount) {
  const voucherType = resolveVoucherRecordType(voucher);
  const voucherTypeLabel = voucherType === "income" ? "收入" : "支出";
  const candidates = recordsCache
    .filter((record) => !record.deletedAt && record.type === voucherType && Number(record.amount || 0) > 0)
    .filter((record) => !hasVoucherMatch(record, voucher.id))
    .slice(0, 40);

  if (!remainingAmount) {
    return `<div class="voucher-match-panel"><div class="empty-state">這張憑證已經配完。</div></div>`;
  }

  if (!candidates.length) {
    return `<div class="voucher-match-panel"><div class="empty-state">目前沒有可配對的${voucherTypeLabel}。</div></div>`;
  }

  return `
    <div class="voucher-match-panel" data-voucher-match-panel="${escapeHtml(voucher.id)}">
      <div class="voucher-match-head">
        <strong>選擇要核實的${voucherTypeLabel}帳務</strong>
        <span>只會顯示${voucherTypeLabel}，可多選，分配合計不可超過 NT$ ${formatNumber(remainingAmount)}</span>
      </div>
      <div class="voucher-match-list">
        ${candidates.map((record) => renderVoucherMatchCandidate(record, remainingAmount)).join("")}
      </div>
      <button type="button" data-voucher-apply-match data-voucher-id="${escapeHtml(voucher.id)}">套用配帳</button>
    </div>
  `;
}

function renderVoucherMatchCandidate(record, remainingAmount) {
  const suggestedAmount = Math.min(Number(record.amount || 0), remainingAmount);
  return `
    <label class="voucher-match-candidate">
      <input type="checkbox" data-match-record-id="${escapeHtml(record.id)}" />
      <span>
        <strong>${escapeHtml(record.item || "未命名交易")}</strong>
        <small>${escapeHtml(record.date || "")} · ${escapeHtml(typeLabel(record.type))} · ${escapeHtml(record.counterparty || "未填交易對象")} · NT$ ${formatNumber(record.amount)}</small>
      </span>
      <input type="number" min="0" step="1" value="${escapeHtml(String(suggestedAmount))}" data-match-amount-for="${escapeHtml(record.id)}" />
    </label>
  `;
}

function resolveVoucherRecordType(voucher) {
  if (voucher?.type === "income" || voucher?.recordType === "income" || voucher?.voucherDirection === "income") return "income";
  if (voucher?.type === "expense" || voucher?.recordType === "expense" || voucher?.voucherDirection === "expense") return "expense";

  const text = [
    voucher?.voucherType,
    voucher?.processResult,
    voucher?.sourceWorkbook,
    voucher?.sourceFileName,
    voucher?.note,
  ]
    .filter(Boolean)
    .join(" ");

  if (/銷項|收入|銷貨|開立|平台發票|我們開/.test(text)) return "income";
  return "expense";
}

function getVoucherMatchedAmount(voucher) {
  return (Array.isArray(voucher.matches) ? voucher.matches : []).reduce((sum, match) => sum + Number(match.amount || 0), 0);
}

function hasVoucherMatch(record, voucherId) {
  return (Array.isArray(record.voucherMatches) ? record.voucherMatches : []).some((match) => match.voucherId === voucherId);
}

function matchVoucherInbox(voucherId) {
  activeVoucherMatchId = activeVoucherMatchId === voucherId ? "" : voucherId;
  renderVoucherCenter();
}

async function applyVoucherMatches(voucherId) {
  const voucher = voucherInboxCache.find((item) => item.id === voucherId);
  const panel = voucherInboxList?.querySelector(`[data-voucher-match-panel="${CSS.escape(voucherId)}"]`);
  if (!voucher || !panel) return;

  const remainingAmount = Math.max(0, Number(voucher.totalAmount || 0) - getVoucherMatchedAmount(voucher));
  const selected = Array.from(panel.querySelectorAll("[data-match-record-id]:checked"))
    .map((checkbox) => {
      const recordId = checkbox.dataset.matchRecordId;
      const amountInput = panel.querySelector(`[data-match-amount-for="${CSS.escape(recordId)}"]`);
      return {
        recordId,
        amount: parseAmount(amountInput?.value || 0),
      };
    })
    .filter((match) => match.recordId && match.amount > 0);

  if (!selected.length) {
    showToast("請先勾選要配帳的交易。");
    return;
  }

  const totalSelected = selected.reduce((sum, match) => sum + match.amount, 0);
  if (totalSelected > remainingAmount) {
    showToast(`分配金額超過憑證剩餘 NT$ ${formatNumber(remainingAmount)}。`);
    return;
  }

  const voucherType = resolveVoucherRecordType(voucher);
  const hasWrongType = selected.some((match) => {
    const record = recordsCache.find((item) => item.id === match.recordId);
    return !record || record.type !== voucherType;
  });
  if (hasWrongType) {
    showToast(`這張憑證只能配${voucherType === "income" ? "收入" : "支出"}帳務。`);
    return;
  }

  const now = new Date();
  const newMatches = selected.map((match) => ({
    voucherId,
    ledgerId: match.recordId,
    amount: match.amount,
    invoiceNumber: voucher.invoiceNumber || "",
    matchedAt: now,
    matchedBy: currentUser?.email || "local-preview",
  }));
  const updatedVoucher = normalizeVoucherInboxAfterMatch(voucher, newMatches);

  await saveVoucherInboxUpdate(voucher, updatedVoucher);
  for (const match of newMatches) {
    const record = recordsCache.find((item) => item.id === match.ledgerId);
    if (!record) continue;
    await saveLedgerVoucherMatch(record, voucher, match);
  }

  activeVoucherMatchId = "";
  renderVoucherCenter();
  renderRecords(recordsCache);
  updateSummary(recordsCache);
  showToast("憑證已配到帳務。");
}

function normalizeVoucherInboxAfterMatch(voucher, newMatches) {
  const matches = [...(Array.isArray(voucher.matches) ? voucher.matches : []), ...newMatches];
  const matchedAmount = matches.reduce((sum, match) => sum + Number(match.amount || 0), 0);
  const remainingAmount = Math.max(0, Number(voucher.totalAmount || 0) - matchedAmount);
  return {
    ...voucher,
    matches,
    matchedAmount,
    remainingAmount,
    status: remainingAmount <= 0 ? "matched" : matchedAmount > 0 ? "partial" : "unmatched",
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
    updatedBy: currentUser?.email || "local-preview",
  };
}

async function saveVoucherInboxEdit(voucherId) {
  const voucher = voucherInboxCache.find((item) => item.id === voucherId);
  const panel = voucherInboxList?.querySelector(`[data-voucher-edit-panel="${CSS.escape(voucherId)}"]`);
  if (!voucher || !panel) return;

  const getFieldValue = (fieldName) => panel.querySelector(`[data-voucher-edit-field="${fieldName}"]`)?.value || "";
  const totalAmount = parseAmount(getFieldValue("totalAmount"));
  if (!totalAmount) {
    showToast("請填憑證總金額。");
    return;
  }

  const voucherLinks = getFieldValue("voucherLinks")
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean);
  const matches = Array.isArray(voucher.matches) ? voucher.matches : [];
  const matchedAmount = matches.reduce((sum, match) => sum + Number(match.amount || 0), 0);
  const remainingAmount = Math.max(0, totalAmount - matchedAmount);
  const updatedVoucher = {
    ...voucher,
    invoiceNumber: normalizeInvoiceNumber(getFieldValue("invoiceNumber")),
    date: getFieldValue("date") || voucher.date || toDateValue(new Date()),
    counterparty: getFieldValue("counterparty").trim(),
    item: getFieldValue("item").trim(),
    totalAmount,
    matchedAmount,
    remainingAmount,
    voucherLinks,
    note: getFieldValue("note").trim(),
    status: totalAmount > 0 && matchedAmount > totalAmount ? "overmatched" : remainingAmount <= 0 ? "matched" : matchedAmount > 0 ? "partial" : "unmatched",
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
    updatedBy: currentUser?.email || "local-preview",
  };

  await saveVoucherInboxUpdate(voucher, updatedVoucher);
  activeVoucherEditId = "";
  renderVoucherCenter();
  showToast("憑證資料已更新。");
}

async function saveVoucherInboxUpdate(previousVoucher, updatedVoucher) {
  await writeAuditLog("update", "voucherInbox", previousVoucher.id, previousVoucher, updatedVoucher);
  if (isConfigured) {
    const { id, ...payload } = updatedVoucher;
    await firebaseApi.updateDoc(firebaseApi.doc(db, "voucherInbox", previousVoucher.id), payload);
    await loadVoucherInbox();
    return;
  }

  voucherInboxCache = voucherInboxCache.map((item) => (item.id === previousVoucher.id ? updatedVoucher : item));
  saveLocalVoucherInbox();
}

async function saveLedgerVoucherMatch(record, voucher, match) {
  const voucherLinks = [
    ...new Set([
      ...(Array.isArray(record.voucherLinks) ? record.voucherLinks : []),
      ...(Array.isArray(voucher.voucherLinks) ? voucher.voucherLinks : []),
    ].filter(Boolean)),
  ];
  const voucherMatches = [...(Array.isArray(record.voucherMatches) ? record.voucherMatches : []), match];
  const updatedRecord = {
    ...record,
    invoiceNumber: voucher.invoiceNumber || record.invoiceNumber || "",
    invoiceRequired: true,
    voucherMatches,
    voucherLinks,
    hasVoucher: Boolean(voucherLinks.length || record.hasVoucher),
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
    updatedBy: currentUser?.email || "local-preview",
  };
  updatedRecord.pendingReason = resolveVoucherPendingReason(updatedRecord);

  await writeAuditLog("update", "ledgerRecords", record.id, record, updatedRecord);
  if (isConfigured) {
    const { id, ...payload } = updatedRecord;
    await firebaseApi.updateDoc(firebaseApi.doc(db, "ledgerRecords", record.id), payload);
    await loadRecords();
    return;
  }

  recordsCache = recordsCache.map((item) => (item.id === record.id ? updatedRecord : item));
  saveLocalRecords();
}

function buildVoucherRows() {
  const rows = [];

  recordsCache.forEach((record) => {
    const links = getVoucherLinks(record);
    const names = getVoucherNames(record);
    const hasVoucher = hasAttachedVoucher(record);
    const needsVoucher = recordNeedsVoucher(record);
    const hasInvoiceNumber = Boolean(normalizeInvoiceNumber(record.invoiceNumber));

    if (!needsVoucher && !hasVoucher) return;

    if (hasVoucher && hasInvoiceNumber) {
      rows.push({
        status: "已核實",
        tone: record.type === "income" ? "income" : "",
        date: record.date || "",
        title: record.item || "未命名交易",
        subject: `${typeLabel(record.type)} · ${record.counterparty || "未填對象"} · NT$ ${formatNumber(record.amount)}`,
        reason: `${record.cashflow || "未填金流"} / 發票號碼 ${record.invoiceNumber}`,
        action: "憑證檔與發票號碼都已掛在正式帳務，可核對內容是否一致。",
        voucherLinks: links,
        voucherCount: Math.max(links.length, names.length, 1),
        recordId: record.id,
        recordType: record.type,
      });
      return;
    }

    rows.push({
      status: hasVoucher ? "待補發票號碼" : "待補憑證",
      tone: "pending",
      date: record.date || "",
      title: record.item || "未命名交易",
      subject: `${typeLabel(record.type)} · ${record.counterparty || "未填對象"} · NT$ ${formatNumber(record.amount)}`,
      reason: hasVoucher ? "已有憑證檔，但還沒填發票號碼。" : record.pendingReason || "這筆正式帳目前沒有憑證。",
      action: hasVoucher ? "回收入／支出紀錄補上發票號碼。" : "回收入／支出紀錄補上發票或收據。",
      voucherLinks: links,
      voucherCount: hasVoucher ? Math.max(links.length, names.length, 1) : 0,
      recordId: record.id,
      recordType: record.type,
    });
  });

  lineDraftsCache
    .filter((draft) => !["confirmed", "ignored"].includes(draft.status))
    .forEach((draft) => {
      const links = getVoucherLinks(draft);
      const failed = draft.voucherUploadStatus === "failed";
      if (!links.length && !failed) return;

      rows.push({
        status: failed ? "上傳失敗" : "LINE待覆核",
        tone: failed ? "urgent" : "pending",
        date: draft.date || "",
        title: getLineDraftItem(draft),
        subject: `${draft.type === "income" ? "收入" : "支出"}草稿 · ${draft.counterparty || "未填對象"} · NT$ ${formatNumber(draft.amount)}`,
        reason: failed ? (draft.voucherUploadError || "憑證沒有成功上傳") : "憑證已上傳，但這筆 LINE 草稿尚未確認入帳。",
        action: failed ? "請重新上傳憑證，或先確認草稿後回正式紀錄補憑證。" : "前往待處理事項覆核，確認後會轉成正式流水帳。",
        voucherLinks: links,
        voucherUploadStatus: draft.voucherUploadStatus || "",
        voucherUploadError: draft.voucherUploadError || "",
        voucherCount: links.length,
        draftId: draft.id,
      });
    });

  return rows.sort(compareRecordsByDateAndCreatedTime);
}

function renderVoucherCenterRow(row) {
  const toneClass = row.tone || "";
  const target = row.draftId ? "pending" : "ledger";
  const label = row.draftId ? "覆核草稿" : "查看帳務";
  const canScan = Boolean(row.recordId && row.status !== "已核實");

  return `
    <article class="pending-item">
      <span class="pill ${toneClass}">${escapeHtml(row.status)}</span>
      <div>
        <strong>${escapeHtml(row.title)}</strong>
        <span>${escapeHtml(row.date)} · ${escapeHtml(row.subject)}</span>
        <small>${escapeHtml(row.reason)}</small>
        <small>${escapeHtml(row.action)}</small>
        ${renderVoucherLinkList(row)}
      </div>
      <div class="voucher-actions">
        ${canScan ? `<button type="button" data-voucher-scan data-record-id="${escapeHtml(row.recordId)}">掃描號碼</button>` : ""}
        <button type="button" data-pending-target="${target}" data-pending-type="${escapeHtml(row.recordType || "")}" data-record-id="${escapeHtml(row.recordId || "")}">${label}</button>
      </div>
    </article>
  `;
}

async function startVoucherOcr(recordId) {
  const record = recordsCache.find((item) => item.id === recordId);
  if (!record) {
    showToast("找不到要掃描的帳務。");
    return;
  }

  if (!window.Tesseract) {
    showToast("OCR 套件尚未載入，請確認網路後重新整理。");
    return;
  }

  currentVoucherOcrRecordId = recordId;
  voucherOcrPanel.hidden = false;
  voucherOcrStatus.textContent = `正在替「${record.item || "未命名交易"}」準備掃描，請選擇發票圖片。`;
  voucherOcrResults.innerHTML = "";
  voucherOcrInput.value = "";
  const uploadedVoucherRefs = getVoucherFileRefs(record);
  if (uploadedVoucherRefs.length) {
    voucherOcrStatus.textContent = "正在掃描這筆已上傳的憑證，不需要再選一次檔案...";
    try {
      const result = await scanUploadedVoucherFiles(uploadedVoucherRefs);
      if (hasVoucherScanErrors(result) && !(result.invoiceNumbers || result.candidates || []).length) {
        showVoucherOcrFallback(result);
        return;
      }
      renderVoucherOcrResults(result.invoiceNumbers || result.candidates || []);
      if (result.files?.length) renderVoucherOcrFileNotes(result.files);
      return;
    } catch (error) {
      voucherOcrStatus.textContent = "已上傳憑證暫時無法自動掃描，可以先改選本機圖片掃描。";
      voucherOcrResults.innerHTML = `<button type="button" data-voucher-ocr-pick-local>改選本機圖片掃描</button><small>${escapeHtml(error.message || String(error))}</small>`;
      return;
    }
  }

  voucherOcrStatus.textContent = "這筆帳目前沒有可掃描的已上傳憑證，請選擇本機圖片掃描。";
  voucherOcrInput.click();
}

async function handleVoucherOcrFile() {
  const file = voucherOcrInput?.files?.[0];
  if (!file || !currentVoucherOcrRecordId) return;

  if (!file.type.startsWith("image/")) {
    showToast("目前先支援圖片掃描，PDF 請先截圖或轉成圖片。");
    return;
  }

  voucherOcrPanel.hidden = false;
  voucherOcrStatus.textContent = "正在掃描發票號碼，圖片越清楚會越準...";
  voucherOcrResults.innerHTML = "";

  try {
    const candidates = await scanLocalImageForInvoiceNumbers(file);
    renderVoucherOcrResults(candidates);
  } catch (error) {
    voucherOcrStatus.textContent = "掃描失敗，請改用較清楚的照片或手動填入。";
    showToast(`掃描失敗：${error.message}`);
  }
}

async function scanLocalImageForInvoiceNumbers(file) {
  const variants = await buildImageScanVariants(file);
  const found = new Set();

  for (const variant of variants) {
    voucherOcrStatus.textContent = `正在掃描發票號碼：${variant.label}`;
    const result = await window.Tesseract.recognize(variant.blob, "eng", {
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      preserve_interword_spaces: "0",
    });
    extractInvoiceNumbers(result?.data?.text || "").forEach((number) => found.add(number));
    if (found.size) break;
  }

  return [...found];
}

async function buildImageScanVariants(file) {
  const image = await createImageBitmap(file);
  const variants = [];

  [0, 90, 180, 270].forEach((degrees) => {
    const fullCanvas = drawRotatedImage(image, degrees);
    variants.push({
      label: `${degrees} 度全圖`,
      blob: canvasToPngBlob(fullCanvas),
    });

    const topCrop = cropCanvas(fullCanvas, 0, 0, fullCanvas.width, Math.round(fullCanvas.height * 0.35));
    variants.push({
      label: `${degrees} 度上方區塊`,
      blob: canvasToPngBlob(topCrop),
    });
  });

  return Promise.all(
    variants.map(async (variant) => ({
      ...variant,
      blob: await variant.blob,
    })),
  );
}

function drawRotatedImage(image, degrees) {
  const normalizedDegrees = ((degrees % 360) + 360) % 360;
  const swap = normalizedDegrees === 90 || normalizedDegrees === 270;
  const maxSide = 2200;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const sourceWidth = Math.round(image.width * scale);
  const sourceHeight = Math.round(image.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = swap ? sourceHeight : sourceWidth;
  canvas.height = swap ? sourceWidth : sourceHeight;

  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((normalizedDegrees * Math.PI) / 180);
  context.drawImage(image, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);
  return canvas;
}

function cropCanvas(source, x, y, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, x, y, width, height, 0, 0, width, height);
  return canvas;
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("圖片轉換失敗"));
    }, "image/png");
  });
}

async function scanUploadedVoucherFiles(fileRefs) {
  if (!lineEndpointConfig.endpointUrl || !lineEndpointConfig.sharedSecret) {
    throw new Error("尚未設定 LINE 後端掃描網址");
  }

  const files = fileRefs
    .filter((file) => file.id || file.url)
    .slice(0, 6)
    .map((file) => ({
      id: file.id || "",
      url: file.url || file.webViewLink || "",
      name: file.name || "",
      mimeType: file.mimeType || "",
    }));

  if (!files.length) throw new Error("這筆憑證沒有可掃描的 Drive 檔案");

  return requestLineBackendJsonp({
    action: "scanInvoiceNumbers",
    secret: lineEndpointConfig.sharedSecret,
    files,
  });
}

function requestLineBackendJsonp(payload) {
  return new Promise((resolve, reject) => {
    const callbackName = `lineBackendCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("掃描逾時，請稍後再試"));
    }, 45000);

    const cleanup = () => {
      window.clearTimeout(timer);
      delete window[callbackName];
      script.remove();
    };

    window[callbackName] = (result) => {
      cleanup();
      if (!result?.ok) {
        reject(new Error(result?.error || "掃描失敗"));
        return;
      }
      resolve(result);
    };

    const url = new URL(lineEndpointConfig.endpointUrl);
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : String(value));
    });
    url.searchParams.set("callback", callbackName);

    script.onerror = () => {
      cleanup();
      reject(new Error("無法連到 LINE 後端掃描服務"));
    };
    script.src = url.toString();
    document.body.appendChild(script);
  });
}

function renderVoucherOcrFileNotes(files = []) {
  const notes = files
    .map((file) => {
      const name = file.name || file.id || "未命名憑證";
      const count = Array.isArray(file.invoiceNumbers) ? file.invoiceNumbers.length : 0;
      const status = file.error ? `失敗：${file.error}` : `掃到 ${count} 個號碼`;
      return `<small>${escapeHtml(name)}：${escapeHtml(status)}</small>`;
    })
    .join("");
  if (notes) voucherOcrResults.insertAdjacentHTML("beforeend", notes);
}

function hasVoucherScanErrors(result) {
  return Array.isArray(result?.files) && result.files.some((file) => file.error);
}

function showVoucherOcrFallback(result) {
  const errors = (result.files || [])
    .map((file) => file.error)
    .filter(Boolean);
  const isRateLimited = errors.some((error) => /rate limit|quota|exceeded/i.test(error));
  voucherOcrStatus.textContent = isRateLimited
    ? "Google OCR 暫時額度滿了，可以稍後再試，或先改用本機圖片掃描。"
    : "已上傳憑證暫時無法自動掃描，可以先改用本機圖片掃描。";
  voucherOcrResults.innerHTML = `
    <button type="button" data-voucher-ocr-pick-local>改選本機圖片掃描</button>
    ${errors.map((error) => `<small>${escapeHtml(error)}</small>`).join("")}
  `;
}

function extractInvoiceNumbers(text) {
  const normalizedText = String(text || "")
    .toUpperCase()
    .replace(/[Ｏ]/g, "O")
    .replace(/[０]/g, "0")
    .replace(/[１]/g, "1")
    .replace(/[２]/g, "2")
    .replace(/[３]/g, "3")
    .replace(/[４]/g, "4")
    .replace(/[５]/g, "5")
    .replace(/[６]/g, "6")
    .replace(/[７]/g, "7")
    .replace(/[８]/g, "8")
    .replace(/[９]/g, "9");

  const matches = normalizedText.match(/[A-Z]{2}[\s-]*\d[\d\s-]{7,}/g) || [];
  return [...new Set(matches.map((value) => value.replace(/[\s-]/g, "")).filter((value) => /^[A-Z]{2}\d{8}$/.test(value)))];
}

function renderVoucherOcrResults(candidates) {
  if (!candidates.length) {
    voucherOcrStatus.textContent = "沒有掃到明確的發票號碼，請換一張清楚照片或回帳務手動填入。";
    voucherOcrResults.innerHTML = "";
    return;
  }

  voucherOcrStatus.textContent = `偵測到 ${candidates.length} 個可能的發票號碼，請選擇正確的一個套用。`;
  voucherOcrResults.innerHTML = candidates
    .map((candidate) => `
      <button type="button" data-apply-invoice-number="${escapeHtml(candidate)}">${escapeHtml(candidate)}</button>
    `)
    .join("");
}

async function applyScannedInvoiceNumber(invoiceNumber) {
  const record = recordsCache.find((item) => item.id === currentVoucherOcrRecordId);
  if (!record) {
    showToast("找不到要套用的帳務。");
    return;
  }

  const normalizedInvoiceNumber = normalizeInvoiceNumber(invoiceNumber);
  if (!normalizedInvoiceNumber) return;

  const updatedRecord = {
    ...record,
    invoiceNumber: normalizedInvoiceNumber,
    invoiceRequired: true,
  };
  updatedRecord.pendingReason = resolveVoucherPendingReason(updatedRecord);

  try {
    await updateLedgerRecordFields(record, updatedRecord);
    closeVoucherOcrPanel();
    showToast(`已套用發票號碼：${normalizedInvoiceNumber}`);
  } catch (error) {
    showToast(`套用失敗：${error.message}`);
  }
}

function closeVoucherOcrPanel() {
  currentVoucherOcrRecordId = "";
  if (voucherOcrPanel) voucherOcrPanel.hidden = true;
  if (voucherOcrStatus) voucherOcrStatus.textContent = "選擇發票圖片後，系統會在電腦瀏覽器辨識號碼。";
  if (voucherOcrResults) voucherOcrResults.innerHTML = "";
  if (voucherOcrInput) voucherOcrInput.value = "";
}

function buildPendingItems() {
  const items = [];

  lineDraftsCache
    .filter((draft) => !["confirmed", "ignored"].includes(draft.status))
    .forEach((draft) => {
      const typeText = draft.type === "income" ? "收入" : "支出";
      const draftItem = getLineDraftItem(draft);
      items.push({
        group: "lineDraft",
        title: "LINE 草稿",
        date: draft.date || toDateValue(new Date()),
        subject: draftItem || `${typeText}草稿`,
        reason: `${typeText} NT$ ${formatNumber(draft.amount)}，等待確認入帳。`,
        action: "確認後會轉成正式收入／支出；略過後不再提醒。",
        targetView: "pending",
        targetType: "",
        draftId: draft.id,
        voucherLinks: getVoucherLinks(draft),
        voucherUploadStatus: draft.voucherUploadStatus || "",
        voucherUploadError: draft.voucherUploadError || "",
      });
    });

  recordsCache.forEach((record) => {
    if (record.pendingReason) {
      items.push(createPendingItem("voucher", record.pendingReason, record.date, record.item, record.pendingReason, "回收入／支出紀錄補上發票、收據或發票號碼。", "ledger", record.type, record.id));
    }

    if (record.voucherBatchStatus) {
      items.push(createPendingItem("voucher", "批次憑證待配對", record.date, record.item, "多張憑證尚未逐筆配對", "確認這批憑證分別對應哪些交易。", "ledger", record.type, record.id));
    }

    if (record.type === "income" && !record.inventoryLinks?.length) {
      items.push(createPendingItem("inventory", "收入待配庫存", record.date, record.item, "尚未選取售出庫存", "在收入紀錄下方勾選一筆或多筆庫存來源。", "ledger", "income", record.id));
    }

    const bucket = classifyCashflowRecord(record);
    if (bucket === "platformPending") {
      items.push(createPendingItem("cashflow", "平台待撥款", record.date, record.item, "尚未與銀行入帳核對", "銀行對帳單匯入後確認實際撥款日期與金額。", "cashflow"));
    }

    if (bucket === "shareholderAdvance") {
      items.push(createPendingItem("cashflow", "股東代墊未沖", record.date, record.item, "已刷卡代墊，尚待公司轉出沖銷", "公司存摺出現張晟睿墊付款後再核對。", "cashflow"));
    }

    const settlementItem = buildSettlementPendingItem(record);
    if (settlementItem) items.push(settlementItem);
  });

  inventoryCache.forEach((record) => {
    if (!Number(record.totalCost || 0)) {
      items.push(createPendingItem("cost", "庫存待補成本", record.date, record.name, "成本為 0 或尚未輸入", "補上單位成本或總成本，毛利才會準。", "inventory"));
    }
  });

  bankTransactionsCache.forEach((transaction) => {
    if (transaction.status === "待辨識") {
      items.push(createPendingItem(
        "cashflow",
        "存摺照片待辨識",
        transaction.date,
        transaction.sourceFile || transaction.description || "存摺照片",
        transaction.pendingReason || "照片尚未辨識",
        "先人工確認日期、摘要、存入、提出與餘額，再進行銀行核對。",
        "cashflow",
      ));
    } else if (transaction.status === "待核對" || transaction.pendingReason) {
      items.push(createPendingItem(
        "cashflow",
        "銀行交易待核對",
        transaction.date,
        transaction.description || transaction.sourceFile || "銀行交易",
        transaction.pendingReason || "尚未配對帳務",
        "與收入、支出、平台撥款或代墊還款配對。",
        "cashflow",
      ));
    }
  });

  return items
    .map((item) => (item.group === "lineDraft" ? { ...item, priority: 90, status: "LINE 草稿" } : enrichPendingItem(item)))
    .sort((a, b) => b.priority - a.priority || String(a.date).localeCompare(String(b.date)));
}

function buildSettlementPendingItem(record) {
  const isReceivable = isReceivableRecord(record);
  const isPayable = isPayableRecord(record);
  if (!isReceivable && !isPayable) return null;

  const title = isReceivable ? "應收待處理" : "應付待處理";
  const action = isReceivable ? "確認實際收款日，或補上預計收款日。" : "確認實際付款日，或補上預計付款日。";

  if (!record.dueDate) {
    return createPendingItem("settlement", title, record.date, record.item, "尚未填帳期／預計日期", action, "ledger", record.type, record.id);
  }

  const today = toDateValue(new Date());
  if (record.dueDate < today) {
    return createPendingItem("settlement", title, record.dueDate, record.item, "已逾期未結清", action, "ledger", record.type, record.id);
  }

  const soon = new Date(`${today}T00:00:00`);
  soon.setDate(soon.getDate() + 7);
  if (record.dueDate <= toDateValue(soon)) {
    return createPendingItem("settlement", title, record.dueDate, record.item, "7 天內到期", action, "ledger", record.type, record.id);
  }

  return null;
}

function createPendingItem(group, title, date, subject, reason, action, targetView, targetType = "", recordId = "") {
  return { group, title, date, subject, reason, action, targetView, targetType, recordId };
}

function enrichPendingItem(item) {
  const reason = item.reason || "";
  const today = toDateValue(new Date());
  let priority = 20;
  let status = "待處理";

  if (/逾期/.test(reason)) {
    priority = 100;
    status = "逾期";
  } else if (/7 天內|到期/.test(reason)) {
    priority = 85;
    status = "近期到期";
  } else if (item.group === "cashflow") {
    priority = 75;
    status = "待核對";
  } else if (item.group === "inventory") {
    priority = 70;
    status = "待配庫存";
  } else if (item.group === "voucher") {
    priority = 55;
    status = "待補憑證";
  } else if (item.group === "cost") {
    priority = 50;
    status = "待補成本";
  } else if (item.group === "settlement") {
    priority = 65;
    status = item.date && item.date <= today ? "今日以前" : "待收付";
  }

  return { ...item, priority, status };
}

function renderPendingItem(item) {
  if (item.group === "lineDraft") {
    return `
      <article class="pending-item urgent">
        <span class="pill urgent">LINE 草稿</span>
        <div>
          <strong>${escapeHtml(item.title)}：${escapeHtml(item.subject)}</strong>
          <span>${escapeHtml(item.date)} · ${escapeHtml(item.reason)}</span>
          <small>${escapeHtml(item.action)}</small>
          ${renderVoucherLinkList(item)}
        </div>
        <div class="record-actions">
          <button type="button" data-line-draft-action="confirm" data-draft-id="${escapeHtml(item.draftId)}">確認入帳</button>
          <button type="button" class="danger" data-line-draft-action="ignore" data-draft-id="${escapeHtml(item.draftId)}">略過</button>
        </div>
      </article>
    `;
  }

  const toneClass = item.priority >= 80 ? "urgent" : item.group === "inventory" ? "income" : item.group === "cashflow" ? "pending" : "";
  return `
    <article class="pending-item ${item.priority >= 80 ? "urgent" : ""}">
      <span class="pill ${toneClass}">${escapeHtml(item.status)}</span>
      <div>
        <strong>${escapeHtml(item.title)}｜${escapeHtml(item.subject)}</strong>
        <span>${escapeHtml(item.date)} · ${escapeHtml(item.reason)}</span>
        <small>${escapeHtml(item.action)}</small>
      </div>
      <button type="button" data-pending-target="${escapeHtml(item.targetView)}" data-pending-type="${escapeHtml(item.targetType)}" data-record-id="${escapeHtml(item.recordId || "")}">前往處理</button>
    </article>
  `;
}

function renderSettlementCenter() {
  if (!settlementList) return;

  const rows = recordsCache
    .filter((record) => isReceivableRecord(record) || isPayableRecord(record))
    .sort((a, b) => String(a.dueDate || a.date).localeCompare(String(b.dueDate || b.date)));

  if (!rows.length) {
    settlementList.className = "pending-list empty-state";
    settlementList.textContent = "目前沒有待核對的收付款。";
    return;
  }

  settlementList.className = "pending-list";
  settlementList.innerHTML = rows.map(renderSettlementItem).join("");
}

function renderSettlementItem(record) {
  const isIncome = record.type === "income";
  const title = isIncome ? "應收" : "應付";
  const actionLabel = isIncome ? "標記已收" : "標記已付";
  const dueLabel = record.dueDate ? `預計 ${record.dueDate}` : "未填預計日";
  const basis = describeReceivablePayableBasis(record);

  return `
    <article class="pending-item">
      <span class="pill ${isIncome ? "income" : "pending"}">${title}</span>
      <div>
        <strong>${escapeHtml(record.item)}</strong>
        <span>${escapeHtml(record.counterparty)} · ${escapeHtml(dueLabel)} · NT$ ${formatNumber(record.amount)}</span>
        <small>${escapeHtml(record.settlementStatus || basis)} · 後續可與銀行對帳單配對</small>
      </div>
      <button type="button" data-settlement-action="settle" data-record-id="${escapeHtml(record.id)}">${actionLabel}</button>
    </article>
  `;
}

async function settleLedgerRecord(record) {
  const today = toDateValue(new Date());
  const settlementStatus = record.type === "income" ? "已收款" : "已付款";
  const confirmed = window.confirm(
    `確定將這筆${record.type === "income" ? "收入" : "支出"}標記為${record.type === "income" ? "已收款" : "已付款"}嗎？\n\n${record.item}\nNT$ ${formatNumber(record.amount)}\n實際日期：${today}`,
  );
  if (!confirmed) return;

  if (isConfigured) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, "ledgerRecords", record.id), {
      settlementStatus,
      settledDate: today,
      updatedAt: firebaseApi.serverTimestamp(),
    });
    await loadRecords();
  } else {
    recordsCache = recordsCache.map((item) =>
      item.id === record.id
        ? { ...item, settlementStatus, settledDate: today, updatedAt: new Date() }
        : item,
    );
    saveLocalRecords();
  }

  renderRecords(recordsCache);
  updateSummary(recordsCache);
  renderCustomReport();
  renderCashflow();
  renderPendingCenter();
  renderSettlementCenter();
  showToast(`${record.type === "income" ? "收款" : "付款"}狀態已更新。`);
}

function setDefaultInventoryDate() {
  const today = new Date();
  const year = Math.min(Math.max(today.getFullYear(), 2026), 2035);
  inventoryDateInput.value = `${year}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function renderInventorySources() {
  const sources = inventorySources[inventoryTypeSelect.value] || inventorySources.box;
  inventorySourceSelect.innerHTML = sources.map((source) => `<option value="${source}">${source}</option>`).join("");
}

function syncInventoryTotalCost() {
  const qty = Number(inventoryQtyInput.value || 0);
  const unitCost = Number(inventoryUnitCostInput.value || 0);
  if (qty > 0 && unitCost >= 0) {
    inventoryTotalCostInput.value = qty * unitCost || "";
  }
}

function buildInventoryRecord() {
  const date = inventoryDateInput.value;
  const quantity = Number(inventoryQtyInput.value || 0);
  const unitCost = Number(inventoryUnitCostInput.value || 0);
  const totalCost = Number(inventoryTotalCostInput.value || quantity * unitCost || 0);

  if (!date || date < "2026-01-01" || date > "2035-12-31") {
    showToast("請選擇 2026-2035 之間的庫存日期。");
    return null;
  }

  if (!inventoryNameInput.value.trim()) {
    showToast("請輸入品名／卡名。");
    return null;
  }

  if (!quantity || quantity <= 0) {
    showToast("請輸入大於 0 的庫存數量。");
    return null;
  }

  return {
    date,
    month: date.slice(0, 7).replace("-", ""),
    type: inventoryTypeSelect.value,
    action: inventoryActionSelect.value,
    source: inventorySourceSelect.value,
    name: inventoryNameInput.value.trim(),
    quantity,
    unitCost,
    totalCost,
    reference: inventoryReferenceInput.value.trim(),
    note: inventoryNoteInput.value.trim(),
  };
}

async function saveInventoryRecord(record) {
  if (editingInventoryId) {
    await updateInventoryRecord(record);
    return;
  }

  await addInventoryRecord(record);
  if (isConfigured) await loadInventoryRecords();
}

async function updateInventoryRecord(record) {
  const payload = {
    ...record,
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  };

  const previousRecord = inventoryCache.find((item) => item.id === editingInventoryId);
  await writeAuditLog("update", "inventoryRecords", editingInventoryId, previousRecord, payload);

  if (isConfigured) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, "inventoryRecords", editingInventoryId), payload);
    await loadInventoryRecords();
  } else {
    inventoryCache = inventoryCache.map((item) =>
      item.id === editingInventoryId ? { ...item, ...payload } : item,
    );
    saveLocalInventoryRecords();
    renderInventory();
  }

  editingInventoryId = null;
  saveInventoryButton.textContent = "儲存庫存";
  renderRecords(recordsCache);
  renderCustomReport();
  renderCashflow();
  renderPendingCenter();
  renderSettlementCenter();
}

async function loadInventoryRecords() {
  if (!currentUser || !db) return;

  const snapshot = await firebaseApi.getDocs(
    firebaseApi.query(
      firebaseApi.collection(db, "inventoryRecords"),
      firebaseApi.where("userId", "==", currentUser.uid),
      firebaseApi.limit(200),
    ),
  );
  inventoryCache = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((record) => !record.deletedAt)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  renderInventory();
  renderRecords(recordsCache);
  renderLedgerInventorySync();
  renderPendingCenter();
  renderSettlementCenter();
}

async function handleInventoryMatch(record, button) {
  const panel = button.closest(".inventory-match-panel");
  const availableLots = getAvailableInventoryLots();
  const selected = Array.from(panel.querySelectorAll("[data-inventory-match-id]:checked")).map((checkbox) => {
    const lot = availableLots.find((item) => item.id === checkbox.dataset.inventoryMatchId);
    const qtyInput = panel.querySelector(`[data-inventory-match-qty="${CSS.escape(checkbox.dataset.inventoryMatchId)}"]`);
    return { lot, quantity: Number(qtyInput?.value || 0) };
  });

  if (!selected.length) {
    showToast("請先勾選要出庫的庫存。");
    return;
  }

  if (selected.some((item) => !item.lot || item.quantity <= 0 || item.quantity > item.lot.remainingQuantity)) {
    showToast("請確認出庫數量不可超過可用庫存。");
    return;
  }

  const links = [];
  for (const item of selected) {
    const unitCost = Number(item.lot.unitCost || item.lot.totalCost / item.lot.quantity || 0);
    const outRecord = {
      date: record.date,
      month: record.date.slice(0, 7).replace("-", ""),
      type: item.lot.type,
      action: "out",
      source: "銷售出庫",
      name: item.lot.name,
      quantity: item.quantity,
      unitCost,
      totalCost: unitCost * item.quantity,
      reference: `收入：${record.item}`,
      note: `由收入紀錄配對出庫；原庫存來源：${item.lot.source}`,
      linkedLedgerId: record.id,
      sourceInventoryId: item.lot.id,
    };
    const savedId = await addInventoryRecord(outRecord);
    links.push({
      inventoryRecordId: savedId,
      sourceInventoryId: item.lot.id,
      name: item.lot.name,
      type: item.lot.type,
      quantity: item.quantity,
      unitCost,
      totalCost: unitCost * item.quantity,
    });
  }

  await updateLedgerInventoryLinks(record, links);
  await loadInventoryRecords();
  if (isConfigured) await loadRecords();
  else renderRecords(recordsCache);
  updateSummary(recordsCache);
  renderCustomReport();
  renderCashflow();
  renderPendingCenter();
  renderSettlementCenter();
  showToast(`已配對 ${links.length} 筆庫存並建立出庫。`);
}

async function addInventoryRecord(record) {
  if (isConfigured) {
    const docRef = await firebaseApi.addDoc(firebaseApi.collection(db, "inventoryRecords"), {
      ...record,
      createdAt: firebaseApi.serverTimestamp(),
      createdBy: currentUser.email,
      userId: currentUser.uid,
    });
    return docRef.id;
  }

  const id = crypto.randomUUID();
  inventoryCache.unshift({ id, ...record, createdAt: new Date() });
  saveLocalInventoryRecords();
  renderInventory();
  renderRecords(recordsCache);
  renderLedgerInventorySync();
  return id;
}

function startEditingInventoryRecord(record) {
  editingInventoryId = record.id;
  inventoryDateInput.value = record.date || "";
  inventoryTypeSelect.value = record.type || "box";
  renderInventorySources();
  inventoryActionSelect.value = record.action || "in";
  inventorySourceSelect.value = record.source || inventorySourceSelect.value;
  inventoryNameInput.value = record.name || "";
  inventoryQtyInput.value = record.quantity || "";
  inventoryUnitCostInput.value = record.unitCost || "";
  inventoryTotalCostInput.value = record.totalCost || "";
  inventoryReferenceInput.value = record.reference || "";
  inventoryNoteInput.value = record.note || "";
  saveInventoryButton.textContent = "更新庫存";
  inventoryForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleDeleteInventoryRecord(record) {
  const linkedOutCount = inventoryCache.filter((item) => item.sourceInventoryId === record.id).length;
  const confirmed = window.confirm(
    `確定要刪除這筆庫存紀錄嗎？\n\n品名：${record.name}\n數量：${formatNumber(record.quantity)}\n成本：NT$ ${formatNumber(record.totalCost)}${
      linkedOutCount ? `\n\n提醒：已有 ${linkedOutCount} 筆出庫紀錄連到這筆資料，刪除後請重新檢查收入配庫存。` : ""
    }`,
  );
  if (!confirmed) return;

  if (isConfigured) {
    await softDeleteRecord("inventoryRecords", record.id, record);
    await loadInventoryRecords();
  } else {
    inventoryCache = inventoryCache.filter((item) => item.id !== record.id);
    saveLocalInventoryRecords();
    renderInventory();
    renderRecords(recordsCache);
  }

  renderCustomReport();
  renderCashflow();
  renderPendingCenter();
  renderSettlementCenter();
  showToast("庫存紀錄已移到刪除紀錄。");
}

async function updateLedgerInventoryLinks(record, links) {
  const nextLinks = [...(record.inventoryLinks || []), ...links];

  if (isConfigured) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, "ledgerRecords", record.id), {
      inventoryLinks: nextLinks,
      inventoryStatus: "已配庫存",
      productCost: nextLinks.reduce((total, link) => total + Number(link.totalCost || 0), 0),
      updatedAt: firebaseApi.serverTimestamp(),
    });
    return;
  }

  recordsCache = recordsCache.map((item) =>
    item.id === record.id
      ? {
          ...item,
          inventoryLinks: nextLinks,
          inventoryStatus: "已配庫存",
          productCost: nextLinks.reduce((total, link) => total + Number(link.totalCost || 0), 0),
        }
      : item,
  );
  saveLocalRecords();
}

function clearInventoryForm() {
  inventoryForm.reset();
  editingInventoryId = null;
  saveInventoryButton.textContent = "儲存庫存";
  setDefaultInventoryDate();
  renderInventorySources();
}

function renderInventory() {
  const summary = buildInventorySummary(inventoryCache);
  inventorySummary.innerHTML = `
    <div class="inventory-summary-grid">
      <article class="inventory-card">
        <span>卡盒庫存</span>
        <strong>${formatNumber(summary.boxQty)} 盒</strong>
      </article>
      <article class="inventory-card">
        <span>卡片庫存</span>
        <strong>${formatNumber(summary.cardQty)} 張</strong>
      </article>
      <article class="inventory-card">
        <span>包材庫存</span>
        <strong>${formatNumber(summary.supplyQty)} 件</strong>
      </article>
      <article class="inventory-card">
        <span>庫存成本</span>
        <strong>NT$ ${formatNumber(summary.totalCost)}</strong>
      </article>
      <article class="inventory-card">
        <span>待成本確認</span>
        <strong>${formatNumber(summary.pendingCost)} 筆</strong>
      </article>
    </div>
  `;

  if (!inventoryCache.length) {
    inventoryList.className = "inventory-list empty-state";
    inventoryList.textContent = "尚無庫存紀錄";
    return;
  }

  inventoryList.className = "inventory-list";
  inventoryList.innerHTML = sortInventoryRecordsByTime(inventoryCache).map(renderInventoryRecord).join("");
}

function buildInventorySummary(records) {
  return records.reduce(
    (summary, record) => {
      const direction = record.action === "out" ? -1 : 1;
      const qty = Number(record.quantity || 0) * direction;
      const cost = Number(record.totalCost || 0) * direction;
      if (record.type === "box") summary.boxQty += qty;
      if (record.type === "card") summary.cardQty += qty;
      if (record.type === "supply") summary.supplyQty += qty;
      summary.totalCost += cost;
      if (!Number(record.totalCost || 0)) summary.pendingCost += 1;
      return summary;
    },
    { ...getInventoryOpening(), pendingCost: 0 },
  );
}

function getInventoryOpening() {
  return {
    boxQty: Number(inventoryOpeningBoxQtyInput.value || 0),
    cardQty: Number(inventoryOpeningCardQtyInput.value || 0),
    supplyQty: 0,
    totalCost: Number(inventoryOpeningCostInput.value || 0),
  };
}

function getAvailableInventoryLots() {
  const outboundBySource = new Map();
  inventoryCache
    .filter((record) => record.action === "out" && record.sourceInventoryId && isSalesInventoryOut(record))
    .forEach((record) => {
      outboundBySource.set(
        record.sourceInventoryId,
        Number(outboundBySource.get(record.sourceInventoryId) || 0) + Number(record.quantity || 0),
      );
    });

  return inventoryCache
    .filter((record) => record.action !== "out")
    .map((record) => {
      const remainingQuantity = Number(record.quantity || 0) - Number(outboundBySource.get(record.id) || 0);
      return { ...record, remainingQuantity };
    })
    .filter((record) => record.remainingQuantity > 0)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function isSalesInventoryOut(record) {
  if (!record.linkedLedgerId) return false;
  const linkedRecord = recordsCache.find((item) => item.id === record.linkedLedgerId);
  if (linkedRecord) return linkedRecord.type === "income";
  return /銷售出庫|售出|收入/.test(`${record.source || ""} ${record.reference || ""} ${record.note || ""}`);
}

function renderInventoryRecord(record) {
  const direction = record.action === "out" ? "-" : "+";
  const unit = inventoryUnitLabels[record.type] || "件";
  return `
    <article class="inventory-row">
      <span class="pill ${record.type === "card" ? "income" : ""}">${inventoryTypeLabels[record.type]}</span>
      <div>
        <strong>${escapeHtml(record.name)}</strong>
        <span>${escapeHtml(record.source)} · ${escapeHtml(record.reference || "無關聯來源")}</span>
      </div>
      <strong>${direction}${formatNumber(record.quantity)} ${unit}</strong>
      <span>NT$ ${formatNumber(record.totalCost)}</span>
      <span>${escapeHtml(record.date)} · ${inventoryActionLabels[record.action]}</span>
      <div class="record-actions">
        <button type="button" data-inventory-action="edit" data-inventory-id="${escapeHtml(record.id)}">修改</button>
        <button type="button" class="danger" data-inventory-action="delete" data-inventory-id="${escapeHtml(record.id)}">刪除</button>
      </div>
    </article>
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
  appendSheet(workbook, "損益", buildIncomeStatementSheet());
  appendSheet(workbook, "庫存表", buildInventoryReportSheet());
  appendSheet(workbook, "公司資產及負債", buildAssetsLiabilitiesSheet());
  appendSheet(workbook, "憑證核對表", buildVoucherReconciliationSheet());
  appendSheet(workbook, "分錄草稿", buildJournalDraftSheet());
  window.XLSX.writeFile(workbook, `${lastReportSummary.start}_${lastReportSummary.end}_內帳報表.xlsx`);
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
    ["日期", "類型", "交易對象", "摘要", "收入", "營業費用／成本", "商品成本", "金流／物流成本", "三級科目", "含稅／總額", "未稅金額", "金流方式", "帳戶", "收付款狀態", "預計收付款日", "實際收付款日", "發票狀態", "發票號碼", "待處理原因", "備註", "來源"],
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
        record.settlementStatus || "",
        record.dueDate || "",
        record.settledDate || "",
        record.invoiceStatus || (record.hasVoucher ? "有" : "無"),
        record.invoiceNumber || "",
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
        rows.push([no, record.date, "金流／物流／平台成本", "5102 銷貨成本", "2102 其他應付款", Number(record.logisticsCost || 0), record.importSource || "網頁輸入", "內帳視為銷售直接成本，待會計師確認正式科目"]);
      }
    } else {
      rows.push([no, record.date, record.item, inferAccountCode(record), inferCreditAccount(record), Number(record.amount || 0), record.importSource || "網頁輸入", record.pendingReason || ""]);
    }
    index += 1;
  });
  getShareholderRepaymentTransactions(lastReportSummary.start, lastReportSummary.end).forEach((transaction) => {
    const no = `B${String(index).padStart(4, "0")}`;
    rows.push([
      no,
      transaction.date,
      transaction.description || "股東代墊還款",
      "3102 業主往來／股東代墊",
      "1102 銀行存款",
      Number(transaction.withdrawal || transaction.deposit || 0),
      transaction.sourceFile || "銀行對帳單",
      "依銀行交易標記為代墊還款，沖銷股東代墊餘額；待會計師確認正式科目。",
    ]);
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

function buildVoucherReconciliationSheet() {
  const reportRecordIds = new Set(lastReportRows.map((record) => record.id).filter(Boolean));
  const vouchers = voucherInboxCache
    .filter((voucher) => isVoucherInReportRange(voucher, reportRecordIds))
    .sort(compareRecordsByDateAndCreatedTime);

  return [
    [`${lastReportSummary.start} 至 ${lastReportSummary.end} 憑證核對表`],
    [],
    [
      "憑證狀態",
      "憑證類型",
      "發票號碼",
      "憑證日期",
      "交易對象",
      "品項",
      "憑證總額",
      "已配帳金額",
      "剩餘／超配金額",
      "配帳筆數",
      "配到的帳務",
      "憑證連結",
      "備註",
      "來源",
    ],
    ...vouchers.map((voucher) => {
      const matchedAmount = getVoucherMatchedAmount(voucher);
      const totalAmount = Number(voucher.totalAmount || 0);
      const remainingAmount = totalAmount - matchedAmount;
      const statusInfo = getVoucherInboxStatusInfo(voucher);
      const matches = Array.isArray(voucher.matches) ? voucher.matches : [];
      const matchedRecordsText = matches.length
        ? matches.map((match) => formatVoucherReportMatch(match)).join("\n")
        : "尚未配帳";
      const links = Array.isArray(voucher.voucherLinks) ? voucher.voucherLinks.filter(Boolean).join("\n") : "";

      return [
        statusInfo.label,
        resolveVoucherRecordType(voucher) === "income" ? "銷項收入憑證" : "進項支出憑證",
        voucher.invoiceNumber || "",
        voucher.date || "",
        voucher.counterparty || "",
        voucher.item || "",
        totalAmount,
        matchedAmount,
        remainingAmount,
        matches.length,
        matchedRecordsText,
        links,
        voucher.note || "",
        voucher.sourceWorkbook || voucher.source || "手動建立",
      ];
    }),
  ];
}

function isVoucherInReportRange(voucher, reportRecordIds) {
  const date = voucher.date || "";
  const inVoucherDateRange = date >= lastReportSummary.start && date <= lastReportSummary.end;
  if (inVoucherDateRange) return true;

  const matches = Array.isArray(voucher.matches) ? voucher.matches : [];
  return matches.some((match) => reportRecordIds.has(match.ledgerId));
}

function formatVoucherReportMatch(match) {
  const record = recordsCache.find((item) => item.id === match.ledgerId);
  const amount = Number(match.amount || 0);
  if (!record) return `找不到原帳務｜NT$ ${formatNumber(amount)}`;

  return [
    record.date || "",
    typeLabel(record.type),
    record.counterparty || "未填交易對象",
    record.item || "未命名交易",
    `配帳 NT$ ${formatNumber(amount)}`,
  ].join("｜");
}

function buildIncomeStatementSheet() {
  const salesIncome = lastReportSummary.salesIncome;
  const productCost = lastReportSummary.productCost;
  const logisticsCost = lastReportSummary.logisticsCost;
  const packagingCost = lastReportSummary.packagingCost;
  const operatingExpense = lastReportSummary.operatingExpense;
  return [
    [`${lastReportSummary.start} 至 ${lastReportSummary.end} 損益表草稿`],
    [],
    ["項目", "金額", "說明"],
    ["銷售收入", salesIncome, "僅納入已售出商品相關收入；其他收入不列入毛利率分母"],
    ["已售商品成本", productCost, "依收入配對出庫成本或匯入銷售報表商品成本"],
    ["已售金流／物流／平台成本", logisticsCost, "依銷售收入對應的金流、物流、平台成本；銀行配帳差額若標記為銷貨成本也列入"],
    ["已售包材成本", packagingCost, "依收入配對出庫的包材成本或銷售報表包材成本"],
    ["毛利", { f: "B4-B5-B6-B7" }, "銷售收入減已售商品成本、金流物流成本與包材"],
    ["毛利率", { f: "IF(B4=0,0,B8/B4)" }, "毛利除以銷售收入"],
    ["營業費用", operatingExpense, "僅納入區間內支出大類為營業費用的紀錄"],
    ["營業損益", { f: "B8-B10" }, "毛利減營業費用"],
    ["淨利率", { f: "IF(B4=0,0,B11/B4)" }, "營業損益除以銷售收入"],
    ["本期損益", { f: "B11" }, "未含折舊、期末調整及所得稅"],
  ];
}

function buildInventoryReportSheet() {
  const start = lastReportSummary.start;
  const end = lastReportSummary.end;
  const summary = buildInventorySummary(inventoryCache);
  const inRange = (record) => record.date >= start && record.date <= end;

  return [
    [`${start} 至 ${end} 庫存表`],
    [],
    ["庫存摘要"],
    ["項目", "數量／金額", "單位", "說明"],
    ["卡盒庫存", summary.boxQty, "盒", "期初加入庫減出庫"],
    ["卡片庫存", summary.cardQty, "張", "期初加入庫減出庫"],
    ["包材庫存", summary.supplyQty, "件", "入庫減出庫"],
    ["庫存成本", summary.totalCost, "TWD", "期初成本加庫存異動成本"],
    ["待成本確認", summary.pendingCost, "筆", "成本為 0 或未輸入的庫存紀錄"],
    [],
    ["庫存明細"],
    ["日期", "類型", "動作", "品名", "數量", "單位", "單位成本", "總成本", "來源", "關聯", "備註"],
    ...sortInventoryRecordsByTime(inventoryCache)
      .filter(inRange)
      .map((record) => [
        record.date,
        inventoryTypeLabels[record.type] || record.type,
        inventoryActionLabels[record.action] || record.action,
        record.name,
        Number(record.quantity || 0),
        inventoryUnitLabels[record.type] || "件",
        Number(record.unitCost || 0),
        Number(record.totalCost || 0),
        record.source || "",
        record.reference || "",
        record.note || "",
      ]),
  ];
}

function buildAssetsLiabilitiesSheet() {
  const cashflowSummary = getReportCashflowSummary();
  const inventorySummary = buildInventorySummary(inventoryCache);
  const arAp = buildReceivablePayableSummary(lastReportRows);
  const shareholderRepayments = getShareholderRepaymentTransactions(lastReportSummary.start, lastReportSummary.end);
  const assets = {
    cash: cashflowSummary.endingCash,
    receivable: arAp.receivableTotal,
    inventory: inventorySummary.totalCost,
  };
  const liabilities = {
    payable: arAp.payableTotal,
    shareholderAdvance: Math.max(cashflowSummary.shareholderAdvance, 0),
  };
  const totalAssets = assets.cash + assets.receivable + assets.inventory;
  const totalLiabilities = liabilities.payable + liabilities.shareholderAdvance;
  const netAssets = totalAssets - totalLiabilities;

  return [
    [`${lastReportSummary.start} 至 ${lastReportSummary.end} 公司資產及負債`],
    [],
    ["資產"],
    ["項目", "金額", "說明"],
    ["期末可用現金", assets.cash, "公司銀行與現金期初，加區間現金流入，減區間現金流出"],
    ["應收帳款", assets.receivable, "已發生收入但尚未實際入帳，包含平台待撥款與帳期款"],
    ["　其中：平台待撥款", arAp.platformReceivableTotal, "平台收入尚未實際入帳的待撥款"],
    ["庫存成本", assets.inventory, "目前庫存表計算之庫存成本"],
    ["資產合計", totalAssets, ""],
    [],
    ["負債"],
    ["項目", "金額", "說明"],
    ["應付帳款／費用", liabilities.payable, "已發生支出但尚未實際付款，包含信用卡、月結與帳期款"],
    ["股東代墊餘額", liabilities.shareholderAdvance, "股東代墊尚未沖銷的餘額"],
    ["負債合計", totalLiabilities, ""],
    [],
    ["股東代墊沖銷明細"],
    ["日期", "帳戶", "摘要", "沖銷金額", "會計分錄"],
    ...shareholderRepayments.map((transaction) => [
      transaction.date,
      transaction.account || "",
      transaction.description || transaction.sourceFile || "代墊還款",
      Number(transaction.withdrawal || transaction.deposit || 0),
      "借：股東代墊／業主往來；貸：銀行存款",
    ]),
    [],
    ["淨資產", netAssets, "資產合計減負債合計"],
    [],
    ["應收明細"],
    ["日期", "對象", "摘要", "金額", "帳期／到期日", "判斷依據"],
    ...arAp.receivableRows.map((record) => [
      record.date,
      record.counterparty,
      record.item,
      Number(record.amount || 0),
      record.dueDate || record.paymentDueDate || "",
      describeReceivablePayableBasis(record),
    ]),
    [],
    ["應付明細"],
    ["日期", "對象", "摘要", "金額", "帳期／到期日", "判斷依據"],
    ...arAp.payableRows.map((record) => [
      record.date,
      record.counterparty,
      record.item,
      Number(record.amount || 0),
      record.dueDate || record.paymentDueDate || "",
      describeReceivablePayableBasis(record),
    ]),
    [],
    ["提醒", "此表為內帳管理草稿；帳期到期日、稅額、折舊與月底調整仍待後續規則補齊。"],
  ];
}

function buildReceivablePayableSummary(records) {
  const receivableRows = records.filter(isReceivableRecord);
  const payableRows = records.filter(isPayableRecord);
  const platformReceivableRows = receivableRows.filter((record) => classifyCashflowRecord(record) === "platformPending");

  return {
    receivableRows,
    payableRows,
    receivableTotal: receivableRows.reduce((total, record) => total + Number(record.amount || 0), 0),
    payableTotal: payableRows.reduce((total, record) => total + Number(record.amount || 0), 0),
    platformReceivableTotal: platformReceivableRows.reduce((total, record) => total + Number(record.amount || 0), 0),
  };
}

function isReceivableRecord(record) {
  if (record.type !== "income") return false;
  if (record.settledDate) return false;
  if (record.dueDate) return true;
  if (record.settlementStatus === "已收款") return false;
  if (["待收款", "平台待撥", "月結未收"].includes(record.settlementStatus)) return true;
  const text = receivablePayableText(record);
  return classifyCashflowRecord(record) === "platformPending" || /應收|未收|帳期|月結|待撥|賒銷/.test(text);
}

function isPayableRecord(record) {
  if (record.type !== "expense") return false;
  if (record.settledDate) return false;
  if (record.dueDate) return true;
  if (record.settlementStatus === "已付款") return false;
  if (["待付款", "信用卡未請款", "月結未付"].includes(record.settlementStatus)) return true;
  if (classifyCashflowRecord(record) === "shareholderAdvance") return false;
  const text = receivablePayableText(record);
  return /應付|未付|帳期|月結|信用卡|刷卡/.test(text);
}

function receivablePayableText(record) {
  return [record.cashflow, record.account, record.counterparty, record.item, record.major, record.middle, record.minor, record.note]
    .filter(Boolean)
    .join(" ");
}

function describeReceivablePayableBasis(record) {
  if (record.settlementStatus) return record.settlementStatus;
  if (record.type === "income" && classifyCashflowRecord(record) === "platformPending") return "平台待撥款";
  if (/信用卡|刷卡/.test(receivablePayableText(record))) return "信用卡或刷卡付款";
  if (/股東代墊|代墊/.test(receivablePayableText(record))) return "股東代墊";
  if (/帳期|月結/.test(receivablePayableText(record))) return "帳期或月結";
  if (/應收|未收/.test(receivablePayableText(record))) return "應收或未收";
  if (/應付|未付/.test(receivablePayableText(record))) return "應付或未付";
  return "依目前金流與備註判斷";
}

function getReportCashflowSummary() {
  const records = recordsCache.filter((record) => record.date >= lastReportSummary.start && record.date <= lastReportSummary.end);
  const bankTransactions = bankTransactionsCache.filter((transaction) => transaction.date >= lastReportSummary.start && transaction.date <= lastReportSummary.end);
  return buildCashflowSummary(records, {
    openingBank: Number(cashflowOpeningBankInput.value || 0),
    openingCash: Number(cashflowOpeningCashInput.value || 0),
    openingPlatform: Number(cashflowOpeningPlatformInput.value || 0),
    openingAdvance: Number(cashflowOpeningAdvanceInput.value || 0),
  }, bankTransactions);
}

function buildDailySheet() {
  const days = getDateRange(lastReportSummary.start, lastReportSummary.end);
  return [
    ["每日銷售收入、成本與支出"],
    [],
    ["日期", "銷售收入", "商品銷貨成本", "營業費用", "金流／物流／平台成本", "交易筆數"],
    ...days.map((date) => {
      const records = lastReportRows.filter((record) => record.date === date);
      const soldCost = buildSoldCostSummary(records);
      return [
        date,
        soldCost.salesIncome,
        soldCost.productCost,
        sumOperatingExpense(records),
        soldCost.logisticsCost,
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
  const issues = buildReportIssues();
  const issueCounts = issues.reduce((map, issue) => {
    map[issue.type] = (map[issue.type] || 0) + 1;
    return map;
  }, {});

  return [
    ["檢查、限制與來源"],
    [],
    ["檢查項目", "實際值", "預期值", "差異", "狀態", "說明", "來源"],
    ["交易筆數", lastReportSummary.count, lastReportSummary.count, 0, "OK", "依目前區間流水帳納入。", "ledgerRecords"],
    ["待確認筆數", lastReportSummary.pending, 0, lastReportSummary.pending, lastReportSummary.pending ? "待確認" : "OK", "未附憑證或收入稅務資訊待確認。", "ledgerRecords"],
    ["未配銀行交易", issueCounts["銀行未配對"] || 0, 0, issueCounts["銀行未配對"] || 0, issueCounts["銀行未配對"] ? "待核對" : "OK", "銀行匯入資料尚未標記配對收入、支出、平台撥款或代墊還款。", "bankTransactions"],
    ["收入未配庫存", issueCounts["收入未配庫存"] || 0, 0, issueCounts["收入未配庫存"] || 0, issueCounts["收入未配庫存"] ? "待核對" : "OK", "收入尚未選擇售出的卡盒或卡片，毛利可能失真。", "ledgerRecords + inventoryRecords"],
    ["庫存成本為 0", issueCounts["庫存成本為 0"] || 0, 0, issueCounts["庫存成本為 0"] || 0, issueCounts["庫存成本為 0"] ? "待確認" : "OK", "入庫或調整資料缺成本，庫存金額與毛利需確認。", "inventoryRecords"],
    ["期間", `${lastReportSummary.start} 至 ${lastReportSummary.end}`, `${lastReportSummary.start} 至 ${lastReportSummary.end}`, "", "OK", "使用者自訂區間。", "報表期間"],
    ["稅額完整性", 0, "待憑證確認", "", "待確認", "目前尚未拆分進項稅額與銷項稅額。", "網頁流水帳"],
  ];
}

function buildReportCheckDetailSheet() {
  const issues = buildReportIssues();
  return [
    ["報表檢查明細"],
    [],
    ["類型", "日期", "對象／來源", "摘要", "金額", "原因", "建議處理"],
    ...issues.map((issue) => [
      issue.type,
      issue.date,
      issue.party,
      issue.summary,
      issue.amount,
      issue.reason,
      issue.action,
    ]),
  ];
}

function buildReportIssues() {
  const issues = [];
  const start = lastReportSummary?.start || "";
  const end = lastReportSummary?.end || "";
  const inRange = (date) => date && (!start || !end || (date >= start && date <= end));

  lastReportRows.forEach((record) => {
    if (record.pendingReason) {
      issues.push({
        type: "待補憑證",
        date: record.date,
        party: record.counterparty,
        summary: record.item,
        amount: Number(record.amount || 0),
        reason: record.pendingReason,
        action: "補上發票、收據或確認可無憑證。",
      });
    }

    if (isSalesRevenueRecord(record) && !record.inventoryLinks?.length) {
      issues.push({
        type: "收入未配庫存",
        date: record.date,
        party: record.counterparty,
        summary: record.item,
        amount: Number(record.amount || 0),
        reason: "尚未選擇售出的庫存批次。",
        action: "在最近紀錄中對收入執行多選庫存配對。",
      });
    }
  });

  inventoryCache
    .filter((record) => inRange(record.date) && !Number(record.totalCost || 0))
    .forEach((record) => {
      issues.push({
        type: "庫存成本為 0",
        date: record.date,
        party: record.source,
        summary: record.name,
        amount: 0,
        reason: "庫存成本尚未填入。",
        action: "補入單位成本或總成本，避免毛利率失真。",
      });
    });

  bankTransactionsCache
    .filter((transaction) => inRange(transaction.date))
    .filter((transaction) => !["已配收入", "已配支出", "已配平台撥款", "已配代墊還款", "不入帳"].includes(transaction.status))
    .forEach((transaction) => {
      issues.push({
        type: transaction.status === "待辨識" ? "存摺照片待辨識" : "銀行未配對",
        date: transaction.date,
        party: transaction.account,
        summary: transaction.description || transaction.sourceFile || "銀行資料",
        amount: Number(transaction.deposit || transaction.withdrawal || 0),
        reason: transaction.pendingReason || "尚未標記配對狀態。",
        action: "在現金流頁將銀行交易標記為收入、支出、平台撥款、代墊還款或不入帳。",
      });
    });

  return issues.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function getShareholderRepaymentTransactions(start, end) {
  return bankTransactionsCache
    .filter((transaction) => transaction.status === "已配代墊還款")
    .filter((transaction) => transaction.date >= start && transaction.date <= end)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
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
  const totalCost =
    lastReportSummary.productCost +
    lastReportSummary.logisticsCost +
    lastReportSummary.packagingCost +
    lastReportSummary.operatingExpense;
  return [
    [`${lastReportSummary.start} 至 ${lastReportSummary.end} 會計報表`],
    [],
    ["期間開始", lastReportSummary.start, "", "銷售收入", "已售成本與營業費用", "毛利率", "淨利率", "待補憑證", "交易筆數"],
    ["期間結束", lastReportSummary.end, "", lastReportSummary.salesIncome, totalCost, formatPercent(lastReportSummary.grossMargin), formatPercent(lastReportSummary.netMargin), lastReportSummary.pending, lastReportSummary.count],
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

function sumBankSalesDirectCosts(start, end) {
  return bankTransactionsCache
    .filter((transaction) => transaction.date >= start && transaction.date <= end)
    .filter((transaction) => ["銷貨成本－金流／平台成本", "金流手續費／平台費"].includes(transaction.differenceHandling))
    .reduce((total, transaction) => total + Math.abs(Number(transaction.matchDifference || 0)), 0);
}

function buildSoldCostSummary(records) {
  return records
    .filter(isSalesRevenueRecord)
    .reduce(
      (summary, record) => {
        summary.salesIncome += Number(record.amount || 0);
        summary.logisticsCost += Number(record.logisticsCost || 0);

        const links = record.inventoryLinks || [];
        if (links.length) {
          links.forEach((link) => {
            if (link.type === "supply") {
              summary.packagingCost += Number(link.totalCost || 0);
            } else {
              summary.productCost += Number(link.totalCost || 0);
            }
          });
        } else {
          summary.productCost += Number(record.productCost || 0);
          summary.packagingCost += Number(record.packagingCost || 0);
        }

        return summary;
      },
      { salesIncome: 0, productCost: 0, logisticsCost: 0, packagingCost: 0 },
    );
}

function isSalesRevenueRecord(record) {
  if (record.type !== "income") return false;
  return (
    record.major === "銷貨收入" ||
    Boolean(record.inventoryLinks?.length) ||
    Number(record.productCost || 0) > 0 ||
    Number(record.logisticsCost || 0) > 0
  );
}

function sumOperatingExpense(records) {
  return records
    .filter((record) => record.type === "expense" && record.major === "營業費用")
    .reduce((total, record) => total + Number(record.amount || 0), 0);
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

  const sortedRecords = sortLedgerRecordsByTime(records);
  const incomeRecords = sortedRecords.filter((record) => record.type === "income");
  const expenseRecords = sortedRecords.filter((record) => record.type === "expense");

  recordsList.className = "record-list grouped";
  recordsList.innerHTML = [
    renderRecordGroup("收入紀錄", incomeRecords, "income"),
    renderRecordGroup("支出紀錄", expenseRecords, "expense"),
  ].join("");
}

function renderRecordGroup(title, records, type) {
  const total = sumByType(records, type);
  const count = records.length;

  return `
    <section class="record-group">
      <div class="record-group-heading">
        <div>
          <span>${escapeHtml(title)}</span>
          <strong>${count} 筆</strong>
        </div>
        <strong>NT$ ${formatNumber(total)}</strong>
      </div>
      ${
        records.length
          ? records.map(renderRecordItem).join("")
          : `<div class="record-group-empty">尚無${escapeHtml(title.replace("紀錄", ""))}</div>`
      }
    </section>
  `;
}

function renderLedgerInventorySync() {
  if (!fields.inventorySync || !fields.inventoryPicker) return;

  const isEnabled = fields.inventorySync.value === "yes";
  fields.inventoryPicker.hidden = !isEnabled || recordType !== "income";

  if (!isEnabled) {
    fields.inventorySyncHint.textContent = recordType === "expense"
      ? "支出可同步入庫，入庫名稱會使用細項。"
      : "收入可同步出庫，選擇後會列出可用庫存。";
    fields.inventoryPicker.innerHTML = "";
    return;
  }

  if (recordType === "expense") {
    const name = fields.minor.value || fields.item.value.trim() || "未命名貨品";
    const type = inventoryTypeLabels[inferInventoryTypeFromText(name)] || "卡盒";
    fields.inventorySyncHint.textContent = `儲存後會詢問數量，並以「${name}」新增 ${type} 入庫；金額會作為庫存成本。`;
    fields.inventoryPicker.innerHTML = "";
    return;
  }

  const availableLots = getAvailableInventoryLots();
  fields.inventorySyncHint.textContent = "請勾選要出庫的庫存，並填寫本次出庫數量。";

  if (!availableLots.length) {
    fields.inventoryPicker.hidden = false;
    fields.inventoryPicker.innerHTML = `<div class="record-group-empty">目前沒有可出庫的倉庫貨品。</div>`;
    return;
  }

  fields.inventoryPicker.hidden = false;
  fields.inventoryPicker.innerHTML = `
    <div class="inventory-match-list">
      ${availableLots.map(renderLedgerInventoryOption).join("")}
    </div>
  `;
}

function renderLedgerInventoryOption(lot) {
  return `
    <label class="inventory-match-option">
      <input type="checkbox" data-ledger-inventory-id="${escapeHtml(lot.id)}" />
      <span>
        <strong>${escapeHtml(lot.name)}</strong>
        <small>${escapeHtml(inventoryTypeLabels[lot.type] || lot.type)} · 可用 ${formatNumber(lot.remainingQuantity)} · 成本 NT$ ${formatNumber(lot.totalCost)}</small>
      </span>
      <input type="number" min="1" max="${escapeHtml(lot.remainingQuantity)}" step="1" value="1" data-ledger-inventory-qty="${escapeHtml(lot.id)}" />
    </label>
  `;
}

function renderRecordItem(record) {
  const label = typeLabel(record.type);
  const amountPrefix = record.type === "income" ? "+" : "-";
  const hasVoucher = Boolean(record.hasVoucher || record.voucher);
  const voucherNames = getVoucherNames(record);
  const voucherLabel = voucherNames.length ? `有發票 ${voucherNames.length} 張` : hasVoucher ? "有發票" : "無發票";

  return `
    <article class="record-item" data-record-id="${escapeHtml(record.id)}">
      <span class="pill ${record.type === "income" ? "income" : ""}">${label}</span>
      <div class="record-main">
        <strong>${escapeHtml(record.item)}</strong>
        <span>${escapeHtml(record.counterparty)} · ${escapeHtml(record.major)} / ${escapeHtml(record.middle)} / ${escapeHtml(record.minor)}</span>
        ${record.inventoryLinks?.length ? `<span>已配庫存 ${record.inventoryLinks.length} 筆</span>` : ""}
      </div>
      <strong class="record-amount">${amountPrefix} NT$ ${formatNumber(record.amount)}</strong>
      <div class="record-meta">
        ${escapeHtml(record.date)}<br />
        ${escapeHtml(record.cashflow)} · ${escapeHtml(voucherLabel)}
        ${record.invoiceNumber ? `<br />發票號碼：${escapeHtml(record.invoiceNumber)}` : ""}
        ${renderSettlementMeta(record)}
        ${record.voucherBatchStatus ? `<br /><span class="pill pending">${escapeHtml(record.voucherBatchStatus)}</span>` : ""}
        ${record.pendingReason ? `<br /><span class="pill pending">${escapeHtml(record.pendingReason)}</span>` : ""}
      </div>
      <div class="record-actions">
        <button type="button" data-record-action="edit" data-record-id="${escapeHtml(record.id)}">修改</button>
        <button type="button" class="danger" data-record-action="delete" data-record-id="${escapeHtml(record.id)}">刪除</button>
      </div>
      ${record.type === "income" ? renderInventoryMatchPanel(record) : ""}
    </article>
  `;
}

function renderSettlementMeta(record) {
  const parts = [];
  if (record.settlementStatus) parts.push(record.settlementStatus);
  if (record.dueDate) parts.push(`預計 ${record.dueDate}`);
  if (record.settledDate) parts.push(`實際 ${record.settledDate}`);
  return parts.length ? `<br />${escapeHtml(parts.join(" · "))}` : "";
}

function renderVoucherLinkList(record) {
  const links = getVoucherLinks(record);
  const uploadFailed = record.voucherUploadStatus === "failed";

  if (!links.length && !uploadFailed) return "";

  const linkHtml = links
    .map((url, index) => `
      <a class="voucher-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">查看憑證 ${index + 1}</a>
    `)
    .join("");
  const errorHtml = uploadFailed
    ? `<span class="voucher-error">憑證上傳失敗：${escapeHtml(record.voucherUploadError || "請重新上傳")}</span>`
    : "";

  return `<div class="voucher-links">${linkHtml}${errorHtml}</div>`;
}

function renderInventoryMatchPanel(record) {
  if (record.inventoryLinks?.length) return "";

  const availableLots = getAvailableInventoryLots();

  if (!availableLots.length) {
    return `
      <div class="inventory-match-panel">
        <strong>庫存配對</strong>
        <span>目前沒有可出庫的卡盒或卡片。</span>
      </div>
    `;
  }

  return `
    <div class="inventory-match-panel">
      <div>
        <strong>庫存配對</strong>
        <span>可多選庫存來源；適合一天賣多盒或同一筆收入包含多個商品。</span>
      </div>
      <div class="inventory-match-list">
        ${availableLots.map(renderInventoryMatchOption).join("")}
      </div>
      <button type="button" data-record-action="match-inventory" data-record-id="${escapeHtml(record.id)}">配對選取庫存</button>
    </div>
  `;
}

function renderInventoryMatchOption(lot) {
  const unit = inventoryUnitLabels[lot.type] || "件";
  return `
    <label class="inventory-match-option">
      <input type="checkbox" data-inventory-match-id="${escapeHtml(lot.id)}" />
      <span>
        <strong>${escapeHtml(lot.name)}</strong>
        <small>${escapeHtml(inventoryTypeLabels[lot.type])} · ${escapeHtml(lot.source)} · 剩 ${formatNumber(lot.remainingQuantity)} ${unit}</small>
      </span>
      <input type="number" min="1" max="${lot.remainingQuantity}" step="1" value="1" data-inventory-match-qty="${escapeHtml(lot.id)}" aria-label="出庫數量" />
    </label>
  `;
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

function setCashflowDatesFromRecords(records) {
  if (!records.length) return;

  const currentRangeHasData = records.some((record) => {
    return cashflowStartInput.value && cashflowEndInput.value && record.date >= cashflowStartInput.value && record.date <= cashflowEndInput.value;
  });
  if (currentRangeHasData) return;

  const latestDate = records
    .map((record) => record.date)
    .filter(Boolean)
    .sort()
    .at(-1);
  if (!latestDate) return;

  cashflowStartInput.value = `${latestDate.slice(0, 7)}-01`;
  cashflowEndInput.value = latestDate;
}

function sumByType(records, type) {
  return records
    .filter((record) => record.type === type)
    .reduce((total, record) => total + Number(record.amount || 0), 0);
}

function loadOptions() {
  try {
    const saved = JSON.parse(localStorage.getItem("ledgerOptionsByType") || "{}");
    return normalizeOptionsByType(saved);
  } catch {
    return structuredClone(defaultOptionsByType);
  }
}

function saveOptions() {
  localStorage.setItem("ledgerOptionsByType", JSON.stringify(optionsByType));
  saveSharedOptions().catch(() => {
    showToast("雲端選項暫時無法同步，已先保存在本機。");
  });
}

async function loadSharedOptions() {
  if (!isConfigured || !currentUser || !db) return;

  try {
    const reference = firebaseApi.doc(db, "systemSettings", "options");
    const snapshot = await firebaseApi.getDoc(reference);

    if (snapshot.exists()) {
      optionsByType = normalizeOptionsByType(snapshot.data()?.options || {});
      saveOptionsLocalOnly();
      renderAllOptions();
      renderOptionsEditor();
      return;
    }

    await saveSharedOptions(true);
  } catch {
    showToast("雲端選項讀取失敗，先使用本機選項。");
  }
}

async function saveSharedOptions(isInitial = false) {
  if (!isConfigured || !currentUser || !db) return;

  const reference = firebaseApi.doc(db, "systemSettings", "options");
  const payload = {
    options: normalizeOptionsByType(optionsByType),
    updatedAt: firebaseApi.serverTimestamp(),
    updatedBy: currentUser.email,
    userId: currentUser.uid,
  };

  if (isInitial) {
    payload.createdAt = firebaseApi.serverTimestamp();
    payload.createdBy = currentUser.email;
  }

  await firebaseApi.setDoc(reference, payload, { merge: true });
}

function saveOptionsLocalOnly() {
  localStorage.setItem("ledgerOptionsByType", JSON.stringify(optionsByType));
}

function normalizeOptionsByType(saved = {}) {
  return {
    expense: normalizeOptionGroup(saved.expense, defaultOptionsByType.expense),
    income: normalizeOptionGroup(saved.income, defaultOptionsByType.income),
  };
}

function normalizeOptionGroup(savedGroup = {}, fallbackGroup = {}) {
  return Object.fromEntries(
    Object.keys(fallbackGroup).map((key) => [
      key,
      normalizeOptions(Array.isArray(savedGroup[key]) ? savedGroup[key] : fallbackGroup[key], fallbackGroup[key]),
    ]),
  );
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

function loadLocalInventoryRecords() {
  try {
    return JSON.parse(localStorage.getItem("inventoryRecordsPreview") || "[]");
  } catch {
    return [];
  }
}

function saveLocalInventoryRecords() {
  localStorage.setItem("inventoryRecordsPreview", JSON.stringify(inventoryCache));
}

function loadLocalBankTransactions() {
  try {
    return JSON.parse(localStorage.getItem("bankTransactionsPreview") || "[]");
  } catch {
    return [];
  }
}

function saveLocalBankTransactions() {
  localStorage.setItem("bankTransactionsPreview", JSON.stringify(bankTransactionsCache));
}

function loadLocalLineDrafts() {
  try {
    return JSON.parse(localStorage.getItem("lineDraftsPreview") || "[]");
  } catch {
    return [];
  }
}

function saveLocalLineDrafts() {
  localStorage.setItem("lineDraftsPreview", JSON.stringify(lineDraftsCache));
}

function loadLocalVoucherInbox() {
  try {
    return JSON.parse(localStorage.getItem("voucherInboxPreview") || "[]");
  } catch {
    return [];
  }
}

function saveLocalVoucherInbox() {
  localStorage.setItem("voucherInboxPreview", JSON.stringify(voucherInboxCache));
}

function loadLocalDeletedRecords() {
  try {
    return JSON.parse(localStorage.getItem("deletedRecordsPreview") || "[]");
  } catch {
    return [];
  }
}

function loadLocalAuditLogs() {
  try {
    return JSON.parse(localStorage.getItem("auditLogsPreview") || "[]");
  } catch {
    return [];
  }
}

function stripFile(record) {
  const { voucherFile, voucherFiles, ...cleanRecord } = record;
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

function sortInventoryRecordsByTime(records) {
  return [...records].sort((a, b) => {
    const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
    if (dateCompare) return dateCompare;

    return getRecordTimeValue(b) - getRecordTimeValue(a);
  });
}

function sortLedgerRecordsByTime(records) {
  return [...records].sort(compareRecordsByDateAndCreatedTime);
}

function compareRecordsByDateAndCreatedTime(a, b) {
  const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
  if (dateCompare) return dateCompare;

  return getRecordTimeValue(b) - getRecordTimeValue(a);
}

function getRecordTimeValue(record) {
  const value = record.updatedAt || record.createdAt || record.date;
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
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
