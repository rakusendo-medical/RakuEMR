import { test, expect } from './fixtures';

/**
 * その他画面のスモークテスト
 * 各画面が正常に表示されることを確認する
 */

test.describe('行動範囲', () => {
  test('画面が表示される', async ({ page }) => {
    await page.goto('/behavior');
    await expect(page.getByRole('heading', { name: '行動範囲' }).first()).toBeVisible();
  });
});

test.describe('外出外泊', () => {
  test('画面が表示される', async ({ page }) => {
    await page.goto('/outing');
    await expect(page.getByRole('heading', { name: '外出外泊' }).first()).toBeVisible();
  });
});

test.describe('病棟管理', () => {
  test('画面が表示される', async ({ page }) => {
    await page.goto('/ward-management');
    await expect(page.getByRole('heading', { name: '病棟管理' }).first()).toBeVisible();
  });
});

test.describe('書類管理', () => {
  test('画面が表示される', async ({ page }) => {
    await page.goto('/documents');
    await expect(page.getByRole('heading', { name: '書類管理' }).first()).toBeVisible();
  });

  test('書類一覧が表示される', async ({ page }) => {
    await page.goto('/documents');
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });
});

test.describe('オーダ管理', () => {
  test('画面が表示される', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByRole('heading', { name: 'オーダ管理' }).first()).toBeVisible();
  });

  test('フィルタが表示される', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('text=/患者|種類|フィルタ/').first()).toBeVisible();
  });
});

test.describe('看護ケア予定', () => {
  test('画面が表示される', async ({ page }) => {
    await page.goto('/nursing-care');
    await expect(page.getByRole('heading', { name: '看護ケア予定' }).first()).toBeVisible();
  });
});

test.describe('サイドバーナビゲーション', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('外来セクションのリンクが機能する', async ({ page }) => {
    await page.getByRole('button', { name: '外来一覧' }).click();
    await expect(page).toHaveURL('/outpatient');
  });

  test('病床管理セクションのリンクが機能する', async ({ page }) => {
    await page.getByRole('button', { name: '入院患者一覧' }).click();
    await expect(page).toHaveURL('/patients');
  });

  test('看護過程リンクが機能する', async ({ page }) => {
    await page.getByRole('button', { name: '看護過程' }).click();
    await expect(page).toHaveURL('/care-plan');
  });

  test('サイドバーを折りたたみできる', async ({ page }) => {
    // 折りたたみボタンをクリック
    const collapseBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    await collapseBtn.click();
    await page.waitForTimeout(300);
    // サイドバーが縮小されること（ラベルが非表示になる）
    await expect(page.locator('text=外来一覧').first()).not.toBeVisible();
  });
});
