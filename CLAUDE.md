# TeamManagementTool - Claude Code Configuration

## Plugin: everything-claude-code

このプロジェクトでは [everything-claude-code](https://github.com/affaan-m/everything-claude-code) プラグインを使用しています。

### インストール方法

新しい環境でセットアップする場合：

```bash
git clone https://github.com/affaan-m/everything-claude-code.git /tmp/everything-claude-code
cd /tmp/everything-claude-code
npm install
./install.sh typescript python
```

### 利用可能なコマンド

| コマンド | 説明 |
|---|---|
| `/plan` | 実装計画を作成（コード変更前に確認を求める） |
| `/tdd` | テスト駆動開発ワークフローを強制 |
| `/code-review` | コードレビューを実行 |
| `/build-fix` | ビルドエラーを修正 |
| `/e2e` | Playwright E2Eテストを生成・実行 |
| `/python-review` | Python コードの包括的レビュー |

### プロジェクト固有ガイド

#### バックエンド (Python / FastAPI)

- `~/.claude/rules/python/` 配下のルールが自動適用される
- テストは `backend/tests/` に pytest で記述する
- 型ヒントを必ず付ける（PEP 8 準拠）
- 非同期処理は Motor / Beanie の async パターンを使用する

#### フロントエンド (TypeScript / React)

- `~/.claude/rules/typescript/` 配下のルールが自動適用される
- コンポーネントは `frontend/src/components/` に配置する
- 状態管理: UI 状態は Zustand、サーバー状態は TanStack Query を使用する
- テストは Vitest + Testing Library で記述する

### インストール済みルール

```
~/.claude/rules/
├── common/        # 共通ルール（コーディングスタイル、Git、セキュリティなど）
├── typescript/    # TypeScript ルール
├── python/        # Python ルール
└── ...            # その他言語
```
