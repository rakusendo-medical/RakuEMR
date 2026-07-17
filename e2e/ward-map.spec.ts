import { test, expect } from './fixtures';

/**
 * 病棟マップ画面のE2Eテスト
 */
test.describe('病棟マップ', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('病棟マップが表示される', async ({ page }) => {
    // 病棟タブが表示されていること
    await expect(page.getByRole('tab', { name: /第１病棟|第2病棟|マップ/ }).first()).toBeVisible();

    // 病室カードが1件以上表示されていること
    await expect(page.locator('text=号室').first()).toBeVisible();

    // 空床照会ボタンが表示されていること
    await expect(page.getByRole('button', { name: '空床照会' })).toBeVisible();
  });

  test('病棟タブを切り替えできる', async ({ page }) => {
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);

    // 2つ目のタブをクリックして切り替わること
    if (tabCount > 1) {
      await tabs.nth(1).click();
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('患者をクリックすると操作メニューが表示される', async ({ page }) => {
    // 在床患者名をクリック（使用不可・空床以外）
    const patientCell = page.locator('[class*="cursor-pointer"]').filter({ hasText: /[^\s]/ }).first();

    // ベッドに患者がいる場合のみテスト
    const count = await page.locator('text=メニュー:').count();
    if (count === 0) {
      // 患者のいるベッドをクリック
      const beds = page.locator('.MuiCardContent-root').first();
      const bedItems = beds.locator('text=/^(?!空床|使用不可).+/');
      if (await bedItems.count() > 0) {
        await bedItems.first().click();
        await expect(page.locator('text=メニュー:')).toBeVisible();
      }
    }
  });

  test('一括入力ボタンは病室未選択時は非活性', async ({ page }) => {
    // 初期状態では一括入力ボタンが非活性
    const bulkBtn = page.getByRole('button', { name: '一括入力へ' });
    await expect(bulkBtn).toBeDisabled();
  });

  test('患者選択→フローシート遷移→診療録タブ→退院指示→退院確定の一連フロー', async ({ page }) => {
    // ① 病棟マップで在床患者をクリックして操作メニューを表示
    const beds = page.locator('.MuiCardContent-root').first();
    const bedItems = beds.locator('text=/^(?!空床|使用不可).+/');
    await bedItems.first().click();
    await expect(page.locator('text=メニュー:')).toBeVisible();

    // ② 下のメニューから「フローシート」をクリックして画面遷移
    await page.getByRole('button', { name: 'フローシート' }).click();
    await expect(page).toHaveURL(/\/karte\/.*#flowsheet/);

    // ③ 遷移先カルテ画面で「診療録」タブを選択
    await page.getByRole('tab', { name: '診療録' }).click();
    await expect(page.getByRole('tab', { name: '診療録' })).toHaveAttribute('aria-selected', 'true');

    // ④ アクションバーの「退院指示」をクリック
    await page.getByRole('button', { name: '退院指示' }).click();

    // 退院指示ダイアログが開くこと
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('text=退院指示').first()).toBeVisible();

    // ⑤ 「退院確定」をクリック
    await page.getByRole('button', { name: '退院確定' }).click();

    // 未実施オーダがある場合はオーダ確認ダイアログが出るので確定する
    const orderConfirm = page.getByRole('button', { name: /中止確定|確定|OK/ });
    if (await orderConfirm.first().isVisible().catch(() => false)) {
      await orderConfirm.first().click();
    }

    // 退院確定の完了通知（スナックバー）が表示されること
    await expect(page.getByText(/退院確定:/)).toBeVisible();
  });

  test('第２病棟→患者選択→フローシート遷移→診療録タブ→退院指示→退院確定の一連フロー', async ({ page }) => {
    // ① 第２病棟マップタブをクリックして切替
    await page.getByRole('tab', { name: /第２病棟/ }).click();
    await expect(page.getByRole('tab', { name: /第２病棟/ })).toHaveAttribute('aria-selected', 'true');

    // ② 在床患者をクリックして操作メニューを表示
    const beds = page.locator('.MuiCardContent-root').first();
    const bedItems = beds.locator('text=/^(?!空床|使用不可).+/');
    await bedItems.first().click();
    await expect(page.locator('text=メニュー:')).toBeVisible();

    // ③ 下のメニューから「フローシート」をクリックして画面遷移
    await page.getByRole('button', { name: 'フローシート' }).click();
    await expect(page).toHaveURL(/\/karte\/.*#flowsheet/);

    // ④ 遷移先カルテ画面で「診療録」タブを選択
    await page.getByRole('tab', { name: '診療録' }).click();
    await expect(page.getByRole('tab', { name: '診療録' })).toHaveAttribute('aria-selected', 'true');

    // ⑤ アクションバーの「退院指示」をクリック
    await page.getByRole('button', { name: '退院指示' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('text=退院指示').first()).toBeVisible();

    // ⑥ 「退院確定」をクリック
    await page.getByRole('button', { name: '退院確定' }).click();

    // 未実施オーダがある場合はオーダ確認ダイアログが出るので確定する
    const orderConfirm = page.getByRole('button', { name: /中止確定|確定|OK/ });
    if (await orderConfirm.first().isVisible().catch(() => false)) {
      await orderConfirm.first().click();
    }

    // 退院確定の完了通知（スナックバー）が表示されること
    await expect(page.getByText(/退院確定:/)).toBeVisible();
  });

  // ===== B: 看護師の朝ラウンド（バイタル一括入力） =====
  test('B 病室を選択→一括入力へ→一括バイタル入力画面に遷移', async ({ page }) => {
    // ① 病室カードのチェックボックスを選択
    await page.getByRole('checkbox').first().check();

    // ② 「一括入力へ」ボタンが活性化してクリックできる
    const bulkBtn = page.getByRole('button', { name: '一括入力へ' });
    await expect(bulkBtn).toBeEnabled();
    await bulkBtn.click();

    // ③ 一括バイタル入力画面へ遷移
    await expect(page).toHaveURL(/\/nursing\/bulk-vitals/);
    await expect(page.locator('text=一括バイタル入力')).toBeVisible();
  });

  // ===== C: ベッドコントロール（転棟・転室） =====
  test('C 患者選択→移動→転棟転室ダイアログで移動先を選択→登録', async ({ page }) => {
    // ① 在床患者をクリックして操作メニューを表示
    const beds = page.locator('.MuiCardContent-root').first();
    const bedItems = beds.locator('text=/^(?!空床|使用不可).+/');
    await bedItems.first().click();
    await expect(page.locator('text=メニュー:')).toBeVisible();

    // ② 「移動」をクリックして転棟・転室ダイアログを開く（フッターの [移動] を厳密指定。
    //    改定履歴リンク「…病床移動（転棟・転室）改修」と部分一致で衝突するため exact 指定）
    await page.getByRole('button', { name: '[移動]', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('text=転棟・転室ダイアログ')).toBeVisible();

    // ③ 移動先病室を順に試し、空きのある病室を選ぶ（ベッド指定は布団運用で廃止）
    // ダイアログ内のセレクトは 病棟(0)・病室(1) の 2 つ。空きのある病室を選ぶと登録が活性化する
    const combos = page.getByRole('dialog').getByRole('combobox');
    const roomCombo = combos.nth(1);
    const submitBtn = page.getByRole('button', { name: '登録' });
    let roomSelected = false;
    await roomCombo.click();
    const roomCount = await page.getByRole('option').count();
    for (let i = 0; i < roomCount; i++) {
      await page.getByRole('option').nth(i).click();
      // 空きのある病室なら登録ボタンが活性化（満床なら非活性＋「空きがありません」警告）
      if (await submitBtn.isEnabled()) {
        roomSelected = true;
        break;
      }
      // 満床なら次の病室へ
      await roomCombo.click();
    }
    expect(roomSelected).toBe(true);

    // ④ 登録ボタンが活性化してクリックできる
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // ⑤ 「移動を登録しました」スナックバーが表示されること
    await expect(page.locator('text=/移動を登録しました/')).toBeVisible();
  });

  // ===== D: 入院受け入れ（入院予定者の入院指示） =====
  test('D 右サイドバーの入院予定者詳細→入院指示ダイアログ', async ({ page }) => {
    // 入院予定者セクションの「詳細」ボタンを探す（病棟により予定が無い場合はスキップ）
    const admitSection = page.locator('.MuiPaper-root', { hasText: '入院予定者' }).first();
    const detailBtn = admitSection.getByRole('button', { name: '詳細' }).first();

    if (await detailBtn.isVisible().catch(() => false)) {
      await detailBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('dialog').locator('text=入院指示').first()).toBeVisible();
    } else {
      // 第２病棟に切り替えて再確認
      await page.getByRole('tab', { name: /第２病棟/ }).click();
      const detail2 = admitSection.getByRole('button', { name: '詳細' }).first();
      if (await detail2.isVisible().catch(() => false)) {
        await detail2.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('dialog').locator('text=入院指示').first()).toBeVisible();
      }
    }
  });

  // ===== E: 精神科特有（隔離拘束歴の確認） =====
  test('E 患者選択→隔離歴→隔離・拘束歴ダイアログを確認して閉じる', async ({ page }) => {
    const beds = page.locator('.MuiCardContent-root').first();
    const bedItems = beds.locator('text=/^(?!空床|使用不可).+/');
    await bedItems.first().click();
    await expect(page.locator('text=メニュー:')).toBeVisible();

    // 「隔離歴」をクリックして履歴ダイアログを開く
    await page.getByRole('button', { name: '隔離歴' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('text=隔離・拘束歴')).toBeVisible();

    // 「閉じる」で履歴ダイアログを閉じる
    await page.getByRole('button', { name: '閉じる' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  // ===== F: 外出外泊管理 =====
  test('F 患者選択→外出外泊→外出外泊画面に遷移', async ({ page }) => {
    const beds = page.locator('.MuiCardContent-root').first();
    const bedItems = beds.locator('text=/^(?!空床|使用不可).+/');
    await bedItems.first().click();
    await expect(page.locator('text=メニュー:')).toBeVisible();

    // 左サイドメニューにも「外出外泊」があるため、フッターメニュー内に限定（[ラベル]表記）
    const footerMenu = page.locator('.MuiPaper-root', { hasText: 'メニュー:' });
    await footerMenu.getByRole('button', { name: '外出外泊' }).click();
    await expect(page).toHaveURL(/\/outing/);
    // 外出外泊画面の初期タブ「外出外泊一覧」が表示されること
    await expect(page.getByRole('tab', { name: '外出外泊一覧' })).toBeVisible();
  });

  // ===== G: 看護過程（看護計画）確認 =====
  test('G 患者選択→看護過程→ケアプラン画面に遷移', async ({ page }) => {
    const beds = page.locator('.MuiCardContent-root').first();
    const bedItems = beds.locator('text=/^(?!空床|使用不可).+/');
    await bedItems.first().click();
    await expect(page.locator('text=メニュー:')).toBeVisible();

    // 左サイドメニューにも「看護過程」があるため、フッターメニュー内に限定
    const footerMenu = page.locator('.MuiPaper-root', { hasText: 'メニュー:' });
    await footerMenu.getByRole('button', { name: '看護過程' }).click();
    await expect(page).toHaveURL(/\/care-plan\/patients\//);
  });

  // ===== H: 空床照会→（入院予定者の入院手続き） =====
  test('H 空床照会ダイアログを表示→閉じる→入院予定者の手続きを起動', async ({ page }) => {
    // ① 空床照会ダイアログを開く
    await page.getByRole('button', { name: '空床照会' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').locator('text=空床照会')).toBeVisible();

    // ② 閉じる
    await page.getByRole('button', { name: '閉じる' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // ③ 入院予定者パネルの病室確定済の行 [手続き]（在れば）→ 入院手続きダイアログ
    //    （[手続き] は病室確定済の行のみ表示。病室未定の行には出ない）
    const admitSection = page.locator('.MuiPaper-root', { hasText: '入院予定者' }).first();
    const procBtn = admitSection.getByRole('button', { name: '手続き' }).first();
    if (await procBtn.isVisible().catch(() => false)) {
      await procBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  });

  // ===== I: 入院者情報サマリ（旧「入退院情報」ボタン廃止に伴う統合） =====
  test('I 右サイドバー「入院者情報」に稼働率・隔離拘束・外出・観察の集計が統合表示される', async ({ page }) => {
    const panel = page.locator('.MuiPaper-root', { hasText: '入院者情報' }).first();
    await expect(panel).toBeVisible();
    // 病床稼働・平均年齢は維持
    await expect(panel.getByText(/病床/).first()).toBeVisible();
    await expect(panel.getByText(/平均年齢/).first()).toBeVisible();
    // 稼働率＋本日日付（M/D 時点）
    await expect(panel.getByText(/稼働率/).first()).toBeVisible();
    await expect(panel.getByText(/本日 \d{1,2}\/\d{1,2} 時点/).first()).toBeVisible();
    // 旧「入退院情報」ダイアログから統合した状態別集計（隔離 / 拘束 / 観察）。
    // 外出は「不在者」列と重複するため状態別チップからは除外している。
    await expect(panel.getByText(/隔離/).first()).toBeVisible();
    await expect(panel.getByText(/拘束/).first()).toBeVisible();
    await expect(panel.getByText(/観察/).first()).toBeVisible();
  });

  // ===== J: 入院予定者の病室未割当バッジ（入院オーダー時に病室未決定） =====
  test('J 入院予定者パネルに「病室未割当」バッジが表示される', async ({ page }) => {
    const admitSection = page.locator('.MuiPaper-root', { hasText: '入院予定者' }).first();
    await expect(admitSection).toBeVisible();
    // 病室未決定の入院予定者は「病室未割当」バッジ（色＋アイコンで判別）
    await expect(admitSection.getByText('病室未割当').first()).toBeVisible();
  });

});
