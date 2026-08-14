import { chromium } from 'playwright';

const BASE = 'https://room-delta-bay.vercel.app';
const TIMEOUT = 20000;

async function main() {
  const browser = await chromium.launch({ headless: true });

  const ctxA = await browser.newContext({ permissions: ['microphone', 'camera'], viewport: { width: 1280, height: 720 } });
  const pageA = await ctxA.newPage();
  const ctxB = await browser.newContext({ permissions: ['microphone', 'camera'], viewport: { width: 1280, height: 720 } });
  const pageB = await ctxB.newPage();

  const failedB: { url: string; method: string; status: number; resourceType: string }[] = [];

  pageB.on('response', (response) => {
    if (response.status() >= 400) {
      failedB.push({
        url: response.url(),
        method: response.request().method(),
        status: response.status(),
        resourceType: response.request().resourceType(),
      });
    }
  });

  // Create room as A
  await pageA.goto(BASE, { waitUntil: 'networkidle', timeout: TIMEOUT });
  await pageA.locator('a[href="/create"]').first().click();
  await pageA.waitForURL('**/create', { timeout: 5000 });
  await pageA.fill('#roomName', '404 Debug 2');
  await pageA.fill('#displayName', 'User A');
  await pageA.click('button[type="submit"]');
  await pageA.waitForURL('**/room/**', { timeout: TIMEOUT });
  const roomId = pageA.url().split('/').pop()!;
  console.log('Room:', roomId);
  await pageA.waitForTimeout(2000);

  // Join as B
  await pageB.goto(`${BASE}/join/${roomId}`, { waitUntil: 'networkidle', timeout: TIMEOUT });
  await pageB.waitForTimeout(2000);
  await pageB.fill('#joinDisplayName', 'User B');
  await pageB.click('button[type="submit"]:not([disabled])');
  await pageB.waitForURL('**/room/**', { timeout: TIMEOUT });
  await pageB.waitForTimeout(3000);
  console.log('B joined');

  // Open chat on B
  const chatBtnB = pageB.locator('button:has(svg.lucide-message-square)').last();
  if (await chatBtnB.isVisible({ timeout: 3000 }).catch(() => false)) {
    await chatBtnB.click();
    await pageB.waitForTimeout(1000);
  }
  console.log('Chat opened on B');

  // Send message from A
  const chatBtnA = pageA.locator('button:has(svg.lucide-message-square)').last();
  if (await chatBtnA.isVisible({ timeout: 3000 }).catch(() => false)) {
    await chatBtnA.click();
    await pageA.waitForTimeout(1000);
    const input = pageA.locator('input[placeholder="Type a message..."]');
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill('Hello');
      await pageA.keyboard.press('Enter');
      await pageA.waitForTimeout(2000);
    }
  }
  console.log('Message sent from A');

  // B leaves
  const leaveBtn = pageB.locator('button:has(svg.lucide-log-out)').last();
  if (await leaveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await leaveBtn.click();
    await pageB.waitForURL('**/', { timeout: TIMEOUT });
    console.log('B left');
  }
  await pageB.waitForTimeout(2000);

  // Reconnect test on A (the part where B30 404 happens)
  console.log('=== RECONNECT TEST ON A ===');
  const cdp = await ctxA.newCDPSession(pageA);
  await cdp.send('Network.enable');
  await pageA.route('**/*', route => route.abort());
  await pageA.waitForTimeout(4000);
  await pageA.unroute('**/*');
  await cdp.detach();
  await pageA.waitForTimeout(5000);
  console.log('Reconnect done');

  // Final dump
  console.log('\n========================================');
  console.log('  ALL 4xx/5xx RESPONSES ON SESSION B');
  console.log('========================================');
  if (failedB.length === 0) {
    console.log('NONE - all requests succeeded.');
  } else {
    for (const r of failedB) {
      console.log(`  ${r.method} ${r.url} -> ${r.status} (${r.resourceType})`);
    }
  }

  await browser.close();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
