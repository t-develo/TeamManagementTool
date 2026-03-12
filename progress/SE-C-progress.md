# SE-C 進捗メモ — Azure デプロイ対応

## 担当タスク（docs/azure-deployment.md § 14 作業分担マトリクス より）

| タスク ID | タスク | 成果物 | 状態 |
|-----------|--------|--------|------|
| C-1 | Azure アーキテクチャ図 SVG 作成 | `docs/images/azure-architecture.svg` | ✅ 完了 |
| E-1 | README.md に Azure セクション追加 | `README.md` | ✅ 完了 |

---

## 作業ログ

### 2026-03-12 — 初回作業

#### C-1: `docs/images/azure-architecture.svg`

**実装内容**:
- SVG（900×620px）で Azure アーキテクチャを図示
- docs/azure-deployment.md § 1 の Mermaid ダイアグラムを視覚的な SVG に変換
- 各レイヤー（フロントエンド、バックエンド、セキュリティ、監視）を色分けで表現
- 外部サービス（MongoDB Atlas、GitHub Actions）を右側に配置
- 矢印で通信フローを表現（HTTPS、API コール、zip deploy、OIDC、KV 参照、テレメトリ）
- 下部に AWS → Azure サービス対応表を追加（既存の `docs/images/aws-architecture.svg` との対比）

**レイアウト設計**:
- ブラウザ（ユーザー）→ Static Web Apps → Azure Functions → MongoDB Atlas の左→右フロー
- Key Vault と Application Insights は中段に配置（Functions からの参照として表現）
- GitHub Actions は右下に配置（CI/CD デプロイ先への矢印を明示）

#### E-1: `README.md` — Azure セクション追加

**追加箇所**:
- 既存の「AWS アーキテクチャ構成」セクションの**直前**に Azure セクションを追加
- 追加内容:
  - Azure アーキテクチャ構成（SVG 埋め込み）
  - 構成サービス一覧（Azure）
  - デプロイフロー概要
  - 詳細手順へのリンク (`docs/azure-deployment.md`)
  - Azure デプロイ手順（ARM テンプレートを使った 7 ステップ）:
    - Entra ID アプリ登録（OIDC 用）
    - JWT シークレットキー生成
    - リソースグループ + ARM テンプレートデプロイ
    - RBAC ロール割り当て
    - GitHub Secrets 設定表
    - 初回デプロイトリガー
    - 動作確認・スタック削除手順

**設計上の判断**:
- README は既存の AWS セクション（§ AWS アーキテクチャ構成）を変更せず、Azure セクションを追加のみ
- 詳細な解説は `docs/azure-deployment.md` に委ねて README は手順フロー中心に記述

---

## 注意事項

### アーキテクチャ図の更新が必要なタイミング

以下の変更が発生した場合は `docs/images/azure-architecture.svg` を更新すること:
- サービス構成の変更（例: Consumption Plan → Premium Plan への変更）
- 新しい Azure サービスの追加（例: Azure Front Door、Application Gateway）
- MongoDB Atlas の接続方式変更（例: Private Endpoint の追加）

### README の AWS セクションとの整合性

- GitHub Secrets 表が変わった場合（AWS 版・Azure 版どちらも）README の両セクションを更新すること
- デプロイ手順のステップ番号が変わった場合は `docs/azure-deployment.md` との整合性を確認すること

---

## 次のアクション（未実施）

1. **動作確認後の README 更新**: 実際に Azure デプロイが成功したら README の動作確認セクションを
   実際のデプロイ結果（URL 例など）で更新することを検討
2. **`docs/azure-deployment.md` § 14 作業分担マトリクスの更新**: 今回の作業が完了したため、
   マトリクスのステータスを更新することも検討（ドキュメントとコードの同期）

---

## 参考リンク

- `docs/azure-deployment.md` § 1 Azure アーキテクチャ構成
- `docs/azure-deployment.md` § 2 AWS → Azure サービス対応表
- `docs/azure-deployment.md` § 14 作業分担マトリクス
- `docs/azure-deployment.md` § 15 成果物一覧
