import { chromium } from 'playwright';

const BASE = 'https://room-delta-bay.vercel.app';
const TIMEOUT = 20000;

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  const ctxA = await browser.newContext({ permissions: ['microphone', 'camera'], viewport: { width: 1280, height: 720 } });
  const pageA = await ctxA.newPage();
  
  const ctxB = await browser.newContext({ permissions: ['microphone', 'camera'], viewport: { width: 1280, height: 720 } });
  const pageB = await ctxB.newPage();

  // Log all console for B
  pageB.on('console', msg => console.log(`[B:${msg.type()}] ${msg.text()}`));

  // Session A: Create room
  console.log('\n=== SESSION A ===');
  await pageA.goto(BASE, { waitUntil: 'networkidle', timeout: TIMEOUT });
  await pageA.locator('a[href="/create"]').first().click();
  await pageA.waitForURL('**/create', { timeout: 5000 });
  await pageA.fill('#roomName', 'Debug Test');
  await pageA.fill('#displayName', 'User A');
  await pageA.click('button[type="submit"]');
  await pageA.waitForURL('**/room/**', { timeout: TIMEOUT });
  const roomId = pageA.url().split('/').pop()!;
  console.log('Room created:', roomId);
  await pageA.waitForTimeout(3000);

  const inviteUrl = `${BASE}/join/${roomId}`;
  console.log('Invite URL:', inviteUrl);

  // Session B: Join room
  console.log('\n=== SESSION B ===');
  await pageB.goto(inviteUrl, { waitUntil: 'networkidle', timeout: TIMEOUT });
  await pageB.waitForTimeout(2000);
  
  // Fill and submit
  await pageB.fill('#joinDisplayName', 'User B');
  await pageB.click('button[type="submit"]:not([disabled])');
  
  // Wait for navigation to room
  await pageB.waitForURL('**/room/**', { timeout: TIMEOUT });
  console.log('B URL after join:', pageB.url());
  
  // Wait for page to settle
  await pageB.waitForTimeout(5000);

  // Dump full body text
  const bodyText = await pageB.locator('body').textContent() || '';
  console.log('\n=== B BODY TEXT (first 1000 chars) ===');
  console.log(bodyText.substring(0, 1000));
  
  // Check for specific elements
  console.log('\n=== B ELEMENT CHECKS ===');
  console.log('Has "Unauthorized":', bodyText.includes('Unauthorized'));
  console.log('Has "Room not found":', bodyText.includes('Room not found'));
  console.log('Has "Joining room":', bodyText.includes('Joining room'));
  console.log('Has "Connected":', bodyText.includes('Connected'));
  console.log('Has "Loading":', bodyText.includes('Loading'));
  console.log('Has "Go Home":', bodyText.includes('Go Home'));
  console.log('Has "Something went wrong":', bodyText.includes('Something went wrong'));
  console.log('Has TopBar:', await pageB.locator('header').count() > 0 || bodyText.includes('Room'));
  
  // Check for the specific Unauthorized message
  const hasAuth = bodyText.includes("You don't have permission");
  console.log('Has permission error:', hasAuth);

  // Check all buttons
  const buttons = await pageB.locator('button').allTextContents();
  console.log('Buttons on page:', buttons.join(' | '));
  
  // Check if it's the Unauthorized screen specifically
  const h2s = await pageB.locator('h2').allTextContents();
  console.log('H2 headings:', h2s.join(' | '));

  await browser.close();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
