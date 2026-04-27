import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Login first? Wait, the app probably requires login.
  // Is it using Supabase auth? We might be redirected to login.
  // We can try visiting the page and logging in if needed.
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text(), msg.location());
    } else {
      console.log('CONSOLE:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message, err.stack);
  });

  await page.goto('http://localhost:3001/paie/fin-de-contrat', { waitUntil: 'networkidle' });
  
  // Wait to see if there's a login form
  if (page.url().includes('login')) {
    console.log("Redirected to login. Attempting to log in...");
    // Attempt standard login if possible. We might need credentials.
    await page.fill('input[type="email"]', 'yobed.sarl@gmail.com');
    // I recall the user had a conversation "Recovering Local Login Credentials" indicating they used:
    // admin@profne.ci or yobed.sarl@gmail.com
    await page.fill('input[type="password"]', 'password123'); // Or whatever the local db uses
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log("Logged in, current URL:", page.url());
  }

  // Go to fin-de-contrat again just in case
  if (!page.url().includes('fin-de-contrat')) {
    await page.goto('http://localhost:3001/paie/fin-de-contrat', { waitUntil: 'networkidle' });
  }

  // Click on the first employee button
  console.log("Clicking the first employee in the list...");
  const employeeButtons = await page.$$('button:has-text("#")');
  if (employeeButtons.length > 0) {
    await employeeButtons[0].click();
    console.log("Clicked first employee.");
    // Wait a bit to observe errors
    await page.waitForTimeout(3000);
  } else {
    console.log("No employees found to click.");
  }
  
  await browser.close();
})();
