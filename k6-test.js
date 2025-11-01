import { browser } from 'k6/browser';
import { check } from 'k6';

export const options = {
  scenarios: {
    login_flow: {
      executor: 'shared-iterations',
      iterations: 1,
      options: {
        browser: { type: 'chromium' },
      },
    },
  },
  thresholds: {
    browser_http_req_failed: ['rate<0.1'],     // max 10% fouten
    browser_web_vital_lcp: ['p(95)<3000'],     // LCP < 3s
  },
};

export default async function () {
  const page = await browser.newPage();

  try {
    await page.goto('https://www.saucedemo.com/');
    await page.locator('#user-name').type('standard_user');
    await page.locator('#password').type('secret_sauce');
    await page.locator('#login-button').click();

    await page.waitForLoadState('networkidle');
    const visible = await page.locator('.inventory_list').isVisible();

    check(visible, {
      '✅ Login succesvol en dashboard zichtbaar': (v) => v === true,
    });
  } finally {
    await page.close();
  }
}
