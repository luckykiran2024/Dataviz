import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  console.log('Navigating to http://127.0.0.1:5175...');
  await page.goto('http://127.0.0.1:5175', { waitUntil: 'networkidle0' });
  
  console.log('Clicking Load Sample Data...');
  await page.click('#welcome-sample');
  
  // wait for modal
  await page.waitForSelector('.sample-card', { visible: true });
  
  console.log('Clicking first sample card...');
  await page.click('.sample-card');
  
  // wait a bit for processing
  await page.waitForTimeout(1000);
  
  console.log('Evaluating DOM...');
  const result = await page.evaluate(() => {
    const tabs = document.getElementById('analytics-tabs');
    const computed = window.getComputedStyle(tabs);
    const rect = tabs.getBoundingClientRect();
    
    return {
      exists: !!tabs,
      inlineDisplay: tabs.style.display,
      computedDisplay: computed.display,
      computedVisibility: computed.visibility,
      computedOpacity: computed.opacity,
      width: rect.width,
      height: rect.height,
      dashboardDisplay: document.getElementById('dashboard-grid')?.style.display,
      welcomeDisplay: document.getElementById('welcome-screen')?.style.display
    };
  });
  
  console.log('DOM Result:', JSON.stringify(result, null, 2));
  
  await browser.close();
})();
