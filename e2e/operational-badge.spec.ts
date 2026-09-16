import { test, expect } from './fixtures';

// ep-01 us-01 / ep-05 us-11: 運用バッジ（隔離/拘束/外出/外泊）は起点操作から導出する。
//   隔離/拘束 ← 継続中の隔離拘束指示、外出/外泊 ← 許可中の外出外泊。
//   バッジアイコンは data-testid="bed-flag-<key>"（凡例は別レンダリングで testid を持たない）。
test.describe('運用バッジ（隔/拘/外/泊）の起点操作', () => {
  test('継続中の指示・許可中の外出外泊からバッジが導出される（seed）', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('tab', { name: /第１病棟/ })).toBeVisible();
    // 第1病棟: 継続中の拘束指示(P004)→拘、許可中の外泊(P006)→泊
    expect(await page.getByTestId('bed-flag-restraint').count()).toBeGreaterThan(0);
    expect(await page.getByTestId('bed-flag-overnight').count()).toBeGreaterThan(0);
    // 第2病棟: 継続中の隔離指示(P003/P017)→隔、許可中の外出(P015)→外
    await page.getByRole('tab', { name: /第２病棟/ }).click();
    expect(await page.getByTestId('bed-flag-isolation').count()).toBeGreaterThan(0);
    expect(await page.getByTestId('bed-flag-outing').count()).toBeGreaterThan(0);
  });

  test('外出外泊を新規申請すると病棟マップに外バッジが付く', async ({ page }) => {
    // 第1病棟には seed の外出バッジは無い（P006は外泊/P015外出は第2病棟）
    await page.goto('/');
    await expect(page.getByRole('tab', { name: /第１病棟/ })).toBeVisible();
    expect(await page.getByTestId('bed-flag-outing').count()).toBe(0);

    // /outing 新規申請で P002(00010001・第1病棟) の外出を登録
    await page.getByRole('button', { name: '外出外泊' }).click();
    await page.getByRole('tab', { name: '新規申請' }).click();
    await page.getByLabel('患者番号').fill('00010001');
    await page.getByLabel('開始日時').fill('2026-08-28T10:00');
    await page.getByLabel('終了日時').fill('2026-08-28T16:00');
    await page.getByRole('button', { name: '申請' }).click();

    // SPA 内遷移で病棟マップ（第1病棟）へ → 外バッジが1つ付く
    await page.getByRole('button', { name: '病棟マップ' }).click();
    await expect(page.getByRole('tab', { name: /第１病棟/ })).toBeVisible();
    await expect(page.getByTestId('bed-flag-outing')).toHaveCount(1);
  });

  test('帰院入力すると外バッジが外れる', async ({ page }) => {
    // まず P002 の外出を登録（第1病棟に外バッジ1つ）
    await page.goto('/outing');
    await page.getByRole('tab', { name: '新規申請' }).click();
    await page.getByLabel('患者番号').fill('00010001');
    await page.getByLabel('開始日時').fill('2026-08-28T10:00');
    await page.getByLabel('終了日時').fill('2026-08-28T16:00');
    await page.getByRole('button', { name: '申請' }).click();

    // 帰院管理で 佐藤 花子 の帰院入力（該当カードに絞る）
    await page.getByRole('tab', { name: '帰院管理' }).click();
    const card = page.locator('.MuiCard-root').filter({ hasText: '佐藤 花子' });
    await card.getByRole('button', { name: '帰院入力' }).click();

    // 病棟マップ（第1病棟）へ → 外バッジが外れて0
    await page.getByRole('button', { name: '病棟マップ' }).click();
    await expect(page.getByRole('tab', { name: /第１病棟/ })).toBeVisible();
    await expect(page.getByTestId('bed-flag-outing')).toHaveCount(0);
  });

  test('入院者情報の隔離・拘束の人数は継続中の隔離拘束指示から数える', async ({ page }) => {
    await page.goto('/');
    // 第1病棟: 継続中の拘束指示は P004 の 1 件、隔離指示は無し
    await expect(page.getByTestId('bed-flag-restraint')).toHaveCount(1);
    await expect(page.getByText('拘束 1', { exact: true })).toBeVisible();
    await expect(page.getByText('隔離 0', { exact: true })).toBeVisible();
    // 第2病棟: 継続中の隔離指示は P003・P017 の 2 件、拘束指示は無し
    await page.getByRole('tab', { name: /第２病棟/ }).click();
    await expect(page.getByTestId('bed-flag-isolation')).toHaveCount(2);
    await expect(page.getByText('隔離 2', { exact: true })).toBeVisible();
    await expect(page.getByText('拘束 0', { exact: true })).toBeVisible();
  });

  test('初期データの隔離指示を解除すると、バッジ・人数・カルテのヘッダーから外れる', async ({ page }) => {
    // P003 鈴木 一郎（第2病棟 202号室）は初期データで隔離中（ISO001）
    await page.goto('/');
    await page.getByRole('tab', { name: /第２病棟/ }).click();
    await expect(page.getByTestId('ward-bed-P003').getByTestId('bed-flag-isolation')).toHaveCount(1);
    await expect(page.getByText('隔離 2', { exact: true })).toBeVisible();

    // カルテのアクションバーから隔離解除を登録する（指示リンクを経由しない導線）
    await page.goto('/karte/P003');
    await expect(page.getByLabel('隔離・拘束: 隔離 / 拘束指示中')).toBeVisible();
    await page.getByRole('button', { name: '隔離拘束指示' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: '隔離拘束指示' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('combobox', { name: 'タイトル' }).click();
    await page.getByRole('option', { name: '隔離解除', exact: true }).click();
    await dialog.getByLabel('終了日時').fill('2026-09-16T10:00');
    // 移動先（病棟・病室・ベッド）は必須。セレクトは順に タイトル/病棟/病室/ベッド（名前が付かないため位置で指定）
    const selects = dialog.getByRole('combobox');
    await selects.nth(1).click();
    await page.getByRole('option', { name: '第２病棟', exact: true }).click();
    await selects.nth(2).click();
    await page.getByRole('option', { name: '202号室', exact: true }).click();
    await selects.nth(3).click();
    await page.getByRole('option', { name: 'F', exact: true }).click();
    await dialog.getByRole('button', { name: '作成' }).click();
    await expect(dialog).not.toBeVisible();

    // カルテのヘッダーから隔離・拘束が外れる
    await expect(page.getByLabel('隔離・拘束: 隔離 / 拘束指示中')).toHaveCount(0);

    // 病棟マップのバッジと入院者情報の人数からも外れる
    await page.getByRole('button', { name: '病棟マップ' }).click();
    await page.getByRole('tab', { name: /第２病棟/ }).click();
    await expect(page.getByTestId('ward-bed-P003').getByTestId('bed-flag-isolation')).toHaveCount(0);
    await expect(page.getByTestId('bed-flag-isolation')).toHaveCount(1);
    await expect(page.getByText('隔離 1', { exact: true })).toBeVisible();
  });

  test('カルテの患者ヘッダーの隔離・拘束も継続中の隔離拘束指示から判定する', async ({ page }) => {
    // P003 は継続中の隔離指示あり
    await page.goto('/karte/P003');
    await expect(page.getByLabel('隔離・拘束: 隔離 / 拘束指示中')).toBeVisible();
  });
});

// issue #399（2026-09-14 決定）: 要報告・預り金のバッジは作らない。
test.describe('要報告・預り金のバッジは設けない', () => {
  test('病棟マップのベッドにも凡例にも要報告・預り金が出ない', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('tab', { name: /第１病棟/ })).toBeVisible();
    for (const ward of [/第１病棟/, /第２病棟/]) {
      await page.getByRole('tab', { name: ward }).click();
      await expect(page.getByTestId('bed-flag-reportRequired')).toHaveCount(0);
      await expect(page.getByTestId('bed-flag-deposit')).toHaveCount(0);
      // 凡例は 隔離／拘束／外出／外泊 の 4 種だけ
      for (const label of ['隔離', '拘束', '外出', '外泊']) {
        await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
      }
      await expect(page.getByText('要報告', { exact: true })).toHaveCount(0);
      await expect(page.getByText('預り金', { exact: true })).toHaveCount(0);
    }
  });

  test('カルテの患者ヘッダーに「要報告 / 観察事項」アイコンが出ない', async ({ page }) => {
    await page.goto('/karte/P003');
    await expect(page.getByLabel(/^隔離・拘束:/)).toBeVisible();
    await expect(page.getByLabel(/要報告|観察事項/)).toHaveCount(0);
  });
});
