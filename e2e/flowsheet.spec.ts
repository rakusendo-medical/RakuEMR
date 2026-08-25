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

  test('看護経過記録: 記録形式タブは SOAP／経時記録 の2つのみで SOAP 定型文が挿入される', async ({ page }) => {
    const nrRow = page.getByRole('row').filter({ has: page.getByRole('cell', { name: '看護記録', exact: true }) });
    await nrRow.getByRole('button', { name: '新規作成' }).first().click();
    const dialog = page.getByRole('dialog').filter({ hasText: '看護経過記録（新規作成）' });
    await expect(dialog).toBeVisible();
    // タブは SOAP／経時記録 の 2 つのみ（旧 FOCUS／フリーは廃止）
    await expect(dialog.getByRole('tab', { name: 'SOAP', exact: true })).toBeVisible();
    await expect(dialog.getByRole('tab', { name: '経時記録', exact: true })).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'FOCUS' })).toHaveCount(0);
    await expect(dialog.getByRole('tab', { name: 'フリー' })).toHaveCount(0);
    // 既定タブ SOAP の定型文（S/O/A/P の見出し 4 行）が本文に挿入されている
    await expect(dialog.getByLabel('本文')).toHaveValue('S\nO\nA\nP');
  });

  test('看護経過記録: 経時記録タブへ切替で時刻行の定型文が入り [時刻行を追加] で行が増える', async ({ page }) => {
    const nrRow = page.getByRole('row').filter({ has: page.getByRole('cell', { name: '看護記録', exact: true }) });
    await nrRow.getByRole('button', { name: '新規作成' }).first().click();
    const dialog = page.getByRole('dialog').filter({ hasText: '看護経過記録（新規作成）' });
    await expect(dialog).toBeVisible();
    // 本文が SOAP 定型文のまま（未編集）なので確認なしで切替できる
    await dialog.getByRole('tab', { name: '経時記録', exact: true }).click();
    const body = dialog.getByLabel('本文');
    await expect(body).toHaveValue(/^\d{2}:\d{2} $/);
    // 1 行目に本文を書き、[時刻行を追加] で現在時刻の行頭が改行して挿入される
    const first = await body.inputValue();
    await body.fill(`${first}意識清明`);
    await dialog.getByRole('button', { name: '時刻行を追加' }).click();
    await expect(body).toHaveValue(/^\d{2}:\d{2} 意識清明\n\d{2}:\d{2} $/);
  });

  test('看護経過記録: 本文編集後の形式切替は上書き確認をはさむ', async ({ page }) => {
    const nrRow = page.getByRole('row').filter({ has: page.getByRole('cell', { name: '看護記録', exact: true }) });
    await nrRow.getByRole('button', { name: '新規作成' }).first().click();
    const dialog = page.getByRole('dialog').filter({ hasText: '看護経過記録（新規作成）' });
    await expect(dialog).toBeVisible();
    const body = dialog.getByLabel('本文');
    await body.fill('S 「眠れない」と発言\nO 夜間覚醒 2 回\nA 不眠傾向\nP 主治医へ報告');
    await dialog.getByRole('tab', { name: '経時記録', exact: true }).click();
    // 上書き確認 → キャンセルで本文は保持される
    await expect(dialog.getByText(/経時記録の定型文で上書きしますか/)).toBeVisible();
    await dialog.getByRole('button', { name: 'キャンセル' }).click();
    await expect(body).toHaveValue(/眠れない/);
    // 再度切替して上書きを選ぶと経時記録の定型文に置き換わる
    await dialog.getByRole('tab', { name: '経時記録', exact: true }).click();
    await dialog.getByRole('button', { name: '上書きして 経時記録 に切替' }).click();
    await expect(body).toHaveValue(/^\d{2}:\d{2} $/);
  });

  test('看護経過記録: 経時記録で登録すると部門記録簿に「経時」チップで表示される', async ({ page }) => {
    test.slow(); // beforeEach のカルテ表示 + 部門記録簿への goto で初期化が 2 回走るため
    // ストアはインメモリのため、部門記録簿ページ内で作成→一覧反映まで確認する
    await page.goto('/nursing/records?patientId=P001');
    await page.getByRole('button', { name: '新規作成' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: '看護経過記録（新規作成）' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('tab', { name: '経時記録', exact: true }).click();
    const body = dialog.getByLabel('本文');
    await body.fill(`${await body.inputValue()}朝食全量摂取`);
    await dialog.getByLabel('タイトル').fill('経時記録テスト');
    await dialog.getByRole('button', { name: '登録', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    // 当該記事のカードに記録形式チップ「経時」が付く
    const card = page.locator('.MuiCard-root').filter({ hasText: '経時記録テスト' });
    await expect(card).toBeVisible();
    await expect(card.getByText('経時', { exact: true })).toBeVisible();
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
    await page.getByLabel('観察 2026-08-24 00:00').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // 観察記録ダイアログが開いている（登録ボタンの存在で判定）
    await expect(dialog.getByRole('button', { name: '登録' })).toBeVisible();
    // 既定で 2 行（00分・30分）→「追加 (2/9)」表示
    await expect(dialog.getByText('追加 (2/9)')).toBeVisible();
  });

  test('観察記録ダイアログで観察間隔（15分/30分）を切り替えられる', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    await page.getByLabel('観察 2026-08-24 00:00').click();
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
    const cell = page.getByLabel('観察 2026-08-24 00:00');
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
    const c0 = page.getByLabel('観察 2026-08-24 00:00');
    const c8 = page.getByLabel('観察 2026-08-24 08:00');
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
    const cell = page.getByLabel('観察 2026-08-24 00:00');
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
    await page.getByLabel('診療録作成 2026-08-24').click();
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
    const cell = page.getByLabel('観察 2026-08-24 01:00');
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
    const cell = page.getByLabel('観察 2026-08-24 03:00');
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
    await page.getByLabel('観察 2026-08-18 00:00').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: '登録' })).toBeVisible();
  });

  test('観察記録の登録で成功トーストが表示される', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    await page.getByLabel('観察 2026-08-24 05:00').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '登録' }).click();
    // MUI Alert（role=alert・右上 anchorOrigin）に登録メッセージ
    await expect(page.getByRole('alert')).toContainText('観察記録を');
  });

  test('観察記録ダイアログに×ボタンが無く、キャンセルで閉じても記録は増えない', async ({ page }) => {
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    const cell = page.getByLabel('観察 2026-08-24 06:00');
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
    await page.getByLabel('観察 2026-08-24 07:00').click();
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
    const addCell = page.getByLabel('観察 2026-08-24 09:00');
    await addCell.click();
    let dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /^追加 \(/ }).click();
    await expect(dialog.getByText('追加 (3/9)')).toBeVisible();
    await dialog.getByRole('button', { name: '登録' }).click();
    await expect(dialog).toBeHidden();
    await expect(addCell.locator('[data-testid="obs-segment"]')).toHaveCount(3);
    // 行を 1 つ削除（2→1 行）して登録 → 1 セグメント
    const delCell = page.getByLabel('観察 2026-08-24 10:00');
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
    const cell = page.getByLabel('観察 2026-08-24 11:00');
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
    const cell = page.getByLabel('観察 2026-08-24 12:00');
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
    const nightCell = page.getByLabel('観察 2026-08-24 22:00');
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
    const dayCell = page.getByLabel('観察 2026-08-24 14:00');
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
    await expect(page.getByRole('cell', { name: '2026/8/24(火)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '2026/8/18(水)' })).toBeVisible();

    // ＜（1日前）: 右端が 5/18 に、左端は 5/12 になる
    await page.getByRole('button', { name: '1日前' }).click();
    await expect(page.getByRole('cell', { name: '2026/8/23(月)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '2026/8/17(火)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '2026/8/24(火)' })).toBeHidden();

    // ＞（1日後）で戻る
    await page.getByRole('button', { name: '1日後' }).click();
    await expect(page.getByRole('cell', { name: '2026/8/24(火)' })).toBeVisible();

    // ≫（7日後）: 5/20〜5/26
    await page.getByRole('button', { name: '7日後' }).click();
    await expect(page.getByRole('cell', { name: '2026/8/31(火)' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '2026/8/25(水)' })).toBeVisible();

    // ≪（7日前）で戻る
    await page.getByRole('button', { name: '7日前' }).click();
    await expect(page.getByRole('cell', { name: '2026/8/24(火)' })).toBeVisible();

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

  test('フローシート最下部の[パターン変更]ボタンでダイアログを開き適用期間を登録するとバーに反映される', async ({ page }) => {
    // 最下部に「パターン変更」ボタンが表示される
    await expect(page.getByRole('button', { name: 'パターン変更', exact: true })).toBeVisible();
    // 初期は「身体管理」の適用なし
    await expect(page.getByText('身体管理', { exact: true })).toHaveCount(0);
    // [パターン変更] ボタン → フローシートパターン変更ダイアログ
    await page.getByRole('button', { name: 'パターン変更', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // ヘッダーでパターン「身体管理」を選択 → [登録] で適用期間テーブルに追加
    await dialog.getByLabel('パターン').first().click();
    await page.getByRole('option', { name: '身体管理' }).click();
    await dialog.getByRole('button', { name: '登録' }).click();
    // 新規適用の確認サブダイアログ → OK
    const applyConfirm = page.getByRole('dialog').filter({ hasText: 'ケアメニューデータは削除されます' });
    await expect(applyConfirm).toBeVisible();
    await applyConfirm.getByRole('button', { name: 'OK' }).click();
    // 適用期間テーブルに「身体管理」行（参照モードのテキスト表示）が追加される
    await expect(dialog.getByRole('row', { name: '適用パターン行 身体管理' })).toBeVisible();
    // [キャンセル] → ダイアログが閉じ、最下部バーに「身体管理」（適用済）が反映
    await dialog.getByRole('button', { name: 'キャンセル' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('身体管理', { exact: true })).toBeVisible();
  });

  test('パターン適用で入力項目が展開され、セルは直接入力できない（開始日前は非表示）', async ({ page }) => {
    // 既定適用の「精神科隔離」パターンは項目に展開される
    await expect(page.getByText('観察', { exact: true })).toBeVisible();
    await expect(page.getByText('安全確認', { exact: true })).toBeVisible();
    // 既定の 精神科隔離 は 2026-05-16 適用開始 → 開始日より前（5/13）はセルなし
    await expect(page.getByLabel('精神科隔離 観察 2026-08-18')).toHaveCount(0);
    // 開始日以降（5/16）はセルがあるが読み取り専用（入力欄=textbox は無い・初期は空）
    const cell = page.getByLabel('精神科隔離 観察 2026-08-21');
    await expect(cell).toBeVisible();
    await expect(cell).toHaveText('');
    await expect(page.getByRole('textbox', { name: '精神科隔離 観察 2026-08-21' })).toHaveCount(0);
  });

  test('入力可能日付の[入力]で入力ダイアログを開き、登録するとセルに反映される', async ({ page }) => {
    // 精神科隔離 は 5/16 開始 → 開始日より前（5/13）の見出しに [入力] は無い
    await expect(page.getByRole('button', { name: '精神科隔離 入力 2026-08-18' })).toHaveCount(0);
    // 入力可能日付（開始日以降・5/16）の見出しセルに [入力] → 入力ダイアログ
    await page.getByRole('button', { name: '精神科隔離 入力 2026-08-21' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('精神科隔離 新規作成')).toBeVisible();
    // ダイアログにはパターンの各項目フィールドが並ぶ
    await expect(dialog.getByLabel('入力 観察')).toBeVisible();
    await expect(dialog.getByLabel('入力 安全確認')).toBeVisible();
    // 「観察」に入力 → [登録]（日付＝クリックした 5/16）
    await dialog.getByLabel('入力 観察').fill('異常なし');
    await dialog.getByRole('button', { name: '登録' }).click();
    await expect(dialog).toBeHidden();
    // 本体テーブルの 2026-05-16 観察セル（読み取り専用）に反映される
    await expect(page.getByLabel('精神科隔離 観察 2026-08-21')).toHaveText('異常なし');
  });

  test('適用期間テーブルの既存行を変更すると確認サブダイアログ後に反映される', async ({ page }) => {
    await page.getByRole('button', { name: 'パターン変更', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // 精神科隔離 行をクリックして編集モードに入り、開始日を 2026-05-17 に変更 → [更新] 出現
    await dialog.getByRole('row', { name: '適用パターン行 精神科隔離' }).click();
    await dialog.getByLabel('開始日 精神科隔離').fill('2026-08-22');
    const updateBtn = dialog.getByRole('button', { name: '更新' });
    await expect(updateBtn).toBeVisible();
    await updateBtn.click();
    // 確認サブダイアログ（適用日以降のデータ削除）→ OK
    const confirm = page.getByRole('dialog').filter({ hasText: 'ケアメニューデータは削除されます' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'OK' }).click();
    await expect(confirm).toBeHidden();
    // ダイアログを閉じて本体テーブルを確認
    await dialog.getByRole('button', { name: 'キャンセル' }).click();
    // 反映: 精神科隔離 見出しの [入力] が新開始日 5/17 にゲーティング（5/16 は消え、5/17 が出る）
    await expect(page.getByRole('button', { name: '精神科隔離 入力 2026-08-21' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '精神科隔離 入力 2026-08-22' })).toBeVisible();
  });

  test('パターンボックスの表示モードトグルで全パターン/適用パターン名を切り替えられる', async ({ page }) => {
    // 既定は「適用パターン名」→ 適用中の 精神科隔離 は見えるが、未適用の「身体管理」の項目は非表示
    await expect(page.getByLabel('パターン適用済 精神科隔離')).toBeVisible();
    await expect(page.getByText('水分', { exact: true })).toHaveCount(0);
    // 「全パターン」に切替 → 未適用パターン（身体管理）の項目も表示される
    await page.getByRole('button', { name: '全パターン表示' }).click();
    await expect(page.getByText('水分', { exact: true })).toBeVisible();
    // 未適用パターンには [入力] ボタンが無い（開始日が無いため）
    await expect(page.getByRole('button', { name: /^身体管理 入力/ })).toHaveCount(0);
    // 「適用パターン名」へ戻すと未適用パターンの項目は消える
    await page.getByRole('button', { name: '適用パターン名表示' }).click();
    await expect(page.getByText('水分', { exact: true })).toHaveCount(0);
  });

  test('パターン削除で適用解除される（AC-6）', async ({ page }) => {
    // 精神科隔離（5/16）の [入力] があることを確認
    await expect(page.getByRole('button', { name: '精神科隔離 入力 2026-08-21' })).toBeVisible();
    await page.getByRole('button', { name: 'パターン変更', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // 精神科隔離 行（2行目）を削除 → 確認サブダイアログ → OK で適用解除
    await dialog.getByRole('button', { name: '削除' }).nth(1).click();
    const delConfirm = page.getByRole('dialog').filter({ hasText: 'を適用解除します' });
    await expect(delConfirm).toBeVisible();
    await delConfirm.getByRole('button', { name: 'OK' }).click();
    await expect(delConfirm).toBeHidden();
    // 行が消える
    await expect(dialog.getByRole('row', { name: '適用パターン行 精神科隔離' })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'キャンセル' }).click();
    // グリッドから 精神科隔離 の [入力] も消える
    await expect(page.getByRole('button', { name: '精神科隔離 入力 2026-08-21' })).toHaveCount(0);
  });

  test('入力済みの値があるパターンは削除できない', async ({ page }) => {
    // 精神科隔離 5/16 に値を入力
    await page.getByRole('button', { name: '精神科隔離 入力 2026-08-21' }).click();
    const entry = page.getByRole('dialog');
    await entry.getByLabel('入力 観察').fill('異常なし');
    await entry.getByRole('button', { name: '登録' }).click();
    await expect(entry).toBeHidden();
    // パターン変更ダイアログで 精神科隔離（2行目）の [削除] → 削除不可
    await page.getByRole('button', { name: 'パターン変更', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '削除' }).nth(1).click();
    // 削除確認サブダイアログは開かず、警告が出て行は残る
    await expect(page.getByRole('dialog').filter({ hasText: 'を適用解除します' })).toHaveCount(0);
    await expect(page.getByText('入力済みの値があるため削除できません')).toBeVisible();
    await expect(dialog.getByRole('row', { name: '適用パターン行 精神科隔離' })).toBeVisible();
  });

  test('パターンに終了日を設定すると、終了日以降は入力できない', async ({ page }) => {
    await page.getByRole('button', { name: 'パターン変更', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // 精神科隔離（5/16開始）行を編集モードにし、終了日 2026-05-17 を設定 → [更新] → 確認 OK
    await dialog.getByRole('row', { name: '適用パターン行 精神科隔離' }).click();
    await dialog.getByLabel('終了日 精神科隔離').fill('2026-08-22');
    await dialog.getByRole('button', { name: '更新' }).click();
    const confirm = page.getByRole('dialog').filter({ hasText: 'ケアメニューデータは削除されます' });
    await confirm.getByRole('button', { name: 'OK' }).click();
    await expect(confirm).toBeHidden();
    await dialog.getByRole('button', { name: 'キャンセル' }).click();
    // 終了日まで（5/17）は [入力] 可、終了日より後（5/18）は [入力] なし
    await expect(page.getByRole('button', { name: '精神科隔離 入力 2026-08-22' })).toBeVisible();
    await expect(page.getByRole('button', { name: '精神科隔離 入力 2026-08-23' })).toHaveCount(0);
  });

  test('新規適用は確認サブダイアログを挟み、適用日以降のケアメニューデータが削除される（AC-1/AC-3）', async ({ page }) => {
    // 精神科隔離 5/16 に「観察=異常なし」を入力しておく
    await page.getByRole('button', { name: '精神科隔離 入力 2026-08-21' }).click();
    const entry = page.getByRole('dialog');
    await entry.getByLabel('入力 観察').fill('異常なし');
    await entry.getByRole('button', { name: '登録' }).click();
    await expect(entry).toBeHidden();
    await expect(page.getByLabel('精神科隔離 観察 2026-08-21')).toHaveText('異常なし');
    // パターン変更で 5/16 開始の新規適用 → 確認 → OK
    await page.getByRole('button', { name: 'パターン変更', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('開始日', { exact: true }).fill('2026-08-21');
    await dialog.getByRole('button', { name: '登録' }).click();
    const applyConfirm = page.getByRole('dialog').filter({ hasText: 'ケアメニューデータは削除されます' });
    await expect(applyConfirm).toBeVisible();
    await applyConfirm.getByRole('button', { name: 'OK' }).click();
    await dialog.getByRole('button', { name: 'キャンセル' }).click();
    // 5/16 以降のケアメニューデータが削除される → 観察 5/16 セルは空
    await expect(page.getByLabel('精神科隔離 観察 2026-08-21')).toHaveText('');
  });

  test('新規適用の確認をキャンセルすると何も適用されない（AC-8）', async ({ page }) => {
    await page.getByRole('button', { name: 'パターン変更', exact: true }).click();
    const dialog = page.getByRole('dialog');
    // パターン「身体管理」を選び [登録] → 確認 → キャンセル
    await dialog.getByLabel('パターン').first().click();
    await page.getByRole('option', { name: '身体管理' }).click();
    await dialog.getByRole('button', { name: '登録' }).click();
    const applyConfirm = page.getByRole('dialog').filter({ hasText: 'ケアメニューデータは削除されます' });
    await applyConfirm.getByRole('button', { name: 'キャンセル' }).click();
    await expect(applyConfirm).toBeHidden();
    // 「身体管理」行は追加されない
    await expect(dialog.getByRole('row', { name: '適用パターン行 身体管理' })).toHaveCount(0);
  });

  test('日付のフローシートアイコンで、その日の適用パターンの項目のみ編集できる（AC-4）', async ({ page }) => {
    // 5/16 は 精神科隔離 適用 → フローシートアイコンで 精神科隔離 の項目のみのダイアログが開く
    await page.getByRole('button', { name: 'フローシート編集 2026-08-21' }).click();
    const entry = page.getByRole('dialog');
    await expect(entry.getByText('精神科隔離 新規作成')).toBeVisible();
    await expect(entry.getByLabel('入力 観察')).toBeVisible();
    // 別パターン（精神科基本）の項目は表示されない
    await expect(entry.getByLabel('入力 睡眠')).toHaveCount(0);
  });

  test('下方スクロールで「一番上へスクロール」ボタンが現れ、押すと先頭へ戻る', async ({ page }) => {
    const fab = page.getByRole('button', { name: '一番上へスクロール' });
    const scroller = page.getByTestId('karte-scroll');
    // 初期（先頭）はボタン非表示
    await expect(fab).toHaveCount(0);
    // 本文を下へスクロール → ボタンが出る
    await scroller.evaluate((el) => el.scrollTo(0, 800));
    await expect(fab).toBeVisible();
    // 押すと先頭へ戻り、ボタンは消える
    await fab.click();
    await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeLessThan(200);
    await expect(fab).toHaveCount(0);
  });

  test('隔離拘束サブタブではパターン変更セクションが表示されない', async ({ page }) => {
    // フローシートサブタブでは [パターン変更] ボタン・凡例が見える
    await expect(page.getByRole('button', { name: 'パターン変更', exact: true })).toBeVisible();
    await expect(page.getByText('グレー＝パターンなし')).toBeVisible();
    // 隔離拘束サブタブに切替 → パターン変更セクションは消える
    await page.getByRole('tab', { name: '隔離拘束', exact: true }).click();
    await expect(page.getByRole('button', { name: 'パターン変更', exact: true })).toHaveCount(0);
    await expect(page.getByText('グレー＝パターンなし')).toHaveCount(0);
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
