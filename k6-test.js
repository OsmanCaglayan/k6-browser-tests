import { check } from 'k6';
import { browser } from 'k6/browser';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    checks: ['rate==1'], 
  },
};

const USER = __ENV.SAUCE_USER || 'standard_user';
const PASS = __ENV.SAUCE_PASS || 'secret_sauce';

export default async function () {
  const context = await browser.newContext();
  let page;
  try {
    page = await context.newPage();

    await page.goto('https://www.saucedemo.com/', { waitUntil: 'load' });

    await page.locator('#user-name').type(USER);
    await page.locator('#password').type(PASS);
    await page.locator('#login-button').click();

    // wacht tot inventory zichtbaar is en doe 1 check
    await page.waitForSelector('.inventory_list');
    check(page, { 'logged in (inventory visible)': (p) => p.url().includes('inventory') });
  } finally {
    if (page) await page.close();
    await context.close();
  }
}
