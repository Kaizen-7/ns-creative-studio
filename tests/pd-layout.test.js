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
    if (depth === 0) {
      return vm.runInNewContext(`(${html.slice(start, i + 1)})`);
    }
  }
  throw new Error(`Could not extract ${name}`);
}

test('feed header gains safe top space and moves down with compact photos', () => {
  const computePdHeaderTop = loadFunction('computePdHeaderTop');

  const compact = computePdHeaderTop({ feed: true, height: 0 });
  const tall = computePdHeaderTop({ feed: true, height: 1 });

  assert.equal(compact, 120);
  assert.equal(tall, 72);
  assert.ok(compact > tall);
});

test('feed label chips anchor across the bottom-right photo border', () => {
  const computePdChipRect = loadFunction('computePdChipRect');
  const spacing = loadFunction('computePdSpacing')(true);

  const prima = computePdChipRect({
    boxX: 45, boxY: 200, boxW: 990, boxH: 300,
    labelW: 85, padX: spacing.chipPadX,
    height: spacing.chipHeight, rightInset: spacing.chipRightInset,
  });
  const dopo = computePdChipRect({
    boxX: 45, boxY: 600, boxW: 990, boxH: 300,
    labelW: 76, padX: spacing.chipPadX,
    height: spacing.chipHeight, rightInset: spacing.chipRightInset,
  });

  assert.equal(prima.x, 862);
  assert.equal(prima.y, 480);
  assert.equal(prima.w, 125);
  assert.equal(prima.h, 40);
  assert.equal(dopo.x, 871);
  assert.equal(dopo.y, 880);
  assert.equal(dopo.w, 116);
  assert.equal(dopo.h, 40);
  assert.equal(prima.y + prima.h/2, 500);
  assert.equal(dopo.y + dopo.h/2, 900);
});

test('story photos reclaim label space while keeping room for anchored chips', () => {
  const computePdPhotoLayout = loadFunction('computePdPhotoLayout');
  const spacing = loadFunction('computePdSpacing')(false);
  const layout = computePdPhotoLayout({
    W: 1080,
    H: 1920,
    topBlock: 220,
    bottomBlock: 343,
    sideMargin: 45,
    labelH: spacing.labelH,
    sectionGap: spacing.sectionGap,
    afterPhotos: spacing.afterBoxes,
    height: 0.8,
  });

  assert.equal(layout.boxW, 990);
  assert.equal(layout.photoH, 579);
  assert.equal(layout.firstPhotoY, layout.firstLabelY);
  assert.equal(layout.secondPhotoY, layout.secondLabelY);
  assert.ok(layout.secondPhotoY - (layout.firstPhotoY + layout.photoH + 22) >= 42);
  assert.ok(layout.secondPhotoY + layout.photoH <= 1920 - 343);
  assert.ok(layout.contentY - (layout.secondPhotoY + layout.photoH + 22) >= 60);
});

test('story redistributes freed photo height across all three vertical gaps', () => {
  const computePdPhotoLayout = loadFunction('computePdPhotoLayout');
  const spacing = loadFunction('computePdSpacing')(false);
  const input = {
    W: 1080,
    H: 1920,
    topBlock: 220,
    bottomBlock: 343,
    sideMargin: 45,
    labelH: spacing.labelH,
    sectionGap: spacing.sectionGap,
    afterPhotos: spacing.afterBoxes,
    freeTopShare: spacing.freeTopShare,
    freeMiddleShare: spacing.freeMiddleShare,
    freeBottomShare: spacing.freeBottomShare,
  };

  const compact = computePdPhotoLayout({ ...input, height: 0 });
  const tall = computePdPhotoLayout({ ...input, height: 1 });
  const topGap = layout => layout.firstPhotoY - input.topBlock;
  const middleGap = layout => layout.secondPhotoY - layout.firstPhotoY - layout.photoH;
  const bottomGap = layout => layout.contentY - layout.secondPhotoY - layout.photoH;

  assert.ok(topGap(compact) > topGap(tall));
  assert.ok(middleGap(compact) > middleGap(tall));
  assert.ok(bottomGap(compact) > bottomGap(tall));
  assert.ok(Math.abs(compact.contentY - tall.contentY) < 0.001);
});

test('feed photos reclaim label space while keeping room for anchored chips', () => {
  const computePdPhotoLayout = loadFunction('computePdPhotoLayout');
  const spacing = loadFunction('computePdSpacing')(true);
  const layout = computePdPhotoLayout({
    W: 1080,
    H: 1350,
    topBlock: 174,
    bottomBlock: 262,
    sideMargin: 45,
    labelH: spacing.labelH,
    sectionGap: spacing.sectionGap,
    afterPhotos: spacing.afterBoxes,
    height: 0.8,
  });

  assert.equal(layout.photoH, 405);
  assert.equal(layout.firstPhotoY, layout.firstLabelY);
  assert.equal(layout.secondPhotoY, layout.secondLabelY);
  assert.ok(layout.secondPhotoY - (layout.firstPhotoY + layout.photoH + 20) >= 36);
  assert.ok(layout.secondPhotoY + layout.photoH <= 1350 - 262);
  assert.ok(layout.contentY - (layout.secondPhotoY + layout.photoH + 20) >= 48);
});

test('feed height control changes the photos across its full range', () => {
  const computePdPhotoLayout = loadFunction('computePdPhotoLayout');
  const spacing = loadFunction('computePdSpacing')(true);
  const input = {
    W: 1080,
    H: 1350,
    topBlock: 174,
    bottomBlock: 262,
    sideMargin: 45,
    labelH: spacing.labelH,
    sectionGap: spacing.sectionGap,
    afterPhotos: spacing.afterBoxes,
  };

  const compact = computePdPhotoLayout({ ...input, height: 0 });
  const tall = computePdPhotoLayout({ ...input, height: 1 });

  assert.equal(compact.photoH, 309);
  assert.equal(tall.photoH, 429);
  assert.ok(compact.firstLabelY > tall.firstLabelY);
  assert.ok(compact.secondLabelY > tall.secondLabelY);
});
