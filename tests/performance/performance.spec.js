const { test, expect } = require('@playwright/test');

const url =
  'https://x-y-2026-05-07.cookieclickertechtest.airelogic.com';

test('Performance: Landing page loads within acceptable time', async ({ page }) => {

  const startTime = Date.now();

  await page.goto(url);

  await expect(page).toHaveTitle(/Cookie Clicker/);

  const endTime = Date.now();

  const pageLoadTime = endTime - startTime;

  console.log(`Landing Page Load Time: ${pageLoadTime} ms`);

  // Performance threshold: 3 seconds
  expect(
    pageLoadTime,
    'BUG: Landing page load time exceeded acceptable threshold'
  ).toBeLessThan(3000);

});