import { test, expect } from './fixtures';

/**
 * ep-07 観察記録: 未来日入力不可
 * spec: docs/specs/ep-07-observation/_epic.md「共通ルール: 未来日入力不可」
 *
 * 現在日時が記録枠の開始時刻に達していない場合は入力不可。判定は枠の開始時刻のみで行う。
 * 例（15分枠）:
 *   16:29 → 16:15枠 OK / 16:30枠 NG / 16:45枠 NG
 *   16:30 → 16:15枠 OK / 16:30枠 OK / 16:45枠 NG
 *   16:31 → 16:15枠 OK / 16:30枠 OK / 16:45枠 NG
 *
 * モックの表示日（2026-05-13〜19）に合わせ、時刻を 2026-05-19 の任意時点に固定して検証する。
 */

/** 時刻を固定してフローシート／隔離拘束サブタブを開く */
async function openIsolationGridAt(page: import('@playwright/test').Page, isoDateTime: string) {
  await page.clock.setFixedTime(new Date(isoDateTime));
  await page.goto('/karte/P001');
  await expect(page.locator('text=診療録').first()).toBeVisible();
  await page.getByRole('tab', { name: 'フローシート・隔離拘束', exact: true }).click();
  await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
}

test.describe('ep-07 観察記録: 未来日入力不可', () => {
  test('未来の時間枠セルはクリックしても観察記録ダイアログが開かない', async ({ page }) => {
    await openIsolationGridAt(page, '2026-05-19T16:29:00');

    // 16時枠は開始時刻に達しているので入力可
    const past = page.getByLabel('観察 2026-05-19 16:00');
    await expect(past).not.toHaveAttribute('aria-disabled', 'true');
    await past.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'キャンセル' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // 17時枠は未到来なのでクリック不可（ダイアログが開かない）
    const future = page.getByLabel('観察 2026-05-19 17:00');
    await expect(future).toHaveAttribute('aria-disabled', 'true');
    await expect(future).toHaveAttribute('title', '未来日入力不可');
    await future.click({ force: true });
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('16時29分: 15分枠は 16:30 / 16:45 が入力不可（16:00 / 16:15 のみ登録される）', async ({ page }) => {
    await openIsolationGridAt(page, '2026-05-19T16:29:00');

    const cell = page.getByLabel('観察 2026-05-19 16:00');
    await cell.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '15分単位' }).click();
    await expect(dialog.getByText('追加 (4/9)')).toBeVisible();

    // 未来枠は 16:30 / 16:45 の 2 行
    await expect(dialog.locator('[data-testid="obs-row-future"]')).toHaveCount(2);
    await expect(dialog.locator('[data-testid="obs-row"]')).toHaveCount(2);
    // 未来枠の [選択] チェックは非活性・未チェック
    const futureCheck = dialog.getByRole('checkbox', { name: '3回目 選択' });
    await expect(futureCheck).toBeDisabled();
    await expect(futureCheck).not.toBeChecked();
    // 入力可の行はチェック済み
    await expect(dialog.getByRole('checkbox', { name: '1回目 選択' })).toBeChecked();

    // 登録されるのは入力可の 2 行のみ
    await dialog.getByRole('button', { name: '登録' }).click();
    await expect(dialog).toBeHidden();
    await expect(cell.locator('[data-testid="obs-segment"]')).toHaveCount(2);
  });

  test('16時30分: 16:30 枠は入力可になり 16:45 のみ入力不可', async ({ page }) => {
    await openIsolationGridAt(page, '2026-05-19T16:30:00');

    await page.getByLabel('観察 2026-05-19 16:00').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '15分単位' }).click();
    await expect(dialog.getByText('追加 (4/9)')).toBeVisible();

    // 開始時刻ちょうどは入力可 → 未来枠は 16:45 の 1 行のみ
    await expect(dialog.locator('[data-testid="obs-row-future"]')).toHaveCount(1);
    await expect(dialog.getByRole('checkbox', { name: '3回目 選択' })).toBeEnabled();
    await expect(dialog.getByRole('checkbox', { name: '4回目 選択' })).toBeDisabled();
  });

  test('16時31分: 枠の途中でも次の枠（16:45）は入力不可のまま', async ({ page }) => {
    await openIsolationGridAt(page, '2026-05-19T16:31:00');

    await page.getByLabel('観察 2026-05-19 16:00').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '15分単位' }).click();
    await expect(dialog.getByText('追加 (4/9)')).toBeVisible();

    await expect(dialog.locator('[data-testid="obs-row-future"]')).toHaveCount(1);
    await expect(dialog.getByRole('checkbox', { name: '4回目 選択' })).toBeDisabled();
  });

  test('時間欄に未来時刻を手入力すると登録が中止される', async ({ page }) => {
    await openIsolationGridAt(page, '2026-05-19T16:29:00');

    await page.getByLabel('観察 2026-05-19 16:00').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // 1 行目（16:00・入力可）の時間を未来時刻へ書き換える
    const timeInput = dialog.getByPlaceholder('HH:mm').first();
    await timeInput.fill('16:45');
    await dialog.getByRole('button', { name: '登録' }).click();
    // エラーとなり登録されない（ダイアログは開いたまま）
    // ※ モーダル表示中はダイアログ外が aria-hidden になるため role=alert では引けない
    await expect(page.locator('.MuiSnackbar-root')).toContainText('未来日は入力できません');
    await expect(dialog).toBeVisible();
  });

  test('日付送りで当日へ移動すると、現在時刻より後の時間枠が入力不可になる', async ({ page }) => {
    // 当日の 16:29 に固定 → 16時枠は入力可 / 17時枠以降は入力不可
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    await page.clock.setFixedTime(new Date(`${iso}T16:29:00`));
    await page.goto('/karte/P001');
    await expect(page.locator('text=診療録').first()).toBeVisible();
    await page.getByRole('tab', { name: 'フローシート・隔離拘束', exact: true }).click();
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();

    // 初期表示（2026/5 のモック日付）は全て過去なので入力可
    await expect(page.getByLabel('観察 2026-05-19 23:00')).not.toHaveAttribute('aria-disabled', 'true');

    // 日付ナビ「当日」で当日を右端に
    await page.getByRole('button', { name: '当日を右端に表示' }).click();

    await expect(page.getByLabel(`観察 ${iso} 16:00`)).not.toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByLabel(`観察 ${iso} 17:00`)).toHaveAttribute('aria-disabled', 'true');
    // 翌日列は無い（当日が右端）が、前日列は全て入力可
    const prevIso = new Date(new Date(`${iso}T00:00:00`).getTime() - 86400000).toISOString().slice(0, 10);
    await expect(page.getByLabel(`観察 ${prevIso} 23:00`)).not.toHaveAttribute('aria-disabled', 'true');

    // 7日後へ送ると当日より後の日付列は全枠が入力不可
    await page.getByRole('button', { name: '7日後' }).click();
    const futureIso = new Date(new Date(`${iso}T00:00:00`).getTime() + 86400000).toISOString().slice(0, 10);
    await expect(page.getByLabel(`観察 ${futureIso} 00:00`)).toHaveAttribute('aria-disabled', 'true');
  });

  test('隔離拘束一覧／記録タブの未来の回数枠は一括入力を開けない', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-05-19T16:29:00'));
    await page.goto('/isolation');
    await page.getByRole('tab', { name: '観察記録' }).click();

    // 16時 1回目（16:00 開始）は入力可 → 一括入力ダイアログが開く
    await page.getByTestId('obs-slot-16-1').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('観察記録（一括入力）');
    await dialog.getByRole('button', { name: 'キャンセル' }).click();
    await expect(dialog).toBeHidden();

    // 16時 3回目（拘束4回=15分枠 → 16:30 開始）は未到来 → クリック不可
    const futureSlot = page.getByTestId('obs-slot-16-3');
    await expect(futureSlot).toHaveAttribute('aria-disabled', 'true');
    await futureSlot.click({ force: true });
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
