import { test, expect } from './fixtures';

/**
 * us-02 / us-03: 病床競合の取り扱い（後負け）
 *
 * 1 つの病床に複数の患者を割り当てない。競合時は先に割り当てた患者を優先し、
 * 後からの登録・更新・取消（戻し）をエラーとする（定員超過の禁止）。
 *
 * モックデータ前提: 第１病棟は 107 号室・108 号室のみ空き 1 床、それ以外は満床。
 */
test.describe('病床競合（後負け）', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  /** 病棟マップで患者名をクリック → 操作メニュー → [移動] でダイアログを開く */
  const openMoveDialog = async (page: import('@playwright/test').Page, patientName: string) => {
    await page.getByText(patientName, { exact: true }).first().click();
    await expect(page.locator('text=メニュー:')).toBeVisible();
    await page.getByRole('button', { name: '[移動]', exact: true }).click();
    await expect(page.locator('text=転棟・転室ダイアログ')).toBeVisible();
  };

  /** ダイアログで移動先病室を選択（病棟は既定＝現在の病棟のまま） */
  const selectRoom = async (page: import('@playwright/test').Page, roomLabel: string) => {
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: roomLabel }).click();
  };

  /** 登録実行（食事締め時間超過の確認ステップにも対応） */
  const submitMove = async (page: import('@playwright/test').Page) => {
    const dialog = page.getByRole('dialog');
    const submitBtn = dialog.getByRole('button', { name: /^(登録|確認)$/ });
    await expect(submitBtn).toBeEnabled();
    const needsConfirm = ((await submitBtn.textContent()) ?? '').includes('確認');
    await submitBtn.click();
    if (needsConfirm) {
      await expect(page.getByText(/食事締め時間/)).toBeVisible();
      await expect(submitBtn).toHaveText('登録');
      await submitBtn.click();
    }
    await expect(page.locator('text=/移動を登録しました/')).toBeVisible();
  };

  test('移動予定を含めて満床の病室へは登録できない（後負け）', async ({ page }) => {
    // ① 患者A（101号室）が 107号室（空き1床）へ未来日時の移動予定を登録
    await openMoveDialog(page, '後藤 幸子');
    await selectRoom(page, '107号室');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const moveAt = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T09:00`;
    await page.getByRole('dialog').getByRole('textbox', { name: '移動日時' }).fill(moveAt);
    await submitMove(page);

    // ② 患者B（101号室）が同じ 107号室 を選択 → 後負けエラーで登録不可
    await openMoveDialog(page, '宮田 典子');
    await selectRoom(page, '107号室');
    await expect(page.getByText(/移動予定を含めて満床です/)).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('button', { name: /^(登録|確認)$/ })).toBeDisabled();
  });

  test('取消により戻し先が定員超過となる場合は取消できない', async ({ page }) => {
    // ① 患者A（105号室・満床）を 107号室（空き1床）へ即時移動 → 105 に空きが 1 できる
    await openMoveDialog(page, '井上 さくら');
    await selectRoom(page, '107号室');
    await submitMove(page);
    await page.keyboard.press('Escape');

    // ② 患者B（102号室）を 105号室 の空き枠へ即時移動 → 105 は再び満床
    await openMoveDialog(page, '加藤 良子');
    await selectRoom(page, '105号室');
    await submitMove(page);
    await page.keyboard.press('Escape');

    // ③ 患者Aの移動を取消そうとする → 戻し先 105 が満床のため取消エラー
    await openMoveDialog(page, '井上 さくら');
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '取消', exact: true }).first().click();
    await dialog.getByRole('button', { name: '取消を実行' }).click();
    await expect(page.getByText(/戻し先の病室が満床のため取消できません/)).toBeVisible();

    // 履歴の状態は「済」のまま（取消されていない）
    await expect(dialog.locator('.MuiChip-label', { hasText: '取消' })).toHaveCount(0);
  });
});
