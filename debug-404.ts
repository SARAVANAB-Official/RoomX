import { chromium } from 'playwright';

const BASE = 'https://room-delta-bay.vercel.app';
const TIMEOUT = 20000;

async function main() {
  const browser = await chromium.launch({ headless: true });

  const ctx = await browser.newContext({
    permissions: ['microphone', 'camera'],
    viewport: { width: 1280, height: 720 },
  });
  const page = await ctx.newPage();

  const failedRequests: { url: string; method: string; status: number; resourceType: string; initiator: string }[] = [];

  page.on('response', (response) => {
    if (response.status() >= 400) {
      failedRequests.push({
        url: response.url(),
        method: response.request().method(),
        status: response.status(),
        resourceType: response.request().resourceType(),
        initiator: response.request().initiatorType() || 'unknown',
      });
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  // Create a room as Session A
  console.log('=== Creating room ===');
  const ctxA = await browser.newContext({ permissions: ['microphone', 'camera'], viewport: { width: 1280, height: 720 } });
  const pageA = await ctxA.newPage();
  await pageA.goto(BASE, { waitUntil: 'networkidle', timeout: TIMEOUT });
  await pageA.locator('a[href="/create"]').first().click();
  await pageA.waitForURL('**/create', { timeout: 5000 });
  await pageA.fill('#roomName', '404 Debug Test');
  await pageA.fill('#displayName', 'User A');
  await pageA.click('button[type="submit"]');
  await pageA.waitForURL('**/room/**', { timeout: TIMEOUT });
  const roomId = pageA.url().split('/').pop()!;
  console.log('Room created:', roomId);
  await pageA.waitForTimeout(2000);

  // Join as Session B (the session that shows the 404)
  console.log('\n=== Joining as Session B ===');
  const joinUrl = `${BASE}/join/${roomId}`;
  await page.goto(joinUrl, { waitUntil: 'networkidle', timeout: TIMEOUT });
  await page.waitForTimeout(2000);
  await page.fill('#joinDisplayName', 'User B');
  await page.click('button[type="submit"]:not([disabled])');
  await page.waitForURL('**/room/**', { timeout: TIMEOUT });
  console.log('B joined room');
  await page.waitForTimeout(3000);

  // Open chat panel on B (may trigger messages fetch)
  console.log('\n=== Opening chat on B ===');
  const chatBtn = page.locator('button:has(svg.lucide-message-square)').last();
  if (await chatBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await chatBtn.click();
    await page.waitForTimeout(2000);
  }

  // Send a message from A to trigger chat history
  console.log('\n=== Sending message from A ===');
  const chatBtnA = pageA.locator('button:has(svg.lucide-message-square)').last();
  if (await chatBtnA.isVisible({ timeout: 3000 }).catch(() => false)) {
    await chatBtnA.click();
    await pageA.waitForTimeout(1000);
    const chatInputA = pageA.locator('input[placeholder="Type a message..."]');
    if (await chatInputA.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chatInputA.fill('Debug message');
      await pageA.keyboard.press('Enter');
      await pageA.waitForTimeout(2000);
    }
  }

  // Leave room to trigger leave events
  console.log('\n=== B leaving room ===');
  const leaveBtn = page.locator('button:has(svg.lucide-log-out)').last();
  if (await leaveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await leaveBtn.click();
    await page.waitForTimeout(3000);
  }

  // Report
  console.log('\n========================================');
  console.log('  FAILED REQUESTS (status >= 400)');
  console.log('========================================');
  if (failedRequests.length === 0) {
    console.log('No failed requests detected.');
  } else {
    for (const req of failedRequests) {
      console.log(`\n  URL: ${req.url}`);
      console.log(`  Method: ${req.method}`);
      console.log(`  Status: ${req.status}`);
      console.log(`  Resource Type: ${req.resourceType}`);
      console.log(`  Initiator: ${req.initiator}`);
    }
  }

  await browser.close();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
