import { test, expect } from './fixtures';

/**
 * 外来一覧画面のE2Eテスト
 */
test.describe('外来一覧', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/outpatient');
  });

  test('外来一覧画面が表示される', async ({ page }) => {
    // タイトルが表示されること（ページ見出しのh6を指定）
    await expect(page.getByRole('heading', { name: '外来一覧' }).first()).toBeVisible();

    // フィルタタブが表示されること
    await expect(page.getByRole('tab', { name: /すべて/ })).toBeVisible();

    // テーブルのヘッダーが表示されること
    await expect(page.locator('text=患者氏名')).toBeVisible();
  });

  test('患者未選択時はアクションボタンが非活性', async ({ page }) => {
    // カルテボタンが非活性であること
    await expect(page.getByRole('button', { name: 'カルテ' })).toBeDisabled();

    // オーダーボタンが非活性であること
    await expect(page.getByRole('button', { name: 'オーダー' })).toBeDisabled();
  });

  test('患者行をクリックするとアクションボタンが活性化する', async ({ page }) => {
    // テーブルの1行目をクリック
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    // カルテボタンが活性化すること
    await expect(page.getByRole('button', { name: 'カルテ' })).toBeEnabled();
  });

  test('フィルタタブで絞り込みができる', async ({ page }) => {
    // 「待機中」タブをクリック
    await page.getByRole('tab', { name: /待機中/ }).click();

    // 待機中タブが選択状態になること
    await expect(page.getByRole('tab', { name: /待機中/ })).toHaveAttribute('aria-selected', 'true');
  });

  test('患者行ダブルクリックでカルテ画面に遷移する', async ({ page }) => {
    // 1行目をダブルクリック
    const firstRow = page.locator('tbody tr').first();
    await firstRow.dblclick();

    // カルテ画面（/karte/）に遷移すること
    await expect(page).toHaveURL(/\/karte\//);

    // 外来モード（緑テーマ）で開くこと
    await expect(page.locator('text=外来').first()).toBeVisible();
  });

});
