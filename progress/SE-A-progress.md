# SE-A 進捗メモ — Azure デプロイ対応

## 担当タスク（docs/azure-deployment.md § 14 作業分担マトリクス より）

| タスク ID | タスク | 成果物 | 状態 |
|-----------|--------|--------|------|
| A-1 | ARM テンプレート作成 | `infra/azure/azuredeploy.json` | ✅ 完了 |
| A-2 | ARM パラメータファイル作成 | `infra/azure/azuredeploy.parameters.json` | ✅ 完了 |
| D-1 | バックエンドデプロイ WF 作成 | `.github/workflows/backend-deploy-azure.yml` | ✅ 完了 |

---

## 作業ログ

### 2026-03-12 — 初回作業

#### A-1: ARM テンプレート (`infra/azure/azuredeploy.json`)

**実装内容**:
- 8 リソースを定義。dependsOn で依存関係を明示
  1. Log Analytics Workspace (依存なし)
  2. Application Insights (1 に依存)
  3. Storage Account — Functions 内部用 (依存なし)
  4. App Service Plan — Consumption Y1 (依存なし)
  5. Key Vault — アクセスポリシーモデルで実装 (依存なし)
  6. Azure Functions — System Assigned Managed Identity 付き (2, 3, 4, 5 に依存)
  7. Key Vault Secrets (mongodb-url, jwt-secret-key) (5 に依存)
  7c. Key Vault アクセスポリシー — Functions の principalId に get/list 付与 (5, 6 に依存)
  8. Static Web Apps — Free プラン (依存なし)

**設計上の判断**:
- Key Vault は **アクセスポリシーモデル** (`enableRbacAuthorization: false`) を採用
  - 理由: 初回実装はシンプルさ優先。安定したら RBAC モデルへ移行可能 (docs § 7.4 推奨)
- Function App の環境変数に Key Vault 参照構文を使用:
  `@Microsoft.KeyVault(VaultName=<name>;SecretName=<name>)` — シークレットの平文書き込みを回避
- `storageAccountName` は `uniqueString(resourceGroup().id)` でグローバル一意名を生成
  - Storage Account 名は Azure 全体でユニークである必要があるため
- `corsOrigins` が空の場合は `*` を CORS 許可オリジンに設定
  - SWA の URL はデプロイ後に確定するため、初回は空パラメータで `*` に設定し、
    SWA URL 確定後に `az functionapp cors add` で正確な URL に更新することを推奨

**ハマりどころ（docs § 13 より）**:
- `routePrefix` は Function App ではなく `host.json` で設定（SE-B 担当）
- ARM テンプレートで Entra ID（OIDC 設定）は作成不可 → ステップ 1 で手動実施

#### A-2: ARM パラメータファイル (`infra/azure/azuredeploy.parameters.json`)

**実装内容**:
- サンプル値でプレースホルダーを明記
- `mongodbUrl`, `jwtSecretKey` には実際の値に置き換えが必要なことをコメントで示す

#### D-1: バックエンドデプロイ WF (`.github/workflows/backend-deploy-azure.yml`)

**実装内容**:
- OIDC 認証: `azure/login@v2` + `id-token: write` パーミッション
- `requirements-azure.txt` を使用 (Mangum なし、azure-functions あり)
- ZIP 構成: `function_app.py`, `host.json`, `app/` を ZIP ルートに配置

**AWS 版との差分**:
- AWS: `aws-actions/configure-aws-credentials` → `aws lambda update-function-code`
- Azure: `azure/login@v2` → `az functionapp deployment source config-zip`

---

## 次のアクション（未実施・後続 SE への引き継ぎ事項）

1. **CORS 設定の更新**: SWA デプロイ後に確定した URL を `corsOrigins` に設定するか、
   `az functionapp cors add --name <func-name> --resource-group teamboard-rg --allowed-origins <swa-url>` で追加
2. **ARM テンプレートの what-if 検証**: `az deployment group what-if` で実際のデプロイ前に変更内容を確認
3. **RBAC モデルへの移行検討**: 運用安定後に Key Vault を `enableRbacAuthorization: true` に変更し、
   `Key Vault Secrets User` ロール割り当てに切り替えることを検討

---

## 参考リンク

- `docs/azure-deployment.md` § 4 ARM テンプレート設計
- `docs/azure-deployment.md` § 6.1 バックエンドデプロイ WF 設計
- `docs/azure-deployment.md` § 13 注意点・ハマりどころ
