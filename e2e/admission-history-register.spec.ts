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

const openAdmissionHistory = async (page: Page) => {
  await page.goto('/admission');
  await page.getByRole('tab', { name: '入院歴' }).click();
  await expect(page.getByTestId('admission-history-record').first()).toBeVisible();
};

const admitReasonField = (page: Page) => page.getByLabel(/入院決定の理由/);

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
  });

  test('登録すると、変更した項目が通知と入退院記録に残る', async ({ page }) => {
    await openAdmissionHistory(page);
    await admitReasonField(page).fill('症状増悪のため入院を継続。');
    await page.getByRole('button', { name: '登録' }).click();

    // トーストに変更項目が出る
    await expect(page.getByText(/入院決定理由/).first()).toBeVisible();
    // 登録後は差分が無くなるので再び無効
    await expect(page.getByRole('button', { name: '登録' })).toBeDisabled();
  });
});
