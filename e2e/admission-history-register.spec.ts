import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * 入院歴の [登録] ボタンの挙動（issue #489）。
 *
 * - 変更がなければ登録せず、入退院記録も作らない
 * - 入退院記録には「どのタブから押したか」ではなく「実際に変更した項目」を残す
 *
 * SPEC: docs/specs/ep-04-admission-history/us-10-admission-history.spec.md
 */

/** 入院歴タブを開き、P001（山田 太郎・任意入院）を選ぶ。記事の確認先カルテと患者をそろえるため明示的に選ぶ */
const openAdmissionHistory = async (page: Page) => {
  await page.goto('/admission');
  await page.getByRole('tab', { name: '入院歴' }).click();
  await expect(page.getByTestId('admission-history-record').first()).toBeVisible();
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: /P001/ }).click();
  await expect(page.getByRole('combobox').first()).toHaveText(/P001/);
};

const admitReasonField = (page: Page) => page.getByLabel(/入院決定の理由/);

/** 画面を作り直さずに P001 のカルテ（診療録）へ移る。入退院記録はセッション限定なので再読込しない */
const openKarteInApp = async (page: Page) => {
  await page.evaluate(() => {
    window.history.pushState({}, '', '/karte/P001');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.getByRole('tab', { name: '診療録' })).toHaveAttribute('aria-selected', 'true');
};

test.describe('入院歴の登録ボタン（issue #489）', () => {
  test('変更がないときは登録ボタンを押せず、入退院記録も作られない', async ({ page }) => {
    await openAdmissionHistory(page);
    // 何も編集していない状態では [登録] は無効
    await expect(page.getByRole('button', { name: '登録' })).toBeDisabled();

    const original = await admitReasonField(page).inputValue();

    // 何か入力すると有効になる
    await admitReasonField(page).fill('入院決定理由を編集');
    await expect(page.getByRole('button', { name: '登録' })).toBeEnabled();

    // 元に戻すと再び無効（差分が無くなるため）
    await admitReasonField(page).fill(original);
    await expect(page.getByRole('button', { name: '登録' })).toBeDisabled();

    // 入退院記録（入院歴更新）は 1 件も作られていない
    await openKarteInApp(page);
    await expect(page.getByText(/入院歴を更新/)).toHaveCount(0);
  });

  test('登録すると、変更した項目が通知と入退院記録に残る', async ({ page }) => {
    await openAdmissionHistory(page);
    await admitReasonField(page).fill('症状増悪のため入院を継続。');
    await page.getByRole('button', { name: '登録' }).click();

    // トーストに変更項目が出る
    await expect(page.getByText(/入院決定理由/).first()).toBeVisible();
    // 登録後は差分が無くなるので再び無効
    await expect(page.getByRole('button', { name: '登録' })).toBeDisabled();

    // カルテの入退院記録に「変更した項目」が残り、押したタブ名（入院時/退院時）は含まれない
    await openKarteInApp(page);
    const record = page.getByText(/入院歴を更新／ 形態: 任意入院／ 変更項目: 入院決定理由/);
    await expect(record).toHaveCount(1);
    await expect(page.getByText(/入院歴を更新（入院時）|入院歴を更新（退院時）/)).toHaveCount(0);
  });
});

test.describe('入院時／退院時タブごとの登録（issue #489 ③）', () => {
  const postDischargeField = (page: Page) => page.getByLabel(/退院後処置/);
  const openTab = (page: Page, name: '入院時' | '退院時') => page.getByRole('tab', { name, exact: true }).click();

  test('別のタブで変更しても、表示中のタブに変更がなければ登録ボタンは押せない', async ({ page }) => {
    await openAdmissionHistory(page);
    await admitReasonField(page).fill('入院時タブだけ変更');
    await expect(page.getByRole('button', { name: '登録' })).toBeEnabled();

    // 退院時タブでは何も変えていないので押せない
    await openTab(page, '退院時');
    await expect(page.getByRole('button', { name: '登録' })).toBeDisabled();

    // 退院時タブで変更すると押せる
    await postDischargeField(page).fill('外来通院を継続');
    await expect(page.getByRole('button', { name: '登録' })).toBeEnabled();

    // 入院時タブに戻ると、入院時タブの変更で押せる（入力は残っている）
    await openTab(page, '入院時');
    await expect(admitReasonField(page)).toHaveValue('入院時タブだけ変更');
    await expect(page.getByRole('button', { name: '登録' })).toBeEnabled();
  });

  test('登録すると表示中のタブの項目だけが保存され、もう一方のタブは保存されない', async ({ page }) => {
    await openAdmissionHistory(page);
    await admitReasonField(page).fill('入院時タブの未登録の入力');
    await openTab(page, '退院時');
    await postDischargeField(page).fill('外来通院を継続');

    // 退院時タブで登録 → 退院時タブの項目だけ保存される
    await page.getByRole('button', { name: '登録' }).click();
    await expect(page.getByText(/入院歴を登録しました（変更項目: 退院後処置）/)).toBeVisible();
    await expect(page.getByRole('button', { name: '登録' })).toBeDisabled();

    // 入院時タブは保存されていないので、まだ登録できる
    await openTab(page, '入院時');
    await expect(page.getByRole('button', { name: '登録' })).toBeEnabled();

    // 入院時タブで登録すると、入院決定理由だけが保存される
    await page.getByRole('button', { name: '登録' }).click();
    await expect(page.getByRole('button', { name: '登録' })).toBeDisabled();

    // 入退院記録はタブごとに 1 件ずつ、それぞれのタブの項目だけが残る
    await openKarteInApp(page);
    await expect(page.getByText(/変更項目: 退院後処置$/)).toHaveCount(1);
    await expect(page.getByText(/変更項目: 入院決定理由$/)).toHaveCount(1);
    await expect(page.getByText(/変更項目: 入院決定理由・|・退院後処置/)).toHaveCount(0);
  });

  test('退院時タブで登録したあと開き直すと、入院時タブの未登録の入力は保存前の値に戻る', async ({ page }) => {
    await openAdmissionHistory(page);
    const original = await admitReasonField(page).inputValue();
    await admitReasonField(page).fill('保存されないはずの入力');
    await openTab(page, '退院時');
    await postDischargeField(page).fill('外来通院を継続');
    await page.getByRole('button', { name: '登録' }).click();
    await expect(page.getByRole('button', { name: '登録' })).toBeDisabled();

    // 別の患者を選んでから P001 に戻る（入力欄を保存値から読み直す）
    await page.getByRole('combobox').first().click();
    await page.getByRole('option').filter({ hasNotText: 'P001' }).first().click();
    await expect(page.getByRole('combobox').first()).not.toHaveText(/P001/);
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /P001/ }).click();

    await openTab(page, '入院時');
    await expect(admitReasonField(page)).toHaveValue(original);
    await openTab(page, '退院時');
    await expect(postDischargeField(page)).toHaveValue('外来通院を継続');
  });
});
