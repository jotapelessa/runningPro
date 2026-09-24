import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER_PAGE_ERROR:', error.message));
  page.on('requestfailed', request => console.error('REQUEST_FAILED:', request.url(), request.failure().errorText));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  const content = await page.content();
  console.log('HTML Length:', content.length);
  await browser.close();
})();
