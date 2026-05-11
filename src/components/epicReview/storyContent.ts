//
// エピック評価画面用：ユーザーストーリーの spec / issue 本文ロード。
//
// Vite の import.meta.glob で build 時に全 markdown を raw 文字列として
// eager load し、us-id（2 桁ゼロ埋め）でインデックスする。
//
// 優先順:
//   1) docs/specs/<ep-slug>/us-<N>-<slug>.spec.md（ep-15 / ep-16 / ep-17 系）
//   2) docs/issues/user-story/us-<N>-<slug>.md（ep-01〜ep-10, ep-12〜ep-14）
//   3) どちらもなければ null（呼び出し側で「未起票」表示）
//

const specModules = import.meta.glob('../../../docs/specs/**/us-*.spec.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const issueModules = import.meta.glob('../../../docs/issues/user-story/us-*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export type StorySource = 'spec' | 'issue';

export interface StoryDoc {
  source: StorySource;
  /** プロジェクトルートからの相対パス（先頭 `../../../` を剥がしたもの） */
  path: string;
  content: string;
}

/** ファイルパスから us-id（2 桁ゼロ埋め `us-XX`）を抽出 */
function extractUsId(path: string): string | null {
  const m = path.match(/\/us-(\d+)-[^/]+\.(?:spec\.)?md$/);
  if (!m) return null;
  return `us-${String(parseInt(m[1], 10)).padStart(2, '0')}`;
}

function normalizePath(p: string): string {
  return p.replace(/^(?:\.\.\/)+/, '');
}

const byId = new Map<string, StoryDoc>();

for (const [path, content] of Object.entries(specModules)) {
  const id = extractUsId(path);
  if (!id) continue;
  byId.set(id, { source: 'spec', path: normalizePath(path), content });
}

for (const [path, content] of Object.entries(issueModules)) {
  const id = extractUsId(path);
  if (!id) continue;
  if (byId.has(id)) continue;
  byId.set(id, { source: 'issue', path: normalizePath(path), content });
}

export function getStoryDoc(storyId: string): StoryDoc | null {
  return byId.get(storyId) ?? null;
}
