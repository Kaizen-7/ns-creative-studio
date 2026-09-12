const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadFunction(name) {
  const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist in index.html`);

  const bodyStart = html.indexOf('{', html.indexOf(') {', start));
  let depth = 0;
  for (let i = bodyStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') depth--;
    if (depth === 0) return vm.runInNewContext(`(${html.slice(start, i + 1)})`);
  }
  throw new Error(`Could not extract ${name}`);
}

test('price list keeps generous typography when the content fits naturally', () => {
  const computePriceListLayout = loadFunction('computePriceListLayout');

  const layout = computePriceListLayout({ availableH: 1100, itemCounts: [4, 4] });

  assert.equal(layout.scale, 1);
  assert.equal(layout.categoryFont, 34);
  assert.equal(layout.itemFont, 31);
  assert.equal(layout.contentH, 732);
  assert.equal(layout.overflow, false);
});

test('price list scales spacing and type together to fit denser content', () => {
  const computePriceListLayout = loadFunction('computePriceListLayout');

  const layout = computePriceListLayout({ availableH: 1050, itemCounts: [4, 4, 4] });

  assert.ok(layout.scale < 1);
  assert.ok(layout.scale > 0.72);
  assert.equal(layout.contentH, 1050);
  assert.equal(layout.overflow, false);
  assert.ok(layout.rowH < 72);
  assert.ok(layout.categoryGap < 48);
});

test('price list reports overflow instead of shrinking below its legibility floor', () => {
  const computePriceListLayout = loadFunction('computePriceListLayout');

  const layout = computePriceListLayout({ availableH: 1050, itemCounts: [6, 6, 6, 6] });

  assert.equal(layout.scale, 0.72);
  assert.equal(layout.overflow, true);
  assert.ok(layout.contentH > 1050);
  assert.ok(layout.itemFont >= 22);
});
