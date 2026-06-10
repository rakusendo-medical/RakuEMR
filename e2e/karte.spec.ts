import { test, expect } from './fixtures';

test.describe('カルテ画面', () => {

  test.describe('入院モード', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto('/karte/P001');
      await expect(page.locator('text=診療録').first()).toBeVisible();
    });

    test('患者ヘッダーが表示される', async ({ page }) => {
      // 入院バッジが表示されること
      await expect(page.locator('text=入院').first()).toBeVisible();
      // 戻るボタンが表示されること
      await expect(page.getByRole('button', { name: '一覧に戻る' })).toBeVisible();
    });

    test('7つのタブが表示される', async ({ page }) => {
      await expect(page.getByRole('tab', { name: '診療録' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'フローシート' })).toBeVisible();
      await expect(page.getByRole('tab', { name: '指示簿' })).toBeVisible();
      await expect(page.getByRole('tab', { name: '指示状況' })).toBeVisible();
      await expect(page.getByRole('tab', { name: '看護過程' })).toBeVisible();
      await expect(page.getByRole('tab', { name: '患者情報' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'スケジュール' })).toBeVisible();
    });

    test('入院モードでは看護過程タブが活性', async ({ page }) => {
      const carePlanTab = page.getByRole('tab', { name: '看護過程' });
      await expect(carePlanTab).not.toBeDisabled();
    });

    test('フローシートタブに切り替えられる', async ({ page }) => {
      await page.getByRole('tab', { name: 'フローシート' }).click();
      await expect(page.getByRole('tab', { name: 'フローシート' })).toHaveAttribute('aria-selected', 'true');
    });

    test('患者情報タブに切り替えられる', async ({ page }) => {
      await page.getByRole('tab', { name: '患者情報' }).click();
      await expect(page.getByRole('tab', { name: '患者情報' })).toHaveAttribute('aria-selected', 'true');
    });

    test('URLハッシュでタブが直接指定できる', async ({ page }) => {
      await page.goto('/karte/P001#patient-info');
      await expect(page.getByRole('tab', { name: '患者情報' })).toHaveAttribute('aria-selected', 'true');
    });

    test('アクションバーに隔離拘束指示ボタンが表示される', async ({ page }) => {
      await expect(page.getByRole('button', { name: '隔離拘束指示' })).toBeVisible();
    });

    test('一覧に戻るボタンで遷移できる', async ({ page }) => {
      await page.getByRole('button', { name: '一覧に戻る' }).click();
      await expect(page).not.toHaveURL(/\/karte\//);
    });

  });

  test.describe('外来モード', () => {

    test.beforeEach(async ({ page }) => {
      // 外来一覧経由で開く（外来モードになる）
      await page.goto('/outpatient');
      const firstRow = page.locator('tbody tr').first();
      await firstRow.dblclick();
      await expect(page).toHaveURL(/\/karte\//);
    });

    test('外来モードでは看護過程タブが非活性', async ({ page }) => {
      const carePlanTab = page.getByRole('tab', { name: '看護過程' });
      await expect(carePlanTab).toBeDisabled();
    });

    test('外来バッジが表示される', async ({ page }) => {
      await expect(page.locator('text=外来').first()).toBeVisible();
    });

  });

});
