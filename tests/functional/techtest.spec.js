const { test, expect } = require('@playwright/test');

const url = 'https://y-z-2026-05-07.cookieclickertechtest.airelogic.com';

const userName = 'Sri';
const numberOfCookieClicks = 3;
const sellAmount = 1;
const factoryAmount = 1;
const waitTimeInSeconds = 5;
const moneyPerCookie = 0.25;

// Reusable locators/helpers
const getCookieCount = async (page) => {
  const text = await page.locator('p', { hasText: /Cookies:/ }).textContent();
  return Number(text.match(/\d+/)[0]);
};

const getMoneyValue = async (page) => {
  const text = await page.locator('p', { hasText: /Money:/ }).textContent();
  return Number(text.match(/\$([\d.]+)/)[1]);
};

const getFactoryCount = async (page) => {
  const text = await page.locator('p', { hasText: /Factories:/ }).textContent();
  return Number(text.match(/\d+/)[0]);
};

const getLeaderboardRows = (page) => page.locator('table tbody tr');

const getLeaderboardRow = (page, userName) =>
  getLeaderboardRows(page).filter({ hasText: userName });

const getUserLink = (page, userName) =>
  getLeaderboardRow(page, userName).locator('a').filter({ hasText: userName });

const getUserScore = async (page, userName) => {
  const scoreText = await getLeaderboardRow(page, userName)
    .locator('td')
    .nth(1)
    .textContent();

  return Number(scoreText.trim());
};

const getSellInput = (page) => page.locator('input').nth(0);

const getFactoryInput = (page) => page.locator('input').nth(1);

const getCookieButton = (page) =>
  page.getByRole('button', { name: /click cookie!/i });

const getSellCookiesButton = (page) =>
  page.getByRole('button', { name: /sell cookies!/i });

const getBuyFactoriesButton = (page) =>
  page.getByRole('button', { name: /buy factories!/i });

const goToExistingUserGame = async (page, userName) => {
  const userLink = getUserLink(page, userName);

  await expect(userLink).toBeVisible();
  await userLink.click();

  await expect(page).toHaveURL(`${url}/game/${userName}`);
};

const startGame = async (page, userName) => {
  await page.getByRole('textbox').fill(userName);
  await page.getByRole('button', { name: /start!/i }).click();

  await expect(page).toHaveURL(`${url}/game/${userName}`);
};

const clickCookieAndWait = async (page) => {
  const beforeClickCount = await getCookieCount(page);

  await getCookieButton(page).click();

  await expect.poll(async () => getCookieCount(page)).toBe(beforeClickCount + 1);
};

const clickCookieMultipleTimes = async (page, numberOfCookieClicks) => {
  for (let i = 0; i < numberOfCookieClicks; i++) {
    await clickCookieAndWait(page);
  }
};

const enterSellAmount = async (page, amount) => {
  const sellInput = getSellInput(page);

  await sellInput.fill(String(amount));
  await expect(sellInput).toHaveValue(String(amount));
};

const sellCookies = async (page, amount) => {
  const initialCookieCount = await getCookieCount(page);

  await enterSellAmount(page, amount);
  await getSellCookiesButton(page).click();

  await expect.poll(async () => getCookieCount(page)).toBe(
    initialCookieCount - amount
  );
};

const ensureCookiesAvailable = async (page, minimumCookieCount = 1) => {
  let currentCookieCount = await getCookieCount(page);

  while (currentCookieCount < minimumCookieCount) {
    await clickCookieAndWait(page);
    currentCookieCount = await getCookieCount(page);
  }

  return currentCookieCount;
};

const buyFactories = async (page, amount) => {
  const factoryInput = getFactoryInput(page);

  await factoryInput.fill(String(amount));
  await expect(factoryInput).toHaveValue(String(amount));

  await getBuyFactoriesButton(page).click();
};

const expectCookieCountToBe = async (page, expectedCount, message) => {
  await expect.poll(
    async () => getCookieCount(page),
    message ? { message } : undefined
  ).toBe(expectedCount);
};

test.beforeEach(async ({ page }) => {
  await page.goto(url);
});

test('Page loads successfully', async ({ page }) => {
  await expect(page).toHaveTitle(/Cookie Clicker/);
});

test('Listed usernames and scores are displayed under Player Score section', async ({ page }) => {
  await expect(page.getByRole('columnheader', { name: 'Player' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Score' })).toBeVisible();

  const leaderboardRows = getLeaderboardRows(page);
  const rowCount = await leaderboardRows.count();

  expect(rowCount).toBeGreaterThan(0);

  for (let i = 0; i < rowCount; i++) {
    const columns = leaderboardRows.nth(i).locator('td');

    const playerName = await columns.nth(0).textContent();
    const playerScore = await columns.nth(1).textContent();

    expect(playerName.trim().length).toBeGreaterThan(0);
    expect(Number(playerScore.trim())).not.toBeNaN();
  }
});

test('User can click listed username and navigate to existing game', async ({ page }) => {
  const landingPageScore = await getUserScore(page, userName);

  await goToExistingUserGame(page, userName);

  const gameCookieCount = await getCookieCount(page);

  expect(gameCookieCount).toBe(landingPageScore);
});

test('Click Cookie button increases cookie count', async ({ page }) => {
  await goToExistingUserGame(page, userName);

  const initialCookieCount = await getCookieCount(page);

  await clickCookieAndWait(page);

  const updatedCookieCount = await getCookieCount(page);

  expect(updatedCookieCount).toBe(initialCookieCount + 1);
});

test('User can sell cookies and cookie count is decremented', async ({ page }) => {
  await goToExistingUserGame(page, userName);

  await clickCookieMultipleTimes(page, numberOfCookieClicks);

  await sellCookies(page, sellAmount);
});

test('User can sell available cookies', async ({ page }) => {
  await goToExistingUserGame(page, userName);

  const currentCookieCount = await ensureCookiesAvailable(page);

  await enterSellAmount(page, currentCookieCount);
  await getSellCookiesButton(page).click();

  await expectCookieCountToBe(
    page,
    0,
    'BUG: User can not sell the same number of cookies that are available'
  );
});

test('Money value increases by $0.25 for every cookie sold', async ({ page }) => {
  await goToExistingUserGame(page, userName);

  await ensureCookiesAvailable(page, 2);

  const initialMoneyValue = await getMoneyValue(page);

  await enterSellAmount(page, sellAmount);
  await getSellCookiesButton(page).click();

  const expectedMoneyValue = initialMoneyValue + moneyPerCookie;

  await expect.poll(async () => getMoneyValue(page)).toBe(expectedMoneyValue);

  const updatedMoneyValue = await getMoneyValue(page);

  expect(updatedMoneyValue).toBe(expectedMoneyValue);
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

test('User should not be created when navigating directly to game URL', async ({ page }) => {
  const randomUserName = `User_${Date.now()}`;

  await page.goto(`${url}/game/${randomUserName}`);
  await expect(page).toHaveURL(`${url}/game/${randomUserName}`);

  await page.goto(url);

  const userLink = getUserLink(page, randomUserName);

  await expect(
    userLink,
    'BUG: User gets automatically created when navigating directly to /game/{username}'
  ).not.toBeVisible();
});

test('Existing user cookie counter should not reset after clicking Start button', async ({ page }) => {
  const landingPageScore = await getUserScore(page, userName);

  expect(landingPageScore).toBeGreaterThan(0);

  await startGame(page, userName);

  const gameCookieCount = await getCookieCount(page);

  expect(
    gameCookieCount,
    'BUG: Existing user cookie counter resets to 0 after clicking Start button'
  ).toBe(landingPageScore);
});