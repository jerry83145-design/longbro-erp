import { allowedEmails, firebaseConfig, readonlyEmails } from "./firebase-config.js";
import { lineEndpointConfig } from "./line-endpoint-config.js";
import { initPayrollPage, setPayrollCloudContext } from "./payroll-30day.js?v=20260810-payroll-monthly-inputs";

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

const defaultExpenseAccountTree = {
  進貨成本: {
    貨品: ["盒卡", "單卡", "套組", "待確認", "自訂"],
    包材: ["卡套", "磁吸磚", "紙箱", "耗材", "待確認", "自訂"],
    運費: ["國內運費", "海外運費", "待確認", "自訂"],
    稅捐規費: ["關稅", "進口稅費", "待確認", "自訂"],
  },
  行銷與業務: {
    廣告: ["Logo", "活動與贈品", "平台推廣", "廣告素材", "待確認", "自訂"],
    顧問費: ["顧問費", "待會計師確認", "自訂"],
    手續費: ["平台費", "金流手續費", "待確認", "自訂"],
  },
  辦公設備: {
    設備: ["直播設備", "資訊設備", "攝影設備", "辦公設備", "待確認", "自訂"],
    資訊軟體費: ["網路費", "訂閱服務", "軟體授權", "平台費", "待確認", "自訂"],
    文具費: ["文具", "耗材", "待確認", "自訂"],
  },
  營業費用: {
    薪資支出: ["本薪", "伙食津貼", "員工福利", "勞健保", "待確認", "自訂"],
    雜費: ["郵務費", "員工福利", "其他雜費", "待確認", "自訂"],
    運費: ["國內運費", "海外運費", "待確認", "自訂"],
    訂閱服務: ["平台費", "軟體訂閱", "待確認", "自訂"],
  },
  稅捐規費: {
    規費: ["規費", "營業稅", "稅捐", "待確認", "自訂"],
    手續費: ["銀行手續費", "平台費", "待確認", "自訂"],
  },
  "固定資產-待確認": {
    設備: ["直播設備", "資訊設備", "攝影設備", "辦公設備", "待確認", "自訂"],
    待確認: ["待確認", "自訂"],
  },
  其他費用: {
    雜費: ["其他雜費", "待確認", "自訂"],
    待確認: ["待確認", "自訂"],
  },
  待確認: {
    待確認: ["待確認", "自訂"],
  },
  自訂: {
    自訂: ["自訂"],
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
  sealedCase: ["進貨"],
  box: ["進貨"],
  card: ["團拆入卡", "拆盒入卡", "玩家收購"],
  supply: ["包材採購", "進貨", "其他"],
};

const inventoryTypeLabels = {
  sealedCase: "完整箱",
  box: "散盒",
  card: "散卡",
  supply: "包材",
};

const inventoryActionLabels = {
  in: "入庫",
  out: "出庫",
  adjust: "調整",
};

const inventoryUnitLabels = {
  sealedCase: "箱",
  box: "盒",
  card: "張",
  supply: "件",
};

const assetCategoryCodes = {
  資訊設備: "IT",
  直播設備: "LV",
  辦公家具: "OF",
  電器設備: "EL",
};

const assetCodeCategories = Object.fromEntries(
  Object.entries(assetCategoryCodes).map(([category, code]) => [code, category]),
);

const fixedAssetSeedTsv = `PH-OF-0001	辦公家具	主播椅	2	46203	3000	0	46203	已過保	未貼	IKEA 跟華哥買
PH-OF-0002	辦公家具	直播間小桌	1	46200	1197	0	46200	已過保	未貼	Loft 卡爾職人工作桌 11.5kg 1個, 咖啡色
PH-LV-0001	直播設備	相機燈頭(變焦)	1	46200	3000	0	46200	已過保	未貼	Sony FE 28-70mm F3.5-5.6 OSS
PH-LV-0002	直播設備	直播間螢幕支架	1	46197	2999	0	46197	已過保	未貼	ANDY系列 Raymii LS-126-P2 氣壓式高承重雙螢幕支架 35吋 16KG 螢幕架 螢幕伸縮懸掛支架+Raymii LSA6 螢幕支架桌面保護墊片
PH-LV-0003	直播設備	主播間手機支架	2	46197	698	0	46197	已過保	未貼	Raymii D100 鋁合金旋轉手機平板增高支架 手機架 灰色
PH-LV-0004	直播設備	直播間第一組燈	1	46185	11500				未貼	200XS+Lantern65cm柔光罩+Sirui DJ280燈架
PH-LV-0005	直播設備	直播間麥克風架	2	46197	5562	12	46562	保固中	未貼	【Elgato】WAVE MIC ARM LP 麥克風矮懸臂 桌邊架(公司貨)
PH-IT-0001	資訊設備	小記憶卡	1	46196	1510	9999	350535	保固中	未貼	SanDisk 256GB 190MB/s Extreme MicroSDXC UHS-I A2 V30 256GB 記憶卡
PH-LV-0006	直播設備	直播間麥克風線	2	46195	750				未貼	Canare L2T2S - Neutrik鍍銀XLR平衡頭麥克風線
PH-LV-0007	直播設備	相機電池充電器	1	46191	555	12	46556	保固中	未貼	Rowa NP-FZ100 副廠雙槽電池充電器
PH-OF-0003	辦公家具	包貨推車	2	46191	1684	0	46191	已過保	未貼	IKEA
PH-OF-0004	辦公家具	包貨區長桌	2	46191	1998	0	46191	已過保	未貼	酷澎雜牌
PH-LV-0008	直播設備	綠幕	1	46190	1891	12	46555	保固中	未貼	【Quality 聚家】全伸縮直播綠幕 攝影背景布 摳像背景布（2.7*3米背景架/3*2米背景布/三角支架/快速升降）
PH-LV-0009	直播設備	相機架	1	46190	815	0	46190	已過保	未貼	【Ulanzi 優籃子】【Ulanzi HD02 10吋滑槽怪手套裝】承重3kg 魔術手臂 萬向魔術臂 大力夾 1/4" 3/8" 阿萊定位孔
PH-LV-0010	直播設備	黑色延長線(TPS356DN0027)	2	46189	1348	12	46554	保固中	未貼	【PowerSync 群加】6開6插安全防雷防塵延長線 /2.7M(TPS356DN0027)
PH-LV-0011	直播設備	【PX 大通】3m網路線	1	46189	246	24	46920	保固中	未貼	【PX 大通】3m網路線
PH-IT-0002	資訊設備	【TP-Link】 網路交換器(TL-SG105)	1	46189	439	36	47285	保固中		【TP-Link】 網路交換器(TL-SG105)
PH-LV-0012	直播設備	【PX大通】HDMI PREMIUM 5m線	1	46189	789	24	46920	保固中		【PX大通】HDMI PREMIUM 5m線
PH-LV-0013	直播設備	【綠聯】TypeC快充傳輸線 黑色2m	1	46189	186	12	46554	保固中		【綠聯】TypeC快充傳輸線 黑色2m
PH-LV-0014	直播設備	主播電腦	1	46189	77000	12	46554	保固中	未貼	組裝電腦，保固依各零件，有問題都可以問張育軒(賣家)
PH-LV-0015	直播設備	直播間電腦螢幕	3	46189	9150	36	47285	保固中		華碩VG279Q5A
PH-LV-0016	直播設備	麥克風	1	46189	3300	24	46920	保固中	未貼	RODE 台灣公司貨 有線廣播級動態麥克風, RDPODMIC, 黑色
PH-EL-0001	電器設備	除濕機	2	46188	17905	36	47284	保固中	未貼	HITACHI RD-220HC
PH-LV-0017	直播設備	主畫面相機	1	46188	52520	0	46188	已過保	未貼	Sony A7SIII A7S3
PH-LV-0018	直播設備	定焦鏡頭	1	46186	8200	0	46186	已過保	未貼	Sony 50mm marco
PH-LV-0019	直播設備	直播間電視	1	46186	6200	0	46186	已過保	未貼	Samsung UA55AU8000WXZW
PH-EL-0002	電器設備	防潮箱	1	46186	5299	120	49839	保固中	未貼	【防潮家】121公升電子防潮箱D-118CA(台灣製 7年保固 穩定除濕)
PH-LV-0020	直播設備	直播間第二組燈	1	46197	7600				未貼	Godox SB-US-80蜂巢罩、神牛SL60II Bi 、燈架
PH-IT-0003	資訊設備	Pocket4	1	46185	19380	24	46916	保固中	未貼	保固為加購保險 兩年共四次人為 原廠非人為僅一年
PH-LV-0021	直播設備	Mixer	1	46184	5385	0	46184	已過保	未貼	Yamaha AG06 MK2
PH-LV-0022	直播設備	直播鏡頭	1	46183	2170	12	46548	保固中	未貼	羅技 c922pro
PH-IT-0004	資訊設備	掃描機	1	46182	40000	12	46547	保固中	未貼	epson v850
PH-IT-0005	資訊設備	印表機	1	46182	3000	36	47278	保固中		Canon G3730
PH-IT-0006	資訊設備	鍵盤滑鼠	1	46176	990	12	46541	保固中	未貼	【Logitech 羅技】MK295 無線靜音鍵鼠組
PH-LV-0023	直播設備	直播間鍵盤滑鼠	2	46182	1950	12	46547	保固中		光華雜牌
PH-IT-0007	資訊設備	文書機	2	46182	35474	12	46547	保固中	未貼	【華碩平台】R5 六核 Win11 {蛇蟠陣法V W}優質文書機(R5 5600GT/A520/16G D4/512G)
PH-LV-0024	直播設備	直播間電視架	1	46181	450	0	46181	已過保	未貼	臉書雜牌
PH-OF-0005	辦公家具	抽屜櫃	5	46181	6100	0	46181	已過保	未貼	IKEA
PH-LV-0025	直播設備	集線器	1	46181	7750	24	46912	保固中	未貼	【OWC】Thunderbolt Dock(支援 Thunderbolt 3 Mac 和 Thunderbolt 4 PC)
PH-IT-0008	資訊設備	辦公區電視	1	46178	8800	0	46178	已過保	未貼	兆基電子JGF-65UDF
PH-OF-0006	辦公家具	直播桌	1	46178	14500	0	46178	已過保	未貼	安寶角鋼
PH-EL-0003	電器設備	冰箱	1	46177	5500	0	46177	已過保	未貼	HITACHI R-BX330
PH-OF-0007	辦公家具	辦公椅	5	46175	5182	0	46175	已過保	未貼	雜牌
PH-OF-0008	辦公家具	沙發	1	46174	26000	0	46174	已過保	未貼	IKEA
PH-OF-0009	辦公家具	辦公桌	6	46174	12000	0	46174	已過保		IKEA
PH-OF-0010	辦公家具	手推車	1	46171	1000	12	46536	保固中	未貼	一元五金推車
PH-EL-0004	電器設備	淨水器	1	46170	9450	24	46901	保固中	未貼	蔚藍淨水 濾心為消耗品，龍頭壞了也能換，其他要跟廠商確認
PH-EL-0005	電器設備	冷氣	5	46168	155000	84	48725	保固中	未貼	TCL R32 保固要再跟小陳確認一下
PH-EL-0006	電器設備	吸塵器	1	46163	13000	0	46163	已過保	未貼	Dyson V12 SV46ff 吸塵器
PH-EL-0007	電器設備	電風扇	1	46162	1490	0	46162	已過保	未貼	禾聯
PH-IT-0009	資訊設備	延長線	2	46205	1350	0	46205	已過保	未貼	Kinyo 3.6m`;

const settlementStatuses = {
  expense: ["已付款", "待付款", "信用卡未請款", "月結未付", "股東代墊未沖", "不適用"],
  income: ["已收款", "待收款", "平台待撥", "月結未收", "不適用"],
};

const setupNotice = document.querySelector("#setupNotice");
const authStatus = document.querySelector("#authStatus");
const sidebarStatusTitle = document.querySelector("#sidebarStatusTitle");
const sidebarStatusDetail = document.querySelector("#sidebarStatusDetail");
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
const summaryStartMonthInput = document.querySelector("#summaryStartMonthInput");
const summaryEndMonthInput = document.querySelector("#summaryEndMonthInput");
const summaryMonthCurrentButton = document.querySelector("#summaryMonthCurrentButton");
if (summaryMonthCurrentButton) summaryMonthCurrentButton.textContent = "本月";
const importLedgerButton = document.querySelector("#importLedgerButton");
const importLedgerInput = document.querySelector("#importLedgerInput");
const ledgerImportPreview = document.querySelector("#ledgerImportPreview");
const pendingSummary = document.querySelector("#pendingSummary");
const pendingList = document.querySelector("#pendingList");
const overviewCheckSummary = document.querySelector("#overviewCheckSummary");
const overviewCheckList = document.querySelector("#overviewCheckList");
const voucherSummary = document.querySelector("#voucherSummary");
const voucherList = document.querySelector("#voucherList");
const voucherOcrPanel = document.querySelector("#voucherOcrPanel");
const voucherOcrStatus = document.querySelector("#voucherOcrStatus");
const voucherOcrResults = document.querySelector("#voucherOcrResults");
const voucherOcrInput = document.querySelector("#voucherOcrInput");
const voucherInboxList = document.querySelector("#voucherInboxList");
const voucherAdjustmentPanel = document.querySelector("#voucherAdjustmentPanel");
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
const inventorySourceRecordInput = document.querySelector("#inventorySourceRecordInput");
const selectInventoryOutButton = document.querySelector("#selectInventoryOutButton");
const inventoryQtyInput = document.querySelector("#inventoryQtyInput");
const inventoryUnitCostInput = document.querySelector("#inventoryUnitCostInput");
const inventoryTotalCostInput = document.querySelector("#inventoryTotalCostInput");
const inventoryReferenceInput = document.querySelector("#inventoryReferenceInput");
const inventoryNoteInput = document.querySelector("#inventoryNoteInput");
const clearInventoryButton = document.querySelector("#clearInventoryButton");
const saveInventoryButton = document.querySelector("#saveInventoryButton");
const inventorySummary = document.querySelector("#inventorySummary");
const inventoryList = document.querySelector("#inventoryList");
const assetForm = document.querySelector("#assetForm");
const assetCategorySelect = document.querySelector("#assetCategorySelect");
const assetNameInput = document.querySelector("#assetNameInput");
const assetQtyInput = document.querySelector("#assetQtyInput");
const assetPurchaseDateInput = document.querySelector("#assetPurchaseDateInput");
const assetAmountInput = document.querySelector("#assetAmountInput");
const assetWarrantyMonthsInput = document.querySelector("#assetWarrantyMonthsInput");
const assetNoteInput = document.querySelector("#assetNoteInput");
const clearAssetButton = document.querySelector("#clearAssetButton");
const saveAssetButton = document.querySelector("#saveAssetButton");
const openAssetSheetButton = document.querySelector("#openAssetSheetButton");
const importAssetSheetButton = document.querySelector("#importAssetSheetButton");
const syncAssetSheetButton = document.querySelector("#syncAssetSheetButton");
const assetSummary = document.querySelector("#assetSummary");
const assetList = document.querySelector("#assetList");
const inventoryOpeningBoxQtyInput = document.querySelector("#inventoryOpeningBoxQtyInput");
const inventoryOpeningCardQtyInput = document.querySelector("#inventoryOpeningCardQtyInput");
const inventoryOpeningCaseQtyInput = document.querySelector("#inventoryOpeningCaseQtyInput");
const inventoryOpeningCostInput = document.querySelector("#inventoryOpeningCostInput");
const saveInventorySettingsButton = document.querySelector("#saveInventorySettingsButton");
const recycleBinList = document.querySelector("#recycleBinList");
const refreshRecycleBinButton = document.querySelector("#refreshRecycleBinButton");
const auditLogList = document.querySelector("#auditLogList");
const refreshAuditLogButton = document.querySelector("#refreshAuditLogButton");
const exportBackupButton = document.querySelector("#exportBackupButton");
const backupStatus = document.querySelector("#backupStatus");
const restoreBackupInput = document.querySelector("#restoreBackupInput");
const restoreBackupStatus = document.querySelector("#restoreBackupStatus");
const restoreBackupPreview = document.querySelector("#restoreBackupPreview");
const runSystemCheckButton = document.querySelector("#runSystemCheckButton");
const systemCheckSummary = document.querySelector("#systemCheckSummary");
const systemCheckList = document.querySelector("#systemCheckList");
const previewShareholderAdvanceCleanupButton = document.querySelector("#previewShareholderAdvanceCleanupButton");
const applyShareholderAdvanceCleanupButton = document.querySelector("#applyShareholderAdvanceCleanupButton");
const shareholderAdvanceCleanupPreview = document.querySelector("#shareholderAdvanceCleanupPreview");
const duplicateImportModal = document.querySelector("#duplicateImportModal");
const duplicateImportTitle = document.querySelector("#duplicateImportTitle");
const duplicateImportSubtitle = document.querySelector("#duplicateImportSubtitle");
const duplicateImportBody = document.querySelector("#duplicateImportBody");
if (duplicateImportModal) duplicateImportModal.hidden = true;

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
  inventorySplitIncome: document.querySelector("#inventorySplitIncomeInput"),
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
let restoreBackupDraft = null;
let restoreBackupPlan = null;
let recordsCache = loadLocalRecords();
let inventoryCache = loadLocalInventoryRecords();
let assetCache = loadLocalAssetRecords();
let bankTransactionsCache = loadLocalBankTransactions();
let lineDraftsCache = loadLocalLineDrafts();
let voucherInboxCache = loadLocalVoucherInbox();
let optionsByType = loadOptions();
let pendingLedgerInventorySelections = null;
let lastReportRows = [];
let lastReportSummary = null;
let currentVoucherOcrRecordId = "";
let activeVoucherMatchId = "";
let activeVoucherEditId = "";
let voucherInboxStatusFilter = "open";
let selectedSummaryStartMonth = "";
let selectedSummaryEndMonth = "";
let duplicateImportDecisionResolver = null;
let editingRecordId = null;
let editingInventoryId = null;
let recycleBinCache = [];
let auditLogCache = [];
let shareholderAdvanceCleanupPlan = [];
let secondaryDataLoadPromise = null;
let pendingLedgerImportPreview = null;
let pendingBankImportPreview = null;
let isReadOnlyUser = false;

const readOnlyWritableBlockMessage = "此帳號僅可查閱與匯出，不能新增、刪除、修改、匯入或同步資料。";
const readOnlyAllowedControlIds = new Set([
  "signInButton",
  "signOutButton",
  "summaryStartMonthInput",
  "summaryEndMonthInput",
  "summaryMonthCurrentButton",
  "reportStartInput",
  "reportEndInput",
  "generateReportButton",
  "exportReportButton",
  "cashflowStartInput",
  "cashflowEndInput",
  "generateCashflowButton",
  "payrollMonthInput",
  "payrollPrintSelectedButton",
  "payrollPrintAllButton",
  "openAssetSheetButton",
  "exportBackupButton",
  "runSystemCheckButton",
  "refreshRecordsButton",
  "refreshRecycleBinButton",
  "refreshAuditLogButton",
]);
const readOnlyBlockedIdPattern = /(topAction|save|clear|import|sync|apply|restore|delete|reset|toggle|ocr|calculate|reconcile|previewShareholderAdvanceCleanup)/i;
const readOnlyBlockedDataAttributes = [
  "addOption",
  "recordAction",
  "bankAction",
  "bankImportAction",
  "ledgerImportAction",
  "inventoryAction",
  "assetAction",
  "settlementAction",
  "lineDraftAction",
  "voucherEdit",
  "voucherSaveEdit",
  "voucherRemoveMatch",
  "voucherApplyMatch",
  "voucherMatch",
  "voucherScan",
  "applyInvoiceNumber",
  "duplicateImportAction",
  "restorePlan",
  "confirmRestore",
  "recycleRestore",
];
const readOnlyAllowedInputIds = new Set([
  "summaryStartMonthInput",
  "summaryEndMonthInput",
  "reportStartInput",
  "reportEndInput",
  "cashflowStartInput",
  "cashflowEndInput",
  "payrollMonthInput",
]);

const recycleCollections = [
  { name: "ledgerRecords", label: "流水帳" },
  { name: "bankTransactions", label: "銀行資料" },
  { name: "inventoryRecords", label: "庫存" },
  { name: "assetRecords", label: "固定資產" },
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
  assets: {
    eyebrow: "FIXED ASSETS",
    title: "固定資產",
    subtitle: "管理資產編號、分類、保固、貼標與來源支出",
    action: "新增支出",
  },
  payroll: {
    eyebrow: "PAYROLL",
    title: "薪資計算",
    subtitle: "選擇薪資月份，輸入請假、加項與扣項，先預覽再輸出員工薪資單。",
    action: "計算薪資",
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
setDefaultAssetDate();
setDefaultReportDates();
setDefaultCashflowDates();
loadCashflowSettings();
loadInventorySettings();
restoreOrder(".sidebar-nav", ".nav-item", "sidebarNavOrder", getNavKey);
restoreOrder(".summary-grid", ".summary-card", "summaryCardOrder", (item) => item.dataset.cardId);
enableDragSort(".sidebar-nav", ".nav-item", ".drag-handle", "sidebarNavOrder", getNavKey);
enableDragSort(".summary-grid", ".summary-card", ".card-drag-handle", "summaryCardOrder", (item) => item.dataset.cardId);
summaryStartMonthInput?.addEventListener("change", () => {
  selectedSummaryStartMonth = normalizeSummaryMonth(summaryStartMonthInput.value);
  updateSummary(recordsCache);
});
summaryEndMonthInput?.addEventListener("change", () => {
  selectedSummaryEndMonth = normalizeSummaryMonth(summaryEndMonthInput.value);
  updateSummary(recordsCache);
});
summaryMonthCurrentButton?.addEventListener("click", () => {
  const currentMonth = getCurrentSummaryMonth();
  selectedSummaryStartMonth = currentMonth;
  selectedSummaryEndMonth = currentMonth;
  updateSummary(recordsCache);
});
updatePageMeta("overview");
renderAllOptions();
renderOptionsEditor();
updateFormLabels();
renderBatchVoucherList([]);
renderLedgerInventorySync();
renderInventorySources();
renderInventoryOutSelector();
renderInventory();
renderAssets();
renderPendingCenter();
renderVoucherCenter();
renderSettlementCenter();
renderBankTransactions();
initPayrollPage();

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
  renderAssets();
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
  protectFirebaseWrites();

  app = appModule.initializeApp(firebaseConfig);
  auth = authModule.getAuth(app);
  db = firestoreModule.getFirestore(app);
  storage = storageModule.getStorage(app);
  authModule.onAuthStateChanged(auth, handleAuthState);
}

function protectFirebaseWrites() {
  ["addDoc", "setDoc", "updateDoc", "deleteDoc", "writeBatch", "uploadBytes", "uploadBytesResumable"].forEach((method) => {
    if (typeof firebaseApi[method] !== "function") return;
    const original = firebaseApi[method];
    firebaseApi[method] = (...args) => {
      assertCanWrite();
      return original(...args);
    };
  });
}

function canWrite() {
  return !isReadOnlyUser;
}

function assertCanWrite() {
  if (canWrite()) return true;
  showToast(readOnlyWritableBlockMessage);
  throw new Error("READ_ONLY_ACCOUNT");
}

function isReadonlyEmail(email) {
  return readonlyEmails.includes(String(email || "").toLowerCase());
}

function readableCollectionQuery(collectionName, resultLimit = 1000) {
  const constraints = [];
  if (!isReadOnlyUser) {
    constraints.push(firebaseApi.where("userId", "==", currentUser.uid));
  }
  constraints.push(firebaseApi.limit(resultLimit));
  return firebaseApi.query(firebaseApi.collection(db, collectionName), ...constraints);
}

function isVisibleToCurrentUser(record = {}) {
  return isReadOnlyUser || !record.userId || record.userId === currentUser?.uid;
}

function isReadOnlyAllowedDetailControl(element) {
  const dataset = element.dataset || {};
  return (
    Object.prototype.hasOwnProperty.call(dataset, "inventorySummaryDetail") ||
    dataset.inventoryAction === "details" ||
    dataset.assetAction === "details" ||
    Object.prototype.hasOwnProperty.call(dataset, "inventoryTypeClose") ||
    Object.prototype.hasOwnProperty.call(dataset, "inventoryDetailClose")
  );
}

function isReadOnlyBlockedControl(element) {
  if (!isReadOnlyUser || !element) return false;
  if (element.id && readOnlyAllowedControlIds.has(element.id)) return false;
  if (element.closest?.(".sidebar-nav")) return false;
  if (element.classList?.contains("segment")) return false;
  if (element.dataset?.pendingTarget || element.dataset?.voucherFilter) return false;
  if (isReadOnlyAllowedDetailControl(element)) return false;
  if (element.id && readOnlyBlockedIdPattern.test(element.id)) return true;
  return readOnlyBlockedDataAttributes.some((name) => Object.prototype.hasOwnProperty.call(element.dataset || {}, name));
}

function isReadOnlyBlockedInput(element) {
  if (!isReadOnlyUser || !element?.matches?.("input, select, textarea")) return false;
  if (readOnlyAllowedInputIds.has(element.id)) return false;
  if (element.type === "hidden") return false;
  if (element.closest?.(".match-dialog-overlay[hidden]")) return false;
  return true;
}

function handleReadOnlyClick(event) {
  const control = event.target.closest?.("button, input[type='button'], input[type='submit'], label, a");
  if (!control || !isReadOnlyBlockedControl(control)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  showToast(readOnlyWritableBlockMessage);
}

function handleReadOnlyChange(event) {
  if (!isReadOnlyBlockedInput(event.target)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  event.target.blur?.();
  showToast(readOnlyWritableBlockMessage);
}

function handleReadOnlySubmit(event) {
  if (!isReadOnlyUser) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  showToast(readOnlyWritableBlockMessage);
}

function applyReadOnlyMode() {
  document.body.classList.toggle("readonly-mode", isReadOnlyUser);
  window.longbroReadOnlyMode = isReadOnlyUser;

  if (!isReadOnlyUser) {
    document.querySelectorAll("[data-readonly-disabled='true']").forEach((control) => {
      control.disabled = false;
      delete control.dataset.readonlyDisabled;
      control.classList.remove("readonly-disabled");
      control.removeAttribute("title");
    });
    document.querySelectorAll(".drag-handle, .card-drag-handle").forEach((handle) => {
      handle.draggable = true;
      handle.classList.remove("readonly-disabled");
    });
    return;
  }

  document.querySelectorAll("input, select, textarea").forEach((input) => {
    if (input.type === "hidden") return;
    const blocked = isReadOnlyBlockedInput(input);
    if (!blocked) return;
    input.disabled = true;
    input.dataset.readonlyDisabled = "true";
    input.classList.add("readonly-disabled");
    input.title = readOnlyWritableBlockMessage;
  });

  document.querySelectorAll("button").forEach((button) => {
    const blocked = isReadOnlyBlockedControl(button);
    if (!blocked) return;
    button.disabled = true;
    button.dataset.readonlyDisabled = "true";
    button.classList.add("readonly-disabled");
    button.title = readOnlyWritableBlockMessage;
  });

  document.querySelectorAll(".drag-handle, .card-drag-handle").forEach((handle) => {
    handle.draggable = !isReadOnlyUser;
    handle.classList.toggle("readonly-disabled", isReadOnlyUser);
  });
}

let readOnlyApplyScheduled = false;
const readOnlyObserver = new MutationObserver(() => {
  if (!isReadOnlyUser || readOnlyApplyScheduled) return;
  readOnlyApplyScheduled = true;
  window.requestAnimationFrame(() => {
    readOnlyApplyScheduled = false;
    applyReadOnlyMode();
  });
});

document.addEventListener("click", handleReadOnlyClick, true);
document.addEventListener("change", handleReadOnlyChange, true);
document.addEventListener("input", handleReadOnlyChange, true);
document.addEventListener("submit", handleReadOnlySubmit, true);
readOnlyObserver.observe(document.body, { childList: true, subtree: true });

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
  if (currentView === "payroll") {
    document.querySelector("#payrollCalculateButton")?.click();
    return;
  }
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

importAssetSheetButton?.addEventListener("click", importSeedAssetRecords);
openAssetSheetButton?.addEventListener("click", () => {
  window.open(lineEndpointConfig.fixedAssetSheetUrl, "_blank", "noopener,noreferrer");
});
syncAssetSheetButton?.addEventListener("click", syncAllAssetRecordsToGoogleSheet);
clearAssetButton?.addEventListener("click", clearAssetForm);
assetForm?.addEventListener("submit", saveManualAssetRecord);
refreshRecycleBinButton?.addEventListener("click", loadRecycleBinRecords);
refreshAuditLogButton?.addEventListener("click", loadAuditLogs);
exportBackupButton?.addEventListener("click", exportFullBackup);
restoreBackupInput?.addEventListener("change", previewBackupFile);
restoreBackupPreview?.addEventListener("click", async (event) => {
  const planButton = event.target.closest("[data-restore-plan]");
  if (planButton) {
    await buildRestorePlan();
    return;
  }

  const restoreButton = event.target.closest("[data-confirm-restore]");
  if (restoreButton) {
    await confirmRestoreBackup();
  }
});
runSystemCheckButton?.addEventListener("click", runSystemCheck);
previewShareholderAdvanceCleanupButton?.addEventListener("click", previewShareholderAdvanceCleanup);
applyShareholderAdvanceCleanupButton?.addEventListener("click", applyShareholderAdvanceCleanup);

recycleBinList?.addEventListener("click", async (event) => {
  const restoreButton = event.target.closest("[data-recycle-restore]");
  if (!restoreButton) return;
  await restoreDeletedRecord(restoreButton.dataset.collection, restoreButton.dataset.recordId);
});

bankImportInput.addEventListener("change", async () => {
  const file = bankImportInput.files?.[0];
  if (!file) return;

  try {
    pendingBankImportPreview = await buildBankImportPreview(file);
    if (!pendingBankImportPreview) return;
    renderBankImportPreview(pendingBankImportPreview);
  } catch (error) {
    showToast(`銀行匯入失敗：${error.message}`);
  } finally {
    bankImportInput.value = "";
  }
});

bankImportPreview?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-bank-import-action]");
  if (!button || !pendingBankImportPreview) return;

  const action = button.dataset.bankImportAction;
  if (action === "cancel") {
    clearBankImportPreview();
    return;
  }

  const recordsToImport = action === "import-all"
    ? [...pendingBankImportPreview.cleanItems, ...pendingBankImportPreview.duplicateItems.map((item) => item.record)]
    : pendingBankImportPreview.cleanItems;

  if (!recordsToImport.length) {
    showToast("沒有可匯入的銀行資料。");
    return;
  }

  button.disabled = true;
  button.textContent = "匯入中...";

  try {
    await saveImportedBankTransactions(recordsToImport);
    const duplicateSkipped = action === "import-clean" ? pendingBankImportPreview.duplicateItems.length : 0;
    const skippedMessage = duplicateSkipped ? `，略過 ${duplicateSkipped} 筆疑似重複` : "";
    showToast(`已匯入 ${recordsToImport.length} 筆銀行資料${skippedMessage}。`);
    clearBankImportPreview();
  } catch (error) {
    showToast(`銀行匯入失敗：${error.message}`);
  } finally {
    button.disabled = false;
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
    pendingLedgerImportPreview = await buildLedgerImportPreview(file);
    if (!pendingLedgerImportPreview) return;
    renderLedgerImportPreview(pendingLedgerImportPreview);
  } catch (error) {
    showToast(`匯入失敗：${error.message}`);
  } finally {
    importLedgerInput.value = "";
  }
});

ledgerImportPreview?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-ledger-import-action]");
  if (!button || !pendingLedgerImportPreview) return;

  const action = button.dataset.ledgerImportAction;
  if (action === "cancel") {
    clearLedgerImportPreview();
    return;
  }

  const recordsToImport = action === "import-all"
    ? [...pendingLedgerImportPreview.cleanItems, ...pendingLedgerImportPreview.duplicateItems.map((item) => item.record)]
    : pendingLedgerImportPreview.cleanItems;

  if (!recordsToImport.length) {
    showToast("沒有可匯入的資料。");
    return;
  }

  button.disabled = true;
  button.textContent = "匯入中...";

  try {
    await saveImportedLedgerRecords(recordsToImport);
    const duplicateSkipped = action === "import-clean" ? pendingLedgerImportPreview.duplicateItems.length : 0;
    const skippedMessage = duplicateSkipped ? `，略過 ${duplicateSkipped} 筆疑似重複` : "";
    showToast(`已匯入 ${recordsToImport.length} 筆資料${skippedMessage}。`);
    clearLedgerImportPreview();
  } catch (error) {
    showToast(`匯入失敗：${error.message}`);
  } finally {
    button.disabled = false;
  }
});

inventoryTypeSelect.addEventListener("change", renderInventorySources);
inventoryActionSelect.addEventListener("change", renderInventoryOutSelector);
selectInventoryOutButton?.addEventListener("click", selectInventoryForManualOut);
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

overviewCheckList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pending-target]");
  if (!button) return;

  event.stopPropagation();
  navigateToViewTarget(button.dataset.pendingTarget, button.dataset.pendingType, button.dataset.recordId);
});

document.querySelector("#overviewView")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pending-target]");
  if (!button) return;

  navigateToViewTarget(button.dataset.pendingTarget, button.dataset.pendingType, button.dataset.recordId);
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

function handleVoucherInboxActionClick(event) {
  const removeMatchButton = event.target.closest("[data-voucher-remove-match]");
  if (removeMatchButton) {
    removeVoucherLedgerMatch(removeMatchButton.dataset.voucherId, removeMatchButton.dataset.ledgerId);
    return;
  }

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
}

voucherInboxList?.addEventListener("click", handleVoucherInboxActionClick);
voucherAdjustmentPanel?.addEventListener("click", handleVoucherInboxActionClick);

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

duplicateImportModal?.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-duplicate-import-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.duplicateImportAction;
  duplicateImportModal.hidden = true;
  if (duplicateImportDecisionResolver) {
    duplicateImportDecisionResolver(action);
    duplicateImportDecisionResolver = null;
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

fields.note.addEventListener("input", () => {
  fields.noteText.hidden = true;
  fields.noteText.value = "";
});

fields.inventorySync.addEventListener("change", renderLedgerInventorySync);
fields.inventorySplitIncome?.addEventListener("change", renderLedgerInventorySync);
fields.major.addEventListener("change", () => {
  if (recordType === "expense") renderExpenseDependentOptions({ preserveMiddle: false, preserveMinor: false });
  renderLedgerInventorySync();
});
fields.middle.addEventListener("change", () => {
  if (recordType === "expense") renderExpenseDependentOptions({ preserveMiddle: true, preserveMinor: false });
  renderLedgerInventorySync();
});
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
  if (recordType === "expense") optionsByType.expense.accountTree = normalizeExpenseAccountTree(defaultExpenseAccountTree);
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

recordsList.addEventListener("change", (event) => {
  const toggle = event.target.closest("[data-inventory-match-split]");
  if (!toggle) return;
  toggle.closest(".inventory-match-panel")?.classList.toggle("split-mode", toggle.checked);
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

  if (button.dataset.inventoryAction === "details") {
    showInventoryDetailDialog(record);
    return;
  }

  if (button.dataset.inventoryAction === "edit") {
    startEditingInventoryRecord(record);
    return;
  }

  if (button.dataset.inventoryAction === "delete") {
    await handleDeleteInventoryRecord(record);
  }
});

inventorySummary.addEventListener("click", (event) => {
  const button = event.target.closest("[data-inventory-summary-detail]");
  if (!button) return;

  showInventoryTypeDetailDialog(button.dataset.inventorySummaryDetail);
});

assetList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-asset-action]");
  if (!button) return;

  const record = assetCache.find((item) => item.id === button.dataset.assetId);
  if (!record) return;

  if (button.dataset.assetAction === "details") {
    showAssetDetailDialog(record);
    return;
  }

  if (button.dataset.assetAction === "rename") {
    await handleRenameAssetRecord(record);
    return;
  }

  if (button.dataset.assetAction === "delete") {
    await handleDeleteAssetRecord(record);
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

  if (!editingRecordId && record.type === "income" && fields.inventorySync.value === "yes") {
    const selectedInventory = await confirmInventoryOutSelections(record, {
      splitMode: isLedgerSplitIncomeMode(),
    });
    if (selectedInventory === null) return;
    pendingLedgerInventorySelections = selectedInventory;
  }

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
      const currentEditingId = editingRecordId;
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
      if (record.type === "expense") {
        const savedRecord = { id: currentEditingId, ...stripFile(record) };
        await handleLedgerInventorySync(savedRecord);
        await handleLedgerAssetSync(savedRecord);
        if (isConfigured) await loadInventoryRecords();
        if (isConfigured) await loadAssetRecords();
      }
    } else if (isConfigured) {
      const savedId = await saveRecordToFirebase(record);
      const savedRecord = { id: savedId, ...stripFile(record) };
      await handleLedgerInventorySync(savedRecord);
      await handleLedgerAssetSync(savedRecord);
      await loadRecords();
      await loadInventoryRecords();
      await loadAssetRecords();
    } else {
      const savedRecord = { id: crypto.randomUUID(), ...stripFile(record), createdAt: new Date() };
      recordsCache.unshift(savedRecord);
      saveLocalRecords();
      await handleLedgerInventorySync(savedRecord);
      await handleLedgerAssetSync(savedRecord);
      renderRecords(recordsCache);
      updateSummary(recordsCache);
      renderCustomReport();
      renderCashflow();
      renderPendingCenter();
      renderSettlementCenter();
    }

    rememberOptionValue("counterparties", record.counterparty);
    rememberOptionValue("notes", record.note);
    clearButton.click();
    showToast(previousRecord ? "紀錄已更新。" : "紀錄已儲存。");
  } catch (error) {
    showToast(`儲存失敗：${error.message}`);
  } finally {
    pendingLedgerInventorySelections = null;
    saveButton.disabled = false;
    saveButton.textContent = "儲存紀錄";
  }
});

async function handleAuthState(user) {
  currentUser = user;
  secondaryDataLoadPromise = null;
  isReadOnlyUser = false;

  if (!user) {
    setPayrollCloudContext(null);
    authStatus.textContent = "尚未登入";
    sidebarStatusTitle.textContent = "前端預覽模式";
    sidebarStatusDetail.textContent = "登入後會同步 Firebase 雲端資料";
    signInButton.hidden = false;
    signOutButton.hidden = true;
    saveButton.disabled = true;
    applyReadOnlyMode();
    return;
  }

  const allowed = allowedEmails.includes(user.email);
  isReadOnlyUser = allowed && isReadonlyEmail(user.email);
  authStatus.textContent = allowed ? user.email : `${user.email} 未授權`;
  sidebarStatusTitle.textContent = allowed ? "雲端同步模式" : "登入未授權";
  sidebarStatusDetail.textContent = allowed
    ? "已使用 Firebase 儲存與讀取資料"
    : "此帳號目前無法讀寫雲端資料";
  signInButton.hidden = true;
  signOutButton.hidden = false;
  saveButton.disabled = !allowed || isReadOnlyUser;
  if (isReadOnlyUser) {
    authStatus.textContent = `${user.email}（只讀）`;
    sidebarStatusTitle.textContent = "只讀查閱模式";
    sidebarStatusDetail.textContent = "可查閱、調整日期與匯出；不可新增、刪除、修改、匯入或同步。";
  }
  applyReadOnlyMode();

  if (!allowed) {
    showToast("此 Gmail 尚未列入允許清單。");
    return;
  }

  await loadSharedOptions();
  setPayrollCloudContext({ firebaseApi, db, currentUser, isReadOnlyUser });
  loadRecords();
  window.setTimeout(loadSecondaryData, 800);
  window.setTimeout(applyReadOnlyMode, 1200);
}

function loadSecondaryData() {
  if (!isConfigured || !currentUser || !db) return Promise.resolve();
  if (secondaryDataLoadPromise) return secondaryDataLoadPromise;

  secondaryDataLoadPromise = Promise.allSettled([
    loadInventoryRecords(),
    loadAssetRecords(),
    loadBankTransactions(),
    loadLineDrafts(),
    loadVoucherInbox(),
  ]).then((results) => {
    const failed = results.find((result) => result.status === "rejected");
    if (failed) {
      console.warn("Secondary data load failed", failed.reason);
      showToast("部分資料稍後載入失敗，請重新整理後再試。");
    }
    return results;
  });

  return secondaryDataLoadPromise;
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
  inventoryOpeningCaseQtyInput.value = settings.openingCaseQty ?? "";
  inventoryOpeningBoxQtyInput.value = settings.openingBoxQty ?? "";
  inventoryOpeningCardQtyInput.value = settings.openingCardQty ?? "";
  inventoryOpeningCostInput.value = settings.openingCost ?? "";
}

function saveInventorySettings() {
  localStorage.setItem(
    "inventorySettings",
    JSON.stringify({
      openingCaseQty: Number(inventoryOpeningCaseQtyInput.value || 0),
      openingBoxQty: Number(inventoryOpeningBoxQtyInput.value || 0),
      openingCardQty: Number(inventoryOpeningCardQtyInput.value || 0),
      openingCost: Number(inventoryOpeningCostInput.value || 0),
    }),
  );
}

function renderAllOptions() {
  const options = optionsByType[recordType];
  const currentMajor = fields.major.value;
  const currentMiddle = fields.middle.value;
  const currentMinor = fields.minor.value;
  fillDatalist("counterpartyOptions", options.counterparties);
  fillSelect(fields.cashflow, options.cashflows);
  fillSelect(fields.account, options.accounts);
  if (recordType === "expense") {
    const majorOptions = getExpenseMajorOptions(options);
    const shouldPreserveExpenseBranch = majorOptions.includes(currentMajor);
    fillSelect(fields.major, majorOptions, currentMajor);
    renderExpenseDependentOptions({
      preserveMiddle: shouldPreserveExpenseBranch,
      preserveMinor: shouldPreserveExpenseBranch,
      middleValue: currentMiddle,
      minorValue: currentMinor,
    });
  } else {
    fillSelect(fields.major, options.majors, currentMajor);
    fillSelect(fields.middle, options.middles, currentMiddle);
    fillSelect(fields.minor, options.minors, currentMinor);
  }
  fillDatalist("noteOptions", options.notes);
  if (!fields.note.value) fields.note.value = options.notes[0] || "";
}

function renderExpenseDependentOptions({
  preserveMiddle = true,
  preserveMinor = true,
  middleValue = fields.middle.value,
  minorValue = fields.minor.value,
} = {}) {
  const middleSelection = preserveMiddle ? middleValue : "";
  fillSelect(fields.middle, getExpenseMiddleOptions(fields.major.value, middleSelection), middleSelection);

  const minorSelection = preserveMinor ? minorValue : "";
  fillSelect(
    fields.minor,
    getExpenseMinorOptions(fields.major.value, fields.middle.value, minorSelection),
    minorSelection,
  );
}

function getExpenseMajorOptions(options) {
  return uniqueOptions(options.majors, Object.keys(getExpenseAccountTree()));
}

function getExpenseMiddleOptions(major, currentValue = "") {
  const tree = getExpenseAccountTree();
  const middleOptions = tree[major] ? Object.keys(tree[major]) : [];
  const fallback = middleOptions.length ? middleOptions : optionsByType.expense.middles;
  return uniqueOptions(fallback, [currentValue], ["自訂"]);
}

function getExpenseMinorOptions(major, middle, currentValue = "") {
  const tree = getExpenseAccountTree();
  const minorOptions = tree[major]?.[middle] || [];
  const fallback = minorOptions.length ? minorOptions : optionsByType.expense.minors;
  return uniqueOptions(fallback, [currentValue], ["自訂"]);
}

function getExpenseAccountTree() {
  return normalizeExpenseAccountTree(optionsByType.expense?.accountTree || defaultExpenseAccountTree);
}

function normalizeExpenseAccountTree(tree = {}) {
  const normalized = {};
  Object.entries(tree || {}).forEach(([major, middles]) => {
    const majorName = String(major || "").trim();
    if (!majorName) return;
    normalized[majorName] ||= {};
    Object.entries(middles || {}).forEach(([middle, minors]) => {
      const middleName = String(middle || "").trim();
      if (!middleName) return;
      normalized[majorName][middleName] = uniqueOptions(Array.isArray(minors) ? minors : [], ["自訂"]);
    });
  });
  return normalized;
}

function uniqueOptions(...groups) {
  return Array.from(
    new Set(
      groups
        .flat()
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
}

function fillSelect(select, values, selectedValue = select.value) {
  select.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("");
  if (selectedValue && values.includes(selectedValue)) select.value = selectedValue;
}

function fillDatalist(id, values) {
  const datalist = document.querySelector(`#${id}`);
  if (!datalist) return;
  datalist.innerHTML = values
    .filter((value) => value !== "自訂")
    .map((value) => `<option value="${escapeHtml(value)}"></option>`)
    .join("");
}

function renderOptionsEditor() {
  const options = optionsByType[recordType];
  optionsTitle.textContent = `管理${typeLabel(recordType)}選項`;
  const basicEditors = Object.entries(optionLabels)
    .map(([key, label]) => {
      return `
        <article class="option-box">
          <h3>${typeLabel(recordType)}：${label}</h3>
          <textarea data-option-editor="${key}">${escapeHtml(options[key].join("\n"))}</textarea>
        </article>
      `;
    })
    .join("");
  optionsEditor.innerHTML = basicEditors + (recordType === "expense" ? renderExpenseAccountTreeEditor() : "");

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

  bindExpenseAccountTreeEditor();
}

function renderExpenseAccountTreeEditor() {
  const options = optionsByType.expense;
  const tree = getEditableExpenseAccountTree();
  const majors = getExpenseMajorOptions(options);
  const selectedMajor = majors[0] || "";
  const selectedMiddle = Object.keys(tree[selectedMajor] || {})[0] || "";
  return `
    <article class="option-box account-tree-box">
      <h3>支出：科目關聯</h3>
      <p>選大項後勾選可用中項，再選中項勾選可用細項。</p>
      <label>
        大項
        <select data-account-tree-major>
          ${majors.map((major) => `<option value="${escapeHtml(major)}">${escapeHtml(major)}</option>`).join("")}
        </select>
      </label>
      <div>
        <strong>這個大項底下的中項</strong>
        <div class="account-tree-checks" data-account-tree-middle-list></div>
      </div>
      <label>
        編輯細項的中項
        <select data-account-tree-middle>
          ${selectedMiddle ? `<option value="${escapeHtml(selectedMiddle)}">${escapeHtml(selectedMiddle)}</option>` : ""}
        </select>
      </label>
      <div>
        <strong>這個中項底下的細項</strong>
        <div class="account-tree-checks" data-account-tree-minor-list></div>
      </div>
      <button type="button" data-account-tree-save>儲存科目關聯</button>
    </article>
  `;
}

function bindExpenseAccountTreeEditor() {
  if (recordType !== "expense") return;
  const box = optionsEditor.querySelector(".account-tree-box");
  if (!box) return;

  const majorSelect = box.querySelector("[data-account-tree-major]");
  const middleSelect = box.querySelector("[data-account-tree-middle]");
  const middleList = box.querySelector("[data-account-tree-middle-list]");
  const minorList = box.querySelector("[data-account-tree-minor-list]");
  const saveButton = box.querySelector("[data-account-tree-save]");

  const renderMiddleChecks = () => {
    const tree = getEditableExpenseAccountTree();
    const major = majorSelect.value;
    const selectedMiddles = Object.keys(tree[major] || {});
    const middleOptions = uniqueOptions(optionsByType.expense.middles, selectedMiddles);
    middleList.innerHTML = middleOptions
      .map((middle) => `
        <label class="account-tree-check">
          <input type="checkbox" data-account-tree-middle-check value="${escapeHtml(middle)}" ${selectedMiddles.includes(middle) ? "checked" : ""} />
          <span>${escapeHtml(middle)}</span>
        </label>
      `)
      .join("");
    renderMiddleSelect();
  };

  const renderMiddleSelect = () => {
    const tree = getEditableExpenseAccountTree();
    const major = majorSelect.value;
    const checkedMiddles = Array.from(middleList.querySelectorAll("[data-account-tree-middle-check]:checked")).map((input) => input.value);
    checkedMiddles.forEach((middle) => {
      tree[major] ||= {};
      tree[major][middle] ||= ["自訂"];
    });
    middleSelect.innerHTML = checkedMiddles
      .map((middle) => `<option value="${escapeHtml(middle)}">${escapeHtml(middle)}</option>`)
      .join("");
    if (!checkedMiddles.includes(middleSelect.value)) middleSelect.value = checkedMiddles[0] || "";
    renderMinorChecks();
  };

  const renderMinorChecks = () => {
    const tree = getEditableExpenseAccountTree();
    const major = majorSelect.value;
    const middle = middleSelect.value;
    const selectedMinors = tree[major]?.[middle] || [];
    const minorOptions = uniqueOptions(optionsByType.expense.minors, selectedMinors);
    minorList.innerHTML = middle
      ? minorOptions.map((minor) => `
          <label class="account-tree-check">
            <input type="checkbox" data-account-tree-minor-check value="${escapeHtml(minor)}" ${selectedMinors.includes(minor) ? "checked" : ""} />
            <span>${escapeHtml(minor)}</span>
          </label>
        `).join("")
      : `<span class="muted-text">先勾選一個中項。</span>`;
  };

  const updateCurrentMajorTree = () => {
    const tree = getEditableExpenseAccountTree();
    const major = majorSelect.value;
    const previousTree = tree[major] || {};
    const selectedMiddles = Array.from(middleList.querySelectorAll("[data-account-tree-middle-check]:checked")).map((input) => input.value);
    tree[major] = {};
    selectedMiddles.forEach((middle) => {
      tree[major][middle] = previousTree[middle] || ["自訂"];
    });
    renderMiddleSelect();
  };

  const updateCurrentMiddleMinors = () => {
    const tree = getEditableExpenseAccountTree();
    const major = majorSelect.value;
    const middle = middleSelect.value;
    if (!major || !middle) return;
    const selectedMinors = Array.from(minorList.querySelectorAll("[data-account-tree-minor-check]:checked")).map((input) => input.value);
    tree[major] ||= {};
    tree[major][middle] = uniqueOptions(selectedMinors, ["自訂"]);
  };

  majorSelect.addEventListener("change", renderMiddleChecks);
  middleSelect.addEventListener("change", renderMinorChecks);
  middleList.addEventListener("change", updateCurrentMajorTree);
  minorList.addEventListener("change", updateCurrentMiddleMinors);
  saveButton.addEventListener("click", () => {
    updateCurrentMiddleMinors();
    optionsByType.expense.accountTree = normalizeExpenseAccountTree(optionsByType.expense.accountTree);
    saveOptions();
    renderAllOptions();
    showToast("支出科目關聯已儲存。");
  });

  renderMiddleChecks();
}

function getEditableExpenseAccountTree() {
  optionsByType.expense.accountTree = normalizeExpenseAccountTree(optionsByType.expense.accountTree || defaultExpenseAccountTree);
  return optionsByType.expense.accountTree;
}

function normalizeOptions(values, fallback) {
  const normalized = values.length ? Array.from(new Set(values)) : [...fallback];
  if (!normalized.includes("自訂")) normalized.push("自訂");
  return normalized;
}

function rememberOptionValue(key, value) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed === "自訂") return;
  const current = optionsByType[recordType][key] || [];
  if (current.includes(trimmed)) return;

  optionsByType[recordType][key] = normalizeOptions([...current, trimmed], defaultOptionsByType[recordType][key]);
  saveOptions();
  renderAllOptions();
  renderOptionsEditor();
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
  renderRecords(recordsCache);
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
  if (["reports", "cashflow", "settlement", "inventory", "assets", "pending", "vouchers"].includes(view)) {
    loadSecondaryData();
  }
  if (view === "reports") renderCustomReport();
  if (view === "cashflow") renderCashflow();
  if (view === "settlement") renderSettlementCenter();
  if (view === "inventory") renderInventory();
  if (view === "assets") renderAssets();
  if (view === "payroll") initPayrollPage();
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
  const counterparty = fields.counterparty.value.trim();
  const note = fields.note.value.trim();
  const voucherFiles = getVoucherFiles();
  const voucherFileNames = voucherFiles.map((file) => file.name);
  const dueDate = fields.dueDate.value;
  const invoiceNumber = normalizeInvoiceNumber(fields.invoiceNumber.value);
  const settlementStatus = resolveSettlementStatus(fields.settlementStatus.value, dueDate, "", recordType);

  if (!date || date < "2026-01-01" || date > "2035-12-31") {
    showToast("請選擇 2026-2035 之間的日期。");
    return null;
  }

  if (!counterparty) {
    showToast("請輸入或選擇交易對象。");
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
    counterparty,
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

function isNoInvoiceNumber(value) {
  const normalized = normalizeInvoiceNumber(value).replace(/\s+/g, "");
  return ["無", "沒有", "無發票", "免發票", "免開發票", "不用發票", "N/A", "NA", "NONE", "NO"].includes(normalized);
}

function hasInvoiceNumberValue(value) {
  const normalized = normalizeInvoiceNumber(value);
  return Boolean(normalized && !isNoInvoiceNumber(normalized));
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
  if (isNoInvoiceNumber(record.invoiceNumber)) return false;
  return Boolean(
    record.invoiceRequired === true ||
      record.type === "expense" ||
      record.invoiceStatus === "有" ||
      hasAttachedVoucher(record) ||
      /發票|收據|憑證/.test(record.pendingReason || ""),
  );
}

function resolveVoucherPendingReason(record) {
  if (isNoInvoiceNumber(record.invoiceNumber)) return "";
  if (!recordNeedsVoucher(record)) return record.pendingReason || "";
  if (!hasAttachedVoucher(record)) return "待補憑證";
  if (!hasInvoiceNumberValue(record.invoiceNumber)) return "待補發票號碼";
  if (record.pendingReason && !/發票|收據|憑證/.test(record.pendingReason)) return record.pendingReason;
  return "";
}

function hasReportablePendingReason(record) {
  return Boolean(record.pendingReason && !isNoInvoiceNumber(record.invoiceNumber));
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
  fields.counterparty.value = record.counterparty || "";
  fields.item.value = record.item || "";
  fields.amount.value = Number(record.amount || 0);
  ensureSelectValue(fields.cashflow, record.cashflow);
  ensureSelectValue(fields.account, record.account);
  renderSettlementStatusOptions(record.settlementStatus);
  fields.dueDate.value = record.dueDate || "";
  fields.invoiceNumber.value = record.invoiceNumber || "";
  ensureSelectValue(fields.major, record.major);
  if (record.type === "expense") {
    renderExpenseDependentOptions({ preserveMiddle: false, preserveMinor: false });
  }
  ensureSelectValue(fields.middle, record.middle);
  if (record.type === "expense") {
    renderExpenseDependentOptions({ preserveMiddle: true, preserveMinor: false });
  }
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
  fields.note.value = note || "無";
  fields.noteText.hidden = true;
  fields.noteText.value = "";
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
      return isVisibleToCurrentUser(draft) && !draft.deletedAt && !["confirmed", "ignored"].includes(draft.status);
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
  const existingInventoryItems = inventoryCache
    .filter((item) => !item.deletedAt && item.linkedLedgerId === record.id && item.action === "in")
    .sort(compareSyncedInventoryItems);
  const drafts = existingInventoryItems.length
    ? existingInventoryItems.map((item) => ({
      name: item.name || record.minor || record.item,
      quantity: Number(item.quantity || 1),
      totalCost: Number(item.totalCost || 0),
    }))
    : buildInventoryInDraftsFromExpense(record);
  const inventoryItems = await confirmInventoryInDrafts(record, drafts);
  if (inventoryItems === null) return;

  if (!inventoryItems.length) {
    showToast("請至少保留一筆入庫品項。");
    return;
  }

  for (const [index, item] of inventoryItems.entries()) {
    const inventoryRecord = {
      ...buildInventoryInRecordFromExpense(record, item),
      syncOrder: index,
    };
    const existingInventory = existingInventoryItems[index];
    if (existingInventory) {
      await updateSyncedInventoryRecord(existingInventory, inventoryRecord);
    } else {
      await addInventoryRecord(inventoryRecord);
    }
  }

  for (const extraRecord of existingInventoryItems.slice(inventoryItems.length)) {
    await softDeleteRecord("inventoryRecords", extraRecord.id, extraRecord);
  }
}

function compareSyncedInventoryItems(a, b) {
  const orderA = Number.isFinite(Number(a.syncOrder)) ? Number(a.syncOrder) : Number.POSITIVE_INFINITY;
  const orderB = Number.isFinite(Number(b.syncOrder)) ? Number(b.syncOrder) : Number.POSITIVE_INFINITY;
  if (orderA !== orderB) return orderA - orderB;
  return getRecordTimeValue(a) - getRecordTimeValue(b);
}

function buildInventoryInDraftsFromExpense(record) {
  const items = parseInventoryItemsFromText(record.item);
  const baseItems = items.length ? items : [{
    name: record.minor || record.item || "未命名貨品",
    quantity: inferInventoryQuantityFromText(record.item) || 1,
  }];
  return allocateInventoryCost(baseItems, Number(record.amount || 0));
}

function confirmInventoryInDrafts(record, drafts) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "match-dialog-overlay";
    overlay.innerHTML = `
      <div class="match-dialog inventory-draft-dialog" role="dialog" aria-modal="true" aria-label="確認入庫品項">
        <div class="match-dialog-header">
          <div>
            <p class="eyebrow">INVENTORY ITEMS</p>
            <h3>確認入庫品項</h3>
            <p>${escapeHtml(record.item || "支出紀錄")} · 支出 NT$ ${formatNumber(record.amount || 0)}</p>
          </div>
          <button type="button" data-inventory-draft-cancel>×</button>
        </div>
        <div class="inventory-draft-table-wrap">
          <table class="inventory-draft-table">
            <thead>
              <tr>
                <th>品名</th>
                <th>數量</th>
                <th>單位成本</th>
                <th>總成本</th>
                <th></th>
              </tr>
            </thead>
            <tbody data-inventory-draft-rows></tbody>
          </table>
        </div>
        <div class="inventory-draft-footer">
          <div class="inventory-draft-tools">
            <button type="button" class="secondary-button" data-inventory-draft-add>＋新增細項</button>
            <button type="button" class="secondary-button" data-inventory-draft-add-batch>＋新增 5 列</button>
          </div>
          <strong data-inventory-draft-total>總成本 NT$ 0</strong>
          <div class="inventory-draft-actions">
            <button type="button" class="secondary-button" data-inventory-draft-cancel>取消</button>
            <button type="button" data-inventory-draft-confirm>確認入庫</button>
          </div>
        </div>
      </div>
    `;

    const tbody = overlay.querySelector("[data-inventory-draft-rows]");
    const totalLabel = overlay.querySelector("[data-inventory-draft-total]");

    const close = (value) => {
      overlay.remove();
      resolve(value);
    };

    const updateTotals = () => {
      let grandTotal = 0;
      tbody.querySelectorAll("tr").forEach((row) => {
        const quantity = Number(row.querySelector("[data-inventory-draft-qty]")?.value || 0);
        const unitCost = Number(row.querySelector("[data-inventory-draft-unit-cost]")?.value || 0);
        const totalCost = Math.max(0, quantity * unitCost);
        const totalInput = row.querySelector("[data-inventory-draft-total-cost]");
        if (totalInput) totalInput.value = totalCost ? formatInventoryDraftAmount(totalCost) : "";
        grandTotal += totalCost;
      });
      totalLabel.textContent = `總成本 NT$ ${formatInventoryDraftAmount(grandTotal)}`;
    };

    const addRow = (item = {}) => {
      const quantity = Number(item.quantity || 1);
      const totalCost = Number(item.totalCost || 0);
      const unitCost = quantity ? totalCost / quantity : 0;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="text" data-inventory-draft-name value="${escapeHtml(item.name || "")}" placeholder="例如：130pt卡磚" /></td>
        <td><input type="number" min="1" step="1" inputmode="numeric" data-inventory-draft-qty value="${quantity || 1}" /></td>
        <td><input type="number" min="0" step="0.01" inputmode="decimal" data-inventory-draft-unit-cost value="${unitCost ? formatInventoryDraftAmount(unitCost) : ""}" /></td>
        <td><input type="number" step="0.01" tabindex="-1" data-inventory-draft-total-cost readonly /></td>
        <td><button type="button" class="secondary-button compact-button" data-inventory-draft-remove>刪除</button></td>
      `;
      tbody.appendChild(row);
      updateTotals();
    };

    (drafts.length ? drafts : [{ name: record.minor || record.item || "", quantity: 1, totalCost: Number(record.amount || 0) }]).forEach(addRow);

    overlay.addEventListener("input", (event) => {
      if (event.target.matches("[data-inventory-draft-qty], [data-inventory-draft-unit-cost]")) updateTotals();
    });

    overlay.addEventListener("click", (event) => {
      if (event.target.closest("[data-inventory-draft-cancel]")) {
        close(null);
        return;
      }
      if (event.target.closest("[data-inventory-draft-add]")) {
        addRow({ quantity: 1 });
        tbody.querySelector("tr:last-child [data-inventory-draft-name]")?.focus();
        return;
      }
      if (event.target.closest("[data-inventory-draft-add-batch]")) {
        Array.from({ length: 5 }).forEach(() => addRow({ quantity: 1 }));
        tbody.querySelector("tr:last-child [data-inventory-draft-name]")?.focus();
        return;
      }
      const removeButton = event.target.closest("[data-inventory-draft-remove]");
      if (removeButton) {
        removeButton.closest("tr")?.remove();
        updateTotals();
        return;
      }
      if (event.target.closest("[data-inventory-draft-confirm]")) {
        updateTotals();
        const items = Array.from(tbody.querySelectorAll("tr")).map((row) => {
          const name = row.querySelector("[data-inventory-draft-name]")?.value.trim() || "";
          const quantity = Number(row.querySelector("[data-inventory-draft-qty]")?.value || 0);
          const unitCost = Number(row.querySelector("[data-inventory-draft-unit-cost]")?.value || 0);
          return { name, quantity, totalCost: quantity * unitCost };
        }).filter((item) => item.name && item.quantity > 0);
        close(items);
      }
    });

    document.body.appendChild(overlay);
    tbody.querySelector("[data-inventory-draft-name]")?.focus();
  });
}

function formatInventoryDraftAmount(value) {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 4,
    useGrouping: false,
  });
}

function parseInventoryItemsFromText(text) {
  return String(text || "")
    .split(/[、,，;；／/]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const quantity = inferInventoryQuantityFromText(part) || 1;
      const name = part
        .replace(/[xX×＊*]\s*\d+(?:\.\d+)?\s*\S*$/u, "")
        .replace(/\s*\d+(?:\.\d+)?\s*(包|盒|個|組|張|片|件|本|台)$/u, "")
        .trim();
      return { name: name || part, quantity };
    });
}

function allocateInventoryCost(items, totalAmount) {
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || items.length || 1;
  let allocated = 0;
  return items.map((item, index) => {
    const isLast = index === items.length - 1;
    const totalCost = isLast ? Math.max(0, totalAmount - allocated) : Math.round(totalAmount * Number(item.quantity || 0) / totalQuantity);
    allocated += totalCost;
    return { ...item, totalCost };
  });
}

function parseInventoryInPrompt(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[|｜\t]/).map((part) => part.trim());
      const fallback = parseInventoryItemsFromText(parts[0] || line)[0] || {};
      const name = parts[0] || fallback.name || "";
      const quantity = Number((parts[1] || fallback.quantity || "").toString().replace(/,/g, ""));
      const totalCost = Number((parts[2] || "0").toString().replace(/,/g, ""));
      return {
        name,
        quantity,
        totalCost,
      };
    })
    .filter((item) => item.name && item.quantity > 0);
}

function buildInventoryInRecordFromExpense(record, item) {
  return {
    date: record.date,
    month: record.month,
    type: inferInventoryTypeFromExpenseRecord(record, item),
    action: "in",
    source: "支出同步入庫",
    name: item.name,
    quantity: item.quantity,
    unitCost: Number(item.totalCost || 0) / item.quantity,
    totalCost: Number(item.totalCost || 0),
    reference: `支出：${record.item}`,
    note: `由支出紀錄同步入庫；交易對象：${record.counterparty}`,
    linkedLedgerId: record.id,
  };
}

function inferInventoryTypeFromExpenseRecord(record, item) {
  const categoryText = `${record.major || ""} ${record.middle || ""} ${record.minor || ""}`;
  const itemText = `${item.name || ""}`;
  if (/包材|包裝|耗材/.test(categoryText)) return "supply";
  if (/卡磚|卡夾|卡膜|自黏袋|自粘袋|保護套|team\s*bag|sleeve|toploader|holder/i.test(itemText)) return "supply";
  return inferInventoryTypeFromText(`${categoryText} ${itemText}`);
}

async function updateSyncedInventoryRecord(previousRecord, updatedFields) {
  const updatedRecord = {
    ...previousRecord,
    ...updatedFields,
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
    updatedBy: currentUser?.email || "local-preview",
  };

  await writeAuditLog("update", "inventoryRecords", previousRecord.id, previousRecord, updatedRecord);
  if (isConfigured) {
    const { id, ...payload } = updatedRecord;
    await firebaseApi.updateDoc(firebaseApi.doc(db, "inventoryRecords", previousRecord.id), payload);
    await loadInventoryRecords();
    return;
  }

  inventoryCache = inventoryCache.map((item) => (item.id === previousRecord.id ? updatedRecord : item));
  saveLocalInventoryRecords();
  renderInventory();
  renderLedgerInventorySync();
}

function inferInventoryQuantityFromText(text) {
  const match = String(text || "").match(/[xX×＊*]\s*(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

async function createInventoryOutFromIncome(record) {
  const selected = getSelectedLedgerInventoryLots();
  if (!selected.length) {
    showToast("已選擇同步出庫，但尚未選取庫存。");
    return;
  }

  if (selected.some((item) => !isValidInventoryOutSelection(item))) {
    showToast("出庫數量必須大於 0，且不可超過可用庫存。");
    return;
  }

  const links = [];
  await applyInventoryAdjustmentsFromSelections(selected);
  for (const item of selected) {
    const outbound = buildInventoryOutboundFromSelection(item);
    const outRecord = {
      date: record.date,
      month: record.month,
      type: outbound.type,
      action: "out",
      source: "銷售出庫",
      name: outbound.name,
      quantity: outbound.quantity,
      unitCost: outbound.unitCost,
      totalCost: outbound.totalCost,
      sourceQuantityUsed: outbound.sourceQuantityUsed,
      splitTotalUnits: outbound.splitTotalUnits,
      splitSoldUnits: outbound.splitSoldUnits,
      reference: `收入：${record.item}`,
      note: `由收入紀錄同步出庫；來源庫存：${item.lot.source}`,
      linkedLedgerId: record.id,
      sourceInventoryId: item.lot.id,
    };
    const savedId = await addInventoryRecord(outRecord);
    links.push({
      inventoryRecordId: savedId,
      sourceInventoryId: item.lot.id,
      name: outbound.name,
      type: outbound.type,
      quantity: outbound.displayQuantity,
      unitCost: outbound.unitCost,
      totalCost: outbound.totalCost,
      splitTotalUnits: outbound.splitTotalUnits,
      splitSoldUnits: outbound.splitSoldUnits,
    });
  }

  await updateLedgerInventoryLinks(record, links);
}

function confirmInventoryOutSelections(record, options = {}) {
  return new Promise((resolve) => {
    const availableLots = getAvailableInventoryLots();
    const splitMode = Boolean(options.splitMode);
    const singleSelect = Boolean(options.singleSelect);
    const confirmLabel = options.confirmLabel || "確認配對";
    const footerText = options.footerText || (splitMode ? "拆盒收入：用原庫存總成本按盒數比例計算成本。" : "一般配對：直接扣選取庫存數量。");
    const overlay = document.createElement("div");
    overlay.className = "match-dialog-overlay";
    overlay.innerHTML = `
      <div class="match-dialog inventory-out-dialog ${splitMode ? "split-mode" : ""}" role="dialog" aria-modal="true" aria-label="庫存配對">
        <div class="match-dialog-header">
          <div>
            <p class="eyebrow">INVENTORY MATCH</p>
            <h3>庫存配對</h3>
            <p>${escapeHtml(record.item || "收入")} · 收入 NT$ ${formatNumber(record.amount || 0)}</p>
          </div>
          <button type="button" data-inventory-out-cancel>×</button>
        </div>
        <div class="inventory-out-table-wrap">
          <table class="inventory-out-table">
            <thead>
              <tr>
                <th>選</th>
                <th>庫存品項</th>
                <th>類型</th>
                <th>可用</th>
                <th>庫存成本</th>
                ${splitMode ? "<th>總盒數</th><th>賣出盒數</th>" : "<th>本次沖銷數量</th>"}
                <th>修正庫存數量</th>
                <th>修正總成本</th>
              </tr>
            </thead>
            <tbody>
              ${
                availableLots.length
                  ? availableLots.map((lot) => renderInventoryOutSelectionRow(lot, splitMode)).join("")
                  : `<tr><td colspan="${splitMode ? 9 : 8}">目前沒有可出庫的庫存。</td></tr>`
              }
            </tbody>
          </table>
        </div>
        <div class="inventory-out-footer">
          <span>${escapeHtml(footerText)}</span>
          <div>
            <button type="button" class="secondary-button" data-inventory-out-cancel>取消</button>
            <button type="button" data-inventory-out-confirm ${availableLots.length ? "" : "disabled"}>${escapeHtml(confirmLabel)}</button>
          </div>
        </div>
      </div>
    `;

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest("[data-inventory-out-cancel]")) {
        overlay.remove();
        resolve(null);
        return;
      }

      if (event.target.closest("[data-inventory-out-confirm]")) {
        const selected = readInventoryOutSelectionsFromContainer(overlay, splitMode);
        if (!selected.length) {
          showToast("請至少勾選一筆庫存。");
          return;
        }
        if (singleSelect && selected.length > 1) {
          showToast("手動出庫一次請選一筆庫存。");
          return;
        }
        if (selected.some((item) => !isValidInventoryOutSelection(item))) {
          showToast(splitMode ? "請確認總盒數、賣出盒數與可用庫存。" : "請確認出庫數量不可超過可用庫存。");
          return;
        }
        overlay.remove();
        resolve(selected);
      }
    });

    document.body.appendChild(overlay);
  });
}

function renderInventoryOutSelectionRow(lot, splitMode) {
  const unit = inventoryUnitLabels[lot.type] || "件";
  return `
    <tr>
      <td><input type="checkbox" data-inventory-out-id="${escapeHtml(lot.id)}" /></td>
      <td>
        <strong>${escapeHtml(lot.name)}</strong>
        <small>${escapeHtml(lot.source || "未填來源")}</small>
      </td>
      <td>${escapeHtml(inventoryTypeLabels[lot.type] || lot.type)}</td>
      <td>${formatNumber(lot.remainingQuantity)} ${unit}</td>
      <td>NT$ ${formatNumber(lot.totalCost)}</td>
      ${
        splitMode
          ? `
            <td><input type="number" min="1" step="1" data-inventory-split-total="${escapeHtml(lot.id)}" /></td>
            <td><input type="number" min="1" step="1" value="1" data-inventory-split-sold="${escapeHtml(lot.id)}" /></td>
          `
          : `<td><input type="number" min="1" max="${escapeHtml(lot.remainingQuantity)}" step="1" value="1" data-inventory-out-qty="${escapeHtml(lot.id)}" /></td>`
      }
      <td><input type="number" min="0" step="0.01" value="${escapeHtml(lot.quantity)}" data-inventory-adjust-qty="${escapeHtml(lot.id)}" /></td>
      <td><input type="number" min="0" step="0.01" value="${escapeHtml(lot.totalCost)}" data-inventory-adjust-cost="${escapeHtml(lot.id)}" /></td>
    </tr>
  `;
}

function readInventoryOutSelectionsFromContainer(container, splitMode) {
  const availableLots = getAvailableInventoryLots();
  return Array.from(container.querySelectorAll("[data-inventory-out-id]:checked")).map((checkbox) => {
    const lot = availableLots.find((item) => item.id === checkbox.dataset.inventoryOutId);
    const qtyInput = container.querySelector(`[data-inventory-out-qty="${CSS.escape(checkbox.dataset.inventoryOutId)}"]`);
    const adjustQtyInput = container.querySelector(`[data-inventory-adjust-qty="${CSS.escape(checkbox.dataset.inventoryOutId)}"]`);
    const adjustCostInput = container.querySelector(`[data-inventory-adjust-cost="${CSS.escape(checkbox.dataset.inventoryOutId)}"]`);
    const splitTotalInput = container.querySelector(`[data-inventory-split-total="${CSS.escape(checkbox.dataset.inventoryOutId)}"]`);
    const splitSoldInput = container.querySelector(`[data-inventory-split-sold="${CSS.escape(checkbox.dataset.inventoryOutId)}"]`);
    return buildInventorySelection(lot, {
      quantity: Number(qtyInput?.value || 0),
      splitMode,
      splitTotalUnits: Number(splitTotalInput?.value || 0),
      splitSoldUnits: Number(splitSoldInput?.value || 0),
      adjustedQuantity: Number(adjustQtyInput?.value || lot?.quantity || 0),
      adjustedTotalCost: Number(adjustCostInput?.value || lot?.totalCost || 0),
    });
  }).filter((item) => item.lot);
}

function isLedgerSplitIncomeMode() {
  return recordType === "income" && fields.inventorySplitIncome?.checked;
}

function buildInventorySelection(lot, options = {}) {
  const splitMode = Boolean(options.splitMode);
  const splitTotalUnits = Number(options.splitTotalUnits || 0);
  const splitSoldUnits = Number(options.splitSoldUnits || 0);
  const lotQuantity = Number(lot?.quantity || 0);
  const adjustedQuantity = Number(options.adjustedQuantity || lotQuantity);
  const adjustedTotalCost = Number(options.adjustedTotalCost ?? lot?.totalCost ?? 0);
  const adjustedLot = lot
    ? {
        ...lot,
        quantity: adjustedQuantity,
        remainingQuantity: Number(lot.remainingQuantity || 0) + (adjustedQuantity - lotQuantity),
        totalCost: adjustedTotalCost,
        unitCost: adjustedQuantity ? adjustedTotalCost / adjustedQuantity : Number(lot.unitCost || 0),
      }
    : lot;
  const hasAdjustment = Boolean(lot) && (
    adjustedQuantity !== Number(lot.quantity || 0) ||
    adjustedTotalCost !== Number(lot.totalCost || 0)
  );
  return {
    lot: adjustedLot,
    quantity: Number(options.quantity || 0),
    splitMode,
    splitTotalUnits,
    splitSoldUnits,
    sourceQuantityUsed: splitMode && splitTotalUnits ? adjustedQuantity * (splitSoldUnits / splitTotalUnits) : Number(options.quantity || 0),
    inventoryAdjustment: hasAdjustment
      ? {
          id: lot.id,
          quantity: adjustedQuantity,
          totalCost: adjustedTotalCost,
          unitCost: adjustedQuantity ? adjustedTotalCost / adjustedQuantity : 0,
        }
      : null,
  };
}

async function applyInventoryAdjustmentsFromSelections(selections) {
  const adjustments = selections
    .map((item) => item.inventoryAdjustment)
    .filter(Boolean);
  if (!adjustments.length) return;

  for (const adjustment of adjustments) {
    const previousRecord = inventoryCache.find((item) => item.id === adjustment.id);
    if (!previousRecord) continue;
    const updatedRecord = {
      ...previousRecord,
      quantity: adjustment.quantity,
      totalCost: adjustment.totalCost,
      unitCost: adjustment.unitCost,
      updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
      updatedBy: currentUser?.email || "local-preview",
    };

    await writeAuditLog("update", "inventoryRecords", previousRecord.id, previousRecord, updatedRecord);
    if (isConfigured) {
      const { id, ...payload } = updatedRecord;
      await firebaseApi.updateDoc(firebaseApi.doc(db, "inventoryRecords", previousRecord.id), payload);
    } else {
      inventoryCache = inventoryCache.map((item) => (item.id === previousRecord.id ? updatedRecord : item));
    }
  }

  if (!isConfigured) saveLocalInventoryRecords();
}

function isValidInventoryOutSelection(item) {
  if (!item?.lot) return false;
  if (item.splitMode) {
    return (
      item.splitTotalUnits > 0 &&
      item.splitSoldUnits > 0 &&
      item.splitSoldUnits <= item.splitTotalUnits &&
      item.sourceQuantityUsed > 0 &&
      item.sourceQuantityUsed <= Number(item.lot.remainingQuantity || 0)
    );
  }
  return item.quantity > 0 && item.quantity <= Number(item.lot.remainingQuantity || 0);
}

function buildInventoryOutboundFromSelection(item) {
  const lotQuantity = Number(item.lot.quantity || 0);
  const lotTotalCost = Number(item.lot.totalCost || 0);

  if (item.splitMode) {
    const sourceQuantityUsed = lotQuantity * (item.splitSoldUnits / item.splitTotalUnits);
    const totalCost = lotTotalCost * (item.splitSoldUnits / item.splitTotalUnits);
    const unitCost = item.splitSoldUnits ? totalCost / item.splitSoldUnits : 0;
    return {
      type: item.lot.type,
      name: `${item.lot.name}（拆盒 ${formatInventorySplitNumber(item.splitSoldUnits)}/${formatInventorySplitNumber(item.splitTotalUnits)}）`,
      quantity: sourceQuantityUsed,
      displayQuantity: item.splitSoldUnits,
      unitCost,
      totalCost,
      sourceQuantityUsed,
      splitTotalUnits: item.splitTotalUnits,
      splitSoldUnits: item.splitSoldUnits,
      note: `拆盒收入出庫；原庫存 ${formatInventorySplitNumber(lotQuantity)} 單位，共拆 ${formatInventorySplitNumber(item.splitTotalUnits)} 盒，本次賣出 ${formatInventorySplitNumber(item.splitSoldUnits)} 盒。`,
    };
  }

  const unitCost = Number(item.lot.unitCost || lotTotalCost / lotQuantity || 0);
  return {
    type: item.lot.type,
    name: item.lot.name,
    quantity: item.quantity,
    displayQuantity: item.quantity,
    unitCost,
    totalCost: unitCost * item.quantity,
    sourceQuantityUsed: item.quantity,
    splitTotalUnits: 0,
    splitSoldUnits: 0,
  };
}

function formatInventorySplitNumber(value) {
  return Number(value || 0).toLocaleString("zh-TW", { maximumFractionDigits: 4 });
}

function inferInventoryTypeFromText(text) {
  if (/包材|紙箱|氣泡|膠帶|耗材|信封|保護殼|卡磚|卡夾/.test(text)) return "supply";
  if (/完整箱|整箱|一箱|箱裝|原箱|未拆箱|sealed\s*case|case/i.test(text)) return "sealedCase";
  if (/散卡|卡片|單卡|球員卡/.test(text)) return "card";
  if (/散盒|卡盒|盒/.test(text)) return "box";
  return "box";
}

function getSelectedLedgerInventoryLots() {
  if (pendingLedgerInventorySelections) return pendingLedgerInventorySelections;
  if (fields.inventorySync.value !== "yes" || recordType !== "income") return [];
  const availableLots = getAvailableInventoryLots();
  const splitMode = isLedgerSplitIncomeMode();
  return Array.from(fields.inventoryPicker.querySelectorAll("[data-ledger-inventory-id]:checked")).map((checkbox) => {
    const lot = availableLots.find((item) => item.id === checkbox.dataset.ledgerInventoryId);
    const qtyInput = fields.inventoryPicker.querySelector(`[data-ledger-inventory-qty="${CSS.escape(checkbox.dataset.ledgerInventoryId)}"]`);
    const splitTotalInput = fields.inventoryPicker.querySelector(`[data-inventory-split-total="${CSS.escape(checkbox.dataset.ledgerInventoryId)}"]`);
    const splitSoldInput = fields.inventoryPicker.querySelector(`[data-inventory-split-sold="${CSS.escape(checkbox.dataset.ledgerInventoryId)}"]`);
    return buildInventorySelection(lot, {
      quantity: Number(qtyInput?.value || 0),
      splitMode,
      splitTotalUnits: Number(splitTotalInput?.value || 0),
      splitSoldUnits: Number(splitSoldInput?.value || 0),
    });
  }).filter((item) => item.lot);
}

async function reviewDuplicateImports(kind, items) {
  const approvedItems = [];
  let skippedCount = 0;
  let duplicateCount = 0;
  let bulkAction = "";

  for (const item of items) {
    const batchDuplicate = approvedItems.find((existing) => isImportDuplicate(kind, existing, item));
    if (batchDuplicate) {
      duplicateCount += 1;
      skippedCount += 1;
      continue;
    }

    const duplicate = findImportDuplicate(kind, item);
    if (!duplicate) {
      approvedItems.push(item);
      continue;
    }

    duplicateCount += 1;
    const action = bulkAction || await askDuplicateImportDecision(kind, item, duplicate, duplicateCount, items.length);
    if (action === "import-all") bulkAction = "import";
    if (action === "skip-all") bulkAction = "skip";

    if (action === "import" || action === "import-all" || bulkAction === "import") {
      approvedItems.push(item);
    } else {
      skippedCount += 1;
    }
  }

  return { approvedItems, skippedCount, duplicateCount };
}

function findImportDuplicate(kind, incoming) {
  if (kind === "ledger") return recordsCache.find((existing) => isLedgerImportDuplicate(existing, incoming));
  if (kind === "bank") return bankTransactionsCache.find((existing) => isBankImportDuplicate(existing, incoming));
  if (kind === "voucher") return voucherInboxCache.find((existing) => isVoucherImportDuplicate(existing, incoming));
  return null;
}

function isImportDuplicate(kind, existing, incoming) {
  if (kind === "ledger") return isLedgerImportDuplicate(existing, incoming);
  if (kind === "bank") return isBankImportDuplicate(existing, incoming);
  if (kind === "voucher") return isVoucherImportDuplicate(existing, incoming);
  return false;
}

function isLedgerImportDuplicate(existing, incoming) {
  if (!existing || existing.deletedAt) return false;
  const sameType = existing.type === incoming.type;
  const sameDate = String(existing.date || "") === String(incoming.date || "");
  const sameAmount = sameMoney(existing.amount, incoming.amount);
  const sameInvoice = hasInvoiceNumberValue(existing.invoiceNumber) && normalizeInvoiceNumber(existing.invoiceNumber) === normalizeInvoiceNumber(incoming.invoiceNumber);
  const sameCoreText = sameLooseText(existing.counterparty, incoming.counterparty) && sameLooseText(existing.item, incoming.item);
  const sameAccount = sameLooseText(existing.account, incoming.account);

  return sameType && sameAmount && (sameInvoice || (sameDate && sameCoreText) || (sameDate && sameAccount && sameLooseText(existing.counterparty, incoming.counterparty)));
}

function isBankImportDuplicate(existing, incoming) {
  if (!existing || existing.deletedAt) return false;
  const existingKey = getBankTransactionKey(existing);
  const incomingKey = getBankTransactionKey(incoming);
  if (existingKey && incomingKey && existingKey === incomingKey) return true;

  return (
    String(existing.date || "") === String(incoming.date || "") &&
    sameLooseText(existing.account, incoming.account) &&
    sameMoney(existing.deposit, incoming.deposit) &&
    sameMoney(existing.withdrawal, incoming.withdrawal) &&
    sameLooseText(existing.description, incoming.description)
  );
}

function isVoucherImportDuplicate(existing, incoming) {
  if (!existing || existing.deletedAt) return false;
  const existingInvoice = normalizeInvoiceNumber(existing.invoiceNumber);
  const incomingInvoice = normalizeInvoiceNumber(incoming.invoiceNumber);
  if (hasInvoiceNumberValue(existing.invoiceNumber) && hasInvoiceNumberValue(incoming.invoiceNumber) && existingInvoice === incomingInvoice) return true;
  if (buildVoucherInboxDedupeKey(existing) === buildVoucherInboxDedupeKey(incoming)) return true;
  if (
    normalizeVoucherMergeText(existing.sourceFileName) &&
    normalizeVoucherMergeText(existing.sourceFileName) === normalizeVoucherMergeText(incoming.sourceFileName) &&
    sameMoney(existing.totalAmount, incoming.totalAmount)
  ) return true;

  return (
    String(existing.date || "") === String(incoming.date || "") &&
    sameMoney(existing.totalAmount, incoming.totalAmount) &&
    sameLooseText(existing.counterparty, incoming.counterparty) &&
    sameLooseText(existing.item, incoming.item)
  );
}

function sameMoney(a, b) {
  return Math.round(Number(a || 0)) === Math.round(Number(b || 0));
}

function sameLooseText(a, b) {
  const left = normalizeDuplicateText(a);
  const right = normalizeDuplicateText(b);
  return Boolean(left && right && left === right);
}

function normalizeDuplicateText(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/[，,。．.、|｜:：;；()（）\[\]【】]/g, "")
    .toLowerCase();
}

async function askDuplicateImportDecision(kind, incoming, existing, duplicateIndex, totalCount) {
  if (!duplicateImportModal || !duplicateImportBody) {
    const confirmed = window.confirm(buildDuplicateImportFallbackText(kind, incoming, existing));
    return confirmed ? "import" : "skip";
  }

  duplicateImportTitle.textContent = `疑似重複匯入：${getImportKindLabel(kind)}`;
  duplicateImportSubtitle.textContent = `第 ${duplicateIndex} 筆疑似重複資料，來源共 ${totalCount} 筆。請比較後決定是否匯入。`;
  duplicateImportBody.innerHTML = `
    <div class="duplicate-import-grid">
      <article>
        <span>即將匯入</span>
        ${renderDuplicateImportDetails(kind, incoming)}
      </article>
      <article>
        <span>已存在資料</span>
        ${renderDuplicateImportDetails(kind, existing)}
      </article>
    </div>
  `;
  duplicateImportModal.hidden = false;

  return new Promise((resolve) => {
    duplicateImportDecisionResolver = resolve;
  });
}

function buildDuplicateImportFallbackText(kind, incoming, existing) {
  return [
    `系統找到一筆疑似重複的${getImportKindLabel(kind)}。`,
    "",
    "即將匯入：",
    plainDuplicateImportDetails(kind, incoming),
    "",
    "已存在資料：",
    plainDuplicateImportDetails(kind, existing),
    "",
    "按確定仍然匯入，按取消略過這筆。",
  ].join("\n");
}

function getImportKindLabel(kind) {
  if (kind === "bank") return "銀行資料";
  if (kind === "voucher") return "憑證資料";
  return "流水帳";
}

function renderDuplicateImportDetails(kind, item) {
  return `<dl>${getDuplicateImportRows(kind, item).map(([label, value]) => `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value || "未填")}</dd>
    </div>
  `).join("")}</dl>`;
}

function plainDuplicateImportDetails(kind, item) {
  return getDuplicateImportRows(kind, item).map(([label, value]) => `${label}：${value || "未填"}`).join("\n");
}

function getDuplicateImportRows(kind, item) {
  if (kind === "bank") {
    return [
      ["日期", item.date],
      ["帳戶", item.account],
      ["流入", item.deposit ? `NT$ ${formatNumber(item.deposit)}` : ""],
      ["流出", item.withdrawal ? `NT$ ${formatNumber(item.withdrawal)}` : ""],
      ["說明", item.description],
      ["來源", formatImportSource(item)],
    ];
  }

  if (kind === "voucher") {
    return [
      ["類型", typeLabel(item.type)],
      ["發票號碼", item.invoiceNumber],
      ["日期", item.date],
      ["總額", `NT$ ${formatNumber(item.totalAmount)}`],
      ["交易對象", item.counterparty],
      ["品項", item.item],
      ["來源", formatImportSource(item)],
    ];
  }

  return [
    ["類型", typeLabel(item.type)],
    ["日期", item.date],
    ["金額", `NT$ ${formatNumber(item.amount)}`],
    ["交易對象", item.counterparty],
    ["項目", item.item],
    ["帳戶", item.account],
    ["發票號碼", item.invoiceNumber],
    ["來源", formatImportSource(item)],
  ];
}

function formatImportSource(item) {
  return [
    item.importSource,
    item.sourceFile,
    item.sourceWorkbook,
    item.sourceFileName,
    item.sourceRow ? `第 ${item.sourceRow} 列` : "",
  ].filter(Boolean).join("｜");
}

async function importLedgerFile(file) {
  const preview = await buildLedgerImportPreview(file);
  if (!preview) return;
  const { approvedItems, skippedCount } = await reviewDuplicateImports("ledger", [
    ...preview.cleanItems,
    ...preview.duplicateItems.map((item) => item.record),
  ]);
  if (!approvedItems.length) {
    showToast("匯入已取消，沒有新增資料。");
    return;
  }

  await saveImportedLedgerRecords(approvedItems);

  const skippedMessage = skippedCount ? `，略過 ${skippedCount} 筆疑似重複資料` : "";
  showToast(`已匯入 ${approvedItems.length} 筆資料${skippedMessage}。`);
}

async function buildLedgerImportPreview(file) {
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
  const parsedItems = [];
  const invalidItems = [];

  rows.forEach((row) => {
    const parsed = parseImportRow(row.values, row.sourceRow);
    if (parsed) {
      parsedItems.push(parsed);
    } else {
      invalidItems.push({
        sourceRow: row.sourceRow,
        reason: getLedgerImportMissingReason(row.values),
      });
    }
  });

  const cleanItems = [];
  const duplicateItems = [];
  parsedItems.forEach((record) => {
    const duplicate = findImportDuplicate("ledger", record);
    if (duplicate) {
      duplicateItems.push({ record, duplicate });
    } else {
      cleanItems.push(record);
    }
  });

  return {
    fileName: file.name,
    sheetName,
    totalRows: rows.length,
    cleanItems,
    duplicateItems,
    invalidItems,
  };
}

function getLedgerImportMissingReason(row) {
  const date = normalizeImportDate(pickValue(row, ["日期", "交易日期", "date"]));
  const incomeAmount = parseAmount(pickValue(row, ["收入金額", "收入", "收款金額", "營收", "商品收入", "淨銷售額"]));
  const expenseAmount = parseAmount(pickValue(row, ["支出金額", "支出", "付款金額"]));
  const genericAmount = parseAmount(pickValue(row, ["金額", "amount"]));
  const item = String(pickValue(row, ["項目", "摘要", "項目／摘要", "item"]) || "").trim();
  const reasons = [];
  if (!date) reasons.push("缺日期");
  if (!(incomeAmount || expenseAmount || genericAmount)) reasons.push("缺金額");
  if (!item) reasons.push("缺項目");
  return reasons.length ? reasons.join("、") : "欄位格式不符合";
}

function renderLedgerImportPreview(preview) {
  if (!ledgerImportPreview) return;

  const cleanCount = preview.cleanItems.length;
  const duplicateCount = preview.duplicateItems.length;
  const invalidCount = preview.invalidItems.length;
  const importAllCount = cleanCount + duplicateCount;

  ledgerImportPreview.hidden = false;
  ledgerImportPreview.innerHTML = `
    <div class="import-preview-heading">
      <div>
        <p class="eyebrow">IMPORT PREVIEW</p>
        <h3>匯入前檢查</h3>
        <p>${escapeHtml(preview.fileName)} · ${escapeHtml(preview.sheetName)} · 共讀到 ${preview.totalRows} 列</p>
      </div>
      <button class="secondary-button" type="button" data-ledger-import-action="cancel">取消</button>
    </div>
    <div class="import-preview-summary">
      ${renderImportSummaryCard("可直接匯入", cleanCount, "good")}
      ${renderImportSummaryCard("疑似重複", duplicateCount, "warn")}
      ${renderImportSummaryCard("無法匯入", invalidCount, "danger")}
    </div>
    <div class="import-preview-columns">
      ${renderImportPreviewList("可匯入資料", preview.cleanItems, renderLedgerImportRecordPreview)}
      ${renderImportPreviewList("疑似重複資料", preview.duplicateItems, renderLedgerDuplicatePreview)}
      ${renderImportPreviewList("缺資料或格式不符", preview.invalidItems, renderLedgerInvalidPreview)}
    </div>
    <div class="import-preview-actions">
      <button class="secondary-button" type="button" data-ledger-import-action="import-clean" ${cleanCount ? "" : "disabled"}>只匯入可新增資料</button>
      <button type="button" data-ledger-import-action="import-all" ${importAllCount ? "" : "disabled"}>全部仍然匯入</button>
    </div>
  `;
}

function renderImportSummaryCard(label, count, tone) {
  return `
    <article class="import-summary-card ${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${count} 筆</strong>
    </article>
  `;
}

function renderImportPreviewList(title, items, renderer) {
  const visibleItems = items.slice(0, 5);
  const moreCount = Math.max(items.length - visibleItems.length, 0);
  return `
    <section class="import-preview-list">
      <h4>${escapeHtml(title)}</h4>
      ${visibleItems.length
        ? visibleItems.map(renderer).join("")
        : `<div class="import-preview-empty">目前沒有資料</div>`}
      ${moreCount ? `<p class="muted-text">另有 ${moreCount} 筆，確認後會一起處理。</p>` : ""}
    </section>
  `;
}

function renderLedgerImportRecordPreview(record) {
  return `
    <article>
      <strong>${escapeHtml(record.item || "未命名項目")}</strong>
      <span>${escapeHtml(record.date)} · ${escapeHtml(typeLabel(record.type))} · NT$ ${formatNumber(record.amount)}</span>
      <small>${escapeHtml(record.counterparty || "未填交易對象")} / ${escapeHtml(record.major || "未分類")}</small>
    </article>
  `;
}

function renderLedgerDuplicatePreview(item) {
  return `
    <article class="duplicate">
      <strong>${escapeHtml(item.record.item || "未命名項目")}</strong>
      <span>${escapeHtml(item.record.date)} · NT$ ${formatNumber(item.record.amount)}</span>
      <small>像既有資料：${escapeHtml(item.duplicate.item || "未命名項目")} / ${escapeHtml(item.duplicate.date || "")}</small>
    </article>
  `;
}

function renderLedgerInvalidPreview(item) {
  return `
    <article class="invalid">
      <strong>第 ${item.sourceRow} 列</strong>
      <span>${escapeHtml(item.reason)}</span>
      <small>這列不會寫入，請先回 Excel 補資料。</small>
    </article>
  `;
}

function clearLedgerImportPreview() {
  pendingLedgerImportPreview = null;
  if (ledgerImportPreview) {
    ledgerImportPreview.hidden = true;
    ledgerImportPreview.innerHTML = "";
  }
}

async function saveImportedLedgerRecords(records) {
  for (const record of records) {
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
    readableCollectionQuery("ledgerRecords", 1000),
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
  const adjustmentSummary = buildLedgerAdjustmentSummary(records);
  const adjustedRecords = applyLedgerAdjustments(records, adjustmentSummary);
  const expense = sumByType(adjustedRecords, "expense");
  const income = sumByType(adjustedRecords, "income");
  const soldCost = buildSoldCostSummary(adjustedRecords, adjustmentSummary);
  const salesIncome = soldCost.salesIncome;
  const productCost = soldCost.productCost;
  const bankDirectCost = sumBankSalesDirectCosts(start, end);
  const logisticsCost = soldCost.logisticsCost + bankDirectCost;
  const packagingCost = soldCost.packagingCost;
  const costOfGoodsSold = productCost + logisticsCost + packagingCost;
  const pending = records.filter(hasReportablePendingReason).length;
  const grossProfit = salesIncome - productCost - logisticsCost - packagingCost;
  const operatingExpense = sumOperatingExpense(adjustedRecords);
  const net = grossProfit - operatingExpense;
  const grossMargin = salesIncome ? grossProfit / salesIncome : null;
  const netMargin = salesIncome ? net / salesIncome : null;
  const breakdown = buildCategoryBreakdown(adjustedRecords);
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
    adjustmentSummary,
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
    if (!isBankTransactionFormallyMatched(transaction)) return;
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

  const sortedTransactions = sortBankTransactionsForReview(transactions);
  const matched = sortedTransactions.filter(isBankTransactionFormallyMatched);
  const classified = sortedTransactions.filter(isBankTransactionClassified);
  const ignored = sortedTransactions.filter((transaction) => transaction.status === "不入帳");
  const unmatched = sortedTransactions.filter((transaction) =>
    !isBankTransactionFormallyMatched(transaction)
    && !isBankTransactionClassified(transaction)
    && transaction.status !== "不入帳"
  );
  const needsAction = [...unmatched, ...classified].sort(compareBankTransactionsForReview);

  return `
    <div class="bank-reconcile-summary">
      <article>
        <span>已完成配帳</span>
        <strong>${formatNumber(matched.length)} 筆</strong>
        <small>銀行資料已連到正式收入／支出</small>
      </article>
      <article>
        <span>只分類，未選帳務</span>
        <strong>${formatNumber(classified.length)} 筆</strong>
        <small>知道用途，但還沒選哪筆帳</small>
      </article>
      <article>
        <span>未處理銀行交易</span>
        <strong>${formatNumber(unmatched.length)} 筆</strong>
        <small>需要先判斷收入、支出或不入帳</small>
      </article>
      <article>
        <span>不入帳</span>
        <strong>${formatNumber(ignored.length)} 筆</strong>
        <small>已排除，不列入正式帳務</small>
      </article>
    </div>
    <div class="bank-reconcile-workbench">
      <section class="bank-reconcile-group action">
        <div class="bank-reconcile-group-title">
          <div>
            <h4>需要處理</h4>
            <p>先處理未配對，再處理已分類但還沒選帳務的銀行交易。</p>
          </div>
          <strong>${formatNumber(needsAction.length)} 筆</strong>
        </div>
        ${
          needsAction.length
            ? needsAction.map(renderBankReconciliationItem).join("")
            : `<div class="record-group-empty">目前沒有需要處理的銀行資料</div>`
        }
      </section>
      <details class="bank-reconcile-group matched" open>
        <summary>
          <span>已完成配帳</span>
          <strong>${formatNumber(matched.length)} 筆</strong>
        </summary>
        ${renderBankReconciliationGroupBody(matched)}
      </details>
      <details class="bank-reconcile-group ignored">
        <summary>
          <span>不入帳</span>
          <strong>${formatNumber(ignored.length)} 筆</strong>
        </summary>
        ${renderBankReconciliationGroupBody(ignored)}
      </details>
    </div>
  `;
}

function sortBankTransactionsForReview(transactions) {
  return [...transactions].sort(compareBankTransactionsForReview);
}

function compareBankTransactionsForReview(a, b) {
  const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
  if (dateCompare) return dateCompare;
  const amountCompare = getBankTransactionAmount(b) - getBankTransactionAmount(a);
  if (amountCompare) return amountCompare;
  return String(a.description || a.sourceFile || "").localeCompare(String(b.description || b.sourceFile || ""), "zh-Hant");
}

function isBankTransactionFormallyMatched(transaction) {
  return getMatchedLedgerIds(transaction).length > 0;
}

function isBankTransactionClassified(transaction) {
  return !isBankTransactionFormallyMatched(transaction)
    && ["已配收入", "已配支出", "已配平台撥款", "已配代墊還款"].includes(transaction.status);
}

function getBankTransactionDisplayStatus(transaction) {
  if (!isBankTransactionClassified(transaction)) return transaction.status || "待核對";
  const labelMap = {
    已配收入: "待配收入",
    已配支出: "待配支出",
    已配平台撥款: "待配平台撥款",
    已配代墊還款: "待配代墊還款",
  };
  return labelMap[transaction.status] || "已分類未配帳務";
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
      ${renderBankReconciliationGroupBody(transactions)}
    </section>
  `;
}

function renderBankReconciliationGroupBody(transactions) {
  return transactions.length
    ? transactions.map(renderBankReconciliationItem).join("")
    : `<div class="record-group-empty">目前沒有資料</div>`;
}

function renderBankReconciliationItem(transaction) {
  const amount = Number(transaction.deposit || 0) || Number(transaction.withdrawal || 0);
  const sign = Number(transaction.deposit || 0) ? "+" : "-";
  const amountText = amount ? `${sign} NT$ ${formatNumber(amount)}` : "待辨識";
  const reconcileLabel = amount ? "配帳務" : "補資料再配帳";
  const status = getBankTransactionDisplayStatus(transaction);
  const statusTone = getBankReconciliationTone(transaction);
  const ledgerText = transaction.matchedLedgerItem
    ? `配對帳務：${transaction.matchedLedgerItem}`
    : transaction.matchedLedgerId
      ? "配對帳務：已配帳務"
      : isBankTransactionClassified(transaction)
        ? `${status}，尚未選到實際帳務`
        : "尚未選擇帳務";
  const differenceText = transaction.matchDifference
    ? `差額：NT$ ${formatNumber(transaction.matchDifference)} · ${transaction.differenceHandling || "待確認"}`
    : "";
  const reasonText = transaction.pendingReason ? `提醒：${transaction.pendingReason}` : "";

  return `
    <article class="bank-reconcile-item">
      <span class="bank-reconcile-status ${statusTone}">${escapeHtml(status)}</span>
      <div class="bank-reconcile-main">
        <strong>${escapeHtml(transaction.description || transaction.sourceFile || "銀行資料")}</strong>
        <span>${escapeHtml(transaction.date)} · ${escapeHtml(transaction.account || "未指定帳戶")}</span>
        <small>${escapeHtml(ledgerText)}</small>
        ${differenceText ? `<small>${escapeHtml(differenceText)}</small>` : ""}
        ${reasonText ? `<small>${escapeHtml(reasonText)}</small>` : ""}
      </div>
      <div class="bank-reconcile-side">
        <strong>${amountText}</strong>
        <div class="bank-reconcile-actions">
          ${isBankTransactionFormallyMatched(transaction)
            ? `<button type="button" data-bank-id="${escapeHtml(transaction.id)}" data-bank-action="reconcile">重新配帳</button>`
            : transaction.status !== "不入帳"
              ? `<button type="button" data-bank-id="${escapeHtml(transaction.id)}" data-bank-action="reconcile">${reconcileLabel}</button>`
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
          ? `${getBankTransactionDisplayStatus(transaction)}，但尚未選到實際收入／支出。銀行金額 NT$ ${formatNumber(getBankTransactionAmount(transaction))}。`
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
    readableCollectionQuery("auditLogs", 100),
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

function getBankReconciliationTone(transaction) {
  if (isBankTransactionFormallyMatched(transaction)) return "matched";
  if (transaction.status === "不入帳") return "ignored";
  if (isBankTransactionClassified(transaction)) return "classified";
  return "unmatched";
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
  if (collectionName === "assetRecords") return record.name || record.assetNumber || "固定資產";
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

  if (collectionName === "assetRecords") {
    return `${record.purchaseDate || "未填日期"} · ${record.assetNumber || "未編號"} · ${record.category || "未分類"} · NT$ ${formatNumber(record.amount)}`;
  }

  return `${record.date || "未填日期"} · ${typeLabel(record.type)} · ${record.counterparty || "未填對象"} · NT$ ${formatNumber(record.amount)}`;
}

function getAuditDiffText(log) {
  if (log.action !== "update" || !log.before || !log.after) return "";
  const changes = [];
  ["date", "counterparty", "item", "amount", "account", "settlementStatus", "name", "quantity", "totalCost", "status", "assetNumber", "labelStatus", "warrantyStatus"].forEach((field) => {
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
      readableCollectionQuery(collectionInfo.name, 200),
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
  if (record.collectionName === "assetRecords") return record.name || record.assetNumber || "固定資產";
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

  if (record.collectionName === "assetRecords") {
    return `${record.purchaseDate || "未填日期"} · ${record.assetNumber || "未編號"} · ${record.category || "未分類"} · NT$ ${formatNumber(record.amount)}`;
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
    return;
  }

  if (collectionName === "assetRecords") {
    if (isConfigured) await loadAssetRecords();
    else renderAssets();
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

  if (collectionName === "assetRecords") {
    assetCache.unshift(restoredRecord);
    saveLocalAssetRecords();
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
  const preview = await buildBankImportPreview(file);
  if (!preview) return;
  const { approvedItems, skippedCount } = await reviewDuplicateImports("bank", [
    ...preview.cleanItems,
    ...preview.duplicateItems.map((item) => item.record),
  ]);
  if (!approvedItems.length) {
    showToast("匯入已取消，沒有新增銀行資料。");
    return;
  }

  await saveImportedBankTransactions(approvedItems);

  const skippedMessage = skippedCount ? `，略過 ${skippedCount} 筆疑似重複資料` : "";
  showToast(`已匯入 ${approvedItems.length} 筆銀行資料${skippedMessage}。`);
}

async function buildBankImportPreview(file) {
  if (!window.XLSX) {
    throw new Error("Excel 套件尚未載入，請確認網路可連線後重試。");
  }

  if (!currentUser && isConfigured) {
    showToast("請先登入。");
    return;
  }

  const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = readBankRows(sheet);
  const parsedItems = [];
  const invalidItems = [];

  rows.forEach((row) => {
    const parsed = parseBankRow(row.values, row.sourceRow, file.name);
    if (parsed) {
      parsedItems.push(parsed);
    } else {
      invalidItems.push({
        sourceRow: row.sourceRow,
        reason: getBankImportMissingReason(row.values),
      });
    }
  });

  if (!parsedItems.length && !invalidItems.length) {
    showToast("沒有可匯入的銀行資料。");
    return;
  }

  if (isConfigured) await loadBankTransactions();

  const currentImportKeys = new Set();
  const importUniqueTransactions = parsedItems.filter((transaction) => {
    const key = getBankTransactionKey(transaction);
    if (currentImportKeys.has(key)) return false;
    currentImportKeys.add(key);
    transaction.importKey = key;
    return true;
  });
  const duplicateInsideFileCount = parsedItems.length - importUniqueTransactions.length;
  const cleanItems = [];
  const duplicateItems = [];

  importUniqueTransactions.forEach((record) => {
    const duplicate = findImportDuplicate("bank", record);
    if (duplicate) {
      duplicateItems.push({ record, duplicate });
    } else {
      cleanItems.push(record);
    }
  });

  if (duplicateInsideFileCount) {
    invalidItems.push({
      sourceRow: "同檔重複",
      reason: `檔案內有 ${duplicateInsideFileCount} 筆完全相同銀行資料，預覽已先排除。`,
    });
  }

  return {
    fileName: file.name,
    sheetName,
    totalRows: rows.length,
    cleanItems,
    duplicateItems,
    invalidItems,
  };
}

function getBankImportMissingReason(row) {
  const date = normalizeImportDate(pickValue(row, ["日期", "交易日期", "入帳日", "交易日", "帳務日", "date"]));
  const description = [
    pickValue(row, ["摘要", "說明", "交易說明", "交易明細", "交易內容", "備註", "description"]),
    pickValue(row, ["匯款人／收款人", "匯款人/收款人", "匯款人", "收款人", "交易對象", "counterparty"]),
  ].filter(Boolean).join(" · ");
  const deposit = parseAmount(pickValue(row, ["存入", "收入", "貸方", "貸", "入金", "匯入", "轉入", "存款金額", "收入金額", "收方", "右方", "deposit", "credit"]));
  const withdrawal = parseAmount(pickValue(row, ["提出", "支出", "借方", "借", "扣款", "匯出", "轉出", "提款金額", "支出金額", "付方", "左方", "withdrawal", "debit"]));
  const signedAmount = parseSignedAmount(pickValue(row, ["金額", "交易金額", "收支金額", "amount"]));
  const balance = parseAmount(pickValue(row, ["餘額", "結餘", "存款餘額", "balance"]));
  const reasons = [];
  if (!date) reasons.push("缺日期");
  if (!(deposit || withdrawal || signedAmount || balance)) reasons.push("缺金額或餘額");
  if (!description) reasons.push("缺交易說明");
  return reasons.length ? reasons.join("、") : "欄位格式不符合";
}

function renderBankImportPreview(preview) {
  if (!bankImportPreview) return;

  const cleanCount = preview.cleanItems.length;
  const duplicateCount = preview.duplicateItems.length;
  const invalidCount = preview.invalidItems.length;
  const importAllCount = cleanCount + duplicateCount;
  const incomingCount = [...preview.cleanItems, ...preview.duplicateItems.map((item) => item.record)].filter((item) => Number(item.deposit || 0)).length;
  const outgoingCount = [...preview.cleanItems, ...preview.duplicateItems.map((item) => item.record)].filter((item) => Number(item.withdrawal || 0)).length;

  bankImportPreview.className = "bank-import-preview ledger-import-preview";
  bankImportPreview.hidden = false;
  bankImportPreview.innerHTML = `
    <div class="import-preview-heading">
      <div>
        <p class="eyebrow">BANK IMPORT PREVIEW</p>
        <h3>銀行匯入前檢查</h3>
        <p>${escapeHtml(preview.fileName)} · ${escapeHtml(preview.sheetName)} · 共讀到 ${preview.totalRows} 列 · 流入 ${incomingCount} 筆 · 流出 ${outgoingCount} 筆</p>
      </div>
      <button class="secondary-button" type="button" data-bank-import-action="cancel">取消</button>
    </div>
    <div class="import-preview-summary">
      ${renderImportSummaryCard("可直接匯入", cleanCount, "good")}
      ${renderImportSummaryCard("疑似重複", duplicateCount, "warn")}
      ${renderImportSummaryCard("無法匯入", invalidCount, "danger")}
    </div>
    <div class="import-preview-columns">
      ${renderImportPreviewList("可匯入銀行資料", preview.cleanItems, renderBankImportRecordPreview)}
      ${renderImportPreviewList("疑似重複銀行資料", preview.duplicateItems, renderBankDuplicatePreview)}
      ${renderImportPreviewList("缺資料或格式不符", preview.invalidItems, renderBankInvalidPreview)}
    </div>
    <div class="import-preview-actions">
      <button class="secondary-button" type="button" data-bank-import-action="import-clean" ${cleanCount ? "" : "disabled"}>只匯入可新增資料</button>
      <button type="button" data-bank-import-action="import-all" ${importAllCount ? "" : "disabled"}>全部仍然匯入</button>
    </div>
  `;
}

function renderBankImportRecordPreview(record) {
  const direction = Number(record.deposit || 0) ? "流入" : Number(record.withdrawal || 0) ? "流出" : "待辨識";
  const amount = Number(record.deposit || record.withdrawal || 0);
  return `
    <article>
      <strong>${escapeHtml(record.description || "未填交易說明")}</strong>
      <span>${escapeHtml(record.date)} · ${escapeHtml(record.account || "未填帳戶")} · ${escapeHtml(direction)} NT$ ${formatNumber(amount)}</span>
      <small>${record.balance ? `餘額 NT$ ${formatNumber(record.balance)} · ` : ""}${escapeHtml(formatImportSource(record))}</small>
    </article>
  `;
}

function renderBankDuplicatePreview(item) {
  const amount = Number(item.record.deposit || item.record.withdrawal || 0);
  return `
    <article class="duplicate">
      <strong>${escapeHtml(item.record.description || "未填交易說明")}</strong>
      <span>${escapeHtml(item.record.date)} · NT$ ${formatNumber(amount)}</span>
      <small>像既有銀行資料：${escapeHtml(item.duplicate.description || "未填交易說明")} / ${escapeHtml(item.duplicate.date || "")}</small>
    </article>
  `;
}

function renderBankInvalidPreview(item) {
  return `
    <article class="invalid">
      <strong>第 ${escapeHtml(item.sourceRow)} 列</strong>
      <span>${escapeHtml(item.reason)}</span>
      <small>這列不會寫入，請先回 Excel 補資料或調整欄位名稱。</small>
    </article>
  `;
}

function clearBankImportPreview() {
  pendingBankImportPreview = null;
  if (bankImportPreview) {
    bankImportPreview.className = "bank-import-preview muted-text";
    bankImportPreview.hidden = false;
    bankImportPreview.textContent = "尚未匯入銀行資料。";
  }
}

async function saveImportedBankTransactions(records) {
  for (const transaction of records) {
    await saveBankTransaction(transaction);
  }

  if (isConfigured) {
    await loadBankTransactions();
  } else {
    saveLocalBankTransactions();
    renderBankTransactions();
    renderCashflow();
    renderPendingCenter();
    renderSettlementCenter();
    renderCustomReport();
  }
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

  bankImportPreview.className = "bank-import-preview muted-text";
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
    readableCollectionQuery("bankTransactions", 1000),
  );
  bankTransactionsCache = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((transaction) => !transaction.deletedAt)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  renderBankTransactions();
  renderPendingCenter();
  if (document.querySelector("#reportsView")?.classList.contains("active")) {
    renderCustomReport();
  }
  if (document.querySelector("#cashflowView")?.classList.contains("active")) {
    renderCashflow();
  }
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
  const hasBankAmount = Boolean(getBankTransactionDirection(transaction));
  const amountText = transaction.deposit
    ? `+ NT$ ${formatNumber(transaction.deposit)}`
    : transaction.withdrawal
      ? `- NT$ ${formatNumber(transaction.withdrawal)}`
      : "待辨識";
  const status = getBankTransactionDisplayStatus(transaction);
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
        <button type="button" data-bank-id="${escapeHtml(transaction.id)}" data-bank-action="reconcile">${hasBankAmount ? "配帳務" : "補資料再配帳"}</button>
        ${isBankTransactionFormallyMatched(transaction) || isBankTransactionClassified(transaction) ? `<button type="button" data-bank-id="${escapeHtml(transaction.id)}" data-bank-action="unmatch">退回待核對</button>` : ""}
        ${statusButtons
          .map(([nextStatus, label]) => `
            <button type="button" data-bank-id="${escapeHtml(transaction.id)}" data-bank-status="${escapeHtml(nextStatus)}" ${transaction.status === nextStatus ? "disabled" : ""}>${label}</button>
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
  let workingTransaction = transaction;
  let direction = getBankTransactionDirection(workingTransaction);
  if (!direction) {
    showToast("這筆銀行資料需要先補存入或提出金額。");
    const updatedTransaction = await handleEditBankTransaction(workingTransaction);
    if (!updatedTransaction) return;

    workingTransaction = updatedTransaction;
    direction = getBankTransactionDirection(workingTransaction);
    if (!direction) {
      showToast("仍沒有存入或提出金額，暫時不能配帳務。");
      return;
    }
  }

  if (getMatchedLedgerIds(workingTransaction).length) {
    const confirmed = window.confirm("這筆銀行資料已經配過帳務，是否重新配對？");
    if (!confirmed) return;
  }

  const candidates = getBankLedgerCandidates(workingTransaction, direction);
  if (!candidates.length) {
    const scopeText = direction.candidateScope === "shareholderAdvance" ? "股東代墊未沖帳務" : `${direction.type === "income" ? "收入" : "支出"}紀錄`;
    showToast(`找不到可配對的${scopeText}。`);
    return;
  }

  const selectedRecords = await openLedgerMatchDialog(workingTransaction, direction, candidates);
  if (!selectedRecords) return;

  if (!selectedRecords.length) {
    showToast("請至少勾選一筆帳務。");
    return;
  }

  const selectedTotal = selectedRecords.reduce((total, record) => total + Number(record.amount || 0), 0);
  const differenceInfo = getMatchDifferenceInfo(direction.amount, selectedTotal);
  if (!differenceInfo) return;

  await applyBankLedgerMatches(workingTransaction, selectedRecords, direction, differenceInfo);
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
    const months = Array.from(new Set(candidates.map((record) => String(record.date || "").slice(0, 7)).filter(Boolean))).sort().reverse();
    const defaultMonth = months.includes(String(transaction.date || "").slice(0, 7)) ? String(transaction.date || "").slice(0, 7) : "";
    const renderCandidate = (record) => `
      <label class="match-option" data-match-option data-match-month="${escapeHtml(String(record.date || "").slice(0, 7))}" data-match-text="${escapeHtml([
        record.date,
        record.item,
        record.counterparty,
        record.settlementStatus,
        record.account,
        record.amount,
      ].filter(Boolean).join(" ").toLowerCase())}">
        <input type="checkbox" data-match-record-id="${escapeHtml(record.id)}" />
        <span>
          <strong>${escapeHtml(record.date)} · ${escapeHtml(record.item)}</strong>
          <small>${escapeHtml(record.counterparty)} · ${escapeHtml(record.account || "")} · ${escapeHtml(record.settlementStatus || "")}</small>
        </span>
        <strong>NT$ ${formatNumber(record.amount)}</strong>
      </label>
    `;
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
        <div class="match-dialog-filters">
          <label>
            <span>月份</span>
            <select data-match-month-filter>
              <option value="">全部月份</option>
              ${months.map((month) => `<option value="${escapeHtml(month)}" ${month === defaultMonth ? "selected" : ""}>${escapeHtml(month)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>搜尋</span>
            <input type="search" data-match-search placeholder="輸入日期、對象、摘要、金額" />
          </label>
          <small data-match-visible-count></small>
        </div>
        <div class="match-dialog-list">
          ${candidates.map(renderCandidate).join("")}
          <div class="match-empty-state" data-match-empty hidden>目前篩選找不到帳務，請切換月份或搜尋關鍵字。</div>
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
    const applyFilters = () => {
      const month = overlay.querySelector("[data-match-month-filter]")?.value || "";
      const keyword = (overlay.querySelector("[data-match-search]")?.value || "").trim().toLowerCase();
      let visibleCount = 0;

      overlay.querySelectorAll("[data-match-option]").forEach((option) => {
        const monthMatched = !month || option.dataset.matchMonth === month;
        const textMatched = !keyword || (option.dataset.matchText || "").includes(keyword);
        const visible = monthMatched && textMatched;
        option.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      const countNode = overlay.querySelector("[data-match-visible-count]");
      if (countNode) countNode.textContent = `目前顯示 ${formatNumber(visibleCount)} / ${formatNumber(candidates.length)} 筆`;
      const emptyNode = overlay.querySelector("[data-match-empty]");
      if (emptyNode) emptyNode.hidden = visibleCount > 0;
    };
    const updateTotal = () => {
      const selectedIds = Array.from(overlay.querySelectorAll("[data-match-record-id]:checked")).map((item) => item.dataset.matchRecordId);
      const total = candidates
        .filter((record) => selectedIds.includes(record.id))
        .reduce((sum, record) => sum + Number(record.amount || 0), 0);
      overlay.querySelector("[data-match-total]").textContent = `NT$ ${formatNumber(total)}`;
      overlay.querySelector("[data-match-diff]").textContent = `NT$ ${formatNumber(direction.amount - total)}`;
    };

    overlay.addEventListener("change", (event) => {
      if (event.target.matches("[data-match-month-filter]")) applyFilters();
      updateTotal();
    });
    overlay.querySelector("[data-match-search]")?.addEventListener("input", applyFilters);
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
    applyFilters();
  });
}

function getBankTransactionDirection(transaction) {
  const deposit = Number(transaction.deposit || 0);
  const withdrawal = Number(transaction.withdrawal || 0);
  if (deposit > 0) return { type: "income", amount: deposit, status: "已配收入", settlementStatus: "已收款" };
  if (withdrawal > 0 && isShareholderRepaymentBankTransaction(transaction)) {
    return { type: "expense", amount: withdrawal, status: "已配代墊還款", settlementStatus: "已付款", candidateScope: "shareholderAdvance" };
  }
  if (withdrawal > 0) return { type: "expense", amount: withdrawal, status: "已配支出", settlementStatus: "已付款" };
  return null;
}

function getBankLedgerCandidates(transaction, direction) {
  let candidates = recordsCache
    .filter((record) => record.type === direction.type)
    .filter((record) => !record.bankTransactionId || record.bankTransactionId === transaction.id);

  if (direction.candidateScope === "shareholderAdvance") {
    candidates = candidates.filter(isShareholderAdvanceLedgerRecord);
  }

  return candidates.sort(compareLedgerMatchCandidatesByDate);
}

function compareLedgerMatchCandidatesByDate(a, b) {
  const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
  if (dateCompare) return dateCompare;

  const timeCompare = getRecordTimeValue(a) - getRecordTimeValue(b);
  if (timeCompare) return timeCompare;

  return String(a.item || "").localeCompare(String(b.item || ""), "zh-Hant");
}

function isShareholderRepaymentBankTransaction(transaction) {
  const text = [
    transaction.status,
    transaction.matchedType,
    transaction.description,
    transaction.sourceFile,
    transaction.pendingReason,
  ].filter(Boolean).join(" ");
  return /已配代墊還款|股東代墊|代墊|墊款|墊付|張晟睿/.test(text);
}

function isShareholderAdvanceLedgerRecord(record) {
  const text = [
    record.cashflow,
    record.account,
    record.settlementStatus,
    record.counterparty,
    record.item,
    record.note,
  ].filter(Boolean).join(" ");
  return classifyCashflowRecord(record) === "shareholderAdvance" || /股東代墊未沖|股東代墊|代墊|墊付|信用卡|刷卡|張晟睿/.test(text);
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

  const depositAmount = parseAmount(deposit);
  const withdrawalAmount = parseAmount(withdrawal);
  if (depositAmount > 0 && withdrawalAmount > 0) {
    showToast("存入金額與提出金額只能擇一填寫。");
    return null;
  }

  const hasAmount = depositAmount > 0 || withdrawalAmount > 0;
  const updates = {
    date: normalizeImportDate(date) || transaction.date,
    description: description.trim(),
    deposit: depositAmount,
    withdrawal: withdrawalAmount,
    balance: parseAmount(balance),
    status: hasAmount && transaction.status === "待辨識" ? "待核對" : transaction.status || (hasAmount ? "待核對" : "待辨識"),
    pendingReason: hasAmount ? "尚未與收入、支出、平台撥款或代墊還款配對。" : transaction.pendingReason || "存摺照片尚未人工辨識或 OCR。",
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  };
  const updatedTransaction = { ...transaction, ...updates };

  await writeAuditLog("update", "bankTransactions", transaction.id, transaction, updatedTransaction);

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
  return updatedTransaction;
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
  const overviewItems = buildOverviewCheckItems(items);
  const overviewCounts = overviewItems.reduce((map, item) => {
    map[item.group] = (map[item.group] || 0) + 1;
    return map;
  }, {});
  const overviewUrgentCount = overviewItems.filter((item) => item.priority >= 80).length;

  renderOverviewCheckCenter(overviewItems, overviewCounts, overviewUrgentCount);

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

function renderOverviewCheckCenter(items = [], counts = {}, urgentCount = 0) {
  if (!overviewCheckSummary || !overviewCheckList) return;
  const cashflowInventoryCount = (counts.cashflow || 0) + (counts.inventory || 0) + (counts.settlement || 0);

  overviewCheckSummary.innerHTML = [
    ["全部檢查", items.length],
    ["優先處理", urgentCount],
    ["憑證／發票", counts.voucher || 0],
    ["金流／庫存", cashflowInventoryCount],
  ]
    .map(([label, count]) => `
      <article>
        <span>${label}</span>
        <strong>${formatNumber(count)} 筆</strong>
      </article>
    `)
    .join("");

  if (!items.length) {
    overviewCheckList.className = "overview-check-list empty-state";
    overviewCheckList.textContent = "目前沒有需要檢查的項目。";
    return;
  }

  overviewCheckList.className = "overview-check-list";
  overviewCheckList.innerHTML = items.slice(0, 6).map(renderOverviewCheckItem).join("");
}

function renderOverviewCheckItem(item) {
  const toneClass = item.priority >= 80 ? "urgent" : item.group === "cashflow" ? "pending" : item.group === "inventory" ? "income" : "";
  const groupClass = getOverviewCheckGroupClass(item.group);
  const targetView = item.targetView || "pending";
  const targetType = item.targetType || "";
  const recordId = item.recordId || "";
  const detail = item.detail || item.reason || item.action || "";

  return `
    <article class="overview-check-item ${groupClass}">
      <span class="pill ${toneClass}">${escapeHtml(item.status)}</span>
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.date || "未填日期")} · ${escapeHtml(item.subject || "未填項目")}</small>
        ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
      </div>
      <button type="button" data-pending-target="${escapeHtml(targetView)}" data-pending-type="${escapeHtml(targetType)}" data-record-id="${escapeHtml(recordId)}">處理</button>
    </article>
  `;
}

function buildOverviewCheckItems(pendingItems = []) {
  const items = pendingItems.map((item) => ({
    ...item,
    detail: item.detail || item.reason || item.action || "",
  }));
  const today = toDateValue(new Date());
  const activeRecords = recordsCache.filter((record) => !record.deletedAt);
  const activeBank = bankTransactionsCache.filter((transaction) => !transaction.deletedAt);
  const activeVouchers = voucherInboxCache.filter((voucher) => !voucher.deletedAt);

  activeRecords.forEach((record) => {
    const hasVoucher = hasAttachedVoucher(record);
    const hasInvoiceNumber = hasInvoiceNumberValue(record.invoiceNumber);
    if (isNoInvoiceNumber(record.invoiceNumber)) return;

    if (hasVoucher && !hasInvoiceNumber) {
      items.push(createOverviewCheckItem({
        group: "voucher",
        title: "有憑證但缺發票號碼",
        date: record.date,
        subject: record.item,
        detail: "這筆已有憑證檔，請補上發票號碼，之後查帳會更快。",
        targetView: "ledger",
        targetType: record.type,
        recordId: record.id,
        priority: 82,
        status: "待補號碼",
      }));
    }

    if (hasInvoiceNumber && !hasVoucher) {
      items.push(createOverviewCheckItem({
        group: "voucher",
        title: "有發票號碼但缺憑證",
        date: record.date,
        subject: record.item,
        detail: "發票號碼已填，但尚未附上發票或收據檔。",
        targetView: "ledger",
        targetType: record.type,
        recordId: record.id,
        priority: 72,
        status: "待補憑證",
      }));
    }

    if (isSalesRevenueRecord(record) && !record.inventoryLinks?.length) {
      items.push(createOverviewCheckItem({
        group: "inventory",
        title: "銷貨收入未配庫存",
        date: record.date,
        subject: record.item,
        detail: "尚未選擇售出的庫存品項，毛利可能失真。",
        targetView: "ledger",
        targetType: "income",
        recordId: record.id,
        priority: 78,
        status: "待配庫存",
      }));
    }

    if (record.type === "income" && Array.isArray(record.inventoryLinks) && record.inventoryLinks.some((link) => {
      const sourceId = getInventoryLinkSourceId(link);
      return !sourceId || !inventoryCache.some((lot) => lot.id === sourceId);
    })) {
      items.push(createOverviewCheckItem({
        group: "inventory",
        title: "收入配到不存在庫存",
        date: record.date,
        subject: record.item,
        detail: "這筆收入有庫存連結，但找不到原始庫存批次。",
        targetView: "ledger",
        targetType: "income",
        recordId: record.id,
        priority: 95,
        status: "庫存異常",
      }));
    }

    if (recordLooksLikePurchaseInventory(record) && !hasInventoryEntryForLedger(record.id)) {
      items.push(createOverviewCheckItem({
        group: "inventory",
        title: "進貨支出未入庫",
        date: record.date,
        subject: record.item,
        detail: "支出看起來是進貨或包材，但沒有對應入庫紀錄。",
        targetView: "ledger",
        targetType: "expense",
        recordId: record.id,
        priority: 74,
        status: "待入庫",
      }));
    }

    if ((isReceivableRecord(record) || isPayableRecord(record)) && record.dueDate && record.dueDate <= today) {
      items.push(createOverviewCheckItem({
        group: "settlement",
        title: isReceivableRecord(record) ? "應收已到期" : "應付已到期",
        date: record.dueDate,
        subject: record.item,
        detail: "帳期已到或逾期，請確認是否已收款／付款並與銀行核對。",
        targetView: "settlement",
        targetType: record.type,
        recordId: record.id,
        priority: record.dueDate < today ? 96 : 88,
        status: record.dueDate < today ? "逾期" : "今日到期",
      }));
    }
  });

  activeVouchers.forEach((voucher) => {
    const statusInfo = getVoucherInboxStatusInfo(voucher);
    const hasInvoiceNumber = hasInvoiceNumberValue(voucher.invoiceNumber);
    if (!hasInvoiceNumber || statusInfo.status !== "matched") {
      items.push(createOverviewCheckItem({
        group: "voucher",
        title: hasInvoiceNumber ? "發票號碼尚未完整配帳" : "憑證暫存缺發票號碼",
        date: voucher.date,
        subject: voucher.item || voucher.counterparty || voucher.sourceFileName,
        detail: hasInvoiceNumber
          ? `總額 NT$ ${formatNumber(voucher.totalAmount || 0)}，目前${statusInfo.label}。`
          : "行政憑證已進暫存池，但還沒補上發票號碼。",
        targetView: "vouchers",
        recordId: voucher.id,
        priority: hasInvoiceNumber ? 76 : 84,
        status: hasInvoiceNumber ? "待配帳" : "待補號碼",
      }));
    }
  });

  activeBank.forEach((transaction) => {
    const formallyMatched = isBankTransactionFormallyMatched(transaction);
    const classifiedOnly = isBankTransactionClassified(transaction);
    const ignored = transaction.status === "不入帳";
    if (!formallyMatched && !classifiedOnly && !ignored) {
      items.push(createOverviewCheckItem({
        group: "cashflow",
        title: "銀行交易未配對",
        date: transaction.date,
        subject: transaction.description || transaction.sourceFile || "銀行交易",
        detail: "銀行資料已匯入，但還沒配到收入、支出、平台撥款或代墊還款。",
        targetView: "cashflow",
        priority: 86,
        status: "待核對",
      }));
    }
    if (classifiedOnly) {
      items.push(createOverviewCheckItem({
        group: "cashflow",
        title: "銀行已分類但未配帳務",
        date: transaction.date,
        subject: transaction.description || transaction.sourceFile || "銀行交易",
        detail: "目前只有分類，還沒有正式連到某筆收入或支出。",
        targetView: "cashflow",
        priority: 70,
        status: "待配帳務",
      }));
    }
  });

  buildDuplicateRecordChecks(activeRecords).forEach((item) => items.push(item));

  return dedupeOverviewCheckItems(items)
    .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0) || String(a.date || "").localeCompare(String(b.date || "")));
}

function createOverviewCheckItem(item) {
  return {
    group: "pending",
    title: "",
    date: "",
    subject: "",
    detail: "",
    targetView: "pending",
    targetType: "",
    recordId: "",
    priority: 20,
    status: "待處理",
    ...item,
  };
}

function recordLooksLikePurchaseInventory(record) {
  if (record.type !== "expense") return false;
  const text = [record.major, record.middle, record.minor, record.item, record.note]
    .filter(Boolean)
    .join(" ");
  return /進貨|存貨|完整箱|整箱|一箱|散盒|卡盒|散卡|卡片|包材/.test(text);
}

function hasInventoryEntryForLedger(ledgerId) {
  return inventoryCache.some((record) => !record.deletedAt && record.action !== "out" && record.linkedLedgerId === ledgerId);
}

function getInventoryLinkSourceId(link) {
  if (!link || typeof link !== "object") return "";
  return link.sourceInventoryId || link.inventoryId || link.sourceId || link.lotId || link.id || "";
}

function buildDuplicateRecordChecks(records) {
  const groups = new Map();
  records.forEach((record) => {
    const key = [
      record.type,
      record.date,
      normalizeInvoiceNumber(record.invoiceNumber),
      String(Number(record.amount || 0)),
      normalizeLooseText(record.counterparty),
      normalizeLooseText(record.item),
    ].join("|");
    groups.set(key, [...(groups.get(key) || []), record]);
  });

  return Array.from(groups.values())
    .filter((group) => group.length > 1)
    .map((group) => {
      const record = group[0];
      return createOverviewCheckItem({
        group: "duplicate",
        title: "疑似重複資料",
        date: record.date,
        subject: record.item,
        detail: `同日期、對象、項目與金額共有 ${formatNumber(group.length)} 筆，請確認是否為重複匯入。`,
        targetView: "ledger",
        targetType: record.type,
        recordId: record.id,
        priority: 80,
        status: "疑似重複",
      });
    });
}

function normalizeLooseText(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function dedupeOverviewCheckItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = [item.group, item.title, item.recordId, item.date, item.subject].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getOverviewCheckGroupClass(group) {
  if (["voucher", "cashflow", "inventory", "settlement", "duplicate", "lineDraft"].includes(group)) return group;
  return "pending";
}

function renderVoucherCenter() {
  if (!voucherSummary || !voucherList) return;

  const rows = buildVoucherRows();
  renderVoucherInbox();
  renderVoucherAdjustments();
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
    readableCollectionQuery("voucherInbox", 100),
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
    const normalizedVouchers = mergeAdminVoucherRows(vouchers.map((voucher) => normalizeDriveVoucherInbox(voucher)).filter(Boolean));
    const { approvedItems, skippedCount } = await reviewDuplicateImports("voucher", normalizedVouchers);

    for (const normalizedVoucher of approvedItems) {
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
  const documentMeta = resolveVoucherDocumentMeta(voucher);
  return {
    type,
    invoiceNumber: normalizeInvoiceNumber(voucher.invoiceNumber),
    originalInvoiceNumber: normalizeInvoiceNumber(voucher.originalInvoiceNumber),
    adjustmentNumber: String(voucher.adjustmentNumber || voucher.returnNumber || "").trim(),
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
    voucherType: documentMeta.label || voucher.voucherType || "",
    documentType: documentMeta.documentType,
    adjustmentKind: documentMeta.adjustmentKind,
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
  const vouchers = mergeAdminVoucherRows(workbook.SheetNames
    .flatMap((sheetName) => {
      const rows = readAdminVoucherRows(workbook.Sheets[sheetName]);
      const sourceWorkbook = workbook.SheetNames.length > 1 ? `${file.name}／${sheetName}` : file.name;
      return rows.map((row) => parseAdminVoucherRow(row.values, row.sourceRow, sourceWorkbook));
    })
    .filter(Boolean));

  if (!vouchers.length) {
    showToast("沒有找到可匯入的憑證資料。");
    return;
  }

  const { approvedItems, skippedCount } = await reviewDuplicateImports("voucher", vouchers);
  if (!approvedItems.length) {
    showToast("匯入已取消，沒有新增憑證資料。");
    return;
  }

  for (const voucher of approvedItems) {
    await saveImportedVoucherInboxRecord(voucher);
  }

  if (isConfigured) {
    await loadVoucherInbox();
  } else {
    saveLocalVoucherInbox();
    renderVoucherCenter();
  }

  const importedCount = approvedItems.length;
  const skippedMessage = skippedCount ? `，略過 ${skippedCount} 筆疑似重複憑證` : "";
  showToast(`已匯入 ${importedCount} 筆行政憑證${skippedMessage}。`);
}

function readAdminVoucherRows(sheet) {
  const matrix = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  const headerIndex = matrix.findIndex((row) => {
    const headers = row.map(normalizeHeader);
    const hasVoucherSignal = ["發票日期", "單據日期", "發票號碼", "原發票號碼", "折讓單號 / 退貨單號", "單據類型", "供應商名稱", "新檔名"].some((name) =>
      headers.includes(normalizeHeader(name)),
    );
    const hasAmount = ["含稅價", "含稅金額", "支出金額", "未稅總價", "未稅金額", "稅金"].some((name) =>
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
  const originalInvoiceNumber = normalizeInvoiceNumber(pickValue(row, ["原發票號碼", "原憑證號碼"]));
  const adjustmentNumber = String(pickValue(row, ["折讓單號 / 退貨單號", "折讓單號", "退貨單號", "退出單號"]) || "").trim();
  const date = normalizeImportDate(pickValue(row, ["發票日期", "單據日期", "日期"]));
  const counterparty = String(pickValue(row, ["供應商名稱", "供應商", "交易對象", "廠商", "交易對象系統編碼"]) || "").trim();
  const item = String(pickValue(row, ["品項", "項目", "摘要"]) || "").trim();
  const quantity = parseAmount(pickValue(row, ["數量"]));
  const unitPrice = parseAmount(pickValue(row, ["單價"]));
  const netAmount = parseAmount(pickValue(row, ["未稅總價", "未稅金額"]));
  const taxAmount = parseAmount(pickValue(row, ["稅金", "稅額"]));
  const grossAmount = parseAmount(pickValue(row, ["含稅價", "含稅金額", "總金額"]));
  const expenseAmount = parseAmount(pickValue(row, ["支出金額", "金額"]));
  const amount = grossAmount || expenseAmount || netAmount + taxAmount || netAmount;
  const sourceFileName = String(pickValue(row, ["新檔名", "檔名", "憑證檔名"]) || "").trim();
  const rawVoucherType = String(pickValue(row, ["單據類型", "發票型式", "憑證型式"]) || "").trim();
  const processResult = String(pickValue(row, ["處理結果"]) || "").trim();
  const rawNote = String(pickValue(row, ["備註"]) || "").trim();
  const link = String(pickValue(row, ["憑證連結", "檔案連結", "Google Drive", "連結"]) || "").trim();
  const documentMeta = resolveVoucherDocumentMeta({
    voucherType: rawVoucherType,
    processResult,
    sourceWorkbook,
    sourceFileName,
    note: rawNote,
  });

  if (!amount || (!invoiceNumber && !sourceFileName && !counterparty && !item)) return null;

  return {
    type: documentMeta.recordType || "expense",
    invoiceNumber,
    originalInvoiceNumber,
    adjustmentNumber,
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
    voucherType: documentMeta.label || rawVoucherType,
    documentType: documentMeta.documentType,
    adjustmentKind: documentMeta.adjustmentKind,
    processResult,
    note: [
      item,
      documentMeta.label,
      originalInvoiceNumber ? `原發票：${originalInvoiceNumber}` : "",
      adjustmentNumber ? `單號：${adjustmentNumber}` : "",
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

function mergeAdminVoucherRows(vouchers) {
  const groups = new Map();

  vouchers.forEach((voucher) => {
    const key = buildAdminVoucherMergeKey(voucher);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(voucher);
  });

  return Array.from(groups.values()).map((group) => mergeAdminVoucherGroup(group));
}

function buildAdminVoucherMergeKey(voucher) {
  const sourceFileName = normalizeVoucherMergeText(voucher.sourceFileName);
  const documentType = voucher.documentType || resolveVoucherDocumentMeta(voucher).documentType || "invoice";
  const date = normalizeImportDate(voucher.date) || voucher.date || "";
  const primaryNumber = [
    normalizeInvoiceNumber(voucher.invoiceNumber),
    normalizeInvoiceNumber(voucher.originalInvoiceNumber),
    String(voucher.adjustmentNumber || "").trim(),
  ].find(Boolean);

  if (sourceFileName) {
    return ["file", sourceFileName, primaryNumber || date, documentType].join("|");
  }

  return [
    "number",
    primaryNumber || normalizeVoucherMergeText(voucher.counterparty),
    date,
    documentType,
  ].join("|");
}

function mergeAdminVoucherGroup(group) {
  if (group.length <= 1) return group[0];

  const base = group[0];
  const sourceFileAmount = parseAmountFromVoucherFileName(base.sourceFileName);
  const lineAmountTotal = group.reduce((sum, voucher) => sum + Number(voucher.totalAmount || 0), 0);
  const totalAmount = sourceFileAmount || lineAmountTotal;
  const detailItems = group.map((voucher) => ({
    item: voucher.item || "",
    quantity: Number(voucher.quantity || 0),
    unitPrice: Number(voucher.unitPrice || 0),
    netAmount: Number(voucher.netAmount || 0),
    taxAmount: Number(voucher.taxAmount || 0),
    totalAmount: Number(voucher.totalAmount || 0),
    sourceRow: voucher.sourceRow || "",
  }));
  const itemSummary = uniqueNonEmpty(group.map((voucher) => voucher.item)).join("、");
  const processResults = uniqueNonEmpty(group.map((voucher) => voucher.processResult)).join("、");
  const sourceRows = uniqueNonEmpty(group.map((voucher) => voucher.sourceRow)).join(", ");
  const detailSummary = detailItems
    .map((item) => {
      const amountText = item.totalAmount ? `NT$ ${formatNumber(item.totalAmount)}` : "";
      const quantityText = item.quantity ? ` x ${formatNumber(item.quantity)}` : "";
      return [item.item, quantityText, amountText ? `（${amountText}）` : ""].filter(Boolean).join("");
    })
    .filter(Boolean)
    .join("；");
  const amountNote = sourceFileAmount && lineAmountTotal && sourceFileAmount !== lineAmountTotal
    ? `檔名總額 NT$ ${formatNumber(sourceFileAmount)}；明細列合計 NT$ ${formatNumber(lineAmountTotal)}`
    : "";
  const originalInvoiceNumber = uniqueNonEmpty(group.map((voucher) => voucher.originalInvoiceNumber))[0] || base.originalInvoiceNumber;
  const adjustmentNumber = uniqueNonEmpty(group.map((voucher) => voucher.adjustmentNumber))[0] || base.adjustmentNumber;

  return {
    ...base,
    counterparty: uniqueNonEmpty(group.map((voucher) => voucher.counterparty))[0] || base.counterparty,
    item: itemSummary || base.item,
    quantity: group.reduce((sum, voucher) => sum + Number(voucher.quantity || 0), 0),
    unitPrice: 0,
    netAmount: group.reduce((sum, voucher) => sum + Number(voucher.netAmount || 0), 0),
    taxAmount: group.reduce((sum, voucher) => sum + Number(voucher.taxAmount || 0), 0),
    totalAmount,
    matchedAmount: 0,
    remainingAmount: totalAmount,
    voucherLinks: uniqueNonEmpty(group.flatMap((voucher) => voucher.voucherLinks || [])),
    originalInvoiceNumber,
    adjustmentNumber,
    processResult: processResults || base.processResult,
    sourceRow: sourceRows,
    sourceRows,
    detailItems,
    note: [
      itemSummary || base.item,
      base.voucherType,
      originalInvoiceNumber ? `原發票：${originalInvoiceNumber}` : "",
      adjustmentNumber ? `單號：${adjustmentNumber}` : "",
      processResults,
      detailSummary ? `明細：${detailSummary}` : "",
      amountNote,
      base.sourceFileName ? `檔名：${base.sourceFileName}` : "",
      `來源：${base.sourceWorkbook} 第 ${sourceRows} 列`,
    ].filter(Boolean).join("｜"),
  };
}

function parseAmountFromVoucherFileName(fileName) {
  const cleanName = String(fileName || "").replace(/\.[^.]+$/, "");
  const candidates = cleanName
    .split(/[_\s-]+/)
    .map((part) => part.replace(/,/g, ""))
    .filter((part) => /^\d+(\.\d+)?$/.test(part))
    .filter((part) => !/^20\d{6}$/.test(part))
    .filter((part) => part.length < 8)
    .map((part) => Number(part))
    .filter((amount) => amount > 0);
  return candidates.length ? candidates[candidates.length - 1] : 0;
}

function normalizeVoucherMergeText(value) {
  return String(value || "").replace(/\s+/g, "").trim().toLowerCase();
}

function uniqueNonEmpty(values) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function isVoucherAdjustment(voucher) {
  const documentType = voucher.documentType || resolveVoucherDocumentMeta(voucher).documentType;
  return ["purchaseAllowance", "purchaseReturn", "salesAllowance", "salesReturn"].includes(documentType);
}

function getRegularVoucherInboxItems() {
  return voucherInboxCache.filter((voucher) => !isVoucherAdjustment(voucher));
}

function getVoucherAdjustmentItems() {
  return voucherInboxCache
    .filter((voucher) => !voucher.deletedAt && isVoucherAdjustment(voucher))
    .sort(compareRecordsByDateAndCreatedTime);
}

function renderVoucherAdjustments() {
  if (!voucherAdjustmentPanel) return;

  const adjustments = getVoucherAdjustmentItems();
  if (!adjustments.length) {
    voucherAdjustmentPanel.className = "voucher-adjustment-panel empty-state";
    voucherAdjustmentPanel.textContent = "目前沒有折讓／退出單。";
    return;
  }

  const openCount = adjustments.filter((voucher) => getVoucherInboxStatusInfo(voucher).status !== "matched").length;
  const matchedCount = adjustments.length - openCount;
  voucherAdjustmentPanel.className = "voucher-adjustment-panel";
  voucherAdjustmentPanel.innerHTML = `
    <div class="voucher-adjustment-head">
      <div>
        <strong>折讓／退出配帳</strong>
        <span>進貨折讓／退出只配支出；銷貨折讓／退回只配收入。</span>
      </div>
      <div class="voucher-adjustment-counts">
        <span>待配 ${formatNumber(openCount)} 筆</span>
        <span>已配 ${formatNumber(matchedCount)} 筆</span>
      </div>
    </div>
    <div class="voucher-adjustment-list">
      ${adjustments.map(renderVoucherInboxRow).join("")}
    </div>
  `;
}

function renderVoucherInbox() {
  if (!voucherInboxList) return;

  updateVoucherInboxFilter();

  const regularVouchers = getRegularVoucherInboxItems();
  if (!regularVouchers.length) {
    voucherInboxList.className = "voucher-inbox-list empty-state";
    voucherInboxList.textContent = "目前沒有暫存憑證。";
    return;
  }

  const visibleVouchers = regularVouchers.filter((voucher) => shouldShowVoucherInboxItem(voucher));

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
  const documentMeta = resolveVoucherDocumentMeta(voucher);
  const voucherTypeLabel = documentMeta.label || (voucherType === "income" ? "銷項收入憑證" : "進項支出憑證");
  const links = Array.isArray(voucher.voucherLinks) ? voucher.voucherLinks.filter(Boolean) : [];
  const editPanel = activeVoucherEditId === voucher.id ? renderVoucherEditPanel(voucher) : "";
  const referenceText = [
    voucher.originalInvoiceNumber ? `原發票 ${voucher.originalInvoiceNumber}` : "",
    voucher.adjustmentNumber ? `折讓／退回單號 ${voucher.adjustmentNumber}` : "",
  ].filter(Boolean).join(" · ");

  return `
    <article class="voucher-inbox-item ${escapeHtml(statusInfo.status)}">
      <span class="pill ${tone}">${escapeHtml(statusInfo.label)}</span>
      <div class="voucher-inbox-main">
        <strong>${escapeHtml(voucher.invoiceNumber || "未填發票號碼")}</strong>
        <span>${escapeHtml(voucherTypeLabel)} · ${escapeHtml(voucher.date || "")} · ${escapeHtml(voucher.counterparty || "未填交易對象")}</span>
        ${referenceText ? `<span>${escapeHtml(referenceText)}</span>` : ""}
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
        <button type="button" data-voucher-match data-voucher-id="${escapeHtml(voucher.id)}">配帳</button>
      </div>
      ${editPanel}
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
  const currentDocumentType = voucher.documentType || resolveVoucherDocumentMeta(voucher).documentType || "invoice";
  return `
    <div class="voucher-edit-panel" data-voucher-edit-panel="${escapeHtml(voucher.id)}">
      <label>
        <span>發票號碼</span>
        <input type="text" value="${escapeHtml(voucher.invoiceNumber || "")}" data-voucher-edit-field="invoiceNumber" placeholder="例如：ZX04555853" />
      </label>
      <label>
        <span>單據類型</span>
        <select data-voucher-edit-field="documentType">
          ${[
            ["invoice", "一般發票／收據"],
            ["purchaseAllowance", "進貨折讓單"],
            ["purchaseReturn", "進貨退出單"],
            ["salesAllowance", "銷貨折讓單"],
            ["salesReturn", "銷貨退回單"],
          ].map(([value, label]) => `<option value="${value}" ${currentDocumentType === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>原發票號碼</span>
        <input type="text" value="${escapeHtml(voucher.originalInvoiceNumber || "")}" data-voucher-edit-field="originalInvoiceNumber" placeholder="折讓／退回時填寫" />
      </label>
      <label>
        <span>折讓／退回單號</span>
        <input type="text" value="${escapeHtml(voucher.adjustmentNumber || "")}" data-voucher-edit-field="adjustmentNumber" placeholder="例如：IA2026..." />
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
  const removeButton = match.voucherId && match.ledgerId
    ? `<button type="button" data-voucher-remove-match data-voucher-id="${escapeHtml(match.voucherId)}" data-ledger-id="${escapeHtml(match.ledgerId)}">移除</button>`
    : "";

  return `
    <div class="voucher-ledger-row ${record ? "" : "missing"}">
      <span>
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(date)} · ${escapeHtml(type)} · ${escapeHtml(counterparty)}</small>
      </span>
      <b>NT$ ${formatNumber(amount)}</b>
      ${removeButton}
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
  const regularVouchers = getRegularVoucherInboxItems();
  const counts = { open: 0, unmatched: 0, partial: 0, overmatched: 0, matched: 0, all: regularVouchers.length };
  regularVouchers.forEach((voucher) => {
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
  const candidates = getVoucherMatchCandidates(voucher);

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

function getVoucherMatchCandidates(voucher) {
  const voucherType = resolveVoucherRecordType(voucher);
  const adjustmentVoucher = isVoucherAdjustment(voucher);
  return recordsCache
    .filter((record) => !record.deletedAt && record.type === voucherType && Number(record.amount || 0) > 0)
    .filter((record) => !hasVoucherMatch(record, voucher.id))
    .filter((record) => adjustmentVoucher || !isLedgerVoucherVerified(record))
    .sort((a, b) => getVoucherMatchScore(b, voucher) - getVoucherMatchScore(a, voucher));
}

function getVoucherMatchScore(record, voucher) {
  const originalInvoiceNumber = normalizeInvoiceNumber(voucher.originalInvoiceNumber);
  const invoiceNumber = normalizeInvoiceNumber(voucher.invoiceNumber);
  let score = 0;

  if (originalInvoiceNumber && normalizeInvoiceNumber(record.invoiceNumber) === originalInvoiceNumber) score += 1000;
  if (invoiceNumber && normalizeInvoiceNumber(record.invoiceNumber) === invoiceNumber) score += 900;
  if (sameMoney(record.amount, voucher.totalAmount)) score += 80;
  if (record.date && voucher.date && record.date === voucher.date) score += 40;
  if (sameLooseText(record.counterparty, voucher.counterparty)) score += 25;
  if (sameLooseText(record.item, voucher.item)) score += 20;
  return score;
}

function getVoucherMatchSearchText(record) {
  return normalizeVoucherMergeText([
    record.date,
    typeLabel(record.type),
    record.counterparty,
    record.item,
    record.amount,
    record.invoiceNumber,
    record.major,
    record.middle,
    record.minor,
    record.cashflow,
    record.account,
    record.note,
  ].filter(Boolean).join(" "));
}

function renderVoucherMatchCandidate(record, remainingAmount) {
  const suggestedAmount = Math.min(Number(record.amount || 0), remainingAmount);
  return `
    <label class="voucher-match-candidate" data-voucher-match-search="${escapeHtml(getVoucherMatchSearchText(record))}">
      <input type="checkbox" data-match-record-id="${escapeHtml(record.id)}" />
      <span>
        <strong>${escapeHtml(record.item || "未命名交易")}</strong>
        <small>${escapeHtml(record.date || "")} · ${escapeHtml(typeLabel(record.type))} · ${escapeHtml(record.counterparty || "未填交易對象")} · NT$ ${formatNumber(record.amount)}${record.invoiceNumber ? ` · ${escapeHtml(record.invoiceNumber)}` : ""}</small>
      </span>
      <input type="number" min="0" step="1" value="${escapeHtml(String(suggestedAmount))}" data-match-amount-for="${escapeHtml(record.id)}" />
    </label>
  `;
}

function resolveVoucherDocumentMeta(voucher) {
  const text = [
    voucher?.documentType,
    voucher?.voucherType,
    voucher?.processResult,
    voucher?.sourceWorkbook,
    voucher?.sourceFileName,
    voucher?.note,
  ]
    .filter(Boolean)
    .join(" ");

  if (/進貨折讓/.test(text)) {
    return { recordType: "expense", documentType: "purchaseAllowance", adjustmentKind: "allowance", label: "進貨折讓單" };
  }
  if (/進貨退|進貨退出|退出單/.test(text)) {
    return { recordType: "expense", documentType: "purchaseReturn", adjustmentKind: "return", label: "進貨退出單" };
  }
  if (/銷貨折讓/.test(text)) {
    return { recordType: "income", documentType: "salesAllowance", adjustmentKind: "allowance", label: "銷貨折讓單" };
  }
  if (/銷貨退|銷貨退回|退回單/.test(text)) {
    return { recordType: "income", documentType: "salesReturn", adjustmentKind: "return", label: "銷貨退回單" };
  }
  return { recordType: "", documentType: "invoice", adjustmentKind: "", label: "" };
}

function buildVoucherDocumentFields(documentType, voucher = {}) {
  const labels = {
    invoice: voucher.voucherType || "",
    purchaseAllowance: "進貨折讓單",
    purchaseReturn: "進貨退出單",
    salesAllowance: "銷貨折讓單",
    salesReturn: "銷貨退回單",
  };
  const types = {
    purchaseAllowance: "expense",
    purchaseReturn: "expense",
    salesAllowance: "income",
    salesReturn: "income",
  };
  const adjustmentKinds = {
    purchaseAllowance: "allowance",
    salesAllowance: "allowance",
    purchaseReturn: "return",
    salesReturn: "return",
  };
  const normalizedType = documentType || "invoice";

  return {
    documentType: normalizedType,
    adjustmentKind: adjustmentKinds[normalizedType] || "",
    voucherType: labels[normalizedType] || voucher.voucherType || "",
    type: types[normalizedType] || resolveVoucherRecordType(voucher),
  };
}

function resolveVoucherRecordType(voucher) {
  if (voucher?.type === "income" || voucher?.recordType === "income" || voucher?.voucherDirection === "income") return "income";
  if (voucher?.type === "expense" || voucher?.recordType === "expense" || voucher?.voucherDirection === "expense") return "expense";

  const documentMeta = resolveVoucherDocumentMeta(voucher);
  if (documentMeta.recordType) return documentMeta.recordType;

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

function hasRegularVoucherMatch(record) {
  return (Array.isArray(record.voucherMatches) ? record.voucherMatches : []).some((match) => !match.isAdjustment);
}

function isLedgerVoucherVerified(record) {
  return hasRegularVoucherMatch(record) || (hasAttachedVoucher(record) && hasInvoiceNumberValue(record.invoiceNumber));
}

async function matchVoucherInbox(voucherId) {
  const voucher = voucherInboxCache.find((item) => item.id === voucherId);
  if (!voucher) return;

  const remainingAmount = Math.max(0, Number(voucher.totalAmount || 0) - getVoucherMatchedAmount(voucher));
  const voucherType = resolveVoucherRecordType(voucher);
  const voucherTypeLabel = voucherType === "income" ? "收入" : "支出";
  const candidates = getVoucherMatchCandidates(voucher);

  if (!remainingAmount) {
    showToast("這張憑證已經配完。");
    return;
  }

  if (!candidates.length) {
    showToast(`目前沒有可配對的${voucherTypeLabel}。`);
    return;
  }

  activeVoucherEditId = "";
  activeVoucherMatchId = "";
  renderVoucherCenter();
  await openVoucherMatchDialog(voucher, remainingAmount, candidates, voucherTypeLabel);
}

function openVoucherMatchDialog(voucher, remainingAmount, candidates, voucherTypeLabel) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    const defaultSearchTerm = getDefaultVoucherMatchSearchTerm(voucher, candidates);
    const originalInvoiceHint = voucher.originalInvoiceNumber
      ? defaultSearchTerm
        ? `已用原發票 ${voucher.originalInvoiceNumber} 篩選`
        : `原發票 ${voucher.originalInvoiceNumber} 未在支出發票欄找到，可改搜品項／金額`
      : "可用品項、對象、日期、金額搜尋";
    overlay.className = "match-dialog-overlay voucher-match-overlay";
    overlay.innerHTML = `
      <div class="match-dialog voucher-match-dialog" role="dialog" aria-modal="true" aria-label="憑證配帳">
        <div class="match-dialog-header">
          <div>
            <p class="eyebrow">VOUCHER MATCH</p>
            <h3>選擇要核實的${escapeHtml(voucherTypeLabel)}帳務</h3>
            <p>${escapeHtml(voucher.invoiceNumber || "未填發票號碼")} · ${escapeHtml(voucher.date || "")} · NT$ ${formatNumber(voucher.totalAmount)}</p>
          </div>
          <button type="button" data-voucher-dialog-close>×</button>
        </div>
        <div class="match-dialog-summary">
          <span>憑證剩餘 <strong>NT$ ${formatNumber(remainingAmount)}</strong></span>
          <span>已選合計 <strong data-voucher-match-total>NT$ 0</strong></span>
          <span>可配餘額 <strong data-voucher-match-left>NT$ ${formatNumber(remainingAmount)}</strong></span>
        </div>
        <div class="voucher-match-search">
          <input type="search" data-voucher-match-search-input placeholder="搜尋原發票、品項、對象、日期、金額" value="${escapeHtml(defaultSearchTerm)}" />
          <button type="button" class="secondary-button" data-voucher-match-clear>清除</button>
          <span data-voucher-match-search-count>${formatNumber(candidates.length)} 筆可選</span>
          <small>${escapeHtml(originalInvoiceHint)}</small>
        </div>
        <div class="voucher-match-panel" data-voucher-match-panel="${escapeHtml(voucher.id)}">
          <div class="match-dialog-list voucher-match-dialog-list">
            ${candidates.map((record) => renderVoucherMatchCandidate(record, remainingAmount)).join("")}
          </div>
          <div class="empty-state voucher-match-empty" data-voucher-match-empty hidden>找不到符合搜尋的帳務。</div>
        </div>
        <div class="match-dialog-actions">
          <button type="button" class="secondary-button" data-voucher-dialog-cancel>取消</button>
          <button type="button" data-voucher-apply-match data-voucher-id="${escapeHtml(voucher.id)}">套用配帳</button>
        </div>
      </div>
    `;

    const close = (value) => {
      overlay.remove();
      resolve(value);
    };
    const updateTotal = () => {
      const checkedBoxes = Array.from(overlay.querySelectorAll("[data-match-record-id]:checked"));
      const total = checkedBoxes.reduce((sum, checkbox) => {
        const recordId = checkbox.dataset.matchRecordId;
        const amountInput = overlay.querySelector(`[data-match-amount-for="${CSS.escape(recordId)}"]`);
        return sum + parseAmount(amountInput?.value || 0);
      }, 0);
      overlay.querySelector("[data-voucher-match-total]").textContent = `NT$ ${formatNumber(total)}`;
      overlay.querySelector("[data-voucher-match-left]").textContent = `NT$ ${formatNumber(remainingAmount - total)}`;
    };
    const applySearch = () => {
      const keyword = normalizeVoucherMergeText(overlay.querySelector("[data-voucher-match-search-input]")?.value || "");
      let visibleCount = 0;
      overlay.querySelectorAll("[data-voucher-match-search]").forEach((item) => {
        const visible = !keyword || item.dataset.voucherMatchSearch.includes(keyword);
        item.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      overlay.querySelector("[data-voucher-match-empty]").hidden = visibleCount > 0;
      overlay.querySelector("[data-voucher-match-search-count]").textContent = `${formatNumber(visibleCount)} 筆符合`;
    };

    overlay.addEventListener("input", (event) => {
      if (event.target.matches("[data-voucher-match-search-input]")) {
        applySearch();
        return;
      }
      updateTotal();
    });
    overlay.addEventListener("change", updateTotal);
    overlay.querySelector("[data-voucher-dialog-close]").addEventListener("click", () => close(false));
    overlay.querySelector("[data-voucher-dialog-cancel]").addEventListener("click", () => close(false));
    overlay.querySelector("[data-voucher-match-clear]").addEventListener("click", () => {
      overlay.querySelector("[data-voucher-match-search-input]").value = "";
      applySearch();
    });
    overlay.querySelector("[data-voucher-apply-match]").addEventListener("click", async (event) => {
      event.currentTarget.disabled = true;
      const applied = await applyVoucherMatches(voucher.id, overlay);
      if (applied) {
        close(true);
        return;
      }
      event.currentTarget.disabled = false;
    });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close(false);
    });

    document.body.appendChild(overlay);
    applySearch();
  });
}

function getDefaultVoucherMatchSearchTerm(voucher, candidates) {
  const originalInvoiceNumber = normalizeInvoiceNumber(voucher.originalInvoiceNumber);
  if (!originalInvoiceNumber) return "";
  return candidates.some((record) => getVoucherMatchSearchText(record).includes(normalizeVoucherMergeText(originalInvoiceNumber)))
    ? voucher.originalInvoiceNumber
    : "";
}

async function applyVoucherMatches(voucherId, root = document) {
  const voucher = voucherInboxCache.find((item) => item.id === voucherId);
  const panel = root.querySelector(`[data-voucher-match-panel="${CSS.escape(voucherId)}"]`);
  if (!voucher || !panel) return false;

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
    return false;
  }

  const totalSelected = selected.reduce((sum, match) => sum + match.amount, 0);
  if (totalSelected > remainingAmount) {
    showToast(`分配金額超過憑證剩餘 NT$ ${formatNumber(remainingAmount)}。`);
    return false;
  }

  const voucherType = resolveVoucherRecordType(voucher);
  const hasWrongType = selected.some((match) => {
    const record = recordsCache.find((item) => item.id === match.recordId);
    return !record || record.type !== voucherType;
  });
  if (hasWrongType) {
    showToast(`這張憑證只能配${voucherType === "income" ? "收入" : "支出"}帳務。`);
    return false;
  }

  if (!isVoucherAdjustment(voucher)) {
    const alreadyVerified = selected.some((match) => {
      const record = recordsCache.find((item) => item.id === match.recordId);
      return record && isLedgerVoucherVerified(record);
    });
    if (alreadyVerified) {
      showToast("已核實的帳務不需要再配一般憑證。");
      return false;
    }
  }

  const now = new Date();
  const documentMeta = resolveVoucherDocumentMeta(voucher);
  const newMatches = selected.map((match) => ({
    voucherId,
    ledgerId: match.recordId,
    amount: match.amount,
    invoiceNumber: voucher.invoiceNumber || "",
    originalInvoiceNumber: voucher.originalInvoiceNumber || "",
    adjustmentNumber: voucher.adjustmentNumber || "",
    documentType: voucher.documentType || documentMeta.documentType || "invoice",
    adjustmentKind: voucher.adjustmentKind || documentMeta.adjustmentKind || "",
    voucherType: documentMeta.label || voucher.voucherType || "",
    isAdjustment: isVoucherAdjustment(voucher),
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
  return true;
}

function normalizeVoucherInboxAfterMatch(voucher, newMatches) {
  const matches = [...(Array.isArray(voucher.matches) ? voucher.matches : []), ...newMatches];
  return normalizeVoucherInboxWithMatches(voucher, matches);
}

function normalizeVoucherInboxWithMatches(voucher, matches) {
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

async function removeVoucherLedgerMatch(voucherId, ledgerId) {
  const voucher = voucherInboxCache.find((item) => item.id === voucherId);
  const record = recordsCache.find((item) => item.id === ledgerId);
  if (!voucher || !record) {
    showToast("找不到要移除的配帳資料，請重新整理後再試。");
    return;
  }

  const matches = Array.isArray(voucher.matches) ? voucher.matches : [];
  const targetMatch = matches.find((match) => match.ledgerId === ledgerId);
  if (!targetMatch) {
    showToast("這筆配帳已不存在。");
    return;
  }

  const ok = window.confirm(`確定要移除這筆配帳嗎？\n\n憑證：${voucher.invoiceNumber || voucher.item || "未填發票號碼"}\n帳務：${record.item || "未命名交易"}\n金額：NT$ ${formatNumber(targetMatch.amount)}`);
  if (!ok) return;

  const updatedVoucher = normalizeVoucherInboxWithMatches(
    voucher,
    matches.filter((match) => match.ledgerId !== ledgerId),
  );

  await saveVoucherInboxUpdate(voucher, updatedVoucher);
  await saveLedgerVoucherUnmatch(record, voucher, ledgerId);

  activeVoucherMatchId = "";
  renderVoucherCenter();
  renderRecords(recordsCache);
  updateSummary(recordsCache);
  showToast("已移除這筆憑證配帳。");
}

async function saveVoucherInboxEdit(voucherId) {
  const voucher = voucherInboxCache.find((item) => item.id === voucherId);
  const panel = document.querySelector(`[data-voucher-edit-panel="${CSS.escape(voucherId)}"]`);
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
    originalInvoiceNumber: normalizeInvoiceNumber(getFieldValue("originalInvoiceNumber")),
    adjustmentNumber: getFieldValue("adjustmentNumber").trim(),
    ...buildVoucherDocumentFields(getFieldValue("documentType"), voucher),
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

async function saveLedgerVoucherUnmatch(record, voucher, ledgerId) {
  const remainingMatches = (Array.isArray(record.voucherMatches) ? record.voucherMatches : [])
    .filter((match) => !(match.voucherId === voucher.id && match.ledgerId === ledgerId));
  const voucherLinksToRemove = new Set(Array.isArray(voucher.voucherLinks) ? voucher.voucherLinks.filter(Boolean) : []);
  const hasSameVoucherRemaining = remainingMatches.some((match) => match.voucherId === voucher.id);
  const voucherLinks = hasSameVoucherRemaining
    ? (Array.isArray(record.voucherLinks) ? record.voucherLinks : [])
    : (Array.isArray(record.voucherLinks) ? record.voucherLinks.filter((url) => !voucherLinksToRemove.has(url)) : []);
  const regularMatches = remainingMatches.filter((match) => !match.isAdjustment);
  const shouldClearInvoice = Boolean(
    voucher.invoiceNumber &&
      normalizeInvoiceNumber(record.invoiceNumber) === normalizeInvoiceNumber(voucher.invoiceNumber) &&
      !regularMatches.length,
  );
  const updatedRecord = {
    ...record,
    invoiceNumber: shouldClearInvoice ? "" : record.invoiceNumber,
    voucherMatches: remainingMatches,
    voucherLinks,
    hasVoucher: Boolean(
      voucherLinks.length ||
        getVoucherNames(record).length ||
        record.voucherFiles?.length ||
        record.voucher ||
        regularMatches.length,
    ),
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
    const hasInvoiceNumber = hasInvoiceNumberValue(record.invoiceNumber);

    if (!needsVoucher && !hasVoucher) return;
    if (isNoInvoiceNumber(record.invoiceNumber)) return;

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
    if (hasReportablePendingReason(record)) {
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

function renderInventoryOutSelector() {
  if (!selectInventoryOutButton) return;
  selectInventoryOutButton.hidden = inventoryActionSelect.value !== "out";
}

async function selectInventoryForManualOut() {
  const selected = await confirmInventoryOutSelections(
    {
      item: "手動出庫",
      amount: 0,
    },
    {
      splitMode: false,
      singleSelect: true,
      confirmLabel: "帶入出庫表單",
      footerText: "選一筆庫存並填本次沖銷數量，系統會自動帶入品名、成本與來源。",
    },
  );
  if (selected === null) return;
  const item = selected[0];
  if (!item?.lot) return;
  await applyInventoryAdjustmentsFromSelections([item]);
  if (isConfigured) await loadInventoryRecords();
  applyManualInventoryOutSelection(item);
}

function applyManualInventoryOutSelection(item) {
  const outbound = buildInventoryOutboundFromSelection(item);
  inventorySourceRecordInput.value = item.lot.id || "";
  inventoryTypeSelect.value = outbound.type || item.lot.type || "box";
  renderInventorySources();
  inventoryActionSelect.value = "out";
  renderInventoryOutSelector();
  const desiredSource = "手動出庫";
  if (![...inventorySourceSelect.options].some((option) => option.value === desiredSource)) {
    inventorySourceSelect.add(new Option(desiredSource, desiredSource));
  }
  inventorySourceSelect.value = desiredSource;
  inventoryNameInput.value = item.lot.name || "";
  inventoryQtyInput.value = formatInventorySplitNumber(outbound.quantity);
  inventoryUnitCostInput.value = outbound.unitCost ? formatInventorySplitNumber(outbound.unitCost) : "";
  inventoryTotalCostInput.value = outbound.totalCost ? formatInventorySplitNumber(outbound.totalCost) : "";
  inventoryReferenceInput.value = `來源庫存：${item.lot.name || ""}`;
  inventoryNoteInput.value = item.inventoryAdjustment ? "出庫前已同步修正來源庫存數量／成本。" : "";
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
    sourceInventoryId: inventoryActionSelect.value === "out" ? inventorySourceRecordInput?.value || "" : "",
    sourceQuantityUsed: inventoryActionSelect.value === "out" ? quantity : 0,
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
    readableCollectionQuery("inventoryRecords", 200),
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
  const selected = await confirmInventoryOutSelections(record, {
    splitMode: panel?.classList.contains("split-mode"),
  });
  if (selected === null) return;

  if (!selected.length) {
    showToast("請先勾選要出庫的庫存。");
    return;
  }

  if (selected.some((item) => !isValidInventoryOutSelection(item))) {
    showToast("請確認出庫數量不可超過可用庫存。");
    return;
  }

  const links = [];
  await applyInventoryAdjustmentsFromSelections(selected);
  for (const item of selected) {
    const outbound = buildInventoryOutboundFromSelection(item);
    const outRecord = {
      date: record.date,
      month: record.date.slice(0, 7).replace("-", ""),
      type: outbound.type,
      action: "out",
      source: "銷售出庫",
      name: outbound.name,
      quantity: outbound.quantity,
      unitCost: outbound.unitCost,
      totalCost: outbound.totalCost,
      sourceQuantityUsed: outbound.sourceQuantityUsed,
      splitTotalUnits: outbound.splitTotalUnits,
      splitSoldUnits: outbound.splitSoldUnits,
      reference: `收入：${record.item}`,
      note: `由收入紀錄配對出庫；原庫存來源：${item.lot.source}`,
      linkedLedgerId: record.id,
      sourceInventoryId: item.lot.id,
    };
    const savedId = await addInventoryRecord(outRecord);
    links.push({
      inventoryRecordId: savedId,
      sourceInventoryId: item.lot.id,
      name: outbound.name,
      type: outbound.type,
      quantity: outbound.displayQuantity,
      unitCost: outbound.unitCost,
      totalCost: outbound.totalCost,
      splitTotalUnits: outbound.splitTotalUnits,
      splitSoldUnits: outbound.splitSoldUnits,
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
  renderInventoryOutSelector();
  inventorySourceSelect.value = record.source || inventorySourceSelect.value;
  inventorySourceRecordInput.value = record.sourceInventoryId || "";
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

async function handleLedgerAssetSync(record) {
  if (record.type !== "expense" || record.assetSyncPrompted) return;
  if (assetCache.some((asset) => asset.sourceLedgerId === record.id && !asset.deletedAt)) return;
  if (!looksLikeFixedAssetExpense(record)) return;

  const confirmed = window.confirm(
    `這筆支出看起來可能是固定資產，要加入資產清單嗎？\n\n${record.item}\nNT$ ${formatNumber(record.amount)}\n\n提醒：這只是管理清冊，折舊與正式會計科目仍待會計師確認。`,
  );
  if (!confirmed) return;

  const draft = buildAssetDraftFromExpense(record);
  const inputText = window.prompt(
    [
      "請確認資產資料，每行格式：分類｜名稱｜數量｜金額｜保固月數",
      "分類可填：資訊設備、直播設備、辦公家具、電器設備",
      "",
      "例如：直播設備｜直播鏡頭｜1｜12000｜24",
    ].join("\n"),
    `${draft.category}｜${draft.name}｜${draft.quantity}｜${draft.amount}｜${draft.warrantyMonths}`,
  );
  if (inputText === null) return;

  const assets = parseAssetPrompt(inputText, record);
  if (!assets.length) {
    showToast("沒有可新增的固定資產資料。");
    return;
  }

  for (const asset of assets) {
    await addAssetRecord(asset);
    await syncAssetRecordToGoogleSheet(asset);
  }

  if (isConfigured) await loadAssetRecords();
  else renderAssets();
  showToast(`已新增 ${assets.length} 筆固定資產。`);
}

function looksLikeFixedAssetExpense(record) {
  const text = `${record.major || ""} ${record.middle || ""} ${record.minor || ""} ${record.item || ""} ${record.note || ""}`;
  return /固定資產|辦公設備|設備|資訊設備|直播設備|辦公家具|電器設備|電腦|螢幕|相機|鏡頭|麥克風|桌|椅|冷氣|冰箱|除濕|印表機|掃描|支架|燈|防潮箱|淨水器|吸塵器/u.test(text);
}

function buildAssetDraftFromExpense(record) {
  const category = inferAssetCategory(record);
  return {
    category,
    name: inferAssetNameFromExpense(record),
    quantity: 1,
    amount: Number(record.amount || 0),
    warrantyMonths: 0,
  };
}

function inferAssetNameFromExpense(record) {
  const item = String(record.item || "").trim();
  if (item) return item;

  const note = String(record.note || "").trim();
  if (note && note !== "無") return note;

  return "未命名資產";
}

function inferAssetCategory(record) {
  const text = `${record.major || ""} ${record.middle || ""} ${record.minor || ""} ${record.item || ""}`;
  if (/資訊|電腦|網路|交換器|記憶卡|掃描|印表|鍵盤|滑鼠/u.test(text)) return "資訊設備";
  if (/直播|相機|鏡頭|麥克風|燈|支架|綠幕|HDMI|TypeC|集線器|電視/u.test(text)) return "直播設備";
  if (/桌|椅|櫃|沙發|推車|家具/u.test(text)) return "辦公家具";
  if (/冷氣|冰箱|除濕|防潮|淨水|吸塵|電風扇/u.test(text)) return "電器設備";
  return "直播設備";
}

function buildAssetNoteFromExpense(record) {
  const parts = [];
  if (record.counterparty) parts.push(`由支出新增：${record.counterparty}`);
  else parts.push("由支出新增");
  if (record.note && record.note !== "無") parts.push(record.note);
  return parts.join("｜");
}

function parseAssetPrompt(text, sourceRecord) {
  const reservations = new Map();
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[|｜]/).map((part) => part.trim());
      const category = normalizeAssetCategory(parts[0]) || inferAssetCategory(sourceRecord);
      const name = parts[1] || sourceRecord.item || "未命名資產";
      const quantity = Number(String(parts[2] || "1").replace(/,/g, "")) || 1;
      const amount = Number(String(parts[3] || sourceRecord.amount || 0).replace(/,/g, "")) || 0;
      const warrantyMonths = Number(String(parts[4] || "0").replace(/,/g, "")) || 0;
      const purchaseDate = sourceRecord.date || toDateValue(new Date());
      return {
        assetNumber: generateNextAssetNumber(category, reservations),
        category,
        name,
        quantity,
        purchaseDate,
        amount,
        warrantyMonths,
        warrantyEndDate: warrantyMonths ? addMonthsToDate(purchaseDate, warrantyMonths) : purchaseDate,
        warrantyStatus: warrantyMonths ? resolveWarrantyStatus(addMonthsToDate(purchaseDate, warrantyMonths)) : "已過保",
        labelStatus: "未貼",
        note: buildAssetNoteFromExpense(sourceRecord),
        source: "支出同步新增資產",
        sourceLedgerId: sourceRecord.id,
      };
    })
    .filter((asset) => asset.category && asset.name && asset.quantity > 0);
}

function normalizeAssetCategory(value) {
  const trimmed = String(value || "").trim();
  if (assetCategoryCodes[trimmed]) return trimmed;
  const code = trimmed.toUpperCase();
  return assetCodeCategories[code] || "";
}

function generateNextAssetNumber(category, reservations = new Map()) {
  const code = assetCategoryCodes[category] || "OT";
  const base = assetCache
    .map((asset) => String(asset.assetNumber || "").match(new RegExp(`^PH-${code}-(\\d+)$`)))
    .filter(Boolean)
    .reduce((max, match) => Math.max(max, Number(match[1] || 0)), 0);
  const next = Math.max(base, Number(reservations.get(code) || 0)) + 1;
  reservations.set(code, next);
  return `PH-${code}-${String(next).padStart(4, "0")}`;
}

function addMonthsToDate(dateValue, months) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  date.setMonth(date.getMonth() + Number(months || 0));
  return toDateValue(date);
}

function resolveWarrantyStatus(warrantyEndDate) {
  if (!warrantyEndDate) return "";
  return warrantyEndDate >= toDateValue(new Date()) ? "保固中" : "已過保";
}

async function importSeedAssetRecords() {
  if (isConfigured && (!currentUser || !db)) {
    showToast("請先登入後再匯入固定資產。");
    return;
  }

  const rows = parseFixedAssetSeedRows();
  const existing = new Set(assetCache.map((asset) => asset.assetNumber).filter(Boolean));
  const toImport = rows.filter((asset) => asset.assetNumber && !existing.has(asset.assetNumber));

  if (!toImport.length) {
    showToast("固定資產清冊已匯入過，沒有新增資料。");
    return;
  }

  const confirmed = window.confirm(
    `將匯入固定資產清冊 ${toImport.length} 筆。\n已存在的資產編號會跳過，不會覆蓋原資料。\n\n是否繼續？`,
  );
  if (!confirmed) return;

  for (const asset of toImport) {
    await addAssetRecord(asset);
    await syncAssetRecordToGoogleSheet(asset);
  }

  if (isConfigured) await loadAssetRecords();
  renderAssets();
  showToast(`固定資產已匯入 ${toImport.length} 筆。`);
}

function setDefaultAssetDate() {
  if (!assetPurchaseDateInput) return;
  const today = new Date();
  const year = Math.min(Math.max(today.getFullYear(), 2026), 2035);
  assetPurchaseDateInput.value = `${year}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function clearAssetForm() {
  assetForm?.reset();
  if (assetQtyInput) assetQtyInput.value = "1";
  setDefaultAssetDate();
}

async function saveManualAssetRecord(event) {
  event.preventDefault();

  if (isConfigured && (!currentUser || !db)) {
    showToast("請先登入後再新增固定資產。");
    return;
  }

  const record = buildManualAssetRecord();
  if (!record) return;

  const originalText = saveAssetButton?.textContent || "新增固定資產";
  if (saveAssetButton) {
    saveAssetButton.disabled = true;
    saveAssetButton.textContent = "新增中...";
  }

  try {
    await addAssetRecord(record);
    await syncAssetRecordToGoogleSheet(record);
    if (isConfigured) await loadAssetRecords();
    else renderAssets();
    clearAssetForm();
    renderCustomReport();
    showToast("固定資產已新增，並已送出 Google Sheet 同步。");
  } catch (error) {
    showToast(`新增固定資產失敗：${error.message || error}`);
  } finally {
    if (saveAssetButton) {
      saveAssetButton.disabled = false;
      saveAssetButton.textContent = originalText;
    }
  }
}

function buildManualAssetRecord() {
  const category = normalizeAssetCategory(assetCategorySelect?.value) || "直播設備";
  const name = String(assetNameInput?.value || "").trim();
  const quantity = Number(assetQtyInput?.value || 0);
  const purchaseDate = assetPurchaseDateInput?.value || "";
  const amount = Number(assetAmountInput?.value || 0);
  const warrantyMonths = Number(assetWarrantyMonthsInput?.value || 0);
  const warrantyEndDate = warrantyMonths ? addMonthsToDate(purchaseDate, warrantyMonths) : purchaseDate;

  if (!name) {
    showToast("請輸入固定資產名稱。");
    return null;
  }

  if (!quantity || quantity <= 0) {
    showToast("請輸入大於 0 的資產數量。");
    return null;
  }

  if (!purchaseDate || purchaseDate < "2026-01-01" || purchaseDate > "2035-12-31") {
    showToast("請選擇 2026-2035 之間的購買日期。");
    return null;
  }

  if (amount < 0) {
    showToast("金額不可小於 0。");
    return null;
  }

  return {
    assetNumber: generateNextAssetNumber(category),
    category,
    name,
    quantity,
    purchaseDate,
    amount,
    warrantyMonths,
    warrantyEndDate,
    warrantyStatus: warrantyMonths ? resolveWarrantyStatus(warrantyEndDate) : "已過保",
    labelStatus: "未貼",
    note: String(assetNoteInput?.value || "").trim(),
    source: "ERP手動新增",
  };
}

async function syncAssetRecordToGoogleSheet(asset) {
  if (!lineEndpointConfig.endpointUrl || !lineEndpointConfig.fixedAssetSpreadsheetId) return;

  await fetch(lineEndpointConfig.endpointUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "syncFixedAsset",
      secret: lineEndpointConfig.sharedSecret,
      spreadsheetId: lineEndpointConfig.fixedAssetSpreadsheetId,
      sheetName: lineEndpointConfig.fixedAssetSheetName || "資產清冊",
      asset,
    }),
  });
}

async function syncAllAssetRecordsToGoogleSheet() {
  if (!assetCache.length) {
    showToast("目前沒有固定資產可同步。");
    return;
  }

  const originalText = syncAssetSheetButton?.textContent || "同步全部到 Google Sheet";
  if (syncAssetSheetButton) {
    syncAssetSheetButton.disabled = true;
    syncAssetSheetButton.textContent = "同步中...";
  }

  try {
    const activeAssets = [...assetCache].filter((asset) => !asset.deletedAt).sort(compareAssets);
    for (const asset of activeAssets) {
      await syncAssetRecordToGoogleSheet(asset);
    }
    showToast(`已送出 ${activeAssets.length} 筆固定資產到 Google Sheet。`);
  } catch (error) {
    showToast(`同步固定資產失敗：${error.message || error}`);
  } finally {
    if (syncAssetSheetButton) {
      syncAssetSheetButton.disabled = false;
      syncAssetSheetButton.textContent = originalText;
    }
  }
}

function parseFixedAssetSeedRows() {
  return fixedAssetSeedTsv
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split("\t"))
    .map(([assetNumber, category, name, quantity, purchaseSerial, amount, warrantyMonths, warrantyEndSerial, warrantyStatus, labelStatus, note]) => ({
      assetNumber,
      category,
      name: String(name || "").trim(),
      quantity: Number(quantity || 0),
      purchaseDate: excelSerialToDateValue(purchaseSerial),
      amount: Number(amount || 0),
      warrantyMonths: warrantyMonths === "" ? "" : Number(warrantyMonths || 0),
      warrantyEndDate: warrantyEndSerial ? excelSerialToDateValue(warrantyEndSerial) : "",
      warrantyStatus: warrantyStatus || "",
      labelStatus: labelStatus || "未貼",
      note: note || "",
      source: "Google Sheets 固定資產清冊 2026-07-01",
    }));
}

function excelSerialToDateValue(serial) {
  const value = Number(serial || 0);
  if (!value) return "";
  const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
  return date.toISOString().slice(0, 10);
}

async function loadAssetRecords() {
  if (!currentUser || !db) return;

  const snapshot = await firebaseApi.getDocs(
    readableCollectionQuery("assetRecords", 500),
  );
  assetCache = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((record) => !record.deletedAt)
    .sort(compareAssets);
  renderAssets();
}

async function addAssetRecord(record) {
  const payload = {
    ...record,
    category: normalizeAssetCategory(record.category) || record.category,
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  };

  if (isConfigured) {
    const docRef = await firebaseApi.addDoc(firebaseApi.collection(db, "assetRecords"), {
      ...payload,
      createdAt: firebaseApi.serverTimestamp(),
      createdBy: currentUser.email,
      userId: currentUser.uid,
    });
    return docRef.id;
  }

  const id = crypto.randomUUID();
  assetCache.unshift({ id, ...payload, createdAt: new Date() });
  saveLocalAssetRecords();
  return id;
}

function renderAssets() {
  if (!assetSummary || !assetList) return;

  const summary = buildAssetSummary(assetCache);
  assetSummary.innerHTML = `
    <div class="inventory-summary-grid">
      <article class="inventory-card">
        <span>資產件數</span>
        <strong>${formatNumber(summary.totalQuantity)} 件</strong>
      </article>
      <article class="inventory-card">
        <span>資產總額</span>
        <strong>NT$ ${formatNumber(summary.totalAmount)}</strong>
      </article>
      <article class="inventory-card">
        <span>尚未貼標</span>
        <strong>${formatNumber(summary.unlabeled)} 筆</strong>
      </article>
      <article class="inventory-card">
        <span>保固中</span>
        <strong>${formatNumber(summary.inWarranty)} 筆</strong>
      </article>
      <article class="inventory-card">
        <span>待確認</span>
        <strong>${formatNumber(summary.pending)} 筆</strong>
      </article>
    </div>
  `;

  if (!assetCache.length) {
    assetList.className = "inventory-list empty-state";
    assetList.textContent = "尚無固定資產紀錄";
    return;
  }

  assetList.className = "inventory-list";
  assetList.innerHTML = [...assetCache].sort(compareAssets).map(renderAssetRecord).join("");
}

function buildAssetSummary(records) {
  return records.reduce(
    (summary, record) => {
      summary.totalQuantity += Number(record.quantity || 0);
      summary.totalAmount += Number(record.amount || 0);
      if ((record.labelStatus || "未貼") !== "已貼") summary.unlabeled += 1;
      if (record.warrantyStatus === "保固中") summary.inWarranty += 1;
      if (!record.purchaseDate || !record.amount || record.warrantyStatus === "" || record.warrantyStatus === null) summary.pending += 1;
      return summary;
    },
    { totalQuantity: 0, totalAmount: 0, unlabeled: 0, inWarranty: 0, pending: 0 },
  );
}

function renderAssetRecord(record) {
  const code = assetCategoryCodes[record.category] || "OT";
  return `
    <article class="inventory-row">
      <span class="pill ${record.category === "資訊設備" ? "income" : ""}">${escapeHtml(code)}</span>
      <div>
        <strong>${escapeHtml(record.name)}</strong>
        <span>${escapeHtml(record.assetNumber)} · ${escapeHtml(record.category)} · ${escapeHtml(record.note || "無備註")}</span>
      </div>
      <strong>${formatNumber(record.quantity)} 件</strong>
      <span>NT$ ${formatNumber(record.amount)}</span>
      <span>${escapeHtml(record.purchaseDate || "未填日期")} · ${escapeHtml(record.warrantyStatus || "待確認")} · ${escapeHtml(record.labelStatus || "未貼")}</span>
      <div class="record-actions">
        <button type="button" data-asset-action="details" data-asset-id="${escapeHtml(record.id)}">看明細</button>
        <button type="button" data-asset-action="rename" data-asset-id="${escapeHtml(record.id)}">改名稱</button>
        <button type="button" class="danger" data-asset-action="delete" data-asset-id="${escapeHtml(record.id)}">刪除</button>
      </div>
    </article>
  `;
}

function showAssetDetailDialog(record) {
  const rows = [
    ["資產編號", record.assetNumber],
    ["分類", record.category],
    ["名稱", record.name],
    ["數量", `${formatNumber(record.quantity)} 件`],
    ["購買日期", record.purchaseDate || "未填"],
    ["金額", `NT$ ${formatNumber(record.amount)}`],
    ["保固期限", record.warrantyMonths === "" ? "待確認" : `${formatNumber(record.warrantyMonths)} 個月`],
    ["保固到期日", record.warrantyEndDate || "待確認"],
    ["保固狀態", record.warrantyStatus || "待確認"],
    ["貼標狀態", record.labelStatus || "未貼"],
    ["備註", record.note || "無"],
    ["來源", record.source || "ERP"],
  ];

  window.alert(rows.map(([label, value]) => `${label}：${value}`).join("\n"));
}

async function handleRenameAssetRecord(record) {
  const nextName = window.prompt("請輸入固定資產名稱", record.name || "");
  if (nextName === null) return;

  const name = nextName.trim();
  if (!name) {
    showToast("固定資產名稱不可空白。");
    return;
  }

  if (name === record.name) return;

  const updates = {
    name,
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
  };

  if (isConfigured) {
    await firebaseApi.updateDoc(firebaseApi.doc(db, "assetRecords", record.id), updates);
    const syncedAsset = { ...record, name };
    await syncAssetRecordToGoogleSheet(syncedAsset);
    await loadAssetRecords();
  } else {
    assetCache = assetCache.map((item) => (item.id === record.id ? { ...item, ...updates } : item));
    saveLocalAssetRecords();
    renderAssets();
  }

  renderCustomReport();
  showToast("固定資產名稱已更新。");
}

async function handleDeleteAssetRecord(record) {
  const confirmed = window.confirm(
    `確定要刪除這筆固定資產嗎？\n\n${record.assetNumber}｜${record.name}\nNT$ ${formatNumber(record.amount)}\n\n刪除後會保留在刪除紀錄。`,
  );
  if (!confirmed) return;

  if (isConfigured) {
    await softDeleteRecord("assetRecords", record.id, record);
    await loadAssetRecords();
  } else {
    await softDeleteRecord("assetRecords", record.id, record);
    assetCache = assetCache.filter((item) => item.id !== record.id);
    saveLocalAssetRecords();
    renderAssets();
  }

  renderCustomReport();
  showToast("固定資產已移到刪除紀錄。");
}

function compareAssets(a, b) {
  const categoryOrder = Object.keys(assetCategoryCodes);
  const aCategoryIndex = categoryOrder.includes(a.category) ? categoryOrder.indexOf(a.category) : categoryOrder.length;
  const bCategoryIndex = categoryOrder.includes(b.category) ? categoryOrder.indexOf(b.category) : categoryOrder.length;
  const categoryCompare = aCategoryIndex - bCategoryIndex;
  if (categoryCompare) return categoryCompare;

  const dateCompare = String(b.purchaseDate || "").localeCompare(String(a.purchaseDate || ""));
  if (dateCompare) return dateCompare;

  const numberCompare = String(a.assetNumber || "").localeCompare(String(b.assetNumber || ""), "zh-Hant");
  if (numberCompare) return numberCompare;
  return String(a.name || "").localeCompare(String(b.name || ""), "zh-Hant");
}

function clearInventoryForm() {
  inventoryForm.reset();
  editingInventoryId = null;
  inventorySourceRecordInput.value = "";
  saveInventoryButton.textContent = "儲存庫存";
  setDefaultInventoryDate();
  renderInventorySources();
  renderInventoryOutSelector();
}

function renderInventory() {
  const summary = buildInventorySummary(inventoryCache);
  inventorySummary.innerHTML = `
    <div class="inventory-summary-grid">
      <article class="inventory-card">
        <span>完整箱庫存</span>
        <strong>${formatNumber(summary.sealedCaseQty)} 箱</strong>
        <button type="button" data-inventory-summary-detail="sealedCase">看明細</button>
      </article>
      <article class="inventory-card">
        <span>散盒庫存</span>
        <strong>${formatNumber(summary.boxQty)} 盒</strong>
        <button type="button" data-inventory-summary-detail="box">看明細</button>
      </article>
      <article class="inventory-card">
        <span>散卡庫存</span>
        <strong>${formatNumber(summary.cardQty)} 張</strong>
        <button type="button" data-inventory-summary-detail="card">看明細</button>
      </article>
      <article class="inventory-card">
        <span>包材庫存</span>
        <strong>${formatNumber(summary.supplyQty)} 件</strong>
        <button type="button" data-inventory-summary-detail="supply">看明細</button>
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
      if (record.type === "sealedCase") summary.sealedCaseQty += qty;
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
    sealedCaseQty: Number(inventoryOpeningCaseQtyInput.value || 0),
    boxQty: Number(inventoryOpeningBoxQtyInput.value || 0),
    cardQty: Number(inventoryOpeningCardQtyInput.value || 0),
    supplyQty: 0,
    totalCost: Number(inventoryOpeningCostInput.value || 0),
  };
}

function getAvailableInventoryLots() {
  const outboundBySource = new Map();
  inventoryCache
    .filter((record) => record.action === "out" && record.sourceInventoryId)
    .forEach((record) => {
      outboundBySource.set(
        record.sourceInventoryId,
        Number(outboundBySource.get(record.sourceInventoryId) || 0) + Number(record.sourceQuantityUsed || record.quantity || 0),
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
        <button type="button" data-inventory-action="details" data-inventory-id="${escapeHtml(record.id)}">看明細</button>
        <button type="button" data-inventory-action="edit" data-inventory-id="${escapeHtml(record.id)}">修改</button>
        <button type="button" class="danger" data-inventory-action="delete" data-inventory-id="${escapeHtml(record.id)}">刪除</button>
      </div>
    </article>
  `;
}

function showInventoryTypeDetailDialog(type) {
  const label = inventoryTypeLabels[type] || "庫存";
  const unit = inventoryUnitLabels[type] || "件";
  const rows = buildInventoryTypeDetails(type);
  const totalQty = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const totalCost = rows.reduce((sum, row) => sum + Number(row.totalCost || 0), 0);
  const pendingCount = rows.reduce((sum, row) => sum + Number(row.pendingCount || 0), 0);

  const overlay = document.createElement("div");
  overlay.className = "match-dialog-overlay";
  overlay.innerHTML = `
    <div class="match-dialog inventory-type-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(label)}明細">
      <div class="match-dialog-header">
        <div>
          <p class="eyebrow">INVENTORY SUMMARY</p>
          <h3>${escapeHtml(label)}明細</h3>
          <p>依入帳時間排序目前庫存</p>
        </div>
        <button type="button" data-inventory-type-close>×</button>
      </div>
      <div class="match-dialog-summary">
        <span>目前數量 <strong>${formatNumber(totalQty)} ${unit}</strong></span>
        <span>庫存成本 <strong>NT$ ${formatNumber(totalCost)}</strong></span>
        <span>待成本確認 <strong>${formatNumber(pendingCount)} 筆</strong></span>
      </div>
      <div class="match-dialog-list">
        ${
          rows.length
            ? rows.map((row) => renderInventoryTypeDetailRow(row, unit)).join("")
            : `<div class="empty-state">目前沒有${escapeHtml(label)}庫存明細。</div>`
        }
      </div>
      <div class="match-dialog-actions">
        <button type="button" class="secondary-button" data-inventory-type-close>關閉</button>
      </div>
    </div>
  `;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-inventory-type-close]")) {
      overlay.remove();
    }
    const historyButton = event.target.closest("[data-inventory-type-history]");
    if (historyButton) {
      showInventoryTypeHistoryDialog(historyButton.dataset.inventoryTypeHistory, historyButton.dataset.inventoryType);
    }
  });
  document.body.appendChild(overlay);
}

function buildInventoryTypeDetails(type) {
  const opening = getInventoryOpening();
  const map = new Map();

  if (type === "sealedCase" && opening.sealedCaseQty) {
    addInventoryTypeDetail(map, {
      name: "期初完整箱庫存",
      type,
      quantity: opening.sealedCaseQty,
      totalCost: 0,
      date: "",
      source: "期初",
      reference: "期初數量未指定品項",
      pendingCost: Boolean(opening.sealedCaseQty),
    });
  }

  if (type === "box" && opening.boxQty) {
    addInventoryTypeDetail(map, {
      name: "期初散盒庫存",
      type,
      quantity: opening.boxQty,
      totalCost: 0,
      date: "",
      source: "期初",
      reference: "期初數量未指定品項",
      pendingCost: Boolean(opening.boxQty),
    });
  }

  if (type === "card" && opening.cardQty) {
    addInventoryTypeDetail(map, {
      name: "期初散卡庫存",
      type,
      quantity: opening.cardQty,
      totalCost: 0,
      date: "",
      source: "期初",
      reference: "期初數量未指定品項",
      pendingCost: Boolean(opening.cardQty),
    });
  }

  getAvailableInventoryLots()
    .filter((record) => record.type === type)
    .forEach((record) => {
      const unitCost = Number(record.unitCost || record.totalCost / record.quantity || 0);
      addInventoryTypeDetail(map, {
        name: record.name || "未填品名",
        type: record.type || type,
        quantity: Number(record.remainingQuantity || 0),
        totalCost: unitCost * Number(record.remainingQuantity || 0),
        date: record.date || "",
        source: record.source || "",
        reference: record.reference || "",
        pendingCost: !Number(record.totalCost || 0),
        timeValue: getRecordTimeValue(record),
      });
    });

  return Array.from(map.values()).filter((row) => Number(row.quantity || 0) > 0).sort((a, b) => {
    const timeDiff = Number(b.latestTimeValue || 0) - Number(a.latestTimeValue || 0);
    if (timeDiff) return timeDiff;
    const dateDiff = String(b.latestDate || "").localeCompare(String(a.latestDate || ""));
    if (dateDiff) return dateDiff;
    return String(a.name).localeCompare(String(b.name), "zh-Hant");
  });
}

function addInventoryTypeDetail(map, entry) {
  const key = String(entry.name || "未填品名").trim() || "未填品名";
  const current = map.get(key) || {
    name: key,
    type: entry.type || "",
    quantity: 0,
    totalCost: 0,
    movementCount: 0,
    pendingCount: 0,
    latestDate: "",
    latestTimeValue: 0,
    sources: new Set(),
    references: new Set(),
  };

  current.quantity += Number(entry.quantity || 0);
  current.totalCost += Number(entry.totalCost || 0);
  current.movementCount += 1;
  if (entry.pendingCost) current.pendingCount += 1;
  if (entry.date && String(entry.date) > String(current.latestDate || "")) current.latestDate = entry.date;
  current.latestTimeValue = Math.max(Number(current.latestTimeValue || 0), Number(entry.timeValue || 0));
  if (entry.source) current.sources.add(entry.source);
  if (entry.reference) current.references.add(entry.reference);
  map.set(key, current);
}

function renderInventoryTypeDetailRow(row, unit) {
  const averageCost = Number(row.quantity || 0) ? Number(row.totalCost || 0) / Number(row.quantity || 0) : 0;
  const sources = Array.from(row.sources).slice(0, 3).join("、") || "未填來源";
  const references = Array.from(row.references).slice(0, 2).join("、") || "無關聯說明";
  return `
    <article class="inventory-type-row">
      <div>
        <strong>${escapeHtml(row.name)}</strong>
        <span>${escapeHtml(sources)} · ${escapeHtml(references)}</span>
      </div>
      <span>${formatNumber(row.quantity)} ${unit}</span>
      <span>NT$ ${formatNumber(row.totalCost)}</span>
      <span>均 NT$ ${formatNumber(averageCost)}</span>
      <small>${formatNumber(row.movementCount)} 筆異動 · ${row.latestDate ? escapeHtml(row.latestDate) : "未填日期"}${row.pendingCount ? ` · ${formatNumber(row.pendingCount)} 筆待成本` : ""}</small>
      <button type="button" class="secondary-button compact-button" data-inventory-type-history="${escapeHtml(row.name)}" data-inventory-type="${escapeHtml(row.type || "")}">出入帳明細</button>
    </article>
  `;
}

function showInventoryTypeHistoryDialog(name, type) {
  const unit = inventoryUnitLabels[type] || "件";
  const rows = sortInventoryRecordsByTime(
    inventoryCache.filter((record) => {
      if (record.type !== type) return false;
      if (record.name === name) return true;
      const sourceInventory = record.sourceInventoryId
        ? inventoryCache.find((item) => item.id === record.sourceInventoryId)
        : null;
      return sourceInventory?.name === name;
    }),
  );

  const overlay = document.createElement("div");
  overlay.className = "match-dialog-overlay";
  overlay.innerHTML = `
    <div class="match-dialog inventory-out-dialog" role="dialog" aria-modal="true" aria-label="出入帳明細">
      <div class="match-dialog-header">
        <div>
          <p class="eyebrow">INVENTORY LEDGER</p>
          <h3>出入帳明細</h3>
          <p>${escapeHtml(name)}</p>
        </div>
        <button type="button" data-inventory-history-close>×</button>
      </div>
      <div class="inventory-out-table-wrap">
        <table class="inventory-out-table inventory-history-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>動作</th>
              <th>數量</th>
              <th>成本</th>
              <th>來源</th>
              <th>備註</th>
            </tr>
          </thead>
          <tbody>
            ${
              rows.length
                ? rows.map((record) => renderInventoryHistoryRow(record, unit)).join("")
                : `<tr><td colspan="6">目前沒有出入帳明細。</td></tr>`
            }
          </tbody>
        </table>
      </div>
      <div class="inventory-out-footer">
        <span>此處顯示該品項相關入庫、出庫與調整紀錄。</span>
        <div>
          <button type="button" class="secondary-button" data-inventory-history-close>關閉</button>
        </div>
      </div>
    </div>
  `;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-inventory-history-close]")) {
      overlay.remove();
    }
  });
  document.body.appendChild(overlay);
}

function renderInventoryHistoryRow(record, unit) {
  const direction = record.action === "out" ? "-" : "+";
  const quantity = Number(record.splitSoldUnits || record.quantity || 0);
  return `
    <tr>
      <td>${escapeHtml(record.date || "未填日期")}</td>
      <td>${escapeHtml(inventoryActionLabels[record.action] || record.action || "未填")}</td>
      <td>${direction}${formatNumber(quantity)} ${unit}</td>
      <td>NT$ ${formatNumber(record.totalCost)}</td>
      <td>${escapeHtml(record.source || "未填來源")}</td>
      <td>${escapeHtml(record.reference || record.note || "")}</td>
    </tr>
  `;
}

function showInventoryDetailDialog(record) {
  const unit = inventoryUnitLabels[record.type] || "件";
  const linkedLedger = recordsCache.find((item) => item.id === record.linkedLedgerId);
  const sourceInventory = inventoryCache.find((item) => item.id === record.sourceInventoryId);
  const detailRows = [
    ["庫存類型", inventoryTypeLabels[record.type] || record.type || "未填"],
    ["品名 / 卡名", record.name || "未填"],
    ["動作", inventoryActionLabels[record.action] || record.action || "未填"],
    ["日期", record.date || "未填"],
    ["數量", `${record.action === "out" ? "-" : "+"}${formatNumber(record.quantity)} ${unit}`],
    ["單位成本", `NT$ ${formatNumber(record.unitCost)}`],
    ["總成本", `NT$ ${formatNumber(record.totalCost)}`],
    ["來源", record.source || "未填"],
    ["關聯說明", record.reference || "無關聯來源"],
    ["來源庫存", sourceInventory ? `${sourceInventory.name}（${formatNumber(sourceInventory.quantity)} ${unit}）` : "無"],
    ["關聯帳務", linkedLedger ? formatLinkedLedgerDetail(linkedLedger) : "無"],
    ["備註", record.note || "無"],
  ];

  const overlay = document.createElement("div");
  overlay.className = "match-dialog-overlay";
  overlay.innerHTML = `
    <div class="match-dialog" role="dialog" aria-modal="true" aria-label="庫存明細">
      <div class="match-dialog-header">
        <div>
          <p class="eyebrow">INVENTORY DETAIL</p>
          <h3>${escapeHtml(record.name || "庫存明細")}</h3>
          <p>${escapeHtml(record.date || "未填日期")} · ${escapeHtml(inventoryTypeLabels[record.type] || "庫存")}</p>
        </div>
        <button type="button" data-inventory-detail-close>×</button>
      </div>
      <div class="match-dialog-list">
        <div class="inventory-detail-list">
          ${detailRows.map(([label, value]) => `
            <div class="inventory-detail-item">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="match-dialog-actions">
        <button type="button" class="secondary-button" data-inventory-detail-close>關閉</button>
      </div>
    </div>
  `;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-inventory-detail-close]")) {
      overlay.remove();
    }
  });
  document.body.appendChild(overlay);
}

function formatLinkedLedgerDetail(record) {
  const amount = `NT$ ${formatNumber(record.amount)}`;
  const invoice = record.invoiceNumber && record.invoiceNumber !== "無" ? ` · 發票 ${record.invoiceNumber}` : "";
  const ledgerType = record.type === "income" ? "收入" : record.type === "expense" ? "支出" : record.type || "帳務";
  return `${record.date || "未填日期"} · ${ledgerType} · ${record.counterparty || "未填對象"} · ${record.item || "未填摘要"} · ${amount}${invoice}`;
}

async function runSystemCheck() {
  if (!systemCheckSummary || !systemCheckList) return;

  const originalText = runSystemCheckButton?.textContent || "開始檢查";
  if (runSystemCheckButton) {
    runSystemCheckButton.disabled = true;
    runSystemCheckButton.textContent = "檢查中";
  }

  try {
    const checks = [];
    const pendingItems = buildPendingItems();
    const activeRecords = recordsCache.filter((record) => !record.deletedAt);
    const activeInventory = inventoryCache.filter((record) => !record.deletedAt);
    const activeBank = bankTransactionsCache.filter((transaction) => !transaction.deletedAt);
    const activeVouchers = voucherInboxCache.filter((voucher) => !voucher.deletedAt);
    const incomeCount = activeRecords.filter((record) => record.type === "income").length;
    const expenseCount = activeRecords.filter((record) => record.type === "expense").length;
    const pendingCounts = pendingItems.reduce((map, item) => {
      map[item.group] = (map[item.group] || 0) + 1;
      return map;
    }, {});

    checks.push({
      title: "登入狀態",
      status: currentUser ? "pass" : "pending",
      value: currentUser?.email || "尚未登入",
      detail: currentUser ? "已使用 Google 帳號登入。" : "尚未登入時只能檢查本機暫存資料。",
    });

    checks.push(await buildFirebaseReadCheck());

    checks.push({
      title: "收入／支出資料",
      status: activeRecords.length ? "pass" : "pending",
      value: `${formatNumber(activeRecords.length)} 筆`,
      detail: `收入 ${formatNumber(incomeCount)} 筆，支出 ${formatNumber(expenseCount)} 筆。`,
    });

    checks.push({
      title: "待處理事項",
      status: pendingItems.length ? "warn" : "pass",
      value: `${formatNumber(pendingItems.length)} 筆`,
      detail: pendingItems.length ? "有項目會影響報表完整性，請到待處理事項查看。" : "目前沒有待處理項目。",
    });

    checks.push({
      title: "憑證核對",
      status: (pendingCounts.voucher || 0) ? "warn" : "pass",
      value: `${formatNumber(pendingCounts.voucher || 0)} 筆`,
      detail: `憑證暫存池 ${formatNumber(activeVouchers.length)} 筆；待補或待核憑證 ${formatNumber(pendingCounts.voucher || 0)} 筆。`,
    });

    checks.push({
      title: "銀行核對",
      status: (pendingCounts.cashflow || 0) ? "warn" : "pass",
      value: `${formatNumber(pendingCounts.cashflow || 0)} 筆`,
      detail: `銀行交易 ${formatNumber(activeBank.length)} 筆；待核對現金流 ${formatNumber(pendingCounts.cashflow || 0)} 筆。`,
    });

    checks.push({
      title: "庫存資料",
      status: (pendingCounts.inventory || pendingCounts.cost) ? "warn" : "pass",
      value: `${formatNumber(activeInventory.length)} 筆`,
      detail: `庫存紀錄 ${formatNumber(activeInventory.length)} 筆；待配庫存或待補成本 ${formatNumber((pendingCounts.inventory || 0) + (pendingCounts.cost || 0))} 筆。`,
    });

    checks.push(buildBackupCheck());
    renderSystemCheckResult(checks);
    showToast("系統檢查完成。");
  } catch (error) {
    renderSystemCheckResult([
      {
        title: "系統檢查",
        status: "fail",
        value: "失敗",
        detail: error.message || String(error),
      },
    ]);
    showToast(`系統檢查失敗：${error.message || error}`);
  } finally {
    if (runSystemCheckButton) {
      runSystemCheckButton.disabled = false;
      runSystemCheckButton.textContent = originalText;
    }
  }
}

async function buildFirebaseReadCheck() {
  if (!isConfigured) {
    return {
      title: "雲端讀取",
      status: "pending",
      value: "本機模式",
      detail: "Firebase 尚未設定，現在讀到的是瀏覽器暫存資料。",
    };
  }

  if (!currentUser || !db) {
    return {
      title: "雲端讀取",
      status: "pending",
      value: "待登入",
      detail: "登入後才能確認 Firestore 是否能正常讀取。",
    };
  }

  try {
    await firebaseApi.getDocs(
      readableCollectionQuery("ledgerRecords", 1),
    );
    return {
      title: "雲端讀取",
      status: "pass",
      value: "正常",
      detail: "Firestore 可以讀取目前帳號的流水帳資料。",
    };
  } catch (error) {
    return {
      title: "雲端讀取",
      status: "fail",
      value: "失敗",
      detail: error.message || String(error),
    };
  }
}

function buildBackupCheck() {
  const lastBackupAt = localStorage.getItem("lastBackupExportAt");

  if (!lastBackupAt) {
    return {
      title: "最近備份",
      status: "pending",
      value: "待確認",
      detail: "尚未在這台瀏覽器找到備份匯出紀錄。大量整理前後建議匯出一次備份。",
    };
  }

  const lastBackupDate = new Date(lastBackupAt);
  const ageHours = (Date.now() - lastBackupDate.getTime()) / 36e5;
  return {
    title: "最近備份",
    status: ageHours > 72 ? "warn" : "pass",
    value: lastBackupDate.toLocaleString("zh-TW", { hour12: false }),
    detail: ageHours > 72 ? "距離上次備份超過 3 天，建議重新匯出。" : "最近 3 天內有匯出備份。",
  };
}

function renderSystemCheckResult(checks) {
  const counts = checks.reduce(
    (map, check) => {
      map[check.status] = (map[check.status] || 0) + 1;
      return map;
    },
    { pass: 0, warn: 0, pending: 0, fail: 0 },
  );

  systemCheckSummary.innerHTML = [
    ["正常", counts.pass || 0, "pass"],
    ["需處理", counts.warn || 0, "warn"],
    ["待確認", counts.pending || 0, "pending"],
    ["錯誤", counts.fail || 0, "fail"],
  ]
    .map(([label, count, tone]) => `
      <article class="${tone}">
        <span>${label}</span>
        <strong>${formatNumber(count)} 項</strong>
      </article>
    `)
    .join("");

  systemCheckList.className = "system-check-list";
  systemCheckList.innerHTML = checks.map(renderSystemCheckItem).join("");
}

function renderSystemCheckItem(check) {
  const labelMap = {
    pass: "正常",
    warn: "需處理",
    pending: "待確認",
    fail: "錯誤",
  };

  return `
    <article class="system-check-item ${escapeHtml(check.status)}">
      <span class="check-pill ${escapeHtml(check.status)}">${labelMap[check.status] || "待確認"}</span>
      <div>
        <strong>${escapeHtml(check.title)}</strong>
        <small>${escapeHtml(check.detail || "")}</small>
      </div>
      <b>${escapeHtml(check.value || "")}</b>
    </article>
  `;
}

function previewShareholderAdvanceCleanup() {
  if (!shareholderAdvanceCleanupPreview) return;

  const plan = buildShareholderAdvanceCleanupPlan();
  shareholderAdvanceCleanupPlan = plan.targets;

  if (applyShareholderAdvanceCleanupButton) {
    applyShareholderAdvanceCleanupButton.disabled = !plan.targets.length;
  }

  if (!plan.activeExpenseCount) {
    shareholderAdvanceCleanupPreview.className = "restore-preview empty-state";
    shareholderAdvanceCleanupPreview.textContent = "目前沒有支出流水帳可整理。";
    return;
  }

  if (!plan.targets.length) {
    shareholderAdvanceCleanupPreview.className = "restore-preview empty-state";
    shareholderAdvanceCleanupPreview.textContent = "目前沒有需要改成股東代墊未沖的支出。";
    return;
  }

  const sampleRows = plan.targets.slice(0, 25).map((record) => `
    <article class="cleanup-preview-item">
      <div>
        <strong>${escapeHtml(record.item || "未填摘要")}</strong>
        <small>${escapeHtml(record.date || "未填日期")} · ${escapeHtml(record.counterparty || "未填對象")} · ${escapeHtml(record.account || "未填帳戶")} · ${escapeHtml(record.settlementStatus || "未填狀態")}</small>
      </div>
      <b>NT$ ${formatNumber(record.amount)}</b>
    </article>
  `).join("");

  shareholderAdvanceCleanupPreview.className = "restore-preview";
  shareholderAdvanceCleanupPreview.innerHTML = `
    <div class="restore-preview-meta">
      <article>
        <span>支出總數</span>
        <strong>${formatNumber(plan.activeExpenseCount)} 筆</strong>
      </article>
      <article>
        <span>保留公司付款</span>
        <strong>${formatNumber(plan.companyPaid.length)} 筆</strong>
      </article>
      <article>
        <span>已是股東代墊</span>
        <strong>${formatNumber(plan.alreadyAdvance.length)} 筆</strong>
      </article>
      <article>
        <span>準備整理</span>
        <strong>${formatNumber(plan.targets.length)} 筆</strong>
      </article>
    </div>
    <div class="restore-preview-note warn">
      將把下列支出的「帳戶」改為股東代墊、「付款狀態」改為股東代墊未沖；不會改金額、不刪資料、不動已完成銀行配帳的公司付款。
      準備整理金額合計 NT$ ${formatNumber(plan.targetAmount)}。
    </div>
    <div class="cleanup-preview-list">
      ${sampleRows}
    </div>
    ${plan.targets.length > 25 ? `<div class="restore-preview-note">另有 ${formatNumber(plan.targets.length - 25)} 筆未顯示，套用時會一起整理。</div>` : ""}
  `;
}

function buildShareholderAdvanceCleanupPlan() {
  const activeExpenses = recordsCache.filter((record) => record.type === "expense" && !record.deletedAt);
  const companyPaid = activeExpenses.filter(isCompanyDirectPaidLedgerRecord);
  const alreadyAdvance = activeExpenses.filter((record) =>
    !isCompanyDirectPaidLedgerRecord(record) &&
    record.account === "股東代墊" &&
    record.settlementStatus === "股東代墊未沖",
  );
  const targets = activeExpenses.filter(shouldMarkAsShareholderAdvance);

  return {
    activeExpenseCount: activeExpenses.length,
    companyPaid,
    alreadyAdvance,
    targets,
    targetAmount: targets.reduce((sum, record) => sum + Number(record.amount || 0), 0),
  };
}

function shouldMarkAsShareholderAdvance(record) {
  if (!record || record.type !== "expense" || record.deletedAt) return false;
  if (isCompanyDirectPaidLedgerRecord(record)) return false;
  return !(record.account === "股東代墊" && record.settlementStatus === "股東代墊未沖");
}

function isCompanyDirectPaidLedgerRecord(record) {
  return Boolean(
    record.bankTransactionId ||
    record.bankMatchedDate ||
    record.bankMatchedDescription ||
    Number(record.bankMatchedAmount || 0) > 0,
  );
}

async function applyShareholderAdvanceCleanup() {
  if (!shareholderAdvanceCleanupPlan.length) {
    previewShareholderAdvanceCleanup();
    return;
  }

  if (isConfigured && (!currentUser || !db)) {
    showToast("請先登入後再套用股東代墊整理。");
    return;
  }

  const totalAmount = shareholderAdvanceCleanupPlan.reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const confirmed = window.confirm(
    `確定要整理 ${shareholderAdvanceCleanupPlan.length} 筆支出為「股東代墊未沖」嗎？\n\n合計：NT$ ${formatNumber(totalAmount)}\n\n這不會刪資料，也不會修改金額。`,
  );
  if (!confirmed) return;

  const originalText = applyShareholderAdvanceCleanupButton?.textContent || "套用整理";
  if (applyShareholderAdvanceCleanupButton) {
    applyShareholderAdvanceCleanupButton.disabled = true;
    applyShareholderAdvanceCleanupButton.textContent = "整理中";
  }

  try {
    let updatedCount = 0;
    for (const record of shareholderAdvanceCleanupPlan) {
      const updates = buildShareholderAdvanceCleanupUpdates();
      const updatedRecord = { ...record, ...updates };
      await writeAuditLog("update", "ledgerRecords", record.id, record, updatedRecord);

      if (isConfigured) {
        await firebaseApi.updateDoc(firebaseApi.doc(db, "ledgerRecords", record.id), updates);
      } else {
        recordsCache = recordsCache.map((item) => (item.id === record.id ? { ...item, ...updates } : item));
      }
      updatedCount += 1;
    }

    if (isConfigured) {
      await loadRecords();
    } else {
      saveLocalRecords();
      renderRecords(recordsCache);
      updateSummary(recordsCache);
      renderCustomReport();
      renderCashflow();
      renderPendingCenter();
      renderSettlementCenter();
    }

    shareholderAdvanceCleanupPlan = [];
    if (shareholderAdvanceCleanupPreview) {
      shareholderAdvanceCleanupPreview.className = "restore-preview";
      shareholderAdvanceCleanupPreview.innerHTML = `
        <div class="restore-preview-note pass">
          已完成股東代墊整理：${formatNumber(updatedCount)} 筆，合計 NT$ ${formatNumber(totalAmount)}。現在可回到收付款核對，用「已配代墊還款」去配這些帳。
        </div>
      `;
    }
    showToast(`已整理 ${formatNumber(updatedCount)} 筆股東代墊。`);
  } catch (error) {
    showToast(`股東代墊整理失敗：${error.message || error}`);
  } finally {
    if (applyShareholderAdvanceCleanupButton) {
      applyShareholderAdvanceCleanupButton.textContent = originalText;
      applyShareholderAdvanceCleanupButton.disabled = !shareholderAdvanceCleanupPlan.length;
    }
  }
}

function buildShareholderAdvanceCleanupUpdates() {
  return {
    account: "股東代墊",
    settlementStatus: "股東代墊未沖",
    settledDate: "",
    pendingReason: "股東先代墊，等待銀行代墊還款配帳。",
    updatedAt: isConfigured ? firebaseApi.serverTimestamp() : new Date(),
    updatedBy: currentUser?.email || "local-preview",
  };
}

async function exportFullBackup() {
  if (!window.XLSX) {
    showToast("Excel 匯出工具尚未載入，請重新整理後再試。");
    return;
  }

  exportBackupButton.disabled = true;
  if (backupStatus) backupStatus.textContent = "正在整理備份資料，請稍候...";

  try {
    const backup = await collectBackupData();
    const workbook = window.XLSX.utils.book_new();
    appendSheet(workbook, "備份摘要", buildBackupSummarySheet(backup));
    appendSheet(workbook, "流水帳", buildBackupSheet(backup.ledgerRecords, backupFields.ledgerRecords));
    appendSheet(workbook, "銀行資料", buildBackupSheet(backup.bankTransactions, backupFields.bankTransactions));
    appendSheet(workbook, "庫存紀錄", buildBackupSheet(backup.inventoryRecords, backupFields.inventoryRecords));
    appendSheet(workbook, "固定資產", buildBackupSheet(backup.assetRecords, backupFields.assetRecords));
    appendSheet(workbook, "憑證暫存池", buildBackupSheet(backup.voucherInbox, backupFields.voucherInbox));
    appendSheet(workbook, "LINE草稿", buildBackupSheet(backup.lineDrafts, backupFields.lineDrafts));
    appendSheet(workbook, "回收桶", buildBackupSheet(backup.recycleBin, backupFields.recycleBin));
    appendSheet(workbook, "修改紀錄", buildBackupSheet(backup.auditLogs, backupFields.auditLogs));
    appendSheet(workbook, "系統選項", buildBackupSheet(backup.systemSettings, backupFields.systemSettings));

    const stamp = getBackupTimestamp();
    window.XLSX.writeFile(workbook, `${stamp}_隆博ERP_資料備份.xlsx`);
    localStorage.setItem("lastBackupExportAt", new Date().toISOString());
    if (backupStatus) {
      backupStatus.textContent = `已匯出備份：流水帳 ${backup.ledgerRecords.length} 筆、銀行 ${backup.bankTransactions.length} 筆、庫存 ${backup.inventoryRecords.length} 筆、固定資產 ${backup.assetRecords.length} 筆、憑證 ${backup.voucherInbox.length} 筆。`;
    }
    showToast("備份 Excel 已匯出。");
  } catch (error) {
    if (backupStatus) backupStatus.textContent = "備份失敗，請確認已登入並重新整理後再試。";
    showToast(`備份失敗：${error.message || error}`);
  } finally {
    exportBackupButton.disabled = false;
  }
}

const backupFields = {
  ledgerRecords: ["id", "date", "type", "counterparty", "item", "amount", "cashflow", "account", "settlementStatus", "dueDate", "settledDate", "major", "middle", "minor", "invoiceNumber", "invoiceStatus", "hasVoucher", "pendingReason", "deletedAt", "createdBy"],
  bankTransactions: ["id", "date", "account", "description", "counterparty", "deposit", "withdrawal", "amount", "balance", "status", "linkedType", "linkedRecordId", "sourceFile", "deletedAt", "createdBy"],
  inventoryRecords: ["id", "date", "type", "action", "source", "name", "quantity", "remainingQuantity", "unitCost", "totalCost", "syncOrder", "reference", "linkedLedgerId", "deletedAt", "createdBy"],
  assetRecords: ["id", "assetNumber", "category", "name", "quantity", "purchaseDate", "amount", "warrantyMonths", "warrantyEndDate", "warrantyStatus", "labelStatus", "note", "source", "sourceLedgerId", "deletedAt", "createdBy"],
  voucherInbox: ["id", "invoiceNumber", "originalInvoiceNumber", "adjustmentNumber", "documentType", "adjustmentKind", "voucherType", "date", "type", "counterparty", "item", "totalAmount", "matchedAmount", "remainingAmount", "status", "source", "sourceWorkbook", "sourceFileName", "sourceRow", "deletedAt", "createdBy"],
  lineDrafts: ["id", "date", "type", "counterparty", "item", "amount", "cashflow", "account", "major", "middle", "minor", "status", "needsReview", "source", "createdBy"],
  recycleBin: ["collectionName", "id", "date", "type", "item", "description", "amount", "deletedAt", "deletedBy", "rawJson"],
  auditLogs: ["id", "action", "collectionName", "recordId", "createdAt", "createdBy", "rawJson"],
  systemSettings: ["id", "createdAt", "updatedAt", "rawJson"],
};

const restoreSheetDefinitions = [
  { key: "ledgerRecords", name: "流水帳", label: "流水帳", collectionName: "ledgerRecords" },
  { key: "bankTransactions", name: "銀行資料", label: "銀行資料", collectionName: "bankTransactions" },
  { key: "inventoryRecords", name: "庫存紀錄", label: "庫存紀錄", collectionName: "inventoryRecords" },
  { key: "assetRecords", name: "固定資產", label: "固定資產", collectionName: "assetRecords" },
  { key: "voucherInbox", name: "憑證暫存池", label: "憑證暫存池", collectionName: "voucherInbox" },
  { key: "lineDrafts", name: "LINE草稿", label: "LINE 草稿", collectionName: "lineDrafts" },
  { key: "recycleBin", name: "回收桶", label: "回收桶", collectionName: "" },
  { key: "auditLogs", name: "修改紀錄", label: "修改紀錄", collectionName: "auditLogs" },
  { key: "systemSettings", name: "系統選項", label: "系統選項", collectionName: "systemSettings" },
];

async function previewBackupFile() {
  const file = restoreBackupInput?.files?.[0];
  if (!file) return;

  if (!window.XLSX) {
    showToast("Excel 讀取工具尚未載入，請重新整理後再試。");
    return;
  }

  restoreBackupDraft = null;
  restoreBackupPlan = null;
  if (restoreBackupStatus) restoreBackupStatus.textContent = `正在讀取：${file.name}`;
  if (restoreBackupPreview) {
    restoreBackupPreview.className = "restore-preview empty-state";
    restoreBackupPreview.textContent = "讀取中，請稍候...";
  }

  try {
    const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
    const summary = readBackupSummary(workbook);
    const sheets = restoreSheetDefinitions.map((definition) => ({
      ...definition,
      ...readBackupSheetState(workbook, definition.name),
    }));
    const missingSheets = sheets.filter((sheet) => !sheet.exists);
    const totalRows = sheets.reduce((sum, sheet) => sum + sheet.count, 0);
    restoreBackupDraft = { fileName: file.name, summary, sheets };

    if (restoreBackupStatus) {
      restoreBackupStatus.textContent = `已讀取：${file.name}。目前只是預覽，尚未還原或覆蓋資料。`;
    }

    renderRestoreBackupPreview({
      fileName: file.name,
      totalRows,
      summary,
      sheets,
      missingSheets,
    });
  } catch (error) {
    if (restoreBackupStatus) restoreBackupStatus.textContent = "讀取失敗，請確認這是隆博ERP匯出的 Excel 備份檔。";
    if (restoreBackupPreview) {
      restoreBackupPreview.className = "restore-preview empty-state";
      restoreBackupPreview.textContent = `讀取失敗：${error.message || error}`;
    }
    showToast(`備份檔讀取失敗：${error.message || error}`);
  } finally {
    if (restoreBackupInput) restoreBackupInput.value = "";
  }
}

function readBackupSummary(workbook) {
  const sheet = workbook.Sheets["備份摘要"];
  if (!sheet) return { exists: false };

  const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const findValue = (label) => {
    const row = rows.find((item) => String(item[0] || "").trim() === label);
    return row ? String(row[1] || "").trim() : "";
  };

  return {
    exists: true,
    exportedAt: findValue("匯出時間"),
    exportedBy: findValue("匯出者"),
    source: findValue("資料來源"),
  };
}

function readBackupSheetState(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { exists: false, count: 0, headers: [], records: [] };

  const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headers = (rows[0] || []).map((cell) => String(cell || "").trim()).filter(Boolean);
  const dataRows = rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .filter((row) => String(row[0] || "").trim() !== "目前沒有資料");

  return {
    exists: true,
    count: dataRows.length,
    headers,
    records: dataRows.map((row) => parseBackupRow(headers, row)),
  };
}

function parseBackupRow(headers, row) {
  const record = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]));
  if (record.rawJson) {
    try {
      const parsed = JSON.parse(record.rawJson);
      return { ...record, ...parsed };
    } catch {
      return record;
    }
  }
  return record;
}

function renderRestoreBackupPreview({ fileName, totalRows, summary, sheets, missingSheets }) {
  if (!restoreBackupPreview) return;

  const summaryItems = [
    ["檔案", fileName],
    ["匯出時間", summary.exists ? summary.exportedAt || "未提供" : "找不到備份摘要"],
    ["匯出者", summary.exists ? summary.exportedBy || "未提供" : "找不到備份摘要"],
    ["資料來源", summary.exists ? summary.source || "未提供" : "找不到備份摘要"],
  ];

  restoreBackupPreview.className = "restore-preview";
  restoreBackupPreview.innerHTML = `
    <div class="restore-preview-meta">
      ${summaryItems
        .map(
          ([label, value]) => `
            <article>
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </article>
          `,
        )
        .join("")}
    </div>
    <div class="restore-preview-grid">
      ${sheets
        .map(
          (sheet) => `
            <article class="restore-preview-card ${sheet.exists ? "" : "missing"}">
              <span>${sheet.exists ? "已讀取" : "缺少頁籤"}</span>
              <strong>${escapeHtml(sheet.label)}</strong>
              <b>${formatNumber(sheet.count)} 筆</b>
            </article>
          `,
        )
        .join("")}
    </div>
    <div class="restore-preview-note ${missingSheets.length ? "warn" : "pass"}">
      ${missingSheets.length
        ? `缺少 ${formatNumber(missingSheets.length)} 個頁籤：${missingSheets.map((sheet) => escapeHtml(sheet.label)).join("、")}。請先確認備份檔是否完整。`
        : `備份格式看起來完整，共讀到 ${formatNumber(totalRows)} 筆資料。下一步會先建立還原計畫，不會直接寫入。`}
    </div>
    <div class="restore-preview-actions">
      <button type="button" data-restore-plan>建立還原計畫</button>
    </div>
  `;
}

async function buildRestorePlan() {
  if (!restoreBackupDraft) {
    showToast("請先選擇備份檔。");
    return;
  }

  const button = restoreBackupPreview?.querySelector("[data-restore-plan]");
  if (button) {
    button.disabled = true;
    button.textContent = "比對中";
  }

  try {
    const existingIds = await collectRestoreExistingIds();
    const plan = restoreBackupDraft.sheets.map((sheet) => {
      if (!sheet.exists) {
        return { ...sheet, add: 0, existing: 0, problem: 1, recordsToAdd: [], problemRecords: [], problemReason: "缺少頁籤" };
      }

      if (!sheet.collectionName) {
        return {
          ...sheet,
          add: 0,
          existing: sheet.count || 0,
          problem: 0,
          recordsToAdd: [],
          problemRecords: [],
          problemReason: "回收桶為輔助清單，正式還原以原資料表為準。",
        };
      }

      const currentIds = existingIds[sheet.key] || new Set();
      const rows = sheet.records || [];
      const rowsWithId = rows.filter((record) => getRestoreRecordId(record, sheet));
      const recordsToAdd = rowsWithId.filter((record) => !currentIds.has(getRestoreRecordId(record, sheet)));
      const existingRecords = rowsWithId.filter((record) => currentIds.has(getRestoreRecordId(record, sheet)));
      const problemRecords = rows.filter((record) => !getRestoreRecordId(record, sheet));
      const add = recordsToAdd.length;
      const existing = existingRecords.length;
      const problem = rows.length - rowsWithId.length;

      return { ...sheet, add, existing, problem, recordsToAdd, existingRecords, problemRecords, problemReason: problem ? "有資料缺少 ID" : "" };
    });

    restoreBackupPlan = plan;
    renderRestorePlan(plan);
    showToast("還原計畫已建立，尚未寫入資料。");
  } catch (error) {
    showToast(`建立還原計畫失敗：${error.message || error}`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "重新建立還原計畫";
    }
  }
}

async function collectRestoreExistingIds() {
  if (!isConfigured || !currentUser || !db) {
    return {
      ledgerRecords: new Set(recordsCache.map((record) => record.id).filter(Boolean)),
      bankTransactions: new Set(bankTransactionsCache.map((record) => record.id).filter(Boolean)),
      inventoryRecords: new Set(inventoryCache.map((record) => record.id).filter(Boolean)),
      assetRecords: new Set(assetCache.map((record) => record.id).filter(Boolean)),
      voucherInbox: new Set(voucherInboxCache.map((record) => record.id).filter(Boolean)),
      lineDrafts: new Set(lineDraftsCache.map((record) => record.id).filter(Boolean)),
      recycleBin: new Set(recycleBinCache.map((record) => getRestoreRecordId(record, { key: "recycleBin" })).filter(Boolean)),
      auditLogs: new Set(auditLogCache.map((record) => record.id).filter(Boolean)),
      systemSettings: new Set(["options"]),
    };
  }

  const [
    ledgerRecords,
    bankTransactions,
    inventoryRecords,
    assetRecords,
    voucherInbox,
    lineDrafts,
    auditLogs,
    systemSettings,
  ] = await Promise.all([
    fetchUserCollectionForBackup("ledgerRecords", 1000),
    fetchUserCollectionForBackup("bankTransactions", 1000),
    fetchUserCollectionForBackup("inventoryRecords", 1000),
    fetchUserCollectionForBackup("assetRecords", 1000),
    fetchUserCollectionForBackup("voucherInbox", 1000),
    fetchUserCollectionForBackup("lineDrafts", 500),
    fetchUserCollectionForBackup("auditLogs", 500),
    fetchSystemSettingsForBackup(),
  ]);

  return {
    ledgerRecords: new Set(ledgerRecords.map((record) => record.id).filter(Boolean)),
    bankTransactions: new Set(bankTransactions.map((record) => record.id).filter(Boolean)),
    inventoryRecords: new Set(inventoryRecords.map((record) => record.id).filter(Boolean)),
    assetRecords: new Set(assetRecords.map((record) => record.id).filter(Boolean)),
    voucherInbox: new Set(voucherInbox.map((record) => record.id).filter(Boolean)),
    lineDrafts: new Set(lineDrafts.map((record) => record.id).filter(Boolean)),
    recycleBin: new Set(),
    auditLogs: new Set(auditLogs.map((record) => record.id).filter(Boolean)),
    systemSettings: new Set(systemSettings.map((record) => record.id).filter(Boolean)),
  };
}

function getRestoreRecordId(record, sheet) {
  if (!record) return "";
  if (sheet.key === "recycleBin") {
    return [record.collectionName, record.id || record.recordId].filter(Boolean).join(":");
  }
  return String(record.id || record.recordId || "").trim();
}

function renderRestorePlan(plan) {
  if (!restoreBackupPreview) return;

  const totals = plan.reduce(
    (result, item) => {
      result.add += item.add || 0;
      result.existing += item.existing || 0;
      result.problem += item.problem || 0;
      return result;
    },
    { add: 0, existing: 0, problem: 0 },
  );

  const oldPlan = restoreBackupPreview.querySelector(".restore-plan");
  oldPlan?.remove();
  restoreBackupPreview.insertAdjacentHTML(
    "beforeend",
    `
      <div class="restore-plan">
        <div class="restore-plan-heading">
          <div>
            <p class="eyebrow">RESTORE PLAN</p>
            <h3>還原計畫</h3>
            <p class="muted-text">目前只做比對，不會寫入。正式還原會等你確認後再做。</p>
          </div>
          <div class="restore-plan-total">
            <span>可新增</span>
            <strong>${formatNumber(totals.add)} 筆</strong>
          </div>
        </div>
        <div class="restore-plan-grid">
          ${plan
            .map(
              (item) => `
                <article class="restore-plan-card ${item.problem ? "warn" : "pass"}">
                  <strong>${escapeHtml(item.label)}</strong>
                  <span>可新增 ${formatNumber(item.add || 0)} 筆</span>
                  <span>已存在 ${formatNumber(item.existing || 0)} 筆</span>
                  <span>需確認 ${formatNumber(item.problem || 0)} 筆</span>
                  ${item.problemReason ? `<small>${escapeHtml(item.problemReason)}</small>` : ""}
                </article>
              `,
            )
            .join("")}
        </div>
        <div class="restore-preview-note ${totals.add ? "warn" : "pass"}">
          ${totals.add
            ? "確認後只會新增缺少的資料；已存在、缺少 ID 或無法判斷的資料都會跳過，不會覆蓋、刪除或清空目前資料。"
            : "目前沒有需要新增的資料，可能是資料都已存在，或備份檔沒有可安全還原的內容。"}
        </div>
        ${totals.add
          ? `
            <div class="restore-confirm-box">
              <strong>正式還原前確認</strong>
              <p>這一步只會新增缺少資料，不會覆蓋或刪除現有資料。若確認要執行，請輸入「確認還原」。</p>
              <input type="text" data-restore-confirm-text placeholder="輸入：確認還原" autocomplete="off" />
            </div>
            <div class="restore-preview-actions">
              <button type="button" data-confirm-restore>確認還原 ${formatNumber(totals.add)} 筆</button>
            </div>
          `
          : ""}
      </div>
    `,
  );
}

async function confirmRestoreBackup() {
  if (!restoreBackupPlan?.length) {
    showToast("請先建立還原計畫。");
    return;
  }

  if (!isConfigured || !currentUser || !db) {
    showToast("正式還原需要先登入雲端版本。");
    return;
  }

  const totalToAdd = restoreBackupPlan.reduce((sum, item) => sum + (item.recordsToAdd?.length || 0), 0);
  if (!totalToAdd) {
    showToast("沒有可新增的資料。");
    return;
  }

  const confirmText = restoreBackupPreview?.querySelector("[data-restore-confirm-text]")?.value?.trim() || "";
  if (confirmText !== "確認還原") {
    showToast("請先輸入「確認還原」，避免誤按造成資料寫入。");
    return;
  }

  const confirmed = window.confirm(`即將新增 ${formatNumber(totalToAdd)} 筆缺少資料。已存在資料會跳過，不會覆蓋或刪除。確定還原？`);
  if (!confirmed) return;

  const button = restoreBackupPreview?.querySelector("[data-confirm-restore]");
  if (button) {
    button.disabled = true;
    button.textContent = "還原中";
  }

  const result = {
    added: 0,
    skipped: restoreBackupPlan.reduce((sum, item) => sum + (item.existing || 0), 0),
    failed: restoreBackupPlan.reduce((sum, item) => sum + (item.problem || 0), 0),
    bySheet: [],
  };

  for (const sheet of restoreBackupPlan) {
    const sheetResult = { label: sheet.label, added: 0, skipped: sheet.existing || 0, failed: sheet.problem || 0 };
    for (const record of sheet.recordsToAdd || []) {
      try {
        const recordId = getRestoreRecordId(record, sheet);
        if (!recordId || !sheet.collectionName) {
          sheetResult.failed += 1;
          result.failed += 1;
          continue;
        }

        const payload = prepareRestorePayload(record, sheet);
        const reference = firebaseApi.doc(db, sheet.collectionName, recordId);
        const currentSnapshot = await firebaseApi.getDoc(reference);
        if (currentSnapshot.exists()) {
          sheetResult.skipped += 1;
          result.skipped += 1;
          continue;
        }

        await firebaseApi.setDoc(reference, payload);
        sheetResult.added += 1;
        result.added += 1;
      } catch {
        sheetResult.failed += 1;
        result.failed += 1;
      }
    }
    result.bySheet.push(sheetResult);
  }

  await writeAuditLog("restore-backup", "backup", restoreBackupDraft?.fileName || "backup", null, {
    added: result.added,
    skipped: result.skipped,
    failed: result.failed,
    fileName: restoreBackupDraft?.fileName || "",
  });

  await refreshAfterRestore();
  renderRestoreResult(result);
  showToast(`還原完成：新增 ${formatNumber(result.added)} 筆，跳過 ${formatNumber(result.skipped)} 筆。`);
}

function prepareRestorePayload(record, sheet) {
  const payload = { ...record };
  delete payload.id;
  delete payload.rawJson;

  if (sheet.key !== "systemSettings") {
    payload.userId = payload.userId || currentUser.uid;
  }

  payload.restoredAt = firebaseApi.serverTimestamp();
  payload.restoredBy = currentUser.email;
  payload.restoreSourceFile = restoreBackupDraft?.fileName || "";
  return payload;
}

async function refreshAfterRestore() {
  await Promise.allSettled([
    loadRecords(),
    loadBankTransactions(),
    loadInventoryRecords(),
    loadVoucherInbox(),
    loadLineDrafts(),
    loadRecycleBinRecords(),
    loadAuditLogs(),
    loadSharedOptions(),
  ]);
}

function renderRestoreResult(result) {
  if (!restoreBackupPreview) return;

  restoreBackupPreview.insertAdjacentHTML(
    "beforeend",
    `
      <div class="restore-result">
        <div class="restore-plan-heading">
          <div>
            <p class="eyebrow">RESTORE RESULT</p>
            <h3>還原結果</h3>
            <p class="muted-text">已完成安全還原，未覆蓋既有資料。</p>
          </div>
        </div>
        <div class="restore-preview-grid">
          <article class="restore-preview-card pass">
            <span>新增成功</span>
            <b>${formatNumber(result.added)} 筆</b>
          </article>
          <article class="restore-preview-card">
            <span>已存在跳過</span>
            <b>${formatNumber(result.skipped)} 筆</b>
          </article>
          <article class="restore-preview-card ${result.failed ? "missing" : "pass"}">
            <span>需確認 / 失敗</span>
            <b>${formatNumber(result.failed)} 筆</b>
          </article>
        </div>
        <div class="restore-plan-grid">
          ${result.bySheet
            .map(
              (item) => `
                <article class="restore-plan-card ${item.failed ? "warn" : "pass"}">
                  <strong>${escapeHtml(item.label)}</strong>
                  <span>新增 ${formatNumber(item.added)} 筆</span>
                  <span>跳過 ${formatNumber(item.skipped)} 筆</span>
                  <span>需確認 ${formatNumber(item.failed)} 筆</span>
                </article>
              `,
            )
            .join("")}
        </div>
      </div>
    `,
  );
}

async function collectBackupData() {
  const backup = {
    exportedAt: new Date().toISOString(),
    exportedBy: currentUser?.email || "本機預覽",
    source: isConfigured && currentUser && db ? "Firebase" : "本機瀏覽器",
    ledgerRecords: recordsCache,
    bankTransactions: bankTransactionsCache,
    inventoryRecords: inventoryCache,
    assetRecords: assetCache,
    voucherInbox: voucherInboxCache,
    lineDrafts: lineDraftsCache,
    recycleBin: recycleBinCache,
    auditLogs: auditLogCache,
    systemSettings: [{ id: "options", options: optionsByType }],
  };

  if (!isConfigured || !currentUser || !db) return normalizeBackupData(backup);

  const [
    ledgerRecords,
    bankTransactions,
    inventoryRecords,
    assetRecords,
    voucherInbox,
    lineDrafts,
    auditLogs,
    systemSettings,
  ] = await Promise.all([
    fetchUserCollectionForBackup("ledgerRecords", 1000),
    fetchUserCollectionForBackup("bankTransactions", 1000),
    fetchUserCollectionForBackup("inventoryRecords", 1000),
    fetchUserCollectionForBackup("assetRecords", 1000),
    fetchUserCollectionForBackup("voucherInbox", 1000),
    fetchUserCollectionForBackup("lineDrafts", 500),
    fetchUserCollectionForBackup("auditLogs", 500),
    fetchSystemSettingsForBackup(),
  ]);

  backup.ledgerRecords = ledgerRecords;
  backup.bankTransactions = bankTransactions;
  backup.inventoryRecords = inventoryRecords;
  backup.assetRecords = assetRecords;
  backup.voucherInbox = voucherInbox;
  backup.lineDrafts = lineDrafts;
  backup.auditLogs = auditLogs;
  backup.systemSettings = systemSettings;
  backup.recycleBin = [
    ...ledgerRecords.filter((record) => record.deletedAt).map((record) => ({ collectionName: "ledgerRecords", ...record })),
    ...bankTransactions.filter((record) => record.deletedAt).map((record) => ({ collectionName: "bankTransactions", ...record })),
    ...inventoryRecords.filter((record) => record.deletedAt).map((record) => ({ collectionName: "inventoryRecords", ...record })),
    ...assetRecords.filter((record) => record.deletedAt).map((record) => ({ collectionName: "assetRecords", ...record })),
  ];

  return normalizeBackupData(backup);
}

async function fetchUserCollectionForBackup(collectionName, maxRows) {
  const snapshot = await firebaseApi.getDocs(
    readableCollectionQuery(collectionName, maxRows),
  );

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function fetchSystemSettingsForBackup() {
  try {
    const snapshot = await firebaseApi.getDoc(firebaseApi.doc(db, "systemSettings", "options"));
    return snapshot.exists() ? [{ id: "options", ...snapshot.data() }] : [{ id: "options", options: optionsByType }];
  } catch {
    return [{ id: "options", options: optionsByType, backupNote: "讀取雲端系統選項失敗，改用目前瀏覽器選項。" }];
  }
}

function normalizeBackupData(backup) {
  return Object.fromEntries(
    Object.entries(backup).map(([key, value]) => {
      if (Array.isArray(value)) return [key, value.map(cleanBackupObject)];
      return [key, value];
    }),
  );
}

function cleanBackupObject(record) {
  return JSON.parse(JSON.stringify(record, backupJsonReplacer));
}

function backupJsonReplacer(_key, value) {
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof File !== "undefined" && value instanceof File) return { name: value.name, type: value.type, size: value.size };
  if (value === undefined) return "";
  return value;
}

function buildBackupSummarySheet(backup) {
  return [
    ["隆博ERP 資料備份"],
    [],
    ["匯出時間", backup.exportedAt],
    ["匯出者", backup.exportedBy],
    ["資料來源", backup.source],
    [],
    ["資料類型", "筆數"],
    ["流水帳", backup.ledgerRecords.length],
    ["銀行資料", backup.bankTransactions.length],
    ["庫存紀錄", backup.inventoryRecords.length],
    ["固定資產", backup.assetRecords.length],
    ["憑證暫存池", backup.voucherInbox.length],
    ["LINE 草稿", backup.lineDrafts.length],
    ["回收桶", backup.recycleBin.length],
    ["修改紀錄", backup.auditLogs.length],
    ["系統選項", backup.systemSettings.length],
    [],
    ["提醒", "這是備份檔。需要還原時，請先人工確認後再匯入，避免覆蓋正式資料。"],
  ];
}

function buildBackupSheet(records, preferredFields) {
  const rows = Array.isArray(records) ? records : [];
  const dynamicFields = Array.from(new Set(rows.flatMap((record) => Object.keys(record))));
  const headers = Array.from(new Set([...preferredFields.filter((field) => field !== "rawJson"), ...dynamicFields, "rawJson"]));
  if (!rows.length) return [headers, ["目前沒有資料"]];

  return [
    headers,
    ...rows.map((record) =>
      headers.map((field) => {
        if (field === "rawJson") return JSON.stringify(record);
        return formatBackupCell(record[field]);
      }),
    ),
  ];
}

function formatBackupCell(value) {
  if (Array.isArray(value) || (value && typeof value === "object")) return JSON.stringify(value);
  if (value === null || value === undefined) return "";
  return value;
}

function getBackupTimestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
  ].join("");
}

async function exportCurrentReport() {
  if (!window.XLSX) {
    showToast("Excel 套件尚未載入，請確認網路可連線後重試。");
    return;
  }

  if (!lastReportSummary || !lastReportRows.length) {
    showToast("請先產生有資料的區間報表。");
    return;
  }

  try {
    const workbook = window.XLSX.utils.book_new();
    const payrollRows = await loadPayrollRowsForReport(lastReportSummary.start, lastReportSummary.end);
    appendSheet(workbook, "經營摘要", buildExecutiveDecisionSummarySheet(payrollRows));
    appendSheet(workbook, "收入彙總", buildDecisionIncomeSummarySheet());
    appendSheet(workbook, "收入明細", buildDecisionIncomeDetailSheet());
    appendSheet(workbook, "支出彙總", buildDecisionExpenseSummarySheet(payrollRows));
    appendSheet(workbook, "支出明細", buildDecisionExpenseDetailSheet());
    appendSheet(workbook, "薪資成本", buildDecisionPayrollSheet(payrollRows));
    appendSheet(workbook, "庫存與成本", buildInventoryReportSheet());
    appendSheet(workbook, "固定資產", buildAssetReportSheet());
    appendSheet(workbook, "待確認與風險", buildDecisionRiskSheet());
    appendSheet(workbook, "原始流水帳", buildTransactionDetailSheet());
    window.XLSX.writeFile(workbook, buildReportExportFileName(lastReportSummary.start, lastReportSummary.end));
    showToast("經營決策報表已匯出。");
  } catch (error) {
    console.error("Report export failed", error);
    showToast(`報表匯出失敗：${error.message || error}`);
  }
}

function buildReportExportFileName(start, end) {
  if (start && end) return `${start}_${end}_經營決策報表.xlsx`;
  return "經營決策報表.xlsx";
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

function buildExecutiveDecisionSummarySheet(payrollRows = []) {
  const payrollTotal = sumPayrollNetPay(payrollRows);
  const cashflowSummary = getReportCashflowSummary();
  const riskRows = buildReportIssues();
  const topExpenses = buildCategorySummaryRows(lastReportRows.filter((record) => record.type === "expense"))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  return [
    ["經營決策報表"],
    ["報表期間", `${lastReportSummary.start} 至 ${lastReportSummary.end}`],
    ["匯出時間", formatDateTime(new Date())],
    ["幣別", "TWD"],
    ["報表定位", "給老闆、股東與經營團隊使用；毛利與淨利為內部管理參考值。"],
    [],
    ["核心指標", "金額／數值", "說明"],
    ["總收入", lastReportSummary.income, "區間內全部收入流水帳"],
    ["銷售收入", lastReportSummary.salesIncome, "用於毛利分析的銷售收入"],
    ["總支出", lastReportSummary.expense, "區間內全部支出流水帳"],
    ["薪資成本", payrollTotal || getLedgerPayrollExpenseTotal(), payrollTotal ? "依薪資頁雲端或本機資料彙總" : "薪資頁資料未讀到，改用流水帳薪資支出估算"],
    ["已售商品成本", lastReportSummary.productCost, "依收入配對庫存或匯入成本"],
    ["金流／物流／平台成本", lastReportSummary.logisticsCost, "含銀行差額標記為銷貨成本者"],
    ["包材成本", lastReportSummary.packagingCost, "依配對包材或匯入資料"],
    ["營業費用", lastReportSummary.operatingExpense, "支出大類為營業費用"],
    ["毛利參考值", lastReportSummary.grossProfit, "銷售收入減已售成本、金流物流成本、包材成本"],
    ["毛利率參考值", formatPercent(lastReportSummary.grossMargin), "毛利參考值／銷售收入"],
    ["淨利參考值", lastReportSummary.net, "毛利參考值減營業費用；未含折舊、所得稅與月底調整"],
    ["淨利率參考值", formatPercent(lastReportSummary.netMargin), "淨利參考值／銷售收入"],
    ["公司現金流入", cashflowSummary.cashIn, "依目前金流分類"],
    ["公司現金流出", cashflowSummary.cashOut, "依目前金流分類"],
    ["期末可用現金參考", cashflowSummary.endingCash, "依現金流設定與區間交易估算"],
    ["待確認筆數", riskRows.length, "包含憑證、庫存、銀行配對等風險項目"],
    [],
    ["前八大支出類別", "金額", "筆數", "占總支出"],
    ...topExpenses.map((row) => [
      row.path,
      row.amount,
      row.count,
      lastReportSummary.expense ? row.amount / lastReportSummary.expense : 0,
    ]),
    [],
    ["管理提醒"],
    ["1", "毛利、淨利為經營參考值，庫存成本未完整配對時會低估或高估。"],
    ["2", "固定資產先列清冊，不先計算折舊。"],
    ["3", "待確認與風險頁籤的項目會影響股東檢視與經營判斷。"],
  ];
}

function buildDecisionIncomeSummarySheet() {
  const incomeRecords = lastReportRows.filter((record) => record.type === "income");
  return [
    ["收入彙總"],
    ["報表期間", `${lastReportSummary.start} 至 ${lastReportSummary.end}`],
    [],
    ["收入總額", lastReportSummary.income],
    ["收入筆數", incomeRecords.length],
    [],
    ["大類", "中類", "細項", "金流方式", "筆數", "金額", "占收入"],
    ...buildCategorySummaryRows(incomeRecords, { includeCashflow: true }).map((row) => [
      row.major,
      row.middle,
      row.minor,
      row.cashflow,
      row.count,
      row.amount,
      lastReportSummary.income ? row.amount / lastReportSummary.income : 0,
    ]),
  ];
}

function buildDecisionIncomeDetailSheet() {
  const incomeRecords = lastReportRows.filter((record) => record.type === "income");
  return [
    ["收入明細"],
    ["報表期間", `${lastReportSummary.start} 至 ${lastReportSummary.end}`],
    [],
    ["日期", "交易對象", "摘要", "金額", "大類", "中類", "細項", "金流方式", "帳戶", "收款狀態", "預計收款日", "發票狀態", "發票號碼", "備註", "來源"],
    ...incomeRecords.map((record) => [
      record.date,
      record.counterparty,
      record.item,
      Number(record.amount || 0),
      record.major || "",
      record.middle || "",
      record.minor || "",
      record.cashflow || "",
      record.account || "",
      record.settlementStatus || "",
      record.dueDate || "",
      record.invoiceStatus || (record.hasVoucher ? "有" : "無"),
      record.invoiceNumber || "",
      record.note || "",
      formatRecordSource(record),
    ]),
  ];
}

function buildDecisionExpenseSummarySheet(payrollRows = []) {
  const expenseRecords = lastReportRows.filter((record) => record.type === "expense");
  const payrollTotal = sumPayrollNetPay(payrollRows);
  return [
    ["支出彙總"],
    ["報表期間", `${lastReportSummary.start} 至 ${lastReportSummary.end}`],
    [],
    ["支出總額", lastReportSummary.expense],
    ["支出筆數", expenseRecords.length],
    ["薪資成本參考", payrollTotal || getLedgerPayrollExpenseTotal(), payrollTotal ? "薪資頁資料" : "流水帳薪資支出估算"],
    [],
    ["大類", "中類", "細項", "付款方式", "筆數", "金額", "占支出"],
    ...buildCategorySummaryRows(expenseRecords, { includeCashflow: true }).map((row) => [
      row.major,
      row.middle,
      row.minor,
      row.cashflow,
      row.count,
      row.amount,
      lastReportSummary.expense ? row.amount / lastReportSummary.expense : 0,
    ]),
  ];
}

function buildDecisionExpenseDetailSheet() {
  const expenseRecords = lastReportRows.filter((record) => record.type === "expense");
  return [
    ["支出明細"],
    ["報表期間", `${lastReportSummary.start} 至 ${lastReportSummary.end}`],
    [],
    ["日期", "交易對象", "摘要", "金額", "大類", "中類", "細項", "付款方式", "帳戶", "付款狀態", "預計付款日", "發票狀態", "發票號碼", "待確認原因", "備註", "來源"],
    ...expenseRecords.map((record) => [
      record.date,
      record.counterparty,
      record.item,
      Number(record.amount || 0),
      record.major || "",
      record.middle || "",
      record.minor || "",
      record.cashflow || "",
      record.account || "",
      record.settlementStatus || "",
      record.dueDate || "",
      record.invoiceStatus || (record.hasVoucher ? "有" : "無"),
      record.invoiceNumber || "",
      record.pendingReason || "",
      record.note || "",
      formatRecordSource(record),
    ]),
  ];
}

function buildDecisionPayrollSheet(payrollRows = []) {
  const rows = payrollRows.filter(isPayrollReportRowVisible);
  return [
    ["薪資成本"],
    ["報表期間", `${lastReportSummary.start} 至 ${lastReportSummary.end}`],
    ["資料來源", rows.length ? "薪資頁雲端／本機資料" : "未讀到薪資頁資料，請先用主帳號開啟薪資頁同步"],
    [],
    ["薪資月份", "員工編號", "姓名", "身分", "底薪", "職務加給", "伙食津貼", "月薪總額", "到職日", "在職天數", "事假", "病假", "其他加成", "其他扣款", "健保眷屬", "眷屬健保費", "實領薪資"],
    ...rows.map((row) => [
      row.month,
      row.id,
      row.name,
      row.role,
      Number(row.baseSalary || 0),
      Number(row.dutyAllowance || 0),
      Number(row.mealAllowance || 0),
      getPayrollMonthlyTotal(row),
      row.hireDate || "",
      Number(row.employedDays || 0),
      Number(row.personalLeaveDays || 0),
      Number(row.sickLeaveDays || 0),
      Number(row.otherAllowance || 0),
      Number(row.otherDeduction || 0),
      Number(row.billableDependentCount || 0),
      Number(row.dependentHealthPersonal || 0),
      getPayrollNetPay(row),
    ]),
    [],
    ["薪資合計", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", sumPayrollNetPay(rows)],
    ["公司負擔參考", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", rows.reduce((sum, row) => sum + getPayrollCompanyBurden(row), 0)],
  ];
}

function buildDecisionRiskSheet() {
  const issues = buildReportIssues();
  const pendingAmount = issues.reduce((sum, issue) => sum + Number(issue.amount || 0), 0);
  return [
    ["待確認與風險"],
    ["報表期間", `${lastReportSummary.start} 至 ${lastReportSummary.end}`],
    [],
    ["待確認筆數", issues.length],
    ["待確認相關金額", pendingAmount],
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

function buildCategorySummaryRows(records, options = {}) {
  const groups = new Map();
  records.forEach((record) => {
    const major = record.major || "未分類";
    const middle = record.middle || "未分類";
    const minor = record.minor || "未分類";
    const cashflow = options.includeCashflow ? record.cashflow || "未填" : "";
    const key = [major, middle, minor, cashflow].join("||");
    const current = groups.get(key) || { major, middle, minor, cashflow, count: 0, amount: 0 };
    current.count += 1;
    current.amount += Number(record.amount || 0);
    groups.set(key, current);
  });
  return Array.from(groups.values())
    .map((row) => ({ ...row, path: [row.major, row.middle, row.minor].filter(Boolean).join(" / ") }))
    .sort((a, b) => b.amount - a.amount || a.path.localeCompare(b.path, "zh-Hant"));
}

async function loadPayrollRowsForReport(start, end) {
  const months = getMonthRange(start, end);
  const cloudRows = [];
  for (const month of months) {
    const rows = await loadPayrollRowsForMonthFromCloud(month);
    if (rows.length) cloudRows.push(...rows.map((row) => normalizePayrollReportRow(row, month)));
  }
  if (cloudRows.length) return cloudRows.filter(isPayrollReportRowVisible);
  return months
    .flatMap((month) => loadPayrollRowsForMonthFromLocal(month).map((row) => normalizePayrollReportRow(row, month)))
    .filter(isPayrollReportRowVisible);
}

const payrollReportHireDateOverrides = {
  PH004: "2026-07-01",
  PH005: "2026-07-01",
};

function normalizePayrollReportRow(row, month) {
  const hireDate = payrollReportHireDateOverrides[row.id] || row.hireDate || "";
  const employedDays = calculatePayrollReportEmployedDays(month, hireDate);
  if (employedDays > 0) return { ...row, month, hireDate, employedDays };
  return {
    ...row,
    month,
    hireDate,
    employedDays: 0,
    regularPay: 0,
    grossPay: 0,
    personalLeaveDeduction: 0,
    sickLeaveDeduction: 0,
    laborPersonal: 0,
    healthPersonal: 0,
    dependentHealthPersonal: 0,
    personalBurdenTotal: 0,
    companyLabor: 0,
    companyHealth: 0,
    companyBurdenTotal: 0,
    otherAllowance: 0,
    otherDeduction: 0,
    billableDependentCount: 0,
    netPay: 0,
  };
}

function isPayrollReportRowVisible(row) {
  return Number(row.employedDays || 0) > 0;
}

function calculatePayrollReportEmployedDays(month, hireDate) {
  if (!month || !hireDate) return Number.POSITIVE_INFINITY;
  const monthStart = new Date(`${month}-01T00:00:00`);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const hire = new Date(`${hireDate}T00:00:00`);
  if (Number.isNaN(hire.getTime())) return Number.POSITIVE_INFINITY;
  if (hire > monthEnd) return 0;
  if (hire <= monthStart) return 30;
  return Math.min(30, monthEnd.getDate() - hire.getDate() + 1);
}

async function loadPayrollRowsForMonthFromCloud(month) {
  if (!isConfigured || !currentUser || !db || !firebaseApi.getDoc) return [];
  try {
    const reference = firebaseApi.doc(db, "systemSettings", `payrollRows_${month.replace("-", "_")}`);
    const snapshot = await firebaseApi.getDoc(reference);
    if (!snapshot.exists()) return [];
    const rows = snapshot.data()?.rows;
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function loadPayrollRowsForMonthFromLocal(month) {
  try {
    const rows = JSON.parse(localStorage.getItem(`longbroPayrollRows:${month}`) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function getMonthRange(start, end) {
  if (!start || !end) return [];
  const months = [];
  const cursor = new Date(`${start.slice(0, 7)}-01T00:00:00`);
  const last = new Date(`${end.slice(0, 7)}-01T00:00:00`);
  while (cursor <= last) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

function sumPayrollNetPay(rows = []) {
  return rows.reduce((sum, row) => sum + getPayrollNetPay(row), 0);
}

function getPayrollMonthlyTotal(row) {
  return Number(row.monthlySalaryTotal || 0) || Number(row.baseSalary || 0) + Number(row.dutyAllowance || 0) + Number(row.mealAllowance || 0);
}

function getPayrollNetPay(row) {
  return Number(row.netPay || 0) || Math.max(0, getPayrollMonthlyTotal(row) + Number(row.otherAllowance || 0) - Number(row.otherDeduction || 0));
}

function getPayrollCompanyBurden(row) {
  return Number(row.companyBurdenTotal || 0) || Number(row.companyLabor || 0) + Number(row.companyHealth || 0);
}

function getLedgerPayrollExpenseTotal() {
  return lastReportRows
    .filter((record) => record.type === "expense")
    .filter((record) => /薪資|本薪|員工福利|勞健保/.test([record.major, record.middle, record.minor, record.item].join(" ")))
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
}

function formatRecordSource(record) {
  return record.importSource ? `${record.importSource}｜第 ${record.sourceRow || ""} 列` : "網頁輸入";
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
    ["完整箱庫存", summary.sealedCaseQty, "箱", "期初加入庫減出庫"],
    ["散盒庫存", summary.boxQty, "盒", "期初加入庫減出庫"],
    ["散卡庫存", summary.cardQty, "張", "期初加入庫減出庫"],
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

function buildAssetReportSheet() {
  const summary = buildAssetSummary(assetCache);
  return [
    [`${lastReportSummary.start} 至 ${lastReportSummary.end} 固定資產清冊`],
    [],
    ["資產摘要"],
    ["項目", "數量／金額", "單位", "說明"],
    ["資產件數", summary.totalQuantity, "件", "清冊數量加總"],
    ["資產總額", summary.totalAmount, "TWD", "依購入金額列示，未計折舊"],
    ["尚未貼標", summary.unlabeled, "筆", "貼標狀態不是已貼的資產"],
    ["保固中", summary.inWarranty, "筆", "清冊標示仍在保固內"],
    ["待確認", summary.pending, "筆", "購買日、金額或保固狀態缺漏"],
    [],
    ["資產明細"],
    ["資產編號", "分類", "名稱", "數量", "購買日期", "金額", "保固月數", "保固到期日", "保固狀態", "貼標狀態", "備註", "來源"],
    ...[...assetCache].sort(compareAssets).map((record) => [
      record.assetNumber || "",
      record.category || "",
      record.name || "",
      Number(record.quantity || 0),
      record.purchaseDate || "",
      Number(record.amount || 0),
      record.warrantyMonths === "" ? "" : Number(record.warrantyMonths || 0),
      record.warrantyEndDate || "",
      record.warrantyStatus || "",
      record.labelStatus || "",
      record.note || "",
      record.source || "",
    ]),
  ];
}

function buildAssetsLiabilitiesSheet() {
  const cashflowSummary = getReportCashflowSummary();
  const inventorySummary = buildInventorySummary(inventoryCache);
  const fixedAssetSummary = buildAssetSummary(assetCache);
  const arAp = buildReceivablePayableSummary(lastReportRows);
  const shareholderRepayments = getShareholderRepaymentTransactions(lastReportSummary.start, lastReportSummary.end);
  const assets = {
    cash: cashflowSummary.endingCash,
    receivable: arAp.receivableTotal,
    inventory: inventorySummary.totalCost,
    fixedAssets: fixedAssetSummary.totalAmount,
  };
  const liabilities = {
    payable: arAp.payableTotal,
    shareholderAdvance: Math.max(cashflowSummary.shareholderAdvance, 0),
  };
  const totalAssets = assets.cash + assets.receivable + assets.inventory + assets.fixedAssets;
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
    ["固定資產", assets.fixedAssets, "固定資產清冊列示之購入金額；折舊與資本化門檻待會計師確認"],
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
      const adjustmentSummary = buildLedgerAdjustmentSummary(records);
      const adjustedRecords = applyLedgerAdjustments(records, adjustmentSummary);
      const soldCost = buildSoldCostSummary(adjustedRecords, adjustmentSummary);
      return [
        date,
        soldCost.salesIncome,
        soldCost.productCost,
        sumOperatingExpense(adjustedRecords),
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
    ["收入未配庫存", issueCounts["收入未配庫存"] || 0, 0, issueCounts["收入未配庫存"] || 0, issueCounts["收入未配庫存"] ? "待核對" : "OK", "收入尚未選擇售出的庫存品項，毛利可能失真。", "ledgerRecords + inventoryRecords"],
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
    if (hasReportablePendingReason(record)) {
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
    .filter((transaction) => !isBankTransactionFormallyMatched(transaction) && transaction.status !== "不入帳")
    .forEach((transaction) => {
      const classified = isBankTransactionClassified(transaction);
      issues.push({
        type: transaction.status === "待辨識" ? "存摺照片待辨識" : classified ? "銀行已分類未配帳務" : "銀行未配對",
        date: transaction.date,
        party: transaction.account,
        summary: transaction.description || transaction.sourceFile || "銀行資料",
        amount: Number(transaction.deposit || transaction.withdrawal || 0),
        reason: classified ? `${getBankTransactionDisplayStatus(transaction)}，但尚未勾選實際帳務。` : transaction.pendingReason || "尚未標記配對狀態。",
        action: classified ? "回到現金流頁按「配帳務」，勾選實際要沖銷的流水帳。" : "在現金流頁將銀行交易標記為收入、支出、平台撥款、代墊還款或不入帳。",
      });
    });

  return issues.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function getShareholderRepaymentTransactions(start, end) {
  return bankTransactionsCache
    .filter((transaction) => transaction.status === "已配代墊還款")
    .filter(isBankTransactionFormallyMatched)
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

function buildLedgerAdjustmentSummary(records) {
  const recordsById = new Map(records.map((record) => [record.id, record]));
  const byLedgerId = new Map();
  const summary = {
    byLedgerId,
    incomeReduction: 0,
    expenseReduction: 0,
    productCostReduction: 0,
    logisticsCostReduction: 0,
    packagingCostReduction: 0,
    operatingExpenseReduction: 0,
  };

  voucherInboxCache
    .filter((voucher) => !voucher.deletedAt && isVoucherAdjustment(voucher))
    .forEach((voucher) => {
      const voucherType = resolveVoucherRecordType(voucher);
      (Array.isArray(voucher.matches) ? voucher.matches : []).forEach((match) => {
        const record = recordsById.get(match.ledgerId);
        if (!record || record.type !== voucherType) return;

        const amount = Number(match.amount || 0);
        if (!amount) return;

        const current = byLedgerId.get(record.id) || {
          incomeReduction: 0,
          expenseReduction: 0,
          productCostReduction: 0,
          logisticsCostReduction: 0,
          packagingCostReduction: 0,
          operatingExpenseReduction: 0,
        };

        if (record.type === "income") {
          current.incomeReduction += amount;
          summary.incomeReduction += amount;
        } else {
          current.expenseReduction += amount;
          summary.expenseReduction += amount;
          if (isOperatingExpenseRecord(record)) {
            current.operatingExpenseReduction += amount;
            summary.operatingExpenseReduction += amount;
          } else if (isPackagingRecord(record)) {
            current.packagingCostReduction += amount;
            summary.packagingCostReduction += amount;
          } else if (isLogisticsCostRecord(record)) {
            current.logisticsCostReduction += amount;
            summary.logisticsCostReduction += amount;
          } else {
            current.productCostReduction += amount;
            summary.productCostReduction += amount;
          }
        }

        byLedgerId.set(record.id, current);
      });
    });

  return summary;
}

function getLedgerAdjustment(record, adjustmentSummary) {
  return adjustmentSummary?.byLedgerId?.get(record.id) || {};
}

function getAdjustedLedgerAmount(record, adjustmentSummary) {
  const adjustment = getLedgerAdjustment(record, adjustmentSummary);
  const reduction = record.type === "income" ? adjustment.incomeReduction : adjustment.expenseReduction;
  return Math.max(0, Number(record.amount || 0) - Number(reduction || 0));
}

function applyLedgerAdjustments(records, adjustmentSummary) {
  return records.map((record) => ({
    ...record,
    originalAmount: Number(record.amount || 0),
    amount: getAdjustedLedgerAmount(record, adjustmentSummary),
  }));
}

function sumBankSalesDirectCosts(start, end) {
  return bankTransactionsCache
    .filter((transaction) => transaction.date >= start && transaction.date <= end)
    .filter((transaction) => ["銷貨成本－金流／平台成本", "金流手續費／平台費"].includes(transaction.differenceHandling))
    .reduce((total, transaction) => total + Math.abs(Number(transaction.matchDifference || 0)), 0);
}

function buildSoldCostSummary(records, adjustmentSummary = null) {
  const summary = records
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

  if (adjustmentSummary) {
    summary.productCost = Math.max(0, summary.productCost - Number(adjustmentSummary.productCostReduction || 0));
    summary.logisticsCost = Math.max(0, summary.logisticsCost - Number(adjustmentSummary.logisticsCostReduction || 0));
    summary.packagingCost = Math.max(0, summary.packagingCost - Number(adjustmentSummary.packagingCostReduction || 0));
  }

  return summary;
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

function isOperatingExpenseRecord(record) {
  return record.type === "expense" && record.major === "營業費用";
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

function isLogisticsCostRecord(record) {
  const text = [record.item, record.major, record.middle, record.minor, record.note].join(" ");
  return /金流|物流|運費|平台|手續費|刷卡/.test(text);
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
  const visibleRecords = records.filter((record) => record.type === recordType);

  if (!visibleRecords.length) {
    recordsList.className = "record-list empty-state";
    recordsList.textContent = `尚無${typeLabel(recordType)}資料`;
    return;
  }

  const sortedRecords = sortLedgerRecordsByTime(visibleRecords);

  recordsList.className = "record-list grouped";
  recordsList.innerHTML = renderRecordGroup(`${typeLabel(recordType)}紀錄`, sortedRecords, recordType);
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
  const splitToggle = fields.inventorySplitIncome?.closest(".inventory-split-toggle");
  if (splitToggle) splitToggle.hidden = !isEnabled || recordType !== "income";
  if ((!isEnabled || recordType !== "income") && fields.inventorySplitIncome) fields.inventorySplitIncome.checked = false;
  fields.inventoryPicker.classList.toggle("split-mode", isLedgerSplitIncomeMode());
  fields.inventoryPicker.hidden = !isEnabled || recordType !== "income";

  if (!isEnabled) {
    fields.inventorySyncHint.textContent = recordType === "expense"
      ? "支出可同步入庫，入庫名稱會使用細項。"
      : "收入可同步出庫，選擇後會列出可用庫存。";
    fields.inventoryPicker.innerHTML = "";
    return;
  }

  if (recordType === "expense") {
    fields.inventorySyncHint.textContent = `儲存後會拆分品項並詢問入庫清單；例如「卡模*2、卡夾*2」會分別入庫，成本可在確認框中調整。`;
    fields.inventoryPicker.innerHTML = "";
    return;
  }

  const availableLots = getAvailableInventoryLots();
  fields.inventorySyncHint.textContent = isLedgerSplitIncomeMode()
    ? "儲存收入時會開啟拆盒配對視窗，請在彈窗內選庫存並填總盒數、賣出盒數。"
    : "儲存收入時會開啟庫存配對視窗，請在彈窗內選庫存並填出庫數量。";

  if (!availableLots.length) {
    fields.inventoryPicker.hidden = false;
    fields.inventoryPicker.innerHTML = `<div class="record-group-empty">目前沒有可出庫的倉庫貨品。</div>`;
    return;
  }

  fields.inventoryPicker.hidden = false;
  fields.inventoryPicker.innerHTML = `<div class="record-group-empty">可用庫存 ${formatNumber(availableLots.length)} 筆，儲存時會開啟配對視窗。</div>`;
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
      <div class="inventory-split-controls">
        <label>總盒數<input type="number" min="1" step="1" value="" data-inventory-split-total="${escapeHtml(lot.id)}" /></label>
        <label>賣出盒數<input type="number" min="1" step="1" value="1" data-inventory-split-sold="${escapeHtml(lot.id)}" /></label>
      </div>
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
        <span>目前沒有可出庫的庫存品項。</span>
      </div>
    `;
  }

  return `
    <div class="inventory-match-panel">
      <div>
        <strong>庫存配對</strong>
        <span>可多選庫存來源；適合一天賣多箱、多盒、多張卡或同一筆收入包含多個商品。</span>
      </div>
      <label class="inline-check inventory-split-toggle">
        <input type="checkbox" data-inventory-match-split />
        <span>拆盒收入</span>
      </label>
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
      <div class="inventory-split-controls">
        <label>總盒數<input type="number" min="1" step="1" value="" data-inventory-split-total="${escapeHtml(lot.id)}" /></label>
        <label>賣出盒數<input type="number" min="1" step="1" value="1" data-inventory-split-sold="${escapeHtml(lot.id)}" /></label>
      </div>
    </label>
  `;
}

function updateSummary(records) {
  const range = resolveSummaryMonthRange(records);
  const monthRecords = range.start && range.end
    ? records.filter((record) => record.month >= range.start && record.month <= range.end)
    : [];
  const adjustedMonthRecords = applyLedgerAdjustments(monthRecords, buildLedgerAdjustmentSummary(monthRecords));
  const expense = sumByType(adjustedMonthRecords, "expense");
  const income = sumByType(adjustedMonthRecords, "income");
  const pending = monthRecords.filter(hasReportablePendingReason).length;
  const label = formatSummaryMonthRangeLabel(range.start, range.end);

  if (summaryStartMonthInput) {
    summaryStartMonthInput.value = formatSummaryMonthInput(range.start);
  }
  if (summaryEndMonthInput) {
    summaryEndMonthInput.value = formatSummaryMonthInput(range.end);
  }

  expenseSummaryLabel.textContent = `${label}支出`;
  incomeSummaryLabel.textContent = `${label}收入`;
  countSummaryLabel.textContent = `${label}筆數`;
  pendingSummaryLabel.textContent = `${label}待補憑證`;
  document.querySelector("#monthExpense").textContent = `NT$ ${formatNumber(expense)}`;
  document.querySelector("#monthIncome").textContent = `NT$ ${formatNumber(income)}`;
  document.querySelector("#monthCount").textContent = `${monthRecords.length} 筆`;
  document.querySelector("#pendingVoucher").textContent = `${pending} 筆`;
}

function normalizeSummaryMonth(value) {
  const compact = String(value || "").replace("-", "");
  return /^\d{6}$/.test(compact) ? compact : "";
}

function formatSummaryMonthInput(month) {
  const compact = normalizeSummaryMonth(month);
  return compact ? `${compact.slice(0, 4)}-${compact.slice(4, 6)}` : "";
}

function resolveSummaryMonthRange(records) {
  let start = selectedSummaryStartMonth;
  let end = selectedSummaryEndMonth;
  const fallback = pickSummaryMonth(records);

  if (!start && !end) {
    start = fallback;
    end = fallback;
  } else if (start && !end) {
    end = start;
  } else if (!start && end) {
    start = end;
  }

  if (start && end && start > end) {
    [start, end] = [end, start];
  }

  selectedSummaryStartMonth = start || "";
  selectedSummaryEndMonth = end || "";
  return { start: selectedSummaryStartMonth, end: selectedSummaryEndMonth };
}

function formatSummaryMonthLabel(month) {
  const compact = normalizeSummaryMonth(month);
  return compact ? `${compact.slice(0, 4)}/${compact.slice(4, 6)}` : "本月";
}

function getCurrentSummaryMonth() {
  return toDateValue(new Date()).slice(0, 7).replace("-", "");
}

function formatSummaryMonthRangeLabel(start, end) {
  const startLabel = formatSummaryMonthLabel(start);
  const endLabel = formatSummaryMonthLabel(end);
  return start && end && start !== end ? `${startLabel}-${endLabel}` : startLabel;
}

function pickSummaryMonth(records) {
  if (!records.length) return getCurrentSummaryMonth();

  const currentMonth = getCurrentSummaryMonth();
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
    expense: {
      ...normalizeOptionGroup(saved.expense, defaultOptionsByType.expense),
      accountTree: normalizeExpenseAccountTree(saved.expense?.accountTree || defaultExpenseAccountTree),
    },
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

function loadLocalAssetRecords() {
  try {
    return JSON.parse(localStorage.getItem("assetRecordsPreview") || "[]");
  } catch {
    return [];
  }
}

function saveLocalAssetRecords() {
  localStorage.setItem("assetRecordsPreview", JSON.stringify(assetCache));
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
  return `${(Number(value) * 100).toFixed(2)}%`;
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
