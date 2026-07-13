import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import { REVISIONS, LATEST_VERSION_NUMBER } from './src/data/revisions';

/**
 * `/api/version` と `/api/version/detail` を提供するプラグイン。
 *
 * - dev サーバー（`vite dev`）: configureServer で middleware を追加
 * - preview サーバー（`vite preview`）: configurePreviewServer で同じ handler
 * - 本番ビルド（`vite build`）: dist/api/version.json と dist/api/version/detail.json を静的に出力
 *
 * データソースは `src/data/revisions.ts` の REVISIONS 配列で一元管理する。
 */
function revisionApiPlugin(): Plugin {
  const versionBody = JSON.stringify({ version: LATEST_VERSION_NUMBER });
  const detailBody = JSON.stringify({ revisions: REVISIONS });

  const handleApi = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ): void => {
    const url = req.url ?? '';
    // 拡張子ありなしどちらでも受ける（静的ホスティング時と揃える）
    if (url === '/api/version' || url === '/api/version.json') {
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(versionBody);
      return;
    }
    if (url === '/api/version/detail' || url === '/api/version/detail.json') {
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(detailBody);
      return;
    }
    next();
  };

  return {
    name: 'raku-emr-revision-api',
    configureServer(server) {
      server.middlewares.use(handleApi);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApi);
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'api/version.json',
        source: versionBody,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'api/version/detail.json',
        source: detailBody,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), revisionApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    open: false,
  },
});
