# TeamBoard コードレビュー・改善提案書

> レビュー実施日: 2026-03-21
> 対象: TeamManagementTool (TeamBoard) 全ソースコード

---

## 目次

1. [総合評価](#1-総合評価)
2. [セキュリティに関する問題](#2-セキュリティに関する問題)
3. [バックエンド: コード品質と改善点](#3-バックエンド-コード品質と改善点)
4. [フロントエンド: コード品質と改善点](#4-フロントエンド-コード品質と改善点)
5. [パフォーマンスに関する問題](#5-パフォーマンスに関する問題)
6. [テストに関する改善点](#6-テストに関する改善点)
7. [インフラ・CI/CD に関する改善点](#7-インフラcicd-に関する改善点)
8. [アーキテクチャと設計に関する改善点](#8-アーキテクチャと設計に関する改善点)
9. [改善優先度まとめ](#9-改善優先度まとめ)

---

## 1. 総合評価

### 良い点

- **明確なレイヤー分離**: Router → Service → Model の責務分離が適切に行われている
- **型安全性**: バックエンド(Pydantic)・フロントエンド(TypeScript)ともに型定義が充実している
- **バリデーション**: モデル・スキーマ両方でバリデーションが実装されており、入力の整合性が保たれている
- **テスト設計**: AAA パターン、日本語のテスト名など、可読性の高いテストが書かれている
- **マルチクラウド対応**: AWS / Azure 両方のデプロイ構成が整備されている
- **非同期処理**: Motor + Beanie による async/await パターンが一貫して使用されている
- **Optimistic Update**: タスク並べ替えで楽観的更新が実装されており、UX が良い

### 総合スコア

| カテゴリ | スコア (5段階) | コメント |
|---|---|---|
| セキュリティ | 2.5 / 5 | JWT シークレット・CORS・トークン管理に重大な問題あり |
| コード品質 | 3.5 / 5 | 全体的に良いが、DRY 原則違反・エラーハンドリング不足あり |
| パフォーマンス | 2.5 / 5 | N+1 クエリ問題が複数箇所に存在 |
| テスト | 3.0 / 5 | 基礎は良いが、カバレッジに大きなギャップあり |
| インフラ・CI/CD | 3.5 / 5 | 構成は良いが、CI でのテスト環境に問題あり |
| アーキテクチャ | 3.5 / 5 | 適切な設計だが、スケーラビリティに課題あり |

---

## 2. セキュリティに関する問題

### 2.1 [Critical] JWT シークレットキーのデフォルト値がハードコード

**ファイル**: `backend/app/config.py:7`

```python
JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
```

**問題**: デフォルト値がそのまま本番環境で使用されるリスクがある。環境変数が未設定の場合、推測可能な固定キーでトークンが署名されるため、任意のユーザーになりすますことが可能になる。

**推奨対策**:
- デフォルト値を削除し、環境変数が未設定の場合はアプリケーション起動時にエラーを発生させる
- もしくは起動時にランダム生成し、ログに警告を出す

```python
# 改善例
JWT_SECRET_KEY: str  # デフォルト値なし → 未設定で起動エラー
```

### 2.2 [Critical] シードデータのパスワードがハードコード

**ファイル**: `backend/app/db/seed.py:19, 29`

```python
hashed_password=hash_password("admin1234"),
hashed_password=hash_password("manager1234"),
```

**問題**: 推測容易なパスワード (`admin1234`, `manager1234`) がソースコードにハードコードされている。このシードデータがそのまま本番環境に投入された場合、誰でも管理者アカウントにログインできる。

**推奨対策**:
- シードスクリプトの実行を開発環境に限定する（環境変数による制御）
- 本番環境向けには初回セットアップ CLI を別途用意し、パスワードを対話的に入力させる

### 2.3 [High] CORS 設定が `allow_methods=["*"]`, `allow_headers=["*"]`

**ファイル**: `backend/app/main.py:20-26`

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**問題**: `allow_methods` と `allow_headers` にワイルドカードが指定されており、`allow_credentials=True` と組み合わせるとセキュリティリスクが高まる。実際に使用するメソッド・ヘッダーのみ許可すべきである。

**推奨対策**:
```python
allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
allow_headers=["Authorization", "Content-Type"],
```

### 2.4 [High] JWT トークンを localStorage に保存

**ファイル**: `frontend/src/stores/authStore.ts:30`

```typescript
localStorage.setItem(TOKEN_KEY, token);
```

**問題**: localStorage は XSS 攻撃に対して脆弱。悪意あるスクリプトが `localStorage.getItem()` でトークンを窃取できる。

**推奨対策**:
- HttpOnly + Secure + SameSite 属性付き Cookie にトークンを保存する方式へ変更
- もしくは、短命アクセストークン + HttpOnly Cookie リフレッシュトークンの構成に移行

### 2.5 [High] datetime.utcnow() の使用（Python 3.12+ で非推奨）

**ファイル**: 複数ファイル（`jwt_handler.py:11-12`, `models/user.py:16-17`, `models/member.py:18-19`, `models/project.py:22-23`, 各 service ファイル）

```python
expire = datetime.utcnow() + timedelta(...)
```

**問題**: `datetime.utcnow()` は Python 3.12 で非推奨 (deprecated) となった。タイムゾーン情報を持たない naive datetime を返すため、タイムゾーンに関連するバグを引き起こす可能性がある。

**推奨対策**:
```python
from datetime import datetime, timezone
# datetime.utcnow() → datetime.now(timezone.utc)
expire = datetime.now(timezone.utc) + timedelta(...)
```

### 2.6 [Medium] `get_current_user_by_token` で email ベースのユーザー検索

**ファイル**: `backend/app/services/auth_service.py:46`

```python
user = await User.find_one(User.email == user_id)
```

**問題**: JWT の `sub` クレームには `str(user.id)`（ObjectId）が格納されているが、この関数ではそれを email として検索している。`sub` は ID なので `User.get(user_id)` が正しい。この関数自体が現在未使用ではあるが、将来使用された場合にバグとなる。

### 2.7 [Medium] 広範な例外キャッチ (bare except / `except Exception`)

**ファイル**: `backend/app/routers/projects.py:41`, `backend/app/routers/tasks.py:18`, `backend/app/services/cost_service.py:41`

```python
try:
    member = await Member.get(PydanticObjectId(task.assignee_id))
except Exception:
    member = None
```

**問題**: `except Exception` は想定外のエラー（DB 接続断、メモリ不足など）も黙って握りつぶすため、障害の検知が遅れる。

**推奨対策**:
- 想定されるエラー（`InvalidId`, `DocumentNotFound` など）のみをキャッチする
- 想定外のエラーはログ出力した上で伝播させる

---

## 3. バックエンド: コード品質と改善点

### 3.1 [High] N+1 クエリ問題: `_project_to_response` 内のメンバー取得

**ファイル**: `backend/app/routers/projects.py:33-61`

```python
async def _project_to_response(project) -> ProjectResponse:
    cost_data = await calc_project_cost(project)
    tasks_response = []
    for task in project.tasks:
        member = await Member.get(PydanticObjectId(task.assignee_id))  # タスクごとに DB 問い合わせ
```

**問題**: プロジェクトのタスク数だけ `Member.get()` が呼ばれる。プロジェクト一覧取得 (`GET /api/projects`) では、これがプロジェクト数 x タスク数 回発生する。さらに `calc_project_cost` 内部でも同じメンバーを再取得している。

**推奨対策**:
```python
# 改善例: タスクの assignee_id を事前に一括取得
assignee_ids = list(set(task.assignee_id for task in project.tasks))
members = await Member.find({"_id": {"$in": [PydanticObjectId(id) for id in assignee_ids]}}).to_list()
member_map = {str(m.id): m for m in members}
```

### 3.2 [High] 同じ変換ロジックの重複 (DRY 原則違反)

**ファイル**: `backend/app/routers/projects.py:36-61` と `backend/app/routers/tasks.py:15-38`

`_project_to_response` と `_task_to_response` でタスクのコスト計算・メンバー取得ロジックがほぼ同一のコードで重複している。`cost_service.py` の `calc_project_cost` 内にも同様のロジック（日額計算）がある。

**推奨対策**:
- タスクコスト計算ロジックを `cost_service.py` の `calc_task_cost` に一本化する
- メンバー取得ロジックを共通ユーティリティに抽出する

### 3.3 [High] ダッシュボード API の全プロジェクト・全メンバー取得

**ファイル**: `backend/app/routers/dashboard.py:15-16`

```python
projects = await Project.find_all().to_list()
members = await Member.find_all().to_list()
```

**問題**: データ量が増えた場合にメモリを圧迫し、レスポンスが遅くなる。さらにこの後、各プロジェクトに対して `calc_project_cost` を呼んでおり、N+1 問題が二重に発生している。

**推奨対策**:
- MongoDB の集計パイプライン (`aggregate`) を使用してサーバーサイドで集計する
- もしくは、ダッシュボード用のキャッシュレイヤーを追加する

### 3.4 [Medium] `import` のインライン記述

**ファイル**: `backend/app/routers/projects.py:39`, `backend/app/routers/tasks.py:18`

```python
from beanie import PydanticObjectId  # 関数内部で import
member = await Member.get(PydanticObjectId(task.assignee_id))
```

**問題**: 関数内部でのインライン `import` は循環参照を避けるために使われることがあるが、ここでは技術的に不要。可読性が下がるだけでなく、IDE の静的解析にも悪影響がある。

**推奨対策**: ファイル冒頭でインポートする。

### 3.5 [Medium] `member_service.get_member` の例外ハンドリングの非対称性

**ファイル**: `backend/app/services/member_service.py:54-58` と `backend/app/services/auth_service.py:74-81`

```python
# member_service — 不正 ID で例外が発生した場合ハンドリングなし
async def get_member(member_id: str) -> Member:
    member = await Member.get(PydanticObjectId(member_id))

# auth_service — 不正 ID を try/except でハンドリング
async def get_user(user_id: str) -> User:
    try:
        user = await User.get(PydanticObjectId(user_id))
    except Exception:
```

**問題**: `PydanticObjectId(member_id)` に不正な文字列が渡された場合、`member_service` では未ハンドリングの例外（500 エラー）が発生する。一方 `auth_service` では適切に 404 を返す。

**推奨対策**: `get_member` にも `try/except` を追加して不正な ID に対して 404 を返す。

### 3.6 [Medium] プロジェクト削除時にタスクの担当メンバー参照が残る

**ファイル**: `backend/app/services/project_service.py:60-62`

```python
async def delete_project(project_id: str) -> None:
    project = await get_project(project_id)
    await project.delete()
```

**問題**: プロジェクトは物理削除だが、メンバーの稼働率計算 (`calc_member_monthly_utilization`) は全プロジェクトを走査してタスクを集計する。削除済みプロジェクトのタスクは稼働率に影響しなくなるが、一方でメンバー削除は論理削除（`is_active=False`）であり、削除されたメンバーへの assignee_id 参照はプロジェクト内に残り続ける。

**推奨対策**: プロジェクトも論理削除に統一するか、メンバー削除時に関連タスクの警告を出す。

### 3.7 [Medium] ログ出力の不在

**問題**: アプリケーション全体で `logging` モジュールが一切使用されていない。`print("Seeded ...")` のみ存在する（`seed.py`）。

**推奨対策**:
- Python 標準の `logging` モジュールを導入し、構造化ログを出力する
- エラー発生時のトレース、認証失敗、DB 操作の記録を行う

### 3.8 [Low] `Pydantic Settings` の `class Config` は非推奨

**ファイル**: `backend/app/config.py:14-15`

```python
class Config:
    env_file = ".env"
```

**問題**: Pydantic v2 では内部 `class Config` は非推奨。`model_config` クラス変数を使用すべき。

**推奨対策**:
```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
```

### 3.9 [Low] `registerUser` 関数が `api/auth.ts` と `api/users.ts` で重複定義

**ファイル**: `frontend/src/api/auth.ts:9-14` と `frontend/src/api/users.ts:14-15`

同じ `registerUser` 関数が 2 つのファイルに定義されている。`api/auth.ts` 側は `useAuth` からは使われておらず、`api/users.ts` 側のみが `useUsers` フックから使用されている。

**推奨対策**: `api/auth.ts` から `registerUser` を削除する。

---

## 4. フロントエンド: コード品質と改善点

### 4.1 [High] `ProjectDetailPage` の過剰な useState（10個以上の独立した state）

**ファイル**: `frontend/src/pages/ProjectDetailPage.tsx:24-42`

```typescript
const [showTaskForm, setShowTaskForm] = useState(false);
const [taskTitle, setTaskTitle] = useState("");
const [taskAssignee, setTaskAssignee] = useState("");
const [taskManDays, setTaskManDays] = useState(5);
const [taskStartDate, setTaskStartDate] = useState("");
const [taskEndDate, setTaskEndDate] = useState("");
const [editingTask, setEditingTask] = useState<Task | null>(null);
const [editTitle, setEditTitle] = useState("");
const [editAssignee, setEditAssignee] = useState("");
const [editManDays, setEditManDays] = useState(0);
const [editProgress, setEditProgress] = useState(0);
const [editStatus, setEditStatus] = useState<Task["status"]>("not_started");
const [editStartDate, setEditStartDate] = useState("");
const [editEndDate, setEditEndDate] = useState("");
const [showProjectForm, setShowProjectForm] = useState(false);
```

**問題**: 1つのコンポーネントに 15 個の `useState` が集中しており、可読性・保守性が低い。タスク作成モーダルとタスク編集モーダルのフォーム state は本来それぞれ別コンポーネントに分離すべきである。

**推奨対策**:
- タスク作成フォーム・編集フォームをそれぞれ独立したコンポーネントとして抽出する（`MemberForm` や `ProjectForm` が既にそうなっているので、それに倣う）
- もしくは `useReducer` でフォーム state をまとめて管理する

### 4.2 [High] メンバー稼働率がハードコード (50%)

**ファイル**: `frontend/src/pages/MembersPage.tsx:106`

```tsx
<UtilizationBar rate={50} />
```

**問題**: メンバー一覧の稼働率表示が固定値 `50` にハードコードされている。バックエンドには `/api/members/{id}/utilization` エンドポイントが実装されているにもかかわらず、フロントエンドからは呼び出されていない。

**推奨対策**:
- メンバー一覧取得時に各メンバーの当月稼働率を取得して表示する
- パフォーマンスを考慮し、一覧ではバックエンド側で一括計算して返す API を追加するのが理想

### 4.3 [High] 401 レスポンス時の無限リダイレクトリスク

**ファイル**: `frontend/src/api/client.ts:22-25`

```typescript
if (axios.isAxiosError(error) && error.response?.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = "/login";
}
```

**問題**: `window.location.href = "/login"` による画面遷移は React Router のナビゲーションを経由しないため、アプリ全体が再マウントされる。また `/auth/me` が 401 を返した場合、ログイン後に再度 `/auth/me` が呼ばれ→ 401→ ログアウト→ リダイレクト...という無限ループの可能性がある。

**推奨対策**:
- `window.location.href` ではなく React Router の `navigate` を使用する
- `/auth/me` リクエストは interceptor の 401 ハンドリング対象から除外する

### 4.4 [Medium] ログイン時にダミーユーザーオブジェクトを設定

**ファイル**: `frontend/src/hooks/useAuth.ts:30-34`

```typescript
const tempUser = {
    id: "", email: "", name: "", role: "member" as const,
    is_active: true, created_at: "", updated_at: "",
};
setAuth(response.access_token, tempUser);
```

**問題**: ログイン直後に空のダミーユーザーオブジェクトが store に設定される。この状態で `user.role` を参照するコンポーネントは、一瞬 `"member"` ロールとして動作する。`AdminRoute` コンポーネント等でロール判定が不正確になる可能性がある。

**推奨対策**:
- ログイン API のレスポンスにユーザー情報を含める（バックエンド側の変更が必要）
- もしくは `setAuth` をトークンのみ保存する形にし、ユーザー情報は `/auth/me` の完了を待ってから設定する

### 4.5 [Medium] ダッシュボードの KPI カードがレスポンシブ非対応

**ファイル**: `frontend/src/pages/DashboardPage.tsx:19`

```tsx
<div className="grid grid-cols-4 gap-6">
```

**問題**: `grid-cols-4` が固定されており、モバイル・タブレットで表示が崩れる。

**推奨対策**:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
```

同様の問題が `BudgetSummary.tsx:17` にもある。

### 4.6 [Medium] Header コンポーネントのドロップダウンが外部クリックで閉じない

**ファイル**: `frontend/src/components/layout/Header.tsx:36-58`

```typescript
<button onClick={() => setDropdownOpen(!dropdownOpen)}>
```

**問題**: ドロップダウンメニューは `dropdownOpen` state のトグルで制御されるが、メニュー外をクリックしたときに閉じるロジックがない。ユーザーは再度アバターボタンをクリックしないと閉じられない。

**推奨対策**: `useEffect` + `document.addEventListener("click", ...)` で外部クリック検知を実装する。

### 4.7 [Medium] 検索入力のデバウンス未実装

**ファイル**: `frontend/src/pages/MembersPage.tsx:48-49`, `frontend/src/pages/UsersPage.tsx:84-86`

```tsx
<input
    onChange={(e) => setSearch(e.target.value)}
```

**問題**: 検索文字列の変更が即座に API リクエストをトリガーする。日本語入力中（IME 変換中）にも中間状態でリクエストが発行される可能性がある。

**推奨対策**:
- `useDeferredValue` または自作の `useDebounce` フックでデバウンス処理を追加する（300-500ms 程度）

### 4.8 [Medium] タスク削除に確認ダイアログがない

**ファイル**: `frontend/src/pages/ProjectDetailPage.tsx:203-204`

```tsx
<button onClick={() => deleteMutation.mutate(task.task_id)}>
    削除
</button>
```

**問題**: メンバー削除・ユーザー削除には `ConfirmDialog` が実装されているが、タスク削除は確認なしに即実行される。誤操作で重要なタスクが削除されるリスクがある。

**推奨対策**: 他の削除操作と同様に `ConfirmDialog` を使用する。

### 4.9 [Low] `MemberCreate` 型に `is_active` が含まれる

**ファイル**: `frontend/src/types/member.ts:14`

```typescript
export type MemberCreate = Omit<Member, "id" | "created_at" | "updated_at">;
```

**問題**: `MemberCreate` は `Member` から `id`, `created_at`, `updated_at` のみを除外しているため、`is_active` フィールドが含まれる。新規メンバー作成時に `is_active` を送信する必要はなく、バックエンド側でデフォルト `true` が設定される。

### 4.10 [Low] `TaskCreate` 型で `sort_order` が除外されているが、バックエンドスキーマには含まれている

**ファイル**: `frontend/src/types/task.ts:17`

```typescript
export type TaskCreate = Omit<Task, "task_id" | "sort_order" | "assignee_name" | "cost">;
```

フロントエンドの型では `sort_order` を除外しているが、バックエンドの `TaskCreate` スキーマでは `sort_order: int = Field(default=0, ge=0)` としてオプショナルに受け付けている。整合性は取れているが、フロントエンドから `sort_order` を指定できないことを明示するコメントがあるとよい。

---

## 5. パフォーマンスに関する問題

### 5.1 [High] `calc_member_monthly_utilization` が全プロジェクトを取得

**ファイル**: `backend/app/services/cost_service.py:99`

```python
all_projects = await Project.find_all().to_list()
```

**問題**: メンバー1人の稼働率を計算するためだけに、全プロジェクト（タスク埋め込み含む）をメモリにロードしている。プロジェクト数やタスク数が増えるとメモリ消費とレスポンス時間が線形的に増大する。

**推奨対策**:
- MongoDB のインデックス `tasks.assignee_id` を活用し、該当メンバーのタスクを持つプロジェクトだけを検索する

```python
# 改善例
projects = await Project.find(
    {"tasks.assignee_id": str(member.id)}
).to_list()
```

### 5.2 [High] `count_working_days` のループ計算

**ファイル**: `backend/app/services/cost_service.py:17-26`

```python
def count_working_days(start: date, end: date) -> int:
    count = 0
    current = start
    while current <= end:
        if current.weekday() < 5:
            count += 1
        current += timedelta(days=1)
    return count
```

**問題**: 1日ずつループで数えているため、数年スパンの日付範囲が渡された場合に非効率。稼働率計算で全タスク x 2 回（タスク全期間 + 月間重複期間）呼ばれるため影響が累積する。

**推奨対策**:
```python
# 改善例: numpy.busday_count を使うか、数学的に計算する
import numpy as np
def count_working_days(start: date, end: date) -> int:
    if start > end:
        return 0
    return int(np.busday_count(start, end + timedelta(days=1)))
```

もしくは外部ライブラリに依存したくない場合は、週単位で計算する数学的アプローチで O(1) にできる。

### 5.3 [Medium] プロジェクト一覧 API で全タスクの詳細を返している

**ファイル**: `backend/app/routers/projects.py:86-95`

```python
async def list_projects_endpoint(...):
    projects, total = await list_projects(status_filter, page, per_page)
    items = [await _project_to_response(p) for p in projects]
```

**問題**: プロジェクト一覧では各プロジェクトの全タスク詳細（担当者名・コスト含む）を計算して返している。一覧表示では概要情報だけで十分であり、個別タスクの詳細は不要。

**推奨対策**:
- 一覧用と詳細用でレスポンススキーマを分ける (`ProjectListItem` と `ProjectDetail`)
- 一覧では `tasks` の代わりに `task_count` のみ返す

### 5.4 [Medium] ガントチャートの日付計算で `new Date()` を多用

**ファイル**: `frontend/src/components/gantt/ganttUtils.ts:3-7`, `GanttHeader.tsx`, `GanttChart.tsx`

```typescript
export function diffInDays(dateStr1: string, dateStr2: string): number {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}
```

**問題**: `GanttHeader` では全日付をループで生成し、各日付で `new Date()` のインスタンスを作成している。大規模プロジェクト（半年以上）のタイムラインでは 180+ 個の Date オブジェクトが作られ、再レンダリングのたびに再計算される。

**推奨対策**:
- `useMemo` でタイムラインデータをメモ化する
- 日付文字列の比較だけで済む部分は Date オブジェクトの生成を省略する

### 5.5 [Low] MongoDB クライアントインスタンスの管理

**ファイル**: `backend/app/db/database.py:11`

```python
async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
```

**問題**: `init_db` が呼ばれるたびに新しい `AsyncIOMotorClient` インスタンスが作成される。通常は lifespan で 1 回だけ呼ばれるが、テストで複数回呼ばれた場合に接続プールが乗り替わる。

**推奨対策**: モジュールレベルでクライアントインスタンスを保持し、再利用可能にする。

---

## 6. テストに関する改善点

### 6.1 [High] プロジェクト・タスク API のテストが存在しない

**問題**: 統合テストは `auth`, `members`, `users` の 3 エンドポイントのみカバーしているが、アプリケーションの中核機能である以下のテストが欠如している:

| 欠如しているテスト | 対象エンドポイント |
|---|---|
| プロジェクト CRUD | `GET/POST/PUT/DELETE /api/projects` |
| タスク操作 | `POST/PUT/DELETE /api/projects/{id}/tasks` |
| タスク並べ替え | `PUT /api/projects/{id}/tasks/reorder` |
| コスト計算 | `GET /api/projects/{id}/cost` |
| 予算 vs 実績 | `GET /api/projects/{id}/budget-vs-actual` |
| ダッシュボード | `GET /api/dashboard/summary` |
| メンバー稼働率 | `GET /api/members/{id}/utilization` |

**推奨対策**: 上記エンドポイントの統合テストを追加する。特にコスト計算は金額に関わるため、正確性を担保するテストが重要。

### 6.2 [High] フロントエンドテストがコンポーネント表示のみで操作テストがない

**問題**: フロントエンドの 5 つのテストファイルは全て「コンポーネントが正しくレンダリングされるか」のスナップショット的テストのみ。ユーザー操作（フォーム入力・送信・削除など）のテストがない。

**不足しているテスト例**:
- ログインフォームの送信テスト
- メンバー作成フォームのバリデーションテスト
- プロジェクト一覧のフィルタリングテスト
- タスク作成・編集フォームのテスト
- 認証ガード (`ProtectedRoute`) のリダイレクトテスト

**推奨対策**: `@testing-library/user-event` を活用したユーザー操作テストを追加する。

### 6.3 [Medium] CI で MongoDB が起動していない

**ファイル**: `.github/workflows/ci.yml:34`

```yaml
env:
    MONGODB_URL: mongodb://localhost:27017
```

**問題**: CI の `backend-test` ジョブは `MONGODB_URL` に `localhost:27017` を設定しているが、MongoDB サービスコンテナが定義されていない。現在のテストは `mongomock-motor` を使っているため動作するが、将来的に実 DB に接続するテストを追加した場合に失敗する。

**推奨対策**:
```yaml
services:
    mongodb:
        image: mongo:7
        ports:
            - 27017:27017
```
を追加するか、テスト設計として mongomock のみを使用する方針を明記する。

### 6.4 [Medium] `calc_member_monthly_utilization` のユニットテストがない

**ファイル**: `backend/tests/unit/test_cost_service.py`

**問題**: `cost_service.py` のユニットテストは `count_working_days`, `calc_task_cost`, `calc_budget_vs_actual` をカバーしているが、最も複雑なロジックである `calc_member_monthly_utilization`（月間稼働率計算）のテストがない。

この関数は以下の複雑な計算を含む:
- 月とタスク期間の重複日数の算出
- タスクの日割り工数計算
- 複数プロジェクトをまたぐ集計

**推奨対策**: 以下のケースのテストを追加する:
- 月内に完全に収まるタスク
- 月をまたぐタスク
- 複数タスクが同一メンバーに割り当てられているケース
- 該当月にタスクがないケース

### 6.5 [Low] テスト実行時の pytest asyncio mode 設定

**ファイル**: `backend/pytest.ini` (存在するが内容は未確認)

**問題**: `TestCalcTaskCost` のテストメソッドは `async def` で定義されているが、`@pytest.mark.asyncio` デコレータが付いていない。`pytest-asyncio` の `auto` モードが設定されていれば動作するが、明示的でない。

**推奨対策**: `pytest.ini` に以下を追加して明示する:
```ini
[pytest]
asyncio_mode = auto
```

---

## 7. インフラ・CI/CD に関する改善点

### 7.1 [High] CI パイプラインにリンター・フォーマッター・セキュリティチェックがない

**ファイル**: `.github/workflows/ci.yml`

**問題**: CI ではテスト実行とビルドのみ。以下が不足している:

| 不足項目 | ツール例 |
|---|---|
| Python リンター | `ruff`, `flake8` |
| Python フォーマッター | `ruff format`, `black` |
| Python 型チェック | `mypy` |
| Python セキュリティ | `bandit`, `safety` |
| フロントエンド ESLint | `npm run lint`（定義済みだが CI で未実行）|
| 依存関係の脆弱性チェック | `pip-audit`, `npm audit` |

**推奨対策**: CI ワークフローにこれらのステップを追加する。特に ESLint は `package.json` に `lint` スクリプトが既に定義されているため、CI に追加するだけで済む。

### 7.2 [Medium] デプロイワークフロー間の依存関係がない

**ファイル**: `.github/workflows/backend-deploy.yml`, `frontend-deploy.yml`

**問題**: デプロイワークフローが `ci.yml` のテスト成功を前提条件としていない。テストが失敗しても手動でデプロイを実行できてしまう。

**推奨対策**:
- デプロイワークフローに `ci.yml` の成功を required status check として設定する
- もしくは、デプロイワークフロー内でもテストを実行する

### 7.3 [Medium] 環境ごとの設定管理が不十分

**問題**: `.env` ファイルの管理方針が不明。`.env.example` テンプレートが存在しない。新しい開発者がどの環境変数を設定すべきか把握できない。

**推奨対策**:
- `.env.example` ファイルを作成し、必要な環境変数をリストアップする
- 本番環境向けには AWS Systems Manager Parameter Store / Azure Key Vault の利用を推奨する（Key Vault は Azure ARM テンプレートに既に含まれている）

### 7.4 [Medium] lifespan でのシード実行がない

**ファイル**: `backend/app/main.py:12-15`

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
```

**問題**: `seed.py` は独立したスクリプトとして存在するが、開発環境での起動時に自動実行される仕組みがない。開発者がローカルで起動するたびに手動でシードを実行する必要がある。

**推奨対策**: 環境変数（例: `AUTO_SEED=true`）で開発環境のみシード実行を制御する。

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    if settings.AUTO_SEED:
        from app.db.seed import seed_data
        await seed_data()
    yield
```

### 7.5 [Low] `requirements.txt` にテスト依存関係が混在

**ファイル**: `backend/requirements.txt`

```
# 本番依存関係
fastapi==0.115.6
...
# テスト依存関係（同じファイルに混在）
pytest==8.3.4
pytest-asyncio==0.25.0
mongomock-motor==0.0.36
```

**問題**: 本番用とテスト用の依存関係が同じファイルに含まれており、Lambda / Azure Functions のデプロイパッケージにテストライブラリが含まれてしまう。`requirements-lambda.txt` や `requirements-azure.txt` が別途存在するが、テスト依存関係の分離が明確でない。

**推奨対策**:
- `requirements.txt` (本番用) と `requirements-dev.txt` (テスト・開発用) に分離する

---

## 8. アーキテクチャと設計に関する改善点

### 8.1 [High] タスク埋め込みモデルのスケーラビリティ限界

**ファイル**: `backend/app/models/project.py:21`

```python
tasks: List[Task] = Field(default_factory=list)
```

**問題**: タスクを Project ドキュメントに埋め込み配列として保持している。MongoDB のドキュメントサイズ上限は 16MB であり、1プロジェクトのタスク数が数百件を超えると問題が発生する可能性がある。

また、タスク更新のたびにプロジェクトドキュメント全体を保存 (`project.save()`) しているため、同時編集時のコンフリクトリスクがある。

**トレードオフ**:
- 現在の設計: タスク取得が高速（1回のクエリ）、原子的な操作が容易
- 分離設計: スケーラビリティが高い、個別タスクの更新が効率的

**推奨対策**:
- 短期: 現状維持で問題ないが、タスク数に上限（例: 100件）を設ける
- 長期: タスクを別コレクションに分離し、`project_id` で参照する構造に移行

### 8.2 [Medium] API レスポンスにエラーコードの体系がない

**問題**: エラーレスポンスは HTTPException の `detail` に文字列を渡しているだけで、構造化されたエラーコードがない。

```python
raise HTTPException(status_code=409, detail="Email already registered")
```

フロントエンドではエラーメッセージを単に `"メールアドレスまたはパスワードが正しくありません"` と置き換えているため、サーバー側のエラー情報が活用されていない。

**推奨対策**:
```python
# 改善例: 構造化エラーレスポンス
raise HTTPException(
    status_code=409,
    detail={"code": "EMAIL_DUPLICATE", "message": "Email already registered"}
)
```

### 8.3 [Medium] リフレッシュトークンの仕組みがない

**問題**: JWT アクセストークンの有効期限が 480 分（8 時間）と長めに設定されており、リフレッシュトークンの仕組みがない。トークンが漏洩した場合、8時間はそのトークンを無効化できない。

**推奨対策**:
- アクセストークンの有効期限を 15-30 分に短縮
- リフレッシュトークン（長寿命）をHttpOnly Cookie で管理
- トークンリフレッシュエンドポイント (`POST /api/auth/refresh`) を追加

### 8.4 [Medium] API バージョニングの不在

**問題**: API パスが `/api/members` のようにバージョン番号を含んでいない。将来的に破壊的変更が必要になった場合、既存クライアントとの互換性維持が困難。

**推奨対策**: `/api/v1/members` のようにバージョンプレフィックスを導入する。

### 8.5 [Low] レート制限の不在

**問題**: ログインエンドポイント (`POST /api/auth/login`) にレート制限がない。ブルートフォース攻撃やクレデンシャルスタッフィング攻撃に対して脆弱。

**推奨対策**:
- `slowapi` ライブラリなどでレート制限を実装する
- ログインエンドポイントには特に厳しい制限（例: 5回/分）を設ける
- AWS API Gateway / Azure API Management のレート制限機能を活用する

### 8.6 [Low] ヘルスチェックエンドポイントが DB 接続を確認していない

**ファイル**: `backend/app/main.py:36-37`

```python
@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

**問題**: ヘルスチェックは常に `{"status": "ok"}` を返す。データベースに接続できない状態でも「正常」と報告される。

**推奨対策**:
```python
@app.get("/api/health")
async def health():
    try:
        await Member.find_one()  # DB 疎通確認
        return {"status": "ok", "db": "connected"}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "error", "db": "disconnected"}
        )
```

---

## 9. 改善優先度まとめ

全指摘事項を優先度別に整理する。

### Critical（即座に対応すべき）

| # | 項目 | セクション |
|---|---|---|
| 1 | JWT シークレットキーのデフォルト値 | 2.1 |
| 2 | シードデータの弱いパスワード | 2.2 |

### High（早期に対応すべき）

| # | 項目 | セクション |
|---|---|---|
| 3 | CORS ワイルドカード設定 | 2.3 |
| 4 | localStorage への JWT 保存 | 2.4 |
| 5 | `datetime.utcnow()` の非推奨 API 使用 | 2.5 |
| 6 | N+1 クエリ問題（プロジェクト一覧） | 3.1 |
| 7 | コスト計算ロジックの重複 | 3.2 |
| 8 | ダッシュボード API の全データ取得 | 3.3 |
| 9 | `ProjectDetailPage` の過剰な useState | 4.1 |
| 10 | メンバー稼働率のハードコード | 4.2 |
| 11 | 401 レスポンスの無限リダイレクトリスク | 4.3 |
| 12 | 全プロジェクト取得による稼働率計算 | 5.1 |
| 13 | `count_working_days` のループ計算 | 5.2 |
| 14 | プロジェクト・タスク API のテスト欠如 | 6.1 |
| 15 | フロントエンドの操作テスト欠如 | 6.2 |
| 16 | CI にリンター・セキュリティチェックがない | 7.1 |
| 17 | タスク埋め込みモデルの限界 | 8.1 |

### Medium（計画的に対応すべき）

| # | 項目 | セクション |
|---|---|---|
| 18 | `get_current_user_by_token` のバグ | 2.6 |
| 19 | 広範な例外キャッチ | 2.7 |
| 20 | インライン import | 3.4 |
| 21 | `get_member` の例外ハンドリング非対称 | 3.5 |
| 22 | プロジェクト削除と参照整合性 | 3.6 |
| 23 | ログ出力の不在 | 3.7 |
| 24 | ダミーユーザーオブジェクト | 4.4 |
| 25 | レスポンシブ非対応の KPI カード | 4.5 |
| 26 | Header ドロップダウンの外部クリック | 4.6 |
| 27 | 検索のデバウンス未実装 | 4.7 |
| 28 | タスク削除の確認ダイアログ欠如 | 4.8 |
| 29 | 一覧 API のレスポンスが過剰 | 5.3 |
| 30 | ガントチャートのメモ化不足 | 5.4 |
| 31 | CI での MongoDB サービス未定義 | 6.3 |
| 32 | 稼働率計算のテスト不足 | 6.4 |
| 33 | デプロイの CI 依存関係 | 7.2 |
| 34 | `.env.example` の不在 | 7.3 |
| 35 | 開発環境のシード自動実行 | 7.4 |
| 36 | エラーレスポンスの体系化 | 8.2 |
| 37 | リフレッシュトークンの不在 | 8.3 |
| 38 | API バージョニング | 8.4 |

### Low（余裕があれば対応）

| # | 項目 | セクション |
|---|---|---|
| 39 | Pydantic `class Config` 非推奨 | 3.8 |
| 40 | `registerUser` 関数の重複 | 3.9 |
| 41 | `MemberCreate` 型の余分なフィールド | 4.9 |
| 42 | `TaskCreate` 型の整合性コメント | 4.10 |
| 43 | MongoDB クライアントの管理 | 5.5 |
| 44 | pytest asyncio mode の明示 | 6.5 |
| 45 | `requirements.txt` の分離 | 7.5 |
| 46 | レート制限 | 8.5 |
| 47 | ヘルスチェックの DB 確認 | 8.6 |

---

> **備考**: 本レビューは 2026-03-21 時点のコードベースに基づいています。ライブラリのバージョンアップやプロジェクトの成長に伴い、優先度は変動する可能性があります。
