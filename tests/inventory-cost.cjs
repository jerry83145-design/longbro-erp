const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/app.js'), 'utf8');
const names = ['buildInventorySummary', 'isInventoryCostMissing', 'getRemainingInventoryCost', 'getAvailableInventoryLots', 'buildInventoryTypeDetails', 'addInventoryTypeDetail'];
const context = vm.createContext({ inventoryCache: [], getRecordTimeValue: () => 0,
  getInventoryOpening: () => ({ sealedCaseQty: 0, boxQty: 0, cardQty: 0, supplyQty: 0, totalCost: 0 }) });
for (const name of names) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf('\nfunction ', start + 1);
  vm.runInContext(source.slice(start, end), context);
}
const inbound = (id, name, type, quantity, totalCost) => ({ id, name, type, quantity, totalCost, action: 'in', date: '2026-08-01' });
const outbound = (id, name, type, quantity, totalCost) => ({ ...inbound(id, name, type, quantity, totalCost), action: 'out' });
const records = [
  inbound('black', 'Black', 'sealedCase', 3, 498000),
  outbound('black1', 'Black', 'sealedCase', 1, 169000),
  outbound('black2', 'Black', 'sealedCase', 2, 0),
  inbound('jumbo', 'Jumbo', 'box', 2, 47000), outbound('jumbo1', 'Jumbo', 'box', 2, 0),
  inbound('hobby', 'Hobby', 'box', 1, 13000), outbound('hobby1', 'Hobby', 'box', 1, 0),
  inbound('remaining', 'Remaining', 'sealedCase', 9, 563200),
  inbound('boxes', 'Boxes', 'box', 32, 393800), inbound('gift', 'Gift', 'box', 1, 0),
  inbound('supplies', 'Supplies', 'supply', 1779, 78560),
];
context.inventoryCache = records;
const before = JSON.stringify(records);
const result = context.buildInventorySummary(records);
assert.equal(result.totalCost, 1035560);
assert.equal(result.pendingCost, 0);
assert.equal(result.boxQty, 33);
assert.equal(result.sealedCaseQty, 9);
assert.equal(result.supplyQty, 1779);
assert.equal(['sealedCase', 'box', 'card', 'supply'].flatMap(t => context.buildInventoryTypeDetails(t)).reduce((sum, row) => sum + row.totalCost, 0), result.totalCost);
assert.equal(JSON.stringify(records), before);
const partial = [inbound('part', 'Partial', 'box', 6, 75), { ...outbound('out', 'Partial', 'box', 2, 0), sourceInventoryId: 'part' }];
assert.equal(context.buildInventorySummary(partial).totalCost, 50);
partial[1].sourceQuantityUsed = 0.5;
assert.equal(context.buildInventorySummary(partial).totalCost, 68.75);
assert.equal(context.isInventoryCostMissing({ totalCost: 0 }), false);
assert.equal(context.isInventoryCostMissing({ totalCost: '0' }), false);
assert.equal(context.isInventoryCostMissing({}), true);
console.log('Inventory cost regression tests passed.');
