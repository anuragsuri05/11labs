import { defineConfig, devices } from '@playwright/test';

// End-to-end UI tests against a running NO LABS server (`npm start`).
// Uses the locally installed Google Chrome, so no browser download is needed.
export default defineConfig({
  testDir: './tests/ui',
  // Tests use the real server; anything they add to History is removed afterwards.
  globalSetup: './tests/ui/global-setup.ts',
  globalTeardown: './tests/ui/global-teardown.ts',
  // CPU inference is slow: OmniVoice/Whisper first loads can take minutes.
  timeout: 4 * 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1, // the server runs one inference job at a time
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    baseURL: process.env.NOLABS_URL || 'http://localhost:3333',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
