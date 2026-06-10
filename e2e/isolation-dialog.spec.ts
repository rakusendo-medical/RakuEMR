import { test, expect } from './fixtures';

/**
 * 隔離拘束指示ダイアログのE2Eテスト
 */
test.describe('隔離拘束指示ダイアログ', () => {

  // カルテ画面（P001・入院患者）を開いてからテスト
  test.beforeEach(async ({ page }) => {
    await page.goto('/karte/P001');
    // カルテ画面が表示されるまで待つ
    await expect(page.locator('text=診療録').first()).toBeVisible();
  });

  test('隔離拘束指示ダイアログが開く', async ({ page }) => {
    // アクションバーの「隔離拘束指示」をクリック
    await page.getByRole('button', { name: '隔離拘束指示' }).click();

    // ダイアログが表示されること
    await expect(page.locator('text=隔離拘束指示').first()).toBeVisible();
  });

  test('病室・ベッド未選択時は作成ボタンが非活性', async ({ page }) => {
    await page.getByRole('button', { name: '隔離拘束指示' }).click();

    // ダイアログが開いた状態で作成ボタンが非活性であること
    const createBtn = page.getByRole('button', { name: '作成' });
    await expect(createBtn).toBeDisabled();
  });

  test('キャンセルボタンでダイアログが閉じる', async ({ page }) => {
    await page.getByRole('button', { name: '隔離拘束指示' }).click();

    // ダイアログが表示されること
    await expect(page.locator('text=隔離拘束指示').first()).toBeVisible();

    // キャンセルをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click();

    // ダイアログが閉じること（DialogTitleの隔離拘束指示テキストが消える）
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('タイトルを切り替えると拘束部位が表示される', async ({ page }) => {
    await page.getByRole('button', { name: '隔離拘束指示' }).click();

    // タイトルのセレクトを「拘束開始」に変更
    const titleSelect = page.locator('[role="combobox"]').first();
    await titleSelect.click();
    await page.getByRole('option', { name: '拘束開始', exact: true }).click();

    // 拘束部位の選択肢が表示されること
    await expect(page.locator('text=拘束部位')).toBeVisible();
  });

});
