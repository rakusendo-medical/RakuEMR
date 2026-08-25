import { test, expect } from './fixtures';
import type { Page, Locator } from '@playwright/test';

/**
 * ep-11 us-55/us-54: オーダ送信画面（オーダ入力の起点）＋処方ダイアログ E2E
 * カルテ アクションバー「オーダー入力」→ オーダ送信画面 → 種別ボタン「処方」→ 処方ダイアログ
 * → 処方追加ダイアログで薬剤登録 → 作成中に積む → [指示] で指示簿へ反映。
 */
test.describe('オーダ送信（オーダ入力）', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/karte/P001');
    await expect(page.getByRole('button', { name: 'オーダー入力' })).toBeVisible();
  });

  const sendScreen = (page: Page) => page.getByRole('dialog').filter({ hasText: 'オーダ送信' });
  const rxDialog = (page: Page) => page.getByRole('dialog').filter({ hasText: 'オーダ内容' });
  const drugDialog = (page: Page) => page.getByRole('dialog').filter({ hasText: '処方追加' });

  const openSend = async (page: Page): Promise<Locator> => {
    await page.getByRole('button', { name: 'オーダー入力' }).click();
    const s = sendScreen(page);
    await expect(s).toBeVisible();
    return s;
  };

  /** [指示] → カルテ記事作成（現在指示中）→ [実行] でオーダを確定する。 */
  const placeOrders = async (page: Page, s: Locator) => {
    await s.getByRole('button', { name: '指示', exact: true }).click();
    const karte = page.getByRole('dialog').filter({ hasText: 'カルテ記事作成' });
    await expect(karte).toBeVisible();
    await karte.getByRole('button', { name: '実行', exact: true }).click();
  };

  /** 処方ダイアログでアキネトン錠1mg を Rp に追加する。 */
  const addAkineton = async (page: Page, rx: Locator) => {
    await rx.getByRole('button', { name: '新しい Rp として薬剤を追加' }).click();
    const dd = drugDialog(page);
    await expect(dd).toBeVisible();
    await dd.getByRole('tab', { name: '医薬品名' }).click();
    await dd.getByRole('textbox', { name: 'かな検索' }).fill('あきねとん');
    await dd.getByRole('button', { name: '検索' }).click();
    await dd.getByRole('button', { name: 'アキネトン錠1mg' }).click();       // 左で選択
    await dd.getByRole('button', { name: '選択項目を追加' }).click();          // [>] で処方へ
    await dd.getByRole('spinbutton', { name: '用量 アキネトン錠1mg' }).fill('1');
    await dd.getByRole('combobox', { name: '用法 アキネトン錠1mg' }).click();
    await page.getByRole('option', { name: '1日1回 朝食後', exact: true }).click();
    await dd.getByRole('button', { name: '登録' }).click();
    await expect(dd).not.toBeVisible();
  };

  test('us-55 AC-1 オーダ送信画面が開き、9 種別ボタンが並ぶ（定時処方→入院定時に統合・リハビリは治療形態へ分離・心理検査/画像追加）', async ({ page }) => {
    const s = await openSend(page);
    for (const name of ['入院定時', '処方', '注射', '検査', '画像', '心理検査', 'ECT', 'IF', 'テキスト']) {
      await expect(s.getByRole('button', { name, exact: true })).toBeVisible();
    }
    // 旧「定時処方」ボタンは廃止（入院定時へ統合）
    await expect(s.getByRole('button', { name: '定時処方', exact: true })).toHaveCount(0);
  });

  test('us-55/54 AC-3/4 処方を作成→指示で指示簿へ反映', async ({ page }) => {
    const s = await openSend(page);

    // 「処方」→ 処方ダイアログ
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx = rxDialog(page);
    await expect(rx).toBeVisible();

    // 薬剤を Rp に追加して登録
    await addAkineton(page, rx);
    await expect(rx.getByRole('cell', { name: 'アキネトン錠1mg', exact: true })).toBeVisible();
    await rx.getByRole('button', { name: '登録' }).click();
    await expect(rx).not.toBeVisible();

    // 作成中のオーダに積まれる
    await expect(s.getByRole('button', { name: /削除.*アキネトン錠1mg/ })).toBeVisible();

    // [指示] で確定
    await placeOrders(page, s);
    await expect(page.getByText(/オーダを登録しました（1件）/)).toBeVisible();
    await expect(s).not.toBeVisible();

    // 指示簿タブに反映
    await page.getByRole('tab', { name: '指示簿' }).click();
    const row = page.getByRole('row', { name: /アキネトン錠1mg/ });
    await expect(row).toBeVisible();
    await expect(row.getByRole('cell', { name: '1日1回 朝食後', exact: true })).toBeVisible();
  });

  test('us-63 指示時にカルテ記事作成（現在指示中）→実行でオーダ毎に別々のカルテ記事＋カルテNo', async ({ page }) => {
    const s = await openSend(page);
    // 処方（アキネトン）
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx = rxDialog(page);
    await addAkineton(page, rx);
    await rx.getByRole('button', { name: '登録' }).click();
    // 入院定時（アキネトン）＝2件目
    await s.getByRole('button', { name: '入院定時', exact: true }).click();
    const rx2 = rxDialog(page);
    await addAkineton(page, rx2);
    await rx2.getByRole('button', { name: '登録' }).click();

    // [指示] → カルテ記事作成（現在指示中）ダイアログ
    await s.getByRole('button', { name: '指示', exact: true }).click();
    const karte = page.getByRole('dialog').filter({ hasText: 'カルテ記事作成' });
    await expect(karte).toBeVisible();
    await expect(karte.getByText(/現在指示中/)).toBeVisible();
    await karte.getByRole('button', { name: '実行', exact: true }).click();
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();

    // 診療録タブに「【オーダ指示】」のカルテ記事が2件（オーダ毎に別々）現れる
    await page.getByRole('tab', { name: '診療録', exact: true }).click();
    await expect(page.getByText(/【オーダ指示】/)).toHaveCount(2);

    // 指示簿タブに、オーダ毎に発行されたカルテNo が付く
    await page.getByRole('tab', { name: '指示簿' }).click();
    await expect(page.getByText('NO.865')).toBeVisible();
    await expect(page.getByText('NO.866')).toBeVisible();
  });

  test('us-54 用法で Rp を採番し、同一 Rp の行は隣接して並ぶ', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '入院定時', exact: true }).click();
    const rx = rxDialog(page);
    await expect(rx).toBeVisible();

    await rx.getByRole('button', { name: '新しい Rp として薬剤を追加' }).click();
    const dd = drugDialog(page);
    // 医薬品名タブで検索し、各薬剤を選択→[>]で処方へ追加。アキネトン 2 剤
    await dd.getByRole('tab', { name: '医薬品名' }).click();
    await dd.getByRole('textbox', { name: 'かな検索' }).fill('あきねとん');
    await dd.getByRole('button', { name: '検索' }).click();
    await dd.getByRole('button', { name: 'アキネトン錠1mg' }).click();
    await dd.getByRole('button', { name: '選択項目を追加' }).click();
    await dd.getByRole('button', { name: 'アキネトン細粒1%' }).click();
    await dd.getByRole('button', { name: '選択項目を追加' }).click();
    // クエチアピンを追加検索
    await dd.getByRole('textbox', { name: 'かな検索' }).fill('くえちあぴん');
    await dd.getByRole('button', { name: '検索' }).click();
    await dd.getByRole('button', { name: 'クエチアピン錠25mg' }).click();
    await dd.getByRole('button', { name: '選択項目を追加' }).click();

    // 用量（用量欄は aria-label で特定）
    await dd.getByRole('spinbutton', { name: '用量 アキネトン錠1mg' }).fill('1');
    await dd.getByRole('spinbutton', { name: '用量 アキネトン細粒1%' }).fill('1');
    await dd.getByRole('spinbutton', { name: '用量 クエチアピン錠25mg' }).fill('1');
    // 用法: 行1=朝食後, 行2=昼食後, 行3=朝食後（用法セレクトは aria-label で特定）
    await dd.getByRole('combobox', { name: '用法 アキネトン錠1mg' }).click();
    await page.getByRole('option', { name: '1日1回 朝食後', exact: true }).click();
    await dd.getByRole('combobox', { name: '用法 アキネトン細粒1%' }).click();
    await page.getByRole('option', { name: '1日1回 昼食後', exact: true }).click();
    await dd.getByRole('combobox', { name: '用法 クエチアピン錠25mg' }).click();
    await page.getByRole('option', { name: '1日1回 朝食後', exact: true }).click();
    await dd.getByRole('button', { name: '登録' }).click();
    await expect(dd).not.toBeVisible();

    // 朝食後の 2 剤（錠1mg・クエチアピン）が Rp1 で隣接し、昼食後（細粒）が Rp2 で後ろに並ぶ
    await expect(rx.getByRole('row').nth(1)).toContainText('アキネトン錠1mg');
    await expect(rx.getByRole('row').nth(2)).toContainText('クエチアピン錠25mg');
    await expect(rx.getByRole('row').nth(3)).toContainText('アキネトン細粒1%');
  });

  test('us-54 一包化・後発不可の列と（全）一括操作', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx = rxDialog(page);
    await addAkineton(page, rx); // アキネトン錠1mg を追加（既定で一包化=1）

    // 一包化列（Select）と後発不可列（Checkbox）が薬剤行にある
    await expect(rx.getByRole('combobox', { name: '一包化 アキネトン錠1mg' })).toBeVisible();
    const noGeneric = rx.getByRole('checkbox', { name: '後発不可 アキネトン錠1mg' });
    await expect(noGeneric).not.toBeChecked();

    // 「後発品変更不可（全）」で全薬剤の後発不可が ON になる
    await rx.getByRole('checkbox', { name: '後発品変更不可（全）' }).check();
    await expect(noGeneric).toBeChecked();

    // 登録 → [指示] → 指示簿の内容に（包1・後発不可）が反映
    await rx.getByRole('button', { name: '登録' }).click();
    await placeOrders(page, s);
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();
    await page.getByRole('tab', { name: '指示簿' }).click();
    await expect(page.getByRole('cell', { name: /アキネトン錠1mg.*（包1・後発不可）/ })).toBeVisible();
  });

  test('us-54 一包化を「なし」から新規にすると（全）チェックが自動で入る', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx = rxDialog(page);
    await addAkineton(page, rx);

    const allCb = rx.getByRole('checkbox', { name: '一包化', exact: true });
    // いったん全 OFF → 行は「なし」
    await allCb.uncheck();
    await expect(allCb).not.toBeChecked();

    // 行の一包化を ＊(新規) に → （全）チェックが自動で入る
    await rx.getByRole('combobox', { name: '一包化 アキネトン錠1mg' }).click();
    await page.getByRole('option', { name: '＊(新規)' }).click();
    await expect(allCb).toBeChecked();
  });

  test('us-54 新規オーダは常に空で開く（未指示の下書きを自動復元しない）', async ({ page }) => {
    const s = await openSend(page);

    // 1 回目: 処方を作成（アキネトン錠1mg）→ 登録（作成中に積むが未指示）
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx = rxDialog(page);
    await addAkineton(page, rx);
    await rx.getByRole('button', { name: '登録' }).click();
    await expect(rx).not.toBeVisible();
    await expect(s.getByRole('button', { name: /削除.*アキネトン錠1mg/ })).toBeVisible();

    // 2 回目: 同じ「処方」を開いても前回内容は入らず、空で開く
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx2 = rxDialog(page);
    await expect(rx2).toBeVisible();
    await expect(rx2.getByRole('cell', { name: 'アキネトン錠1mg', exact: true })).toHaveCount(0);
  });

  test('us-54 終了日はカレンダー入力でき、日数と双方向に連動する', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '入院定時', exact: true }).click();
    const rx = rxDialog(page);
    const startField = rx.getByLabel(/開始日/);
    const daysField = rx.getByRole('spinbutton', { name: '日数' });
    const endField = rx.getByLabel('終了日');

    // 開始日固定 → 日数から終了日が算出
    await startField.fill('2026-10-29');
    await daysField.fill('10');
    await expect(endField).toHaveValue('2026-11-07');

    // 終了日をカレンダー入力 → 日数を逆算
    await endField.fill('2026-11-27');
    await expect(daysField).toHaveValue('30');

    // 終了日を空欄 → 継続（日数0）
    await endField.fill('');
    await expect(daysField).toHaveValue('0');
  });

  test('us-54 処方: 日数を Rp 単位で設定でき content に反映', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx = rxDialog(page);
    await addAkineton(page, rx);
    // Rp 表に Rp 単位の日数欄（既定7・各 Rp の先頭行）があり、変更できる
    const rowDays = rx.getByRole('spinbutton', { name: '日数 Rp1' });
    await expect(rowDays).toHaveValue('7');
    await rowDays.fill('14');
    // 登録 → 指示 → 指示簿の content に「×14日分」が反映
    await rx.getByRole('button', { name: '登録' }).click();
    await placeOrders(page, s);
    await page.getByRole('tab', { name: '指示簿' }).click();
    await expect(page.getByRole('cell', { name: /アキネトン錠1mg.*×14日分/ })).toBeVisible();
  });

  test('作成中オーダ: 処方の日数・入院定時の日数を「作成中のオーダ」上で編集できる', async ({ page }) => {
    const s = await openSend(page);
    // 処方を作成 → 作成中に「×7日分」→ 日数を14に編集すると content が更新される
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx = rxDialog(page);
    await addAkineton(page, rx);
    await rx.getByRole('button', { name: '登録' }).click();
    await expect(rx).not.toBeVisible();
    // 処方: 用法行の日数（Rp1・既定7）→14 に編集できる
    const rpDays = s.getByRole('spinbutton', { name: '日数 処方 Rp1' });
    await expect(rpDays).toHaveValue('7');
    await rpDays.fill('14');
    await expect(rpDays).toHaveValue('14');
    // 予定日も編集できる（全種別）
    await s.getByLabel('予定日 処方').fill('2026-08-27');
    await expect(s.getByLabel('予定日 処方')).toHaveValue('2026-08-27');

    // 入院定時を作成 → 予定日の下の日数を 3 に編集できる
    await s.getByRole('button', { name: '入院定時', exact: true }).click();
    const rx2 = rxDialog(page);
    await addAkineton(page, rx2);
    await rx2.getByRole('button', { name: '登録' }).click();
    await expect(rx2).not.toBeVisible();
    const teijiDays = s.getByRole('spinbutton', { name: '日数 入院定時' });
    await expect(teijiDays).toHaveValue('1');
    await teijiDays.fill('3');
    await expect(teijiDays).toHaveValue('3');
  });

  test('作成中オーダ: 入院定時をクリックすると処方ダイアログが開き内容を編集できる（同じオーダを置き換え）', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '入院定時', exact: true }).click();
    const rx = rxDialog(page);
    await addAkineton(page, rx);
    await rx.getByRole('button', { name: '登録' }).click();
    await expect(rx).not.toBeVisible();
    await expect(s.getByRole('button', { name: /削除.*アキネトン錠1mg/ })).toHaveCount(1);

    // 作成中の内容をクリック → 処方ダイアログが編集モードで開き、アキネトンが復元されている
    await s.getByText('アキネトン錠1mg').first().click();
    const rx2 = rxDialog(page);
    await expect(rx2).toBeVisible();
    await expect(rx2.getByRole('cell', { name: 'アキネトン錠1mg', exact: true })).toBeVisible();

    // 日数を 5 に変更して登録 → 作成中に反映され、オーダは増えない（同じ id を置き換え）
    await rx2.getByRole('spinbutton', { name: '日数' }).fill('5');
    await rx2.getByRole('button', { name: '登録' }).click();
    await expect(rx2).not.toBeVisible();
    await expect(s.getByRole('button', { name: /削除.*アキネトン錠1mg/ })).toHaveCount(1);
    await expect(s.getByRole('spinbutton', { name: '日数 入院定時' })).toHaveValue('5');
  });

  test('作成中オーダ: 各オーダに備考を入力でき、指示でカルテ記事に反映される', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '入院定時', exact: true }).click();
    const rx = rxDialog(page);
    await addAkineton(page, rx);
    await rx.getByRole('button', { name: '登録' }).click();
    await expect(rx).not.toBeVisible();

    // 作成中の画面でオーダ単位の備考を入力
    await s.getByRole('textbox', { name: '備考 入院定時' }).fill('朝食後に状態確認');

    // 指示 → カルテ記事作成 → 実行 → 診療録に備考が反映
    await s.getByRole('button', { name: '指示', exact: true }).click();
    const karte = page.getByRole('dialog').filter({ hasText: 'カルテ記事作成' });
    await karte.getByRole('button', { name: '実行', exact: true }).click();
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();
    await page.getByRole('tab', { name: '診療録', exact: true }).click();
    await expect(page.getByText(/備考: 朝食後に状態確認/)).toBeVisible();
  });

  test('医薬品コメント: 用量・用法それぞれのコメントを処方ダイアログと作成中の2行表示で付けられる', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx = rxDialog(page);
    await addAkineton(page, rx);
    // Rp 表の用量コメント・用法コメント欄に入力
    await rx.getByRole('textbox', { name: '用量コメント アキネトン錠1mg' }).fill('半錠');
    await rx.getByRole('textbox', { name: '用法コメント アキネトン錠1mg' }).fill('食後に服用');
    await rx.getByRole('button', { name: '登録' }).click();
    await expect(rx).not.toBeVisible();
    // 作成中の2行表示: 用量コメント/用法コメント欄に反映される
    await expect(s.getByRole('textbox', { name: '用量コメント 処方 アキネトン錠1mg' })).toHaveValue('半錠');
    const uc = s.getByRole('textbox', { name: '用法コメント 処方 アキネトン錠1mg' });
    await expect(uc).toHaveValue('食後に服用');
    // 作成中側でも編集できる
    await uc.fill('朝のみ');
    await expect(uc).toHaveValue('朝のみ');
  });

  test('us-56 注射: 日分を Rp 単位で設定できる', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '注射', exact: true }).click();
    const rx = rxDialog(page);
    await rx.getByRole('button', { name: '新しい Rp として薬剤を追加' }).click();
    const dd = page.getByRole('dialog').filter({ hasText: '注射追加' });
    // 医師セットタブ（既定）で注射セットを選択→[>]で追加
    await dd.getByRole('button', { name: '武田セット1' }).click();
    await dd.getByRole('button', { name: '選択項目を追加' }).click();
    await dd.getByRole('button', { name: '登録' }).click();
    await expect(dd).not.toBeVisible();
    // 注射は Rp 単位の「日分」欄（既定7・各 Rp の先頭行）を持つ
    await expect(rx.getByRole('spinbutton', { name: '日分 Rp1' })).toHaveValue('7');
  });

  test('us-54 Rp を変更して既存 Rp にまとめられる', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '入院定時', exact: true }).click();
    const rx = rxDialog(page);
    await rx.getByRole('button', { name: '新しい Rp として薬剤を追加' }).click();
    const dd = drugDialog(page);
    // 2 剤を別用法で追加（Rp1=錠1mg朝食後, Rp2=細粒昼食後）
    await dd.getByRole('tab', { name: '医薬品名' }).click();
    await dd.getByRole('textbox', { name: 'かな検索' }).fill('あきねとん');
    await dd.getByRole('button', { name: '検索' }).click();
    await dd.getByRole('button', { name: 'アキネトン錠1mg' }).click();
    await dd.getByRole('button', { name: '選択項目を追加' }).click();
    await dd.getByRole('button', { name: 'アキネトン細粒1%' }).click();
    await dd.getByRole('button', { name: '選択項目を追加' }).click();
    await dd.getByRole('spinbutton', { name: '用量 アキネトン錠1mg' }).fill('1');
    await dd.getByRole('spinbutton', { name: '用量 アキネトン細粒1%' }).fill('1');
    await dd.getByRole('combobox', { name: '用法 アキネトン錠1mg' }).click();
    await page.getByRole('option', { name: '1日1回 朝食後', exact: true }).click();
    await dd.getByRole('combobox', { name: '用法 アキネトン細粒1%' }).click();
    await page.getByRole('option', { name: '1日1回 昼食後', exact: true }).click();
    await dd.getByRole('button', { name: '登録' }).click();
    await expect(dd).not.toBeVisible();

    // 細粒は Rp2 → Rp を 1 に変更してまとめる
    const rpSaikai = rx.getByRole('combobox', { name: 'Rp アキネトン細粒1%' });
    await expect(rpSaikai).toHaveText('2');
    await rpSaikai.click();
    await page.getByRole('option', { name: '1', exact: true }).click();

    // 両方 Rp1 になり隣接する
    await expect(rpSaikai).toHaveText('1');
    await expect(rx.getByRole('combobox', { name: 'Rp アキネトン錠1mg' })).toHaveText('1');
    await expect(rx.getByRole('row').nth(1)).toContainText('アキネトン錠1mg');
    await expect(rx.getByRole('row').nth(2)).toContainText('アキネトン細粒1%');
  });

  test('us-54 処方セットマスタ（実マスタ）から薬剤を一括セットできる', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx = rxDialog(page);
    await rx.getByRole('button', { name: '新しい Rp として薬剤を追加' }).click();
    const dd = drugDialog(page);
    await expect(dd).toBeVisible();

    // 医師セットタブ（既定）で処方セットを選択→[>] → セットの薬剤が用量・用法込みで処方へ
    await dd.getByRole('button', { name: 'アルプラゾラム錠０．４mgセット' }).click();
    await dd.getByRole('button', { name: '選択項目を追加' }).click();
    await expect(dd.getByRole('cell', { name: /アルプラゾラム錠０．４ｍｇ/ }).first()).toBeVisible();
    await expect(dd.getByRole('cell', { name: /ゾルピデム酒石酸塩錠/ }).first()).toBeVisible();
    await expect(dd.getByRole('cell', { name: /タンドスピロン/ }).first()).toBeVisible();

    // 用法が設定済みなのでそのまま登録できる
    await dd.getByRole('button', { name: '登録' }).click();
    await expect(dd).not.toBeVisible();

    // Rp テーブルに反映
    await expect(rx.getByRole('cell', { name: /アルプラゾラム錠０．４ｍｇ/ }).first()).toBeVisible();
    await expect(rx.getByRole('cell', { name: /ゾルピデム酒石酸塩錠/ }).first()).toBeVisible();
  });

  test('us-54 処方追加: 過去に作成したオーダー（履歴）から薬剤をセットし再作成できる', async ({ page }) => {
    const s = await openSend(page);

    // 入院定時 → 処方追加。P001 の既存の入院定時オーダ（履歴）が「過去のオーダー」に並ぶ
    await s.getByRole('button', { name: '入院定時', exact: true }).click();
    const rx = rxDialog(page);
    await rx.getByRole('button', { name: '新しい Rp として薬剤を追加' }).click();
    const dd = drugDialog(page);
    await expect(dd).toBeVisible();

    // 過去処方タブから既存オーダを選択→[>]で、その薬剤が処方へ復元される
    await dd.getByRole('tab', { name: '過去処方' }).click();
    await dd.getByRole('button', { name: /リスパダール 2mg/ }).click();
    await dd.getByRole('button', { name: '選択項目を追加' }).click();
    await expect(dd.getByRole('cell', { name: 'リスパダール 2mg', exact: true })).toBeVisible();

    // そのまま登録 → 作成中に積んで再作成できる
    await dd.getByRole('button', { name: '登録' }).click();
    await expect(dd).not.toBeVisible();
    await expect(rx.getByRole('cell', { name: 'リスパダール 2mg', exact: true })).toBeVisible();
  });

  test('us-54 過去処方: 自作オーダを取り込むと用量・単位・用法が復元される', async ({ page }) => {
    // まず 処方 を作成→指示→確定して「過去処方」に載せる（アキネトン錠1mg 1錠・1日1回 朝食後）
    const s = await openSend(page);
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx = rxDialog(page);
    await addAkineton(page, rx);
    await rx.getByRole('button', { name: '登録' }).click();
    await placeOrders(page, s);
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();

    // 再度 処方 → 処方追加 → 過去処方 から取り込む
    const s2 = await openSend(page);
    await s2.getByRole('button', { name: '処方', exact: true }).click();
    const rx2 = rxDialog(page);
    await rx2.getByRole('button', { name: '新しい Rp として薬剤を追加' }).click();
    const dd = drugDialog(page);
    await dd.getByRole('tab', { name: '過去処方' }).click();
    await dd.getByRole('button', { name: /アキネトン錠1mg/ }).click();
    await dd.getByRole('button', { name: '選択項目を追加' }).click();

    // 用量・単位・用法が正しく復元される（名称に含めず分離）
    await expect(dd.getByRole('cell', { name: 'アキネトン錠1mg', exact: true })).toBeVisible();
    await expect(dd.getByRole('spinbutton', { name: '用量 アキネトン錠1mg' })).toHaveValue('1');
    await expect(dd.getByRole('combobox', { name: '単位 アキネトン錠1mg' })).toHaveText('錠');
    await expect(dd.getByRole('combobox', { name: '用法 アキネトン錠1mg' })).toHaveText(/朝食後/);
  });

  test('us-54 処方追加: 過去処方タブは同種別の履歴が無いとき「過去のオーダーはありません」を表示', async ({ page }) => {
    // P002 は「処方(臨時)」オーダを持たない → 過去処方タブは空案内を表示
    await page.goto('/karte/P002');
    await expect(page.getByRole('button', { name: 'オーダー入力' })).toBeVisible();
    const s = await openSend(page);
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx = rxDialog(page);
    await rx.getByRole('button', { name: '新しい Rp として薬剤を追加' }).click();
    const dd = drugDialog(page);
    await expect(dd).toBeVisible();
    await dd.getByRole('tab', { name: '過去処方' }).click();
    await expect(dd.getByText('過去のオーダーはありません')).toBeVisible();
  });

  test('us-56 注射追加: 過去に作成した注射オーダー（履歴）から薬剤をセットできる', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '注射', exact: true }).click();
    const rx = rxDialog(page);
    await rx.getByRole('button', { name: '新しい Rp として薬剤を追加' }).click();
    const dd = page.getByRole('dialog').filter({ hasText: '注射追加' });
    await expect(dd).toBeVisible();
    // P001 の既存の注射オーダ（履歴）が過去処方タブに並ぶ。選択→[>]で復元
    await dd.getByRole('tab', { name: '過去処方' }).click();
    await dd.getByRole('button', { name: /ハロペリドール デポ筋注 50mg/ }).click();
    await dd.getByRole('button', { name: '選択項目を追加' }).click();
    await expect(dd.getByRole('cell', { name: 'ハロペリドール デポ筋注 50mg', exact: true })).toBeVisible();
  });

  test('us-56 注射: 注射セットから追加→指示簿に反映（一包化/後発列なし）', async ({ page }) => {
    const s = await openSend(page);
    // 注射ボタンで注射ダイアログが開く
    await s.getByRole('button', { name: '注射', exact: true }).click();
    const rx = rxDialog(page);
    await expect(rx).toBeVisible();
    // 一包化/後発（全）チェックは無い
    await expect(rx.getByText('後発品変更不可（全）')).toHaveCount(0);

    // 注射追加ダイアログ → 注射セットから一括
    await rx.getByRole('button', { name: '新しい Rp として薬剤を追加' }).click();
    const dd = page.getByRole('dialog').filter({ hasText: '注射追加' });
    await expect(dd).toBeVisible();
    // 医師セットタブ（既定）で注射セットを選択→[>]で追加
    await dd.getByRole('button', { name: '武田セット1' }).click();
    await dd.getByRole('button', { name: '選択項目を追加' }).click();
    await expect(dd.getByRole('cell', { name: /ホリゾン注射液/ }).first()).toBeVisible();
    await dd.getByRole('button', { name: '登録' }).click();
    await expect(dd).not.toBeVisible();
    await expect(rx.getByRole('cell', { name: /ホリゾン注射液/ }).first()).toBeVisible();

    // 登録 → 指示 → 指示簿に注射で反映
    await rx.getByRole('button', { name: '登録' }).click();
    await placeOrders(page, s);
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();
    await page.getByRole('tab', { name: '指示簿' }).click();
    await expect(page.getByRole('cell', { name: /ホリゾン注射液/ }).first()).toBeVisible();
  });

  test('us-57 検査: セット選択で項目チェック→登録→指示簿に反映', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '検査', exact: true }).click();
    const rx = page.getByRole('dialog').filter({ hasText: '検査セット' });
    await expect(rx).toBeVisible();

    // 左の検査セット一覧から選ぶとセットの項目がチェックされる
    await rx.getByRole('button', { name: '院内セット1' }).click();
    await expect(rx.getByRole('checkbox', { name: '検査 総蛋白' })).toBeChecked();

    // 手動でチェックボックスも操作できる（別項目を追加）
    const albumin = rx.getByRole('checkbox', { name: '検査 アルブミン' });
    await expect(albumin).toBeChecked(); // セットに含まれる
    // 登録 → 指示 → 指示簿へ検査として反映
    await rx.getByRole('button', { name: '登録' }).click();
    await placeOrders(page, s);
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();
    await page.getByRole('tab', { name: '指示簿' }).click();
    await expect(page.getByRole('cell', { name: /総蛋白/ }).first()).toBeVisible();
  });

  test('us-55 診療録（参照）の DO ボタンでオーダを作成中に複製→指示簿へ反映', async ({ page }) => {
    const s = await openSend(page);

    // 左の診療録（参照）にある既存オーダの DO ボタンを押す
    await s.getByRole('button', { name: 'DO 入院定時：エビリファイ 6mg' }).click();
    await expect(page.getByText(/DO しました/)).toBeVisible();

    // 作成中のオーダに 1 件積まれる（同じ内容で複製）
    await expect(s.getByRole('button', { name: /削除.*エビリファイ 6mg/ })).toBeVisible();
    // 上部ボタン作成時と同じ構造化 2 行表示（用量/用法コメント欄・編集可）になる
    await expect(s.getByRole('textbox', { name: '用量コメント 入院定時 エビリファイ 6mg' })).toBeVisible();
    await expect(s.getByRole('spinbutton', { name: '日数 入院定時' })).toBeVisible();

    // [指示] で確定 → 指示簿に入院定時として反映
    await placeOrders(page, s);
    await expect(page.getByText(/オーダを登録しました（1件）/)).toBeVisible();
    await expect(s).not.toBeVisible();

    await page.getByRole('tab', { name: '指示簿' }).click();
    await expect(page.getByRole('cell', { name: /エビリファイ 6mg/ }).first()).toBeVisible();
  });

  test('us-59 入院定時: 入院専用の定時処方（処方フォーム流用）を作成→指示簿に反映', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '入院定時', exact: true }).click();
    const rx = rxDialog(page);
    await expect(rx).toBeVisible();

    // 処方フォームと同じく薬剤を Rp に追加して登録
    await addAkineton(page, rx);
    await expect(rx.getByRole('cell', { name: 'アキネトン錠1mg', exact: true })).toBeVisible();
    await rx.getByRole('button', { name: '登録' }).click();
    await expect(rx).not.toBeVisible();

    // [指示] → 指示簿に 入院定時 として反映
    await placeOrders(page, s);
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();
    await page.getByRole('tab', { name: '指示簿' }).click();
    await expect(page.getByRole('row', { name: /アキネトン錠1mg/ })).toBeVisible();
  });

  test('us-62 テキスト（文字）: 診療録作成ダイアログ流用（左DO引用・前回カルテ取り込みなし）→登録→指示簿に反映', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: 'テキスト', exact: true }).click();
    const rx = page.getByRole('dialog').filter({ hasText: 'テキストオーダ作成' });
    await expect(rx).toBeVisible();

    // 左の DO引用パネル・前回カルテ取り込み・テンプレート・面接フォームは非表示（オーダ入力用）
    await expect(rx.getByText('DO引用')).toHaveCount(0);
    await expect(rx.getByRole('button', { name: '前回カルテ取り込み' })).toHaveCount(0);
    await expect(rx.getByRole('button', { name: 'テンプレート挿入' })).toHaveCount(0);
    await expect(rx.getByText('面接フォーム')).toHaveCount(0);
    // フッターは キャンセル／登録 のみ（診察終了・保存なし）
    await expect(rx.getByRole('button', { name: '診察終了' })).toHaveCount(0);

    // タイトル・本文を入力
    await rx.getByRole('textbox', { name: 'タイトル' }).fill('連絡事項');
    await rx.getByPlaceholder('フリーテキストで記載してください').fill('ご家族へ本日中に連絡のこと');

    // 登録 → 指示 → 指示簿へ反映（内容にタイトルと本文）
    await rx.getByRole('button', { name: '登録' }).click();
    await expect(rx).not.toBeVisible();
    await placeOrders(page, s);
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();
    await page.getByRole('tab', { name: '指示簿' }).click();
    await expect(page.getByRole('cell', { name: /【連絡事項】ご家族へ本日中に連絡のこと/ }).first()).toBeVisible();
  });

  test('us-61 治療形態: カルテ下部「治療形態」から3画面を切替え、作業療法で指示→指示簿に反映（実機準拠）', async ({ page }) => {
    // リハビリはオーダではないため、カルテ下部の「治療形態」ボタンから起動する（オーダ送信には無い）
    await page.getByRole('button', { name: '治療形態', exact: true }).click();
    const rx = page.getByRole('dialog').filter({ hasText: '治療形態' });
    await expect(rx).toBeVisible();

    // 初期は作業療法。上部3ボタンで作業療法／服薬指導／栄養指導を切替できる
    await expect(rx.getByText('作業療法指示')).toBeVisible();
    await rx.getByRole('button', { name: '服薬指導', exact: true }).click();
    await expect(rx.getByText('服薬指導指示')).toBeVisible();
    await rx.getByRole('button', { name: '栄養指導', exact: true }).click();
    await expect(rx.getByText('栄養指導指示')).toBeVisible();
    await rx.getByRole('button', { name: '作業療法', exact: true }).click();
    await expect(rx.getByText('作業療法指示')).toBeVisible();

    // 病名の下段は主病名（患者P001＝統合失調症）が初期表示される
    await expect(rx.getByRole('textbox', { name: '病名', exact: true })).toHaveValue('統合失調症');
    // 診断病名: 上段プルダウンで選択→[プレビュー]で下段編集欄へ転記される（マニュアル準拠）
    await rx.getByRole('combobox', { name: '診断病名 選択' }).click();
    await page.getByRole('option', { name: 'うつ病', exact: true }).click();
    await rx.getByRole('button', { name: 'プレビュー' }).first().click();
    await expect(rx.getByRole('textbox', { name: '診断病名', exact: true })).toHaveValue('うつ病');

    // 依頼目的・主症状を選んで指示 → その場で確定（オーダ送信を経由しない）
    await rx.getByRole('checkbox', { name: '依頼目的 活動性の向上・賦活' }).check();
    await rx.getByRole('checkbox', { name: '主症状 意欲低下' }).check();
    await rx.getByRole('button', { name: '指示', exact: true }).click();
    await expect(rx).not.toBeVisible();
    await expect(page.getByText(/治療形態（作業療法）を指示しました/)).toBeVisible();

    // 指示簿に「定期」オーダとして反映される
    await page.getByRole('tab', { name: '指示簿' }).click();
    const row = page.getByRole('row', { name: /作業療法指示/ });
    await expect(row).toBeVisible();
    await expect(row).toContainText('定期');

    // カルテ記事も作成される（診療録タイムラインに【定期オーダ指示】）
    await page.getByRole('tab', { name: '診療録' }).click();
    await expect(page.getByText(/【定期オーダ指示】/).first()).toBeVisible();

    // 再度「治療形態」を開くと左の履歴に作業療法が並び、クリックで内容が復元される
    await page.getByRole('button', { name: '治療形態', exact: true }).click();
    const rx2 = page.getByRole('dialog').filter({ hasText: '治療形態' });
    await rx2.getByRole('button', { name: /作業療法.*2026/ }).click();
    await expect(rx2.getByRole('checkbox', { name: '依頼目的 活動性の向上・賦活' })).toBeChecked();
  });

  test('us-60 IF: 指示で「IFオーダ」タブに待機登録→タブで実施すると指示簿に反映（頓用・即時実施）', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: 'IF', exact: true }).click();
    const ifd = page.getByRole('dialog').filter({ hasText: 'IFオーダ' });
    await expect(ifd).toBeVisible();

    // 症状テンプレート選択（分類→コメント→登録）
    await ifd.getByRole('button', { name: '症状テンプレート選択' }).click();
    const picker = page.getByRole('dialog').filter({ hasText: 'IF症状条件選択画面' });
    await expect(picker).toBeVisible();
    await picker.getByRole('button', { name: '不穏時', exact: true }).click();
    await picker.getByRole('button', { name: '不穏時（注射）' }).click();
    await picker.getByRole('button', { name: '登録', exact: true }).click();
    await expect(ifd.getByRole('textbox', { name: '症状' })).toHaveValue('不穏時（注射）');

    // 種別ボタン「処方」→ 処方ダイアログ（実機同様の動き）で薬剤を組む
    await ifd.getByRole('button', { name: '処方', exact: true }).click();
    const rx = rxDialog(page);
    await addAkineton(page, rx);
    await rx.getByRole('button', { name: '登録' }).click();
    await expect(rx).not.toBeVisible();
    await expect(ifd.getByText(/アキネトン錠1mg/)).toBeVisible();

    // IF [指示] → 1 件の IF オーダとして「作成中のオーダ」へ積まれる
    await ifd.getByRole('button', { name: '指示', exact: true }).click();
    await expect(ifd).not.toBeVisible();
    await expect(s.getByText(/アキネトン錠1mg/)).toBeVisible();
    // オーダ送信の [指示] → カルテ記事作成 → [実行] で確定（＝オーダ作成＋カルテ作成）
    await placeOrders(page, s);
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();

    // カルテ「IFオーダ」タブ → 待機中で登録され、右の内容にアキネトンが表示される
    await page.getByRole('tab', { name: 'IFオーダ' }).click();
    await expect(page.getByText(/不穏時（注射）/).first()).toBeVisible();
    await expect(page.getByText(/アキネトン錠1mg/).first()).toBeVisible();

    // [実施]（下部・チェック済みサブオーダを即時実施）→ 頓用（都度実施）のため実施済にはならず再実施可能
    await page.getByRole('button', { name: '実施', exact: true }).click();
    await expect(page.getByText(/を実施しました/)).toBeVisible();
    // IF は都度実施: エントリは待機のまま（実施済にならない）・実施ボタンは再度押せる
    await expect(page.getByText(/（実施済）/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: '実施', exact: true })).toBeEnabled();

    // 指示簿に発行された処方（アキネトン）が反映される
    await page.getByRole('tab', { name: '指示簿' }).click();
    await expect(page.getByRole('cell', { name: /アキネトン錠1mg/ }).first()).toBeVisible();

    // フローシート実施確認表: IF 自体は出ず、実施した処方（アキネトン）が並ぶ
    await page.getByRole('tab', { name: 'フローシート・隔離拘束', exact: true }).click();
    const orderRow = page.getByRole('row').filter({ hasText: '予定オーダ' });
    await orderRow.getByRole('cell').last().click();
    const execDialog = page.getByRole('dialog').filter({ hasText: '実施確認表' });
    await expect(execDialog).toBeVisible();
    await expect(execDialog.getByText(/アキネトン錠1mg/)).toBeVisible();
    await expect(execDialog.getByRole('cell', { name: 'IF', exact: true })).toHaveCount(0);
  });

  test('us-60 IF: セット表示から登録済みオーダを取り込める', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: 'IF', exact: true }).click();
    const ifd = page.getByRole('dialog').filter({ hasText: 'IFオーダ' });
    await expect(ifd).toBeVisible();
    // 左を「セット表示」に切替 → グループ「頓用」→ 不眠時セットをクリックで取込
    await ifd.getByRole('button', { name: 'セット表示' }).click();
    await ifd.getByRole('combobox').click();
    await page.getByRole('option', { name: '頓用' }).click();
    await ifd.getByRole('button', { name: '不眠時' }).click();
    // 構成中に処方（ブロチゾラム）が入る
    await expect(ifd.getByText(/ブロチゾラム/)).toBeVisible();
  });

  test('us-58 ECT: サブセット選択→通電時間→登録→指示簿に反映（マニュアル準拠）', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: 'ECT', exact: true }).click();
    const rx = page.getByRole('dialog').filter({ hasText: '通電時間' });
    await expect(rx).toBeVisible();

    // 左の ECT セット→サブセットを選ぶと、手技・前処置・通電時間・後処置がチェック付きでロードされる
    await rx.getByRole('button', { name: '両側・標準' }).click();
    await expect(rx.getByRole('checkbox', { name: '手技 精神科電気痙攣療法' })).toBeChecked();
    await expect(rx.getByRole('checkbox', { name: '前処置 アトロピン硫酸塩注0.5mg' })).toBeChecked();
    await expect(rx.getByRole('spinbutton', { name: '通電時間' })).toHaveValue('5');

    // 登録 → 指示 → 指示簿へ ECT として反映
    await rx.getByRole('button', { name: '登録' }).click();
    await placeOrders(page, s);
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();
    await page.getByRole('tab', { name: '指示簿' }).click();
    await expect(page.getByRole('cell', { name: /精神科電気痙攣療法/ }).first()).toBeVisible();
  });

  test('心理検査: 検査目的・検査項目を選んで指示→指示簿に「臨時」で反映（実機準拠）', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '心理検査', exact: true }).click();
    const rx = page.getByRole('dialog').filter({ hasText: '心理検査オーダ' });
    await expect(rx).toBeVisible();

    // 検査目的と検査項目（グループ子項目）を選ぶ
    await rx.getByRole('checkbox', { name: '認知機能のアセスメント' }).check();
    await rx.getByRole('checkbox', { name: '改訂長谷川式簡易評価スケール(HDS-R)' }).check();
    await rx.getByRole('checkbox', { name: '通常実施' }).check();

    // 登録 → 指示 → カルテ記事作成 → 指示簿へ反映
    await rx.getByRole('button', { name: '登録' }).click();
    await expect(rx).not.toBeVisible();
    await placeOrders(page, s);
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();
    await page.getByRole('tab', { name: '指示簿' }).click();
    const row = page.getByRole('row', { name: /HDS-R/ });
    await expect(row).toBeVisible();
    await expect(row).toContainText('臨時');
  });

  test('画像: 一般撮影→胸部を選び部位/薬剤を指示→指示簿に「臨時」で反映（実機準拠）', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '画像', exact: true }).click();
    const rx = page.getByRole('dialog').filter({ hasText: '画像オーダ' });
    await expect(rx).toBeVisible();

    // 既定グループ=一般撮影。セット名「胸部」を選ぶと内容がロードされる
    await rx.getByRole('button', { name: '胸部', exact: true }).click();
    await expect(rx.getByText(/［一般撮影］-［胸部］/)).toBeVisible();
    // 部位「胸部　正面」は既定チェック
    await expect(rx.getByRole('checkbox', { name: '部位 胸部　正面', exact: true })).toBeChecked();

    // 部位の[追加]で項目検索→項目を追加
    await rx.getByRole('button', { name: '部位 追加' }).click();
    const search = page.getByRole('dialog').filter({ hasText: 'の追加' });
    await expect(search).toBeVisible();
    await search.getByRole('row', { name: /ウォータース/ }).click();
    await expect(rx.getByRole('checkbox', { name: /部位 ウォータース/ })).toBeVisible();

    // 薬剤の[追加]は初期表示（検索前も全件）→ 一覧から追加できる
    await rx.getByRole('button', { name: '薬剤 追加' }).click();
    const search2 = page.getByRole('dialog').filter({ hasText: 'の追加' });
    await expect(search2.getByRole('row', { name: /イオパミロン/ })).toBeVisible();
    await search2.getByRole('row', { name: /イオパミロン/ }).click();
    await expect(rx.getByRole('checkbox', { name: /薬剤 イオパミロン/ })).toBeVisible();

    // 登録→指示→指示簿へ反映
    await rx.getByRole('button', { name: '登録' }).click();
    await expect(rx).not.toBeVisible();
    await placeOrders(page, s);
    await expect(page.getByText(/オーダを登録しました/)).toBeVisible();
    await page.getByRole('tab', { name: '指示簿' }).click();
    const row = page.getByRole('row', { name: /イオパミロン/ });
    await expect(row).toBeVisible();
    await expect(row).toContainText('臨時');
  });

  test('us-58 ECT: 手技/前処置/後処置の項目検索が実機の項目を表示する', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: 'ECT', exact: true }).click();
    const rx = page.getByRole('dialog').filter({ hasText: '通電時間' });
    await expect(rx).toBeVisible();
    const search = page.getByRole('dialog').filter({ hasText: '項目検索' });
    // 各区分ラベルの隣の[追加]で項目検索を開く。
    const openSearch = (label: string) =>
      rx.getByText(label, { exact: true }).locator('..').getByRole('button', { name: '追加' }).click();

    // 手技項目検索：実機の 3 項目
    await openSearch('手技');
    await expect(search).toBeVisible();
    await expect(search.getByText('精神科電気痙攣療法')).toBeVisible();
    await expect(search.getByText('電気痙攣療法薬剤追加')).toBeVisible();
    await expect(search.getByText('当日指示')).toBeVisible();
    await search.getByRole('button', { name: '閉じる' }).click();

    // 前処置項目検索：アトロピン等。かな「たすもりん」は前処置に無い（後処置）ので該当なし
    await openSearch('前処置');
    await expect(search.getByText('アトロピン硫酸塩注0.5mg')).toBeVisible();
    await search.getByRole('textbox', { name: 'ECT項目 かな検索' }).fill('たすもりん');
    await expect(search.getByText('該当する項目がありません')).toBeVisible();
    await search.getByRole('button', { name: '閉じる' }).click();

    // 後処置項目検索：タスモリン・当日昼薬（与薬）等
    await openSearch('後処置');
    await expect(search.getByText('タスモリン')).toBeVisible();
    await expect(search.getByText('当日昼薬（与薬）')).toBeVisible();
  });

  test('us-55 AC-5 作成中があると閉じるで破棄確認→破棄して閉じると指示簿に追加されない', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx = rxDialog(page);
    await addAkineton(page, rx);
    await rx.getByRole('button', { name: '登録' }).click();
    await expect(s.getByRole('button', { name: /削除.*アキネトン錠1mg/ })).toBeVisible();

    // 閉じる → 破棄確認（注意文）が出る
    await s.getByRole('button', { name: '閉じる', exact: true }).click();
    const confirm = page.getByRole('dialog').filter({ hasText: '破棄されます' });
    await expect(confirm).toBeVisible();
    // キャンセルで元の画面に戻る
    await confirm.getByRole('button', { name: 'キャンセル' }).click();
    await expect(s).toBeVisible();
    // もう一度閉じる → 破棄して閉じる
    await s.getByRole('button', { name: '閉じる', exact: true }).click();
    await page.getByRole('dialog').filter({ hasText: '破棄されます' })
      .getByRole('button', { name: '破棄して閉じる' }).click();
    await expect(s).not.toBeVisible();

    await page.getByRole('tab', { name: '指示簿' }).click();
    await expect(page.getByRole('cell', { name: 'アキネトン錠1mg', exact: true })).toHaveCount(0);
  });

  test('us-54 処方ダイアログは変更があると閉じるで破棄確認、無変更なら即閉じる', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx = rxDialog(page);
    await expect(rx).toBeVisible();

    // 無変更で閉じる → 確認なしで即閉じる
    await rx.getByRole('button', { name: '閉じる', exact: true }).click();
    await expect(rx).not.toBeVisible();

    // もう一度開いて薬剤を追加（＝変更あり）
    await s.getByRole('button', { name: '処方', exact: true }).click();
    const rx2 = rxDialog(page);
    await addAkineton(page, rx2);
    // 閉じる → 破棄確認
    await rx2.getByRole('button', { name: '閉じる', exact: true }).click();
    const confirm = page.getByRole('dialog').filter({ hasText: '破棄されます' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: '破棄して閉じる' }).click();
    await expect(rx2).not.toBeVisible();
  });

  test('us-55 セット一覧: 一般入院時検査を選ぶと検査＋画像（胸部/腹部）が作成中に一括展開される', async ({ page }) => {
    const s = await openSend(page);

    // セット一覧ボタン → ポップオーバ（Portal で body 直下・既定グループ=検査・オーダーセット）
    await s.getByRole('button', { name: 'セット一覧 ▼' }).click();
    await page.getByRole('button', { name: 'セット 一般入院時検査 を展開' }).click();

    // 3 件（検査 1＋画像 2）展開のスナックバー
    await expect(page.getByText(/セット「一般入院時検査」を展開しました（3件）/)).toBeVisible();

    // 作成中に検査と画像（胸部/腹部）が積まれる（見出しは種別名そのまま）
    await expect(s.getByText('［検査］')).toBeVisible();
    await expect(s.getByText('［画像］')).toHaveCount(2);
    await expect(s.getByText(/［一般撮影］-［胸部］/)).toBeVisible();
    await expect(s.getByText(/［一般撮影］-［腹部］/)).toBeVisible();

    // 指示 → 指示簿へ 3 件反映
    await placeOrders(page, s);
    await expect(page.getByText(/オーダを登録しました（3件）/)).toBeVisible();
  });

  test('us-55 セット一覧: グループを頓用処方に切替え、処方セットを作成中に展開できる', async ({ page }) => {
    const s = await openSend(page);
    await s.getByRole('button', { name: 'セット一覧 ▼' }).click();

    // グループ切替（プルダウン）→ 頓用処方
    await page.getByRole('combobox', { name: 'セット名グループ' }).click();
    await page.getByRole('option', { name: '頓用処方' }).click();

    // 不眠時セット → 処方オーダとして展開（2行表示）
    await page.getByRole('button', { name: 'セット 不眠時 を展開' }).click();
    await expect(page.getByText(/セット「不眠時」を展開しました/)).toBeVisible();
    await expect(s.getByText('［処方］')).toBeVisible();
    await expect(s.getByText(/ジアゼパム/)).toBeVisible();
  });

});
