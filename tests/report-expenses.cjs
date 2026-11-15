const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');
const context = vm.createContext({ inventoryCache: [], assetCache: [] });
for (const name of ['isOperatingExpenseRecord', 'sumOperatingExpense', 'getPeriodExpenseAmount', 'buildIncomeStatementSheet']) {
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
console.log('Report expense inclusion, asset exclusions, and export checks passed.');
