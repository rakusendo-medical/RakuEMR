import { test, expect } from './fixtures';

test.describe('看護過程ダッシュボード', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/care-plan');
    await expect(page.locator('text=/評価期限超過|今月評価|計画未立案/').first()).toBeVisible();
  });

  test('4つのサマリカードが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: '評価期限超過' })).toBeVisible();
    await expect(page.getByRole('button', { name: '今月評価必要' })).toBeVisible();
    await expect(page.getByRole('button', { name: '計画未立案' })).toBeVisible();
    await expect(page.getByRole('button', { name: '評価中のまま' })).toBeVisible();
  });

  test('担当看護師を切り替えられる', async ({ page }) => {
    const nurseSelect = page.locator('label:has-text("担当看護師")').locator('..').locator('[role="combobox"]');
    await expect(nurseSelect).toBeVisible();
    await nurseSelect.click();
    const options = page.locator('[role="option"]');
    if (await options.count() > 1) {
      await options.nth(1).click();
    }
  });

  test('患者をクリックすると看護計画詳細に遷移する', async ({ page }) => {
    const patientLink = page.locator('text=/山田|鈴木|田中/').first();
    if (await patientLink.isVisible()) {
      await patientLink.click();
      await expect(page).toHaveURL(/\/care-plan\/patients\//);
    }
  });

});

test.describe('看護計画詳細', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/care-plan/patients/P001');
    await page.waitForTimeout(500);
  });

  test('患者ヘッダーが表示される', async ({ page }) => {
    await expect(page.locator('text=/号室|看護師/').first()).toBeVisible();
  });

  test('計画立案ページに遷移できる', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /計画立案|新規/ });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page).toHaveURL(/\/create/);
    }
  });

});
