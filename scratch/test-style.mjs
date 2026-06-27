import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Go to login page
  console.log("Navigating to login...");
  await page.goto("https://rh-manager-ci.vercel.app/login");
  
  // Fill credentials
  console.log("Entering credentials...");
  await page.fill('input[type="email"]', 'admin@yobed.ci');
  await page.fill('input[type="password"]', 'Waliyatb1');
  
  // Click login
  console.log("Clicking login...");
  await page.click('button[type="submit"]');
  
  // Wait for navigation to /rh
  console.log("Waiting for navigation...");
  await page.waitForURL("**/rh", { timeout: 15000 });
  console.log("Logged in successfully. URL:", page.url());
  
  // Set viewport to mobile
  console.log("Setting viewport to mobile...");
  await page.setViewportSize({ width: 375, height: 667 });
  
  // Open the drawer by clicking the hamburger button
  console.log("Opening hamburger menu...");
  const hamburger = page.locator('button[aria-label="Ouvrir le menu"]');
  await hamburger.click();
  
  // Wait for the drawer aside element to be visible
  const aside = page.locator('aside');
  await aside.waitFor({ state: 'visible' });
  
  // Evaluate computed styles
  console.log("Evaluating computed styles...");
  const styles = await page.evaluate(() => {
    const el = document.querySelector('aside');
    if (!el) return null;
    const computed = window.getComputedStyle(el);
    return {
      background: computed.background,
      backgroundColor: computed.backgroundColor,
      opacity: computed.opacity,
      zIndex: computed.zIndex,
      height: computed.height,
      width: computed.width,
      display: computed.display,
      // Check the CSS variables
      sidebarVar: computed.getPropertyValue('--sidebar'),
      sidebarBorderVar: computed.getPropertyValue('--sidebar-border'),
      sidebarForegroundVar: computed.getPropertyValue('--sidebar-foreground'),
    };
  });
  
  console.log("Computed aside styles:", JSON.stringify(styles, null, 2));
  
  await browser.close();
}

main().catch(console.error);
