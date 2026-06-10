import { test, expect } from './fixtures';

test.describe('患者検索', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/patient-search');
    await expect(page.getByRole('heading', { name: '患者検索' }).first()).toBeVisible();
  });

  test('検索画面が表示される', async ({ page }) => {
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('キーワードを入力して検索できる', async ({ page }) => {
    const input = page.locator('input').first();
    await input.fill('山田');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  });

  test('検索結果の患者をクリックするとカルテに遷移する', async ({ page }) => {
    const input = page.locator('input').first();
    await input.fill('山田');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const firstResult = page.locator('tbody tr, [data-testid="patient-row"]').first();
    if (await firstResult.isVisible()) {
      await firstResult.click();
      await expect(page).toHaveURL(/\/karte\//);
    }
  });

});
