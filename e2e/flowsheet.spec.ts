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

  test('看護記録: フローシートの新規作成はフッターと同一の看護経過記録ダイアログを開く', async ({ page }) => {
    // 看護記録行（「看護記録」ラベルセルを含む row）にスコープして [新規作成] をクリック
    const nrRow = page.getByRole('row').filter({ has: page.getByRole('cell', { name: '看護記録', exact: true }) });
    await nrRow.getByRole('button', { name: '新規作成' }).first().click();
    const dialog = page.getByRole('dialog').filter({ hasText: '看護経過記録（新規作成）' });
    await expect(dialog).toBeVisible();
    // NursingRecordDialog の特徴（テンプレート呼出・タグ欄）が出る
    await expect(dialog.getByRole('button', { name: 'テンプレート呼出' })).toBeVisible();
    await expect(dialog.getByPlaceholder('タグを追加 (Enter)')).toBeVisible();
    // 旧「看護記録 新規登録」ダイアログは表示されない
    await expect(page.getByText('看護記録 新規登録')).toHaveCount(0);
  });

  test('看護記録: フローシートで作成すると当該日の看護記録行にリンク表示される', async ({ page }) => {
    const nrRow = page.getByRole('row').filter({ has: page.getByRole('cell', { name: '看護記録', exact: true }) });
    await nrRow.getByRole('button', { name: '新規作成' }).first().click();
    const dialog = page.getByRole('dialog').filter({ hasText: '看護経過記録（新規作成）' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('タイトル').fill('熱発対応');
    await dialog.getByRole('button', { name: '登録', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    // 記載日に対応する列の看護記録行に作成した記録のリンクが表示される
    await expect(page.getByText('看護記録(熱発対応)')).toBeVisible();
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

  test('隔離拘束グリッドで勤務帯（24時間/日勤/夜勤）を切り替えられる', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    // 既定は 24 時間（0時・23時あり）
    await expect(page.getByText('0時', { exact: true })).toBeVisible();
    await expect(page.getByText('23時', { exact: true })).toBeVisible();
    // 日勤 → 9〜16時のみ（9時/16時あり、0時/23時なし）
    await page.getByRole('button', { name: '日勤' }).click();
    await expect(page.getByText('9時', { exact: true })).toBeVisible();
    await expect(page.getByText('16時', { exact: true })).toBeVisible();
    await expect(page.getByText('0時', { exact: true })).toBeHidden();
    await expect(page.getByText('23時', { exact: true })).toBeHidden();
    // 夜勤 → 17〜翌8時（17時/8時あり、9時なし）
    await page.getByRole('button', { name: '夜勤' }).click();
    await expect(page.getByText('17時', { exact: true })).toBeVisible();
    await expect(page.getByText('8時', { exact: true })).toBeVisible();
    await expect(page.getByText('9時', { exact: true })).toBeHidden();
    // 24時間に戻す
    await page.getByRole('button', { name: '24時間' }).click();
    await expect(page.getByText('23時', { exact: true })).toBeVisible();
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

  test('15分単位で登録するとセルが4セグメントに分割される', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    // 既存記録のない時間帯（03:00）を使う
    const cell = page.getByLabel('観察 2026-05-19 03:00');
    await cell.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // 15 分単位へ切替 → 4 行（00/15/30/45分）
    await dialog.getByRole('button', { name: '15分単位' }).click();
    await expect(dialog.getByText('追加 (4/9)')).toBeVisible();
    // 登録 → セルに 4 セグメント（03:00/03:15/03:30/03:45）
    await dialog.getByRole('button', { name: '登録' }).click();
    await expect(dialog).toBeHidden();
    await expect(cell.locator('[data-testid="obs-segment"]')).toHaveCount(4);
  });

  test('当日以外の日付列セルをクリックしても観察記録ダイアログが開く', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    // 7 日列の先頭日（2026-05-13・非当日）のセル
    await page.getByLabel('観察 2026-05-13 00:00').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: '登録' })).toBeVisible();
  });

  test('観察記録の登録で成功トーストが表示される', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    await page.getByLabel('観察 2026-05-19 05:00').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '登録' }).click();
    // MUI Alert（role=alert・右上 anchorOrigin）に登録メッセージ
    await expect(page.getByRole('alert')).toContainText('観察記録を');
  });

  test('観察記録ダイアログに×ボタンが無く、キャンセルで閉じても記録は増えない', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    const cell = page.getByLabel('観察 2026-05-19 06:00');
    await cell.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // design-rules: × ボタン（close）を置かない
    await expect(dialog.getByRole('button', { name: /close|閉じる|×/i })).toHaveCount(0);
    // キャンセルで閉じる → セルに記録は増えない
    await dialog.getByRole('button', { name: 'キャンセル' }).click();
    await expect(dialog).toBeHidden();
    await expect(cell.locator('[data-testid="obs-segment"]')).toHaveCount(0);
  });

  test('絞込設定で[クリア]→[全てチェック]で全項目が再チェックされ[設定]で閉じる', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    await page.getByRole('button', { name: '絞込設定' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // クリアで全解除
    await dialog.getByRole('button', { name: '[クリア]' }).click();
    await expect(dialog.getByLabel('隔離中診察')).not.toBeChecked();
    await expect(dialog.getByLabel('拘束変更')).not.toBeChecked();
    // [全てチェック] で全項目が再チェック
    await dialog.getByRole('button', { name: '[全てチェック]' }).click();
    await expect(dialog.getByLabel('隔離中診察')).toBeChecked();
    await expect(dialog.getByLabel('拘束変更')).toBeChecked();
    // [設定] で閉じる
    await dialog.getByRole('button', { name: '設定' }).click();
    await expect(dialog).toBeHidden();
  });

  test('観察記録ダイアログで行を追加・削除でき、9件で追加が止まる', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    await page.getByLabel('観察 2026-05-19 07:00').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const addBtn = dialog.getByRole('button', { name: /^追加 \(/ });
    const deleteIcons = dialog.locator('button:has([data-testid="DeleteIcon"])');
    // 既定 2 行
    await expect(addBtn).toHaveText('追加 (2/9)');
    await expect(deleteIcons).toHaveCount(2);
    // 1 行追加 → 3 行
    await addBtn.click();
    await expect(addBtn).toHaveText('追加 (3/9)');
    await expect(deleteIcons).toHaveCount(3);
    // 先頭行を削除 → 2 行に戻る
    await deleteIcons.first().click();
    await expect(addBtn).toHaveText('追加 (2/9)');
    await expect(deleteIcons).toHaveCount(2);
    // 9 件まで追加すると追加ボタンが無効化（上限）
    for (let i = 0; i < 7; i++) await addBtn.click();
    await expect(addBtn).toHaveText('追加 (9/9)');
    await expect(addBtn).toBeDisabled();
  });

  test('行を増減した状態で登録するとセルにその件数が反映される', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    // 行を 1 つ追加（2→3 行）して登録 → 3 セグメント
    const addCell = page.getByLabel('観察 2026-05-19 09:00');
    await addCell.click();
    let dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /^追加 \(/ }).click();
    await expect(dialog.getByText('追加 (3/9)')).toBeVisible();
    await dialog.getByRole('button', { name: '登録' }).click();
    await expect(dialog).toBeHidden();
    await expect(addCell.locator('[data-testid="obs-segment"]')).toHaveCount(3);
    // 行を 1 つ削除（2→1 行）して登録 → 1 セグメント
    const delCell = page.getByLabel('観察 2026-05-19 10:00');
    await delCell.click();
    dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('button:has([data-testid="DeleteIcon"])').first().click();
    await expect(dialog.getByText('追加 (1/9)')).toBeVisible();
    await dialog.getByRole('button', { name: '登録' }).click();
    await expect(dialog).toBeHidden();
    await expect(delCell.locator('[data-testid="obs-segment"]')).toHaveCount(1);
  });

  test('最大の9行まで増やして登録すると9セグメントが反映される', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    const cell = page.getByLabel('観察 2026-05-19 11:00');
    await cell.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const addBtn = dialog.getByRole('button', { name: /^追加 \(/ });
    // 既定 2 行 → 9 行（上限）まで追加
    for (let i = 0; i < 7; i++) await addBtn.click();
    await expect(addBtn).toHaveText('追加 (9/9)');
    // 登録 → セルに 9 セグメント
    await dialog.getByRole('button', { name: '登録' }).click();
    await expect(dialog).toBeHidden();
    await expect(cell.locator('[data-testid="obs-segment"]')).toHaveCount(9);
  });

  test('既存記録のあるセルに上書きすると値が新しい状態へ正しく書き換わる', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    const cell = page.getByLabel('観察 2026-05-19 12:00');
    const segs = cell.locator('[data-testid="obs-segment"]');
    // 1 回目: 既定（落ち着き×2）で登録
    await cell.click();
    let dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '登録' }).click();
    await expect(dialog).toBeHidden();
    await expect(segs).toHaveCount(2);
    // 先頭セグメントは「落ち着き」（title 属性 = 時刻 + 状態）
    await expect(segs.first()).toHaveAttribute('title', /落ち着き/);
    // 2 回目: 既存がプリロード → 先頭行の状態を「不穏」へ変更して上書き登録
    await cell.click();
    dialog = page.getByRole('dialog');
    await expect(dialog.getByText('追加 (2/9)')).toBeVisible();
    await dialog.getByLabel('状態').first().click();
    await page.getByRole('option', { name: '不穏', exact: true }).click();
    await dialog.getByRole('button', { name: '登録' }).click();
    await expect(dialog).toBeHidden();
    // 件数は 2 のまま・先頭が「落ち着き」→「不穏」に正しく書き換わる（重複も残存もしない）
    await expect(segs).toHaveCount(2);
    await expect(segs.first()).toHaveAttribute('title', /不穏/);
    await expect(cell).not.toContainText('落ち着き');
  });

  test('勤務帯（夜勤/日勤）を切り替えてから入力しても反映される', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    // 夜勤に切替 → 夜勤帯（22時）のセルに入力
    await page.getByRole('button', { name: '夜勤' }).click();
    const nightCell = page.getByLabel('観察 2026-05-19 22:00');
    await expect(nightCell).toBeVisible();
    await nightCell.click();
    let dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '登録' }).click();
    await expect(dialog).toBeHidden();
    await expect(nightCell.locator('[data-testid="obs-segment"]')).toHaveCount(2);
    // 夜勤表示のまま（9時は非表示）で反映されている
    await expect(page.getByText('9時', { exact: true })).toBeHidden();
    // 日勤に切替 → 日勤帯（14時）のセルにも入力できて反映される
    await page.getByRole('button', { name: '日勤' }).click();
    const dayCell = page.getByLabel('観察 2026-05-19 14:00');
    await expect(dayCell).toBeVisible();
    await dayCell.click();
    dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '登録' }).click();
    await expect(dialog).toBeHidden();
    await expect(dayCell.locator('[data-testid="obs-segment"]')).toHaveCount(2);
  });

  test('勤務帯ボタンは選択中だけが押下状態（aria-pressed）になる', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    const b24 = page.getByRole('button', { name: '24時間' });
    const bDay = page.getByRole('button', { name: '日勤' });
    const bNight = page.getByRole('button', { name: '夜勤' });
    // 既定は 24 時間が押下状態
    await expect(b24).toHaveAttribute('aria-pressed', 'true');
    await expect(bDay).toHaveAttribute('aria-pressed', 'false');
    await expect(bNight).toHaveAttribute('aria-pressed', 'false');
    // 日勤へ切替 → 日勤のみ押下
    await bDay.click();
    await expect(bDay).toHaveAttribute('aria-pressed', 'true');
    await expect(b24).toHaveAttribute('aria-pressed', 'false');
    await expect(bNight).toHaveAttribute('aria-pressed', 'false');
  });

  test('日付ナビ（≪ ＜ 当日 ＞ ≫）で 7 日列が移動する', async ({ page }) => {
    // 初期表示はモックデータの 7 日（2026/5/13〜5/19）
    await expect(page.getByRole('cell', { name: '2026/5/19(火)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '2026/5/13(水)' })).toBeVisible();

    // ＜（1日前）: 右端が 5/18 に、左端は 5/12 になる
    await page.getByRole('button', { name: '1日前' }).click();
    await expect(page.getByRole('cell', { name: '2026/5/18(月)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '2026/5/12(火)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '2026/5/19(火)' })).toBeHidden();

    // ＞（1日後）で戻る
    await page.getByRole('button', { name: '1日後' }).click();
    await expect(page.getByRole('cell', { name: '2026/5/19(火)' })).toBeVisible();

    // ≫（7日後）: 5/20〜5/26
    await page.getByRole('button', { name: '7日後' }).click();
    await expect(page.getByRole('cell', { name: '2026/5/26(火)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '2026/5/20(水)' })).toBeVisible();

    // ≪（7日前）で戻る
    await page.getByRole('button', { name: '7日前' }).click();
    await expect(page.getByRole('cell', { name: '2026/5/19(火)' })).toBeVisible();

    // 当日: 実際の当日が右端に来る
    const now = new Date();
    const weekday = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()];
    const label = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}(${weekday})`;
    await page.getByRole('button', { name: '当日を右端に表示' }).click();
    await expect(page.getByRole('cell', { name: label })).toBeVisible();
  });

  test('日付送りしても在院日数が日付に追随する', async ({ page }) => {
    // 2026/5/19 = 34 日目（モック定義）
    await expect(page.getByRole('cell', { name: '34日目' })).toBeVisible();
    await page.getByRole('button', { name: '1日後' }).click();
    // 右端が 5/20 になり 35 日目が現れる
    await expect(page.getByRole('cell', { name: '35日目' })).toBeVisible();
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

  test('部門記録簿: タグチップで記事を絞り込める（複数選択はAND）', async ({ page }) => {
    await page.goto('/nursing/records?patientId=P001');
    // 初期は seed の2記事が見える（気分変動=[看護記録]／転倒リスク=[看護記録,リスク管理]）
    await expect(page.getByText('気分変動')).toBeVisible();
    await expect(page.getByText('転倒リスク')).toBeVisible();
    // タグ「看護記録」だけ → 両方が持つので両方表示のまま
    await page.getByRole('button', { name: 'タグ絞り込み 看護記録' }).click();
    await expect(page.getByText('気分変動')).toBeVisible();
    await expect(page.getByText('転倒リスク')).toBeVisible();
    // さらに「リスク管理」も選択（AND）→ 両タグを持つ「転倒リスク」だけに絞られる
    await page.getByRole('button', { name: 'タグ絞り込み リスク管理' }).click();
    await expect(page.getByText('転倒リスク')).toBeVisible();
    await expect(page.getByText('気分変動')).toHaveCount(0);
    // クリアで両方に戻る
    await page.getByRole('button', { name: 'クリア' }).click();
    await expect(page.getByText('気分変動')).toBeVisible();
  });

  test('部門記録簿: 表示モード切替でタグ絞り込みがリセットされる', async ({ page }) => {
    await page.goto('/nursing/records?patientId=P001');
    await page.getByRole('button', { name: 'タグ絞り込み リスク管理' }).click();
    await expect(page.getByText('気分変動')).toHaveCount(0); // 絞り込み中
    // 表示モードを「全て」に切替 → タグ選択がリセットされ両方表示に戻る
    await page.getByRole('button', { name: '全て', exact: true }).click();
    await expect(page.getByText('気分変動')).toBeVisible();
    await expect(page.getByText('転倒リスク')).toBeVisible();
  });

  test('部門記録簿: 検索ボックスでタグ名でも検索できる', async ({ page }) => {
    await page.goto('/nursing/records?patientId=P001');
    await page.getByPlaceholder('検索（タイトル・本文・タグ）').fill('リスク管理');
    await expect(page.getByText('転倒リスク')).toBeVisible();
    await expect(page.getByText('気分変動')).toHaveCount(0);
  });

  test('看護経過記録: テンプレート呼出の下のタグ欄で自由入力＋Enterで複数タグを付けられる', async ({ page }) => {
    await page.getByRole('button', { name: '新規作成' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: '看護経過記録（新規作成）' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'テンプレート呼出' })).toBeVisible();

    // テンプレート呼出の下のタグ欄で、自由入力→Enter で複数タグを付与できる
    const tagInput = dialog.getByPlaceholder('タグを追加 (Enter)');
    await expect(tagInput).toBeVisible();
    await tagInput.fill('観察');
    await tagInput.press('Enter');
    await tagInput.fill('申し送り事項');
    await tagInput.press('Enter');
    await expect(dialog.getByText('観察', { exact: true })).toBeVisible();
    await expect(dialog.getByText('申し送り事項', { exact: true })).toBeVisible();

    // 同じタグは重複して追加されない
    await tagInput.fill('観察');
    await tagInput.press('Enter');
    await expect(dialog.getByText('観察', { exact: true })).toHaveCount(1);
  });

});
