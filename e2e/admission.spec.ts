import { test, expect } from './fixtures';

test.describe('入退院管理', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/admission');
    await expect(page.getByRole('tab', { name: '入退院情報' })).toBeVisible();
  });

  test('タブが3つ表示される', async ({ page }) => {
    await expect(page.getByRole('tab', { name: '入退院情報' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '入院歴' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '移動歴' })).toBeVisible();
  });

  test('入退院情報タブにカレンダーが表示される', async ({ page }) => {
    await page.getByRole('tab', { name: '入退院情報' }).click();
    // カレンダーもしくは日付関連の要素が表示されること
    await expect(page.locator('text=/\\d{4}年|\\d{1,2}月/')).toBeVisible();
  });

  test('入院歴タブに切り替えられる', async ({ page }) => {
    await page.getByRole('tab', { name: '入院歴' }).click();
    await expect(page.getByRole('tab', { name: '入院歴' })).toHaveAttribute('aria-selected', 'true');
  });

  test('移動歴タブにテーブルが表示される', async ({ page }) => {
    await page.getByRole('tab', { name: '移動歴' }).click();
    await expect(page.locator('text=移動元')).toBeVisible();
    await expect(page.locator('text=移動先')).toBeVisible();
  });

  test('モック切替でロールを変更できる', async ({ page }) => {
    const doctorBtn = page.getByRole('button', { name: '医師' });
    await doctorBtn.click();
    await expect(doctorBtn).toHaveAttribute('aria-pressed', 'true');
  });

});
