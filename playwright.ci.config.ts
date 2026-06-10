import { defineConfig, devices } from '@playwright/test';

/**
 * CI / ヘッドレス検証用の Playwright 設定。
 *
 * 既定の `playwright.config.ts` は headed（実 Chrome をサブモニタに表示）で
 * 目視しながらの確認向け。ただしサブモニタ座標へウィンドウを移動するため、
 * モニタ構成によってはモーダル表示時に固まることがある。
 *
 * 本設定はヘッドレス（バンドル版 Chromium）で実行し、CI や手元のクイック検証に使う。
 *   実行: npm run test:e2e:ci
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
