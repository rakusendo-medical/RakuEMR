import { test, expect } from './fixtures';

// ep-15 us-34 / ep-01 us-01: 救護区分（担送/護送/独歩/未入力）。
// 患者情報の属性で設定し、病棟マップに1文字バッジ（担/護/独/未）で表示する。
// seed: P002=担送 / P021=護送 / P024=独歩 / P004=担送 / 他=未入力（いずれも第1病棟）。
test.describe('救護区分（移送区分バッジ）', () => {
  test('属性サブタブに救護区分セレクト（4択・初期値は患者の値）がある', async ({ page }) => {
    await page.goto('/karte/P002');
    await expect(page.locator('text=診療録').first()).toBeVisible();
    await page.getByRole('tab', { name: '患者情報' }).click();
    await page.getByRole('button', { name: '属性', exact: true }).click();

    const select = page.getByLabel('救護区分');
    // seed で P002 は担送
    await expect(select).toHaveText('担送');
    // 4択がそろう
    await select.click();
    for (const opt of ['担送', '護送', '独歩', '未入力']) {
      await expect(page.getByRole('option', { name: opt, exact: true })).toBeVisible();
    }
    await page.keyboard.press('Escape');
  });

  test('未設定の患者は救護区分の初期値が「未入力」', async ({ page }) => {
    // P005（原 由美子）は seed 無し ＝ 未入力
    await page.goto('/karte/P005');
    await expect(page.locator('text=診療録').first()).toBeVisible();
    await page.getByRole('tab', { name: '患者情報' }).click();
    await page.getByRole('button', { name: '属性', exact: true }).click();
    await expect(page.getByLabel('救護区分')).toHaveText('未入力');
  });

  test('病棟マップに救護区分バッジが1文字で全患者に表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('tab', { name: /第１病棟/ })).toBeVisible();
    // seed の4区分がいずれも1つ以上表示される（未入力も表示）
    for (const cat of ['担送', '護送', '独歩', '未入力']) {
      expect(await page.getByLabel(`救護区分 ${cat}`).count()).toBeGreaterThan(0);
    }
    // 表示は1文字（担送 → 担）
    await expect(page.getByLabel('救護区分 担送').first()).toHaveText('担');
    await expect(page.getByLabel('救護区分 独歩').first()).toHaveText('独');
  });

  test('属性で救護区分を変更→保存→病棟マップのバッジに反映される', async ({ page }) => {
    await page.goto('/karte/P002');
    await expect(page.locator('text=診療録').first()).toBeVisible();
    await page.getByRole('tab', { name: '患者情報' }).click();
    await page.getByRole('button', { name: '属性', exact: true }).click();

    // P002 を担送 → 独歩 に変更して保存
    await page.getByLabel('救護区分').click();
    await page.getByRole('option', { name: '独歩', exact: true }).click();
    await page.getByRole('button', { name: '属性を保存' }).click();

    // SPA 内遷移で病棟マップへ（store は保持される）
    await page.getByRole('button', { name: '病棟マップ' }).click();
    await expect(page.getByRole('tab', { name: /第１病棟/ })).toBeVisible();

    // 独歩 = P002(変更) + P024(seed) = 2、担送 = P004 のみ = 1
    await expect(page.getByLabel('救護区分 独歩')).toHaveCount(2);
    await expect(page.getByLabel('救護区分 担送')).toHaveCount(1);
  });
});
