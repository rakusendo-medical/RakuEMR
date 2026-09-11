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
