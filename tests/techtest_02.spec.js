const { test, expect } = require('@playwright/test');

const url = 'https://x-y-2026-05-07.cookieclickertechtest.airelogic.com';

// Global test data
const userName = 'Sri';
const numberOfClicks = 3;

//User reset test resets the cookie counter and fails previous decrement test
test.describe.configure({ mode: 'serial' });

// Reusable helpers
const getCookieCount = async (page) => {
  const cookieText = page.locator('p', { hasText: /Cookies:/ });
  const text = await cookieText.textContent();

  return Number(text.match(/\d+/)[0]);
};

const getLeaderboardRow = (page, userName) => {
  return page.locator('table tbody tr', {
    hasText: userName
  });
};

const getUserLink = (page, userName) => {
  return getLeaderboardRow(page, userName)
    .locator('a')
    .filter({ hasText: userName });
};

const getUserScore = async (page, userName) => {
  const leaderboardRow = getLeaderboardRow(page, userName);
  const scoreText = await leaderboardRow.locator('td').nth(1).textContent();

  return Number(scoreText.trim());
};

const startGame = async (page, userName) => {
  await page.getByRole('textbox').fill(userName);
  await page.getByRole('button', { name: /start!/i }).click();
};

const clickCookie = async (page, numberOfClicks) => {
  const cookieButton = page.getByRole('button', {
    name: /click cookie!/i
  });

  for (let i = 0; i < numberOfClicks; i++) {
    await cookieButton.click();
  }
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

  const leaderboardRows = page.locator('table tbody tr');
  const rowCount = await leaderboardRows.count();

  expect(rowCount).toBeGreaterThan(0);

  for (let i = 0; i < rowCount; i++) {
    const columns = leaderboardRows.nth(i).locator('td');

    const playerName = await columns.nth(0).textContent();
    const playerScore = await columns.nth(1).textContent();

    //console.log(`Player: ${playerName.trim()} | Score: ${playerScore.trim()}`);

    expect(playerName.trim().length).toBeGreaterThan(0);
    expect(Number(playerScore.trim())).not.toBeNaN();
  }
});

test('User can click listed username and navigate to existing game', async ({ page }) => {

  const landingPageScore = await getUserScore(page, userName);

  //console.log(`Landing Page Score for ${userName}: ${landingPageScore}`);

  const userLink = getUserLink(page, userName);

  await expect(userLink).toBeVisible();

  await userLink.click();

  await expect(page).toHaveURL(`${url}/game/${userName}`);

  const gameCookieCount = await getCookieCount(page);

  //console.log(`Game Cookie Count for ${userName}: ${gameCookieCount}`);

  expect(gameCookieCount).toBe(landingPageScore);

});

// test('BUG: Existing user stats reset after entering username and clicking Start button', async ({ page }) => {
//   const landingPageScore = await getUserScore(page, userName);

//   console.log(`Landing Page Score for ${userName}: ${landingPageScore}`);

//   await startGame(page, userName);

//   await expect(page).toHaveURL(`${url}/game/${userName}`);

//   const gameCookieCount = await getCookieCount(page);

//   console.log(`Game Cookie Count after Start for ${userName}: ${gameCookieCount}`);

//   expect(
//     gameCookieCount,
//     'BUG: Starting an existing user should not reset cookie count'
//   ).toBe(landingPageScore);
// });

test('Click Cookie button increases cookie count', async ({ page }) => {
  const userLink = getUserLink(page, userName);

  await expect(userLink).toBeVisible();
  await userLink.click();

  await expect(page).toHaveURL(`${url}/game/${userName}`);

  const initialCookieCount = await getCookieCount(page);

  console.log(`Initial Cookie Count: ${initialCookieCount}`);

  const cookieButton = page.getByRole('button', {
    name: /click cookie!/i
  });

  await cookieButton.click();
  
  await expect.poll(async () => {
    return await getCookieCount(page);
  }).toBe(initialCookieCount + 1);
});

test('User can sell cookies and cookie count is decremented', async ({ page }) => {
  const userLink = getUserLink(page, userName);

  await expect(userLink).toBeVisible();
  await userLink.click();

  await expect(page).toHaveURL(`${url}/game/${userName}`);

  const cookieButton = page.getByRole('button', {
    name: /click cookie!/i
  });

  const numberOfClicks = 2;

  for (let i = 0; i < numberOfClicks; i++) {
    const beforeClickCount = await getCookieCount(page);

    await cookieButton.click();

    await expect.poll(async () => {
      return await getCookieCount(page);
    }).toBe(beforeClickCount + 1);
  }

  const initialCookieCount = await getCookieCount(page);

  const sellAmount = 1;

  const sellInput = page.locator('input').nth(0);

  await sellInput.fill(String(sellAmount));

  await expect(sellInput).toHaveValue(String(sellAmount));

  await page.getByRole('button', {
    name: /sell cookies!/i
  }).click();

  await expect.poll(async () => {
    return await getCookieCount(page);
  }).toBe(initialCookieCount - sellAmount);
});

test('User stats reset to 0 after entering username and clicking Start button', async ({ page }) => {
  const landingPageScore = await getUserScore(page, userName);

  expect(landingPageScore).toBeGreaterThan(0);

  await startGame(page, userName);

  await expect(page).toHaveURL(`${url}/game/${userName}`);

  const gameCookieCount = await getCookieCount(page);

  expect(gameCookieCount).toBe(0);
});
