# AGENTS.md

## プロジェクト構成

```
.
├── .env.example                       # 環境変数の設定例
├── .gitignore                         # gitの無視ルール
├── AGENTS.md                          # AIエージェントへの指示（※未使用のため、デフォルトのまま）
├── CLAUDE.md                          # Claude Code向けの指示（AGENTS.mdを参照するだけ）
├── components.json                    # shadcn/uiの設定ファイル
├── eslint.config.mjs                  # ESLintの設定ファイル
├── LICENSE                            # ライセンスファイル（MIT）
├── next-env.d.ts                      # Next.jsのTypeScript宣言ファイル
├── next.config.ts                     # Next.jsの設定ファイル
├── package.json                       # プロジェクトの依存関係とスクリプト
├── pnpm-lock.yaml                     # pnpmのロックファイル
├── pnpm-workspace.yaml                # pnpmの設定ファイル
├── postcss.config.mjs                 # PostCSSの設定ファイル
├── README.md                          # プロジェクトの概要や開発手順
├── Taskfile.yaml                      # タスクランナーの設定ファイル
├── tsconfig.json                      # TypeScriptの設定ファイル
├── .vscode/                           # VSCodeのワークスペース設定フォルダ
│   ├── launch.json                    # デバッグの構成ファイル（サーバーとブラウザの両方をデバッグ起動する構成を定義）
│   └── settings.json                  # 設定ファイル（ESLintなどの設定）
└── src/                               # ソースフォルダ
    ├── app/                           # App Router
    │   ├── globals.css                # グローバルスタイル
    │   ├── layout.tsx                 # ルートレイアウト
    │   ├── page.tsx                   # ルートページ
    │   ├── providers.tsx              # 各種プロバイダを1つにまとめたプロバイダ
    │   ├── _components/               # ページ内部コンポーネント
    │   │   ├── app-bar.tsx            # ヘッダーバー（アプリタイトルと各種ボタン）
    │   │   ├── commands-palette.tsx   # コマンドパレット
    │   │   ├── commands-provider.tsx  # コマンド定義用のプロバイダ
    │   │   ├── full-audio.tsx         # 全体音声の生成および再生
    │   │   ├── lines-editor.tsx       # 台詞行の編集
    │   │   ├── log-viewer.tsx         # ログメッセージの表示
    │   │   ├── main-tabs.tsx          # メインのタブ
    │   │   ├── words-editor.tsx       # 読み替え辞書の編集
    │   │   └── yaml-editor.tsx        # Monaco Editorを使用した台本（YAML）の直接編集
    │   ├── api/                       # Web APIのエンドポイント
    │   │   └── audio/
    │   │       ├── _lib/              # 内部共通ロジック
    │   │       │   └── audio.ts       # 音声合成の処理
    │   │       ├── full/
    │   │       │   └─route.ts         # 全体音声合成・結合（Server-Sent Eventsで処理の進捗をストリーミング）
    │   │       ├── line/
    │   │       │   └─route.ts         # 単一台詞行用の音声合成
    │   │       └── voices/
    │   │           └─route.ts         # ボイス情報の取得
    │   └── output/                    # 外部の出力フォルダに生成された音声ファイルを静的ファイルとして配信するためのエンドポイント
    │       └── [...filePath]/         # 動的セグメント（ファイル名）
    │           └── route.ts           # HTTP Range Requestsに対応したファイルの配信
    ├── components/                    # 共通コンポーネント
    │   └── ui/                        # shadcn/uiで追加した各種コードを少しだけカスタマイズ ※ファイル数が多いため詳細は省略
    ├── hooks/                         # 共通フック
    │   └── key-bind.ts                # キーバインドの登録
    ├── lib/                           # 共通ロジック
    │   ├── api.client.ts              # Route HandlersのWeb APIを呼び出す関数（client-only）
    │   ├── api.server.ts              # TTSなどのWeb APIを呼び出す関数（server-only）
    │   ├── env.server.ts              # 環境変数の取得（server-only）
    │   ├── schemas.ts                 # スキーマ定義
    │   ├── utils.client.ts            # 共通処理（client-only）
    │   ├── utils.server.ts            # 共通処理（server-only）
    │   └── utils.ts                   # 共通処理
    └── stores/                        # 共通状態管理
        ├── active-tab-store.ts        # アクティブなタブ
        ├── command-configs-store.ts   # コマンド定義
        ├── commands-palette-store.ts  # コマンドパレットの開閉状態
        ├── lines-expand-store.ts      # 台詞行の詳細設定の開閉状態
        ├── logs-store.ts              # ログメッセージ
        └── script-store.ts            # 台本（編集、YAML変換、編集履歴管理など）
```

## Git
- コミットメッセージ: Conventional Commits 準拠
