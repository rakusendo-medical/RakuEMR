import { test, expect } from './fixtures';

/**
 * us-02 / us-03: 病床競合（後負け）と移動履歴の取消・更新条件
 *
 * - 病床競合: 1 つの病床に複数の患者を割り当てない。先に割り当てた患者を優先し、
 *   後からの登録・更新をエラーとする（定員超過の禁止）。
 * - 履歴の取消・更新: 未実施（未）の予定のみ可。実施済（済）・取消済み・入院行は不可。
 *   取消は履歴に取消状態で残す（物理削除禁止）。
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

  test('実施済（済）の移動は取消・更新できない', async ({ page }) => {
    // ① 患者A（105号室）を 107号室 へ即時移動 → 履歴に「済」の転室行ができる
    await openMoveDialog(page, '井上 さくら');
    await selectRoom(page, '107号室');
    await submitMove(page);
    await page.keyboard.press('Escape');

    // ② 再度ダイアログを開く → 済の行には取消ボタンが表示されない
    await openMoveDialog(page, '井上 さくら');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('107号室', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: '取消', exact: true })).toHaveCount(0);

    // ③ 済の行は更新可能な行にならない（更新可能な履歴行にのみ付く aria-label が存在しない）
    await expect(dialog.getByRole('button', { name: /107号室への転室を更新/ })).toHaveCount(0);
  });

  test('未実施（未）の移動は更新でき、取消は履歴に取消として残る', async ({ page }) => {
    // ① 患者B（101号室）が 108号室 へ未来日時の移動予定を登録
    await openMoveDialog(page, '後藤 幸子');
    await selectRoom(page, '108号室');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const moveAt = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T09:00`;
    await page.getByRole('dialog').getByRole('textbox', { name: '移動日時' }).fill(moveAt);
    await submitMove(page);
    await page.keyboard.press('Escape');

    // ② 再度開く → 未の行はクリックで更新モードに入れる
    //   （移動予定チップでセル内の患者名が隠れるため、選択状態のまま残る下部メニューの [移動] から開く）
    await page.getByRole('button', { name: '[移動]', exact: true }).click();
    await expect(page.locator('text=転棟・転室ダイアログ')).toBeVisible();
    const dialog = page.getByRole('dialog');
    //   履歴行は更新可能なときだけ role="button" + aria-label を持つ。病室番号の文字列は
    //   移動先セレクトの現在値等とも重複しうるため、aria-label で行を特定する。
    await dialog.getByRole('button', { name: /108号室への転室を更新/ }).click();
    await expect(dialog.getByText('移動（更新）')).toBeVisible();
    await dialog.getByRole('button', { name: '新規登録に戻る' }).click();

    // ③ 未の行を取消 → 履歴に「取消」状態で残る（物理削除されない）
    await dialog.getByRole('button', { name: '取消', exact: true }).first().click();
    await dialog.getByRole('button', { name: '取消を実行' }).click();
    await expect(page.getByText(/移動を取消しました/)).toBeVisible();
    await expect(dialog.getByText('108号室', { exact: true })).toBeVisible();
    await expect(dialog.locator('.MuiChip-label', { hasText: '取消' }).first()).toBeVisible();
  });
});
