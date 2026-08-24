import { test, expect } from './fixtures';

// ep-10 us-17: フローシート「記録サマリー帯（最近30日）」の E2E。
// 医師・相談員向けの表示専用ビュー。4 種別（診療録／看護記録／オーダー／部門診療録）を
// 色バッジで俯瞰する。バイタル・隔離拘束・外出外泊は対象外。クリック操作は無し。
test.describe('フローシート 記録サマリー帯（最近30日）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/karte/P002');
    await expect(page.locator('text=診療録').first()).toBeVisible();
    await page.getByRole('tab', { name: 'フローシート・隔離拘束', exact: true }).click();
    await expect(
      page.getByRole('tab', { name: 'フローシート・隔離拘束', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  test('記録サマリー帯が最上部に表示される', async ({ page }) => {
    const strip = page.getByTestId('record-summary-strip');
    await expect(strip).toBeVisible();
    await expect(strip.getByText('記録サマリー（最近30日）')).toBeVisible();
  });

  test('対象は4種別（診療録／看護記録／オーダー／部門診療録）のみ', async ({ page }) => {
    const strip = page.getByTestId('record-summary-strip');
    // 4 種別は帯内に出る（凡例＋行ラベルで各 2 箇所以上）
    for (const label of ['診療録', '看護記録', 'オーダー', '部門診療録']) {
      await expect(strip.getByText(label, { exact: true }).first()).toBeVisible();
    }
    // 対象外の 3 種別は帯内に出ない
    for (const label of ['バイタル', '隔離・拘束', '外出・外泊']) {
      await expect(strip.getByText(label, { exact: true })).toHaveCount(0);
    }
  });

  test('記録がある日は色バッジ（あり）が表示される', async ({ page }) => {
    const strip = page.getByTestId('record-summary-strip');
    // aria-label が "…あり" のセルが 1 つ以上ある（擬似データ＋実オーダ由来）
    const present = strip.locator('[aria-label$="あり"]');
    expect(await present.count()).toBeGreaterThan(0);
  });

  test('表示専用（クリック可能なボタンを持たない）', async ({ page }) => {
    const strip = page.getByTestId('record-summary-strip');
    // 帯にはボタン要素が無い（当初の「日クリックで基準日移動」導線は削除済み）
    await expect(strip.getByRole('button')).toHaveCount(0);
    // 補足文にクリック導線の記載が無い（表示中の範囲の説明のみ）
    await expect(strip.getByText(/表示中の範囲です/)).toBeVisible();
    await expect(strip.getByText(/クリックすると/)).toHaveCount(0);
  });

  test('右端7日を青枠でハイライト（下の詳細フローシートに表示中の範囲）', async ({ page }) => {
    const strip = page.getByTestId('record-summary-strip');
    await expect(strip.getByText(/青枠内（右端7日）/)).toBeVisible();
    // 青枠は四辺を持つ実要素（背景色だけの疑似表現ではない）
    const frame = page.getByTestId('record-summary-detail-frame');
    await expect(frame).toBeVisible();
    await expect(frame).toHaveCSS('border-top-style', 'solid');
    await expect(frame).toHaveCSS('border-right-style', 'solid');
    await expect(frame).toHaveCSS('border-bottom-style', 'solid');
    await expect(frame).toHaveCSS('border-left-style', 'solid');
  });

  test('AC-11: 帯と詳細フローシートの右端が一致する', async ({ page }) => {
    const strip = page.getByTestId('record-summary-strip');
    const table = page.locator('table').first();
    const sb = await strip.boundingBox();
    const tb = await table.boundingBox();
    expect(sb).not.toBeNull();
    expect(tb).not.toBeNull();
    const stripRight = sb!.x + sb!.width;
    const tableRight = tb!.x + tb!.width;
    // 画面幅に依らず右端が一致（枠線分の数pxの誤差は許容）
    expect(Math.abs(stripRight - tableRight)).toBeLessThanOrEqual(3);
  });
});
