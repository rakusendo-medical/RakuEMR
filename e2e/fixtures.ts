import { test as base, expect } from '@playwright/test';

/**
 * カスタムフィクスチャ：テスト開始時にウィンドウをサブモニターで最大化する
 * サブモニター: DISPLAY2 (X=1366, Y=-307, 1920x1080)
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // CDPセッションでウィンドウをサブモニターに移動してから最大化（2段階）
    const client = await page.context().newCDPSession(page);
    try {
      const { windowId } = await client.send('Browser.getWindowForTarget');
      // ① まずサブモニター（DISPLAY2: X=1366, Y=-307）に移動
      await client.send('Browser.setWindowBounds', {
        windowId,
        bounds: {
          left: 1366,
          top: -307,
          width: 1920,
          height: 1080,
          windowState: 'normal',
        },
      });
      // ② 少し待ってから最大化
      await new Promise(r => setTimeout(r, 300));
      await client.send('Browser.setWindowBounds', {
        windowId,
        bounds: { windowState: 'maximized' },
      });
    } catch {
      // CDPが使えない場合はスキップ
    }
    await use(page);
  },
});

export { expect };
