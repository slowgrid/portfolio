import assert from 'node:assert/strict';
import { isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = process.env.PLAYWRIGHT_MODULE || 'playwright';
const { chromium } = await import(isAbsolute(source) ? pathToFileURL(source).href : source).catch((error) => {
  throw new Error('Playwright is required. Install playwright or set PLAYWRIGHT_MODULE to its index.mjs file.', { cause: error });
});
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

try {
  const response = await page.goto(process.argv[2] || 'http://localhost:5173', { waitUntil: 'networkidle' });
  assert.equal(response.ok(), true, 'Portfolio responds successfully');
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

  assert.equal(await page.locator('.system-map, .depth-scene, .depth-accent, .motion-toggle').count(), 0, 'Hero diagram and 3D decorations are removed');
  assert.equal(await page.locator('main h1').isVisible(), true, 'Main heading remains visible');

  const navigation = page.locator('.desktop-nav a[href^="#"]');
  assert.ok(await navigation.count(), 'Desktop section navigation exists');
  for (const link of await navigation.all()) {
    const target = await link.getAttribute('href');
    assert.equal(await page.locator(target).count(), 1, `${target} has one destination`);
    await link.click();
    assert.equal(new URL(page.url()).hash, target, `${target} link navigates`);
  }
  await page.locator('.logo').click();
  await page.waitForFunction(() => !document.querySelector('.desktop-nav a[aria-current="location"]'));
  assert.equal(await page.evaluate(() => scrollY), 0, 'Logo returns to document beginning');
  await navigation.first().click();
  await page.waitForFunction(() => document.querySelector('.desktop-nav a').getAttribute('aria-current') === 'location');

  const disclosures = page.locator('details');
  assert.ok(await disclosures.count(), 'Native project details exist');
  for (const detail of await disclosures.all()) {
    const wasOpen = await detail.evaluate((element) => element.open);
    await detail.locator('summary').click();
    assert.equal(await detail.evaluate((element) => element.open), !wasOpen, 'Details toggles');
    await detail.locator('summary').click();
    assert.equal(await detail.evaluate((element) => element.open), wasOpen, 'Details closes again');
    if (!wasOpen) await detail.locator('summary').click();
  }

  const previews = page.locator('.gallery-item');
  assert.ok(await previews.count(), 'Project image previews exist');
  for (const trigger of await previews.all()) {
    await trigger.click();
    await page.waitForFunction(() => {
      const dialog = document.querySelector('.image-lightbox');
      const image = dialog?.querySelector('img');
      return dialog?.open && image?.complete && image.naturalWidth > 0;
    });
    assert.equal(await page.locator('.image-lightbox img').getAttribute('src'), await trigger.locator('img').evaluate((image) => image.currentSrc || image.src));
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.image-lightbox').open);
    assert.equal(await trigger.evaluate((element) => document.activeElement === element), true, 'Escape restores preview focus');
  }
  await previews.first().click();
  await page.locator('.lightbox-close').click();
  assert.equal(await page.locator('.image-lightbox').evaluate((dialog) => dialog.open), false, 'Close button closes preview');
  for (const detail of await disclosures.all()) await detail.locator('summary').click();

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `No horizontal overflow at ${width}px`);
    for (const detail of await disclosures.all()) await detail.locator('summary').click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `No expanded-detail overflow at ${width}px`);
    for (const detail of await disclosures.all()) await detail.locator('summary').click();
  }

  const toggle = page.locator('.menu-toggle');
  const menu = page.locator('.mobile-nav');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(await toggle.innerText(), '메뉴 닫기');
  assert.equal(await menu.isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await menu.isVisible(), false);
  assert.equal(await toggle.innerText(), '메뉴 열기');
  assert.equal(await toggle.evaluate((element) => document.activeElement === element), true, 'Escape restores menu focus');
  await toggle.click();
  await menu.locator('a[href^="#"]').first().click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'Mobile link closes menu');
  await toggle.click();
  await page.setViewportSize({ width: 768, height: 900 });
  await page.waitForFunction(() => document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'false');
  assert.equal(await menu.getAttribute('hidden') !== null, true, 'Desktop resize resets mobile menu');

  const email = page.locator('.email-button');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError'); } } }));
  const previousUrl = page.url();
  await email.click();
  await page.waitForFunction(() => document.querySelector('.toast').textContent.includes('복사하지 못했습니다'));
  assert.equal(page.url(), previousUrl, 'Clipboard denial does not navigate away');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { window.copiedEmail = text; } } }));
  await email.click();
  await page.waitForFunction(() => document.querySelector('.toast').textContent === '이메일 주소를 복사했습니다.');
  assert.equal(await page.evaluate(() => window.copiedEmail), await email.getAttribute('data-email'));
  await page.waitForTimeout(1200);
  await email.click();
  await page.waitForTimeout(1300);
  assert.equal(await page.locator('.toast').evaluate((element) => element.classList.contains('show')), true, 'Repeated copy resets toast timer');

  for (const image of await page.locator('img[src]').all()) {
    if (!(await image.isVisible())) continue;
    await image.scrollIntoViewIfNeeded();
    assert.equal(await image.evaluate((element) => element.complete && element.naturalWidth > 0), true, 'Visible image loads');
  }
  assert.deepEqual(errors, [], 'No browser errors');
  console.log('PASS: clean hero, navigation, details, image zoom/focus, mobile menu, clipboard fallback, four viewport widths, images, and browser errors.');
} finally {
  await browser.close();
}
