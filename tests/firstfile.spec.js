const {test, expect} = require ('@playwright/test')
//const {hello, helloworld} = require('./demo/hello')
//import {hello, helloworld} from '@playwright/test'
//import {hello, helloworld} from './demo/hello'
//console.log (hello());
//console.log (helloworld());

//import { test, expect } from '@playwright/test';
test('My first test',async({page})=> {
await page.goto('https://www.espncricinfo.com/')
await expect(page).toHaveTitle(/ESPNcricinfo/);
});

// test('has title', async ({ page }) => {
//   await page.goto('https://playwright.dev/');

//   // Expect a title "to contain" a substring.
//   await expect(page).toHaveTitle(/Playwright/);
// });

// test('My first test', async ({ page }) => {
//   await page.goto('https://www.espncricinfo.com/', {
//     waitUntil: 'domcontentloaded',
//     timeout: 60000
//   });

//   await expect(page).toHaveTitle(/ESPNcricinfo/, {
//     timeout: 30000
//   });
// });