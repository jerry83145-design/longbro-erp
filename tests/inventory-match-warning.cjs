const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/app.js'), 'utf8');
const overlays = [];
const context = vm.createContext({
  escapeHtml: text => String(text).replaceAll('<', '&lt;'),
  document: {
    createElement: () => ({ style: {}, addEventListener(type, callback) { this.click = callback; },
      querySelector: () => ({ focus() {} }), remove() { this.removed = true; } }),
    body: { appendChild: overlay => overlays.push(overlay) },
  },
});
for (const name of ['getInventoryMatchWarning', 'confirmInventoryMatchWarning']) {
  const start = source.indexOf(`function ${name}(`);
  vm.runInContext(source.slice(start, source.indexOf('\nfunction ', start + 1)), context);
}
const income = { type: 'income', item: 'Topps Hobby Box' };
const match = [{ lot: { name: 'TOPPS  Hobby box' } }];
const mismatch = [{ lot: { name: 'Topps Jumbo Box' } }];
assert.equal(context.getInventoryMatchWarning(income, match), '');
assert.ok(context.getInventoryMatchWarning(income, mismatch));
assert.ok(context.getInventoryMatchWarning(income, []));
assert.ok(context.getInventoryMatchWarning(income, [...match, ...mismatch]));
assert.equal(context.getInventoryMatchWarning({ type: 'expense' }, []), '');
assert.equal(context.getInventoryMatchWarning({ item: '手動出庫' }, mismatch), '');
assert.equal(context.getInventoryMatchWarning({ ...income, item: 'Ｔｏｐｐｓ Hobby Box' }, match), '');
(async () => {
  const before = JSON.stringify(mismatch);
  const canceled = context.confirmInventoryMatchWarning(income, mismatch);
  const dialog = overlays.at(-1);
  assert.ok(dialog.innerHTML.includes('Topps Jumbo Box'));
  dialog.click({ target: { closest: () => null } });
  assert.equal(dialog.removed, undefined);
  dialog.click({ target: { closest: selector => selector.includes('-no]') ? {} : null } });
  assert.equal(await canceled, false);
  assert.equal(JSON.stringify(mismatch), before);
  const approved = context.confirmInventoryMatchWarning(income, []);
  overlays.at(-1).click({ target: { closest: selector => selector.includes('-yes]') ? {} : null } });
  assert.equal(await approved, true);
  const count = overlays.length;
  assert.equal(await context.confirmInventoryMatchWarning(income, match), true);
  assert.equal(overlays.length, count);
  console.log('Inventory match warning tests passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
