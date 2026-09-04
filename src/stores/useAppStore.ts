import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AdmissionHistory, IsolationConfirmSignKind, IsolationHistoryAudit, IsolationOrder,
  MedicalRecord, ObservationRecord, Order, OrderConfirmSign, OrderType, Patient,
  PrescriptionDraft, PrescriptionRpRow, ReliefCategory, WardId,
} from '../types';

/**
 * ep-11: 指示簿の臨時オーダを閲覧画面から編集した内容のオーバーレイ。
 * seed ORDERS / dynamicOrders を破壊せず、表示時に上書き適用する（モックのためセッション限定・非永続）。
 */
export interface OrderOverride {
  startDate?: string;
  remark?: string;
  content?: string;
  days?: number;
  schedule?: string;
  /** 処方系: 再編集用の構造化データ（次回オープン時の復元に使う）。 */
  rows?: PrescriptionRpRow[];
  dialogDays?: number;
}
import type { RehaForm } from '../data/rehaMaster';

/** 操作者ロール（ep-02 代行入力認証フローの分岐用） */
export type UserRole = 'doctor' | 'staff';

/** ep-03 オプション機能トグル */
export interface OptionalFeatures {
  /** 医療観察法（紹介経路に「医療観察入院処遇中の転院」を追加） */
  medicalProtection: boolean;
  // 地域連携（逆紹介）オプションは不要のため削除
  /** 外部精神科システム連携（入院指示に「精神科入院有無」項目を追加） */
  psychiatricLink: boolean;
  /** ep-05 隔離拘束変更（マスタ「隔離拘束変更=する」相当。継続/変更指示リンクの表示制御） */
  restraintChange: boolean;
  // ep-07 観察記録の未来日入力不可は設定によらず常時適用のため、トグルは持たない
  //   （spec: docs/specs/ep-07-observation/_epic.md「共通ルール: 未来日入力不可」）
}

/** 病床移動の予定（ep-01 us-02 用） */
export interface ScheduledMove {
  id: string;
  patientId: string;
  /** ISO 8601-like: YYYY-MM-DDTHH:mm */
  scheduledAt: string;
  fromWardId: WardId;
  fromRoom: string;
  fromBed: string;
  toWardId: WardId;
  toRoom: string;
  toBed: string;
}

/** ep-09 入院患者一覧の検索条件（セッション永続化対象） */
export interface PatientListSearchCondition {
  /** YYYY-MM-DD（基準日。空文字なら未指定） */
  baseDate: string;
  wardFilter: WardId | 'all';
  doctorFilter: string;
  staffIds: string[];
  staffMatchMode: 'all' | 'any';
  includeExaminer: boolean;
  query: string;
}

/** 「指示」段階で登録された入退院指示（ep-03 が登録、ep-02 カレンダーが参照） */
export interface PendingOrderEntry {
  id: string;
  type: '入院' | '退院';
  patientId: string;
  patientName: string;
  /** YYYY-MM-DD（未定なら空文字） */
  scheduledDate: string;
  doctorName: string;
  wardId: WardId;
  roomNumber: string;
  bedLabel: string;
  /** us-08/us-09: 指示時に作成したカルテ記事 ID（更新・確定・中止で同一記事を追記／取消する） */
  karteRecordId?: string;
}

/** ep-11 us-61: リハビリ（治療形態）指示の履歴 1 件。form に全項目を保持し履歴から復元する。 */
export interface RehaCompositionEntry {
  id: string;
  treatment: string;
  registeredAt: string;
  doctorName: string;
  form: RehaForm;
}

/** ep-11 us-60: IF オーダ登録簿の 1 件（頓用。待機→実施で実オーダ発行）。 */
export interface IfOrderEntry {
  id: string;
  /** IF 症状（症状条件）。 */
  symptom: string;
  /** コメント（自由入力）。 */
  comment: string;
  /** 構成したサブオーダ（処方/注射/検査/ECT/リハビリ/テキスト）。 */
  orders: Order[];
  /** 登録日（YYYY-MM-DD）。 */
  registeredAt: string;
  /** 指示医。 */
  doctorName: string;
  status: '待機' | '実施済';
  executedAt?: string;
  executedBy?: string;
}

interface AppState {
  // 選択中の病棟フィルタ
  wardFilter: WardId | 'all';
  setWardFilter: (ward: WardId | 'all') => void;

  // 選択中の患者
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;

  // 病棟マップで選択された病室
  selectedRooms: Set<string>;
  toggleRoom: (roomNumber: string) => void;
  clearSelectedRooms: () => void;

  // 病棟マップで操作メニュー対象として選択中の患者ID
  bedMenuPatientId: string | null;
  setBedMenuPatientId: (id: string | null) => void;

  // 病棟マップ表示順（カルテ画面の隣接ナビ用）
  wardMapPatientOrder: string[];
  navigationSource: 'ward-map' | 'other' | null;
  setWardMapNavigation: (order: string[]) => void;
  clearWardMapNavigation: () => void;

  // 入退院手続き：確定済の入院・退院指示 ID（永続化対象）
  confirmedAdmissionIds: string[];
  confirmAdmission: (id: string) => void;
  confirmDischarge: (id: string) => void;

  // 操作者ロール（医師 / 事務）（永続化対象）
  currentUserRole: UserRole;
  setUserRole: (role: UserRole) => void;

  // ep-03 オプション機能トグル（永続化対象）
  optionalFeatures: OptionalFeatures;
  toggleOptionalFeature: (key: keyof OptionalFeatures) => void;

  // ep-03: 「指示」段階で登録された入退院指示（永続化対象、確定で自動除去）
  pendingOrders: PendingOrderEntry[];
  addPendingOrder: (o: PendingOrderEntry) => void;
  // id は参照整合性維持のため更新不可（Omit で型レベルで禁止）
  updatePendingOrder: (id: string, patch: Partial<Omit<PendingOrderEntry, 'id'>>) => void;
  removePendingOrder: (id: string) => void;

  // ep-11 us-53: オーダ入力（新規オーダ作成）で追加されたオーダ。
  //   モックのためセッション限定・非永続化（partialize から除外・リロードで消える）。
  //   閲覧 UI（OrdersTab / OrderManagement）は seed の ORDERS と合成して表示する。
  dynamicOrders: Order[];
  addOrder: (o: Order) => void;

  // ep-11: 指示簿の臨時オーダ編集（オーダ id → オーバーレイ）。表示側で適用。非永続。
  orderOverrides: Record<string, OrderOverride>;
  setOrderOverride: (id: string, patch: OrderOverride) => void;

  // 患者情報の属性で設定した救護区分（担送/護送/独歩/未入力）の上書き。
  //   患者情報タブで保存 → 病棟マップのバッジに反映（seed の Patient.reliefCategory を上書き）。
  //   モックのためセッション限定・非永続（リロードで seed 値に戻る）。
  patientReliefCategories: Record<string, ReliefCategory>;
  setReliefCategory: (patientId: string, category: ReliefCategory) => void;

  // ep-11 us-54: 「前回どおり（DO）」。処方種別（入院定時／処方）ごとに直近作成した処方内容を記憶し、
  //   次に同じ種別ボタンで処方ダイアログを開いたとき初期値としてセットする。セッション限定・非永続化。
  lastPrescriptionByType: Partial<Record<OrderType, PrescriptionDraft>>;
  setLastPrescription: (type: OrderType, draft: PrescriptionDraft) => void;

  // ep-11 us-57: 検査の「前回どおり」。種別ごとに直近チェックした検査項目コードを記憶。非永続化。
  lastTestByType: Partial<Record<OrderType, number[]>>;
  setLastTest: (type: OrderType, itemCodes: number[]) => void;

  // ep-10 us-27: フローシート予定オーダの「実施」。オーダ id → 実施日時・実施者。
  //   seed ORDERS / dynamicOrders を破壊せず実施済を記録（モックのためセッション限定・非永続）。
  orderExecutions: Record<string, { executedAt: string; executedBy: string }>;
  executeOrder: (orderId: string, executedBy: string, executedAt?: string) => void;

  // ep-11: オーダ指示時に発行するカルテNo（オーダ id → 「NO.xxx」）。連番は nextKarteNo。非永続。
  orderKarteNos: Record<string, string>;
  nextKarteNo: number;
  assignKarteNos: (map: Record<string, string>, next: number) => void;

  // ep-11: オーダ発行時にカルテ記事作成で入力した所見（オーダ id → 所見）。
  // 実施ダイアログ（定期処方実施等）の「医師より」欄に表示する医師コメント。非永続。
  orderShoken: Record<string, string>;
  setOrderShoken: (map: Record<string, string>) => void;

  // ep-11 us-60: IF オーダの指示歴（患者 id → 過去に指示した IF 構成）。DO で内容（医薬品含む）を復元。非永続。
  ifCompositions: Record<string, { symptom: string; comment: string; orders: Order[] }[]>;
  addIfComposition: (patientId: string, comp: { symptom: string; comment: string; orders: Order[] }) => void;

  // ep-11 us-60: IF オーダ登録簿（患者 id → 待機中/実施済の IF オーダ）。
  //   IF は「症状発生時に必要になったら実施する」頓用オーダのため、指示＝登録のみ（即オーダ化しない）。
  //   カルテ「IFオーダ」タブで [実施] すると、構成サブオーダを実オーダとして発行し即時実施する。非永続。
  ifOrders: Record<string, IfOrderEntry[]>;
  addIfOrder: (patientId: string, entry: IfOrderEntry) => void;
  executeIfOrder: (patientId: string, id: string, executedBy: string, executedAt: string) => void;

  // ep-11 us-61: リハビリ（治療形態）指示の履歴（患者 id → 過去の指示）。左の履歴一覧から内容を復元。非永続。
  rehaCompositions: Record<string, RehaCompositionEntry[]>;
  addRehaComposition: (patientId: string, entry: RehaCompositionEntry) => void;

  // ep-01 us-02: 病床移動の予定（モックのためセッション限定・非永続化。partialize から除外・リロードで復帰）
  scheduledMoves: ScheduledMove[];
  addScheduledMove: (m: ScheduledMove) => void;
  removeScheduledMove: (id: string) => void;
  // us-02 要件4: 移動履歴の「取消」。削除の代わりに取消 ID を保持し、履歴は取消状態で残す
  //   （モックのためセッション限定・非永続化）。移動元病室への戻し等の振る舞いは要件5/6 で対応。
  cancelledMoveIds: string[];
  cancelMove: (id: string) => void;
  // us-02: 移動履歴の「更新」。移動先（病棟／病室）・移動日時の変更差分を id 単位で保持
  //   （seed／登録分の両方に適用。モックのためセッション限定・非永続化）。
  //   ベッドは布団運用で廃止のため保持しない（表示は病棟・病室のみ）。
  moveEdits: Record<string, { toWardId: WardId; toRoom: string; scheduledAt: string }>;
  updateMove: (id: string, patch: { toWardId: WardId; toRoom: string; scheduledAt: string }) => void;

  // ep-02/ep-03: カルテ記事への動的書込（永続化対象）
  // patientId をキーに、確定時に追記された MedicalRecord 配列を保持。
  // 新カルテ画面（KartePage）では PATIENTS 由来の静的 records と、ここの動的 records をマージして表示する。
  dynamicMedicalRecords: Record<string, MedicalRecord[]>;
  appendMedicalRecord: (patientId: string, record: MedicalRecord) => void;
  // us-08/us-09: 指示→更新→確定はカルテ記事を 1 記事に集約するため、既存記事への本文追記を提供する。
  appendMedicalRecordContent: (patientId: string, recordId: string, text: string) => void;
  // us-08/us-09: 指示中止時は記事を削除せず取消表示にする。
  cancelMedicalRecord: (patientId: string, recordId: string) => void;

  // ep-04: 入退院歴の動的編集（永続化対象）
  // ADMISSION_HISTORY（マスタ）に対する差分のみ保持。AdmissionHistoryView 側で計算合成する。
  admissionHistoryEdits: Record<string, Partial<AdmissionHistory>>;
  addedAdmissionHistory: AdmissionHistory[];
  removedAdmissionHistoryIds: string[];
  editAdmissionHistory: (id: string, edit: Partial<AdmissionHistory>) => void;
  addAdmissionHistory: (record: AdmissionHistory) => void;
  removeAdmissionHistory: (id: string) => void;
  /**
   * ep-04 us-10: 入院取消（管理者確認 2026-09-04）。入院期間ごと物理削除するのではなく、
   * 取消日時・削除理由分類・理由を期間 ID に紐付けて保持する（レコードは残す）。
   * 分類が「入力誤り」（操作ミス）の取消だけは入院歴一覧に表示しない（AdmissionHistoryView 側で判定）。
   */
  admissionCancellations: Record<string, { cancelledAt: string; category: string; reason: string }>;
  cancelAdmissionPeriod: (periodId: string, info: { cancelledAt: string; category: string; reason: string }) => void;

  // 退院確定（退院後診療区分=通院）による外来化。モックのためセッション限定（非永続化・リロードで戻る）。
  //   ① 対象患者の実効 admissionState を 'outpatient' に上書き（カルテ表示・患者一覧で参照）
  //   ② 入院歴の当該入院（進行中レコード）の退院区分を「退院後通院」に反映
  outpatientDischarges: Record<string, { dischargeDate: string }>;
  setOutpatientDischarge: (patientId: string, dischargeDate: string) => void;

  // ===== ep-05 隔離拘束指示 =====
  // 動的に追加・更新された隔離拘束指示（永続化対象）。
  // 既存の ISOLATION_ORDERS（マスタサンプル）と合成して表示する想定。
  dynamicIsolationOrders: IsolationOrder[];
  addIsolationOrder: (order: IsolationOrder) => void;
  updateIsolationOrder: (id: string, patch: Partial<IsolationOrder>) => void;
  releaseIsolationOrder: (id: string, endDatetime: string) => void;

  // ===== ep-06 隔離拘束一覧 =====
  // 指示受けサインの登録／更新／削除。
  // マスタの ISOLATION_ORDERS にある指示の場合、初回操作時に dynamicIsolationOrders へコピーしてから差分を適用する。
  upsertConfirmSign: (orderId: string, kind: IsolationConfirmSignKind, sign: OrderConfirmSign) => void;
  removeConfirmSign: (orderId: string, kind: IsolationConfirmSignKind) => void;

  // ===== ep-07 観察記録 =====
  // 動的観察記録（個別／一括どちらの入力経路でも同じ配列に保存、永続化対象）
  dynamicObservationRecords: ObservationRecord[];
  addObservationRecord: (record: ObservationRecord) => void;
  addObservationRecordsBulk: (records: ObservationRecord[]) => void;
  updateObservationRecord: (id: string, patch: Partial<ObservationRecord>) => void;
  removeObservationRecord: (id: string) => void;

  // ===== ep-08 隔離拘束歴 =====
  // 削除監査ログ（永続化対象）
  isolationHistoryAudits: IsolationHistoryAudit[];
  // 削除順序チェックは呼び出し側（IsolationHistoryView）で実施し、確定済みの削除のみ通知する。
  // store はバリデーション責務を持たず、dynamicIsolationOrders から filter + audit append のみ実行する。
  deleteIsolationOrderWithAudit: (
    orderId: string,
    reason: { category: string; text?: string },
    deletedBy: string,
  ) => void;

  // ===== ep-09 患者情報 Phase 2 =====
  // 診察終了状態（永続化対象）。patientId → 終了情報のマップ。
  // 値が undefined または存在しないキー = 未終了。トグル時に終了 / 解除を切替。
  consultationFinishedMap: Record<string, { staffId: string; staffName: string; finishedAt: string }>;
  toggleConsultationFinished: (
    patientId: string,
    staff: { staffId: string; staffName: string },
  ) => void;

  // 入院患者一覧の検索条件（永続化対象、ログアウトまで保持）
  patientListSearchCondition: PatientListSearchCondition;
  setPatientListSearchCondition: (patch: Partial<PatientListSearchCondition>) => void;

  // サイドバー
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // スナックバー通知
  snackbar: { open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' };
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
  hideSnackbar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      wardFilter: 'all',
      setWardFilter: (ward) => set({ wardFilter: ward }),

      selectedPatient: null,
      setSelectedPatient: (patient) => set({ selectedPatient: patient }),

      selectedRooms: new Set(),
      toggleRoom: (roomNumber) =>
        set((state) => {
          const next = new Set(state.selectedRooms);
          if (next.has(roomNumber)) {
            next.delete(roomNumber);
          } else {
            next.add(roomNumber);
          }
          return { selectedRooms: next };
        }),
      clearSelectedRooms: () => set({ selectedRooms: new Set() }),

      bedMenuPatientId: null,
      setBedMenuPatientId: (id) => set({ bedMenuPatientId: id }),

      wardMapPatientOrder: [],
      navigationSource: null,
      setWardMapNavigation: (order) => set({ wardMapPatientOrder: order, navigationSource: 'ward-map' }),
      clearWardMapNavigation: () => set({ wardMapPatientOrder: [], navigationSource: null }),

      confirmedAdmissionIds: [],
      // 入院／退院確定時に呼び出す。pendingOrders から該当 ID を自動除去する。
      confirmAdmission: (id) =>
        set((state) => ({
          confirmedAdmissionIds: state.confirmedAdmissionIds.includes(id)
            ? state.confirmedAdmissionIds
            : [...state.confirmedAdmissionIds, id],
          pendingOrders: state.pendingOrders.filter((p) => p.id !== id),
        })),
      confirmDischarge: (id) =>
        set((state) => ({
          confirmedAdmissionIds: state.confirmedAdmissionIds.includes(id)
            ? state.confirmedAdmissionIds
            : [...state.confirmedAdmissionIds, id],
          pendingOrders: state.pendingOrders.filter((p) => p.id !== id),
        })),

      currentUserRole: 'staff',
      setUserRole: (role) => set({ currentUserRole: role }),

      optionalFeatures: {
        medicalProtection: false,
        psychiatricLink: false,
        restraintChange: false,
      },
      toggleOptionalFeature: (key) =>
        set((state) => ({
          optionalFeatures: { ...state.optionalFeatures, [key]: !state.optionalFeatures[key] },
        })),

      pendingOrders: [],
      addPendingOrder: (o) => set((state) => ({ pendingOrders: [...state.pendingOrders, o] })),
      updatePendingOrder: (id, patch) =>
        set((state) => ({
          pendingOrders: state.pendingOrders.map((x) => (x.id === id ? { ...x, ...patch, id: x.id } : x)),
        })),
      removePendingOrder: (id) => set((state) => ({ pendingOrders: state.pendingOrders.filter((x) => x.id !== id) })),

      // ep-11 us-53: オーダ入力（非永続・partialize から除外）
      dynamicOrders: [],
      addOrder: (o) => set((state) => ({ dynamicOrders: [...state.dynamicOrders, o] })),

      // ep-11: 指示簿の臨時オーダ編集オーバーレイ（非永続）
      orderOverrides: {},
      setOrderOverride: (id, patch) =>
        set((state) => ({ orderOverrides: { ...state.orderOverrides, [id]: { ...state.orderOverrides[id], ...patch } } })),

      patientReliefCategories: {},
      setReliefCategory: (patientId, category) =>
        set((state) => ({ patientReliefCategories: { ...state.patientReliefCategories, [patientId]: category } })),

      // ep-11 us-54: 前回どおり（DO）用の処方内容記憶（非永続）
      lastPrescriptionByType: {},
      setLastPrescription: (type, draft) =>
        set((state) => ({ lastPrescriptionByType: { ...state.lastPrescriptionByType, [type]: draft } })),

      // ep-11 us-57: 検査の前回どおり（非永続）
      lastTestByType: {},
      setLastTest: (type, itemCodes) =>
        set((state) => ({ lastTestByType: { ...state.lastTestByType, [type]: itemCodes } })),

      // ep-10 us-27: 予定オーダの実施（非永続）
      orderExecutions: {},
      executeOrder: (orderId, executedBy, executedAt) =>
        set((state) => ({
          orderExecutions: {
            ...state.orderExecutions,
            [orderId]: { executedAt: executedAt ?? new Date().toISOString(), executedBy },
          },
        })),

      // ep-11: オーダ指示時のカルテNo 発行（非永続。基準 865 から連番）
      orderKarteNos: {},
      nextKarteNo: 865,
      assignKarteNos: (map, next) =>
        set((state) => ({ orderKarteNos: { ...state.orderKarteNos, ...map }, nextKarteNo: next })),

      // ep-11: オーダ発行時の所見（医師コメント）。実施ダイアログの「医師より」に表示（非永続）
      orderShoken: {},
      setOrderShoken: (map) =>
        set((state) => ({ orderShoken: { ...state.orderShoken, ...map } })),

      // ep-11 us-60: IF オーダ指示歴（非永続）
      ifCompositions: {},
      addIfComposition: (patientId, comp) =>
        set((state) => ({
          ifCompositions: {
            ...state.ifCompositions,
            [patientId]: [comp, ...(state.ifCompositions[patientId] ?? [])],
          },
        })),

      // ep-11 us-60: IF オーダ登録簿（非永続）。addIfOrder=登録（先頭追加）、executeIfOrder=実施済に更新。
      ifOrders: {},
      addIfOrder: (patientId, entry) =>
        set((state) => ({
          ifOrders: {
            ...state.ifOrders,
            [patientId]: [entry, ...(state.ifOrders[patientId] ?? [])],
          },
        })),
      executeIfOrder: (patientId, id, executedBy, executedAt) =>
        set((state) => ({
          ifOrders: {
            ...state.ifOrders,
            [patientId]: (state.ifOrders[patientId] ?? []).map((e) =>
              e.id === id ? { ...e, status: '実施済', executedBy, executedAt } : e,
            ),
          },
        })),

      // ep-11 us-61: リハビリ（治療形態）指示履歴（非永続）。先頭追加。
      rehaCompositions: {},
      addRehaComposition: (patientId, entry) =>
        set((state) => ({
          rehaCompositions: {
            ...state.rehaCompositions,
            [patientId]: [entry, ...(state.rehaCompositions[patientId] ?? [])],
          },
        })),

      scheduledMoves: [],
      addScheduledMove: (m) => set((state) => ({ scheduledMoves: [...state.scheduledMoves, m] })),
      removeScheduledMove: (id) => set((state) => ({ scheduledMoves: state.scheduledMoves.filter((x) => x.id !== id) })),
      cancelledMoveIds: [],
      cancelMove: (id) => set((state) => (
        state.cancelledMoveIds.includes(id) ? state : { cancelledMoveIds: [...state.cancelledMoveIds, id] }
      )),
      moveEdits: {},
      updateMove: (id, patch) => set((state) => ({ moveEdits: { ...state.moveEdits, [id]: patch } })),

      dynamicMedicalRecords: {},
      // カルテ記事追加: 入退院確定や指示登録時に呼び出される。新カルテ画面（KartePage）が表示時にマージする。
      appendMedicalRecord: (patientId, record) =>
        set((state) => ({
          dynamicMedicalRecords: {
            ...state.dynamicMedicalRecords,
            [patientId]: [...(state.dynamicMedicalRecords[patientId] ?? []), record],
          },
        })),
      appendMedicalRecordContent: (patientId, recordId, text) =>
        set((state) => ({
          dynamicMedicalRecords: {
            ...state.dynamicMedicalRecords,
            [patientId]: (state.dynamicMedicalRecords[patientId] ?? []).map((r) =>
              r.id === recordId ? { ...r, content: `${r.content}\n${text}` } : r,
            ),
          },
        })),
      cancelMedicalRecord: (patientId, recordId) =>
        set((state) => ({
          dynamicMedicalRecords: {
            ...state.dynamicMedicalRecords,
            [patientId]: (state.dynamicMedicalRecords[patientId] ?? []).map((r) =>
              r.id === recordId ? { ...r, cancelled: true } : r,
            ),
          },
        })),

      admissionHistoryEdits: {},
      addedAdmissionHistory: [],
      removedAdmissionHistoryIds: [],
      editAdmissionHistory: (id, edit) =>
        set((state) => ({
          admissionHistoryEdits: {
            ...state.admissionHistoryEdits,
            [id]: { ...state.admissionHistoryEdits[id], ...edit },
          },
        })),
      addAdmissionHistory: (record) =>
        set((state) => ({ addedAdmissionHistory: [...state.addedAdmissionHistory, record] })),
      outpatientDischarges: {},
      setOutpatientDischarge: (patientId, dischargeDate) =>
        set((state) => ({
          outpatientDischarges: { ...state.outpatientDischarges, [patientId]: { dischargeDate } },
        })),
      removeAdmissionHistory: (id) =>
        set((state) => ({
          removedAdmissionHistoryIds: state.removedAdmissionHistoryIds.includes(id)
            ? state.removedAdmissionHistoryIds
            : [...state.removedAdmissionHistoryIds, id],
        })),
      admissionCancellations: {},
      cancelAdmissionPeriod: (periodId, info) =>
        set((state) => ({
          admissionCancellations: { ...state.admissionCancellations, [periodId]: info },
        })),

      // ===== ep-05 隔離拘束指示 =====
      dynamicIsolationOrders: [],
      addIsolationOrder: (order) =>
        set((state) => ({ dynamicIsolationOrders: [...state.dynamicIsolationOrders, order] })),
      updateIsolationOrder: (id, patch) =>
        set((state) => ({
          dynamicIsolationOrders: state.dynamicIsolationOrders.map((o) =>
            o.id === id ? { ...o, ...patch } : o,
          ),
        })),
      releaseIsolationOrder: (id, endDatetime) =>
        set((state) => ({
          dynamicIsolationOrders: state.dynamicIsolationOrders.map((o) =>
            o.id === id ? { ...o, endDatetime, operation: '解除' } : o,
          ),
        })),

      // ===== ep-06 隔離拘束一覧 =====
      // 指示受けサインの upsert / remove。
      // 対象が dynamic に居なければ ISOLATION_ORDERS（マスタ）からコピーして dynamic に積み、以降は dynamic 側で差分管理する。
      // ※ ISOLATION_ORDERS の参照は store ファイルからの直 import を避けるため、引数で `mergedSource` を受け取る案も検討したが、
      //    実体取得のため必要な最小コピー（id/patientId/...）を呼び出し側が patch 経由で渡す形に揃える。
      //    実装上は updateIsolationOrder 経由で「dynamic に存在しない場合は新規追加」のフォールバックを内包する戦略を採用。
      upsertConfirmSign: (orderId, kind, sign) =>
        set((state) => {
          const existing = state.dynamicIsolationOrders.find((o) => o.id === orderId);
          if (existing) {
            return {
              dynamicIsolationOrders: state.dynamicIsolationOrders.map((o) =>
                o.id === orderId
                  ? { ...o, confirmSigns: { ...(o.confirmSigns ?? {}), [kind]: sign } }
                  : o,
              ),
            };
          }
          // dynamic に居ない（マスタサンプル）→ プレースホルダで copy。
          // 呼び出し側はこの戻り値ですぐに参照 / 表示する場合は、マスタとマージして表示する想定なので、
          // ここでは confirmSigns のみ持つスケルトン記録を作って積む。一覧側は merge ロジックで「dynamic に同 id があればその confirmSigns を優先」する。
          const skeleton: IsolationOrder = {
            id: orderId,
            patientId: '',
            patientName: '',
            type: '隔離',
            startDatetime: '',
            wardId: 'ward1',
            roomNumber: '',
            doctorName: '',
            confirmSigns: { [kind]: sign },
          };
          return {
            dynamicIsolationOrders: [...state.dynamicIsolationOrders, skeleton],
          };
        }),
      removeConfirmSign: (orderId, kind) =>
        set((state) => ({
          dynamicIsolationOrders: state.dynamicIsolationOrders.map((o) => {
            if (o.id !== orderId) return o;
            const next = { ...(o.confirmSigns ?? {}) };
            delete next[kind];
            return { ...o, confirmSigns: next };
          }),
        })),

      // ===== ep-07 観察記録 =====
      dynamicObservationRecords: [],
      addObservationRecord: (record) =>
        set((state) => ({
          dynamicObservationRecords: [...state.dynamicObservationRecords, record],
        })),
      addObservationRecordsBulk: (records) =>
        set((state) => ({
          dynamicObservationRecords: [...state.dynamicObservationRecords, ...records],
        })),
      updateObservationRecord: (id, patch) =>
        set((state) => ({
          dynamicObservationRecords: state.dynamicObservationRecords.map((r) =>
            r.id === id ? { ...r, ...patch } : r,
          ),
        })),
      removeObservationRecord: (id) =>
        set((state) => ({
          dynamicObservationRecords: state.dynamicObservationRecords.filter((r) => r.id !== id),
        })),

      // ===== ep-08 隔離拘束歴 =====
      isolationHistoryAudits: [],
      // 削除順序チェックは呼び出し側で実施前提。ここでは指示削除＋監査ログ追加のみ。
      // マスタの ISOLATION_ORDERS 由来の指示は dynamicIsolationOrders に存在しなくても
      // 削除済とみなすため、audit にスナップショットを残しておく。
      deleteIsolationOrderWithAudit: (orderId, reason, deletedBy) =>
        set((state) => {
          const target = state.dynamicIsolationOrders.find((o) => o.id === orderId);
          const audit: IsolationHistoryAudit = {
            id: `AUDIT-${Date.now()}`,
            orderId,
            deletedAt: new Date().toISOString(),
            deletedBy,
            reasonCategory: reason.category,
            reasonText: reason.text,
            snapshot: {
              subtype: target?.subtype,
              operation: target?.operation,
              startDatetime: target?.startDatetime ?? '',
              endDatetime: target?.endDatetime,
            },
          };
          return {
            dynamicIsolationOrders: state.dynamicIsolationOrders.filter((o) => o.id !== orderId),
            isolationHistoryAudits: [...state.isolationHistoryAudits, audit],
          };
        }),

      // ===== ep-09 患者情報 Phase 2 =====
      consultationFinishedMap: {},
      toggleConsultationFinished: (patientId, staff) =>
        set((state) => {
          const next = { ...state.consultationFinishedMap };
          if (next[patientId]) {
            delete next[patientId];
          } else {
            next[patientId] = {
              staffId: staff.staffId,
              staffName: staff.staffName,
              finishedAt: new Date().toISOString(),
            };
          }
          return { consultationFinishedMap: next };
        }),

      patientListSearchCondition: {
        baseDate: '',
        wardFilter: 'all',
        doctorFilter: 'all',
        staffIds: [],
        staffMatchMode: 'all',
        includeExaminer: false,
        query: '',
      },
      setPatientListSearchCondition: (patch) =>
        set((state) => ({
          patientListSearchCondition: { ...state.patientListSearchCondition, ...patch },
        })),

      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      snackbar: { open: false, message: '', severity: 'info' },
      showSnackbar: (message, severity = 'info') =>
        set({ snackbar: { open: true, message, severity } }),
      hideSnackbar: () =>
        set((state) => ({ snackbar: { ...state.snackbar, open: false } })),
    }),
    {
      name: 'rakuemr-app-store',
      storage: createJSONStorage(() => localStorage),
      // セッション UI（選択状態・スナックバーなど）は永続化しない。
      // 病床移動（scheduledMoves / cancelledMoveIds / moveEdits）はモックのためセッション限定＝リロードで元に戻す。
      // 診療録の動的記事（dynamicMedicalRecords）＝オーダ指示時のカルテ記事等もモックのためセッション限定
      //   （オーダ本体 dynamicOrders がセッション限定なのに記事だけ残る不整合を解消。リロードで消える）。
      // 永続化対象: pendingOrders / confirmedAdmissionIds / currentUserRole / optionalFeatures ほか
      partialize: (state) => ({
        pendingOrders: state.pendingOrders,
        confirmedAdmissionIds: state.confirmedAdmissionIds,
        currentUserRole: state.currentUserRole,
        optionalFeatures: state.optionalFeatures,
        admissionHistoryEdits: state.admissionHistoryEdits,
        addedAdmissionHistory: state.addedAdmissionHistory,
        removedAdmissionHistoryIds: state.removedAdmissionHistoryIds,
        admissionCancellations: state.admissionCancellations,
        dynamicIsolationOrders: state.dynamicIsolationOrders,
        dynamicObservationRecords: state.dynamicObservationRecords,
        isolationHistoryAudits: state.isolationHistoryAudits,
        consultationFinishedMap: state.consultationFinishedMap,
        patientListSearchCondition: state.patientListSearchCondition,
      }),
      version: 4,
      // v2: scheduledMoves を永続化対象から除外（移動はセッション限定）。既存 localStorage から掃除する。
      // v3: ep-07 観察記録の未来日入力不可を常時適用に固定（optionalFeatures.observationFutureBlock を掃除）。
      //     あわせて dynamicMedicalRecords を永続化対象から除外（オーダ記事はセッション限定・既存永続分も掃除）。
      // v4: ep-04 入院取消を論理削除（admissionCancellations）に変更。取消情報を伴わない
      //     status:'キャンセル' の編集差分が残っていると入院取消ボタンが出ないため掃除する。
      migrate: (persisted: unknown, version: number) => {
        if (persisted && typeof persisted === 'object') {
          const p = persisted as Record<string, unknown>;
          if (version < 2) delete p.scheduledMoves;
          if (version < 3 && p.optionalFeatures && typeof p.optionalFeatures === 'object') {
            delete (p.optionalFeatures as Record<string, unknown>).observationFutureBlock;
          }
          if (version < 3) delete p.dynamicMedicalRecords;
          if (version < 4 && p.admissionHistoryEdits && typeof p.admissionHistoryEdits === 'object') {
            const edits = p.admissionHistoryEdits as Record<string, Record<string, unknown>>;
            for (const [id, edit] of Object.entries(edits)) {
              if (edit && edit.status === 'キャンセル') {
                const { status: _dropped, ...rest } = edit;
                if (Object.keys(rest).length === 0) delete edits[id];
                else edits[id] = rest;
              }
            }
          }
        }
        return persisted as AppState;
      },
    },
  ),
);
