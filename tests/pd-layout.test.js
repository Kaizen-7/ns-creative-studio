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

test('circle labels split to opposite sides so the before chip avoids the overlap', () => {
  const computePdChipRect = loadFunction('computePdChipRect');
  const spacing = loadFunction('computePdSpacing')(true);

  const prima = computePdChipRect({
    boxX: 130, boxY: 220, boxW: 500, boxH: 500,
    labelW: 85, padX: spacing.chipPadX,
    height: spacing.chipHeight, rightInset: 22, side: 'left',
  });
  const dopo = computePdChipRect({
    boxX: 450, boxY: 586, boxW: 500, boxH: 500,
    labelW: 76, padX: spacing.chipPadX,
    height: spacing.chipHeight, rightInset: 22, side: 'right',
  });

  assert.equal(prima.x, 152);
  assert.equal(dopo.x, 812);
  assert.ok(prima.x + prima.w < dopo.x);
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

test('pinch distance scales photo zoom in both directions within safe limits', () => {
  const computePinchZoom = loadFunction('computePinchZoom');

  assert.equal(computePinchZoom({
    startZoom: 1,
    startDistance: 100,
    currentDistance: 180,
  }), 1.8);
  assert.equal(computePinchZoom({
    startZoom: 1,
    startDistance: 100,
    currentDistance: 40,
  }), 0.6);
  assert.equal(computePinchZoom({
    startZoom: 2,
    startDistance: 100,
    currentDistance: 200,
  }), 3);
});

test('photo styles derive distinct hit areas from the same before-after slots', () => {
  const computePdStyleGeometry = loadFunction('computePdStyleGeometry');
  const input = {
    style: 'classic',
    boxX: 45,
    boxW: 990,
    boxH: 405,
    firstY: 220,
    secondY: 681,
  };

  const classic = computePdStyleGeometry({ ...input, classicShape: 'rect', feed: true });
  const classicSquare = computePdStyleGeometry({ ...input, classicShape: 'square', feed: true });
  const oval = computePdStyleGeometry({ ...input, style: 'oval', feed: true });
  const storyOval = computePdStyleGeometry({ ...input, style: 'oval', feed: false });
  const circles = computePdStyleGeometry({ ...input, style: 'circles' });

  assert.deepEqual({ ...classic.prima }, { x:45, y:220, w:990, h:405, shape:'roundRect' });
  assert.deepEqual({ ...classicSquare.prima }, { x:45, y:220, w:547, h:405, shape:'roundRect' });
  assert.deepEqual({ ...classicSquare.dopo }, { x:488, y:681, w:547, h:405, shape:'roundRect' });
  assert.deepEqual({ ...oval.prima }, { x:160, y:220, w:760, h:405, shape:'ellipse' });
  assert.deepEqual({ ...storyOval.prima }, { x:105, y:220, w:870, h:405, shape:'ellipse' });
  assert.deepEqual({ ...circles.prima }, { x:130, y:220, w:500, h:500, shape:'ellipse' });
  assert.deepEqual({ ...circles.dopo }, { x:450, y:586, w:500, h:500, shape:'ellipse' });
});

test('photo underfill keeps a blurred cover layer behind the zoomed image', () => {
  const computeImageDrawRect = loadFunction('computeImageDrawRect');
  const box = { x:100, y:200, w:800, h:400 };

  const background = computeImageDrawRect({
    imageW: 712, imageH: 419, ...box, zoom: 1.12, ox: 0, oy: 0,
  });
  const foreground = computeImageDrawRect({
    imageW: 712, imageH: 419, ...box, zoom: 0.6, ox: 0, oy: 0,
  });

  assert.ok(background.w >= box.w);
  assert.ok(background.h >= box.h);
  assert.ok(foreground.w < box.w || foreground.h < box.h);
  assert.equal(foreground.x + foreground.w/2, box.x + box.w/2);
  assert.equal(foreground.y + foreground.h/2, box.y + box.h/2);
});
