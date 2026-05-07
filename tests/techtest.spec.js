const { test, expect } = require('@playwright/test');

const url = 'https://y-z-2026-05-07.cookieclickertechtest.airelogic.com';

const userName = 'Sri';
const numberOfCookieClicks = 3;
const sellAmount = 1;
const waitTimeInSeconds = 5;

//test.describe.configure({ mode: 'serial' });

const getCookieCount = async (page) => {
  const cookieText = page.locator('p', { hasText: /Cookies:/ });
  const text = await cookieText.textContent();

  return Number(text.match(/\d+/)[0]);
};

const getLeaderboardRows = (page) => {
  return page.locator('table tbody tr');
};

const getLeaderboardRow = (page, userName) => {
  return getLeaderboardRows(page).filter({ hasText: userName });
};

const getUserLink = (page, userName) => {
  return getLeaderboardRow(page, userName)
    .locator('a')
    .filter({ hasText: userName });
};

const getUserScore = async (page, userName) => {
  const scoreText = await getLeaderboardRow(page, userName)
    .locator('td')
    .nth(1)
    .textContent();

  return Number(scoreText.trim());
};

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

const getCookieButton = (page) => {
  return page.getByRole('button', { name: /click cookie!/i });
};

const clickCookieAndWait = async (page) => {
  const beforeClickCount = await getCookieCount(page);

  await getCookieButton(page).click();

  await expect.poll(async () => {
    return await getCookieCount(page);
  }).toBe(beforeClickCount + 1);
};

const clickCookieMultipleTimes = async (page, numberOfCookieClicks) => {
  for (let i = 0; i < numberOfCookieClicks; i++) {
    await clickCookieAndWait(page);
  }
};

const sellCookies = async (page, sellAmount) => {
  const initialCookieCount = await getCookieCount(page);

  const sellInput = page.locator('input').nth(0);

  await sellInput.fill(String(sellAmount));
  await expect(sellInput).toHaveValue(String(sellAmount));

  await page.getByRole('button', { name: /sell cookies!/i }).click();

  await expect.poll(async () => {
    return await getCookieCount(page);
  }).toBe(initialCookieCount - sellAmount);
};

const getFactoryCount = async (page) => {
  const factoryText = page.locator('p', { hasText: /Factories:/ });
  const text = await factoryText.textContent();

  return Number(text.match(/\d+/)[0]);
};

const buyFactories = async (page, factoryAmount) => {
  const factoryInput = page.locator('input').nth(1);

  await factoryInput.fill(String(factoryAmount));
  await expect(factoryInput).toHaveValue(String(factoryAmount));

  await page.getByRole('button', { name: /buy factories!/i }).click();
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

  let currentCookieCount = await getCookieCount(page);

  if (currentCookieCount === 0) {
    await clickCookieAndWait(page);
    currentCookieCount = await getCookieCount(page);
  }

  //const sellAmount = currentCookieCount - 1;
  const sellAmount = currentCookieCount;
  
  const sellInput = page.locator('input').nth(0);

  await sellInput.fill(String(sellAmount));

  await expect(sellInput).toHaveValue(String(sellAmount));

  await page.getByRole('button', {
    name: /sell cookies!/i
  }).click();

  await expect.poll(async () => {
    return await getCookieCount(page);
  }).toBe(currentCookieCount - sellAmount);
});

// To always be the last passing test of the pack as it runs the counter
test('Factory increases cookie generation rate over time', async ({ page }) => {
  await goToExistingUserGame(page, userName);

  const factoryAmount = 1;

  await buyFactories(page, factoryAmount);

  // Record initial cookie count and start time
  const initialCookieCount = await getCookieCount(page);

  const startTime = Date.now();

  await page.waitForTimeout(waitTimeInSeconds * 1000);

  // Record final cookie count and end time
  const finalCookieCount = await getCookieCount(page);

  const endTime = Date.now();

  // Calculate results
  const cookiesIncremented =
    finalCookieCount - initialCookieCount;

  const totalTimeInSeconds =
    (endTime - startTime) / 1000;

  const incrementRate =
    cookiesIncremented / totalTimeInSeconds;

  // Console output
  console.log(`Initial Cookie Count: ${initialCookieCount}`);

  console.log(`Final Cookie Count: ${finalCookieCount}`);

  console.log(`Cookies Incremented: ${cookiesIncremented}`);

  console.log(`Time Taken: ${totalTimeInSeconds} seconds`);

  console.log(
    `Cookie Increment Rate: ${incrementRate.toFixed(2)} cookies/second`
  );

  // Validation
  expect(cookiesIncremented).toBeGreaterThan(0);

});

test('User should not be created when navigating directly to game URL',  async ({ page }) => {

    const randomUserName = `User_${Date.now()}`;

    await page.goto(`${url}/game/${randomUserName}`);

    await expect(page).toHaveURL(
      `${url}/game/${randomUserName}`
    );

    await page.goto(url);

    const userLink = getUserLink(page, randomUserName);

    await expect(
      userLink,
      'BUG: User gets automatically created when navigating directly to /game/{username}'
    ).not.toBeVisible();

  }
);

// To always be the last test of the pack as it resets the counter
test('Existing user cookie counter should not reset after clicking Start button',  async ({ page }) => {

    const landingPageScore = await getUserScore(page, userName);

    expect(landingPageScore).toBeGreaterThan(0);

    await startGame(page, userName);

    const gameCookieCount = await getCookieCount(page);

    expect(
      gameCookieCount,
      'BUG: Existing user cookie counter resets to 0 after clicking Start button'
    ).toBe(landingPageScore);

  }
);