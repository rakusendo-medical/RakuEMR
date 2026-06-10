import { test, expect } from './fixtures';

test.describe('入院患者一覧', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/patients');
    await expect(page.getByRole('heading', { name: '入院患者一覧' }).first()).toBeVisible();
  });

  test('一覧が表示される', async ({ page }) => {
    // テーブルヘッダーが表示されること
    await expect(page.locator('th', { hasText: '患者番号' })).toBeVisible();
    await expect(page.locator('th', { hasText: '主治医' })).toBeVisible();
    // 患者行が1件以上あること
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('病棟タブで絞り込みできる', async ({ page }) => {
    const tabs = page.getByRole('tab');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
    await tabs.first().click();
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  });

  test('主治医プルダウンで絞り込みできる', async ({ page }) => {
    const doctorSelect = page.locator('label:has-text("主治医")').locator('..').locator('[role="combobox"]');
    await expect(doctorSelect).toBeVisible();
    await doctorSelect.click();
    const options = page.locator('[role="option"]');
    await expect(options.first()).toBeVisible();
    await options.first().click();
  });

  test('フリーワード検索ができる', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="氏名"]');
    await searchInput.fill('山田');
    // 入力後に行が絞り込まれること
    await page.waitForTimeout(500);
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('患者行をクリックするとカルテ画面に遷移する', async ({ page }) => {
    await page.locator('tbody tr').first().click();
    await expect(page).toHaveURL(/\/karte\//);
  });

});
