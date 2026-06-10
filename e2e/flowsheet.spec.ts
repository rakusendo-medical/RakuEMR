import { test, expect } from './fixtures';

test.describe('フローシート', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/karte/P001');
    await expect(page.locator('text=診療録').first()).toBeVisible();
    // 親カルテタブ（exact: サブタブ「フローシート」と区別する）
    await page.getByRole('tab', { name: 'フローシート・隔離拘束', exact: true }).click();
    await expect(
      page.getByRole('tab', { name: 'フローシート・隔離拘束', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  test('フローシートヘッダーが表示される', async ({ page }) => {
    // 親カルテタブが選択されていること
    await expect(
      page.getByRole('tab', { name: 'フローシート・隔離拘束', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  test('タブのタイトルが「フローシート・隔離拘束」である', async ({ page }) => {
    // カルテ画面のタブラベルが新タイトルになっていること
    await expect(
      page.getByRole('tab', { name: 'フローシート・隔離拘束', exact: true }),
    ).toBeVisible();
  });

  test('フローシートグリッドが表示される', async ({ page }) => {
    // 在院日数行が表示されること
    await expect(page.locator('text=在院日数')).toBeVisible();
  });

  test('バイタルグラフ行が表示される', async ({ page }) => {
    await expect(page.locator('text=/体温|バイタル|T\\.P\\.R/').first()).toBeVisible();
  });

  test('サブタブ（フローシート / 隔離拘束）が表示される', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'フローシート', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: '隔離拘束', exact: true })).toBeVisible();
  });

  test('隔離拘束サブタブで24時間観察グリッドが表示される', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    // 24 時間グリッドの先頭・末尾の時刻ラベル
    await expect(page.getByText('0時', { exact: true })).toBeVisible();
    await expect(page.getByText('23時', { exact: true })).toBeVisible();
    // 診察記録行
    await expect(page.getByText('診察記録 [絞込設定]')).toBeVisible();
    // 共通ヘッダ（病室・外出・外泊）は切替後も残る
    await expect(page.locator('text=病室').first()).toBeVisible();
    await expect(page.locator('text=外出・外泊').first()).toBeVisible();
  });

  test('隔離拘束サブタブに観察状態の凡例が表示される', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    await expect(page.getByText('不穏', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('睡眠', { exact: true }).first()).toBeVisible();
  });

  test('隔離拘束グリッドのセルクリックで観察記録ダイアログが開く', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    // 当日(2026-05-19)の 0 時セルをクリック → 観察記録ダイアログ
    await page.getByLabel('観察 2026-05-19 00:00').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // 観察記録ダイアログが開いている（登録ボタンの存在で判定）
    await expect(dialog.getByRole('button', { name: '登録' })).toBeVisible();
    // 既定で 2 行（00分・30分）→「追加 (2/9)」表示
    await expect(dialog.getByText('追加 (2/9)')).toBeVisible();
  });

  test('観察記録ダイアログで観察間隔（15分/30分）を切り替えられる', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    await page.getByLabel('観察 2026-05-19 00:00').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // 既定は 30 分単位 → 2 行
    await expect(dialog.getByText('追加 (2/9)')).toBeVisible();
    // 15 分単位へ切替 → 4 行（00/15/30/45分）
    await dialog.getByRole('button', { name: '15分単位' }).click();
    await expect(dialog.getByText('追加 (4/9)')).toBeVisible();
    // 30 分単位へ戻すと 2 行
    await dialog.getByRole('button', { name: '30分単位' }).click();
    await expect(dialog.getByText('追加 (2/9)')).toBeVisible();
  });

  test('隔離拘束グリッドの区切り線が縦横とも同色（細線）', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    const cell = page.getByLabel('観察 2026-05-19 00:00');
    // 縦線（右ボーダー）はセル(Box)に付与・色 #cbd5e1
    await expect(cell).toHaveCSS('border-right-style', 'solid');
    await expect(cell).toHaveCSS('border-right-color', 'rgb(203, 213, 225)');
    // 横線はセル側には付けない（二重線で太く見えるのを防ぐ）
    await expect(cell).toHaveCSS('border-bottom-style', 'none');
    // 横線は親セル(td)の下ボーダー。縦と同色 #cbd5e1。
    const td = cell.locator('xpath=ancestor::td[1]');
    await expect(td).toHaveCSS('border-bottom-color', 'rgb(203, 213, 225)');
  });

  test('隔離拘束グリッドの各時間セルの高さが揃っている', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    const c0 = page.getByLabel('観察 2026-05-19 00:00');
    const c8 = page.getByLabel('観察 2026-05-19 08:00');
    const b0 = await c0.boundingBox();
    const b8 = await c8.boundingBox();
    expect(b0).not.toBeNull();
    expect(b8).not.toBeNull();
    // 高さが揃っている（行ごとのばらつきがない）
    expect(Math.abs(b0!.height - b8!.height)).toBeLessThanOrEqual(1);
    // 固定 22px ではなく行高（ラベル基準の大きい方）に合わせて埋まっている
    expect(b0!.height).toBeGreaterThanOrEqual(28);
  });

  test('同一時間に複数記録を入れると色が横線で上下に分割され文字は出ない', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    const cell = page.getByLabel('観察 2026-05-19 00:00');
    await cell.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // 既定 2 行（00:00 / 00:30）をそのまま登録 → 2 件の観察記録
    await dialog.getByRole('button', { name: '登録' }).click();
    await expect(dialog).toBeHidden();
    // セルに各記録の色セグメントが分割表示される（後勝ちにならない）
    const segs = cell.locator('[data-testid="obs-segment"]');
    await expect(segs).toHaveCount(2);
    // 横線で上下に分割（縦分割ではない）: 2 つ目が 1 つ目の下、各セグメントはセル幅いっぱい
    const b0 = await segs.nth(0).boundingBox();
    const b1 = await segs.nth(1).boundingBox();
    const cellBox = await cell.boundingBox();
    expect(b1!.y).toBeGreaterThan(b0!.y + b0!.height - 2);
    expect(b0!.width).toBeGreaterThan(cellBox!.width * 0.6);
    // 分割範囲が均等（高さが等しい）
    expect(Math.abs(b0!.height - b1!.height)).toBeLessThanOrEqual(1);
    // 文字（状態名）は表示しない
    await expect(cell).not.toContainText('落ち着き');
  });

  test('診察記録の[未診察]セルをクリックで診療録作成ダイアログ（リッチ版）が開く', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    // 当日(2026-05-19)の [未診察] セルをクリック
    await page.getByLabel('診療録作成 2026-05-19').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // カルテ画面と同一のリッチな診療録作成ダイアログ
    await expect(dialog.getByText('診療録作成')).toBeVisible();
    await expect(dialog.getByText('DO引用')).toBeVisible();
    await expect(dialog.getByText('入院診療録')).toBeVisible();
  });

  test('診察記録の[絞込設定]をクリックで絞込設定ダイアログが開く', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    // ラベル「診察記録 [絞込設定]」は 1 行（折り返さない）
    const filterTd = page.getByRole('button', { name: '絞込設定' }).locator('xpath=ancestor::td[1]');
    expect((await filterTd.boundingBox())!.height).toBeLessThan(40);
    await page.getByRole('button', { name: '絞込設定' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // チェック項目（画像準拠）
    await expect(dialog.getByLabel('隔離中診察')).toBeVisible();
    await expect(dialog.getByLabel('拘束変更')).toBeVisible();
    // 既定で全てチェック
    await expect(dialog.getByLabel('隔離中診察')).toBeChecked();
    // クリアで全解除
    await dialog.getByRole('button', { name: '[クリア]' }).click();
    await expect(dialog.getByLabel('隔離中診察')).not.toBeChecked();
    // [全てチェック] は 1 行（折り返さない）
    const allBtn = dialog.getByRole('button', { name: '[全てチェック]' });
    const box = await allBtn.boundingBox();
    expect(box!.height).toBeLessThan(40);
  });

  test('既に記録があるセルに再入力しても重複せず置き換わる', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    const cell = page.getByLabel('観察 2026-05-19 01:00');
    // 1 回目の登録（既定 2 件）
    await cell.click();
    let dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '登録' }).click();
    await expect(dialog).toBeHidden();
    await expect(cell.locator('[data-testid="obs-segment"]')).toHaveCount(2);
    // 2 回目: 既存がプリロードされ（追加 (2/9) のまま）、保存しても重複せず 2 件のまま（置き換え）
    await cell.click();
    dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('追加 (2/9)')).toBeVisible();
    await dialog.getByRole('button', { name: '登録' }).click();
    await expect(dialog).toBeHidden();
    await expect(cell.locator('[data-testid="obs-segment"]')).toHaveCount(2);
  });

  test('フローシートサブタブに戻すとグリッドが消え既存内容が出る', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    await expect(page.getByText('23時', { exact: true })).toBeVisible();
    await page.getByRole('tab', { name: 'フローシート', exact: true }).click();
    // 隔離拘束グリッド（23時）が消える
    await expect(page.getByText('23時', { exact: true })).toBeHidden();
    // 既存フローシート内容（在院日数）は表示
    await expect(page.locator('text=在院日数')).toBeVisible();
  });

});

test.describe('一括バイタル入力', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/nursing/bulk-vitals');
  });

  test('一括バイタル入力画面が表示される', async ({ page }) => {
    await expect(page.locator('text=/一括|バイタル/').first()).toBeVisible();
  });

});

test.describe('部門記録簿', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/nursing/records');
  });

  test('部門記録簿画面が表示される', async ({ page }) => {
    await expect(page.locator('text=/記録|部門/').first()).toBeVisible();
  });

});
