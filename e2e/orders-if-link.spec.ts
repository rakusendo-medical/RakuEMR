import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * ep-11 us-60 / ep-16 us-50: 指示簿のIFオーダ行クリックで IFオーダタブへ遷移し対象を表示。
 * また IF は頓用（都度実施）のため実施ボタンを何度でも押せる。
 */
test.describe('指示簿×IFオーダ連携', () => {
  // IFオーダ（症状=不穏時（注射）＋処方アキネトン）を作成して指示確定する。
  const createIfOrder = async (page: Page) => {
    await page.goto('/karte/P001');
    await page.getByRole('button', { name: 'オーダー入力' }).click();
    const send = page.getByRole('dialog').filter({ hasText: 'オーダ送信' });
    await send.getByRole('button', { name: 'IF', exact: true }).click();
    const ifd = page.getByRole('dialog').filter({ hasText: 'IFオーダ' });
    await ifd.getByRole('button', { name: '症状テンプレート選択' }).click();
    const picker = page.getByRole('dialog').filter({ hasText: 'IF症状条件選択画面' });
    await picker.getByRole('button', { name: '不穏時', exact: true }).click();
    await picker.getByRole('button', { name: '不穏時（注射）' }).click();
    await picker.getByRole('button', { name: '登録', exact: true }).click();

    // 処方サブオーダ（アキネトン）を束ねる
    await ifd.getByRole('button', { name: '処方', exact: true }).click();
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

    // IF [指示] → オーダ送信 [指示] → カルテ記事作成 [実行]
    await ifd.getByRole('button', { name: '指示', exact: true }).click();
    await send.getByRole('button', { name: '指示', exact: true }).click();
    await page.getByRole('dialog').filter({ hasText: 'カルテ記事作成' })
      .getByRole('button', { name: '実行', exact: true }).click();
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();
  };

  test('指示簿のIF行クリックでIFオーダタブへ遷移し対象を表示', async ({ page }) => {
    await createIfOrder(page);

    // 指示簿タブ → IF 行をクリック
    await page.getByRole('tab', { name: '指示簿' }).click();
    const ifRow = page.getByRole('row').filter({ hasText: 'IF' }).filter({ hasText: '不穏時' });
    await expect(ifRow.first()).toBeVisible();
    await ifRow.first().click();

    // IFオーダタブへ遷移し、対象IF（不穏時（注射））が選択・表示され、内容にアキネトンが出る
    const ifTab = page.getByRole('tab', { name: 'IFオーダ' });
    await expect(ifTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText(/不穏時（注射）/).first()).toBeVisible();
    await expect(page.getByText(/アキネトン錠1mg/).first()).toBeVisible();
  });

  test('IFは都度実施：実施ボタンを繰り返し押せる', async ({ page }) => {
    await createIfOrder(page);
    await page.getByRole('tab', { name: 'IFオーダ' }).click();

    // 1回目の実施 → 実施済にはならず、実施ボタンは再度押せる
    const execBtn = page.getByRole('button', { name: '実施', exact: true });
    await execBtn.click();
    await expect(page.getByText(/を実施しました/)).toBeVisible();
    await expect(page.getByText(/（実施済）/)).toHaveCount(0);
    await expect(execBtn).toBeEnabled();

    // 2回目の実施も可能（都度実施）
    await execBtn.click();
    await expect(page.getByText(/を実施しました/)).toBeVisible();
    await expect(execBtn).toBeEnabled();
  });
});
