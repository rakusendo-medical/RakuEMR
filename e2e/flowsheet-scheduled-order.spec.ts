import { test, expect } from './fixtures';

/**
 * ep-10 予定オーダ連携: オーダ入力（オーダ送信画面）で作成したオーダが、
 * カルテのフローシート「予定オーダ」欄に、開始日の列で種名1文字として反映される。
 * （参考システムマニュアル 02 看護支援 第1章第2部：予定オーダ欄はオーダリングで出したオーダを種名1文字で表示）
 */
test.describe('フローシート 予定オーダ連携', () => {
  test('検査を 5/19 で作成 → フローシート予定オーダ欄（当日列）に「検」が反映', async ({ page }) => {
    await page.goto('/karte/P001');
    await expect(page.getByRole('button', { name: 'オーダー入力' })).toBeVisible();

    // 予定オーダ行の当日(5/19)セルに、初期状態では「検」が無いことを確認
    const orderRow = page.getByRole('row').filter({ hasText: '予定オーダ' });
    // フローシートタブへ（初期確認）
    await page.getByRole('tab', { name: 'フローシート・隔離拘束', exact: true }).click();
    await expect(orderRow.getByRole('cell').last()).not.toContainText('検');

    // オーダ入力 → 検査を 実施予定日=2026-05-19 で作成
    await page.getByRole('button', { name: 'オーダー入力' }).click();
    const send = page.getByRole('dialog').filter({ hasText: 'オーダ送信' });
    await expect(send).toBeVisible();
    await send.getByRole('button', { name: '検査', exact: true }).click();
    const test = page.getByRole('dialog').filter({ hasText: '検査セット' });
    await expect(test).toBeVisible();
    await test.getByLabel('実施予定日').fill('2026-05-19');
    await test.getByRole('button', { name: '院内セット1' }).click();
    await test.getByRole('button', { name: '登録' }).click();
    // [指示] → カルテ記事作成（現在指示中）→ [実行] で確定
    await send.getByRole('button', { name: '指示', exact: true }).click();
    const karte = page.getByRole('dialog').filter({ hasText: 'カルテ記事作成' });
    await expect(karte).toBeVisible();
    await karte.getByRole('button', { name: '実行', exact: true }).click();
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();

    // フローシート予定オーダ欄の当日(5/19)列に「検」が反映される
    await page.getByRole('tab', { name: 'フローシート・隔離拘束', exact: true }).click();
    await expect(orderRow.getByRole('cell').last()).toContainText('検');

    // 「一覧」→ 指示状況（参照）ダイアログに作成した検査オーダが出る
    await orderRow.getByRole('button', { name: '一覧' }).click();
    const listDialog = page.getByRole('dialog').filter({ hasText: '指示状況' });
    await expect(listDialog).toBeVisible();
    await expect(listDialog.getByText(/参照のみ/)).toBeVisible();
    await expect(listDialog.getByRole('row', { name: /検査/ }).first()).toBeVisible();
    await listDialog.getByRole('button', { name: '閉じる' }).click();
    await expect(listDialog).not.toBeVisible();

    // 予定オーダ セル（当日5/19）クリック → 実施確認表（1週間カレンダー）
    await orderRow.getByRole('cell').last().click();
    const execDialog = page.getByRole('dialog').filter({ hasText: '実施確認表' });
    await expect(execDialog).toBeVisible();
    // 検査行の当日(5/19=右端)セルに実施回数「1」が出る
    const testRow = execDialog.getByRole('row', { name: /検査/ }).first();
    await expect(testRow.getByRole('cell').last()).toContainText('1');

    // 当日セル（実施回数）をクリック → 実施ダイアログ → [実施] で実施
    await testRow.getByRole('cell').last().click();
    const doDialog = page.getByRole('dialog').filter({ hasText: 'オーダ実施' });
    await expect(doDialog).toBeVisible();
    // 実施チェックが入るまで [実施] は無効。チェック → 実施。
    const doButton = doDialog.getByRole('button', { name: '実施', exact: true });
    await expect(doButton).toBeDisabled();
    await doDialog.getByRole('checkbox', { name: '実施' }).check();
    await expect(doButton).toBeEnabled();
    await doButton.click();
    await expect(page.getByText(/を実施しました/)).toBeVisible();
    await execDialog.getByRole('button', { name: '閉じる' }).click();
  });

  test('入院定時: オーダ実施ダイアログの左欄クリック → 定期処方実施ダイアログが開き実施できる', async ({ page }) => {
    await page.goto('/karte/P001');
    await expect(page.getByRole('button', { name: 'オーダー入力' })).toBeVisible();

    // オーダ入力 → 入院定時（開始日は既定 2026-05-19）→ アキネトン錠1mg を追加
    await page.getByRole('button', { name: 'オーダー入力' }).click();
    const send = page.getByRole('dialog').filter({ hasText: 'オーダ送信' });
    await send.getByRole('button', { name: '入院定時', exact: true }).click();
    const rx = page.getByRole('dialog').filter({ hasText: 'オーダ内容' });
    await expect(rx).toBeVisible();
    await rx.getByRole('button', { name: '新しい Rp として薬剤を追加' }).click();
    const dd = page.getByRole('dialog').filter({ hasText: '処方追加' });
    await dd.getByRole('tab', { name: '医薬品名' }).click();
    await dd.getByRole('textbox', { name: 'かな検索' }).fill('あきねとん');
    await dd.getByRole('button', { name: '検索' }).click();
    await dd.getByRole('button', { name: 'アキネトン錠1mg' }).click();
    await dd.getByRole('button', { name: '選択項目を追加' }).click();
    await dd.getByRole('spinbutton', { name: '用量 アキネトン錠1mg' }).fill('1');
    await dd.getByRole('combobox', { name: '用法 アキネトン錠1mg' }).click();
    await page.getByRole('option', { name: '1日1回 朝食後', exact: true }).click();
    await dd.getByRole('button', { name: '登録' }).click();
    await rx.getByRole('button', { name: '登録' }).click();
    // 指示 → カルテ記事作成 → 所見「てすと」入力 → 実行
    await send.getByRole('button', { name: '指示', exact: true }).click();
    const karte = page.getByRole('dialog').filter({ hasText: 'カルテ記事作成' });
    await karte.getByRole('textbox', { name: '所見 入院定時' }).fill('てすと');
    await karte.getByRole('button', { name: '実行', exact: true }).click();
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();

    // フローシート → 予定オーダ当日セル → 実施確認表 → 入院定時行の当日セル → オーダ実施
    await page.getByRole('tab', { name: 'フローシート・隔離拘束', exact: true }).click();
    const orderRow = page.getByRole('row').filter({ hasText: '予定オーダ' });
    await orderRow.getByRole('cell').last().click();
    const execDialog = page.getByRole('dialog').filter({ hasText: '実施確認表' });
    const rxRow = execDialog.getByRole('row', { name: /入院定時/ }).first();
    await rxRow.getByRole('cell').last().click();
    const doDialog = page.getByRole('dialog').filter({ hasText: 'オーダ実施' });
    await expect(doDialog).toBeVisible();

    // 「印刷」欄より左（内容セル）をクリック → 定期処方実施ダイアログ
    await doDialog.getByText(/アキネトン/).first().click();
    const rxExec = page.getByRole('dialog').filter({ hasText: '定期処方実施' });
    await expect(rxExec).toBeVisible();
    // 実施者はログイン者が既定、今回処方に薬剤、前回処方・中止薬剤は「ありません」
    await expect(rxExec.getByText('看護 花子').first()).toBeVisible();
    await expect(rxExec.getByText(/アキネトン/).first()).toBeVisible();
    await expect(rxExec.getByText('前回処方はありません。')).toBeVisible();
    await expect(rxExec.getByText('中止薬剤はありません。')).toBeVisible();
    // 医師より＝カルテ記事作成で入力した所見「てすと」が反映される
    await expect(rxExec.getByRole('textbox', { name: '医師より' })).toHaveValue('てすと');
    // 実施
    await rxExec.getByRole('button', { name: '実施', exact: true }).click();
    await expect(page.getByText(/を実施しました/)).toBeVisible();
  });
});
