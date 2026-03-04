# TeamManagementTool

チームのプロジェクト・メンバー・コストを一元管理する Web アプリケーションです。

---

## アプリケーション概要

**TeamManagementTool (TeamBoard)** は、開発チームのプロジェクト管理・コスト管理を目的とした SPA (Single Page Application) です。

### 主な機能

| 機能 | 説明 |
|------|------|
| ダッシュボード | プロジェクト数・メンバー数・予算消化率などの KPI を一覧表示 |
| メンバー管理 | チームメンバーの登録・編集・削除、月間稼働率の算出 |
| プロジェクト管理 | プロジェクトの作成・編集・削除、進捗・コストのリアルタイム集計 |
| ガントチャート | タスクをドラッグ&ドロップで日程調整できるガントチャート表示 |
| 予算管理 | 予算 vs 実績のグラフ、メンバー別コスト内訳のドーナツチャート |

### 技術スタック

**バックエンド**

- Python 3.x / FastAPI
- MongoDB（Beanie ODM + Motor 非同期ドライバ）
- JWT 認証（python-jose / bcrypt）
- Uvicorn（ASGI サーバ）

**フロントエンド**

- React 19 / TypeScript
- Vite（ビルドツール）
- Tailwind CSS 4
- TanStack Query（サーバー状態管理）
- Zustand（クライアント状態管理）
- React Router DOM 6
- dnd-kit（ドラッグ&ドロップ）
- Recharts（グラフ描画）
- Axios（HTTP クライアント）

### ロールと権限

| ロール | 主な権限 |
|--------|----------|
| admin | 全操作（ユーザー・メンバー・プロジェクト・タスクの作成/編集/削除） |
| manager | プロジェクト・タスクの作成/編集、コスト閲覧 |
| member | プロジェクト・メンバーの閲覧、自担当タスクの進捗更新 |

---

## 環境のセットアップ方法

### 前提条件

- Python 3.11 以上
- Node.js 20 以上 / npm 10 以上
- MongoDB 7.x（ローカルまたはリモート）

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd TeamManagementTool
```

### 2. バックエンドのセットアップ

```bash
cd backend

# 仮想環境を作成して有効化
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 依存パッケージをインストール
pip install -r requirements.txt
```

#### 環境変数の設定

`backend/.env` ファイルを作成し、以下の内容を設定してください。

```dotenv
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=teamboard
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=480
CORS_ORIGINS=http://localhost:5173
```

| 変数名 | デフォルト値 | 説明 |
|--------|------------|------|
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB 接続 URL |
| `MONGODB_DB_NAME` | `teamboard` | 使用するデータベース名 |
| `JWT_SECRET_KEY` | *(要変更)* | JWT 署名用シークレットキー |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | トークン有効期限（分） |
| `CORS_ORIGINS` | `http://localhost:5173` | フロントエンドの許可オリジン |

### 3. フロントエンドのセットアップ

```bash
cd frontend

# 依存パッケージをインストール
npm install
```

### 4. シードデータの確認

初回起動時にアプリケーションが自動でシードデータを投入します。以下のアカウントでログインできます。

| ユーザー | メールアドレス | パスワード | ロール |
|----------|--------------|-----------|--------|
| 管理者 | `admin@teamboard.example` | `admin1234` | admin |
| マネージャー | `manager@teamboard.example` | `manager1234` | manager |

---

## ビルド方法

### バックエンド

バックエンドは Python スクリプトのため、ビルド手順はありません。

### フロントエンド

本番用静的ファイルをビルドします。

```bash
cd frontend
npm run build
```

ビルド成果物は `frontend/dist/` に出力されます。

ビルド前に型チェックとリントを実行する場合:

```bash
# 型チェック
npx tsc --noEmit

# リント
npm run lint
```

---

## 起動方法

### バックエンドの起動

```bash
cd backend
source .venv/bin/activate   # Windows: .venv\Scripts\activate

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

起動後、以下の URL でアクセスできます。

| URL | 説明 |
|-----|------|
| `http://localhost:8000/api/health` | ヘルスチェック |
| `http://localhost:8000/docs` | Swagger UI（API ドキュメント） |
| `http://localhost:8000/redoc` | ReDoc（API ドキュメント） |

### フロントエンドの起動

**開発サーバ（ホットリロード付き）**

```bash
cd frontend
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

**本番ビルドのプレビュー**

```bash
cd frontend
npm run preview
```

### 起動順序

MongoDB → バックエンド → フロントエンド の順で起動してください。

```
[1] MongoDB を起動
[2] バックエンド: uvicorn app.main:app --reload
[3] フロントエンド: npm run dev
```

---

## AWS アーキテクチャ構成

本アプリケーションは AWS 上にサーバーレス構成でデプロイされます。

![AWS Architecture](docs/images/aws-architecture.svg)

### 構成サービス一覧

| レイヤー | AWS サービス | 用途 |
|----------|-------------|------|
| フロントエンド | **Amazon S3** | React/TypeScript 静的アセットのホスティング |
| フロントエンド | **Amazon CloudFront** | CDN 配信・キャッシュ (ap-northeast-1) |
| バックエンド | **Amazon API Gateway** | HTTP API エンドポイント |
| バックエンド | **AWS Lambda** | FastAPI アプリ (Mangum ASGI, Python 3.11+) |
| データベース | **MongoDB Atlas** | クラウド MongoDB（外部サービス） |
| セキュリティ | **AWS IAM Role (OIDC)** | GitHub Actions 認証（シークレットキー不要） |
| CI/CD | **GitHub Actions** | push to main で自動デプロイ |

### デプロイフロー

```
git push (main) → GitHub Actions → OIDC → IAM Role
  ├─ バックエンド: ZIP 化 → aws lambda update-function-code
  └─ フロントエンド: Vite build → aws s3 sync → CloudFront Invalidation
```

詳細なアーキテクチャ図は [`docs/images/aws-architecture.svg`](docs/images/aws-architecture.svg) を参照してください。
