const { test, expect } = require('@playwright/test');

const url ='https://x-y-2026-05-07.cookieclickertechtest.airelogic.com';

// Global test data
const userName = 'Sri';
const numberOfClicks = 3;

// Helper function to retrieve cookie count
const getCookieCount = async (page) => {
  const cookieText = page.locator('p', {
    hasText: /Cookies:/
  });

  const text = await cookieText.textContent();

  return Number(text.match(/\d+/)[0]);
};

test.beforeEach(async ({ page }) => {
  await page.goto(url);
});

test('Page loads successfully', async ({ page }) => {
  await expect(page).toHaveTitle(/Cookie Clicker/);
});

test(
  'Listed usernames and scores are displayed under Player Score section',
  async ({ page }) => {

    await expect(
      page.getByRole('columnheader', { name: 'Player' })
    ).toBeVisible();

    await expect(
      page.getByRole('columnheader', { name: 'Score' })
    ).toBeVisible();

    const leaderboardRows = page.locator('table tbody tr');

    const rowCount = await leaderboardRows.count();

    expect(rowCount).toBeGreaterThan(0);

    for (let i = 0; i < rowCount; i++) {

      const columns = leaderboardRows.nth(i).locator('td');

      const playerName = await columns.nth(0).textContent();
      const playerScore = await columns.nth(1).textContent();

      console.log(
        `Player: ${playerName.trim()} | Score: ${playerScore.trim()}`
      );

      expect(playerName.trim().length).toBeGreaterThan(0);

      expect(
        Number(playerScore.trim())
      ).not.toBeNaN();
    }
  }
);

test('User can click listed username and navigate to existing game', async ({ page }) => {
  const leaderboardRow = page.locator('table tbody tr', {
    hasText: userName
  });

  await expect(leaderboardRow).toBeVisible();

  const scoreText = await leaderboardRow.locator('td').nth(1).textContent();
  const landingPageScore = Number(scoreText.trim());

  console.log(await leaderboardRow.innerHTML());

  const userLink = leaderboardRow.locator('a').filter({
    hasText: userName
  });

  await expect(userLink).toBeVisible();

  await userLink.click();

  await expect(page).toHaveURL(`${url}/game/${userName}`);

  const gameCookieCount = await getCookieCount(page);

  expect(gameCookieCount).toBe(landingPageScore);
});

// test('User can enter username and click Start button', async ({ page }) => {
//   const nameField = page.getByRole('textbox');

//   const leaderboardRow = page.locator('table tbody tr', {
//     hasText: userName
//   });

//   const scoreText = await leaderboardRow.locator('td').nth(1).textContent();
//   const landingPageScore = Number(scoreText.trim());

//   await nameField.fill(userName);

//   await expect(nameField).toHaveValue(userName);

//   await page.getByRole('button', { name: /start!/i }).click();

//   await expect(page).toHaveURL(`${url}/game/${userName}`);

//   await expect(page.locator(`text=Hello ${userName}`)).toBeVisible();

//   const cookieText = page.locator('p', {
//     hasText: /Cookies:/
//   });

//   const gameCookieText = await cookieText.textContent();
//   const gameCookieCount = Number(gameCookieText.match(/\d+/)[0]);

//   expect(gameCookieCount).toBe(landingPageScore);
// });

test('Click Cookie button increases cookie count', async ({ page }) => {

  // Navigate directly to game page
  await page.goto(`${url}/game/${userName}`);

  // Locate cookie button
  const cookieButton = page.getByRole('button', {
    name: /click cookie!/i
  });

  // Click cookie button multiple times
  for (let i = 0; i < numberOfClicks; i++) {
    await cookieButton.click();
  }

  // Get cookie count before leaving page
  const savedCookieCount = await getCookieCount(page);

  // Verify cookies increased
  expect(savedCookieCount).toBeGreaterThan(0);

  // Navigate back to landing page
  await page.goto(url);

  // // Re-enter same username
  // await page.getByRole('textbox').fill(userName);

  // // Click Start button
  // await page.getByRole('button', {
  //   name: /start!/i
  // }).click();

  await expect(userLink).toBeVisible();

  await userLink.click();

  // Verify navigation back to same user game
  await expect(page).toHaveURL(`${url}/game/${userName}`);

  // Get cookie count after returning
  const actualCookieCount = await getCookieCount(page);

  // Verify cookie count is preserved
  // This currently fails due to application bug
  expect(actualCookieCount).toBe(savedCookieCount);
});