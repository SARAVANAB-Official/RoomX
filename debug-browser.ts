import { chromium } from 'playwright';

const BASE = 'https://room-delta-bay.vercel.app';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  
  const ctxB = await browser.newContext({ permissions: ['microphone', 'camera'], viewport: { width: 1280, height: 720 } });
  const pageB = await ctxB.newPage();
  
  // Log ALL console messages from B
  pageB.on('console', msg => console.log(`[B ${msg.type().toUpperCase()}]`, msg.text()));

  // First create a room with A so B has something to join
  const ctxA = await browser.newContext({ permissions: ['microphone', 'camera'] });
  const pageA = await ctxA.newPage();
  await pageA.goto(BASE, { waitUntil: 'networkidle' });
  await pageA.locator('a[href="/create"]').first().click();
  await pageA.waitForURL('**/create');
  await pageA.fill('#roomName', 'Debug Room 2');
  await pageA.fill('#displayName', 'User A');
  await pageA.click('button[type="submit"]');
  await pageA.waitForURL('**/room/**', { timeout: 15000 });
  const roomId = pageA.url().split('/').pop();
  console.log('Room:', roomId);
  await pageA.waitForTimeout(2000);

  // B: Go to join page
  await pageB.goto(`${BASE}/join/${roomId}`, { waitUntil: 'networkidle' });
  await pageB.waitForTimeout(1000);

  // Check Zustand state BEFORE join
  const preJoinState = await pageB.evaluate(() => {
    // Access Zustand store from window (it's a module, so we need to find it)
    // The store is attached to the React root
    const storeEl = document.querySelector('[data-reactroot]') || document.getElementById('root');
    return {
      url: window.location.href,
      hasRoot: !!storeEl,
    };
  });
  console.log('Pre-join state:', preJoinState);

  // Fill name and join
  await pageB.fill('#joinDisplayName', 'User B');
  await pageB.click('button[type="submit"]:not([disabled])');
  
  // Wait for navigation
  await pageB.waitForURL('**/room/**', { timeout: 15000 });
  console.log('After join URL:', pageB.url());
  
  // Check state immediately after navigation
  const postJoinImmediate = await pageB.evaluate(() => {
    return document.body.innerText.substring(0, 200);
  });
  console.log('Post-join immediate body:', postJoinImmediate);

  // Wait a bit
  await pageB.waitForTimeout(3000);
  const postJoin3s = await pageB.evaluate(() => {
    return document.body.innerText.substring(0, 200);
  });
  console.log('Post-join 3s body:', postJoin3s);

  // Try to access the store directly
  const storeCheck = await pageB.evaluate(() => {
    // Try to find the Zustand store through React fiber
    const root = document.getElementById('root');
    if (!root) return { error: 'no root' };
    
    // Try accessing through window.__ZUSTAND__ or similar
    // Actually, let's just check what React renders
    return {
      rootHTML: root.innerHTML.substring(0, 500),
    };
  });
  console.log('Store check:', storeCheck);

  await browser.close();
}

debug().catch(e => { console.error('Fatal:', e); process.exit(1); });
