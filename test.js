// save as saucedemo.browser.test.js
import { check, sleep } from 'k6';
import { browser } from 'k6/browser';

// ▶ Scenarios + thresholds (web vitals & fouten)
export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations', // eenvoudig: 1 iteratie per VU
      vus: 1,
      iterations: 1,
      maxDuration: '2m',
      options: {
        browser: { type: 'chromium' },
      },
    },
  },
  thresholds: {
    'checks': ['rate==1'],                                   // alle checks moeten slagen
    'browser_http_req_failed': ['rate==0'],                  // geen mislukte browser-requests
    'browser_web_vital_lcp': ['p(90)<2500'],                // LCP < 2.5s (90p)
    'browser_web_vital_cls': ['avg<0.1'],                   // visuele stabiliteit
    'browser_web_vital_ttfb': ['p(90)<1500'],               // TTFB < 1.5s
  },
};

// Handige helper voor standaard inloggegevens
const USERNAME = __ENV.SAUCE_USER || 'standard_user';
const PASSWORD = __ENV.SAUCE_PASS || 'secret_sauce';

export default async function () {
  const context = browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  try {
    const page = await context.newPage();

    // 1) Open loginpagina
    await page.goto('https://www.saucedemo.com/', { waitUntil: 'load' });
    check(page, {
      'login page loaded': (p) => p.url().includes('saucedemo.com'),
    });

    // 2) Inloggen
    await page.locator('#user-name').type(USERNAME);
    await page.locator('#password').type(PASSWORD);
    await page.locator('#login-button').click();
    await page.waitForSelector('.inventory_list');

    check(page, {
      'logged in (inventory visible)': (p) => p.url().includes('inventory'),
    });

    // 3) Item toevoegen aan winkelmand
    // Kies het eerste product op de pagina
    const firstAddBtn = page.locator('.inventory_item .btn_inventory').first();
    await firstAddBtn.click();

    // Cart badge moet "1" tonen
    const cartBadge = page.locator('.shopping_cart_badge');
    await cartBadge.waitFor({ state: 'visible' });
    const qty = await cartBadge.textContent();
    check(qty, { 'cart has 1 item': (t) => t.trim() === '1' });

    // 4) Naar cart en afrekenen
    await page.locator('.shopping_cart_link').click();
    await page.waitForSelector('.cart_list');
    await page.locator('#checkout').click();

    await page.waitForSelector('#first-name');
    await page.locator('#first-name').type('Ada');
    await page.locator('#last-name').type('Lovelace');
    await page.locator('#postal-code').type('1011AB');
    await page.locator('#continue').click();

    // 5) Overzicht → Finish
    await page.waitForSelector('.summary_info');
    check(page, { 'overview page loaded': (p) => p.url().includes('checkout-step-two') });

    await page.locator('#finish').click();

    // 6) Bevestiging
    await page.waitForSelector('.complete-header');
    const doneText = await page.locator('.complete-header').textContent();
    check(doneText, { 'order complete': (t) => /thank you/i.test(t) });

    // korte pauze (kan helpen om timings te stabiliseren)
    sleep(1);
  } finally {
    await context.close();
  }
}
