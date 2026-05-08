const { test, expect } = require('@playwright/test');

const purl =
  'https://x-y-2026-05-07.cookieclickertechtest.airelogic.com';

const userName = 'Sri';
const numberOfCookieClicks = 3;
const sellAmount = 1;
const factoryAmount = 1;
const waitTimeInSeconds = 5;
const moneyPerCookie = 0.25;

test('Performance: Landing page loads within acceptable time', async ({ page }) => {

  const startTime = Date.now();

  await page.goto(purl);

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

test('Factory increases cookie generation rate over time', async ({ page }) => {
  await goToExistingUserGame(page, userName);

  await buyFactories(page, factoryAmount);

  const initialCookieCount = await getCookieCount(page);
  const startTime = Date.now();

  await page.waitForTimeout(waitTimeInSeconds * 1000);

  const finalCookieCount = await getCookieCount(page);
  const endTime = Date.now();

  const cookiesIncremented = finalCookieCount - initialCookieCount;
  const totalTimeInSeconds = (endTime - startTime) / 1000;
  const incrementRate = cookiesIncremented / totalTimeInSeconds;

  console.log(`Initial Cookie Count: ${initialCookieCount}`);
  console.log(`Final Cookie Count: ${finalCookieCount}`);
  console.log(`Cookies Incremented: ${cookiesIncremented}`);
  console.log(`Time Taken: ${totalTimeInSeconds} seconds`);
  console.log(`Cookie Increment Rate: ${incrementRate.toFixed(2)} cookies/second`);

  expect(cookiesIncremented).toBeGreaterThan(0);
});