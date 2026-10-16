# BIPIA攻撃ログビューア

BIPIA（間接プロンプトインジェクションのベンチマーク）で防御条件を変えて実行した攻撃ログ（JSON）を、読みやすく・検索しやすく閲覧し、ジャッジ結果を手作業でレビューするための単一ユーザー向けローカルWebアプリ。

バックエンドは無し。クライアントのみで完結し、既存のJSONログファイルをブラウザ上で直接読み込んで扱う。

## 技術スタック

- Vite + React + TypeScript
- プレーンCSS（フレームワーク不使用）
- [TanStack Virtual](https://tanstack.com/virtual)（一覧の仮想スクロール）
- [Dexie](https://dexie.org/)（IndexedDBへのアノテーション永続化）

## セットアップ

```bash
npm install
npm run dev
```

`http://localhost:5173/` を開く。

その他のコマンド:

```bash
npm run build    # 型チェック + 本番ビルド
npm run preview  # ビルド結果をローカルで確認
npm run lint     # oxlint
```

## Docker での配信

研究室の仮想サーバなどで起動し、同一ネットワークの他の人がブラウザからアクセスできるようにする方法。
ビルド済みの静的ファイルを nginx で配信するだけなので、サーバ側に Node.js は不要。
ログJSONはこれまでどおり各自のブラウザで読み込むため、データをサーバに置く必要はない。

### 前提

- Docker と Docker Compose（`docker compose` コマンド）がインストールされていること

### 起動

リポジトリ直下で実行する。

```bash
docker compose up -d --build
```

初回はイメージのビルドに数分かかる。起動したら次のURLを開く。

- サーバ上から: `http://localhost:8080`
- 他のPCから: `http://<サーバのホスト名/IP>:8080`

他のPCから開けない場合は、仮想サーバのファイアウォール/セキュリティグループで 8080 番ポートを同一ネットワークに許可する。
ポートを変えたいときは `docker-compose.yml` の `"8080:80"` の左側の数字を変える。

### よく使うコマンド

```bash
docker compose ps                # 起動状態を確認
docker compose logs -f           # ログを表示（Ctrl+C で抜ける）
docker compose down              # 停止・コンテナ削除
git pull && docker compose up -d --build   # コードを更新して再ビルド・再起動
```

`restart: unless-stopped` を指定しているため、サーバ再起動後もコンテナは自動で起動する（`docker compose down` で止めた場合を除く）。

### 注意

- 認証機能は無い。信頼できる研究室内ネットワークに限定して公開すること。
- 手動レビューのアノテーションはサーバではなく各自のブラウザ（IndexedDB）に保存される。共有したい場合はエクスポート/インポートを使う。

## 使い方

1. アプリ上部のドロップゾーンにJSONログファイルをドラッグ&ドロップ（複数ファイル同時可）、またはクリックしてファイル選択する。
2. 一覧（左ペイン）でレコードを選択すると、右ペインに詳細が表示される。
3. 上部の検索ボックス・フィルタ（Condition / Domain / Attack Type / Attack Name / 判定状態）で絞り込む。フィルタはすべてAND条件。
4. 詳細パネル下部の「手動レビュー」で判定のオーバーライド（hacked/defended）、False Positive/False Negativeフラグ、メモを記録する。内容は自動的にブラウザのIndexedDBに保存され、リロードしても残る。
5. 上部の「アノテーションをエクスポート/インポート」でレビュー結果をJSONファイルとして保存・復元できる。

複数ファイル・複数`condition`を読み込んだ場合は、レコード内の`condition`値で統合・グルーピングされる（ファイル名では判別しない）。

## 入力データのスキーマ

各ファイルはレコードのJSON配列。フィールド構成:

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `sample_id` | number | サンプルID |
| `condition` | string | 防御条件（例: `llama_bipia_all_spcl_filter`） |
| `domain` | string | ドメイン（例: `email`, `table`） |
| `attack_type` | string | 攻撃タイプ（例: `Task Automation`） |
| `attack_name` | string | 攻撃名（例: `Task Automation-0`） |
| `attack_str` | string | `poisoned_input`に挿入された攻撃ペイロード |
| `instruction` | string | メインタスクの指示文 |
| `clean_input` | string（任意） | 注入前の入力。存在すれば詳細パネルに表示する |
| `poisoned_input` | string | 攻撃ペイロード注入後の入力 |
| `response` | string | モデルの出力 |
| `hacked` | boolean \| null | true=攻撃成功 / false=防御成功 / null・欠損=未判定 |
| `judge_method` | string（任意） | 判定根拠の手法。存在すれば詳細パネルに表示する |
| `judge_evidence` | string（任意） | 判定根拠。存在すれば詳細パネルに表示する |

レコードの一意キーは `(sample_id, attack_name, condition)` の組。アノテーション（手動レビュー結果）もこのキーでIndexedDBに保存される。

## 主な機能

- **読み込み**: 複数JSONファイルのドラッグ&ドロップ、レコードの統合・グルーピング
- **一覧・検索**: 仮想スクロール一覧、大文字小文字非依存の部分一致検索＋ヒット箇所ハイライト、複合フィルタ（condition / domain / attack_type / attack_name / 判定状態）
- **判定色分け**: hacked=true→赤 / false→緑 / 未判定→グレー
- **ペイロード挿入位置ハイライト**: `poisoned_input`内で`attack_str`を検出し、先頭/中間/末尾＋文字オフセットをバッジ表示。見つからない場合は「位置特定不可」と明示
- **手動レビュー**: 判定オーバーライド、False Positive/False Negativeフラグ、自由メモ
- **アノテーション永続化**: IndexedDB(Dexie)への自動保存、JSONでのエクスポート/インポート
- **集計**: 現在のフィルタ結果に対する件数・ASR（判定済み件数に対するhacked件数の割合）、手動オーバーライド反映後の補正後ASR

## v1のスコープ外

- clean/poisoned入力の並列比較表示
- activation delta連携
- 条件間のフリップ分析
- グラフ描画ライブラリによるダッシュボード
- バックエンド／サーバー処理／再ジャッジ／Python前処理

## ディレクトリ構成

```
src/
  types.ts              レコード・アノテーションの型定義
  db.ts                 Dexie(IndexedDB)スキーマ
  utils/
    loadRecords.ts       JSONファイルの読み込み・スキーマ検証
    filter.ts            複合フィルタのロジック
    highlight.ts          検索ハイライト用のセグメント分割
    payloadPosition.ts   attack_strの挿入位置検出
    stats.ts             件数・ASR計算
    exportImport.ts       アノテーションのエクスポート/インポート
  hooks/
    useAnnotations.ts    DexieのliveQueryラッパー
  components/
    FileDropZone.tsx
    FilterBar.tsx / FacetFilter.tsx
    RecordList.tsx       仮想スクロール一覧
    DetailPanel.tsx / ReviewPanel.tsx
    StatsBar.tsx
    Tag.tsx / HighlightedText.tsx
```
