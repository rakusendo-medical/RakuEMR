// 病棟マップの病室／床数／性別分離テコ入れ用ワンショット生成スクリプト。
// 既存 mockData.ts の ROOMS / PATIENTS を読み込み、新レイアウトへ再配置して書き戻す。
//   - 第１病棟: 女性のみ。100=2床(2番使用不可),101/102/103/105/106=各7床,107/108=各4床（4欠番採番）
//   - 第２病棟: 男性のみ。ただし 201 のみ女性室。201=5床, 202/203/205/206/210-213=各6床, 208/215/216=各4床
//   - 在院 95 名（既存78=39F/39M を性別で振り分け + 新規17）
//   - 患者の内部ID(P0xx)は保持。表示用 patientNumber(8桁: '000'+10001..) を新設
//   - ISOLATION_ORDERS の wardId/roomNumber を患者の新配置へ追従
//   - MASTER_BEHAVIOR_RESTRICT_WARDS を ward1+ward2 に拡張
//   - ADMISSION_ORDERS / currentPatient の削除済み部屋参照を補正
// 実行: node scripts/regen-ward-map.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../src/data/mockData.ts', import.meta.url);
let src = readFileSync(FILE, 'utf8');

// ---- 配列リテラル抽出ユーティリティ ----
function extractArray(marker) {
  const start = src.indexOf(marker);
  if (start < 0) throw new Error(`marker not found: ${marker}`);
  // marker は末尾の配列開始 '[' まで含む（型注釈 Room[] の '[' を拾わないため）
  const open = start + marker.length - 1;
  if (src[open] !== '[') throw new Error(`open bracket mismatch for: ${marker}`);
  const end = src.indexOf('\n];', open);
  if (end < 0) throw new Error(`array end not found for: ${marker}`);
  const text = src.slice(open, end + 2);
  // eslint-disable-next-line no-eval
  const value = eval('(' + text + ')');
  return { value, open, end: end + 2 };
}

const roomsX = extractArray('export const ROOMS: Room[] = [');
const patientsX = extractArray('export const PATIENTS: Patient[] = [');
const oldRooms = roomsX.value;
const oldPatients = patientsX.value;

// ---- status 新モデル統合（別セッションの refactor を反映）----
// 隔離/拘束は status から外し flags 集計へ。status は重症度(不安定/重症)。
// 該当6名のみ status を付け替え（flags はベッド付帯情報として維持）。
const STATUS_REMAP = {
  P003: 'unstable', P004: 'critical', P032: 'critical',
  P013: 'unstable', P017: 'critical', P050: 'unstable',
};
const statusOf = (p) => STATUS_REMAP[p.id] ?? p.status;

// ---- 旧 ROOMS からベッド付帯情報(flags/hasScheduledMove)を patientId キーで採取 ----
const bedExtras = new Map();
for (const room of oldRooms) {
  for (const b of room.beds) {
    if (b.patientId) bedExtras.set(b.patientId, { flags: b.flags, hasScheduledMove: b.hasScheduledMove });
  }
}

// ---- 既存患者を性別で分離（配列順を維持） ----
const existingF = oldPatients.filter((p) => p.gender === 'F'); // 39 → ward1
const existingM = oldPatients.filter((p) => p.gender === 'M'); // 39 → ward2(男性室)
if (existingF.length !== 39 || existingM.length !== 39) {
  throw new Error(`想定外の性別内訳: F=${existingF.length} M=${existingM.length}`);
}

// ---- 新規患者 17 名（ward1F=3 / ward2-201F=5 / ward2M=9）----
const surnames = ['遠藤', '近藤', '斉藤', '本田', '村上', '藤井', '大野', '横山', '石田', '前田', '岡部', '広瀬', '今井', '菅原', '千葉', '須藤', '黒田'];
const givenM = ['翔', '健', '亮', '誠司', '直人', '隆司', '和也', '康平', '修平'];
const givenF = ['彩', '麻衣', '咲', '裕美', '香織', '直美', '智子', '友香'];
const diagList = ['統合失調症', 'うつ病', '双極性障害', '適応障害', '不安障害', '認知症', 'アルコール依存症'];
const docList = ['田村 医師', '岸本 医師', '森田 医師'];
let newSeq = 0; // 内部ID P087 から
let nameSeq = 0;
function makeNew(n, gender) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const id = 'P' + String(87 + newSeq).padStart(3, '0');
    const given = gender === 'M' ? givenM[nameSeq % givenM.length] : givenF[nameSeq % givenF.length];
    out.push({
      id,
      name: `${surnames[nameSeq % surnames.length]} ${given}`,
      age: 26 + ((nameSeq * 7) % 44),
      gender,
      status: 'stable',
      admitDate: `2026-0${4 + (nameSeq % 2)}-${String(1 + ((nameSeq * 3) % 27)).padStart(2, '0')}`,
      doctorName: docList[nameSeq % docList.length],
      diagnosis: diagList[nameSeq % diagList.length],
    });
    newSeq++; nameSeq++;
  }
  return out;
}
const newWard1F = makeNew(3, 'F');
const newWard2F = makeNew(5, 'F');
const newWard2M = makeNew(9, 'M');

// ---- 新レイアウト ----
const seqDigit = ['1', '2', '3', '5', '6', '7', '8', '9']; // 4 欠番
const seqAlpha = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const labels = (n, ward) => (ward === 'ward1' ? seqDigit : seqAlpha).slice(0, n);

const ward1Layout = [
  { roomNumber: '100', n: 2, disabled: ['2'] },
  { roomNumber: '101', n: 7 }, { roomNumber: '102', n: 7 }, { roomNumber: '103', n: 7 },
  { roomNumber: '105', n: 7 }, { roomNumber: '106', n: 7 },
  { roomNumber: '107', n: 4 }, { roomNumber: '108', n: 4 },
];
const ward2FemaleLayout = [{ roomNumber: '201', n: 5 }];
const ward2MaleLayout = [
  { roomNumber: '202', n: 6 }, { roomNumber: '203', n: 6 }, { roomNumber: '205', n: 6 },
  { roomNumber: '206', n: 6 }, { roomNumber: '208', n: 4 }, { roomNumber: '210', n: 6 },
  { roomNumber: '211', n: 6 }, { roomNumber: '212', n: 6 }, { roomNumber: '213', n: 6 },
  { roomNumber: '215', n: 4 }, { roomNumber: '216', n: 4 },
];
const ward2Layout = [...ward2FemaleLayout, ...ward2MaleLayout].sort((a, b) => Number(a.roomNumber) - Number(b.roomNumber));

// ---- 配置（部屋単位・空床を後方へ散らす）----
const placement = new Map();   // `${room}-${bed}` -> patient
const disabledKeys = new Set();
function buildSlots(layout, ward) {
  const slots = [];
  for (const r of layout) for (const lab of labels(r.n, ward)) {
    const key = `${r.roomNumber}-${lab}`;
    const disabled = (r.disabled || []).includes(lab);
    if (disabled) disabledKeys.add(key);
    slots.push({ roomNumber: r.roomNumber, bed: lab, key, disabled });
  }
  return slots;
}
function placeRooms(layout, ward, occupants, emptyCount) {
  const slots = buildSlots(layout, ward);
  const usable = slots.filter((s) => !s.disabled);
  if (usable.length - occupants.length !== emptyCount) {
    throw new Error(`占有不整合 ${ward} ${layout.map((l) => l.roomNumber).join(',')}: usable=${usable.length} occ=${occupants.length} wantEmpty=${emptyCount}`);
  }
  // 後方の部屋から最終ベッドを順に空床指定
  const roomOrder = [...new Set(usable.map((s) => s.roomNumber))].reverse();
  const emptyKeys = new Set();
  let guard = 0;
  while (emptyKeys.size < emptyCount && guard++ < 10000) {
    for (const room of roomOrder) {
      if (emptyKeys.size >= emptyCount) break;
      const beds = usable.filter((s) => s.roomNumber === room && !emptyKeys.has(s.key));
      if (beds.length > 1) emptyKeys.add(beds[beds.length - 1].key); // 1床室は空けない
    }
    if (guard > 1 && emptyKeys.size < emptyCount) {
      // どうしても足りなければ末尾から強制
      for (const s of [...usable].reverse()) {
        if (emptyKeys.size >= emptyCount) break;
        emptyKeys.add(s.key);
      }
    }
  }
  let oi = 0;
  for (const s of usable) {
    if (emptyKeys.has(s.key)) continue;
    placement.set(s.key, occupants[oi++]);
  }
}

placeRooms(ward1Layout, 'ward1', [...existingF, ...newWard1F], 2);          // 42 / 44
placeRooms(ward2FemaleLayout, 'ward2', [...newWard2F], 0);                  // 5 / 5
placeRooms(ward2MaleLayout, 'ward2', [...existingM, ...newWard2M], 12);     // 48 / 60

// ---- 配置結果から各患者の ward/room/bed を確定し、出力順(=部屋順)で patientNumber 採番 ----
const placedById = new Map();
function wardOf(room) { return Number(room) < 200 ? 'ward1' : 'ward2'; }
const orderedForNumber = []; // ROOMS 出力順に並べた患者
function collectOrder(layout, ward) {
  for (const r of layout) for (const lab of labels(r.n, ward)) {
    const p = placement.get(`${r.roomNumber}-${lab}`);
    if (!p) continue;
    placedById.set(p.id, { ...p, wardId: ward, roomNumber: r.roomNumber, bedLabel: lab });
    orderedForNumber.push(p.id);
  }
}
collectOrder(ward1Layout, 'ward1');
collectOrder(ward2Layout, 'ward2');
orderedForNumber.forEach((id, i) => {
  placedById.get(id).patientNumber = '000' + String(10001 + i); // 8桁: '000'+10001..10095
});

// ---- ROOMS リテラル生成 ----
function bedLiteral(roomNumber, bed) {
  const key = `${roomNumber}-${bed}`;
  if (disabledKeys.has(key)) {
    return `    { bed: '${bed}', patientId: null,   patientName: null,            bedStatus: 'unavailable', gender: null, age: null },`;
  }
  const base = placement.get(key);
  if (!base) {
    return `    { bed: '${bed}', patientId: null,   patientName: null,            bedStatus: 'empty',       gender: null, age: null },`;
  }
  const p = placedById.get(base.id);
  const ex = bedExtras.get(p.id) || {};
  let extra = '';
  if (ex.flags && ex.flags.length) extra += `, flags: [${ex.flags.map((f) => `'${f}'`).join(', ')}]`;
  if (ex.hasScheduledMove) extra += `, hasScheduledMove: true`;
  return `    { bed: '${bed}', patientId: '${p.id}', patientName: '${p.name}', status: '${statusOf(p)}', gender: '${p.gender}', age: ${p.age}${extra} },`;
}
function roomsLiteral(layout, ward, header) {
  let out = `  // ${header}\n`;
  for (const r of layout) {
    out += `  { roomNumber: '${r.roomNumber}', wardId: '${ward}', beds: [\n`;
    for (const lab of labels(r.n, ward)) out += bedLiteral(r.roomNumber, lab) + '\n';
    out += `  ]},\n`;
  }
  return out;
}
const newRoomsLiteral = '[\n' +
  roomsLiteral(ward1Layout, 'ward1', '第１病棟（女性のみ。100=2床/2番使用不可, 101/102/103/105/106=各7床, 107/108=各4床。番号は 4 欠番）') +
  roomsLiteral(ward2Layout, 'ward2', '第２病棟（男性のみ。ただし 201 は女性室。201=5床, 202/203/205/206/210-213=各6床, 208/215/216=各4床）') +
  ']';

// ---- PATIENTS リテラル生成（部屋順、内部ID保持、patientNumber 付与）----
function patientLiteral(p) {
  const prt = p.primaryRecordType ? `, primaryRecordType: '${p.primaryRecordType}'` : '';
  return `  { id: '${p.id}', patientNumber: '${p.patientNumber}', name: '${p.name}', age: ${p.age}, gender: '${p.gender}', wardId: '${p.wardId}', roomNumber: '${p.roomNumber}', bedLabel: '${p.bedLabel}', status: '${statusOf(p)}', admitDate: '${p.admitDate}', doctorName: '${p.doctorName}', diagnosis: '${p.diagnosis}'${prt} },`;
}
const w1Lines = orderedForNumber.map((id) => placedById.get(id)).filter((p) => p.wardId === 'ward1').map(patientLiteral);
const w2Lines = orderedForNumber.map((id) => placedById.get(id)).filter((p) => p.wardId === 'ward2').map(patientLiteral);
const newPatientsLiteral = `[\n  // 第１病棟（女性のみ）\n${w1Lines.join('\n')}\n  // 第２病棟（男性のみ。201 は女性室）\n${w2Lines.join('\n')}\n]`;

// ---- 書き戻し（後方の PATIENTS から先に置換してオフセットを保つ）----
src = src.slice(0, patientsX.open) + newPatientsLiteral + src.slice(patientsX.end);
src = src.slice(0, roomsX.open) + newRoomsLiteral + src.slice(roomsX.end);

// ---- patientNumberOf ヘルパを PATIENTS 直後に注入（冪等: 既存があれば差し替え）----
{
  const helper = `

/** 内部患者ID → 表示用患者番号(8桁) の対応。一覧・記録系で patientId しか持たない箇所の表示に使う。 */
const PATIENT_NUMBER_BY_ID: Record<string, string> = PATIENTS.reduce((acc, p) => {
  if (p.patientNumber) acc[p.id] = p.patientNumber;
  return acc;
}, {} as Record<string, string>);

/** 内部患者IDから表示用の患者番号(8桁)を引く。未登録IDは内部IDをそのまま返す。 */
export const patientNumberOf = (patientId: string): string =>
  PATIENT_NUMBER_BY_ID[patientId] ?? patientId;
`;
  // 既存の注入があれば取り除いてから入れ直す
  src = src.replace(/\n\n\/\*\* 内部患者ID → 表示用患者番号[\s\S]*?PATIENT_NUMBER_BY_ID\[patientId\] \?\? patientId;\n/, '\n');
  src = src.replace('\n// ===== オーダ =====', helper + '\n// ===== オーダ =====');
}

// ---- ISOLATION_ORDERS: 患者の新 ward/room へ追従（当該ブロック内のみ）----
let isoReplaced = 0;
{
  const isoStart = src.indexOf('export const ISOLATION_ORDERS');
  const isoEnd = src.indexOf('\n];', isoStart) + 2;
  let block = src.slice(isoStart, isoEnd);
  block = block.replace(
    /(patientId: ')(P\d+)('[\s\S]*?\n\s*wardId: ')ward[12](', roomNumber: ')[^']*(')/g,
    (m, a, pid, b, c, d) => {
      const p = placedById.get(pid);
      if (!p) return m;
      isoReplaced++;
      return `${a}${pid}${b}${p.wardId}${c}${p.roomNumber}-${p.bedLabel}${d}`;
    },
  );
  src = src.slice(0, isoStart) + block + src.slice(isoEnd);
}

// ---- 行動制限 ward を両病棟へ拡張 ----
src = src.replace(
  "export const MASTER_BEHAVIOR_RESTRICT_WARDS = ['ward1'] as const;",
  "export const MASTER_BEHAVIOR_RESTRICT_WARDS = ['ward1', 'ward2'] as const;",
);

// ---- ADMISSION_ORDERS: 削除部屋を指す退院指示などを新部屋へ補正 ----
function fixAdmissionRoom(patientId) {
  const p = placedById.get(patientId);
  if (!p) return;
  const re = new RegExp(`(patientId: '${patientId}',[^\\n]*roomNumber: ')\\d{3}(',)`);
  src = src.replace(re, `$1${p.roomNumber}$2`);
}
['P006', 'P007', 'P017', 'P013', 'P003', 'P019', 'P020'].forEach(fixAdmissionRoom);

// ---- currentPatient: 削除された 104 号室を有効な部屋へ ----
src = src.replace(/(export const currentPatient: Patient = \{[\s\S]*?roomNumber: ')104(',)/, '$1101$2');

// ---- STATUS_CONFIG: status 新モデルへ（隔離/拘束 → 不安定/重症）----
let statusCfgReplaced = 0;
src = src.replace(
  /  isolation:   \{ label: '隔離',   color: '#b91c1c', bgColor: '#fef2f2', muiColor: 'error' \},\n  restraint:   \{ label: '拘束',   color: '#b91c1c', bgColor: '#fef2f2', muiColor: 'error' \},/,
  (m) => {
    statusCfgReplaced++;
    return "  unstable:    { label: '不安定', color: '#ea580c', bgColor: '#fff7ed', muiColor: 'warning' },\n" +
      "  critical:    { label: '重症',   color: '#dc2626', bgColor: '#fef2f2', muiColor: 'error' },";
  },
);

writeFileSync(FILE, src, 'utf8');

// ---- サマリ ----
const occW1 = [...placedById.values()].filter((p) => p.wardId === 'ward1').length;
const occW2 = [...placedById.values()].filter((p) => p.wardId === 'ward2').length;
const f201 = [...placedById.values()].filter((p) => p.roomNumber === '201').length;
console.log('ISO追従置換:', isoReplaced, '件 (期待 14)');
console.log('STATUS_CONFIG 変換:', statusCfgReplaced, '件 (期待 1)');
console.log('新規患者:', [...newWard1F, ...newWard2F, ...newWard2M].map((p) => p.id).join(', '));
console.log(`ward1(女性) 在院 ${occW1} / 使用可能44`);
console.log(`ward2(男性+201女性) 在院 ${occW2} / 使用可能65  (201女性=${f201})`);
console.log(`総在院 ${occW1 + occW2} / 物理床 110 (使用不可1)`);
