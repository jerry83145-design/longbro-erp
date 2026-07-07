const payrollEmployees = [
  { id: "PH005", name: "董秉澤", role: "員工", department: "營運", baseSalary: 30000, hireDate: "2026-07-01", laborInsuredSalary: 30300, healthInsuredSalary: 30300 },
  { id: "PH003", name: "林煒昕", role: "員工", department: "營運", baseSalary: 40000, hireDate: "2026-06-15", laborInsuredSalary: 40100, healthInsuredSalary: 40100 },
  { id: "PH002", name: "徐振睿", role: "員工", department: "營運", baseSalary: 30000, hireDate: "2026-06-15", laborInsuredSalary: 30300, healthInsuredSalary: 30300 },
  { id: "PH004", name: "張晟睿", role: "雇主", department: "管理", baseSalary: 60000, hireDate: "2026-06-15", laborInsuredSalary: 45800, healthInsuredSalary: 60800 },
];

const employeeLaborPersonal = [[30300, 758], [40100, 1002]];
const employeeHealthPersonal = [[30300, 470], [40100, 622]];
const employeeLaborCompany = [[30300, 2651], [40100, 3508]];
const employeeHealthCompany = [[30300, 1466], [40100, 1939]];
const ownerLaborCompany = [[45800, 1053]];
const ownerHealthCompany = [[60800, 3143]];

let payrollRows = [];
let selectedPayrollId = "";
let payrollInitialized = false;

export function initPayrollPage() {
  const monthInput = document.querySelector("#payrollMonthInput");
  const table = document.querySelector("#payrollTable");
  if (!monthInput || !table) return;

  if (!payrollInitialized) {
    monthInput.value = getCurrentMonth();
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

  monthInput?.addEventListener("change", () => {
    payrollRows = loadPayrollRows(monthInput.value);
    selectedPayrollId = payrollRows[0]?.id || "";
    renderPayroll();
  });

  document.querySelector("#payrollCalculateButton")?.addEventListener("click", () => {
    payrollRows = readPayrollInputs().map(calculatePayrollRow);
    savePayrollRows(getPayrollMonth(), payrollRows);
    renderPayroll();
    showPayrollToast("薪資已重新計算。");
  });

  document.querySelector("#payrollPrintSelectedButton")?.addEventListener("click", () => {
    const row = getCalculatedRows().find((item) => item.id === selectedPayrollId);
    if (row) printPayrollSlips([row], getPayrollMonth());
  });

  document.querySelector("#payrollPrintAllButton")?.addEventListener("click", () => {
    printPayrollSlips(getCalculatedRows(), getPayrollMonth());
  });

  table?.addEventListener("input", (event) => {
    if (!event.target.matches("[data-payroll-field]")) return;
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
}

function renderPayroll() {
  renderPayrollSummary();
  renderPayrollTable();
  renderPayrollPreview();
}

function renderPayrollSummary() {
  const summary = document.querySelector("#payrollSummary");
  if (!summary) return;
  const rows = getCalculatedRows();
  const gross = rows.reduce((sum, row) => sum + row.grossPay, 0);
  const deductions = rows.reduce((sum, row) => sum + row.personalBurdenTotal + row.otherDeduction, 0);
  const net = rows.reduce((sum, row) => sum + row.netPay, 0);

  summary.innerHTML = `
    <article><span>人數</span><strong>${rows.length}</strong></article>
    <article><span>本薪應領</span><strong>${formatCurrency(gross)}</strong></article>
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
          <th>到職日期</th>
          <th>在職天數</th>
          <th>請假天數</th>
          <th>其他加成</th>
          <th>其他扣款</th>
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
      <td><input data-payroll-field="hireDate" data-payroll-id="${escapePayrollHtml(row.id)}" type="date" value="${escapePayrollHtml(row.hireDate)}" /></td>
      <td>${row.employedDays}</td>
      <td><input data-payroll-field="leaveDays" data-payroll-id="${escapePayrollHtml(row.id)}" type="number" min="0" step="0.5" value="${row.leaveDays || 0}" /></td>
      <td><input data-payroll-field="otherAllowance" data-payroll-id="${escapePayrollHtml(row.id)}" type="number" min="0" step="1" value="${row.otherAllowance || 0}" /></td>
      <td><input data-payroll-field="otherDeduction" data-payroll-id="${escapePayrollHtml(row.id)}" type="number" min="0" step="1" value="${row.otherDeduction || 0}" /></td>
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

function readPayrollInputs() {
  return getCalculatedRows().map((row) => {
    const findValue = (field) => document.querySelector(`[data-payroll-id="${CSS.escape(row.id)}"][data-payroll-field="${field}"]`)?.value;
    return {
      ...row,
      baseSalary: Number(findValue("baseSalary") || row.baseSalary || 0),
      hireDate: findValue("hireDate") || row.hireDate,
      leaveDays: Number(findValue("leaveDays") || 0),
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
    leaveDays: employee.id === "PH005" && month === "2026-07" ? 10 : 0,
    otherAllowance: 0,
    otherDeduction: 0,
  }));
}

function mergePayrollEmployee(saved) {
  const employee = payrollEmployees.find((item) => item.id === saved.id) || {};
  return { ...employee, ...saved };
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
  const payableDays = Math.max(0, employedDays - Number(row.leaveDays || 0));
  const grossPay = Math.round(Number(row.baseSalary || 0) / 30 * payableDays);
  const laborPersonalBase = row.role === "雇主" ? 0 : lookupPremium(employeeLaborPersonal, row.laborInsuredSalary);
  const healthPersonalBase = row.role === "雇主" ? 0 : lookupPremium(employeeHealthPersonal, row.healthInsuredSalary);
  const laborPersonal = row.role === "雇主" ? 0 : Math.round(laborPersonalBase / 30 * employedDays);
  const healthPersonal = row.role === "雇主" || isMidMonthHire(month, row.hireDate) ? 0 : healthPersonalBase;
  const companyLaborTable = row.role === "雇主" ? ownerLaborCompany : employeeLaborCompany;
  const companyHealthTable = row.role === "雇主" ? ownerHealthCompany : employeeHealthCompany;
  const companyLabor = Math.round(lookupPremium(companyLaborTable, row.laborInsuredSalary) / 30 * employedDays);
  const companyHealth = isMidMonthHire(month, row.hireDate) ? 0 : lookupPremium(companyHealthTable, row.healthInsuredSalary);
  const otherAllowance = Number(row.otherAllowance || 0);
  const otherDeduction = Number(row.otherDeduction || 0);
  const personalBurdenTotal = laborPersonal + healthPersonal;
  const netPay = grossPay + otherAllowance - otherDeduction - personalBurdenTotal;

  return {
    ...row,
    employedDays,
    payableDays,
    grossPay,
    laborPersonal,
    healthPersonal,
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

function isMidMonthHire(month, hireDate) {
  return Boolean(month && hireDate && hireDate.slice(0, 7) === month && !hireDate.endsWith("-01"));
}

function lookupPremium(table, insuredSalary) {
  const exact = table.find(([salary]) => Number(salary) === Number(insuredSalary));
  if (exact) return Number(exact[1]);
  const sorted = [...table].sort((a, b) => a[0] - b[0]);
  const next = sorted.find(([salary]) => Number(salary) >= Number(insuredSalary));
  return Number((next || sorted[sorted.length - 1] || [0, 0])[1]);
}

function buildPayslipHtml(row, month, printMode) {
  const allowanceRows = [["本薪", row.grossPay], ["其他加成", row.otherAllowance]].filter(([, amount]) => amount || printMode);
  const deductionRows = [["勞保費", row.laborPersonal], ["健保費", row.healthPersonal], ["其他扣款", row.otherDeduction]].filter(([, amount]) => amount || printMode);
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
          <tr><th>小計</th><td class="money">${formatCurrency(row.grossPay + row.otherAllowance)}</td><th>小計</th><td class="money">${formatCurrency(row.personalBurdenTotal + row.otherDeduction)}</td></tr>
          <tr class="net-row"><th>實領</th><td class="money" colspan="3">${formatCurrency(row.netPay)}</td></tr>
        </tbody>
      </table>
      <p class="payslip-note">到職日 ${escapePayrollHtml(row.hireDate)}，本月在職 ${row.employedDays} 天，請假 ${row.leaveDays || 0} 天。</p>
    </article>
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
