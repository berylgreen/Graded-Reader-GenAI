import puppeteer from 'puppeteer';

(async () => {
  console.log('Starting automated UI test...');
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

    // Set a reasonable timeout
    page.setDefaultNavigationTimeout(120000);
    page.setDefaultTimeout(120000);

    console.log('Navigating to local dev server...');
    await page.goto('http://127.0.0.1:3000');

    // Wait for the UI to be ready by checking if the select element is present
    console.log('Waiting for the UI to load...');
    await page.waitForSelector('#level-select');

    // Select Level 1
    console.log('Selecting Level 1...');
    await page.select('#level-select', '1');

    // Click Generate Button
    console.log('Clicking "Generate" button...');
    const elements = await page.$$('button');
    let button = null;
    for (const el of elements) {
      const text = await page.evaluate(e => e.textContent, el);
      const disabled = await page.evaluate(e => e.disabled, el);
      if (text && text.includes('Generate') && !disabled) {
        button = el;
        break;
      }
    }
    if (!button) {
      throw new Error('Generate button not found or disabled.');
    }
    
    await page.evaluate(b => b.click(), button);

    console.log('Waiting for the story to generate (this may take up to 20 seconds)...');
    
    // Wait for the success state OR error state
    await page.waitForFunction(() => {
        return document.querySelector('h3.text-2xl.font-bold') || document.querySelector('.bg-red-50');
    }, { timeout: 120000 });

    const errorEl = await page.$('.bg-red-50');
    if (errorEl) {
        const errText = await page.evaluate(e => e.textContent, errorEl);
        throw new Error('UI reported an error during generation: ' + errText);
    }

    const title = await page.$eval('h3.text-2xl.font-bold', el => el.textContent);
    console.log(`\n🎉 SUCCESS! The UI test passed!`);
    console.log(`Generated Story Title: "${title}"`);

  } catch (error) {
    console.error('\n❌ FAILED! The UI test encountered an error:');
    console.error(error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
    process.exit(0);
  }
})();
