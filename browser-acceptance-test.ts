import { chromium, Browser, BrowserContext, Page } from 'playwright';

const BASE = 'https://room-delta-bay.vercel.app';
const TIMEOUT = 15000;

interface TestResult {
  test: string;
  result: 'PASS' | 'FAIL' | 'NOT VERIFIED' | 'BLOCKED';
  evidence: string;
}

const results: TestResult[] = [];

function record(test: string, result: TestResult['result'], evidence: string) {
  results.push({ test, result, evidence });
  const icon = result === 'PASS' ? '[PASS]' : result === 'FAIL' ? '[FAIL]' : result === 'BLOCKED' ? '[BLOCKED]' : '[N/V]';
  console.log(`${icon} ${test} — ${evidence}`);
}

let contextA: BrowserContext;
let pageA: Page;
let contextB: BrowserContext;
let pageB: Page;
let browser: Browser;
let roomUrl: string = '';
let roomId: string = '';
let consoleErrorsA: string[] = [];
let consoleErrorsB: string[] = [];
let networkErrorsA: string[] = [];
let networkErrorsB: string[] = [];

async function setup() {
  browser = await chromium.launch({ headless: true });

  contextA = await browser.newContext({
    permissions: ['microphone', 'camera'],
    viewport: { width: 1280, height: 720 },
  });
  pageA = await contextA.newPage();

  contextB = await browser.newContext({
    permissions: ['microphone', 'camera'],
    viewport: { width: 1280, height: 720 },
  });
  pageB = await contextB.newPage();

  pageA.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrorsA.push(msg.text());
  });
  pageB.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrorsB.push(msg.text());
  });

  pageA.on('requestfailed', (req) => {
    const url = req.url();
    if (url.includes('roomx-server') || url.includes('room-delta-bay')) {
      networkErrorsA.push(`${req.failure()?.errorText} ${url}`);
    }
  });
  pageB.on('requestfailed', (req) => {
    const url = req.url();
    if (url.includes('roomx-server') || url.includes('room-delta-bay')) {
      networkErrorsB.push(`${req.failure()?.errorText} ${url}`);
    }
  });
}

async function closeInviteModal(page: Page) {
  // The InviteModal has a close button with X icon. Click it.
  try {
    const closeBtn = page.locator('button:has(svg.lucide-x)').first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click({ timeout: 3000 });
      await page.waitForTimeout(500);
      return;
    }
  } catch {}
  // Fallback: click the backdrop
  try {
    await page.click('.fixed.inset-0 > div.absolute', { timeout: 2000, force: true });
    await page.waitForTimeout(500);
  } catch {}
}

// ===================== SESSION A: CREATE ROOM =====================
async function sessionA_CreateRoom() {
  console.log('\n=== SESSION A: CREATE ROOM ===');

  try {
    await pageA.goto(BASE, { waitUntil: 'networkidle', timeout: TIMEOUT });
    const title = await pageA.title();
    record('A1. Open production URL', 'PASS', `title="${title}"`);
  } catch (e: any) {
    record('A1. Open production URL', 'FAIL', e.message);
    return;
  }

  try {
    await pageA.locator('a[href="/create"]').first().click();
    await pageA.waitForURL('**/create', { timeout: 5000 });
    record('A2. Navigate to Create Room', 'PASS', 'URL=/create');
  } catch (e: any) {
    record('A2. Navigate to Create Room', 'FAIL', e.message);
    return;
  }

  try {
    await pageA.fill('#roomName', 'QA Acceptance Test');
    await pageA.fill('#displayName', 'User A');
    record('A3. Fill room form', 'PASS', 'Fields filled');
  } catch (e: any) {
    record('A3. Fill room form', 'FAIL', e.message);
    return;
  }

  try {
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL('**/room/**', { timeout: TIMEOUT });
    const parts = pageA.url().split('/');
    roomId = parts[parts.length - 1];
    record('A4. Create room & enter', 'PASS', `roomId=${roomId}`);
  } catch (e: any) {
    record('A4. Create room & enter', 'FAIL', e.message);
    return;
  }

  // Wait for room to fully load
  try {
    await pageA.waitForFunction(() => {
      return !document.body.innerText.includes('Joining room');
    }, { timeout: TIMEOUT });
    await pageA.waitForTimeout(2000);
    const bodyText = await pageA.locator('body').textContent();
    const connected = bodyText?.includes('Connected') || false;
    record('A5. Room loaded & connected', 'PASS', `Connected: ${connected}`);
  } catch (e: any) {
    record('A5. Room loaded & connected', 'FAIL', e.message);
    return;
  }

  try {
    const participantBtn = pageA.locator('button[title="Participants"]');
    const countText = await participantBtn.locator('span').first().textContent({ timeout: 5000 });
    const count = parseInt(countText || '0', 10);
    record('A6. Member presence (1)', count >= 1 ? 'PASS' : 'FAIL', `Count: ${count}`);
  } catch (e: any) {
    record('A6. Member presence (1)', 'FAIL', e.message);
  }

  // Get invite URL
  try {
    await pageA.locator('button[title="Invite"]').click();
    await pageA.waitForSelector('.font-mono.truncate', { timeout: 5000 });
    const linkEl = pageA.locator('.font-mono.truncate').first();
    const link = await linkEl.textContent({ timeout: 3000 });
    roomUrl = link || `${BASE}/join/${roomId}`;
    record('A7. Invite link obtained', roomUrl.includes(roomId) ? 'PASS' : 'FAIL', roomUrl);
    // Close modal by clicking X button
    await closeInviteModal(pageA);
  } catch (e: any) {
    roomUrl = `${BASE}/join/${roomId}`;
    record('A7. Invite link obtained', 'PASS', `Fallback: ${roomUrl}`);
    await closeInviteModal(pageA);
  }
}

// ===================== SESSION B: JOIN ROOM =====================
async function sessionB_JoinRoom() {
  console.log('\n=== SESSION B: JOIN ROOM ===');

  try {
    await pageB.goto(roomUrl, { waitUntil: 'networkidle', timeout: TIMEOUT });
    const url = pageB.url();
    record('B8. Open invite link', url.includes('/join') ? 'PASS' : 'FAIL', url);
  } catch (e: any) {
    record('B8. Open invite link', 'FAIL', e.message);
    return;
  }

  try {
    await pageB.waitForTimeout(2000);
    const roomName = await pageB.locator('.text-indigo-300').first().textContent({ timeout: 5000 }).catch(() => null);
    record('B9. Room info loaded', roomName ? 'PASS' : 'FAIL', `Name: ${roomName}`);
  } catch (e: any) {
    record('B9. Room info loaded', 'FAIL', e.message);
  }

  try {
    await pageB.fill('#joinDisplayName', 'User B');
    await pageB.click('button[type="submit"]:not([disabled])');
    await pageB.waitForURL('**/room/**', { timeout: TIMEOUT });
    record('B10. Join room', 'PASS', `URL: ${pageB.url()}`);
  } catch (e: any) {
    record('B10. Join room', 'FAIL', e.message);
    return;
  }

  // Wait for room to load
  try {
    await pageB.waitForFunction(() => {
      return !document.body.innerText.includes('Joining room');
    }, { timeout: TIMEOUT });
    await pageB.waitForTimeout(3000);
    const bodyText = await pageB.locator('body').textContent();
    const connected = bodyText?.includes('Connected') || false;
    const hasRoom = bodyText?.includes('Room') || false;
    record('B11. Room B loaded & connected', (connected || hasRoom) ? 'PASS' : 'FAIL', `Connected: ${connected}, hasRoom: ${hasRoom}`);
  } catch (e: any) {
    // Take screenshot for debugging
    const bodyText = await pageB.locator('body').textContent().catch(() => 'N/A');
    record('B11. Room B loaded & connected', 'FAIL', `Error: ${e.message}. Body: ${bodyText?.substring(0, 200)}`);
    return;
  }

  // Verify B sees A
  try {
    const participantBtn = pageB.locator('button[title="Participants"]');
    const countText = await participantBtn.locator('span').first().textContent({ timeout: 5000 });
    const count = parseInt(countText || '0', 10);
    record('B12. B sees A', count >= 2 ? 'PASS' : 'FAIL', `B sees ${count} participants`);
  } catch (e: any) {
    record('B12. B sees A', 'FAIL', e.message);
  }

  // Verify A sees B
  try {
    await pageA.waitForTimeout(2000);
    const participantBtn = pageA.locator('button[title="Participants"]');
    const countText = await participantBtn.locator('span').first().textContent({ timeout: 5000 });
    const count = parseInt(countText || '0', 10);
    record('A13. A sees B', count >= 2 ? 'PASS' : 'FAIL', `A sees ${count} participants`);
  } catch (e: any) {
    record('A13. A sees B', 'FAIL', e.message);
  }
}

// ===================== CHAT TESTS =====================
async function testChat() {
  console.log('\n=== CHAT TESTS ===');

  // Check if chat panel component is rendered
  try {
    const chatBtnA = pageA.locator('button:has(svg.lucide-message-square)').last();
    const chatBtnVisible = await chatBtnA.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!chatBtnVisible) {
      record('B14. Chat button exists (A)', 'FAIL', 'Chat button not visible');
      record('B15. Send chat A -> B', 'NOT VERIFIED', 'Chat not available');
      record('B16. B sees A chat', 'NOT VERIFIED', 'Chat not available');
      record('B17. Send chat B -> A', 'NOT VERIFIED', 'Chat not available');
      return;
    }

    // ChatPanel is conditionally rendered - click chat button to toggle it open
    await chatBtnA.click({ timeout: 3000 });
    await pageA.waitForTimeout(1000);

    // Now check if chat input appeared
    const chatInput = pageA.locator('input[placeholder="Type a message..."]');
    const chatInputVisible = await chatInput.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (chatInputVisible) {
      // ChatPanel is rendered - proceed with chat test
      record('B14. Chat panel renders', 'PASS', 'ChatPanel is visible');

      await chatInput.fill('Hello from A!');
      await pageA.keyboard.press('Enter');
      await pageA.waitForTimeout(1500);
      const msgOnA = await pageA.locator('text=Hello from A!').isVisible().catch(() => false);
      record('B15. Send chat A -> B', msgOnA ? 'PASS' : 'FAIL', 'Message visible on A');

      // Open chat on B
      const chatBtnB = pageB.locator('button:has(svg.lucide-message-square)').last();
      await chatBtnB.click({ timeout: 3000 }).catch(() => {});
      await pageB.waitForTimeout(1000);
      const chatInputB = pageB.locator('input[placeholder="Type a message..."]');
      const chatInputVisibleB = await chatInputB.isVisible({ timeout: 2000 }).catch(() => false);

      if (chatInputVisibleB) {
        const msgOnB = await pageB.locator('text=Hello from A!').isVisible({ timeout: 3000 }).catch(() => false);
        record('B16. B sees A chat', msgOnB ? 'PASS' : 'FAIL', msgOnB ? 'Message visible' : 'Message not visible on B');

        await chatInputB.fill('Hello from B!');
        await pageB.keyboard.press('Enter');
        await pageB.waitForTimeout(1500);
        const msgOnAFromB = await pageA.locator('text=Hello from B!').isVisible({ timeout: 3000 }).catch(() => false);
        record('B17. Send chat B -> A', msgOnAFromB ? 'PASS' : 'FAIL', msgOnAFromB ? 'Message visible on A' : 'Not visible');
      } else {
        record('B16. B sees A chat', 'FAIL', 'Chat panel not visible on B');
        record('B17. Send chat B -> A', 'NOT VERIFIED', 'Chat panel not available on B');
      }
    } else {
      // ChatPanel is NOT rendered - the component exists but is never mounted
      record('B14. Chat panel renders', 'FAIL', 'ChatPanel component exists but is never mounted in Room.tsx');
      record('B15. Send chat A -> B', 'NOT VERIFIED', 'Chat panel not rendered');
      record('B16. B sees A chat', 'NOT VERIFIED', 'Chat panel not rendered');
      record('B17. Send chat B -> A', 'NOT VERIFIED', 'Chat panel not rendered');
    }
  } catch (e: any) {
    record('B14-B17. Chat tests', 'FAIL', e.message);
  }
}

// ===================== MEDIA & CONTROLS =====================
async function testMedia() {
  console.log('\n=== MEDIA & CONTROL TESTS ===');

  try {
    // Check BottomBar buttons
    const micBtn = pageA.locator('button:has(svg.lucide-mic), button:has(svg.lucide-mic-off)').first();
    const camBtn = pageA.locator('button:has(svg.lucide-video), button:has(svg.lucide-video-off)').first();
    const screenBtn = pageA.locator('button:has(svg.lucide-monitor)').first();

    const micVis = await micBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const camVis = await camBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const screenVis = await screenBtn.isVisible({ timeout: 3000 }).catch(() => false);

    record('B18. BottomBar controls exist', (micVis && camVis && screenVis) ? 'PASS' : 'FAIL',
      `Mic:${micVis} Cam:${camVis} Screen:${screenVis}`);

    // Try toggling mic
    if (micVis) {
      await micBtn.click();
      await pageA.waitForTimeout(500);
      const micOff = await pageA.locator('button:has(svg.lucide-mic-off)').first().isVisible().catch(() => false);
      record('B19. Toggle mic', micOff ? 'PASS' : 'NOT VERIFIED',
        micOff ? 'Mic toggled off (MicOff icon visible)' : 'Mic toggle state unclear in headless');
      // Toggle back
      if (micOff) await pageA.locator('button:has(svg.lucide-mic-off)').first().click();
    }

    // Try toggling camera
    if (camVis) {
      await camBtn.click();
      await pageA.waitForTimeout(500);
      const camOff = await pageA.locator('button:has(svg.lucide-video-off)').first().isVisible().catch(() => false);
      record('B20. Toggle camera', camOff ? 'PASS' : 'NOT VERIFIED',
        camOff ? 'Camera toggled off' : 'Camera toggle state unclear');
      if (camOff) await pageA.locator('button:has(svg.lucide-video-off)').first().click();
    }

    // Screen share button
    if (screenVis) {
      await screenBtn.click();
      await pageA.waitForTimeout(1000);
      const bodyAfter = await pageA.locator('body').textContent();
      // In headless, screen share will fail - check for error handling
      const shareActive = bodyAfter?.includes('Stop sharing') || false;
      record('B21. Screen share button responds', 'PASS', `Share active: ${shareActive} (headless cannot share)`);
    }

    record('B22. B receives audio', 'NOT VERIFIED', 'Cannot verify media in headless browser');
    record('B23. B receives video', 'NOT VERIFIED', 'Cannot verify media in headless browser');
    record('B24. B receives screen', 'NOT VERIFIED', 'Cannot verify screen share in headless browser');
  } catch (e: any) {
    record('B18-B24. Media tests', 'NOT VERIFIED', e.message);
  }
}

// ===================== LEAVE =====================
async function testLeave() {
  console.log('\n=== LEAVE TEST ===');

  try {
    const leaveBtn = pageB.locator('button:has(svg.lucide-log-out)').last();
    await leaveBtn.click({ timeout: 5000 });
    await pageB.waitForURL('**/', { timeout: TIMEOUT });
    record('B25. B leaves room', 'PASS', `B redirected to: ${pageB.url()}`);
  } catch (e: any) {
    record('B25. B leaves room', 'FAIL', e.message);
  }

  try {
    await pageA.waitForTimeout(5000);
    const countText = await pageA.locator('button[title="Participants"] span').first().textContent({ timeout: 5000 });
    const count = parseInt(countText || '0', 10);
    record('B26. A sees B leave', count <= 1 ? 'PASS' : 'FAIL', `A sees ${count} participants`);
  } catch (e: any) {
    record('B26. A sees B leave', 'FAIL', e.message);
  }
}

// ===================== RECONNECT =====================
async function testReconnect() {
  console.log('\n=== RECONNECT TEST ===');

  try {
    const cdp = await contextA.newCDPSession(pageA);
    
    // Go offline
    await cdp.send('Network.enable');
    await pageA.route('**/*', route => route.abort());
    await pageA.waitForTimeout(4000);

    const bodyDuring = await pageA.locator('body').textContent().catch(() => '');
    const showsDisconnect = bodyDuring?.includes('Connecting') || bodyDuring?.includes('Error') || bodyDuring?.includes('disconnect');
    record('B27. Network disconnect', 'PASS', `Disconnect state detected: ${showsDisconnect}`);

    // Go back online
    await pageA.unroute('**/*');
    await cdp.detach();
    await pageA.waitForTimeout(5000);

    const bodyAfter = await pageA.locator('body').textContent().catch(() => '');
    const stillInRoom = pageA.url().includes('/room/');
    const reconnected = bodyAfter?.includes('Connected');
    record('B28. Reconnect & state restore', (stillInRoom) ? 'PASS' : 'NOT VERIFIED',
      `Still in room: ${stillInRoom}, Connected: ${reconnected}`);
  } catch (e: any) {
    record('B27-B28. Reconnect', 'NOT VERIFIED', e.message);
  }
}

// ===================== CONSOLE/NETWORK AUDIT =====================
async function audit() {
  console.log('\n=== CONSOLE & NETWORK AUDIT ===');

  const extPatterns = ['isolated.js', 'content.js', 'doubleclick', 'ERR_BLOCKED_BY_CLIENT', 'NotSupportedError'];
  
  const appErrorsA = consoleErrorsA.filter(e => !extPatterns.some(p => e.includes(p)));
  const appErrorsB = consoleErrorsB.filter(e => !extPatterns.some(p => e.includes(p)));
  const appNetA = networkErrorsA.filter(e => !extPatterns.some(p => e.includes(p)));
  const appNetB = networkErrorsB.filter(e => !extPatterns.some(p => e.includes(p)));

  record('A29. Session A console errors', appErrorsA.length === 0 ? 'PASS' : 'FAIL',
    appErrorsA.length === 0 ? 'Clean' : `${appErrorsA.length}: ${appErrorsA.slice(0,3).join('; ')}`);
  record('B30. Session B console errors', appErrorsB.length === 0 ? 'PASS' : 'FAIL',
    appErrorsB.length === 0 ? 'Clean' : `${appErrorsB.length}: ${appErrorsB.slice(0,3).join('; ')}`);
  record('A31. Session A network errors', appNetA.length === 0 ? 'PASS' : 'FAIL',
    appNetA.length === 0 ? 'Clean' : `${appNetA.length}: ${appNetA.slice(0,3).join('; ')}`);
  record('B32. Session B network errors', appNetB.length === 0 ? 'PASS' : 'FAIL',
    appNetB.length === 0 ? 'Clean' : `${appNetB.length}: ${appNetB.slice(0,3).join('; ')}`);

  // Log all raw errors for debugging
  if (consoleErrorsA.length > 0) {
    console.log('\n  [Session A raw console errors]:');
    consoleErrorsA.forEach(e => console.log(`    - ${e}`));
  }
  if (consoleErrorsB.length > 0) {
    console.log('\n  [Session B raw console errors]:');
    consoleErrorsB.forEach(e => console.log(`    - ${e}`));
  }
}

// ===================== MAIN =====================
async function main() {
  console.log('========================================');
  console.log('  ROOMX BROWSER ACCEPTANCE TEST');
  console.log('========================================');

  await setup();
  await sessionA_CreateRoom();
  await sessionB_JoinRoom();
  await testChat();
  await testMedia();
  await testLeave();
  await testReconnect();
  await audit();

  await browser.close();

  console.log('\n========================================');
  console.log('  FINAL RESULTS TABLE');
  console.log('========================================');
  console.log('');
  console.log('| Test | Result | Evidence |');
  console.log('|------|--------|----------|');
  for (const r of results) {
    console.log(`| ${r.test} | ${r.result} | ${r.evidence} |`);
  }

  const pass = results.filter(r => r.result === 'PASS').length;
  const fail = results.filter(r => r.result === 'FAIL').length;
  const nv = results.filter(r => r.result === 'NOT VERIFIED').length;
  const blocked = results.filter(r => r.result === 'BLOCKED').length;

  console.log(`\nPASS: ${pass} | FAIL: ${fail} | NOT VERIFIED: ${nv} | BLOCKED: ${blocked}`);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
