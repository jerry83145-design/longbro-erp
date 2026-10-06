const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('src/employee-import.js', 'utf8').replace(/export /g, ''), context);
const valid = {id:'NEW001', name:'Test', role:'員工', department:'營運', hireDate:'2026-10-01', baseSalary:'30,000', dutyAllowance:0, mealAllowance:3000, laborInsuredSalary:30300, healthInsuredSalary:30300, healthDependentCount:0, healthDependentStartDate:''};
const check = (rows, existing = []) => context.validateEmployeeRows(rows, existing);
assert.equal(check([valid])[0].errors.length, 0);
assert.equal(check([valid])[0].row.baseSalary, 30000);
assert.ok(check([{...valid, hireDate:'2026-02-30'}])[0].errors.length);
assert.ok(check([{...valid, hireDate:'bad'}])[0].errors.length);
assert.ok(check([{...valid, baseSalary:''}])[0].errors.length);
assert.ok(check([{...valid, baseSalary:'-1'}])[0].errors.length);
assert.ok(check([{...valid, healthDependentCount:1}])[0].errors.length);
assert.ok(check([valid, valid])[1].errors.some((s) => s.includes('重複')));
assert.equal(check([valid], [{id:'NEW001'}])[0].exists, true);
assert.equal(check([{...valid, hireDate:'2026/10/1'}])[0].row.hireDate, '2026-10-01');

const grid = [['員工編號','姓名','健保眷屬人數','眷屬加保日期','其他欄位'], ['OLD001','Original',0,'','Preserve']];
const sheet = {
  getLastRow: () => grid.length,
  getLastColumn: () => Math.max(...grid.map((r) => r.length)),
  getRange(row, col, height = 1, width = 1) {
    return {
      getDisplayValues: () => Array.from({length:height}, (_, i) => Array.from({length:width}, (_, j) => String(grid[row+i-1]?.[col+j-1] ?? ''))),
      setNumberFormat() { return this; },
      setValue(value) { grid[row-1] ||= []; grid[row-1][col-1] = value; return this; },
    };
  },
};
const backend = vm.createContext({
  SpreadsheetApp: {openById: () => ({getSheetByName: () => sheet})},
  LockService: {getScriptLock: () => ({waitLock(){}, releaseLock(){}})},
});
vm.runInContext(fs.readFileSync('apps-script/Code.gs', 'utf8'), backend);
vm.runInContext('CONFIG.sharedSecret = "test-only"', backend);
const result = backend.updatePayrollEmployeeMasterToSheet({secret:'test-only', employees:[check([valid])[0].row]});
assert.equal(result.employeeSchemaVersion, 2);
assert.equal(result.updatedCount, 1);
assert.equal(grid.length, 3);
assert.equal(grid[1][4], 'Preserve');
assert.equal(grid[2][0], 'NEW001');
const read = backend.readPayrollEmployeeMasterFromSheet({secret:'test-only'});
assert.equal(read.employees[1].hireDate, '2026-10-01');
assert.equal(read.employees[1].name, 'Test');
backend.updatePayrollEmployeeMasterToSheet({secret:'test-only', employees:[{...valid, baseSalary:31000}]});
assert.equal(grid.length, 3);
assert.equal(backend.readPayrollEmployeeMasterFromSheet({secret:'test-only'}).employees[1].baseSalary, 31000);
console.log('Employee validation and Google Sheet upsert checks passed.');
