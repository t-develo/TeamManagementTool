# TeamManagementTool - Claude Code Configuration

## Plugin: everything-claude-code

このプロジェクトでは [everything-claude-code](https://github.com/affaan-m/everything-claude-code) プラグインを使用しています。

> **iOS / セッションリセット対応:** rules・agents・commands はこのリポジトリの `.claude/` ディレクトリに含まれています。
> `~/.claude/` がない環境でも自動的に読み込まれます。追加インストール不要です。

---

## プロジェクトローカル構成

```
.claude/
├── rules/
│   ├── common/        # 共通ルール（コーディングスタイル、Git、セキュリティなど）
│   ├── typescript/    # TypeScript / React ルール
│   └── python/        # Python / FastAPI ルール
├── agents/            # 専門エージェント（コードレビュー、TDD、セキュリティなど）
├── commands/          # スラッシュコマンド
└── skills/            # Azure 関連スキル
```

---

## 利用可能なコマンド

| コマンド | 説明 |
|---|---|
| `/plan` | 実装計画を作成（コード変更前に確認を求める） |
| `/tdd` | テスト駆動開発ワークフローを強制 |
| `/code-review` | コードレビューを実行 |
| `/build-fix` | ビルドエラーを修正 |
| `/e2e` | Playwright E2Eテストを生成・実行 |
| `/python-review` | Python コードの包括的レビュー |
| `/verify` | ビルド・テスト・セキュリティの一括検証 |
| `/test-coverage` | テストカバレッジを確認・改善 |
| `/refactor-clean` | デッドコードの削除・リファクタリング |

---

## プロジェクト固有ガイド

### バックエンド (Python / FastAPI)

- `.claude/rules/python/` のルールが自動適用される
- テストは `backend/tests/` に pytest で記述する
- 型ヒントを必ず付ける（PEP 8 準拠）
- 非同期処理は Motor / Beanie の async パターンを使用する

### フロントエンド (TypeScript / React)

- `.claude/rules/typescript/` のルールが自動適用される
- コンポーネントは `frontend/src/components/` に配置する
- 状態管理: UI 状態は Zustand、サーバー状態は TanStack Query を使用する
- テストは Vitest + Testing Library で記述する

---

## 新規環境での追加インストール（任意）

リポジトリにない追加スキルや hooks が必要な場合のみ実行：

```bash
git clone https://github.com/affaan-m/everything-claude-code.git /tmp/everything-claude-code
cd /tmp/everything-claude-code
npm install
./install.sh typescript python
```
