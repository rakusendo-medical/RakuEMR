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
 *
 * 並列実行: 1 テストあたり約 14 秒がアプリの初期表示（2.3MB の JS のパース・初期レンダリング）で
 * 占められ、テスト本体の処理は 1〜6 秒程度。直列だとスイート全体で 30 分近くかかるため並列化する。
 * 各テストは独立したブラウザコンテキストで実行され localStorage も分離されるので、
 * ストアの状態がテスト間で混ざることはない。
 * ワーカー数は `PW_WORKERS` で上書きできる（既定はマシンの CPU 数の 50%）。
 */

const DEFAULT_WORKERS = '50%';

/**
 * `PW_WORKERS` を Playwright の workers 値へ変換する。
 * 数値（`4`）と割合（`50%`）の双方を受け付け、解釈できない値は既定へフォールバックする
 * （`Number('50%')` は NaN になり、そのまま渡すと並列度の設定が壊れるため）。
 */
const resolveWorkers = (value: string | undefined): number | string => {
  if (!value) return DEFAULT_WORKERS;
  if (/^\d+%$/.test(value)) return value;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_WORKERS;
};

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: resolveWorkers(process.env.PW_WORKERS),
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
