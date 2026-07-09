import { lineEndpointConfig } from "./line-endpoint-config.js";

const payrollEmployeeMasterSpreadsheetId = "16JZXXikxsVGf1angzAXxZqWJXuA5Gtw3MRuXCZw8oyU";
const payrollEmployeeMasterSheetName = "員工資料建檔";

const payrollEmployees = [
  { id: "PH005", name: "董秉澤", role: "員工", department: "營運", baseSalary: 27000, dutyAllowance: 0, mealAllowance: 3000, hireDate: "2026-07-01", laborInsuredSalary: 30300, healthInsuredSalary: 30300 },
  { id: "PH003", name: "林煒昕", role: "員工", department: "營運", baseSalary: 37000, dutyAllowance: 0, mealAllowance: 3000, hireDate: "2026-06-15", laborInsuredSalary: 40100, healthInsuredSalary: 40100 },
  { id: "PH002", name: "徐振睿", role: "員工", department: "營運", baseSalary: 27000, dutyAllowance: 0, mealAllowance: 3000, hireDate: "2026-06-15", laborInsuredSalary: 30300, healthInsuredSalary: 30300 },
  { id: "PH004", name: "張晟睿", role: "雇主", department: "管理", baseSalary: 57000, dutyAllowance: 0, mealAllowance: 3000, hireDate: "2026-06-15", laborInsuredSalary: 45800, healthInsuredSalary: 60800 },
];

const employeeLaborPersonal = [[30300, 758], [40100, 1002]];
const employeeHealthPersonal = [[30300, 470], [40100, 622]];
const employeeLaborCompany = [[30300, 2651], [40100, 3508]];
const employeeHealthCompany = [[30300, 1466], [40100, 1939]];
const ownerLaborCompany = [[45800, 1053]];
const ownerHealthCompany = [[60800, 3143]];
const fixedMealAllowance = 3000;

let payrollRows = [];
let selectedPayrollId = "";
let payrollInitialized = false;
let employeeMasterRows = [];
const payrollReadOnlyMessage = "此帳號僅可查閱與匯出，不能新增、刪除、修改、匯入或同步資料。";

function isPayrollReadOnly() {
  return Boolean(window.longbroReadOnlyMode);
}

function blockPayrollReadOnly() {
  if (!isPayrollReadOnly()) return false;
  showPayrollToast(payrollReadOnlyMessage);
  return true;
}

export function initPayrollPage() {
  const monthInput = document.querySelector("#payrollMonthInput");
  const table = document.querySelector("#payrollTable");
  if (!monthInput || !table) return;

  if (!payrollInitialized) {
    monthInput.value = getCurrentMonth();
    employeeMasterRows = loadEmployeeMasterRows();
    payrollRows = loadPayrollRows(monthInput.value);
    selectedPayrollId = payrollRows[0]?.id || "";
    bindPayrollEvents();
    payrollInitialized = true;
  }

  renderPayroll();
}

function bindPayrollEvents() {
  const monthInput = document.querySelector("#payrollMonthInput");
  const table = document.querySelector("#payrollTable");
  const masterTable = document.querySelector("#payrollEmployeeMaster");
  const syncMasterButton = document.querySelector("#syncPayrollEmployeeMasterButton");
  const saveMasterButton = document.querySelector("#savePayrollEmployeeMasterButton");

  monthInput?.addEventListener("change", () => {
    payrollRows = loadPayrollRows(monthInput.value);
    selectedPayrollId = payrollRows[0]?.id || "";
    renderPayroll();
  });

  document.querySelector("#payrollCalculateButton")?.addEventListener("click", () => {
    if (blockPayrollReadOnly()) return;
    payrollRows = readPayrollInputs().map(calculatePayrollRow);
    savePayrollRows(getPayrollMonth(), payrollRows);
    renderPayroll();
    showPayrollToast("薪資已重新計算。");
  });

  document.querySelector("#payrollPrintSelectedButton")?.addEventListener("click", () => {
    const row = getCalculatedRows().find((item) => item.id === selectedPayrollId);
    if (row) exportPayrollSlips([row], getPayrollMonth());
  });

  document.querySelector("#payrollPrintAllButton")?.addEventListener("click", () => {
    exportPayrollSlips(getCalculatedRows(), getPayrollMonth());
  });

  table?.addEventListener("input", (event) => {
    if (!event.target.matches("[data-payroll-field]")) return;
    if (blockPayrollReadOnly()) return;
    payrollRows = readPayrollInputs().map(calculatePayrollRow);
    savePayrollRows(getPayrollMonth(), payrollRows);
    renderPayrollSummary();
    renderPayrollPreview();
  });

  table?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-payroll-preview]");
    if (!button) return;
    selectedPayrollId = button.dataset.payrollPreview;
    renderPayroll();
  });

  masterTable?.addEventListener("input", (event) => {
    if (!event.target.matches("[data-employee-master-field]")) return;
    if (blockPayrollReadOnly()) return;
    employeeMasterRows = readEmployeeMasterInputs();
    saveEmployeeMasterRows(employeeMasterRows);
    payrollRows = getCalculatedRows();
    renderPayrollSummary();
    renderPayrollTable();
    renderPayrollPreview();
    renderEmployeeMasterTable();
  });

  syncMasterButton?.addEventListener("click", syncPayrollEmployeeMasterFromGoogle);
  saveMasterButton?.addEventListener("click", savePayrollEmployeeMasterToGoogle);
}

function renderPayroll() {
  renderPayrollSummary();
  renderPayrollTable();
  renderPayrollPreview();
  renderEmployeeMasterTable();
}

function renderPayrollSummary() {
  const summary = document.querySelector("#payrollSummary");
  if (!summary) return;
  const rows = getCalculatedRows();
  const gross = rows.reduce((sum, row) => sum + row.regularPay, 0);
  const deductions = rows.reduce(
    (sum, row) => sum + row.personalBurdenTotal + row.otherDeduction + Math.round(row.personalLeaveDeduction) + Math.round(row.sickLeaveDeduction),
    0,
  );
  const net = rows.reduce((sum, row) => sum + row.netPay, 0);

  summary.innerHTML = `
    <article><span>人數</span><strong>${rows.length}</strong></article>
    <article><span>應領固定薪資</span><strong>${formatCurrency(gross)}</strong></article>
    <article><span>本人扣款</span><strong>${formatCurrency(deductions)}</strong></article>
    <article><span>實領合計</span><strong>${formatCurrency(net)}</strong></article>
  `;
}

function renderPayrollTable() {
  const table = document.querySelector("#payrollTable");
  if (!table) return;
  table.innerHTML = `
    <table class="payroll-table">
      <thead>
        <tr>
          <th>員工編號</th>
          <th>姓名</th>
          <th>身分</th>
          <th>底薪</th>
          <th>職務加給</th>
          <th>伙食津貼</th>
          <th>月薪總額</th>
          <th>到職日期</th>
          <th>在職天數</th>
          <th>事假天數</th>
          <th>病假天數</th>
          <th>其他加成</th>
          <th>其他扣款</th>
          <th>健保眷屬</th>
          <th>眷屬健保費</th>
          <th>實領薪資</th>
          <th>薪資單</th>
        </tr>
      </thead>
      <tbody>${getCalculatedRows().map(renderPayrollTableRow).join("")}</tbody>
    </table>
  `;
}

function renderPayrollTableRow(row) {
  return `
    <tr class="${row.id === selectedPayrollId ? "active" : ""}">
      <td>${escapePayrollHtml(row.id)}</td>
      <td>${escapePayrollHtml(row.name)}</td>
      <td>${escapePayrollHtml(row.role)}</td>
      <td><input data-payroll-field="baseSalary" data-payroll-id="${escapePayrollHtml(row.id)}" type="number" min="0" step="1" value="${row.baseSalary}" /></td>
      <td><input data-payroll-field="dutyAllowance" data-payroll-id="${escapePayrollHtml(row.id)}" type="number" min="0" step="1" value="${row.dutyAllowance || 0}" /></td>
      <td><input data-payroll-field="mealAllowance" data-payroll-id="${escapePayrollHtml(row.id)}" type="number" min="0" step="1" value="${row.mealAllowance || fixedMealAllowance}" readonly /></td>
      <td><strong>${formatCurrency(row.monthlySalaryTotal)}</strong></td>
      <td><input data-payroll-field="hireDate" data-payroll-id="${escapePayrollHtml(row.id)}" type="date" value="${escapePayrollHtml(row.hireDate)}" /></td>
      <td>${row.employedDays}</td>
      <td><input data-payroll-field="personalLeaveDays" data-payroll-id="${escapePayrollHtml(row.id)}" type="number" min="0" step="0.5" value="${row.personalLeaveDays || 0}" /></td>
      <td><input data-payroll-field="sickLeaveDays" data-payroll-id="${escapePayrollHtml(row.id)}" type="number" min="0" step="0.5" value="${row.sickLeaveDays || 0}" /></td>
      <td><input data-payroll-field="otherAllowance" data-payroll-id="${escapePayrollHtml(row.id)}" type="number" min="0" step="1" value="${row.otherAllowance || 0}" /></td>
      <td><input data-payroll-field="otherDeduction" data-payroll-id="${escapePayrollHtml(row.id)}" type="number" min="0" step="1" value="${row.otherDeduction || 0}" /></td>
      <td>${row.billableDependentCount}</td>
      <td>${formatCurrency(row.dependentHealthPersonal)}</td>
      <td><strong>${formatCurrency(row.netPay)}</strong></td>
      <td><button class="secondary-button compact-button" type="button" data-payroll-preview="${escapePayrollHtml(row.id)}">預覽</button></td>
    </tr>
  `;
}

function renderPayrollPreview() {
  const preview = document.querySelector("#payrollPreview");
  if (!preview) return;
  const row = getCalculatedRows().find((item) => item.id === selectedPayrollId);
  if (!row) {
    preview.className = "payroll-preview empty-state";
    preview.textContent = "請先選擇一位員工預覽薪資單。";
    return;
  }
  preview.className = "payroll-preview";
  preview.innerHTML = buildPayslipHtml(row, getPayrollMonth(), false);
}

function renderEmployeeMasterTable() {
  const container = document.querySelector("#payrollEmployeeMaster");
  if (!container) return;
  const rows = getEmployeeMasterRows();
  container.innerHTML = `
    <table class="payroll-master-table">
      <thead>
        <tr>
          <th>員工編號</th>
          <th>姓名</th>
          <th>健保眷屬人數</th>
          <th>眷屬加保日期</th>
          <th>計費說明</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(renderEmployeeMasterRow).join("")}
      </tbody>
    </table>
  `;
}

function renderEmployeeMasterRow(row) {
  const payrollRow = getCalculatedRows().find((item) => item.id === row.id);
  const billableCount = payrollRow?.billableDependentCount || 0;
  const cappedText = Number(row.healthDependentCount || 0) > 3 ? "，最多以 3 人計" : "";
  const activeText = billableCount
    ? `本月計 ${billableCount} 位眷屬${cappedText}`
    : "本月未計眷屬";
  return `
    <tr>
      <td>${escapePayrollHtml(row.id)}</td>
      <td>${escapePayrollHtml(row.name)}</td>
      <td><input data-employee-master-field="healthDependentCount" data-employee-id="${escapePayrollHtml(row.id)}" type="number" min="0" max="10" step="1" value="${row.healthDependentCount || 0}" /></td>
      <td><input data-employee-master-field="healthDependentStartDate" data-employee-id="${escapePayrollHtml(row.id)}" type="date" value="${escapePayrollHtml(row.healthDependentStartDate || "")}" /></td>
      <td>${escapePayrollHtml(activeText)}</td>
    </tr>
  `;
}

function readPayrollInputs() {
  return getCalculatedRows().map((row) => {
    const findValue = (field) => document.querySelector(`[data-payroll-id="${CSS.escape(row.id)}"][data-payroll-field="${field}"]`)?.value;
    return {
      ...row,
      baseSalary: Number(findValue("baseSalary") || row.baseSalary || 0),
      dutyAllowance: Number(findValue("dutyAllowance") || 0),
      mealAllowance: fixedMealAllowance,
      hireDate: findValue("hireDate") || row.hireDate,
      personalLeaveDays: Number(findValue("personalLeaveDays") || 0),
      sickLeaveDays: Number(findValue("sickLeaveDays") || 0),
      otherAllowance: Number(findValue("otherAllowance") || 0),
      otherDeduction: Number(findValue("otherDeduction") || 0),
    };
  });
}

function loadPayrollRows(month) {
  const saved = localStorage.getItem(getPayrollStorageKey(month));
  if (saved) {
    try {
      const rows = JSON.parse(saved);
      if (Array.isArray(rows) && rows.length) return rows.map(mergePayrollEmployee).map(calculatePayrollRow);
    } catch {
      localStorage.removeItem(getPayrollStorageKey(month));
    }
  }

  return payrollEmployees.map((employee) => calculatePayrollRow({
    ...employee,
    personalLeaveDays: employee.id === "PH005" && month === "2026-07" ? 10 : 0,
    sickLeaveDays: 0,
    otherAllowance: 0,
    otherDeduction: 0,
  }));
}

function getEmployeeMasterRows() {
  if (!employeeMasterRows.length) employeeMasterRows = loadEmployeeMasterRows();
  return employeeMasterRows;
}

function loadEmployeeMasterRows() {
  const saved = localStorage.getItem("longbroEmployeeMasterRows");
  let savedRows = [];
  if (saved) {
    try {
      savedRows = JSON.parse(saved);
    } catch {
      localStorage.removeItem("longbroEmployeeMasterRows");
    }
  }

  return payrollEmployees.map((employee) => {
    const savedRow = Array.isArray(savedRows) ? savedRows.find((item) => item.id === employee.id) : null;
    return {
      id: employee.id,
      name: employee.name,
      healthDependentCount: Number(savedRow?.healthDependentCount || employee.healthDependentCount || 0),
      healthDependentStartDate: savedRow?.healthDependentStartDate || employee.healthDependentStartDate || "",
    };
  });
}

function readEmployeeMasterInputs() {
  return getEmployeeMasterRows().map((row) => {
    const findValue = (field) => document.querySelector(`[data-employee-id="${CSS.escape(row.id)}"][data-employee-master-field="${field}"]`)?.value;
    return {
      ...row,
      healthDependentCount: Math.max(0, Number(findValue("healthDependentCount") || 0)),
      healthDependentStartDate: findValue("healthDependentStartDate") || "",
    };
  });
}

function saveEmployeeMasterRows(rows) {
  localStorage.setItem("longbroEmployeeMasterRows", JSON.stringify(rows));
}

async function syncPayrollEmployeeMasterFromGoogle() {
  if (blockPayrollReadOnly()) return;
  const button = document.querySelector("#syncPayrollEmployeeMasterButton");
  const originalText = button?.textContent || "從 Google 讀取";
  if (!lineEndpointConfig.endpointUrl || !lineEndpointConfig.sharedSecret) {
    showPayrollToast("Google 同步端點尚未設定。");
    return;
  }

  try {
    if (button) {
      button.disabled = true;
      button.textContent = "同步中...";
    }
    const result = await requestPayrollEndpointJsonp({
      action: "readPayrollEmployeeMaster",
      secret: lineEndpointConfig.sharedSecret,
      spreadsheetId: payrollEmployeeMasterSpreadsheetId,
      sheetName: payrollEmployeeMasterSheetName,
    });
    const importedRows = Array.isArray(result.employees) ? result.employees : [];
    if (!importedRows.length) throw new Error("Google 員工資料沒有讀到可同步資料");

    const currentRows = getEmployeeMasterRows();
    employeeMasterRows = payrollEmployees.map((employee) => {
      const currentRow = currentRows.find((item) => item.id === employee.id) || {};
      const importedRow = importedRows.find((item) => item.id === employee.id) || {};
      return {
        id: employee.id,
        name: importedRow.name || employee.name,
        healthDependentCount: Math.max(0, Number(importedRow.healthDependentCount ?? currentRow.healthDependentCount ?? 0)),
        healthDependentStartDate: normalizeDateInput(importedRow.healthDependentStartDate || currentRow.healthDependentStartDate || ""),
      };
    });

    saveEmployeeMasterRows(employeeMasterRows);
    payrollRows = getCalculatedRows();
    savePayrollRows(getPayrollMonth(), payrollRows);
    renderPayroll();
    showPayrollToast(`已同步 ${importedRows.length} 筆 Google 員工資料。`);
  } catch (error) {
    showPayrollToast(`同步失敗：${error.message || error}`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function savePayrollEmployeeMasterToGoogle() {
  if (blockPayrollReadOnly()) return;
  const button = document.querySelector("#savePayrollEmployeeMasterButton");
  const originalText = button?.textContent || "儲存到 Google";
  if (!lineEndpointConfig.endpointUrl || !lineEndpointConfig.sharedSecret) {
    showPayrollToast("Google 同步端點尚未設定。");
    return;
  }

  try {
    employeeMasterRows = readEmployeeMasterInputs();
    saveEmployeeMasterRows(employeeMasterRows);
    payrollRows = getCalculatedRows();
    savePayrollRows(getPayrollMonth(), payrollRows);
    renderPayrollSummary();
    renderPayrollTable();
    renderPayrollPreview();

    if (button) {
      button.disabled = true;
      button.textContent = "儲存中...";
    }

    const result = await requestPayrollEndpointJsonp({
      action: "updatePayrollEmployeeMaster",
      secret: lineEndpointConfig.sharedSecret,
      spreadsheetId: payrollEmployeeMasterSpreadsheetId,
      sheetName: payrollEmployeeMasterSheetName,
      employees: employeeMasterRows.map((row) => ({
        id: row.id,
        healthDependentCount: Math.min(Math.max(Number(row.healthDependentCount || 0), 0), 3),
        healthDependentStartDate: normalizeDateInput(row.healthDependentStartDate || ""),
      })),
    });

    showPayrollToast(`已儲存 ${result.updatedCount || 0} 筆員工眷屬資料到 Google。`);
  } catch (error) {
    showPayrollToast(`儲存失敗：${error.message || error}`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

function requestPayrollEndpointJsonp(payload) {
  return new Promise((resolve, reject) => {
    const callbackName = `payrollMasterCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("Google 員工資料同步逾時"));
    }, 45000);

    const cleanup = () => {
      window.clearTimeout(timer);
      delete window[callbackName];
      script.remove();
    };

    window[callbackName] = (result) => {
      cleanup();
      if (!result?.ok) {
        reject(new Error(result?.error || "Google 員工資料同步失敗"));
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
      reject(new Error("無法連到 Google 員工資料同步端點"));
    };
    script.src = url.toString();
    document.body.appendChild(script);
  });
}

function mergePayrollEmployee(saved) {
  const employee = payrollEmployees.find((item) => item.id === saved.id) || {};
  return {
    ...employee,
    ...saved,
    baseSalary: employee.baseSalary ?? Number(saved.baseSalary || 0),
    mealAllowance: fixedMealAllowance,
    personalLeaveDays: Number(saved.personalLeaveDays ?? saved.leaveDays ?? 0),
    sickLeaveDays: Number(saved.sickLeaveDays ?? 0),
  };
}

function savePayrollRows(month, rows) {
  localStorage.setItem(getPayrollStorageKey(month), JSON.stringify(rows));
}

function getCalculatedRows() {
  payrollRows = payrollRows.map(calculatePayrollRow);
  return payrollRows;
}

function calculatePayrollRow(row) {
  const month = getPayrollMonth();
  const employedDays = calculateEmployedDays(month, row.hireDate);
  const baseSalary = Number(row.baseSalary || 0);
  const dutyAllowance = Number(row.dutyAllowance || 0);
  const mealAllowance = Number(row.mealAllowance || 0);
  const monthlySalaryTotal = baseSalary + dutyAllowance + mealAllowance;
  const dailyWage = monthlySalaryTotal / 30;
  const hourlyWage = monthlySalaryTotal / 240;
  const personalLeaveDays = Number(row.personalLeaveDays ?? row.leaveDays ?? 0);
  const sickLeaveDays = Number(row.sickLeaveDays || 0);
  const regularPayBeforeLeave = dailyWage * employedDays;
  const personalLeaveDeduction = dailyWage * personalLeaveDays;
  const sickLeaveDeduction = dailyWage * sickLeaveDays * 0.5;
  const grossPay = Math.round(Math.max(0, regularPayBeforeLeave - personalLeaveDeduction - sickLeaveDeduction));
  const laborPersonalBase = row.role === "雇主" ? 0 : lookupPremium(employeeLaborPersonal, row.laborInsuredSalary);
  const healthPersonalBase = row.role === "雇主" ? 0 : lookupPremium(employeeHealthPersonal, row.healthInsuredSalary);
  const employeeMaster = getEmployeeMasterRows().find((item) => item.id === row.id);
  const healthDependentCount = Number(employeeMaster?.healthDependentCount || 0);
  const billableDependentCount = isHealthDependentBillable(month, employeeMaster?.healthDependentStartDate)
    ? Math.min(healthDependentCount, 3)
    : 0;
  const laborPersonal = row.role === "雇主" ? 0 : Math.round(laborPersonalBase / 30 * employedDays);
  const healthPersonal = row.role === "雇主" ? 0 : healthPersonalBase;
  const dependentHealthPersonal = row.role === "雇主" ? 0 : healthPersonalBase * billableDependentCount;
  const companyLaborTable = row.role === "雇主" ? ownerLaborCompany : employeeLaborCompany;
  const companyHealthTable = row.role === "雇主" ? ownerHealthCompany : employeeHealthCompany;
  const companyLabor = Math.round(lookupPremium(companyLaborTable, row.laborInsuredSalary) / 30 * employedDays);
  const companyHealth = lookupPremium(companyHealthTable, row.healthInsuredSalary);
  const otherAllowance = Number(row.otherAllowance || 0);
  const otherDeduction = Number(row.otherDeduction || 0);
  const personalBurdenTotal = laborPersonal + healthPersonal + dependentHealthPersonal;
  const netPay = grossPay + otherAllowance - otherDeduction - personalBurdenTotal;

  return {
    ...row,
    baseSalary,
    dutyAllowance,
    mealAllowance,
    monthlySalaryTotal,
    dailyWage,
    hourlyWage,
    employedDays,
    personalLeaveDays,
    sickLeaveDays,
    personalLeaveDeduction,
    sickLeaveDeduction,
    regularPay: grossPay,
    grossPay,
    laborPersonal,
    healthPersonal,
    dependentHealthPersonal,
    healthPersonalBase,
    healthDependentCount,
    billableDependentCount,
    healthDependentStartDate: employeeMaster?.healthDependentStartDate || "",
    personalBurdenTotal,
    companyLabor,
    companyHealth,
    companyBurdenTotal: companyLabor + companyHealth,
    otherAllowance,
    otherDeduction,
    netPay,
  };
}

function calculateEmployedDays(month, hireDate) {
  if (!month || !hireDate) return 30;
  const monthStart = new Date(`${month}-01T00:00:00`);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const hire = new Date(`${hireDate}T00:00:00`);
  if (hire > monthEnd) return 0;
  if (hire <= monthStart) return 30;
  return Math.min(30, monthEnd.getDate() - hire.getDate() + 1);
}

function isHealthDependentBillable(month, startDate) {
  if (!month || !startDate) return false;
  const monthStart = new Date(`${month}-01T00:00:00`);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const start = new Date(`${startDate}T00:00:00`);
  return start <= monthEnd;
}

function normalizeDateInput(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const text = String(value).trim();
  if (!text) return "";
  const slashMatch = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (slashMatch) {
    const [, year, month, day] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const compactMatch = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    const [, year, month, day] = compactMatch;
    return `${year}-${month}-${day}`;
  }
  const rocMatch = text.match(/^(\d{2,3})[/-]?(\d{2})[/-]?(\d{2})$/);
  if (rocMatch) {
    const [, rocYear, month, day] = rocMatch;
    return `${Number(rocYear) + 1911}-${month}-${day}`;
  }
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return "";
}

function lookupPremium(table, insuredSalary) {
  const exact = table.find(([salary]) => Number(salary) === Number(insuredSalary));
  if (exact) return Number(exact[1]);
  const sorted = [...table].sort((a, b) => a[0] - b[0]);
  const next = sorted.find(([salary]) => Number(salary) >= Number(insuredSalary));
  return Number((next || sorted[sorted.length - 1] || [0, 0])[1]);
}

function buildPayslipHtml(row, month, printMode) {
  const allowanceRows = [
    ["本薪", Math.round(row.baseSalary / 30 * row.employedDays)],
    ["職務加給", Math.round(row.dutyAllowance / 30 * row.employedDays)],
    ["伙食津貼", Math.round(row.mealAllowance / 30 * row.employedDays)],
    ["其他加成", row.otherAllowance],
  ].filter(([, amount]) => amount || printMode);
  const deductionRows = [
    ["事假扣薪", Math.round(row.personalLeaveDeduction)],
    ["病假扣薪", Math.round(row.sickLeaveDeduction)],
    ["勞保費", row.laborPersonal],
    ["健保費", row.healthPersonal],
    ["眷屬健保費", row.dependentHealthPersonal],
    ["其他扣款", row.otherDeduction],
  ].filter(([, amount]) => amount || printMode);
  const maxRows = Math.max(8, allowanceRows.length, deductionRows.length);
  const lines = Array.from({ length: maxRows }, (_, index) => {
    const allowance = allowanceRows[index] || ["", ""];
    const deduction = deductionRows[index] || ["", ""];
    return `
      <tr>
        <td>${escapePayrollHtml(allowance[0])}</td>
        <td class="money">${formatSlipAmount(allowance[1])}</td>
        <td>${escapePayrollHtml(deduction[0])}</td>
        <td class="money">${formatSlipAmount(deduction[1])}</td>
      </tr>
    `;
  }).join("");

  return `
    <article class="payslip-card">
      <h3>隆博股份有限公司 ${formatPayrollMonthLabel(month)}薪資單</h3>
      <div class="payslip-meta">
        <span>薪資年月：${escapePayrollHtml(month)}</span>
        <span>員工編號：${escapePayrollHtml(row.id)}</span>
      </div>
      <table class="payslip-table">
        <tbody>
          <tr><th>姓名：</th><td>${escapePayrollHtml(row.name)}</td><th>部門：</th><td>${escapePayrollHtml(row.department || "")}</td></tr>
          <tr><th>加項</th><th>金額</th><th>減項</th><th>金額</th></tr>
          ${lines}
          <tr><th>小計</th><td class="money">${formatCurrency(row.regularPay + Math.round(row.personalLeaveDeduction) + Math.round(row.sickLeaveDeduction) + row.otherAllowance)}</td><th>小計</th><td class="money">${formatCurrency(Math.round(row.personalLeaveDeduction) + Math.round(row.sickLeaveDeduction) + row.personalBurdenTotal + row.otherDeduction)}</td></tr>
          <tr class="net-row"><th>實領</th><td class="money" colspan="3">${formatCurrency(row.netPay)}</td></tr>
        </tbody>
      </table>
      <p class="payslip-note">月本薪 ${formatCurrency(row.baseSalary)}，伙食津貼 ${formatCurrency(row.mealAllowance)}，合計總額 ${formatCurrency(row.monthlySalaryTotal)}。到職日 ${escapePayrollHtml(row.hireDate)}，本月在職 ${row.employedDays} 天，事假 ${row.personalLeaveDays || 0} 天，病假 ${row.sickLeaveDays || 0} 天。健保眷屬 ${row.healthDependentCount || 0} 人，眷屬加保日 ${escapePayrollHtml(row.healthDependentStartDate || "未填")}，本月計費眷屬 ${row.billableDependentCount || 0} 人。</p>
    </article>
  `;
}

async function exportPayrollSlips(rows, month) {
  if (!rows.length) return;
  if (!("showDirectoryPicker" in window)) {
    printPayrollSlips(rows, month);
    return;
  }

  try {
    await savePayrollSlipsToFolder(rows, month);
  } catch (error) {
    if (error?.name === "AbortError") return;
    console.warn(error);
    showPayrollToast("無法直接存入資料夾，已改用列印視窗。");
    printPayrollSlips(rows, month);
  }
}

async function savePayrollSlipsToFolder(rows, month) {
  const rootHandle = await window.showDirectoryPicker({
    id: "longbro-payroll-slips",
    mode: "readwrite",
  });
  await createPayrollMonthFolders(rootHandle);
  const monthFolderName = formatPayrollMonthFolder(month);
  const monthHandle = await rootHandle.getDirectoryHandle(monthFolderName, { create: true });

  for (const row of rows) {
    const fileHandle = await monthHandle.getFileHandle(buildPayrollSlipFileName(month, row), { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(buildPayrollDocumentHtml([row], month));
    await writable.close();
  }

  showPayrollToast(`已儲存 ${rows.length} 份薪資單到 ${monthFolderName} 資料夾。`);
}

async function createPayrollMonthFolders(rootHandle) {
  for (let year = 2026; year <= 2027; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      const folderName = `${year}${String(month).padStart(2, "0")}`;
      if (folderName >= "202607" && folderName <= "202712") {
        await rootHandle.getDirectoryHandle(folderName, { create: true });
      }
    }
  }
}

function buildPayrollSlipFileName(month, row) {
  return `隆博股份有限公司 ${formatPayrollMonthLabel(month)}薪資單_${sanitizePayrollFileName(row.name)}.html`;
}

function sanitizePayrollFileName(value) {
  return String(value || "未命名").replace(/[\\/:*?"<>|]/g, "").trim() || "未命名";
}

function formatPayrollMonthFolder(month) {
  return String(month || getCurrentMonth()).replace("-", "");
}

function buildPayrollDocumentHtml(rows, month) {
  return `
    <!doctype html>
    <html lang="zh-Hant">
      <head>
        <meta charset="UTF-8" />
        <title>隆博股份有限公司 ${formatPayrollMonthLabel(month)}薪資單</title>
        <style>
          body { margin: 0; padding: 24px; color: #111; font-family: "Microsoft JhengHei", "PingFang TC", sans-serif; }
          .payslip-card { width: 760px; margin: 0 auto 28px; page-break-after: always; }
          .payslip-card:last-child { page-break-after: auto; }
          h3 { margin: 0; border: 2px solid #111; border-bottom: 0; padding: 10px; text-align: center; font-size: 30px; font-weight: 500; }
          .payslip-meta { display: flex; justify-content: center; gap: 28px; border: 2px solid #111; border-bottom: 0; padding: 8px; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border: 2px solid #111; padding: 8px 12px; font-size: 20px; text-align: center; height: 38px; }
          th { font-weight: 700; }
          .money { text-align: right; }
          .net-row th, .net-row td { font-size: 26px; font-weight: 800; }
          .payslip-note { margin: 8px 0 0; font-size: 13px; color: #444; }
          @media print { body { padding: 0; } .payslip-card { width: 100%; max-width: 760px; } }
        </style>
      </head>
      <body>${rows.map((row) => buildPayslipHtml(row, month, true)).join("")}</body>
    </html>
  `;
}

function printPayrollSlips(rows, month) {
  const printWindow = window.open("", "_blank", "width=900,height=720");
  if (!printWindow) {
    showPayrollToast("瀏覽器封鎖了列印視窗，請允許彈出視窗後再試一次。");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html lang="zh-Hant">
      <head>
        <meta charset="UTF-8" />
        <title>隆博股份有限公司 ${formatPayrollMonthLabel(month)}薪資單</title>
        <style>
          body { margin: 0; padding: 24px; color: #111; font-family: "Microsoft JhengHei", "PingFang TC", sans-serif; }
          .payslip-card { width: 760px; margin: 0 auto 28px; page-break-after: always; }
          .payslip-card:last-child { page-break-after: auto; }
          h3 { margin: 0; border: 2px solid #111; border-bottom: 0; padding: 10px; text-align: center; font-size: 30px; font-weight: 500; }
          .payslip-meta { display: flex; justify-content: center; gap: 28px; border: 2px solid #111; border-bottom: 0; padding: 8px; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border: 2px solid #111; padding: 8px 12px; font-size: 20px; text-align: center; height: 38px; }
          th { font-weight: 700; }
          .money { text-align: right; }
          .net-row th, .net-row td { font-size: 26px; font-weight: 800; }
          .payslip-note { margin: 8px 0 0; font-size: 13px; color: #444; }
          @media print { body { padding: 0; } .payslip-card { width: 100%; max-width: 760px; } }
        </style>
      </head>
      <body>${rows.map((row) => buildPayslipHtml(row, month, true)).join("")}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 300);
}

function getPayrollMonth() {
  return document.querySelector("#payrollMonthInput")?.value || getCurrentMonth();
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getPayrollStorageKey(month) {
  return `longbroPayrollRows:${month}`;
}

function formatPayrollMonthLabel(month) {
  const [, rawMonth] = String(month || "").split("-");
  return `${Number(rawMonth || 0) || ""}月`;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

function formatSlipAmount(value) {
  return value === "" ? "" : formatCurrency(value);
}

function escapePayrollHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showPayrollToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showPayrollToast.timer);
  showPayrollToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}
