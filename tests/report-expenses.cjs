const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');
const context = vm.createContext({ inventoryCache: [], assetCache: [],
  escapeHtml: String, formatNumber: String, typeLabel: (type) => type === 'expense' ? '支出' : '收入',
  compareCategoryDetailByDate: () => 0 });
for (const name of ['isOperatingExpenseRecord', 'isSalesRevenueRecord', 'sumOperatingExpense', 'getPeriodExpenseAmount', 'buildIncomeStatementSheet', 'renderReportCategoryGroups', 'renderCategoryRow']) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf('\nfunction ', start + 1);
  vm.runInContext(source.slice(start, end), context);
}
const expense = (id, major, amount) => ({ id, type: 'expense', major, amount });
const rows = [
  expense('operating', '營業費用', 1638403),
  expense('other', '其他費用', 415949),
  expense('tax', '稅捐規費', 6911),
  expense('stock', '進貨成本', 15729364),
  expense('assets', '固定資產-待確認', 628034),
  expense('deposit', '流動資產', 148000),
  expense('equipment', '辦公設備', 352),
  { type: 'income', major: '其他費用', amount: 100 },
];
const original = JSON.stringify(rows);
const payroll = 1017539;
const total = context.sumOperatingExpense(rows) + payroll;
assert.equal(total, 3078802);
assert.equal(17234814 - 14442178 - total, -286166);
assert.equal(JSON.stringify(rows), original);
context.inventoryCache = [
  { linkedLedgerId: 'other', action: 'in', totalCost: 1000 },
  { linkedLedgerId: 'other', action: 'out', totalCost: 400 },
  { linkedLedgerId: 'other', action: 'in', totalCost: 500, deletedAt: 'deleted' },
];
context.assetCache = [{ sourceLedgerId: 'other', amount: 2000 }];
assert.equal(context.getPeriodExpenseAmount(rows[1]), 412949);
assert.equal(context.getPeriodExpenseAmount(expense('other', '其他費用', 500)), 0);
assert.equal(context.getPeriodExpenseAmount(expense('unlinked', '其他費用', 500)), 500);
context.lastReportSummary = { start: '2026-04-01', end: '2026-10-31', salesIncome: 17234814,
  productCost: 14442178, logisticsCost: 0, packagingCost: 0, operatingExpense: total };
const sheet = context.buildIncomeStatementSheet();
assert.equal(sheet[9][1], total);
assert.equal(sheet[10][1].f, 'B8-B10');
assert.equal(sheet[11][1].f, 'IF(B4=0,"-",B11/B4)');
assert.ok(source.includes('const operatingExpense = sumOperatingExpense(adjustedRecords) + payrollOperatingExpense;'));
const groups = [
  { type: 'expense', major: '進貨成本', amount: 100, count: 1 },
  { type: 'expense', major: '薪資成本', amount: 10, count: 1 },
  { type: 'expense', major: '其他費用', amount: 20, count: 1 },
  { type: 'expense', major: '營業費用', amount: 30, count: 1 },
  { type: 'soldCost', major: '銷貨成本', amount: 40, count: 1 },
  { type: 'income', major: '銷貨收入', amount: 100, count: 1 },
  { type: 'expense', major: '固定資產-待確認', amount: 50, count: 1 },
  { type: 'expense', major: '稅捐規費', amount: 2, count: 1 },
];
const beforeGroups = JSON.stringify(groups);
const html = context.renderReportCategoryGroups(groups);
assert.ok(html.indexOf('銷貨收入') < html.indexOf('銷貨成本'));
assert.ok(html.indexOf('營業費用') < html.indexOf('薪資成本'));
assert.ok(html.includes('薪資成本（已計入營業費用）'));
assert.ok(html.indexOf('稅捐規費') < html.indexOf('未直接計入內帳損益'));
assert.ok(html.indexOf('進貨成本') > html.indexOf('未直接計入內帳損益'));
assert.ok(html.indexOf('固定資產-待確認') > html.indexOf('未直接計入內帳損益'));
assert.equal(JSON.stringify(groups), beforeGroups);
assert.ok(context.renderReportCategoryGroups([]).includes('此區間沒有紀錄'));
console.log('Report expense inclusion, asset exclusions, and export checks passed.');
