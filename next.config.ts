import type { NextConfig } from 'next';

// 公式ドキュメント: https://nextjs.org/docs/app/api-reference/config/next-config-js
const nextConfig: NextConfig = {
  // レスポンスヘッダーに「X-Powered-By: Next.js」を出力させない。
  poweredByHeader: false,

  // React Compiler（自動メモ化）を有効化
  reactCompiler: true,
};

export default nextConfig;
