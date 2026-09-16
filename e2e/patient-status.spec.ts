import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * issue #399（2026-09-14 決定）: 患者のステータス（安定／観察中／不安定／重症）は診療録作成で入力する。
 *
 * - 診療録作成の「ステータス」は 4 色（病棟マップのステータスと同じ）で、今のステータスだけが光る
 * - ステータスを選んで保存すると診療録に残り、今のステータス（病棟マップ等）が変わる
 * - 選ばずに保存したときは今のステータスを変えない
 *
 * SPEC: docs/specs/ep-16-outpatient-emr-stage2/us-43-medical-record-tab.spec.md（AC-10〜AC-12）
 *       docs/specs/ep-01-bed-map/us-01-bed-display.spec.md（① ステータス）
 */

/** カルテのアクションバーから診療録作成ダイアログを開く */
const openNewRecord = async (page: Page) => {
  await page.getByRole('button', { name: '診療録作成', exact: true }).click();
  const dialog = page.getByRole('dialog').filter({ hasText: 'DO引用' });
  await expect(dialog).toBeVisible();
  return dialog;
};

const statusOption = (dialog: ReturnType<Page['getByRole']>, label: string) =>
  dialog.getByTestId('status-options').getByRole('button', { name: new RegExp(`^${label}`) });

test.describe('診療録作成でのステータス入力（issue #399）', () => {
  test('ステータスは 4 色で、今のステータスだけが光る', async ({ page }) => {
    // P004 高橋 美咲 の初期ステータスは「重症」
    await page.goto('/karte/P004');
    const dialog = await openNewRecord(page);

    const options = dialog.getByTestId('status-options').getByRole('button');
    await expect(options).toHaveCount(4);
    for (const label of ['安定', '観察中', '不安定', '重症']) {
      await expect(statusOption(dialog, label)).toBeVisible();
    }
    // 旧 5 段階（良好／注意／警戒／重要）は出ない
    for (const old of ['良好', '注意', '警戒', '重要']) {
      await expect(dialog.getByTestId('status-options').getByText(old, { exact: true })).toHaveCount(0);
    }

    // 今のステータス（重症）だけに「現在」の印と光る表示が付く
    await expect(dialog.getByTestId('status-current')).toHaveCount(1);
    await expect(statusOption(dialog, '重症')).toHaveAttribute('data-current', 'true');
    await expect(statusOption(dialog, '安定')).not.toHaveAttribute('data-current', 'true');
    // 開いた直後は今のステータス（重症）が選ばれていて、光る表現が付く（PM 指示 2026-09-15）
    await expect(dialog.getByTestId('status-options').getByRole('button', { pressed: true })).toHaveCount(1);
    await expect(statusOption(dialog, '重症')).toHaveAttribute('aria-pressed', 'true');
    await expect(statusOption(dialog, '重症')).toHaveAttribute('data-glow', 'true');
    // 別のステータスを選ぶと光る表現が消え、選択を外すと戻る（PM 指示 2026-09-16）
    await statusOption(dialog, '安定').click();
    await expect(statusOption(dialog, '重症')).not.toHaveAttribute('data-glow', 'true');
    await statusOption(dialog, '安定').click();
    await expect(statusOption(dialog, '重症')).toHaveAttribute('data-glow', 'true');
    // 初期選択のままなら未保存扱いにしない（キャンセルで破棄確認が出ずに閉じる）
    await dialog.getByRole('button', { name: 'キャンセル' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('ステータスを選んで保存すると診療録に残り、今のステータスと病棟マップが変わる', async ({ page }) => {
    // P001 山田 太郎（第２病棟 202号室）の初期ステータスは「安定」
    await page.goto('/karte/P001');
    let dialog = await openNewRecord(page);
    await expect(statusOption(dialog, '安定')).toHaveAttribute('data-current', 'true');

    await statusOption(dialog, '重症').click();
    await expect(statusOption(dialog, '重症')).toHaveAttribute('aria-pressed', 'true');
    // 今のステータス（安定）と違うものを選んでいる間は、光る表現を消す（PM 指示 2026-09-16）
    await expect(statusOption(dialog, '安定')).not.toHaveAttribute('data-glow', 'true');
    await expect(statusOption(dialog, '安定')).toHaveAttribute('data-current', 'true');
    await dialog.getByPlaceholder('フリーテキストで記載してください').fill('不穏が強く、終日観察を強化する。');
    await dialog.getByRole('button', { name: '保存' }).click();
    await expect(dialog).not.toBeVisible();

    // 診療録の一覧に本文とステータスが残る
    const record = page.getByTestId('medical-record-row').filter({ hasText: '不穏が強く、終日観察を強化する。' });
    await expect(record).toHaveCount(1);
    await expect(record.getByTestId('record-patient-status')).toHaveText('重症');

    // もう一度開くと、今のステータスは「重症」になっている
    dialog = await openNewRecord(page);
    await expect(statusOption(dialog, '重症')).toHaveAttribute('data-current', 'true');
    await expect(statusOption(dialog, '安定')).not.toHaveAttribute('data-current', 'true');
    await dialog.getByRole('button', { name: 'キャンセル' }).click();
    await expect(dialog).not.toBeVisible();

    // 画面を作り直さずに病棟マップへ移ると、山田 太郎 のステータスが「重症」になっている
    await page.getByRole('button', { name: '病棟マップ' }).click();
    await page.getByRole('tab', { name: /第２病棟/ }).click();
    await expect(page.getByTestId('ward-bed-P001').getByText('重症', { exact: true })).toBeVisible();
  });

  test('ステータスを変えずに保存したときは今のステータスのまま記事に残る', async ({ page }) => {
    await page.goto('/karte/P004');
    let dialog = await openNewRecord(page);
    await dialog.getByPlaceholder('フリーテキストで記載してください').fill('ステータスは変えずに記載。');
    await dialog.getByRole('button', { name: '保存' }).click();
    await expect(dialog).not.toBeVisible();

    const record = page.getByTestId('medical-record-row').filter({ hasText: 'ステータスは変えずに記載。' });
    await expect(record).toHaveCount(1);
    await expect(record.getByTestId('record-patient-status')).toHaveText('重症');

    dialog = await openNewRecord(page);
    await expect(statusOption(dialog, '重症')).toHaveAttribute('data-current', 'true');
  });

  test('選択を外して保存したときはラベルを付けず、今のステータスも変えない', async ({ page }) => {
    await page.goto('/karte/P004');
    let dialog = await openNewRecord(page);
    // 選ばれている「重症」をもう一度押して選択を外す
    await statusOption(dialog, '重症').click();
    await expect(dialog.getByTestId('status-options').getByRole('button', { pressed: true })).toHaveCount(0);
    await dialog.getByPlaceholder('フリーテキストで記載してください').fill('ステータスを外して記載。');
    await dialog.getByRole('button', { name: '保存' }).click();
    await expect(dialog).not.toBeVisible();

    const record = page.getByTestId('medical-record-row').filter({ hasText: 'ステータスを外して記載。' });
    await expect(record).toHaveCount(1);
    await expect(record.getByTestId('record-patient-status')).toHaveCount(0);

    dialog = await openNewRecord(page);
    await expect(statusOption(dialog, '重症')).toHaveAttribute('data-current', 'true');
    await expect(statusOption(dialog, '重症')).toHaveAttribute('aria-pressed', 'true');
  });
});
