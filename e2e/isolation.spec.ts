import { test, expect } from './fixtures';

test.describe('隔離拘束', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/isolation');
    await expect(page.getByRole('tab', { name: '隔離拘束一覧' })).toBeVisible();
  });

  test('タブが4つ表示される', async ({ page }) => {
    await expect(page.getByRole('tab', { name: '隔離拘束一覧' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '観察記録' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '隔離歴' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '行動制限台帳' })).toBeVisible();
  });

  test('隔離拘束一覧に検索条件バーが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: '表示' })).toBeVisible();
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
  });

  test('観察記録タブに切り替えられる', async ({ page }) => {
    await page.getByRole('tab', { name: '観察記録' }).click();
    await expect(page.getByRole('tab', { name: '観察記録' })).toHaveAttribute('aria-selected', 'true');
    // マトリクス表示の患者列ヘッダーが出ること
    await expect(page.getByRole('columnheader', { name: '患者' })).toBeVisible();
  });

  test('隔離歴タブに切り替えられる', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離歴' }).click();
    await expect(page.getByRole('tab', { name: '隔離歴' })).toHaveAttribute('aria-selected', 'true');
  });

  test('行動制限台帳タブに切り替えられる', async ({ page }) => {
    await page.getByRole('tab', { name: '行動制限台帳' }).click();
    await expect(page.locator('text=行動制限一覧性台帳')).toBeVisible();
  });

  test('印刷ボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: /印刷/ }).first()).toBeVisible();
  });

});
