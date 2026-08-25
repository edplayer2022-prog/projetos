const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:4173', ...(process.env.PLAYWRIGHT_CHROME ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROME } } : {}) },
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true
  }
});
