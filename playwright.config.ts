import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // テストファイルの場所
  testDir: './e2e',

  // 全テスト完了まで待つ最大時間
  timeout: 30_000,

  // テスト失敗時のリトライ回数
  retries: 1,

  // 並列実行数
  workers: 1,

  // テスト結果レポート
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    // 開発サーバーのURL
    baseURL: 'http://localhost:3000',

    // テスト失敗時のスクリーンショット
    screenshot: 'only-on-failure',

    // テスト失敗時の動画
    video: 'retain-on-failure',

    // ブラウザの表示（headless: false にすると目で見える）
    headless: false,

    // 操作間の待機時間（ms）
    actionTimeout: 10_000,

    // Windows環境でのChromium起動オプション
    // サブモニター（DISPLAY2: X=1366, Y=-307, 1920x1080）に最大化表示
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-position=1366,-307',
        '--window-size=1920,1080',
      ],
    },
    viewport: { width: 1920, height: 1080 },
  },

  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
});
