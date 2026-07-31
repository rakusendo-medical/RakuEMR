import { test, expect } from './fixtures';

/**
 * us-08 / us-09: 入退院指示のカルテ記事ライフサイクル
 *
 * - 指示時にカルテ記事が 1 件作成される（病棟・病室は記載しない）
 * - 指示の更新はカルテ記事を新規作成せず、指示時の記事へ追記される
 * - 確定は指示時の記事へ確定内容が追記される（新規記事は作成しない）
 * - 指示の中止はカルテ記事が「取消」表示となり、記事自体は残る
 */
test.describe('入退院指示のカルテ記事', () => {

  /** カルテの診療録タブで退院指示ダイアログを開く */
  const openDischargeOrderDialog = async (page: import('@playwright/test').Page, patientId: string) => {
    await page.goto(`/karte/${patientId}`);
    await expect(page.getByRole('tab', { name: '診療録' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('button', { name: '退院指示' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  };

  test('退院指示の登録でカルテ記事が作成される', async ({ page }) => {
    await openDischargeOrderDialog(page, 'P021');

    // 新規モードで [指示] を実行
    await expect(page.getByRole('dialog').getByText('新規')).toBeVisible();
    await page.getByRole('button', { name: '指示', exact: true }).click();
    await expect(page.getByText(/退院指示を登録しました/)).toBeVisible();

    // 診療録タイムラインに「退院指示」の記事が 1 件表示される
    await expect(page.getByText(/【退院指示】/)).toHaveCount(1);
  });

  test('指示の更新はカルテ記事を新規作成せず追記される', async ({ page }) => {
    await openDischargeOrderDialog(page, 'P021');

    // ① 指示を登録（記事作成）
    await page.getByRole('button', { name: '指示', exact: true }).click();
    await expect(page.getByText(/退院指示を登録しました/)).toBeVisible();

    // ② 再度開くと変更モードになる → [変更（更新）] を実行
    await page.getByRole('button', { name: '退院指示' }).click();
    await expect(page.getByRole('dialog').getByText('変更モード')).toBeVisible();
    await page.getByRole('button', { name: '変更（更新）' }).click();
    await expect(page.getByText(/退院指示を更新しました/)).toBeVisible();

    // ③ 記事は 1 件のまま、更新内容が追記されている
    await expect(page.getByText(/【退院指示】/)).toHaveCount(1);
    await expect(page.getByText(/指示変更/)).toBeVisible();
  });

  test('確定は指示時の記事へ追記され新規記事は作成されない', async ({ page }) => {
    await openDischargeOrderDialog(page, 'P024');

    // ① 指示を登録（記事作成）
    await page.getByRole('button', { name: '指示', exact: true }).click();
    await expect(page.getByText(/退院指示を登録しました/)).toBeVisible();

    // ② 再度開いて [退院確定] を実行
    await page.getByRole('button', { name: '退院指示' }).click();
    await expect(page.getByRole('dialog').getByText('変更モード')).toBeVisible();
    await page.getByRole('button', { name: '退院確定' }).click();

    // 未実施オーダがある場合はオーダ確認ダイアログが出るので確定する
    //   （閉じかけの指示ダイアログの [退院確定] を誤クリックしないよう、オーダ確認ダイアログ内に限定）
    const orderConfirmDialog = page.getByRole('dialog').filter({ hasText: 'オーダ確認' });
    if (await orderConfirmDialog.isVisible().catch(() => false)) {
      await orderConfirmDialog.getByRole('button', { name: '退院確定' }).click();
    }
    await expect(page.getByText(/退院確定:/)).toBeVisible();

    // ③ 記事は 1 件のまま、確定内容が追記されている
    await expect(page.getByText(/【退院指示】/)).toHaveCount(1);
    await expect(page.getByText(/退院確定（/)).toBeVisible();
  });

  test('指示の中止でカルテ記事は取消表示で残る', async ({ page }) => {
    await openDischargeOrderDialog(page, 'P026');

    // ① 指示を登録（記事作成）
    await page.getByRole('button', { name: '指示', exact: true }).click();
    await expect(page.getByText(/退院指示を登録しました/)).toBeVisible();

    // ② 再度開いて [中止] → 削除コメントダイアログで分類を選択して中止
    await page.getByRole('button', { name: '退院指示' }).click();
    await expect(page.getByRole('dialog').getByText('変更モード')).toBeVisible();
    await page.getByRole('button', { name: '中止', exact: true }).click();
    await expect(page.getByText('削除コメント')).toBeVisible();
    await page.getByRole('combobox').last().click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: '中止する' }).click();
    await expect(page.getByText(/退院指示を中止しました/)).toBeVisible();

    // ③ 記事は削除されず「取消」表示で残る
    await expect(page.getByText(/【退院指示】/)).toHaveCount(1);
    await expect(page.locator('.MuiChip-label', { hasText: '取消' }).first()).toBeVisible();
  });

  test('入院指示の登録でもカルテ記事が作成される（病棟マップ・入院予定者）', async ({ page }) => {
    await page.goto('/');

    // 右サイドバーの入院予定者 [詳細] → 入院指示ダイアログ
    const admitSection = page.locator('.MuiPaper-root', { hasText: '入院予定者' }).first();
    const detailBtn = admitSection.getByRole('button', { name: '詳細' }).first();
    await detailBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // [指示] を実行 → カルテ記事作成を含む完了通知
    await page.getByRole('button', { name: '指示', exact: true }).click();
    await expect(page.getByText(/入院指示を登録しました/)).toBeVisible();
    await expect(page.getByText(/カルテ記事を作成しました/)).toBeVisible();
  });
});
