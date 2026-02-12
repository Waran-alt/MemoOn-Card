import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(SCRIPT_DIR, '..');

// Load audit-specific env first, then fallback to regular frontend env.
loadEnv({ path: path.join(FRONTEND_DIR, '.env.layout-audit') });
loadEnv({ path: path.join(FRONTEND_DIR, '.env') });

const BASE_URL = process.env.LAYOUT_AUDIT_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002';
const LOCALE = process.env.LAYOUT_AUDIT_LOCALE || 'en';
const TARGET_PATH = process.env.LAYOUT_AUDIT_PATH || `/${LOCALE}/app`;
const OUT_DIR =
  process.env.LAYOUT_AUDIT_OUT_DIR || path.resolve(process.cwd(), '../private/layout-audit');
const PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPassword123!';
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'layout@test.local';
const LOGIN_EMAIL = process.env.LAYOUT_AUDIT_EMAIL || '';
const ALLOW_REGISTER = process.env.LAYOUT_AUDIT_ALLOW_REGISTER === '1';

const STATES = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, openMenu: false },
  { name: 'mobile-menu-closed', viewport: { width: 390, height: 844 }, openMenu: false },
  { name: 'mobile-menu-open', viewport: { width: 390, height: 844 }, openMenu: true },
];

const TARGETS = [
  { name: 'sidebar', selector: 'aside', all: false },
  { name: 'header', selector: 'header', all: false },
  { name: 'main', selector: 'main', all: false },
  { name: 'menuToggle', selector: 'button[aria-label="Open menu"], button[aria-label="Close menu"]', all: false },
  { name: 'navLinks', selector: 'aside nav a', all: true },
  { name: 'signOutButtons', selector: 'aside button', all: true },
  { name: 'contentCards', selector: 'main .mc-study-surface, main .mc-study-card-front, main .mc-study-card-back', all: true },
  { name: 'contentButtons', selector: 'main button, main a', all: true },
];

function parseEmailParts(email) {
  const [name, domain] = email.split('@');
  if (!name || !domain) {
    return { name: 'layout', domain: 'test.local' };
  }
  return { name, domain };
}

function uniqueEmail(seedBase) {
  const seed = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const { name, domain } = parseEmailParts(seedBase);
  return `${name}+${seed}@${domain}`;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForAppReady(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('main');
  try {
    await page.waitForFunction(
      () => {
        const root = document.documentElement;
        return root.dataset.e2eShellReady === '1' || window.location.pathname.includes('/login');
      },
      undefined,
      { timeout: 15000 }
    );
  } catch (error) {
    const details = await page.evaluate(() => ({
      url: window.location.href,
      pathname: window.location.pathname,
      e2eShellReady: document.documentElement.dataset.e2eShellReady || null,
      e2eRoute: document.documentElement.dataset.e2eRoute || null,
      e2eLocale: document.documentElement.dataset.e2eLocale || null,
    }));
    throw new Error(
      `App shell readiness marker missing: ${JSON.stringify(details)}; original=${String(error)}`
    );
  }

  if ((await page.url()).includes('/login')) {
    throw new Error(`Not authenticated for protected route; landed on login: ${await page.url()}`);
  }

  try {
    await page.waitForFunction(
      ({ targetPath }) => {
        const root = document.documentElement;
        const route = root.dataset.e2eRoute || '';
        const locale = root.dataset.e2eLocale || '';
        const probeSize = document.getElementById('e2e-style-probe-size');
        const probeBreakpoint = document.getElementById('e2e-style-probe-breakpoint');
        if (!probeSize || !probeBreakpoint) return false;

        const sizeStyle = window.getComputedStyle(probeSize);
        const breakpointStyle = window.getComputedStyle(probeBreakpoint);
        const expectedDesktop = window.innerWidth >= 768;
        const breakpointOk = expectedDesktop
          ? breakpointStyle.display === 'block'
          : breakpointStyle.display === 'none';

        return (
          locale.length > 0 &&
          route.includes(targetPath) &&
          sizeStyle.width === '16px' &&
          sizeStyle.height === '16px' &&
          breakpointOk
        );
      },
      { targetPath: TARGET_PATH },
      { timeout: 15000 }
    );
  } catch (error) {
    const details = await page.evaluate(() => {
      const root = document.documentElement;
      const probeSize = document.getElementById('e2e-style-probe-size');
      const probeBreakpoint = document.getElementById('e2e-style-probe-breakpoint');
      const probeSizeStyle = probeSize ? window.getComputedStyle(probeSize) : null;
      const probeBreakpointStyle = probeBreakpoint ? window.getComputedStyle(probeBreakpoint) : null;
      return {
        url: window.location.href,
        e2eShellReady: root.dataset.e2eShellReady || null,
        e2eRoute: root.dataset.e2eRoute || null,
        e2eLocale: root.dataset.e2eLocale || null,
        probeSizeExists: Boolean(probeSize),
        probeBreakpointExists: Boolean(probeBreakpoint),
        probeSizeWidth: probeSizeStyle?.width || null,
        probeSizeHeight: probeSizeStyle?.height || null,
        probeBreakpointDisplay: probeBreakpointStyle?.display || null,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      };
    });
    throw new Error(
      `App readiness style gate failed: ${JSON.stringify(details)}; original=${String(error)}`
    );
  }
}

async function ensureAuthenticated(page) {
  const targetUrl = `${BASE_URL}${TARGET_PATH}`;
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  if (!page.url().includes('/login')) return;

  async function attemptLoginViaApi(email) {
    const res = await page.context().request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email,
        password: PASSWORD,
      },
      failOnStatusCode: false,
    });
    return { ok: res.ok(), status: res.status() };
  }

  async function verifyAuth() {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    return !page.url().includes('/login');
  }

  if (LOGIN_EMAIL) {
    let loginStatus = 0;
    for (let i = 0; i < 3; i += 1) {
      const loginResult = await attemptLoginViaApi(LOGIN_EMAIL);
      loginStatus = loginResult.status;
      if (loginResult.ok && (await verifyAuth())) return;
      if (loginStatus === 429) await sleep(1200 * (i + 1));
    }
    throw new Error(
      `Could not authenticate for layout audit using LAYOUT_AUDIT_EMAIL=${LOGIN_EMAIL}. ` +
        `Last login status=${loginStatus}.`
    );
  }

  if (ALLOW_REGISTER) {
    const email = uniqueEmail(TEST_EMAIL);
    let registerStatus = 0;
    for (let i = 0; i < 3; i += 1) {
      const registerRes = await page.context().request.post(`${BASE_URL}/api/auth/register`, {
        data: {
          email,
          password: PASSWORD,
          name: 'Layout Audit',
        },
        failOnStatusCode: false,
      });
      registerStatus = registerRes.status();
      if (registerRes.ok() && (await verifyAuth())) return;
      if (registerStatus === 429) await sleep(1200 * (i + 1));
    }

    throw new Error(
      `Could not register/login audit user (status=${registerStatus}). ` +
        'Set LAYOUT_AUDIT_EMAIL to an existing account, or retry later if rate-limited.'
    );
  }

  throw new Error(
    'Auth required for layout audit. Set LAYOUT_AUDIT_EMAIL (existing account) and E2E_TEST_PASSWORD. ' +
      'If you want auto-register, run with LAYOUT_AUDIT_ALLOW_REGISTER=1.'
  );
}

async function collectAudit(page, stateName) {
  return page.evaluate(
    ({ targets, stateNameValue }) => {
      const pickStyles = [
        'display',
        'position',
        'boxSizing',
        'width',
        'maxWidth',
        'minWidth',
        'height',
        'marginTop',
        'marginRight',
        'marginBottom',
        'marginLeft',
        'paddingTop',
        'paddingRight',
        'paddingBottom',
        'paddingLeft',
        'gap',
        'justifyContent',
        'alignItems',
        'overflow',
        'overflowX',
        'overflowY',
        'zIndex',
      ];

      const entries = [];
      for (const target of targets) {
        const elements = Array.from(document.querySelectorAll(target.selector));
        const selected = target.all ? elements : elements.slice(0, 1);

        selected.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          const cs = window.getComputedStyle(el);
          const style = {};
          pickStyles.forEach((k) => {
            style[k] = cs[k];
          });
          entries.push({
            group: target.name,
            selector: target.selector,
            index,
            text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
            visible:
              cs.display !== 'none' &&
              cs.visibility !== 'hidden' &&
              Number.parseFloat(cs.opacity || '1') > 0 &&
              rect.width > 0 &&
              rect.height > 0,
            rect: {
              x: Math.round(rect.x * 100) / 100,
              y: Math.round(rect.y * 100) / 100,
              width: Math.round(rect.width * 100) / 100,
              height: Math.round(rect.height * 100) / 100,
              right: Math.round(rect.right * 100) / 100,
              bottom: Math.round(rect.bottom * 100) / 100,
            },
            style,
          });
        });
      }

      const visibleEntries = entries.filter((e) => e.visible);
      const isContaining = (outer, inner) =>
        outer.x <= inner.x &&
        outer.y <= inner.y &&
        outer.right >= inner.right &&
        outer.bottom >= inner.bottom;
      const overlaps = [];
      for (let i = 0; i < visibleEntries.length; i += 1) {
        for (let j = i + 1; j < visibleEntries.length; j += 1) {
          if (visibleEntries[i].group === visibleEntries[j].group) continue;
          const a = visibleEntries[i].rect;
          const b = visibleEntries[j].rect;
          if (isContaining(a, b) || isContaining(b, a)) continue;
          const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.x, b.x));
          const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y));
          const area = ix * iy;
          if (area > 64) {
            overlaps.push({
              a: `${visibleEntries[i].group}[${visibleEntries[i].index}]`,
              b: `${visibleEntries[j].group}[${visibleEntries[j].index}]`,
              area: Math.round(area * 100) / 100,
            });
          }
        }
      }

      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const scroll = {
        docWidth: document.documentElement.scrollWidth,
        docHeight: document.documentElement.scrollHeight,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };

      const offscreen = visibleEntries
        .filter((e) => e.rect.x < -1 || e.rect.right > viewport.width + 1)
        .map((e) => ({
          id: `${e.group}[${e.index}]`,
          rect: e.rect,
        }));

      return {
        state: stateNameValue,
        url: window.location.href,
        title: document.title,
        viewport,
        scroll,
        entries,
        overlaps,
        offscreen,
      };
    },
    { targets: TARGETS, stateNameValue: stateName }
  );
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await ensureAuthenticated(page);

  const reports = [];
  for (const state of STATES) {
    await page.setViewportSize(state.viewport);
    await page.goto(`${BASE_URL}${TARGET_PATH}`, { waitUntil: 'networkidle' });

    if (state.openMenu) {
      const openMenuButton = page.getByRole('button', { name: /open menu/i });
      if (await openMenuButton.count()) {
        await openMenuButton.click();
      }
    }

    await waitForAppReady(page);
    await page.waitForTimeout(150);
    const report = await collectAudit(page, state.name);
    reports.push(report);

    const screenshotPath = path.join(OUT_DIR, `${state.name}.png`);
    const jsonPath = path.join(OUT_DIR, `${state.name}.json`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  }

  const summaryPath = path.join(OUT_DIR, 'summary.json');
  await writeFile(
    summaryPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        targetPath: TARGET_PATH,
        states: reports.map((r) => ({
          state: r.state,
          url: r.url,
          hasHorizontalOverflow: r.scroll.hasHorizontalOverflow,
          overlaps: r.overlaps.length,
          offscreenNodes: r.offscreen.length,
          totalNodesCaptured: r.entries.length,
        })),
      },
      null,
      2
    ),
    'utf8'
  );

  await browser.close();
  console.log(`Layout audit written to ${OUT_DIR}`);
}

run().catch((error) => {
  console.error('Layout audit failed:', error);
  process.exit(1);
});

