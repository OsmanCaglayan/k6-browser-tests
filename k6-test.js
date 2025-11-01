import { browser } from 'k6/browser';
import { check } from 'k6';

export const options = {
  scenarios: {
    login_flow: {
      executor: 'shared-iterations',
      iterations: 1,
      options: {
        browser: {
          type: 'chromium',
          connect: {
            // Verbind met de Browserless container
            wsEndpoint: 'ws://localhost:3000/devtools/browser?token=test123',
          },
        },
      },
    },
  },
  thresholds: {
    browser_http_req_failed: ['rate<0.1'],
    browser_web_vital_lcp: ['p(95)<3000'],
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

    check(visible, { 'Login succesvol en dashboard zichtbaar': (v) => v === true });

    await page.screenshot({ path: 'saucedemo-dashboard.png' });
    console.log('Titel:', await page.title());
    console.log('URL na login:', page.url());
  } finally {
    await page.close();
  }
}
