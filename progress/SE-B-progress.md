# SE-B 進捗メモ — Azure デプロイ対応

## 担当タスク（docs/azure-deployment.md § 14 作業分担マトリクス より）

| タスク ID | タスク | 成果物 | 状態 |
|-----------|--------|--------|------|
| B-1 | Azure Functions エントリポイント作成 | `backend/function_app.py` | ✅ 完了 |
| B-2 | Azure Functions 設定ファイル作成 | `backend/host.json`, `backend/local.settings.json` | ✅ 完了 |
| B-3 | Azure 用 requirements 作成 | `backend/requirements-azure.txt` | ✅ 完了 |
| D-2 | フロントエンドデプロイ WF 作成 | `.github/workflows/frontend-deploy-azure.yml` | ✅ 完了 |

---

## 作業ログ

### 2026-03-12 — 初回作業

#### B-1: `backend/function_app.py`

**実装内容**:
- Azure Functions v2 プログラミングモデル (`AsgiFunctionApp`) を使用
- `app.main.app`（FastAPI インスタンス）をそのままラップ
- `http_auth_level=func.AuthLevel.ANONYMOUS` — 認証は FastAPI 側の JWT ミドルウェアで処理するため

**既存コードへの影響**:
- `backend/app/` 配下のコードは **一切変更なし**
- `app/main.py` の `handler = Mangum(app)` 行は削除不要（Azure Functions はこのファイルをエントリポイントとして参照しないため無視される）

#### B-2: `backend/host.json` / `backend/local.settings.json`

**`host.json` で最重要な設定**:
```json
"extensions": {
  "http": {
    "routePrefix": ""
  }
}
```
- デフォルトの `routePrefix` は `"api"` であり、FastAPI の `/api/*` ルートと組み合わさると
  `/api/api/health` のような二重プレフィックスになる
- 空文字に設定することで FastAPI のパスがそのまま使われる（docs § 5.2 最重要事項）

**`local.settings.json`**:
- ローカル開発用の環境変数を定義
- `AzureWebJobsStorage: "UseDevelopmentStorage=true"` — Azurite（ローカルストレージエミュレータ）を使用
- `.gitignore` に追加済み（MongoDB URL, JWT キーを含むため git 管理外）

#### B-3: `backend/requirements-azure.txt`

- `requirements.txt` の内容から `mangum` を除外し `azure-functions>=1.21.0` を追加
- `httpx`, `pytest`, `pytest-asyncio`, `mongomock-motor` はデプロイ不要だが、
  functions の ZIP に含めても動作には支障なし（Azure Functions は未使用パッケージを実行しないため）
- テスト依存を除外したい場合は CI でのみ `requirements.txt` を使うよう GitHub Actions を調整すること

#### D-2: `.github/workflows/frontend-deploy-azure.yml`

**実装内容**:
- `Azure/static-web-apps-deploy@v1` がビルド + デプロイ + CDN パージを 1 アクションで実行
- `OIDC 認証は不要**（SWA deploy アクションは `AZURE_SWA_TOKEN` デプロイトークンで認証）
- `api_location: ""` — バックエンドは別の Azure Functions で提供するため SWA マネージド Functions は使わない
- `VITE_API_URL` に `VITE_API_URL_AZURE` シークレットを渡してビルド時に Azure Functions の URL を埋め込む

**AWS 版との差分**:
- AWS: `npm ci` → `npm run build` → `aws s3 sync` → `cloudfront create-invalidation` (4 ステップ)
- Azure: `static-web-apps-deploy@v1` の 1 アクションで完結（ビルド + デプロイ + CDN 更新）

---

## 注意事項・ハマりどころ

### ローカル開発の起動方法

Azure Functions Core Tools でローカル実行:
```bash
cd backend
pip install -r requirements-azure.txt
func start
```
`local.settings.json` の環境変数が自動的に読み込まれる。
`http://localhost:7071/api/health` で動作確認可能。

### local.settings.json の管理

- **絶対に git にコミットしない**（`.gitignore` に追加済み）
- チームメンバーは `local.settings.json` を手動で作成する必要がある
- `backend/local.settings.json` をテンプレートとして別途 `local.settings.json.example` を作成することも検討

### azure-functions パッケージバージョン

- `azure-functions>=1.21.0` を指定（`AsgiFunctionApp` は v1.17.0 以降で利用可能）
- バージョンを固定する場合は `pip freeze` で実際のバージョンを確認して `requirements-azure.txt` を更新すること

---

## 次のアクション（未実施・後続 SE への引き継ぎ事項）

1. **Azure Functions Core Tools でのローカル動作確認**: `func start` で起動し全 API エンドポイントをテスト
2. **SWA の CORS 設定**: フロントエンドデプロイ後に SWA の URL を Functions の CORS に追加
3. **Application Insights との統合確認**: テレメトリが Log Analytics に送られることを Azure Portal で確認

---

## 参考リンク

- `docs/azure-deployment.md` § 5 Azure Functions バックエンド対応
- `docs/azure-deployment.md` § 6.2 フロントエンドデプロイ WF 設計
- `docs/azure-deployment.md` § 13 注意点・ハマりどころ (特に #1 routePrefix)
