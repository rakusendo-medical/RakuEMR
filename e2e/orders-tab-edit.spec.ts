import { test, expect } from './fixtures';

/**
 * ep-16 us-50: 指示簿タブの「臨時」オーダを行クリックで確認・変更する。
 * 臨時グループの行クリックで編集ダイアログ（作成中と同じ形式）が開き、
 * 予定日・備考（処方系は用量/用法コメント・日数も）を変更して保存すると一覧に反映される。
 */
test.describe('指示簿 臨時オーダの確認・変更', () => {
  test('臨時オーダ行クリック→編集ダイアログ→予定日変更→一覧に反映', async ({ page }) => {
    await page.goto('/karte/P001');
    await expect(page.getByRole('button', { name: 'オーダー入力' })).toBeVisible();

    // 臨時の検査オーダを 2026-05-19 で作成
    await page.getByRole('button', { name: 'オーダー入力' }).click();
    const send = page.getByRole('dialog').filter({ hasText: 'オーダ送信' });
    await send.getByRole('button', { name: '検査', exact: true }).click();
    const testDlg = page.getByRole('dialog').filter({ hasText: '検査セット' });
    await testDlg.getByLabel('実施予定日').fill('2026-05-19');
    await testDlg.getByRole('button', { name: '院内セット1' }).click();
    await testDlg.getByRole('button', { name: '登録' }).click();
    await send.getByRole('button', { name: '指示', exact: true }).click();
    await page.getByRole('dialog').filter({ hasText: 'カルテ記事作成' })
      .getByRole('button', { name: '実行', exact: true }).click();
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();

    // 指示簿タブ → 作成した検査（総蛋白 を含む）の臨時行をクリック
    await page.getByRole('tab', { name: '指示簿' }).click();
    const row = page.getByRole('row', { name: /総蛋白/ });
    await expect(row).toBeVisible();
    await expect(row).toContainText('臨時');
    await row.click();

    // 編集ダイアログ（検査オーダ（編集））が開く
    const edit = page.getByRole('dialog').filter({ hasText: '（編集）' });
    await expect(edit).toBeVisible();
    // 予定日・備考を変更
    await edit.getByLabel('予定日 検査', { exact: true }).fill('2026-05-25');
    await edit.getByLabel('備考 検査', { exact: true }).fill('至急対応');
    await edit.getByRole('button', { name: '保存' }).click();
    await expect(edit).not.toBeVisible();

    // 一覧の該当行の期間（予定日）が 2026-05-25 に更新される
    await expect(page.getByRole('row', { name: /総蛋白/ })).toContainText('2026-05-25');
  });

  test('処方系（2行表示）を行クリック→用量コメント・日数・予定日を変更→一覧に反映', async ({ page }) => {
    await page.goto('/karte/P001');
    await expect(page.getByRole('button', { name: 'オーダー入力' })).toBeVisible();

    // 臨時の処方オーダ（アキネトン錠1mg）を作成
    await page.getByRole('button', { name: 'オーダー入力' }).click();
    const send = page.getByRole('dialog').filter({ hasText: 'オーダ送信' });
    await send.getByRole('button', { name: '処方', exact: true }).click();
    const rx = page.getByRole('dialog').filter({ hasText: 'オーダ内容' });
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
    await send.getByRole('button', { name: '指示', exact: true }).click();
    await page.getByRole('dialog').filter({ hasText: 'カルテ記事作成' })
      .getByRole('button', { name: '実行', exact: true }).click();
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();

    // 指示簿タブ → アキネトンの臨時行をクリック → 処方オーダ（編集）が開く（2行表示）
    await page.getByRole('tab', { name: '指示簿' }).click();
    const row = page.getByRole('row', { name: /アキネトン錠1mg/ });
    await expect(row).toContainText('臨時');
    await row.click();
    const edit = page.getByRole('dialog').filter({ hasText: '（編集）' });
    await expect(edit).toBeVisible();

    // 用量コメント・日数・予定日を変更して保存
    await edit.getByLabel('用量コメント 処方 アキネトン錠1mg', { exact: true }).fill('朝のみ');
    await edit.getByLabel('日数 処方 Rp1', { exact: true }).fill('14');
    await edit.getByLabel('予定日 処方', { exact: true }).fill('2026-05-26');
    await edit.getByRole('button', { name: '保存' }).click();
    await expect(edit).not.toBeVisible();

    // 一覧の該当行に、用量コメント（《用量:朝のみ》）・日数(14日)・予定日(2026-05-26)が反映される
    const updated = page.getByRole('row', { name: /アキネトン錠1mg/ });
    await expect(updated).toContainText('朝のみ');
    await expect(updated).toContainText('2026-05-26');
    await expect(updated).toContainText('14');
  });
});
