import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * us-08 / us-05 / us-01: 空床照会は未確定の入退院指示も反映する
 *
 * - 入院指示（病室・ベッド指定済み）: 入院予定日「当日」から使用中
 * - 退院指示: 退院予定日の「翌日」から空床（予定日当日は使用中のまま）
 * - 判定は日単位（時刻は考慮しない）。確定済みと未確定は色で区別しない
 *
 * モックデータ前提: 第１病棟 107号室のベッド5 が空床、ベッド1 は在床（渡部 千佳）。
 */
test.describe('空床照会（入退院指示の反映）', () => {

  const pad = (n: number) => String(n).padStart(2, '0');
  // 基準日は 1 度だけ固定する。呼び出しごとに new Date() すると、実行が日付境界を跨いだとき
  // 同一テスト内で基準日がずれてフレークする。
  const BASE_DATE = new Date();
  /** 基準日から days 日後の日付 */
  const dayAfter = (days: number) => {
    const d = new Date(BASE_DATE);
    d.setDate(d.getDate() + days);
    return d;
  };
  /** datetime-local 入力用（YYYY-MM-DDTHH:mm） */
  const toInputValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`;
  /** セルの title 用（YYYY/MM/DD） */
  const toCellDate = (d: Date) => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;

  /** 病棟マップから空床照会ダイアログを開き、対象の年月まで送る */
  const openVacancy = async (page: Page, target: Date) => {
    // ヘッダーの更新履歴リンクも button のため、画面の [空床照会] は exact で特定する
    await page.getByRole('button', { name: '空床照会', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('空床照会')).toBeVisible();

    // 表示月ラベル（例: 2026年8月）を読み、目標年月まで次月/前月を送る
    const label = dialog.getByTestId('vacancy-year-month');
    const wanted = `${target.getFullYear()}年${target.getMonth() + 1}月`;
    for (let i = 0; i < 24; i++) {
      if ((await label.textContent()) === wanted) break;
      await dialog.getByRole('button', { name: '次月' }).click();
    }
    await expect(label).toHaveText(wanted);
    return dialog;
  };

  test('入院指示は予定日当日から使用中になる（ケースA）', async ({ page }) => {
    await page.goto('/');

    // ① 入院予定者の [詳細] から入院指示ダイアログを開く
    const admitSection = page.locator('.MuiPaper-root', { hasText: '入院予定者' }).first();
    await admitSection.getByRole('button', { name: '詳細' }).first().click();
    const orderDialog = page.getByRole('dialog');
    await expect(orderDialog).toBeVisible();

    // ② 入院日を 7 日後に設定し、第１病棟 107号室 ベッド5 を指定して [指示] を登録
    const admitDate = dayAfter(7);
    await orderDialog.getByRole('textbox', { name: '入院日時' }).fill(toInputValue(admitDate));
    await orderDialog.getByRole('combobox', { name: '病棟' }).click();
    await page.getByRole('option', { name: '第１病棟' }).click();
    await orderDialog.getByRole('combobox', { name: '病室' }).click();
    await page.getByRole('option', { name: '107号室' }).click();
    await orderDialog.getByRole('combobox', { name: 'ベッド' }).click();
    await page.getByRole('option', { name: '5', exact: true }).click();
    await orderDialog.getByRole('button', { name: '指示', exact: true }).click();
    await expect(page.getByText(/入院指示を登録しました/)).toBeVisible();

    // ③ 空床照会: 予定日当日から使用中、前日は空床のまま
    const dialog = await openVacancy(page, admitDate);
    await expect(
      dialog.getByTitle(`${toCellDate(admitDate)} 107号室 5 使用中`),
    ).toBeVisible();
    await expect(
      dialog.getByTitle(`${toCellDate(dayAfter(6))} 107号室 5 空床`),
    ).toBeVisible();
  });

  test('退院指示は予定日の翌日から空床になる（ケースB）', async ({ page }) => {
    // ① 在床患者（第１病棟 107号室 ベッド1 の渡部 千佳）に 7 日後の退院指示を登録
    await page.goto('/karte/P063');
    await expect(page.getByRole('tab', { name: '診療録' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('button', { name: '退院指示' }).click();
    const orderDialog = page.getByRole('dialog');
    await expect(orderDialog).toBeVisible();

    const dischargeDate = dayAfter(7);
    await orderDialog.getByRole('textbox', { name: '退院日時' }).fill(toInputValue(dischargeDate));
    await orderDialog.getByRole('button', { name: '指示', exact: true }).click();
    await expect(page.getByText(/退院指示を登録しました/)).toBeVisible();

    // ② 病棟マップへ戻って空床照会: 予定日当日は使用中、翌日から空床
    await page.goto('/');
    const dialog = await openVacancy(page, dischargeDate);
    await expect(
      dialog.getByTitle(`${toCellDate(dischargeDate)} 107号室 1 使用中`),
    ).toBeVisible();
    await expect(
      dialog.getByTitle(`${toCellDate(dayAfter(8))} 107号室 1 空床`),
    ).toBeVisible();
  });

  test('病棟マップの移動（転棟・転室）も反映される', async ({ page }) => {
    await page.goto('/');

    // ① 107号室 ベッド1 の患者を 108号室 へ即時移動（108号室のベッド5が空き）
    await page.getByText('渡部 千佳', { exact: true }).first().click();
    await expect(page.locator('text=メニュー:')).toBeVisible();
    await page.getByRole('button', { name: '[移動]', exact: true }).click();
    const moveDialog = page.getByRole('dialog');
    await moveDialog.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: '108号室' }).click();
    const submitBtn = moveDialog.getByRole('button', { name: /^(登録|確認)$/ });
    const needsConfirm = ((await submitBtn.textContent()) ?? '').includes('確認');
    await submitBtn.click();
    if (needsConfirm) {
      await expect(page.getByText(/食事締め時間/)).toBeVisible();
      await expect(submitBtn).toHaveText('登録');
      await submitBtn.click();
    }
    await expect(page.getByText(/移動を登録しました/)).toBeVisible();
    await page.keyboard.press('Escape');

    // ② 空床照会: 移動元（107号室 ベッド1）が空床、移動先（108号室 ベッド5）が使用中になる
    const today = dayAfter(0);
    const dialog = await openVacancy(page, today);
    await expect(dialog.getByTitle(`${toCellDate(today)} 107号室 1 空床`)).toBeVisible();
    await expect(dialog.getByTitle(`${toCellDate(today)} 108号室 5 使用中`)).toBeVisible();
  });

  test('在床中で退院予定のないベッドは常に使用中、使用不可床は区別表示される', async ({ page }) => {
    await page.goto('/');
    const today = dayAfter(0);
    const dialog = await openVacancy(page, today);

    // 在床（107号室 ベッド1）は当日も使用中
    await expect(dialog.getByTitle(`${toCellDate(today)} 107号室 1 使用中`)).toBeVisible();
    // 空床（107号室 ベッド5）は当日は空床
    await expect(dialog.getByTitle(`${toCellDate(today)} 107号室 5 空床`)).toBeVisible();
    // 使用不可（100号室 ベッド2 は disabled）
    await expect(dialog.getByTitle(`${toCellDate(today)} 100号室 2 使用不可`)).toBeVisible();
  });
});
