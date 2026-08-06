import { test, expect } from './fixtures';

/**
 * ep-11 us-62: テキストオーダの「指示日・継続する」（参考システムマニュアル 第5章第10部⑥）。
 * テキストオーダ作成ダイアログのタグと本文の間に指示日・継続する を表示し、
 * 継続ありは継続オーダ（指示簿に「継続」表示）、なしは指示日のみ となる。
 */
test.describe('テキストオーダ 指示日・継続する', () => {
  test('指示日・継続するが表示され、継続ありで指示簿に「継続」で反映される', async ({ page }) => {
    await page.goto('/karte/P001');
    await page.getByRole('button', { name: 'オーダー入力' }).click();
    const send = page.getByRole('dialog').filter({ hasText: 'オーダ送信' });
    await expect(send).toBeVisible();

    // テキスト → テキストオーダ作成ダイアログ
    await send.getByRole('button', { name: 'テキスト', exact: true }).click();
    const dlg = page.getByRole('dialog').filter({ hasText: 'テキストオーダ作成' });
    await expect(dlg).toBeVisible();

    // タグと本文の間に「指示日」「継続する」がある
    await expect(dlg.getByLabel('指示日', { exact: true })).toBeVisible();
    const keep = dlg.getByRole('checkbox', { name: /継続する/ });
    await expect(keep).toBeVisible();

    // タイトル・本文を入力し、継続する を ON
    await dlg.getByRole('textbox', { name: 'タイトル' }).fill('経過観察依頼');
    await dlg.getByPlaceholder('フリーテキストで記載してください').fill('夜間の睡眠状況を継続観察のこと');
    await keep.check();

    // 登録 → 指示 → カルテ記事作成 → 実行
    await dlg.getByRole('button', { name: '登録' }).click();
    await expect(dlg).not.toBeVisible();
    await send.getByRole('button', { name: '指示', exact: true }).click();
    const karte = page.getByRole('dialog').filter({ hasText: 'カルテ記事作成' });
    await karte.getByRole('button', { name: '実行', exact: true }).click();
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();

    // 指示簿タブ: テキストオーダ行が「継続」で反映される（継続ありは期間が（継続））
    await page.getByRole('tab', { name: '指示簿' }).click();
    const row = page.getByRole('row', { name: /経過観察依頼/ });
    await expect(row).toBeVisible();
    await expect(row).toContainText('継続');
  });
});
