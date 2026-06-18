import 'server-only';

import path from 'node:path';

export function getSettings() {
  const ttsApiBaseUrl = process.env.TTS_API_BASE_URL || 'http://localhost:8088';

  let outputDir = path.resolve(process.env.OUTPUT_DIR || './output');
  // 末尾に必ず区切り文字を付ける。
  // ⇒ これにより、絶対パスの前方一致チェックでディレクトリトラバーサル対策ができる。
  if (!outputDir.endsWith(path.sep)) {
    outputDir += path.sep;
  }

  return {
    ttsApiBaseUrl,
    outputDir,
  };
}
