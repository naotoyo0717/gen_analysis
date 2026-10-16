# gen_analysis を records_asr.json 対応 + Docker 配信対応にする

このリポジトリ（gen_analysis / Vite + React + TypeScript のローカルJSONログビューア）を、
実験で生成した records_asr.json 形式のログをそのまま読み込めるように修正し、
あわせて Docker で配信できるようにする。
アプリ本体（src 配下）の変更は必要最小限に限定し、リファクタ・機能追加・スタイル変更・
依存追加・整形のみの差分は一切しないこと。
現行スキーマに一致する既存ファイルの読み込み挙動も壊さないこと。
※「追加禁止」は src 配下のアプリ本体に対する制約。後述の Docker 用インフラファイル
  （Dockerfile 等の新規ファイル）の追加はこの制約の明示的な例外とする。

## まず実データを確認（実装前に必須）
次の実ファイルを1件読み、実際のキー構成・本文フィールドの有無・sample_id の型を把握してから実装する:
- /home/k705456/ml/activations/llama_code_spcl_nofilter/gen_acts/records_asr.json
- /home/k705456/ml/activations/llama_code_text/gen_acts/records_asr.json

records_asr.json はレコード配列で、おおむね次のキーを持つ:
  sample_id, domain, attack_type, attack_name, attack_category, response,
  asr(数値: 1=攻撃成功 / 0=防御成功 / -1=未判定), asr_method(文字列)
重要:
- condition（防御条件）と hacked（真偽）はレコードに無い。
- 本文フィールド（instruction / attack_str / poisoned_input / clean_input に相当）は
  存在しない場合がある。実データで有無を確認すること。

## 行う変更（アプリ本体・これ以外はしない）
1. src/types.ts の LogRecord:
   - attack_str, instruction, poisoned_input を optional にする。
   - asr?: number, asr_method?: string を追加する。
2. src/utils/loadRecords.ts の isLogRecord:
   - 必須を sample_id(number), domain, attack_type, attack_name, response のみに緩める。
   - attack_str / instruction / poisoned_input の必須チェックを外す。
   - sample_id が文字列で来る場合は数値へ変換して受け入れる。
3. 読み込み時のフィールド導出（loadRecordsFromFiles 内、最小限で）:
   - hacked が無く asr がある場合: asr===1→true, asr===0→false, それ以外(-1含む)→null にマップして hacked を埋める。既存の hacked があればそれを優先。
   - judge_method が未設定で asr_method があれば judge_method = asr_method を入れる。
   - condition が無い場合: 読み込み元ファイル名（拡張子を除いた文字列, file.name 由来）を condition として各レコードに入れる。レコードに condition があればそれを優先。
4. 詳細パネル（instruction / attack_str / poisoned_input / clean_input を表示している箇所）:
   - 値が undefined の行は表示しない（空文字やクラッシュにしない）。存在するものだけ出す。既存レイアウトは変えない。

## Docker 配信対応（新規ファイルのみ追加）
目的: 研究室の仮想サーバ上でビルド・起動し、同一ネットワークの誰でもブラウザからアクセスできるようにする。
このアプリはバックエンド無しの静的SPAなので、ビルド成果物(dist)を nginx で配信するマルチステージ構成にする。
ログJSONはブラウザ側で読み込む（ドラッグ&ドロップ/ファイル選択）設計のため、データをイメージに焼き込む必要はない。

リポジトリ直下に以下の新規ファイルを作成する（アプリ本体 src/・package.json は変更しない）:

### Dockerfile
- ステージ1(build): node:20-alpine。package*.json をコピー → npm ci →
  残りをコピー → npm run build で dist を生成。
  （package-lock.json が無い場合のみ npm install を使う）
- ステージ2(serve): nginx:alpine。nginx.conf を /etc/nginx/conf.d/default.conf へ、
  ビルドステージの /app/dist を /usr/share/nginx/html へコピー。EXPOSE 80。
  CMD ["nginx", "-g", "daemon off;"]

### nginx.conf
- listen 80; root /usr/share/nginx/html; index index.html;
- location / { try_files $uri $uri/ /index.html; }  （SPAフォールバック）

### .dockerignore
- node_modules, dist, .git, *.log を除外する。

### docker-compose.yml
- service 名 gen-analysis、build: .、ports: "8080:80"、restart: unless-stopped。

### README への追記（既存READMEがあれば数行追記、無ければDOCKER.mdを新規作成）
- 起動: docker compose up -d --build
- アクセス: http://<サーバのホスト名/IP>:8080
- 仮想サーバのファイアウォール/セキュリティグループで 8080 を同一ネットワークに許可する旨を一言。
- 認証は無い。信頼できる研究室内ネットワーク限定で公開すること、と注意書きを一言。

## 制約
- アプリ本体で触るのは上記「行う変更」に関わる最小ファイルのみ
  （src/types.ts, src/utils/loadRecords.ts, 詳細表示コンポーネント, 必要なら recordKey 周辺）。
- 新規追加してよいのは Docker 用ファイル（Dockerfile, nginx.conf, .dockerignore,
  docker-compose.yml, Docker起動手順の文書）のみ。
- 依存追加(package.json変更)・CSS/スタイル変更・命名変更・新機能は禁止。
- Vite の base 設定は変更しない（ルート配信 '/' のままで良い）。
- npm run build（型チェック）と npm run lint が通ること。警告は最小修正で解消。

## 動作確認
- 変更後、llama_code_spcl_nofilter/gen_acts/records_asr.json を実際に読み込み、
  レコードがスキップされず一覧表示されることを確認（テストかログで）。
- docker compose up -d --build でイメージがビルド・起動し、
  http://localhost:8080 でアプリが表示されることを確認する。

## 運用前提
複数条件を同時に見るときは、各条件のファイルを異なる名前（例: llama_code_spcl_nofilter.json）で渡す。
condition はファイル名由来のため、これで条件ごとに分離・グルーピングされる。