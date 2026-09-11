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

  test('形態変更している入院では、どのレコードでも入院取消を出さない', async ({ page }) => {
    await openAdmissionHistory(page);
    // P003: 任意入院 → 医療保護入院 → 措置入院（現形態）の形態変更チェーン
    await selectPatient(page, 'P003');
    const records = page.getByTestId('admission-history-record');
    await expect(records).toHaveCount(3);

    // 入院取消は「最初の形態レコードが現在」のときだけ。形態変更していればどれを選んでも出さない
    for (let i = 0; i < 3; i++) {
      await records.nth(i).click();
      await expect(page.getByRole('button', { name: '入院取消' })).toHaveCount(0);
    }
  });

  test('変更取消で最初の形態まで戻すと、入院取消が出る', async ({ page }) => {
    await openAdmissionHistory(page);
    await selectPatient(page, 'P003');
    const records = page.getByTestId('admission-history-record');

    // 現在の形態変更を 2 回取り消して、最初の形態（任意入院）を現在に戻す
    for (const expected of [2, 1]) {
      await selectLatestPeriodCurrentRecord(page);
      await page.getByRole('button', { name: '変更取消' }).click();
      const reasonDialog = page.getByRole('dialog').filter({ hasText: '削除理由' });
      await reasonDialog.getByRole('combobox').click();
      await page.getByRole('option', { name: '入力誤り' }).click();
      await page.getByRole('button', { name: '中止する' }).click();
      await expect(records).toHaveCount(expected);
    }

    // 最初の形態が現在になったので入院取消が出る
    await records.first().click();
    await expect(page.getByRole('button', { name: '入院取消' })).toBeVisible();
  });

  test('変更取消は現在の形態変更レコードにだけ出し、古い形態変更レコードには出さない', async ({ page }) => {
    await openAdmissionHistory(page);
    await selectPatient(page, 'P003');
    const records = page.getByTestId('admission-history-record');

    // 医療保護入院（形態変更で閉じた古い形態変更レコード）
    await records.nth(1).click();
    await expect(page.getByRole('button', { name: '変更取消' })).toHaveCount(0);

    // 措置入院（現在の形態変更レコード）
    await records.nth(2).click();
    await expect(page.getByRole('button', { name: '変更取消' })).toBeVisible();
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

  test('旧実装で消えた入院歴が保存データに残っていても、読み込み時に入院歴が元に戻る', async ({ page }) => {
    // 旧実装（物理削除）で P001 の直近入院を取り消した状態の保存データ（永続化バージョン 4）
    await page.addInitScript(() => {
      window.localStorage.setItem('rakuemr-app-store', JSON.stringify({
        state: {
          removedAdmissionHistoryIds: ['AH002-P001-current'],
          admissionHistoryEdits: { 'AH002-P001-current': { status: 'キャンセル' } },
          addedAdmissionHistory: [],
          admissionCancellations: {},
        },
        version: 4,
      }));
    });
    await openAdmissionHistory(page);
    await selectPatient(page, 'P001');
    // 入院歴の差分は破棄され、P001 の直近入院（入院中）が一覧に戻る
    await expect(page.getByTestId('admission-history-period')).toHaveCount(2);
    await selectLatestPeriodCurrentRecord(page);
    await expect(page.getByRole('button', { name: '入院取消' })).toBeVisible();
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
