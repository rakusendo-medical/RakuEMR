import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * 入院取消の運用ルール（管理者確認・2026-09-04 / issue #427）の E2E。
 *
 * - 入院取消は入院歴画面で行う（現在入院中・直近の入院歴のみ）
 * - 取り消した入院歴はデータとして残す（物理削除しない）
 * - 操作ミス（分類「入力誤り」）による取消は一覧に表示しない
 * - それ以外の理由による取消は一覧に「取消済」として表示する
 *
 * SPEC: docs/specs/ep-04-admission-history/us-10-admission-history.spec.md
 */

/** 入院歴タブを開く */
const openAdmissionHistory = async (page: Page) => {
  await page.goto('/admission');
  await page.getByRole('tab', { name: '入院歴' }).click();
  await expect(page.getByTestId('admission-history-record').first()).toBeVisible();
};

/** 直近（最後）の入院期間の、現形態（＝最後）のレコードを選択する（入院取消の対象） */
const selectLatestPeriodCurrentRecord = async (page: Page) => {
  await page.getByTestId('admission-history-period').last()
    .getByTestId('admission-history-record').last().click();
};

/** 患者セレクトで患者を切り替える */
const selectPatient = async (page: Page, patientId: string) => {
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: new RegExp(patientId) }).click();
};

/** 削除理由ダイアログで分類を選んで取り消す */
const cancelAdmission = async (page: Page, category: string) => {
  await page.getByRole('button', { name: '入院取消' }).click();
  const reasonDialog = page.getByRole('dialog').filter({ hasText: '削除理由' });
  await expect(reasonDialog).toBeVisible();
  await reasonDialog.getByRole('combobox').click();
  await page.getByRole('option', { name: category }).click();
  await page.getByRole('button', { name: '中止する' }).click();
};

test.describe('入院取消（管理者確認ルール）', () => {
  test('現在入院中の直近入院歴では入院取消ができる', async ({ page }) => {
    await openAdmissionHistory(page);
    await selectLatestPeriodCurrentRecord(page);
    await expect(page.getByRole('button', { name: '入院取消' })).toBeVisible();
  });

  test('形態変更歴のある患者でも、入院中なら現形態のレコードで入院取消ができる', async ({ page }) => {
    await openAdmissionHistory(page);
    // P003: 任意入院 → 医療保護入院 → 措置入院（現形態）の形態変更チェーン
    await selectPatient(page, 'P003');
    await expect(page.getByTestId('admission-history-record')).toHaveCount(3);

    // 形態変更で閉じられたレコードでは出さない（issue #486）
    await page.getByTestId('admission-history-record').first().click();
    await expect(page.getByRole('button', { name: '入院取消' })).toHaveCount(0);

    // 現形態（継続中）のレコードでは出す
    await selectLatestPeriodCurrentRecord(page);
    await expect(page.getByRole('button', { name: '入院取消' })).toBeVisible();
  });

  test('操作ミス（入力誤り）で取り消した入院歴は一覧に表示されない', async ({ page }) => {
    await openAdmissionHistory(page);
    const periodsBefore = await page.getByTestId('admission-history-period').count();

    await selectLatestPeriodCurrentRecord(page);
    await cancelAdmission(page, '入力誤り');

    // 一覧から当該期間が消える（データ自体は保持されるが表示しない）
    await expect(page.getByTestId('admission-history-period')).toHaveCount(periodsBefore - 1);
    await expect(page.getByText('入力誤りのため入院歴一覧には表示しません')).toBeVisible();
  });

  test('操作ミス以外の理由で取り消した入院歴は「取消済」として一覧に残る', async ({ page }) => {
    await openAdmissionHistory(page);
    const periodsBefore = await page.getByTestId('admission-history-period').count();

    await selectLatestPeriodCurrentRecord(page);
    await cancelAdmission(page, '患者意向による中止');

    await expect(page.getByTestId('admission-history-period')).toHaveCount(periodsBefore);
    await expect(page.getByTestId('admission-history-period').filter({ hasText: '取消済' })).toHaveCount(1);
  });

  test('取消済の入院歴は参照のみで、取消内容が表示される', async ({ page }) => {
    await openAdmissionHistory(page);
    await selectLatestPeriodCurrentRecord(page);
    await cancelAdmission(page, '患者意向による中止');

    const cancelledPeriod = page.getByTestId('admission-history-period').filter({ hasText: '取消済' });
    await cancelledPeriod.getByTestId('admission-history-record').first().click();

    // 操作ボタンは出さない
    await expect(page.getByRole('button', { name: '入院取消' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '登録' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '形態変更' })).toHaveCount(0);

    // 代わりに取消内容（取消日時・分類・理由）を表示する
    const note = page.getByTestId('admission-cancelled-note');
    await expect(note).toBeVisible();
    await expect(note).toContainText('この入院は取り消されています');
    await expect(note).toContainText('患者意向による中止');

    // 継続中ではないので「現在」系バッジは出さない
    await expect(page.getByText('現在の形態')).toHaveCount(0);
  });
});
