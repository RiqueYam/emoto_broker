import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:4321';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: BASE_URL, deviceScaleFactor: 1 },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        hasTouch: true,
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run preview -- --port 4321 --host 127.0.0.1',
        url: BASE_URL,
        reuseExistingServer: true,
      },
});
