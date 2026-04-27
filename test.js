const { chromium } = require('playwright'); 

(async () => { 
  const browser = await chromium.launch({ headless: true }); 
  const page = await browser.newPage(); 
  page.on('console', msg => { 
    if (msg.type() === 'error') { 
      console.log('CONSOLE ERROR:', msg.text(), msg.location()); 
    } 
  }); 
  page.on('pageerror', err => { 
    console.log('PAGE ERROR:', err.message, err.stack); 
  }); 
  try {
    await page.goto('http://localhost:3001/paie/fin-de-contrat', { waitUntil: 'networkidle' }); 
    console.log('Loaded.'); 
    await page.fill('input[name="email"]', 'yobed.sarl@gmail.com').catch(()=>console.log('No email')); 
    await page.fill('input[name="password"]', 'admin').catch(()=>console.log('No pass')); 
    await page.click('button[type="submit"]').catch(()=>console.log('No submit')); 
    await page.waitForTimeout(2000); 
    await page.goto('http://localhost:3001/paie/fin-de-contrat', { waitUntil: 'networkidle' }); 
    console.log('Trying to click a button to select an employee');
    await page.waitForTimeout(1000);
    const btns = await page.$$('button');
    for (const btn of btns) {
      const text = await btn.innerText();
      if (text.includes('Adams yao') || text.includes('Voir détail') || text.trim() === '') {
        console.log('Clicking button', text.trim());
        await btn.click();
        await page.waitForTimeout(2000);
        break;
      }
    }
    console.log('Done script.');
  } catch (e) {
    console.error("Script error:", e);
  } finally {
    await browser.close(); 
  }
})()
